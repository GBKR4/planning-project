import dotenv from 'dotenv';
import pool from './src/db/pool.js';

dotenv.config();

async function resetAndSetup() {
  try {
    console.log('\n🔧 Resetting and setting up quick notification test data...\n');

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
    console.log('   ✅ Deleted plan blocks');
    
    await pool.query('DELETE FROM plans WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted plans');
    
    await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted tasks');
    
    await pool.query('DELETE FROM busy_blocks WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted busy blocks');
    
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted notifications');

    const now = new Date();
    console.log(`\n📅 Current time: ${now.toLocaleString()}\n`);

    // 2. Create tasks with deadlines in the NEXT 15 MINUTES (within reminder window)
    console.log('📝 Creating tasks with near-future deadlines...\n');
    
    const tasks = [
      {
        title: 'Review urgent email',
        notes: 'Check and respond to client email',
        deadline: new Date(now.getTime() + 3 * 60 * 1000), // 3 minutes
        priority: 1,
        estimatedMinutes: 15
      },
      {
        title: 'Prepare meeting notes',
        notes: 'Prepare notes for upcoming meeting',
        deadline: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
        priority: 1,
        estimatedMinutes: 20
      },
      {
        title: 'Call with team lead',
        notes: 'Discuss project milestones',
        deadline: new Date(now.getTime() + 8 * 60 * 1000), // 8 minutes
        priority: 2,
        estimatedMinutes: 30
      },
      {
        title: 'Submit timesheet',
        notes: 'Complete and submit weekly timesheet',
        deadline: new Date(now.getTime() + 12 * 60 * 1000), // 12 minutes
        priority: 2,
        estimatedMinutes: 10
      },
      {
        title: 'Code review',
        notes: 'Review pull request from teammate',
        deadline: new Date(now.getTime() + 20 * 60 * 1000), // 20 minutes (outside 15min window)
        priority: 3,
        estimatedMinutes: 25
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
      console.log(`   ✅ Created: "${task.title}"`);
      console.log(`      Deadline: ${task.deadline.toLocaleTimeString()} (${minutesFromNow} min from now)`);
    }

    // 3. Create today's plan
    console.log('\n📅 Creating today\'s plan...\n');
    const today = new Date().toISOString().split('T')[0];
    const planResult = await pool.query(
      `INSERT INTO plans (user_id, plan_date, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING id`,
      [userId, today]
    );
    const planId = planResult.rows[0].id;
    console.log(`   ✅ Created plan for today (ID: ${planId})`);

    // 4. Create plan blocks starting VERY soon (within reminder window)
    console.log('\n🚀 Creating plan blocks starting soon...\n');
    
    const blocks = [
      {
        taskId: createdTasks[0].id,
        title: createdTasks[0].title,
        startMinutes: 4, // Start in 4 minutes
        duration: 15
      },
      {
        taskId: createdTasks[1].id,
        title: createdTasks[1].title,
        startMinutes: 6, // Start in 6 minutes
        duration: 20
      },
      {
        taskId: createdTasks[2].id,
        title: createdTasks[2].title,
        startMinutes: 10, // Start in 10 minutes
        duration: 30
      }
    ];

    for (const block of blocks) {
      const startAt = new Date(now.getTime() + block.startMinutes * 60 * 1000);
      const endAt = new Date(startAt.getTime() + block.duration * 60 * 1000);
      
      await pool.query(
        `INSERT INTO plan_blocks (plan_id, task_id, start_at, end_at, status, block_type, created_at)
         VALUES ($1, $2, $3, $4, 'scheduled', 'task', NOW())`,
        [planId, block.taskId, startAt, endAt]
      );
      
      console.log(`   ✅ Block: "${block.title}"`);
      console.log(`      Starts: ${startAt.toLocaleTimeString()} (${block.startMinutes} min from now)`);
      console.log(`      Ends: ${endAt.toLocaleTimeString()}`);
    }

    // 5. Create some busy blocks for variety
    console.log('\n🚫 Creating busy blocks...\n');
    
    const busyBlocks = [
      {
        title: 'Team standup',
        startMinutes: 30,
        duration: 15
      },
      {
        title: 'Lunch break',
        startMinutes: 120,
        duration: 60
      }
    ];

    for (const busy of busyBlocks) {
      const startAt = new Date(now.getTime() + busy.startMinutes * 60 * 1000);
      const endAt = new Date(startAt.getTime() + busy.duration * 60 * 1000);
      
      await pool.query(
        `INSERT INTO busy_blocks (user_id, title, start_at, end_at, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, busy.title, startAt, endAt]
      );
      
      console.log(`   ✅ "${busy.title}"`);
      console.log(`      ${startAt.toLocaleTimeString()} - ${endAt.toLocaleTimeString()}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log(`   - 5 tasks created (4 deadlines within 15 min)`);
    console.log(`   - 3 plan blocks created (all starting within 10 min)`);
    console.log(`   - 2 busy blocks created`);
    console.log('');
    console.log('⏰ Notifications will be sent:');
    console.log('   - Task deadlines: Checked every 15 minutes');
    console.log('   - Task starts: Checked every 5 minutes');
    console.log('');
    console.log('💡 Expected notifications within 5 minutes:');
    console.log(`   - ${createdTasks.filter((_, i) => i < 4).length} deadline reminders`);
    console.log(`   - ${blocks.length} task starting reminders`);
    console.log('');
    console.log('🔔 Check notifications at:');
    console.log('   - Email: gbkr2458@gmail.com');
    console.log('   - Frontend: http://localhost:3000 (bell icon)');
    console.log('   - Full page: http://localhost:3000/notifications');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

resetAndSetup();
