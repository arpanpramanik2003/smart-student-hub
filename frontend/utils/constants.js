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

// Achievement Levels
export const ACHIEVEMENT_LEVELS = [
  { value: 'college', label: 'College / Institutional Level' },
  { value: 'state', label: 'State / Zonal Level' },
  { value: 'national', label: 'National Level' },
  { value: 'international', label: 'International Level' }
];

// NAAC Standard Criteria
export const NAAC_CRITERIA = [
  { id: 'Criterion 1', title: 'Criterion 1: Curricular Aspects' },
  { id: 'Criterion 2', title: 'Criterion 2: Teaching-Learning and Evaluation' },
  { id: 'Criterion 3', title: 'Criterion 3: Research, Innovations and Extension' },
  { id: 'Criterion 4', title: 'Criterion 4: Infrastructure and Learning Resources' },
  { id: 'Criterion 5', title: 'Criterion 5: Student Support and Progression' },
  { id: 'Criterion 6', title: 'Criterion 6: Governance, Leadership and Management' },
  { id: 'Criterion 7', title: 'Criterion 7: Institutional Values and Best Practices' }
];

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin'
};

// Activity Status
export const ACTIVITY_STATUS = {
  PENDING_MENTOR: 'pending_mentor',
  MENTOR_APPROVED: 'mentor_approved',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending_mentor' // legacy mapping fallback
};

// Status Display Labels
export const STATUS_LABELS = {
  pending_mentor: 'Stage 1: Pending Mentor Review',
  mentor_approved: 'Stage 2: Pending Admin Sign-Off',
  approved: 'Approved & Granted',
  rejected: 'Rejected',
  pending: 'Pending Review'
};

// Status Badges Styling
export const STATUS_COLORS = {
  pending_mentor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
  mentor_approved: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900',
  approved: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
  rejected: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
  pending: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
};
