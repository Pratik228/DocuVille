const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ["aadharId"],
    },
    documentNumber: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      set: (v) => {
        // Handle DD/MM/YYYY format
        if (typeof v === "string") {
          const [day, month, year] = v.split("/");
          return new Date(year, month - 1, day);
        }
        return v;
      },
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },
    documentImage: {
      type: String,
      required: true,
    },
    extractedData: {
      type: Object,
      default: {},
    },
    metadata: {
      originalFileName: String,
      fileSize: Number,
      mimeType: String,
    },
    viewHistory: [
      {
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
