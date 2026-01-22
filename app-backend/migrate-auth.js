import dotenv from 'dotenv';
import pool from './src/db/pool.js';
import fs from 'fs';

dotenv.config();

const runMigration = async () => {
  try {
    console.log('🔄 Running database migration for auth columns...');
    
    const sql = fs.readFileSync('./setup-auth-columns.sql', 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Auth columns added:');
    console.log('  - email_verified');
    console.log('  - verification_token_hash');
    console.log('  - verification_token_expires');
    console.log('  - reset_token_hash');
    console.log('  - reset_token_expires');
    console.log('');
    console.log('Tables created:');
    console.log('  - refresh_tokens');
    console.log('  - sessions');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
};

runMigration();
