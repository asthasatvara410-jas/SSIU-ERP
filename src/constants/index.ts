// ─── Storage Keys ────────────────────────────────────────────────────────────
export const DB_STORAGE_KEY = 'SWARRNIM_ERP_DB_V5';
export const AUTH_STORAGE_KEY = 'SWARRNIM_ERP_AUTH_USER_V2';

// ─── University Identity ──────────────────────────────────────────────────────
export const UNIVERSITY_NAME = 'Swarrnim Startup & Innovation University';
export const UNIVERSITY_SHORT = 'SSIU';
export const ERP_PRODUCT_NAME = 'SSCIT ERP';

// ─── Filter Sentinel ─────────────────────────────────────────────────────────
/** Sentinel value used in all filter dropdowns to represent "no filter applied". */
export const ALL = 'ALL';

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 8;
export const PAGE_SIZE_OPTIONS = [8, 15, 25, 50, 100] as const;

// ─── Demo Account Credentials ─────────────────────────────────────────────────
export const DEMO_ACCOUNTS = {
  admin: { identifier: 'admin', password: 'Admin@123', displayName: 'Demo Admin', email: 'demo.admin@university.edu' },
  registrar: { identifier: 'registrar', password: 'Admin@123', displayName: 'Demo Registrar 1', email: 'demo.registrar1@ssiu-demo.ac.in' },
  studentadmin: { identifier: 'studentadmin', password: 'Admin@123', displayName: 'Onboarding Officer', email: 'onboarding.officer@swarrnim.edu.in' },
  deputyregistrar: { identifier: 'deputyregistrar', password: 'Admin@123', displayName: 'Demo Deputy Registrar 1', email: 'demo.deputyregistrar1@ssiu-demo.ac.in' },
  faculty: { identifier: 'faculty', password: 'Faculty@123', displayName: 'Prof. Demo Faculty', email: 'demo.faculty@university.edu' },
  student: { identifier: 'student', password: 'Student@123', displayName: 'Jigar Patel', email: 'jigar.patel@swarrnim.edu.in' },
} as const;

// ─── Session Timeout ──────────────────────────────────────────────────────────
/** Inactivity duration in milliseconds before the session is automatically logged out. */
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/** Warning duration before timeout in milliseconds. */
export const SESSION_WARNING_MS = 2 * 60 * 1000; // 2 minutes warning

// ─── Inactivity Events ────────────────────────────────────────────────────────
export const INACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'click'] as const;

// ─── Navigation Tab IDs ───────────────────────────────────────────────────────
export const TAB = {
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  // Academic
  CALENDAR: 'calendar',
  ATTENDANCE: 'attendance',
  TIMETABLE: 'timetable',
  SESSION_PLAN: 'session-plan',
  MATERIALS: 'materials',
  ASSIGNMENTS: 'assignments',
  SUBJECTS: 'subjects',
  // Exam
  EXAM_DASHBOARD: 'exam-dashboard',
  EXAMS: 'exams',
  EXAM_SCHEDULE: 'exam-schedule',
  EXAM_FORMS: 'exam-forms',
  EXAM_FEES: 'exam-fees',
  EXAM_HALLTICKET: 'exam-hallticket',
  EXAM_MARKS: 'exam-marks',
  EXAM_RESULTS: 'exam-results',
  EXAM_MARKSHEET: 'exam-marksheet',
  // Finance & Admin
  FEES: 'fees',
  CRM: 'crm',
  CERTIFICATES: 'certificates',
  REQUESTS: 'requests',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  // Support & Campus
  MENTOR: 'mentor',
  TICKETS: 'tickets',
  FEEDBACK: 'feedback',
  NOTICES: 'notices',
  EVENTS: 'events',
  LIBRARY: 'library',
  NOTIFICATIONS: 'notifications',
  // Administrative Offices
  REGISTRAR: 'registrar',
  DEPUTY_REGISTRAR: 'deputy-registrar',
  IQAC: 'iqac',
  EXAM_CELL: 'exam-cell',
  STUDENT_SECTION: 'student-section',
  HOSTEL_ADMIN: 'hostel-admin',
  LIBRARY_ADMIN: 'library-admin',
  TRANSPORT_ADMIN: 'transport-admin',
  MAINTENANCE_ADMIN: 'maintenance-admin',
  // Master Data
  INSTITUTES: 'institutes',
  DEPARTMENTS: 'departments',
  PROGRAMS: 'programs',
  ACADEMIC_YEARS: 'academic-years',
  BATCHES: 'batches',
  SEMESTERS: 'semesters',
  DIVISIONS: 'divisions',
  FACULTY: 'faculty',
  STUDENTS: 'students',
} as const;

export type TabId = typeof TAB[keyof typeof TAB];

// ─── Role-based Tab Access ────────────────────────────────────────────────────
/** Tabs accessible to all authenticated users regardless of role. */
export const UNIVERSAL_TABS: TabId[] = [TAB.DASHBOARD, TAB.PROFILE];

/** Academic and campus tabs accessible to all roles (scoped by DB queries). */
export const ACADEMIC_TABS: TabId[] = [
  TAB.ATTENDANCE, TAB.TIMETABLE, TAB.SESSION_PLAN, TAB.MATERIALS, TAB.ASSIGNMENTS,
  TAB.CALENDAR, TAB.FEEDBACK, TAB.TICKETS, TAB.CERTIFICATES, TAB.MENTOR,
  TAB.NOTICES, TAB.EVENTS, TAB.LIBRARY, TAB.NOTIFICATIONS, TAB.REQUESTS,
];

/** Examination module tabs accessible to all roles. */
export const EXAM_TABS: TabId[] = [
  TAB.EXAM_DASHBOARD, TAB.EXAMS, TAB.EXAM_FORMS, TAB.EXAM_FEES,
  TAB.EXAM_SCHEDULE, TAB.EXAM_HALLTICKET, TAB.EXAM_MARKS,
  TAB.EXAM_RESULTS, TAB.EXAM_MARKSHEET,
];
