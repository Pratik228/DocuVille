const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    console.log("Received token:", token); // Debug log

    if (!token) {
      return res.status(401).json({ error: "Please log in to continue" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "Please log in to continue" });
      }

      // Debug logging
      console.log("Auth User:", {
        id: user._id,
        isAdmin: user.isAdmin,
        email: user.email,
      });

      req.user = {
        id: user._id,
        isAdmin: user.isAdmin,
        email: user.email,
      };

      next();
    } catch (jwtError) {
      console.error("JWT Verification failed:", jwtError);
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again" });
    }
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Please log in to continue" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: "Not authorized" });
  }
};

module.exports = { auth, isAdmin };
