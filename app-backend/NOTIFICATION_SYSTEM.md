# 🔔 Notification System Documentation

## Overview
Complete modern notification system with multi-channel delivery:
- 📧 Email notifications
- 🔔 Web Push notifications (works when app is closed)
- 💬 In-app notifications
- ⏰ Automated scheduling

---

## Features

### ✅ Implemented
- **Email Notifications** - Beautiful HTML emails via Resend/Gmail
- **Push Notifications** - Web Push API (works offline)
- **In-App Notifications** - Real-time notification center
- **Scheduler** - Automated checks every 15 minutes
- **User Preferences** - Customizable notification settings
- **Multi-Channel** - Sends via all enabled channels simultaneously

### 📬 Notification Types
1. **Task Reminder** - Before deadline (configurable time)
2. **Task Overdue** - When tasks pass their deadline
3. **Plan Created** - When daily plan is generated
4. **Schedule Conflict** - When tasks overlap
5. **Deadline Approaching** - Final warning before deadline
6. **Daily Summary** - End of day report (8 PM)

---

## Backend Architecture

### Database Tables

**1. notifications**
```sql
id, user_id, type, title, message, related_task_id, 
related_plan_id, read, sent_via_email, sent_via_push, created_at
```

**2. notification_preferences**
```sql
user_id, email_enabled, push_enabled, task_reminders, 
overdue_alerts, plan_updates, schedule_conflicts, 
reminder_time_minutes, updated_at
```

**3. push_subscriptions**
```sql
id, user_id, endpoint, keys_p256dh, keys_auth, 
user_agent, created_at
```

### File Structure
```
src/
├── controllers/
│   └── notifications.controller.js      # API handlers
├── routes/
│   └── notifications.routes.js          # API endpoints
├── services/
│   └── notifications/
│       ├── notificationService.js       # Core logic
│       ├── emailNotificationService.js  # Email sender
│       ├── pushNotificationsService.js  # Web Push
│       ├── notificationScheduler.js     # Cron jobs
│       └── notificationTemplates.js     # Message templates
└── utils/
    ├── vapid.js                         # VAPID utilities
    └── generateVapidKeys.js             # Key generator
```

---

## API Endpoints

### Get Notifications
```
GET /api/notifications?limit=50&offset=0
Headers: Authorization: Bearer <token>
Response: { notifications: [...] }
```

### Get Unread Count
```
GET /api/notifications/unread
Response: { unreadCount: 5 }
```

### Mark as Read
```
PATCH /api/notifications/:id/read
Response: { message: "Notification marked as read" }
```

### Mark All as Read
```
PATCH /api/notifications/read-all
Response: { message: "All marked as read", count: 10 }
```

### Delete Notification
```
DELETE /api/notifications/:id
Response: { message: "Notification deleted" }
```

### Get Preferences
```
GET /api/notifications/preferences
Response: { preferences: {...} }
```

### Update Preferences
```
PUT /api/notifications/preferences
Body: {
  email_enabled: true,
  push_enabled: true,
  task_reminders: true,
  overdue_alerts: true,
  plan_updates: false,
  schedule_conflicts: true,
  reminder_time_minutes: 30
}
```

### Subscribe to Push
```
POST /api/notifications/subscribe
Body: {
  endpoint: "https://...",
  keys: { p256dh: "...", auth: "..." }
}
```

### Unsubscribe from Push
```
DELETE /api/notifications/unsubscribe
Body: { endpoint: "https://..." }  // optional
```

### Get VAPID Public Key
```
GET /api/notifications/vapid-public-key
Response: { publicKey: "BMM5bH12..." }
```

---

## Scheduler

### Cron Jobs
- **Every 15 minutes** - Check upcoming deadlines
- **Every hour** - Check overdue tasks
- **Daily at 8 PM** - Send daily summary

### Manual Triggers (for testing)
```javascript
import { 
  triggerUpcomingCheck, 
  triggerOverdueCheck, 
  triggerDailySummary 
} from './services/notifications/notificationScheduler.js';

// In your code or console
await triggerUpcomingCheck();
await triggerOverdueCheck();
await triggerDailySummary();
```

