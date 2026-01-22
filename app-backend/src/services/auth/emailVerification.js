import crypto from "crypto";
import pool from "../../db/pool.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { sendEmail } from "../email/emailService.js";

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await pool.query(
    "SELECT id, verification_token_expires FROM users WHERE verification_token_hash = $1",
    [tokenHash]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Invalid verification token" });
  }

  const user = result.rows[0];

  // Check if token has expired
  if (new Date(user.verification_token_expires) < new Date()) {
    return res.status(400).json({ message: "Verification token has expired" });
  }

  // Mark user as verified and clear token
  await pool.query(
    "UPDATE users SET email_verified = TRUE, verification_token_hash = NULL, verification_token_expires = NULL WHERE id = $1",
    [user.id]
  );

  res.json({ message: "Email verified successfully" });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if user exists
  const result = await pool.query(
    "SELECT id, email_verified FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = result.rows[0];

  // Check if already verified
  if (user.email_verified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
  const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Update user with new token
  await pool.query(
    `UPDATE users SET verification_token_hash = $1, verification_token_expires = to_timestamp($2 / 1000.0) WHERE id = $3`,
    [tokenHash, tokenExpiry, user.id]
  );

  // Send verification email
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: email,
    subject: "Verify Your Email",
    text: `Please verify your email by clicking on the following link: ${verificationLink}`,
  });

  res.json({ message: "Verification email has been resent" });
});