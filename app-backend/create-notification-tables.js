import pool from './src/db/pool.js';
import fs from 'fs';

(async () => {
  try {
    console.log('📋 Creating notification tables...\n');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('task_reminder', 'overdue_task', 'plan_created', 'schedule_conflict', 'task_completed', 'busy_block_added')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        read BOOLEAN DEFAULT false,
        related_id INTEGER,
        related_type VARCHAR(50),
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created notifications table');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `);
    console.log('✅ Created indexes on notifications table');

    // Create notification_preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        email_enabled BOOLEAN DEFAULT true,
        push_enabled BOOLEAN DEFAULT false,
        task_reminders BOOLEAN DEFAULT true,
        overdue_alerts BOOLEAN DEFAULT true,
        plan_updates BOOLEAN DEFAULT true,
        schedule_conflicts BOOLEAN DEFAULT true,
        reminder_time_minutes INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created notification_preferences table');

    // Create push_subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh_key TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created push_subscriptions table');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
    `);
    console.log('✅ Created indexes on push_subscriptions table');

    console.log('\n🎉 All notification tables created successfully!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
