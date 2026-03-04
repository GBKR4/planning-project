import pool from './src/db/pool.js';

async function setupFreshNotificationTest() {
  try {
    const userId = 1; // gbkr2458@gmail.com
    const today = new Date().toISOString().split('T')[0];
    
    console.log('\n🧹 CLEANING UP OLD DATA...\n');
    console.log('=' .repeat(60));
    
    // Delete old data
    await pool.query('DELETE FROM plan_blocks WHERE plan_id IN (SELECT id FROM plans WHERE user_id = $1)', [userId]);
    console.log('✅ Deleted old plan blocks');
    
    await pool.query('DELETE FROM plans WHERE user_id = $1', [userId]);
    console.log('✅ Deleted old plans');
    
    await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
    console.log('✅ Deleted old tasks');
    
    await pool.query('DELETE FROM busy_blocks WHERE user_id = $1', [userId]);
    console.log('✅ Deleted old busy blocks');
    
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    console.log('✅ Deleted old notifications');
    
    console.log('\n📝 CREATING NEW TASKS...\n');
    console.log('=' .repeat(60));
    
    // Create new tasks with realistic titles
    const tasks = [
      { title: 'Review morning emails', notes: 'Check and respond to priority emails', duration: 20, priority: 2 },
      { title: 'Team sync meeting prep', notes: 'Prepare agenda and updates', duration: 15, priority: 3 },
      { title: 'Code review - PR #234', notes: 'Review frontend authentication changes', duration: 25, priority: 2 },
      { title: 'Update project documentation', notes: 'Document new notification system', duration: 30, priority: 3 },
      { title: 'Research competitor features', notes: 'Analyze competing task management apps', duration: 20, priority: 4 }
    ];
    
    const taskIds = [];
    for (const task of tasks) {
      const result = await pool.query(
        `INSERT INTO tasks (user_id, title, notes, estimated_minutes, priority, status)
         VALUES ($1, $2, $3, $4, $5, 'todo')
         RETURNING id, title`,
        [userId, task.title, task.notes, task.duration, task.priority]
      );
      taskIds.push(result.rows[0].id);
      console.log(`✅ Created: ${result.rows[0].title} (${task.duration} min)`);
    }
    
    console.log('\n📅 CREATING PLAN WITH SCHEDULED BLOCKS...\n');
    console.log('=' .repeat(60));
    
    // Create a plan for today
    const planResult = await pool.query(
      `INSERT INTO plans (user_id, plan_date, work_start, work_end)
       VALUES ($1, $2, '09:00', '18:00')
       RETURNING id`,
      [userId, today]
    );
    const planId = planResult.rows[0].id;
    console.log(`✅ Created plan for today (ID: ${planId})`);
    
    // Get current time and schedule blocks to start soon
    const now = new Date();
    const blocks = [];
    
    // First block: starts in 7 minutes (notification in 2 minutes)
    const block1Start = new Date(now.getTime() + 7 * 60 * 1000);
    const block1End = new Date(block1Start.getTime() + 20 * 60 * 1000);
    
    // Second block: starts in 15 minutes (notification in 10 minutes)
    const block2Start = new Date(block1End.getTime() + 5 * 60 * 1000);
    const block2End = new Date(block2Start.getTime() + 15 * 60 * 1000);
    
    // Third block: starts in 30 minutes (notification in 25 minutes)
    const block3Start = new Date(block2End.getTime() + 5 * 60 * 1000);
    const block3End = new Date(block3Start.getTime() + 25 * 60 * 1000);
    
    // Fourth block: starts in 60 minutes (notification in 55 minutes)
    const block4Start = new Date(block3End.getTime() + 5 * 60 * 1000);
    const block4End = new Date(block4Start.getTime() + 30 * 60 * 1000);
    
    const scheduleBlocks = [
      { taskId: taskIds[0], start: block1Start, end: block1End, title: tasks[0].title },
      { taskId: taskIds[1], start: block2Start, end: block2End, title: tasks[1].title },
      { taskId: taskIds[2], start: block3Start, end: block3End, title: tasks[2].title },
      { taskId: taskIds[3], start: block4Start, end: block4End, title: tasks[3].title }
    ];
    
    for (const block of scheduleBlocks) {
      await pool.query(
        `INSERT INTO plan_blocks (plan_id, task_id, block_type, start_at, end_at, status)
         VALUES ($1, $2, 'task', $3, $4, 'scheduled')`,
        [planId, block.taskId, block.start, block.end]
      );
      blocks.push(block);
    }
    
    console.log('\n⏰ SCHEDULED BLOCKS & NOTIFICATION TIMES:\n');
    console.log('─'.repeat(60));
    
    blocks.forEach((block, i) => {
      const notificationTime = new Date(block.start.getTime() - 5 * 60 * 1000);
      const minutesUntilStart = Math.round((block.start - now) / 60000);
      const minutesUntilNotif = Math.round((notificationTime - now) / 60000);
      
      console.log(`\n${i + 1}. ${block.title}`);
      console.log(`   ⏰ Starts at: ${block.start.toLocaleTimeString()} (in ${minutesUntilStart} min)`);
      console.log(`   📬 Notification at: ${notificationTime.toLocaleTimeString()} (in ${minutesUntilNotif} min)`);
      console.log(`   ⏱️  Duration: ${Math.round((block.end - block.start) / 60000)} minutes`);
    });
    
    // Add one busy block during lunch
    const lunchStart = new Date();
    lunchStart.setHours(12, 30, 0, 0);
    const lunchEnd = new Date();
    lunchEnd.setHours(13, 30, 0, 0);
    
    await pool.query(
      `INSERT INTO busy_blocks (user_id, title, start_at, end_at)
       VALUES ($1, 'Lunch Break', $2, $3)`,
      [userId, lunchStart, lunchEnd]
    );
    console.log('\n✅ Added busy block: Lunch Break (12:30 PM - 1:30 PM)');
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   • ${tasks.length} new tasks created`);
    console.log(`   • ${blocks.length} blocks scheduled for today`);
    console.log(`   • 1 busy block added`);
    console.log(`   • Notification preference: 5 minutes before task`);
    console.log('\n🔔 WHAT TO EXPECT:');
    console.log(`   • First notification in ~${Math.round((new Date(blocks[0].start.getTime() - 5 * 60 * 1000) - now) / 60000)} minutes`);
    console.log('   • Scheduler checks every 5 minutes');
    console.log('   • Check your email: gbkr2458@gmail.com');
    console.log('   • Check notification bell in the app');
    console.log('\n💡 TIP: Refresh your browser to see the new schedule!');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupFreshNotificationTest();
