import pool from '../db/pool.js';

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        n.id, 
        n.type, 
        n.title,
        n.message, 
        n.read,
        n.related_task_id,
        n.related_plan_id,
        n.sent_via_email,
        n.sent_via_push,
        n.created_at,
        t.title as task_title
      FROM notifications n
      LEFT JOIN tasks t ON n.related_task_id = t.id
      WHERE n.user_id = $1 
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Get count of unread notifications
export const getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
    
    res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.rowCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Delete a single notification
export const deleteNotification = async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Get user notification preferences
export const getPreferences = async (req, res) => {
  const userId = req.user.id;
  
  try {
    let result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    // Create default preferences if none exist
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO notification_preferences (user_id) VALUES ($1)`,
        [userId]
      );
      
      result = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );
    }
    
    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Error fetching notification preferences' });
  }
};

// Update user notification preferences
export const updatePreferences = async (req, res) => {
  const userId = req.user.id;
  const { 
    email_enabled, 
    push_enabled, 
    task_reminders, 
    overdue_alerts, 
    plan_updates, 
    schedule_conflicts,
    reminder_time_minutes 
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO notification_preferences 
        (user_id, email_enabled, push_enabled, task_reminders, overdue_alerts, 
         plan_updates, schedule_conflicts, reminder_time_minutes, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        email_enabled = COALESCE($2, notification_preferences.email_enabled),
        push_enabled = COALESCE($3, notification_preferences.push_enabled),
        task_reminders = COALESCE($4, notification_preferences.task_reminders),
        overdue_alerts = COALESCE($5, notification_preferences.overdue_alerts),
        plan_updates = COALESCE($6, notification_preferences.plan_updates),
        schedule_conflicts = COALESCE($7, notification_preferences.schedule_conflicts),
        reminder_time_minutes = COALESCE($8, notification_preferences.reminder_time_minutes),
        updated_at = NOW()
      RETURNING *`,
      [userId, email_enabled, push_enabled, task_reminders, overdue_alerts, 
       plan_updates, schedule_conflicts, reminder_time_minutes]
    );
    
    res.json({ 
      message: 'Notification preferences updated',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Error updating notification preferences' });
  }
};

// Subscribe to push notifications
export const subscribePush = async (req, res) => {
  const userId = req.user.id;
  const { endpoint, keys } = req.body;
  
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ message: 'Invalid push subscription data' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO push_subscriptions 
        (user_id, endpoint, keys_p256dh, keys_auth, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (endpoint) 
      DO UPDATE SET 
        user_id = $1,
        keys_p256dh = $3,
        keys_auth = $4,
        user_agent = $5
      RETURNING *`,
      [userId, endpoint, keys.p256dh, keys.auth, req.headers['user-agent'] || null]
    );
    
    res.json({ 
      message: 'Push subscription saved',
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Error saving push subscription' });
  }
};

// Unsubscribe from push notifications
export const unsubscribePush = async (req, res) => {
  const userId = req.user.id;
  const { endpoint } = req.body;
  
  try {
    const result = await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND (endpoint = $2 OR $2 IS NULL)',
      [userId, endpoint || null]
    );
    
    res.json({ 
      message: 'Push subscription removed',
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ message: 'Error removing push subscription' });
  }
};