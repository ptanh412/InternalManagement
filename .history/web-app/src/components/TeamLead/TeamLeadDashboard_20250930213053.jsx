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
    try {
      // Mock data for team lead dashboard
      const data = {
        teamMetrics: {
          totalMembers: 12,
          activeProjects: 8,
          completedTasks: 156,
          overallEfficiency: 92,
          weeklyProgress: 85,
          onTimeDelivery: 94,
        },
        workloadData: [
          { name: 'Alice Johnson', workload: 85, efficiency: 95, avatar: 'AJ' },
          { name: 'Bob Smith', workload: 70, efficiency: 88, avatar: 'BS' },
          { name: 'Carol White', workload: 90, efficiency: 92, avatar: 'CW' },
          { name: 'David Brown', workload: 65, efficiency: 90, avatar: 'DB' },
          { name: 'Emma Davis', workload: 80, efficiency: 87, avatar: 'ED' },
          { name: 'Frank Miller', workload: 75, efficiency: 91, avatar: 'FM' },
        ],
        recentActivities: [
          {
            id: 1,
            type: 'task_approved',
            message: 'Alice Johnson - Mobile App Login Feature approved',
            timestamp: dayjs().subtract(15, 'minutes'),
            priority: 'high',
          },
          {
            id: 2,
            type: 'task_completed',
            message: 'Bob Smith completed API Integration task',
            timestamp: dayjs().subtract(1, 'hour'),
            priority: 'medium',
          },
          {
            id: 3,
            type: 'skill_gap',
            message: 'React expertise needed for upcoming project',
            timestamp: dayjs().subtract(2, 'hours'),
            priority: 'high',
          },
          {
            id: 4,
            type: 'performance',
            message: 'Team exceeded weekly target by 15%',
            timestamp: dayjs().subtract(3, 'hours'),
            priority: 'low',
          },
          {
            id: 5,
            type: 'task_overdue',
            message: 'Database optimization task overdue - Carol White',
            timestamp: dayjs().subtract(4, 'hours'),
            priority: 'urgent',
          },
        ],
        projectSummary: [
          {
            id: 1,
            name: 'Mobile App Redesign',
            progress: 75,
            team: ['Alice Johnson', 'Bob Smith', 'Carol White'],
            status: 'On Track',
            dueDate: dayjs().add(2, 'weeks'),
          },
          {
            id: 2,
            name: 'API Gateway Enhancement',
            progress: 60,
            team: ['David Brown', 'Emma Davis'],
            status: 'At Risk',
            dueDate: dayjs().add(1, 'week'),
          },
          {
            id: 3,
            name: 'Security Audit',
            progress: 90,
            team: ['Frank Miller', 'Alice Johnson'],
            status: 'Ahead',
            dueDate: dayjs().add(3, 'days'),
          },
        ],
        aiInsights: [
          {
            id: 1,
            type: 'workload',
            title: 'Workload Rebalancing Recommended',
            description: 'Carol White is approaching capacity. Consider redistributing tasks.',
            impact: 'High',
            confidence: 85,
          },
          {
            id: 2,
            type: 'skill',
            title: 'Skill Development Opportunity',
            description: 'Team would benefit from advanced React training for upcoming projects.',
            impact: 'Medium',
            confidence: 78,
          },
          {
            id: 3,
            type: 'efficiency',
            title: 'Process Optimization Available',
            description: 'Code review process could be streamlined to save 20% time.',
            impact: 'Medium',
            confidence: 92,
          },
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
    <Box sx={{ p: 2 }}>
      {/* Header with Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Team Dashboard
        </Typography>
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
                      {dashboardData.teamMetrics.totalMembers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Members
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.teamMetrics.activeProjects}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Projects
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.teamMetrics.completedTasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {dashboardData.teamMetrics.overallEfficiency}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Efficiency
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Weekly Progress: {dashboardData.teamMetrics.weeklyProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.teamMetrics.weeklyProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  On-time Delivery: {dashboardData.teamMetrics.onTimeDelivery}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.teamMetrics.onTimeDelivery}
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
    </Box>
  );
};

export default TeamLeadDashboard;
