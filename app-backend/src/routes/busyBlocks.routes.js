import { Router } from 'express';
import { addBusyBlock, getBusyBlocks, deleteBusyBlock } from '../controllers/busyBlocks.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post("/busyblocks",authMiddleware,addBusyBlock);
router.get("/busyblocks",authMiddleware,getBusyBlocks);
router.delete("/busyblocks/:id",authMiddleware,deleteBusyBlock);

export default router;