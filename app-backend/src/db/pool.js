import pkg from "pg";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

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
  // PostgreSQL default max_connections=100; reserve ~10 for superuser/monitoring.
  // Formula: Math.min(configured, pgMaxConnections - 10)
  max: parseInt(process.env.DB_POOL_MAX || '90', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(config);

pool.on("error", (err) => {
  logger.error(`Database connection error: ${err.message}`, { stack: err.stack });
  logger.info("Please ensure PostgreSQL is running and credentials are correct");
  // Don't exit - let the app handle errors
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error(`Database connection failed: ${err.message}`);
    logger.warn('Server will run but database operations will fail');
  } else {
    logger.info('Database connected successfully');
  }
});

export default pool;
