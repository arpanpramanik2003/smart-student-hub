'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { facultyAPI } from '../../utils/api';
import { ACTIVITY_STATUS } from '../../utils/constants';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const ActivityCard = React.memo(({ activity, formatDate }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
              {activity.type.replace('_', ' ')}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="flex items-center space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                activity.status === 'approved' ? 'bg-emerald-500' :
                activity.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              <span className="capitalize text-zinc-700 dark:text-zinc-300 font-bold">{activity.status}</span>
            </span>
          </div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1 font-sans">
            {activity.title}
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Student: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.student?.name}</strong> (ID: {activity.student?.studentId || 'N/A'}) • {activity.student?.program || activity.student?.department} • Year {activity.student?.year || 1}
          </p>
        </div>

        <div className="text-right self-start sm:self-auto">
          <span className="text-[10px] text-zinc-500 block">CREDITS</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            +{activity.credits} Credits
          </span>
        </div>
      </div>

      <div className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <p>Event Date: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{formatDate(activity.date)}</strong></p>
          <p>Submitted: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{formatDate(activity.createdAt)}</strong></p>
          {activity.organizer && <p>Organizer: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.organizer}</strong></p>}
        </div>

        {activity.description && (
          <p className="text-zinc-700 dark:text-zinc-300 font-sans text-xs pt-1 leading-relaxed">
            {activity.description}
          </p>
        )}

        {(activity.approver || activity.remarks) && (
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded space-y-1">
            {activity.approver && (
              <p className="text-zinc-500">Evaluated by: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.approver.name}</strong></p>
            )}
            {activity.remarks && (
              <p className="text-zinc-700 dark:text-zinc-300 font-sans text-xs">{`Faculty Remarks: "${activity.remarks}"`}</p>
            )}
          </div>
        )}
      </div>

      {activity.filePath && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center space-x-2 text-[11px]">
          {(() => {
            const fileUrl = activity.filePath;
            const isPDF = fileUrl.toLowerCase().includes('.pdf');
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const proxyUrl = `${origin}/api/files/view?url=${encodeURIComponent(fileUrl)}`;
            const viewUrl = isPDF
              ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}`
              : fileUrl;
            const downloadUrl = `/api/files/download?url=${encodeURIComponent(fileUrl)}`;

            return (
              <>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Preview Document
                </a>
                <a
                  href={downloadUrl}
                  className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                >
                  Download Copy
                </a>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
});

ActivityCard.displayName = 'ActivityCard';

const AllActivities = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await facultyAPI.getAllActivities();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('All activities fetch error:', error);
      setError(error.message || 'Failed to load activity records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

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

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    if (filter !== 'all') {
      result = result.filter(act => act.status === filter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(act =>
        act.title?.toLowerCase().includes(query) ||
        act.student?.name?.toLowerCase().includes(query) ||
        act.student?.studentId?.toLowerCase().includes(query) ||
        act.organizer?.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'student') return (a.student?.name || '').localeCompare(b.student?.name || '');
      if (sortBy === 'credits') return b.credits - a.credits;
      return 0;
    });

    return result;
  }, [activities, filter, searchTerm, sortBy]);

  const summaryStats = useMemo(() => {
    const total = activities.length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const approved = activities.filter(a => a.status === 'approved').length;
    const credits = activities
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + (a.credits || 0), 0);

    return { total, pending, approved, credits };
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <SectionSkeleton rows={3} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading all student activity records..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-4 font-mono text-xs">
          <div className="flex items-start">
            <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-600 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="font-bold uppercase text-rose-800 dark:text-rose-300">Fetch Error</h3>
              <p className="mt-1 text-rose-700 dark:text-rose-400">{error}</p>
              <button 
                onClick={fetchActivities}
                className="mt-2 text-rose-700 dark:text-rose-300 underline"
              >
                [Retry Request]
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Institutional Records
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                {summaryStats.total} Total Submissions
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              All Activity Submissions
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Complete audit ledger of student extracurricular, co-curricular, and academic achievements
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">TOTAL</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{summaryStats.total}</span>
            </div>
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 block">PENDING</span>
              <span className="font-bold text-amber-800 dark:text-amber-300">{summaryStats.pending}</span>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">APPROVED</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">{summaryStats.approved}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div>
            <label className="block mb-1 text-zinc-500">Search Records</label>
            <input
              type="text"
              placeholder="Search title, student, ID, organizer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Status Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Evaluation Statuses</option>
              <option value={ACTIVITY_STATUS.PENDING}>Pending Review Only</option>
              <option value={ACTIVITY_STATUS.APPROVED}>Approved Only</option>
              <option value={ACTIVITY_STATUS.REJECTED}>Rejected Only</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-zinc-500">Sort Ordering</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="newest">Newest Submissions First</option>
              <option value="oldest">Oldest Submissions First</option>
              <option value="student">Student Name (A-Z)</option>
              <option value="credits">Credits Requested (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredActivities.length > 0 ? (
        <div className="space-y-4 font-mono text-xs">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} formatDate={formatDate} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-zinc-400 font-mono text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          No activity records found matching current query filters.
        </div>
      )}
    </div>
  );
};

export default AllActivities;
