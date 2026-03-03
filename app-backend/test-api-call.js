import pool from './src/db/pool.js';
import jwt from 'jsonwebtoken';

(async () => {
  try {
    // Get user
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', ['gbkr2458@gmail.com']);
    const user = userResult.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Testing with User ID:', user.id);
    console.log('📧 Email:', user.email);
    console.log('\n📡 Making API request to /api/notifications...\n');
    
    // Make API call
    const response = await fetch('http://localhost:5000/api/notifications?limit=50&offset=0', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log('Notifications:', data.notifications?.length || 0);
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
