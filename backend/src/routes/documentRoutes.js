const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const documentController = require("../controllers/documentController");
const auth = require("../middlewares/auth");
const { uploadLimiter } = require("../middlewares/rateLimiter");

router.use(auth);

router.post(
  "/upload",
  uploadLimiter,
  upload.single("document"),
  documentController.uploadDocument
);

router.get("/", documentController.getDocuments);
router.post("/:id/view", documentController.requestDocumentView);
router.get("/view", documentController.getDocumentWithToken);
router.delete("/:id", documentController.deleteDocument);

module.exports = router;
