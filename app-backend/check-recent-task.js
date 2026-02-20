import pool from './src/db/pool.js';

async function checkRecentTask() {
  try {
    const result = await pool.query(`
      SELECT id, title, time_preference, created_at
      FROM tasks
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    console.log('Most recently created task:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecentTask();
