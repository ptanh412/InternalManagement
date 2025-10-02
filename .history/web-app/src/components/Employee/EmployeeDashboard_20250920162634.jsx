import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  Warning as OverdueIcon,
  Timeline as ProgressIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
  Flag as PriorityIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationIcon,
  Speed as SpeedIcon,
  Assessment as MetricsIcon,
  EmojiEvents as AchievementIcon,
  LocalFireDepartment as StreakIcon,
  Update as UpdateIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const EmployeeDashboard = ({ showNotification, employeeData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock dashboard data for employee
      const data = {
        assignedTasks: [
          {
            id: 1,
            title: 'Mobile App Login Feature',
            project: 'Mobile App Redesign',
            priority: 'High',
            status: 'In Progress',
            progress: 75,
            dueDate: dayjs().add(3, 'days'),
            estimatedHours: 16,
            spentHours: 12,
            description: 'Implement secure authentication with biometric support',
            dependencies: ['API Integration', 'Security Review'],
            assignedBy: 'John Smith',
            startDate: dayjs().subtract(4, 'days'),
          },
          {
            id: 2,
            title: 'Dashboard UI Improvements',
            project: 'Web App Enhancement',
            priority: 'Medium',
            status: 'Pending',
            progress: 0,
            dueDate: dayjs().add(1, 'week'),
            estimatedHours: 8,
            spentHours: 0,
            description: 'Update dashboard components with new design system',
            dependencies: ['Design System Update'],
            assignedBy: 'Jane Doe',
            startDate: dayjs().add(1, 'day'),
          },
          {
            id: 3,
            title: 'Code Review - Payment Module',
            project: 'E-commerce Platform',
            priority: 'High',
            status: 'Overdue',
            progress: 0,
            dueDate: dayjs().subtract(1, 'day'),
            estimatedHours: 4,
            spentHours: 0,
            description: 'Review payment processing implementation',
            dependencies: [],
            assignedBy: 'Mike Johnson',
            startDate: dayjs().subtract(2, 'days'),
          },
          {
            id: 4,
            title: 'API Documentation Update',
            project: 'Backend Services',
            priority: 'Low',
            status: 'Completed',
            progress: 100,
            dueDate: dayjs().subtract(2, 'days'),
            estimatedHours: 6,
            spentHours: 5,
            description: 'Update API documentation for v2.0',
            dependencies: [],
            assignedBy: 'Sarah Wilson',
            startDate: dayjs().subtract(1, 'week'),
          },
          {
            id: 5,
            title: 'Performance Optimization',
            project: 'Web App Enhancement',
            priority: 'Medium',
            status: 'In Progress',
            progress: 40,
            dueDate: dayjs().add(5, 'days'),
            estimatedHours: 12,
            spentHours: 5,
            description: 'Optimize React components for better performance',
            dependencies: ['Code Analysis'],
            assignedBy: 'John Smith',
            startDate: dayjs().subtract(2, 'days'),
          },
        ],
        upcomingDeadlines: [
          { id: 1, title: 'Mobile App Login Feature', dueDate: dayjs().add(3, 'days'), priority: 'High' },
          { id: 2, title: 'Performance Optimization', dueDate: dayjs().add(5, 'days'), priority: 'Medium' },
          { id: 3, title: 'Dashboard UI Improvements', dueDate: dayjs().add(1, 'week'), priority: 'Medium' },
        ],
        personalMetrics: {
          tasksCompleted: 142,
          onTimeCompletion: 94,
          averageTaskTime: 18.5,
          currentStreak: 12,
          thisWeekHours: 38,
          efficiency: 92,
          qualityScore: 96,
        },
        recentAchievements: [
          {
            id: 1,
            title: 'Speed Demon',
            description: 'Completed 5 tasks ahead of schedule this month',
            icon: <SpeedIcon />,
            earnedDate: dayjs().subtract(2, 'days'),
            type: 'performance',
          },
          {
            id: 2,
            title: 'Code Quality Champion',
            description: 'Maintained 95%+ code review approval rate',
            icon: <StarIcon />,
            earnedDate: dayjs().subtract(1, 'week'),
            type: 'quality',
          },
          {
            id: 3,
            title: 'Team Player',
            description: 'Helped 3 team members with their tasks',
            icon: <AchievementIcon />,
            earnedDate: dayjs().subtract(2, 'weeks'),
            type: 'collaboration',
          },
        ],
        weeklyProgress: [
          { day: 'Mon', completed: 3, planned: 4 },
          { day: 'Tue', completed: 2, planned: 3 },
          { day: 'Wed', completed: 4, planned: 4 },
          { day: 'Thu', completed: 1, planned: 2 },
          { day: 'Fri', completed: 0, planned: 3 },
        ],
      };

      setTimeout(() => {
        setDashboardData(data);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      switch (action) {
        case 'start':
          setDashboardData(prev => ({
            ...prev,
            assignedTasks: prev.assignedTasks.map(task =>
              task.id === taskId ? { ...task, status: 'In Progress' } : task
            )
          }));
          showNotification('Task started', 'success');
          break;
        case 'pause':
          setDashboardData(prev => ({
            ...prev,
            assignedTasks: prev.assignedTasks.map(task =>
              task.id === taskId ? { ...task, status: 'Paused' } : task
            )
          }));
          showNotification('Task paused', 'info');
          break;
        case 'complete':
          setDashboardData(prev => ({
            ...prev,
            assignedTasks: prev.assignedTasks.map(task =>
              task.id === taskId ? { ...task, status: 'Completed', progress: 100 } : task
            )
          }));
          showNotification('Task completed!', 'success');
          break;
        default:
          break;
      }
    } catch (error) {
      showNotification('Failed to update task', 'error');
    }
  };

  const handleProgressUpdate = async () => {
    try {
      if (selectedTask && progressUpdate.trim()) {
        // In a real app, this would update the backend
        showNotification('Progress updated successfully', 'success');
        setUpdateDialogOpen(false);
        setProgressUpdate('');
      }
    } catch (error) {
      showNotification('Failed to update progress', 'error');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'paused':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case 'performance':
        return theme.palette.primary.main;
      case 'quality':
        return theme.palette.success.main;
      case 'collaboration':
        return theme.palette.secondary.main;
      default:
        return theme.palette.info.main;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {employeeData?.name || 'Employee'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's on your plate today
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Personal Metrics */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MetricsIcon color="primary" />
                Personal Metrics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.personalMetrics.tasksCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.personalMetrics.onTimeCompletion}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      On-time Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.personalMetrics.currentStreak}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Day Streak
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.personalMetrics.efficiency}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Efficiency
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  This Week: {dashboardData.personalMetrics.thisWeekHours}/40 hours
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(dashboardData.personalMetrics.thisWeekHours / 40) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Achievements */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AchievementIcon color="secondary" />
                Recent Achievements
              </Typography>
              
              <List>
                {dashboardData.recentAchievements.map((achievement) => (
                  <ListItem key={achievement.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getAchievementColor(achievement.type) }}>
                        {achievement.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={achievement.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {achievement.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {achievement.earnedDate.fromNow()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Tasks */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TaskIcon color="primary" />
                My Current Tasks
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.assignedTasks.filter(task => task.status !== 'Completed').map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.project}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={task.progress}
                              sx={{ width: 60, height: 6 }}
                              color={getStatusColor(task.status)}
                            />
                            <Typography variant="body2">{task.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={task.status === 'Overdue' ? 'error' : 'text.primary'}
                          >
                            {task.dueDate.format('MMM DD')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {task.status === 'Pending' && (
                              <Tooltip title="Start Task">
                                <IconButton
                                  size="small"
                                  onClick={() => handleTaskAction(task.id, 'start')}
                                  color="primary"
                                >
                                  <StartIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {task.status === 'In Progress' && (
                              <>
                                <Tooltip title="Update Progress">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setUpdateDialogOpen(true);
                                    }}
                                    color="info"
                                  >
                                    <UpdateIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Mark Complete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTaskAction(task.id, 'complete')}
                                    color="success"
                                  >
                                    <CompleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="View Details">
                              <IconButton size="small" color="default">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="warning" />
                Upcoming Deadlines
              </Typography>
              
              <List>
                {dashboardData.upcomingDeadlines.map((deadline) => (
                  <ListItem key={deadline.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CalendarIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={deadline.title}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={deadline.priority}
                            size="small"
                            color={getPriorityColor(deadline.priority)}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {deadline.dueDate.fromNow()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Progress Chart */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ProgressIcon color="primary" />
                This Week's Progress
              </Typography>
              
              <Grid container spacing={2}>
                {dashboardData.weeklyProgress.map((day) => (
                  <Grid item xs key={day.day}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {day.day}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {day.completed}/{day.planned}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={day.planned > 0 ? (day.completed / day.planned) * 100 : 0}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        color={day.completed >= day.planned ? 'success' : 'primary'}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Task Progress</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedTask.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current Progress: {selectedTask.progress}%
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Progress Update"
                placeholder="Describe what you've accomplished and any blockers..."
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProgressUpdate} variant="contained">
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDashboard;
