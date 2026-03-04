import dotenv from 'dotenv';
import pool from './src/db/pool.js';

dotenv.config();

async function resetWithRealisticSchedule() {
  try {
    console.log('\n🔧 Setting up REALISTIC schedule (no overlaps)...\n');

    const userEmail = 'gbkr2458@gmail.com';
    
    // Get user ID
    const userResult = await pool.query('SELECT id, name FROM users WHERE email = $1', [userEmail]);
    if (userResult.rows.length === 0) {
      console.error(`❌ User with email ${userEmail} not found!`);
      return;
    }
    
    const userId = userResult.rows[0].id;
    const userName = userResult.rows[0].name;
    console.log(`✅ Found user: ${userName} (ID: ${userId})\n`);

    // 1. Delete existing data
    console.log('🗑️  Clearing existing data...');
    
    await pool.query('DELETE FROM plan_blocks WHERE plan_id IN (SELECT id FROM plans WHERE user_id = $1)', [userId]);
    await pool.query('DELETE FROM plans WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM busy_blocks WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    console.log('   ✅ All old data cleared\n');

    const now = new Date();
    console.log(`📅 Current time: ${now.toLocaleString()}\n`);

    // 2. Create tasks with various deadlines
    console.log('📝 Creating tasks...\n');
    
    const tasks = [
      {
        title: 'Reply to urgent email',
        notes: 'Client needs response ASAP',
        deadline: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
        priority: 1,
        estimatedMinutes: 10
      },
      {
        title: 'Quick code review',
        notes: 'Review teammate pull request',
        deadline: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
        priority: 1,
        estimatedMinutes: 15
      },
      {
        title: 'Update documentation',
        notes: 'Add new API endpoints to docs',
        deadline: new Date(now.getTime() + 25 * 60 * 1000), // 25 minutes
        priority: 2,
        estimatedMinutes: 20
      },
      {
        title: 'Team standup meeting',
        notes: 'Daily sync with team',
        deadline: new Date(now.getTime() + 45 * 60 * 1000), // 45 minutes
        priority: 1,
        estimatedMinutes: 15
      },
      {
        title: 'Prepare presentation',
        notes: 'Slides for client demo',
        deadline: new Date(now.getTime() + 90 * 60 * 1000), // 90 minutes
        priority: 2,
        estimatedMinutes: 30
      }
    ];

    const createdTasks = [];
    for (const task of tasks) {
      const result = await pool.query(
        `INSERT INTO tasks (user_id, title, notes, priority, estimated_minutes, deadline_at, status, time_preference, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'todo', 'anytime', NOW())
         RETURNING id`,
        [userId, task.title, task.notes, task.priority, task.estimatedMinutes, task.deadline]
      );
      
      createdTasks.push({ ...task, id: result.rows[0].id });
      
      const minutesFromNow = Math.round((task.deadline - now) / 60000);
      console.log(`   ✅ "${task.title}"`);
      console.log(`      Deadline: ${task.deadline.toLocaleTimeString()} (${minutesFromNow} min)`);
      console.log(`      Duration: ${task.estimatedMinutes} min\n`);
    }

    // 3. Create today's plan
    console.log('📅 Creating today\'s plan...\n');
    const today = new Date().toISOString().split('T')[0];
    const planResult = await pool.query(
      `INSERT INTO plans (user_id, plan_date, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING id`,
      [userId, today]
    );
    const planId = planResult.rows[0].id;
    console.log(`   ✅ Plan created (ID: ${planId})\n`);

    // 4. Create SEQUENTIAL (non-overlapping) plan blocks
    console.log('🚀 Creating sequential plan blocks (NO OVERLAPS)...\n');
    
    let currentTime = new Date(now.getTime() + 3 * 60 * 1000); // Start in 3 minutes
    
    const blocksToCreate = [
      { taskIndex: 0, duration: 10 },  // Reply to email: 10 min
      { taskIndex: 1, duration: 15 },  // Code review: 15 min
      { taskIndex: 2, duration: 20 },  // Update docs: 20 min
    ];

    for (let i = 0; i < blocksToCreate.length; i++) {
      const block = blocksToCreate[i];
      const task = createdTasks[block.taskIndex];
      
      const startAt = new Date(currentTime);
      const endAt = new Date(startAt.getTime() + block.duration * 60 * 1000);
      
      await pool.query(
        `INSERT INTO plan_blocks (plan_id, task_id, start_at, end_at, status, block_type, created_at)
         VALUES ($1, $2, $3, $4, 'scheduled', 'task', NOW())`,
        [planId, task.id, startAt, endAt]
      );
      
      const minsFromNow = Math.round((startAt - now) / 60000);
      console.log(`   ${i + 1}. "${task.title}"`);
      console.log(`      ⏰ ${startAt.toLocaleTimeString()} - ${endAt.toLocaleTimeString()}`);
      console.log(`      📍 Starts in ${minsFromNow} min | Duration: ${block.duration} min\n`);
      
      // Update currentTime to end of this block (add 5 min break)
      currentTime = new Date(endAt.getTime() + 5 * 60 * 1000);
    }

    // 5. Create busy blocks (breaks/meetings)
    console.log('🚫 Creating busy blocks...\n');
    
    const lunchStart = new Date(currentTime.getTime() + 10 * 60 * 1000);
    const lunchEnd = new Date(lunchStart.getTime() + 45 * 60 * 1000);
    
    await pool.query(
      `INSERT INTO busy_blocks (user_id, title, start_at, end_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, 'Lunch Break', lunchStart, lunchEnd]
    );
    
    console.log(`   ✅ "Lunch Break"`);
    console.log(`      ${lunchStart.toLocaleTimeString()} - ${lunchEnd.toLocaleTimeString()} (45 min)\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ REALISTIC SCHEDULE CREATED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log(`   - 5 tasks created`);
    console.log(`   - 3 plan blocks (SEQUENTIAL, no overlaps)`);
    console.log(`   - 1 lunch break`);
    console.log('');
    console.log('⏱️  Timeline:');
    const firstBlock = new Date(now.getTime() + 3 * 60 * 1000);
    const secondBlock = new Date(firstBlock.getTime() + 15 * 60 * 1000); // 10min + 5min break
    const thirdBlock = new Date(secondBlock.getTime() + 20 * 60 * 1000); // 15min + 5min break
    
    console.log(`   ${firstBlock.toLocaleTimeString()} - Reply to email (10 min)`);
    console.log(`   ${secondBlock.toLocaleTimeString()} - Code review (15 min)`);
    console.log(`   ${thirdBlock.toLocaleTimeString()} - Update docs (20 min)`);
    console.log(`   ${lunchStart.toLocaleTimeString()} - Lunch break (45 min)`);
    console.log('');
    console.log('🔔 Notifications (User reminder window: 15 minutes):');
    console.log('   - Tasks with deadlines in next 15 min will notify');
    console.log('   - Tasks starting in next 15 min will notify');
    console.log('');
    console.log('💡 To see notifications immediately:');
    console.log('   1. Run: node trigger-notifications-now.js');
    console.log('   2. Check email: gbkr2458@gmail.com');
    console.log('   3. Check frontend: http://localhost:3000 (bell icon)');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

resetWithRealisticSchedule();
