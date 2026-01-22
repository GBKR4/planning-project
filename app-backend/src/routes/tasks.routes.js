import { Router } from 'express';
import { addTask,getTasks,getTaskById,deleteTask,updateTask } from '../controllers/tasks.controller.js';
import authMiddleware from "../middleware/auth.js"

const router = Router();

router.get('/api/tasks',authMiddleware,getTasks);
router.post('/api/tasks',authMiddleware,addTask);
router.get('/api/tasks/:id',authMiddleware,getTaskById);
router.patch('/api/tasks/:id',authMiddleware,updateTask);
router.delete('/api/tasks/:id',authMiddleware,deleteTask);

export default router;