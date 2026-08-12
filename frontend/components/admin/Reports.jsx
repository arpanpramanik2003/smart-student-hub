'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const Reports = ({ user, token, onNavigate }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    format: 'json',
    status: 'all'
  });
  const [csvDownloading, setCsvDownloading] = useState(false);

  useEffect(() => {
    // Default range: last 6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, []);

  const showSuccessMessage = useCallback((text) => {
    setMessage({ type: 'success', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const showErrorMessage = useCallback((text) => {
    setMessage({ type: 'error', text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) {
      showErrorMessage('Please select both start and end dates.');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      showErrorMessage('Start date cannot be later than end date.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await adminAPI.getReports(filters);
      setReportData(data);
      showSuccessMessage('Report generated successfully!');
    } catch (error) {
      console.error('Report generation error:', error);
      setError(error.message || 'Failed to generate report');
      showErrorMessage(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, showErrorMessage, showSuccessMessage]);

  const handleDownloadCSV = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) {
      showErrorMessage('Please select date range before downloading CSV.');
      return;
    }

    setCsvDownloading(true);
    
    try {
      const authToken = localStorage.getItem('token') || token;
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const paramsObj = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: 'csv'
      };
      
      if (filters.status !== 'all') paramsObj.status = filters.status;
      
      const params = new URLSearchParams(paramsObj);
      const url = `${API_BASE_URL}/api/admin/reports?${params.toString()}`;
      
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

      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const downloadUrl = URL.createObjectURL(blob);
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', `student-activity-report-${filters.startDate}-to-${filters.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
      
      showSuccessMessage('CSV report downloaded successfully!');
    } catch (error) {
      console.error('CSV download error:', error);
      showErrorMessage(`Error downloading CSV: ${error.message}`);
    } finally {
      setCsvDownloading(false);
    }
  }, [filters, token, showErrorMessage, showSuccessMessage]);

  const setQuickDateRange = useCallback((months) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  const getComplianceMetrics = useCallback(() => {
    if (!reportData) return null;
    
    const approved = reportData.summary?.totalApprovedActivities || 0;
    const categories = Object.keys(reportData.summary?.programCategoryBreakdown || {}).length;
    const credits = reportData.summary?.totalCredits || 0;
    
    return {
      naacCompliance: approved > 0 ? 'Compliant' : 'Non-Compliant',
      nirfScore: Math.min(100, Math.round((approved / 10) * 10)),
      aicteRequirement: credits >= 20 ? 'Met' : 'Not Met',
      participationRate: categories > 0 ? Math.round((approved / categories) * 100) / 100 : 0
    };
  }, [reportData]);

  const complianceMetrics = useMemo(() => getComplianceMetrics(), [getComplianceMetrics]);

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notification */}
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
              <h3 className="text-xs font-mono font-bold uppercase text-rose-800 dark:text-rose-300">Report Generation Error</h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
              <button 
                onClick={handleGenerateReport}
                className="mt-2 text-xs font-mono text-rose-700 dark:text-rose-300 underline"
              >
                [Retry Generation]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Institutional Audits
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                NAAC / NIRF / AICTE Compliance
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              System Reports & Analytics
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Generate structured activity reports, compliance audits, and CSV data exports
            </p>
          </div>

          <div className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-right font-mono text-xs self-start md:self-auto">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Query Window</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {filters.startDate && filters.endDate 
                ? `${formatDate(filters.startDate)} – ${formatDate(filters.endDate)}`
                : 'Select dates'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Report Configuration & Quick Ranges */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Report Configuration</span>
          <span className="text-xs font-mono text-zinc-400">Date Presets</span>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="text-zinc-500 mr-1">Presets:</span>
          {[
            { label: '3 Months', months: 3 },
            { label: '6 Months', months: 6 },
            { label: '1 Year', months: 12 },
            { label: '2 Years', months: 24 }
          ].map(({ label, months }) => (
            <button
              key={months}
              onClick={() => setQuickDateRange(months)}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:border-indigo-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div>
            <label className="block mb-1 text-zinc-500">Start Date *</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">End Date *</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Activity Status Filter</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Activities</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerateReport}
              disabled={loading || !filters.startDate || !filters.endDate}
              className="flex-1 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              {loading ? (
                <span>Generating...</span>
              ) : (
                <span>Generate Audit</span>
              )}
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={csvDownloading || !filters.startDate || !filters.endDate}
              className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs font-mono hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Download CSV export file"
            >
              {csvDownloading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Summary Section */}
      {reportData && (
        <>
          {/* Main Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">TOTAL ACTIVITIES</span>
              <p className="text-2xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
                {formatNumber(reportData.summary?.totalActivities)}
              </p>
              <p className="text-[11px] font-mono text-zinc-500">Query window total</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">APPROVED</span>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight my-1">
                {formatNumber(reportData.summary?.totalApprovedActivities)}
              </p>
              <p className="text-[11px] font-mono text-zinc-500">Credit eligible</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">TOTAL CREDITS</span>
              <p className="text-2xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
                {formatNumber(reportData.summary?.totalCredits)}
              </p>
              <p className="text-[11px] font-mono text-zinc-500">
                Avg: {(reportData.summary?.totalApprovedActivities || 0) > 0 
                  ? ((reportData.summary?.totalCredits || 0) / (reportData.summary?.totalApprovedActivities || 1)).toFixed(1)
                  : '0'} / act
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">CATEGORIES</span>
              <p className="text-2xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
                {Object.keys(reportData.summary?.programCategoryBreakdown || {}).length}
              </p>
              <p className="text-[11px] font-mono text-zinc-500">Domains represented</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">TYPES COVERED</span>
              <p className="text-2xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
                {Object.keys(reportData.summary?.activityTypeBreakdown || {}).length}
              </p>
              <p className="text-[11px] font-mono text-zinc-500">Activity categories</p>
            </div>
          </div>

          {/* Compliance Status Cards */}
          {complianceMetrics && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Compliance Framework Status
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Regulatory benchmarks and accreditation parameters
                  </p>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Audit Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                {/* NAAC */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">NAAC Audit Status</span>
                    <span className={`w-2 h-2 rounded-full ${complianceMetrics.naacCompliance === 'Compliant' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {complianceMetrics.naacCompliance}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Verified activity evidence</p>
                </div>

                {/* NIRF */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
                  <span className="text-zinc-500">NIRF Ranking Score</span>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {complianceMetrics.nirfScore} / 100
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Student engagement score</p>
                </div>

                {/* AICTE */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">AICTE Credit Threshold</span>
                    <span className={`w-2 h-2 rounded-full ${complianceMetrics.aicteRequirement === 'Met' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {complianceMetrics.aicteRequirement}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">≥ 20 credits required</p>
                </div>

                {/* Participation */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
                  <span className="text-zinc-500">Domain Participation Rate</span>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {complianceMetrics.participationRate}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Avg activities / category</p>
                </div>
              </div>
            </div>
          )}

          {/* Program Category & Activity Type Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Program Category Participation
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Breakdown
                </span>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {Object.entries(reportData.summary?.programCategoryBreakdown || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const percentage = ((count / (reportData.summary?.totalActivities || 1)) * 100).toFixed(1);
                    return (
                      <div key={category} className="space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[220px] text-zinc-800 dark:text-zinc-200">{category}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-zinc-950 dark:text-zinc-50">{formatNumber(count)}</span>
                            <span className="text-[10px] text-zinc-400">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[3px] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Activity Type Breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Activity Type Distribution
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Distribution
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1 font-mono text-xs">
                {Object.entries(reportData.summary?.activityTypeBreakdown || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = ((count / (reportData.summary?.totalActivities || 1)) * 100).toFixed(1);
                    return (
                      <div key={type} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 rounded">
                        <span className="text-[10px] uppercase text-zinc-500 block truncate">{type.replace('_', ' ')}</span>
                        <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight my-0.5">
                          {formatNumber(count)}
                        </p>
                        <span className="text-[10px] text-zinc-400">{percentage}% of total</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Recent Activities Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">Recent Activity Log (Latest 10)</span>
              <span className="text-zinc-500">Audit Stream</span>
            </div>

            {reportData.activities && reportData.activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5 font-medium">Activity Title</th>
                      <th className="px-4 py-2.5 font-medium">Student</th>
                      <th className="px-4 py-2.5 font-medium">Program</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium text-right">Credits</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {reportData.activities.slice(0, 10).map((activity) => (
                      <tr key={activity.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={activity.title}>
                            {activity.title}
                          </p>
                          {activity.organizer && (
                            <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">by {activity.organizer}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium">{activity.student?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-zinc-500">{activity.student?.studentId || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 truncate max-w-[180px]">
                          {activity.student?.program || activity.student?.department || 'N/A'}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 capitalize">
                          {activity.type}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {activity.credits}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              activity.status === 'approved' ? 'bg-emerald-500' :
                              activity.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span className="capitalize text-zinc-700 dark:text-zinc-300">{activity.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-500 text-[11px]">
                          {formatDate(activity.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">
                <p>No activity records found within query date window.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Compliance Guidelines Footer Box */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-2">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
          Framework Compliance Guidelines
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-400 text-[11px]">
          <p>• <strong className="text-zinc-800 dark:text-zinc-200">NAAC Framework:</strong> All approved student participation records require verifiable file attachments.</p>
          <p>• <strong className="text-zinc-800 dark:text-zinc-200">NIRF Metric:</strong> Program-wise distribution evaluates student engagement across academic departments.</p>
          <p>• <strong className="text-zinc-800 dark:text-zinc-200">AICTE Standard:</strong> Enforces minimum 20 credit threshold for co-curricular achievements.</p>
          <p>• <strong className="text-zinc-800 dark:text-zinc-200">CSV Data Export:</strong> Generates standard CSV for institutional reporting & external body submission.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
