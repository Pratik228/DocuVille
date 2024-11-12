const tesseract = require("tesseract.js");
const sharp = require("sharp");

const extractData = async (imagePath) => {
  try {
    const processedImage = await sharp(imagePath)
      .resize(1800, null)
      .sharpen({ sigma: 1 })
      .normalize()
      .toBuffer();

    const result = await tesseract.recognize(processedImage, "eng+hin", {
      logger: (m) => console.log(m),
    });

    const text = result.data.text;
    console.log("Extracted text:", text);

    // Enhanced patterns for Aadhar
    const patterns = {
      documentNumber: /(\d{4}\s?\d{4}\s?\d{4})/,
      vid: /VID\s*:\s*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/,
      name: [
        // Match names in both English and Hindi
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/,
        /नाम\s*\/\s*Name\s*:\s*([A-Za-z\s]+)/i,
        /([A-Za-z\s]+?)(?=\s*(?:जन्म|DOB|Year of Birth))/i,
        /^([A-Za-z\s]+?)(?=:)/m,
      ],
      dateOfBirth: [
        // Full date patterns
        /(?:जन्म तिथि|DOB)[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
        /(\d{2}\/\d{2}\/\d{4})/,
        // Year only patterns
        /(?:Year of Birth|जन्म वर्ष)[:\s]*(\d{4})/i,
        /[:\s](\d{4})(?=\s*(?:महिला|FEMALE|पुरुष|MALE))/,
      ],
      yearOfBirth: [
        /(?:Year of Birth|जन्म वर्ष)[:\s]*(\d{4})/i,
        /[:\s](\d{4})(?=\s*(?:महिला|FEMALE|पुरुष|MALE))/,
      ],
      gender: [
        /(?:MALE|FEMALE|पुरुष|महिला)/i,
        /(?:लिंग|Gender)[:\s]*(MALE|FEMALE|पुरुष|महिला)/i,
      ],
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

    // Extract all fields
    for (const [key, regex] of Object.entries(patterns)) {
      const value = tryPatterns(regex, text);
      if (value) {
        extracted[key] = value.trim();
        console.log(`${key} match:`, value.trim());
      }
    }

    // Handle year-only birth dates
    if (!extracted.dateOfBirth && extracted.yearOfBirth) {
      extracted.dateOfBirth = extracted.yearOfBirth;
    }

    // Normalize gender
    if (extracted.gender) {
      const genderMap = {
        पुरुष: "MALE",
        महिला: "FEMALE",
        male: "MALE",
        female: "FEMALE",
      };
      extracted.gender =
        genderMap[extracted.gender.toLowerCase()] ||
        extracted.gender.toUpperCase();
    }

    // Clean up name
    if (extracted.name) {
      extracted.name = extracted.name
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
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
    throw new Error(`Failed to extract data: ${error.message}`);
  }
};

module.exports = extractData;
