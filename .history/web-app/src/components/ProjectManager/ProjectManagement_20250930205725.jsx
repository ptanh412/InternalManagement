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
  Fab,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  AvatarGroup,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  InputAdornment,
  Autocomplete,
  Container,
  Alert,
  CircularProgress,
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
  Assignment as ProjectIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Flag as PriorityIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import projectService from '../../services/projectService';
import { getMyInfo } from '../../services/userService';

const ProjectManagement = ({ showNotification }) => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuProject, setMenuProject] = useState(null);

  // Form state with proper initial values
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    startDate: null,
    endDate: null,
    budget: '',
    projectLeaderId: '',
    teamLeadId: '',
    requiredSkills: [],
  });

  const statusOptions = ['All', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'CANCELLED', 'COMPLETED'];
  const priorityOptions = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  const skillOptions = [
    'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java', 'C#', '.NET',
    'Spring Boot', 'Django', 'Flask', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'DevOps', 'CI/CD',
    'Machine Learning', 'Data Science', 'AI', 'Blockchain', 'Mobile Development'
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  const loadInitialData = async () => {
    await Promise.all([
      loadProjects(),
      loadCurrentUser()
    ]);
  };

  const loadCurrentUser = async () => {
    try {
      const response = await getMyInfo();
      setCurrentUser(response.data.result);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getAllProjects();
      if (response.result) {
        setProjects(response.result);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects. Please try again.');
      showNotification('Failed to load projects', 'error');
      // Fallback to empty array
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        projectLeaderId: currentUser?.id || formData.projectLeaderId,
        teamLeadId: formData.teamLeadId,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      const response = await projectService.createProject(projectData);
      
      if (response.result) {
        // Update required skills if provided
        if (formData.requiredSkills.length > 0) {
          await projectService.updateProjectSkills(response.result.id, formData.requiredSkills);
        }
        
        showNotification('Project created successfully!', 'success');
        setOpenCreateDialog(false);
        resetForm();
        await loadProjects(); // Reload projects
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification('Failed to create project. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject || !formData.name || !formData.startDate || !formData.endDate) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        projectLeaderId: formData.projectLeaderId,
        teamLeadId: formData.teamLeadId,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      const response = await projectService.updateProject(selectedProject.id, projectData);
      
      if (response.result) {
        // Update required skills if provided
        if (formData.requiredSkills.length > 0) {
          await projectService.updateProjectSkills(selectedProject.id, formData.requiredSkills);
        }
        
        showNotification('Project updated successfully!', 'success');
        setOpenEditDialog(false);
        resetForm();
        await loadProjects(); // Reload projects
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Failed to update project. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await projectService.deleteProject(project.id);
        showNotification('Project deleted successfully!', 'success');
        await loadProjects(); // Reload projects
      } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project. Please try again.', 'error');
      }
    }
  };

  const handleStatusChange = async (project, newStatus) => {
    try {
      await projectService.updateProjectStatus(project.id, newStatus);
      showNotification(`Project status updated to ${newStatus}`, 'success');
      await loadProjects(); // Reload projects
    } catch (error) {
      console.error('Error updating project status:', error);
      showNotification('Failed to update project status. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: null,
      endDate: null,
      budget: '',
      projectLeaderId: '',
      teamLeadId: '',
      requiredSkills: [],
    });
    setSelectedProject(null);
  };

  const populateFormForEdit = (project) => {
    setFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'PLANNING',
      priority: project.priority || 'MEDIUM',
      startDate: project.startDate ? dayjs(project.startDate) : null,
      endDate: project.endDate ? dayjs(project.endDate) : null,
      budget: project.budget ? project.budget.toString() : '',
      projectLeaderId: project.projectLeaderId || '',
      teamLeadId: project.teamLeadId || '',
      requiredSkills: project.requiredSkills || [],
    });
    setSelectedProject(project);
  };

  // Keep existing mock data as fallback
        {
          id: 1,
          name: 'E-commerce Platform',
          description: 'Complete redesign and development of the company e-commerce platform',
          status: 'In Progress',
          priority: 'High',
          startDate: '2024-01-01',
          endDate: '2024-02-15',
          budget: 50000,
          progress: 75,
          teamMembers: ['Alice Johnson', 'Bob Smith', 'Carol Davis'],
          tags: ['Web Development', 'E-commerce', 'React'],
          client: 'Internal',
          department: 'Engineering',
          tasksTotal: 35,
          tasksCompleted: 26,
          createdAt: '2024-01-01',
          createdBy: 'John Manager',
        },
        {
          id: 2,
          name: 'Mobile App Redesign',
          description: 'User interface and experience redesign for mobile application',
          status: 'In Progress',
          priority: 'Medium',
          startDate: '2024-01-15',
          endDate: '2024-03-01',
          budget: 30000,
          progress: 45,
          teamMembers: ['David Wilson', 'Eva Brown'],
          tags: ['Mobile', 'UI/UX', 'React Native'],
          client: 'TechCorp',
          department: 'Design',
          tasksTotal: 28,
          tasksCompleted: 12,
          createdAt: '2024-01-15',
          createdBy: 'Jane Designer',
        },
        {
          id: 3,
          name: 'AI Integration',
          description: 'Integrate AI capabilities into existing systems',
          status: 'Review',
          priority: 'High',
          startDate: '2023-12-01',
          endDate: '2024-01-30',
          budget: 75000,
          progress: 90,
          teamMembers: ['Frank Miller', 'Grace Lee', 'Henry Taylor'],
          tags: ['AI', 'Machine Learning', 'Python'],
          client: 'DataCorp',
          department: 'Engineering',
          tasksTotal: 25,
          tasksCompleted: 22,
          createdAt: '2023-12-01',
          createdBy: 'Mike Lead',
        },
        {
          id: 4,
          name: 'Marketing Campaign',
          description: 'Q1 2024 digital marketing campaign planning and execution',
          status: 'Planning',
          priority: 'Medium',
          startDate: '2024-02-01',
          endDate: '2024-04-30',
          budget: 25000,
          progress: 15,
          teamMembers: ['Carol Davis', 'Eva Brown'],
          tags: ['Marketing', 'Digital', 'Social Media'],
          client: 'Marketing Dept',
          department: 'Marketing',
          tasksTotal: 20,
          tasksCompleted: 3,
          createdAt: '2024-01-20',
          createdBy: 'Sarah Marketing',
        },
        {
          id: 5,
          name: 'Database Migration',
          description: 'Migrate legacy database to new cloud infrastructure',
          status: 'Completed',
          priority: 'Critical',
          startDate: '2023-11-01',
          endDate: '2023-12-31',
          budget: 40000,
          progress: 100,
          teamMembers: ['Bob Smith', 'Frank Miller'],
          tags: ['Database', 'Cloud', 'Migration'],
          client: 'Internal',
          department: 'Operations',
          tasksTotal: 18,
          tasksCompleted: 18,
          createdAt: '2023-11-01',
          createdBy: 'Tom DevOps',
        },
      ];
      
      setProjects(mockProjects);
      showNotification('Projects loaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.requiredSkills && project.requiredSkills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (priorityFilter !== 'All') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const handleEditProject = (project) => {
    populateFormForEdit(project);
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setOpenViewDialog(true);
  };

  const handleDeleteProject = (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      setProjects(projects.filter(p => p.id !== project.id));
      showNotification('Project deleted successfully', 'success');
    }
    handleMenuClose();
  };

  const handleSaveProject = async () => {
    try {
      const projectData = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        startDate: formData.startDate ? formData.startDate.format('YYYY-MM-DD') : null,
        endDate: formData.endDate ? formData.endDate.format('YYYY-MM-DD') : null,
      };

      if (selectedProject) {
        // Update existing project
        const updatedProject = { ...selectedProject, ...projectData };
        setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p));
        showNotification('Project updated successfully', 'success');
        setOpenEditDialog(false);
      } else {
        // Create new project
        const newProject = {
          id: Date.now(),
          ...projectData,
          progress: 0,
          tasksTotal: 0,
          tasksCompleted: 0,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Current User',
        };
        setProjects([...projects, newProject]);
        showNotification('Project created successfully', 'success');
        setOpenCreateDialog(false);
      }
    } catch (error) {
      showNotification('Failed to save project', 'error');
    }
  };

  const handleMenuOpen = (event, project) => {
    setAnchorEl(event.currentTarget);
    setMenuProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuProject(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Review':
        return 'warning';
      case 'Planning':
        return 'info';
      case 'On Hold':
        return 'default';
      case 'Cancelled':
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

  const ProjectDialog = ({ open, onClose, title, onSave }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Project Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Client"
              fullWidth
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
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
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                label="Department"
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {departmentOptions.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Budget"
              fullWidth
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={teamMemberOptions}
              value={formData.teamMembers}
              onChange={(event, newValue) => setFormData({ ...formData, teamMembers: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Team Members" placeholder="Select team members" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={['Web Development', 'Mobile', 'AI', 'Design', 'Marketing', 'Database']}
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
          {selectedProject ? 'Update' : 'Create'} Project
        </Button>
      </DialogActions>
    </Dialog>
  );

  const ProjectViewDialog = ({ open, onClose, project }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{project?.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={project?.status} color={getStatusColor(project?.status)} />
            <Chip label={project?.priority} color={getPriorityColor(project?.priority)} />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {project && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{project.description}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Project Details</Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Client" secondary={project.client} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Department" secondary={project.department} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Budget" secondary={`$${project.budget?.toLocaleString()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Start Date" secondary={new Date(project.startDate).toLocaleDateString()} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="End Date" secondary={new Date(project.endDate).toLocaleDateString()} />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Progress</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Overall Progress</Typography>
                  <Typography variant="body2">{project.progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={project.progress} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {project.tasksCompleted} of {project.tasksTotal} tasks completed
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Team Members</Typography>
              <AvatarGroup>
                {project.teamMembers?.map((member, index) => (
                  <Tooltip key={index} title={member}>
                    <Avatar>{member.split(' ').map(n => n[0]).join('')}</Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {project.tags?.map((tag, index) => (
                  <Chip key={index} label={tag} variant="outlined" size="small" />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={() => handleEditProject(project)} variant="contained" startIcon={<EditIcon />}>
          Edit Project
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Project Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
          sx={{ borderRadius: 2 }}
        >
          Create Project
        </Button>
      </Box>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search projects..."
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
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
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
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setPriorityFilter('All');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
                cursor: 'pointer',
              }}
              onClick={() => handleViewProject(project)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                    {project.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, project);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                  {project.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                  <Chip label={project.priority} color={getPriorityColor(project.priority)} size="small" />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Progress</Typography>
                    <Typography variant="body2" color="text.secondary">{project.progress}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Due: {new Date(project.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${project.budget?.toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                    {project.teamMembers?.map((member, index) => (
                      <Tooltip key={index} title={member}>
                        <Avatar>{member.split(' ').map(n => n[0]).join('')}</Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                  <Typography variant="caption" color="text.secondary">
                    {project.tasksCompleted}/{project.tasksTotal} tasks
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewProject(menuProject)}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditProject(menuProject)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Project
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteProject(menuProject)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Project
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <ProjectDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        title="Create New Project"
        onSave={handleSaveProject}
      />

      <ProjectDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        title="Edit Project"
        onSave={handleSaveProject}
      />

      <ProjectViewDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        project={selectedProject}
      />
    </Box>
  );
};

export default ProjectManagement;
