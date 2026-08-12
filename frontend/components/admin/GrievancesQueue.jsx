'use client';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const GrievanceCard = memo(({ item, onResolve }) => {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      await onResolve(item.id, action, remarks);
    } finally {
      setSubmitting(false);
    }
  };

  const activity = item.activity || {};
  const isResolved = item.status !== 'pending_admin';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${
              item.status === 'pending_admin' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900' :
              item.status === 'resolved_approved' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' :
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            }`}>
              ● {item.status.replace('_', ' ')}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500">Appeal Date: {new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-sans">
            {activity.title || 'Activity Record'}
          </h3>
          <p className="text-[11px] text-zinc-500">
            Student: <strong className="text-zinc-800 dark:text-zinc-200">{item.student?.name}</strong> ({item.student?.studentId || item.student?.email}) • Dept: {item.student?.department || 'N/A'}
          </p>
        </div>

        <div className="text-right self-start sm:self-auto">
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 block">
            {parseFloat(activity.credits || 1.0).toFixed(1)} Credits
          </span>
          <span className="text-[10px] text-zinc-400">{activity.naacCriterion || 'Criterion 5'}</span>
        </div>
      </div>

      {/* Rejection History Audit Callout */}
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300">
          Original Rejection Reason:
        </span>
        <p className="text-rose-900 dark:text-rose-200 italic text-[11px]">
          &quot;{activity.mentorRemarks || activity.adminRemarks || activity.remarks || 'No detailed reason specified.'}&quot;
        </p>
      </div>

      {/* Student Appeal Explanation Note */}
      <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
          Student Explanation & Appeal Note:
        </span>
        <p className="text-amber-950 dark:text-amber-100 text-[11px] leading-relaxed">
          &quot;{item.appealReason}&quot;
        </p>
      </div>

      {activity.filePath && (
        <div>
          <a
            href={activity.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>📄 View Verification Certificate Evidence</span>
          </a>
        </div>
      )}

      {/* Resolution Actions */}
      {!isResolved ? (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div>
            <label className="block mb-1 text-zinc-500">Admin Resolution Remarks</label>
            <input
              type="text"
              placeholder="e.g. Reviewed appeal note and certificate evidence. Appeal accepted."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => handleAction('dismiss')}
              disabled={submitting}
              className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 disabled:opacity-50"
            >
              Dismiss Appeal
            </button>
            <button
              onClick={() => handleAction('requeue')}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 disabled:opacity-50"
            >
              Re-queue for Mentor Review
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
            >
              Approve & Grant Credits
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Resolved by {item.resolver?.name || 'Admin'} on {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : ''}</span>
          <span className="italic">&quot;{item.adminResolutionRemarks || 'Processed'}&quot;</span>
        </div>
      )}
    </div>
  );
});
GrievanceCard.displayName = 'GrievanceCard';

export default function GrievancesQueue() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_admin');
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getGrievances({ status: statusFilter });
      setGrievances(res.grievances || []);
    } catch (err) {
      console.error('Fetch grievances error:', err);
      showToast('error', 'Failed to load grievances queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const handleResolve = useCallback(async (id, action, resolutionRemarks) => {
    try {
      const res = await adminAPI.resolveGrievance(id, { action, resolutionRemarks });
      showToast('success', res.message);
      setGrievances(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      showToast('error', err.message || 'Failed to process grievance resolution');
    }
  }, [showToast]);

  if (loading && grievances.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading Student Grievances & Appeals Queue..." />
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
          <div className="flex items-center justify-between font-mono text-xs">
            <span>{message.type === 'success' ? '✓ ' : '✕ '}{message.text}</span>
            <button onClick={() => setMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
        <div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              Grievances & Appeals Console
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {grievances.length} Appeals Listed
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
            Student Grievance & Appeal Queue
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
            Review formal student appeals against activity rejections and resolve with audit trail protection
          </p>
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <label className="block mb-1 text-zinc-500">Filter Appeal Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
          >
            <option value="pending_admin">Pending Admin Review</option>
            <option value="resolved_approved">Resolved: Approved & Granted</option>
            <option value="resolved_requeued">Resolved: Re-queued</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Appeal Statuses</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {grievances.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center font-mono text-xs text-zinc-400">
            No student appeals found matching current filter.
          </div>
        ) : (
          grievances.map(item => (
            <GrievanceCard
              key={item.id}
              item={item}
              onResolve={handleResolve}
            />
          ))
        )}
      </div>
    </div>
  );
}
