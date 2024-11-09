const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middlewares/rateLimiter");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/logout", authController.logout);

module.exports = router;
