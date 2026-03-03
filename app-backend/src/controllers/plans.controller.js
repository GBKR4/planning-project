import pool from "../db/pool.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";


export const addDailyPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { plan_date, work_start, work_end } = req.body;

  if (!plan_date) {
    return res.status(400).json({ message: "plan_date is required" });
  }

  const result = await pool.query(`INSERT INTO plans (user_id,plan_date,work_start,work_end) VALUES ($1,$2,$3,$4) RETURNING *`, [
    userId,
    plan_date,
    work_start || "09:00",
    work_end || "22:00"
  ]);

  res.status(201).json(result.rows[0]);
});

export const addPlanBlock = asyncHandler(async (req, res) => {
  const { plan_id, task_id, block_type, start_at, end_at } = req.body;

  // basic validation
  if (!plan_id || !block_type || !start_at || !end_at) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if(new Date(end_at) <= new Date(start_at)){
    return res.status(400).json({ message : "end_at must be greater than start_at"});
  }

  const userId = req.user.id;

  const planCheck = await pool.query("SELECT id FROM plans WHERE id=$1 AND user_id = $2",[plan_id,userId]);

  if(planCheck.rowCount === 0){
    return res.status(403).json({ message : "Unauthorized plan access"});
  }

  await pool.query(`INSERT INTO plan_blocks (plan_id,task_id,block_type,start_at,end_at) VALUES ($1,$2,$3,$4,$5)`, [
    plan_id,
    task_id || null,
    block_type,
    start_at,
    end_at
  ]);

  return res.status(201).json({ message : "Plan block added successful"});
});

export const generatePlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date, workStart, workEnd } = req.body;

  if (!date) {
    return res.status(400).json({ message: "date is required" });
  }

  // Check if plan already exists
  const existingPlan = await pool.query(
    "SELECT id FROM plans WHERE user_id = $1 AND plan_date = $2",
    [userId, date]
  );

  let planId;
  if (existingPlan.rowCount > 0) {
    planId = existingPlan.rows[0].id;
    // Delete existing blocks to regenerate
    await pool.query("DELETE FROM plan_blocks WHERE plan_id = $1", [planId]);
  } else {
    // Create new plan
    const newPlan = await pool.query(
      "INSERT INTO plans (user_id, plan_date, work_start, work_end) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, date, workStart || "09:00", workEnd || "22:00"]
    );
    planId = newPlan.rows[0].id;
  }

  // Get plan details
  const plan = await pool.query(
    "SELECT id, work_start, work_end FROM plans WHERE id = $1",
    [planId]
  );

  const dayStart = `${date} ${plan.rows[0].work_start}`;
  const dayEnd = `${date} ${plan.rows[0].work_end}`;

  // Get busy blocks for the day
  const busyBlocks = await pool.query(
    "SELECT id, title, start_at, end_at FROM busy_blocks WHERE user_id = $1 AND start_at < $3 AND end_at > $2",
    [userId, dayStart, dayEnd]
  );

  // Get all todo tasks
  const tasks = await pool.query(
    "SELECT id, title, estimated_minutes, deadline_at, priority FROM tasks WHERE user_id = $1 AND status = 'todo' ORDER BY deadline_at ASC NULLS LAST, priority DESC, estimated_minutes DESC",
    [userId]
  );

  // Use planner engine to assign slots
  const { assignSlots } = await import("../services/plannerEngine.js");
  const assignedSlots = await assignSlots(userId, date, plan.rows[0].work_start, plan.rows[0].work_end);

  // Insert plan blocks
  const blocks = [];
  for (const slot of assignedSlots) {
    const task = tasks.rows.find(t => t.id === slot.task_id);
    const reason = `Scheduled: ${task?.deadline_at ? 'Deadline ' + new Date(task.deadline_at).toLocaleDateString() : 'Priority ' + task?.priority}`;
    
    const result = await pool.query(
      "INSERT INTO plan_blocks (plan_id, task_id, block_type, start_at, end_at, reason) VALUES ($1, $2, 'task', $3, $4, $5) RETURNING *",
      [planId, slot.task_id, slot.start, slot.end, reason]
    );
    blocks.push(result.rows[0]);
  }

  // Find unscheduled tasks
  const scheduledTaskIds = assignedSlots.map(s => s.task_id);
  const unscheduled = tasks.rows
    .filter(t => !scheduledTaskIds.includes(t.id))
    .map(t => ({ taskId: t.id, title: t.title, reason: "Not enough free time today" }));

  res.json({
    date,
    planId,
    blocks,
    unscheduled,
    busyBlocks: busyBlocks.rows
  });
});

