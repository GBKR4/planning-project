import { formatDistanceToNow, format } from 'date-fns';

// Format date for display
const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
};

// Format relative time (e.g., "in 30 minutes")
const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Task Reminder Template
export const taskReminderTemplate = (taskData) => {
  const { title, deadline_at, estimated_minutes, priority } = taskData;
  
  const timeUntil = deadline_at ? formatRelativeTime(deadline_at) : 'soon';
  const priorityEmoji = priority <= 2 ? '🔴' : priority === 3 ? '🟡' : '🟢';
  
  return {
    type: 'task_reminder',
    title: '⏰ Task Reminder',
    message: `Your task "${title}" is due ${timeUntil}. ${priorityEmoji} Priority ${priority}/5`,
    icon: '⏰'
  };
};

// Task Overdue Template
export const taskOverdueTemplate = (taskData) => {
  const { title, deadline_at, priority } = taskData;
  
  const overdueSince = deadline_at ? formatRelativeTime(deadline_at) : 'some time ago';
  const urgencyText = priority <= 2 ? 'High priority task!' : 'Please complete soon.';
  
  return {
    type: 'task_overdue',
    title: '🚨 Task Overdue',
    message: `Task "${title}" became overdue ${overdueSince}. ${urgencyText}`,
    icon: '🚨'
  };
};

// Plan Created Template
export const planCreatedTemplate = (planData) => {
  const { plan_date, work_start, work_end, taskCount = 0 } = planData;
  
  const dateFormatted = format(new Date(plan_date), 'EEEE, MMM dd');
  const tasksText = taskCount === 1 ? '1 task' : `${taskCount} tasks`;
  
  return {
    type: 'plan_created',
    title: '📅 Daily Plan Ready',
    message: `Your plan for ${dateFormatted} is ready with ${tasksText} scheduled from ${work_start} to ${work_end}.`,
    icon: '📅'
  };
};

// Plan Updated Template
export const planUpdatedTemplate = (planData) => {
  const { plan_date, taskCount = 0 } = planData;
  
  const dateFormatted = format(new Date(plan_date), 'EEEE, MMM dd');
  
  return {
    type: 'plan_created',
    title: '🔄 Plan Updated',
    message: `Your plan for ${dateFormatted} has been updated with ${taskCount} tasks.`,
    icon: '🔄'
  };
};

// Schedule Conflict Template
export const scheduleConflictTemplate = (conflictData) => {
  const { task1Title, task2Title, conflictTime } = conflictData;
  
  return {
    type: 'schedule_conflict',
    title: '⚠️ Schedule Conflict',
    message: `Conflict detected between "${task1Title}" and "${task2Title}". Please review your schedule.`,
    icon: '⚠️'
  };
};

// Deadline Approaching Template
export const deadlineApproachingTemplate = (taskData, hoursRemaining) => {
  const { title, deadline_at, priority } = taskData;
  
  const timeText = hoursRemaining < 1 
    ? 'less than 1 hour' 
    : hoursRemaining === 1 
    ? '1 hour' 
    : `${Math.floor(hoursRemaining)} hours`;
  
  const urgencyEmoji = hoursRemaining < 2 ? '🔥' : '⏰';
  
  return {
    type: 'deadline_approaching',
    title: `${urgencyEmoji} Deadline Approaching`,
    message: `Only ${timeText} left until "${title}" is due!`,
    icon: urgencyEmoji
  };
};

// Task Completed Template
export const taskCompletedTemplate = (taskData) => {
  const { title } = taskData;
  
  return {
    type: 'task_completed',
    title: '✅ Task Completed',
    message: `Great job! You completed "${title}".`,
    icon: '✅'
  };
};

// Multiple Tasks Due Today Template
export const multipleTasksDueTodayTemplate = (taskCount) => {
  return {
    type: 'task_reminder',
    title: '📋 Multiple Tasks Due Today',
    message: `You have ${taskCount} tasks scheduled for today. Stay on track!`,
    icon: '📋'
  };
};

// Break Reminder Template
export const breakReminderTemplate = () => {
  return {
    type: 'break_reminder',
    title: '☕ Time for a Break',
    message: "You've been working hard! Take a short break to recharge.",
    icon: '☕'
  };
};

// Daily Summary Template
export const dailySummaryTemplate = (summaryData) => {
  const { completedCount, totalCount, date } = summaryData;
  
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const emoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪';
  
  return {
    type: 'daily_summary',
    title: `${emoji} Daily Summary`,
    message: `You completed ${completedCount} out of ${totalCount} tasks today (${percentage}%). Keep it up!`,
    icon: emoji
  };
};

