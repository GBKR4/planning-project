# Frontend Notification System - Complete Setup Guide

## 📋 Overview

The frontend notification system is fully integrated with modern React practices including:
- ✅ React Query for data management
- ✅ Web Push API for browser notifications
- ✅ Service Worker for offline notification handling
- ✅ Real-time updates and polling
- ✅ Beautiful, responsive UI components

---

## 🎯 Components Created

### 1. **API Layer** (`src/api/notificationsApi.js`)
Handles all API calls to the backend:
- `getNotifications()` - Fetch paginated notifications
- `markAsRead(id)` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read
- `deleteNotification(id)` - Delete a notification
- `getPreferences()` - Get user's notification preferences
- `updatePreferences(data)` - Update notification settings
- `subscribePush(subscription)` - Register push subscription
- `unsubscribePush(endpoint)` - Unregister push subscription
- `getVapidPublicKey()` - Get VAPID public key for push

### 2. **Push Utilities** (`src/utils/pushNotifications.js`)
Manages Web Push subscriptions:
- `subscribeToPushNotifications()` - Complete subscription flow
- `requestNotificationPermission()` - Ask for permission
- `registerServiceWorker()` - Register service worker
- `urlBase64ToUint8Array()` - Convert VAPID key format

### 3. **React Hooks** (`src/hooks/useNotifications.js`)
Custom hooks for state management:

#### `useNotifications()`
```javascript
const {
  notifications,      // Array of notifications
  isLoading,         // Loading state
  error,             // Error object
  unreadCount,       // Number of unread notifications
  markAsRead,        // Function to mark as read
  markAllAsRead,     // Function to mark all as read
  deleteNotification, // Function to delete
  fetchNextPage,     // Load more notifications
  hasNextPage,       // Check if more available
  isFetchingNextPage // Loading more state
} = useNotifications();
```

#### `useNotificationPreferences()`
```javascript
const {
  preferences,       // User preferences object
  isLoading,        // Loading state
  updatePreferences, // Update function
  isUpdating        // Update loading state
} = useNotificationPreferences();
```

#### `usePushNotifications()`
```javascript
const {
  isSupported,      // Browser supports push
  isSubscribed,     // User is subscribed
  permission,       // 'default', 'granted', 'denied'
  subscribe,        // Subscribe function
  unsubscribe,      // Unsubscribe function
  isSubscribing,    // Subscribe loading state
  isUnsubscribing   // Unsubscribe loading state
} = usePushNotifications();
```

### 4. **UI Components**

#### `NotificationBell.jsx`
Bell icon with unread badge for navbar
- Shows unread count in red badge
- Opens dropdown on click
- Auto-refreshes every 30 seconds
- Click outside to close

#### `NotificationDropdown.jsx`
Dropdown showing recent notifications
- Shows 5 most recent notifications
- "Mark all as read" button
- "View All" link to full page
- Empty state with friendly message

#### `NotificationItem.jsx`
Individual notification display
- Type-specific icons (⏰, 🚨, 📅, ⚠️)
- Time ago display (e.g., "5 minutes ago")
- Unread indicator (blue dot)
- Delete button
- Click to navigate to related page
- Auto marks as read on click

#### `NotificationPreferences.jsx`
Settings panel for notification preferences
- **Channels:**
  - Email notifications toggle
  - Push notifications toggle with browser support check
- **Types:**
  - Task reminders toggle
  - Overdue alerts toggle
  - Plan updates toggle
  - Schedule conflicts toggle
- **Timing:**
  - Reminder time selector (15min, 30min, 1hr, 2hr, 1 day)
- Auto-saves preferences

#### `PushNotificationPrompt.jsx`
Modal asking for push notification permission
- Shows after 3 seconds on first visit
- Lists benefits of push notifications
- Privacy note
- Actions: Enable, Maybe Later, Don't Ask Again
- Smart dismissal (won't show again for 7 days)

### 5. **Pages**

#### `Notifications.jsx` - Full notifications page
Features:
- Filter tabs: All, Unread, Read
- Type filter dropdown: All Types, Task Reminders, Overdue, etc.
- Bulk actions: Mark All Read, Clear All
- Infinite scroll with "Load More" button
- Empty states for different filters
- Stats footer showing count

### 6. **Service Worker** (`public/service-worker.js`)
Critical for push notifications when app is closed:
- Handles push events
- Displays notifications
- Manages notification clicks
- Routes to correct page when clicked
- Cleans up old caches
- Supports offline functionality

---

## 🚀 Integration Steps

### Step 1: Routes Already Added ✅
The `/notifications` route has been added to [App.jsx](app-frontend/src/App.jsx):
```javascript
<Route path="/notifications" element={
  <ProtectedRoute><Notifications /></ProtectedRoute>
} />
```

### Step 2: Navbar Integration ✅
[NotificationBell](app-frontend/src/components/layout/Navbar.jsx#L57-L60) has been added to the navbar between navigation links and user menu.

### Step 3: Service Worker Registration
Add to `main.jsx` or `index.jsx`:
```javascript
// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### Step 4: Add to Profile Page (Optional)
Add a link to notification settings in the Profile page:
```javascript
<Link to="/notifications" className="text-purple-600 hover:text-purple-700">
  🔔 Notification Settings
</Link>
```

Or embed the preferences directly:
```javascript
import NotificationPreferences from '../components/notifications/NotificationPreferences';

// In Profile render:
<div className="mt-8">
  <NotificationPreferences />
</div>
```

---

## 🎨 Usage Examples

### Basic Usage in a Component
```javascript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div>
      <h2>You have {unreadCount} unread notifications</h2>
      {notifications?.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          {notification.title}
        </div>
      ))}
    </div>
  );
}
```

### Subscribe to Push Notifications
```javascript
import { usePushNotifications } from '../hooks/useNotifications';

