const express = require("express");
const router = express.Router();
const { upload } = require("../utils/cloudinary");
const documentController = require("../controllers/documentController");
const { auth, isAdmin } = require("../middlewares/auth");

router.use(auth);

router.options("/:id", (req, res) => {
  res.header("Access-Control-Allow-Methods", "DELETE");
  res.status(204).send();
});

router.post(
  "/upload",
  upload.single("document"),
  documentController.uploadDocument
);

router.get("/", documentController.getDocuments);
router.post("/:id/view", documentController.requestDocumentView);
router.get("/view", documentController.getDocumentWithToken);
router.delete("/:id", documentController.deleteDocument);
router.patch("/:id/verify", isAdmin, documentController.verifyDocument);

module.exports = router;
