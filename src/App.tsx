import React, { useState, Suspense } from 'react';
import { PageSkeletonFallback } from './components/common/PageSkeletonFallback';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginPage } from './pages/auth/LoginPage';
import { Dashboard } from './pages/dashboard/Dashboard';
import { InstitutesPage } from './pages/master/InstitutesPage';
import { DepartmentsPage } from './pages/master/DepartmentsPage';
import { ProgramsPage } from './pages/master/ProgramsPage';
import { AcademicYearsPage } from './pages/master/AcademicYearsPage';
import { BatchesPage } from './pages/master/BatchesPage';
import { SemestersPage } from './pages/master/SemestersPage';
import { DivisionsPage } from './pages/master/DivisionsPage';
import { SubjectsPage } from './pages/master/SubjectsPage';
import { FacultyPage } from './pages/master/FacultyPage';
import { StudentsPage } from './pages/master/StudentsPage';
import { StudentDirectorySearchPage } from './pages/students/StudentDirectorySearchPage';
import { DocumentMasterPage } from './pages/master/DocumentMasterPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { DigitalIdCardPage } from './pages/profile/DigitalIdCardPage';

// Modular ERP Extension Plugins Registry
import './modules';
import { getPlugin } from './modules/moduleRegistry';

// Academic Module Pages
import { AttendancePage } from './pages/academic/AttendancePage';
import { StudentAttendancePage } from './pages/academic/StudentAttendancePage';
import { TimetablePage } from './pages/academic/TimetablePage';
import { SessionPlanPage } from './pages/academic/SessionPlanPage';
import { UnitMaterialPage } from './pages/academic/UnitMaterialPage';
import { AssignmentsPage } from './pages/academic/AssignmentsPage';
import { AcademicCalendarPage } from './pages/academic/AcademicCalendarPage';
import { QuizPage } from './pages/academic/QuizPage';
import { FeedbackPage } from './pages/feedback/FeedbackPage';
import { AdminFeedbackDashboardPage } from './pages/feedback/AdminFeedbackDashboardPage';
import { FeedbackEscalationsDashboardPage } from './pages/feedback/FeedbackEscalationsDashboardPage';

// Campus & Support Pages
import { CertificatesPage } from './pages/campus/CertificatesPage';
import { StudentSectionPage } from './pages/campus/StudentSectionPage';
import { StudentHostelPage } from './pages/campus/StudentHostelPage';
import { StudentTransportPage } from './pages/campus/StudentTransportPage';
import { MentorPage } from './pages/campus/MentorPage';
import { HODWorkspacePage } from './pages/campus/HODWorkspacePage';
import { HOIWorkspacePage } from './pages/campus/HOIWorkspacePage';
import { NoticesPage } from './pages/campus/NoticesPage';
import { EventsPage } from './pages/campus/EventsPage';
import { LibraryPage } from './pages/campus/LibraryPage';
import { NotificationsPage } from './pages/campus/NotificationsPage';
import { RequestsPage } from './pages/campus/RequestsPage';
import { EdpDutyPage } from './pages/campus/EdpDutyPage';
import { WorkTransferManagementPage } from './pages/faculty/WorkTransferManagementPage';
import { MyWorkPage } from './pages/work-transfer/MyWorkPage';
import { TransferWorkPage } from './pages/work-transfer/TransferWorkPage';
import { ReceivedWorkPage } from './pages/work-transfer/ReceivedWorkPage';
import { ActiveTransfersPage } from './pages/work-transfer/ActiveTransfersPage';
import { TransferHistoryPage } from './pages/work-transfer/TransferHistoryPage';
import { IncubationPage } from './pages/incubation/IncubationPage';
import { PTMManagementPage } from './pages/ptm/PTMManagementPage';
import { ParentPTMDashboard } from './pages/ptm/ParentPTMDashboard';
import { StudentPTMView } from './components/ptm/StudentPTMView';

// Fees & Finance Module Page
import { FeesFinancePage } from './pages/finance/FeesFinancePage';
import { HRManagementPage } from './pages/hr/HRManagementPage';

// Auth & Base Pages
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { NoteSheetVerificationPage } from './pages/public/NoteSheetVerificationPage';
import { InwardOutwardRegisterPage } from './pages/admin-offices/InwardOutwardRegisterPage';
import { WorkDiaryPage } from './pages/campus/WorkDiaryPage';
import { InventoryAssetPage } from './pages/campus/InventoryAssetPage';

