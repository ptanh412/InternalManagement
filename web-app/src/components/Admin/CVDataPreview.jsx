import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as EducationIcon,
  Star as SkillIcon,
  Business as CompanyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Grade as GradeIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

const CVDataPreview = ({ 
  cvParsingResult, 
  open, 
  onClose, 
  onAcceptData, 
  onRejectData,
  aiService 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    professional: false,
    skills: false,
    experience: false,
    education: false
  });

  if (!cvParsingResult || !cvParsingResult.result) {
    return null;
  }

  const { result } = cvParsingResult;
  const { 
    personalInfo = {}, 
    professionalInfo = {}, 
    skills = [], 
    workExperience = [], 
    education = [] 
  } = result;

  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: isExpanded
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'info';
    if (confidence >= 0.4) return 'warning';
    return 'error';
  };

  const getSkillLevelColor = (level) => {
    if (level >= 0.8) return 'success';
    if (level >= 0.6) return 'primary';
    if (level >= 0.4) return 'warning';
    return 'error';
  };

  const processingStatus = aiService?.getCVParsingStatus(result.processingStatus) || {
    label: result.processingStatus,
    color: 'default',
    description: ''
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <AIIcon sx={{ mr: 1 }} />
            <Typography variant="h6">CV Parsing Results</Typography>
          </Box>
          <Chip 
            label={processingStatus.label}
            color={processingStatus.color}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Processing Summary */}
        <Alert 
          severity={result.processingStatus === 'SUCCESS' ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>{result.fileName}</strong> processed with{' '}
            {aiService?.formatCVConfidence(result.confidenceScore) || 'unknown confidence'}
            {result.processingTimeMs && ` in ${result.processingTimeMs}ms`}
          </Typography>
          {processingStatus.description && (
            <Typography variant="caption" display="block">
              {processingStatus.description}
            </Typography>
          )}
        </Alert>

        {/* Warnings and Errors */}
        {result.warnings && result.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium">Warnings:</Typography>
            {result.warnings.map((warning, index) => (
              <Typography key={index} variant="body2">• {warning}</Typography>
            ))}
          </Alert>
        )}

        {result.errors && result.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium">Errors:</Typography>
            {result.errors.map((error, index) => (
              <Typography key={index} variant="body2">• {error}</Typography>
            ))}
          </Alert>
        )}

        {/* Personal Information */}
        <Accordion 
          expanded={expandedSections.personal} 
          onChange={handleAccordionChange('personal')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Personal Information
              </Typography>
              <Chip 
                size="small" 
                label={`${Object.keys(personalInfo).length} fields`}
                color="primary"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Basic Info</Typography>
                    <List dense>
                      {personalInfo.firstName && (
                        <ListItem>
                          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="First Name" 
                            secondary={personalInfo.firstName} 
                          />
                        </ListItem>
                      )}
                      {personalInfo.lastName && (
                        <ListItem>
                          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Last Name" 
                            secondary={personalInfo.lastName} 
                          />
                        </ListItem>
                      )}
                      {personalInfo.email && (
                        <ListItem>
                          <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Email" 
                            secondary={personalInfo.email} 
                          />
                        </ListItem>
                      )}
                      {personalInfo.phoneNumber && (
                        <ListItem>
                          <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Phone" 
                            secondary={personalInfo.phoneNumber} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Location & Social</Typography>
                    <List dense>
                      {personalInfo.address && (
                        <ListItem>
                          <ListItemIcon><LocationIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Address" 
                            secondary={personalInfo.address} 
                          />
                        </ListItem>
                      )}
                      {personalInfo.city && (
                        <ListItem>
                          <ListItemIcon><LocationIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="City" 
                            secondary={personalInfo.city} 
                          />
                        </ListItem>
                      )}
                      {personalInfo.linkedinProfile && (
                        <ListItem>
                          <ListItemIcon><LinkedInIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="LinkedIn" 
                            secondary={personalInfo.linkedinProfile} 
                          />
                        </ListItem>
                      )}
                      {personalInfo.githubProfile && (
                        <ListItem>
                          <ListItemIcon><GitHubIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="GitHub" 
                            secondary={personalInfo.githubProfile} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Professional Information */}
        <Accordion 
          expanded={expandedSections.professional} 
          onChange={handleAccordionChange('professional')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <WorkIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Professional Information
              </Typography>
              {professionalInfo.totalYearsExperience && (
                <Chip 
                  size="small" 
                  label={`${professionalInfo.totalYearsExperience} years exp`}
                  color="secondary"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Current Role</Typography>
                <List dense>
                  {professionalInfo.currentPosition && (
                    <ListItem>
                      <ListItemText 
                        primary="Position" 
                        secondary={professionalInfo.currentPosition} 
                      />
                    </ListItem>
                  )}
                  {professionalInfo.currentCompany && (
                    <ListItem>
                      <ListItemText 
                        primary="Company" 
                        secondary={professionalInfo.currentCompany} 
                      />
                    </ListItem>
                  )}
                  {professionalInfo.department && (
                    <ListItem>
                      <ListItemText 
                        primary="Department" 
                        secondary={professionalInfo.department} 
                      />
                    </ListItem>
                  )}
                  {professionalInfo.seniorityLevel && (
                    <ListItem>
                      <ListItemText 
                        primary="Seniority Level" 
                        secondary={professionalInfo.seniorityLevel} 
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Additional Info</Typography>
                {professionalInfo.professionalSummary && (
                  <Typography variant="body2" paragraph>
                    <strong>Summary:</strong> {professionalInfo.professionalSummary}
                  </Typography>
                )}
                {professionalInfo.certifications && professionalInfo.certifications.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">Certifications:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {professionalInfo.certifications.map((cert, index) => (
                        <Chip key={index} label={cert} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                {professionalInfo.languages && professionalInfo.languages.length > 0 && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Languages:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {professionalInfo.languages.map((lang, index) => (
                        <Chip key={index} label={lang} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Skills */}
        <Accordion 
          expanded={expandedSections.skills} 
          onChange={handleAccordionChange('skills')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <SkillIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Skills & Competencies
              </Typography>
              <Chip 
                size="small" 
                label={`${skills.length} skills`}
                color="primary"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {skills.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Skill</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Proficiency</TableCell>
                      <TableCell>Experience</TableCell>
                      <TableCell>Primary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {skills.map((skill, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {skill.skillName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={skill.category || 'General'} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          {skill.proficiencyLevel && (
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                              <LinearProgress
                                variant="determinate"
                                value={skill.proficiencyLevel * 100}
                                color={getSkillLevelColor(skill.proficiencyLevel)}
                                sx={{ flexGrow: 1, mr: 1 }}
                              />
                              <Typography variant="caption">
                                {Math.round(skill.proficiencyLevel * 100)}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {skill.yearsOfExperience ? `${skill.yearsOfExperience} yrs` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {skill.isPrimary && <SuccessIcon color="success" fontSize="small" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No skills extracted from CV
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Work Experience */}
        <Accordion 
          expanded={expandedSections.experience} 
          onChange={handleAccordionChange('experience')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <CompanyIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Work Experience
              </Typography>
              <Chip 
                size="small" 
                label={`${workExperience.length} positions`}
                color="secondary"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {workExperience.length > 0 ? (
              <Box>
                {workExperience.map((exp, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Box>
                          <Typography variant="h6">{exp.position}</Typography>
                          <Typography variant="subtitle1" color="primary">
                            {exp.company}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {exp.startDate && dayjs(exp.startDate).format('MMM YYYY')} - {' '}
                          {exp.endDate ? dayjs(exp.endDate).format('MMM YYYY') : 'Present'}
                        </Typography>
                      </Box>
                      
                      {exp.description && (
                        <Typography variant="body2" paragraph>
                          {exp.description}
                        </Typography>
                      )}
                      
                      {exp.achievements && exp.achievements.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="medium">Key Achievements:</Typography>
                          <List dense>
                            {exp.achievements.map((achievement, achIndex) => (
                              <ListItem key={achIndex} sx={{ py: 0.5 }}>
                                <ListItemText 
                                  primary={`• ${achievement}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      
                      {exp.technologies && exp.technologies.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Technologies:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {exp.technologies.map((tech, techIndex) => (
                              <Chip 
                                key={techIndex} 
                                label={tech} 
                                size="small" 
                                variant="outlined" 
                                color="primary"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No work experience extracted from CV
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Education */}
        <Accordion 
          expanded={expandedSections.education} 
          onChange={handleAccordionChange('education')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <EducationIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Education
              </Typography>
              <Chip 
                size="small" 
                label={`${education.length} degrees`}
                color="info"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {education.length > 0 ? (
              <Box>
                {education.map((edu, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Box>
                          <Typography variant="h6">{edu.degree}</Typography>
                          <Typography variant="subtitle1" color="primary">
                            {edu.institution}
                          </Typography>
                          {edu.fieldOfStudy && (
                            <Typography variant="body2" color="text.secondary">
                              {edu.fieldOfStudy}
                            </Typography>
                          )}
                        </Box>
                        <Box textAlign="right">
                          {edu.graduationDate && (
                            <Typography variant="body2">
                              {dayjs(edu.graduationDate).format('YYYY')}
                            </Typography>
                          )}
                          {edu.grade && (
                            <Typography variant="body2" color="text.secondary">
                              Grade: {edu.grade}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      {edu.relevantCourses && edu.relevantCourses.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Relevant Courses:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {edu.relevantCourses.map((course, courseIndex) => (
                              <Chip 
                                key={courseIndex} 
                                label={course} 
                                size="small" 
                                variant="outlined" 
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No education information extracted from CV
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions>
        <Button onClick={onRejectData} color="error">
          Reject Data
        </Button>
        <Button onClick={onAcceptData} variant="contained" color="primary">
          Use This Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVDataPreview;