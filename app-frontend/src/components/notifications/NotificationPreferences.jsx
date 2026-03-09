import { useEffect, useState } from 'react';
import { useNotificationPreferences, usePushNotifications } from '../../hooks/useNotifications';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const ToggleOption = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-200 after:bg-white after:transition-all peer-checked:bg-gray-900 peer-checked:after:translate-x-full" />
    </label>
  </div>
);

const NotificationPreferences = () => {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isSubscribing,
    isUnsubscribing,
  } = usePushNotifications();

  const [formData, setFormData] = useState({
    email_enabled: true,
    push_enabled: true,
    task_reminders: true,
    overdue_alerts: true,
    plan_updates: true,
    schedule_conflicts: true,
    reminder_time_minutes: 30,
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
        reminder_time_minutes: preferences.reminder_time_minutes ?? 30,
      });
    }
  }, [preferences]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updatePreferences(formData);
  };

  const handlePushToggle = () => {
    if (isSubscribed) {
      unsubscribe();
      return;
    }
    subscribe();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>

      {isSupported && !isSubscribed && permission === 'default' && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">Enable push notifications</p>
          <p className="mt-1 text-sm text-gray-500">
            Receive reminders in the browser even when the app is not the active tab.
          </p>
        </div>
      )}

      {permission === 'denied' && (
        <div className="mt-4 rounded-xl border border-gray-300 bg-gray-100 p-4">
          <p className="text-sm font-medium text-gray-900">Push notifications are blocked</p>
          <p className="mt-1 text-sm text-gray-600">
            Update your browser site permissions to allow notifications, then reload this page.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Channels</h3>
          <div className="mt-4 space-y-4">
            <ToggleOption
              label="Email Notifications"
              description="Receive important updates by email."
              checked={formData.email_enabled}
              onChange={(checked) => handleChange('email_enabled', checked)}
            />

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">
                  {!isSupported
                    ? 'This browser does not support push notifications.'
                    : permission === 'denied'
                      ? 'Permission is currently denied.'
                      : 'Receive reminders in your browser.'}
                </p>
              </div>
              {isSupported && (
                <Button
                  type="button"
                  onClick={handlePushToggle}
                  disabled={isSubscribing || isUnsubscribing || permission === 'denied'}
                  size="sm"
                >
                  {isSubscribing || isUnsubscribing ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Notification Types</h3>
          <div className="mt-4 space-y-4">
            <ToggleOption
              label="Task Reminders"
              description="Remind me before task deadlines."
              checked={formData.task_reminders}
              onChange={(checked) => handleChange('task_reminders', checked)}
            />
            <ToggleOption
              label="Overdue Alerts"
              description="Tell me when tasks become overdue."
              checked={formData.overdue_alerts}
              onChange={(checked) => handleChange('overdue_alerts', checked)}
            />
            <ToggleOption
              label="Plan Updates"
              description="Notify me when daily plans are generated."
              checked={formData.plan_updates}
              onChange={(checked) => handleChange('plan_updates', checked)}
            />
            <ToggleOption
              label="Schedule Conflicts"
              description="Warn me about overlapping commitments."
              checked={formData.schedule_conflicts}
              onChange={(checked) => handleChange('schedule_conflicts', checked)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Timing</h3>
          <div className="mt-4 max-w-sm">
            <label className="mb-2 block text-sm font-medium text-gray-700">Remind me before deadline</label>
            <select
              value={formData.reminder_time_minutes}
              onChange={(event) => handleChange('reminder_time_minutes', parseInt(event.target.value, 10))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={1440}>1 day</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isUpdating}>Save Preferences</Button>
        </div>
      </form>
    </section>
  );
};

export default NotificationPreferences;
