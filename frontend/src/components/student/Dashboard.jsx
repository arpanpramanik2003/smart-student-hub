import React, { useState, useEffect, useTransition } from 'react';
import { studentAPI } from '../../utils/api';
import { STATUS_COLORS } from '../../utils/constants';
import LoadingSpinner from '../shared/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../utils/constants';

// Get backend base URL from environment variable (without /api suffix)
const backendBaseUrl = API_BASE_URL.replace('/api', '');

const Dashboard = ({ user, token, updateUser }) => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // Initialize profilePreview with proper fallback
  const [profilePreview, setProfilePreview] = useState(() => {
    return user?.profilePicture 
      ? `${backendBaseUrl}${user.profilePicture}`  
      : '/default-avatar.png';
  });

  // Sync profilePreview when user data changes
  useEffect(() => {
    if (user?.profilePicture) {
      setProfilePreview(`${backendBaseUrl}${user.profilePicture}`);
    } else {
      setProfilePreview('/default-avatar.png');
    }
  }, [user?.profilePicture]);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, activitiesData] = await Promise.all([
        studentAPI.getStats(),
        studentAPI.getActivities({ limit: 5 })
      ]);
      setStats(statsData);
      setRecentActivities(activitiesData.activities);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    const file = e.target.avatar.files[0];
    if (!file) return;
    
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/students/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (data.profilePicture) {
        const newProfileUrl = `${backendBaseUrl}${data.profilePicture}`;
        setProfilePreview(newProfileUrl);
        
        // 🔥 KEY FIX: Update the parent user object
        if (typeof updateUser === 'function') {
          updateUser({ ...user, profilePicture: data.profilePicture });
        }
        
        // Reset the form
        e.target.reset();
        alert('Profile picture updated successfully!');
      } else {
        alert('Photo upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Photo upload error!');
    }
    
    setAvatarUploading(false);
  };

  const formatStat = (val) => (isPending || loading ? '...' : val ?? 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 flex flex-col sm:flex-row items-center"
      >
        <img
          src={profilePreview}
          alt="Profile"
          className="w-20 h-20 rounded-full border-4 border-blue-100 object-cover mr-6 shadow-xl"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name}!</h1>
          <p className="text-blue-100">{user.department} • Year {user.year} • ID: {user.studentId}</p>
          <form onSubmit={handleAvatarUpload} className="flex items-center mt-2 space-x-2">
            <input 
              type="file" 
              name="avatar" 
              accept="image/*" 
              className="block py-1 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            <button 
              type="submit" 
              disabled={avatarUploading} 
              className={`bg-white text-blue-600 font-semibold px-3 py-1 rounded transition ${avatarUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
            >
              {avatarUploading ? 'Uploading...' : 'Update Photo'}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center transition-shadow hover:shadow-md">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-gray-900">{formatStat(stats?.totalActivities)}</h3>
            <p className="text-sm text-gray-600">Total Activities</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center transition-shadow hover:shadow-md">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-gray-900">{formatStat(stats?.byStatus?.approved)}</h3>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center transition-shadow hover:shadow-md">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-gray-900">{formatStat(stats?.byStatus?.pending)}</h3>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center transition-shadow hover:shadow-md">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-gray-900">{formatStat(stats?.totalCredits)}</h3>
            <p className="text-sm text-gray-600">Total Credits</p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <button
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors"
            onClick={() => window.location.hash = '#submit-activity'}
          >
            Submit Activity
          </button>
        </div>
        <div className="p-6">
          <AnimatePresence>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.type.replace('_', ' ')} • {new Date(activity.date).toLocaleDateString()}
                      </p>
                      {activity.organizer && (
                        <p className="text-sm text-gray-500 mt-1">by {activity.organizer}</p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">
                        {activity.credits} credits
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status] || 'text-gray-600 bg-gray-100'}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                <p className="text-gray-600 mb-4">Start building your portfolio by submitting your first activity.</p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => window.location.hash = '#submit-activity'}
                >
                  Submit Activity
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
