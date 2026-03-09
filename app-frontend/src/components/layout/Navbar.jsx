import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdLogout } from 'react-icons/md';
import { FaTasks, FaCalendarAlt } from 'react-icons/fa';
import { IoMdTime } from 'react-icons/io';
import { BiSolidUserCircle } from 'react-icons/bi';
import useAuth from '../../hooks/useAuth';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
    { path: '/tasks', label: 'Tasks', icon: FaTasks },
    { path: '/busy-blocks', label: 'Busy Blocks', icon: IoMdTime },
    { path: '/planner', label: 'Planner', icon: FaCalendarAlt },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <FaCalendarAlt className="text-white text-lg" />
              </div>
              <span className="text-xl font-semibold text-gray-900 tracking-tight">TaskPlanner</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <NotificationBell />
            
            <Link
              to="/profile"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {user?.profile_photo ? (
                <img
                  src={`http://localhost:5000${user.profile_photo}`}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <BiSolidUserCircle className="text-gray-600 text-2xl" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.name || 'User'}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdLogout className="text-lg" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 pt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="text-lg" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
