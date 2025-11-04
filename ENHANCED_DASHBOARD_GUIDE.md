# Enhanced Dashboard Features - Installation & Usage Guide

## 🚀 Quick Installation

Install the required dependencies for advanced dashboard features:

```bash
cd website-service
npm install html2canvas jspdf jspdf-autotable xlsx socket.io-client
```

## 📊 Features Implemented

### 1. Real-time Data Integration
- **WebSocketService**: Real-time data synchronization
- **useRealTimeData Hook**: Live chart updates
- **Connection Status**: Visual indicators for WebSocket connectivity
- **Automatic Fallback**: Polling when WebSocket disconnects

### 2. Advanced Chart Filtering
- **Date Range Pickers**: 9 preset options + custom range selection
- **Quick Filters**: Select, multiselect, text, and range filters  
- **Advanced Filters**: Expandable additional filter options
- **Filter Summary**: Visual indication of applied filters
- **Real-time Application**: Filters update charts immediately

### 3. Enhanced Reporting & Export
- **PDF Reports**: Multi-page reports with charts and tables
- **Excel Export**: XLSX format with multiple sheets
- **Chart Capture**: High-quality PNG export of individual charts
- **Scheduled Reports**: Automated report generation (daily/weekly/monthly)
- **Batch Export**: Export all dashboard data at once

## 🔧 Usage Examples

### Enhanced Dashboard Wrapper
```jsx
import EnhancedDashboard from '../components/dashboard/EnhancedDashboard';

<EnhancedDashboard
  dashboardType="employee"
  title="My Dashboard"
  userId={user?.id}
  showFilters={true}
  showExportOptions={true}
  showRealTimeStatus={true}
  availableFilters={filterConfig}
  onDataUpdate={handleDataUpdate}
>
  {/* Your dashboard content */}
</EnhancedDashboard>
```

### Real-time Data Hook
```jsx
import { useRealTimeData } from '../hooks/useRealTimeData';

const { data, loading, error, isConnected, refresh } = useRealTimeData({
  dashboardType: 'employee',
  userId: user?.id,
  refreshInterval: 30000,
  onDataUpdate: (data) => console.log('New data:', data)
});
```

### Chart Filters Component
```jsx
import ChartFilters from '../components/filters/ChartFilters';

const filterConfig = {
  quickFilters: [
    {
      key: 'status',
      label: 'Task Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' }
      ]
    }
  ],
  advancedFilters: [
    {
      key: 'dateCreated',
      label: 'Date Created',
      type: 'range'
    }
  ]
};

<ChartFilters
  onFiltersChange={handleFiltersChange}
  availableFilters={filterConfig}
  showDateRange={true}
  showCustomFilters={true}
/>
```

### Export & Reporting
```jsx
import reportingService from '../services/reportingService';

// Export single chart
const exportChart = async (chartRef) => {
  const canvas = await reportingService.captureChartAsImage(chartRef);
  // Auto-downloads PNG file
};

// Generate PDF report
const generateReport = async () => {
  const pdf = await reportingService.generatePDFReport({
    title: 'Dashboard Report',
    charts: chartArray,
    tables: dataArray,
    metadata: { dateRange, filters }
  });
  pdf.save('dashboard-report.pdf');
};

// Schedule automated report
const scheduleReport = async () => {
  const result = await reportingService.scheduleReport({
    frequency: 'weekly',
    recipients: ['manager@company.com'],
    reportConfig: { title: 'Weekly Dashboard Report' }
  });
};
```

## 🌐 WebSocket Configuration

### Backend Integration Required
```javascript
// Server-side WebSocket events to implement
socket.on('join_room', (roomName) => {
  socket.join(roomName);
});

// Send real-time updates
io.to('user_123').emit('dashboard_update', {
  type: 'employee',
  data: updatedData,
  timestamp: new Date()
});

io.to('team_456').emit('performance_update', performanceData);
io.to('admins').emit('system_update', systemMetrics);
```

## 📱 Dashboard Types Supported

### Employee Dashboard
- **Real-time Features**: Task updates, performance metrics, time tracking
- **Filters**: Task status, priority, project, date ranges
- **Export**: Personal performance reports, task summaries

### Team Lead Dashboard  
- **Real-time Features**: Team performance, member activities, project updates
- **Filters**: Team members, project status, performance metrics
- **Export**: Team reports, member performance analysis

### Project Manager Dashboard
- **Real-time Features**: Project progress, resource allocation, budget tracking
- **Filters**: Project status, timeline, budget ranges, team assignments
- **Export**: Project reports, resource utilization, timeline analysis

### Admin Dashboard
- **Real-time Features**: System health, user activities, department metrics
- **Filters**: User roles, departments, date ranges, system components
- **Export**: System reports, user analytics, department summaries

## 🔄 Migration Guide

### Existing Dashboards
1. Wrap existing dashboard with `EnhancedDashboard`
2. Register chart refs with `registerChart()` 
3. Add filter configuration
4. Update chart components to use real-time data

### Chart Integration
```jsx
// Register chart for export functionality
useEffect(() => {
  if (registerChart) {
    registerChart('chart-id', chartRef);
  }
  return () => unregisterChart && unregisterChart('chart-id');
}, [registerChart, unregisterChart]);
```

## 🎯 Benefits

- **Real-time Updates**: Live data without manual refresh
- **Professional Exports**: High-quality PDF reports and Excel data
- **Advanced Filtering**: Powerful data exploration capabilities  
- **Scheduled Reports**: Automated business intelligence
- **Improved UX**: Connection status, loading states, error handling
- **Mobile Responsive**: Works on all device sizes

All features are backward compatible and can be gradually integrated into existing dashboards.