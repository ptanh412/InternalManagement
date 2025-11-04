# Enhanced Dashboard Charts Implementation Guide

## Overview
This guide provides step-by-step implementation instructions for adding comprehensive charts and visualizations to each role-based dashboard in the Internal Management System.

## 📋 Prerequisites

### 1. Required Dependencies
Add these to your `package.json`:

```json
{
  "dependencies": {
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "chartjs-adapter-date-fns": "^3.0.0",
    "date-fns": "^2.30.0"
  }
}
```

Install dependencies:
```bash
npm install chart.js react-chartjs-2 chartjs-adapter-date-fns date-fns
```

### 2. Chart.js Registration
Create a chart configuration file:

**`/src/utils/chartConfig.js`**
```javascript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default ChartJS;
```

## 🎯 Implementation Steps

### Step 1: Project Manager Dashboard Enhancement

**File: `/src/pages/dashboards/ProjectManagerDashboard.js`**

1. **Import Required Libraries**
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import '../utils/chartConfig'; // Register Chart.js components
```

2. **Add Chart State Management**
```javascript
const [chartData, setChartData] = useState({
  projectCompletion: null,
  statusDistribution: null,
  budgetAnalysis: null,
  teamPerformance: null,
  projectTimeline: null,
  resourceAllocation: null
});

const chartRefs = {
  completion: useRef(null),
  status: useRef(null),
  budget: useRef(null),
  performance: useRef(null),
  timeline: useRef(null),
  resources: useRef(null)
};
```

3. **Create Chart Data Initialization Function**
```javascript
const initializeChartData = () => {
  // Project Completion Rate
  const projectCompletionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Projects Completed',
        data: [2, 4, 3, 5, 7, 6, 8, 9, 7, 10, 8, 12],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Projects Started',
        data: [3, 5, 4, 6, 8, 7, 9, 10, 8, 11, 9, 13],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Status Distribution
  const statusDistributionData = {
    labels: ['Completed', 'In Progress', 'Planning', 'On Hold', 'Review'],
    datasets: [{
      data: [45, 30, 15, 5, 5],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  // Set all chart data
  setChartData({
    projectCompletion: projectCompletionData,
    statusDistribution: statusDistributionData,
    // ... add other charts
  });
};
```

4. **Add Chart Configuration Options**
```javascript
const getChartOptions = (title, type = 'default') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: title,
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3B82F6',
        borderWidth: 1
      }
    }
  };

  // Add specific configurations based on chart type
  if (type === 'multiAxis') {
    return {
      ...baseOptions,
      scales: {
        x: { display: true, title: { display: true, text: 'Time Period' }},
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Percentage (%)' }},
        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Hours' }, grid: { drawOnChartArea: false }}
      }
    };
  }

  return baseOptions;
};
```

5. **Add Export Functionality**
```javascript
const exportChart = (chartRef, filename) => {
  if (chartRef.current) {
    const canvas = chartRef.current.canvas;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = url;
    link.click();
  }
};
```

6. **Update JSX with Chart Components**
```javascript
{/* Enhanced Charts Grid */}
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
  
  {/* Project Completion Rate Chart */}
  <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Project Completion Rate</h3>
      <button
        onClick={() => exportChart(chartRefs.completion, 'project-completion-rate')}
        className="text-blue-600 hover:text-blue-800"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
      </button>
    </div>
    <div className="h-80">
      {chartData.projectCompletion && (
        <Line 
          ref={chartRefs.completion}
          data={chartData.projectCompletion} 
          options={getChartOptions('Monthly Project Completion Trends')} 
        />
      )}
    </div>
  </div>

  {/* Project Status Distribution */}
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
      <button
        onClick={() => exportChart(chartRefs.status, 'status-distribution')}
        className="text-blue-600 hover:text-blue-800"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
      </button>
    </div>
    <div className="h-80">
      {chartData.statusDistribution && (
        <Doughnut 
          ref={chartRefs.status}
          data={chartData.statusDistribution} 
          options={getChartOptions('Project Status Overview')} 
        />
      )}
    </div>
  </div>

  {/* Add more charts as needed */}
</div>
```

### Step 2: Team Lead Dashboard Enhancement

**File: `/src/pages/dashboards/TeamLeadDashboard.js`**

Follow similar pattern with team-specific charts:

1. **Task Distribution Chart** (Horizontal Bar)
```javascript
const taskDistributionData = {
  labels: ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'Emily Chen', 'David Brown'],
  datasets: [
    {
      label: 'Completed Tasks',
      data: [24, 18, 22, 20, 16],
      backgroundColor: '#10B981'
    },
    {
      label: 'In Progress',
      data: [3, 2, 4, 3, 2],
      backgroundColor: '#F59E0B'
    },
    {
      label: 'Pending',
      data: [1, 3, 2, 2, 4],
      backgroundColor: '#EF4444'
    }
  ]
};
```

2. **Productivity Trends** (Area Chart)
```javascript
const productivityTrendsData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Tasks Completed',
      data: [12, 15, 18, 16, 20, 8, 3],
      backgroundColor: 'rgba(16, 185, 129, 0.3)',
      borderColor: '#10B981',
      fill: true
    },
    {
      label: 'Hours Worked',
      data: [45, 52, 48, 50, 55, 25, 10],
      backgroundColor: 'rgba(59, 130, 246, 0.3)', 
      borderColor: '#3B82F6',
      fill: true,
      yAxisID: 'y1'
    }
  ]
};
```

3. **Skills Radar Chart**
```javascript
import { Radar } from 'react-chartjs-2';

