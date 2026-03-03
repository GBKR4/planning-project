import pool from './src/db/pool.js';

(async () => {
  try {
    console.log('\n🔍 NOTIFICATION SYSTEM DEBUG\n');
    console.log('━'.repeat(60));
    
    // Check database connection
    console.log('\n1️⃣ Checking Database...');
    const dbTest = await pool.query('SELECT NOW()');
    console.log('   ✅ Database connected');
    
    // Check users
    console.log('\n2️⃣ Checking Users...');
    const users = await pool.query('SELECT id, name, email FROM users LIMIT 5');
    console.log(`   Found ${users.rows.length} users:`);
    users.rows.forEach(u => console.log(`   - ID ${u.id}: ${u.name} (${u.email})`));
    
    // Check notifications
    console.log('\n3️⃣ Checking Notifications...');
    const notifs = await pool.query(`
      SELECT user_id, COUNT(*) as total, 
             SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread
      FROM notifications 
      GROUP BY user_id
    `);
    console.log('   Notifications per user:');
    notifs.rows.forEach(n => console.log(`   - User ${n.user_id}: ${n.total} total, ${n.unread} unread`));
    
    // Check table structure
    console.log('\n4️⃣ Checking Table Structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    console.log('   Notifications table columns:');
    columns.rows.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
    
    // Sample notification
    console.log('\n5️⃣ Sample Notification Data...');
    const sample = await pool.query('SELECT * FROM notifications LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('   Sample notification:');
      Object.entries(sample.rows[0]).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });
    }
    
    console.log('\n━'.repeat(60));
    console.log('\n✅ Database check complete!\n');
    console.log('📋 Next steps:');
    console.log('1. Make sure backend server is running on port 5000');
    console.log('2. Make sure frontend server is running on port 3001');
    console.log('3. Open browser to http://localhost:3001');
    console.log('4. Open DevTools (F12) and check Console tab');
    console.log('5. Look for these specific errors:');
    console.log('   - "useNotifications is not a function"');
    console.log('   - "Cannot read properties of undefined"');
    console.log('   - Network errors (401, 404, 500)');
    console.log('\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
})();
