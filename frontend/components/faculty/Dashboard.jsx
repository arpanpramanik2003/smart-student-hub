'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { facultyAPI } from '../../utils/api';
import { PROGRAM_CATEGORIES } from '../../utils/programsData';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const Dashboard = ({ user, token, onNavigate }) => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await facultyAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Faculty stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleReviewPending = useCallback(() => {
    router.push('/faculty/review');
  }, [router]);

  const handleViewAllActivities = useCallback(() => {
    router.push('/faculty/activities');
  }, [router]);

  const handleViewStudents = useCallback(() => {
    router.push('/faculty/students');
  }, [router]);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <CardSkeleton cards={5} />
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" text="Loading faculty console..." />
        </div>
      </div>
    );
  }

  const pendingCount = stats?.pendingCount || 0;
  const totalCount = stats?.totalActivities || 0;
  const approvedCount = stats?.approvedCount || 0;
  const rejectedCount = stats?.rejectedCount || 0;
  const reviewedByMeCount = stats?.reviewedByMe || 0;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Faculty Evaluation Console
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {user.department || 'Academic Evaluator'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Welcome, Prof. {user.name}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              {user.programCategory ? `Domain: ${PROGRAM_CATEGORIES[user.programCategory] || user.programCategory}` : 'All Academic Domains'} • Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
            <button
              onClick={handleReviewPending}
              className="px-3.5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors flex items-center space-x-1.5"
            >
              <span>Review Queue ({pendingCount})</span>
            </button>

            <button
              onClick={handleViewAllActivities}
              className="px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              All Submissions
            </button>
          </div>
        </div>
      </div>

      {/* Flat Monospace Stat Cards Grid (5 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
        {/* Card 1: Pending Review */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span>PENDING REVIEW</span>
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight my-1">
            {formatNumber(pendingCount)}
          </p>
          <p className="text-[11px] text-zinc-500">Awaiting evaluation</p>
        </div>

        {/* Card 2: Total Activities */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            TOTAL SUBMISSIONS
          </span>
          <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
            {formatNumber(totalCount)}
          </p>
          <p className="text-[11px] text-zinc-500">Department activities</p>
        </div>

        {/* Card 3: Approved */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>APPROVED</span>
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight my-1">
            {formatNumber(approvedCount)}
          </p>
          <p className="text-[11px] text-zinc-500">Credits granted</p>
        </div>

        {/* Card 4: Rejected */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>REJECTED</span>
          </span>
          <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight my-1">
            {formatNumber(rejectedCount)}
          </p>
          <p className="text-[11px] text-zinc-500">Declined submissions</p>
        </div>

        {/* Card 5: Reviewed By Me */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            REVIEWED BY ME
          </span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight my-1">
            {formatNumber(reviewedByMeCount)}
          </p>
          <p className="text-[11px] text-zinc-500">My evaluations</p>
        </div>
      </div>

      {/* Recent Evaluations Log Stream */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-xs">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Recent Evaluation Activity</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">Latest student activity reviews across department</p>
          </div>
          <button
            onClick={handleReviewPending}
            className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors flex items-center space-x-1"
          >
            <span>Evaluate Pending ({pendingCount})</span>
          </button>
        </div>

        {stats?.recentReviews?.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-xs">
            {stats.recentReviews.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate" title={activity.title}>
                    {activity.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Student: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.student?.name || 'Unknown'}</strong> ({activity.student?.department || 'N/A'}) • {activity.type.replace('_', ' ')} • {formatDate(activity.date)}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{activity.credits} Credits
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activity.status === 'approved' ? 'bg-emerald-500' :
                      activity.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="capitalize text-zinc-700 dark:text-zinc-300 text-[11px]">{activity.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center font-mono text-xs text-zinc-500 space-y-2">
            <p>No recent activity evaluations logged yet.</p>
            <p className="text-[11px] text-zinc-400">Student submissions will appear here once reviewed.</p>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-2">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
          Faculty Quick Action Controls
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={handleReviewPending}
            className="p-3 text-left rounded bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-amber-600 transition-all"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Review Pending Submissions →</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount} submissions awaiting credit evaluation</p>
          </button>

          <button
            onClick={handleViewStudents}
            className="p-3 text-left rounded bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-600 transition-all"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Browse Student Roster →</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">View student profiles, year levels & credit totals</p>
          </button>

          <button
            onClick={handleViewAllActivities}
            className="p-3 text-left rounded bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-600 transition-all"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">All Department Records →</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Explore full activity audit ledger & status filters</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
