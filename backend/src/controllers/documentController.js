const Document = require("../models/Document");
const extractData = require("../utils/extractData");
const { validateDocument } = require("../utils/validation");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises; // For file cleanup

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { data: extractedData } = await extractData(req.file.path);
    const validationResult = validateDocument(extractedData);

    if (!validationResult.isValid) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        error: "Document validation failed",
        details: validationResult.errors,
      });
    }
    let dateOfBirth = null;
    if (extractedData.dateOfBirth) {
      const [day, month, year] = extractedData.dateOfBirth.split("/");
      dateOfBirth = new Date(year, month - 1, day);
      if (isNaN(dateOfBirth.getTime())) {
        throw new Error("Invalid date of birth format");
      }
    }

    const document = new Document({
      userId: req.user.id,
      documentType: "aadharId",
      name: extractedData.name,
      documentNumber: extractedData.documentNumber,
      dateOfBirth: dateOfBirth,
      gender: extractedData.gender?.toUpperCase(),
      vid: extractedData.vid,
      documentImage: req.file.path,
      extractedData: extractedData,
      metadata: {
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: "Aadhar card uploaded and processed successfully",
      document: {
        id: document._id,
        name: extractedData.name,
        documentNumber: `XXXX${extractedData.documentNumber.slice(-4)}`,
        dateOfBirth: extractedData.dateOfBirth,
        gender: extractedData.gender,
        verificationStatus: document.verificationStatus,
      },
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    console.error("Upload error:", error);
    res.status(500).json({
      error: "Document upload failed",
      message: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .select("-documentImage -extractedData")
      .sort("-createdAt");

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch documents",
      message: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .select("-documentImage -extractedData")
      .sort("-createdAt");

    res.json({
      success: true,
      count: documents.length,
      data: documents.map((doc) => ({
        ...doc.toObject(),
        documentNumber: `XXXX${doc.documentNumber.slice(-4)}`,
      })),
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
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (document.documentImage) {
      await fs.unlink(document.documentImage).catch(console.error);
    }
    await document.deleteOne();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete document",
      message: error.message,
    });
  }
};

exports.requestDocumentView = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (document.viewCount >= 3) {
      return res.status(403).json({
        error: "View limit exceeded",
        message:
          "You have reached the maximum number of views for this document",
      });
    }

    const viewToken = jwt.sign(
      {
        documentId: document._id,
        exp: Math.floor(Date.now() / 1000) + 30,
      },
      process.env.JWT_SECRET
    );

    document.viewCount += 1;
    document.viewHistory.push({ viewedAt: new Date() });
    document.lastViewedAt = new Date();
    await document.save();

    res.json({
      success: true,
      viewToken,
      expiresIn: 30,
      viewsRemaining: 3 - document.viewCount,
    });
  } catch (error) {
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

    // Verify token
    const decoded = jwt.verify(viewToken, process.env.JWT_SECRET);

    const document = await Document.findOne({
      _id: decoded.documentId,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Return unmasked document data
    res.json({
      success: true,
      data: {
        ...document.toObject(),
        documentImage: document.documentImage,
        extractedData: document.extractedData,
        documentNumber: document.documentNumber,
        viewsRemaining: 3 - document.viewCount,
      },
    });
  } catch (error) {
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
