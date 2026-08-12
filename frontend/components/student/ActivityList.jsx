'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI } from '../../utils/api';
import { ACTIVITY_STATUS, STATUS_LABELS, STATUS_COLORS, ACTIVITY_TYPES, ACHIEVEMENT_LEVELS } from '../../utils/constants';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const StudentActivityCard = React.memo(({ 
  activity, 
  formatDate, 
  visibleFiles, 
  toggleFileVisibility, 
  handleDelete, 
  deletingId,
  onOpenResubmit,
  onOpenAppeal
}) => {
  const [audits, setAudits] = useState([]);
  const [showAudits, setShowAudits] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(false);

  const statusColorClass = STATUS_COLORS[activity.status] || STATUS_COLORS.pending_mentor;
  const statusLabel = STATUS_LABELS[activity.status] || activity.status;

  const handleToggleAudits = async () => {
    if (!showAudits && audits.length === 0) {
      setLoadingAudits(true);
      try {
        const res = await studentAPI.getActivityAudits(activity.id);
        setAudits(res.audits || []);
      } catch (err) {
        console.error('Fetch audits error:', err);
      } finally {
        setLoadingAudits(false);
      }
    }
    setShowAudits(!showAudits);
  };

  const isRejected = activity.status === 'rejected';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap mb-1 gap-y-1">
            <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold rounded border ${statusColorClass}`}>
              ● {statusLabel}
            </span>

            {activity.naacCriterion && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {activity.naacCriterion}
              </span>
            )}

            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs uppercase text-zinc-500 font-medium">
              {activity.type.replace('_', ' ')} ({activity.achievementLevel || 'college'})
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

          {activity.finalApprover && (
            <span className="text-[11px] text-zinc-500">
              Final Approved by {activity.finalApprover.name}
            </span>
          )}
          {activity.mentorReviewer && !activity.finalApprover && (
            <span className="text-[11px] text-zinc-500">
              Mentor Reviewed by {activity.mentorReviewer.name}
            </span>
          )}
        </div>
      </div>

      {/* Explicit Rejection Feedback Box */}
      {isRejected && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-rose-800 dark:text-rose-300 space-y-1">
          <div className="flex items-center justify-between font-bold text-[10px] uppercase">
            <span>✕ Submission Rejected</span>
            <span>{activity.mentorRemarks ? 'Stage 1 Mentor Feedback' : 'Stage 2 Admin Feedback'}</span>
          </div>
          <p className="text-xs italic">
            &quot;{activity.mentorRemarks || activity.adminRemarks || activity.remarks || 'No detailed reason specified.'}&quot;
          </p>
        </div>
      )}

      {/* Audit Trail Log Toggle */}
      <div>
        <button
          onClick={handleToggleAudits}
          className="text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
        >
          {showAudits ? '[Hide Audit Log Timeline]' : '[View NAAC Audit History Log]'}
        </button>

        {showAudits && (
          <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded space-y-2 text-[11px]">
            {loadingAudits ? (
              <span className="text-zinc-400">Loading audit history...</span>
            ) : audits.length === 0 ? (
              <span className="text-zinc-400">No previous status transitions logged.</span>
            ) : (
              audits.map(log => (
                <div key={log.id} className="border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {log.previousStatus} → <span className="text-indigo-600 dark:text-indigo-400">{log.newStatus}</span>
                    </span>
                    <span className="text-zinc-400 text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[10px]">
                    By: {log.performer?.name || 'User'} ({log.performer?.role || 'user'}) {log.remarks ? `• "${log.remarks}"` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Strip */}
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

        <div className="flex items-center space-x-2">
          {isRejected && (
            <>
              <button
                type="button"
                onClick={() => onOpenAppeal(activity)}
                className="px-3 py-1.5 rounded border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium text-xs transition-colors hover:bg-amber-100"
              >
                File Appeal / Grievance
              </button>
              <button
                type="button"
                onClick={() => onOpenResubmit(activity)}
                className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
              >
                Resubmit with Corrections
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleDelete(activity.id, activity.title)}
            disabled={deletingId === activity.id}
            className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium text-xs transition-colors disabled:opacity-50"
          >
            {deletingId === activity.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
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

export default function ActivityList() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleFiles, setVisibleFiles] = useState({});
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  // Resubmit Modal State
  const [resubmitActivity, setResubmitActivity] = useState(null);
  const [resubmitForm, setResubmitForm] = useState({
    title: '', type: 'conference', achievementLevel: 'college', description: '', date: '', duration: '', organizer: ''
  });
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);

  // Appeal Modal State
  const [appealActivity, setAppealActivity] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealing, setAppealing] = useState(false);

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchActivities = useCallback(async () => {
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
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await studentAPI.deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      showToast('success', 'Activity deleted successfully');
    } catch (error) {
      showToast('error', error.message || 'Failed to delete activity');
    } finally {
      setDeletingId(null);
    }
  }, [showToast]);

  const toggleFileVisibility = useCallback((id) => {
    setVisibleFiles(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleOpenResubmit = useCallback((activity) => {
    setResubmitActivity(activity);
    setResubmitForm({
      title: activity.title || '',
      type: activity.type || 'conference',
      achievementLevel: activity.achievementLevel || 'college',
      description: activity.description || '',
      date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : '',
      duration: activity.duration || '',
      organizer: activity.organizer || '',
    });
    setResubmitFile(null);
  }, []);

  const handleResubmitSubmit = async (e) => {
    e.preventDefault();
    if (!resubmitActivity) return;
    setResubmitting(true);

    try {
      const formData = new FormData();
      Object.keys(resubmitForm).forEach(key => {
        formData.append(key, resubmitForm[key]);
      });
      if (resubmitFile) {
        formData.append('certificate', resubmitFile);
      }

      const res = await studentAPI.resubmitActivity(resubmitActivity.id, formData);
      showToast('success', res.message);
      setResubmitActivity(null);
      fetchActivities();
    } catch (err) {
      showToast('error', err.message || 'Failed to resubmit activity');
    } finally {
      setResubmitting(false);
    }
  };

  const handleOpenAppeal = useCallback((activity) => {
    setAppealActivity(activity);
    setAppealReason('');
  }, []);

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealActivity || !appealReason.trim()) return;
    setAppealing(true);

    try {
      const res = await studentAPI.fileAppeal(appealActivity.id, { appealReason });
      showToast('success', res.message);
      setAppealActivity(null);
    } catch (err) {
      showToast('error', err.message || 'Failed to file appeal');
    } finally {
      setAppealing(false);
    }
  };

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
    const pending = activities.filter(a => a.status === 'pending_mentor' || a.status === 'mentor_approved' || a.status === 'pending').length;
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

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                Activity Ledger
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                {counts.total} Total Submissions
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              My Activities & Submissions
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Track multi-stage evaluations, faculty remarks, and resubmit corrected records
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

        {/* Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 block">TOTAL LOGGED</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{counts.total}</span>
          </div>

          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>FINAL APPROVED</span>
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{counts.approved}</span>
          </div>

          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>IN REVIEW</span>
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

        {/* Filter Toolbar */}
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
            <label className="block mb-1 text-zinc-500 font-mono">Status Filter</label>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 font-mono"
            >
              <option value="all">All Evaluation Statuses</option>
              <option value="pending_mentor">Stage 1: Pending Mentor</option>
              <option value="mentor_approved">Stage 2: Pending Admin</option>
              <option value="approved">Approved & Granted</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          {(searchTerm || filter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setFilter('all'); }}
              className="w-full sm:w-auto px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 transition-colors whitespace-nowrap self-stretch sm:self-end font-mono"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Cards List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center text-zinc-400 font-mono text-xs">
            No activity submissions found matching your filters.
          </div>
        ) : (
          filteredActivities.map(activity => (
            <StudentActivityCard
              key={activity.id}
              activity={activity}
              formatDate={formatDate}
              visibleFiles={visibleFiles}
              toggleFileVisibility={toggleFileVisibility}
              handleDelete={handleDelete}
              deletingId={deletingId}
              onOpenResubmit={handleOpenResubmit}
              onOpenAppeal={handleOpenAppeal}
            />
          ))
        )}
      </div>

      {/* Resubmit Modal */}
      {resubmitActivity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm font-mono text-zinc-900 dark:text-zinc-100">
                Resubmit Activity with Corrections
              </h3>
              <button onClick={() => setResubmitActivity(null)} className="text-zinc-400 hover:text-zinc-600 font-mono text-xs">
                [Close]
              </button>
            </div>

            <form onSubmit={handleResubmitSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block mb-1 text-zinc-500">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={resubmitForm.title}
                  onChange={e => setResubmitForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-zinc-500">Activity Category</label>
                  <select
                    value={resubmitForm.type}
                    onChange={e => setResubmitForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-zinc-500">Achievement Level</label>
                  <select
                    value={resubmitForm.achievementLevel}
                    onChange={e => setResubmitForm(prev => ({ ...prev, achievementLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    {ACHIEVEMENT_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Activity Date *</label>
                <input
                  type="date"
                  required
                  value={resubmitForm.date}
                  onChange={e => setResubmitForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Description & Corrected Details</label>
                <textarea
                  rows={3}
                  value={resubmitForm.description}
                  onChange={e => setResubmitForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Updated Certificate Evidence (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setResubmitFile(e.target.files[0])}
                  className="w-full text-xs text-zinc-600 dark:text-zinc-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setResubmitActivity(null)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitting}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
                >
                  {resubmitting ? 'Resubmitting...' : 'Resubmit for Stage 1 Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appeal / Grievance Modal */}
      {appealActivity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                File Grievance Appeal to Admin
              </h3>
              <button onClick={() => setAppealActivity(null)} className="text-zinc-400 hover:text-zinc-600">
                [Close]
              </button>
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded text-[11px] text-amber-800 dark:text-amber-300">
                <span>Appealing rejection for: <strong>&quot;{appealActivity.title}&quot;</strong></span>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Explanation Note for Admin Review *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why you believe the rejection was incorrect or clarify how your certificate meets the institutional criteria..."
                  value={appealReason}
                  onChange={e => setAppealReason(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAppealActivity(null)}
                  className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appealing || !appealReason.trim()}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50"
                >
                  {appealing ? 'Filing Appeal...' : 'Submit Appeal to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
