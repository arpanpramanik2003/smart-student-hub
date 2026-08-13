'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const AnalyticsStatCard = React.memo(({ label, value, subtitle, showStatusDot, isPending }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
        {showStatusDot && (
          <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        )}
        <span>{label}</span>
      </span>
      <p className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
        {value}
      </p>
      <p className="text-xs font-mono text-zinc-500">
        {subtitle}
      </p>
    </div>
  );
});
AnalyticsStatCard.displayName = 'AnalyticsStatCard';

const CategoryRow = React.memo(({ category, index, percentage, formatNumber }) => {
  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="truncate max-w-[240px] text-zinc-800 dark:text-zinc-200" title={category.programCategory}>
          #{index + 1} {category.programCategory}
        </span>
        <div className="flex items-center space-x-2">
          <span className="font-bold text-zinc-950 dark:text-zinc-50">{formatNumber(category.count)}</span>
          <span className="text-[10px] text-zinc-400">({percentage}%)</span>
        </div>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(5, parseFloat(percentage)))}%` }}
        />
      </div>
    </div>
  );
});
CategoryRow.displayName = 'CategoryRow';

const Analytics = ({ user, token, onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csvDownloading, setCsvDownloading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [programBreakdown, setProgramBreakdown] = useState(null);

  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const fetchAnalytics = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    
    try {
      const data = await adminAPI.getStats();
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
  }, [showErrorMessage, showSuccessMessage]);

  const fetchProgramBreakdown = useCallback(async () => {
    try {
      const usersRes = await adminAPI.getUsers({ limit: 1000 });
      const users = usersRes.users || [];
      const programMap = {};
      const yearMap = {};
      const batchMap = {};
      
      users.forEach(u => {
        if (u.role === 'student' && u.programCategory) {
          if (!programMap[u.programCategory]) {
            programMap[u.programCategory] = {
              students: 0,
              programs: new Set(),
              specializations: new Set(),
              years: {},
              batches: {}
            };
          }
          
          programMap[u.programCategory].students++;
          if (u.program) programMap[u.programCategory].programs.add(u.program);
          if (u.specialization) programMap[u.programCategory].specializations.add(u.specialization);
          
          if (u.year) {
            programMap[u.programCategory].years[u.year] = 
              (programMap[u.programCategory].years[u.year] || 0) + 1;
            yearMap[u.year] = (yearMap[u.year] || 0) + 1;
          }
          
          if (u.admissionYear) {
            programMap[u.programCategory].batches[u.admissionYear] = 
              (programMap[u.programCategory].batches[u.admissionYear] || 0) + 1;
            batchMap[u.admissionYear] = (batchMap[u.admissionYear] || 0) + 1;
          }
        }
      });
      
      const facultyMap = {};
      users.forEach(u => {
        if (u.role === 'faculty' && u.programCategory) {
          facultyMap[u.programCategory] = (facultyMap[u.programCategory] || 0) + 1;
        }
      });
      
      Object.keys(programMap).forEach(key => {
        programMap[key].programCount = programMap[key].programs.size;
        programMap[key].specializationCount = programMap[key].specializations.size;
        programMap[key].faculty = facultyMap[key] || 0;
        delete programMap[key].programs;
        delete programMap[key].specializations;
      });
      
      setProgramBreakdown({
        byCategory: programMap,
        byYear: yearMap,
        byBatch: batchMap,
        totalStudents: users.filter(u => u.role === 'student').length || 0,
        totalFaculty: users.filter(u => u.role === 'faculty').length || 0
      });
    } catch (error) {
      console.error('Program breakdown fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchProgramBreakdown();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, [fetchAnalytics, fetchProgramBreakdown]);

  const downloadCSVReport = useCallback(async () => {
    try {
      setCsvDownloading(true);
      const authToken = localStorage.getItem('token') || token;
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const params = new URLSearchParams({
        format: 'csv'
      });
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const url = `${API_BASE_URL}/api/admin/reports?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const downloadUrl = URL.createObjectURL(blob);
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', `analytics-report-${dateRange.startDate || 'all'}-to-${dateRange.endDate || 'now'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
      
      showSuccessMessage('Analytics CSV report downloaded successfully!');
    } catch (error) {
      console.error('CSV download error:', error);
      showErrorMessage(`Error downloading CSV: ${error.message}`);
    } finally {
      setCsvDownloading(false);
    }
  }, [dateRange, token, showErrorMessage, showSuccessMessage]);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  const getGrowthPercentage = useCallback((current, total) => {
    if (!total || total === 0) return '0.0';
    return ((current / total) * 100).toFixed(1);
  }, []);

  const systemHealth = useMemo(() => {
    let score = 100;
    const issues = [];

    const pending = stats?.activityStats?.pendingActivities || 0;
    const total = stats?.activityStats?.totalActivities || 0;
    if (total > 0 && (pending / total) > 0.3) {
      score -= 15;
      issues.push('High pending review queue ratio (>30%)');
    }

    if (!stats?.userStats?.facultyCount || stats.userStats.facultyCount === 0) {
      score -= 20;
      issues.push('No faculty accounts registered for evaluation');
    }

    return {
      score: Math.max(0, score),
      status: score >= 85 ? 'Optimal' : score >= 65 ? 'Warning' : 'Critical',
      issues
    };
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="space-y-6 font-sans">
        <LoadingSpinner size="lg" text="Loading Institutional Intelligence & Analytics Console..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Message */}
      {message.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.type === 'success' ? '✓ ' : '✕ '}{message.text}</span>
            <button
              onClick={() => setMessage(prev => ({ ...prev, show: false }))}
              className="ml-4 underline hover:opacity-80"
            >
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-4">
          <div className="flex items-start">
            <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-600 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-xs font-mono font-bold uppercase text-rose-800 dark:text-rose-300">Analytics Error</h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
              <button 
                onClick={() => fetchAnalytics()}
                className="mt-2 text-xs font-mono text-rose-700 dark:text-rose-300 underline"
              >
                [Retry Request]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                Institutional Intelligence Console
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Last Sync: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Analytics & Performance Insights
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Comprehensive institutional metrics, NAAC Criteria compliance, and evaluation ratios
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

            <button
              onClick={downloadCSVReport}
              disabled={csvDownloading}
              className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {csvDownloading ? 'Exporting...' : 'Export Official CSV'}
            </button>
          </div>
        </div>

        {/* Date Filter & Tab Switcher Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 font-mono text-xs gap-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'overview'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              Overview Metrics
            </button>
            <button
              onClick={() => setActiveTab('naac')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'naac'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              NAAC Compliance Targets
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-3 py-1.5 rounded transition-all ${
                activeTab === 'programs'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              Program Ratios
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-zinc-400">Date Range:</span>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsStatCard
              label="SYSTEM ACCOUNTS"
              value={formatNumber(stats?.userStats?.totalUsers)}
              subtitle={`${formatNumber((stats?.userStats?.studentCount || 0) + (stats?.userStats?.facultyCount || 0))} active student & faculty`}
            />

            <AnalyticsStatCard
              label="SUBMITTED ACTIVITIES"
              value={formatNumber(stats?.activityStats?.totalActivities)}
              subtitle={`${getGrowthPercentage(stats?.activityStats?.approvedActivities, stats?.activityStats?.totalActivities)}% approval rate`}
            />

            <AnalyticsStatCard
              label="PENDING EVALUATION"
              value={formatNumber(stats?.activityStats?.pendingActivities)}
              subtitle={`Stage 1: ${stats?.activityStats?.pendingMentor || 0} • Stage 2: ${stats?.activityStats?.pendingAdmin || 0}`}
              showStatusDot={true}
              isPending={stats?.activityStats?.pendingActivities > 0}
            />

            <AnalyticsStatCard
              label="DOMAINS & CATEGORIES"
              value={formatNumber(stats?.programCategoryStats?.length)}
              subtitle="Academic disciplines"
            />
          </div>

          {/* Performance & Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Program Category Performance */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4 font-mono">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Academic Domain Volume
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Registered users by program domain
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Top Domains
                </span>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {stats?.programCategoryStats?.slice(0, 6).map((category, index) => {
                  const percentage = getGrowthPercentage(category.count, stats.userStats.totalUsers);
                  return (
                    <CategoryRow
                      key={category.programCategory}
                      category={category}
                      index={index}
                      percentage={percentage}
                      formatNumber={formatNumber}
                    />
                  );
                })}
              </div>
            </div>

            {/* Evaluation Pipeline Ratio */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Multi-Stage Evaluation Pipeline
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Breakdown by approval workflow status
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Pipeline Ratio
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {[
                  { 
                    status: 'Approved & Granted', 
                    count: stats?.activityStats?.approvedActivities || 0, 
                    color: 'bg-emerald-500'
                  },
                  { 
                    status: 'Stage 1 (Pending Mentor)', 
                    count: stats?.activityStats?.pendingMentor || 0, 
                    color: 'bg-amber-500'
                  },
                  { 
                    status: 'Stage 2 (Pending Admin)', 
                    count: stats?.activityStats?.pendingAdmin || 0, 
                    color: 'bg-sky-500'
                  },
                  { 
                    status: 'Rejected', 
                    count: stats?.activityStats?.rejectedActivities || 0, 
                    color: 'bg-rose-500'
                  }
                ].map((item) => {
                  const percentage = getGrowthPercentage(item.count, stats?.activityStats?.totalActivities);
                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-950 dark:text-zinc-50">{formatNumber(item.count)}</span>
                          <span className="text-[10px] text-zinc-400">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[4px] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Performers Table */}
          {stats?.topStudents?.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 font-mono">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                    Leading Student Participants
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Highest earned activity credits across institution
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Top Credits
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                {stats.topStudents.slice(0, 3).map((student, index) => (
                  <div key={student.id} className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-zinc-500">#{index + 1} RANK</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{student.totalCredits} Credits</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{student.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">ID: {student.studentId}</p>
                    <p className="text-[10px] text-zinc-400 truncate mt-1">{student.program || student.department || 'N/A'}</p>
                    <p className="text-[10px] text-zinc-500 mt-2 border-t border-zinc-200 dark:border-zinc-700/60 pt-1.5">
                      {student.activityCount} verified activities
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health Overview Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Console System Health</span>
              <span className="flex items-center space-x-1.5 font-mono text-xs">
                <span className={`w-2 h-2 rounded-full ${systemHealth.score >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="font-bold">{systemHealth.status} ({systemHealth.score}/100)</span>
              </span>
            </div>
            {systemHealth.issues.length > 0 ? (
              <div className="space-y-1 font-mono text-xs text-amber-700 dark:text-amber-400">
                {systemHealth.issues.map((issue, idx) => (
                  <p key={idx}>• {issue}</p>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400">✓ All system health parameters operating within optimal threshold.</p>
            )}
          </div>
        </>
      )}

      {/* NAAC COMPLIANCE TAB */}
      {activeTab === 'naac' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                  NAAC Accreditation Criterion Compliance
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Institutional activity mapping mapped to NAAC Criteria 1 through 7
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 font-bold">
                Target: 100% Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'Criterion 1', name: 'Curricular Aspects', weight: '20%', desc: 'Academic courses & co-curricular alignment', progress: 85 },
                { id: 'Criterion 2', name: 'Teaching-Learning & Evaluation', weight: '30%', desc: 'Student participation in workshops & seminars', progress: 92 },
                { id: 'Criterion 3', name: 'Research, Innovations & Extension', weight: '25%', desc: 'Hackathons, papers & patents published', progress: 78 },
                { id: 'Criterion 5', name: 'Student Support & Progression', weight: '25%', desc: 'Clubs, sports, leadership & achievements', progress: 95 }
              ].map(c => (
                <div key={c.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{c.id}: {c.name}</span>
                    <span className="text-[10px] text-zinc-500">Weight {c.weight}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">{c.desc}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-zinc-500">Compliance Rate</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROGRAM ANALYTICS TAB */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4">
              <span className="text-[10px] uppercase text-zinc-500">TOTAL STUDENTS</span>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 my-1">
                {formatNumber(programBreakdown?.totalStudents)}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4">
              <span className="text-[10px] uppercase text-zinc-500">TOTAL FACULTY</span>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 my-1">
                {formatNumber(programBreakdown?.totalFaculty)}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4">
              <span className="text-[10px] uppercase text-zinc-500">PROGRAM CATEGORIES</span>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 my-1">
                {Object.keys(programBreakdown?.byCategory || {}).length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-4">
              <span className="text-[10px] uppercase text-zinc-500">ACTIVE BATCHES</span>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 my-1">
                {Object.keys(programBreakdown?.byBatch || {}).length}
              </p>
            </div>
          </div>

          {/* Program Category Ratios & Workload Grid */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Category Faculty Ratios & Distribution
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Academic Ratios</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(programBreakdown?.byCategory || {}).map(([category, data]) => {
                const ratio = data.faculty > 0 ? (data.students / data.faculty).toFixed(1) : 'N/A';
                const isHighLoad = data.faculty > 0 && (data.students / data.faculty) > 25;
                
                return (
                  <div key={category} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">{category}</span>
                      <span className={`px-2 py-0.5 text-[10px] rounded border ${isHighLoad ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200'}`}>
                        {isHighLoad ? 'High Load' : 'Optimal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Students</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{data.students}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Faculty</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{data.faculty}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">S:F Ratio</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{ratio}:1</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
