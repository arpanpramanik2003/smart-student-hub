'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../utils/api';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const AdminDashboard = ({ user, token, onNavigate }) => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await adminAPI.getStats();
      setStats(data);
      setError('');
    } catch (error) {
      console.error('Admin stats fetch error:', error);
      setError(error.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleAddUser = useCallback(() => router.push('/admin/users'), [router]);
  const handleGenerateReport = useCallback(() => router.push('/admin/reports'), [router]);
  const handleViewAnalytics = useCallback(() => router.push('/admin/analytics'), [router]);
  const handleRefreshData = useCallback(() => fetchStats(true), [fetchStats]);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  const getPercentage = useCallback((part, total) => {
    if (!total || total === 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
  }, []);

  const approvalRate = useMemo(() => {
    const total = stats?.activityStats?.totalActivities || 0;
    const approved = stats?.activityStats?.approvedActivities || 0;
    return total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
  }, [stats?.activityStats]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <CardSkeleton cards={4} />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" text="Fetching console statistics..." />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md p-4">
        <div className="flex items-start">
          <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-600 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-xs font-mono font-bold uppercase text-rose-800 dark:text-rose-300">Console Load Error</h3>
            <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
            <button 
              onClick={() => fetchStats()}
              className="mt-2 text-xs font-mono text-rose-700 dark:text-rose-300 hover:underline focus:outline-none"
            >
              [Retry Request]
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = stats?.activityStats?.pendingActivities || 0;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Warning banner */}
      {error && stats && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-md p-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-800 dark:text-amber-300">⚠️ Warning: Outdated stats cached ({error})</span>
            <button 
              onClick={() => fetchStats(true)}
              className="text-amber-700 dark:text-amber-400 underline hover:text-amber-900"
            >
              [Sync Now]
            </button>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                System Console
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Sync: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Admin Overview
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live statistics and systemic activity metrics for {user?.name || 'Administrator'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="pr-4 border-r border-zinc-200 dark:border-zinc-800 text-right hidden sm:block">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total System Users</p>
              <p className="text-xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight">
                {formatNumber(stats?.userStats?.totalUsers)}
              </p>
            </div>
            
            <button
              onClick={handleRefreshData}
              disabled={refreshing}
              className="px-3 py-1.5 rounded text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleAddUser}
              className="px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Manage Users
            </button>
          </div>
        </div>
      </div>

      {/* Flat Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              STUDENT ACCOUNTS
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-2">
            {formatNumber(stats?.userStats?.studentCount)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {getPercentage(stats?.userStats?.studentCount, stats?.userStats?.totalUsers)}% of system accounts
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              FACULTY ACCOUNTS
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-2">
            {formatNumber(stats?.userStats?.facultyCount)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {getPercentage(stats?.userStats?.facultyCount, stats?.userStats?.totalUsers)}% of system accounts
          </div>
        </div>

        {/* Card 3: Total Activities */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              SUBMITTED ACTIVITIES
            </span>
          </div>
          <div className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-2">
            {formatNumber(stats?.activityStats?.totalActivities)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {approvalRate}% overall approval rate
          </div>
        </div>

        {/* Card 4: Pending Reviews */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>PENDING REVIEWS</span>
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Action Req.
              </span>
            )}
          </div>
          <div className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-2">
            {formatNumber(pendingCount)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {pendingCount > 0 ? 'Awaiting faculty evaluation' : 'Queue completely clear'}
          </div>
        </div>
      </div>

      {/* Breakdown Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Status Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Activity Status Breakdown
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Evaluation distribution across submitted activities
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {approvalRate}% Rate
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {[
              { 
                status: 'Approved', 
                count: stats?.activityStats?.approvedActivities || 0, 
                color: 'bg-emerald-500', 
                badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
              },
              { 
                status: 'Pending', 
                count: stats?.activityStats?.pendingActivities || 0, 
                color: 'bg-amber-500', 
                badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
              },
              { 
                status: 'Rejected', 
                count: stats?.activityStats?.rejectedActivities || 0, 
                color: 'bg-rose-500', 
                badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
              }
            ].map((item) => {
              const percentage = getPercentage(item.count, stats?.activityStats?.totalActivities);
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.status}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-zinc-950 dark:text-zinc-50">{formatNumber(item.count)}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded border ${item.badgeBg}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Slim 3px Progress Track */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[3px] rounded-full overflow-hidden">
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

        {/* Program Category Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Program Category Distribution
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Student enrollment breakdown by academic domain
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {stats?.programCategoryStats?.length || 0} Domains
            </span>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {stats?.programCategoryStats?.slice(0, 10).map((category) => {
              const percentage = getPercentage(category.count, stats?.userStats?.totalUsers);
              return (
                <div key={category.programCategory} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="truncate max-w-[240px] text-zinc-800 dark:text-zinc-200" title={category.programCategory}>
                      {category.programCategory}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(category.count)}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({percentage}%)</span>
                    </div>
                  </div>
                  {/* Slim 3px Track */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[3px] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Active Students Table */}
      {stats?.topStudents?.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Top Active Participants
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Students with highest approved activity credits
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Leaderboard
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="pb-2 font-medium">Rank</th>
                  <th className="pb-2 font-medium">Student Name</th>
                  <th className="pb-2 font-medium">Student ID</th>
                  <th className="pb-2 font-medium">Program</th>
                  <th className="pb-2 font-medium text-right">Activities</th>
                  <th className="pb-2 font-medium text-right">Total Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {stats.topStudents.slice(0, 5).map((student, index) => (
                  <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-zinc-500">#{index + 1}</td>
                    <td className="py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</td>
                    <td className="py-2.5 text-zinc-500">{student.studentId}</td>
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                      {student.program || student.department || 'N/A'}
                    </td>
                    <td className="py-2.5 text-right text-zinc-700 dark:text-zinc-300">{student.activityCount}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {student.totalCredits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Actions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Console Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            Console Direct Shortcuts
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleAddUser}
              className="p-3 text-left rounded border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 bg-zinc-50 dark:bg-zinc-800/40 transition-all group"
            >
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                User Management →
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Create or modify roles</p>
            </button>

            <button
              onClick={handleGenerateReport}
              className="p-3 text-left rounded border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 bg-zinc-50 dark:bg-zinc-800/40 transition-all group"
            >
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Reports & Export →
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Export activity CSV</p>
            </button>

            <button
              onClick={handleViewAnalytics}
              className="p-3 text-left rounded border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 bg-zinc-50 dark:bg-zinc-800/40 transition-all group"
            >
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                System Analytics →
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Performance charts</p>
            </button>
          </div>
        </div>

        {/* System Health Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            System Infrastructure Status
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-zinc-700 dark:text-zinc-300">Database Engine</span>
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-zinc-700 dark:text-zinc-300">REST API Gateway</span>
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>ACTIVE</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-zinc-700 dark:text-zinc-300">Cloud Storage API</span>
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>READY</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
