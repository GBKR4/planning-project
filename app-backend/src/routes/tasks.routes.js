import { Router } from 'express';
import { addTask,getTasks,getTaskById,deleteTask,updateTask } from '../controllers/tasks.controller.js';
import authMiddleware from "../middleware/auth.js"

const router = Router();

router.get('/tasks',authMiddleware,getTasks);
router.post('/tasks',authMiddleware,addTask);
router.get('/tasks/:id',authMiddleware,getTaskById);
router.patch('/tasks/:id',authMiddleware,updateTask);
router.delete('/tasks/:id',authMiddleware,deleteTask);

export default router;