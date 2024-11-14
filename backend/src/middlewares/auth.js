const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    console.log("Auth middleware triggered:", {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.header("Authorization"),
      hasCookie: !!req.cookies.token,
    });
    const token =
      req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    console.log("Token extraction attempt:", {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      source: req.cookies.token ? "cookie" : "header",
    });

    if (!token) {
      console.log("No token found in request");
      return res.status(401).json({ error: "Please log in to continue" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", {
        userId: decoded.id,
        path: req.path,
      });

      const user = await User.findById(decoded.id);

      console.log("User lookup result:", {
        found: !!user,
        isAdmin: user?.isAdmin,
        requestPath: req.path,
        requestMethod: req.method,
      });

      if (!user) {
        console.log("No user found for decoded token ID");
        return res.status(401).json({ error: "Please log in to continue" });
      }

      req.user = {
        id: user._id,
        isAdmin: user.isAdmin,
        email: user.email,
      };

      console.log("Authentication successful:", {
        userId: req.user.id,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (jwtError) {
      console.error("JWT Verification failed:", {
        error: jwtError.message,
        path: req.path,
        method: req.method,
      });
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again" });
    }
  } catch (error) {
    console.error("Auth middleware error:", {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    res.status(401).json({ error: "Please log in to continue" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    console.log("Admin check:", {
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin,
      path: req.path,
    });

    if (!req.user.isAdmin) {
      console.log("Non-admin access attempt");
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin middleware error:", {
      error: error.message,
      path: req.path,
    });
    res.status(401).json({ error: "Not authorized" });
  }
};

module.exports = { auth, isAdmin };
