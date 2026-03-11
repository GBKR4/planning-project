import express from "express"; 
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import plansRoutes from "./routes/plans.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import usersRoutes from "./routes/users.routes.js";
import busyBlocksRoutes from "./routes/busyBlocks.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import cookieParser from "cookie-parser";
import pool from './db/pool.js';
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy if we are behind a load balancer (e.g. AWS, Heroku, DigitalOcean)
app.set("trust proxy", 1);

// HTTP Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Security middleware
app.use(helmet());

// Dynamic CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

// Rate limiting (skip when DISABLE_RATE_LIMIT=true, e.g. for k6 load testing)
if (process.env.DISABLE_RATE_LIMIT !== 'true') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
  });
  app.use(limiter);
}

app.use(cookieParser());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));        

app.use("/", authRoutes);
app.use("/", plansRoutes);
app.use("/", tasksRoutes);
app.use("/",usersRoutes);
app.use("/",busyBlocksRoutes);
app.use("/", notificationsRoutes);
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ db: "ok", time: result.rows[0].now });
  } catch (error) {
    logger.error("Health check failed: " + error.message);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// Error handling middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

export default app;
