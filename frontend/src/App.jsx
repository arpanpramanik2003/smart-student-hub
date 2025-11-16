import React, { useState, useEffect } from 'react';
import { authAPI } from './utils/api';
import { getToken, setToken, removeToken } from './utils/auth';
import { USER_ROLES } from './utils/constants';

// Pages
import LoginPage from './pages/LoginPage';

// Shared Components
import Header from './components/shared/Header';
import Layout from './components/shared/Layout';

// Student Components
import StudentDashboard from './components/student/Dashboard';
import ActivityForm from './components/student/ActivityForm';
import ActivityList from './components/student/ActivityList';
import Portfolio from './components/student/Portfolio';

// Faculty Components
import FacultyDashboard from './components/faculty/Dashboard';
import FacultyReviewQueue from './components/faculty/ReviewQueue';
import AllActivities from './components/faculty/AllActivities';

// Admin Components
import AdminDashboard from './components/admin/Dashboard';
import UserManagement from './components/admin/UserManagement';
import Reports from './components/admin/Reports';
import Analytics from './components/admin/Analytics';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Handle hash navigation ONLY after user is loaded and app is initialized
  useEffect(() => {
    if (!isInitialized || !user) return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      console.log('🔗 Hash changed to:', hash);

      // Map hash to view names
      const hashToViewMap = {
        'submit-activity': 'submit',
        'my-activities': 'activities',
        'activities': 'activities',
        'portfolio': 'portfolio',
        'dashboard': 'dashboard',
        'review': 'review',
        'all-activities': 'all-activities',
        'users': 'users',
        'reports': 'reports',
        'analytics': 'analytics'
      };

      const newView = hashToViewMap[hash] || 'dashboard';
      console.log('🎯 Setting view to:', newView);
      setCurrentView(newView);
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Handle initial hash on load, but ONLY if there's actually a hash
    if (window.location.hash && window.location.hash !== '#') {
      console.log('🚀 Initial hash detected:', window.location.hash);
      handleHashChange();
    } else {
      // Clear any existing hash and ensure we're on dashboard
      console.log('🏠 No hash, staying on dashboard');
      setCurrentView('dashboard');
      if (window.location.hash) {
        window.location.hash = '';
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isInitialized, user]);

  const fetchProfile = async () => {
    try {
      const data = await authAPI.getProfile();
      setUser(data.user);
      // Also save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Profile fetch error:', error);
      removeToken();
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Add updateUser function
  const updateUser = (updatedUserData) => {
    console.log('🔄 Updating user data:', updatedUserData);
    setUser(updatedUserData);
    // Persist to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentView('dashboard');
    // Save user data to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    // Clear any hash on login
    window.location.hash = '';
  };

  const handleLogout = () => {
    setUser(null);
    removeToken();
    localStorage.removeItem('user');
    setCurrentView('dashboard');
    // Clear hash on logout
    window.location.hash = '';
    setIsInitialized(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderCurrentView = () => {
    console.log('🎬 Rendering view:', currentView, 'for role:', user.role);
    
    // Student Views
    if (user.role === USER_ROLES.STUDENT) {
      switch (currentView) {
        case 'dashboard':
          return (
            <StudentDashboard
              user={user}
              token={getToken()}
              updateUser={updateUser}
            />
          );
        case 'activities':
          return <ActivityList user={user} token={getToken()} />;
        case 'submit':
          console.log('📝 Rendering ActivityForm for user:', user.name);
          try {
            return (
              <div className="space-y-6">
                <ActivityForm 
                  user={user} 
                  token={getToken()} 
                  onSuccess={() => {
                    console.log('✅ Activity submitted successfully');
                    setCurrentView('activities');
                    window.location.hash = '#my-activities';
                  }} 
                />
              </div>
            );
          } catch (error) {
            console.error('❌ Error rendering ActivityForm:', error);
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Form</h2>
                <p className="text-red-700">{error.message}</p>
                <button 
                  onClick={() => {
                    setCurrentView('dashboard');
                    window.location.hash = '';
                  }}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Go Back to Dashboard
                </button>
              </div>
            );
          }
        case 'portfolio':
          return <Portfolio user={user} token={getToken()} />;
        default:
          return (
            <StudentDashboard
              user={user}
              token={getToken()}
              updateUser={updateUser}
            />
          );
      }
    }

    // Faculty Views
    if (user.role === USER_ROLES.FACULTY) {
      switch (currentView) {
        case 'dashboard':
          return (
            <FacultyDashboard
              user={user}
              token={getToken()}
              onNavigate={setCurrentView}
            />
          );
        case 'review':
          return <FacultyReviewQueue user={user} token={getToken()} />;
        case 'all-activities':
          return <AllActivities user={user} token={getToken()} />;
        default:
          return (
            <FacultyDashboard
              user={user}
              token={getToken()}
              onNavigate={setCurrentView}
            />
          );
      }
    }

    // Admin Views
    if (user.role === USER_ROLES.ADMIN) {
      switch (currentView) {
        case 'dashboard':
          return (
            <AdminDashboard 
              user={user} 
              token={getToken()} 
              onNavigate={setCurrentView}
            />
          );
        case 'users':
          return (
            <UserManagement 
              user={user} 
              token={getToken()} 
              onNavigate={setCurrentView}
            />
          );
        case 'reports':
          return (
            <Reports 
              user={user} 
              token={getToken()} 
              onNavigate={setCurrentView}
            />
          );
        case 'analytics':
          return (
            <Analytics 
              user={user} 
              token={getToken()} 
              onNavigate={setCurrentView}
            />
          );
        default:
          return (
            <AdminDashboard 
              user={user} 
              token={getToken()} 
              onNavigate={setCurrentView}
            />
          );
      }
    }

    return <div>Unknown user role</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <Layout animated={false}>
        {renderCurrentView()}
      </Layout>
    </div>
  );
}

export default App;
