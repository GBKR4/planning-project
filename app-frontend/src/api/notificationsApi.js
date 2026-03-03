import client from './client';

// Get all notifications
export const getNotifications = async (params = {}) => {
  const { limit = 50, offset = 0 } = params;
  const response = await client.get(`/api/notifications?limit=${limit}&offset=${offset}`);
  return response.data;
};

// Get unread notification count
export const getUnreadCount = async () => {
  const response = await client.get('/api/notifications/unread');
  return response.data;
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  const response = await client.patch(`/api/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await client.patch('/api/notifications/read-all');
  return response.data;
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  const response = await client.delete(`/api/notifications/${notificationId}`);
  return response.data;
};

// Get notification preferences
export const getPreferences = async () => {
  const response = await client.get('/api/notifications/preferences');
  return response.data;
};

// Update notification preferences
export const updatePreferences = async (preferences) => {
  const response = await client.put('/api/notifications/preferences', preferences);
  return response.data;
};

// Subscribe to push notifications
export const subscribePush = async (subscription) => {
  const response = await client.post('/api/notifications/subscribe', subscription);
  return response.data;
};

// Unsubscribe from push notifications
export const unsubscribePush = async (endpoint = null) => {
  const response = await client.delete('/api/notifications/unsubscribe', {
    data: { endpoint }
  });
  return response.data;
};

// Get VAPID public key for push subscription
export const getVapidPublicKey = async () => {
  const response = await client.get('/api/notifications/vapid-public-key');
  return response.data;
};
