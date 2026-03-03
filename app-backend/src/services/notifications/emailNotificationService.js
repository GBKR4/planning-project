import pool from '../../db/pool.js';
import { sendEmail } from '../email/emailService.js';

// Get user email by ID
const getUserEmail = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user email:', error);
    throw error;
  }
};

// Generate HTML email template
const generateEmailHTML = (userName, title, message, taskDetails = null, actionUrl = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .notification-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .notification-title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 10px;
          color: #333;
        }
        .notification-message {
          color: #555;
          font-size: 15px;
        }
        .task-details {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 15px;
          margin: 15px 0;
        }
        .task-details-title {
          font-weight: bold;
          color: #667eea;
          margin-bottom: 8px;
        }
        .task-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .task-info-item {
          font-size: 14px;
          color: #666;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 500;
        }
        .button:hover {
          background: #5568d3;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e0e0e0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Planning App</h1>
        </div>
        <div class="content">
          <div class="greeting">
            Hi ${userName || 'there'} 👋
          </div>
          <div class="notification-box">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
          </div>
          ${taskDetails ? `
            <div class="task-details">
              <div class="task-details-title">Task Details:</div>
              <div class="task-info">
                ${taskDetails.title ? `<div class="task-info-item"><strong>Title:</strong> ${taskDetails.title}</div>` : ''}
                ${taskDetails.deadline ? `<div class="task-info-item"><strong>Deadline:</strong> ${taskDetails.deadline}</div>` : ''}
                ${taskDetails.priority ? `<div class="task-info-item"><strong>Priority:</strong> ${taskDetails.priority}</div>` : ''}
                ${taskDetails.estimatedTime ? `<div class="task-info-item"><strong>Estimated Time:</strong> ${taskDetails.estimatedTime}</div>` : ''}
              </div>
            </div>
          ` : ''}
          ${actionUrl ? `
            <div style="text-align: center;">
              <a href="${actionUrl}" class="button">View Task</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>You're receiving this email because you have notifications enabled in your Planning App.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/profile">Manage notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send task reminder email
export const sendTaskReminderEmail = async (userId, taskData) => {
  try {
    const user = await getUserEmail(userId);
    if (!user) {
      console.error('User not found for email notification');
      return;
    }

    const { title, deadline_at, priority, estimated_minutes } = taskData;
    
    const deadlineFormatted = deadline_at 
      ? new Date(deadline_at).toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })
      : 'Not set';

    const priorityText = ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'][priority] || 'Medium';

    const taskDetails = {
      title,
      deadline: deadlineFormatted,
      priority: priorityText,
      estimatedTime: `${estimated_minutes} minutes`
    };

    const emailTitle = '⏰ Task Reminder';
    const emailMessage = `Don't forget! Your task "${title}" is coming up soon.`;
    const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/tasks`;

    const html = generateEmailHTML(user.name, emailTitle, emailMessage, taskDetails, actionUrl);
    const text = `${emailTitle}\n\n${emailMessage}\n\nTask: ${title}\nDeadline: ${deadlineFormatted}\nPriority: ${priorityText}\n\nView your tasks: ${actionUrl}`;

    await sendEmail({
      to: user.email,
      subject: `⏰ Reminder: ${title}`,
      text,
      html
    });

    console.log(`✅ Task reminder email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending task reminder email:', error);
    // Don't throw - email failures shouldn't break the app
  }
};

// Send overdue task email
export const sendOverdueEmail = async (userId, taskData) => {
  try {
    const user = await getUserEmail(userId);
    if (!user) return;

    const { title, deadline_at, priority } = taskData;
    
    const deadlineFormatted = deadline_at 
      ? new Date(deadline_at).toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })
      : 'Past due';

    const priorityText = ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'][priority] || 'Medium';

    const taskDetails = {
      title,
      deadline: deadlineFormatted,
      priority: priorityText
    };

    const emailTitle = '🚨 Task Overdue';
    const emailMessage = `Your task "${title}" is now overdue! Please complete it as soon as possible.`;
    const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/tasks`;

    const html = generateEmailHTML(user.name, emailTitle, emailMessage, taskDetails, actionUrl);
    const text = `${emailTitle}\n\n${emailMessage}\n\nTask: ${title}\nDeadline was: ${deadlineFormatted}\n\nView your tasks: ${actionUrl}`;

    await sendEmail({
      to: user.email,
      subject: `🚨 Overdue: ${title}`,
      text,
      html
    });

    console.log(`✅ Overdue task email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending overdue email:', error);
  }
};

