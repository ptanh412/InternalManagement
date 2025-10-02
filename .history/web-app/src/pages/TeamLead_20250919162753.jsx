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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Switch,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  Container,
  LinearProgress,
  alpha,
  useTheme,
  Badge,
  AvatarGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assignment as TaskManagementIcon,
  People as TeamOverviewIcon,
  Psychology as AIRecommendationsIcon,
  SupervisorAccount as TeamLeadIcon,
  TrendingUp as PerformanceIcon,
  Work as WorkloadIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as ModifyIcon,
  Warning as AlertIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Speed as EfficiencyIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Lightbulb as InsightIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
} from "@mui/icons-material";
import Scene from "./Scene";
import { isAuthenticated } from "../services/authenticationService";
import { useNavigate } from "react-router-dom";

// Import individual components
import TeamLeadDashboard from "../components/TeamLead/TeamLeadDashboard";
import TeamLeadTaskManagement from "../components/TeamLead/TeamLeadTaskManagement";
import TeamLeadOverview from "../components/TeamLead/TeamLeadOverview";
import TeamLeadAIRecommendations from "../components/TeamLead/TeamLeadAIRecommendations";

const TeamLead = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [urgentTasks, setUrgentTasks] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      loadNotificationCounts();
    }
  }, [navigate]);

  const loadNotificationCounts = async () => {
    try {
      // Mock data for notification counts
      setPendingApprovals(5);
      setUrgentTasks(3);
    } catch (error) {
      console.error('Failed to load notification counts:', error);
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
      component: <TeamLeadDashboard showNotification={showNotification} />,
      badge: null,
    },
    {
      label: 'Task Management',
      icon: <TaskManagementIcon />,
      component: <TeamLeadTaskManagement showNotification={showNotification} />,
      badge: pendingApprovals > 0 ? pendingApprovals : null,
    },
    {
      label: 'Team Overview',
      icon: <TeamOverviewIcon />,
      component: <TeamLeadOverview showNotification={showNotification} />,
      badge: null,
    },
    {
      label: 'AI Recommendations',
      icon: <AIRecommendationsIcon />,
      component: <TeamLeadAIRecommendations showNotification={showNotification} />,
      badge: urgentTasks > 0 ? urgentTasks : null,
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
                }}
              >
                <TeamLeadIcon />
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
                  Team Lead Dashboard
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Manage your team, approve tasks, and optimize performance
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
                    <TaskIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {pendingApprovals}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Approvals
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
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                    <AlertIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {urgentTasks}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Urgent Tasks
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
                    <PerformanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      92%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Team Efficiency
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
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      12
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Team Members
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>

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

export default TeamLead;
