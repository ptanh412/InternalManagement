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
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Badge,
  alpha,
  useTheme,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
} from "@mui/material";
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  Speed as EfficiencyIcon,
  Psychology as SkillIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  School as TrainingIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Group as TeamIcon,
  Flag as GoalIcon,
  Lightbulb as InsightIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

const TeamLeadOverview = ({ showNotification }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [skillGapOpen, setSkillGapOpen] = useState(false);
  const [capacityPlanOpen, setCapacityPlanOpen] = useState(false);
  const [skillsData, setSkillsData] = useState({});

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Mock data for team overview
      const mockTeamMembers = [
        {
          id: 1,
          name: 'Alice Johnson',
          avatar: 'AJ',
          role: 'Senior Frontend Developer',
          email: 'alice.johnson@company.com',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY',
          department: 'Engineering',
          joinDate: dayjs().subtract(2, 'years'),
          currentWorkload: 85,
          efficiency: 95,
          completedTasks: 142,
          activeTasks: 8,
          overdueTasks: 1,
          skills: [
            { name: 'React', level: 5, category: 'Frontend' },
            { name: 'JavaScript', level: 5, category: 'Programming' },
            { name: 'CSS', level: 4, category: 'Frontend' },
            { name: 'Node.js', level: 3, category: 'Backend' },
            { name: 'TypeScript', level: 4, category: 'Programming' },
            { name: 'UI/UX Design', level: 3, category: 'Design' },
          ],
          recentPerformance: [
            { month: 'Jan', tasks: 12, efficiency: 94 },
            { month: 'Feb', tasks: 15, efficiency: 96 },
            { month: 'Mar', tasks: 18, efficiency: 95 },
            { month: 'Apr', tasks: 14, efficiency: 97 },
            { month: 'May', tasks: 16, efficiency: 95 },
          ],
          goals: [
            { id: 1, title: 'Complete React certification', progress: 75, dueDate: dayjs().add(1, 'month') },
            { id: 2, title: 'Lead mobile app project', progress: 40, dueDate: dayjs().add(3, 'months') },
          ],
          strengths: ['Problem-solving', 'Team collaboration', 'Technical leadership'],
          improvementAreas: ['Backend technologies', 'System design'],
          availableHours: 32,
          preferredWorkTypes: ['Frontend Development', 'Code Review', 'Mentoring'],
        },
        {
          id: 2,
          name: 'Bob Smith',
          avatar: 'BS',
          role: 'Backend Developer',
          email: 'bob.smith@company.com',
          phone: '+1 (555) 234-5678',
          location: 'San Francisco, CA',
          department: 'Engineering',
          joinDate: dayjs().subtract(1.5, 'years'),
          currentWorkload: 70,
          efficiency: 88,
          completedTasks: 98,
          activeTasks: 6,
          overdueTasks: 0,
          skills: [
            { name: 'Java', level: 5, category: 'Programming' },
            { name: 'Spring Boot', level: 4, category: 'Backend' },
            { name: 'Database Design', level: 5, category: 'Database' },
            { name: 'Microservices', level: 4, category: 'Architecture' },
            { name: 'Docker', level: 3, category: 'DevOps' },
            { name: 'AWS', level: 3, category: 'Cloud' },
          ],
          recentPerformance: [
            { month: 'Jan', tasks: 8, efficiency: 86 },
            { month: 'Feb', tasks: 10, efficiency: 89 },
            { month: 'Mar', tasks: 12, efficiency: 88 },
            { month: 'Apr', tasks: 9, efficiency: 90 },
            { month: 'May', tasks: 11, efficiency: 88 },
          ],
          goals: [
            { id: 1, title: 'Learn Kubernetes', progress: 30, dueDate: dayjs().add(2, 'months') },
            { id: 2, title: 'Optimize database performance', progress: 80, dueDate: dayjs().add(2, 'weeks') },
          ],
          strengths: ['Database optimization', 'System architecture', 'Performance tuning'],
          improvementAreas: ['Frontend technologies', 'Team communication'],
          availableHours: 40,
          preferredWorkTypes: ['Backend Development', 'Database Design', 'Performance Optimization'],
        },
        {
          id: 3,
          name: 'Carol White',
          avatar: 'CW',
          role: 'Full Stack Developer',
          email: 'carol.white@company.com',
          phone: '+1 (555) 345-6789',
          location: 'Austin, TX',
          department: 'Engineering',
          joinDate: dayjs().subtract(3, 'years'),
          currentWorkload: 90,
          efficiency: 92,
          completedTasks: 187,
          activeTasks: 12,
          overdueTasks: 2,
          skills: [
            { name: 'React', level: 4, category: 'Frontend' },
            { name: 'Node.js', level: 5, category: 'Backend' },
            { name: 'Python', level: 4, category: 'Programming' },
            { name: 'MongoDB', level: 4, category: 'Database' },
            { name: 'GraphQL', level: 3, category: 'API' },
            { name: 'Docker', level: 4, category: 'DevOps' },
          ],
          recentPerformance: [
            { month: 'Jan', tasks: 16, efficiency: 91 },
            { month: 'Feb', tasks: 18, efficiency: 93 },
            { month: 'Mar', tasks: 20, efficiency: 92 },
            { month: 'Apr', tasks: 17, efficiency: 94 },
            { month: 'May', tasks: 19, efficiency: 92 },
          ],
          goals: [
            { id: 1, title: 'Master GraphQL federation', progress: 60, dueDate: dayjs().add(6, 'weeks') },
            { id: 2, title: 'Reduce workload to 80%', progress: 20, dueDate: dayjs().add(1, 'month') },
          ],
          strengths: ['Full-stack development', 'API design', 'Quick learning'],
          improvementAreas: ['Work-life balance', 'Delegation skills'],
          availableHours: 25,
          preferredWorkTypes: ['Full Stack Development', 'API Development', 'Technical Research'],
        },
        {
          id: 4,
          name: 'David Brown',
          avatar: 'DB',
          role: 'Junior Developer',
          email: 'david.brown@company.com',
          phone: '+1 (555) 456-7890',
          location: 'Chicago, IL',
          department: 'Engineering',
          joinDate: dayjs().subtract(8, 'months'),
          currentWorkload: 65,
          efficiency: 90,
          completedTasks: 45,
          activeTasks: 4,
          overdueTasks: 0,
          skills: [
            { name: 'JavaScript', level: 3, category: 'Programming' },
            { name: 'React', level: 3, category: 'Frontend' },
            { name: 'HTML/CSS', level: 4, category: 'Frontend' },
            { name: 'Git', level: 3, category: 'Tools' },
            { name: 'Testing', level: 2, category: 'Quality' },
            { name: 'Agile', level: 3, category: 'Process' },
          ],
          recentPerformance: [
            { month: 'Jan', tasks: 6, efficiency: 87 },
            { month: 'Feb', tasks: 8, efficiency: 89 },
            { month: 'Mar', tasks: 10, efficiency: 90 },
            { month: 'Apr', tasks: 8, efficiency: 92 },
            { month: 'May', tasks: 9, efficiency: 90 },
          ],
          goals: [
            { id: 1, title: 'Complete JavaScript advanced course', progress: 45, dueDate: dayjs().add(2, 'months') },
            { id: 2, title: 'Contribute to major feature', progress: 25, dueDate: dayjs().add(3, 'months') },
          ],
          strengths: ['Eagerness to learn', 'Attention to detail', 'Following best practices'],
          improvementAreas: ['Backend development', 'System design', 'Code review skills'],
          availableHours: 45,
          preferredWorkTypes: ['Frontend Development', 'Bug Fixes', 'Documentation'],
        },
      ];

      setTimeout(() => {
        setTeamMembers(mockTeamMembers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load team data:', error);
      showNotification('Failed to load team data', 'error');
      setLoading(false);
    }
  };

  const getWorkloadColor = (workload) => {
    if (workload > 85) return 'error';
    if (workload > 70) return 'warning';
    return 'success';
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 80) return 'info';
    return 'warning';
  };

  const getSkillLevelLabel = (level) => {
    const labels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level - 1] || 'Unknown';
  };

  const getSkillLevelColor = (level) => {
    if (level >= 4) return 'success';
    if (level >= 3) return 'info';
    if (level >= 2) return 'warning';
    return 'error';
  };

  const calculateTeamSkillGaps = () => {
    const requiredSkills = {
      'React': 4,
      'Node.js': 4,
      'TypeScript': 3,
      'Testing': 4,
      'System Design': 3,
      'DevOps': 3,
      'Cloud Technologies': 3,
      'Mobile Development': 2,
    };

    const skillGaps = [];
    
    Object.entries(requiredSkills).forEach(([skill, requiredLevel]) => {
      const teamSkillLevels = teamMembers.map(member => {
        const memberSkill = member.skills.find(s => s.name.toLowerCase().includes(skill.toLowerCase()));
        return memberSkill ? memberSkill.level : 0;
      });
      
      const averageLevel = teamSkillLevels.reduce((sum, level) => sum + level, 0) / teamMembers.length;
      const maxLevel = Math.max(...teamSkillLevels);
      
      if (averageLevel < requiredLevel) {
        skillGaps.push({
          skill,
          requiredLevel,
          averageLevel: Math.round(averageLevel * 10) / 10,
          maxLevel,
          gap: requiredLevel - averageLevel,
          membersWithSkill: teamSkillLevels.filter(level => level > 0).length,
        });
      }
    });
    
    return skillGaps.sort((a, b) => b.gap - a.gap);
  };

  const skillGaps = calculateTeamSkillGaps();

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
          Team Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<InsightIcon />}
            onClick={() => setSkillGapOpen(true)}
          >
            Skill Analysis
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setCapacityPlanOpen(true)}
          >
            Capacity Planning
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTeamData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Team Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {teamMembers.length}
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
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {Math.round(teamMembers.reduce((sum, member) => sum + member.currentWorkload, 0) / teamMembers.length)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Workload
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {Math.round(teamMembers.reduce((sum, member) => sum + member.efficiency, 0) / teamMembers.length)}%
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
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                {skillGaps.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Skill Gaps
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Members List */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TeamIcon color="primary" />
            Team Members
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="center">Workload</TableCell>
                  <TableCell align="center">Efficiency</TableCell>
                  <TableCell align="center">Active Tasks</TableCell>
                  <TableCell align="center">Availability</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {member.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {member.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.role}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={member.currentWorkload}
                          sx={{ width: 60, height: 6 }}
                          color={getWorkloadColor(member.currentWorkload)}
                        />
                        <Typography variant="body2">{member.currentWorkload}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${member.efficiency}%`}
                        size="small"
                        color={getEfficiencyColor(member.efficiency)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {member.activeTasks}
                        </Typography>
                        {member.overdueTasks > 0 && (
                          <Typography variant="caption" color="error">
                            {member.overdueTasks} overdue
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {member.availableHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        this week
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => {
                          setSelectedMember(member);
                          setDetailsOpen(true);
                        }}
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedMember && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {selectedMember.avatar}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedMember.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedMember.role}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedMember.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedMember.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedMember.location}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Joined {selectedMember.joinDate.format('MMM YYYY')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Performance Metrics */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Performance Metrics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {selectedMember.completedTasks}
                        </Typography>
                        <Typography variant="caption">Completed Tasks</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {selectedMember.efficiency}%
                        </Typography>
                        <Typography variant="caption">Efficiency</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {selectedMember.activeTasks}
                        </Typography>
                        <Typography variant="caption">Active Tasks</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {selectedMember.currentWorkload}%
                        </Typography>
                        <Typography variant="caption">Current Workload</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Skills */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Skills & Expertise</Typography>
                  <Grid container spacing={1}>
                    {selectedMember.skills.map((skill) => (
                      <Grid item key={skill.name}>
                        <Tooltip title={`${getSkillLevelLabel(skill.level)} (${skill.level}/5)`}>
                          <Chip
                            label={skill.name}
                            size="small"
                            color={getSkillLevelColor(skill.level)}
                            icon={<Rating value={skill.level} max={5} size="small" readOnly />}
                          />
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              {/* Goals & Development */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Current Goals</Typography>
                  {selectedMember.goals.map((goal) => (
                    <Box key={goal.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {goal.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {goal.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={goal.progress}
                        sx={{ height: 6, borderRadius: 3, mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Due: {goal.dueDate.format('MMM DD, YYYY')}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>

              {/* Strengths & Areas for Improvement */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Development Areas</Typography>
                  
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                    Strengths:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedMember.strengths.map((strength) => (
                      <Chip
                        key={strength}
                        label={strength}
                        size="small"
                        color="success"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                    Areas for Improvement:
                  </Typography>
                  <Box>
                    {selectedMember.improvementAreas.map((area) => (
                      <Chip
                        key={area}
                        label={area}
                        size="small"
                        color="warning"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Skill Gap Analysis Dialog */}
      <Dialog open={skillGapOpen} onClose={() => setSkillGapOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Team Skill Gap Analysis</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analysis of skills gaps based on required team competencies
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Skill</TableCell>
                  <TableCell align="center">Required Level</TableCell>
                  <TableCell align="center">Team Average</TableCell>
                  <TableCell align="center">Gap</TableCell>
                  <TableCell align="center">Coverage</TableCell>
                  <TableCell>Recommendation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {skillGaps.map((gap) => (
                  <TableRow key={gap.skill}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {gap.skill}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={gap.requiredLevel} max={5} size="small" readOnly />
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={gap.averageLevel} max={5} size="small" readOnly />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={gap.gap.toFixed(1)}
                        size="small"
                        color={gap.gap > 2 ? 'error' : gap.gap > 1 ? 'warning' : 'info'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {gap.membersWithSkill}/{teamMembers.length}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {gap.gap > 2 ? 'Urgent training needed' : 
                         gap.gap > 1 ? 'Training recommended' : 
                         'Minor improvement needed'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillGapOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Capacity Planning Dialog */}
      <Dialog open={capacityPlanOpen} onClose={() => setCapacityPlanOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Team Capacity Planning</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Weekly capacity overview and workload distribution
          </Typography>
          
          <Grid container spacing={3}>
            {teamMembers.map((member) => (
              <Grid item xs={12} md={6} key={member.id}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar>{member.avatar}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {member.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Availability: {member.availableHours}h this week
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(member.availableHours / 40) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={member.availableHours < 20 ? 'error' : member.availableHours < 35 ? 'warning' : 'success'}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Preferred Work Types:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {member.preferredWorkTypes.map((type) => (
                      <Chip key={type} label={type} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCapacityPlanOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamLeadOverview;
