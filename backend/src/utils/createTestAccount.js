const nodemailer = require("nodemailer");

async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return testAccount;
  } catch (error) {
    console.error("Error creating test account:", error);
  }
}

createTestAccount();
