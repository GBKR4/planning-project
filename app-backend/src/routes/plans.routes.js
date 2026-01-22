import { Router } from 'express';
import { addDailyPlan, addPlanBlock, generatePlan, getPlan, markBlockDone, markBlockMissed } from '../controllers/plans.controller.js';
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post('/api/plans',authMiddleware,addDailyPlan);
router.post('/api/plans/generate',authMiddleware,generatePlan);
router.get('/api/plans',authMiddleware,getPlan);
router.post('/api/plans/blockplan',authMiddleware,addPlanBlock);
router.post("/api/plans/blocks/:blockId/done", authMiddleware, markBlockDone);
router.post("/api/plans/blocks/:blockId/missed", authMiddleware, markBlockMissed);

export default router;