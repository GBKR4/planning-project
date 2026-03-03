import express from "express"; 
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import plansRoutes from "./routes/plans.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import usersRoutes from "./routes/users.routes.js"; 
import busyBlocksRoutes from "./routes/busyBlocks.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import cookieParser from "cookie-parser";
import pool from './db/pool.js';
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true
}));

// Rate limiting - Relaxed for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000 // limit each IP to 1000 requests per minute (very relaxed for dev)
});
app.use(limiter);

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
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// Error handling middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

export default app;