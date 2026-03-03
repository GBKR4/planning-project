import { formatDistanceToNow } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onClick }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    const icons = {
      'task_reminder': '⏰',
      'task_overdue': '🚨',
      'plan_created': '📅',
      'schedule_conflict': '⚠️',
      'deadline_approaching': '🔥',
      'task_completed': '✅',
      'daily_summary': '📊',
      'break_reminder': '☕',
      'welcome': '👋',
      'motivational': '🌟'
    };
    return icons[type] || '📬';
  };

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.related_task_id) {
      navigate('/tasks');
    } else if (notification.related_plan_id) {
      navigate('/planner');
    }
    
    if (onClick) onClick();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group ${
        !notification.read ? 'bg-purple-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              {notification.task_title && (
                <p className="text-xs text-purple-600 mt-1">
                  Task: {notification.task_title}
                </p>
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all duration-200"
              title="Delete notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <time className="text-xs text-gray-500">
              {timeAgo}
            </time>
            {!notification.read && (
              <span className="inline-block h-2 w-2 rounded-full bg-purple-600" title="Unread" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
