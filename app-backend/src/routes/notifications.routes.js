import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/api/notifications', authenticateToken, notificationsController.getNotifications);
router.get('/api/notifications/unread', authenticateToken, notificationsController.getUnreadCount);
router.patch('/api/notifications/:id/read', authenticateToken, notificationsController.markAsRead);
router.patch('/api/notifications/read-all', authenticateToken, notificationsController.markAllAsRead);
router.get('/api/notifications/preferences', authenticateToken, notificationsController.getPreferences);
router.delete('/api/notifications/:id', authenticateToken, notificationsController.deleteNotification);
router.get('/api/preferences', authenticateToken, notificationsController.getPreferences);
router.put('/api/preferences', authenticateToken, notificationsController.updatePreferences);
router.post('/api/notifications/subscribe', authenticateToken, notificationsController.subscribePush);
router.delete('/api/notifications/unsubscribe', authenticateToken, notificationsController.unsubscribePush);