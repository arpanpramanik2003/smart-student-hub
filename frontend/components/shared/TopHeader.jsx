'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE_URL } from '../../utils/constants';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserDepartmentLikeDisplay } from '../../utils/userDisplay';

const TopHeader = ({ user, onLogout, isSidebarCollapsed = false }) => {
  const departmentLikeDisplay = getUserDepartmentLikeDisplay(user);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const backendBaseUrl = API_BASE_URL.replace('/api', '');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setIsProfileMenuOpen(false);
    if (isProfileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen]);

  const getProfileImage = (profilePicture) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') ? profilePicture : `${backendBaseUrl}${profilePicture}`;
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  const profileImageUrl = getProfileImage(user?.profilePicture);
  const roleDisplay = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  return (
    <header className={`fixed top-0 right-0 left-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-30 transition-all duration-300 ${
      isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
    } left-0`}>
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side: Utilitarian Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-mono lg:ml-0 ml-12">
          <span className="text-zinc-500 dark:text-zinc-400">Console</span>
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <span className="text-zinc-500 dark:text-zinc-400">{roleDisplay}</span>
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Overview</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Online Status */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              {isOnline ? 'System Normal' : 'Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Profile Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
              className="flex items-center space-x-2 p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={user.name}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  unoptimized
                />
              ) : null}
              <div
                className={`w-7 h-7 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center ${profileImageUrl ? 'hidden' : 'flex'}`}
              >
                {getInitials(user.name)}
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden sm:inline-block max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <svg className="w-3.5 h-3.5 text-zinc-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Profile Header */}
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                    {user.role}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="p-1">
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between rounded transition-colors"
                  >
                    <span>Theme ({isDarkMode ? 'Dark' : 'Light'})</span>
                    <span className="text-[10px] font-mono uppercase text-zinc-400">Toggle</span>
                  </button>

                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-1"></div>

                  <button
                    onClick={() => { onLogout(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
