import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
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
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
        aria-label="Notifications"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-purple-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1 -translate-y-1">
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