// Lazy-Loaded Administrative, Specialty & Reporting Modules (Phase 9 Code-Splitting)
const SupportTicketsPage = React.lazy(() => import('./pages/support/SupportTicketsPage').then(m => ({ default: m.SupportTicketsPage })));
const StudentCouncilDeskPage = React.lazy(() => import('./pages/campus/StudentCouncilDeskPage').then(m => ({ default: m.StudentCouncilDeskPage })));
const WorkTransferAuditCenterPage = React.lazy(() => import('./pages/admin-offices/WorkTransferAuditCenterPage').then(m => ({ default: m.WorkTransferAuditCenterPage })));
const UniversityHRMSPage = React.lazy(() => import('./pages/hr/UniversityHRMSPage').then(m => ({ default: m.UniversityHRMSPage })));
const CRMPage = React.lazy(() => import('./pages/crm/CRMPage').then(m => ({ default: m.CRMPage })));
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const RegistrarWorkspacePage = React.lazy(() => import('./pages/admin-offices/RegistrarWorkspacePage').then(m => ({ default: m.RegistrarWorkspacePage })));
const IQACWorkspacePage = React.lazy(() => import('./pages/admin-offices/IQACWorkspacePage').then(m => ({ default: m.IQACWorkspacePage })));
const ExamCellWorkspacePage = React.lazy(() => import('./pages/admin-offices/ExamCellWorkspacePage').then(m => ({ default: m.ExamCellWorkspacePage })));
const StudentSectionWorkspacePage = React.lazy(() => import('./pages/admin-offices/StudentSectionWorkspacePage').then(m => ({ default: m.StudentSectionWorkspacePage })));
const HostelWorkspacePage = React.lazy(() => import('./pages/admin-offices/HostelWorkspacePage').then(m => ({ default: m.HostelWorkspacePage })));
const LibraryWorkspacePage = React.lazy(() => import('./pages/admin-offices/LibraryWorkspacePage').then(m => ({ default: m.LibraryWorkspacePage })));
const TransportWorkspacePage = React.lazy(() => import('./pages/admin-offices/TransportWorkspacePage').then(m => ({ default: m.TransportWorkspacePage })));
const MaintenanceWorkspacePage = React.lazy(() => import('./pages/admin-offices/MaintenanceWorkspacePage').then(m => ({ default: m.MaintenanceWorkspacePage })));
const AccountsWorkspacePage = React.lazy(() => import('./pages/admin-offices/AccountsWorkspacePage').then(m => ({ default: m.AccountsWorkspacePage })));
const StudentAdminWorkspacePage = React.lazy(() => import('./pages/admin-offices/StudentAdminWorkspacePage').then(m => ({ default: m.StudentAdminWorkspacePage })));
const SystemSettingsPage = React.lazy(() => import('./pages/settings/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const AdminPortalPage = React.lazy(() => import('./pages/admin/AdminPortalPage').then(m => ({ default: m.AdminPortalPage })));
const SecurityAuditCenterPage = React.lazy(() => import('./pages/admin-offices/SecurityAuditCenterPage').then(m => ({ default: m.SecurityAuditCenterPage })));
const NoteSheetPage = React.lazy(() => import('./pages/admin-offices/NoteSheetPage').then(m => ({ default: m.NoteSheetPage })));
const UniversityAssetManagementPage = React.lazy(() => import('./pages/assets/UniversityAssetManagementPage').then(m => ({ default: m.UniversityAssetManagementPage })));
const BulkImportPage = React.lazy(() => import('./pages/admin/BulkImportPage').then(m => ({ default: m.BulkImportPage })));

// Examination Management Module Pages
import { ExamDashboardPage } from './pages/exams/ExamDashboardPage';
import { ExamsListPage } from './pages/exams/ExamsListPage';
import { ExamSchedulePage } from './pages/exams/ExamSchedulePage';
import { ExamFormsPage } from './pages/exams/ExamFormsPage';
import { ExamEligibilityPage } from './pages/examinations/ExamEligibilityPage';
import { ExamFeesPage } from './pages/exams/ExamFeesPage';
import { StudentExamFeesPage } from './pages/exams/StudentExamFeesPage';
import { BacklogReExamPage } from './pages/exams/BacklogReExamPage';
import { ReassessmentRecheckingPage } from './pages/exams/ReassessmentRecheckingPage';
import { HallTicketPage } from './pages/exams/HallTicketPage';
import { MarksManagementPage } from './pages/exams/MarksManagementPage';
import { ResultManagementPage } from './pages/exams/ResultManagementPage';
import { MarksheetPage } from './pages/exams/MarksheetPage';
import { ExamCentresPage } from './pages/exams/ExamCentresPage';
import { SeatingArrangementPage } from './pages/exams/SeatingArrangementPage';
import { ExamEdpDutyPage } from './pages/exams/ExamEdpDutyPage';
import { ExamDayControlPage } from './pages/exams/ExamDayControlPage';

import { WhatsNewModal } from './components/common/WhatsNewModal';
import { PostLoginUpdateModal } from './components/common/PostLoginUpdateModal';
import { AccessDeniedPage } from './components/common/AccessDeniedPage';
import { NotFoundPage } from './components/common/NotFoundPage';
import { AIControlCenterPage } from './pages/ai-automation/AIControlCenterPage';
import { StudentAbcPortal } from './pages/academics/StudentAbcPortal';
import { AbcComplianceDashboard } from './pages/academics/AbcComplianceDashboard';
import { StudentDigiLockerPortal } from './pages/digilocker/StudentDigiLockerPortal';
import { AdminDigiLockerDashboard } from './pages/digilocker/AdminDigiLockerDashboard';
import { AccreditationDashboard } from './pages/accreditation/AccreditationDashboard';
import { OBEDashboard } from './pages/obe/OBEDashboard';
import { GrievanceDashboard } from './pages/grievance/GrievanceDashboard';
import { ResearchDashboard } from './pages/research/ResearchDashboard';
import { StartupGrantDashboard } from './pages/startup-grant/StartupGrantDashboard';
import { GrantsManagementDashboard } from './pages/grants/GrantsManagementDashboard';
import { QuestionBankDashboard } from './pages/exams/QuestionBankDashboard';
import { GovernmentIntegrationDashboard } from './pages/government-integration/GovernmentIntegrationDashboard';
import { ComplianceEngineDashboard } from './pages/compliance/ComplianceEngineDashboard';
import { db } from './services/db';
import { isTabPermittedForRole, ALL_NAV_ITEMS } from './constants/navigationConfig';

import './styles/index.css';

export const ROUTE_PATH_MAP: Record<string, string> = {
  '': 'dashboard',
  'dashboard': 'dashboard',
  'erp-admin': 'erp-admin-dashboard',
  'erp-admin/dashboard': 'erp-admin-dashboard',
  'erp-admin-dashboard': 'erp-admin-dashboard',
  'erp-admin/login': 'erp-admin-login',
  'erp-admin-login': 'erp-admin-login',
  'settings': 'settings',
  'inventory-assets': 'inventory-assets',
  'feedback': 'feedback',
  'feedback/give': 'feedback-give',
  'feedback/anonymous': 'feedback-anonymous-grievance',
  'feedback/track': 'feedback-track',
  'feedback/desk': 'feedback-desk',
  'feedback/reports': 'feedback-reports',
  'feedback-reports': 'feedback-reports',
  'feedback/escalations': 'feedback-escalations',
  'feedback-escalations': 'feedback-escalations',
  'feedback-anonymous-grievance': 'feedback-anonymous-grievance',
  'feedback-track': 'feedback-track',
  'faculty-assets': 'faculty-assets',
  'my-assets': 'faculty-assets',
  'faculty/students/search': 'student-search',
  'students/search': 'student-search',
  'student-search': 'student-search',
  'faculty/students/my-students': 'my-students',
  'students/my-students': 'my-students',
  'my-students': 'my-students',
  'faculty/students/academic': 'student-academics',
  'students/academic': 'student-academics',
  'student-academics': 'student-academics',
  'faculty/students/requests': 'student-requests',
  'students/requests': 'student-requests',
  'student-requests': 'student-requests',
  'deputy-registrar/dashboard': 'dashboard',
  'academic': 'subjects',
  'subjects': 'subjects',
  'my-attendance': 'my-attendance',
  'student-attendance': 'my-attendance',
  'attendance': 'attendance',
  'attendance-history': 'attendance-history',
  'subject-attendance': 'subject-attendance',
  'attendance-reports': 'attendance-reports',
  'attendance-import': 'attendance-import',
  'attendance-templates': 'attendance-templates',
  'attendance-applications': 'attendance-applications',
  'materials': 'materials',
  'study-material': 'study-material',
  'assignments': 'assignments',
  'timetable': 'timetable',
  'quiz': 'quiz',
  'session-plan': 'session-plan',
  'calendar': 'calendar',
  'examination': 'exam-dashboard',
  'exam-dashboard': 'exam-dashboard',
  'question-bank': 'question-bank',
  'paper-builder': 'paper-builder',
  'paper-approval': 'paper-approval',
  'published-papers': 'published-papers',
  'student-question-bank': 'student-question-bank',
  'exam-reports': 'exam-reports',
  'exam-duties': 'exam-duties',
  'exam-eligibility': 'exam-eligibility',
  'exam-forms': 'exam-forms',
  'exam-fees': 'exam-fees',
  'exam-fees-student': 'exam-fees-student',
  'exam-backlog': 'exam-backlog',
  'exam-reassessment': 'exam-reassessment',
  'exam-hallticket': 'exam-hallticket',
  'exam-results': 'exam-results',
  'exam-marks': 'exam-marks',
  'exam-marksheet': 'exam-marksheet',
  'exam-centres': 'exam-centres',
  'exam-seating': 'exam-seating',
  'exam-day-control': 'exam-day-control',
  'exams': 'exams',
  'exam-schedule': 'exam-schedule',
  'institutes': 'institutes',
  'departments': 'departments',
  'programs': 'programs',
  'academic-years': 'academic-years',
  'batches': 'batches',
  'semesters': 'semesters',
  'divisions': 'divisions',
  'faculty': 'faculty',
  'students': 'students',
  'document-master': 'document-master',
  'profile': 'profile',
  'id-card': 'id-card',
  'hr': 'hr',
  'hrms': 'hr',
  'university-hrms': 'hr',
  'crm': 'crm',
  'reports': 'reports',
  'tickets': 'tickets',
  'mentor': 'mentor',
  'notices': 'notices',
  'events': 'events',
  'library': 'library',
  'edp-duties': 'edp-duties',
  'incubation': 'incubation',
  'registrar': 'registrar',
  'iqac': 'iqac',
  'exam-cell': 'exam-cell',
  'student-section': 'student-section',
  'hostel-admin': 'hostel-admin',
  'library-admin': 'library-admin',
  'transport-admin': 'transport-admin',
  'maintenance-admin': 'maintenance-admin',
  'accounts-admin': 'accounts-admin',
  'student-admin': 'student-admin',
  'bulk-import': 'bulk-import',
  'note-sheets': 'note-sheets',
  'notesheet-verify': 'notesheet-verify',
  'inward-outward': 'inward-outward',
  'work-diary': 'work-diary',
  'work-transfer': 'work-transfer',
  'security-audit': 'security-audit',
  'ptm-management': 'ptm-management',
  'ptm-dashboard': 'ptm-dashboard',
  'ptm-parent': 'ptm-parent',
  'ptm-student': 'ptm-student',
  'fees': 'fees',
  'notifications': 'notifications',
  'abc-credits': 'abc-credits',
  'academic/abc': 'abc-credits',
  'abc': 'abc-credits',
  'digilocker': 'digilocker',
  'digilocker-documents': 'digilocker',
  'digilocker-admin': 'digilocker',
  'accreditation': 'accreditation',
  'accreditation-overview': 'accreditation-overview',
  'accreditation/overview': 'accreditation-overview',
  'accreditation-naac': 'accreditation-naac',
  'accreditation/naac': 'accreditation-naac',
  'accreditation-nba': 'accreditation-nba',
  'accreditation/nba': 'accreditation-nba',
  'accreditation-evidence': 'accreditation-evidence',
  'accreditation/evidence': 'accreditation-evidence',
  'accreditation-reports': 'accreditation-reports',
  'accreditation/reports': 'accreditation-reports',
  'naac': 'accreditation-naac',
  'nba': 'accreditation-nba',
  'obe': 'obe',
  'obe-dashboard': 'obe',
  'obe/overview': 'obe',
  'obe/dashboard': 'obe',
  'obe/course-outcomes': 'course-outcomes',
  'obe/program-outcomes': 'program-outcomes',
  'obe/program-specific-outcomes': 'program-specific-outcomes',
  'obe/co-po-mapping': 'co-po-mapping',
  'obe/co-pso-mapping': 'co-pso-mapping',
  'obe/assessment-mapping': 'assessment-mapping',
  'obe/attainment': 'attainment',
  'course-outcomes': 'course-outcomes',
  'program-outcomes': 'program-outcomes',
  'program-specific-outcomes': 'program-specific-outcomes',
  'co-po-mapping': 'co-po-mapping',
  'co-pso-mapping': 'co-pso-mapping',
  'assessment-mapping': 'assessment-mapping',
  'attainment': 'attainment',
  'grievance': 'grievance',
  'grievance/anonymous': 'grievance-anonymous',
  'grievance/track': 'grievance-track',
  'grievance/desk': 'grievance-desk',
  'anti-ragging': 'grievance',
  'icc': 'grievance',
  'student-grievance': 'grievance',
  'research': 'research',
  'research-dashboard': 'research',
  'publications': 'research',
  'research-publications': 'research',
  'patents': 'research',
  'research-patents': 'research',
  'research-projects': 'research',
  'research-grants': 'research',
  'research-scholars': 'research',
  'research-consultancy': 'research',
  'research-conferences': 'research',
  'research-books': 'research',
  'research-awards': 'research',
  'research-reports': 'research',
  'startup-grants': 'startup-grants',
  'startups': 'startup-grants',
  'startups-directory': 'startup-grants',
  'ssip': 'startup-grants',
  'grants': 'startup-grants',
  'hackathons': 'startup-grants',
  'innovation': 'startup-grants',
  'innovation-dashboard': 'startup-grants',
  'innovation-projects': 'startup-grants',
  'incubation-centre': 'startup-grants',
  'innovation-mentors': 'startup-grants',
  'innovation-funding': 'startup-grants',
  'industry-collaboration': 'startup-grants',
  'innovation-events': 'startup-grants',
  'innovation-hackathons': 'startup-grants',
  'innovation-awards': 'startup-grants',
  'innovation-reports': 'startup-grants',
  'government-integrations': 'government-integrations',
  'government-abc': 'government-integrations',
  'government-digilocker': 'government-integrations',
  'compliance-engine': 'compliance-engine',
  'compliance': 'compliance-engine',
  'accreditation-engine': 'compliance-engine',
  'nep-indicators': 'compliance-engine'
};

export const TAB_TO_CANONICAL_PATH: Record<string, string> = {
  'dashboard': '/dashboard',
  'my-attendance': '/my-attendance',
  'settings': '/settings',
  'inventory-assets': '/inventory-assets',
  'faculty-assets': '/faculty/assets',
  'feedback': '/feedback',
  'student-search': '/faculty/students/search',
  'my-students': '/faculty/students/my-students',
  'student-academics': '/faculty/students/academic',
  'student-requests': '/faculty/students/requests',
  'accreditation': '/accreditation',
  'accreditation-overview': '/accreditation',
  'accreditation-naac': '/accreditation/naac',
  'accreditation-nba': '/accreditation/nba',
  'accreditation-evidence': '/accreditation/evidence',
  'accreditation-reports': '/accreditation/reports',
  'obe': '/obe',
  'obe-overview': '/obe',
  'course-outcomes': '/obe/course-outcomes',
  'program-outcomes': '/obe/program-outcomes',
  'program-specific-outcomes': '/obe/program-specific-outcomes',
  'co-po-mapping': '/obe/co-po-mapping',
  'co-pso-mapping': '/obe/co-pso-mapping',
  'assessment-mapping': '/obe/assessment-mapping',
  'attainment': '/obe/attainment',
};

const getInitialTabFromLocation = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  if (tabParam) {
    return ROUTE_PATH_MAP[tabParam] || tabParam;
  }

  const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!rawPath || rawPath === 'dashboard') {
    return 'dashboard';
  }

  if (ROUTE_PATH_MAP[rawPath] !== undefined) {
    return ROUTE_PATH_MAP[rawPath];
  }

  // Check if rawPath exists directly in ALL_NAV_ITEMS
  if (ALL_NAV_ITEMS[rawPath]) {
    return rawPath;
  }

  return 'not-found';
};

