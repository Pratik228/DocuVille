const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

const encryption = {
  encrypt: (text) => {
    if (!text) return text;
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY),
        iv
      );
      let encrypted = cipher.update(text.toString());
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    } catch (error) {
      console.error("Encryption error:", error);
      return text;
    }
  },

  decrypt: (text) => {
    if (!text || !text.includes(":")) return text;
    try {
      const [ivHex, encryptedHex] = text.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const encryptedText = Buffer.from(encryptedHex, "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY),
        iv
      );
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      console.error("Decryption error:", error);
      return text;
    }
  },

  mask: (number) => {
    if (!number) return "XXXX-XXXX";
    return `XXXX${number.slice(-4)}`;
  },
};

module.exports = encryption;
