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
import taskService from "../../services/taskService";
import { formatDate, formatDateTime, isToday } from "../../utils/dateUtils";

dayjs.extend(relativeTime);

const EmployeeDashboard = ({ showNotification, employeeData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load real data from API
      const [myTasks, stats, overdueTasks, upcomingTasks, recentActivity] = await Promise.all([
        taskService.getMyTasks(),
        taskService.getMyTaskStats(),
        taskService.getMyOverdueTasks(),
        taskService.getMyUpcomingTasks(),
        taskService.getMyRecentActivity()
      ]);

      // Format tasks for display
      const formattedTasks = myTasks.map(task => taskService.formatTaskForDisplay(task));

      const data = {
        assignedTasks: formattedTasks,
        upcomingDeadlines: upcomingTasks.slice(0, 5), // Show top 5 upcoming deadlines
        overdueItems: overdueTasks.slice(0, 3), // Show top 3 overdue items
        recentActivity: recentActivity.slice(0, 5), // Show last 5 activities
        todaysTasks: formattedTasks.filter(task => isToday(task.dueDate)),
        weeklyProgress: {
          completed: stats.completed,
          total: stats.total,
          percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        },
        priorities: {
          high: formattedTasks.filter(task => task.priority === 'HIGH' && task.status !== 'DONE').length,
          medium: formattedTasks.filter(task => task.priority === 'MEDIUM' && task.status !== 'DONE').length,
          low: formattedTasks.filter(task => task.priority === 'LOW' && task.status !== 'DONE').length,
        }
      };

      setDashboardData(data);
      setTaskStats(stats);
      
      if (showNotification) {
        showNotification(`Dashboard loaded successfully. You have ${stats.total} tasks assigned.`, 'success');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (showNotification) {
        showNotification('Failed to load dashboard data. Please try again.', 'error');
      }
      
      // Fallback to empty data structure
      setDashboardData({
        assignedTasks: [],
        upcomingDeadlines: [],
        overdueItems: [],
        recentActivity: [],
        todaysTasks: [],
        weeklyProgress: { completed: 0, total: 0, percentage: 0 },
        priorities: { high: 0, medium: 0, low: 0 }
      });
      setTaskStats({ total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId, action, value = null) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'updateStatus':
          await taskService.updateTaskStatus(taskId, { status: value });
          showNotification(`Task status updated to ${value}`, 'success');
          break;
        case 'updateProgress':
          await taskService.updateTaskProgress(taskId, { progressPercentage: value });
          showNotification(`Task progress updated to ${value}%`, 'success');
          break;
        default:
          break;
      }
      
      // Reload dashboard data after action
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to perform task action:', error);
      showNotification('Failed to update task. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async () => {
    if (!selectedTask || !progressUpdate) return;
    
    try {
      const progressValue = parseInt(progressUpdate);
      if (progressValue < 0 || progressValue > 100) {
        showNotification('Progress must be between 0 and 100', 'error');
        return;
      }
      
      await handleTaskAction(selectedTask.id, 'updateProgress', progressValue);
      setUpdateDialogOpen(false);
      setProgressUpdate('');
      setSelectedTask(null);
    } catch (error) {
      showNotification('Invalid progress value', 'error');
    }
  };

  const getTaskPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return <PriorityIcon sx={{ color: '#f44336' }} />;
      case 'MEDIUM':
        return <PriorityIcon sx={{ color: '#ff9800' }} />;
      case 'LOW':
        return <PriorityIcon sx={{ color: '#4caf50' }} />;
      default:
        return <PriorityIcon sx={{ color: '#757575' }} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DONE':
        return <CompleteIcon sx={{ color: '#4caf50' }} />;
      case 'IN_PROGRESS':
        return <ProgressIcon sx={{ color: '#2196f3' }} />;
      case 'TODO':
        return <ScheduleIcon sx={{ color: '#757575' }} />;
      default:
        return <TaskIcon sx={{ color: '#757575' }} />;
    }
  };

  const getAchievementColor = (type) => {
    const colors = {
      'streak': '#ff9800',
      'completion': '#4caf50',
      'efficiency': '#2196f3',
      'milestone': '#9c27b0'
    };
    return colors[type] || '#757575';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'TODO':
        return 'default';
      case 'BLOCKED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          No dashboard data available
        </Typography>
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
        {/* Task Statistics Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TaskIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    {taskStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tasks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ProgressIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                    {taskStats.inProgress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CompleteIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {taskStats.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <OverdueIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                    {taskStats.overdue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Current Tasks */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TaskIcon color="primary" />
                  My Current Tasks ({dashboardData.assignedTasks.filter(task => task.status !== 'DONE').length})
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<UpdateIcon />}
                  onClick={loadDashboardData}
                >
                  Refresh
                </Button>
              </Box>
              
              {dashboardData.assignedTasks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TaskIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No tasks assigned yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You're all caught up! Check back later for new assignments.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Task</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.assignedTasks.filter(task => task.status !== 'DONE').slice(0, 5).map((task) => (
                        <TableRow key={task.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {task.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {task.projectName || 'No Project'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(task.status)}
                              label={task.status?.replace('_', ' ') || 'TODO'}
                              size="small"
                              color={getStatusColor(task.status)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getTaskPriorityIcon(task.priority)}
                              label={task.priority || 'MEDIUM'}
                              size="small"
                              color={getPriorityColor(task.priority)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={task.progressPercentage || 0}
                                sx={{ width: 80, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2">{task.progressPercentage || 0}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {task.dueDate ? (
                              <Typography
                                variant="body2"
                                color={task.isOverdue ? 'error' : 'text.primary'}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                              >
                                {task.isOverdue && <OverdueIcon fontSize="small" />}
                                {formatDate(task.dueDate)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No due date
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {task.status === 'TODO' && (
                                <Tooltip title="Start Task">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTaskAction(task.id, 'updateStatus', 'IN_PROGRESS')}
                                    color="primary"
                                  >
                                    <StartIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <>
                                  <Tooltip title="Update Progress">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setProgressUpdate(task.progressPercentage?.toString() || '0');
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
                                      onClick={() => handleTaskAction(task.id, 'updateStatus', 'DONE')}
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
              )}

              {dashboardData.assignedTasks.filter(task => task.status !== 'DONE').length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button variant="text" color="primary">
                    View All Tasks ({dashboardData.assignedTasks.filter(task => task.status !== 'DONE').length - 5} more)
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Deadlines & Quick Actions */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Upcoming Deadlines */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="warning" />
                    Upcoming Deadlines
                  </Typography>

                  {dashboardData.upcomingDeadlines.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No upcoming deadlines
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {dashboardData.upcomingDeadlines.map((task) => (
                        <ListItem key={task.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CalendarIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {task.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={task.priority || 'MEDIUM'}
                                  size="small"
                                  color={getPriorityColor(task.priority)}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {task.daysUntilDue !== null ?
                                    (task.daysUntilDue <= 0 ? 'Overdue' : `${task.daysUntilDue} days left`) :
                                    dayjs(task.dueDate).fromNow()
                                  }
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Today's Tasks */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon color="info" />
                    Today's Tasks ({dashboardData.todaysTasks.length})
                  </Typography>

                  {dashboardData.todaysTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No tasks due today
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {dashboardData.todaysTasks.map((task) => (
                        <ListItem key={task.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            {getStatusIcon(task.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {task.title}
                              </Typography>
                            }
                            secondary={
                              <LinearProgress
                                variant="determinate"
                                value={task.progressPercentage || 0}
                                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Weekly Progress Summary */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Weekly Progress Summary
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    {dashboardData.weeklyProgress.percentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weekly Goal
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.weeklyProgress.percentage}
                    sx={{ height: 12, borderRadius: 6 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {dashboardData.weeklyProgress.completed} of {dashboardData.weeklyProgress.total} tasks completed
                  </Typography>
                </Box>
              </Box>
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
                Current Progress: {selectedTask.progressPercentage || 0}%
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Progress Percentage"
                placeholder="Enter progress (0-100)"
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
                sx={{ mb: 2 }}
              />
              <LinearProgress
                variant="determinate"
                value={parseInt(progressUpdate) || 0}
                sx={{ height: 8, borderRadius: 4 }}
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