// Welcome Notification Template
export const welcomeNotificationTemplate = (userName) => {
  return {
    type: 'welcome',
    title: '👋 Welcome to Planning App',
    message: `Hi ${userName}! Start by adding your first task to get organized.`,
    icon: '👋'
  };
};

// Motivational Template (for streaks, achievements, etc.)
export const motivationalTemplate = (message) => {
  return {
    type: 'motivational',
    title: '🌟 You\'re Doing Great!',
    message: message,
    icon: '🌟'
  };
};

// Main function to get notification content by type
export const getNotificationContent = (type, data) => {
  switch (type) {
    case 'task_reminder':
      return taskReminderTemplate(data);
    
    case 'task_overdue':
      return taskOverdueTemplate(data);
    
    case 'plan_created':
      return planCreatedTemplate(data);
    
    case 'plan_updated':
      return planUpdatedTemplate(data);
    
    case 'schedule_conflict':
      return scheduleConflictTemplate(data);
    
    case 'deadline_approaching':
      return deadlineApproachingTemplate(data.task, data.hoursRemaining);
    
    case 'task_completed':
      return taskCompletedTemplate(data);
    
    case 'multiple_tasks_due':
      return multipleTasksDueTodayTemplate(data.taskCount);
    
    case 'break_reminder':
      return breakReminderTemplate();
    
    case 'daily_summary':
      return dailySummaryTemplate(data);
    
    case 'welcome':
      return welcomeNotificationTemplate(data.userName);
    
    case 'motivational':
      return motivationalTemplate(data.message);
    
    default:
      return {
        type: 'general',
        title: '📬 Notification',
        message: data.message || 'You have a new notification.',
        icon: '📬'
      };
  }
};

// Helper to create notification object for database
export const createNotificationObject = (userId, type, data) => {
  const content = getNotificationContent(type, data);
  
  return {
    userId,
    type: content.type,
    title: content.title,
    message: content.message,
    relatedTaskId: data.taskId || data.id || null,
    relatedPlanId: data.planId || null
  };
};

// Templates for push notification badge text
export const getPushBadgeText = (type) => {
  const badges = {
    'task_reminder': 'Reminder',
    'task_overdue': 'Overdue',
    'plan_created': 'Plan',
    'schedule_conflict': 'Conflict',
    'deadline_approaching': 'Urgent',
    'task_completed': 'Done',
    'daily_summary': 'Summary',
    'break_reminder': 'Break',
    'welcome': 'Welcome'
  };
  
  return badges[type] || 'New';
};

// Get notification priority (for push notifications)
export const getNotificationPriority = (type) => {
  const priorities = {
    'task_overdue': 'high',
    'deadline_approaching': 'high',
    'schedule_conflict': 'high',
    'task_reminder': 'normal',
    'plan_created': 'normal',
    'plan_updated': 'normal',
    'break_reminder': 'low',
    'daily_summary': 'low',
    'welcome': 'low'
  };
  
  return priorities[type] || 'normal';
};

// Get sound for notification type
export const getNotificationSound = (type) => {
  const sounds = {
    'task_overdue': 'alert',
    'deadline_approaching': 'alert',
    'schedule_conflict': 'warning',
    'task_reminder': 'default',
    'plan_created': 'success',
    'task_completed': 'success'
  };
  
  return sounds[type] || 'default';
};

// Get suggested actions for notification
export const getSuggestedActions = (type, taskId = null) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  
  switch (type) {
    case 'task_reminder':
    case 'task_overdue':
    case 'deadline_approaching':
      return [
        { action: 'view', title: 'View Task', url: `${baseUrl}/tasks${taskId ? `?task=${taskId}` : ''}` },
        { action: 'complete', title: 'Mark Complete', url: `${baseUrl}/tasks${taskId ? `?complete=${taskId}` : ''}` }
      ];
    
    case 'plan_created':
    case 'plan_updated':
    case 'schedule_conflict':
      return [
        { action: 'view', title: 'View Plan', url: `${baseUrl}/planner` }
      ];
    
    case 'task_completed':
      return [
        { action: 'view', title: 'View All Tasks', url: `${baseUrl}/tasks` }
      ];
    
    default:
      return [
        { action: 'view', title: 'View', url: `${baseUrl}/notifications` }
      ];
  }
};
