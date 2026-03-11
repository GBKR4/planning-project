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

function splitSlotsByTime(slots, date, cutoffTime = '14:00') {
  // Split slots into morning (before cutoff) and evening (after cutoff)
  const cutoff = new Date(`${date}T${cutoffTime}:00`);
  const morningSlots = [];
  const eveningSlots = [];

  slots.forEach(slot => {
    if (slot.end <= cutoff) {
      // Entirely morning
      morningSlots.push(slot);
    } else if (slot.start >= cutoff) {
      // Entirely evening
      eveningSlots.push(slot);
    } else {
      // Slot spans the cutoff, split it
      morningSlots.push({ start: slot.start, end: cutoff });
      eveningSlots.push({ start: cutoff, end: slot.end });
    }
  });

  return { morningSlots, eveningSlots };
}

function scheduleTasksInSlots(tasks, slots, scheduled, timeSinceLastRest, timeForRest, restAfter) {
  // Helper function to schedule a list of tasks into specific slots
  // Returns updated timeSinceLastRest and unscheduled tasks
  const unscheduled = [];

  for (let task of tasks) {
    const taskDuration = task.estimated_minutes * 60_000;
    console.log(`\nTrying to schedule: ${task.title} (${task.estimated_minutes} min, pref: ${task.time_preference || 'anytime'})`);

    let taskScheduled = false;
    for (let j = 0; j < slots.length; j++) {
      const slot = slots[j];
      const slotDuration = slot.end - slot.start;

      if (slotDuration >= taskDuration) {
        const start = slot.start;
        const end = new Date(start.getTime() + taskDuration);

        console.log(`  ✓ Scheduled in slot: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);

        scheduled.push({
          task_id: task.id,
          start,
          end,
          is_rest: false
        });

        // Update slots array in-place
        slots.splice(j, 1, 
          ...(start > slot.start ? [{ start: slot.start, end: start }] : []), 
          ...(end < slot.end ? [{ start: end, end: slot.end }] : [])
        );

        taskScheduled = true;
        timeSinceLastRest += taskDuration;

        // Check if we need a break AFTER this task
        if (timeSinceLastRest >= restAfter * 60_000) {
          const restDuration = timeForRest * 60_000;
          console.log(`  → Need break after ${timeSinceLastRest / 60_000} min of work`);
          
          // Try to fit rest break in the next available slot
          for (let k = 0; k < slots.length; k++) {
            const breakSlot = slots[k];
            const breakSlotDuration = breakSlot.end - breakSlot.start;
            if (breakSlotDuration >= restDuration) {
              const breakStart = breakSlot.start;
              const breakEnd = new Date(breakStart.getTime() + restDuration);

              console.log(`  ✓ Break scheduled: ${breakStart.toLocaleTimeString()} - ${breakEnd.toLocaleTimeString()}`);

              scheduled.push({
                task_id: null,
                start: breakStart,
                end: breakEnd,
                is_rest: true
              });

              // Update slots array in-place
              slots.splice(k, 1, 
                ...(breakStart > breakSlot.start ? [{ start: breakSlot.start, end: breakStart }] : []), 
                ...(breakEnd < breakSlot.end ? [{ start: breakEnd, end: breakSlot.end }] : [])
              );
              timeSinceLastRest = 0;
              break;
            }
          }
        }

        break;
      }
    }

    if (!taskScheduled) {
      unscheduled.push(task);
    }
  }

  return { timeSinceLastRest, unscheduled };
}

function getOrderedTasks(tasks) {
  // Sorting function for deadline, priority, duration
  const sortByPriority = (a, b) => {
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
  };

  // Separate tasks by time preference
  const morningTasks = tasks.filter(t => t.time_preference === 'morning').sort(sortByPriority);
  const eveningTasks = tasks.filter(t => t.time_preference === 'evening').sort(sortByPriority);
  const anytimeTasks = tasks.filter(t => !t.time_preference || t.time_preference === 'anytime').sort(sortByPriority);

  console.log('=== TASK SORTING DEBUG ===');
  console.log(`Morning tasks: ${morningTasks.length}, Evening tasks: ${eveningTasks.length}, Anytime tasks: ${anytimeTasks.length}`);
  
  morningTasks.forEach(t => {
    console.log(`[MORNING] ${t.title}, Priority: ${t.priority}, Duration: ${t.estimated_minutes} min, Deadline: ${t.deadline_at}`);
  });
  eveningTasks.forEach(t => {
    console.log(`[EVENING] ${t.title}, Priority: ${t.priority}, Duration: ${t.estimated_minutes} min, Deadline: ${t.deadline_at}`);
  });
  anytimeTasks.forEach(t => {
    console.log(`[ANYTIME] ${t.title}, Priority: ${t.priority}, Duration: ${t.estimated_minutes} min, Deadline: ${t.deadline_at}`);
  });

  return { morningTasks, eveningTasks, anytimeTasks };
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


  const { rows: tasks } = await pool.query(`SELECT id, title, estimated_minutes, deadline_at, priority, time_preference FROM tasks WHERE user_id = $1 AND status = 'todo' `, [userId]);

  const orderedTasks = getOrderedTasks(tasks);

  console.log('=== FREE SLOTS AVAILABLE ===');
  freeSlots.forEach((slot, i) => {
    console.log(`Slot ${i}: ${slot.start.toLocaleTimeString()} - ${slot.end.toLocaleTimeString()} (${(slot.end - slot.start) / 60000} min)`);
  });

  // Split slots into morning and evening (cutoff at 2 PM)
  const { morningSlots, eveningSlots } = splitSlotsByTime(freeSlots, date, '14:00');
  console.log(`\n=== SLOT SPLIT ===`);
  console.log(`Morning slots: ${morningSlots.length}, Evening slots: ${eveningSlots.length}`);

  let timeSinceLastRest = 0;
  const scheduled = [];

  // Phase 1: Schedule morning tasks to morning slots
  console.log('\n=== PHASE 1: Morning Tasks → Morning Slots ===');
  let result = scheduleTasksInSlots(
    orderedTasks.morningTasks, 
    morningSlots, 
    scheduled, 
    timeSinceLastRest, 
    timeForRest, 
    restAfter
  );
  timeSinceLastRest = result.timeSinceLastRest;
  let unscheduledMorning = result.unscheduled;

  // Phase 2: Schedule evening tasks to evening slots
  console.log('\n=== PHASE 2: Evening Tasks → Evening Slots ===');
  result = scheduleTasksInSlots(
    orderedTasks.eveningTasks, 
    eveningSlots, 
    scheduled, 
    timeSinceLastRest, 
    timeForRest, 
    restAfter
  );
  timeSinceLastRest = result.timeSinceLastRest;
  let unscheduledEvening = result.unscheduled;

  // Phase 3: Schedule anytime tasks to any remaining slots (morning first, then evening)
  console.log('\n=== PHASE 3: Anytime Tasks → All Remaining Slots ===');
  const allRemainingSlots = [...morningSlots, ...eveningSlots];
  result = scheduleTasksInSlots(
    orderedTasks.anytimeTasks, 
    allRemainingSlots, 
    scheduled, 
    timeSinceLastRest, 
    timeForRest, 
    restAfter
  );
  timeSinceLastRest = result.timeSinceLastRest;

  // Phase 4: Handle overflow - morning tasks that didn't fit try remaining slots
  if (unscheduledMorning.length > 0) {
    console.log('\n=== PHASE 4: Overflow Morning Tasks → Remaining Slots ===');
    result = scheduleTasksInSlots(
      unscheduledMorning, 
      allRemainingSlots, 
      scheduled, 
      timeSinceLastRest, 
      timeForRest, 
      restAfter
    );
    timeSinceLastRest = result.timeSinceLastRest;
  }

  // Phase 5: Handle overflow - evening tasks that didn't fit try remaining slots
  if (unscheduledEvening.length > 0) {
    console.log('\n=== PHASE 5: Overflow Evening Tasks → Remaining Slots ===');
    result = scheduleTasksInSlots(
      unscheduledEvening, 
      allRemainingSlots, 
      scheduled, 
      timeSinceLastRest, 
      timeForRest, 
      restAfter
    );
    timeSinceLastRest = result.timeSinceLastRest;
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
    // Get the missed block details (need end_at for deletion)
    const missedBlockResult = await pool.query(
      `SELECT task_id, end_at FROM plan_blocks WHERE id = $1`,
      [missedBlockId]
    );
    
    const missedBlock = missedBlockResult.rows[0];
    
    if (!missedBlock) {
      // The block was deleted by a concurrent generatePlan call — the plan has
      // already been regenerated, so no further action is needed.
      await pool.query('ROLLBACK');
      return;
    }

    // mark missed
    await pool.query(
      `UPDATE plan_blocks SET status = 'missed' WHERE id = $1`,
      [missedBlockId]
    );

    // Keep the missed task as todo so it can be rescheduled
    if (missedBlock.task_id) {
      await pool.query(
        `UPDATE tasks SET status = 'todo' WHERE id = $1`,
        [missedBlock.task_id]
      );
    }

    // delete ALL scheduled blocks that come after the missed block
    // This ensures old schedule is completely removed before creating new one
    const deleteResult = await pool.query(
      `DELETE FROM plan_blocks
       WHERE plan_id = $1
         AND status = 'scheduled'
         AND start_at >= $2
       RETURNING id`,
      [plan.id, missedBlock.end_at]
    );

    console.log(`🗑️  Deleted ${deleteResult.rowCount} old scheduled blocks after missed block`);

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
      `SELECT id, title, deadline_at, priority, time_preference FROM tasks WHERE user_id = $1`,
      [userId]
    );

    // insert new slots with reason
    let insertedCount = 0;
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
      insertedCount++;
    }

    console.log(`✅ Created ${insertedCount} new rescheduled blocks`);

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

export { assignSlots, insertAssignedSlots, regeneratePlan };