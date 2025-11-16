import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../utils/api';
import { STATUS_COLORS, ACTIVITY_STATUS } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const ActivityList = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleFiles, setVisibleFiles] = useState({});

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const data = await studentAPI.getActivities(params);
      setActivities(data.activities);
    } catch (error) {
      console.error('Activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.organizer && activity.organizer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = status => {
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

  const toggleFileVisibility = activityId => {
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            >
              <option value="all">All Status</option>
              <option value={ACTIVITY_STATUS.PENDING}>Pending</option>
              <option value={ACTIVITY_STATUS.APPROVED}>Approved</option>
              <option value={ACTIVITY_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between space-x-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(activity.status)}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {activity.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>

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
                    <div>
                      {activity.organizer && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Organizer:</span> {activity.organizer}
                        </p>
                      )}
                      {activity.duration && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Duration:</span> {activity.duration}
                        </p>
                      )}
                      {activity.description && (
                        <p className="text-sm text-gray-700 mb-4">{activity.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Side Panel */}
                  <div className="flex flex-col justify-between shrink-0 w-44 text-sm space-y-4">
                    <div>
                      <p>
                        <span className="font-semibold">Submitted:</span> {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      {activity.approver && (
                        <p>
                          <span className="font-semibold">Reviewed by:</span> {activity.approver.name}
                        </p>
                      )}
                    </div>

                    {activity.remarks && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="font-semibold text-yellow-800 mb-1">Faculty Remarks</p>
                        <p className="text-yellow-700">{activity.remarks}</p>
                      </div>
                    )}

                    {activity.filePath && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleFileVisibility(activity.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          {visibleFiles[activity.id] ? 'Hide Attachment' : 'View Attachment'}
                        </button>
                        {visibleFiles[activity.id] && (
                          <div className="mt-2">
                            <a
                              href={`http://localhost:5000/${activity.filePath.replace(/^uploads\//, 'uploads/')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm hover:text-blue-800 transition-colors"
                            >
                              Open attached document
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No matching activities' : 'No activities yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start building your portfolio by submitting your first activity.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
