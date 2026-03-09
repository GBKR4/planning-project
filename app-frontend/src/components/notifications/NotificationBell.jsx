import { useState, useRef, useEffect } from 'react';
import { IoNotificationsOutline, IoNotifications } from 'react-icons/io5';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { unreadCount, refetch, refetchUnreadCount } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Poll for new notifications every 30 seconds when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchUnreadCount]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      refetch(); // Fetch latest notifications when opening
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <IoNotifications className="text-2xl text-gray-900" />
        ) : (
          <IoNotificationsOutline className="text-2xl" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-xs font-semibold text-white bg-gray-900 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
};

export default NotificationBell;
