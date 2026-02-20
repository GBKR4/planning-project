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
  // Create proper ISO timestamps - date is YYYY-MM-DD, times are HH:MM or HH:MM:SS
  const startTime = workStart.substring(0, 5); // Get HH:MM
  const endTime = workEnd.substring(0, 5);
  const dayStart = new Date(`${date}T${startTime}:00`);
  const dayEnd = new Date(`${date}T${endTime}:00`);

  const mergedIntervels = mergeIntervals(blocked);

  return subtractIntervals({ start: dayStart, end: dayEnd }, mergedIntervels);
}

function getOrderedTasks(tasks) {
  const sorted = [...tasks].sort((a, b) => {
    // Step 1: Sort by deadline (null deadlines go last)
    const deadlineA = a.deadline_at ? new Date(a.deadline_at).getTime() : Infinity;
    const deadlineB = b.deadline_at ? new Date(b.deadline_at).getTime() : Infinity;

    if (deadlineA !== deadlineB) {
      return deadlineA - deadlineB; // earlier deadline first
    }

    // Step 2: Sort by priority (higher priority first)
    const priorityA = parseInt(a.priority) || 3;
    const priorityB = parseInt(b.priority) || 3;
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // 5 comes before 3
    }

    // Step 3: Sort by duration (larger tasks first)
    const durationA = parseInt(a.estimated_minutes) || 0;
    const durationB = parseInt(b.estimated_minutes) || 0;
    return durationB - durationA; // 150 min comes before 90 min comes before 30 min
  });

  console.log('=== TASK SORTING DEBUG ===');
  sorted.forEach(t => {
    console.log(`Task: ${t.title}, Priority: ${t.priority}, Duration: ${t.estimated_minutes} min, Deadline: ${t.deadline_at}`);
  });

  return sorted;
}

async function assignSlots(userId, date, workStart, workEnd, timeForRest = 10, restAfter = 120) {
  const plan = await getPlan(userId, date);
  // Create ISO formatted timestamps - ensure workStart/workEnd are in HH:MM format
  const startTime = workStart.substring(0, 5);
  const endTime = workEnd.substring(0, 5);
  const dayStart = new Date(`${date}T${startTime}:00`);
  const dayEnd = new Date(`${date}T${endTime}:00`);

  const busyBlocks = await getBusyBlocks(userId, dayStart, dayEnd);

  const planBlocks = await getPlanBlocks(plan.id, dayStart, dayEnd);

  const blocked = [...busyBlocks, ...planBlocks];

  let freeSlots = computeFreeSlots(plan, blocked, date, workStart, workEnd);


  const { rows: tasks } = await pool.query(`SELECT id, title, estimated_minutes, deadline_at, priority FROM tasks WHERE user_id = $1 AND status = 'todo' `, [userId]);

  const orderedTasks = getOrderedTasks(tasks);
  const scheduled = [];

  console.log('=== FREE SLOTS AVAILABLE ===');
  freeSlots.forEach((slot, i) => {
    console.log(`Slot ${i}: ${slot.start.toLocaleTimeString()} - ${slot.end.toLocaleTimeString()} (${(slot.end - slot.start) / 60000} min)`);
  });

  let timeSinceLastRest = 0;

  for (let i = 0; i < orderedTasks.length; i++) {
    let task = orderedTasks[i];
    const taskDuration = task.estimated_minutes * 60_000;

    console.log(`\nTrying to schedule: ${task.title} (${task.estimated_minutes} min)`);

    let taskScheduled = false;
    for (let j = 0; j < freeSlots.length; j++) {
      const slot = freeSlots[j];
      const slotDuration = slot.end - slot.start;

      if (slotDuration >= taskDuration) {
        const start = slot.start;
        const end = new Date(start.getTime() + taskDuration);

        console.log(`  ✓ Scheduled in slot ${j}: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);

        scheduled.push({
          task_id: task.id,
          start,
          end,
          is_rest: false
        });

        //  update freeSlots in memory
        freeSlots.splice(j, 1, ...(start > slot.start ? [{ start: slot.start, end: start }] : []), ...(end < slot.end ? [{ start: end, end: slot.end }] : [])
        );

        taskScheduled = true;
        break;
      }
    }

    // Only increment time if task was successfully scheduled
    if (taskScheduled) {
      timeSinceLastRest += taskDuration;

      // Check if we need a break AFTER this task
      if (timeSinceLastRest >= restAfter * 60_000) {
        const restDuration = timeForRest * 60_000;
        console.log(`  → Need break after ${timeSinceLastRest / 60_000} min of work`);
        
        // Try to fit rest break in the next available slot
        for (let j = 0; j < freeSlots.length; j++) {
          const slot = freeSlots[j];
          const slotDuration = slot.end - slot.start;
          if (slotDuration >= restDuration) {
            const start = slot.start;
            const end = new Date(start.getTime() + restDuration);

            console.log(`  ✓ Break scheduled: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);

            scheduled.push({
              task_id: null,
              start,
              end,
              is_rest: true
            });

            // Update freeSlots in memory
            freeSlots.splice(j, 1, ...(start > slot.start ? [{ start: slot.start, end: start }] : []), ...(end < slot.end ? [{ start: end, end: slot.end }] : []));
            timeSinceLastRest = 0;
            break;
          }
        }
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
      const blockType = block.is_rest ? 'break' : 'task';

      await pool.query(`INSERT INTO plan_blocks (plan_id, task_id, block_type, start_at, end_at) VALUES ($1, $2, $3, $4, $5)`, [
        plans.id,
        block.task_id,
        blockType,
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

    // Get the missed block's task to keep it as todo
    const missedBlock = await pool.query(
      `SELECT task_id FROM plan_blocks WHERE id = $1`,
      [missedBlockId]
    );
    
    if (missedBlock.rows[0]?.task_id) {
      await pool.query(
        `UPDATE tasks SET status = 'todo' WHERE id = $1`,
        [missedBlock.rows[0].task_id]
      );
    }

    // delete future scheduled blocks
    await pool.query(
      `DELETE FROM plan_blocks
       WHERE plan_id = $1
         AND status = 'scheduled'
         AND start_at > $2`,
      [plan.id, now]
    );

    // reschedule remaining day from current time
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format in local time
    const assignedSlots = await assignSlots(
      userId,
      date,
      currentTime,
      plan.work_end
    );

    // Get tasks for reason generation
    const { rows: tasks } = await pool.query(
      `SELECT id, title, deadline_at, priority FROM tasks WHERE user_id = $1`,
      [userId]
    );

    // insert new slots with reason
    for (const block of assignedSlots) {
      const blockType = block.is_rest ? 'break' : 'task';
      const task = tasks.find(t => t.id === block.task_id);
      const reason = block.is_rest ? 'Automatic break' : `Rescheduled: ${task?.deadline_at ? 'Deadline ' + new Date(task.deadline_at).toLocaleDateString() : 'Priority ' + task?.priority}`;
      
      await pool.query(
        `INSERT INTO plan_blocks
         (plan_id, task_id, block_type, start_at, end_at, reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [plan.id, block.task_id, blockType, block.start, block.end, reason]
      );
    }

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

export { assignSlots, insertAssignedSlots, regeneratePlan };