'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { facultyAPI } from '../../utils/api';
import { ACTIVITY_STATUS, API_BASE_URL, API_ORIGIN } from '../../utils/constants';
import { PROGRAM_CATEGORIES } from '../../utils/programsData';
import LoadingSpinner, { SectionSkeleton } from '../shared/LoadingSpinner';

const AllActivities = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleFiles, setVisibleFiles] = useState({});
  const [stats, setStats] = useState(null);

  const fetchAllActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      
      const data = await facultyAPI.getAllActivities(params);
      let sortedActivities = [...(data.activities || [])];
      
      switch (sortBy) {
        case 'newest':
          sortedActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          sortedActivities.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'student':
          sortedActivities.sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
          break;
        case 'credits':
          sortedActivities.sort((a, b) => (b.credits || 0) - (a.credits || 0));
          break;
      }
      
      setActivities(sortedActivities);
    } catch (error) {
      console.error('All activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await facultyAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllActivities();
    fetchStats();
  }, [fetchAllActivities, fetchStats]);

  const filteredActivities = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activities;
    
    return activities.filter(activity =>
      (activity.title && activity.title.toLowerCase().includes(term)) ||
      (activity.type && activity.type.toLowerCase().includes(term)) ||
      (activity.student?.name && activity.student.name.toLowerCase().includes(term)) ||
      (activity.student?.studentId && activity.student.studentId.toLowerCase().includes(term)) ||
      (activity.organizer && activity.organizer.toLowerCase().includes(term))
    );
  }, [activities, searchTerm]);

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

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <SectionSkeleton rows={4} />
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" text="Loading department activities..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Department Activity Ledger
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.programCategory ? PROGRAM_CATEGORIES[user.programCategory] : 'All Academic Domains'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
              All Student Activity Submissions
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              Audit log of approved, pending, and evaluated credit requests
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs self-start md:self-auto">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
              <span className="text-zinc-500 block text-[10px]">TOTAL RECORDED</span>
              <span className="font-bold text-zinc-950 dark:text-zinc-50">{formatNumber(stats?.totalActivities)}</span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
              <span className="text-zinc-500 block text-[10px]">PENDING</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatNumber(stats?.pendingCount)}</span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded">
              <span className="text-zinc-500 block text-[10px]">APPROVED</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(stats?.approvedCount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Activity Submissions List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-4 font-mono text-xs">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3"
            >
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

              {/* Details & Description */}
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

                {/* Approver & Remarks Callout */}
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

                {/* Attachment Section */}
                {activity.filePath && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleFileVisibility(activity.id)}
                      className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors"
                    >
                      {visibleFiles[activity.id] ? '[Hide Attachment]' : '[View Certificate Attachment]'}
                    </button>

                    {visibleFiles[activity.id] && (
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const fileUrl = activity.filePath.startsWith('http') ? activity.filePath : `${API_ORIGIN}${activity.filePath}`;
                          const isPDF = fileUrl.toLowerCase().includes('.pdf');
                          const proxyUrl = `${API_BASE_URL}/files/view?url=${encodeURIComponent(fileUrl)}`;
                          const viewUrl = isPDF
                            ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}`
                            : fileUrl;
                          const downloadUrl = `${API_BASE_URL}/files/download?url=${encodeURIComponent(fileUrl)}`;

                          return (
                            <>
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px]"
                              >
                                Preview File
                              </a>
                              <a
                                href={downloadUrl}
                                className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[11px]"
                              >
                                Download Copy
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center font-mono text-xs text-zinc-500 space-y-2">
          <p className="font-bold text-zinc-800 dark:text-zinc-200">No Activity Submissions Found</p>
          <p className="text-[11px] text-zinc-400">Try adjusting your search query or status filter.</p>
        </div>
      )}
    </div>
  );
};

export default AllActivities;