const MainAppContent: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return getInitialTabFromLocation();
  });
  const [tabParams, setTabParams] = useState<Record<string, any> | null>(null);

  const setActiveTab = (tab: string, params?: any, pushHistory: boolean = true) => {
    if (params) {
      setTabParams(params);
    } else {
      setTabParams(null);
    }
    setActiveTabState(tab);

    if (pushHistory && typeof window !== 'undefined' && window.history) {
      const canonicalPath = TAB_TO_CANONICAL_PATH[tab] || `/${tab}`;
      const currentPathAndQuery = window.location.pathname + window.location.search;
      if (currentPathAndQuery !== canonicalPath) {
        window.history.pushState({ tab, params }, '', canonicalPath);
      }
    }
  };
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('sscit_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) { }
    return true; // Default state: COLLAPSED by default
  });

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    try {
      localStorage.setItem('sscit_sidebar_collapsed', String(val));
    } catch (e) { }
  };

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [showPostLoginUpdates, setShowPostLoginUpdates] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !user) return false;
    try {
      const sessionSeen = sessionStorage.getItem(`sscit_post_login_updates_seen_${user.id}`);
      return sessionSeen !== 'true';
    } catch (e) {
      return true;
    }
  });

  const handleDismissPostLoginUpdates = () => {
    setShowPostLoginUpdates(false);
    if (user?.id && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`sscit_post_login_updates_seen_${user.id}`, 'true');
      } catch (e) { }
    }
  };

  // Safely compute unread updates for post-login announcement popup
  const unreadNotifs = React.useMemo(() => {
    if (!user) return [];
    try {
      return db.getNotifications(user, role).filter(n => !(n.isReadByUsers || []).includes(user.id));
    } catch (err) {
      console.warn('[PostLoginUpdate] Notification check safely bypassed:', err);
      return [];
    }
  }, [user, role]);

  // Sync browser popstate (back/forward)
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab, event.state.params, false);
      } else {
        const initialTab = getInitialTabFromLocation();
        setActiveTab(initialTab, null, false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If not logged in, allow public verification pages (QR Code scans), else enforce login screen
  if (!user) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const isPublicVerification = 
        pathname.startsWith('/verify/notesheet') ||
        pathname.startsWith('/notesheet-verify') ||
        searchParams.get('tab') === 'notesheet-verify' ||
        activeTab === 'notesheet-verify' ||
        activeTab === 'verify-notesheet';

      if (isPublicVerification) {
        return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <NoteSheetVerificationPage />
            </div>
          </div>
        );
      }

      // Dedicated ERP Admin Login Route
      if (
        pathname.startsWith('/erp-admin') ||
        pathname.startsWith('/admin-login') ||
        searchParams.get('tab') === 'erp-admin-login' ||
        activeTab === 'erp-admin-login'
      ) {
        return <AdminLoginPage onAdminLoginSuccess={() => setActiveTab('erp-admin-dashboard')} />;
      }
    }
    return <LoginPage />;
  }

  // Define allowed tabs per role using centralized navigationConfig single source of truth
  const getIsTabAllowed = (tab: string) => {
    return isTabPermittedForRole(tab, role);
  };

  const renderActivePage = () => {
    if (activeTab === 'not-found') {
      return (
        <NotFoundPage
          onNavigateHome={() => setActiveTab('dashboard')}
          requestedPath={typeof window !== 'undefined' ? window.location.pathname : ''}
        />
      );
    }

    const isAllowed = getIsTabAllowed(activeTab);
    if (!isAllowed) {
      return (
        <AccessDeniedPage
          onNavigateHome={() => setActiveTab('dashboard')}
          tabName={activeTab.replace(/-/g, ' ').toUpperCase()}
          userRole={role || 'GUEST'}
        />
      );
    }

    // ─── Modular ERP Plugin Extension Dispatcher ───
    const pluginManifest = getPlugin(activeTab);
    if (pluginManifest) {
      const PluginComponent = pluginManifest.component;
      return <PluginComponent />;
    }

    switch (activeTab) {
      case 'dashboard':
      case 'analytics':
      case 'management-analytics':
      case 'kpi-dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;

      // ─── 2. Academic Section ───
      case 'academic':
      case 'subjects':
      case 'academic-subjects':
      case 'faculty-subjects':
        return <SubjectsPage />;
      case 'my-attendance':
      case 'academic-my-attendance':
      case 'student-attendance':
        return <StudentAttendancePage />;
      case 'attendance':
      case 'academic-attendance':
      case 'faculty-mark-attendance':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="ATTENDANCE" />;
      case 'attendance-history':
      case 'faculty-attendance-history':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="HISTORY" />;
      case 'subject-attendance':
      case 'faculty-subject-attendance':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="SUBJECT_STATS" />;
      case 'attendance-reports':
      case 'faculty-attendance-reports':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="REPORTS" />;
      case 'attendance-import':
      case 'faculty-attendance-import':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="IMPORT_STUDENTS" />;
      case 'attendance-templates':
      case 'faculty-attendance-templates':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="TEMPLATES" />;
      case 'attendance-applications':
      case 'faculty-attendance-apps':
        if (role === 'STUDENT') {
          return <StudentAttendancePage />;
        }
        return <AttendancePage initialTab="APPLICATIONS" />;
      case 'materials':
      case 'study-material':
      case 'academic-materials':
      case 'faculty-materials':
      case 'mentor-study-material':
        return <UnitMaterialPage />;
      case 'assignments':
      case 'academic-assignments':
      case 'faculty-assignments':
        return <AssignmentsPage />;
      case 'timetable':
      case 'academic-timetable':
      case 'faculty-timetable':
        return <TimetablePage setActiveTab={setActiveTab} />;
      case 'quiz':
      case 'academic-quiz':
      case 'faculty-quiz':
        return <QuizPage />;
      case 'session-plan':
      case 'mentor-session-plan':
      case 'faculty-session-plan':
        return <SessionPlanPage setActiveTab={setActiveTab} initialSubjectId={tabParams?.subjectId} />;
      case 'calendar':
      case 'faculty-calendar':
        return <AcademicCalendarPage />;

      // ─── 3. Examination Section ───
      case 'question-bank':
      case 'paper-builder':
      case 'paper-approval':
      case 'published-papers':
      case 'student-question-bank':
      case 'exam-reports':
      case 'bulk-upload':
      case 'question-review':
        return <QuestionBankDashboard activeRouteTab={activeTab} />;
      case 'examination':
      case 'exam-dashboard':
      case 'faculty-exam-info':
        return <ExamDashboardPage setActiveTab={setActiveTab} />;
      case 'exam-duties':
      case 'faculty-exam-duties':
        return <ExamEdpDutyPage initialRecordId={tabParams?.recordId} />;
      case 'exam-eligibility':
        return <ExamEligibilityPage />;
      case 'exam-forms':
        return <ExamFormsPage />;
      // Student-facing exam fees (all categories: regular, backlog, reassessment, etc.)
      case 'exam-fees-student':
        return <StudentExamFeesPage />;
      // Backlog / Re-Exam application page
      case 'exam-backlog':
        return <BacklogReExamPage setActiveTab={setActiveTab} />;
      // Reassessment / Rechecking application page
      case 'exam-reassessment':
        return <ReassessmentRecheckingPage setActiveTab={setActiveTab} />;
      // Admin/Controller exam fee configuration
      case 'exam-fees':
        return <ExamFeesPage />;
      case 'exam-hallticket':
        return <HallTicketPage />;
      case 'exam-results':
      case 'result-management':
        return <ResultManagementPage />;
      case 'exams':
        return <ExamsListPage />;
      case 'exam-schedule':
      case 'faculty-exam-schedule':
        return <ExamSchedulePage />;
      case 'exam-marks':
        return <MarksManagementPage />;
      case 'exam-marksheet':
      case 'marksheet':
        return <MarksheetPage />;
      case 'exam-centres':
        return <ExamCentresPage />;
      case 'exam-seating':
        return <SeatingArrangementPage />;
      case 'exam-edp-duty':
        return <ExamEdpDutyPage initialRecordId={tabParams?.recordId} />;
      case 'exam-day-control':
        return <ExamDayControlPage />;

      // ─── 3B. Students Section (Faculty & Mentor & Staff) ───
      case 'my-students':
      case 'faculty-my-students':
      case 'mentee-list':
        return <MentorPage initialTab="MY_STUDENTS" />;
      case 'mentee-profile':
        return <MentorPage initialTab="STUDENT_PROFILE" />;
      case 'mentee-academic-overview':
        return <MentorPage initialTab="ACADEMIC_OVERVIEW" />;
      case 'mentee-academic-performance':
      case 'mentee-academic-progress':
        return <MentorPage initialTab="ACADEMIC_PERFORMANCE" />;
      case 'mentee-subjects':
        return <MentorPage initialTab="STUDENT_SUBJECTS" />;
      case 'mentee-timetable':
        return <MentorPage initialTab="TIMETABLE" />;
      case 'mentee-assignments':
        return <MentorPage initialTab="ASSIGNMENTS" />;
      case 'mentee-attendance':
      case 'mentee-attendance-overview':
        return <MentorPage initialTab="ATTENDANCE" />;
      case 'mentee-attendance-shortage':
        return <MentorPage initialTab="ATTENDANCE_SHORTAGE" />;
      case 'mentee-attendance-applications':
      case 'mentee-exam-attendance-approvals':
        return <MentorPage initialTab="ATTENDANCE_APPROVALS" />;
      case 'mentee-exam-eligibility':
        return <MentorPage initialTab="EXAM_ELIGIBILITY" />;
      case 'mentee-exam-requests':
        return <MentorPage initialTab="EXAM_REQUESTS" />;
      case 'mentee-docs-pending':
        return <MentorPage initialTab="PENDING_VERIFICATION" />;
      case 'mentee-docs-verified':
        return <MentorPage initialTab="VERIFIED_DOCUMENTS" />;
      case 'mentee-docs-history':
        return <MentorPage initialTab="DOCUMENT_HISTORY" />;
      case 'mentee-requests-pending':
      case 'mentee-requests-assigned':
      case 'mentee-requests-history':
      case 'mentee-requests':
        return <RequestsPage initialCategory="ALL" />;
      case 'counseling':
      case 'mentee-sessions':
        return <MentorPage initialTab="SESSIONS" />;
      case 'mentor-profile':
        return <ProfilePage />;
      case 'student-academics':
      case 'faculty-student-academics':
        return <MentorPage initialTab="STUDENT_ACADEMICS" />;
      case 'student-requests':
      case 'faculty-student-requests':
        return <RequestsPage initialCategory="ALL" />;
      case 'work-transfer':
      case 'workload-transfer':
      case 'delegate-work':
      case 'faculty-work-transfer':
      case 'hod-work-transfer':
      case 'hoi-work-transfer':
      case 'my-work':
        return <MyWorkPage setActiveTab={setActiveTab} />;
      case 'work-transfer-new':
      case 'transfer-work':
        return <TransferWorkPage setActiveTab={setActiveTab} />;
      case 'work-transfer-received':
      case 'received-work':
        return <ReceivedWorkPage setActiveTab={setActiveTab} />;
      case 'work-transfer-active':
      case 'active-transfers':
        return <ActiveTransfersPage setActiveTab={setActiveTab} />;
      case 'work-transfer-history':
      case 'transfer-history':
        return <TransferHistoryPage setActiveTab={setActiveTab} />;
      case 'work-transfer-audit':
      case 'workload-audit':
      case 'transfer-audit':
        return <WorkTransferAuditCenterPage />;

      // ─── 3C. HOD Portal Routes ───
      case 'hod-profile':
        return <ProfilePage />;
      case 'hod-dept-overview':
        return <HODWorkspacePage initialTab="OVERVIEW" />;
      case 'hod-dept-students':
      case 'hod-students-list':
      case 'hod-students-profile':
      case 'hod-students-performance':
        return <HODWorkspacePage initialTab="STUDENTS" />;
      case 'hod-students-at-risk':
        return <HODWorkspacePage initialTab="AT_RISK" />;
      case 'hod-dept-faculty':
      case 'hod-faculty-list':
        return <HODWorkspacePage initialTab="FACULTY" />;
      case 'hod-faculty-workload':
        return <HODWorkspacePage initialTab="FACULTY_WORKLOAD" />;
      case 'hod-faculty-performance':
        return <HODWorkspacePage initialTab="FACULTY_PERFORMANCE" />;
      case 'hod-faculty-allocation':
      case 'hod-faculty-subject-allocation':
        return <HODWorkspacePage initialTab="FACULTY_ALLOCATION" />;
      case 'hod-mentors':
      case 'hod-mentor-assignment':
        return <HODWorkspacePage initialTab="MENTORS" />;
      case 'hod-dept-programs':
        return <ProgramsPage />;
      case 'hod-dept-semesters':
        return <SemestersPage />;
      case 'hod-dept-sections':
        return <DivisionsPage />;
      case 'hod-academic-subjects':
        return <SubjectsPage />;
      case 'hod-timetable':
        return <TimetablePage setActiveTab={setActiveTab} />;
      case 'hod-session-plans':
        return <SessionPlanPage setActiveTab={setActiveTab} initialSubjectId={tabParams?.subjectId} />;
      case 'hod-materials':
        return <UnitMaterialPage />;
      case 'hod-assignments':
        return <AssignmentsPage />;
      case 'hod-quiz':
        return <QuizPage />;
      case 'hod-calendar':
        return <AcademicCalendarPage />;
      case 'hod-attendance-overview':
      case 'hod-subject-attendance':
        return <HODWorkspacePage initialTab="ATTENDANCE" />;
      case 'hod-attendance-shortage':
        return <HODWorkspacePage initialTab="ATTENDANCE_SHORTAGE" />;
      case 'hod-attendance-approvals':
      case 'hod-exam-attendance-approvals':
        return <HODWorkspacePage initialTab="ATTENDANCE_APPROVALS" />;
      case 'hod-exam-eligibility':
      case 'hod-exam-info':
        return <HODWorkspacePage initialTab="EXAMINATION" />;
      case 'hod-exam-requests':
      case 'hod-requests-pending':
      case 'hod-requests-dept':
      case 'hod-requests-escalated':
      case 'hod-requests-history':
        return <HODWorkspacePage initialTab="REQUESTS" />;
      case 'hod-docs-students':
      case 'hod-docs-overview':
      case 'hod-students-documents':
        return <DocumentMasterPage />;
      case 'hod-feedback-faculty':
      case 'hod-feedback-student':
        return <AdminFeedbackDashboardPage />;
      case 'hod-feedback-department':
        return <HODWorkspacePage initialTab="FEEDBACK" />;
      case 'hod-reports-academic':
        return <HODWorkspacePage initialTab="REPORTS_ACADEMIC" />;
      case 'hod-reports-attendance':
        return <HODWorkspacePage initialTab="REPORTS_ATTENDANCE" />;
      case 'hod-reports-student':
        return <HODWorkspacePage initialTab="REPORTS_STUDENT" />;
      case 'hod-reports-faculty':
        return <HODWorkspacePage initialTab="REPORTS_FACULTY" />;
      case 'hod-reports-department':
        return <HODWorkspacePage initialTab="REPORTS_DEPARTMENT" />;

      // ─── 3D. Principal / HOI Portal Routes ───
      case 'hoi-profile':
        return <ProfilePage />;
      case 'hoi-inst-overview':
      case 'hoi-academic-overview':
      case 'hoi-attendance-comparison':
        return <HOIWorkspacePage initialTab="OVERVIEW" />;
      case 'hoi-inst-departments':
        return <HOIWorkspacePage initialTab="DEPARTMENTS" />;
      case 'hoi-inst-hods':
        return <HOIWorkspacePage initialTab="HODS" />;
      case 'hoi-inst-programs':
      case 'hoi-academic-programs':
        return <ProgramsPage />;
      case 'hoi-inst-sections':
        return <DivisionsPage />;
      case 'hoi-academic-subjects':
        return <SubjectsPage />;
      case 'hoi-academic-allocation':
      case 'hoi-faculty-allocation':
        return <HOIWorkspacePage initialTab="FACULTY" />;
      case 'hoi-timetable':
        return <TimetablePage setActiveTab={setActiveTab} />;
      case 'hoi-session-plans':
        return <SessionPlanPage setActiveTab={setActiveTab} initialSubjectId={tabParams?.subjectId} />;
      case 'hoi-calendar':
        return <AcademicCalendarPage />;
      case 'hoi-academic-performance':
      case 'hoi-inst-students':
      case 'hoi-students-list':
      case 'hoi-students-profile':
      case 'hoi-students-performance':
        return <HOIWorkspacePage initialTab="STUDENTS" />;
      case 'hoi-students-at-risk':
        return <HOIWorkspacePage initialTab="AT_RISK" />;
      case 'hoi-inst-faculty':
      case 'hoi-faculty-list':
      case 'hoi-faculty-attendance':
      case 'hoi-faculty-performance':
        return <HOIWorkspacePage initialTab="FACULTY" />;
      case 'hoi-faculty-workload':
        return <HOIWorkspacePage initialTab="FACULTY_WORKLOAD" />;
      case 'hoi-attendance-institute':
      case 'hoi-students-attendance':
        return <HOIWorkspacePage initialTab="ATTENDANCE" />;
      case 'hoi-attendance-shortage':
        return <HOIWorkspacePage initialTab="ATTENDANCE_SHORTAGE" />;
      case 'hoi-attendance-approvals':
      case 'hoi-exam-attendance-approvals':
        return <HOIWorkspacePage initialTab="ATTENDANCE_APPROVALS" />;
      case 'hoi-exam-eligibility':
        return <HOIWorkspacePage initialTab="EXAMINATION" />;
      case 'hoi-exam-info':
        return <ExamSchedulePage />;
      case 'hoi-exam-reports':
      case 'hoi-reports-academic':
      case 'hoi-reports-student':
      case 'hoi-reports-faculty':
      case 'hoi-reports-attendance':
      case 'hoi-reports-examination':
      case 'hoi-reports-institute':
        return <HOIWorkspacePage initialTab="REPORTS" />;
      case 'hoi-requests-pending':
      case 'hoi-requests-dept':
      case 'hoi-requests-escalated':
      case 'hoi-requests-history':
        return <HOIWorkspacePage initialTab="REQUESTS" />;
      case 'hoi-docs-students':
      case 'hoi-docs-overview':
      case 'hoi-students-documents':
        return <DocumentMasterPage />;
      case 'hoi-feedback-student':
      case 'hoi-feedback-faculty':
        return <AdminFeedbackDashboardPage />;
      case 'hoi-feedback-department':
      case 'hoi-feedback-institute':
        return <HOIWorkspacePage initialTab="FEEDBACK" />;

      // ─── 4. Fees & Payments Section ───
      case 'fees':
      case 'fees-semester':
        return <FeesFinancePage initialStudentTab="MY_FEES" initialRecordId={tabParams?.recordId} />;
      case 'fees-history':
      case 'fees-receipts':
        return <FeesFinancePage initialStudentTab="PAYMENT_HISTORY" initialRecordId={tabParams?.recordId} />;
      case 'fees-query':
        return <FeesFinancePage initialStudentTab="FEE_QUERIES" initialRecordId={tabParams?.recordId} />;

      // ─── 5. Student Section ───
      case 'section-profile':
        return <ProfilePage />;
      case 'student-section':
      case 'certificates':
      case 'student-section-services':
        return role === 'STUDENT' ? <StudentSectionPage initialTab="SERVICES" /> : <StudentSectionWorkspacePage initialTab="SERVICES" />;
      case 'student-section-requests':
        return role === 'STUDENT' ? <StudentSectionPage initialTab="MY_REQUESTS" /> : <StudentSectionWorkspacePage initialTab="SERVICES" />;
      case 'student-section-documents':
        return role === 'STUDENT' ? <StudentSectionPage initialTab="MY_DOCUMENTS" /> : <StudentSectionWorkspacePage initialTab="DOCUMENTS" />;
      case 'section-students-list':
      case 'section-students-profile':
      case 'section-students-status':
        return <StudentSectionWorkspacePage initialTab="STUDENTS" />;
      case 'section-students-academic':
        return <StudentSectionWorkspacePage initialTab="ACADEMIC_RECORDS" />;
      case 'section-students-docs':
      case 'section-docs-verification':
      case 'section-docs-pending':
      case 'section-docs-verified':
      case 'section-docs-reupload':
      case 'section-docs-locked':
        return <StudentSectionWorkspacePage initialTab="DOCUMENTS" />;
      case 'section-docs-master':
        return <DocumentMasterPage />;
      case 'section-service-bonafide':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="BONAFIDE" />;
      case 'section-service-transcript':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="TRANSCRIPT" />;
      case 'section-service-degree':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="DEGREE" />;
      case 'section-service-migration':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="MIGRATION" />;
      case 'section-service-transfer':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="TRANSFER" />;
      case 'section-service-character':
      case 'section-service-other':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="ALL" />;
      case 'section-service-idcard':
      case 'section-id-generate':
      case 'section-id-replacement':
      case 'section-id-active':
      case 'section-id-blocked':
      case 'section-id-replaced':
      case 'section-id-verify':
        return <StudentSectionWorkspacePage initialTab="IDCARD" />;
      case 'section-service-duplicate-id':
        return <StudentSectionWorkspacePage initialTab="SERVICES" initialServiceCategory="IDCARD" />;
      case 'section-requests-pending':
      case 'section-requests-assigned':
      case 'section-requests-dept':
      case 'section-requests-escalated':
      case 'section-requests-history':
        return <StudentSectionWorkspacePage initialTab="REQUESTS" />;
      case 'section-fees-config':
      case 'section-fees-pending':
      case 'section-fees-history':
      case 'section-fees-receipts':
      case 'section-fees-refunds':
        return <StudentSectionWorkspacePage initialTab="FEES" />;
      case 'section-academic-records':
      case 'section-academic-semesters':
      case 'section-academic-results':
      case 'section-academic-transcripts':
      case 'section-academic-completion':
        return <StudentSectionWorkspacePage initialTab="ACADEMIC_RECORDS" />;
      case 'section-reports-student':
      case 'section-reports-docs':
      case 'section-reports-service':
      case 'section-reports-requests':
      case 'section-reports-payments':
        return <StudentSectionWorkspacePage initialTab="REPORTS" />;

      // ─── 5C. Student Administration & Onboarding Routes ───
      case 'onboarding-applications':
      case 'onboarding-doc-verification':
      case 'onboarding-fee-verification':
      case 'onboarding-student-creation':
      case 'onboarding-enrollment':
      case 'onboarding-mentor-assignment':
      case 'onboarding-account-activation':
      case 'onboarding-register':
      case 'onboarding-reports':
      case 'onboarding-pending-verification':
      case 'onboarding-export-register':
        return <StudentAdminWorkspacePage initialTab={activeTab} />;

      // ─── 5D. Registrar University Governance Routes ───
      case 'reg-profile':
        return <ProfilePage />;
      case 'reg-uni-overview':
        return <RegistrarWorkspacePage initialTab="UNIVERSITY" initialSubFilter="OVERVIEW" />;
      case 'reg-uni-institutes':
        return <RegistrarWorkspacePage initialTab="UNIVERSITY" initialSubFilter="INSTITUTES" />;
      case 'reg-uni-departments':
        return <RegistrarWorkspacePage initialTab="UNIVERSITY" initialSubFilter="DEPARTMENTS" />;
      case 'reg-uni-programs':
        return <RegistrarWorkspacePage initialTab="UNIVERSITY" initialSubFilter="PROGRAMS" />;
      case 'reg-uni-structure':
        return <RegistrarWorkspacePage initialTab="UNIVERSITY" initialSubFilter="STRUCTURE" />;
      case 'reg-academic-year':
        return <RegistrarWorkspacePage initialTab="ACADEMICS" initialSubFilter="YEAR" />;
      case 'reg-academic-semesters':
        return <RegistrarWorkspacePage initialTab="ACADEMICS" initialSubFilter="SEMESTERS" />;
      case 'reg-academic-calendar':
        return <RegistrarWorkspacePage initialTab="ACADEMICS" initialSubFilter="CALENDAR" />;
      case 'reg-academic-overview':
        return <RegistrarWorkspacePage initialTab="ACADEMICS" initialSubFilter="OVERVIEW" />;
      case 'reg-attendance-overview':
      case 'reg-attendance-inst':
      case 'reg-attendance-dept':
      case 'reg-attendance-shortage':
      case 'reg-attendance-approvals':
      case 'reg-attendance-reports':
      case 'reg-attendance-trends':
        return <RegistrarWorkspacePage initialTab="ATTENDANCE" initialSubFilter="OVERVIEW" />;
      case 'reg-students-overview':
      case 'reg-students-search':
        return <RegistrarWorkspacePage initialTab="STUDENTS" initialSubFilter="SEARCH" />;
      case 'reg-students-profile':
        return <RegistrarWorkspacePage initialTab="STUDENTS" initialSubFilter="PROFILE" />;
      case 'reg-students-records':
        return <RegistrarWorkspacePage initialTab="STUDENTS" initialSubFilter="RECORDS" />;
      case 'reg-students-status':
        return <RegistrarWorkspacePage initialTab="STUDENTS" initialSubFilter="STATUS" />;
      case 'reg-students-international':
        return <RegistrarWorkspacePage initialTab="STUDENTS" initialSubFilter="INTERNATIONAL" />;
      case 'reg-students-stats':
        return <RegistrarWorkspacePage initialTab="STUDENTS" initialSubFilter="STATS" />;
      case 'reg-faculty-overview':
        return <RegistrarWorkspacePage initialTab="FACULTY" initialSubFilter="OVERVIEW" />;
      case 'reg-faculty-staff':
      case 'reg-faculty-search':
        return <RegistrarWorkspacePage initialTab="FACULTY" initialSubFilter="STAFF" />;
      case 'reg-faculty-inst-strength':
      case 'reg-faculty-stats':
        return <RegistrarWorkspacePage initialTab="FACULTY" initialSubFilter="INST_STRENGTH" />;
      case 'reg-faculty-dept-strength':
      case 'reg-faculty-allocation':
        return <RegistrarWorkspacePage initialTab="FACULTY" initialSubFilter="DEPT_STRENGTH" />;
      case 'reg-notesheet-create':
        return <NoteSheetPage initialTab="CREATE" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-pending':
        return <NoteSheetPage initialTab="PENDING_WITH_ME" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-my':
        return <NoteSheetPage initialTab="MY_SHEETS" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-drafts':
        return <NoteSheetPage initialTab="DRAFTS" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-sent':
        return <NoteSheetPage initialTab="SENT" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-financial':
        return <NoteSheetPage initialTab="FINANCIAL_SHEETS" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-returned':
        return <NoteSheetPage initialTab="RETURNED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-clarification':
        return <NoteSheetPage initialTab="CLARIFICATION" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-action-pending':
        return <NoteSheetPage initialTab="ACTION_PENDING" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-approved':
        return <NoteSheetPage initialTab="APPROVED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-rejected':
        return <NoteSheetPage initialTab="REJECTED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-closed':
        return <NoteSheetPage initialTab="CLOSED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-history':
        return <NoteSheetPage initialTab="REGISTER" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheets':
        return <NoteSheetPage initialTab={tabParams?.initialTab || "DASHBOARD"} initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-notesheet-verify':
      case 'verify-notesheet':
      case 'notesheet-verification':
        return <NoteSheetPage initialTab="VERIFICATION" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'reg-requests-pending':
      case 'reg-requests-escalated':
      case 'reg-requests-assigned':
      case 'reg-requests-dept':
      case 'reg-requests-uni':
      case 'reg-requests-history':
        return <RegistrarWorkspacePage initialTab="REQUESTS" initialRecordId={tabParams?.recordId} />;
      case 'reg-approvals-pending':
      case 'reg-approvals-academic':
      case 'reg-approvals-admin':
      case 'reg-approvals-financial':
      case 'reg-approvals-special':
      case 'reg-approvals-records':
      case 'reg-approvals-dept':
      case 'reg-approvals-inst':
        return <RegistrarWorkspacePage initialTab="APPROVALS" initialRecordId={tabParams?.recordId} />;
      case 'reg-exam-overview':
      case 'reg-exam-forms':
      case 'reg-exam-eligibility':
      case 'reg-exam-halltickets':
      case 'reg-exam-centres':
      case 'reg-exam-results':
      case 'reg-exam-status':
        return <RegistrarWorkspacePage initialTab="EXAMINATION" />;
      case 'reg-docs-overview':
      case 'reg-docs-certificates':
      case 'reg-docs-transcripts':
      case 'reg-docs-degrees':
      case 'reg-docs-migration':
      case 'reg-docs-verification':
      case 'reg-records-academic':
      case 'reg-records-docs':
      case 'reg-records-certificates':
      case 'reg-records-transcripts':
      case 'reg-records-degrees':
        return <RegistrarWorkspacePage initialTab="DOCUMENTS" />;
      case 'reg-finance-fees':
      case 'reg-finance-collection':
      case 'reg-finance-pending':
      case 'reg-finance-notesheets':
      case 'reg-finance-reports':
        return <RegistrarWorkspacePage initialTab="FINANCE" />;
      case 'reg-corr-incoming':
        return <RegistrarWorkspacePage initialTab="CORRESPONDENCE" initialSubFilter="INCOMING" />;
      case 'reg-corr-outgoing':
        return <RegistrarWorkspacePage initialTab="CORRESPONDENCE" initialSubFilter="OUTGOING" />;
      case 'reg-corr-circulars':
        return <RegistrarWorkspacePage initialTab="CORRESPONDENCE" initialSubFilter="CIRCULAR" />;
      case 'reg-corr-external':
        return <RegistrarWorkspacePage initialTab="CORRESPONDENCE" initialSubFilter="EXTERNAL_GOV" />;
      case 'reg-corr-register':
        return <RegistrarWorkspacePage initialTab="CORRESPONDENCE" initialSubFilter="ALL" />;
      case 'reg-files-register':
      case 'reg-files-movement':
      case 'reg-files-archive':
      case 'reg-files-search':
        return <RegistrarWorkspacePage initialTab="FILES" />;
      case 'reg-comm-master':
      case 'reg-comm-members':
      case 'reg-comm-meetings':
      case 'reg-comm-agenda':
      case 'reg-comm-mom':
      case 'reg-comm-actions':
        return <RegistrarWorkspacePage initialTab="COMMITTEES" />;
      case 'reg-notices-create':
      case 'reg-notices-published':
      case 'reg-notices-circulars':
      case 'reg-notices-history':
      case 'reg-notices-uni':
      case 'reg-notices-academic':
      case 'reg-notices-admin':
        return <RegistrarWorkspacePage initialTab="NOTICES" />;
      case 'reg-inv-inst':
      case 'reg-inv-dept':
      case 'reg-inv-transfers':
      case 'reg-inv-maintenance':
      case 'reg-inv-reports':
        return <RegistrarWorkspacePage initialTab="INVENTORY" />;
      case 'reg-rep-uni':
      case 'reg-rep-inst':
      case 'reg-rep-dept':
      case 'reg-rep-student':
      case 'reg-rep-academic':
      case 'reg-rep-faculty':
      case 'reg-rep-exam':
      case 'reg-rep-financial':
      case 'reg-rep-inventory':
      case 'reg-rep-custom':
      case 'reg-reports-uni':
      case 'reg-reports-academic':
      case 'reg-reports-student':
      case 'reg-reports-faculty':
      case 'reg-reports-attendance':
      case 'reg-reports-exam':
      case 'reg-reports-inst':
      case 'reg-reports-dept':
        return <RegistrarWorkspacePage initialTab="REPORTS" />;
      case 'reg-audit-log':
      case 'reg-audit-login':
      case 'reg-audit-approvals':
      case 'reg-audit-notesheets':
      case 'reg-audit-system':
      case 'reg-audit-logs':
        return <RegistrarWorkspacePage initialTab="AUDIT_LOGS" />;
      case 'reg-excel-templates':
      case 'reg-excel-history':
      case 'reg-excel-failed':
      case 'reg-excel-export':
        return <RegistrarWorkspacePage initialTab="EXCEL_CENTER" />;
      case 'reg-preferences':
      case 'reg-change-password':
        return <RegistrarWorkspacePage initialTab="SETTINGS" />;

      // ─── 6. Requests Section ───
      case 'requests':
      case 'requests-my-requests':
      case 'faculty-requests-all':
        return <RequestsPage initialCategory={tabParams?.initialCategory || tabParams?.category || "ALL"} initialRecordId={tabParams?.recordId || tabParams?.requestId} initialQueue={tabParams?.initialQueue} />;
      case 'requests-subject-query':
      case 'faculty-requests-queries':
        return <RequestsPage initialCategory="SUBJECT_QUERY" initialRecordId={tabParams?.recordId || tabParams?.requestId} initialQueue={tabParams?.initialQueue} />;
      case 'requests-assigned':
      case 'faculty-requests-assigned':
        return <RequestsPage initialCategory={tabParams?.initialCategory || tabParams?.category || "ALL"} initialRecordId={tabParams?.recordId || tabParams?.requestId} initialQueue={tabParams?.initialQueue} />;
      case 'requests-complaint':
        return <RequestsPage initialCategory="GENERAL_COMPLAINT" initialRecordId={tabParams?.recordId || tabParams?.requestId} initialQueue={tabParams?.initialQueue} />;

      // ─── 6B. Documents Section ───
      case 'documents':
      case 'student-documents':
      case 'faculty-student-docs':
        return (role === 'FACULTY' || role === 'STUDENT') ? <MentorPage initialTab="STUDENT_DOCUMENTS" /> : <DocumentMasterPage initialRecordId={tabParams?.recordId} />;
      case 'pending-verification':
      case 'faculty-pending-verification':
        return <MentorPage initialTab="PENDING_VERIFICATION" />;

      // ─── 7. Hostel Section ───
      case 'hostel':
      case 'hostel-admin':
        return role === 'STUDENT' ? <StudentHostelPage /> : <HostelWorkspacePage initialTab={tabParams?.subFilter} initialRecordId={tabParams?.recordId} />;

      // ─── 8. Transport Section ───
      case 'transport':
      case 'transport-admin':
        return role === 'STUDENT' ? <StudentTransportPage /> : <TransportWorkspacePage />;

      // ─── 9. Notifications Section ───
      case 'notifications':
        return <NotificationsPage setActiveTab={setActiveTab} />;

      // ─── 10. Profile & ID Card Section ───
      case 'profile':
        return <ProfilePage />;
      case 'id-card':
        return <DigitalIdCardPage />;

      // ─── Campus & Other Support ───
      case 'hr':
      case 'hrms':
      case 'university-hrms':
      case 'leave':
      case 'payroll':
      case 'recruitment':
        return <UniversityHRMSPage />;
      case 'crm':
        return <CRMPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
      case 'user-management':
      case 'users-management':
      case 'rbac-matrix':
      case 'access-control':
        return <SystemSettingsPage />;
      case 'erp-admin':
      case 'erp-admin-dashboard':
      case 'erp-admin/dashboard':
      case 'admin-portal':
        return <AdminPortalPage />;
      case 'ai-control-center':
      case 'ai-agents':
      case 'ai-activity':
      case 'ai-approvals':
      case 'ai-policies':
      case 'ai-audit-logs':
      case 'ai-automation':
        return <AIControlCenterPage />;
      case 'abc-credits':
      case 'academic/abc':
      case 'abc':
      case 'abc-management':
      case 'abc-compliance':
        return role === 'STUDENT' ? <StudentAbcPortal /> : <AbcComplianceDashboard />;
      case 'digilocker':
      case 'digilocker-documents':
      case 'digilocker-admin':
      case 'student/digilocker':
        return role === 'STUDENT' ? <StudentDigiLockerPortal /> : <AdminDigiLockerDashboard />;
      case 'accreditation':
      case 'accreditation-overview':
        return <AccreditationDashboard initialTab="OVERVIEW" />;
      case 'accreditation-naac':
      case 'naac':
        return <AccreditationDashboard initialTab="CRITERIA" initialFramework="NAAC" />;
      case 'accreditation-nba':
      case 'nba':
        return <AccreditationDashboard initialTab="CRITERIA" initialFramework="NBA" />;
      case 'accreditation-evidence':
        return <AccreditationDashboard initialTab="EVIDENCE" />;
      case 'accreditation-reports':
      case 'iqac-accreditation':
        return <AccreditationDashboard initialTab="REPORTS" />;
      case 'obe':
      case 'obe-dashboard':
        return <OBEDashboard initialTab="MAPPING_MATRIX" />;
      case 'course-outcomes':
      case 'obe-co':
        return <OBEDashboard initialTab="CO_MANAGER" />;
      case 'program-outcomes':
      case 'obe-po':
        return <OBEDashboard initialTab="PROGRAM_OUTCOMES" />;
      case 'program-specific-outcomes':
      case 'obe-pso':
        return <OBEDashboard initialTab="PSO" />;
      case 'co-po-mapping':
      case 'obe-copo-map':
        return <OBEDashboard initialTab="MAPPING_MATRIX" />;
      case 'co-pso-mapping':
      case 'obe-copso-map':
        return <OBEDashboard initialTab="CO_PSO_MAPPING" />;
      case 'assessment-mapping':
      case 'obe-assessment-map':
        return <OBEDashboard initialTab="ASSESSMENT_MAPPING" />;
      case 'attainment':
      case 'obe-attainment':
      case 'co-attainment':
      case 'po-attainment':
        return <OBEDashboard initialTab="ATTAINMENT" />;
      case 'grievance':
      case 'anti-ragging':
      case 'icc':
      case 'student-grievance':
        return <GrievanceDashboard initialTab="OVERVIEW" />;
      case 'grievance-anonymous':
        return <GrievanceDashboard initialTab="ANONYMOUS_FILE" />;
      case 'grievance-track':
        return <GrievanceDashboard initialTab="ANONYMOUS_TRACK" />;
      case 'grievance-desk':
        return <GrievanceDashboard initialTab="AUTHORIZED_DESK" />;
      case 'research':
      case 'research-dashboard':
      case 'publications':
      case 'research-publications':
      case 'patents':
      case 'research-patents':
      case 'research-projects':
      case 'research-grants':
      case 'research-scholars':
      case 'research-consultancy':
      case 'research-conferences':
      case 'research-books':
      case 'research-awards':
      case 'research-reports':
        return <ResearchDashboard activeRouteTab={activeTab} />;
      case 'startup-grants':
      case 'startups':
      case 'startups-directory':
      case 'hackathons':
      case 'incubation':
      case 'incubation-centre':
      case 'innovation':
      case 'innovation-dashboard':
      case 'innovation-projects':
      case 'innovation-mentors':
      case 'innovation-funding':
      case 'industry-collaboration':
      case 'innovation-events':
      case 'innovation-hackathons':
      case 'innovation-awards':
      case 'innovation-reports':
        return <StartupGrantDashboard activeRouteTab={activeTab} />;
      case 'grants':
      case 'grants-dashboard':
      case 'grant-opportunities':
      case 'grant-applications':
      case 'grant-disbursements':
      case 'grant-milestones':
      case 'grant-utilization':
      case 'grant-documents':
      case 'grant-reports':
      case 'ssip':
      case 'ssip-projects':
      case 'seed-funding':
        return <GrantsManagementDashboard activeRouteTab={activeTab} />;
      case 'government-integrations':
      case 'government-abc':
      case 'government-digilocker':
        return <GovernmentIntegrationDashboard />;
      case 'compliance-engine':
      case 'compliance':
      case 'accreditation-engine':
      case 'nep-indicators':
        return <ComplianceEngineDashboard />;
      case 'feedback':
      case 'feedback-give':
      case 'feedback-anonymous':
      case 'feedback-anonymous-grievance':
      case 'feedback-track':
      case 'feedback-desk':
      case 'feedback-reports':
      case 'feedback-my':
      case 'feedback-suggestions':
        return <FeedbackPage activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'feedback-escalations':
        return <FeedbackEscalationsDashboardPage />;
      case 'tickets':
      case 'service-desk':
      case 'support-tickets':
        return <SupportTicketsPage />;
      case 'mentor':
        return <MentorPage />;
      case 'notices':
        return <NoticesPage />;
      case 'events':
        return <EventsPage />;
      case 'student-council':
      case 'student-council-desk':
      case 'council-desk':
        return <StudentCouncilDeskPage />;
      case 'library':
        return <LibraryPage />;
      case 'edp-duties':
        return <EdpDutyPage />;
      case 'incubation':
        return <IncubationPage />;
      case 'registrar':
        return <RegistrarWorkspacePage />;
      case 'iqac':
        return <IQACWorkspacePage />;
      case 'exam-cell':
        return <ExamCellWorkspacePage />;
      case 'library-admin':
        return <LibraryWorkspacePage />;
      case 'accounts-admin':
      case 'accounts':
      case 'fee-structure':
        return <AccountsWorkspacePage initialTab={tabParams?.subFilter} initialRecordId={tabParams?.recordId} />;
      case 'maintenance-admin':
      case 'maintenance':
        return <MaintenanceWorkspacePage />;
      case 'institutes':
        return <InstitutesPage />;
      case 'departments':
        return <DepartmentsPage />;
      case 'programs':
        return <ProgramsPage />;
      case 'academic-years':
        return <AcademicYearsPage />;
      case 'batches':
        return <BatchesPage />;
      case 'semesters':
        return <SemestersPage />;
      case 'divisions':
        return <DivisionsPage />;
      case 'faculty':
        return <FacultyPage />;
      case 'students':
        return <StudentsPage />;
      case 'student-search':
      case 'students-search':
      case 'student-profile':
      case 'students-profile':
        if (role === 'FACULTY' || role === 'MENTOR') {
          return <MentorPage initialTab="MY_STUDENTS" />;
        }
        return role !== 'STUDENT' ? (
          <StudentDirectorySearchPage
            initialRecordId={tabParams?.recordId}
            initialStudentId={tabParams?.studentId}
            initialTab={tabParams?.initialTab}
            initialDocId={tabParams?.docId}
          />
        ) : (
          <Dashboard setActiveTab={setActiveTab} />
        );
      case 'students-directory':
        return role !== 'STUDENT' ? (
          <StudentDirectorySearchPage
            initialRecordId={tabParams?.recordId}
            initialStudentId={tabParams?.studentId}
            initialTab={tabParams?.initialTab}
            initialDocId={tabParams?.docId}
          />
        ) : (
          <Dashboard setActiveTab={setActiveTab} />
        );
      case 'mentor-assignment':
        return <StudentsPage initialTab="MENTOR_ASSIGNMENT" />;
      case 'document-master':
        return <DocumentMasterPage initialRecordId={tabParams?.recordId} />;
      case 'security-audit':
        return <SecurityAuditCenterPage />;
      case 'bulk-import':
        return role !== 'STUDENT' ? <BulkImportPage /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'note-sheets':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab={tabParams?.initialTab || "DASHBOARD"} initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-create':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="CREATE" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-pending':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="PENDING_WITH_ME" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-my':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="MY_SHEETS" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-sent':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="SENT" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-returned':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="RETURNED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-clarification':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="CLARIFICATION" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-action-pending':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="ACTION_PENDING" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-approved':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="APPROVED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-rejected':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="REJECTED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-drafts':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="DRAFTS" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-closed':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="CLOSED" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-verify':
        return <NoteSheetPage initialTab="VERIFICATION" initialRecordId={tabParams?.recordId || tabParams?.notesheetId} initialAction={tabParams?.actionType} />;
      case 'notesheet-testing-qa':
      case 'qa-testing':
      case 'testing-qa':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="TESTING_QA" /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'notesheet-pending-testing':
      case 'pending-testing':
        return role !== 'STUDENT' ? <NoteSheetPage initialTab="PENDING_TESTING" /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'inward-outward':
        return <InwardOutwardRegisterPage initialRecordId={tabParams?.recordId} />;
      case 'work-diary':
        return <WorkDiaryPage initialRecordId={tabParams?.recordId} />;
      case 'inventory-assets':
      case 'inventory-dashboard':
        return <InventoryAssetPage initialTab="DASHBOARD" />;
      case 'faculty-assets':
      case 'my-assets':
        return <InventoryAssetPage initialTab="ASSET_REGISTER" initialFacultySubTab="MY_ASSETS" />;
      case 'inventory-assets-register':
        return <InventoryAssetPage initialTab="ASSET_REGISTER" />;
      case 'inventory-stock':
        return <InventoryAssetPage initialTab="CONSUMABLES_STOCK" />;
      case 'inventory-stationery':
        return <InventoryAssetPage initialTab="STATIONERY_REGISTER" />;
      case 'inventory-dept':
        return <InventoryAssetPage initialTab="DEPARTMENT_STORE" />;
      case 'inventory-assignments':
        return <InventoryAssetPage initialTab="ASSET_ASSIGNMENT" />;
      case 'inventory-transactions':
        return <InventoryAssetPage initialTab="STOCK_TRANSACTIONS" />;
      case 'inventory-maintenance':
        return <InventoryAssetPage initialTab="MAINTENANCE" />;
      case 'inventory-verification':
        return <InventoryAssetPage initialTab="PHYSICAL_VERIFICATION" />;
      case 'inventory-transfers':
        return <InventoryAssetPage initialTab="TRANSFERS" />;
      case 'inventory-disposal':
        return <InventoryAssetPage initialTab="DISPOSAL" />;
      case 'inventory-files':
        return <InventoryAssetPage initialTab="PHYSICAL_FILES" />;
      case 'inventory-import':
        return <InventoryAssetPage initialTab="EXCEL_IMPORT" />;
      case 'inventory-reports':
        return <InventoryAssetPage initialTab="REPORTS" />;
      case 'inventory-audit':
        return <InventoryAssetPage initialTab="AUDIT_LOG" />;

      // ─── University Resource Allocation & Central Asset Management Routes ───
      case 'university-asset-management':
      case 'resource-allocation':
      case 'university-resource-allocation':
        return <UniversityAssetManagementPage initialTab="DASHBOARD" />;
      case 'asset-master-register':
      case 'asset-register':
        return <UniversityAssetManagementPage initialTab="ASSET_REGISTER" />;
      case 'department-asset-allocation':
      case 'dept-asset-allocation':
        return <UniversityAssetManagementPage initialTab="DEPARTMENT_ALLOCATION" />;
      case 'classroom-allocation':
      case 'resource-classroom-allocation':
        return <UniversityAssetManagementPage initialTab="CLASSROOM_ALLOCATION" />;
      case 'lab-allocation':
      case 'resource-lab-allocation':
        return <UniversityAssetManagementPage initialTab="LAB_ALLOCATION" />;
      case 'faculty-workload-allocation':
      case 'faculty-resource-allocation':
        return <UniversityAssetManagementPage initialTab="FACULTY_ALLOCATION" />;
      case 'asset-transfers-returns':
      case 'asset-transfers':
        return <UniversityAssetManagementPage initialTab="TRANSFERS_RETURNS" />;
      case 'asset-maintenance-warranty':
      case 'asset-maintenance':
        return <UniversityAssetManagementPage initialTab="MAINTENANCE_WARRANTY" />;
      case 'asset-allocation-requests':
      case 'asset-requests':
        return <UniversityAssetManagementPage initialTab="ALLOCATION_REQUESTS" />;
      case 'asset-reports':
      case 'resource-reports':
        return <UniversityAssetManagementPage initialTab="REPORTS_AUDIT" />;

      // ─── PTM Management Routes ───
      case 'ptm':
      case 'ptm-management':
      case 'ptm-dashboard':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="dashboard" />;
      case 'ptm-schedule':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="ptm-schedule" />;
      case 'ptm-my':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="ptm-my" />;
      case 'ptm-records':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="ptm-records" />;
      case 'ptm-feedback':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="ptm-feedback" />;
      case 'ptm-followups':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="ptm-followups" />;
      case 'ptm-reports':
        return role === 'PARENT' ? <ParentPTMDashboard /> : <PTMManagementPage initialTab="ptm-reports" />;
      case 'parent-ptm':
      case 'parent-dashboard':
      case 'parent-children':
        return <ParentPTMDashboard />;
      case 'student-ptm':
        return <StudentPTMView />;

      default:
        return role === 'PARENT' ? <ParentPTMDashboard /> : <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      {showPostLoginUpdates && unreadNotifs.length > 0 && (
        <PostLoginUpdateModal
          notifications={unreadNotifs}
          onClose={handleDismissPostLoginUpdates}
          onNavigateTab={(tab, params) => {
            handleDismissPostLoginUpdates();
            setActiveTab(tab, params);
          }}
        />
      )}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={handleSetCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        <Topbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', WebkitOverflowScrolling: 'touch' }}>
          <div key={activeTab} className="erp-page-transition" style={{ flex: '1 0 auto', width: '100%', minHeight: 'min-content' }}>
            <Suspense fallback={<PageSkeletonFallback />}>
              {renderActivePage()}
            </Suspense>
          </div>
          <footer style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78125rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            <div>
              <strong style={{ color: 'var(--brand-navy)' }}>Swarrnim Startup & Innovation University</strong> • SSIU ERP — University Management System
            </div>
            <div>
              © 2026 Swarrnim University. All rights reserved.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
