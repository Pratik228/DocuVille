const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "docverify",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and PDF allowed"), false);
  }
};

const cloudinaryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).single("document");

const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      cloudinaryUpload(req, res, (err) => {
        if (err) {
          console.error("Cloudinary upload error:", err);
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "File too large",
              message: "Maximum file size is 5MB",
            });
          }
          return res.status(400).json({
            error: "Upload failed",
            message: err.message,
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: "Upload failed",
            message: "No file received",
          });
        }

        next();
      });
    };
  },
};

module.exports = { upload, cloudinary };
