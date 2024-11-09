const tesseract = require("tesseract.js");
const sharp = require("sharp");

const extractData = async (imagePath) => {
  try {
    const processedImage = await sharp(imagePath)
      .resize(1800, null)
      .sharpen({ sigma: 1 })
      .normalize()
      .toBuffer();

    const result = await tesseract.recognize(processedImage, "eng", {
      logger: (m) => console.log(m),
    });

    const text = result.data.text;
    console.log("Extracted text:", text);

    // Generic patterns for Aadhar
    const patterns = {
      documentNumber: /(\d{4}\s?\d{4}\s?\d{4})/,
      vid: /VID\s*:\s*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/,
      name: [
        // Match any three-word name
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/,
        // Name before DOB
        /([A-Za-z\s]+?)(?=\s*(?:जन्म|DOB))/i,
        // Name between start of line and colon
        /^([A-Za-z\s]+?)(?=:)/m,
        // Any capitalized words together
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
      ],
      dateOfBirth: [
        /(?:जन्म तिथि|DOB)[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
        /(\d{2}\/\d{2}\/\d{4})/,
      ],
      gender: /(?:MALE|FEMALE|पुरुष|महिला)/i,
    };

    const extracted = {};
    const tryPatterns = (patterns, text) => {
      if (!Array.isArray(patterns)) patterns = [patterns];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[1] && match[1].split(" ").length >= 2) {
            return match[1].trim();
          }
          return (match[1] || match[0]).trim();
        }
      }
      return null;
    };
    for (const [key, regex] of Object.entries(patterns)) {
      const value = tryPatterns(regex, text);
      if (value) {
        extracted[key] = value.trim();
        console.log(`${key} match:`, value.trim());
      }
    }
    if (!extracted.name) {
      const nameLines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(line));

      if (nameLines.length > 0) {
        extracted.name = nameLines.reduce((a, b) =>
          a.length > b.length ? a : b
        );
      }
    }

    if (extracted.name) {
      extracted.name = extracted.name
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // Proper capitalization
      extracted.name = extracted.name
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }

    console.log("Final extracted data:", extracted);

    return {
      documentType: "aadharId",
      data: extracted,
    };
  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error(
      `Failed to extract data from Aadhar card: ${error.message}`
    );
  }
};

module.exports = extractData;
