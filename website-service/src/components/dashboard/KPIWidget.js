import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';

const KPIWidget = ({ userId }) => {
  const navigate = useNavigate();
  const [performanceScore, setPerformanceScore] = useState(null);
  const [performanceDetails, setPerformanceDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadPerformanceData();
    }
  }, [userId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [scoreResponse, detailsResponse] = await Promise.all([
        apiService.getPerformanceScore(userId),
        apiService.getPerformanceDetails(userId)
      ]);

      console.log('Performance Score Response:', scoreResponse);
      console.log('Performance Details Response:', detailsResponse);
      
      setPerformanceScore(scoreResponse.result);
      setPerformanceDetails(detailsResponse.result);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrophyIcon className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white">
            Your Performance KPI
          </h2>
        </div>
        <button
          onClick={() => navigate('/analytics/performance')}
          className="text-primary-600 hover:text-primary-500 text-sm font-medium flex items-center space-x-1"
        >
          <span>View Details</span>
          <ChartPieIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Performance Score */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Overall Score</span>
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-blue-900">
              {performanceScore ? performanceScore.toFixed(1) : '-'}
            </span>
            <span className="text-sm text-blue-700">/ 100</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${performanceScore || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Task Completion</span>
            <DocumentTextIcon className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-green-900">
              {performanceDetails?.completionRate ? performanceDetails.completionRate.toFixed(0) : '-'}
            </span>
            <span className="text-sm text-green-700">%</span>
          </div>
          <p className="text-xs text-green-700 mt-2">
            {performanceDetails?.totalTasksCompleted || 0} of {performanceDetails?.totalTasksAssigned || 0} tasks completed
          </p>
        </div>

        {/* On-Time Delivery */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">On-Time Delivery</span>
            <ClockIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-purple-900">
              {performanceDetails?.timelinessScore ? performanceDetails.timelinessScore.toFixed(0) : '-'}
            </span>
            <span className="text-sm text-purple-700">%</span>
          </div>
          <p className="text-xs text-purple-700 mt-2">
            {performanceDetails?.totalTasksOnTime || 0} on-time tasks
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-900">Performance</span>
            <TrophyIcon className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-yellow-900">
              {performanceDetails?.averageQualityRating ? performanceDetails.averageQualityRating.toFixed(1) : '-'}
            </span>
            <span className="text-sm text-yellow-700">/ 5.0</span>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            {performanceDetails?.tasksWithHighRating || 0} tasks with high rating
          </p>
        </div>
      </div>
    </div>
  );
};

export default KPIWidget;
