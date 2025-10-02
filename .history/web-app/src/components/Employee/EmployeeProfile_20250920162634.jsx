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
  Switch,
  FormControlLabel,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  LinearProgress,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as EducationIcon,
  Star as SkillIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Notifications as NotificationIcon,
  Language as LanguageIcon,
  Palette as ThemeIcon,
  Camera as CameraIcon,
  Badge as BadgeIcon,
  Timeline as ExperienceIcon,
  EmojiEvents as CertificationIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

const EmployeeProfile = ({ showNotification, employeeData, setEmployeeData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [tempProfileData, setTempProfileData] = useState(null);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 1, category: '' });
  const [newExperience, setNewExperience] = useState({ company: '', position: '', startDate: '', endDate: '', description: '' });
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '', date: '', url: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    loadProfileData();
  }, [employeeData]);

  const loadProfileData = async () => {
    try {
      // Mock comprehensive profile data
      const mockProfileData = {
        ...employeeData,
        phone: '+1 (555) 123-4567',
        alternateEmail: 'alice.personal@email.com',
        address: '123 Main St, New York, NY 10001',
        dateOfBirth: '1990-05-15',
        emergencyContact: {
          name: 'John Johnson',
          relationship: 'Spouse',
          phone: '+1 (555) 987-6543',
        },
        bio: 'Passionate frontend developer with 5+ years of experience in React, JavaScript, and modern web technologies. Love creating intuitive user experiences.',
        skills: [
          { id: 1, name: 'React', level: 5, category: 'Frontend', yearsExperience: 4 },
          { id: 2, name: 'JavaScript', level: 5, category: 'Programming', yearsExperience: 5 },
          { id: 3, name: 'TypeScript', level: 4, category: 'Programming', yearsExperience: 3 },
          { id: 4, name: 'Node.js', level: 3, category: 'Backend', yearsExperience: 2 },
          { id: 5, name: 'CSS/SASS', level: 4, category: 'Frontend', yearsExperience: 5 },
          { id: 6, name: 'Git', level: 4, category: 'Tools', yearsExperience: 4 },
          { id: 7, name: 'Agile/Scrum', level: 4, category: 'Process', yearsExperience: 3 },
        ],
        experience: [
          {
            id: 1,
            company: 'Current Company',
            position: 'Senior Frontend Developer',
            startDate: '2023-01-15',
            endDate: null,
            current: true,
            description: 'Leading frontend development for multiple projects, mentoring junior developers, and implementing best practices.',
          },
          {
            id: 2,
            company: 'Previous Tech Corp',
            position: 'Frontend Developer',
            startDate: '2021-03-01',
            endDate: '2022-12-31',
            current: false,
            description: 'Developed responsive web applications using React and modern JavaScript frameworks.',
          },
          {
            id: 3,
            company: 'Startup Inc',
            position: 'Junior Developer',
            startDate: '2019-06-01',
            endDate: '2021-02-28',
            current: false,
            description: 'Built features for web applications, learned modern development practices, and contributed to codebase improvements.',
          },
        ],
        education: [
          {
            id: 1,
            degree: 'Bachelor of Science in Computer Science',
            institution: 'University of Technology',
            year: '2019',
            gpa: '3.8',
          },
        ],
        certifications: [
          {
            id: 1,
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2023-06-15',
            url: 'https://aws.amazon.com/certification/',
            expiryDate: '2026-06-15',
          },
          {
            id: 2,
            name: 'React Developer Certification',
            issuer: 'React Training',
            date: '2022-11-20',
            url: 'https://reacttraining.com/',
            expiryDate: null,
          },
        ],
        languages: [
          { name: 'English', proficiency: 'Native' },
          { name: 'Spanish', proficiency: 'Intermediate' },
          { name: 'French', proficiency: 'Basic' },
        ],
        preferences: {
          theme: 'auto',
          notifications: {
            email: true,
            push: true,
            taskReminders: true,
            weeklyReports: false,
          },
          privacy: {
            profileVisible: true,
            skillsVisible: true,
            contactVisible: false,
          },
        },
        socialProfiles: {
          linkedin: 'https://linkedin.com/in/alicejohnson',
          github: 'https://github.com/alicejohnson',
          portfolio: 'https://alicejohnson.dev',
        },
      };

      setProfileData(mockProfileData);
      setTempProfileData(mockProfileData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      showNotification('Failed to load profile data', 'error');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to backend
      setProfileData(tempProfileData);
      setEmployeeData(tempProfileData);
      setEditMode(false);
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTempProfileData(profileData);
    setEditMode(false);
  };

  const handleAddSkill = async () => {
    try {
      if (newSkill.name.trim() && newSkill.category.trim()) {
        const skill = {
          id: Date.now(),
          ...newSkill,
          yearsExperience: 0,
        };

        setTempProfileData(prev => ({
          ...prev,
          skills: [...prev.skills, skill],
        }));

        setNewSkill({ name: '', level: 1, category: '' });
        setSkillDialogOpen(false);
        showNotification('Skill added successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to add skill', 'error');
    }
  };

  const handleDeleteSkill = (skillId) => {
    setTempProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId),
    }));
    showNotification('Skill removed', 'info');
  };

  const handleAddExperience = async () => {
    try {
      if (newExperience.company.trim() && newExperience.position.trim()) {
        const experience = {
          id: Date.now(),
          ...newExperience,
          current: !newExperience.endDate,
        };

        setTempProfileData(prev => ({
          ...prev,
          experience: [...prev.experience, experience],
        }));

        setNewExperience({ company: '', position: '', startDate: '', endDate: '', description: '' });
        setExperienceDialogOpen(false);
        showNotification('Experience added successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to add experience', 'error');
    }
  };

  const handleAddCertification = async () => {
    try {
      if (newCertification.name.trim() && newCertification.issuer.trim()) {
        const certification = {
          id: Date.now(),
          ...newCertification,
        };

        setTempProfileData(prev => ({
          ...prev,
          certifications: [...prev.certifications, certification],
        }));

        setNewCertification({ name: '', issuer: '', date: '', url: '' });
        setCertificationDialogOpen(false);
        showNotification('Certification added successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to add certification', 'error');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.new !== passwordData.confirm) {
        showNotification('New passwords do not match', 'error');
        return;
      }
      if (passwordData.new.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
      }

      // In a real app, this would validate current password and update
      setPasswordData({ current: '', new: '', confirm: '' });
      setPasswordDialogOpen(false);
      showNotification('Password changed successfully', 'success');
    } catch (error) {
      showNotification('Failed to change password', 'error');
    }
  };

  const getSkillLevelLabel = (level) => {
    const labels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level - 1] || 'Unknown';
  };

  const getSkillColor = (level) => {
    if (level >= 4) return 'success';
    if (level >= 3) return 'info';
    if (level >= 2) return 'warning';
    return 'error';
  };

  if (!profileData) {
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
          My Profile
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editMode ? (
            <>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Personal Info" />
          <Tab label="Skills" />
          <Tab label="Experience" />
          <Tab label="Certifications" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Profile Photo & Basic Info */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    margin: '0 auto 16px',
                    fontSize: '2rem',
                  }}
                >
                  {profileData.avatar}
                </Avatar>
                {editMode && (
                  <Button
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    sx={{ mb: 2 }}
                  >
                    Change Photo
                  </Button>
                )}
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {profileData.name}
                </Typography>
                <Typography variant="body1" color="primary" sx={{ mb: 1 }}>
                  {profileData.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profileData.department}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Personal Details */}
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={tempProfileData.bio}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={tempProfileData.name}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={tempProfileData.email}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={tempProfileData.phone}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Alternative Email"
                      type="email"
                      value={tempProfileData.alternateEmail}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, alternateEmail: e.target.value }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={tempProfileData.address}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={tempProfileData.dateOfBirth}
                      onChange={(e) => setTempProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      disabled={!editMode}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                {/* Emergency Contact */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Emergency Contact</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={tempProfileData.emergencyContact.name}
                      onChange={(e) => setTempProfileData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                      }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      value={tempProfileData.emergencyContact.relationship}
                      onChange={(e) => setTempProfileData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                      }))}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={tempProfileData.emergencyContact.phone}
                      onChange={(e) => setTempProfileData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                      }))}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Skills Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">My Skills</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSkillDialogOpen(true)}
            >
              Add Skill
            </Button>
          </Box>

          <Grid container spacing={2}>
            {tempProfileData.skills.map((skill) => (
              <Grid item xs={12} sm={6} md={4} key={skill.id}>
                <Card elevation={1}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {skill.name}
                      </Typography>
                      {editMode && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSkill(skill.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    
                    <Chip
                      label={skill.category}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Proficiency: {getSkillLevelLabel(skill.level)}
                      </Typography>
                      <Rating value={skill.level} max={5} size="small" readOnly />
                    </Box>
                    
                    {skill.yearsExperience > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {skill.yearsExperience} years experience
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Experience Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Work Experience</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setExperienceDialogOpen(true)}
            >
              Add Experience
            </Button>
          </Box>

          {tempProfileData.experience.map((exp) => (
            <Card key={exp.id} elevation={2} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {exp.position}
                    </Typography>
                    <Typography variant="body1" color="primary">
                      {exp.company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(exp.startDate).format('MMM YYYY')} - {exp.current ? 'Present' : dayjs(exp.endDate).format('MMM YYYY')}
                    </Typography>
                  </Box>
                  {exp.current && (
                    <Chip label="Current" color="primary" size="small" />
                  )}
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {exp.description}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {/* Education */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Education</Typography>
          {tempProfileData.education.map((edu) => (
            <Card key={edu.id} elevation={1} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {edu.degree}
                </Typography>
                <Typography variant="body1" color="primary">
                  {edu.institution}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {edu.year} • GPA: {edu.gpa}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Certifications Tab */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Certifications</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCertificationDialogOpen(true)}
            >
              Add Certification
            </Button>
          </Box>

          <Grid container spacing={3}>
            {tempProfileData.certifications.map((cert) => (
              <Grid item xs={12} md={6} key={cert.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <CertificationIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {cert.name}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {cert.issuer}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Issued: {dayjs(cert.date).format('MMM YYYY')}
                        </Typography>
                        {cert.expiryDate && (
                          <Typography variant="body2" color="text.secondary">
                            Expires: {dayjs(cert.expiryDate).format('MMM YYYY')}
                          </Typography>
                        )}
                        {cert.url && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            onClick={() => window.open(cert.url, '_blank')}
                          >
                            View Certificate
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Settings Tab */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  Security
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Change Password"
                      secondary="Update your account password"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationIcon color="primary" />
                  Notifications
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText primary="Email Notifications" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={tempProfileData.preferences.notifications.email}
                        onChange={(e) => setTempProfileData(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              email: e.target.checked
                            }
                          }
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText primary="Push Notifications" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={tempProfileData.preferences.notifications.push}
                        onChange={(e) => setTempProfileData(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              push: e.target.checked
                            }
                          }
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText primary="Task Reminders" />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={tempProfileData.preferences.notifications.taskReminders}
                        onChange={(e) => setTempProfileData(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              taskReminders: e.target.checked
                            }
                          }
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Privacy Settings */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Privacy Settings</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tempProfileData.preferences.privacy.profileVisible}
                          onChange={(e) => setTempProfileData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              privacy: {
                                ...prev.preferences.privacy,
                                profileVisible: e.target.checked
                              }
                            }
                          }))}
                        />
                      }
                      label="Profile visible to team"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tempProfileData.preferences.privacy.skillsVisible}
                          onChange={(e) => setTempProfileData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              privacy: {
                                ...prev.preferences.privacy,
                                skillsVisible: e.target.checked
                              }
                            }
                          }))}
                        />
                      }
                      label="Skills visible to managers"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tempProfileData.preferences.privacy.contactVisible}
                          onChange={(e) => setTempProfileData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              privacy: {
                                ...prev.preferences.privacy,
                                contactVisible: e.target.checked
                              }
                            }
                          }))}
                        />
                      }
                      label="Contact info visible"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={skillDialogOpen} onClose={() => setSkillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Skill</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Skill Name"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Category"
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ mb: 1 }}>
              Proficiency Level: {getSkillLevelLabel(newSkill.level)}
            </Typography>
            <Rating
              value={newSkill.level}
              onChange={(e, value) => setNewSkill({ ...newSkill, level: value })}
              max={5}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSkill} variant="contained">Add Skill</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">Change Password</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeProfile;
