import pool from './src/db/pool.js';

async function diagnoseNotificationTiming() {
  try {
    // Check user's notification preferences
    const prefs = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [1]
    );

    console.log('\n📋 User Notification Preferences:');
    console.log('  Reminder time:', prefs.rows[0].reminder_time_minutes, 'minutes before task');
    console.log('  Task reminders:', prefs.rows[0].task_reminders ? 'Enabled' : 'Disabled');

    // Check upcoming scheduled blocks
    const blocks = await pool.query(
      `SELECT pb.*, t.title, p.plan_date,
         EXTRACT(EPOCH FROM (pb.start_at - NOW())) / 60 as minutes_until_start
       FROM plan_blocks pb
       JOIN plans p ON pb.plan_id = p.id
       JOIN tasks t ON pb.task_id = t.id
       WHERE p.user_id = $1 
         AND pb.status = 'scheduled'
         AND pb.start_at >= NOW()
       ORDER BY pb.start_at`,
      [1]
    );

    console.log('\n⏰ Upcoming Scheduled Blocks:');
    const now = new Date();
    blocks.rows.forEach(block => {
      const startTime = new Date(block.start_at);
      const minutesUntil = Math.round(block.minutes_until_start);
      const shouldNotifyNow = minutesUntil <= prefs.rows[0].reminder_time_minutes && minutesUntil >= 0;
      
      console.log(`\n  📌 ${block.title}`);
      console.log(`     Start time: ${startTime.toLocaleTimeString()}`);
      console.log(`     Minutes until start: ${minutesUntil}`);
      console.log(`     Should notify now (within ${prefs.rows[0].reminder_time_minutes} min window): ${shouldNotifyNow ? '✅ YES' : '❌ NO'}`);
      
      // Calculate when notification SHOULD be sent (5 minutes before)
      const notificationTime = new Date(startTime.getTime() - 5 * 60 * 1000);
      const minutesUntilNotification = Math.round((notificationTime - now) / 60000);
      console.log(`     Notification should be sent at: ${notificationTime.toLocaleTimeString()} (in ${minutesUntilNotification} min)`);
    });

    // Check recent notifications
    const notifications = await pool.query(
      `SELECT n.*, t.title as task_title 
       FROM notifications n
       LEFT JOIN tasks t ON n.related_task_id = t.id
       WHERE n.user_id = $1 
         AND n.created_at > NOW() - INTERVAL '2 hours'
       ORDER BY n.created_at DESC`,
      [1]
    );

    console.log('\n\n📬 Recent Notifications (last 2 hours):');
    if (notifications.rows.length === 0) {
      console.log('  No notifications sent in last 2 hours');
    } else {
      notifications.rows.forEach(notif => {
        console.log(`\n  ${notif.type.toUpperCase()} | ${new Date(notif.created_at).toLocaleTimeString()}`);
        console.log(`     Task: ${notif.task_title || 'N/A'}`);
        console.log(`     Message: ${notif.message}`);
      });
    }

    console.log('\n\n🔍 PROBLEM DIAGNOSIS:');
    console.log('  Current behavior:');
    console.log('    - Notifications sent when tasks are within ' + prefs.rows[0].reminder_time_minutes + ' minutes');
    console.log('    - After clicking "missed", ALL rescheduled tasks within ' + prefs.rows[0].reminder_time_minutes + ' min get notified IMMEDIATELY');
    console.log('    - This causes "random" notifications instead of consistent 5-min warnings');
    console.log('\n  Expected behavior:');
    console.log('    - User wants notifications EXACTLY 5 minutes before task starts');
    console.log('    - Not immediately when plan regenerates');
    console.log('    - Consistent timing for all notifications');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnoseNotificationTiming();
