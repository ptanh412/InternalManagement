import React, { useState, useRef } from 'react';
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
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  CircularProgress,
  Container,
  Badge,
  Tabs,
  Tab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  SmartToy as AIIcon,
  Assignment as TaskIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as GenerateIcon,
  Star as StarIcon,
  Schedule as TimeIcon,
  Flag as PriorityIcon,
  Category as TypeIcon,
  Psychology as SkillIcon,
  BugReport as ConflictIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import aiService from '../../services/aiService';
import taskService from '../../services/taskService';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const AITaskGeneration = ({ showNotification, onTasksGenerated }) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  
  // State management
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    description: '',
    requirementText: '',
    generateTasks: true,
    analyzeRequirements: true,
    detectConflicts: true,
    identifySkills: true,
    additionalContext: '',
    priority: 'MEDIUM'
  });

  const handleOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setAnalysisResult(null);
    setGeneratedTasks([]);
    setSelectedTasks(new Set());
    setError(null);
    setFormData({
      projectId: '',
      projectName: '',
      description: '',
      requirementText: '',
      generateTasks: true,
      analyzeRequirements: true,
      detectConflicts: true,
      identifySkills: true,
      additionalContext: '',
      priority: 'MEDIUM'
    });
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validationErrors = aiService.validateFiles(files);
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    setSelectedFiles(files);
    setError(null);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeFromFiles = async () => {
    if (!formData.projectId.trim()) {
      setError('Project ID is required');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setAnalyzing(true);
    setError(null);
    
    try {
      const uploadFormData = aiService.createRequirementUploadFormData({
        files: selectedFiles,
        ...formData
      });
      
      const response = await aiService.importRequirementsFromFile(uploadFormData);
      
      if (response.result) {
        setAnalysisResult(response.result);
        setGeneratedTasks(response.result.recommendedTasks || []);
        // Pre-select all tasks
        setSelectedTasks(new Set(response.result.recommendedTasks?.map((_, index) => index) || []));
        showNotification('Requirements analyzed successfully!', 'success');
      } else {
        throw new Error('No analysis result received');
      }
    } catch (error) {
      console.error('Error analyzing requirements:', error);
      setError('Failed to analyze requirements. Please try again.');
      showNotification('Failed to analyze requirements', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeFromText = async () => {
    if (!formData.projectId.trim()) {
      setError('Project ID is required');
      return;
    }
    
    if (!formData.requirementText.trim()) {
      setError('Requirement text is required');
      return;
    }

    setAnalyzing(true);
    setError(null);
    
    try {
      const requestData = aiService.createTextRequirementRequest(formData);
      const response = await aiService.importRequirementsFromText(requestData);
      
      if (response.result) {
        setAnalysisResult(response.result);
        setGeneratedTasks(response.result.recommendedTasks || []);
        // Pre-select all tasks
        setSelectedTasks(new Set(response.result.recommendedTasks?.map((_, index) => index) || []));
        showNotification('Requirements analyzed successfully!', 'success');
      } else {
        throw new Error('No analysis result received');
      }
    } catch (error) {
      console.error('Error analyzing requirements:', error);
      setError('Failed to analyze requirements. Please try again.');
      showNotification('Failed to analyze requirements', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTaskSelection = (taskIndex) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskIndex)) {
        newSet.delete(taskIndex);
      } else {
        newSet.add(taskIndex);
      }
      return newSet;
    });
  };

  const handleSelectAllTasks = () => {
    if (selectedTasks.size === generatedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(generatedTasks.map((_, index) => index)));
    }
  };

  const handleCreateTasks = async () => {
    if (selectedTasks.size === 0) {
      setError('Please select at least one task to create');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const tasksToCreate = Array.from(selectedTasks).map(index => generatedTasks[index]);
      const transformedTasks = aiService.transformGeneratedTasksToTaskService(
        tasksToCreate,
        formData.projectId,
        'AI_SYSTEM'
      );
      
      // Create tasks one by one
      const createdTasks = [];
      for (const taskData of transformedTasks) {
        try {
          const response = await taskService.createTask(taskData);
          if (response.result) {
            createdTasks.push(response.result);
          }
        } catch (error) {
          console.error('Error creating task:', taskData.title, error);
        }
      }
      
      if (createdTasks.length > 0) {
        showNotification(`Successfully created ${createdTasks.length} tasks!`, 'success');
        if (onTasksGenerated) {
          onTasksGenerated(createdTasks);
        }
        handleClose();
      } else {
        throw new Error('No tasks were created successfully');
      }
    } catch (error) {
      console.error('Error creating tasks:', error);
      setError('Failed to create tasks. Please try again.');
      showNotification('Failed to create tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderFileUploadTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project ID"
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            required
            helperText="Enter the project ID where tasks will be created"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Name"
            value={formData.projectName}
            onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
            helperText="Optional project name for reference"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            helperText="Brief description of the project or requirements"
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              sx={{ mb: 2 }}
            >
              Select Requirement Files
              <VisuallyHiddenInput
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".txt,.doc,.docx,.pdf,.md,.rtf,.odt,.pages,.tex,.wpd,.csv,.json,.xml"
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Supported formats: {aiService.getSupportedFileTypes().join(', ')}
            </Typography>
          </Box>
          
          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({selectedFiles.length}):
              </Typography>
              {selectedFiles.map((file, index) => (
                <Chip
                  key={index}
                  label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                  onDelete={() => removeFile(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Additional Context"
            value={formData.additionalContext}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
            helperText="Any additional context or specific instructions for AI analysis"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={analyzing ? <CircularProgress size={20} /> : <GenerateIcon />}
          onClick={handleAnalyzeFromFiles}
          disabled={analyzing || selectedFiles.length === 0 || !formData.projectId}
        >
          {analyzing ? 'Analyzing...' : 'Analyze & Generate Tasks'}
        </Button>
      </Box>
    </Box>
  );

  const renderTextInputTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project ID"
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            required
            helperText="Enter the project ID where tasks will be created"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Name"
            value={formData.projectName}
            onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
            helperText="Optional project name for reference"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Requirement Text"
            value={formData.requirementText}
            onChange={(e) => setFormData(prev => ({ ...prev, requirementText: e.target.value }))}
            required
            helperText="Paste or type your project requirements here"
            placeholder="Example: Create a user authentication system with login, registration, password reset functionality. Should support email verification and social login options..."
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Additional Context"
            value={formData.additionalContext}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
            helperText="Any additional context or specific instructions for AI analysis"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={analyzing ? <CircularProgress size={20} /> : <GenerateIcon />}
          onClick={handleAnalyzeFromText}
          disabled={analyzing || !formData.requirementText.trim() || !formData.projectId}
        >
          {analyzing ? 'Analyzing...' : 'Analyze & Generate Tasks'}
        </Button>
      </Box>
    </Box>
  );

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    const summary = aiService.getAnalysisSummary({ result: analysisResult });
    const taskStats = aiService.getTaskStats(generatedTasks);

    return (
      <Box sx={{ mt: 3 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Analysis Summary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <FileIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{summary.stats.filesProcessed}</Typography>
                    <Typography variant="body2" color="text.secondary">Files Processed</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TaskIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{summary.stats.tasksGenerated}</Typography>
                    <Typography variant="body2" color="text.secondary">Tasks Generated</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <SkillIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{summary.stats.skillsIdentified}</Typography>
                    <Typography variant="body2" color="text.secondary">Skills Identified</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <StarIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{aiService.formatConfidence(summary.stats.confidenceScore)}</Typography>
                    <Typography variant="body2" color="text.secondary">Confidence</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {summary.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Warnings:</Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {summary.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {summary.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Errors:</Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {summary.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  const renderGeneratedTasks = () => {
    if (!generatedTasks || generatedTasks.length === 0) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Generated Tasks ({generatedTasks.length})</Typography>
          <Box>
            <Button
              size="small"
              onClick={handleSelectAllTasks}
              sx={{ mr: 1 }}
            >
              {selectedTasks.size === generatedTasks.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Typography variant="body2" color="text.secondary" component="span">
              {selectedTasks.size} selected
            </Typography>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Est. Hours</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Skills</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {generatedTasks.map((task, index) => (
                <TableRow key={index} hover>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(index)}
                      onChange={() => handleTaskSelection(index)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {task.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.taskType}
                      size="small"
                      color={aiService.getTaskTypeColor(task.taskType)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={aiService.getPriorityColor(task.priority)}
                    />
                  </TableCell>
                  <TableCell>{Math.round(task.estimatedHours || 0)}h</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {aiService.formatConfidence(task.confidenceScore)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {task.requiredSkills?.slice(0, 3).map((skill, skillIndex) => (
                        <Chip
                          key={skillIndex}
                          label={skill.skillName || skill}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {task.requiredSkills?.length > 3 && (
                        <Chip
                          label={`+${task.requiredSkills.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Selected {selectedTasks.size} of {generatedTasks.length} tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            onClick={handleCreateTasks}
            disabled={loading || selectedTasks.size === 0}
          >
            {loading ? 'Creating Tasks...' : `Create ${selectedTasks.size} Tasks`}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AIIcon />}
        onClick={handleOpen}
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          '&:hover': {
            background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
          }
        }}
      >
        AI Task Generation
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6">AI-Powered Task Generation</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Upload Files" icon={<UploadIcon />} iconPosition="start" />
            <Tab label="Text Input" icon={<EditIcon />} iconPosition="start" />
          </Tabs>

          {activeTab === 0 && renderFileUploadTab()}
          {activeTab === 1 && renderTextInputTab()}

          {analyzing && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <CircularProgress size={48} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                AI is analyzing your requirements and generating tasks...
              </Typography>
              <LinearProgress sx={{ mt: 1 }} />
            </Box>
          )}

          {renderAnalysisResults()}
          {renderGeneratedTasks()}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading || analyzing}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AITaskGeneration;