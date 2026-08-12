'use client';
import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { studentAPI } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { getStudentProgramDisplay } from '../../utils/userDisplay';
import LoadingSpinner, { CardSkeleton } from '../shared/LoadingSpinner';

const backendBaseUrl = API_BASE_URL.replace('/api', '');

const Dashboard = ({ user, token, updateUser }) => {
  const academicDisplay = getStudentProgramDisplay(user);
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  
  const [profilePreview, setProfilePreview] = useState(() => {
    if (!user?.profilePicture) return '/default-avatar.png';
    return user.profilePicture.startsWith('http') 
      ? user.profilePicture 
      : `${backendBaseUrl}${user.profilePicture}`;
  });

  useEffect(() => {
    if (user?.profilePicture) {
      const url = user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `${backendBaseUrl}${user.profilePicture}`;
      setProfilePreview(url);
    } else {
      setProfilePreview('/default-avatar.png');
    }
  }, [user?.profilePicture]);

  const showToast = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const [progressData, setProgressData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, activitiesData, progressRes] = await Promise.all([
        studentAPI.getStats(),
        studentAPI.getActivities({ limit: 5 }),
        studentAPI.getCreditProgress().catch(() => null),
      ]);
      setStats(statsData);
      setRecentActivities(activitiesData.activities || []);
      if (progressRes) setProgressData(progressRes);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [fetchData]);

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    const file = e.target.avatar.files[0];
    if (!file) return;
    
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (data.profilePicture) {
        const newProfileUrl = data.profilePicture.startsWith('http') 
          ? data.profilePicture 
          : `${backendBaseUrl}${data.profilePicture}`;
        setProfilePreview(newProfileUrl);
        
        if (typeof updateUser === 'function') {
          updateUser({ ...user, profilePicture: data.profilePicture });
        }
        
        e.target.reset();
        showToast('success', 'Profile photo updated successfully!');
      } else {
        showToast('error', 'Photo upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('error', 'Photo upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat().format(num || 0);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Credit Goal Target Milestone (Default target: 20 credits)
  const CREDIT_TARGET = 20;
  const earnedCredits = stats?.totalCredits || 0;
  const creditProgress = useMemo(() => {
    return Math.min(100, Math.round((earnedCredits / CREDIT_TARGET) * 100));
  }, [earnedCredits]);

  if (loading && !stats) {
    return (
      <div className="space-y-5 animate-fade-in">
        <CardSkeleton cards={4} />
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" text="Loading student console..." />
        </div>
      </div>
    );
  }

  const approvedCount = stats?.byStatus?.approved || 0;
  const pendingCount = stats?.byStatus?.pending || 0;
  const rejectedCount = stats?.byStatus?.rejected || 0;
  const totalCount = stats?.totalActivities || 0;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notification */}
      {message.show && (
        <div className={`rounded border p-3 text-xs font-mono transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.type === 'success' ? '✓ ' : '✕ '}{message.text}</span>
            <button onClick={() => setMessage(prev => ({ ...prev, show: false }))} className="ml-4 underline hover:opacity-80">
              [Dismiss]
            </button>
          </div>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start space-x-4">
            <Image
              src={profilePreview}
              alt={user.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
              unoptimized
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Student Portal
                </span>
                <span className="text-xs font-mono text-zinc-400">•</span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  ID: {user.studentId || 'N/A'}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
                Welcome, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {academicDisplay} • Year {user.year || 1} {user.admissionYear ? `(Batch ${user.admissionYear})` : ''}
              </p>

              {/* Photo Upload Form */}
              <form onSubmit={handleAvatarUpload} className="mt-2.5 flex items-center space-x-2 text-xs font-mono">
                <input 
                  type="file" 
                  name="avatar" 
                  accept="image/*" 
                  className="text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-zinc-200 dark:file:border-zinc-800 file:text-[10px] file:font-mono file:bg-zinc-50 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-100"
                />
                <button 
                  type="submit" 
                  disabled={avatarUploading} 
                  className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 text-[11px] disabled:opacity-50"
                >
                  {avatarUploading ? 'Uploading...' : 'Update Photo'}
                </button>
              </form>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto font-mono text-xs">
            <button
              onClick={() => router.push('/student/submit')}
              className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center space-x-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Submit Activity</span>
            </button>

            <button
              onClick={() => router.push('/student/portfolio')}
              className="px-3.5 py-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              My Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Academic-Year & Lifetime Credit Progress Tracking */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
                {progressData?.academicYear?.label || 'Current Academic Year'} Credit Progress
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">
              Annual Institutional Co-Curricular Target: <strong>20.0 Credits</strong> (July 1 – June 30)
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {progressData?.academicYear?.creditsEarned || earnedCredits} / 20.0 Credits
              </span>
              <span className="block text-[10px] text-zinc-400">
                {progressData?.academicYear?.progressPercentage || creditProgress}% Annual Target Met
              </span>
            </div>
          </div>
        </div>

        {/* Slim Progress Track */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
            style={{ width: `${progressData?.academicYear?.progressPercentage || creditProgress}%` }}
          />
        </div>

        {/* NAAC Criterion Breakdown Chips */}
        {progressData?.academicYear?.criterionBreakdown && progressData.academicYear.criterionBreakdown.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] uppercase text-zinc-500 block">Current Academic Year NAAC Criterion Breakdown:</span>
            <div className="flex flex-wrap gap-2">
              {progressData.academicYear.criterionBreakdown.map((item) => (
                <div key={item.criterion} className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                  <span className="text-zinc-500 mr-1">{item.criterion}:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{item.credits} pts</strong>
                  <span className="text-[10px] text-zinc-400 ml-1">({item.activityCount} act)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lifetime vs Current Standing Summary */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 flex-wrap gap-2">
          <span>
            • <strong>Lifetime Record:</strong> {progressData?.lifetime?.totalCredits || earnedCredits} total credits across {progressData?.lifetime?.totalApprovedActivities || approvedCount} verified activities.
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Synchronized with Institutional Ledger
          </span>
        </div>
      </div>

      {/* Flat Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Submissions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            TOTAL SUBMISSIONS
          </span>
          <p className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-2">
            {formatNumber(totalCount)}
          </p>
          <p className="text-xs font-mono text-zinc-500">Activities logged</p>
        </div>

        {/* Card 2: Approved Activities */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>APPROVED ACTIVITIES</span>
          </span>
          <p className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight my-2">
            {formatNumber(approvedCount)}
          </p>
          <p className="text-xs font-mono text-zinc-500">Verified by faculty</p>
        </div>

        {/* Card 3: Pending Evaluation */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span>PENDING REVIEW</span>
          </span>
          <p className="text-3xl font-bold font-mono text-zinc-950 dark:text-zinc-50 tracking-tight my-2">
            {formatNumber(pendingCount)}
          </p>
          <p className="text-xs font-mono text-zinc-500">Awaiting faculty evaluation</p>
        </div>

        {/* Card 4: Earned Credits */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            TOTAL EARNED CREDITS
          </span>
          <p className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight my-2">
            {formatNumber(earnedCredits)}
          </p>
          <p className="text-xs font-mono text-zinc-500">Academic points total</p>
        </div>
      </div>

      {/* Recent Activities Log */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-xs">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Recent Activity Submissions</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">Latest submissions and approval statuses</p>
          </div>
          <button
            onClick={() => router.push('/student/submit')}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center space-x-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Activity</span>
          </button>
        </div>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-xs">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate" title={activity.title}>
                    {activity.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {activity.type.replace('_', ' ')} • {formatDate(activity.date)}
                    {activity.organizer ? ` • ${activity.organizer}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{activity.credits} Credits
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activity.status === 'approved' ? 'bg-emerald-500' :
                      activity.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="capitalize text-zinc-700 dark:text-zinc-300 text-[11px]">{activity.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center font-mono text-xs text-zinc-500 space-y-3">
            <p>No activity submissions recorded yet.</p>
            <button
              onClick={() => router.push('/student/submit')}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors inline-block"
            >
              Submit Your First Activity
            </button>
          </div>
        )}
      </div>

      {/* Quick Shortcuts & Guidance Box */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 font-mono text-xs space-y-2">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">
          Student Portal Direct Shortcuts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => router.push('/student/submit')}
            className="p-3 text-left rounded bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-600 transition-all"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Submit Activity →</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Upload certificate or evidence</p>
          </button>

          <button
            onClick={() => router.push('/student/portfolio')}
            className="p-3 text-left rounded bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-600 transition-all"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">View Portfolio →</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Generate digital CV & achievements</p>
          </button>

          <button
            onClick={() => router.push('/student/browse')}
            className="p-3 text-left rounded bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-600 transition-all"
          >
            <p className="font-bold text-zinc-900 dark:text-zinc-100">Browse Peers →</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Discover peer activities & trends</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
