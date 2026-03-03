import cron from 'node-cron';
import pool from '../../db/pool.js';
import { sendMultiChannelNotification } from './notificationService.js';

// Store cron job instances
let upcomingDeadlinesJob = null;
let overdueTasksJob = null;
let dailySummaryJob = null;

// Check for upcoming task deadlines
const checkUpcomingDeadlines = async () => {
  try {
    console.log('🔍 Checking for upcoming task deadlines...');
    
    // Query tasks with deadlines approaching based on user's reminder preference
    const result = await pool.query(
      `SELECT DISTINCT t.*, np.reminder_time_minutes, u.email, u.name
       FROM tasks t
       JOIN notification_preferences np ON t.user_id = np.user_id
       JOIN users u ON t.user_id = u.id
       WHERE t.deadline_at BETWEEN NOW() 
             AND NOW() + (np.reminder_time_minutes || ' minutes')::INTERVAL
         AND t.status = 'todo'
         AND np.task_reminders = TRUE
       ORDER BY t.deadline_at ASC`
    );
    
    if (result.rows.length > 0) {
      console.log(`📬 Found ${result.rows.length} tasks with upcoming deadlines`);
      
      // Send notification for each upcoming task
      for (const task of result.rows) {
        try {
          await sendMultiChannelNotification({
            userId: task.user_id,
            type: 'task_reminder',
            title: '⏰ Task Reminder',
            message: `Your task "${task.title}" is due soon!`,
            relatedTaskId: task.id
          });
          
          console.log(`✅ Sent reminder for task: ${task.title} (User: ${task.name})`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for task ${task.id}:`, error.message);
        }
      }
    } else {
      console.log('✓ No upcoming deadlines found');
    }
  } catch (error) {
    console.error('❌ Error checking upcoming deadlines:', error);
  }
};

// Check for overdue tasks
const checkOverdueTasks = async () => {
  try {
    console.log('🔍 Checking for overdue tasks...');
    
    // Query tasks that are overdue
    const result = await pool.query(
      `SELECT DISTINCT t.*, u.email, u.name
       FROM tasks t
       JOIN notification_preferences np ON t.user_id = np.user_id
       JOIN users u ON t.user_id = u.id
       WHERE t.deadline_at < NOW()
         AND t.status = 'todo'
         AND np.overdue_alerts = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = t.user_id
             AND n.related_task_id = t.id
             AND n.type = 'task_overdue'
             AND n.created_at > NOW() - INTERVAL '24 hours'
         )
       ORDER BY t.deadline_at ASC`
    );
    
    if (result.rows.length > 0) {
      console.log(`🚨 Found ${result.rows.length} overdue tasks`);
      
      // Send notification for each overdue task
      for (const task of result.rows) {
        try {
          await sendMultiChannelNotification({
            userId: task.user_id,
            type: 'task_overdue',
            title: '🚨 Task Overdue',
            message: `Your task "${task.title}" is overdue! Please complete it as soon as possible.`,
            relatedTaskId: task.id
          });
          
          console.log(`✅ Sent overdue alert for task: ${task.title} (User: ${task.name})`);
        } catch (error) {
          console.error(`❌ Failed to send overdue alert for task ${task.id}:`, error.message);
        }
      }
    } else {
      console.log('✓ No overdue tasks found');
    }
  } catch (error) {
    console.error('❌ Error checking overdue tasks:', error);
  }
};

// Send daily summary (optional - runs at 8 PM)
const sendDailySummary = async () => {
  try {
    console.log('📊 Generating daily summaries...');
    
    // Query users with tasks completed today
    const result = await pool.query(
      `SELECT 
         u.id as user_id,
         u.name,
         u.email,
         COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_count,
         COUNT(*) as total_count
       FROM users u
       LEFT JOIN tasks t ON u.id = t.user_id 
         AND DATE(t.created_at) = CURRENT_DATE
       JOIN notification_preferences np ON u.id = np.user_id
       WHERE np.plan_updates = TRUE
       GROUP BY u.id, u.name, u.email
       HAVING COUNT(*) > 0`
    );
    
    if (result.rows.length > 0) {
      console.log(`📈 Sending daily summaries to ${result.rows.length} users`);
      
      for (const user of result.rows) {
        try {
          const percentage = user.total_count > 0 
            ? Math.round((user.completed_count / user.total_count) * 100) 
            : 0;
          
          const emoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪';
          
          await sendMultiChannelNotification({
            userId: user.user_id,
            type: 'daily_summary',
            title: `${emoji} Daily Summary`,
            message: `You completed ${user.completed_count} out of ${user.total_count} tasks today (${percentage}%). Keep it up!`
          });
          
          console.log(`✅ Sent daily summary to: ${user.name}`);
        } catch (error) {
          console.error(`❌ Failed to send daily summary to user ${user.user_id}:`, error.message);
        }
      }
    } else {
      console.log('✓ No users with tasks today');
    }
  } catch (error) {
    console.error('❌ Error sending daily summaries:', error);
  }
};

// Start the notification scheduler
export const startScheduler = () => {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Starting Notification Scheduler');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Job 1: Check upcoming deadlines every 15 minutes
    upcomingDeadlinesJob = cron.schedule('*/15 * * * *', () => {
      checkUpcomingDeadlines();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Change to your timezone
    });
    
    console.log('⏰ Scheduled: Check upcoming deadlines (every 15 minutes)');
    
    // Job 2: Check overdue tasks every hour
    overdueTasksJob = cron.schedule('0 * * * *', () => {
      checkOverdueTasks();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });
    
    console.log('🚨 Scheduled: Check overdue tasks (every hour)');
    
    // Job 3: Send daily summary at 8 PM
    dailySummaryJob = cron.schedule('0 20 * * *', () => {
      sendDailySummary();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });
    
    console.log('📊 Scheduled: Daily summary (8:00 PM daily)');
    
    console.log('\n✅ Notification scheduler started successfully\n');
    
    // Run initial check on startup (optional - comment out if not needed)
    // setTimeout(() => {
    //   console.log('🔄 Running initial notification check...');
    //   checkUpcomingDeadlines();
    //   checkOverdueTasks();
    // }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to start notification scheduler:', error);
  }
};

// Stop the notification scheduler
export const stopScheduler = () => {
  try {
    console.log('\n🛑 Stopping notification scheduler...');
    
    if (upcomingDeadlinesJob) {
      upcomingDeadlinesJob.stop();
      console.log('✓ Stopped: Upcoming deadlines job');
    }
    
    if (overdueTasksJob) {
      overdueTasksJob.stop();
      console.log('✓ Stopped: Overdue tasks job');
    }
    
    if (dailySummaryJob) {
      dailySummaryJob.stop();
      console.log('✓ Stopped: Daily summary job');
    }
    
    console.log('✅ Notification scheduler stopped successfully\n');
  } catch (error) {
    console.error('❌ Error stopping notification scheduler:', error);
  }
};

// Get scheduler status
export const getSchedulerStatus = () => {
  return {
    upcomingDeadlines: upcomingDeadlinesJob ? 'running' : 'stopped',
    overdueTasks: overdueTasksJob ? 'running' : 'stopped',
    dailySummary: dailySummaryJob ? 'running' : 'stopped'
  };
};

// Manual trigger functions (useful for testing)
export const triggerUpcomingCheck = () => {
  console.log('🔧 Manual trigger: Checking upcoming deadlines...');
  return checkUpcomingDeadlines();
};

export const triggerOverdueCheck = () => {
  console.log('🔧 Manual trigger: Checking overdue tasks...');
  return checkOverdueTasks();
};

export const triggerDailySummary = () => {
  console.log('🔧 Manual trigger: Sending daily summaries...');
  return sendDailySummary();
};
