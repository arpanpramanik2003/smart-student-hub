'use client';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../shared/LoadingSpinner';

const FinalReviewCard = memo(({ activity, onProcessReview, isApprovedTab }) => {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (action) => {
    if (action === 'revoke' && !remarks.trim()) {
      alert('Please provide a mandatory revocation reason in the remarks field.');
      return;
    }
    setSubmitting(true);
    try {
      await onProcessReview(activity.id, action, remarks);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold border ${
            isApprovedTab
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900'
          }`}>
            {isApprovedTab ? '✓ Official Approved Credential' : 'Stage 2: Pending Admin Final Approval'}
          </span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-sans">
            {activity.title}
          </h3>
          <p className="text-xs text-zinc-500 font-mono">
            Student: <strong className="text-zinc-800 dark:text-zinc-200">{activity.student?.name}</strong> ({activity.student?.studentId || activity.student?.email}) • Dept: {activity.student?.department || activity.student?.programCategory || 'N/A'}
          </p>
        </div>

        <div className="text-right self-start sm:self-auto">
          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {parseFloat(activity.credits).toFixed(1)} Credits
          </span>
          <span className="block text-[11px] text-zinc-400 font-medium">
            {activity.naacCriterion || 'Criterion 5'}
          </span>
        </div>
      </div>

      {activity.verificationId && (
        <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div>
            <span className="text-zinc-500 uppercase text-[10px] block">Public Verification Token</span>
            <span className="text-indigo-400 font-bold select-all">{activity.verificationId}</span>
          </div>
          <a
            href={`/verify/${activity.verificationId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:underline"
          >
            [Test Public Verification Page ↗]
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded border border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-zinc-400 block text-[10px] uppercase">Activity Type</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{activity.type?.replace('_', ' ')}</span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[10px] uppercase">Achievement Level</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{activity.achievementLevel || 'College'}</span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[10px] uppercase">Organizer</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activity.organizer || 'N/A'}</span>
        </div>
      </div>

      {/* Admin Action Box */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div>
          <label className="block mb-1 text-xs text-zinc-500">
            {isApprovedTab ? 'Revocation Reason (Mandatory for Revoke Action)' : 'Admin Remarks / Sign-Off Comments'}
          </label>
          <input
            type="text"
            placeholder={isApprovedTab ? "e.g. Credential revoked due to audit error or fraudulent evidence." : "e.g. Verified against institutional criteria. Institutional credit granted."}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center justify-end space-x-2">
          {isApprovedTab ? (
            <button
              onClick={() => handleAction('revoke')}
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              ⚠️ Revoke Approval & Invalid Credential
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction('reject')}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                Reject Activity
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={submitting}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                Final Approve & Issue Verification Token
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
FinalReviewCard.displayName = 'FinalReviewCard';

export default function FinalReviewQueue() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [pendingActivities, setPendingActivities] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        adminAPI.getFinalReviewQueue({ status: 'mentor_approved' }),
        adminAPI.getFinalReviewQueue({ status: 'approved' }),
      ]);
      setPendingActivities(pendingRes.activities || []);
      setApprovedActivities(approvedRes.activities || []);
    } catch (err) {
      console.error('Fetch final review queue error:', err);
      showToast('error', 'Failed to load final review queue');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleProcessReview = useCallback(async (activityId, action, remarks) => {
    try {
      const res = await adminAPI.processFinalReview(activityId, { action, remarks });
      showToast('success', res.message);
      fetchQueue();
    } catch (err) {
      showToast('error', err.message || 'Failed to process action');
    }
  }, [fetchQueue, showToast]);

  const currentList = activeTab === 'pending' ? pendingActivities : approvedActivities;

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
                Institutional Credential Management
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Digital Verification Token Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Admin Final Review & Revocation Audit
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Issue cryptographic verification tokens upon final sign-off or revoke invalidated credentials
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs self-start md:self-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded font-semibold transition-colors ${
                activeTab === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Pending Sign-Off ({pendingActivities.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded font-semibold transition-colors ${
                activeTab === 'approved'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Approved Ledger ({approvedActivities.length})
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading credential queue..." />
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center text-zinc-400 font-mono text-xs">
              No activities found in this view.
            </div>
          ) : (
            currentList.map(activity => (
              <FinalReviewCard
                key={activity.id}
                activity={activity}
                onProcessReview={handleProcessReview}
                isApprovedTab={activeTab === 'approved'}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
