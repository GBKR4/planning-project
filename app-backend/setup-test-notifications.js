import dotenv from 'dotenv';
import pool from './src/db/pool.js';

dotenv.config();

async function setupTestData() {
  try {
    console.log('\n🔧 Setting up test data for notifications...\n');

    const userId = 1; // User gbkr
    const now = new Date();
    
    // Create tasks with deadlines in the reminder window
    console.log('📝 Creating test tasks with near-future deadlines...');
    
    // Task 1: Due in 10 minutes (should trigger notification immediately)
    const deadline1 = new Date(now.getTime() + 10 * 60 * 1000);
    await pool.query(`
      INSERT INTO tasks (user_id, title, notes, priority, estimated_minutes, deadline_at, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      userId,
      'Urgent: Review PR',
      'This task is due in 10 minutes and should trigger a notification',
      1, // high priority
      30, // estimated 30 minutes
      deadline1,
      'todo'
    ]);
    console.log(`   ✅ Created task due at ${deadline1.toLocaleTimeString()}`);

    // Task 2: Due in 5 minutes (should trigger notification immediately)
    const deadline2 = new Date(now.getTime() + 5 * 60 * 1000);
    await pool.query(`
      INSERT INTO tasks (user_id, title, notes, priority, estimated_minutes, deadline_at, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      userId,
      'Quick meeting',
      'This task is due in 5 minutes',
      1, // high priority
      15, // estimated 15 minutes
      deadline2,
      'todo'
    ]);
    console.log(`   ✅ Created task due at ${deadline2.toLocaleTimeString()}`);

    // Create a daily plan for today
    console.log('\n📅 Creating daily plan with blocks starting soon...');
    
    // Get or create today's plan
    const today = new Date().toISOString().split('T')[0];
    let planResult = await pool.query(
      'SELECT id FROM plans WHERE user_id = $1 AND plan_date = $2',
      [userId, today]
    );

    let planId;
    if (planResult.rows.length === 0) {
      const newPlan = await pool.query(
        'INSERT INTO plans (user_id, plan_date, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [userId, today]
      );
      planId = newPlan.rows[0].id;
      console.log(`   ✅ Created new plan for today (ID: ${planId})`);
    } else {
      planId = planResult.rows[0].id;
      console.log(`   ℹ️  Using existing plan (ID: ${planId})`);
    }

    // Create a task that will be scheduled in the plan
    const taskResult = await pool.query(`
      INSERT INTO tasks (user_id, title, notes, priority, estimated_minutes, deadline_at, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      userId,
      'Important call',
      'This task is scheduled to start in 8 minutes',
      1, // high priority
      30, // estimated 30 minutes
      new Date(now.getTime() + 30 * 60 * 1000), // Deadline 30 min from now
      'todo'
    ]);
    const taskId = taskResult.rows[0].id;

    // Create plan block starting soon (8 minutes from now)
    const startAt = new Date(now.getTime() + 8 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
    
    await pool.query(`
      INSERT INTO plan_blocks (plan_id, task_id, start_at, end_at, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      planId,
      taskId,
      startAt,
      endAt,
      'scheduled'
    ]);
    console.log(`   ✅ Created plan block starting at ${startAt.toLocaleTimeString()}`);

    console.log('\n✅ Test data setup complete!');
    console.log('\n📊 Summary:');
    console.log(`   - 2 tasks with deadlines in reminder window`);
    console.log(`   - 1 plan block starting in 8 minutes`);
    console.log(`   - Next scheduler check will find these and send notifications`);
    console.log('\n💡 The scheduler checks:');
    console.log(`   - Upcoming deadlines: every 15 minutes`);
    console.log(`   - Tasks starting soon: every 5 minutes`);
    console.log(`\n⏰ You should receive notifications within the next 5 minutes!`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setupTestData();
