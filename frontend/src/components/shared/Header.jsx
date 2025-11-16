import React, { useState, useEffect } from 'react';
import { USER_ROLES } from '../../utils/constants';

const Header = ({ user, onLogout, currentView, setCurrentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isStudent = user.role === USER_ROLES.STUDENT;
  const isFaculty = user.role === USER_ROLES.FACULTY || user.role === USER_ROLES.ADMIN;
  const isAdmin = user.role === USER_ROLES.ADMIN;

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
    };
    
    if (isMobileMenuOpen || isProfileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen, isProfileMenuOpen]);

  const navItems = {
    student: [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'activities', label: 'My Activities', icon: '📝' },
      { key: 'submit', label: 'Submit Activity', icon: '➕' },
      { key: 'portfolio', label: 'Portfolio', icon: '💼' },
    ],
    faculty: [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'review', label: 'Review Queue', icon: '✅' },
      { key: 'all-activities', label: 'All Activities', icon: '📋' },
    ],
    admin: [
      { key: 'dashboard', label: 'Dashboard', icon: '📊' },
      { key: 'users', label: 'User Management', icon: '👥' },
      { key: 'reports', label: 'Reports', icon: '📈' },
      { key: 'analytics', label: 'Analytics', icon: '📉' },
    ]
  };

  const currentNavItems = navItems[user.role] || navItems.student;

  // Profile Avatar Component
  const ProfileAvatar = ({ size = 'normal' }) => {
    const backendBaseUrl = 'http://localhost:5000';
    const [imageError, setImageError] = useState(false);
    
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    };

    const profileImageUrl = user?.profilePicture 
      ? `${backendBaseUrl}${user.profilePicture}` 
      : null;

    const sizeClasses = {
      normal: 'w-8 h-8 text-sm',
      large: 'w-10 h-10 text-base'
    };

    return (
      <div className="relative">
        {profileImageUrl && !imageError ? (
          <img
            src={profileImageUrl}
            alt={`${user.name}'s profile`}
            className={`${sizeClasses[size]} rounded-full object-cover border-2 border-blue-200 shadow-sm transition-transform hover:scale-105`}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-md`}>
            <span className="text-white font-bold">
              {getInitials(user.name)}
            </span>
          </div>
        )}
        
        {/* Online/Offline indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
            isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}
        />
      </div>
    );
  };

  const handleNavClick = (itemKey) => {
    setCurrentView(itemKey);
    setIsMobileMenuOpen(false);
    
    // Update hash for consistency
    const hashMap = {
      'activities': 'my-activities',
      'submit': 'submit-activity'
    };
    const hash = hashMap[itemKey] || itemKey;
    window.location.hash = `#${hash}`;
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case USER_ROLES.ADMIN:
        return 'bg-purple-100 text-purple-700';
      case USER_ROLES.FACULTY:
        return 'bg-blue-100 text-blue-700';
      case USER_ROLES.STUDENT:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 
              className="text-lg sm:text-xl font-bold text-white flex items-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleNavClick('dashboard')}
            >
              <span className="text-xl sm:text-2xl mr-2">🎓</span>
              <span className="hidden sm:inline">Smart Student Hub</span>
              <span className="sm:hidden">SSH</span>
            </h1>
            <span className="ml-2 sm:ml-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-white bg-opacity-20 backdrop-blur-sm text-white border border-white border-opacity-30">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-2">
            {currentNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  currentView === item.key
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-white hover:bg-white hover:bg-opacity-20 hover:backdrop-blur-sm'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center space-x-3 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="flex items-center space-x-3 hover:bg-white hover:bg-opacity-10 rounded-lg p-2 transition-all duration-200"
              >
                <ProfileAvatar />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-indigo-200">{user.email}</p>
                </div>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{user.department}</p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <ProfileAvatar size="normal" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="ml-3 p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none transition-all"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="sm:hidden bg-white shadow-xl border-t border-indigo-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Info Section */}
          <div className="px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <ProfileAvatar size="large" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">{user.department}</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="py-2">
            {currentNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all duration-200 flex items-center space-x-3 ${
                  currentView === item.key
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {currentView === item.key && (
                  <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Mobile Footer Actions */}
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs font-medium text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span>{isOnline ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
