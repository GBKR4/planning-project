import pool from './src/db/pool.js';

(async () => {
  try {
    const targetEmail = 'gbkr2458@gmail.com';
    
    console.log('📋 Searching for user...\n');
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE email = $1',
      [targetEmail]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found with email: ${targetEmail}`);
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ User Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:      ', user.id);
    console.log('Name:    ', user.name);
    console.log('Email:   ', user.email);
    console.log('Created: ', user.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const notifications = [
      {
        title: '⏰ Task Reminder',
        message: 'Your important meeting is coming up in 30 minutes!',
        type: 'task_reminder',
        priority: 'high'
      },
      {
        title: '🚨 Overdue Task Alert',
        message: 'You have 2 overdue tasks that need immediate attention.',
        type: 'overdue_task',
        priority: 'high'
      },
      {
        title: '📅 Daily Plan Created',
        message: 'Your daily plan for March 3, 2026 has been created with 4 tasks scheduled.',
        type: 'plan_created',
        priority: 'medium'
      },
      {
        title: '⚠️ Schedule Conflict Detected',
        message: 'Task scheduling conflict detected at 3:00 PM today.',
        type: 'schedule_conflict',
        priority: 'medium'
      },
      {
        title: '✅ Great Progress!',
        message: 'You have completed 5 tasks this week. Keep up the excellent work!',
        type: 'task_reminder',
        priority: 'low'
      },
      {
        title: '🎯 Weekly Summary',
        message: 'Weekly summary: 8 tasks completed, 3 pending, 1 overdue.',
        type: 'plan_created',
        priority: 'low'
      }
    ];

    console.log('📢 Creating test notifications...\n');

    for (const notif of notifications) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, priority, read)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, notif.title, notif.message, notif.type, notif.priority, false]
      );
      console.log(`✅ Created: ${notif.title}`);
    }

    console.log(`\n🎉 Successfully created ${notifications.length} notifications!\n`);

    // Fetch and display the created notifications
    const notificationsResult = await pool.query(
      `SELECT id, title, message, type, priority, read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [user.id]
    );

    console.log('📬 Recent Notifications:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    notificationsResult.rows.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.title}`);
      console.log(`   Type: ${notif.type} | Priority: ${notif.priority} | Read: ${notif.read ? '✓' : '✗'}`);
      console.log(`   ${notif.message}`);
      console.log(`   Created: ${notif.created_at}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Count unread notifications
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [user.id]
    );
    console.log(`\n📊 Unread notifications: ${unreadResult.rows[0].count}`);

    await pool.end();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
