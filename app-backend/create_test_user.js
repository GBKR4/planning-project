import pool from './src/db/pool.js';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, email_verified) 
       VALUES ('Load Test User', 'test-load@example.com', $1, true) 
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = $1, email_verified = true`,
      [hash]
    );
    console.log('Test user created or updated successfully');
  } catch (err) {
    console.error('Failed to create test user:', err);
  } finally {
    process.exit(0);
  }
}

createTestUser();
