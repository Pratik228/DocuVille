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
      .grayscale()
      .modulate({
        brightness: 1.1,
        contrast: 1.1,
      })
      .toBuffer();

    console.log("Image processed, starting OCR");

    const worker = await tesseract.createWorker();
    await worker.loadLanguage("eng+hin");
    await worker.initialize("eng+hin");
    await worker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- ",
      preserve_interword_spaces: 1,
    });

    const {
      data: { text },
    } = await worker.recognize(processedImage);
    console.log("Extracted text:", text);

    await worker.terminate();

    const patterns = {
      documentNumber: [
        /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
        /(\d{4}[\s-]?\d{4}[\s-]?\d{4})/,
        /(\d{10})\b/,
      ],
      name: [
        /(?:Name|नाम)\s*[:\-]?\s*([A-Z][A-Za-z\s]+)/i,
        /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+)/,
      ],
      dateOfBirth: [
        /(?:DOB|जन्म तिथि)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{4}\/\d{2}\/\d{2})/i,
        /\b(19\d{2}|20\d{2})\b/,
      ],
      gender: [/\b(Male|Female|पुरुष|महिला|MALE|FEMALE)\b/i],
    };

    const extracted = {};
    const cleanedText = text
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/Government Of India|GOVERNMENT OF INDIA/i, "")
      .trim();

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
    });

    if (extracted.name) {
      extracted.name = extracted.name
        .replace(/[^\w\s]/g, "")
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ")
        .trim();

      extracted.name = extracted.name.replace(/\b(Fh|Dria|Dob)\b/g, "").trim();

      // Additional check to remove 'Government Of India' if mistakenly matched
      if (extracted.name.includes("Government Of India")) {
        extracted.name = extracted.name
          .replace("Government Of India", "")
          .trim();
      }
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
      const parts = extracted.dateOfBirth.split(/[-/.]/).map((p) => p.trim());
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          extracted.dateOfBirth = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          extracted.dateOfBirth = `${parts[0]}/${parts[1]}/${parts[2]}`;
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
