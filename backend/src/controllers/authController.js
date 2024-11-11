const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

let transporter;

async function initializeTransporter() {
  try {
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("Ethereal Email Credentials:", {
      user: testAccount.user,
      pass: testAccount.pass,
    });
  } catch (error) {
    console.error("Failed to create test account:", error);
  }
}

initializeTransporter();

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    user = new User({
      firstName,
      lastName,
      email,
      password,
      verificationToken,
    });

    await user.save();

    const verificationUrl = `${process.env.BASE_URL}/auth/verify-email/${verificationToken}`;

    const info = await transporter.sendMail({
      from: '"Document Verification" <test@example.com>',
      to: email,
      subject: "Please verify your email",
      html: `
                <h2>Welcome to Document Verification</h2>
                <p>Hi ${firstName},</p>
                <p>Please click <a href="${verificationUrl}">here</a> to verify your email.</p>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
            `,
    });

    res.status(201).json({
      message:
        "Registration successful. Please check your email for verification.",
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: "Please verify your email first" });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

    const info = await transporter.sendMail({
      from: '"Document Verification" <test@example.com>',
      to: email,
      subject: "Password Reset Request",
      html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.firstName},</p>
                <p>Please click <a href="${resetUrl}">here</a> to reset your password.</p>
                <p>Or copy and paste this link in your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
    });

    res.json({
      message: "Password reset email sent",
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Logout failed",
      message: error.message,
    });
  }
};
