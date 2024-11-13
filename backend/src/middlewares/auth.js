const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Please log in to continue" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Please log in to continue" });
    }

    // Add debug logging
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
