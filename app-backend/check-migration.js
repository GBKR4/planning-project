import pool from './src/db/pool.js';

async function checkAndMigrate() {
  try {
    // Check if time_preference column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='time_preference'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('❌ time_preference column NOT found. Running migration...');
      
      await pool.query(`
        ALTER TABLE tasks 
        ADD COLUMN time_preference TEXT NOT NULL DEFAULT 'anytime' 
        CHECK (time_preference IN ('morning','evening','anytime'))
      `);
      
      console.log('✅ Migration completed! time_preference column added.');
    } else {
      console.log('✅ time_preference column already exists.');
    }

    // Test query to show tasks with time_preference
    const { rows } = await pool.query(`
      SELECT id, title, time_preference 
      FROM tasks 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample tasks:');
    rows.forEach(task => {
      console.log(`  - ${task.title}: ${task.time_preference}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndMigrate();
