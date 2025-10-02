import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Autocomplete,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Assessment as ReportsIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Speed as PerformanceIcon,
  Assignment as ProjectIcon,
  Task as TaskIcon,
  People as TeamIcon,
  AttachMoney as BudgetIcon,
  CalendarToday as CalendarIcon,
  Insights as InsightsIcon,
  Analytics as AnalyticsIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

const ProjectReports = ({ showNotification }) => {
  const theme = useTheme();
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'day'),
    end: dayjs(),
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeChart, setActiveChart] = useState(null);

  const periodOptions = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisquarter', label: 'This Quarter' },
    { value: 'thisyear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const projectOptions = [
    'E-commerce Platform',
    'Mobile App Redesign',
    'AI Integration',
    'Marketing Campaign',
    'Database Migration',
  ];

  const departmentOptions = [
    'Engineering',
    'Design',
    'Marketing',
    'Sales',
    'Operations',
  ];

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedProjects, selectedDepartments, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReportData({
        summary: {
          totalProjects: 24,
          completedProjects: 18,
          activeProjects: 6,
          totalTasks: 342,
          completedTasks: 287,
          overdueTasks: 23,
          totalBudget: 485000,
          spentBudget: 367500,
          teamMembers: 32,
          averageProjectDuration: 45, // days
          onTimeDelivery: 87, // percentage
          budgetUtilization: 76, // percentage
        },
        projectPerformance: [
          {
            project: 'E-commerce Platform',
            status: 'In Progress',
            progress: 75,
            budget: 50000,
            spent: 37500,
            timeline: 'On Track',
            efficiency: 92,
            tasksCompleted: 28,
            totalTasks: 35,
            teamSize: 5,
            startDate: '2024-01-01',
            endDate: '2024-02-15',
          },
          {
            project: 'Mobile App Redesign',
            status: 'In Progress',
            progress: 45,
            budget: 30000,
            spent: 18000,
            timeline: 'At Risk',
            efficiency: 78,
            tasksCompleted: 15,
            totalTasks: 30,
            teamSize: 3,
            startDate: '2024-01-15',
            endDate: '2024-03-01',
          },
          {
            project: 'AI Integration',
            status: 'Review',
            progress: 90,
            budget: 75000,
            spent: 67500,
            timeline: 'Ahead',
            efficiency: 95,
            tasksCompleted: 22,
            totalTasks: 25,
            teamSize: 4,
            startDate: '2023-12-01',
            endDate: '2024-01-30',
          },
        ],
        teamProductivity: [
          {
            member: 'Alice Johnson',
            department: 'Engineering',
            tasksCompleted: 12,
            efficiency: 95,
            hoursLogged: 160,
            projectsInvolved: 2,
            rating: 4.8,
          },
          {
            member: 'Bob Smith',
            department: 'Engineering',
            tasksCompleted: 8,
            efficiency: 87,
            hoursLogged: 148,
            projectsInvolved: 2,
            rating: 4.5,
          },
          {
            member: 'Carol Davis',
            department: 'Design',
            tasksCompleted: 15,
            efficiency: 92,
            hoursLogged: 152,
            projectsInvolved: 3,
            rating: 4.9,
          },
        ],
        timelineAnalysis: {
          onTime: 14,
          delayed: 3,
          ahead: 1,
          cancelled: 6,
        },
        budgetAnalysis: {
          underBudget: 12,
          onBudget: 8,
          overBudget: 4,
        },
        departmentMetrics: [
          {
            department: 'Engineering',
            projectsActive: 3,
            efficiency: 91,
            budget: 200000,
            spent: 155000,
            teamSize: 15,
          },
          {
            department: 'Design',
            projectsActive: 2,
            efficiency: 94,
            budget: 80000,
            spent: 62000,
            teamSize: 8,
          },
          {
            department: 'Marketing',
            projectsActive: 1,
            efficiency: 88,
            budget: 50000,
            spent: 35000,
            teamSize: 5,
          },
        ],
        trends: {
          projectCompletionRate: [
            { month: 'Jan', rate: 85 },
            { month: 'Feb', rate: 87 },
            { month: 'Mar', rate: 89 },
            { month: 'Apr', rate: 91 },
            { month: 'May', rate: 88 },
            { month: 'Jun', rate: 92 },
          ],
          budgetUtilization: [
            { month: 'Jan', utilization: 72 },
            { month: 'Feb', utilization: 75 },
            { month: 'Mar', utilization: 78 },
            { month: 'Apr', utilization: 76 },
            { month: 'May', utilization: 80 },
            { month: 'Jun', utilization: 76 },
          ],
        },
      });
      
      showNotification('Report data loaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format) => {
    showNotification(`Exporting report as ${format}...`, 'info');
    // Implementation for export functionality
  };

  const handleMenuOpen = (event, chart) => {
    setAnchorEl(event.currentTarget);
    setActiveChart(chart);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveChart(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track':
        return 'success';
      case 'At Risk':
        return 'warning';
      case 'Delayed':
        return 'error';
      case 'Ahead':
        return 'info';
      default:
        return 'default';
    }
  };

  const MetricCard = ({ title, value, subtitle, trend, icon, color = 'primary' }) => (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].main, 0.05)})`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette[color].main }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            {icon}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.direction === 'up' ? (
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={trend.direction === 'up' ? 'success.main' : 'error.main'}
                >
                  {trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ title, children, onExport, onRefresh }) => (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Box>
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton
              onClick={(e) => handleMenuOpen(e, title)}
              size="small"
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Project Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportReport('PDF')}
            sx={{ borderRadius: 2 }}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Time Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {periodOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedPeriod === 'custom' && (
              <>
                <Grid item xs={12} md={2}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Start Date"
                      value={dateRange.start}
                      onChange={(newValue) => setDateRange({ ...dateRange, start: newValue })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={2}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={dateRange.end}
                      onChange={(newValue) => setDateRange({ ...dateRange, end: newValue })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}
            <Grid item xs={12} md={3}>
              <Autocomplete
                multiple
                options={projectOptions}
                value={selectedProjects}
                onChange={(event, newValue) => setSelectedProjects(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Projects" placeholder="Select projects" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete
                multiple
                options={departmentOptions}
                value={selectedDepartments}
                onChange={(event, newValue) => setSelectedDepartments(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Departments" placeholder="Select departments" />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Projects"
            value={reportData.summary?.totalProjects || 0}
            subtitle={`${reportData.summary?.activeProjects || 0} active`}
            trend={{ direction: 'up', value: 8 }}
            icon={<ProjectIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Completion Rate"
            value={`${Math.round(((reportData.summary?.completedProjects || 0) / (reportData.summary?.totalProjects || 1)) * 100)}%`}
            subtitle="Projects completed"
            trend={{ direction: 'up', value: 5 }}
            icon={<CompletedIcon sx={{ fontSize: 32, color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Budget Utilization"
            value={`${reportData.summary?.budgetUtilization || 0}%`}
            subtitle={`$${((reportData.summary?.spentBudget || 0) / 1000).toFixed(0)}K spent`}
            trend={{ direction: 'down', value: 3 }}
            icon={<BudgetIcon sx={{ fontSize: 32, color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="On-Time Delivery"
            value={`${reportData.summary?.onTimeDelivery || 0}%`}
            subtitle="Projects on schedule"
            trend={{ direction: 'up', value: 12 }}
            icon={<ScheduleIcon sx={{ fontSize: 32, color: 'info.main' }} />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Project Performance Table */}
        <Grid item xs={12} lg={8}>
          <ChartCard
            title="Project Performance Overview"
            onRefresh={loadReportData}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Budget</TableCell>
                    <TableCell>Timeline</TableCell>
                    <TableCell>Efficiency</TableCell>
                    <TableCell>Team</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.projectPerformance || []).map((project, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {project.project}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {project.tasksCompleted}/{project.totalTasks} tasks
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 80 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2">{project.progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${(project.spent / 1000).toFixed(0)}K / ${(project.budget / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round((project.spent / project.budget) * 100)}% used
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={project.timeline}
                          color={getStatusColor(project.timeline)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{project.efficiency}%</Typography>
                          {project.efficiency >= 90 && <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{project.teamSize} members</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartCard>
        </Grid>

        {/* Department Metrics */}
        <Grid item xs={12} lg={4}>
          <ChartCard
            title="Department Performance"
            onRefresh={loadReportData}
          >
            <Box sx={{ height: 300, overflow: 'auto' }}>
              {(reportData.departmentMetrics || []).map((dept, index) => (
                <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: index < reportData.departmentMetrics.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {dept.department}
                    </Typography>
                    <Chip
                      label={`${dept.efficiency}%`}
                      color={dept.efficiency >= 90 ? 'success' : dept.efficiency >= 80 ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {dept.projectsActive} active projects • {dept.teamSize} members
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Budget Usage</Typography>
                      <Typography variant="caption">
                        {Math.round((dept.spent / dept.budget) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dept.spent / dept.budget) * 100}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ${(dept.spent / 1000).toFixed(0)}K / ${(dept.budget / 1000).toFixed(0)}K
                  </Typography>
                </Box>
              ))}
            </Box>
          </ChartCard>
        </Grid>

        {/* Team Productivity */}
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Top Performers"
            onRefresh={loadReportData}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Tasks</TableCell>
                  <TableCell>Efficiency</TableCell>
                  <TableCell>Rating</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportData.teamProductivity || []).map((member, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{member.member}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.department}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.tasksCompleted}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.hoursLogged}h logged
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={member.efficiency}
                          sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption">{member.efficiency}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="body2">{member.rating}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartCard>
        </Grid>

        {/* Timeline & Budget Analysis */}
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Project Analysis"
            onRefresh={loadReportData}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Timeline Performance</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="h6" color="success.contrastText">
                        {reportData.timelineAnalysis?.onTime || 0}
                      </Typography>
                      <Typography variant="caption" color="success.contrastText">
                        On Time
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Typography variant="h6" color="warning.contrastText">
                        {reportData.timelineAnalysis?.delayed || 0}
                      </Typography>
                      <Typography variant="caption" color="warning.contrastText">
                        Delayed
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h6" color="info.contrastText">
                        {reportData.timelineAnalysis?.ahead || 0}
                      </Typography>
                      <Typography variant="caption" color="info.contrastText">
                        Ahead
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.light' }}>
                      <Typography variant="h6" color="error.contrastText">
                        {reportData.timelineAnalysis?.cancelled || 0}
                      </Typography>
                      <Typography variant="caption" color="error.contrastText">
                        Cancelled
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Budget Performance</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="h6" color="success.contrastText">
                        {reportData.budgetAnalysis?.underBudget || 0}
                      </Typography>
                      <Typography variant="caption" color="success.contrastText">
                        Under Budget
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h6" color="info.contrastText">
                        {reportData.budgetAnalysis?.onBudget || 0}
                      </Typography>
                      <Typography variant="caption" color="info.contrastText">
                        On Budget
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.light' }}>
                      <Typography variant="h6" color="error.contrastText">
                        {reportData.budgetAnalysis?.overBudget || 0}
                      </Typography>
                      <Typography variant="caption" color="error.contrastText">
                        Over Budget
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </ChartCard>
        </Grid>

        {/* Insights & Recommendations */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsightsIcon color="secondary" />
                <Typography variant="h6">AI-Powered Insights & Recommendations</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                        Performance Highlights
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • AI Integration project is performing exceptionally well (95% efficiency)
                        <br />
                        • Carol Davis shows consistent high performance across projects
                        <br />
                        • Engineering department maintaining 91% efficiency rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                        Areas for Improvement
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Mobile App Redesign project is at risk - consider additional resources
                        <br />
                        • 23 tasks are overdue - review workload distribution
                        <br />
                        • Budget utilization declining - optimize resource allocation
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'info.main', mb: 1 }}>
                        Strategic Recommendations
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Invest in automation tools for Engineering team
                        <br />
                        • Consider cross-training to improve team flexibility
                        <br />
                        • Implement agile methodologies for better time management
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Context Menu for Charts */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleExportReport('PDF'); handleMenuClose(); }}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={() => { handleExportReport('Excel'); handleMenuClose(); }}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export as Excel
        </MenuItem>
        <MenuItem onClick={() => { navigator.share({ title: activeChart, text: 'Project Report' }); handleMenuClose(); }}>
          <ShareIcon sx={{ mr: 1 }} />
          Share
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectReports;
