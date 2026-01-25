import pkg from "pg";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

const { Pool } = pkg;

// Get all config values before creating pool
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'planning-project',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(config);

pool.on("error", (err) => {
  console.error("Database connection error:", err.message);
  console.error("Please ensure PostgreSQL is running and credentials are correct");
  // Don't exit - let the app handle errors
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Server will run but database operations will fail');
  } else {
    console.log('✅ Database connected successfully');
  }
});

export default pool;