import React, { useEffect, useState, useCallback } from "react";
import { studentAPI } from "../../utils/api";
import { API_BASE_URL } from "../../utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../shared/LoadingSpinner";

const defaultDetails = {
  tenthResult: "",
  twelfthResult: "",
  address: "",
  languages: "",
  skills: "",
  otherDetails: "",
  profilePicture: "",
  // 🔥 Enhanced fields for comprehensive CV
  phone: "",
  dateOfBirth: "",
  gender: "",
  category: "",
  hobbies: "",
  achievements: "",
  projects: "",
  certifications: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
};

const StudentCVForm = ({ user, isReadOnly = false }) => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(defaultDetails);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // 🔥 Enhanced message handling
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { profile } = await studentAPI.getProfile();
      const profileData = { ...defaultDetails, ...profile };
      setProfile(profileData);
      setFormData(profileData);

      // Set profile picture preview if exists
      if (profileData.profilePicture) {
        // Check if URL is already absolute (Cloudinary URL)
        if (profileData.profilePicture.startsWith('http')) {
          setProfilePicturePreview(profileData.profilePicture);
        } else {
          const backendBaseUrl = API_BASE_URL.replace('/api', '');
          setProfilePicturePreview(`${backendBaseUrl}${profileData.profilePicture}`);
        }
      }
    } catch (err) {
      showMessage('error', 'Failed to load your basic details!');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // 🔥 Profile picture upload handler
  const handleProfilePictureChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('error', 'Profile picture must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      setFormData(prev => ({ ...prev, profilePicture: file }));
    }
  }, [showMessage]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      await studentAPI.updateProfile(submitData);

      // Refresh profile data
      await fetchProfile();

      setEditMode(false);
      showMessage('success', 'Profile updated successfully! 🎉');
    } catch (error) {
      showMessage('error', `Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [formData, fetchProfile, showMessage]);

  // 🔥 Validation helper
  const getCompletionPercentage = useCallback(() => {
    const fields = Object.keys(defaultDetails);
    const filledFields = fields.filter(field => formData[field] && formData[field] !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  }, [formData]);

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'academic', label: 'Academic Details', icon: '📚' },
    { id: 'skills', label: 'Skills & Languages', icon: '🛠️' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
    { id: 'additional', label: 'Additional Info', icon: '➕' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" text="Loading your profile..." />
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success/Error Messages */}
      <AnimatePresence>
        {message.show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center ${message.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
              }`}
          >
            <span className="mr-2">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
              <h2 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 mb-2">
                <span className="text-2xl">📋</span>
                <span>Professional Profile</span>
                {isReadOnly && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 sm:px-3 py-1 rounded-full font-semibold">
                    🔒 View Only
                  </span>
                )}
              </h2>
            <p className="text-sm sm:text-base text-blue-100">
              Complete your profile to enhance your portfolio
            </p>
          </motion.div>

          <motion.div
            className="flex items-center space-x-3 mt-4 md:mt-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Animated Completion Progress */}
            <div className="relative">
              <div className="w-20 h-20">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-50 blur-md"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Main circle container */}
                <svg className="transform -rotate-90 w-20 h-20 relative z-10">
                  {/* Background circle */}
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="6"
                  />
                  
                  {/* Animated progress circle */}
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="url(#progressGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${completionPercentage * 2.14} 214`}
                    initial={{ strokeDasharray: "0 214" }}
                    animate={{ strokeDasharray: `${completionPercentage * 2.14} 214` }}
                    transition={{
                      duration: 1.5,
                      ease: "easeOut",
                      delay: 0.5
                    }}
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60A5FA" />
                      <stop offset="50%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#F0ABFC" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center percentage with animation */}
                <motion.div 
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 1,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-white"
                    animate={{
                      scale: completionPercentage === 100 ? [1, 1.2, 1] : 1
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: completionPercentage === 100 ? Infinity : 0,
                      repeatDelay: 2
                    }}
                  >
                    {completionPercentage}%
                  </motion.div>
                  <div className="text-[8px] text-blue-200 font-medium uppercase tracking-wide">Complete</div>
                </motion.div>
                
                {/* Sparkle effects when 100% */}
                {completionPercentage === 100 && (
                  <>
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          marginTop: '-3px',
                          marginLeft: '-3px'
                        }}
                        animate={{
                          x: [0, Math.cos(i * Math.PI / 2) * 40],
                          y: [0, Math.sin(i * Math.PI / 2) * 40],
                          opacity: [1, 0],
                          scale: [1, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Success checkmark when 100% */}
                {completionPercentage === 100 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.5,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                onClick={() => setShowModal(!showModal)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {showModal ? "Hide" : "View"}
              </motion.button>

              {!isReadOnly && (
                <motion.button
                  onClick={() => setEditMode(!editMode)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center ${editMode
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                    }`}
                >
                <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {editMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  )}
                </svg>
                  {editMode ? "Cancel" : "Edit"}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* View Mode - Enhanced Professional Layout */}
      <AnimatePresence>
        {showModal && !editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-gray-200 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Header Section with Profile */}
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
                  {/* Profile Picture with Frame */}
                  <div className="relative shrink-0">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-blue-100">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-5xl sm:text-6xl font-bold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white shadow-lg"></div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">{user?.name}</h3>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
                      <p className="text-base sm:text-lg text-blue-600 font-semibold">{user?.department || 'N/A'}</p>
                      <span className="text-gray-400">•</span>
                      <p className="text-base sm:text-lg text-gray-700 font-medium">Year {user?.year || 'N/A'}</p>
                      {user?.studentId && (
                        <>
                          <span className="text-gray-400">•</span>
                          <p className="text-xs sm:text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">ID: {user.studentId}</p>
                        </>
                      )}
                    </div>
                    
                    {/* Email - Professional Addition */}
                    {user?.email && (
                      <div className="flex items-center justify-center lg:justify-start text-gray-700 mb-4">
                        <svg className="w-4 h-4 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">{user.email}</span>
                      </div>
                    )}

                    {/* Quick Contact Info */}
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 mt-4">
                      {profile.phone && (
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <svg className="w-4 h-4 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium">{profile.phone}</span>
                        </div>
                      )}
                      {profile.dateOfBirth && (
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <svg className="w-4 h-4 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium">{new Date(profile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      {profile.address && (
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg max-w-full">
                          <svg className="w-4 h-4 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium truncate">{profile.address.split(',')[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Links - Right Side */}
                  {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
                    <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 flex-wrap justify-center lg:justify-start">
                      {profile.linkedinUrl && (
                        <a
                          href={profile.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      {profile.githubUrl && (
                        <a
                          href={profile.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-900 text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                          </svg>
                          GitHub
                        </a>
                      )}
                      {profile.portfolioUrl && (
                        <a
                          href={profile.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-xs sm:text-sm font-medium"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Portfolio
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
              </div>

              {/* Information Cards Grid */}
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4 pb-3 border-b-2 border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900">Personal Information</h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Phone', value: profile.phone },
                      { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Date of Birth', value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
                      { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Gender', value: profile.gender },
                      { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', label: 'Category', value: profile.category },
                      { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Address', value: profile.address }
                    ].map(item => item.value && (
                      <div key={item.label} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{item.label}</p>
                          <p className="text-sm text-gray-900 font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic Information Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4 pb-3 border-b-2 border-green-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900">Academic Details</h4>
                  </div>
                  <div className="space-y-4">
                    {/* Academic Results */}
                    {[
                      { icon: '📊', label: '10th Result', value: profile.tenthResult, color: 'bg-blue-50', showBadge: false },
                      { icon: '📈', label: '12th Result', value: profile.twelfthResult, color: 'bg-purple-50', showBadge: false }
                    ].map(item => item.value && (
                      <div key={item.label} className={`flex items-start p-3 ${item.color} rounded-lg hover:shadow-md transition-all`}>
                        <span className="text-2xl mr-3 flex-shrink-0">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{item.label}</p>
                          <p className="text-sm text-gray-900 font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Languages - Badge Display */}
                    {profile.languages && (
                      <div className="flex flex-col p-3 bg-green-50 rounded-lg hover:shadow-md transition-all">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">🗣️</span>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Languages</p>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-11">
                          {profile.languages.split(',').map((lang, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium shadow-sm">
                              {lang.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Skills - Badge Display */}
                    {profile.skills && (
                      <div className="flex flex-col p-3 bg-orange-50 rounded-lg hover:shadow-md transition-all">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">💻</span>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Technical Skills</p>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-11">
                          {profile.skills.split(',').map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium shadow-sm">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information - Full Width Cards */}
              {(profile.achievements || profile.projects || profile.certifications || profile.hobbies || profile.otherDetails) && (
                <>
                  {/* Professional Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-4 text-sm font-semibold text-gray-600">ADDITIONAL DETAILS</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                  {/* Achievements & Awards */}
                  {profile.achievements && (
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🏆</span>
                        Achievements & Awards
                      </h4>
                      <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{profile.achievements}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Projects */}
                  {profile.projects && (
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🚀</span>
                        Projects
                      </h4>
                      <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{profile.projects}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Certifications */}
                  {profile.certifications && (
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">📜</span>
                        Certifications
                      </h4>
                      <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{profile.certifications}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Hobbies & Interests - Badge Display */}
                  {profile.hobbies && (
                    <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🎨</span>
                        Hobbies & Interests
                      </h4>
                      <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                        <div className="flex flex-wrap gap-2">
                          {profile.hobbies.split(',').map((hobby, idx) => (
                            <span key={idx} className="px-3 py-2 bg-teal-200 text-teal-900 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
                              {hobby.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Career Objective */}
                  {profile.otherDetails && (
                    <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">🎯</span>
                        Career Objective
                      </h4>
                      <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line italic">{profile.otherDetails}</p>
                      </div>
                    </div>
                  )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Mode */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSave} className="p-4 sm:p-6">
              {/* Section Navigation */}
              <div className="flex flex-wrap gap-2 mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center ${activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    <span className="mr-1 sm:mr-2 text-base sm:text-lg">{section.icon}</span>
                    <span className="hidden sm:inline">{section.label}</span>
                    <span className="sm:hidden">{section.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Form Sections */}
              <div className="space-y-6">
                {/* Personal Information */}
                {activeSection === 'personal' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">👤</span>Personal Information
                    </h3>

                    {/* Profile Picture Upload */}
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                        {profilePicturePreview ? (
                          <img
                            src={profilePicturePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-blue-600">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Picture
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          name="phone"
                          type="tel"
                          placeholder="+91 9876543210"
                          value={formData.phone}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Category</option>
                          <option value="General">General</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Complete address with city, state, pincode"
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Academic Details */}
                {activeSection === 'academic' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">📚</span>Academic Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">10th Grade Result</label>
                        <input
                          name="tenthResult"
                          placeholder="e.g., 95% CBSE 2020"
                          value={formData.tenthResult}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">12th Grade Result</label>
                        <input
                          name="twelfthResult"
                          placeholder="e.g., 92% CBSE 2022"
                          value={formData.twelfthResult}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                      <textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        rows={3}
                        placeholder="List your certifications, courses, achievements..."
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Skills & Languages */}
                {activeSection === 'skills' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">🛠️</span>Skills & Languages
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                        <input
                          name="languages"
                          placeholder="Hindi, English, Sanskrit..."
                          value={formData.languages}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                        <input
                          name="skills"
                          placeholder="Python, React, Java, Photoshop..."
                          value={formData.skills}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</label>
                      <input
                        name="hobbies"
                        placeholder="Reading, Photography, Music, Sports..."
                        value={formData.hobbies}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Social Links */}
                {activeSection === 'social' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">🔗</span>Social Links
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">💼</span>LinkedIn URL
                        </label>
                        <input
                          name="linkedinUrl"
                          type="url"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={formData.linkedinUrl}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">💻</span>GitHub URL
                        </label>
                        <input
                          name="githubUrl"
                          type="url"
                          placeholder="https://github.com/yourusername"
                          value={formData.githubUrl}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">🌐</span>Portfolio Website
                        </label>
                        <input
                          name="portfolioUrl"
                          type="url"
                          placeholder="https://yourportfolio.com"
                          value={formData.portfolioUrl}
                          onChange={handleChange}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Additional Information */}
                {activeSection === 'additional' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">➕</span>Additional Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
                        <textarea
                          name="projects"
                          value={formData.projects}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Describe your major projects..."
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Achievements & Awards</label>
                        <textarea
                          name="achievements"
                          value={formData.achievements}
                          onChange={handleChange}
                          rows={3}
                          placeholder="List your achievements, awards, recognitions..."
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Details</label>
                        <textarea
                          name="otherDetails"
                          value={formData.otherDetails}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Career objectives, additional information..."
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t-2 border-gray-200 mt-6">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center shadow-lg"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentCVForm;
