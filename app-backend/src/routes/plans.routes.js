import { Router } from 'express';
import { addDailyPlan, addPlanBlock, generatePlan, getPlan, markBlockDone, markBlockMissed } from '../controllers/plans.controller.js';
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post('/plans',authMiddleware,addDailyPlan);
router.post('/plans/generate',authMiddleware,generatePlan);
router.get('/plans',authMiddleware,getPlan);
router.post('/plans/blockplan',authMiddleware,addPlanBlock);
router.post("/plans/blocks/:blockId/done", authMiddleware, markBlockDone);
router.post("/plans/blocks/:blockId/missed", authMiddleware, markBlockMissed);

export default router;