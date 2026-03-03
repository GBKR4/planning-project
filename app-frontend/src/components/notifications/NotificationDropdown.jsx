import { Link } from 'react-router-dom';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationDropdown = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAllAsRead 
  } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({unreadCount} unread)
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            title="Mark all as read"
          >
            <CheckIcon className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