---

## Setup Instructions

### 1. Install Dependencies
Already installed: `web-push`, `node-cron`

### 2. Database Migration
Run the schema.sql to create tables:
```bash
psql -U postgres -d planning-project -f src/db/schema.sql
```

### 3. Generate VAPID Keys
```bash
node src/utils/generateVapidKeys.js
```

Copy output to `.env`:
```env
VAPID_PUBLIC_KEY=BMM5bH12PQB5R7Le41NM_rsSExY_foRd1jOgs6KzsX-bsVD2xQawyhYbFT6PL3lvOpKbfqvc-SLjWyYz5dMELO8
VAPID_PRIVATE_KEY=okCQMUJqZad8BMQbEQ6ghyxtbGo8kkmQn_DdYuB6Kwg
VAPID_EMAIL=mailto:your-email@example.com
```

### 4. Configure Email (Optional)
Already configured with Resend. Update `.env` if needed:
```env
RESEND_API_KEY=your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### 5. Start Server
```bash
npm start
```

Scheduler will start automatically and log:
```
✅ Notification scheduler started successfully
⏰ Scheduled: Check upcoming deadlines (every 15 minutes)
🚨 Scheduled: Check overdue tasks (every hour)
📊 Scheduled: Daily summary (8:00 PM daily)
```

---

## Testing

### Test Endpoints
```bash
# Get VAPID public key
curl http://localhost:5000/api/notifications/vapid-public-key

# Get notifications (needs token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/notifications

# Get unread count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/notifications/unread
```

### Test Scheduler
Create a task with deadline in 30 minutes, wait 15 minutes, check logs for notification send.

### Test Email
Check console for email output (development) or inbox (production).

### Test Push
- Enable push in frontend
- Grant notification permission
- Trigger notification
- Verify push received (even when browser closed)

---

## Environment Variables

```env
# Required
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_EMAIL=mailto:your-email@example.com

# Optional (for email)
RESEND_API_KEY=<your_key>
EMAIL_FROM=noreply@example.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

---

## Production Considerations

### For Production, Consider:
1. **Bull/BullMQ** - Replace node-cron for persistence
2. **Redis** - For pub/sub and caching
3. **Rate Limiting** - Prevent notification spam
4. **Error Monitoring** - Sentry/DataDog for errors
5. **Analytics** - Track open/click rates
6. **A/B Testing** - Test notification copy
7. **Timezone** - Update cron timezone in scheduler
8. **Scaling** - Handle multiple servers

### Current Limitations:
- In-memory cron (stops on server restart)
- No retry logic for failed sends
- Basic error handling
- Single server only

### Upgrade Path:
1. Add Bull + Redis
2. Implement retry queues
3. Add delivery tracking
4. Implement webhook callbacks
5. Add notification analytics

---

## Troubleshooting

### Push Notifications Not Working
1. Check VAPID keys in `.env`
2. Verify browser supports Web Push (Chrome, Firefox)
3. Check browser permission granted
4. Verify HTTPS (required for push, except localhost)

### Email Not Sending
1. Check Resend API key
2. Verify email address format
3. Check console logs for errors
4. Test with different email provider

### Scheduler Not Running
1. Check server logs for startup message
2. Verify cron syntax
3. Check timezone configuration
4. Manually trigger to test logic

### Database Errors
1. Run schema migration
2. Check table exists
3. Verify column names match
4. Check foreign key constraints

---

## Future Enhancements

- [ ] WebSocket for real-time notifications
- [ ] SMS notifications (Twilio)
- [ ] Slack/Discord integration
- [ ] Notification templates in database
- [ ] A/B testing framework
- [ ] Analytics dashboard
- [ ] Notification batching (digest)
- [ ] Smart scheduling (ML-based)
- [ ] Read receipts
- [ ] Rich notifications (images, actions)

---

## License
MIT

## Author
Planning Project Team

## Last Updated
March 3, 2026
