# 🚀 Quick Start Guide - Testing Notifications

## Prerequisites
✅ Backend server running on `http://localhost:5000`  
✅ Frontend dev server running  
✅ VAPID keys configured in backend `.env`  
✅ User logged in to the application  

---

## 🧪 Testing Steps

### 1. Start the Servers

**Backend:**
```bash
cd app-backend
npm start
```
The scheduler should start automatically and you'll see:
```
✅ Notification scheduler started successfully
```

**Frontend:**
```bash
cd app-frontend
npm run dev
```

### 2. Open the Application
Navigate to `http://localhost:5173` (or your Vite dev server URL)

### 3. Test Notification Bell

1. **Look at the Navbar**
   - You should see a 🔔 bell icon in the top right
   - If you have unread notifications, there will be a red badge with count

2. **Click the Bell**
   - A dropdown should appear
   - Shows your 5 most recent notifications
   - Has "Mark all as read" button at top
   - Has "View All" link at bottom

3. **Click a Notification**
   - Should mark it as read (blue dot disappears)
   - Should navigate to the relevant page
   - Unread count should decrease

4. **Delete a Notification**
   - Click the trash icon on any notification
   - Should remove it from the list
   - Unread count updates if it was unread

### 4. Test Full Notifications Page

1. **Navigate to Notifications**
   - Click "View All" in the dropdown, OR
   - Go to `/notifications` in the URL

2. **Test Filters**
   - Click "Unread" tab - shows only unread
   - Click "Read" tab - shows only read
   - Click "All" tab - shows everything

3. **Test Type Filter**
   - Select "Task Reminders" from dropdown
   - Select "Overdue Tasks" from dropdown
   - Should filter accordingly

4. **Test Actions**
   - Click "Mark All Read" - all notifications marked as read
   - Click "Clear All" - confirms and deletes filtered notifications

### 5. Test Push Notifications

#### A. Push Notification Prompt
1. **Wait 3 seconds after page load**
   - A modal should appear asking about push notifications
   - Shows benefits of push notifications
   - Has three buttons:
     - "🔔 Enable Notifications" - requests permission
     - "Maybe Later" - dismisses for now
     - "Don't Ask Again" - never shows again

2. **Click "Enable Notifications"**
   - Browser asks for notification permission
   - Click "Allow"
   - Toast appears: "Push notifications enabled"
   - Subscription is saved to backend

#### B. Test Push Subscription Manually
1. **Open Notification Preferences**
   - Go to `/notifications` page
   - Or create a settings page with NotificationPreferences component

2. **Enable Push Notifications**
   - Toggle "🔔 Push Notifications"
   - Browser asks for permission
   - Grant permission
   - Button changes to "Disable"

3. **Check Browser Console**
   ```javascript
   // Should see:
   ✅ Service Worker registered successfully
   ✅ Push subscription saved
   ```

#### C. Verify Subscription in Database
```sql
SELECT * FROM push_subscriptions WHERE user_id = YOUR_USER_ID;
```
You should see an entry with `endpoint`, `p256dh_key`, and `auth_key`.

### 6. Test Notification Preferences

1. **Navigate to Settings**
   - Access NotificationPreferences component
   - (Can be in Profile page or separate route)

2. **Test Channel Toggles**
   - Toggle "📧 Email Notifications" on/off
   - Toggle "🔔 Push Notifications" (with enable/disable button)
   - Changes save automatically with toast confirmation

3. **Test Type Toggles**
   - Toggle "⏰ Task Reminders"
   - Toggle "🚨 Overdue Alerts"
   - Toggle "📅 Plan Updates"
   - Toggle "⚠️ Schedule Conflicts"
   - All save automatically

4. **Test Reminder Timing**
   - Select "15 minutes" from dropdown
   - Select "1 hour" from dropdown
   - Changes save immediately

5. **Check Database**
   ```sql
   SELECT * FROM notification_preferences WHERE user_id = YOUR_USER_ID;
   ```

### 7. Generate Test Notifications

#### A. Create a Task with Near Deadline
```javascript
// In browser console or via API
POST /api/tasks
{
  "title": "Test Notification",
  "description": "Testing notifications",
  "deadline": "2024-01-15T14:30:00Z", // Set to 30 mins from now
  "status": "pending",
  "priority": "high"
}
```

The scheduler runs every 15 minutes and will create notifications for tasks due within 30 minutes.

#### B. Create an Overdue Task
```javascript
POST /api/tasks
{
  "title": "Overdue Test",
  "description": "Testing overdue notifications",
  "deadline": "2024-01-14T10:00:00Z", // Past date
  "status": "pending"
}
```

The scheduler runs hourly to check for overdue tasks.

