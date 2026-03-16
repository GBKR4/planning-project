import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Public endpoint (no auth required)
router.get('/notifications/vapid-public-key', notificationsController.getVapidPublicKey);

// Protected endpoints (auth required)
router.get('/notifications', authMiddleware, notificationsController.getNotifications);
router.get('/notifications/unread', authMiddleware, notificationsController.getUnreadCount);
router.get('/notifications/preferences', authMiddleware, notificationsController.getPreferences);
router.put('/notifications/preferences', authMiddleware, notificationsController.updatePreferences);
router.post('/notifications/subscribe', authMiddleware, notificationsController.subscribePush);
router.delete('/notifications/unsubscribe', authMiddleware, notificationsController.unsubscribePush);
router.patch('/notifications/read-all', authMiddleware, notificationsController.markAllAsRead);
router.patch('/notifications/:id/read', authMiddleware, notificationsController.markAsRead);
router.delete('/notifications/:id', authMiddleware, notificationsController.deleteNotification);

export default router;