import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Avatar,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/material";
import {
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
  Person as PersonIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Link as DependencyIcon,
  Update as UpdateIcon,
  AccessTime as TimeIcon,
  Warning as BlockerIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Work as ProjectIcon,
  Code as CodeIcon,
  Bug as BugIcon,
  Enhancement as FeatureIcon,
  Task as GenericTaskIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const EmployeeTaskDetails = ({ showNotification, employeeData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    project: 'all',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Mock task data with comprehensive details
      const mockTasks = [
        {
          id: 1,
          title: 'Mobile App Login Feature',
          description: 'Implement secure authentication with biometric support for the mobile application. This includes integration with Touch ID, Face ID, and fallback to PIN authentication.',
          project: 'Mobile App Redesign',
          type: 'feature',
          priority: 'High',
          status: 'In Progress',
          progress: 75,
          dueDate: dayjs().add(3, 'days'),
          startDate: dayjs().subtract(4, 'days'),
          estimatedHours: 16,
          spentHours: 12,
          assignedBy: 'John Smith',
          assignedDate: dayjs().subtract(5, 'days'),
          dependencies: [
            { id: 101, title: 'API Authentication Endpoint', status: 'Completed', progress: 100 },
            { id: 102, title: 'Security Review', status: 'In Progress', progress: 60 },
          ],
          blockers: [
            { id: 1, description: 'Waiting for security team approval on biometric data storage', reportedDate: dayjs().subtract(1, 'day') },
          ],
          attachments: [
            { id: 1, name: 'Authentication Flow Diagram.pdf', size: '2.3 MB', uploadedDate: dayjs().subtract(3, 'days') },
            { id: 2, name: 'Security Requirements.docx', size: '1.1 MB', uploadedDate: dayjs().subtract(2, 'days') },
          ],
          comments: [
            {
              id: 1,
              author: 'John Smith',
              message: 'Please prioritize the biometric integration part.',
              timestamp: dayjs().subtract(2, 'days'),
              avatar: 'JS',
            },
            {
              id: 2,
              author: 'Alice Johnson',
              message: 'I\'ve completed the Touch ID integration. Working on Face ID now.',
              timestamp: dayjs().subtract(1, 'day'),
              avatar: 'AJ',
            },
          ],
          subtasks: [
            { id: 1, title: 'Touch ID Integration', status: 'Completed', progress: 100 },
            { id: 2, title: 'Face ID Integration', status: 'In Progress', progress: 80 },
            { id: 3, title: 'PIN Fallback', status: 'Pending', progress: 0 },
            { id: 4, title: 'Testing & QA', status: 'Pending', progress: 0 },
          ],
          timeLog: [
            { date: dayjs().subtract(4, 'days'), hours: 3, description: 'Initial research and planning' },
            { date: dayjs().subtract(3, 'days'), hours: 4, description: 'Touch ID implementation' },
            { date: dayjs().subtract(2, 'days'), hours: 2, description: 'Security review preparation' },
            { date: dayjs().subtract(1, 'day'), hours: 3, description: 'Face ID integration work' },
          ],
          tags: ['mobile', 'authentication', 'security', 'biometric'],
        },
        {
          id: 2,
          title: 'Dashboard UI Improvements',
          description: 'Update dashboard components with new design system guidelines and improve user experience.',
          project: 'Web App Enhancement',
          type: 'enhancement',
          priority: 'Medium',
          status: 'Pending',
          progress: 0,
          dueDate: dayjs().add(1, 'week'),
          startDate: dayjs().add(1, 'day'),
          estimatedHours: 8,
          spentHours: 0,
          assignedBy: 'Jane Doe',
          assignedDate: dayjs().subtract(1, 'day'),
          dependencies: [
            { id: 201, title: 'Design System Update', status: 'Completed', progress: 100 },
            { id: 202, title: 'Component Library v2.0', status: 'In Progress', progress: 80 },
          ],
          blockers: [],
          attachments: [
            { id: 3, name: 'New Design Mockups.fig', size: '5.7 MB', uploadedDate: dayjs().subtract(1, 'day') },
          ],
          comments: [
            {
              id: 3,
              author: 'Jane Doe',
              message: 'Focus on the analytics cards first, then the navigation improvements.',
              timestamp: dayjs().subtract(1, 'day'),
              avatar: 'JD',
            },
          ],
          subtasks: [
            { id: 5, title: 'Analytics Cards Redesign', status: 'Pending', progress: 0 },
            { id: 6, title: 'Navigation Updates', status: 'Pending', progress: 0 },
            { id: 7, title: 'Color Scheme Implementation', status: 'Pending', progress: 0 },
          ],
          timeLog: [],
          tags: ['frontend', 'ui', 'design-system', 'dashboard'],
        },
        {
          id: 3,
          title: 'Code Review - Payment Module',
          description: 'Review payment processing implementation for security vulnerabilities and performance issues.',
          project: 'E-commerce Platform',
          type: 'review',
          priority: 'High',
          status: 'Overdue',
          progress: 0,
          dueDate: dayjs().subtract(1, 'day'),
          startDate: dayjs().subtract(2, 'days'),
          estimatedHours: 4,
          spentHours: 0,
          assignedBy: 'Mike Johnson',
          assignedDate: dayjs().subtract(3, 'days'),
          dependencies: [
            { id: 301, title: 'Payment Module Implementation', status: 'Completed', progress: 100 },
          ],
          blockers: [],
          attachments: [
            { id: 4, name: 'Payment Code Changes.zip', size: '890 KB', uploadedDate: dayjs().subtract(2, 'days') },
          ],
          comments: [
            {
              id: 4,
              author: 'Mike Johnson',
              message: 'Please focus on the security aspects of the payment flow.',
              timestamp: dayjs().subtract(2, 'days'),
              avatar: 'MJ',
            },
          ],
          subtasks: [
            { id: 8, title: 'Security Review', status: 'Pending', progress: 0 },
            { id: 9, title: 'Performance Analysis', status: 'Pending', progress: 0 },
            { id: 10, title: 'Code Quality Check', status: 'Pending', progress: 0 },
          ],
          timeLog: [],
          tags: ['review', 'security', 'payment', 'backend'],
        },
        {
          id: 4,
          title: 'API Documentation Update',
          description: 'Update API documentation for v2.0 with new endpoints and authentication methods.',
          project: 'Backend Services',
          type: 'documentation',
          priority: 'Low',
          status: 'Completed',
          progress: 100,
          dueDate: dayjs().subtract(2, 'days'),
          startDate: dayjs().subtract(1, 'week'),
          estimatedHours: 6,
          spentHours: 5,
          assignedBy: 'Sarah Wilson',
          assignedDate: dayjs().subtract(1, 'week'),
          dependencies: [
            { id: 401, title: 'API v2.0 Development', status: 'Completed', progress: 100 },
          ],
          blockers: [],
          attachments: [
            { id: 5, name: 'API Documentation v2.0.md', size: '156 KB', uploadedDate: dayjs().subtract(3, 'days') },
          ],
          comments: [
            {
              id: 5,
              author: 'Sarah Wilson',
              message: 'Great work on the documentation! Very comprehensive.',
              timestamp: dayjs().subtract(2, 'days'),
              avatar: 'SW',
            },
          ],
          subtasks: [
            { id: 11, title: 'Endpoint Documentation', status: 'Completed', progress: 100 },
            { id: 12, title: 'Authentication Guide', status: 'Completed', progress: 100 },
            { id: 13, title: 'Code Examples', status: 'Completed', progress: 100 },
          ],
          timeLog: [
            { date: dayjs().subtract(5, 'days'), hours: 2, description: 'Research and planning' },
            { date: dayjs().subtract(4, 'days'), hours: 2, description: 'Endpoint documentation' },
            { date: dayjs().subtract(3, 'days'), hours: 1, description: 'Code examples and final review' },
          ],
          tags: ['documentation', 'api', 'backend'],
        },
      ];

      setTimeout(() => {
        setTasks(mockTasks);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showNotification('Failed to load task details', 'error');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tasks;

    // Filter by tab (status)
    const tabStatusMap = {
      0: 'all',
      1: 'pending',
      2: 'in progress',
      3: 'completed',
      4: 'overdue',
    };

    if (activeTab > 0) {
      const targetStatus = tabStatusMap[activeTab];
      if (targetStatus === 'overdue') {
        filtered = filtered.filter(task => task.status.toLowerCase() === 'overdue');
      } else {
        filtered = filtered.filter(task => task.status.toLowerCase() === targetStatus);
      }
    }

    // Apply additional filters
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority.toLowerCase() === filters.priority);
    }

    if (filters.project !== 'all') {
      filtered = filtered.filter(task => task.project === filters.project);
    }

    setFilteredTasks(filtered);
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      switch (action) {
        case 'start':
          setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: 'In Progress' } : task
          ));
          showNotification('Task started', 'success');
          break;
        case 'complete':
          setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: 'Completed', progress: 100 } : task
          ));
          showNotification('Task completed!', 'success');
          break;
        case 'pause':
          setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: 'Paused' } : task
          ));
          showNotification('Task paused', 'info');
          break;
        default:
          break;
      }
    } catch (error) {
      showNotification('Failed to update task', 'error');
    }
  };

  const handleAddComment = async () => {
    try {
      if (selectedTask && newComment.trim()) {
        const comment = {
          id: Date.now(),
          author: employeeData?.name || 'You',
          message: newComment,
          timestamp: dayjs(),
          avatar: employeeData?.avatar || 'Y',
        };

        setTasks(prev => prev.map(task =>
          task.id === selectedTask.id
            ? { ...task, comments: [...task.comments, comment] }
            : task
        ));

        setNewComment('');
        setCommentDialogOpen(false);
        showNotification('Comment added successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to add comment', 'error');
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

  const getTaskTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'feature':
        return <FeatureIcon />;
      case 'bug':
        return <BugIcon />;
      case 'review':
        return <ViewIcon />;
      case 'documentation':
        return <InfoIcon />;
      case 'enhancement':
        return <StarIcon />;
      default:
        return <GenericTaskIcon />;
    }
  };

  const tabLabels = [
    { label: 'All Tasks', count: tasks.length },
    { label: 'Pending', count: tasks.filter(t => t.status.toLowerCase() === 'pending').length },
    { label: 'In Progress', count: tasks.filter(t => t.status.toLowerCase() === 'in progress').length },
    { label: 'Completed', count: tasks.filter(t => t.status.toLowerCase() === 'completed').length },
    { label: 'Overdue', count: tasks.filter(t => t.status.toLowerCase() === 'overdue').length },
  ];

  const projects = [...new Set(tasks.map(task => task.project))];

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
          My Tasks
        </Typography>
        <Button
          variant="outlined"
          startIcon={<UpdateIcon />}
          onClick={loadTasks}
        >
          Refresh
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
          {tabLabels.map((tab, index) => (
            <Tab
              key={index}
              label={`${tab.label} (${tab.count})`}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project} value={project}>{project}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Cards */}
      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} key={task.id}>
            <Card 
              elevation={2}
              sx={{
                border: task.status.toLowerCase() === 'overdue' ? 2 : 1,
                borderColor: task.status.toLowerCase() === 'overdue' ? 'error.main' : 'divider',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getTaskTypeIcon(task.type)}
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority)}
                      />
                      <Chip
                        label={task.status}
                        size="small"
                        color={getStatusColor(task.status)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {task.project} • Assigned by {task.assignedBy}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Due: {task.dueDate.format('MMM DD, YYYY')} ({task.dueDate.fromNow()})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {task.spentHours}h spent / {task.estimatedHours}h estimated
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Progress: {task.progress}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={task.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={getStatusColor(task.status)}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <Accordion sx={{ mt: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DependencyIcon color="info" />
                        <Typography variant="subtitle2">
                          Dependencies ({task.dependencies.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {task.dependencies.map((dep) => (
                          <ListItem key={dep.id}>
                            <ListItemIcon>
                              <Chip
                                label={dep.status}
                                size="small"
                                color={dep.status === 'Completed' ? 'success' : 'warning'}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={dep.title}
                              secondary={`${dep.progress}% complete`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Blockers */}
                {task.blockers.length > 0 && (
                  <Accordion sx={{ mt: 1, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BlockerIcon color="error" />
                        <Typography variant="subtitle2">
                          Blockers ({task.blockers.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {task.blockers.map((blocker) => (
                          <ListItem key={blocker.id}>
                            <ListItemIcon>
                              <BlockerIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={blocker.description}
                              secondary={`Reported ${blocker.reportedDate.fromNow()}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {task.status.toLowerCase() === 'pending' && (
                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      onClick={() => handleTaskAction(task.id, 'start')}
                    >
                      Start Task
                    </Button>
                  )}
                  {task.status.toLowerCase() === 'in progress' && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CompleteIcon />}
                        onClick={() => handleTaskAction(task.id, 'complete')}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PauseIcon />}
                        onClick={() => handleTaskAction(task.id, 'pause')}
                      >
                        Pause
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<CommentIcon />}
                    onClick={() => {
                      setSelectedTask(task);
                      setCommentDialogOpen(true);
                    }}
                  >
                    Add Comment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedTask(task);
                      setDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Task Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTask && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getTaskTypeIcon(selectedTask.type)}
              {selectedTask.title}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Grid container spacing={3}>
              {/* Task Information */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" sx={{ mb: 2 }}>Task Details</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {selectedTask.description}
                </Typography>
                
                {/* Subtasks */}
                <Typography variant="h6" sx={{ mb: 2 }}>Subtasks</Typography>
                <List>
                  {selectedTask.subtasks.map((subtask) => (
                    <ListItem key={subtask.id}>
                      <ListItemIcon>
                        <Chip
                          label={subtask.status}
                          size="small"
                          color={subtask.status === 'Completed' ? 'success' : subtask.status === 'In Progress' ? 'info' : 'default'}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={subtask.title}
                        secondary={
                          <LinearProgress
                            variant="determinate"
                            value={subtask.progress}
                            sx={{ mt: 0.5, height: 4 }}
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Comments */}
                <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Comments</Typography>
                <List>
                  {selectedTask.comments.map((comment) => (
                    <ListItem key={comment.id} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>{comment.avatar}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={comment.message}
                        secondary={`${comment.author} • ${comment.timestamp.fromNow()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Metadata */}
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Task Information</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Chip label={selectedTask.status} size="small" color={getStatusColor(selectedTask.status)} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Priority</Typography>
                      <Chip label={selectedTask.priority} size="small" color={getPriorityColor(selectedTask.priority)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Project</Typography>
                      <Typography variant="body2">{selectedTask.project}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Due Date</Typography>
                      <Typography variant="body2">{selectedTask.dueDate.format('MMM DD, YYYY')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Assigned By</Typography>
                      <Typography variant="body2">{selectedTask.assignedBy}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Time Tracking */}
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Time Tracking</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Spent: {selectedTask.spentHours}h / {selectedTask.estimatedHours}h
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedTask.spentHours / selectedTask.estimatedHours) * 100}
                    sx={{ mb: 2, height: 6 }}
                  />
                  {selectedTask.timeLog.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Time Log</Typography>
                      <List dense>
                        {selectedTask.timeLog.map((log, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={`${log.hours}h - ${log.description}`}
                              secondary={log.date.format('MMM DD')}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Paper>

                {/* Attachments */}
                {selectedTask.attachments.length > 0 && (
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Attachments</Typography>
                    <List dense>
                      {selectedTask.attachments.map((attachment) => (
                        <ListItem key={attachment.id}>
                          <ListItemIcon>
                            <AttachmentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={attachment.name}
                            secondary={`${attachment.size} • ${attachment.uploadedDate.fromNow()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment or update..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained" disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeTaskDetails;
