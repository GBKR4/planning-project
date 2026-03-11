import rateLimit from "express-rate-limit";

// When DISABLE_RATE_LIMIT=true (e.g. for k6 load testing), all limiters are no-ops
const disabled = process.env.DISABLE_RATE_LIMIT === 'true';

const noopMiddleware = (_req, _res, next) => next();

export const loginLimiter = disabled
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 10 : 100,
      message: {
        status: 429,
        message: "Too many login attempts from this IP, please try again after 15 minutes",
        success: false
      }
    });

export const resetLimiter = disabled
  ? noopMiddleware
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 5 : 50,
      message: {
        status: 429,
        message: "Too many reset attempts from this IP, please try again after 1 hour",
        success: false
      }
    });

export const forgotLimiter = disabled
  ? noopMiddleware
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 5 : 50,
      message: {
        status: 429,
        message: "Too many forgot password attempts from this IP, please try again after 1 hour",
        success: false
      }
    });
