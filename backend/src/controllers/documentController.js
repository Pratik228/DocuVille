const Document = require("../models/Document");
const extractData = require("../utils/extractData");
const { validateDocument } = require("../utils/validation");
const encryption = require("../utils/encryption");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../utils/cloudinary");
const mongoose = require("mongoose");

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File info:", req.file); // Add this for debugging

    // Handle case where extractData might fail
    let extractedData = {};
    try {
      const result = await extractData(req.file.path);
      extractedData = result.data || {};
    } catch (extractError) {
      console.error("Data extraction error:", extractError);
      // Continue with empty data if extraction fails
    }

    const document = new Document({
      userId: req.user.id,
      documentType: "aadharId",
      name: extractedData.name || "Unknown",
      documentNumber: extractedData.documentNumber || "UNKNOWN-DOC",
      dateOfBirth: extractedData.dateOfBirth || extractedData.yearOfBirth,
      gender: extractedData.gender,
      documentImage: req.file.path, // Cloudinary URL
      extractedData: extractedData,
      metadata: {
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        cloudinaryPublicId: req.file.filename,
      },
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded and processed successfully",
      document: {
        id: document._id,
        name: document.name,
        documentNumber: document.documentNumber
          ? `XXXX${document.documentNumber.slice(-4)}`
          : "XXXX-XXXX",
        dateOfBirth: document.dateOfBirth,
        gender: document.gender,
        verificationStatus: document.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Document upload failed",
      message: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    let documents;

    // If user is admin, get all documents
    if (req.user.isAdmin) {
      documents = await Document.find()
        .select("-documentImage -extractedData")
        .sort("-createdAt");
    } else {
      // If regular user, get only their documents
      documents = await Document.find({ userId: req.user.id })
        .select("-documentImage -extractedData")
        .sort("-createdAt");
    }

    // Decrypt and mask document numbers
    const processedDocuments = documents.map((doc) => {
      const decrypted = encryption.decrypt(doc.documentNumber);
      return {
        ...doc.toObject(),
        documentNumber: encryption.mask(decrypted),
      };
    });

    res.json({
      success: true,
      count: documents.length,
      data: processedDocuments,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch documents",
      message: error.message,
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    console.log("Delete request received:", {
      id: req.params.id,
      userId: req.user?.id,
      headers: req.headers,
      url: req.originalUrl,
    });

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid MongoDB ID format");
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    console.log("Document search result:", {
      found: !!document,
      documentId: document?._id,
      userId: document?.userId,
      imageUrl: document?.documentImage,
    });

    if (!document) {
      return res.status(404).json({
        error: "Document not found",
        details: "No document found matching the provided ID and user",
      });
    }

    // Handle Cloudinary deletion
    if (document.documentImage) {
      try {
        const urlParts = document.documentImage.split("/");
        const filename = urlParts[urlParts.length - 1];
        const publicId = `docverify/${filename.split(".")[0]}`;

        console.log("Cloudinary deletion attempt:", {
          originalUrl: document.documentImage,
          publicId: publicId,
        });

        const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary deletion result:", cloudinaryResult);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", {
          error: cloudinaryError,
          documentImage: document.documentImage,
          stack: cloudinaryError.stack,
        });
      }
    }

    // Delete from MongoDB
    const deleteResult = await document.deleteOne();
    console.log("MongoDB deletion result:", deleteResult);

    res.json({
      success: true,
      message: "Document deleted successfully",
      details: {
        documentId: document._id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Delete operation error:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });

    res.status(500).json({
      error: "Failed to delete document",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.requestDocumentView = async (req, res) => {
  try {
    let document;

    // If admin, allow viewing any document
    if (req.user.isAdmin) {
      document = await Document.findById(req.params.id);
    } else {
      // For regular users, only their own documents
      document = await Document.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });
    }

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!req.user.isAdmin && document.viewCount >= 3) {
      return res.status(403).json({
        error: "View limit exceeded",
        message:
          "You have reached the maximum number of views for this document",
      });
    }

    const viewToken = jwt.sign(
      {
        documentId: document._id,
        isAdmin: req.user.isAdmin,
        exp: Math.floor(Date.now() / 1000) + 30,
      },
      process.env.JWT_SECRET
    );

    // Only increment view count for non-admin users
    if (!req.user.isAdmin) {
      document.viewCount += 1;
      document.viewHistory.push({ viewedAt: new Date() });
      document.lastViewedAt = new Date();
      await document.save();
    }

    res.json({
      success: true,
      viewToken,
      expiresIn: 30,
      viewsRemaining: req.user.isAdmin ? "unlimited" : 3 - document.viewCount,
    });
  } catch (error) {
    console.error("View request error:", error);
    res.status(500).json({
      error: "Failed to request document view",
      message: error.message,
    });
  }
};

exports.getDocumentWithToken = async (req, res) => {
  try {
    const { viewToken } = req.query;

    if (!viewToken) {
      return res.status(400).json({ error: "View token is required" });
    }

    const decoded = jwt.verify(viewToken, process.env.JWT_SECRET);

    let document;
    if (decoded.isAdmin) {
      // Admin can view any document
      document = await Document.findById(decoded.documentId);
    } else {
      // Regular users can only view their documents
      document = await Document.findOne({
        _id: decoded.documentId,
        userId: req.user.id,
      });
    }

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Decrypt document number for viewing
    const decryptedDocNumber = encryption.decrypt(document.documentNumber);

    res.json({
      success: true,
      data: {
        ...document.toObject(),
        documentImage: document.documentImage,
        extractedData: document.extractedData,
        documentNumber: decryptedDocNumber,
        dateOfBirth: document.dateOfBirth,
        viewsRemaining: decoded.isAdmin ? "unlimited" : 3 - document.viewCount,
      },
    });
  } catch (error) {
    console.error("View error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "View session expired",
        message: "Please request a new view session",
      });
    }
    res.status(500).json({
      error: "Failed to get document data",
      message: error.message,
    });
  }
};

exports.verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log("Verify Request:", {
      id,
      status,
      notes,
      user: req.user,
      headers: req.headers,
    });

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    document.verificationStatus = status;
    document.adminNotes = notes || "";
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();

    await document.save();

    // Decrypt document number for response
    const decryptedDocNumber = encryption.decrypt(document.documentNumber);

    const response = {
      success: true,
      message: `Document marked as ${status}`,
      document: {
        ...document.toObject(),
        documentNumber: encryption.mask(decryptedDocNumber),
      },
    };

    console.log("Verify Response:", response);

    res.json(response);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Verification failed",
      message: error.message,
    });
  }
};
