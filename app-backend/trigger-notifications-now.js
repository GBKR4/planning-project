import dotenv from 'dotenv';
import pool from './src/db/pool.js';
import { sendMultiChannelNotification } from './src/services/notifications/notificationService.js';

dotenv.config();

async function checkAndSendNotifications() {
  try {
    console.log('\n🔔 Checking for tasks that need notifications...\n');
    
    // 1. Check tasks with upcoming deadlines
    console.log('1️⃣ Checking tasks with upcoming deadlines...');
    const deadlineTasks = await pool.query(
      `SELECT DISTINCT 
         t.*, 
         u.name,
         u.email,
         np.reminder_time_minutes,
         EXTRACT(EPOCH FROM (t.deadline_at - NOW())) / 60 as minutes_until_deadline
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       JOIN notification_preferences np ON t.user_id = np.user_id
       WHERE t.deadline_at BETWEEN NOW() 
             AND NOW() + (np.reminder_time_minutes || ' minutes')::INTERVAL
         AND t.status = 'todo'
         AND np.task_reminders = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = t.user_id
             AND n.related_task_id = t.id
             AND n.type = 'task_reminder'
             AND n.created_at > NOW() - INTERVAL '1 hour'
         )
       ORDER BY t.deadline_at ASC`
    );
    
    if (deadlineTasks.rows.length === 0) {
      console.log('   ℹ️  No tasks with upcoming deadlines in reminder window');
    } else {
      console.log(`   ✅ Found ${deadlineTasks.rows.length} tasks!`);
      
      for (const task of deadlineTasks.rows) {
        const minutesUntilDeadline = Math.round(task.minutes_until_deadline);
        const deadlineTime = new Date(task.deadline_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        console.log(`\n   📝 Task: "${task.title}"`);
        console.log(`      User: ${task.name} (${task.email})`);
        console.log(`      Due: ${deadlineTime} (${minutesUntilDeadline} minutes)`);
        console.log(`      Sending notification...`);
        
        await sendMultiChannelNotification({
          userId: task.user_id,
          type: 'task_reminder',
          title: '⏰ Task Reminder',
          message: `Your task "${task.title}" is due ${minutesUntilDeadline === 0 ? 'now' : `in ${minutesUntilDeadline} minute${minutesUntilDeadline === 1 ? '' : 's'}`} at ${deadlineTime}!`,
          relatedTaskId: task.id
        });
        
        console.log(`      ✅ Notification sent!`);
      }
    }
    
    // 2. Check plan blocks starting soon
    console.log('\n2️⃣ Checking plan blocks starting soon...');
    const startingBlocks = await pool.query(
      `SELECT DISTINCT 
         pb.*, 
         t.title as task_title,
         t.user_id,
         u.name,
         u.email,
         np.reminder_time_minutes,
         EXTRACT(EPOCH FROM (pb.start_at - NOW())) / 60 as minutes_until_start
       FROM plan_blocks pb
       JOIN plans p ON pb.plan_id = p.id
       JOIN tasks t ON pb.task_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN notification_preferences np ON t.user_id = np.user_id
       WHERE pb.start_at BETWEEN NOW() 
             AND NOW() + (np.reminder_time_minutes || ' minutes')::INTERVAL
         AND pb.status = 'scheduled'
         AND pb.task_id IS NOT NULL
         AND np.task_reminders = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = t.user_id
             AND n.related_task_id = t.id
             AND n.type = 'task_starting'
             AND n.created_at > NOW() - INTERVAL '1 hour'
         )
       ORDER BY pb.start_at ASC`
    );
    
    if (startingBlocks.rows.length === 0) {
      console.log('   ℹ️  No plan blocks starting soon');
    } else {
      console.log(`   ✅ Found ${startingBlocks.rows.length} blocks!`);
      
      for (const block of startingBlocks.rows) {
        const minutesUntilStart = Math.round(block.minutes_until_start);
        const startTime = new Date(block.start_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        console.log(`\n   🚀 Task: "${block.task_title}"`);
        console.log(`      User: ${block.name} (${block.email})`);
        console.log(`      Starts: ${startTime} (${minutesUntilStart} minutes)`);
        console.log(`      Sending notification...`);
        
        await sendMultiChannelNotification({
          userId: block.user_id,
          type: 'task_starting',
          title: '🚀 Time to Start Task',
          message: `Your task "${block.task_title}" is scheduled to start ${minutesUntilStart === 0 ? 'now' : `in ${minutesUntilStart} minute${minutesUntilStart === 1 ? '' : 's'}`} at ${startTime}!`,
          relatedTaskId: block.task_id,
          relatedPlanId: block.plan_id
        });
        
        console.log(`      ✅ Notification sent!`);
      }
    }
    
    console.log('\n✅ Notification check complete!');
    console.log('💡 Check your email and the NotificationBell in the frontend');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndSendNotifications();
