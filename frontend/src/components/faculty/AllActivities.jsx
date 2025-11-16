import React, { useState, useEffect } from 'react';
import { facultyAPI } from '../../utils/api';
import { STATUS_COLORS, ACTIVITY_STATUS } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const AllActivities = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleFiles, setVisibleFiles] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAllActivities();
    fetchStats();
  }, [filter, sortBy]);

  const fetchAllActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      
      const data = await facultyAPI.getAllActivities(params);
      
      // Sort activities
      let sortedActivities = [...(data.activities || [])];
      switch (sortBy) {
        case 'newest':
          sortedActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          sortedActivities.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'student':
          sortedActivities.sort((a, b) => a.student?.name.localeCompare(b.student?.name));
          break;
        case 'credits':
          sortedActivities.sort((a, b) => b.credits - a.credits);
          break;
      }
      
      setActivities(sortedActivities);
    } catch (error) {
      console.error('All activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await facultyAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.student?.name && activity.student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activity.student?.studentId && activity.student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (activity.organizer && activity.organizer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case ACTIVITY_STATUS.APPROVED:
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case ACTIVITY_STATUS.PENDING:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case ACTIVITY_STATUS.REJECTED:
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const toggleFileVisibility = (activityId) => {
    setVisibleFiles(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">All Activities</h1>
            </div>
            <p className="text-purple-100 ml-13">
              Overview of all student activity submissions
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex space-x-6 text-sm">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-white">
                {stats?.totalActivities || 0}
              </div>
              <div className="text-purple-100">Total</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-white">
                {stats?.pendingCount || 0}
              </div>
              <div className="text-purple-100">Pending</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-white">
                {stats?.approvedCount || 0}
              </div>
              <div className="text-purple-100">Approved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg 
                className="h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by title, student, type, or organizer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200 hover:border-purple-400"
            >
              <option value="all">All Status</option>
              <option value={ACTIVITY_STATUS.PENDING}>Pending</option>
              <option value={ACTIVITY_STATUS.APPROVED}>Approved</option>
              <option value={ACTIVITY_STATUS.REJECTED}>Rejected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200 hover:border-purple-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="student">By Student Name</option>
              <option value="credits">By Credits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between space-x-6">
                  <div className="flex-1 min-w-0">
                    {/* Activity Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(activity.status)}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {activity.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{activity.student?.name}</span>
                            <span className="text-gray-400 ml-2">({activity.student?.studentId})</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{activity.student?.department} - Year {activity.student?.year}</span>
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {activity.type.replace('_', ' ').charAt(0).toUpperCase() + activity.type.replace('_', ' ').slice(1)}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8V9m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            {activity.credits} credits
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(activity.organizer || activity.description) && (
                      <div className="space-y-2 mb-4">
                            {activity.organizer && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Organizer:</span> {activity.organizer}
                              </p>
                            )}
                            {activity.description && (
                              <p className="text-sm text-gray-700 line-clamp-2">{activity.description}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side Info */}
                  <div className="flex flex-col items-end space-y-3 text-sm">
                        <div className="text-right">
                          <p className="text-gray-500">Submitted</p>
                          <p className="font-medium">{new Date(activity.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        {activity.approver && (
                          <div className="text-right">
                            <p className="text-gray-500">Reviewed by</p>
                            <p className="font-medium">{activity.approver.name}</p>
                          </div>
                        )}

                    {activity.remarks && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 max-w-48 transition-transform duration-200 hover:scale-105">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">Faculty Remarks</p>
                        <p className="text-xs text-yellow-700">{activity.remarks}</p>
                      </div>
                    )}

                    {/* View Attachment Button */}
                    {activity.filePath && (
                      <button
                        type="button"
                        onClick={() => toggleFileVisibility(activity.id)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {visibleFiles[activity.id] ? 'Hide' : 'View'} Certificate
                      </button>
                    )}
                  </div>
                </div>

                {/* Certificate View */}
                {activity.filePath && visibleFiles[activity.id] && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">Certificate Document</span>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={activity.filePath.startsWith('http') ? activity.filePath : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${activity.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>
                        <a
                          href={(activity.filePath.startsWith('http') ? activity.filePath : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${activity.filePath}`) + '?fl_attachment'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No activities found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No student activities have been submitted yet.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllActivities;
