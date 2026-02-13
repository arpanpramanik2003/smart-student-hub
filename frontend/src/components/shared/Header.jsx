import React, { useState, useEffect } from 'react';
import { USER_ROLES, API_BASE_URL } from '../../utils/constants';

const Header = ({ user, onLogout, currentView, setCurrentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scrolled, setScrolled] = useState(false);

  const isStudent = user.role === USER_ROLES.STUDENT;
  const isFaculty = user.role === USER_ROLES.FACULTY || user.role === USER_ROLES.ADMIN;
  const isAdmin = user.role === USER_ROLES.ADMIN;

  // Handle scroll effect for navbar (use throttle to prevent blinking)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      { 
        key: 'dashboard', 
        label: 'Dashboard', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      { 
        key: 'activities', 
        label: 'My Activities', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      { 
        key: 'submit', 
        label: 'Submit Activity', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      },
      { 
        key: 'portfolio', 
        label: 'Portfolio', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      },
    ],
    faculty: [
      { 
        key: 'dashboard', 
        label: 'Dashboard', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      { 
        key: 'review', 
        label: 'Review Queue', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      },
      { 
        key: 'all-activities', 
        label: 'All Activities', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
    ],
    admin: [
      { 
        key: 'dashboard', 
        label: 'Dashboard', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      { 
        key: 'users', 
        label: 'User Management', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      },
      { 
        key: 'reports', 
        label: 'Reports', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      { 
        key: 'analytics', 
        label: 'Analytics', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
    ]
  };

  const currentNavItems = navItems[user.role] || navItems.student;

  // Profile Avatar Component
  const ProfileAvatar = React.memo(({ size = 'normal', showOnlineStatus = true }) => {
    const backendBaseUrl = API_BASE_URL.replace('/api', '');
    const [imageError, setImageError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    };

    // Handle profile picture URL correctly (same as Dashboard)
    const profileImageUrl = user?.profilePicture
      ? (user.profilePicture.startsWith('http')
          ? user.profilePicture
          : `${backendBaseUrl}${user.profilePicture}`)
      : null;

    const sizeClasses = {
      small: 'w-8 h-8 text-xs',
      normal: 'w-10 h-10 text-sm',
      large: 'w-12 h-12 text-base'
    };

    const getRoleBgGradient = () => {
      switch (user.role) {
        case USER_ROLES.ADMIN:
          return 'from-purple-500 via-purple-600 to-indigo-700';
        case USER_ROLES.FACULTY:
          return 'from-blue-500 via-blue-600 to-indigo-600';
        case USER_ROLES.STUDENT:
          return 'from-emerald-500 via-teal-600 to-cyan-600';
        default:
          return 'from-gray-500 to-gray-600';
      }
    };

    return (
      <div className="relative group">
        {profileImageUrl && !imageError ? (
          <div className="relative">
            <img
              src={profileImageUrl}
              alt={`${user.name}'s profile`}
              className={`${sizeClasses[size]} rounded-full object-cover border-3 border-white shadow-lg ring-2 ring-white/30 transition-all duration-300 group-hover:ring-4 group-hover:ring-white/50 group-hover:scale-105 ${!imgLoaded ? 'opacity-0' : 'opacity-100'}`}
              onError={(e) => {
                console.log('Profile image load error:', profileImageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                setImgLoaded(true);
                setImageError(false);
              }}
              loading="lazy"
            />
            {/* Loading placeholder while image loads */}
            {!imgLoaded && (
              <div className={`${sizeClasses[size]} absolute inset-0 bg-gradient-to-br ${getRoleBgGradient()} rounded-full flex items-center justify-center border-3 border-white shadow-lg ring-2 ring-white/30 animate-pulse`}>
                <span className="text-white font-bold">
                  {getInitials(user.name)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={`${sizeClasses[size]} bg-gradient-to-br ${getRoleBgGradient()} rounded-full flex items-center justify-center border-3 border-white shadow-lg ring-2 ring-white/30 transition-all duration-300 group-hover:ring-4 group-hover:ring-white/50 group-hover:scale-105`}>
            <span className="text-white font-bold">
              {getInitials(user.name)}
            </span>
          </div>
        )}
        
        {/* Online/Offline indicator */}
        {showOnlineStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full shadow-sm ${
              isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}
            title={isOnline ? 'Online' : 'Offline'}
          />
        )}
      </div>
    );
  });

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
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-shadow duration-200 will-change-shadow ${
      scrolled ? 'shadow-lg' : 'shadow-md'
    }`} style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center space-x-3 group focus:outline-none"
            >
              {/* Logo */}
              <div className="relative">
                <img 
                  src="/android-chrome-192x192.png" 
                  alt="Smart Student Hub" 
                  className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {/* Brand Name */}
              <div className="hidden md:flex flex-col">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  Smart Student Hub
                </h1>
                <p className="text-xs text-gray-500 font-medium">Academic Excellence Platform</p>
              </div>
              
              {/* Mobile Brand */}
              <div className="md:hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SSH
                </h1>
              </div>
            </button>
            
            {/* Role Badge */}
            <div className={`hidden sm:flex px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getRoleBadgeColor()}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {currentNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 group ${
                  currentView === item.key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <span className={`transition-transform duration-200 ${
                  currentView === item.key ? '' : 'group-hover:scale-110'
                }`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Notification Icon (Placeholder for future) */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <ProfileAvatar size="normal" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.department || 'Student'}</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <ProfileAvatar size="large" showOnlineStatus={false} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-xs text-blue-100">{user.email}</p>
                      </div>
                    </div>
                    {user.department && (
                      <div className="mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg inline-block">
                        <p className="text-xs font-medium text-white">{user.department}</p>
                      </div>
                    )}
                  </div>

                  {/* Profile Actions */}
                  <div className="py-2">
                    {isStudent && (
                      <button
                        onClick={() => {
                          handleNavClick('portfolio');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors group"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </button>
                    )}
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    
                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors group"
                    >
                      <svg className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex items-center space-x-3 sm:hidden">
            <ProfileAvatar size="small" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none transition-all"
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
          className="sm:hidden bg-white shadow-xl border-t border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Info Section */}
          <div className="px-4 py-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="flex items-start space-x-4">
              <ProfileAvatar size="large" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{user.email}</p>
                {user.department && (
                  <p className="text-xs text-gray-500 mt-1">{user.department}</p>
                )}
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getRoleBadgeColor()}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="py-2">
            {currentNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                  currentView === item.key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-l-4 border-indigo-800 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {currentView === item.key && (
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Footer Actions */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-5 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