// Send plan created email
export const sendPlanCreatedEmail = async (userId, planData) => {
  try {
    const user = await getUserEmail(userId);
    if (!user) return;

    const { plan_date, work_start, work_end, taskCount } = planData;
    
    const dateFormatted = new Date(plan_date).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailTitle = '📅 Daily Plan Created';
    const emailMessage = `Your plan for ${dateFormatted} has been created with ${taskCount || 0} tasks scheduled.`;
    const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/planner`;

    const planDetails = {
      title: `Schedule for ${dateFormatted}`,
      deadline: `${work_start} - ${work_end}`,
      estimatedTime: `${taskCount || 0} tasks scheduled`
    };

    const html = generateEmailHTML(user.name, emailTitle, emailMessage, planDetails, actionUrl);
    const text = `${emailTitle}\n\n${emailMessage}\n\nWorking hours: ${work_start} - ${work_end}\n\nView your plan: ${actionUrl}`;

    await sendEmail({
      to: user.email,
      subject: `📅 Your Plan for ${dateFormatted}`,
      text,
      html
    });

    console.log(`✅ Plan created email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending plan created email:', error);
  }
};

// Send schedule conflict email
export const sendScheduleConflictEmail = async (userId, conflictData) => {
  try {
    const user = await getUserEmail(userId);
    if (!user) return;

    const { task1, task2, conflictTime } = conflictData;

    const emailTitle = '⚠️ Schedule Conflict Detected';
    const emailMessage = `We detected a scheduling conflict between "${task1}" and "${task2}". Please review your schedule.`;
    const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/planner`;

    const html = generateEmailHTML(user.name, emailTitle, emailMessage, null, actionUrl);
    const text = `${emailTitle}\n\n${emailMessage}\n\nConflict at: ${conflictTime}\n\nView your schedule: ${actionUrl}`;

    await sendEmail({
      to: user.email,
      subject: '⚠️ Schedule Conflict Alert',
      text,
      html
    });

    console.log(`✅ Schedule conflict email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending schedule conflict email:', error);
  }
};

// Generic notification email sender
export const sendEmailNotification = async (userId, notification) => {
  const { type, title, message, relatedTaskId } = notification;

  try {
    // Get task details if task ID provided
    let taskData = null;
    if (relatedTaskId) {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [relatedTaskId]
      );
      taskData = result.rows[0];
    }

    // Route to appropriate email handler
    switch (type) {
      case 'task_reminder':
        if (taskData) {
          await sendTaskReminderEmail(userId, taskData);
        }
        break;
      
      case 'task_overdue':
        if (taskData) {
          await sendOverdueEmail(userId, taskData);
        }
        break;
      
      case 'plan_created':
        // Generic notification for now
        const user = await getUserEmail(userId);
        if (user) {
          const html = generateEmailHTML(user.name, title, message);
          await sendEmail({
            to: user.email,
            subject: title,
            text: message,
            html
          });
        }
        break;
      
      case 'schedule_conflict':
        // Generic notification
        const conflictUser = await getUserEmail(userId);
        if (conflictUser) {
          const html = generateEmailHTML(conflictUser.name, title, message);
          await sendEmail({
            to: conflictUser.email,
            subject: title,
            text: message,
            html
          });
        }
        break;
      
      default:
        // Generic notification
        const genericUser = await getUserEmail(userId);
        if (genericUser) {
          const html = generateEmailHTML(genericUser.name, title, message);
          await sendEmail({
            to: genericUser.email,
            subject: title,
            text: message,
            html
          });
        }
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw - email failures shouldn't break the notification system
  }
};
