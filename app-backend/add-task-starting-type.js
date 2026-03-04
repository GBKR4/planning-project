import pool from './src/db/pool.js';
import dotenv from 'dotenv';

dotenv.config();

async function addTaskStartingType() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Adding task_starting notification type');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Drop the existing constraint if it exists
    console.log('📋 Dropping old constraint...');
    await pool.query(`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS notifications_type_check;
    `);
    console.log('✅ Dropped old constraint');

    // Add new constraint with task_starting type
    console.log('📋 Adding new constraint with task_starting...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK (type IN (
        'task_reminder', 
        'task_starting',
        'overdue_task', 
        'plan_created', 
        'schedule_conflict', 
        'task_completed', 
        'busy_block_added',
        'daily_summary'
      ));
    `);
    console.log('✅ Added new constraint');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Successfully added task_starting type!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addTaskStartingType();