export const getPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "date query parameter is required" });
  }

  const plan = await pool.query(
    "SELECT * FROM plans WHERE user_id = $1 AND plan_date = $2",
    [userId, date]
  );

  // Get busy blocks regardless of plan existence
  const busyBlocks = await pool.query(
    "SELECT * FROM busy_blocks WHERE user_id = $1 AND DATE(start_at) = $2 ORDER BY start_at",
    [userId, date]
  );

  // If no plan exists, return empty structure
  if (plan.rowCount === 0) {
    return res.json({
      plan: null,
      blocks: [],
      busyBlocks: busyBlocks.rows
    });
  }

  const blocks = await pool.query(
    `SELECT pb.*, t.title as task_title, t.priority 
     FROM plan_blocks pb 
     LEFT JOIN tasks t ON pb.task_id = t.id 
     WHERE pb.plan_id = $1 
     ORDER BY pb.start_at`,
    [plan.rows[0].id]
  );

  res.json({
    plan: plan.rows[0],
    blocks: blocks.rows,
    busyBlocks: busyBlocks.rows
  });
});

export const markBlockDone = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const blockId = req.params.blockId;
  const { markTaskDone } = req.body;

  // Verify block belongs to user's plan
  const blockCheck = await pool.query(
    `SELECT pb.*, p.user_id FROM plan_blocks pb 
     JOIN plans p ON pb.plan_id = p.id 
     WHERE pb.id = $1`,
    [blockId]
  );

  if (blockCheck.rowCount === 0) {
    return res.status(404).json({ message: "Block not found" });
  }

  if (blockCheck.rows[0].user_id !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const block = blockCheck.rows[0];

  // Mark block as done
  await pool.query(
    "UPDATE plan_blocks SET status = 'done' WHERE id = $1",
    [blockId]
  );

  // Optionally mark task as done
  if (markTaskDone && block.task_id) {
    await pool.query(
      "UPDATE tasks SET status = 'done' WHERE id = $1",
      [block.task_id]
    );
  }

  res.json({ message: "Block marked as done" });
});

export const markBlockMissed = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const blockId = req.params.blockId;
  const { reschedule = true } = req.body;

  console.log('markBlockMissed called:', { userId, blockId, reschedule });

  // Verify block belongs to user's plan
  const blockCheck = await pool.query(
    `SELECT pb.*, p.user_id, p.plan_date::text as plan_date, p.work_end FROM plan_blocks pb 
     JOIN plans p ON pb.plan_id = p.id 
     WHERE pb.id = $1`,
    [blockId]
  );

  console.log('Block check result:', { rowCount: blockCheck.rowCount, block: blockCheck.rows[0] });

  if (blockCheck.rowCount === 0) {
    return res.status(404).json({ message: "Block not found" });
  }

  if (blockCheck.rows[0].user_id !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const block = blockCheck.rows[0];
  const planDate = block.plan_date; // Already in YYYY-MM-DD format from ::text cast

  console.log('Attempting to reschedule:', { planDate, userId });

  if (reschedule) {
    try {
      // Use the regeneratePlan function to automatically reschedule
      const { regeneratePlan } = await import("../services/plannerEngine.js");
      await regeneratePlan(userId, planDate, blockId);
      console.log('Reschedule completed successfully');
    } catch (error) {
      console.error('Error in regeneratePlan:', error);
      throw error;
    }

    // Get the newly scheduled blocks
    const newBlocks = await pool.query(
      `SELECT pb.*, t.title as task_title 
       FROM plan_blocks pb 
       LEFT JOIN tasks t ON pb.task_id = t.id 
       WHERE pb.plan_id = $1 
       AND pb.status = 'scheduled'
       AND pb.start_at > $2
       ORDER BY pb.start_at`,
      [block.plan_id, new Date()]
    );

    res.json({
      message: "Block marked as missed and remaining day rescheduled",
      taskId: block.task_id,
      rescheduled: true,
      newBlocks: newBlocks.rows
    });
  } else {
    // Just mark as missed without rescheduling
    await pool.query(
      "UPDATE plan_blocks SET status = 'missed' WHERE id = $1",
      [blockId]
    );

    // If block has a task, ensure the task remains as 'todo' so it can be rescheduled
    if (block.task_id) {
      await pool.query(
        "UPDATE tasks SET status = 'todo' WHERE id = $1",
        [block.task_id]
      );
    }

    // Delete all remaining scheduled blocks after this missed block for today
    await pool.query(
      `DELETE FROM plan_blocks 
       WHERE plan_id = $1 
       AND status = 'scheduled' 
       AND start_at > $2`,
      [block.plan_id, block.end_at]
    );

    res.json({
      message: "Block marked as missed. Remaining blocks deleted.",
      taskId: block.task_id,
      rescheduled: false
    });
  }
});