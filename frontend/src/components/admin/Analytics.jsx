import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const Analytics = ({ user, token, onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [csvDownloading, setCsvDownloading] = useState(false); // Separate state for CSV download
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    
    // Set default date range (last 6 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  // 🔥 Success/Error message functions
  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    
    try {
      console.log('📊 Fetching analytics data...');
      const data = await adminAPI.getStats();
      console.log('✅ Analytics data received:', data);
      setStats(data);
      
      if (showRefreshIndicator) {
        showSuccessMessage('Analytics data refreshed successfully!');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error.message || 'Failed to load analytics data');
      
      if (showRefreshIndicator) {
        showErrorMessage(`Error refreshing data: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      showErrorMessage('Please select both start and end dates for the report.');
      return;
    }

    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      showErrorMessage('Start date cannot be later than end date.');
      return;
    }

    setReportLoading(true);
    
    try {
      console.log('📈 Generating custom report...');
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const data = await adminAPI.getReports(params);
      console.log('✅ Report generated:', data);
      setReports(data);
      showSuccessMessage(`Report generated successfully for ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`);
    } catch (error) {
      console.error('Report generation error:', error);
      showErrorMessage(`Error generating report: ${error.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  // 🔥 FIXED: Proper CSV download with authentication and correct API URL
  const downloadCSVReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      showErrorMessage('Please select date range before downloading CSV.');
      return;
    }

    try {
      console.log('📥 Starting CSV download...');
      setCsvDownloading(true);
      
      // Get the token from localStorage
      const authToken = localStorage.getItem('token') || token;
      
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Create the URL with parameters using correct API_BASE_URL
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: 'csv'
      });
      
      const url = `${API_BASE_URL}/admin/reports?${params.toString()}`;
      console.log('📡 CSV Request URL:', url);
      
      // Make the request with proper authentication
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Get the CSV content
      const csvContent = await response.text();
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const downloadUrl = URL.createObjectURL(blob);
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', `analytics-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl); // Clean up
      }
      
      showSuccessMessage('Analytics CSV report downloaded successfully!');
      
    } catch (error) {
      console.error('CSV download error:', error);
      showErrorMessage(`Error downloading CSV: ${error.message}`);
    } finally {
      setCsvDownloading(false);
    }
  };

  // 🔥 Enhanced: Quick date range buttons
  const setQuickDateRange = useCallback((months) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGrowthPercentage = (current, total) => {
    return total > 0 ? ((current / total) * 100).toFixed(1) : 0;
  };

  // 🔥 Enhanced: Calculate system health metrics
  const getSystemHealth = () => {
    if (!stats) return { score: 0, status: 'Unknown', issues: [] };
    
    let score = 100;
    const issues = [];
    
    // Check pending activities ratio
    const pendingRatio = (stats.activityStats?.pendingActivities || 0) / Math.max(stats.activityStats?.totalActivities || 1, 1);
    if (pendingRatio > 0.3) {
      score -= 20;
      issues.push('High number of pending activities');
    }
    
    // Check rejection rate
    const rejectionRatio = (stats.activityStats?.rejectedActivities || 0) / Math.max(stats.activityStats?.totalActivities || 1, 1);
    if (rejectionRatio > 0.2) {
      score -= 15;
      issues.push('High activity rejection rate');
    }
    
    // Check user activity
    const totalUsers = stats.userStats?.totalUsers || 0;
    const totalActivities = stats.activityStats?.totalActivities || 0;
    const activityPerUser = totalUsers > 0 ? totalActivities / totalUsers : 0;
    if (activityPerUser < 2) {
      score -= 10;
      issues.push('Low user engagement');
    }
    
    let status = 'Excellent';
    if (score < 70) status = 'Needs Attention';
    else if (score < 85) status = 'Good';
    
    return { score: Math.max(0, score), status, issues };
  };

  const TabButton = ({ tab, label, isActive, onClick, icon }) => (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-md transform scale-105'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message.show && (
        <div className={`rounded-md p-4 transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(prev => ({ ...prev, show: false }))}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  message.type === 'success' 
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' 
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => fetchAnalytics()}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Analytics Dashboard
            </h1>
            <p className="text-indigo-100 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Comprehensive system insights and performance metrics
            </p>
            <div className="flex items-center mt-3 text-sm text-indigo-200 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-flex">
              <svg className="w-4 h-4 mr-1.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="flex items-center px-4 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              <svg 
                className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            
            <div className="flex space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-white hover:text-indigo-100 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <span className="text-lg mr-2">📊</span>
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  activeTab === 'reports'
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-white hover:text-indigo-100 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <span className="text-lg mr-2">📈</span>
                Reports
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  activeTab === 'trends'
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-white hover:text-indigo-100 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <span className="text-lg mr-2">📉</span>
                Trends
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab - Enhanced */}
      {activeTab === 'overview' && (
        <>
          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold">{formatNumber(stats?.userStats?.totalUsers)}</p>
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-blue-200 text-xs">
                      {formatNumber((stats?.userStats?.studentCount || 0) + (stats?.userStats?.facultyCount || 0))} active
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Activities</p>
                  <p className="text-3xl font-bold">{formatNumber(stats?.activityStats?.totalActivities)}</p>
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                    <span className="text-green-200 text-xs">
                      {getGrowthPercentage(stats?.activityStats?.approvedActivities, stats?.activityStats?.totalActivities)}% approved
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Reviews</p>
                  <p className="text-3xl font-bold">{formatNumber(stats?.activityStats?.pendingActivities)}</p>
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-200 text-xs">
                      {stats?.activityStats?.pendingActivities > 0 ? 'Needs attention' : 'All caught up!'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Departments</p>
                  <p className="text-3xl font-bold">{formatNumber(stats?.departmentStats?.length)}</p>
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-purple-300 rounded-full mr-2"></div>
                    <span className="text-purple-200 text-xs">Active departments</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Department Performance */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Department Performance</h3>
                    <p className="text-xs text-gray-500">User distribution by department</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Top {Math.min(6, stats?.departmentStats?.length || 0)}
                </span>
              </div>
              <div className="space-y-4">
                {stats?.departmentStats?.slice(0, 6).map((dept, index) => {
                  const percentage = getGrowthPercentage(dept.count, stats.userStats.totalUsers);
                  const colors = [
                    { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                    { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
                    { bar: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
                    { bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
                    { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
                    { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' }
                  ];
                  const colorScheme = colors[index] || colors[colors.length - 1];
                  
                  return (
                    <div key={dept.department} className={`flex items-center p-3 rounded-lg ${colorScheme.bg} hover:shadow-sm transition-all duration-200`}>
                      <div className="flex-shrink-0 w-8">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${colorScheme.bar}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-shrink-0 w-32 ml-3">
                        <p className={`text-sm font-medium truncate ${colorScheme.text}`} title={dept.department}>
                          {dept.department}
                        </p>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${colorScheme.bar}`}
                            style={{ width: `${Math.max(5, percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-20 text-right">
                        <span className={`text-sm font-bold ${colorScheme.text}`}>{dept.count}</span>
                        <div className="text-xs text-gray-500">({percentage}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Activity Status Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Activity Status</h3>
                    <p className="text-xs text-gray-500">Approval distribution</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Distribution</span>
              </div>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-40 h-40">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${(stats?.activityStats?.approvedActivities / Math.max(stats?.activityStats?.totalActivities, 1)) * 439.82} 439.82`}
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {getGrowthPercentage(stats?.activityStats?.approvedActivities, stats?.activityStats?.totalActivities)}%
                        </div>
                        <div className="text-sm text-gray-500">Approved</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { 
                      status: 'Approved', 
                      count: stats?.activityStats?.approvedActivities || 0, 
                      color: 'bg-green-500', 
                      textColor: 'text-green-700',
                      bgColor: 'bg-green-50'
                    },
                    { 
                      status: 'Pending', 
                      count: stats?.activityStats?.pendingActivities || 0, 
                      color: 'bg-yellow-500', 
                      textColor: 'text-yellow-700',
                      bgColor: 'bg-yellow-50'
                    },
                    { 
                      status: 'Rejected', 
                      count: stats?.activityStats?.rejectedActivities || 0, 
                      color: 'bg-red-500', 
                      textColor: 'text-red-700',
                      bgColor: 'bg-red-50'
                    }
                  ].map((item) => (
                    <div key={item.status} className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor} hover:shadow-sm transition-all duration-200`}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 ${item.color} rounded mr-3`}></div>
                        <span className={`text-sm font-medium ${item.textColor}`}>{item.status}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${item.textColor}`}>{formatNumber(item.count)}</span>
                        <div className="text-xs text-gray-500">
                          {getGrowthPercentage(item.count, stats?.activityStats?.totalActivities)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Top Performers */}
          {stats?.topStudents?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
                    <p className="text-xs text-gray-500">Leading students by credits</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Based on activity credits
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topStudents.slice(0, 3).map((student, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const gradients = [
                    'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600',
                    'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500',
                    'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800'
                  ];
                  
                  return (
                    <div key={student.id} className={`${gradients[index]} rounded-xl p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">{medals[index]}</span>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{student.totalCredits}</div>
                          <div className="text-sm opacity-90">credits</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-lg">{student.name}</div>
                        <div className="text-sm opacity-90">{student.studentId}</div>
                        <div className="text-sm opacity-75">{student.department}</div>
                        <div className="flex items-center mt-3 pt-3 border-t border-white border-opacity-30">
                          <svg className="w-4 h-4 mr-2 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs opacity-75">{student.activityCount} activities</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New System Health Dashboard */}
          {(() => {
            const health = getSystemHealth();
            return (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">System Health</h3>
                      <p className="text-xs text-gray-500">Overall platform performance</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      health.score >= 85 ? 'bg-green-500' : 
                      health.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      health.score >= 85 ? 'text-green-700' : 
                      health.score >= 70 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {health.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{health.score}</div>
                    <div className="text-sm text-green-600">Health Score</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">High</div>
                    <div className="text-sm text-blue-600">Performance</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">Secure</div>
                    <div className="text-sm text-purple-600">Data Protection</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">Live</div>
                    <div className="text-sm text-orange-600">Monitoring</div>
                  </div>
                </div>

                {health.issues.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Areas for Improvement:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {health.issues.map((issue, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Enhanced Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Generate Custom Reports</h3>
                <p className="text-xs text-gray-500">Export detailed activity data</p>
              </div>
            </div>
            <div>
              
              {/* Quick Date Range Buttons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date Ranges</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Last 3 Months', months: 3 },
                    { label: 'Last 6 Months', months: 6 },
                    { label: 'Last Year', months: 12 },
                    { label: 'Last 2 Years', months: 24 }
                  ].map(({ label, months }) => (
                    <button
                      key={months}
                      onClick={() => setQuickDateRange(months)}
                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={generateReport}
                    disabled={reportLoading || !dateRange.startDate || !dateRange.endDate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {reportLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H4a2 2 0 01-2-2v-1a2 2 0 012-2h1a4 4 0 004-4v-2" />
                        </svg>
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={downloadCSVReport}
                    disabled={csvDownloading || !dateRange.startDate || !dateRange.endDate}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {csvDownloading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {reports && (
              <div className="space-y-6">
                {/* Enhanced Report Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{formatNumber(reports.summary.totalActivities)}</div>
                        <div className="text-sm text-blue-700">Total Activities</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{formatNumber(reports.summary.totalCredits)}</div>
                        <div className="text-sm text-green-700">Total Credits</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.keys(reports.summary.departmentBreakdown).length}
                        </div>
                        <div className="text-sm text-purple-700">Departments</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {Object.keys(reports.summary.activityTypeBreakdown).length}
                        </div>
                        <div className="text-sm text-yellow-700">Activity Types</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Department Breakdown */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Department Breakdown
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(reports.summary.departmentBreakdown).map(([dept, count]) => (
                      <div key={dept} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="font-bold text-2xl text-gray-800">{count}</div>
                        <div className="text-sm text-gray-600 truncate" title={dept}>{dept}</div>
                        <div className="text-xs text-gray-500 mt-1">activities</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Activity Types */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    Activity Categories
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(reports.summary.activityTypeBreakdown).map(([type, count]) => (
                      <div key={type} className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 text-center border border-green-200 hover:shadow-md transition-all duration-200">
                        <div className="font-bold text-2xl text-green-800">{count}</div>
                        <div className="text-sm text-green-700 capitalize truncate" title={type.replace('_', ' ')}>
                          {type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-green-600 mt-1">submissions</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Trends Tab */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">System Trends & Insights</h3>
              <p className="text-xs text-gray-500">Performance analysis and metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced User Distribution */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                User Distribution
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Students', count: stats?.userStats?.studentCount || 0, color: 'bg-blue-600' },
                  { label: 'Faculty', count: stats?.userStats?.facultyCount || 0, color: 'bg-green-600' },
                  { label: 'Admins', count: stats?.userStats?.adminCount || 0, color: 'bg-purple-600' }
                ].map((item) => {
                  const percentage = getGrowthPercentage(item.count, stats?.userStats?.totalUsers);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <span className="text-gray-900 font-bold">
                          {formatNumber(item.count)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${item.color} h-3 rounded-full transition-all duration-1000 shadow-sm`} 
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Activity Insights */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Activity Insights
              </h4>
              <div className="space-y-4">
                {[
                  {
                    label: 'Approval Rate',
                    value: getGrowthPercentage(stats?.activityStats?.approvedActivities, stats?.activityStats?.totalActivities),
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    icon: (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )
                  },
                  {
                    label: 'Pending Rate',
                    value: getGrowthPercentage(stats?.activityStats?.pendingActivities, stats?.activityStats?.totalActivities),
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-100',
                    icon: (
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                  {
                    label: 'Rejection Rate',
                    value: getGrowthPercentage(stats?.activityStats?.rejectedActivities, stats?.activityStats?.totalActivities),
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    icon: (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )
                  }
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200`}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center mr-3`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className={`font-bold text-lg ${item.color}`}>
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced System Health */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
              System Performance Metrics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="font-bold text-xl text-green-600">Excellent</div>
                <div className="text-sm text-gray-600">System Status</div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="font-bold text-xl text-blue-600">High</div>
                <div className="text-sm text-gray-600">Performance</div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="font-bold text-xl text-purple-600">Secure</div>
                <div className="text-sm text-gray-600">Data Protection</div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="font-bold text-xl text-orange-600">Real-time</div>
                <div className="text-sm text-gray-600">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
