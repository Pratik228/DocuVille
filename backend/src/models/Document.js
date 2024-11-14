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
        return encryption.encrypt(number);
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
