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

const ProjectDashboard = ({ showNotification }) => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProjects: 24,
      activeProjects: 18,
      completedProjects: 6,
      totalTasks: 156,
      completedTasks: 89,
      pendingTasks: 45,
      overdueTasksCount: 22,
      teamMembers: 32,
    },
    recentProjects: [],
    urgentTasks: [],
    teamPerformance: [],
    aiRecommendations: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDashboardData({
        stats: {
          totalProjects: 24,
          activeProjects: 18,
          completedProjects: 6,
          totalTasks: 156,
          completedTasks: 89,
          pendingTasks: 45,
          overdueTasksCount: 22,
          teamMembers: 32,
        },
        recentProjects: [
          {
            id: 1,
            name: 'E-commerce Platform',
            progress: 75,
            status: 'In Progress',
            priority: 'High',
            dueDate: '2024-02-15',
            team: ['Alice Johnson', 'Bob Smith', 'Carol Davis'],
            tasksCompleted: 28,
            totalTasks: 35,
          },
          {
            id: 2,
            name: 'Mobile App Redesign',
            progress: 45,
            status: 'In Progress',
            priority: 'Medium',
            dueDate: '2024-03-01',
            team: ['David Wilson', 'Eva Brown'],
            tasksCompleted: 15,
            totalTasks: 30,
          },
          {
            id: 3,
            name: 'AI Integration',
            progress: 90,
            status: 'Review',
            priority: 'High',
            dueDate: '2024-01-30',
            team: ['Frank Miller', 'Grace Lee', 'Henry Taylor'],
            tasksCompleted: 22,
            totalTasks: 25,
          },
        ],
        urgentTasks: [
          {
            id: 1,
            title: 'Fix payment gateway bug',
            project: 'E-commerce Platform',
            assignee: 'Alice Johnson',
            dueDate: '2024-01-25',
            priority: 'Critical',
            overdue: true,
          },
          {
            id: 2,
            title: 'Update API documentation',
            project: 'Mobile App Redesign',
            assignee: 'David Wilson',
            dueDate: '2024-01-26',
            priority: 'High',
            overdue: false,
          },
          {
            id: 3,
            title: 'Code review for AI module',
            project: 'AI Integration',
            assignee: 'Frank Miller',
            dueDate: '2024-01-27',
            priority: 'High',
            overdue: false,
          },
        ],
        teamPerformance: [
          {
            id: 1,
            name: 'Alice Johnson',
            avatar: '/avatars/alice.jpg',
            role: 'Frontend Developer',
            tasksCompleted: 12,
            tasksInProgress: 3,
            efficiency: 95,
            workload: 'High',
          },
          {
            id: 2,
            name: 'Bob Smith',
            avatar: '/avatars/bob.jpg',
            role: 'Backend Developer',
            tasksCompleted: 8,
            tasksInProgress: 5,
            efficiency: 87,
            workload: 'Medium',
          },
          {
            id: 3,
            name: 'Carol Davis',
            avatar: '/avatars/carol.jpg',
            role: 'UI/UX Designer',
            tasksCompleted: 15,
            tasksInProgress: 2,
            efficiency: 92,
            workload: 'Low',
          },
        ],
        aiRecommendations: [
          {
            id: 1,
            type: 'Resource Allocation',
            title: 'Reassign overloaded team members',
            description: 'Alice Johnson has high workload. Consider redistributing tasks to Carol Davis.',
            priority: 'Medium',
            impact: 'High',
          },
          {
            id: 2,
            type: 'Schedule Optimization',
            title: 'Adjust project timeline',
            description: 'E-commerce Platform may miss deadline. Consider extending by 1 week.',
            priority: 'High',
            impact: 'Medium',
          },
          {
            id: 3,
            type: 'Skill Development',
            title: 'Training recommendation',
            description: 'Team could benefit from React advanced patterns training.',
            priority: 'Low',
            impact: 'High',
          },
        ],
      });
      showNotification('Dashboard data loaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Review':
        return 'warning';
      case 'On Hold':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
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
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ProjectIcon />}
            title="Total Projects"
            value={dashboardData.stats.totalProjects}
            subtitle={`${dashboardData.stats.activeProjects} active`}
            trend={{ direction: 'up', value: 12 }}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TaskIcon />}
            title="Total Tasks"
            value={dashboardData.stats.totalTasks}
            subtitle={`${dashboardData.stats.completedTasks} completed`}
            trend={{ direction: 'up', value: 8 }}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<WarningIcon />}
            title="Overdue Tasks"
            value={dashboardData.stats.overdueTasksCount}
            subtitle="Need attention"
            trend={{ direction: 'down', value: 15 }}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TeamIcon />}
            title="Team Members"
            value={dashboardData.stats.teamMembers}
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
                <IconButton onClick={loadDashboardData}>
                  <RefreshIcon />
                </IconButton>
              </Box>
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
                            <Chip
                              label={project.priority}
                              size="small"
                              color={getPriorityColor(project.priority)}
                              variant="filled"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Due: {new Date(project.dueDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {project.tasksCompleted}/{project.totalTasks} tasks
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={project.progress}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
                                {project.progress}%
                              </Typography>
                            </Box>
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
                  <List dense>
                    {dashboardData.urgentTasks.map((task, index) => (
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
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < dashboardData.urgentTasks.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
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
