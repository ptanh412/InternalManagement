import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Assignment as TaskIcon,
  Star as AchievementIcon,
  TrendingUp as ImprovementIcon,
  EmojiEvents as TrophyIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon,
  BarChart as StatsIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Flag as PriorityIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Code as CodeIcon,
  School as LearningIcon,
  Security as SecurityIcon,
  BugReport as BugIcon,
  Build as FeatureIcon,
  Analytics as AnalyticsIcon,
  Download as ExportIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const EmployeeActivityLog = ({ showNotification, employeeData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    activityType: 'all',
    status: 'all',
    search: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  useEffect(() => {
    loadActivityData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, filters]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // Mock comprehensive activity data
      const mockActivities = [
        {
          id: 1,
          type: 'task_completed',
          title: 'User Authentication Module',
          description: 'Implemented secure user authentication with JWT tokens and password encryption',
          status: 'completed',
          priority: 'High',
          project: 'Identity Service',
          assignedBy: 'Sarah Wilson',
          completedDate: '2024-01-15T14:30:00',
          startDate: '2024-01-10T09:00:00',
          estimatedHours: 16,
          actualHours: 14,
          category: 'Development',
          tags: ['Frontend', 'Security', 'React'],
          comments: 3,
          attachments: 2,
        },
        {
          id: 2,
          type: 'achievement',
          title: 'Code Quality Champion',
          description: 'Achieved 98% code coverage and zero critical bugs for 3 consecutive months',
          status: 'awarded',
          date: '2024-01-14T16:00:00',
          category: 'Performance',
          badge: 'Gold',
          points: 500,
        },
        {
          id: 3,
          type: 'task_completed',
          title: 'API Performance Optimization',
          description: 'Optimized database queries reducing API response time by 40%',
          status: 'completed',
          priority: 'Medium',
          project: 'API Gateway',
          assignedBy: 'Mike Chen',
          completedDate: '2024-01-12T11:45:00',
          startDate: '2024-01-08T10:00:00',
          estimatedHours: 12,
          actualHours: 10,
          category: 'Development',
          tags: ['Backend', 'Performance', 'Database'],
          comments: 5,
          attachments: 1,
        },
        {
          id: 4,
          type: 'learning',
          title: 'Advanced React Patterns Course',
          description: 'Completed comprehensive course on advanced React patterns and state management',
          status: 'completed',
          date: '2024-01-10T18:00:00',
          category: 'Learning',
          provider: 'TechEd Platform',
          certificateUrl: 'https://example.com/cert/123',
          hours: 8,
        },
        {
          id: 5,
          type: 'bug_fix',
          title: 'Memory Leak in Dashboard Component',
          description: 'Fixed critical memory leak causing browser crashes on dashboard page',
          status: 'completed',
          priority: 'Critical',
          project: 'Web Application',
          assignedBy: 'Sarah Wilson',
          completedDate: '2024-01-08T16:20:00',
          startDate: '2024-01-08T09:30:00',
          estimatedHours: 4,
          actualHours: 6,
          category: 'Bug Fix',
          tags: ['Frontend', 'Performance', 'Critical'],
          comments: 8,
          attachments: 3,
        },
        {
          id: 6,
          type: 'task_completed',
          title: 'Mobile Responsive Design',
          description: 'Implemented responsive design for all main application pages',
          status: 'completed',
          priority: 'Medium',
          project: 'Web Application',
          assignedBy: 'David Kim',
          completedDate: '2024-01-05T17:00:00',
          startDate: '2024-01-02T09:00:00',
          estimatedHours: 20,
          actualHours: 18,
          category: 'Development',
          tags: ['Frontend', 'CSS', 'Mobile'],
          comments: 4,
          attachments: 5,
        },
        {
          id: 7,
          type: 'achievement',
          title: 'Fast Learner Badge',
          description: 'Completed 5 technical courses within a month',
          status: 'awarded',
          date: '2024-01-03T12:00:00',
          category: 'Learning',
          badge: 'Silver',
          points: 300,
        },
        {
          id: 8,
          type: 'code_review',
          title: 'Reviewed Payment Processing Module',
          description: 'Conducted thorough code review for payment processing implementation',
          status: 'completed',
          date: '2024-01-01T14:30:00',
          category: 'Code Review',
          reviewedFor: 'Emma Davis',
          linesReviewed: 1250,
          issuesFound: 8,
          suggestions: 12,
        },
      ];

      const mockAchievements = [
        {
          id: 1,
          title: 'Code Quality Champion',
          description: '98% code coverage for 3 months',
          date: '2024-01-14',
          badge: 'Gold',
          points: 500,
          category: 'Quality',
        },
        {
          id: 2,
          title: 'Fast Learner',
          description: 'Completed 5 courses in one month',
          date: '2024-01-03',
          badge: 'Silver',
          points: 300,
          category: 'Learning',
        },
        {
          id: 3,
          title: 'Team Player',
          description: 'Helped 10+ team members',
          date: '2023-12-20',
          badge: 'Bronze',
          points: 200,
          category: 'Collaboration',
        },
        {
          id: 4,
          title: 'Innovation Star',
          description: 'Suggested 3 implemented improvements',
          date: '2023-12-15',
          badge: 'Gold',
          points: 600,
          category: 'Innovation',
        },
      ];

      const mockPerformanceData = {
        tasksCompleted: 45,
        averageRating: 4.7,
        onTimeDelivery: 92,
        codeQuality: 95,
        teamCollaboration: 4.8,
        learningGoals: 85,
        monthlyTrend: [
          { month: 'Oct', tasks: 12, rating: 4.5 },
          { month: 'Nov', tasks: 15, rating: 4.6 },
          { month: 'Dec', tasks: 18, rating: 4.7 },
          { month: 'Jan', tasks: 20, rating: 4.8 },
        ],
        skillProgress: [
          { skill: 'React', current: 85, target: 90 },
          { skill: 'Node.js', current: 70, target: 80 },
          { skill: 'TypeScript', current: 75, target: 85 },
          { skill: 'AWS', current: 60, target: 75 },
        ],
      };

      setActivities(mockActivities);
      setAchievements(mockAchievements);
      setPerformanceData(mockPerformanceData);
    } catch (error) {
      console.error('Failed to load activity data:', error);
      showNotification('Failed to load activity data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Date range filter
    const now = dayjs();
    if (filters.dateRange !== 'all') {
      const days = {
        'last7days': 7,
        'last30days': 30,
        'last90days': 90,
        'lastyear': 365,
      };
      const cutoffDate = now.subtract(days[filters.dateRange], 'day');
      filtered = filtered.filter(activity => {
        const activityDate = dayjs(activity.completedDate || activity.date);
        return activityDate.isAfter(cutoffDate);
      });
    }

    // Activity type filter
    if (filters.activityType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.activityType);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm) ||
        (activity.project && activity.project.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredActivities(filtered);
    setPage(0);
  };

  const getActivityIcon = (type) => {
    const icons = {
      task_completed: <TaskIcon />,
      achievement: <TrophyIcon />,
      learning: <LearningIcon />,
      bug_fix: <BugIcon />,
      code_review: <CodeIcon />,
    };
    return icons[type] || <WorkIcon />;
  };

  const getActivityColor = (type, status) => {
    if (status === 'completed' || status === 'awarded') {
      return 'success';
    }
    if (type === 'bug_fix') return 'error';
    if (type === 'achievement') return 'warning';
    return 'primary';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'error',
      'High': 'warning',
      'Medium': 'info',
      'Low': 'success',
    };
    return colors[priority] || 'default';
  };

  const getEfficiencyScore = (estimated, actual) => {
    if (!estimated || !actual) return null;
    const efficiency = (estimated / actual) * 100;
    return Math.round(efficiency);
  };

  const handleExportData = () => {
    // In a real app, this would generate and download a report
    showNotification('Activity report exported successfully', 'success');
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setActivityDialogOpen(true);
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Activity Log
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExportData}
        >
          Export Report
        </Button>
      </Box>

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Recent Activities" />
          <Tab label="Achievements" />
          <Tab label="Performance" />
          <Tab label="Timeline" />
        </Tabs>
      </Paper>

      {/* Recent Activities Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={filters.dateRange}
                      label="Date Range"
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="last7days">Last 7 Days</MenuItem>
                      <MenuItem value="last30days">Last 30 Days</MenuItem>
                      <MenuItem value="last90days">Last 90 Days</MenuItem>
                      <MenuItem value="lastyear">Last Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Activity Type</InputLabel>
                    <Select
                      value={filters.activityType}
                      label="Activity Type"
                      onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value }))}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="task_completed">Tasks</MenuItem>
                      <MenuItem value="achievement">Achievements</MenuItem>
                      <MenuItem value="learning">Learning</MenuItem>
                      <MenuItem value="bug_fix">Bug Fixes</MenuItem>
                      <MenuItem value="code_review">Code Reviews</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="awarded">Awarded</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Activities Table */}
          <Card elevation={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Activity</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Efficiency</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: `${getActivityColor(activity.type, activity.status)}.main`,
                                width: 32,
                                height: 32,
                              }}
                            >
                              {getActivityIcon(activity.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {activity.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.description.substring(0, 60)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={activity.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={getActivityColor(activity.type, activity.status)}
                            variant="outlined"
                          />
                        </TableCell>
                        
                        <TableCell>
                          {activity.project || activity.category || '-'}
                        </TableCell>
                        
                        <TableCell>
                          {activity.priority && (
                            <Chip
                              label={activity.priority}
                              size="small"
                              color={getPriorityColor(activity.priority)}
                            />
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {dayjs(activity.completedDate || activity.date).format('MMM DD, YYYY')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(activity.completedDate || activity.date).fromNow()}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          {activity.estimatedHours && activity.actualHours && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {getEfficiencyScore(activity.estimatedHours, activity.actualHours)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(getEfficiencyScore(activity.estimatedHours, activity.actualHours), 100)}
                                sx={{ width: 60, height: 4 }}
                                color={getEfficiencyScore(activity.estimatedHours, activity.actualHours) >= 100 ? 'success' : 'warning'}
                              />
                            </Box>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleActivityClick(activity)}
                            >
                              <SearchIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredActivities.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Card>
        </Box>
      )}

      {/* Achievements Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            {achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Card elevation={2} sx={{ position: 'relative', overflow: 'visible' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      bgcolor: achievement.badge === 'Gold' ? '#FFD700' : achievement.badge === 'Silver' ? '#C0C0C0' : '#CD7F32',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2,
                    }}
                  >
                    <TrophyIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  
                  <CardContent sx={{ pt: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {achievement.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={achievement.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        +{achievement.points} pts
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Earned on {dayjs(achievement.date).format('MMM DD, YYYY')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Performance Tab */}
      {activeTab === 2 && performanceData && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Performance Overview</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                        {performanceData.tasksCompleted}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasks Completed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {performanceData.averageRating}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Rating
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold' }}>
                        {performanceData.onTimeDelivery}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        On-Time Delivery
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                        {performanceData.codeQuality}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Code Quality Score
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Skill Progress */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Skill Development Progress</Typography>
                {performanceData.skillProgress.map((skill, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{skill.skill}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {skill.current}% / {skill.target}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(skill.current / skill.target) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={skill.current >= skill.target ? 'success' : 'primary'}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Trend */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Monthly Performance Trend</Typography>
                {performanceData.monthlyTrend.map((month, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 40 }}>
                      {month.month}
                    </Typography>
                    <Box sx={{ flex: 1, mx: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(month.tasks / 25) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                      {month.tasks} tasks
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 60 }}>
                      <AchievementIcon sx={{ color: 'warning.main', fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">{month.rating}</Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Timeline Tab */}
      {activeTab === 3 && (
        <Box>
          <Timeline>
            {activities.slice(0, 10).map((activity, index) => (
              <TimelineItem key={activity.id}>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                  {dayjs(activity.completedDate || activity.date).format('MMM DD')}
                  <br />
                  {dayjs(activity.completedDate || activity.date).format('HH:mm')}
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineDot color={getActivityColor(activity.type, activity.status)}>
                    {getActivityIcon(activity.type)}
                  </TimelineDot>
                  {index < activities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Card elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {activity.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={activity.type.replace('_', ' ')}
                        size="small"
                        color={getActivityColor(activity.type, activity.status)}
                        variant="outlined"
                      />
                      {activity.project && (
                        <Chip
                          label={activity.project}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {activity.priority && (
                        <Chip
                          label={activity.priority}
                          size="small"
                          color={getPriorityColor(activity.priority)}
                        />
                      )}
                    </Box>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Box>
      )}

      {/* Activity Detail Dialog */}
      <Dialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Activity Details
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: `${getActivityColor(selectedActivity.type, selectedActivity.status)}.main`,
                    width: 48,
                    height: 48,
                  }}
                >
                  {getActivityIcon(selectedActivity.type)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {selectedActivity.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedActivity.project || selectedActivity.category}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedActivity.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {selectedActivity.status.toUpperCase()}
                  </Typography>
                </Grid>
                
                {selectedActivity.priority && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Priority</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedActivity.priority}
                    </Typography>
                  </Grid>
                )}
                
                {selectedActivity.estimatedHours && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Estimated Hours</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedActivity.estimatedHours}h
                    </Typography>
                  </Grid>
                )}
                
                {selectedActivity.actualHours && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Actual Hours</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedActivity.actualHours}h
                    </Typography>
                  </Grid>
                )}
                
                {selectedActivity.tags && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedActivity.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeActivityLog;
