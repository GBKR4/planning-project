import pool from "../db/pool.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";

export const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC", [userId]);

  res.json(result.rows);
});

export const addTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const {
    title, notes, estimated_minutes, deadline_at, priority, time_preference
  } = req.body;

  if (!title || !estimated_minutes) {
    return res.status(400).json({ message: "title and estimated_minutes are required" });
  }

  const result = await pool.query(`INSERT INTO tasks (user_id, title, notes, estimated_minutes, deadline_at, priority, time_preference) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
    userId,
    title,
    notes || null,
    estimated_minutes,
    deadline_at || null,
    priority || 3,
    time_preference || 'anytime'
  ]);

  res.status(201).json(result.rows[0]);
});


export const getTaskById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  const result = await pool.query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2",[id,userId]);

  if(result.rowCount === 0){
    return res.status(404).json({ message : "Task not found"});
  }

  res.json(result.rows[0]);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2",[id,userId]);

  if(result.rowCount === 0){
    return res.status(404).json({ message : "Task not found"});
  }

  res.json({ message: `Task deleted successfully` });
});

export const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  const { title, notes, estimated_minutes, deadline_at, priority, status, time_preference } = req.body;

  // Build dynamic update query
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(title);
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(notes);
  }
  if (estimated_minutes !== undefined) {
    updates.push(`estimated_minutes = $${paramCount++}`);
    values.push(estimated_minutes);
  }
  if (deadline_at !== undefined) {
    updates.push(`deadline_at = $${paramCount++}`);
    values.push(deadline_at);
  }
  if (priority !== undefined) {
    updates.push(`priority = $${paramCount++}`);
    values.push(priority);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (time_preference !== undefined) {
    updates.push(`time_preference = $${paramCount++}`);
    values.push(time_preference);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  values.push(id, userId);
  
  const result = await pool.query(
    `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(result.rows[0]);
});

