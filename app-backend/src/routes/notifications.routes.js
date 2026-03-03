import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Public endpoint (no auth required)
router.get('/api/notifications/vapid-public-key', notificationsController.getVapidPublicKey);

// Protected endpoints (auth required)
router.get('/api/notifications', authMiddleware, notificationsController.getNotifications);
router.get('/api/notifications/unread', authMiddleware, notificationsController.getUnreadCount);
router.patch('/api/notifications/:id/read', authMiddleware, notificationsController.markAsRead);
router.patch('/api/notifications/read-all', authMiddleware, notificationsController.markAllAsRead);
router.delete('/api/notifications/:id', authMiddleware, notificationsController.deleteNotification);
router.get('/api/notifications/preferences', authMiddleware, notificationsController.getPreferences);
router.put('/api/notifications/preferences', authMiddleware, notificationsController.updatePreferences);
router.post('/api/notifications/subscribe', authMiddleware, notificationsController.subscribePush);
router.delete('/api/notifications/unsubscribe', authMiddleware, notificationsController.unsubscribePush);

export default router;