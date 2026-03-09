import { formatDistanceToNow } from 'date-fns';
import { MdClose, MdSchedule, MdWarning, MdCalendarToday, MdCheckCircle, MdAssessment, MdCoffeeMaker, MdWavingHand, MdStar } from 'react-icons/md';
import { IoMdAlert } from 'react-icons/io';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onClick }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    const iconMap = {
      'task_reminder': <MdSchedule className="text-gray-600" />,
      'task_overdue': <IoMdAlert className="text-gray-700" />,
      'plan_created': <MdCalendarToday className="text-gray-600" />,
      'schedule_conflict': <MdWarning className="text-gray-600" />,
      'deadline_approaching': <MdWarning className="text-gray-700" />,
      'task_completed': <MdCheckCircle className="text-gray-600" />,
      'daily_summary': <MdAssessment className="text-gray-600" />,
      'break_reminder': <MdCoffeeMaker className="text-gray-600" />,
      'welcome': <MdWavingHand className="text-gray-600" />,
      'motivational': <MdStar className="text-gray-600" />
    };
    return iconMap[type] || <MdSchedule className="text-gray-600" />;
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
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group ${
        !notification.read ? 'bg-gray-100' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-xl mt-0.5">
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
                <p className="text-xs text-gray-600 mt-1">
                  Task: {notification.task_title}
                </p>
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-900 rounded transition-all"
              title="Delete notification"
            >
              <MdClose className="text-base" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <time className="text-xs text-gray-500">
              {timeAgo}
            </time>
            {!notification.read && (
              <span className="inline-block h-2 w-2 rounded-full bg-gray-900" title="Unread" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
