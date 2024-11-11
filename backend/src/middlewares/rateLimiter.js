const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 10,
  message: "Too many attempts, please try again after 15 minutes",
});

module.exports = { authLimiter };
