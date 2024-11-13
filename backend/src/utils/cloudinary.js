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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Wrap multer middleware to handle errors
const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      cloudinaryUpload.single(fieldName)(req, res, (err) => {
        if (err) {
          console.error("Upload error:", err);
          return res.status(400).json({
            error: "Upload failed",
            message: err.message,
          });
        }
        next();
      });
    };
  },
};

module.exports = { upload, cloudinary };
