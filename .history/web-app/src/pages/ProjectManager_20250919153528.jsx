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
  Fab,
  Badge,
  AvatarGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  DatePicker,
  LocalizationProvider,
} from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Dashboard as DashboardIcon,
  Assignment as ProjectIcon,
  Task as TaskIcon,
  People as TeamIcon,
  Assessment as ReportsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Flag as FlagIcon,
  BugReport as BugIcon,
  Speed as SpeedIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as CompletedIcon,
  AccessTime as InProgressIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Psychology as AIIcon,
  Lightbulb as IdeaIcon,
  Insights as InsightsIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import Scene from "./Scene";
import { isAuthenticated, logOut } from "../services/authenticationService";
import { useNavigate } from "react-router-dom";

// Import individual components
import ProjectDashboard from "../components/ProjectManager/ProjectDashboard";
import ProjectManagement from "../components/ProjectManager/ProjectManagement";
import TaskManagement from "../components/ProjectManager/TaskManagement";
import TeamManagement from "../components/ProjectManager/TeamManagement";
import ProjectReports from "../components/ProjectManager/ProjectReports";

const ProjectManager = ({ darkMode, onToggleDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

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
      component: <ProjectDashboard showNotification={showNotification} />
    },
    {
      label: 'Projects',
      icon: <ProjectIcon />,
      component: <ProjectManagement showNotification={showNotification} />
    },
    {
      label: 'Tasks',
      icon: <TaskIcon />,
      component: <TaskManagement showNotification={showNotification} />
    },
    {
      label: 'Team',
      icon: <TeamIcon />,
      component: <TeamManagement showNotification={showNotification} />
    },
    {
      label: 'Reports',
      icon: <ReportsIcon />,
      component: <ProjectReports showNotification={showNotification} />
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
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Project Manager
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage projects, tasks, and teams with AI-powered insights
            </Typography>
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
                  label={tab.label}
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

export default ProjectManager;
