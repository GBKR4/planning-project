import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const Notifications = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [type, setType] = useState('all'); // all, task_reminder, overdue_task, plan_created, etc.
  
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useNotifications();

  // Filter notifications based on selected filters
  const filteredNotifications = notifications?.filter(notification => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? !notification.read :
      filter === 'read' ? notification.read : true;

    const matchesType = 
      type === 'all' ? true :
      notification.type === type;

    return matchesFilter && matchesType;
  }) || [];

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      ?.filter(n => !n.read)
      .map(n => n.id) || [];
    
    if (unreadIds.length > 0) {
      markAllAsRead();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      filteredNotifications.forEach(notification => {
        deleteNotification(notification.id);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load notifications</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Notifications
        </h1>
        <p className="text-gray-600">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You\'re all caught up!'}
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'unread'}
              onClick={() => setFilter('unread')}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </FilterButton>
            <FilterButton
              active={filter === 'read'}
              onClick={() => setFilter('read')}
            >
              Read
            </FilterButton>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="task_reminder">Task Reminders</option>
              <option value="overdue_task">Overdue Tasks</option>
              <option value="plan_created">Plan Updates</option>
              <option value="schedule_conflict">Conflicts</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllRead}
                  variant="outline"
                  size="sm"
                >
                  Mark All Read
                </Button>
              )}
              {filteredNotifications.length > 0 && (
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-500 text-lg mb-2">No notifications</p>
            <p className="text-gray-400 text-sm">
              {filter === 'unread' 
                ? "You don't have any unread notifications" 
                : filter === 'read'
                ? "You don't have any read notifications"
                : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="p-4 text-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Footer */}
      {notifications && notifications.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
};

// Helper component for filter buttons
const FilterButton = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
};

export default Notifications;
