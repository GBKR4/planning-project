import { pool } from '../../db/pool.js';
import { sendEmailNotification } from './emailNotificationService.js';
import { sendPushNotification } from './pushNotificationService.js';

// Create a notification in the database
export const createNotification = async (notification) => {
  const {
    userId,
    type,
    title,
    message,
    relatedTaskId = null,
    relatedPlanId = null,
    sentViaEmail = false,
    sentViaPush = false
  } = notification;
  
  try {
    const result = await pool.query(
      `INSERT INTO notifications 
        (user_id, type, title, message, related_task_id, related_plan_id, sent_via_email, sent_via_push)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [userId, type, title, message, relatedTaskId, relatedPlanId, sentViaEmail, sentViaPush]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId, options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;
  
  try {
    const query = unreadOnly
      ? `SELECT n.*, t.title as task_title 
         FROM notifications n
         LEFT JOIN tasks t ON n.related_task_id = t.id
         WHERE n.user_id = $1 AND n.read = FALSE
         ORDER BY n.created_at DESC
         LIMIT $2 OFFSET $3`
      : `SELECT n.*, t.title as task_title 
         FROM notifications n
         LEFT JOIN tasks t ON n.related_task_id = t.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT $2 OFFSET $3`;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get count of unread notifications
export const getUnreadNotificationCount = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].unread_count);
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE RETURNING *',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a single notification
export const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications for a user
export const deleteAllNotificationsForUser = async (userId) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );
    return result.rowCount;
  } catch (error) {
    console.error('Error deleting notifications for user:', error);
    throw error;
  }
};

// Get user notification preferences
export const getUserPreferences = async (userId) => {
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
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

// Update user notification preferences
export const updateUserPreferences = async (userId, preferences) => {
  const { 
    email_enabled, 
    push_enabled, 
    task_reminders, 
    overdue_alerts, 
    plan_updates, 
    schedule_conflicts,
    reminder_time_minutes 
  } = preferences;
  
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
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// Check if user has email notifications enabled for a specific type
export const shouldSendEmail = async (userId, notificationType) => {
  try {
    const preferences = await getUserPreferences(userId);
    
    if (!preferences || !preferences.email_enabled) {
      return false;
    }
    
    // Map notification types to preference fields
    const typeMapping = {
      'task_reminder': 'task_reminders',
      'task_overdue': 'overdue_alerts',
      'plan_created': 'plan_updates',
      'schedule_conflict': 'schedule_conflicts',
      'deadline_approaching': 'task_reminders'
    };
    
    const preferenceField = typeMapping[notificationType];
    return preferenceField ? preferences[preferenceField] : false;
  } catch (error) {
    console.error('Error checking email preferences:', error);
    return false;
  }
};

// Check if user has push notifications enabled for a specific type
export const shouldSendPush = async (userId, notificationType) => {
  try {
    const preferences = await getUserPreferences(userId);
    
    if (!preferences || !preferences.push_enabled) {
      return false;
    }
    
    // Map notification types to preference fields
    const typeMapping = {
      'task_reminder': 'task_reminders',
      'task_overdue': 'overdue_alerts',
      'plan_created': 'plan_updates',
      'schedule_conflict': 'schedule_conflicts',
      'deadline_approaching': 'task_reminders'
    };
    
    const preferenceField = typeMapping[notificationType];
    return preferenceField ? preferences[preferenceField] : false;
  } catch (error) {
    console.error('Error checking push preferences:', error);
    return false;
  }
};

// Send notification through all enabled channels
export const sendMultiChannelNotification = async (notification) => {
  const {
    userId,
    type,
    title,
    message,
    relatedTaskId = null,
    relatedPlanId = null
  } = notification;

  try {
    // Check user preferences
    const shouldEmail = await shouldSendEmail(userId, type);
    const shouldPush = await shouldSendPush(userId, type);
    
    // Create notification record in database
    const createdNotification = await createNotification({
      userId,
      type,
      title,
      message,
      relatedTaskId,
      relatedPlanId,
      sentViaEmail: shouldEmail,
      sentViaPush: shouldPush
    });
    
    // Send via email if enabled
    if (shouldEmail) {
      try {
        await sendEmailNotification(userId, {
          type,
          title,
          message,
          relatedTaskId,
          relatedPlanId
        });
        
        // Update notification record
        await pool.query(
          'UPDATE notifications SET sent_via_email = TRUE WHERE id = $1',
          [createdNotification.id]
        );
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    // Send via push if enabled
    if (shouldPush) {
      try {
        await sendPushNotification(userId, {
          title,
          message,
          data: {
            type,
            notificationId: createdNotification.id,
            relatedTaskId,
            relatedPlanId
          }
        });
        
        // Update notification record
        await pool.query(
          'UPDATE notifications SET sent_via_push = TRUE WHERE id = $1',
          [createdNotification.id]
        );
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
      }
    }
    
    return createdNotification;
  } catch (error) {
    console.error('Error sending multi-channel notification:', error);
    throw error;
  }
};