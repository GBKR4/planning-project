import { Router } from 'express';
import { getUsers, deleteUser, getUserById, getMe, updateProfile, changePassword, deleteAccount, uploadProfilePhoto, deleteProfilePhoto } from "../controllers/users.controller.js";
import authMiddleware from "../middleware/auth.js";
import { uploadProfilePhoto as upload } from "../middleware/upload.js";

const router = Router();

router.get('/users', authMiddleware, getUsers);
router.get('/users/:id', authMiddleware, getUserById);
router.delete("/users/:id", authMiddleware, deleteUser);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);
router.post("/me/delete", authMiddleware, deleteAccount);
router.post("/profile/photo", authMiddleware, upload.single('photo'), uploadProfilePhoto);
router.delete("/profile/photo", authMiddleware, deleteProfilePhoto);

export default router;