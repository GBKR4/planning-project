import pool from "../db/pool.js";
import jwt from "jsonwebtoken";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";


export const addBusyBlock = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { title, start_at, end_at } = req.body;
  const userId = req.user.userId;

  if (!title || !start_at || !end_at) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const start = new Date(start_at);
  const end = new Date(end_at);

  //  BLOCK BAD REQUEST
  if (end <= start) {
    return res.status(400).json({
      message: "end_at must be greater than start_at"
    });
  }

  //  SAFE TO INSERT
  const result = await pool.query(
    `INSERT INTO busy_blocks (user_id, title, start_at, end_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, start.toISOString(), end.toISOString()]
  );

  return res.status(201).json(result.rows[0]);
});


export const getBusyBlocks = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(`SELECT * FROM busy_blocks WHERE user_id = $1 ORDER BY START_AT`, [userId]);

  res.json(result.rows);
});

export const deleteBusyBlock = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;

  const result = await pool.query("DELETE FROM busy_blocks WHERE id = $1 AND user_id = $2", [id, userId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Busy block not found" });
  }

  res.json({ message: "Busy block deleted successfully" });
});

