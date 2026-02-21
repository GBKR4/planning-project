import pool from "../db/pool.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { hashPassword, comparePassword } from "../utils/password.js";

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    "SELECT id, name, email, email_verified, created_at FROM users WHERE id = $1",
    [userId]
  );

  return res.json(result.rows[0]);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { name, email } = req.body;

  // Check if email is being changed and if it's already taken
  if (email) {
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, userId]
    );
    
    if (emailCheck.rowCount > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(email);
    // Reset email_verified if email is changed
    updates.push(`email_verified = false`);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No updates provided" });
  }

  values.push(userId);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, name, email, email_verified, created_at`,
    values
  );

  return res.json({ 
    message: "Profile updated successfully",
    user: result.rows[0] 
  });
});

export const getUsers = asyncHandler(async (req,res) => {
  const result = await pool.query("SELECT id,name,email,created_at FROM users ORDER BY created_at DESC");

  return res.json(result.rows);
});

export const getUserById = asyncHandler(async  (req,res) => {
  const { id } = req.params;

  const result = await pool.query("SELECT id,name,email,created_at FROM users WHERE id = $1",[id]);

  if(result.rowCount === 0){
    return res.status(404).json({message : "User not found"});
  }

  res.json(result.rows[0]);
});

export const deleteUser = asyncHandler(async (req,res) => {
  const id = req.params.id;

  const result = await pool.query("DELETE FROM users WHERE id = $1",[id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  
  return res.json({message:"User Deleted Successfully"});
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required" });
  }

  // Get user's current password hash
  const result = await pool.query(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
  
  if (!isValid) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  // Hash new password and update
  const hashedPassword = await hashPassword(newPassword);
  
  await pool.query(
    "UPDATE users SET password_hash = $1 WHERE id = $2",
    [hashedPassword, userId]
  );

  return res.json({ message: "Password changed successfully" });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  // Get user's password hash
  const result = await pool.query(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "User not found" });
  }

  // Verify password
  const isValid = await comparePassword(password, result.rows[0].password_hash);
  
  if (!isValid) {
    return res.status(401).json({ message: "Password is incorrect" });
  }

  // Delete user account (cascade will delete related data)
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);

  return res.json({ message: "Account deleted successfully" });
});