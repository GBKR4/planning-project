import { useState, useEffect } from 'react';
import { useNotificationPreferences, usePushNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const NotificationPreferences = () => {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    subscribe, 
    unsubscribe, 
    isSubscribing,
    isUnsubscribing 
  } = usePushNotifications();

  const [formData, setFormData] = useState({
    email_enabled: true,
    push_enabled: true,
    task_reminders: true,
    overdue_alerts: true,
    plan_updates: true,
    schedule_conflicts: true,
    reminder_time_minutes: 30
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        email_enabled: preferences.email_enabled ?? true,
        push_enabled: preferences.push_enabled ?? true,
        task_reminders: preferences.task_reminders ?? true,
        overdue_alerts: preferences.overdue_alerts ?? true,
        plan_updates: preferences.plan_updates ?? true,
        schedule_conflicts: preferences.schedule_conflicts ?? true,
        reminder_time_minutes: preferences.reminder_time_minutes ?? 30
      });
    }
  }, [preferences]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePreferences(formData);
  };

  const handlePushToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Notification Preferences
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Channels Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Channels
          </h3>
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  📧 Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email_enabled}
                  onChange={(e) => handleChange('email_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  🔔 Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive push notifications in your browser
                  {!isSupported && ' (Not supported in this browser)'}
                  {permission === 'denied' && ' (Permission denied)'}
                </p>
              </div>
              {isSupported && (
                <button
                  type="button"
                  onClick={handlePushToggle}
                  disabled={isSubscribing || isUnsubscribing || permission === 'denied'}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubscribing || isUnsubscribing ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification Types Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Types
          </h3>
          <div className="space-y-4">
            <ToggleOption
              label="⏰ Task Reminders"
              description="Get reminded before task deadlines"
              checked={formData.task_reminders}
              onChange={(checked) => handleChange('task_reminders', checked)}
            />

            <ToggleOption
              label="🚨 Overdue Alerts"
              description="Be notified when tasks become overdue"
              checked={formData.overdue_alerts}
              onChange={(checked) => handleChange('overdue_alerts', checked)}
            />

            <ToggleOption
              label="📅 Plan Updates"
              description="Get notified when daily plans are created"
              checked={formData.plan_updates}
              onChange={(checked) => handleChange('plan_updates', checked)}
            />

            <ToggleOption
              label="⚠️ Schedule Conflicts"
              description="Alert me about scheduling conflicts"
              checked={formData.schedule_conflicts}
              onChange={(checked) => handleChange('schedule_conflicts', checked)}
            />
          </div>
        </div>

        {/* Reminder Timing Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reminder Timing
          </h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remind me before deadline
            </label>
            <select
              value={formData.reminder_time_minutes}
              onChange={(e) => handleChange('reminder_time_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={1440}>1 day</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2"
          >
            {isUpdating ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Helper component for toggle options
const ToggleOption = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
      </label>
    </div>
  );
};

export default NotificationPreferences;
