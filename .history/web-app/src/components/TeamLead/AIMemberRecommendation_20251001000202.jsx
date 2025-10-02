import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  Paper,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Person as PersonIcon,
  Star as StarIcon,
  TrendingUp as PerformanceIcon,
  Schedule as AvailabilityIcon,
  Group as CollaborationIcon,
  Assignment as SkillIcon,
  WorkOutline as WorkloadIcon,
  Speed as EfficiencyIcon,
  CheckCircle as SelectIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  ThumbUp as RecommendIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import aiService from '../../services/aiService';

const AIMemberRecommendation = ({ 
  open, 
  onClose, 
  taskId, 
  taskTitle, 
  onMemberSelect, 
  showNotification,
  emergencyMode = false,
  teamId = null 
}) => {
  const theme = useTheme();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [error, setError] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [recommendationSummary, setSummaryData] = useState(null);

  useEffect(() => {
    if (open && taskId) {
      loadRecommendations();
    }
  }, [open, taskId, emergencyMode, teamId]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (emergencyMode) {
        response = await aiService.generateEmergencyRecommendations(taskId);
      } else if (teamId) {
        response = await aiService.generateTeamRecommendations(taskId, teamId);
      } else {
        response = await aiService.generateTaskRecommendations(taskId);
      }
      
      const processedRecommendations = aiService.processRecommendations(response.result || []);
      setRecommendations(processedRecommendations);
      
      const summary = aiService.createRecommendationSummary(processedRecommendations);
      setSummaryData(summary);
      
      if (processedRecommendations.length === 0) {
        showNotification('No suitable candidates found for this task', 'warning');
      } else {
        showNotification(`Found ${processedRecommendations.length} recommended candidates`, 'success');
      }
      
    } catch (error) {
      console.error('Error loading member recommendations:', error);
      setError('Failed to load member recommendations. Please try again.');
      showNotification('Failed to load recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (recommendation) => {
    setSelectedMember(recommendation);
  };

  const handleAssignTask = () => {
    if (selectedMember && onMemberSelect) {
      onMemberSelect(selectedMember.userId, selectedMember);
      onClose();
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : null);
  };

  const renderRecommendationSummary = () => {
    if (!recommendationSummary) return null;

    return (
      <Card variant="outlined" sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon color="primary" />
            Recommendation Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {recommendationSummary.totalRecommendations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Candidates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {recommendationSummary.excellentMatches}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Excellent Matches
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {recommendationSummary.goodMatches}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Good Matches
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary">
                  {aiService.formatRecommendationScore(recommendationSummary.averageConfidence)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg. Confidence
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderMetricBar = (label, value, icon, color = 'primary') => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight="bold">
          {aiService.formatRecommendationScore(value)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value * 100}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette[color].main, 0.1),
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette[color].main,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );

  const renderRecommendationCard = (recommendation, index) => {
    const metrics = aiService.getRecommendationMetrics(recommendation);
    const isSelected = selectedMember?.userId === recommendation.userId;
    const confidenceLevel = aiService.getRecommendationConfidenceLevel(recommendation.overallScore);
    const confidenceColor = aiService.getConfidenceColor(recommendation.overallScore);
    const explanation = aiService.getRecommendationExplanation(recommendation);

    return (
      <Card
        key={recommendation.userId}
        variant="outlined"
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
        }}
        onClick={() => handleMemberSelect(recommendation)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent={recommendation.rank}
                color="primary"
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
              >
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="h6">
                  Member {recommendation.userId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rank #{recommendation.rank}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={confidenceLevel}
                color={confidenceColor}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="h6" color="primary">
                {aiService.formatRecommendationScore(recommendation.overallScore)}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {explanation}
          </Typography>

          <Accordion
            expanded={expandedAccordion === `panel-${index}`}
            onChange={handleAccordionChange(`panel-${index}`)}
            elevation={0}
            sx={{ bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Detailed Metrics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {renderMetricBar(
                    'Skill Match',
                    metrics.skillMatch,
                    <SkillIcon fontSize="small" color="primary" />,
                    'primary'
                  )}
                  {renderMetricBar(
                    'Performance',
                    metrics.performance,
                    <PerformanceIcon fontSize="small" color="success" />,
                    'success'
                  )}
                  {renderMetricBar(
                    'Availability',
                    metrics.availability,
                    <AvailabilityIcon fontSize="small" color="info" />,
                    'info'
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {renderMetricBar(
                    'Workload Balance',
                    1 - metrics.workload, // Invert workload (lower is better)
                    <WorkloadIcon fontSize="small" color="warning" />,
                    'warning'
                  )}
                  {renderMetricBar(
                    'Collaboration',
                    metrics.collaboration,
                    <CollaborationIcon fontSize="small" color="secondary" />,
                    'secondary'
                  )}
                  {renderMetricBar(
                    'AI Confidence',
                    metrics.hybrid,
                    <AIIcon fontSize="small" color="primary" />,
                    'primary'
                  )}
                </Grid>
              </Grid>

              {recommendation.recommendationReason && (
                <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                  <Typography variant="body2" color="info.main">
                    <InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {recommendation.recommendationReason}
                  </Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  const getDialogTitle = () => {
    let title = 'AI Member Recommendation';
    if (emergencyMode) title = 'Emergency Task Assignment';
    else if (teamId) title = 'Team-Based Recommendation';
    return title;
  };

  const getDialogSubtitle = () => {
    if (!taskTitle) return 'Select the best candidate for this task';
    return `Select the best candidate for: ${taskTitle}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Box>
              <Typography variant="h6">{getDialogTitle()}</Typography>
              <Typography variant="body2" color="text.secondary">
                {getDialogSubtitle()}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {emergencyMode && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <WarningIcon sx={{ mr: 1 }} />
            Emergency mode: Showing candidates with relaxed criteria for urgent assignment.
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              AI is analyzing candidates and generating recommendations...
            </Typography>
          </Box>
        ) : (
          <>
            {renderRecommendationSummary()}
            
            {recommendations.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No suitable candidates found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  The AI couldn't find team members that match this task's requirements.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadRecommendations}
                >
                  Try Again
                </Button>
              </Paper>
            ) : (
              <Box>
                {recommendations.map((recommendation, index) => 
                  renderRecommendationCard(recommendation, index)
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={loadRecommendations}
          disabled={loading}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          onClick={handleAssignTask}
          disabled={!selectedMember || loading}
          startIcon={<SelectIcon />}
        >
          Assign to {selectedMember ? `Member ${selectedMember.userId}` : 'Selected Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIMemberRecommendation;