import { Router } from 'express';
import { addBusyBlock, getBusyBlocks, deleteBusyBlock } from '../controllers/busyBlocks.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post("/api/busyblocks",authMiddleware,addBusyBlock);
router.get("/api/busyblocks",authMiddleware,getBusyBlocks);
router.delete("/api/busyblocks/:id",authMiddleware,deleteBusyBlock);

export default router;