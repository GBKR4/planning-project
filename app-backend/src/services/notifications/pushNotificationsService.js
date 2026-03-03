import pool from '../../db/pool.js';
import webpush from 'web-push';

// Configure web-push with VAPID keys from environment
const vapidDetails = {
  subject: process.env.VAPID_EMAIL || 'mailto:admin@example.com',
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// Set VAPID details only if keys are provided
if (vapidDetails.publicKey && vapidDetails.privateKey) {
  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
}

// Save a push subscription to the database
export const savePushSubscription = async (userId, subscription) => {
  const { endpoint, keys } = subscription;
  
  try {
    const result = await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = $1, p256dh_key = $3, auth_key = $4
       RETURNING *`,
      [userId, endpoint, keys.p256dh, keys.auth]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
};

// Remove a push subscription from the database
export const removePushSubscription = async (userId, endpoint = null) => {
  try {
    const query = endpoint
      ? 'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2'
      : 'DELETE FROM push_subscriptions WHERE user_id = $1';
    
    const params = endpoint ? [userId, endpoint] : [userId];
    
    const result = await pool.query(query, params);
    return result.rowCount;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    throw error;
  }
};

// Get all active push subscriptions for a user
export const getActiveSubscriptions = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    return [];
  }
};

// Get all push subscriptions for multiple users
export const getSubscriptionsForUsers = async (userIds) => {
  try {
    const result = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = ANY($1)',
      [userIds]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching subscriptions for users:', error);
    return [];
  }
};

// Send push notification to a single subscription
export const sendPushToSubscription = async (subscription, payload) => {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh_key,
      auth: subscription.auth_key
    }
  };
  
  const options = {
    TTL: 3600, // Time-to-live in seconds (1 hour)
    urgency: 'normal'
  };
  
  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      options
    );
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // If subscription is no longer valid, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription expired or invalid. Removing from database.');
      await pool.query(
        'DELETE FROM push_subscriptions WHERE endpoint = $1',
        [subscription.endpoint]
      );
    }
    
    return { success: false, error: error.message };
  }
};

// Send push notification to a specific user
export const sendPushNotification = async (userId, notification) => {
  const { title, message, data = {} } = notification;
  
  try {
    // Get all subscriptions for the user
    const subscriptions = await getActiveSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }
    
    // Prepare payload
    const payload = {
      title,
      body: message,
      icon: '/icon.png', // You can customize this
      badge: '/badge.png',
      data: {
        ...data,
        url: data.relatedTaskId 
          ? `/tasks/${data.relatedTaskId}` 
          : '/notifications',
        timestamp: Date.now()
      },
      requireInteraction: false,
      tag: data.type || 'notification'
    };
    
    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushToSubscription(sub, payload))
    );
    
    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;
    
    console.log(`Push notification sent to user ${userId}: ${sent} success, ${failed} failed`);
    
    return { sent, failed };
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    throw error;
  }
};

// Send push notification to multiple users
export const sendPushToMultipleUsers = async (userIds, notification) => {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, notification))
  );
  
  const summary = results.reduce((acc, result) => {
    if (result.status === 'fulfilled') {
      acc.sent += result.value.sent;
      acc.failed += result.value.failed;
    } else {
      acc.errors.push(result.reason);
    }
    return acc;
  }, { sent: 0, failed: 0, errors: [] });
  
  console.log(`Bulk push notification: ${summary.sent} sent, ${summary.failed} failed`);
  
  return summary;
};

// Broadcast push notification to all users
export const broadcastPushNotification = async (notification) => {
  try {
    const result = await pool.query('SELECT DISTINCT user_id FROM push_subscriptions');
    const userIds = result.rows.map(row => row.user_id);
    
    return await sendPushToMultipleUsers(userIds, notification);
  } catch (error) {
    console.error('Error broadcasting push notification:', error);
    throw error;
  }
};

// Test push notification (useful for debugging)
export const testPushNotification = async (userId) => {
  return await sendPushNotification(userId, {
    title: '🔔 Test Notification',
    message: 'This is a test push notification from your Planning App!',
    data: {
      type: 'test',
      timestamp: Date.now()
    }
  });
};

