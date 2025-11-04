import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useProjectNotifications } from '../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const DashboardHeader = ({ title = "Dashboard", subtitle = null }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [userDropdownPosition, setUserDropdownPosition] = useState({ top: 0, left: 0 });
  
  const notificationButtonRef = useRef(null);
  const userButtonRef = useRef(null);
  
  const { user, logout, getUserRole } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();
  
  // Use the notifications hook
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  // Use socket notifications to get total count
  const { unreadCount: socketUnreadCount } = useProjectNotifications();

  // Calculate total unread count
  const totalUnreadCount = (unreadCount || 0) + (socketUnreadCount || 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would implement actual dark mode toggle
  };

  const calculateDropdownPosition = (buttonRef) => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.right - 320 // Adjust based on dropdown width
    };
  };

  const calculateUserDropdownPosition = (buttonRef) => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.right - 224 // Adjust based on dropdown width
    };
  };

  const toggleNotifications = () => {
    if (!notificationsOpen) {
      setDropdownPosition(calculateDropdownPosition(notificationButtonRef));
      // Refresh notifications when opening dropdown
      refreshNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleUserMenu = () => {
    if (!userMenuOpen) {
      setUserDropdownPosition(calculateUserDropdownPosition(userButtonRef));
    }
    setUserMenuOpen(!userMenuOpen);
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
    setNotificationsOpen(false);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-lg relative overflow-hidden z-30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Title */}
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white drop-shadow-sm">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-blue-100 drop-shadow-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Center section - Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="block w-full pl-10 pr-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 hover:bg-white/25"
              />
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            

            {/* Notifications Bell */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={toggleNotifications}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 hover:scale-105 relative"
              >
                <BellIcon className="h-5 w-5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                ref={userButtonRef}
                onClick={toggleUserMenu}
                className="flex items-center space-x-3 p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-sm font-bold text-white">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-blue-100">
                      {userRole?.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${
                    userMenuOpen ? 'transform rotate-180' : ''
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      </header>

      {/* Portal-based dropdowns for proper z-index layering */}
      {notificationsOpen && createPortal(
        <div 
          className="fixed"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px`,
            zIndex: 10000
          }}
        >
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onViewAll={handleViewAllNotifications}
            loading={notificationsLoading}
          />
        </div>,
        document.body
      )}

      {userMenuOpen && createPortal(
        <div 
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 animate-fadeInScale"
          style={{ 
            top: `${userDropdownPosition.top}px`, 
            left: `${userDropdownPosition.left}px`,
            zIndex: 10000,
            width: '224px'
          }}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                navigate('/profile');
                setUserMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserCircleIcon className="h-4 w-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setUserMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>Settings</span>
            </button>
            <hr className="my-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || notificationsOpen) && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 9999 }}
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </>
  );
};


export default DashboardHeader;

