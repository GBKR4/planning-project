import { useState } from 'react';
import { MdNotificationsNone } from 'react-icons/md';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NotificationItem from '../components/notifications/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const matchesNotificationType = (selectedType, notificationType) => {
  if (selectedType === 'all') {
    return true;
  }

  if (selectedType === 'overdue_task') {
    return notificationType === 'overdue_task' || notificationType === 'task_overdue';
  }

  return notificationType === selectedType;
};

const Notifications = () => {
  const [filter, setFilter] = useState('all');
  const [type, setType] = useState('all');

  const {
    notifications,
    isLoading,
    error,
    markAllAsRead,
    deleteNotification,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  const filteredNotifications =
    notifications?.filter((notification) => {
      const matchesFilter =
        filter === 'all' ? true : filter === 'unread' ? !notification.read : notification.read;
      const matchesType = matchesNotificationType(type, notification.type);
      return matchesFilter && matchesType;
    }) || [];

  const unreadCount = notifications?.filter((notification) => !notification.read).length || 0;

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all visible notifications?')) {
      filteredNotifications.forEach((notification) => {
        deleteNotification(notification.id);
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-base font-medium text-gray-900">Failed to load notifications</p>
          <p className="mt-2 text-sm text-gray-500">Refresh the page and try again.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">Inbox</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-2 text-sm text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
              : 'You are caught up.'}
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === item.value
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-500"
              >
                <option value="all">All Types</option>
                <option value="task_reminder">Task Reminders</option>
                <option value="overdue_task">Overdue Tasks</option>
                <option value="task_starting">Starting Soon</option>
                <option value="plan_created">Plan Updates</option>
                <option value="schedule_conflict">Conflicts</option>
              </select>

              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} variant="outline" size="sm">
                    Mark All Read
                  </Button>
                )}
                {filteredNotifications.length > 0 && (
                  <Button onClick={handleClearAll} variant="outline" size="sm">
                    Clear Visible
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <MdNotificationsNone className="text-3xl" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">No notifications</p>
              <p className="mt-2 text-sm text-gray-500">
                {filter === 'unread'
                  ? 'There are no unread notifications.'
                  : filter === 'read'
                    ? 'There are no read notifications.'
                    : 'New activity will appear here.'}
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
              {hasNextPage && (
                <div className="border-t border-gray-200 p-4 text-center">
                  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline">
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Notifications;
