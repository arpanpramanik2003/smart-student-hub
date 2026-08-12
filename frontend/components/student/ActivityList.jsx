'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI } from '../../utils/api';
import { ACTIVITY_STATUS } from '../../utils/constants';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const StudentActivityCard = React.memo(({ 
  activity, 
  formatDate, 
  visibleFiles, 
  toggleFileVisibility, 
  handleEditClick, 
  handleDelete, 
  deletingId 
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
              activity.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
              activity.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
              'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              ● {activity.status}
            </span>

            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs uppercase text-zinc-500">
              {activity.type.replace('_', ' ')}
            </span>
          </div>

          <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight font-sans">
            {activity.title}
          </h3>

          {activity.description && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed font-sans">
              {activity.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-zinc-500 text-[11px]">
            <span>Date: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{formatDate(activity.date)}</strong></span>
            {activity.organizer && (
              <span>Organizer: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.organizer}</strong></span>
            )}
            {activity.duration && (
              <span>Duration: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.duration}</strong></span>
            )}
            <span>Logged: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{formatDate(activity.createdAt)}</strong></span>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-100 dark:border-zinc-800 gap-2">
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            +{activity.credits} Credits
          </span>

          {activity.approver && (
            <span className="text-[11px] text-zinc-500">
              Evaluated by {activity.approver.name}
            </span>
          )}
        </div>
      </div>

      {activity.remarks && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded text-amber-800 dark:text-amber-300">
          <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">Faculty Evaluation Remarks</span>
          <p className="text-xs">{activity.remarks}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div>
          {activity.filePath ? (
            <button
              type="button"
              onClick={() => toggleFileVisibility(activity.id)}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors"
            >
              {visibleFiles[activity.id] ? '[Hide Certificate]' : '[View Certificate]'}
            </button>
          ) : (
            <span className="text-zinc-400 text-[11px]">No file attached</span>
          )}
        </div>

        {activity.status === ACTIVITY_STATUS.PENDING && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleEditClick(activity)}
              disabled={deletingId === activity.id}
              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(activity.id, activity.title)}
              disabled={deletingId === activity.id}
              className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
            >
              {deletingId === activity.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {visibleFiles[activity.id] && activity.filePath && (
        <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded flex items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">Certificate File Attachment</span>
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
              <div className="flex items-center space-x-2">
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px]"
                >
                  Preview
                </a>
                <a
                  href={downloadUrl}
                  className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[11px]"
                >
                  Download
                </a>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
});

StudentActivityCard.displayName = 'StudentActivityCard';

const ActivityList = ({ user, token }) => {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleFiles, setVisibleFiles] = useState({});
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [deletingId, setDeletingId] = useState(null);

  const [editingActivity, setEditingActivity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentAPI.getActivities();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Fetch activities error:', error);
      showToast('error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDelete = useCallback(async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await studentAPI.deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      showToast('success', 'Activity deleted successfully');
    } catch (error) {
      console.error('Delete activity error:', error);
      showToast('error', error.message || 'Failed to delete activity');
    } finally {
      setDeletingId(null);
    }
  }, [showToast]);

  const toggleFileVisibility = useCallback((id) => {
    setVisibleFiles(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleEditClick = useCallback((activity) => {
    router.push('/student/submit');
  }, [router]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesStatus = filter === 'all' || activity.status === filter;
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;
      const matchesSearch = !searchTerm.trim() || 
        activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.organizer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [activities, filter, typeFilter, searchTerm]);

  const counts = useMemo(() => {
    const total = activities.length;
    const approved = activities.filter(a => a.status === 'approved').length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const rejected = activities.filter(a => a.status === 'rejected').length;
    return { total, approved, pending, rejected };
  }, [activities]);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <CardSkeleton cards={3} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading activity records..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {message.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.type === 'success' ? '✓ ' : '✕ '}{message.text}</span>
            <button onClick={() => setMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Activity Ledger
              </span>
              <span className="text-xs font-mono text-zinc-400">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {counts.total} Total Logged Records
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              My Activities
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Review, edit, and track extra-curricular credit submissions and faculty remarks
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs self-start md:self-auto">
            <button
              onClick={() => router.push('/student/submit')}
              className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center space-x-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Submit New Activity</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 block">TOTAL LOGGED</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{counts.total}</span>
          </div>

          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>APPROVED</span>
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{counts.approved}</span>
          </div>

          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>PENDING</span>
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{counts.pending}</span>
          </div>

          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>REJECTED</span>
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{counts.rejected}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap sm:flex-nowrap items-stretch sm:items-end gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <label className="block mb-1 text-zinc-500">Search Activities</label>
            <input
              type="text"
              placeholder="Search title, category, organizer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="w-full sm:w-auto min-w-[180px]">
            <label className="block mb-1 text-zinc-500">Status Filter</label>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Evaluation Statuses</option>
              <option value={ACTIVITY_STATUS.PENDING}>Pending Review Only</option>
              <option value={ACTIVITY_STATUS.APPROVED}>Approved Only</option>
              <option value={ACTIVITY_STATUS.REJECTED}>Rejected Only</option>
            </select>
          </div>

          {(searchTerm || filter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setFilter('all'); }}
              className="w-full sm:w-auto px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors whitespace-nowrap self-stretch sm:self-end"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map(activity => (
            <StudentActivityCard
              key={activity.id}
              activity={activity}
              formatDate={formatDate}
              visibleFiles={visibleFiles}
              toggleFileVisibility={toggleFileVisibility}
              handleEditClick={handleEditClick}
              handleDelete={handleDelete}
              deletingId={deletingId}
            />
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

export default ActivityList;
