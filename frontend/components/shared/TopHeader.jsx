'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../utils/constants';
import { notificationAPI } from '../../utils/api';
import { useTheme } from '../../contexts/ThemeContext';

const TopHeader = ({ user, onLogout, isSidebarCollapsed = false }) => {
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getNotifications();
      setUnreadCount(res.unreadCount || 0);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s for updates
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileMenuOpen(false);
      setIsNotifMenuOpen(false);
    };
    if (isProfileMenuOpen || isNotifMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileMenuOpen, isNotifMenuOpen]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markRead({ markAllRead: true });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsNotifMenuOpen(false);
    if (!notif.isRead) {
      try {
        await notificationAPI.markRead({ notificationId: notif.id });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Mark notification read error:', err);
      }
    }

    // Role-based smart route navigation
    if (user.role === 'student') {
      router.push('/student/activities');
    } else if (user.role === 'faculty') {
      router.push('/faculty/review');
    } else if (user.role === 'admin') {
      if (notif.type === 'grievance_filed') {
        router.push('/admin/grievances');
      } else {
        router.push('/admin/review');
      }
    }
  };

  const getProfileImage = (profilePicture) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') ? profilePicture : `${backendBaseUrl}${profilePicture}`;
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(word => word.charAt(0).toUpperCase()).slice(0, 2).join('') : 'U';
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

          {/* Interactive Notification Bell */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsNotifMenuOpen(!isNotifMenuOpen); setIsProfileMenuOpen(false); }}
              className="p-1.5 relative rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-50 font-mono text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
                    Notifications ({unreadCount} Unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      [Mark all read]
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400 text-[11px]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                          !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold' : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                            {!notif.isRead && <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1.5" />}
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-zinc-400 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 font-normal line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotifMenuOpen(false); }}
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
                {user.name ? user.name.split(' ')[0] : 'User'}
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
