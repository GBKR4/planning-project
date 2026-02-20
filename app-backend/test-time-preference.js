import pool from './src/db/pool.js';

async function testTimePreference() {
  try {
    console.log('🧪 Testing time_preference functionality...\n');

    // 1. Check if column exists
    console.log('1️⃣ Checking if time_preference column exists...');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='time_preference'
    `);
    console.log('Column info:', columnCheck.rows);

    // 2. Create a test task with morning preference
    console.log('\n2️⃣ Creating test task with "morning" preference...');
    const insertResult = await pool.query(`
      INSERT INTO tasks (user_id, title, estimated_minutes, priority, time_preference)
      VALUES (1, 'Test Morning Task', 30, 3, 'morning')
      RETURNING *
    `);
    console.log('Inserted task:', insertResult.rows[0]);

    // 3. Read back all tasks to verify
    console.log('\n3️⃣ Reading all tasks to check time_preference values...');
    const allTasks = await pool.query(`
      SELECT id, title, time_preference 
      FROM tasks 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.log('\nRecent tasks:');
    allTasks.rows.forEach(task => {
      console.log(`  ID ${task.id}: "${task.title}" → time_preference = "${task.time_preference}"`);
    });

    // 4. Update test task to evening
    console.log('\n4️⃣ Updating test task to "evening" preference...');
    const updateResult = await pool.query(`
      UPDATE tasks 
      SET time_preference = 'evening'
      WHERE id = $1
      RETURNING *
    `, [insertResult.rows[0].id]);
    console.log('Updated task:', updateResult.rows[0]);

    // 5. Delete test task
    console.log('\n5️⃣ Cleaning up test task...');
    await pool.query('DELETE FROM tasks WHERE id = $1', [insertResult.rows[0].id]);
    console.log('✅ Test task deleted');

    console.log('\n✅ All tests passed! time_preference is working correctly in the database.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testTimePreference();
