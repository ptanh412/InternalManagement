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
  Badge,
  AvatarGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  People as TeamIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Work as WorkIcon,
  Star as SkillIcon,
  TrendingUp as PerformanceIcon,
  Assignment as TasksIcon,
  Schedule as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Speed as ProductivityIcon,
  Psychology as AIIcon,
  Lightbulb as InsightIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as DepartmentIcon,
  CalendarToday as CalendarIcon,
  Timeline as ExperienceIcon,
  School as CertificationIcon,
  Code as TechnicalIcon,
  Design as DesignIcon,
  Management as ManagementIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

const TeamManagement = ({ showNotification }) => {
  const theme = useTheme();
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [workloadFilter, setWorkloadFilter] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openSkillsDialog, setOpenSkillsDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuMember, setMenuMember] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    manager: '',
    joinDate: '',
    hourlyRate: '',
    skills: [],
    certifications: [],
  });

  const departments = ['All', 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'HR'];
  const roles = ['All', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UI/UX Designer', 'Product Manager', 'DevOps Engineer', 'QA Engineer', 'Data Scientist'];
  const workloadLevels = ['All', 'Low', 'Medium', 'High', 'Overloaded'];
  
  const skillCategories = {
    'Technical': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes'],
    'Design': ['Figma', 'Adobe Creative Suite', 'Sketch', 'Prototyping', 'User Research'],
    'Management': ['Project Management', 'Team Leadership', 'Agile/Scrum', 'Strategic Planning'],
    'Languages': ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'],
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [teamMembers, searchTerm, departmentFilter, roleFilter, workloadFilter]);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMembers = [
        {
          id: 1,
          name: 'Alice Johnson',
          email: 'alice.johnson@company.com',
          phone: '+1 (555) 123-4567',
          role: 'Frontend Developer',
          department: 'Engineering',
          manager: 'John Tech Lead',
          joinDate: '2022-03-15',
          hourlyRate: 75,
          avatar: '/avatars/alice.jpg',
          workload: 'High',
          currentTasks: 8,
          completedTasks: 45,
          efficiency: 94,
          productivity: 87,
          availability: 25, // hours per week
          skills: {
            'Technical': [
              { name: 'JavaScript', level: 5, verified: true },
              { name: 'React', level: 5, verified: true },
              { name: 'TypeScript', level: 4, verified: false },
              { name: 'CSS', level: 4, verified: true },
            ],
            'Design': [
              { name: 'Figma', level: 3, verified: false },
            ],
          },
          certifications: ['AWS Certified Developer', 'React Professional'],
          recentProjects: ['E-commerce Platform', 'Mobile App Redesign'],
          performanceRating: 4.8,
          teamRating: 4.6,
        },
        {
          id: 2,
          name: 'Bob Smith',
          email: 'bob.smith@company.com',
          phone: '+1 (555) 234-5678',
          role: 'Backend Developer',
          department: 'Engineering',
          manager: 'John Tech Lead',
          joinDate: '2021-08-22',
          hourlyRate: 80,
          avatar: '/avatars/bob.jpg',
          workload: 'Medium',
          currentTasks: 5,
          completedTasks: 67,
          efficiency: 91,
          productivity: 85,
          availability: 30,
          skills: {
            'Technical': [
              { name: 'Python', level: 5, verified: true },
              { name: 'Node.js', level: 4, verified: true },
              { name: 'SQL', level: 5, verified: true },
              { name: 'AWS', level: 4, verified: true },
              { name: 'Docker', level: 3, verified: false },
            ],
          },
          certifications: ['AWS Solutions Architect', 'Python Professional'],
          recentProjects: ['E-commerce Platform', 'Database Migration'],
          performanceRating: 4.5,
          teamRating: 4.7,
        },
        {
          id: 3,
          name: 'Carol Davis',
          email: 'carol.davis@company.com',
          phone: '+1 (555) 345-6789',
          role: 'UI/UX Designer',
          department: 'Design',
          manager: 'Sarah Design Lead',
          joinDate: '2023-01-10',
          hourlyRate: 70,
          avatar: '/avatars/carol.jpg',
          workload: 'Low',
          currentTasks: 3,
          completedTasks: 28,
          efficiency: 96,
          productivity: 92,
          availability: 35,
          skills: {
            'Design': [
              { name: 'Figma', level: 5, verified: true },
              { name: 'Adobe Creative Suite', level: 4, verified: true },
              { name: 'User Research', level: 4, verified: false },
              { name: 'Prototyping', level: 5, verified: true },
            ],
            'Technical': [
              { name: 'HTML/CSS', level: 3, verified: false },
            ],
          },
          certifications: ['Google UX Design Certificate', 'Adobe Certified Expert'],
          recentProjects: ['Mobile App Redesign', 'Marketing Campaign'],
          performanceRating: 4.9,
          teamRating: 4.8,
        },
        {
          id: 4,
          name: 'David Wilson',
          email: 'david.wilson@company.com',
          phone: '+1 (555) 456-7890',
          role: 'Full Stack Developer',
          department: 'Engineering',
          manager: 'John Tech Lead',
          joinDate: '2022-11-05',
          hourlyRate: 85,
          avatar: '/avatars/david.jpg',
          workload: 'High',
          currentTasks: 7,
          completedTasks: 33,
          efficiency: 88,
          productivity: 90,
          availability: 20,
          skills: {
            'Technical': [
              { name: 'JavaScript', level: 4, verified: true },
              { name: 'React', level: 4, verified: true },
              { name: 'Node.js', level: 4, verified: true },
              { name: 'MongoDB', level: 3, verified: false },
              { name: 'AWS', level: 3, verified: false },
            ],
          },
          certifications: ['Full Stack Development Bootcamp'],
          recentProjects: ['Mobile App Redesign', 'AI Integration'],
          performanceRating: 4.3,
          teamRating: 4.4,
        },
        {
          id: 5,
          name: 'Eva Brown',
          email: 'eva.brown@company.com',
          phone: '+1 (555) 567-8901',
          role: 'QA Engineer',
          department: 'Engineering',
          manager: 'John Tech Lead',
          joinDate: '2023-06-12',
          hourlyRate: 65,
          avatar: '/avatars/eva.jpg',
          workload: 'Medium',
          currentTasks: 4,
          completedTasks: 19,
          efficiency: 93,
          productivity: 89,
          availability: 32,
          skills: {
            'Technical': [
              { name: 'Test Automation', level: 4, verified: true },
              { name: 'Selenium', level: 4, verified: true },
              { name: 'JavaScript', level: 3, verified: false },
              { name: 'API Testing', level: 4, verified: true },
            ],
          },
          certifications: ['ISTQB Foundation Level', 'Selenium WebDriver'],
          recentProjects: ['E-commerce Platform', 'Quality Assurance'],
          performanceRating: 4.6,
          teamRating: 4.5,
        },
      ];
      
      setTeamMembers(mockMembers);
      showNotification('Team members loaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = teamMembers;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'All') {
      filtered = filtered.filter(member => member.department === departmentFilter);
    }

    if (roleFilter !== 'All') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    if (workloadFilter !== 'All') {
      filtered = filtered.filter(member => member.workload === workloadFilter);
    }

    setFilteredMembers(filtered);
  };

  const getWorkloadColor = (workload) => {
    switch (workload) {
      case 'Low':
        return 'success';
      case 'Medium':
        return 'info';
      case 'High':
        return 'warning';
      case 'Overloaded':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSkillLevelColor = (level) => {
    if (level >= 4) return 'success';
    if (level >= 3) return 'warning';
    return 'default';
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setOpenViewDialog(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      department: member.department,
      manager: member.manager,
      joinDate: member.joinDate,
      hourlyRate: member.hourlyRate.toString(),
      skills: member.skills,
      certifications: member.certifications,
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setMenuMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMember(null);
  };

  const MemberCard = ({ member }) => (
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
      onClick={() => handleViewMember(member)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56 }}>
              {member.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {member.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {member.role}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {member.department}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, member);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`${member.workload} Workload`} 
            color={getWorkloadColor(member.workload)} 
            size="small" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`${member.currentTasks} Active Tasks`} 
            variant="outlined" 
            size="small" 
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Performance Metrics
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption">Efficiency</Typography>
            <Typography variant="caption">{member.efficiency}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={member.efficiency}
            sx={{ height: 6, borderRadius: 3, mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption">Team Rating</Typography>
            <Rating value={member.teamRating} readOnly size="small" precision={0.1} />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Top Skills
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {Object.values(member.skills).flat().slice(0, 3).map((skill, index) => (
              <Chip
                key={index}
                label={skill.name}
                size="small"
                variant="outlined"
                color={getSkillLevelColor(skill.level)}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Available: {member.availability}h/week
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${member.hourlyRate}/hr
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const MemberViewDialog = ({ open, onClose, member }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48 }}>
            {member?.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Box>
            <Typography variant="h6">{member?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {member?.role} • {member?.department}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {member && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Contact Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <EmailIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Email" secondary={member.email} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                      <PhoneIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Phone" secondary={member.phone} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Manager" secondary={member.manager} />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Work Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                      <CalendarIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Join Date" secondary={new Date(member.joinDate).toLocaleDateString()} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                      <WorkIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Hourly Rate" secondary={`$${member.hourlyRate}/hour`} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getWorkloadColor(member.workload) + '.main', width: 32, height: 32 }}>
                      <TimeIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Workload" secondary={`${member.workload} (${member.availability}h/week available)`} />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Performance Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">{member.currentTasks}</Typography>
                    <Typography variant="caption">Active Tasks</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">{member.completedTasks}</Typography>
                    <Typography variant="caption">Completed Tasks</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">{member.efficiency}%</Typography>
                    <Typography variant="caption">Efficiency</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">{member.productivity}%</Typography>
                    <Typography variant="caption">Productivity</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Skills Matrix
              </Typography>
              {Object.entries(member.skills).map(([category, skills]) => (
                <Accordion key={category} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">{category} Skills</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {skills.map((skill, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{skill.name}</Typography>
                              {skill.verified && (
                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                              )}
                            </Box>
                            <Rating value={skill.level} readOnly size="small" max={5} />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Certifications
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {member.certifications?.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    variant="outlined"
                    icon={<CertificationIcon />}
                    color="primary"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Recent Projects
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {member.recentProjects?.map((project, index) => (
                  <Chip
                    key={index}
                    label={project}
                    variant="filled"
                    color="secondary"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={() => handleEditMember(member)} variant="contained" startIcon={<EditIcon />}>
          Edit Member
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Team Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'table'}
                onChange={(e) => setViewMode(e.target.checked ? 'table' : 'cards')}
              />
            }
            label="Table View"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Member
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search team members..."
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
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  {roles.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Workload</InputLabel>
                <Select
                  value={workloadFilter}
                  label="Workload"
                  onChange={(e) => setWorkloadFilter(e.target.value)}
                >
                  {workloadLevels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setDepartmentFilter('All');
                  setRoleFilter('All');
                  setWorkloadFilter('All');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Team Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                <TeamIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {filteredMembers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Team Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                <SuccessIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {Math.round(filteredMembers.reduce((acc, m) => acc + m.efficiency, 0) / filteredMembers.length || 0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Efficiency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                <TasksIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {filteredMembers.reduce((acc, m) => acc + m.currentTasks, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                <TimeIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {filteredMembers.reduce((acc, m) => acc + m.availability, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Members Display */}
      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {filteredMembers.map((member) => (
            <Grid item xs={12} sm={6} lg={4} key={member.id}>
              <MemberCard member={member} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card elevation={2}>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Workload</TableCell>
                    <TableCell>Efficiency</TableCell>
                    <TableCell>Tasks</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewMember(member)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {member.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {member.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.workload}
                          color={getWorkloadColor(member.workload)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={member.efficiency}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">{member.efficiency}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{member.currentTasks} / {member.completedTasks}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, member);
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
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewMember(menuMember)}>
          <PersonIcon sx={{ mr: 1 }} />
          View Profile
        </MenuItem>
        <MenuItem onClick={() => handleEditMember(menuMember)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Member
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedMember(menuMember);
          setOpenSkillsDialog(true);
          handleMenuClose();
        }}>
          <SkillIcon sx={{ mr: 1 }} />
          Manage Skills
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Remove Member
        </MenuItem>
      </Menu>

      {/* View Member Dialog */}
      <MemberViewDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        member={selectedMember}
      />
    </Box>
  );
};

export default TeamManagement;
