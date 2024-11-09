// utils/validation.js
const validateDocument = (extractedData) => {
  const errors = [];

  if (!extractedData || Object.keys(extractedData).length === 0) {
    errors.push("No data could be extracted from the document");
    return { isValid: false, errors };
  }

  // Document number validation
  if (
    !extractedData.documentNumber ||
    !/^\d{4}\s?\d{4}\s?\d{4}$/.test(
      extractedData.documentNumber.replace(/\s/g, "")
    )
  ) {
    errors.push("Invalid Aadhar number format");
  }

  // Name validation
  if (!extractedData.name) {
    errors.push("Could not extract name");
  }

  // Date validation
  if (!extractedData.dateOfBirth) {
    errors.push("Could not extract date of birth");
  } else {
    // Check date format (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(extractedData.dateOfBirth)) {
      errors.push("Invalid date of birth format (should be DD/MM/YYYY)");
    } else {
      const [, day, month, year] = extractedData.dateOfBirth.match(dateRegex);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        errors.push("Invalid date of birth");
      }
    }
  }

  // Gender validation
  if (!extractedData.gender) {
    errors.push("Could not extract gender");
  } else if (
    !["MALE", "FEMALE", "OTHER"].includes(extractedData.gender.toUpperCase())
  ) {
    errors.push("Invalid gender value");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = { validateDocument };
