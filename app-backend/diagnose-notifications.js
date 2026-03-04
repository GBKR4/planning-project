import dotenv from 'dotenv';
import pool from './src/db/pool.js';

dotenv.config();

async function diagnoseNotifications() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Notification System Diagnostics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const currentTime = new Date();
    console.log(`⏰ Current time: ${currentTime.toLocaleString()}\n`);

    // 1. Check users
    console.log('👥 USERS:');
    const users = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    users.rows.forEach(u => console.log(`   User ${u.id}: ${u.name} (${u.email})`));

    // 2. Check notification preferences
    console.log('\n📋 NOTIFICATION PREFERENCES:');
    const prefs = await pool.query(`
      SELECT np.*, u.name, u.email 
      FROM notification_preferences np
      JOIN users u ON np.user_id = u.id
    `);
    
    if (prefs.rows.length === 0) {
      console.log('   ⚠️  No notification preferences found!');
    } else {
      prefs.rows.forEach(p => {
        console.log(`\n   User ${p.user_id} (${p.name}):`);
        console.log(`     - Task reminders: ${p.task_reminders ? 'ON' : 'OFF'}`);
        console.log(`     - Reminder time: ${p.reminder_time_minutes} minutes`);
        console.log(`     - Email: ${p.email_enabled ? 'ON' : 'OFF'}`);
        console.log(`     - Push: ${p.push_enabled ? 'ON' : 'OFF'}`);
        console.log(`     - Overdue alerts: ${p.overdue_alerts ? 'ON' : 'OFF'}`);
      });
    }

    // 3. Check tasks with deadlines in the next 24 hours
    console.log('\n📝 TASKS WITH UPCOMING DEADLINES (next 24 hours):');
    const upcomingTasks = await pool.query(`
      SELECT t.*, u.name, u.email,
             EXTRACT(EPOCH FROM (t.deadline_at - NOW())) / 60 as minutes_until_deadline
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.deadline_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND t.status = 'todo'
      ORDER BY t.deadline_at ASC
    `);

    if (upcomingTasks.rows.length === 0) {
      console.log('   ℹ️  No tasks with deadlines in the next 24 hours');
    } else {
      upcomingTasks.rows.forEach(t => {
        const mins = Math.round(t.minutes_until_deadline);
        console.log(`\n   Task ${t.id}: "${t.title}"`);
        console.log(`     User: ${t.name} (ID: ${t.user_id})`);
        console.log(`     Deadline: ${new Date(t.deadline_at).toLocaleString()}`);
        console.log(`     Minutes until deadline: ${mins}`);
        console.log(`     Status: ${t.status}`);
      });
    }

    // 4. Check plan blocks starting soon (next 24 hours)
    console.log('\n📅 PLAN BLOCKS STARTING SOON (next 24 hours):');
    const upcomingBlocks = await pool.query(`
      SELECT pb.*, t.title, t.user_id, u.name, u.email,
             EXTRACT(EPOCH FROM (pb.start_at - NOW())) / 60 as minutes_until_start
      FROM plan_blocks pb
      JOIN plans p ON pb.plan_id = p.id
      LEFT JOIN tasks t ON pb.task_id = t.id
      JOIN users u ON p.user_id = u.id
      WHERE pb.start_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND pb.status = 'pending'
        AND pb.task_id IS NOT NULL
      ORDER BY pb.start_at ASC
    `);

    if (upcomingBlocks.rows.length === 0) {
      console.log('   ℹ️  No plan blocks starting in the next 24 hours');
    } else {
      upcomingBlocks.rows.forEach(b => {
        const mins = Math.round(b.minutes_until_start);
        console.log(`\n   Block ${b.id}: "${b.title}"`);
        console.log(`     User: ${b.name} (ID: ${b.user_id})`);
        console.log(`     Start time: ${new Date(b.start_at).toLocaleString()}`);
        console.log(`     End time: ${new Date(b.end_at).toLocaleString()}`);
        console.log(`     Minutes until start: ${mins}`);
        console.log(`     Status: ${b.status}`);
      });
    }

    // 5. Check tasks that should trigger reminders (based on preferences)
    console.log('\n🔔 TASKS THAT SHOULD TRIGGER REMINDERS:');
    const shouldNotify = await pool.query(`
      SELECT t.*, np.reminder_time_minutes, u.name, u.email,
             EXTRACT(EPOCH FROM (t.deadline_at - NOW())) / 60 as minutes_until_deadline
      FROM tasks t
      JOIN notification_preferences np ON t.user_id = np.user_id
      JOIN users u ON t.user_id = u.id
      WHERE t.deadline_at BETWEEN NOW() 
            AND NOW() + (np.reminder_time_minutes || ' minutes')::INTERVAL
        AND t.status = 'todo'
        AND np.task_reminders = TRUE
      ORDER BY t.deadline_at ASC
    `);

    if (shouldNotify.rows.length === 0) {
      console.log('   ℹ️  No tasks in reminder window');
    } else {
      console.log(`   ✅ Found ${shouldNotify.rows.length} tasks in reminder window:`);
      shouldNotify.rows.forEach(t => {
        const mins = Math.round(t.minutes_until_deadline);
        console.log(`\n   Task ${t.id}: "${t.title}"`);
        console.log(`     User: ${t.name} (Reminder window: ${t.reminder_time_minutes} min)`);
        console.log(`     Due in: ${mins} minutes`);
      });
    }

    // 6. Check blocks that should trigger reminders
    console.log('\n🚀 BLOCKS THAT SHOULD TRIGGER START REMINDERS:');
    const shouldNotifyBlocks = await pool.query(`
      SELECT pb.*, t.title, t.user_id, u.name, np.reminder_time_minutes,
             EXTRACT(EPOCH FROM (pb.start_at - NOW())) / 60 as minutes_until_start
      FROM plan_blocks pb
      JOIN plans p ON pb.plan_id = p.id
      JOIN tasks t ON pb.task_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN notification_preferences np ON t.user_id = np.user_id
      WHERE pb.start_at BETWEEN NOW() 
            AND NOW() + (np.reminder_time_minutes || ' minutes')::INTERVAL
        AND pb.status = 'pending'
        AND pb.task_id IS NOT NULL
        AND np.task_reminders = TRUE
      ORDER BY pb.start_at ASC
    `);

    if (shouldNotifyBlocks.rows.length === 0) {
      console.log('   ℹ️  No blocks in reminder window');
    } else {
      console.log(`   ✅ Found ${shouldNotifyBlocks.rows.length} blocks in reminder window:`);
      shouldNotifyBlocks.rows.forEach(b => {
        const mins = Math.round(b.minutes_until_start);
        console.log(`\n   Block ${b.id}: "${b.title}"`);
        console.log(`     User: ${b.name} (Reminder window: ${b.reminder_time_minutes} min)`);
        console.log(`     Starts in: ${mins} minutes`);
      });
    }

    // 7. Check recent notifications
    console.log('\n📬 RECENT NOTIFICATIONS (last 24 hours):');
    const recentNotifs = await pool.query(`
      SELECT n.*, u.name, t.title as task_title,
             EXTRACT(EPOCH FROM (NOW() - n.created_at)) / 60 as minutes_ago
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      LEFT JOIN tasks t ON n.related_task_id = t.id
      WHERE n.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY n.created_at DESC
    `);

    if (recentNotifs.rows.length === 0) {
      console.log('   ℹ️  No notifications in the last 24 hours');
    } else {
      console.log(`   Found ${recentNotifs.rows.length} notifications:`);
      recentNotifs.rows.forEach(n => {
        const minsAgo = Math.round(n.minutes_ago);
        console.log(`\n   Notification ${n.id}: ${n.type}`);
        console.log(`     User: ${n.name}`);
        console.log(`     Title: ${n.title}`);
        console.log(`     Message: ${n.message}`);
        console.log(`     Created: ${minsAgo} minutes ago`);
        console.log(`     Read: ${n.read ? 'Yes' : 'No'}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Diagnostics complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseNotifications();
