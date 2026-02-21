import { Router } from 'express';
import { getUsers, deleteUser, getUserById, getMe, updateProfile, changePassword, deleteAccount, uploadProfilePhoto, deleteProfilePhoto } from "../controllers/users.controller.js";
import authMiddleware from "../middleware/auth.js";
import { uploadProfilePhoto as upload } from "../middleware/upload.js";

const router = Router();

router.get('/api/users', authMiddleware, getUsers);
router.get('/api/users/:id', authMiddleware, getUserById);
router.delete("/api/users/:id", authMiddleware, deleteUser);
router.get("/api/me", authMiddleware, getMe);
router.put("/api/profile", authMiddleware, updateProfile);
router.post("/api/change-password", authMiddleware, changePassword);
router.post("/api/me/delete", authMiddleware, deleteAccount);
router.post("/api/profile/photo", authMiddleware, upload.single('photo'), uploadProfilePhoto);
router.delete("/api/profile/photo", authMiddleware, deleteProfilePhoto);

export default router;