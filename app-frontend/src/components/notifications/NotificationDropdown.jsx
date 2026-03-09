import { Link } from 'react-router-dom';
import { MdCheckCircle, MdDelete } from 'react-icons/md';
import { IoNotificationsOff } from 'react-icons/io5';
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
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
        <h3 className="text-base font-semibold text-gray-900">
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
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
            title="Mark all as read"
          >
            <MdCheckCircle className="text-base" />
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
            <IoNotificationsOff className="text-gray-300 text-5xl mb-3" />
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
