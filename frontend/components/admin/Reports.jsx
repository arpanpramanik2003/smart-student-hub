'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Management Studies',
  'Computer Applications',
];

const NAAC_CRITERIA_LIST = [
  { id: 'Criterion 1', name: 'Criterion 1: Curricular Aspects' },
  { id: 'Criterion 2', name: 'Criterion 2: Teaching-Learning & Evaluation' },
  { id: 'Criterion 3', name: 'Criterion 3: Research, Innovations & Extension' },
  { id: 'Criterion 4', name: 'Criterion 4: Infrastructure & Learning Resources' },
  { id: 'Criterion 5', name: 'Criterion 5: Student Support & Progression' },
  { id: 'Criterion 6', name: 'Criterion 6: Governance, Leadership & Management' },
  { id: 'Criterion 7', name: 'Criterion 7: Institutional Values & Best Practices' },
];

const ACADEMIC_YEARS = [
  { value: 'all', label: 'All Academic Years' },
  { value: '2025-2026', label: 'AY 2025-26 (July 2025 – June 2026)' },
  { value: '2024-2025', label: 'AY 2024-25 (July 2024 – June 2025)' },
  { value: '2023-2024', label: 'AY 2023-24 (July 2023 – June 2024)' },
  { value: '2022-2023', label: 'AY 2022-23 (July 2022 – June 2023)' },
];

