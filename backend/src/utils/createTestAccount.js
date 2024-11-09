const nodemailer = require("nodemailer");

async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log("Credentials:", {
      user: testAccount.user,
      pass: testAccount.pass,
    });
    return testAccount;
  } catch (error) {
    console.error("Error creating test account:", error);
  }
}

createTestAccount();
