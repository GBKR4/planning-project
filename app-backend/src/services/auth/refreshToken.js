import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler, AppError } from "../../middleware/errorHandler.js";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import pool from "../../db/pool.js";

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if(!refreshToken) {
    return res.status(401).json({message:"No refresh token provided"});
  }

  // Verify JWT signature
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    return res.status(401).json({message:"Invalid refresh token"});
  }

  // Hash the token to compare with database
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  // Check if token exists in database and is not expired
  const result = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`, 
    [tokenHash]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: "Refresh token not found or expired" });
  }

  const storedToken = result.rows[0];

  // Generate new tokens
  const newAccessToken = generateAccessToken({ userId: payload.userId });
  const newRefreshToken = generateRefreshToken({ userId: payload.userId });
  const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

  // Update token in database
  await pool.query(
    `UPDATE refresh_tokens SET token_hash = $1, expires_at = NOW() + INTERVAL '7 days' WHERE id = $2`, 
    [newRefreshTokenHash, storedToken.id]
  );

  // Set new refresh token cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ accessToken: newAccessToken });
});