const skillsCoverageData = {
  labels: ['Frontend Dev', 'Backend Dev', 'UI/UX Design', 'QA Testing', 'DevOps', 'Mobile Dev'],
  datasets: [
    {
      label: 'Team Skill Level',
      data: [85, 92, 78, 88, 70, 65],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3B82F6',
      borderWidth: 2
    },
    {
      label: 'Project Requirements',
      data: [80, 85, 90, 80, 75, 70],
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      borderColor: '#F59E0B',
      borderWidth: 2
    }
  ]
};
```

### Step 3: Employee Dashboard Enhancement

**File: `/src/pages/dashboards/EmployeeDashboard.js`**

Employee-specific personal productivity charts:

1. **Personal Task Timeline**
```javascript
const personalTaskTimelineData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
  datasets: [
    {
      label: 'Tasks Completed',
      data: [5, 7, 6, 8, 9, 7, 10, 8],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Tasks Assigned',
      data: [6, 8, 7, 9, 10, 8, 11, 9],
      borderColor: '#3B82F6', 
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
};
```

2. **Daily Hours Tracking**
```javascript
const dailyHoursData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Productive Hours',
      data: [7.5, 8, 7.8, 8.2, 7.9, 4, 0],
      backgroundColor: '#10B981'
    },
    {
      label: 'Break Time',
      data: [0.5, 0.5, 0.7, 0.3, 0.6, 0.2, 0],
      backgroundColor: '#F59E0B'
    },
    {
      label: 'Overtime',
      data: [0, 0.5, 0, 0.8, 0.2, 0, 0],
      backgroundColor: '#EF4444'
    }
  ]
};
```

### Step 4: Admin Dashboard Enhancement

**File: `/src/pages/dashboards/AdminDashboard.js`**

Admin comprehensive system monitoring charts:

1. **System Overview**
```javascript
const systemOverviewData = {
  userGrowth: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Total Users',
      data: [50, 65, 78, 92, 108, 125, 142, 158, 175, 192, 208, 225],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true
    }]
  },
  userActivity: {
    labels: ['Active', 'Inactive', 'Online', 'Away'],
    datasets: [{
      data: [180, 45, 95, 35],
      backgroundColor: ['#10B981', '#EF4444', '#3B82F6', '#F59E0B']
    }]
  }
};
```

2. **Department Distribution**
```javascript
const departmentDistributionData = {
  labels: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'],
  datasets: [
    {
      label: 'Active Users',
      data: [45, 22, 18, 25, 12, 15, 20],
      backgroundColor: '#10B981'
    },
    {
      label: 'Inactive Users',  
      data: [5, 3, 2, 4, 2, 1, 3],
      backgroundColor: '#EF4444'
    },
    {
      label: 'New Hires',
      data: [3, 2, 1, 2, 1, 1, 2], 
      backgroundColor: '#3B82F6'
    }
  ]
};
```

## 🔄 Real-time Data Integration

### WebSocket Integration for Live Updates

**`/src/hooks/useRealtimeCharts.js`**
```javascript
import { useEffect, useState } from 'react';
import socketIOService from '../services/socketIOService';

export const useRealtimeCharts = (chartType, userRole) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    socketIOService.connect();

    // Subscribe to chart updates based on role and chart type
    const unsubscribe = socketIOService.subscribe(`${userRole}-${chartType}-update`, (data) => {
      setChartData(prevData => ({
        ...prevData,
        ...data
      }));
    });

    // Subscribe to general dashboard updates
    const unsubscribeGeneral = socketIOService.subscribe('dashboard-update', (data) => {
      if (data.role === userRole && data.chartType === chartType) {
        setChartData(prevData => ({
          ...prevData,
          ...data.chartData
        }));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeGeneral();
    };
  }, [chartType, userRole]);

  return chartData;
};
```

### API Integration for Chart Data

**`/src/services/chartDataService.js`**
```javascript
import { apiService } from './apiService';

