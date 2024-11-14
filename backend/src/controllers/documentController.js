const Document = require("../models/Document");
const extractData = require("../utils/extractData");
const { validateDocument } = require("../utils/validation");
const encryption = require("../utils/encryption");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../utils/cloudinary");

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Starting document upload process");

    let extractedData = {};
    try {
      const result = await extractData(req.file.path);
      console.log("Extraction result:", result);
      extractedData = result.data || {};
      console.log("Extracted data:", extractedData);
    } catch (extractError) {
      console.error("Data extraction error:", extractError);
    }

    // Validate extractedData
    if (Object.keys(extractedData).length > 0) {
      console.log("Creating document with extracted data:", extractedData);
    }

    const document = new Document({
      userId: req.user.id,
      documentType: "aadharId",
      name: extractedData.name || "Unknown",
      documentNumber: extractedData.documentNumber || "UNKNOWN-DOC",
      dateOfBirth: extractedData.dateOfBirth || extractedData.yearOfBirth,
      gender: extractedData.gender,
      documentImage: req.file.path,
      extractedData: extractedData,
      metadata: {
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        cloudinaryPublicId: req.file.filename,
      },
    });

    console.log("Document before save:", {
      name: document.name,
      documentNumber: document.documentNumber,
      dateOfBirth: document.dateOfBirth,
      gender: document.gender,
    });

    await document.save();

    // Get decrypted number for proper masking
    const decryptedNumber = encryption.decrypt(document.documentNumber);

    const response = {
      success: true,
      message: "Document uploaded and processed successfully",
      document: {
        id: document._id,
        name: document.name,
        documentNumber: `XXXX-XXXX-${decryptedNumber.slice(-4)}`,
        dateOfBirth: document.dateOfBirth,
        gender: document.gender,
        verificationStatus: document.verificationStatus,
      },
    };

    console.log("Sending response:", response);
    res.status(201).json(response);
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
    if (req.user.isAdmin) {
      documents = await Document.find()
        .select("-documentImage -extractedData")
        .sort("-createdAt");
    } else {
      documents = await Document.find({ userId: req.user.id })
        .select("-documentImage -extractedData")
        .sort("-createdAt");
    }
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
    const query = req.user.isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user.id };

    const document = await Document.findOne(query);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Handle Cloudinary deletion
    if (document.documentImage) {
      try {
        const urlParts = document.documentImage.split("/");
        const filename = urlParts[urlParts.length - 1];
        const publicId = `docverify/${filename.split(".")[0]}`;
        const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", {
          error: cloudinaryError,
          documentImage: document.documentImage,
        });
      }
    }

    await document.deleteOne();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      error: "Failed to delete document",
      message: error.message,
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
      document = await Document.findById(decoded.documentId);
    } else {
      document = await Document.findOne({
        _id: decoded.documentId,
        userId: req.user.id,
      });
    }

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get raw decrypted number
    const decryptedNumber = encryption.decrypt(document.documentNumber);
    console.log("Decrypted number:", decryptedNumber); // Debug log

    const response = {
      success: true,
      data: {
        ...document.toObject(),
        documentImage: document.documentImage,
        extractedData: document.extractedData,
        documentNumber: decryptedNumber, // Send the full number
        dateOfBirth: document.dateOfBirth,
        viewsRemaining: decoded.isAdmin ? "unlimited" : 3 - document.viewCount,
      },
    };

    console.log("Sending response:", response); // Debug log
    res.json(response);
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

    res.json(response);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Verification failed",
      message: error.message,
    });
  }
};
