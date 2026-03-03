import pool from './src/db/pool.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateNotificationsSchema() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Updating notifications table schema');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Add new columns if they don't exist
    console.log('📋 Adding related_task_id column...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS related_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added related_task_id column');

    console.log('📋 Adding related_plan_id column...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS related_plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added related_plan_id column');

    console.log('📋 Adding sent_via_email column...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS sent_via_email BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added sent_via_email column');

    console.log('📋 Adding sent_via_push column...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS sent_via_push BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added sent_via_push column');

    // Create index for faster queries
    console.log('📋 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_related_task 
      ON notifications(related_task_id) WHERE related_task_id IS NOT NULL;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_type_user 
      ON notifications(user_id, type, created_at DESC);
    `);
    console.log('✅ Created indexes');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Schema update completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

updateNotificationsSchema();
