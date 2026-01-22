import pool from "../db/pool.js";
import { subtractIntervals, mergeIntervals } from "./timeUtils.js";

async function getPlan(userId, date) {
  const { rows } = await pool.query(`SELECT id,work_start,work_end FROM plans WHERE user_id = $1 AND plan_date = $2 `, [userId, date]);

  if (!rows.length) {
    throw new Error('Plan not found');
  }

  return rows[0];
}

async function getBusyBlocks(userId, dayStart, dayEnd) {
  const { rows } = await pool.query(`SELECT start_at, end_at FROM busy_blocks WHERE user_id = $1 AND start_at < $3 AND end_at   > $2`,
    [userId, dayStart, dayEnd]
  );

  return rows.map(element => ({
    start: new Date(element.start_at),
    end: new Date(element.end_at)
  }));
}


async function getPlanBlocks(planId, dayStart, dayEnd) {
  const { rows } = await pool.query(`SELECT start_at, end_at FROM plan_blocks WHERE plan_id = $1 AND status IN ('done', 'scheduled') AND start_at < $3 AND end_at > $2`, [planId, dayStart, dayEnd]);

  return rows.map((element) => ({
    start: new Date(element.start_at),
    end: new Date(element.end_at)
  }));
}

function computeFreeSlots(plan, blocked, date, workStart, workEnd) {
  const dayStart = new Date(`${date} ${workStart}`);
  const dayEnd = new Date(`${date} ${workEnd}`);

  const mergedIntervels = mergeIntervals(blocked);

  return subtractIntervals({ start: dayStart, end: dayEnd }, mergedIntervels);
}

function getOrderedTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const da = new Date(a.deadline_at).getTime();
    const db = new Date(b.deadline_at).getTime();

    //at first deadline based
    if (da !== db) {
      return da - db;
    }

    //next based on high priority
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    //thenn based on estimated_minutes

    return (a.estimated_minutes - b.estimated_minutes);
  })
}

async function assignSlots(userId, date, workStart, workEnd) {
  const plan = await getPlan(userId, date);

  const dayStart = `${date} ${workStart}`;

  const dayEnd = `${date} ${workEnd}`;

  const busyBlocks = await getBusyBlocks(userId, dayStart, dayEnd);

  const planBlocks = await getPlanBlocks(plan.id, dayStart, dayEnd);

  const blocked = [...busyBlocks, ...planBlocks];

  let freeSlots = computeFreeSlots(plan, blocked, date,workStart,workEnd);


  const { rows: tasks } = await pool.query(`SELECT id, title, estimated_minutes, deadline_at, priority FROM tasks WHERE user_id = $1 AND status = 'todo' `, [userId]);

  const orderedTasks = getOrderedTasks(tasks);
  const scheduled = [];

  for (let i = 0; i < orderedTasks.length; i++) {
    let task = orderedTasks[i];
    const taskDuration = task.estimated_minutes * 60_000;

    for (let j = 0; j < freeSlots.length; j++) {
      const slot = freeSlots[j];
      const slotDuration = slot.end - slot.start;

      if (slotDuration >= taskDuration) {
        const start = slot.start;
        const end = new Date(start.getTime() + taskDuration);

        scheduled.push({
          task_id: task.id,
          start,
          end
        });

        //  update freeSlots in memory
        freeSlots.splice(j, 1, ...(start > slot.start ? [{ start: slot.start, end: start }] : []), ...(end < slot.end ? [{ start: end, end: slot.end }] : [])
        );

        break;
      }
    }
  }

  return scheduled;
}

async function insertAssignedSlots(userId, date) {
  const plans = await getPlan(userId, date);

  const assignedSlots = await assignSlots(userId, date, plans.work_start, plans.work_end);

  await pool.query("BEGIN");

  try {
    await pool.query(`DELETE FROM plan_blocks WHERE plan_id = $1`, [plans.id]);

    for (let i = 0; i < assignedSlots.length; i++) {
      const block = assignedSlots[i];

      await pool.query(`INSERT INTO plan_blocks (plan_id, task_id, block_type, start_at, end_at) VALUES ($1, $2, 'task', $3, $4)`, [
        plans.id,
        block.task_id,
        block.start,
        block.end
      ]);
    }

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function regeneratePlan(userId, date, missedBlockId) {
  const now = new Date();
  const plan = await getPlan(userId, date);

  await pool.query("BEGIN");

  try {
    // mark missed
    await pool.query(
      `UPDATE plan_blocks SET status = 'missed' WHERE id = $1`,
      [missedBlockId]
    );

    // delete future scheduled blocks
    await pool.query(
      `DELETE FROM plan_blocks
       WHERE plan_id = $1
         AND status = 'scheduled'
         AND start_at > $2`,
      [plan.id, now]
    );

    // reschedule remaining day
    const assignedSlots = await assignSlots(
      userId,
      date,
      now.toISOString().slice(11, 16),
      plan.work_end
    );

    // insert new slots
    for (const block of assignedSlots) {
      await pool.query(
        `INSERT INTO plan_blocks
         (plan_id, task_id, block_type, start_at, end_at)
         VALUES ($1, $2, 'task', $3, $4)`,
        [plan.id, block.task_id, block.start, block.end]
      );
    }

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

export { assignSlots, insertAssignedSlots, regeneratePlan };