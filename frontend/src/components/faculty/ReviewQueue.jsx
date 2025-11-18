import React, { useState, useEffect } from 'react';
import { facultyAPI } from '../../utils/api';
import { STATUS_COLORS } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';

const ReviewQueue = ({ user, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [visibleFiles, setVisibleFiles] = useState({}); // For toggling file visibility

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  const fetchPendingActivities = async () => {
    try {
      const data = await facultyAPI.getPendingActivities();
      setActivities(data.activities);
    } catch (error) {
      console.error('Pending activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (activityId, status, remarks = '', credits = null) => {
    setReviewingId(activityId);
    
    try {
      const reviewData = {
        status,
        remarks,
        ...(status === 'approved' && credits !== null && { credits: parseFloat(credits) })
      };

      await facultyAPI.reviewActivity(activityId, reviewData);
      
      // Remove activity from pending list with animation
      setActivities(activities.filter(activity => activity.id !== activityId));
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setReviewingId(null);
    }
  };

  const handleQuickApprove = (activityId) => {
    const credits = document.getElementById(`credits-${activityId}`).value;
    const remarks = document.getElementById(`remarks-${activityId}`).value;
    handleReview(activityId, 'approved', remarks, credits);
  };

  const handleQuickReject = (activityId) => {
    const remarks = document.getElementById(`remarks-${activityId}`).value || 'Activity rejected by faculty';
    handleReview(activityId, 'rejected', remarks);
  };

  // 🔥 Toggle file visibility function
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
      {/* Header with Gradient Design */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          {/* Icon Badge */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              Review Queue
            </h1>
            <p className="text-white/90 mt-1">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'} pending your review
            </p>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {activities.length > 0 ? (
        <div className="space-y-6">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="p-6">
                {/* Activity Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activity.title}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      {[
                        {
                          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                          content: (
                            <div>
                              <p className="font-medium">{activity.student?.name}</p>
                              <p className="text-xs text-gray-500">{activity.student?.studentId}</p>
                            </div>
                          )
                        },
                        {
                          icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                          content: (
                            <div>
                              <p className="font-medium">{activity.student?.department}</p>
                              <p className="text-xs text-gray-500">Year {activity.student?.year}</p>
                            </div>
                          )
                        },
                        {
                          icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
                          content: activity.type.replace('_', ' ').charAt(0).toUpperCase() + activity.type.replace('_', ' ').slice(1)
                        },
                        {
                          icon: "M8 7V3a4 4 0 118 0v4m-4 8V9m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                          content: new Date(activity.date).toLocaleDateString()
                        }
                      ].map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          {item.content}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                </div>

                {/* Activity Details */}
                <div className="space-y-3 mb-6">
                  {activity.organizer && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Organizer:</span>
                      <span className="text-sm text-gray-600 ml-2">{activity.organizer}</span>
                    </div>
                  )}
                  
                  {activity.duration && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Duration:</span>
                      <span className="text-sm text-gray-600 ml-2">{activity.duration}</span>
                    </div>
                  )}
                  
                  {activity.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Submitted: {new Date(activity.createdAt).toLocaleDateString()}</span>
                      <span>Student credits requested: {activity.credits}</span>
                    </div>
                    
                    {/* View Attachment Button */}
                    {activity.filePath && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleFileVisibility(activity.id)}
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all duration-200 hover:shadow-md"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {visibleFiles[activity.id] ? 'Hide' : 'View'} Certificate
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Certificate Download Link */}
                  {activity.filePath && visibleFiles[activity.id] && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-800">Certificate Document</span>
                        </div>
                        {(() => {
                          const fileUrl = activity.filePath.startsWith('http') ? activity.filePath : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${activity.filePath}`;
                          const isPDF = fileUrl.toLowerCase().includes('.pdf');
                          const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileUrl);
                          
                          // For PDFs: Use backend proxy to avoid CORS, then open with PDF.js
                          // For images/docs: Direct URL
                          const proxyUrl = `${import.meta.env.VITE_API_URL}/files/view?url=${encodeURIComponent(fileUrl)}`;
                          const viewUrl = isPDF 
                            ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(proxyUrl)}` 
                            : fileUrl;
                          const downloadUrl = `${import.meta.env.VITE_API_URL}/files/download?url=${encodeURIComponent(fileUrl)}`;
                          
                          return (
                            <div className="flex space-x-2">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-all duration-200 hover:shadow-md"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </a>
                              <a
                                href={downloadUrl}
                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-all duration-200 hover:shadow-md"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Form with Gradient Background */}
                <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Review Activity
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor={`credits-${activity.id}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Credits to Award (Max: 10)
                      </label>
                      <input
                        type="number"
                        id={`credits-${activity.id}`}
                        min="0"
                        max="10"
                        step="0.1"
                        defaultValue={activity.credits > 10 ? 10 : activity.credits}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                        placeholder="0-10"
                        onInput={(e) => {
                          if (parseFloat(e.target.value) > 10) {
                            e.target.value = 10;
                          }
                        }}
                      />
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Student requested: {activity.credits > 10 ? '10 (capped)' : activity.credits} credits
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor={`remarks-${activity.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        id={`remarks-${activity.id}`}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                        placeholder="Add feedback or comments"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleQuickReject(activity.id)}
                      disabled={reviewingId === activity.id}
                      className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 hover:shadow-lg"
                    >
                      {reviewingId === activity.id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {reviewingId === activity.id ? 'Rejecting...' : 'Reject'}
                    </button>
                    
                    <button
                      onClick={() => handleQuickApprove(activity.id)}
                      disabled={reviewingId === activity.id}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 hover:shadow-lg"
                    >
                      {reviewingId === activity.id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {reviewingId === activity.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600">
              No pending activities to review at the moment.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              New student submissions will appear here for your review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
