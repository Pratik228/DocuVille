const express = require("express");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");

const app = express();
app.use(cookieParser());

connectDB();

const corsOptions = {
  origin: ["https://docu-verify.vercel.app", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight

// Log CORS settings
console.log("CORS Settings:", {
  origin: corsOptions.origin,
  credentials: corsOptions.credentials,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath =
  process.env.NODE_ENV === "production"
    ? "/opt/render/project/src/uploads"
    : path.join(__dirname, "../uploads");

app.use("/uploads", express.static(uploadsPath));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
  console.log("CORS Origin:", corsOptions.origin);
  console.log("Uploads Path:", uploadsPath);
});
