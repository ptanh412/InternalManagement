import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ProjectManagerDashboard from './pages/dashboards/ProjectManagerDashboard';
import TeamLeadDashboard from './pages/dashboards/TeamLeadDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import ProjectsManagement from './pages/project-manager/ProjectsManagement';
import TeamManagement from './pages/project-manager/TeamManagement';
import TaskManagement from './pages/project-manager/TaskManagement';
import AIRecommendations from './pages/project-manager/AIRecommendations';
import RequirementsImport from './pages/project-manager/RequirementsImport';
import TeamLeadProjectsManagement from './pages/team-lead/ProjectsManagement';
import ProjectTasksView from './pages/team-lead/ProjectTasksView';
import TeamLeadTeamManagement from './pages/team-lead/TeamManagement';
import TeamLeadTaskManagement from './pages/team-lead/TaskManagement';
import TeamLeadAIRecommendations from './pages/team-lead/AIRecommendations';
import TeamLeadRequirementsImport from './pages/team-lead/RequirementsImport';
import PerformanceManagement from './pages/teamlead/PerformanceManagement';
import MyTasks from './pages/employee/MyTasks';
import TimeTracking from './pages/employee/TimeTracking';
import TaskSubmissions from './pages/employee/TaskSubmissions';
import AdminChat from './pages/admin/AdminChat';
import UserManagement from './pages/admin/UserManagement';
import CVAnalysis from './pages/admin/CVAnalysis';
import RolesDepartments from './pages/admin/RolesDepartments';
import ProjectManagerChat from './pages/project-manager/ProjectManagerChat';
import TeamLeadChat from './pages/team-lead/TeamLeadChat';
import EmployeeChat from './pages/employee/EmployeeChat';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketIOProvider } from './contexts/SocketIOContext';
import NotificationContainer from './components/NotificationContainer';
import ToastContainer from './components/notifications/ToastContainer';
import ProfilePage from './pages/shared/ProfilePage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to their appropriate dashboard based on role
    const roleRoute = user?.role?.toLowerCase().replace(' ', '-');
    return <Navigate to={`/dashboard/${roleRoute}`} replace />;
  }
  
  return children;
};

// Component for role-based dashboard routing
const RoleDashboard = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'PROJECT_MANAGER':
      return <ProjectManagerDashboard />;
    case 'TEAM_LEAD':
      return <TeamLeadDashboard />;
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    default:
      return <Dashboard />; // Fallback to generic dashboard
  }
};

// Layout wrapper component
const Layout = ({ children }) => {
  console.log("Children:", children);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const hideNavAndFooter = ['/login'].includes(location.pathname);
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/admin') ||
                          location.pathname.startsWith('/project-manager') ||
                          location.pathname.startsWith('/team-lead') ||
                          location.pathname === '/profile' ||  // Thêm dòng này
                          location.pathname.startsWith('/employee');

  if (hideNavAndFooter) {
    return <>{children}</>;
  }

  // Use DashboardLayout for authenticated dashboard routes
  if (isAuthenticated && isDashboardRoute) {
    return (
      <DashboardLayout>
        {children}
      </DashboardLayout>
    );
  }

  // Use regular layout for public pages
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketIOProvider>
          <Router>
            <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Role-based dashboard routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Specific role dashboard routes */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/project-manager"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <ProjectManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/team-lead"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/employee"
                element={
                  <ProtectedRoute allowedRoles={['USER', 'EMPLOYEE']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Project Manager specific pages */}
              <Route
                path="/project-manager/projects"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <ProjectsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project-manager/team"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <TeamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project-manager/tasks"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <TaskManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project-manager/ai-recommendations"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <AIRecommendations />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/project-manager/requirements"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <RequirementsImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project-manager/chat"
                element={
                  <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
                    <ProjectManagerChat />
                  </ProtectedRoute>
                }
              />

              {/* Admin specific pages */}
              <Route
                path="/admin/chat"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cv-analysis"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CVAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/roles-departments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <RolesDepartments />
                  </ProtectedRoute>
                }
              />

              {/* Team Lead specific pages */}
              <Route
                path="/team-lead/projects"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadProjectsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/projects/:projectId/tasks"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <ProjectTasksView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/team"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadTeamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/tasks"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadTaskManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/ai-recommendations"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadAIRecommendations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/requirements"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadRequirementsImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/chat"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD']}>
                    <TeamLeadChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-lead/performance"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEAD', 'PROJECT_MANAGER', 'ADMIN']}>
                    <PerformanceManagement />
                  </ProtectedRoute>
                }
              />

              {/* Employee specific pages */}
              <Route
                path="/employee/tasks"
                element={
                  <ProtectedRoute allowedRoles={['USER', 'EMPLOYEE']}>
                    <MyTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/time-tracking"
                element={
                  <ProtectedRoute allowedRoles={['USER', 'EMPLOYEE']}>
                    <TimeTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/submissions"
                element={
                  <ProtectedRoute allowedRoles={['USER', 'EMPLOYEE']}>
                    <TaskSubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/chat"
                element={
                  <ProtectedRoute allowedRoles={['USER', 'EMPLOYEE']}>
                    <EmployeeChat />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <NotificationContainer />
            <ToastContainer />
          </Layout>
        </Router>
        </SocketIOProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
