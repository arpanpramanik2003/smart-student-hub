import { API_BASE_URL } from './constants';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const apiRequest = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured. Set it in frontend .env.local');
  }

  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Handle JSON and FormData bodies correctly
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    // Remove Content-Type for FormData to let browser set boundary
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Network error' }));
    const msg = err.error?.message || err.message || (typeof err.error === 'string' ? err.error : 'Request failed');
    throw new Error(msg);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: credentials,
  }),
  register: (userData) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: userData,
  }),
  getProfile: () => apiRequest('/api/auth/profile'),
  changePassword: (data) => apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: data,
  }),
};

// Student API
export const studentAPI = {
  getProfile: () => apiRequest('/api/students/profile'),

  updateProfile: (data) => {
    let body;
    if (data instanceof FormData) {
      body = data;
    } else {
      body = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          if (data[key] instanceof File) {
            body.append(key, data[key]);
          } else {
            body.append(key, String(data[key]));
          }
        }
      });
    }
    return apiRequest('/api/students/profile', {
      method: 'PUT',
      body: body,
    });
  },

  getStats: () => apiRequest('/api/students/activities/stats'),

  getActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/students/activities${query ? `?${query}` : ''}`);
  },

  submitActivity: (formData) => apiRequest('/api/students/activities', {
    method: 'POST',
    body: formData,
  }),

  updateActivity: (activityId, formData) => apiRequest(`/api/students/activities/${activityId}`, {
    method: 'PUT',
    body: formData,
  }),

  deleteActivity: (activityId) => apiRequest(`/api/students/activities/${activityId}`, {
    method: 'DELETE',
  }),

  getAllStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/students/browse${query ? `?${query}` : ''}`);
  },

  uploadAvatar: (formData) => apiRequest('/api/students/upload-avatar', {
    method: 'POST',
    body: formData,
  }),

  resubmitActivity: (activityId, formData) => apiRequest(`/api/students/activities/${activityId}/resubmit`, {
    method: 'PUT',
    body: formData,
  }),

  fileAppeal: (activityId, data) => apiRequest(`/api/students/activities/${activityId}/appeal`, {
    method: 'POST',
    body: data,
  }),

  getActivityAudits: (activityId) => apiRequest(`/api/activities/${activityId}/audits`),
  getCreditProgress: () => apiRequest('/api/students/activities/progress'),
};

// Faculty API
export const facultyAPI = {
  getStats: () => apiRequest('/api/faculty/stats'),
  getPendingActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/faculty/activities/pending${query ? `?${query}` : ''}`);
  },
  getAllActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/faculty/activities${query ? `?${query}` : ''}`);
  },
  reviewActivity: (activityId, data) => apiRequest(`/api/faculty/activities/${activityId}`, {
    method: 'PUT',
    body: data,
  }),
  getAllStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/faculty/students${query ? `?${query}` : ''}`);
  },
};

// Admin API
export const adminAPI = {
  getStats: () => apiRequest('/api/admin/stats'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/users${query ? `?${query}` : ''}`);
  },
  createUser: (data) => apiRequest('/api/admin/users', {
    method: 'POST',
    body: data,
  }),
  updateUser: (userId, data) => apiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: data,
  }),
  deleteUser: (userId) => apiRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  }),
  toggleUserStatus: (userId) => apiRequest(`/api/admin/users/${userId}/toggle-status`, {
    method: 'POST',
  }),
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/reports${query ? `?${query}` : ''}`);
  },
  getCreditPolicies: () => apiRequest('/api/admin/credit-policies'),
  createCreditPolicy: (data) => apiRequest('/api/admin/credit-policies', {
    method: 'POST',
    body: data,
  }),
  updateCreditPolicy: (id, data) => apiRequest(`/api/admin/credit-policies/${id}`, {
    method: 'PUT',
    body: data,
  }),
  toggleCreditPolicy: (id) => apiRequest(`/api/admin/credit-policies/${id}`, {
    method: 'PATCH',
  }),
  getMentors: () => apiRequest('/api/admin/mentors'),
  assignMentor: (data) => apiRequest('/api/admin/mentors', {
    method: 'POST',
    body: data,
  }),
  getFinalReviewQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/review${query ? `?${query}` : ''}`);
  },
  processFinalReview: (activityId, data) => apiRequest(`/api/admin/review/${activityId}`, {
    method: 'PUT',
    body: data,
  }),
  getGrievances: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/grievances${query ? `?${query}` : ''}`);
  },
  resolveGrievance: (id, data) => apiRequest(`/api/admin/grievances/${id}`, {
    method: 'PUT',
    body: data,
  }),
  getNAACReports: (params = {}) => {
    const query = new URLSearchParams({ type: 'naac', ...params }).toString();
    return apiRequest(`/api/admin/reports${query ? `?${query}` : ''}`);
  },
  bulkImportUsers: (data) => apiRequest('/api/admin/users/bulk-import', {
    method: 'POST',
    body: data,
  }),
};

// Notification API
export const notificationAPI = {
  getNotifications: () => apiRequest('/api/notifications'),
  markRead: (data = {}) => apiRequest('/api/notifications', {
    method: 'PATCH',
    body: data,
  }),
};

// Credit Policy Lookup (Authenticated & Shared)
export const getActiveCreditPolicies = () => apiRequest('/api/credit-policies/active');

// Public Verification API (No Auth Required)
export const publicAPI = {
  verifyCredential: (verificationId) => apiRequest(`/api/verify/${verificationId}`),
};

