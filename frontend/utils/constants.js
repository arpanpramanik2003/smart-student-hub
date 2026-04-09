// API base URL from environment (required in deployment).
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
export const API_BASE_URL = configuredApiUrl.replace(/\/$/, '');

// Origin derived from API base URL, used for file/static links.
export const API_ORIGIN = API_BASE_URL ? API_BASE_URL.replace(/\/api$/, '') : '';

// Activity Types
export const ACTIVITY_TYPES = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'certification', label: 'Certification' },
  { value: 'competition', label: 'Competition' },
  { value: 'internship', label: 'Internship' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'community_service', label: 'Community Service' },
  { value: 'club_activity', label: 'Club Activity' },
  { value: 'online_course', label: 'Online Course' }
];

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin'
};

// Activity Status
export const ACTIVITY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Status Colors
export const STATUS_COLORS = {
  approved: 'text-green-600 bg-green-100',
  pending: 'text-yellow-600 bg-yellow-100',
  rejected: 'text-red-600 bg-red-100'
};
