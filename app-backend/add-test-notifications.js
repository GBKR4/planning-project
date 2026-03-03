import pool from './src/db/pool.js';

(async () => {
  try {
    // Get a user from the database
    console.log('📋 Fetching user account...\n');
    const userResult = await pool.query('SELECT id, name, email, created_at FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('✅ User Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:      ', user.id);
    console.log('Name:    ', user.name);
    console.log('Email:   ', user.email);
    console.log('Created: ', user.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check for existing tasks to reference
    const taskResult = await pool.query('SELECT id, title FROM tasks WHERE user_id = $1 LIMIT 2', [user.id]);
    const taskId = taskResult.rows.length > 0 ? taskResult.rows[0].id : null;

    console.log('📢 Creating test notifications...\n');

    // Create various types of notifications
    const notifications = [
      {
        title: '⏰ Task Reminder',
        message: taskResult.rows.length > 0 
          ? `Your task "${taskResult.rows[0].title}" is due in 30 minutes!` 
          : 'You have a task due in 30 minutes!',
        type: 'task_reminder',
        priority: 'high',
        related_id: taskId,
        related_type: 'task'
      },
      {
        title: '🚨 Overdue Task Alert',
        message: taskResult.rows.length > 1 
          ? `Task "${taskResult.rows[1].title}" is now overdue. Please complete it as soon as possible.` 
          : 'You have an overdue task. Please complete it as soon as possible.',
        type: 'overdue_task',
        priority: 'high',
        related_id: taskResult.rows.length > 1 ? taskResult.rows[1].id : null,
        related_type: 'task'
      },
      {
        title: '📅 Daily Plan Created',
        message: 'Your daily plan for today has been created with 5 tasks scheduled.',
        type: 'plan_created',
        priority: 'medium',
        related_id: null,
        related_type: 'plan'
      },
      {
        title: '⚠️ Schedule Conflict Detected',
        message: 'There is a scheduling conflict between your task and a busy block at 2:00 PM.',
        type: 'schedule_conflict',
        priority: 'medium',
        related_id: null,
        related_type: null
      },
      {
        title: '✅ Task Completion Reminder',
        message: 'Great job! You\'ve completed 3 tasks today. Keep up the good work!',
        type: 'task_reminder',
        priority: 'low',
        related_id: null,
        related_type: null
      },
      {
        title: '🎯 Weekly Goal Update',
        message: 'You\'re 80% towards your weekly goal! Just 2 more tasks to complete.',
        type: 'plan_created',
        priority: 'low',
        related_id: null,
        related_type: null
      }
    ];

    let createdCount = 0;
    for (const notif of notifications) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, priority, related_id, related_type, read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [user.id, notif.title, notif.message, notif.type, notif.priority, notif.related_id, notif.related_type, false]
      );
      console.log(`✅ Created: ${notif.title}`);
      createdCount++;
    }

    console.log(`\n🎉 Successfully created ${createdCount} notifications!\n`);

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
