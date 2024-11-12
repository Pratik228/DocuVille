const validateDocument = (extractedData) => {
  const errors = [];

  if (!extractedData) {
    errors.push("No data could be extracted from the document");
    return { isValid: false, errors };
  }

  // Basic validations - document must have at least a number and name
  if (!extractedData.documentNumber || !extractedData.name) {
    if (!extractedData.documentNumber)
      errors.push("Could not extract document number");
    if (!extractedData.name) errors.push("Could not extract name");
    return { isValid: false, errors };
  }

  // Gender validation if present
  if (extractedData.gender) {
    const validGenders = ["MALE", "FEMALE", "OTHER", "महिला", "पुरुष"];
    if (!validGenders.includes(extractedData.gender.toUpperCase())) {
      errors.push("Invalid gender value");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = { validateDocument };
