const tesseract = require("tesseract.js");
const sharp = require("sharp");
const axios = require("axios");

const extractData = async (imagePath) => {
  try {
    console.log("Processing image from:", imagePath);

    const response = await axios.get(imagePath, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(response.data);

    console.log("Image downloaded, processing with Sharp");

    const processedImage = await sharp(imageBuffer)
      .resize(2000, null)
      .sharpen()
      .normalize()
      .toBuffer();

    console.log("Image processed, starting OCR");

    const worker = await tesseract.createWorker();
    await worker.loadLanguage("eng+hin");
    await worker.initialize("eng+hin");

    const {
      data: { text },
    } = await worker.recognize(processedImage);
    console.log("Extracted text:", text);

    await worker.terminate();

    // Enhanced patterns with more variations
    const patterns = {
      documentNumber: [
        /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
        /(\d{4}[\s-]?\d{4}[\s-]?\d{4})/,
        /(\d{10})\b/, // Also match 10-digit numbers
      ],
      name: [
        // More specific name patterns
        /Name\s*:\s*([A-Z][A-Za-z\s]+?)(?=\s*(?:DOB|Gender|Year|Female|Male|\d{4}))/i,
        /नाम\s*\/\s*Name\s*:\s*([A-Z][A-Za-z\s]+)/i,
        /([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+)\s+(?=DOB|Gender|Year|Female|Male|\d{4})/,
        /:\s*([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+)\s+(?=DOB|Gender|Year|Female|Male|\d{4})/,
      ],
      dateOfBirth: [
        // Date patterns
        /DOB\s*:\s*(\d{4}-\d{2}-\d{2})/i,
        /DOB\s*:\s*(\d{2}-\d{2}-\d{4})/i,
        /(\d{4}-\d{2}-\d{2})/,
        /(\d{2}-\d{2}-\d{4})/,
        // Year only patterns
        /Year of Birth\s*:?\s*(\d{4})/i,
        /जन्म वर्ष\s*:?\s*(\d{4})/i,
        // Extract just year if nothing else
        /\b(19\d{2}|20\d{2})\b/,
      ],
      gender: [
        /(?:Gender|लिंग)[:\s]*(Male|Female|पुरुष|महिला)/i,
        /\b(Male|Female|पुरुष|महिला)\b/i,
        /\b(MALE|FEMALE)\b/,
      ],
    };

    const extracted = {};

    // Enhanced extraction with text preprocessing
    const cleanedText = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

    // Extract data with better handling
    Object.entries(patterns).forEach(([key, patternList]) => {
      let found = false;
      patternList.some((pattern) => {
        const match = cleanedText.match(pattern);
        if (match && match[1]) {
          extracted[key] = match[1].trim();
          found = true;
          return true;
        }
        return false;
      });

      // Fallback patterns for name
      if (!found && key === "name") {
        // Try to find any sequence of capital letters with spaces
        const nameMatch = cleanedText.match(
          /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+)/
        );
        if (nameMatch) {
          extracted.name = nameMatch[1].trim();
        }
      }
    });

    // Enhanced data cleaning
    if (extracted.name) {
      extracted.name = extracted.name
        .replace(/[^\w\s]/g, "")
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ")
        .trim();
    }

    if (extracted.documentNumber) {
      extracted.documentNumber = extracted.documentNumber.replace(/\s/g, "");
    }

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

    if (extracted.dateOfBirth) {
      if (extracted.dateOfBirth.length === 4) {
        // Year only format
        extracted.dateOfBirth = `01/01/${extracted.dateOfBirth}`;
      } else {
        const parts = extracted.dateOfBirth.split(/[-/.]/).map((p) => p.trim());
        if (parts.length === 3) {
          // Check if year is first or last
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            extracted.dateOfBirth = `${parts[2]}/${parts[1]}/${parts[0]}`;
          } else {
            // DD-MM-YYYY format
            extracted.dateOfBirth = `${parts[0]}/${parts[1]}/${parts[2]}`;
          }
        }
      }
    }

    console.log("Final extracted data:", extracted);

    return {
      success: true,
      data: extracted,
    };
  } catch (error) {
    console.error("Extraction error:", error);
    return {
      success: false,
      data: {},
      error: error.message,
    };
  }
};

module.exports = extractData;
