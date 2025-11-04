import React, { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import DashboardHeader from './DashboardHeader';
import { useAuth } from '../hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  // Check if current route is a chat page
  const isChatPage = location.pathname.includes('/chat');

  // Don't render layout for unauthenticated users
  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className={`${isChatPage ? 'h-screen' : 'min-h-screen'} bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100`}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg text-gray-700 hover:text-gray-900 hover:bg-white transition-all duration-300 hover:scale-105 border border-white/20"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      <div className={`flex ${isChatPage ? 'h-full' : ''}`}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SidebarMenu 
            isOpen={true}
            onToggle={() => {}}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar */}
        <SidebarMenu 
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
          isMobile={true}
        />

        {/* Main Content */}
        <div className={`flex-1 lg:ml-0 flex flex-col ${isChatPage ? 'h-full' : ''} min-h-0`}>
          {/* Beautiful Header - Ensure it's above all other content */}
          <div className="sticky top-0 z-40 flex-shrink-0">
            <DashboardHeader title="Dashboard" subtitle="Welcome back!" />
          </div>

          {/* Page Content */}
          <main className={`flex-1 ${isChatPage ? 'overflow-hidden h-full' : 'p-6'} min-h-0`}>
            {isChatPage ? (
              <div className="h-full w-full">
                {children}
              </div>
            ) : (
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;