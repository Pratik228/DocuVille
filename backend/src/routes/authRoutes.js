const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middlewares/rateLimiter");
const authController = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

router.post("/register", authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/logout", authController.logout);

router.patch("/make-admin", auth, async (req, res) => {
  try {
    const { userId } = req.body;

    // Only super admin can make others admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User is now an admin",
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
