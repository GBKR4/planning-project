import pool from "../db/pool.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    "SELECT id, name, email, email_verified, created_at FROM users WHERE id = $1",
    [userId]
  );

  return res.json(result.rows[0]);
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