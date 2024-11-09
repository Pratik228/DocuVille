const rateLimit = require("express-rate-limit");
const Document = require("../models/Document");

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: async (req) => {
    const userId = req.user.id;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const uploadCount = await Document.countDocuments({
      userId,
      createdAt: { $gte: oneHourAgo },
    });

    return uploadCount < 5;
  },
  message: "Upload limit exceeded. Try again in an hour.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts, please try again after 15 minutes",
});

module.exports = { uploadLimiter, authLimiter };
