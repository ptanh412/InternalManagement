import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  alpha,
  useTheme,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel,
  Rating,
} from "@mui/material";
import {
  Psychology as AIIcon,
  Lightbulb as InsightIcon,
  TrendingUp as OptimizeIcon,
  Assignment as TaskIcon,
  Group as TeamIcon,
  Star as RecommendIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Edit as ModifyIcon,
  Visibility as ViewIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Schedule as ScheduleIcon,
  Speed as EfficiencyIcon,
  Warning as AlertIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as AutoIcon,
  Timeline as TrendIcon,
  Assessment as AnalyticsIcon,
  School as TrainingIcon,
  Work as WorkloadIcon,
  PersonAdd as HiringIcon,
  Sync as SyncIcon,
  Science as ExperimentIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import AITaskGeneration from './AITaskGeneration';

const TeamLeadAIRecommendations = ({ showNotification }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    autoApprove: false,
    confidenceThreshold: 85,
    includeExperimental: false,
    notificationLevel: 'medium',
  });
  const [filters, setFilters] = useState({
    category: 'all',
    confidence: 0,
    impact: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recommendations, filters, activeTab]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Mock AI recommendations data
      const mockRecommendations = [
        {
          id: 1,
          category: 'workload',
          type: 'redistribution',
          title: 'Workload Rebalancing Opportunity',
          description: 'Carol White is approaching capacity (90% workload). Consider redistributing 2-3 tasks to Bob Smith or David Brown who have availability.',
          confidence: 92,
          impact: 'high',
          status: 'pending',
          priority: 'urgent',
          createdAt: dayjs().subtract(2, 'hours'),
          affectedMembers: ['Carol White', 'Bob Smith', 'David Brown'],
          suggestedActions: [
            'Move "API Rate Limiting" task to Bob Smith',
            'Delegate "Documentation Update" to David Brown',
            'Schedule workload review meeting',
          ],
          expectedOutcome: 'Reduce Carol\'s workload to 75%, improve team efficiency by 8%',
          reasoning: 'Carol has been consistently over 85% capacity for 3 weeks. Bob and David have availability and relevant skills.',
          dataPoints: [
            'Carol\'s workload: 90% (target: 80%)',
            'Bob\'s availability: 30h this week',
            'David\'s availability: 45h this week',
          ],
          aiModel: 'Workload Optimizer v2.1',
          tags: ['capacity', 'urgent', 'redistribution'],
        },
        {
          id: 2,
          category: 'skills',
          type: 'training',
          title: 'Team Skill Development Recommendation',
          description: 'Identified gap in TypeScript expertise. Recommend training for 3 team members to improve project delivery capabilities.',
          confidence: 88,
          impact: 'medium',
          status: 'pending',
          priority: 'medium',
          createdAt: dayjs().subtract(5, 'hours'),
          affectedMembers: ['David Brown', 'Bob Smith', 'Emma Davis'],
          suggestedActions: [
            'Enroll team in TypeScript fundamentals course',
            'Assign TypeScript-focused tasks to practice',
            'Set up peer mentoring with Alice Johnson',
          ],
          expectedOutcome: 'Improve team TypeScript proficiency by 40%, reduce project delivery time by 15%',
          reasoning: 'Upcoming projects heavily use TypeScript. Current team average skill level is 2.3/5.',
          dataPoints: [
            'TypeScript skill gap: 1.7 points',
            'Upcoming projects requiring TypeScript: 4',
            'Training completion time: 4-6 weeks',
          ],
          aiModel: 'Skill Gap Analyzer v1.8',
          tags: ['training', 'skills', 'development'],
        },
        {
          id: 3,
          category: 'performance',
          type: 'optimization',
          title: 'Process Improvement Opportunity',
          description: 'Code review process taking 25% longer than optimal. Suggest implementing automated checks and restructuring review workflow.',
          confidence: 85,
          impact: 'medium',
          status: 'pending',
          priority: 'low',
          createdAt: dayjs().subtract(1, 'day'),
          affectedMembers: ['All Team Members'],
          suggestedActions: [
            'Implement automated linting and testing',
            'Reduce code review time from 4h to 3h average',
            'Setup parallel review process for critical features',
          ],
          expectedOutcome: 'Save 5-8 hours per week, improve code quality consistency by 30%',
          reasoning: 'Analysis of 50+ recent reviews shows bottlenecks in manual checks that could be automated.',
          dataPoints: [
            'Average review time: 4.2h (target: 3h)',
            'Manual check time: 1.5h (can be automated)',
            'Review backlog: 12 items',
          ],
          aiModel: 'Process Optimizer v3.0',
          tags: ['process', 'efficiency', 'automation'],
        },
        {
          id: 4,
          category: 'tasks',
          type: 'assignment',
          title: 'Optimal Task Assignment Suggestion',
          description: 'New "Mobile Authentication" task best suited for Alice Johnson based on expertise match and current workload.',
          confidence: 94,
          impact: 'high',
          status: 'accepted',
          priority: 'high',
          createdAt: dayjs().subtract(3, 'hours'),
          affectedMembers: ['Alice Johnson'],
          suggestedActions: [
            'Assign task to Alice Johnson',
            'Allocate 16 hours over 2 sprints',
            'Schedule kick-off meeting with security team',
          ],
          expectedOutcome: 'Complete task 20% faster with 95% quality confidence',
          reasoning: 'Alice has 5/5 React Native skills, previous authentication experience, and optimal workload.',
          dataPoints: [
            'Skill match score: 94%',
            'Alice\'s current workload: 85%',
            'Task complexity: Medium-High',
          ],
          aiModel: 'Task Matcher v4.2',
          tags: ['assignment', 'mobile', 'authentication'],
        },
        {
          id: 5,
          category: 'hiring',
          type: 'recommendation',
          title: 'Team Expansion Recommendation',
          description: 'Based on project pipeline and current capacity, recommend hiring 1 senior backend developer within next quarter.',
          confidence: 78,
          impact: 'high',
          status: 'under_review',
          priority: 'medium',
          createdAt: dayjs().subtract(2, 'days'),
          affectedMembers: ['Team Leadership'],
          suggestedActions: [
            'Begin hiring process for Senior Backend Developer',
            'Focus on candidates with microservices experience',
            'Target start date: Q2 2024',
          ],
          expectedOutcome: 'Increase team capacity by 25%, reduce delivery bottlenecks',
          reasoning: 'Project pipeline shows 150% increase in backend work. Current team at 88% average capacity.',
          dataPoints: [
            'Backend workload projection: +45h/week',
            'Current backend capacity: 30h/week',
            'Pipeline projects: 8 backend-heavy',
          ],
          aiModel: 'Capacity Planner v2.5',
          tags: ['hiring', 'backend', 'capacity'],
        },
        {
          id: 6,
          category: 'innovation',
          type: 'experiment',
          title: 'Experimental: AI-Assisted Code Generation',
          description: 'Pilot program for AI code generation tools could improve developer productivity by 20-30% for routine tasks.',
          confidence: 65,
          impact: 'medium',
          status: 'experimental',
          priority: 'low',
          createdAt: dayjs().subtract(1, 'week'),
          affectedMembers: ['Alice Johnson', 'Carol White'],
          suggestedActions: [
            'Select 2 developers for 30-day pilot',
            'Focus on boilerplate and test generation',
            'Measure productivity impact weekly',
          ],
          expectedOutcome: 'Potential 20-30% productivity gain for routine development tasks',
          reasoning: 'Recent studies show significant productivity gains. Our codebase has 40% boilerplate that could benefit.',
          dataPoints: [
            'Boilerplate code percentage: 40%',
            'Pilot duration: 30 days',
            'Expected productivity gain: 20-30%',
          ],
          aiModel: 'Innovation Scout v1.2',
          tags: ['experimental', 'ai-tools', 'productivity'],
        },
      ];

      setTimeout(() => {
        setRecommendations(mockRecommendations);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      showNotification('Failed to load AI recommendations', 'error');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = recommendations;

    // Filter by tab category
    const tabCategories = {
      0: 'all',
      1: 'workload',
      2: 'skills',
      3: 'performance',
      4: 'tasks',
      5: 'hiring',
    };

    if (activeTab > 0 && tabCategories[activeTab] !== 'all') {
      filtered = filtered.filter(rec => rec.category === tabCategories[activeTab]);
    }

    // Apply additional filters
    if (filters.confidence > 0) {
      filtered = filtered.filter(rec => rec.confidence >= filters.confidence);
    }

    if (filters.impact !== 'all') {
      filtered = filtered.filter(rec => rec.impact === filters.impact);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(rec => rec.status === filters.status);
    }

    // Hide experimental if not enabled
    if (!aiSettings.includeExperimental) {
      filtered = filtered.filter(rec => rec.status !== 'experimental');
    }

    setFilteredRecommendations(filtered);
  };

  const handleAcceptRecommendation = async (id) => {
    try {
      setRecommendations(prev => prev.map(rec =>
        rec.id === id ? { ...rec, status: 'accepted' } : rec
      ));
      showNotification('Recommendation accepted', 'success');
    } catch (error) {
      showNotification('Failed to accept recommendation', 'error');
    }
  };

  const handleRejectRecommendation = async (id, reason) => {
    try {
      setRecommendations(prev => prev.map(rec =>
        rec.id === id ? { ...rec, status: 'rejected', rejectionReason: reason } : rec
      ));
      showNotification('Recommendation rejected', 'warning');
    } catch (error) {
      showNotification('Failed to reject recommendation', 'error');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'under_review':
        return 'info';
      case 'experimental':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'workload':
        return <WorkloadIcon />;
      case 'skills':
        return <TrainingIcon />;
      case 'performance':
        return <EfficiencyIcon />;
      case 'tasks':
        return <TaskIcon />;
      case 'hiring':
        return <HiringIcon />;
      case 'innovation':
        return <ExperimentIcon />;
      default:
        return <InsightIcon />;
    }
  };

  const tabLabels = [
    { label: 'All Recommendations', count: recommendations.length },
    { label: 'Workload', count: recommendations.filter(r => r.category === 'workload').length },
    { label: 'Skills', count: recommendations.filter(r => r.category === 'skills').length },
    { label: 'Performance', count: recommendations.filter(r => r.category === 'performance').length },
    { label: 'Tasks', count: recommendations.filter(r => r.category === 'tasks').length },
    { label: 'Hiring', count: recommendations.filter(r => r.category === 'hiring').length },
  ];

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
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="secondary" />
          AI Recommendations
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRecommendations}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* AI Insights Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={1} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {recommendations.filter(r => r.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={1} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {recommendations.filter(r => r.priority === 'urgent').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Urgent Actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={1} sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {Math.round(recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={1} sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {recommendations.filter(r => r.impact === 'high').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Impact
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Impact Level</InputLabel>
              <Select
                value={filters.impact}
                onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
              >
                <MenuItem value="all">All Impacts</MenuItem>
                <MenuItem value="high">High Impact</MenuItem>
                <MenuItem value="medium">Medium Impact</MenuItem>
                <MenuItem value="low">Low Impact</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Minimum Confidence: {filters.confidence}%
            </Typography>
            <Slider
              value={filters.confidence}
              onChange={(e, newValue) => setFilters({ ...filters, confidence: newValue })}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Recommendations List */}
      <Grid container spacing={3}>
        {filteredRecommendations.map((recommendation) => (
          <Grid item xs={12} key={recommendation.id}>
            <Card 
              elevation={2}
              sx={{
                border: recommendation.priority === 'urgent' ? 2 : 1,
                borderColor: recommendation.priority === 'urgent' ? 'error.main' : 'divider',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getCategoryIcon(recommendation.category)}
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {recommendation.title}
                      </Typography>
                      <Chip
                        label={recommendation.priority}
                        size="small"
                        color={getPriorityColor(recommendation.priority)}
                      />
                      <Chip
                        label={recommendation.impact}
                        size="small"
                        color={getImpactColor(recommendation.impact)}
                      />
                      <Chip
                        label={recommendation.status}
                        size="small"
                        color={getStatusColor(recommendation.status)}
                      />
                    </Box>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {recommendation.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Confidence:
                        </Typography>
                        <Rating
                          value={recommendation.confidence / 20}
                          max={5}
                          size="small"
                          readOnly
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {recommendation.confidence}%
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Model: {recommendation.aiModel}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {recommendation.createdAt.fromNow()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {recommendation.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </Box>

                {/* Expected Outcome */}
                <Accordion sx={{ mt: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendIcon color="success" />
                      Expected Outcome
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {recommendation.expectedOutcome}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Suggested Actions:
                    </Typography>
                    <List dense>
                      {recommendation.suggestedActions.map((action, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AcceptIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={action} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Data & Reasoning */}
                <Accordion sx={{ mt: 1, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AnalyticsIcon color="info" />
                      Data & Reasoning
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>AI Reasoning:</strong> {recommendation.reasoning}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Key Data Points:
                    </Typography>
                    <List dense>
                      {recommendation.dataPoints.map((point, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <InfoIcon fontSize="small" color="info" />
                          </ListItemIcon>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Action Buttons */}
                {recommendation.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<AcceptIcon />}
                      onClick={() => handleAcceptRecommendation(recommendation.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => handleRejectRecommendation(recommendation.id, 'Rejected by team lead')}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        setSelectedRecommendation(recommendation);
                        setDetailsOpen(true);
                      }}
                    >
                      Details
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recommendation Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRecommendation && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getCategoryIcon(selectedRecommendation.category)}
              {selectedRecommendation.title}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRecommendation && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedRecommendation.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body2">{selectedRecommendation.category}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Confidence</Typography>
                  <Typography variant="body2">{selectedRecommendation.confidence}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Impact</Typography>
                  <Chip label={selectedRecommendation.impact} size="small" color={getImpactColor(selectedRecommendation.impact)} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Chip label={selectedRecommendation.priority} size="small" color={getPriorityColor(selectedRecommendation.priority)} />
                </Grid>
              </Grid>

              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Affected Team Members
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {selectedRecommendation.affectedMembers.map((member) => (
                  <Chip key={member} label={member} variant="outlined" />
                ))}
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Expected Outcome
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {selectedRecommendation.expectedOutcome}
              </Typography>

              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                AI Model Information
              </Typography>
              <Typography variant="body2">
                Generated by: {selectedRecommendation.aiModel}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Recommendation Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={aiSettings.autoApprove}
                  onChange={(e) => setAiSettings({ ...aiSettings, autoApprove: e.target.checked })}
                />
              }
              label="Auto-approve high confidence recommendations (95%+)"
            />
            
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Confidence Threshold for Notifications: {aiSettings.confidenceThreshold}%
              </Typography>
              <Slider
                value={aiSettings.confidenceThreshold}
                onChange={(e, newValue) => setAiSettings({ ...aiSettings, confidenceThreshold: newValue })}
                min={50}
                max={100}
                step={5}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={aiSettings.includeExperimental}
                  onChange={(e) => setAiSettings({ ...aiSettings, includeExperimental: e.target.checked })}
                />
              }
              label="Include experimental recommendations"
            />

            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Notification Level</InputLabel>
              <Select
                value={aiSettings.notificationLevel}
                onChange={(e) => setAiSettings({ ...aiSettings, notificationLevel: e.target.value })}
              >
                <MenuItem value="high">High - Urgent only</MenuItem>
                <MenuItem value="medium">Medium - High & urgent</MenuItem>
                <MenuItem value="low">Low - All recommendations</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setSettingsOpen(false);
              showNotification('AI settings updated', 'success');
            }} 
            variant="contained"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamLeadAIRecommendations;
