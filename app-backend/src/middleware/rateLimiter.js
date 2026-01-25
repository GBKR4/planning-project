import rateLimit from "express-rate-limit";

export const loginLimiter  = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for development
  message: {
    status: 429,
    message: "Too many login attempts from this IP, please try again after 15 minutes"
  }
});

export const resetLimiter  = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Increased for development
  message: {
    status: 429,
    message: "Too many login attempts from this IP, please try again after 5 minutes"
  }
});

export const forgotLimiter  = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Increased for development
  message: {
    status: 429,
    message: "Too many login attempts from this IP, please try again after 10 minutes"
  }
});