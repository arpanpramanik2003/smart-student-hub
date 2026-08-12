'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { facultyAPI } from '../../utils/api';
import { PROGRAM_CATEGORIES } from '../../utils/programsData';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const ReviewQueue = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [visibleFiles, setVisibleFiles] = useState({});
  const [toastMessage, setToastMessage] = useState({ type: '', text: '', show: false });

  const showToast = useCallback((type, text) => {
    setToastMessage({ type, text, show: true });
    setTimeout(() => setToastMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchPendingActivities = useCallback(async () => {
    try {
      const data = await facultyAPI.getPendingActivities();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Pending activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingActivities();
  }, [fetchPendingActivities]);

  const handleReview = useCallback(async (activityId, action, remarks = '', credits = null) => {
    setReviewingId(activityId);
    
    try {
      const reviewData = {
        action,
        remarks,
        ...(action === 'approve' && credits !== null && { credits: parseFloat(credits) })
      };

      const res = await facultyAPI.reviewActivity(activityId, reviewData);
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
      showToast('success', res.message || `Activity successfully ${action === 'approve' ? 'approved & forwarded' : 'rejected'}`);
    } catch (error) {
      showToast('error', `Review error: ${error.message}`);
    } finally {
      setReviewingId(null);
    }
  }, [showToast]);

  const handleQuickApprove = useCallback((activityId) => {
    const creditsInput = document.getElementById(`credits-${activityId}`);
    const remarksInput = document.getElementById(`remarks-${activityId}`);
    const credits = creditsInput ? creditsInput.value : null;
    const remarks = remarksInput ? remarksInput.value : '';
    handleReview(activityId, 'approve', remarks, credits);
  }, [handleReview]);

  const handleQuickReject = useCallback((activityId) => {
    const remarksInput = document.getElementById(`remarks-${activityId}`);
    const remarks = remarksInput ? remarksInput.value : '';
    handleReview(activityId, 'reject', remarks);
  }, [handleReview]);

  const toggleFileVisibility = useCallback((activityId) => {
    setVisibleFiles(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
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
        <SectionSkeleton rows={4} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading Stage 1 Mentor Review Queue..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notification */}
      {toastMessage.show && (
        <div className={`rounded border p-3 font-mono text-xs transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{toastMessage.type === 'success' ? '✓ ' : '✕ '}{toastMessage.text}</span>
            <button onClick={() => setToastMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                Stage 1: Mentor Review
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {activities.length} Mentees Submissions Pending
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              Faculty Mentor Evaluation Queue
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Prof. {user.name} • Stage 1 Verification & Forwarding to Admin Final Sign-Off
            </p>
          </div>
        </div>
      </div>

      {/* Activities Review List */}
      {activities.length > 0 ? (
        <div className="space-y-5">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                      {activity.type.replace('_', ' ')}
                    </span>
                    {activity.naacCriterion && (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-semibold">
                        {activity.naacCriterion}
                      </span>
                    )}
                    <span className="text-zinc-400">•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">● Pending Mentor Review</span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1 font-sans">
                    {activity.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                    Student: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.student?.name}</strong> (ID: {activity.student?.studentId || 'N/A'}) • {activity.student?.program || activity.student?.department} • Year {activity.student?.year || 1}
                  </p>
                </div>

                <div className="text-right self-start sm:self-auto">
                  <span className="text-[10px] text-zinc-500 block">POLICY CREDITS</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    +{activity.credits} Credits
                  </span>
                </div>
              </div>

              {/* Activity Metadata & Description */}
              <div className="space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <p>Achievement Level: <strong className="text-zinc-800 dark:text-zinc-200 font-normal capitalize">{activity.achievementLevel || 'College'}</strong></p>
                  <p>Event Date: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{formatDate(activity.date)}</strong></p>
                  {activity.organizer && <p>Organizer: <strong className="text-zinc-800 dark:text-zinc-200 font-normal">{activity.organizer}</strong></p>}
                </div>

                {activity.description && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-sans text-xs">
                    <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-0.5">Description</span>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{activity.description}</p>
                  </div>
                )}
              </div>

              {/* Certificate Attachment Box */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => toggleFileVisibility(activity.id)}
                  className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors"
                >
                  {visibleFiles[activity.id] ? '[Hide Certificate Evidence]' : '[View Certificate Evidence]'}
                </button>

                {visibleFiles[activity.id] && (
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded">
                    {!activity.filePath ? (
                      <div className="text-rose-600 dark:text-rose-400 font-mono text-xs flex items-center space-x-1.5">
                        <span>⚠️ Certificate file unavailable or unreadable</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">Attached Certificate File</span>
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
                                Open Preview
                              </a>
                              <a
                                href={downloadUrl}
                                className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[11px]"
                              >
                                Download Copy
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stage 1 Mentor Evaluation Action Box */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded p-4 space-y-3">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px] block">
                  Stage 1 Mentor Review Form
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`credits-${activity.id}`} className="block mb-1 text-zinc-500">
                      Policy Credits Assigned
                    </label>
                    <input
                      type="number"
                      id={`credits-${activity.id}`}
                      min="0"
                      max="10"
                      step="0.5"
                      defaultValue={activity.credits}
                      className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label htmlFor={`remarks-${activity.id}`} className="block mb-1 text-zinc-500">
                      Mentor Review Remarks
                    </label>
                    <input
                      type="text"
                      id={`remarks-${activity.id}`}
                      placeholder="e.g. Verified certificate proof. Recommending for final sign-off."
                      className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <button
                    onClick={() => handleQuickReject(activity.id)}
                    disabled={reviewingId === activity.id}
                    className="px-3.5 py-1.5 rounded border border-rose-200 dark:border-rose-900/80 bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 transition-colors"
                  >
                    {reviewingId === activity.id ? 'Processing...' : 'Reject Submission'}
                  </button>

                  <button
                    onClick={() => handleQuickApprove(activity.id)}
                    disabled={reviewingId === activity.id}
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 transition-colors"
                  >
                    {reviewingId === activity.id ? 'Processing...' : 'Approve & Forward for Stage 2 Admin Sign-Off'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center font-mono text-xs text-zinc-500 space-y-2">
          <p className="font-bold text-zinc-800 dark:text-zinc-200">✓ Mentor Review Queue Clear — No Pending Submissions</p>
          <p className="text-[11px] text-zinc-400 font-mono">All co-curricular submissions from your assigned mentees have been evaluated.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
