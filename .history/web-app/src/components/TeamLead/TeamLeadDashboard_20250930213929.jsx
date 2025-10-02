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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Button,
  AvatarGroup,
  alpha,
  useTheme,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Container,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assignment as TaskIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Warning as UrgentIcon,
  Person as PersonIcon,
  Group as TeamIcon,
  Speed as EfficiencyIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Work as WorkIcon,
  Lightbulb as InsightIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationIcon,
  Flag as PriorityIcon,
  Assessment as ReportIcon,
  ThumbUp as ThumbUpIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import taskService from "../../services/taskService";
import { getMyInfo } from "../../services/userService";

const TeamLeadDashboard = ({ showNotification }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load real task data
      const [tasksResponse, userResponse, teamStatsResponse] = await Promise.all([
        taskService.getAllTasks(),
        getMyInfo().catch(() => ({ data: { result: null } })),
        taskService.getTeamTaskStats().catch(() => ({ result: {} }))
      ]);

      const tasks = tasksResponse.result || [];
      const user = userResponse.data?.result;
      const teamStats = teamStatsResponse.result || {};

      setCurrentUser(user);

      // Calculate metrics from real data
      const completedTasks = tasks.filter(task => task.status === 'DONE').length;
      const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
      const totalTasks = tasks.length;
      const overdueTasks = tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
      ).length;

      // Create workload data from task assignments
      const assigneeWorkload = tasks.reduce((acc, task) => {
        if (task.assignedTo) {
          if (!acc[task.assignedTo]) {
            acc[task.assignedTo] = {
              name: task.assignedTo,
              tasks: [],
              workload: 0,
              efficiency: 85 + Math.floor(Math.random() * 15), // Mock efficiency
            };
          }
          acc[task.assignedTo].tasks.push(task);
          acc[task.assignedTo].workload += task.estimatedHours || 8;
        }
        return acc;
      }, {});

      const workloadData = Object.values(assigneeWorkload).map(user => ({
        ...user,
        avatar: user.name.split(' ').map(n => n[0]).join(''),
        workload: Math.min(user.workload, 100), // Cap at 100%
      }));

      // Create recent activities from tasks
      const recentActivities = tasks
        .filter(task => task.updatedAt)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map((task, index) => ({
          id: index + 1,
          type: getActivityType(task.status),
          message: `${task.assignedTo || 'Unassigned'} - ${task.title}`,
          timestamp: dayjs(task.updatedAt),
          priority: (task.priority || 'MEDIUM').toLowerCase(),
        }));

      // Group tasks by project
      const projectSummary = tasks.reduce((acc, task) => {
        const projectId = task.projectId || 'Unknown';
        if (!acc[projectId]) {
          acc[projectId] = {
            id: projectId,
            name: projectId,
            tasks: [],
            progress: 0,
            team: new Set(),
            status: 'On Track',
            dueDate: null,
          };
        }
        
        acc[projectId].tasks.push(task);
        if (task.assignedTo) {
          acc[projectId].team.add(task.assignedTo);
        }
        if (task.dueDate && (!acc[projectId].dueDate || task.dueDate < acc[projectId].dueDate)) {
          acc[projectId].dueDate = dayjs(task.dueDate);
        }
        
        return acc;
      }, {});

      const projectSummaryArray = Object.values(projectSummary).map(project => ({
        ...project,
        team: Array.from(project.team),
        progress: project.tasks.length > 0 
          ? Math.round(project.tasks.reduce((sum, task) => sum + (task.progressPercentage || 0), 0) / project.tasks.length)
          : 0,
        status: project.tasks.some(task => 
          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
        ) ? 'At Risk' : 'On Track',
      }));

      const data = {
        teamMetrics: {
          totalMembers: workloadData.length,
          activeProjects: projectSummaryArray.length,
          completedTasks,
          inProgressTasks,
          totalTasks,
          overdueTasks,
          overallEfficiency: workloadData.length > 0 
            ? Math.round(workloadData.reduce((sum, user) => sum + user.efficiency, 0) / workloadData.length)
            : 0,
          weeklyProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          onTimeDelivery: totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100,
        },
        workloadData: workloadData.slice(0, 6), // Limit to 6 for display
        recentActivities,
        projectSummary: projectSummaryArray.slice(0, 3), // Limit to 3 for display
        aiInsights: [
          {
            id: 1,
            type: 'workload',
            title: 'Team Performance Analysis',
            description: `${totalTasks} total tasks with ${completedTasks} completed. ${overdueTasks} tasks are overdue.`,
            impact: overdueTasks > 0 ? 'High' : 'Low',
            confidence: 95,
          },
          {
            id: 2,
            type: 'efficiency',
            title: 'Task Distribution Insights',
            description: `Tasks are distributed across ${workloadData.length} team members. Consider workload balance.`,
            impact: 'Medium',
            confidence: 88,
          },
          {
            id: 3,
            type: 'progress',
            title: 'Project Progress Update',
            description: `${projectSummaryArray.length} active projects with varying completion rates.`,
            impact: 'Medium',
            confidence: 92,
          },
        ],
      };

      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActivityType = (status) => {
    switch (status) {
      case 'DONE':
        return 'task_completed';
      case 'IN_PROGRESS':
        return 'task_started';
      case 'CANCELLED':
        return 'task_cancelled';
      default:
        return 'task_created';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    showNotification('Dashboard refreshed successfully', 'success');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_approved':
        return <ThumbUpIcon color="success" />;
      case 'task_completed':
        return <CompleteIcon color="success" />;
      case 'skill_gap':
        return <InsightIcon color="warning" />;
      case 'performance':
        return <TrendingUpIcon color="primary" />;
      case 'task_overdue':
        return <UrgentIcon color="error" />;
      default:
        return <NotificationIcon />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track':
        return 'success';
      case 'At Risk':
        return 'warning';
      case 'Ahead':
        return 'info';
      case 'Delayed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header with Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Team Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor team performance, workload, and project progress
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TeamIcon color="primary" />
                Team Performance Metrics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {dashboardData?.teamMetrics.totalMembers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Members
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData?.teamMetrics.activeProjects}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Projects
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData?.teamMetrics.completedTasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData?.teamMetrics.overallEfficiency}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Efficiency
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Weekly Progress: {dashboardData?.teamMetrics.weeklyProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.teamMetrics.weeklyProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  On-time Delivery: {dashboardData?.teamMetrics.onTimeDelivery}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData?.teamMetrics.onTimeDelivery}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsightIcon color="secondary" />
                AI Insights
              </Typography>
              
              {dashboardData.aiInsights.map((insight) => (
                <Box key={insight.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {insight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {insight.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Impact: ${insight.impact}`}
                      size="small"
                      color={insight.impact === 'High' ? 'error' : 'info'}
                    />
                    <Chip
                      label={`${insight.confidence}% confidence`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Team Workload */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="primary" />
                Team Workload Distribution
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Team Member</TableCell>
                      <TableCell align="center">Workload</TableCell>
                      <TableCell align="center">Efficiency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.workloadData.map((member) => (
                      <TableRow key={member.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                              {member.avatar}
                            </Avatar>
                            <Typography variant="body2">{member.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={member.workload}
                              sx={{ width: 60, height: 6 }}
                              color={member.workload > 85 ? 'error' : member.workload > 70 ? 'warning' : 'success'}
                            />
                            <Typography variant="body2">{member.workload}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${member.efficiency}%`}
                            size="small"
                            color={member.efficiency > 90 ? 'success' : member.efficiency > 85 ? 'info' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" />
                Recent Activities
              </Typography>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {dashboardData.recentActivities.map((activity) => (
                  <ListItem key={activity.id} alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={activity.priority}
                            size="small"
                            color={getPriorityColor(activity.priority)}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {activity.timestamp.fromNow()}
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

        {/* Project Overview */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReportIcon color="primary" />
                Active Projects Overview
              </Typography>
              
              <Grid container spacing={2}>
                {dashboardData.projectSummary.map((project) => (
                  <Grid item xs={12} md={4} key={project.id}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={project.status}
                          size="small"
                          color={getStatusColor(project.status)}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Progress: {project.progress}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={project.progress}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                          {project.team.map((member, index) => (
                            <Avatar key={index}>
                              {member.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Typography variant="caption" color="text.secondary">
                          Due: {project.dueDate.format('MMM DD')}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeamLeadDashboard;
