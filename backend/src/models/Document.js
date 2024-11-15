const mongoose = require("mongoose");
const encryption = require("../utils/encryption");

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
      set: function (number) {
        if (!number) return number;
        // Check if `number` is already encrypted to avoid double encryption
        if (!number.includes(":")) {
          // Assuming ":" is only present in encrypted values
          return encryption.encrypt(number);
        }
        return number;
      },
    },

    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "महिला", "पुरुष"],
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
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
      max: 5,
    },
    lastViewedAt: Date,
  },
  { timestamps: true }
);

documentSchema.virtual("maskedDocumentNumber").get(function () {
  if (!this.documentNumber) return "";
  return encryption.mask(encryption.decrypt(this.documentNumber));
});
documentSchema.methods.getDecryptedDocumentNumber = function () {
  return encryption.decrypt(this.documentNumber);
};
documentSchema.pre("save", function (next) {
  if (this.documentNumber) {
    this.documentNumber = this.documentNumber.replace(/\s+/g, "");
    // Prevent double encryption by ensuring it's encrypted only once
    if (!this.documentNumber.includes(":")) {
      this.documentNumber = encryption.encrypt(this.documentNumber);
    }
  }

  if (this.gender) {
    const genderMap = {
      पुरुष: "MALE",
      महिला: "FEMALE",
    };
    this.gender = genderMap[this.gender] || this.gender.toUpperCase();
  }

  next();
});

module.exports = mongoose.model("Document", documentSchema);
