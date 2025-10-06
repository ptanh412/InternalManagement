import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  AvatarGroup,
  Tooltip,
  Button,
  Badge,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as ProjectIcon,
  Task as TaskIcon,
  People as TeamIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  BugReport as BugIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  AccessTime as ClockIcon,
  Flag as FlagIcon,
  Psychology as AIIcon,
  Lightbulb as IdeaIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { getCurrentUser, getProjectsForUser, getTasksForUser, isTeamLead } from '../../services/userService';
import { formatDate, isOverdue } from '../../utils/dateUtils';

const ProjectDashboard = ({ showNotification }) => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasksCount: 0,
      teamMembers: 0,
    },
    recentProjects: [],
    urgentTasks: [],
    teamPerformance: [],
    aiRecommendations: [],
  });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (currentUser && userRole) {
      loadDashboardData();
    }
  }, [currentUser, userRole]);

  const loadUserInfo = async () => {
    try {
      console.log('Loading user info...');
      const user = await getCurrentUser();
      console.log('User loaded:', user);
      setCurrentUser(user);
      setUserRole(user.roleName);
      console.log('User role set:', user.roleName);
    } catch (error) {
      console.error('Failed to load user info:', error);
      if (showNotification) {
        showNotification('Failed to load user information', 'error');
      }
    }
  };

  const loadDashboardData = async () => {
    console.log('loadDashboardData called with:', { currentUser: currentUser?.id, userRole });

    if (!currentUser || !userRole) {
      console.log('Skipping dashboard data load - missing user or role');
      return;
    }

    setLoading(true);
    try {
      console.log('Loading projects and tasks...');
      // Load projects based on user role
      const projects = await getProjectsForUser(currentUser.id, userRole);
      console.log('Projects loaded:', projects);

      // Load tasks based on user role
      // const tasks = await getTasksForUser(currentUser.id, userRole);
      // console.log('Tasks loaded:', tasks);

      // Calculate stats based on filtered data
      // const stats = calculateStats(projects, tasks);

      // Map projects to the expected format for Recent Projects display
      const mappedRecentProjects = projects.slice(0, 5).map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
        dueDate: project.endDate || project.dueDate,
        progress: project.completionPercentage || 0,
        totalTasks: project.totalTasks || 0,
        tasksCompleted: project.completedTasks || 0,
        team: project.teamMembers || [], // This might need to be fetched separately
        description: project.description,
        budget: project.budget,
        createdAt: project.createdAt
      }));

      // // Map tasks to the expected format for Urgent Tasks display
      // const mappedUrgentTasks = tasks
      //   .filter(task => task.priority === 'HIGH' || task.priority === 'URGENT' || task.priority === 'CRITICAL')
      //   .slice(0, 10)
      //   .map(task => ({
      //     id: task.id,
      //     title: task.title,
      //     priority: task.priority,
      //     dueDate: task.dueDate,
      //     project: task.projectName || 'Unknown Project',
      //     assignee: task.assigneeName || task.assigneeId || 'Unassigned',
      //     overdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'DONE' : false,
      //     status: task.status
      //   }));

      setDashboardData({
        // stats,
        recentProjects: mappedRecentProjects,
        // urgentTasks: mappedUrgentTasks,
        teamPerformance: [],
        aiRecommendations: generateMockAIRecommendations(), // Add mock AI recommendations
      });

      console.log('Dashboard data updated successfully');

      if (isTeamLead(userRole)) {
        if (showNotification) {
          showNotification(`Showing projects and tasks for Team Lead: ${currentUser.firstName} ${currentUser.lastName}`, 'info');
        }
      } else if (userRole === 'PROJECT_MANAGER') {
        if (showNotification) {
          showNotification(`Showing projects for Project Manager: ${currentUser.firstName} ${currentUser.lastName}`, 'info');
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (showNotification) {
        showNotification('Failed to load dashboard data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate mock AI recommendations for now
  const generateMockAIRecommendations = () => [
    {
      id: 1,
      title: "Resource Optimization",
      type: "Performance",
      priority: "High",
      description: "Consider redistributing tasks to balance workload across team members.",
      impact: "15% efficiency increase"
    },
    {
      id: 2,
      title: "Deadline Risk",
      type: "Schedule",
      priority: "Medium",
      description: "Project Alpha may miss deadline. Suggest adding 2 more developers.",
      impact: "On-time delivery"
    },
    {
      id: 3,
      title: "Budget Alert",
      type: "Financial",
      priority: "Low",
      description: "Current spending is 10% under budget. Consider investing in automation tools.",
      impact: "Cost optimization"
    }
  ];

  const calculateStats = (projects, tasks) => {
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'DONE').length;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasksCount: overdueTasks,
      teamMembers: 0, // This would need to be calculated from project members
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return 'success';
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'primary';
      case 'PLANNING':
      case 'TODO':
        return 'info';
      case 'ON_HOLD':
      case 'PAUSED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getWorkloadColor = (workload) => {
    switch (workload) {
      case 'High':
        return theme.palette.error.main;
      case 'Medium':
        return theme.palette.warning.main;
      case 'Low':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const StatCard = ({ icon, title, value, subtitle, trend, color = 'primary' }) => (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].main, 0.05)})`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette[color].main,
              width: 48,
              height: 48,
              mr: 2,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: theme.palette[color].main }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend.direction === 'up' ? (
              <ArrowUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
            ) : (
              <ArrowDownIcon sx={{ color: theme.palette.error.main, fontSize: 16, mr: 0.5 }} />
            )}
            <Typography variant="caption" color={trend.direction === 'up' ? 'success.main' : 'error.main'}>
              {trend.value}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ProjectIcon />}
            title="Total Projects"
            value={dashboardData?.stats?.totalProjects}
            subtitle={`${dashboardData?.stats?.activeProjects} active`}
            trend={{ direction: 'up', value: 12 }}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TaskIcon />}
            title="Total Tasks"
            value={dashboardData?.stats?.totalTasks}
            subtitle={`${dashboardData?.stats?.completedTasks} completed`}
            trend={{ direction: 'up', value: 8 }}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<WarningIcon />}
            title="Overdue Tasks"
            value={dashboardData?.stats?.overdueTasksCount}
            subtitle="Need attention"
            trend={{ direction: 'down', value: 15 }}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TeamIcon />}
            title="Team Members"
            value={dashboardData?.stats?.teamMembers}
            subtitle="Active members"
            trend={{ direction: 'up', value: 5 }}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Projects */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <ProjectIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Recent Projects
                </Typography>
                <IconButton onClick={loadDashboardData} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              {dashboardData.recentProjects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ProjectIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No projects found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userRole === 'PROJECT_MANAGER'
                      ? 'You are not leading any projects yet.'
                      : 'No projects available to display.'
                    }
                  </Typography>
                </Box>
              ) : (
                <List>
                  {dashboardData.recentProjects.map((project, index) => (
                    <React.Fragment key={project.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <ProjectIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {project.name}
                              </Typography>
                              <Chip
                                label={project.status}
                                size="small"
                                color={getStatusColor(project.status)}
                                variant="outlined"
                              />
                              {project.priority && (
                                <Chip
                                  label={project.priority}
                                  size="small"
                                  color={getPriorityColor(project.priority)}
                                  variant="filled"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Due: {formatDate(project.dueDate)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {project.tasksCompleted}/{project.totalTasks} tasks
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.round(project.progress)}
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
                                  {Math.round(project.progress)}%
                                </Typography>
                              </Box>
                              {project.team && project.team.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                                    {project.team.map((member, idx) => (
                                      <Tooltip key={idx} title={member}>
                                        <Avatar sx={{ fontSize: '0.75rem' }}>
                                          {member.split(' ').map(n => n[0]).join('')}
                                        </Avatar>
                                      </Tooltip>
                                    ))}
                                  </AvatarGroup>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton>
                            <MoreVertIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < dashboardData.recentProjects.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Urgent Tasks */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                    Urgent Tasks
                  </Typography>

                  {dashboardData?.urgentTasks?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CheckCircleIcon sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No urgent tasks
                      </Typography>
                    </Box>
                  ) : (
                    <List dense>
                      {dashboardData?.urgentTasks?.map((task, index) => (
                        <React.Fragment key={task.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: task.overdue ? theme.palette.error.main : theme.palette.warning.main,
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                {task.overdue ? <BugIcon sx={{ fontSize: 16 }} /> : <ClockIcon sx={{ fontSize: 16 }} />}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {task.title}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {task.project} • {task.assignee}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption" color={task.overdue ? 'error' : 'text.secondary'}>
                                    Due: {formatDate(task.dueDate)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < dashboardData.urgentTasks.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* AI Recommendations */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AIIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                    AI Recommendations
                  </Typography>
                  <List dense>
                    {dashboardData.aiRecommendations.map((rec, index) => (
                      <React.Fragment key={rec.id}>
                        <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: theme.palette.secondary.main,
                                width: 32,
                                height: 32,
                              }}
                            >
                              <IdeaIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {rec.title}
                                </Typography>
                                <Chip
                                  label={rec.priority}
                                  size="small"
                                  color={getPriorityColor(rec.priority)}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {rec.type}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {rec.description}
                                </Typography>
                                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                                  Impact: {rec.impact}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < dashboardData.aiRecommendations.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDashboard;