export const chartDataService = {
  // Project Manager Chart APIs
  getProjectCompletionRates: () => apiService.get('/api/charts/project-completion'),
  getProjectStatusDistribution: () => apiService.get('/api/charts/project-status'),
  getBudgetAnalysis: () => apiService.get('/api/charts/budget-analysis'),
  getTeamPerformanceMetrics: () => apiService.get('/api/charts/team-performance'),
  
  // Team Lead Chart APIs
  getTaskDistribution: (teamId) => apiService.get(`/api/charts/task-distribution/${teamId}`),
  getProductivityTrends: (teamId) => apiService.get(`/api/charts/productivity-trends/${teamId}`),
  getSkillsCoverage: (teamId) => apiService.get(`/api/charts/skills-coverage/${teamId}`),
  
  // Employee Chart APIs
  getPersonalTaskTimeline: (userId) => apiService.get(`/api/charts/personal-timeline/${userId}`),
  getDailyHours: (userId) => apiService.get(`/api/charts/daily-hours/${userId}`),
  getPerformanceRadar: (userId) => apiService.get(`/api/charts/performance-radar/${userId}`),
  
  // Admin Chart APIs
  getSystemOverview: () => apiService.get('/api/charts/system-overview'),
  getDepartmentStats: () => apiService.get('/api/charts/department-stats'),
  getResourceUtilization: () => apiService.get('/api/charts/resource-utilization')
};
```

## 📱 Responsive Design Implementation

### Mobile-friendly Chart Configuration

```javascript
const responsiveChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: window.innerWidth < 768 ? 'bottom' : 'top',
      labels: {
        boxWidth: window.innerWidth < 768 ? 12 : 20,
        font: {
          size: window.innerWidth < 768 ? 10 : 12
        }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      titleFont: {
        size: window.innerWidth < 768 ? 12 : 14
      },
      bodyFont: {
        size: window.innerWidth < 768 ? 10 : 12
      }
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: window.innerWidth < 768 ? 45 : 0,
        font: {
          size: window.innerWidth < 768 ? 10 : 12
        }
      }
    },
    y: {
      ticks: {
        font: {
          size: window.innerWidth < 768 ? 10 : 12
        }
      }
    }
  }
};
```

## ⚡ Performance Optimization

### Lazy Loading Charts

```javascript
import { lazy, Suspense } from 'react';

// Lazy load chart components
const ProjectCompletionChart = lazy(() => import('./charts/ProjectCompletionChart'));
const StatusDistributionChart = lazy(() => import('./charts/StatusDistributionChart'));

// Use with Suspense
<Suspense fallback={<ChartSkeleton />}>
  <ProjectCompletionChart data={chartData.projectCompletion} />
</Suspense>
```

### Chart Data Caching

```javascript
import { useMemo } from 'react';

const MemoizedChart = ({ data, options }) => {
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);
  
  return <Line data={memoizedData} options={memoizedOptions} />;
};
```

## 🎨 Theme Integration

### Dark/Light Mode Support

```javascript
const getThemeColors = (isDarkMode) => ({
  primary: isDarkMode ? '#60A5FA' : '#3B82F6',
  success: isDarkMode ? '#34D399' : '#10B981',
  warning: isDarkMode ? '#FBBF24' : '#F59E0B',
  danger: isDarkMode ? '#F87171' : '#EF4444',
  background: isDarkMode ? '#1F2937' : '#FFFFFF',
  text: isDarkMode ? '#F9FAFB' : '#111827'
});

// Apply theme to chart options
const themedChartOptions = {
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    legend: {
      ...baseOptions.plugins.legend,
      labels: {
        color: getThemeColors(isDarkMode).text
      }
    }
  },
  scales: {
    x: {
      ...baseOptions.scales?.x,
      ticks: {
        color: getThemeColors(isDarkMode).text
      },
      grid: {
        color: isDarkMode ? '#374151' : '#E5E7EB'
      }
    },
    y: {
      ...baseOptions.scales?.y,
      ticks: {
        color: getThemeColors(isDarkMode).text
      },
      grid: {
        color: isDarkMode ? '#374151' : '#E5E7EB'
      }
    }
  }
};
```

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
cd website-service
npm install chart.js react-chartjs-2 chartjs-adapter-date-fns date-fns
```

### 2. Copy Enhanced Dashboard Files
- Replace existing dashboard files with enhanced versions
- Add new chart utility files

### 3. Update Routes (if needed)
```javascript
// In App.js, add new enhanced dashboard routes
<Route
  path="/dashboard/project-manager-enhanced"
  element={
    <ProtectedRoute allowedRoles={['PROJECT_MANAGER']}>
      <EnhancedProjectManagerDashboard />
    </ProtectedRoute>
  }
/>
```

### 4. Test Chart Functionality
- Verify all charts render correctly
- Test responsive behavior
- Check export functionality
- Validate real-time updates

### 5. Backend API Integration
Implement the chart data APIs in your backend services to provide real data instead of mock data.

## 📊 Sample API Response Format

```javascript
// GET /api/charts/project-completion
{
  "result": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "completedProjects": [2, 4, 3, 5, 7, 6],
    "startedProjects": [3, 5, 4, 6, 8, 7]
  },
  "message": "Project completion data retrieved successfully"
}

// GET /api/charts/project-status
{
  "result": {
    "completed": 45,
    "inProgress": 30,
    "planning": 15,
    "onHold": 5,
    "review": 5
  },
  "message": "Project status distribution retrieved successfully"
}
```

This comprehensive implementation guide provides everything needed to add sophisticated chart visualizations to your Internal Management System dashboards. Each role will have tailored, interactive charts that provide actionable insights for their specific responsibilities.