#### C. Manually Create a Notification (Testing)
```javascript
POST /api/notifications
{
  "title": "Test Notification",
  "message": "This is a test message",
  "type": "task_reminder",
  "priority": "medium",
  "related_id": 123,
  "related_type": "task"
}
```

#### D. Wait for Scheduled Checks
- **Upcoming deadlines:** Every 15 minutes
- **Overdue tasks:** Every hour
- **Daily summary:** Every day at 8 PM

Or restart the backend to trigger immediate check.

### 8. Test Push Notification Delivery

#### A. Trigger a Push Notification
1. Create a task with deadline in 30 minutes (see 7A above)
2. Wait for scheduler (or trigger manually via API)
3. Backend will send push notification
4. **Close the browser tab** (important!)
5. Push notification should appear from system

#### B. Test Notification Click
1. Click the system notification
2. Browser/app should open
3. Should navigate to the relevant page
4. Notification should be marked as read

#### C. Check Service Worker Console
1. Right-click anywhere on page → Inspect
2. Go to "Application" tab
3. Click "Service Workers"
4. Should see `/service-worker.js` active
5. Check console for push events

### 9. Test Offline Functionality

1. **Open DevTools → Network Tab**
2. Check "Offline" checkbox
3. Try to view notifications
4. Cached notifications should still display
5. Actions will queue until online

### 10. Test Real-time Updates

1. **Keep the app open**
2. **In another tab/window, create a notification via API:**
   ```bash
   curl -X POST http://localhost:5000/api/notifications \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "New Notification",
       "message": "Testing real-time updates",
       "type": "task_reminder"
     }'
   ```
3. **Wait up to 30 seconds**
4. Notification bell badge should update
5. New notification appears in dropdown

---

## 🐛 Troubleshooting

### Notifications Not Appearing
1. Check backend is running: `http://localhost:5000/health`
2. Check scheduler is active (backend console logs)
3. Verify tasks have proper deadlines
4. Check user is authenticated
5. Look at browser console for errors

### Push Notifications Not Working
1. **Check HTTPS:** Push requires HTTPS (except localhost)
2. **Check browser support:** Chrome/Edge/Firefox supported
3. **Check permission:** Should be "granted" not "denied"
   ```javascript
   console.log(Notification.permission); // Should be "granted"
   ```
4. **Check service worker:**
   ```javascript
   navigator.serviceWorker.getRegistration().then(console.log);
   ```
5. **Check subscription:**
   ```javascript
   navigator.serviceWorker.ready.then(reg => {
     reg.pushManager.getSubscription().then(console.log);
   });
   ```
6. **Check VAPID keys:** Backend .env should have valid keys

### Service Worker Not Registering
1. Check file exists: `public/service-worker.js`
2. Check console for errors
3. Clear browser cache and reload
4. Unregister old worker:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```
   Then refresh page.

### Bell Icon Not Showing
1. Check Navbar import: `import NotificationBell from '../notifications/NotificationBell'`
2. Check component is rendered in JSX
3. Check no React errors in console
4. Verify auth token is valid

### Preferences Not Saving
1. Check network tab for API call
2. Verify response is 200 OK
3. Check backend logs for errors
4. Verify database connection
5. Check user_id is correct

---

## ✅ Expected Results

After completing all tests:

- ✅ Bell icon shows correct unread count
- ✅ Clicking bell opens dropdown
- ✅ Notifications have correct icons and formatting
- ✅ "Mark as read" works
- ✅ Delete removes notifications
- ✅ Filter tabs work correctly
- ✅ Push permission prompt appears
- ✅ Push notifications enabled successfully
- ✅ Service worker registered
- ✅ Push notifications arrive when app closed
- ✅ Clicking push opens app at correct page
- ✅ Preferences save and load correctly
- ✅ Real-time updates work
- ✅ Offline mode shows cached data
- ✅ All UI is responsive and looks good

---

## 🎯 API Endpoints to Test

```bash
# Get notifications
GET /api/notifications

# Get unread count
GET /api/notifications/unread-count

# Mark as read
PATCH /api/notifications/:id/read

# Mark all as read
PATCH /api/notifications/mark-all-read

# Delete notification
DELETE /api/notifications/:id

# Get preferences
GET /api/notifications/preferences

# Update preferences
PUT /api/notifications/preferences

# Subscribe to push
POST /api/notifications/subscribe

# Unsubscribe from push
POST /api/notifications/unsubscribe

# Get VAPID public key (no auth required)
GET /api/notifications/vapid-public-key
```

---

## 🎉 Success!

If all tests pass, your notification system is fully functional! Users can now:
- ✅ See notifications in real-time
- ✅ Get push notifications when app is closed
- ✅ Customize their notification preferences
- ✅ Manage notifications easily
- ✅ Never miss important deadlines

Enjoy your modern notification system! 🚀
