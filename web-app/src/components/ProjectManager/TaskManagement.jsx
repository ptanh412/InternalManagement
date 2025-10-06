import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Select,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  InputAdornment,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Task as TaskIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Flag as PriorityIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Psychology as AIIcon,
  Lightbulb as IdeaIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  History as HistoryIcon,
  Star as StarIcon,
  BugReport as BugIcon,
  Build as BuildIcon,
  Code as CodeIcon,
  DesignServices as DesignIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import projectService from '../../services/projectService';
import { getMyInfo } from '../../services/userService';
import { formatDate, formatDateWithFallback, toISODateString, isOverdue } from '../../utils/dateUtils';

const TaskManagement = ({ showNotification }) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTask, setMenuTask] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    assignee: '',
    project: '',
    dueDate: null,
    estimatedHours: '',
    tags: [],
    taskType: 'Feature',
  });

  const statusOptions = ['All', 'To Do', 'In Progress', 'Review', 'Testing', 'Done', 'Blocked'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Critical'];
  const taskTypeOptions = ['Feature', 'Bug', 'Enhancement', 'Documentation', 'Testing', 'Research'];
  const teamMembers = [
    'Alice Johnson',
    'Bob Smith',
    'Carol Davis',
    'David Wilson',
    'Eva Brown',
    'Frank Miller',
    'Grace Lee',
    'Henry Taylor',
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter, assigneeFilter]);

  const loadInitialData = async () => {
    // Load current user first, then load projects that depend on user info
    const userId = await loadCurrentUser();
    if (userId) {
      await loadProjects(userId);
    }
    loadAIRecommendations();
  };

  const loadCurrentUser = async () => {
    try {
      const response = await getMyInfo();
      console.log("Current user info:", response.data.result.userId);
      setCurrentUser(response.data.result);
      return response.data.result.userId; // Return the userId for immediate use
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  };

  const loadTasks = async () => {
    // Tasks are now loaded from projects in loadProjects function
    // This function can be used for additional task-specific API calls if needed
    try {
      console.log("Tasks loading handled by loadProjects function");
    } catch (error) {
      console.error('Error in loadTasks:', error);
      showNotification('Failed to load tasks', 'error');
    }
  };

  // Status mapping function to convert API status to UI status
  const mapApiStatusToUIStatus = (apiStatus) => {
    const statusMap = {
      'TO_DO': 'To Do',
      'IN_PROGRESS': 'In Progress',
      'REVIEW': 'Review',
      'TESTING': 'Testing',
      'DONE': 'Done',
      'COMPLETED': 'Done',
      'BLOCKED': 'Blocked',
      'CANCELLED': 'Blocked'
    };
    return statusMap[apiStatus] || 'To Do';
  };

  // Priority mapping function to convert API priority to UI priority
  const mapApiPriorityToUIPriority = (apiPriority) => {
    const priorityMap = {
      'LOW': 'Low',
      'MEDIUM': 'Medium',
      'HIGH': 'High',
      'CRITICAL': 'Critical'
    };
    return priorityMap[apiPriority] || 'Medium';
  };

  const loadProjects = async (userId = null) => {
    // Use provided userId or wait for currentUser to be available
    const userIdToUse = userId || currentUser?.userId;
    if (!userIdToUse) {
      console.log("No userId available yet");
      return;
    }
    
    try {
      console.log("Loading projects for userId:", userIdToUse);
      const response = await projectService.getProjectsByLeader(userIdToUse);
      
      if (response.result) {
        const projectsData = response.result;
        console.log("Projects loaded:", projectsData);
        
        // Set projects for filter dropdown
        setProjects(projectsData.map(project => ({
          id: project.id,
          name: project.name
        })));
        
        // Extract all tasks from all projects
        const allTasks = [];
        projectsData.forEach(project => {
          if (project.tasks && project.tasks.length > 0) {
            project.tasks.forEach(task => {
              allTasks.push({
                id: task.id,
                title: task.title,
                description: task.description,
                status: mapApiStatusToUIStatus(task.status),
                priority: mapApiPriorityToUIPriority(task.priority),
                assignee: task.assignedTo || 'Unassigned',
                project: project.name,
                projectId: project.id,
                dueDate: task.dueDate || project.endDate,
                estimatedHours: task.estimatedHours || 0,
                actualHours: task.actualHours || 0,
                taskType: task.taskType || 'Task',
                tags: task.tags || [],
                createdAt: task.createdAt || project.createdAt,
                createdBy: task.reporterId || project.projectLeaderId,
                comments: task.comments || 0,
                attachments: task.attachments || 0,
                overdue: isOverdue(task.dueDate),
              });
            });
          }
        });
        
        console.log("Tasks extracted from projects:", allTasks);
        setTasks(allTasks);
        showNotification(`Loaded ${allTasks.length} tasks from ${projectsData.length} projects`, 'success');
      } else {
        setProjects([]);
        setTasks([]);
        showNotification('No projects or tasks found', 'info');
      }
    } catch (error) {
      console.error('Failed to load projects', error);
      showNotification('Failed to load projects and tasks', 'error');
      setProjects([]);
      setTasks([]);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      // Mock AI recommendations
      setAiRecommendations([
        {
          id: 1,
          type: 'Task Assignment',
          title: 'Reassign overdue task',
          description: 'Bob Smith has an overdue critical task. Consider reassigning to available team member.',
          taskId: 2,
          confidence: 85,
          impact: 'High',
        },
        {
          id: 2,
          type: 'Workload Balance',
          title: 'Balance team workload',
          description: 'Alice Johnson is overloaded. Distribute some tasks to other team members.',
          confidence: 92,
          impact: 'Medium',
        },
        {
          id: 3,
          type: 'Time Estimation',
          title: 'Adjust time estimates',
          description: 'Tasks in AI Integration project are taking longer than estimated. Consider updating estimates.',
          confidence: 78,
          impact: 'Low',
        },
      ]);
    } catch (error) {
      console.error('Failed to load AI recommendations', error);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'All') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (projectFilter !== 'All') {
      filtered = filtered.filter(task => task.project === projectFilter);
    }

    if (assigneeFilter !== 'All') {
      filtered = filtered.filter(task => task.assignee === assigneeFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = () => {
    setFormData({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      assignee: '',
      project: '',
      dueDate: null,
      estimatedHours: '',
      tags: [],
      taskType: 'Feature',
    });
    setOpenCreateDialog(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      project: task.project,
      dueDate: dayjs(task.dueDate),
      estimatedHours: task.estimatedHours.toString(),
      tags: task.tags,
      taskType: task.taskType,
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setOpenViewDialog(true);
  };

  const handleDeleteTask = (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setTasks(tasks.filter(t => t.id !== task.id));
      showNotification('Task deleted successfully', 'success');
    }
    handleMenuClose();
  };

  const handleSaveTask = async () => {
    try {
      const taskData = {
        ...formData,
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
        dueDate: formData.dueDate ? formData.dueDate.format('YYYY-MM-DD') : null,
      };

      if (selectedTask) {
        // Update existing task
        const updatedTask = { ...selectedTask, ...taskData };
        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
        showNotification('Task updated successfully', 'success');
        setOpenEditDialog(false);
      } else {
        // Create new task
        const newTask = {
          id: Date.now(),
          ...taskData,
          actualHours: 0,
          createdAt: toISODateString(new Date()),
          createdBy: 'Current User',
          comments: 0,
          attachments: 0,
        };
        setTasks([...tasks, newTask]);
        showNotification('Task created successfully', 'success');
        setOpenCreateDialog(false);
      }
    } catch (error) {
      showNotification('Failed to save task', 'error');
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    showNotification('Task status updated', 'success');
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setMenuTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTask(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Review':
        return 'warning';
      case 'Testing':
        return 'info';
      case 'To Do':
        return 'default';
      case 'Blocked':
        return 'error';
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

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'Bug':
        return <BugIcon />;
      case 'Feature':
        return <BuildIcon />;
      case 'Documentation':
        return <InfoIcon />;
      case 'Testing':
        return <CheckCircleIcon />;
      case 'Research':
        return <AIIcon />;
      case 'Design':
        return <DesignIcon />;
      default:
        return <TaskIcon />;
    }
  };

  const TaskDialog = ({ open, onClose, title, onSave }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Task Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={formData.project}
                label="Project"
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.name}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={formData.assignee}
                label="Assignee"
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              >
                {teamMembers.map(member => (
                  <MenuItem key={member} value={member}>{member}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.filter(s => s !== 'All').map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {priorityOptions.filter(p => p !== 'All').map(priority => (
                  <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={formData.taskType}
                label="Task Type"
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
              >
                {taskTypeOptions.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Estimated Hours"
              fullWidth
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={['Frontend', 'Backend', 'Database', 'API', 'UI/UX', 'Testing', 'Security']}
              value={formData.tags}
              onChange={(event, newValue) => setFormData({ ...formData, tags: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Add tags" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">
          {selectedTask ? 'Update' : 'Create'} Task
        </Button>
      </DialogActions>
    </Dialog>
  );

  const TaskViewDialog = ({ open, onClose, task }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task && getTaskTypeIcon(task.taskType)}
            <Typography variant="h6">{task?.title}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={task?.status} color={getStatusColor(task?.status)} />
            <Chip label={task?.priority} color={getPriorityColor(task?.priority)} />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {task && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{task.description}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Task Details</Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Project" secondary={task.project} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Assignee" secondary={task.assignee} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Task Type" secondary={task.taskType} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Due Date" secondary={formatDate(task.dueDate)} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Time Tracking" 
                    secondary={`${task.actualHours}h / ${task.estimatedHours}h`} 
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Progress</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Time Progress</Typography>
                  <Typography variant="body2">
                    {Math.round((task.actualHours / task.estimatedHours) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((task.actualHours / task.estimatedHours) * 100, 100)} 
                  sx={{ height: 8, borderRadius: 4 }} 
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {task.comments} comments • {task.attachments} attachments
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {task.tags?.map((tag, index) => (
                  <Chip key={index} label={tag} variant="outlined" size="small" />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={() => handleEditTask(task)} variant="contained" startIcon={<EditIcon />}>
          Edit Task
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Task Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'kanban'}
                onChange={(e) => setViewMode(e.target.checked ? 'kanban' : 'list')}
              />
            }
            label="Kanban View"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
            sx={{ borderRadius: 2 }}
          >
            Create Task
          </Button>
        </Box>
      </Box>

      {/* AI Recommendations */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="secondary" />
            <Typography variant="h6">AI Recommendations</Typography>
            <Badge badgeContent={aiRecommendations.length} color="secondary" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {aiRecommendations.map((rec) => (
              <Grid item xs={12} md={4} key={rec.id}>
                <Card elevation={1}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <IdeaIcon color="secondary" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {rec.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {rec.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={rec.type} size="small" variant="outlined" />
                      <Typography variant="caption" color="success.main">
                        {rec.confidence}% confidence
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  {priorityOptions.map(priority => (
                    <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  label="Project"
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.name}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={assigneeFilter}
                  label="Assignee"
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  {teamMembers.map(member => (
                    <MenuItem key={member} value={member}>{member}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setProjectFilter('All');
                  setAssigneeFilter('All');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card elevation={2}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: task.overdue ? alpha(theme.palette.error.main, 0.05) : 'inherit'
                    }}
                    onClick={() => handleViewTask(task)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTaskTypeIcon(task.taskType)}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {task.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {task.tags.slice(0, 2).map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{task.project}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">{task.assignee}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        size="small"
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, e.target.value);
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        {statusOptions.filter(s => s !== 'All').map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.priority} 
                        color={getPriorityColor(task.priority)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={task.overdue ? 'error' : 'text.primary'}
                        sx={{ fontWeight: task.overdue ? 'bold' : 'normal' }}
                      >
                        {formatDate(task.dueDate)}
                        {task.overdue && (
                          <WarningIcon sx={{ ml: 0.5, fontSize: 16, color: 'error.main' }} />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            task.estimatedHours === 0 ? 0 :
                            Math.min((task.actualHours / task.estimatedHours) * 100, 100)
                          }
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">
                          {task.estimatedHours === 0 ? '0' : Math.round((task.actualHours / task.estimatedHours) * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, task);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewTask(menuTask)}>
          <InfoIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditTask(menuTask)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Task
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteTask(menuTask)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <TaskDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        title="Create New Task"
        onSave={handleSaveTask}
      />

      <TaskDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        title="Edit Task"
        onSave={handleSaveTask}
      />

      <TaskViewDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        task={selectedTask}
      />
    </Box>
  );
};

export default TaskManagement;
