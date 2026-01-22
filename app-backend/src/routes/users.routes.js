import { Router } from 'express';
import { getUsers,deleteUser,getUserById,getMe } from "../controllers/users.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.get('/api/users', authMiddleware, getUsers);
router.get('/api/users/:id', authMiddleware, getUserById);
router.delete("/api/users/:id", authMiddleware, deleteUser);
router.get("/api/me", authMiddleware, getMe);

export default router;