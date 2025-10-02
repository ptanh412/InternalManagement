import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  RateReview as ReviewIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
  Person as AssigneeIcon,
  Update as UpdateIcon,
  Comment as CommentIcon,
  AttachFile as AttachmentIcon,
  CloudUpload as SubmitIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import taskService from '../../services/taskService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployeeTaskManager = ({ showNotification }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [submissionData, setSubmissionData] = useState({
    description: '',
    attachments: []
  });
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const myTasks = await taskService.getMyTasks();
      setTasks(myTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showNotification('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      let result;
      switch (action) {
        case 'start':
          result = await taskService.startTask(taskId);
          showNotification('Task started successfully', 'success');
          break;
        case 'review':
          result = await taskService.markTaskForReview(taskId);
          showNotification('Task marked for review', 'info');
          break;
        case 'complete':
          result = await taskService.completeTask(taskId);
          showNotification('Task completed successfully', 'success');
          break;
        default:
          return;
      }
      
      if (result) {
        await loadTasks(); // Refresh task list
      }
    } catch (error) {
      console.error(`Failed to ${action} task:`, error);
      showNotification(`Failed to ${action} task`, 'error');
    }
  };

  const handleProgressUpdate = async () => {
    if (!selectedTask || !progressUpdate.trim()) return;

    try {
      await taskService.updateTaskProgress(selectedTask.id, {
        notes: progressUpdate,
        updateDate: new Date().toISOString()
      });
      showNotification('Progress updated successfully', 'success');
      setDialogOpen(false);
      setProgressUpdate('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to update progress:', error);
      showNotification('Failed to update progress', 'error');
    }
  };

  const handleTaskSubmission = async () => {
    if (!selectedTask || !submissionData.description.trim()) return;

    try {
      await taskService.submitTask(selectedTask.id, {
        description: submissionData.description,
        submissionDate: new Date().toISOString(),
        attachments: submissionData.attachments
      });
      showNotification('Task submitted for review', 'success');
      setSubmissionDialogOpen(false);
      setSubmissionData({ description: '', attachments: [] });
      await loadTasks();
    } catch (error) {
      console.error('Failed to submit task:', error);
      showNotification('Failed to submit task', 'error');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done': return 'success';
      case 'in_progress': return 'info';
      case 'review': return 'warning';
      case 'todo': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress': return 'In Progress';
      case 'todo': return 'To Do';
      case 'review': return 'In Review';
      case 'done': return 'Done';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  const filteredTasks = {
    all: tasks,
    todo: tasks.filter(task => task.status === 'TODO'),
    inProgress: tasks.filter(task => task.status === 'IN_PROGRESS'),
    review: tasks.filter(task => task.status === 'REVIEW'),
    done: tasks.filter(task => task.status === 'DONE')
  };

  const currentTasks = Object.values(filteredTasks)[tabValue] || [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${filteredTasks.all.length})`} />
          <Tab label={`To Do (${filteredTasks.todo.length})`} />
          <Tab label={`In Progress (${filteredTasks.inProgress.length})`} />
          <Tab label={`Review (${filteredTasks.review.length})`} />
          <Tab label={`Done (${filteredTasks.done.length})`} />
        </Tabs>
      </Box>

      {currentTasks.length === 0 ? (
        <Alert severity="info">
          No tasks found in this category.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {task.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.projectId || 'No Project'} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.priority || 'Medium'} 
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(task.status)} 
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <Typography 
                        variant="body2" 
                        color={dayjs(task.dueDate).isBefore(dayjs()) ? 'error' : 'text.primary'}
                      >
                        {dayjs(task.dueDate).format('MMM DD, YYYY')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No due date
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '100px' }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={task.progress || 0} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">
                        {task.progress || 0}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {task.status === 'TODO' && (
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
                      
                      {task.status === 'IN_PROGRESS' && (
                        <>
                          <Tooltip title="Mark for Review">
                            <IconButton 
                              size="small"
                              onClick={() => handleTaskAction(task.id, 'review')}
                              color="warning"
                            >
                              <ReviewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Submit Work">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedTask(task);
                                setSubmissionDialogOpen(true);
                              }}
                              color="info"
                            >
                              <SubmitIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {(task.status === 'IN_PROGRESS' || task.status === 'REVIEW') && (
                        <Tooltip title="Update Progress">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedTask(task);
                              setDialogOpen(true);
                            }}
                            color="secondary"
                          >
                            <UpdateIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {task.status === 'REVIEW' && (
                        <Tooltip title="Mark Complete">
                          <IconButton 
                            size="small"
                            onClick={() => handleTaskAction(task.id, 'complete')}
                            color="success"
                          >
                            <CompleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Progress Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Task Progress</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedTask.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTask.description}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Progress Notes"
            value={progressUpdate}
            onChange={(e) => setProgressUpdate(e.target.value)}
            placeholder="Describe your progress, challenges, or updates..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProgressUpdate} variant="contained">
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Submission Dialog */}
      <Dialog open={submissionDialogOpen} onClose={() => setSubmissionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Task for Review</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{selectedTask.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTask.description}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Submission Description"
            value={submissionData.description}
            onChange={(e) => setSubmissionData(prev => ({
              ...prev,
              description: e.target.value
            }))}
            placeholder="Describe your completed work, deliverables, and any notes for review..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleTaskSubmission} 
            variant="contained"
            disabled={!submissionData.description.trim()}
          >
            Submit for Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeTaskManager;