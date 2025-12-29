import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { getNavigationForRole, getRoleColor } from '../constants/navigation';

const SidebarMenu = ({ isOpen, onToggle, isMobile = false, isCollapsed, setIsCollapsed }) => {
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const { user, getUserRole } = useAuth();
  const location = useLocation();
  const userRole = getUserRole();

  // console.log("SidebarMenu rendered for route:", location.pathname);

  // Get navigation items based on user role
  const navigationItems = getNavigationForRole(userRole);
  const roleColor = getRoleColor(userRole);

  // Use prop state for desktop, local state for mobile (which doesn't collapse)
  const collapsed = isMobile ? false : (isCollapsed !== undefined ? isCollapsed : localCollapsed);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setLocalCollapsed(false); // Never collapse on mobile
    }
  }, [isMobile]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile && onToggle) {
      onToggle(false);
    }
  }, [location.pathname, isMobile, onToggle]);

  const handleItemClick = () => {
    if (isMobile && onToggle) {
      onToggle(false);
    }
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      if (setIsCollapsed) {
        // Use parent state if available (desktop)
        setIsCollapsed(!isCollapsed);
      } else {
        // Fallback to local state
        setLocalCollapsed(!localCollapsed);
      }
    }
  };

  // Determine if current path matches navigation item
  const isCurrentPath = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const sidebarClasses = `
    ${isMobile ? 'fixed inset-y-0 left-0 z-50' : ''}
    ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
    ${!isMobile && collapsed ? 'w-16' : 'w-64'}
    transition-all duration-300 ease-in-out
    bg-gradient-to-b from-white via-blue-50/30 to-indigo-100/50 backdrop-blur-lg shadow-xl border-r border-white/20
    flex flex-col h-full dark:bg-black dark:from-gray-900/80 dark:via-gray-800/60 dark:to-gray-800/80
  `;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Sidebar */}
      <div className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-900/20 dark:to-purple-900/20">
          {(!collapsed || isMobile) && (
            <div className="flex items-center space-x-3 animate-slideInFromLeft">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover-glow">
                  <span className="text-white font-bold text-sm">IMS</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold gradient-text truncate dark:text-white">
                  Management
                </h1>
                {user && (
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 animate-fadeInScale`}>
                    {userRole?.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Toggle buttons */}
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-110"
              >
                {collapsed ? (
                  <ChevronRightIcon className="w-4 h-4" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {isMobile && (
              <button
                onClick={() => onToggle(false)}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:scale-110"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (!collapsed || isMobile) && (
          <div className="p-4 border-b border-white/20 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 animate-slideInFromBottom dark:from-indigo-900/50 dark:to-blue-900/50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-gentleBounce hover-glow dark:from-blue-400 dark:to-purple-500">
                  <span className="text-white font-bold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate dark:text-white">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate dark:text-gray-400 dark:text-gray-500">
                  {user.email || ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto sidebar-scrollbar">
          {navigationItems.map((item) => {
            const isActive = isCurrentPath(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleItemClick}
                className={`
                  group flex items-center text-sm font-medium rounded-xl transition-all duration-300 hover-lift
                  ${collapsed && !isMobile ? 'px-3 py-3 justify-center' : 'px-3 py-3'}
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg animate-glow' 
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gradient-to-r dark:hover:from-blue-800/50 dark:hover:to-purple-800/50 dark:hover:text-blue-300'
                  }
                `}
                title={collapsed && !isMobile ? item.name : ''}
              >
                <Icon className={`
                  flex-shrink-0 h-5 w-5 transition-all duration-300
                  ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}
                  ${!collapsed || isMobile ? 'mr-3' : ''}
                `} />
                
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.name}</span>
                )}
                
                {(!collapsed || isMobile) && item.badge && (
                  <span className="ml-auto inline-block py-1 px-2 text-xs font-medium rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default SidebarMenu;