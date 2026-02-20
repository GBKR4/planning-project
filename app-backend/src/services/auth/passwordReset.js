import crypto from  "crypto";
import bcryptjs from "bcryptjs";
import pool from "../../db/pool.js";
import { asyncHandler, AppError } from "../../middleware/errorHandler.js";

export const  resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await pool.query(`SELECT id, reset_token_expires FROM users WHERE reset_token_hash = $1`, [tokenHash]);

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const user = result.rows[0];

  // Check if token has expired
  if (new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ message: "Reset token has expired" });
  }

  const userId = user.id;

  const hashedPassword = await bcryptjs.hash(password, 10);

  await pool.query(`UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2`, [hashedPassword, userId]);

  return res.json({ message: "Password has been reset successfully" });
});