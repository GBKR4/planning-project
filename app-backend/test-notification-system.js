import pool from './src/db/pool.js';
import jwt from 'jsonwebtoken';

(async () => {
  try {
    // Get user with notifications
    console.log('🔍 Checking notification system...\n');
    
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      ['gbkr2458@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      await pool.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('✅ User:', user.name, `(${user.email})`);

    // Count notifications
    const notifResult = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread FROM notifications WHERE user_id = $1',
      [user.id]
    );

    console.log('📊 Database notifications:', notifResult.rows[0].total, 'total,', notifResult.rows[0].unread, 'unread\n');

    // Generate a test token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated test token\n');

    // Test API endpoint
    console.log('🧪 Testing API endpoints...\n');

    // Test unread count endpoint
    try {
      const response = await fetch('http://localhost:5000/api/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ GET /api/notifications/unread');
        console.log('   Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ GET /api/notifications/unread - Status:', response.status);
        console.log('   Error:', errorText);
      }
    } catch (error) {
      console.log('❌ API Request Failed:', error.message);
    }

    console.log('\n');

    // Test get notifications endpoint
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ GET /api/notifications');
        console.log('   Found:', data.notifications?.length || 0, 'notifications');
        if (data.notifications && data.notifications.length > 0) {
          console.log('   First notification:', data.notifications[0].title);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ GET /api/notifications - Status:', response.status);
        console.log('   Error:', errorText);
      }
    } catch (error) {
      console.log('❌ API Request Failed:', error.message);
    }

    console.log('\n' + '━'.repeat(60));
    console.log('\n📝 Summary:');
    console.log('1. User exists in database: ✅');
    console.log(`2. Notifications in database: ${notifResult.rows[0].total > 0 ? '✅' : '❌'}`);
    console.log('3. Check API responses above');
    console.log('\n💡 Next steps:');
    console.log('- Log in to the app with: gbkr2458@gmail.com');
    console.log('- Open browser DevTools (F12)');
    console.log('- Check Console tab for errors');
    console.log('- Check Network tab for failed API calls');
    console.log('- Make sure you see notifications in the bell icon\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
})();
