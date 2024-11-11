const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const documentController = require("../controllers/documentController");
const { auth, isAdmin } = require("../middlewares/auth");
const Document = require("../models/Document");

router.use(auth);

router.post(
  "/upload",
  upload.single("document"),
  documentController.uploadDocument
);

router.get("/", documentController.getDocuments);
router.post("/:id/view", documentController.requestDocumentView);
router.get("/view", documentController.getDocumentWithToken);
router.delete("/:id", documentController.deleteDocument);

router.patch("/:id/verify", [auth, isAdmin], async (req, res) => {
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

    res.json({
      success: true,
      message: `Document marked as ${status}`,
      document: document.toObject(),
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Verification failed",
      message: error.message,
    });
  }
});

module.exports = router;
