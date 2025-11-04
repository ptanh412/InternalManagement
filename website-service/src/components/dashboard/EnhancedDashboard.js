import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

import ChartFilters from '../filters/ChartFilters';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import reportingService from '../../services/reportingService';
import webSocketService from '../../services/webSocketService';

const EnhancedDashboard = ({ 
  dashboardType = 'general',
  children,
  title,
  userId,
  teamId,
  className = "",
  showFilters = true,
  showExportOptions = true,
  showRealTimeStatus = true,
  availableFilters = {},
  onDataUpdate
}) => {
  const [filters, setFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chartRefs, setChartRefs] = useState(new Map());
  
  // Real-time data integration
  const {
    data: realTimeData,
    loading: realTimeLoading,
    error: realTimeError,
    isConnected,
    lastUpdate,
    refresh
  } = useRealTimeData({
    dashboardType,
    userId,
    teamId,
    filters: filters.customFilters,
    onDataUpdate: (data) => {
      setLastRefresh(new Date());
      if (onDataUpdate) {
        onDataUpdate(data);
      }
    }
  });

  // Chart refs management
  const registerChart = useCallback((chartId, ref) => {
    setChartRefs(prev => new Map(prev.set(chartId, ref)));
  }, []);

  const unregisterChart = useCallback((chartId) => {
    setChartRefs(prev => {
      const newMap = new Map(prev);
      newMap.delete(chartId);
      return newMap;
    });
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Request fresh data with new filters
    if (webSocketService.isSocketConnected()) {
      webSocketService.requestDashboardData(dashboardType, newFilters);
    } else {
      // Fallback to manual refresh
      refresh();
    }
  }, [dashboardType, refresh]);

  // Export functions
  const exportChart = useCallback(async (chartId, format = 'png') => {
    const chartRef = chartRefs.get(chartId);
    if (!chartRef || !chartRef.current) {
      console.warn(`Chart ref not found for: ${chartId}`);
      return;
    }

    try {
      setIsExporting(true);
      
      if (format === 'png') {
        const canvas = chartRef.current.canvas || chartRef.current;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
      }
      
    } catch (error) {
      console.error('Error exporting chart:', error);
    } finally {
      setIsExporting(false);
    }
  }, [chartRefs]);

  const exportAllCharts = useCallback(async (format = 'pdf') => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      const charts = Array.from(chartRefs.entries()).map(([id, ref]) => ({
        id,
        ref,
        title: id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      }));

      setExportProgress(25);

      if (format === 'pdf') {
        const pdfConfig = {
          title: `${title || 'Dashboard'} Report`,
          charts,
          metadata: {
            dateRange: filters.dateRange,
            filters: filters.customFilters,
            generatedBy: userId,
            dashboardType
          }
        };

        setExportProgress(50);
        const pdf = await reportingService.generatePDFReport(pdfConfig);
        setExportProgress(75);
        
        const timestamp = new Date().toISOString().split('T')[0];
        pdf.save(`${dashboardType}-dashboard-${timestamp}.pdf`);
        setExportProgress(100);
        
      } else if (format === 'excel') {
        // Export data tables to Excel
        const tableData = await gatherTableData();
        setExportProgress(50);
        
        await reportingService.exportToExcel(null, {
          filename: `${dashboardType}-dashboard-data`,
          sheets: tableData
        });
        setExportProgress(100);
      }

      setTimeout(() => {
        setExportProgress(0);
        setShowExportModal(false);
      }, 1000);

    } catch (error) {
      console.error('Error exporting dashboard:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [chartRefs, filters, title, userId, dashboardType]);

  // Gather table data for export
  const gatherTableData = useCallback(async () => {
    // This would gather data from your dashboard's data sources
    // For now, return sample structure
    return [
      {
        name: 'Dashboard Data',
        data: realTimeData ? [realTimeData] : [],
        headers: ['Field', 'Value', 'Last Updated']
      }
    ];
  }, [realTimeData]);

  // Schedule report
  const scheduleReport = useCallback(async (scheduleConfig) => {
    try {
      const reportConfig = {
        title: `${title || 'Dashboard'} Scheduled Report`,
        dashboardType,
        filters: filters.customFilters,
        dateRange: filters.dateRange
      };

      const result = await reportingService.scheduleReport({
        ...scheduleConfig,
        reportConfig
      });

      if (result.success) {
        alert(`Report scheduled successfully. Next generation: ${result.nextScheduled}`);
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Failed to schedule report. Please try again.');
    }
  }, [title, dashboardType, filters]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setLastRefresh(new Date());
    refresh();
  }, [refresh]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2 text-sm">
      {isConnected ? (
        <>
          <WifiIcon className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Connected</span>
        </>
      ) : (
        <>
          <NoSymbolIcon className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
      {lastUpdate && (
        <span className="text-gray-500">
          Updated: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );

  // Export Modal
  const ExportModal = () => (
    showExportModal && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Dashboard</h3>
            
            {exportProgress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => exportAllCharts('pdf')}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export as PDF Report
              </button>
              
              <button
                onClick={() => exportAllCharts('excel')}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Data to Excel
              </button>

              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule Report</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => scheduleReport({ frequency: 'weekly', recipients: ['user@example.com'] })}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Weekly Report
                  </button>
                  <button
                    onClick={() => scheduleReport({ frequency: 'monthly', recipients: ['user@example.com'] })}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Monthly Report
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className={`enhanced-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {showRealTimeStatus && <ConnectionStatus />}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ClockIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>

            {/* Export Button */}
            {showExportOptions && (
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Error/Loading States */}
        {realTimeError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800 text-sm">{realTimeError}</span>
            </div>
          </div>
        )}

        {realTimeLoading && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-blue-400 mr-2 animate-spin" />
              <span className="text-blue-800 text-sm">Loading real-time data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <ChartFilters
            onFiltersChange={handleFiltersChange}
            availableFilters={availableFilters}
            initialFilters={filters}
          />
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {React.cloneElement(children, {
          realTimeData,
          filters,
          registerChart,
          unregisterChart,
          exportChart,
          isConnected,
          lastUpdate: lastRefresh
        })}
      </div>

      {/* Export Modal */}
      <ExportModal />
    </div>
  );
};

export default EnhancedDashboard;