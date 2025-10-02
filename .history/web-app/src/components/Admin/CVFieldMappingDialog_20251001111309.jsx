import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  SwapHoriz as MapIcon,
  AutoAwesome as AIIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as EducationIcon,
} from '@mui/icons-material';

const CVFieldMappingDialog = ({
  open,
  onClose,
  cvData,
  formData,
  onMappingComplete,
  departments = [],
  positions = [],
  roles = [],
  aiService
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [mappedData, setMappedData] = useState({});
  const [fieldOverrides, setFieldOverrides] = useState({});
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (cvData && open) {
      initializeMappedData();
    }
  }, [cvData, open]);

  const initializeMappedData = () => {
    if (!cvData.result) return;

    const { personalInfo, professionalInfo, skills, workExperience, education } = cvData.result;
    const initial = {
      // User fields
      firstName: personalInfo?.firstName || '',
      lastName: personalInfo?.lastName || '',
      email: personalInfo?.email || '',
      phoneNumber: personalInfo?.phoneNumber || '',
      // Profile fields  
      address: personalInfo?.address || '',
      city: personalInfo?.city || '',
      currentPosition: professionalInfo?.currentPosition || '',
      currentCompany: professionalInfo?.currentCompany || '',
      department: professionalInfo?.department || '',
      seniorityLevel: professionalInfo?.seniorityLevel || '',
      linkedinProfile: personalInfo?.linkedinProfile || '',
      githubProfile: personalInfo?.githubProfile || '',
      professionalSummary: professionalInfo?.professionalSummary || '',
      totalYearsExperience: professionalInfo?.totalYearsExperience || 0,
      // Suggested mappings
      suggestedDepartment: '',
      suggestedPosition: '',
      suggestedRoles: [],
      // Skills and experience
      extractedSkills: skills || [],
      workHistory: workExperience || [],
      educationHistory: education || []
    };

    setMappedData(initial);
    validateFields(initial);
  };

  const validateFields = (data) => {
    const errors = {};
    
    // Required field validation
    if (!data.firstName?.trim()) errors.firstName = 'First name is required';
    if (!data.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!data.email?.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Invalid email format';
    
    // Phone validation
    if (data.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...mappedData, [field]: value };
    setMappedData(updated);
    setFieldOverrides({ ...fieldOverrides, [field]: true });
    validateFields(updated);
  };

  const handleAutoSuggest = async (field) => {
    if (!aiService) return;

    try {
      let suggestion = '';
      switch (field) {
        case 'department':
          suggestion = await aiService.suggestDepartment(mappedData.currentPosition, mappedData.extractedSkills);
          break;
        case 'position':
          suggestion = await aiService.suggestPosition(mappedData.extractedSkills, mappedData.workHistory);
          break;
        case 'roles':
          const roles = await aiService.suggestRoles(mappedData.currentPosition, mappedData.department);
          setMappedData(prev => ({ ...prev, suggestedRoles: roles }));
          return;
        default:
          return;
      }
      
      if (suggestion) {
        handleFieldChange(`suggested${field.charAt(0).toUpperCase() + field.slice(1)}`, suggestion);
      }
    } catch (error) {
      console.error('Auto-suggest failed:', error);
    }
  };

  const handleSkillEdit = (skillIndex, field, value) => {
    const updatedSkills = [...mappedData.extractedSkills];
    updatedSkills[skillIndex] = { ...updatedSkills[skillIndex], [field]: value };
    setMappedData(prev => ({ ...prev, extractedSkills: updatedSkills }));
  };

  const handleAddSkill = () => {
    const newSkill = {
      skillName: '',
      category: 'Technical',
      proficiencyLevel: 0.5,
      yearsOfExperience: 1,
      isPrimary: false
    };
    setMappedData(prev => ({
      ...prev,
      extractedSkills: [...prev.extractedSkills, newSkill]
    }));
  };

  const handleRemoveSkill = (skillIndex) => {
    setMappedData(prev => ({
      ...prev,
      extractedSkills: prev.extractedSkills.filter((_, index) => index !== skillIndex)
    }));
  };

  const handleApplyMapping = () => {
    if (!validateFields(mappedData)) {
      return;
    }

    const finalData = {
      userData: {
        firstName: mappedData.firstName,
        lastName: mappedData.lastName,
        email: mappedData.email,
        phoneNumber: mappedData.phoneNumber
      },
      profileData: {
        address: mappedData.address,
        city: mappedData.city,
        currentPosition: mappedData.currentPosition,
        currentCompany: mappedData.currentCompany,
        department: mappedData.suggestedDepartment || mappedData.department,
        seniorityLevel: mappedData.seniorityLevel,
        linkedinProfile: mappedData.linkedinProfile,
        githubProfile: mappedData.githubProfile,
        professionalSummary: mappedData.professionalSummary,
        totalYearsExperience: mappedData.totalYearsExperience,
        skills: mappedData.extractedSkills,
        workExperience: mappedData.workHistory,
        education: mappedData.educationHistory
      },
      suggestions: {
        department: mappedData.suggestedDepartment,
        position: mappedData.suggestedPosition,
        roles: mappedData.suggestedRoles
      },
      overrides: fieldOverrides
    };

    onMappingComplete(finalData);
  };

  const TabPanel = ({ children, value, index }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <MapIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Map CV Data to User Profile</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoFillEnabled}
                onChange={(e) => setAutoFillEnabled(e.target.checked)}
              />
            }
            label="Auto-fill enabled"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">Please fix the following errors:</Typography>
            {Object.entries(validationErrors).map(([field, error]) => (
              <Typography key={field} variant="body2">• {error}</Typography>
            ))}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label="Personal Info" />
          <Tab icon={<WorkIcon />} label="Professional" />
          <Tab icon={<EducationIcon />} label="Skills & Education" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={mappedData.firstName || ''}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        error={!!validationErrors.firstName}
                        helperText={validationErrors.firstName}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={mappedData.lastName || ''}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        error={!!validationErrors.lastName}
                        helperText={validationErrors.lastName}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={mappedData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        error={!!validationErrors.email}
                        helperText={validationErrors.email}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={mappedData.phoneNumber || ''}
                        onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                        error={!!validationErrors.phoneNumber}
                        helperText={validationErrors.phoneNumber}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Location & Social</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={2}
                        value={mappedData.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="City"
                        value={mappedData.city || ''}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="LinkedIn Profile"
                        value={mappedData.linkedinProfile || ''}
                        onChange={(e) => handleFieldChange('linkedinProfile', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="GitHub Profile"
                        value={mappedData.githubProfile || ''}
                        onChange={(e) => handleFieldChange('githubProfile', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Current Role</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Position"
                        value={mappedData.currentPosition || ''}
                        onChange={(e) => handleFieldChange('currentPosition', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Company"
                        value={mappedData.currentCompany || ''}
                        onChange={(e) => handleFieldChange('currentCompany', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Autocomplete
                          fullWidth
                          options={departments}
                          value={mappedData.suggestedDepartment || mappedData.department || ''}
                          onChange={(e, value) => handleFieldChange('suggestedDepartment', value || '')}
                          onInputChange={(e, value) => handleFieldChange('suggestedDepartment', value)}
                          renderInput={(params) => (
                            <TextField {...params} label="Department" />
                          )}
                        />
                        <Tooltip title="AI Suggest Department">
                          <IconButton 
                            onClick={() => handleAutoSuggest('department')}
                            color="primary"
                          >
                            <AIIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Seniority Level"
                        value={mappedData.seniorityLevel || ''}
                        onChange={(e) => handleFieldChange('seniorityLevel', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Years of Experience"
                        type="number"
                        value={mappedData.totalYearsExperience || 0}
                        onChange={(e) => handleFieldChange('totalYearsExperience', parseInt(e.target.value) || 0)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Professional Summary</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Professional Summary"
                    value={mappedData.professionalSummary || ''}
                    onChange={(e) => handleFieldChange('professionalSummary', e.target.value)}
                  />
                  
                  {mappedData.suggestedRoles && mappedData.suggestedRoles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI Suggested Roles:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {mappedData.suggestedRoles.map((role, index) => (
                          <Chip key={index} label={role} size="small" color="primary" />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      startIcon={<AIIcon />}
                      onClick={() => handleAutoSuggest('roles')}
                      size="small"
                    >
                      Suggest Roles
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Extracted Skills</Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddSkill}
                      size="small"
                    >
                      Add Skill
                    </Button>
                  </Box>
                  
                  {mappedData.extractedSkills && mappedData.extractedSkills.length > 0 ? (
                    <List>
                      {mappedData.extractedSkills.map((skill, index) => (
                        <ListItem key={index} divider>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3}>
                              <TextField
                                fullWidth
                                size="small"
                                value={skill.skillName || ''}
                                onChange={(e) => handleSkillEdit(index, 'skillName', e.target.value)}
                                placeholder="Skill name"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={skill.category || 'Technical'}
                                  onChange={(e) => handleSkillEdit(index, 'category', e.target.value)}
                                >
                                  <MenuItem value="Technical">Technical</MenuItem>
                                  <MenuItem value="Soft">Soft</MenuItem>
                                  <MenuItem value="Language">Language</MenuItem>
                                  <MenuItem value="Tool">Tool</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ min: 0, max: 1, step: 0.1 }}
                                value={skill.proficiencyLevel || 0.5}
                                onChange={(e) => handleSkillEdit(index, 'proficiencyLevel', parseFloat(e.target.value))}
                                label="Proficiency"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={skill.yearsOfExperience || 1}
                                onChange={(e) => handleSkillEdit(index, 'yearsOfExperience', parseInt(e.target.value))}
                                label="Years"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={skill.isPrimary || false}
                                    onChange={(e) => handleSkillEdit(index, 'isPrimary', e.target.checked)}
                                  />
                                }
                                label="Primary"
                              />
                            </Grid>
                            <Grid item xs={1}>
                              <IconButton
                                onClick={() => handleRemoveSkill(index)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No skills to display. Add skills manually.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleApplyMapping} 
          variant="contained" 
          disabled={Object.keys(validationErrors).length > 0}
        >
          Apply Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVFieldMappingDialog;