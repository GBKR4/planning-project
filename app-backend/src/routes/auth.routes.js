import { Router } from 'express'
import { Register, Login, forgotPassword, Logout } from '../controllers/auth.controller.js';
import authMiddleware from "../middleware/auth.js";
import { resetPassword } from "../services/auth/passwordReset.js";
import { verifyEmail, resendVerificationEmail } from '../services/auth/emailVerification.js';
import { refreshToken } from '../services/auth/refreshToken.js';
import { forgotLimiter, resetLimiter, loginLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post('/auth/register', Register);
router.get('/auth/verifyemail', verifyEmail);
router.post('/auth/resend-verification', resendVerificationEmail);
router.post('/auth/login', loginLimiter, Login);
router.post('/auth/logout', authMiddleware, Logout);
router.post('/auth/refresh', refreshToken);
router.post("/auth/resetpassword", resetLimiter, resetPassword);
router.post("/auth/forgotpassword", forgotLimiter, forgotPassword);
router.get("/api/profile", authMiddleware, (req, res) => {
  res.json(req.user);
});

export default router;