const Reports = ({ user, token, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('naac'); // 'naac' | 'general'
  
  // NAAC Report State
  const [naacFilters, setNaacFilters] = useState({
    academicYear: 'all',
    department: 'All Departments',
    criterion: 'all',
  });
  const [naacReport, setNaacReport] = useState(null);
  const [naacLoading, setNaacLoading] = useState(false);
  const [naacError, setNaacError] = useState('');

  // General Report State
  const [generalFilters, setGeneralFilters] = useState({
    startDate: '',
    endDate: '',
    format: 'json',
    status: 'all'
  });
  const [generalReport, setGeneralReport] = useState(null);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const [csvDownloading, setCsvDownloading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  // Initialize dates for general report
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    setGeneralFilters(prev => ({
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

  // Fetch NAAC Report from backend query aggregations
  const fetchNAACReport = useCallback(async () => {
    setNaacLoading(true);
    setNaacError('');

    try {
      const params = {};
      if (naacFilters.academicYear !== 'all') params.academicYear = naacFilters.academicYear;
      if (naacFilters.department !== 'All Departments') params.department = naacFilters.department;
      if (naacFilters.criterion !== 'all') params.criterion = naacFilters.criterion;

      const data = await adminAPI.getNAACReports(params);
      setNaacReport(data);
      showSuccessMessage('NAAC / NIRF institutional report computed cleanly from DB aggregations.');
    } catch (err) {
      console.error('NAAC report error:', err);
      setNaacError(err.message || 'Failed to generate NAAC report');
      showErrorMessage(`Error generating NAAC report: ${err.message}`);
    } finally {
      setNaacLoading(false);
    }
  }, [naacFilters, showErrorMessage, showSuccessMessage]);

  // Initial load for NAAC report
  useEffect(() => {
    fetchNAACReport();
  }, [fetchNAACReport]);

  // Fetch General Report
  const handleGenerateGeneralReport = useCallback(async () => {
    if (!generalFilters.startDate || !generalFilters.endDate) {
      showErrorMessage('Please select both start and end dates.');
      return;
    }

    if (new Date(generalFilters.startDate) > new Date(generalFilters.endDate)) {
      showErrorMessage('Start date cannot be later than end date.');
      return;
    }

    setGeneralLoading(true);
    setGeneralError('');
    
    try {
      const data = await adminAPI.getReports(generalFilters);
      setGeneralReport(data);
      showSuccessMessage('Activity stream report generated successfully!');
    } catch (error) {
      console.error('Report generation error:', error);
      setGeneralError(error.message || 'Failed to generate report');
      showErrorMessage(`Error generating report: ${error.message}`);
    } finally {
      setGeneralLoading(false);
    }
  }, [generalFilters, showErrorMessage, showSuccessMessage]);

  // Download CSV for NAAC Report
  const handleDownloadNAACCSV = useCallback(async () => {
    setCsvDownloading(true);
    try {
      const authToken = localStorage.getItem('token') || token;
      const paramsObj = { type: 'naac', format: 'csv' };
      if (naacFilters.academicYear !== 'all') paramsObj.academicYear = naacFilters.academicYear;
      if (naacFilters.department !== 'All Departments') paramsObj.department = naacFilters.department;
      if (naacFilters.criterion !== 'all') paramsObj.criterion = naacFilters.criterion;

      const params = new URLSearchParams(paramsObj);
      const url = `${API_BASE_URL}/api/admin/reports?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', `NAAC-NIRF-Institutional-Report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showSuccessMessage('NAAC/NIRF CSV report exported successfully!');
    } catch (err) {
      console.error('CSV export error:', err);
      showErrorMessage(`Error downloading CSV: ${err.message}`);
    } finally {
      setCsvDownloading(false);
    }
  }, [naacFilters, token, showErrorMessage, showSuccessMessage]);

  // Printable PDF Handler
  const handlePrintPDF = useCallback(() => {
    window.print();
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans print:bg-white print:text-black">
      {/* Toast Notification */}
      {message.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all print:hidden ${
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

      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 print:border-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 print:hidden">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Institutional Accreditation Suite
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                NAAC / NIRF Aggregation Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1 print:text-xl print:text-black">
              NAAC / NIRF Institutional Reports & Analytics
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 print:text-black">
              Verifiable query-driven credit aggregations for higher education institution accreditation bodies
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setActiveTab('naac')}
              className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition-colors ${
                activeTab === 'naac'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              NAAC / NIRF Report
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition-colors ${
                activeTab === 'general'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Raw Activity Log
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: NAAC / NIRF INSTITUTIONAL REPORT */}
      {activeTab === 'naac' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 print:hidden">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Institutional Filters (Query Parameters)
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live DB Aggregation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="block mb-1 text-zinc-500">Academic Year</label>
                <select
                  value={naacFilters.academicYear}
                  onChange={(e) => setNaacFilters(prev => ({ ...prev, academicYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  {ACADEMIC_YEARS.map(y => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Department / Program</label>
                <select
                  value={naacFilters.department}
                  onChange={(e) => setNaacFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">NAAC Criterion</label>
                <select
                  value={naacFilters.criterion}
                  onChange={(e) => setNaacFilters(prev => ({ ...prev, criterion: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Criteria (1–7)</option>
                  {NAAC_CRITERIA_LIST.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={fetchNAACReport}
                  disabled={naacLoading}
                  className="flex-1 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-colors disabled:opacity-50"
                >
                  {naacLoading ? 'Computing...' : 'Update Report'}
                </button>
                <button
                  onClick={handleDownloadNAACCSV}
                  disabled={csvDownloading}
                  className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs font-mono hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  title="Export CSV raw data"
                >
                  CSV
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="px-3 py-2 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium text-xs font-mono hover:bg-indigo-100 transition-colors"
                  title="Print / Save PDF Report"
                >
                  Print PDF
                </button>
              </div>
            </div>
          </div>

          {/* Error View */}
          {naacError && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-4 font-mono text-xs text-rose-700 dark:text-rose-300 print:hidden">
              <p className="font-bold uppercase">[Report Computing Error]</p>
              <p>{naacError}</p>
            </div>
          )}

          {/* Loading Indicator */}
          {naacLoading && (
            <div className="p-12 text-center font-mono text-xs text-zinc-500 print:hidden">
              <LoadingSpinner size="lg" message="Executing live SQL aggregation queries for accreditation report..." />
            </div>
          )}

          {/* NAAC REPORT CONTENT DISPLAY */}
          {naacReport && !naacLoading && (
            <div className="space-y-6">
              {/* Data Safeguard Indicator */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    <strong>Data Integrity Safeguard:</strong> Computed strictly from final <strong>approved</strong> activities. Unapproved & pending submissions excluded.
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Calculated as of: {formatDate(naacReport.metadata?.calculatedAt)} {new Date(naacReport.metadata?.calculatedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* KPI Aggregate Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <span className="text-[10px] uppercase text-zinc-500">TOTAL APPROVED ACTIVITIES</span>
                  <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50 my-1">
                    {formatNumber(naacReport.summary?.totalApprovedActivities)}
                  </p>
                  <p className="text-[10px] text-zinc-500">Stage 2 Final Sign-Off</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <span className="text-[10px] uppercase text-zinc-500">TOTAL ACCREDITED CREDITS</span>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 my-1">
                    {formatNumber(naacReport.summary?.totalApprovedCredits)}
                  </p>
                  <p className="text-[10px] text-zinc-500">Institutional points awarded</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <span className="text-[10px] uppercase text-zinc-500">PARTICIPATING STUDENTS</span>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 my-1">
                    {formatNumber(naacReport.participationStats?.activeParticipatingStudents)}
                    <span className="text-sm font-normal text-zinc-400"> / {formatNumber(naacReport.participationStats?.totalEnrolledStudents)}</span>
                  </p>
                  <p className="text-[10px] text-zinc-500">Active enrolled students with ≥1 activity</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <span className="text-[10px] uppercase text-zinc-500">INSTITUTIONAL PARTICIPATION RATIO</span>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 my-1">
                    {naacReport.participationStats?.participationRatio}%
                  </p>
                  <p className="text-[10px] text-zinc-500">Ratio = (Participating / Enrolled) × 100</p>
                </div>
              </div>

              {/* Section 1: Criterion-Wise Summary Table */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    1. NAAC Criterion-Wise Summary (Approved Activities Only)
                  </span>
                  <span className="text-zinc-500 text-[10px] uppercase">Table 1.1</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5 font-medium">NAAC Criterion</th>
                        <th className="px-4 py-2.5 font-medium text-center">Approved Activities</th>
                        <th className="px-4 py-2.5 font-medium text-right">Total Credits Earned</th>
                        <th className="px-4 py-2.5 font-medium text-center">Participating Students</th>
                        <th className="px-4 py-2.5 font-medium text-right">% of Total Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {naacReport.criterionSummary && naacReport.criterionSummary.length > 0 ? (
                        naacReport.criterionSummary.map((item) => {
                          const totalCreds = naacReport.summary?.totalApprovedCredits || 1;
                          const pct = ((item.totalCredits / totalCreds) * 100).toFixed(1);
                          return (
                            <tr key={item.criterion} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.criterion}
                              </td>
                              <td className="px-4 py-2.5 text-center font-bold text-zinc-900 dark:text-zinc-100">
                                {formatNumber(item.totalActivities)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                {item.totalCredits.toFixed(1)}
                              </td>
                              <td className="px-4 py-2.5 text-center text-zinc-700 dark:text-zinc-300">
                                {formatNumber(item.participatingStudents)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-zinc-500">
                                {pct}%
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-zinc-500">
                            No approved activities found matching selected query parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 font-bold">
                      <tr>
                        <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">TOTAL INSTITUTIONAL AGGREGATE</td>
                        <td className="px-4 py-2.5 text-center">{formatNumber(naacReport.summary?.totalApprovedActivities)}</td>
                        <td className="px-4 py-2.5 text-right text-indigo-600 dark:text-indigo-400">{naacReport.summary?.totalApprovedCredits?.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-center text-emerald-600 dark:text-emerald-400">{formatNumber(naacReport.participationStats?.activeParticipatingStudents)}</td>
                        <td className="px-4 py-2.5 text-right">100.0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Section 2: Department-Wise Breakdown */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    2. Department / Program-Wise Criterion Segmentation
                  </span>
                  <span className="text-zinc-500 text-[10px] uppercase">Table 1.2</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5 font-medium">Department</th>
                        <th className="px-4 py-2.5 font-medium">NAAC Criterion</th>
                        <th className="px-4 py-2.5 font-medium text-center">Approved Activities</th>
                        <th className="px-4 py-2.5 font-medium text-right">Credits Earned</th>
                        <th className="px-4 py-2.5 font-medium text-center">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {naacReport.departmentBreakdown && naacReport.departmentBreakdown.length > 0 ? (
                        naacReport.departmentBreakdown.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                              {row.department}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                              {row.criterion}
                            </td>
                            <td className="px-4 py-2.5 text-center font-semibold text-zinc-900 dark:text-zinc-100">
                              {row.totalActivities}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {row.totalCredits.toFixed(1)}
                            </td>
                            <td className="px-4 py-2.5 text-center text-zinc-500">
                              {row.participatingStudents}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-zinc-500">
                            No department breakdown data available for current selection.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3 & 4 Grid: YoY Trend & Activity Type Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
                {/* Year-over-Year Trend Visualization */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      3. Year-over-Year (YoY) Growth Trend
                    </h3>
                    <span className="text-[10px] text-zinc-500">Historical Comparison</span>
                  </div>

                  <div className="space-y-4">
                    {naacReport.yoyTrend && naacReport.yoyTrend.length > 0 ? (
                      naacReport.yoyTrend.map((y) => {
                        const maxCredits = Math.max(...naacReport.yoyTrend.map(t => t.totalCredits || 1), 1);
                        const pct = Math.min(100, Math.max(10, Math.round((y.totalCredits / maxCredits) * 100)));
                        return (
                          <div key={y.academicYear} className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{y.academicYear}</span>
                              <div className="flex items-center space-x-3 text-[11px]">
                                <span>{y.totalActivities} activities</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{y.totalCredits} credits</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{y.participatingStudents} students</span>
                              </div>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-zinc-500 text-xs text-center py-4">No historical trend data recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Activity Type Distribution within Criteria */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      4. Activity-Type Distribution
                    </h3>
                    <span className="text-[10px] text-zinc-500">Per Criterion Segment</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1 text-xs">
                    {naacReport.typeDistribution && naacReport.typeDistribution.length > 0 ? (
                      naacReport.typeDistribution.map((item, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                            <span>{item.criterion}</span>
                            <span className="uppercase text-zinc-500 font-bold">{item.activityType.replace('_', ' ')}</span>
                          </div>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {item.activityCount} <span className="text-xs font-normal text-zinc-500">activities</span>
                          </p>
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {item.totalCredits} total credits
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-2 text-zinc-500 text-xs text-center py-4">No type distribution data available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RAW ACTIVITY LOG & GENERAL AUDIT */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Raw Activity Stream Query Window</span>
              <span className="text-xs font-mono text-zinc-400">Date Range Filter</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="block mb-1 text-zinc-500">Start Date *</label>
                <input
                  type="date"
                  value={generalFilters.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setGeneralFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">End Date *</label>
                <input
                  type="date"
                  value={generalFilters.endDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setGeneralFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Status Filter</label>
                <select
                  value={generalFilters.status}
                  onChange={(e) => setGeneralFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Submissions</option>
                  <option value="approved">Approved Only</option>
                  <option value="pending_mentor">Pending Mentor</option>
                  <option value="mentor_approved">Mentor Approved</option>
                  <option value="rejected">Rejected Only</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleGenerateGeneralReport}
                  disabled={generalLoading}
                  className="flex-1 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-colors disabled:opacity-50"
                >
                  {generalLoading ? 'Querying...' : 'Fetch Activity Log'}
                </button>
              </div>
            </div>
          </div>

          {generalReport && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Activity Stream Audit Log ({generalReport.activities?.length || 0} items)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5">Title</th>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Department</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5 text-right">Credits</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {generalReport.activities?.map((a) => (
                      <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{a.title}</td>
                        <td className="px-4 py-2.5">{a.student?.name}</td>
                        <td className="px-4 py-2.5">{a.student?.department || 'N/A'}</td>
                        <td className="px-4 py-2.5 capitalize">{a.type}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">{a.credits}</td>
                        <td className="px-4 py-2.5 capitalize">{a.status}</td>
                        <td className="px-4 py-2.5 text-right text-zinc-500">{formatDate(a.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
