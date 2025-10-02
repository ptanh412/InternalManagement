import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AvatarGroup,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as ModifyIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Comment as CommentIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Send as DelegateIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import taskService from "../../services/taskService";
import { getMyInfo } from "../../services/userService";

dayjs.extend(relativeTime);

const TeamLeadTaskManagement = ({ showNotification }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    assignee: 'all',
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [modifyData, setModifyData] = useState({});
  const [delegateData, setDelegateData] = useState({});

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, filters, activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Mock data for task management
      const mockTasks = [
        {
          id: 1,
          title: 'Mobile App Login Feature',
          description: 'Implement secure authentication with biometric support',
          assignee: 'Alice Johnson',
          assigneeAvatar: 'AJ',
          requestedBy: 'Product Manager',
          priority: 'high',
          status: 'pending_approval',
          estimatedHours: 16,
          dueDate: dayjs().add(1, 'week'),
          createdAt: dayjs().subtract(2, 'hours'),
          project: 'Mobile App Redesign',
          skills: ['React Native', 'Authentication', 'Security'],
          aiRecommendation: {
            confidence: 92,
            reasoning: 'Alice has strong mobile development skills and recent authentication experience',
            alternativeAssignees: ['Bob Smith', 'Carol White'],
          },
          comments: [
            {
              id: 1,
              author: 'Product Manager',
              message: 'This is critical for the next sprint. Please prioritize.',
              timestamp: dayjs().subtract(1, 'hour'),
            },
          ],
        },
        {
          id: 2,
          title: 'Database Performance Optimization',
          description: 'Optimize slow queries and improve indexing strategy',
          assignee: 'Bob Smith',
          assigneeAvatar: 'BS',
          requestedBy: 'Tech Lead',
          priority: 'medium',
          status: 'pending_approval',
          estimatedHours: 24,
          dueDate: dayjs().add(2, 'weeks'),
          createdAt: dayjs().subtract(4, 'hours'),
          project: 'Backend Optimization',
          skills: ['Database', 'SQL', 'Performance'],
          aiRecommendation: {
            confidence: 88,
            reasoning: 'Bob has extensive database optimization experience',
            alternativeAssignees: ['David Brown'],
          },
          comments: [],
        },
        {
          id: 3,
          title: 'API Rate Limiting Implementation',
          description: 'Add rate limiting to prevent API abuse and ensure fair usage',
          assignee: 'Carol White',
          assigneeAvatar: 'CW',
          requestedBy: 'Security Team',
          priority: 'high',
          status: 'approved',
          estimatedHours: 12,
          dueDate: dayjs().add(5, 'days'),
          createdAt: dayjs().subtract(1, 'day'),
          project: 'API Gateway Enhancement',
          skills: ['Node.js', 'Security', 'API Design'],
          aiRecommendation: {
            confidence: 85,
            reasoning: 'Carol has strong API development background',
            alternativeAssignees: ['Emma Davis'],
          },
          comments: [
            {
              id: 1,
              author: 'Team Lead',
              message: 'Approved. Great choice for this security-focused task.',
              timestamp: dayjs().subtract(2, 'hours'),
            },
          ],
        },
        {
          id: 4,
          title: 'User Interface Redesign',
          description: 'Update dashboard UI with new design system',
          assignee: 'David Brown',
          assigneeAvatar: 'DB',
          requestedBy: 'UX Designer',
          priority: 'low',
          status: 'rejected',
          estimatedHours: 20,
          dueDate: dayjs().add(3, 'weeks'),
          createdAt: dayjs().subtract(6, 'hours'),
          project: 'Web App Enhancement',
          skills: ['React', 'CSS', 'Design Systems'],
          aiRecommendation: {
            confidence: 65,
            reasoning: 'David has some frontend experience but may need design support',
            alternativeAssignees: ['Emma Davis', 'Frank Miller'],
          },
          comments: [
            {
              id: 1,
              author: 'Team Lead',
              message: 'Reassigning to someone with stronger design background.',
              timestamp: dayjs().subtract(1, 'hour'),
            },
          ],
        },
        {
          id: 5,
          title: 'Automated Testing Setup',
          description: 'Implement comprehensive test suite for critical components',
          assignee: 'Emma Davis',
          assigneeAvatar: 'ED',
          requestedBy: 'QA Lead',
          priority: 'medium',
          status: 'in_progress',
          estimatedHours: 18,
          dueDate: dayjs().add(10, 'days'),
          createdAt: dayjs().subtract(2, 'days'),
          project: 'Quality Assurance',
          skills: ['Testing', 'Jest', 'Cypress'],
          aiRecommendation: {
            confidence: 94,
            reasoning: 'Emma has excellent testing expertise and attention to detail',
            alternativeAssignees: ['Frank Miller'],
          },
          comments: [],
        },
      ];

      setTimeout(() => {
        setTasks(mockTasks);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showNotification('Failed to load tasks', 'error');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tasks;

    // Filter by tab (status)
    const tabStatusMap = {
      0: 'pending_approval',
      1: 'approved',
      2: 'in_progress',
      3: 'rejected',
    };

    if (activeTab < 4) {
      filtered = filtered.filter(task => task.status === tabStatusMap[activeTab]);
    }

    // Apply additional filters
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assignee === filters.assignee);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleApproveTask = async (taskId) => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: 'approved' } : task
      ));
      showNotification('Task approved successfully', 'success');
    } catch (error) {
      showNotification('Failed to approve task', 'error');
    }
  };

  const handleRejectTask = async (taskId, reason) => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { 
          ...task, 
          status: 'rejected',
          comments: [
            ...task.comments,
            {
              id: Date.now(),
              author: 'Team Lead',
              message: reason || 'Task rejected',
              timestamp: dayjs(),
            }
          ]
        } : task
      ));
      showNotification('Task rejected', 'warning');
    } catch (error) {
      showNotification('Failed to reject task', 'error');
    }
  };

  const handleModifyTask = async () => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === selectedTask.id ? { 
          ...task, 
          ...modifyData,
          status: 'approved',
          comments: [
            ...task.comments,
            {
              id: Date.now(),
              author: 'Team Lead',
              message: 'Task modified and approved',
              timestamp: dayjs(),
            }
          ]
        } : task
      ));
      setModifyOpen(false);
      setModifyData({});
      showNotification('Task modified and approved', 'success');
    } catch (error) {
      showNotification('Failed to modify task', 'error');
    }
  };

  const handleDelegateTask = async () => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === selectedTask.id ? { 
          ...task, 
          assignee: delegateData.assignee,
          assigneeAvatar: delegateData.assignee.split(' ').map(n => n[0]).join(''),
          status: 'approved',
          comments: [
            ...task.comments,
            {
              id: Date.now(),
              author: 'Team Lead',
              message: `Task delegated to ${delegateData.assignee}. Reason: ${delegateData.reason}`,
              timestamp: dayjs(),
            }
          ]
        } : task
      ));
      setDelegateOpen(false);
      setDelegateData({});
      showNotification('Task delegated successfully', 'success');
    } catch (error) {
      showNotification('Failed to delegate task', 'error');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
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
    switch (status) {
      case 'pending_approval':
        return 'warning';
      case 'approved':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'in_progress':
        return 'In Progress';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const tabLabels = [
    { label: 'Pending Approval', count: tasks.filter(t => t.status === 'pending_approval').length },
    { label: 'Approved', count: tasks.filter(t => t.status === 'approved').length },
    { label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { label: 'Rejected', count: tasks.filter(t => t.status === 'rejected').length },
    { label: 'All Tasks', count: tasks.length },
  ];

  const teamMembers = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Emma Davis', 'Frank Miller'];

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
          Task Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
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
              label={
                <Badge badgeContent={tab.count} color="primary">
                  {tab.label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
              >
                <MenuItem value="all">All Assignees</MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member} value={member}>{member}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Task List */}
      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} key={task.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority)}
                      />
                      <Chip
                        label={getStatusLabel(task.status)}
                        size="small"
                        color={getStatusColor(task.status)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => {
                      setMenuAnchor(e.currentTarget);
                      setSelectedTaskId(task.id);
                    }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                        {task.assigneeAvatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {task.assignee}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Assignee
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Due Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {task.dueDate.format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Hours
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {task.estimatedHours}h
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* AI Recommendation */}
                {task.aiRecommendation && (
                  <Accordion sx={{ mt: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon color="info" />
                        <Typography variant="subtitle2">
                          AI Recommendation ({task.aiRecommendation.confidence}% confidence)
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {task.aiRecommendation.reasoning}
                      </Typography>
                      {task.aiRecommendation.alternativeAssignees.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Alternative assignees:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {task.aiRecommendation.alternativeAssignees.map((assignee) => (
                              <Chip key={assignee} label={assignee} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Action Buttons */}
                {task.status === 'pending_approval' && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => handleApproveTask(task.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ModifyIcon />}
                      onClick={() => {
                        setSelectedTask(task);
                        setModifyData({
                          title: task.title,
                          description: task.description,
                          priority: task.priority,
                          estimatedHours: task.estimatedHours,
                          dueDate: task.dueDate.format('YYYY-MM-DD'),
                        });
                        setModifyOpen(true);
                      }}
                    >
                      Modify
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<DelegateIcon />}
                      onClick={() => {
                        setSelectedTask(task);
                        setDelegateData({ assignee: '', reason: '' });
                        setDelegateOpen(true);
                      }}
                    >
                      Delegate
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => handleRejectTask(task.id, 'Rejected by team lead')}
                    >
                      Reject
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            const task = tasks.find(t => t.id === selectedTaskId);
            setSelectedTask(task);
            setDetailsOpen(true);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <ViewIcon />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const task = tasks.find(t => t.id === selectedTaskId);
            setSelectedTask(task);
            setModifyData({
              title: task.title,
              description: task.description,
              priority: task.priority,
              estimatedHours: task.estimatedHours,
              dueDate: task.dueDate.format('YYYY-MM-DD'),
            });
            setModifyOpen(true);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <ModifyIcon />
          </ListItemIcon>
          Modify Task
        </MenuItem>
      </Menu>

      {/* Task Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedTask.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedTask.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                  <Typography variant="body2">{selectedTask.assignee}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Chip label={selectedTask.priority} size="small" color={getPriorityColor(selectedTask.priority)} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body2">{selectedTask.dueDate.format('MMM DD, YYYY')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Estimated Hours</Typography>
                  <Typography variant="body2">{selectedTask.estimatedHours}h</Typography>
                </Grid>
              </Grid>

              {selectedTask.skills && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Required Skills
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedTask.skills.map((skill) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Comments
                  </Typography>
                  <List>
                    {selectedTask.comments.map((comment) => (
                      <ListItem key={comment.id} alignItems="flex-start">
                        <ListItemText
                          primary={comment.message}
                          secondary={`${comment.author} • ${comment.timestamp.fromNow()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Modify Task Dialog */}
      <Dialog open={modifyOpen} onClose={() => setModifyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modify Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={modifyData.title || ''}
              onChange={(e) => setModifyData({ ...modifyData, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={modifyData.description || ''}
              onChange={(e) => setModifyData({ ...modifyData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={modifyData.priority || ''}
                onChange={(e) => setModifyData({ ...modifyData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Estimated Hours"
              type="number"
              value={modifyData.estimatedHours || ''}
              onChange={(e) => setModifyData({ ...modifyData, estimatedHours: parseInt(e.target.value) })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={modifyData.dueDate || ''}
              onChange={(e) => setModifyData({ ...modifyData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModifyOpen(false)}>Cancel</Button>
          <Button onClick={handleModifyTask} variant="contained">
            Save & Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delegate Task Dialog */}
      <Dialog open={delegateOpen} onClose={() => setDelegateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delegate Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>New Assignee</InputLabel>
              <Select
                value={delegateData.assignee || ''}
                onChange={(e) => setDelegateData({ ...delegateData, assignee: e.target.value })}
              >
                {teamMembers.map((member) => (
                  <MenuItem key={member} value={member}>{member}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Reason for Delegation"
              multiline
              rows={3}
              value={delegateData.reason || ''}
              onChange={(e) => setDelegateData({ ...delegateData, reason: e.target.value })}
              placeholder="Explain why you're delegating this task..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelegateOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelegateTask} 
            variant="contained"
            disabled={!delegateData.assignee}
          >
            Delegate & Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamLeadTaskManagement;
