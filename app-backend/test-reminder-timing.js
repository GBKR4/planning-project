import dotenv from 'dotenv';
import pool from './src/db/pool.js';
import { triggerUpcomingCheck } from './src/services/notifications/notificationScheduler.js';

dotenv.config();

async function testReminderTiming() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing Reminder Timing Functionality');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Get a test user
    const userResult = await pool.query(
      'SELECT id, name, email FROM users LIMIT 1'
    );

    if (userResult.rows.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Test User: ${user.name} (ID: ${user.id})`);

    // 2. Check or create notification preferences
    let prefsResult = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [user.id]
    );

    if (prefsResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO notification_preferences 
         (user_id, task_reminders, reminder_time_minutes) 
         VALUES ($1, TRUE, 30)`,
        [user.id]
      );
      console.log('✅ Created notification preferences (30 min reminders)');
      
      prefsResult = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [user.id]
      );
    }

    const prefs = prefsResult.rows[0];
    console.log(`📋 Preferences:`);
    console.log(`   - Task Reminders: ${prefs.task_reminders ? 'ON' : 'OFF'}`);
    console.log(`   - Reminder Time: ${prefs.reminder_time_minutes} minutes before deadline`);
    console.log(`   - Email: ${prefs.email_enabled ? 'ON' : 'OFF'}`);
    console.log(`   - Push: ${prefs.push_enabled ? 'ON' : 'OFF'}`);

    // 3. Create test tasks with different deadlines
    console.log('\n📝 Creating test tasks...');

    const now = new Date();
    const testTasks = [
      {
        title: 'Task due in 15 minutes',
        deadline: new Date(now.getTime() + 15 * 60 * 1000)
      },
      {
        title: 'Task due in 30 minutes',
        deadline: new Date(now.getTime() + 30 * 60 * 1000)
      },
      {
        title: 'Task due in 45 minutes',
        deadline: new Date(now.getTime() + 45 * 60 * 1000)
      },
      {
        title: 'Task due in 2 hours',
        deadline: new Date(now.getTime() + 120 * 60 * 1000)
      }
    ];

    // Delete old test tasks
    await pool.query(
      "DELETE FROM tasks WHERE user_id = $1 AND title LIKE 'Task due in%'",
      [user.id]
    );

    for (const task of testTasks) {
      await pool.query(
        `INSERT INTO tasks (user_id, title, deadline_at, estimated_minutes, status)
         VALUES ($1, $2, $3, 30, 'todo')`,
        [user.id, task.title, task.deadline]
      );
      console.log(`   ✓ Created: ${task.title} (${task.deadline.toLocaleTimeString()})`);
    }

    // 4. Check which tasks should trigger reminders
    console.log('\n🔍 Checking which tasks should trigger reminders...');
    console.log(`   Current time: ${now.toLocaleTimeString()}`);
    console.log(`   Reminder window: ${prefs.reminder_time_minutes} minutes\n`);

    const tasksInWindow = await pool.query(
      `SELECT t.*, 
              EXTRACT(EPOCH FROM (t.deadline_at - NOW())) / 60 as minutes_until_deadline
       FROM tasks t
       JOIN notification_preferences np ON t.user_id = np.user_id
       WHERE t.user_id = $1
         AND t.deadline_at BETWEEN NOW() 
             AND NOW() + (np.reminder_time_minutes || ' minutes')::INTERVAL
         AND t.status = 'todo'
         AND np.task_reminders = TRUE
       ORDER BY t.deadline_at ASC`,
      [user.id]
    );

    if (tasksInWindow.rows.length > 0) {
      console.log(`📬 ${tasksInWindow.rows.length} tasks within reminder window:`);
      for (const task of tasksInWindow.rows) {
        const mins = Math.round(task.minutes_until_deadline);
        console.log(`   📋 "${task.title}" - Due in ${mins} minutes`);
      }
    } else {
      console.log('✓ No tasks within reminder window');
    }

    // 5. Check for duplicate prevention
    console.log('\n🔒 Checking duplicate prevention...');
    const recentNotifications = await pool.query(
      `SELECT n.*, t.title as task_title,
              EXTRACT(EPOCH FROM (NOW() - n.created_at)) / 60 as minutes_ago
       FROM notifications n
       LEFT JOIN tasks t ON n.related_task_id = t.id
       WHERE n.user_id = $1
         AND n.type = 'task_reminder'
         AND n.created_at > NOW() - INTERVAL '1 hour'
       ORDER BY n.created_at DESC`,
      [user.id]
    );

    if (recentNotifications.rows.length > 0) {
      console.log(`🔔 Recent notifications (last hour):`);
      for (const notif of recentNotifications.rows) {
        const minsAgo = Math.round(notif.minutes_ago);
        console.log(`   ⏰ "${notif.task_title}" - ${minsAgo} minutes ago`);
      }
    } else {
      console.log('✓ No recent notifications found (good for testing)');
    }

    // 6. Trigger the scheduler manually
    console.log('\n🚀 Triggering notification check...\n');
    await triggerUpcomingCheck();

    // 7. Check what notifications were sent
    console.log('\n📊 Checking sent notifications...');
    const newNotifications = await pool.query(
      `SELECT n.*, t.title as task_title,
              EXTRACT(EPOCH FROM (NOW() - n.created_at)) as seconds_ago
       FROM notifications n
       LEFT JOIN tasks t ON n.related_task_id = t.id
       WHERE n.user_id = $1
         AND n.type = 'task_reminder'
         AND n.created_at > NOW() - INTERVAL '1 minute'
       ORDER BY n.created_at DESC`,
      [user.id]
    );

    if (newNotifications.rows.length > 0) {
      console.log(`✅ ${newNotifications.rows.length} notification(s) sent:`);
      for (const notif of newNotifications.rows) {
        console.log(`   🔔 ${notif.title}`);
        console.log(`      Message: ${notif.message}`);
        console.log(`      Task: ${notif.task_title}`);
        console.log(`      Sent via Email: ${notif.sent_via_email ? 'Yes' : 'No'}`);
        console.log(`      Sent via Push: ${notif.sent_via_push ? 'Yes' : 'No'}`);
      }
    } else {
      console.log('ℹ️  No new notifications sent (might be duplicate prevention)');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Summary:');
    console.log(`   - Reminder timing: ${prefs.reminder_time_minutes} minutes`);
    console.log(`   - Tasks in window: ${tasksInWindow.rows.length}`);
    console.log(`   - Notifications sent: ${newNotifications.rows.length}`);
    console.log(`   - Duplicate prevention: ${recentNotifications.rows.length > 0 ? 'Active' : 'None needed'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testReminderTiming();
