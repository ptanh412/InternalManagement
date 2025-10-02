import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Container,
  LinearProgress,
  alpha,
  useTheme,
  Badge,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assignment as TaskDetailsIcon,
  Person as ProfileIcon,
  History as ActivityLogIcon,
  Employee as EmployeeIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Warning as OverdueIcon,
  TrendingUp as ProgressIcon,
  Star as StarIcon,
  Work as WorkIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import Scene from "./Scene";
import { isAuthenticated } from "../services/authenticationService";
import { useNavigate } from "react-router-dom";

// Import individual components
import EmployeeDashboard from "../components/Employee/EmployeeDashboard";
import EmployeeTaskDetails from "../components/Employee/EmployeeTaskDetails";
import EmployeeProfile from "../components/Employee/EmployeeProfile";
import EmployeeActivityLog from "../components/Employee/EmployeeActivityLog";

const Employee = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [employeeData, setEmployeeData] = useState(null);
  const [taskCounts, setTaskCounts] = useState({
    assigned: 0,
    completed: 0,
    overdue: 0,
    inProgress: 0,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      loadEmployeeData();
    }
  }, [navigate]);

  const loadEmployeeData = async () => {
    try {
      // Mock current employee data
      const mockEmployeeData = {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        role: 'Senior Frontend Developer',
        department: 'Engineering',
        avatar: 'AJ',
        joinDate: '2023-01-15',
        currentProjects: ['Mobile App Redesign', 'API Gateway Enhancement'],
        skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'CSS'],
        level: 'Senior',
        manager: 'John Smith',
        location: 'New York, NY',
        workSchedule: 'Full-time',
      };

      const mockTaskCounts = {
        assigned: 8,
        completed: 142,
        overdue: 1,
        inProgress: 5,
      };

      setEmployeeData(mockEmployeeData);
      setTaskCounts(mockTaskCounts);
    } catch (error) {
      console.error('Failed to load employee data:', error);
      showNotification('Failed to load employee data', 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const tabConfig = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      component: <EmployeeDashboard showNotification={showNotification} employeeData={employeeData} />,
      badge: null,
    },
    {
      label: 'Task Details',
      icon: <TaskDetailsIcon />,
      component: <EmployeeTaskDetails showNotification={showNotification} employeeData={employeeData} />,
      badge: taskCounts.assigned > 0 ? taskCounts.assigned : null,
    },
    {
      label: 'Profile',
      icon: <ProfileIcon />,
      component: <EmployeeProfile showNotification={showNotification} employeeData={employeeData} setEmployeeData={setEmployeeData} />,
      badge: null,
    },
    {
      label: 'Activity Log',
      icon: <ActivityLogIcon />,
      component: <EmployeeActivityLog showNotification={showNotification} employeeData={employeeData} />,
      badge: null,
    }
  ];

  return (
    <Scene darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          p: 3,
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 48,
                  height: 48,
                  fontSize: '1.2rem',
                }}
              >
                {employeeData?.avatar || 'E'}
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 'bold',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Employee Portal
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {employeeData ? `Welcome back, ${employeeData.name}` : 'Welcome to your workspace'}
                </Typography>
              </Box>
            </Box>

            {/* Quick Stats Bar */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <WorkIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {taskCounts.assigned}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assigned Tasks
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                    <PendingIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {taskCounts.inProgress}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                    <CompleteIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {taskCounts.completed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                    <OverdueIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {taskCounts.overdue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Overdue
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Employee Info Card */}
          {employeeData && (
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 60, height: 60, fontSize: '1.5rem' }}>
                      {employeeData.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {employeeData.name}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {employeeData.role}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employeeData.department} • {employeeData.location}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Current Projects
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {employeeData.currentProjects.map((project) => (
                        <Chip key={project} label={project} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Navigation Tabs */}
          <Paper
            elevation={2}
            sx={{
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                },
                '& .Mui-selected': {
                  color: theme.palette.primary.main,
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              {tabConfig.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.label}
                      {tab.badge && (
                        <Badge
                          badgeContent={tab.badge}
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              right: -8,
                              top: -4,
                            },
                          }}
                        >
                          <Box />
                        </Badge>
                      )}
                    </Box>
                  }
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{
                    '& .MuiTab-iconWrapper': {
                      marginBottom: '0 !important',
                      marginRight: 1,
                    },
                  }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box sx={{ minHeight: 600 }}>
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400,
                }}
              >
                <CircularProgress size={48} />
              </Box>
            ) : (
              tabConfig[activeTab]?.component
            )}
          </Box>
        </Container>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Scene>
  );
};

export default Employee;
