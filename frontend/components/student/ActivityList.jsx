'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI } from '../../utils/api';
import { ACTIVITY_STATUS } from '../../utils/constants';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const ActivityList = ({ user, token }) => {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleFiles, setVisibleFiles] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const data = await studentAPI.getActivities(params);
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Activities fetch error:', error);
      showToast('error', error.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDelete = useCallback(async (activityId, activityTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${activityTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingId(activityId);
    try {
      await studentAPI.deleteActivity(activityId);
      showToast('success', 'Activity deleted successfully!');
      fetchActivities();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'Failed to delete activity. ' + (error.message || ''));
    } finally {
      setDeletingId(null);
    }
  }, [fetchActivities, showToast]);

  const handleEditClick = useCallback((activity) => {
    setEditingActivity(activity);
    setEditFormData({
      title: activity.title,
      type: activity.type,
      description: activity.description || '',
      date: activity.date ? activity.date.split('T')[0] : '',
      duration: activity.duration || '',
      organizer: activity.organizer || '',
      certificate: null
    });
  }, []);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    setEditSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', editFormData.title);
      formData.append('type', editFormData.type);
      formData.append('description', editFormData.description);
      formData.append('date', editFormData.date);
      formData.append('duration', editFormData.duration);
      formData.append('organizer', editFormData.organizer);
      
      if (editFormData.certificate) {
        formData.append('certificate', editFormData.certificate);
      }

      await studentAPI.updateActivity(editingActivity.id, formData);
      showToast('success', 'Activity updated successfully!');
      setEditingActivity(null);
      fetchActivities();
    } catch (error) {
      console.error('Update error:', error);
      showToast('error', 'Failed to update activity. ' + (error.message || ''));
    } finally {
      setEditSubmitting(false);
    }
  }, [editFormData, editingActivity, fetchActivities, showToast]);

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

  const filteredActivities = useMemo(() => {
    return activities.filter(activity =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.organizer && activity.organizer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activities, searchTerm]);

  const counts = useMemo(() => {
    const total = activities.length;
    const approved = activities.filter(a => a.status === 'approved').length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const rejected = activities.filter(a => a.status === 'rejected').length;
    return { total, approved, pending, rejected };
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <SectionSkeleton rows={4} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading activity records..." />
        </div>
      </div>
    );
  }

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
            <button onClick={() => setMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
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

        {/* Quick Summary Badges Bar */}
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

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search title, category, organizer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Evaluation Statuses</option>
            <option value={ACTIVITY_STATUS.PENDING}>Pending Review Only</option>
            <option value={ACTIVITY_STATUS.APPROVED}>Approved Only</option>
            <option value={ACTIVITY_STATUS.REJECTED}>Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Activity List Records */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap mb-2">
                    <span className="flex items-center space-x-1 font-mono text-xs font-semibold">
                      <span className={`w-2 h-2 rounded-full ${
                        activity.status === 'approved' ? 'bg-emerald-500' :
                        activity.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span className="capitalize text-zinc-800 dark:text-zinc-200">{activity.status}</span>
                    </span>

                    <span className="text-xs font-mono text-zinc-400">•</span>
                    <span className="text-xs font-mono uppercase text-zinc-500">
                      {activity.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                    {activity.title}
                  </h3>

                  {activity.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                      {activity.description}
                    </p>
                  )}

                  {/* Metadata Bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 font-mono text-xs text-zinc-500">
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

                {/* Credits & Approver Column */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-100 dark:border-zinc-800 font-mono text-xs gap-2">
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

              {/* Faculty Remarks Callout Box */}
              {activity.remarks && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded font-mono text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">Faculty Evaluation Remarks</span>
                  <p className="text-xs">{activity.remarks}</p>
                </div>
              )}

              {/* Controls Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-xs">
                {/* File Attachment Controls */}
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

                {/* Edit / Delete Buttons for Pending Submissions */}
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

              {/* Certificate Attachment Preview Container */}
              {visibleFiles[activity.id] && activity.filePath && (() => {
                const fileUrl = activity.filePath;
                const isCloudinary = fileUrl.startsWith('http') && fileUrl.includes('res.cloudinary.com');
                const isPDF = fileUrl?.toLowerCase().includes('.pdf');
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const proxyUrl = `${origin}/api/files/view?url=${encodeURIComponent(fileUrl)}`;

                let viewUrl;
                if (isPDF) {
                  viewUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}`;
                } else if (isCloudinary) {
                  viewUrl = fileUrl;
                } else {
                  viewUrl = proxyUrl;
                }

                const downloadUrl = `/api/files/download?url=${encodeURIComponent(fileUrl)}`;

                return (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs flex items-center space-x-3 mt-2">
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                    >
                      Open Document
                    </a>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-100 transition-colors"
                    >
                      Download Copy
                    </a>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center font-mono text-xs text-zinc-500 space-y-3">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            {searchTerm || filter !== 'all' ? 'No activities match the selected search or filter.' : 'No activity submissions recorded yet.'}
          </p>
          <p className="text-[11px] text-zinc-400">
            {searchTerm || filter !== 'all'
              ? 'Try clearing search keywords or status filter.'
              : 'Submit extra-curricular activities, certificates, or internships to earn credits.'}
          </p>
          <button
            onClick={() => router.push('/student/submit')}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors inline-block mt-2"
          >
            Submit Activity
          </button>
        </div>
      )}

      {/* Edit Modal Overlay */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Edit Activity Record
              </h2>
              <button
                onClick={() => setEditingActivity(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                [Close]
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block mb-1 text-zinc-500">Activity Title *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Activity Category *</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Select Category</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="certification">Certification</option>
                  <option value="competition">Competition</option>
                  <option value="internship">Internship</option>
                  <option value="leadership">Leadership</option>
                  <option value="community_service">Community Service</option>
                  <option value="club_activity">Club Activity</option>
                  <option value="online_course">Online Course</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-zinc-500">Activity Date *</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-zinc-500">Duration</label>
                  <input
                    type="text"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                    placeholder="e.g. 2 days / 40 hours"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Organizer / Institution</label>
                <input
                  type="text"
                  value={editFormData.organizer}
                  onChange={(e) => setEditFormData({ ...editFormData, organizer: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Description / Details</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block mb-1 text-zinc-500">Update Certificate File (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setEditFormData({ ...editFormData, certificate: e.target.files[0] })}
                  className="w-full text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-zinc-200 dark:file:border-zinc-800 file:text-[10px] file:bg-zinc-50 dark:file:bg-zinc-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  disabled={editSubmitting}
                  className="px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 text-xs font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
