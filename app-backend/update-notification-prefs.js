import pool from './src/db/pool.js';

async function updateNotificationPreferences() {
  try {
    // Update user's reminder preference to 5 minutes
    await pool.query(
      'UPDATE notification_preferences SET reminder_time_minutes = $1 WHERE user_id = $2',
      [5, 1]
    );

    console.log('✅ Updated notification preferences:');
    console.log('   Reminder time: 5 minutes before task starts');
    console.log('   This ensures consistent 5-minute warnings for all tasks');

    const prefs = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [1]
    );

    console.log('\n📋 Current preferences:');
    console.log(prefs.rows[0]);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateNotificationPreferences();
