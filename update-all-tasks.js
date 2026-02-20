import pool from './app-backend/src/db/pool.js';

async function updateAllTasksToMorning() {
  try {
    console.log('Updating all tasks to have "morning" preference...\n');
    
    const result = await pool.query(`
      UPDATE tasks 
      SET time_preference = 'morning'
      WHERE time_preference = 'anytime'
      RETURNING id, title, time_preference
    `);
    
    console.log(`✅ Updated ${result.rowCount} tasks:`);
    result.rows.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" → ${task.time_preference}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating tasks:', error.message);
  } finally {
    await pool.end();
  }
}

updateAllTasksToMorning();