function SettingsPanel() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  if (!isSupported) {
    return <p>Push notifications not supported in this browser</p>;
  }

  return (
    <button onClick={subscribe} disabled={isSubscribed}>
      {isSubscribed ? 'Subscribed ✓' : 'Enable Push Notifications'}
    </button>
  );
}
```

### Update Preferences
```javascript
import { useNotificationPreferences } from '../hooks/useNotifications';

function PreferencesForm() {
  const { preferences, updatePreferences } = useNotificationPreferences();

  const handleToggle = (field, value) => {
    updatePreferences({ ...preferences, [field]: value });
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={preferences?.email_enabled}
        onChange={(e) => handleToggle('email_enabled', e.target.checked)}
      />
      Email Notifications
    </label>
  );
}
```

---

## 🔧 Configuration

### Environment Variables Required
None! The frontend automatically fetches the VAPID public key from:
```
GET /api/notifications/vapid-public-key
```

### Browser Support
- **Push Notifications:** Chrome 50+, Firefox 44+, Edge 17+, Safari 16+
- **Service Workers:** Chrome 40+, Firefox 44+, Edge 17+, Safari 11.1+
- **Notifications API:** All modern browsers

### HTTPS Requirement
Push notifications require HTTPS in production. Development on `localhost` works without HTTPS.

---

## 📊 Notification Types

The system handles these notification types:

| Type | Icon | Description | Navigation |
|------|------|-------------|------------|
| `task_reminder` | ⏰ | Upcoming task deadline | `/tasks?id={taskId}` |
| `overdue_task` | 🚨 | Task is overdue | `/tasks?id={taskId}` |
| `plan_created` | 📅 | Daily plan created | `/planner?date={date}` |
| `schedule_conflict` | ⚠️ | Scheduling conflict | `/planner` |
| `task_completed` | ✅ | Task marked complete | `/tasks?id={taskId}` |
| `busy_block_added` | 🚫 | New busy block | `/busy-blocks` |

---

## 🎯 Features

### Real-time Updates
- Notifications auto-refresh every 30 seconds
- Unread count updates automatically
- Optimistic UI updates for instant feedback

### Offline Support
- Service worker caches notifications
- Shows stored notifications when offline
- Queues actions when connection lost

### Smart Notifications
- Vibration patterns for urgent notifications
- Sound (browser default)
- Persistent notifications (require interaction)
- Notification grouping by type

### User Experience
- Toast notifications for actions
- Loading states everywhere
- Error handling with retry
- Empty states with helpful messages
- Responsive design (mobile-friendly)

---

## 🐛 Debugging

### Check Service Worker Status
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg);
});
```

### Check Push Subscription
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Push Subscription:', sub);
  });
});
```

### Check Notification Permission
```javascript
console.log('Notification Permission:', Notification.permission);
```

### Test Push Notification
From browser console:
```javascript
new Notification('Test', {
  body: 'This is a test notification',
  icon: '/icon.png'
});
```

---

## 📝 Customization

### Change Polling Interval
In [NotificationBell.jsx](app-frontend/src/components/notifications/NotificationBell.jsx#L18):
```javascript
refetchInterval: 30000, // Change to desired milliseconds
```

### Change Notification Count
In [NotificationDropdown.jsx](app-frontend/src/components/notifications/NotificationDropdown.jsx#L20):
```javascript
const recentNotifications = notifications?.slice(0, 5); // Change number
```

### Customize Icon Mapping
In [NotificationItem.jsx](app-frontend/src/components/notifications/NotificationItem.jsx#L12-L19):
```javascript
const iconMap = {
  task_reminder: '⏰',
  overdue_task: '🚨',
  // Add your custom types
  custom_type: '🎉'
};
```

### Change Prompt Delay
In [PushNotificationPrompt.jsx](app-frontend/src/components/notifications/PushNotificationPrompt.jsx#L20):
```javascript
setTimeout(() => setShowPrompt(true), 3000); // Change delay
```

---

## ✅ Testing Checklist

- [ ] Bell icon appears in navbar with correct unread count
- [ ] Clicking bell opens dropdown with notifications
- [ ] "Mark all as read" clears unread badge
- [ ] Clicking notification navigates to correct page
- [ ] Delete button removes notification
- [ ] "View All" opens full notifications page
- [ ] Filter tabs work correctly (All, Unread, Read)
- [ ] Type filter dropdown works
- [ ] "Load More" button loads additional notifications
- [ ] Push notification prompt appears after delay
- [ ] "Enable Notifications" requests browser permission
- [ ] Push notifications arrive when app is closed
- [ ] Clicking push notification opens app
- [ ] Preferences page loads without errors
- [ ] Toggle switches update preferences
- [ ] Email/Push enable buttons work
- [ ] Reminder time dropdown saves correctly
- [ ] Service worker registers successfully
- [ ] Works on mobile devices
- [ ] Works offline (cached notifications visible)

---

## 🎉 You're All Set!

The notification system is now fully integrated! Users will:
1. See the notification bell in the navbar
2. Get prompted to enable push notifications
3. Receive real-time updates about their tasks
4. Get notifications even when the app is closed
5. Can customize their preferences anytime

For any issues, check the browser console for errors and refer to the debugging section above.
