import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { StudentProfileModal } from '../../components/profile/StudentProfileModal';
import { StudentRowActionMenu } from '../../components/common/StudentRowActionMenu';
import { 
  Building2, GraduationCap, UserCheck, BookOpen, Clock, Award, 
  FolderCheck, MessageSquare, CheckSquare, Bell, FileSpreadsheet, 
  ShieldCheck, Settings, Users, Eye, Search, Plus, Download, Printer, 
  Send, AlertTriangle, AlertCircle, CheckCircle2, XCircle, Filter, 
  Calendar, Layers, Check, ChevronRight, Lock, Unlock, Globe, RefreshCw,
  GitFork, History, FileText, ArrowRight, Mail, Inbox, Archive,
  FileSignature, Landmark, FileBox, FileQuestion, DollarSign, UploadCloud,
  FileDown, CheckCheck, Compass, Briefcase, Sparkles, SlidersHorizontal, Info,
  IndianRupee, Boxes, Trash2, UserPlus, ShieldAlert
} from 'lucide-react';
import { 
  Student, Faculty, Subject, Program, Department, Institute, Semester,
  OfficialCorrespondenceRecord, FileMovementRecord, CommitteeMasterRecord,
  CommitteeMeetingRecord, CommitteeActionItemRecord, StatutoryApprovalRecord,
  InternationalStudentRecord, NoteSheet, StudentRequest, User, NoteSheetAction,
  DeputyRegistrarScopeMapping, DeputyRegistrarScopeAudit
} from '../../types';
import { StudentDataChangeTab } from '../../components/profile/StudentDataChangeTab';
import { ExcelDataTable, ExcelColumn } from '../../components/common/ExcelDataTable';
import { StaffProfileDossierModal } from '../../components/profile/StaffProfileDossierModal';
import { DepartmentCompleteManagementView } from '../../components/campus/DepartmentCompleteManagementView';
import { InstituteCompleteManagementView } from '../../components/campus/InstituteCompleteManagementView';
import { RegistrarFacultyStaffControlView } from '../../components/campus/RegistrarFacultyStaffControlView';
import { RegistrarOfficeOrganizationView } from '../../components/campus/RegistrarOfficeOrganizationView';
import { RegistrarExamGovernanceView } from '../../components/academic/RegistrarExamGovernanceView';
import { RegistrarAcademicRequestsGovernanceView } from '../../components/academic/RegistrarAcademicRequestsGovernanceView';
import { RegistrarAcademicReportsView } from '../../components/academic/RegistrarAcademicReportsView';
import { RegistrarDeputyScopeManagementView } from '../../components/campus/RegistrarDeputyScopeManagementView';
import { RegistrarAcademicAdministrationView } from '../../components/academic/RegistrarAcademicAdministrationView';
import { RegistrarAttendanceGovernanceView } from '../../components/academic/RegistrarAttendanceGovernanceView';
import { NoteSheetPage } from './NoteSheetPage';
import * as XLSX from 'xlsx';

export type RegistrarTabType = 
  | 'DASHBOARD'
  | 'MY_OFFICE'
  | 'UNIVERSITY'
  | 'ACADEMICS'
  | 'ATTENDANCE'
  | 'STUDENTS'
  | 'FACULTY'
  | 'NOTESHEETS'
  | 'REQUESTS'
  | 'APPROVALS'
  | 'EXAMINATION'
  | 'DOCUMENTS'
  | 'FINANCE'
  | 'CORRESPONDENCE'
  | 'FILES'
  | 'COMMITTEES'
  | 'NOTICES'
  | 'INVENTORY'
  | 'REPORTS'
  | 'NOTIFICATIONS'
  | 'AUDIT_LOGS'
  | 'EXCEL_CENTER'
  | 'SETTINGS';

export interface RegistrarWorkspacePageProps {
  initialTab?: RegistrarTabType;
  initialSubFilter?: string;
  initialRecordId?: string;
}

export const RegistrarWorkspacePage: React.FC<RegistrarWorkspacePageProps> = ({
  initialTab = 'DASHBOARD',
  initialSubFilter = 'ALL',
  initialRecordId
}) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<RegistrarTabType>(initialTab);
  const [subFilter, setSubFilter] = useState<string>(initialSubFilter);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialSubFilter) setSubFilter(initialSubFilter);
  }, [initialSubFilter]);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedFacultyForProfile, setSelectedFacultyForProfile] = useState<Faculty | null>(null);
  const [selectedInstituteForDrilldown, setSelectedInstituteForDrilldown] = useState<Institute | null>(null);
  const [selectedDepartmentForDrilldown, setSelectedDepartmentForDrilldown] = useState<Department | null>(null);
  const [departmentDrilldownTab, setDepartmentDrilldownTab] = useState<string>('OVERVIEW');
  
  // Scope Assignment Modal State
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [scopeTargetUserId, setScopeTargetUserId] = useState('');
  const [scopeTargetInstId, setScopeTargetInstId] = useState('');
  const [scopeSelectedDeptIds, setScopeSelectedDeptIds] = useState<string[]>([]);

  // Statutory Approval Modal State
  const [selectedApproval, setSelectedApproval] = useState<StatutoryApprovalRecord | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | 'FORWARDED'>('APPROVED');
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Correspondence Creation Modal
  const [isCorrModalOpen, setIsCorrModalOpen] = useState(false);
  const [corrType, setCorrType] = useState<'INCOMING' | 'OUTGOING' | 'CIRCULAR' | 'EXTERNAL_GOV'>('INCOMING');
  const [corrRefNo, setCorrRefNo] = useState('');
  const [corrSenderRecipient, setCorrSenderRecipient] = useState('');
  const [corrSubject, setCorrSubject] = useState('');
  const [corrCategory, setCorrCategory] = useState('UGC');
  const [corrPriority, setCorrPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [corrInst, setCorrInst] = useState('ALL');
  const [corrActionTaken, setCorrActionTaken] = useState('');
  const [corrRemarks, setCorrRemarks] = useState('');

  // File Movement Modal
  const [isFileMovementModalOpen, setIsFileMovementModalOpen] = useState(false);
  const [fileNumber, setFileNumber] = useState('');
  const [fileSubject, setFileSubject] = useState('');
  const [fileFromOffice, setFileFromOffice] = useState('Registrar Office');
  const [fileToOffice, setFileToOffice] = useState('Academic Council Secretariat');
  const [fileCurrentHolder, setFileCurrentHolder] = useState('Dean Academics');
  const [fileActionRequired, setFileActionRequired] = useState('');
  const [fileRemarks, setFileRemarks] = useState('');

  // Committee Meeting & MOM Modal
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingCommitteeId, setMeetingCommitteeId] = useState('');
  const [meetingNumber, setMeetingNumber] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingVenue, setMeetingVenue] = useState('Senate Hall, Central Administrative Complex');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingMom, setMeetingMom] = useState('');
  const [meetingAttendance, setMeetingAttendance] = useState(12);

  // Committee Action Item Modal
  const [selectedActionItem, setSelectedActionItem] = useState<CommitteeActionItemRecord | null>(null);
  const [actionItemStatus, setActionItemStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>('COMPLETED');
  const [actionItemRemarks, setActionItemRemarks] = useState('');

  // Academic Calendar Event Modal
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calEventTitle, setCalEventTitle] = useState('');
  const [calEventType, setCalEventType] = useState<'SEMESTER_START' | 'SEMESTER_END' | 'EXAM_PERIOD' | 'HOLIDAY' | 'REGISTRATION' | 'RESULT_DECLARATION'>('SEMESTER_START');
  const [calEventStartDate, setCalEventStartDate] = useState('');
  const [calEventEndDate, setCalEventEndDate] = useState('');
  const [calEventTargetInst, setCalEventTargetInst] = useState('ALL');

  // Notice Publisher Modal
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'UNIVERSITY' | 'ACADEMIC' | 'ADMINISTRATIVE'>('UNIVERSITY');
  const [noticePriority, setNoticePriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [noticeAudience, setNoticeAudience] = useState<'ALL_STUDENTS' | 'ALL_FACULTY' | 'ALL_CAMPUS' | 'HOIS' | 'HODS'>('ALL_CAMPUS');

  // Notesheet Concurrence Modal
  const [selectedNotesheet, setSelectedNotesheet] = useState<NoteSheet | null>(null);
  const [notesheetAction, setNotesheetAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | 'FORWARD' | 'CLARIFICATION'>('APPROVE');
  const [notesheetRemarks, setNotesheetRemarks] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // REAL DATABASE DATA (NO MOCK DATA)
  // ──────────────────────────────────────────────────────────────────────────
  const allInstitutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const allDepartments = useMemo(() => db.getDepartments(), [refreshKey]);
  const programs = useMemo(() => db.getPrograms(), [refreshKey]);
  const scopedStudents = useMemo(() => db.getScopedStudents(user, role), [refreshKey, user, role]);
  const scopedFaculty = useMemo(() => db.getScopedFaculty(user, role), [refreshKey, user, role]);
  const scopedNoteSheets = useMemo(() => db.getScopedNoteSheets(user, role), [refreshKey, user, role]);
  const assignedScopes = useMemo(() => (user ? db.getDeputyRegistrarScopeByUserId(user.id) : []), [refreshKey, user]);
  const allDeputyRegistrars = useMemo(() => db.getUsers().filter(u => u.role === 'DEPUTY_REGISTRAR'), [refreshKey]);
  const allDeputyRegistrarScopes = useMemo(() => db.getDeputyRegistrarScopes(), [refreshKey]);
  const scopeAuditLogs = useMemo(() => db.getDeputyRegistrarScopeAuditLogs(), [refreshKey]);

  // If Deputy Registrar, restrict institute & department options to assigned scope
  const institutes = useMemo(() => {
    if (role === 'DEPUTY_REGISTRAR' && assignedScopes.length > 0) {
      const assignedInstIds = assignedScopes.map(s => s.instituteId);
      return allInstitutes.filter(i => assignedInstIds.includes(i.id));
    }
    return allInstitutes;
  }, [allInstitutes, assignedScopes, role]);

  const departments = useMemo(() => {
    if (role === 'DEPUTY_REGISTRAR' && assignedScopes.length > 0) {
      const assignedDeptIds = assignedScopes.flatMap(s => s.departmentIds);
      if (assignedDeptIds.length > 0) {
        return allDepartments.filter(d => assignedDeptIds.includes(d.id));
      }
      const assignedInstIds = assignedScopes.map(s => s.instituteId);
      return allDepartments.filter(d => assignedInstIds.includes(d.instituteId));
    }
    return allDepartments;
  }, [allDepartments, assignedScopes, role]);

  const students = scopedStudents;
  const faculty = scopedFaculty;
  const noteSheets = scopedNoteSheets;
  const subjects = useMemo(() => db.getSubjects(), [refreshKey]);
  const academicYears = useMemo(() => db.getAcademicYears(), [refreshKey]);
  const currentAY = useMemo(() => academicYears.find(ay => ay.isCurrent) || academicYears[0] || { name: '2025-2026' }, [academicYears]);
  const allDocs = useMemo(() => db.getStudentDocuments(), [refreshKey]);
  const allRequests = useMemo(() => db.getState().studentRequests || [], [refreshKey]);
  const sectionRequests = useMemo(() => db.getStudentSectionRequests(), [refreshKey]);
  const attendanceSessions = useMemo(() => db.getAttendanceSessions(), [refreshKey]);
  const exams = useMemo(() => db.getExams(), [refreshKey]);
  const examForms = useMemo(() => db.getExamForms(), [refreshKey]);
  const studentResults = useMemo(() => db.getStudentResults(), [refreshKey]);
  const auditLogs = useMemo(() => db.getAuditLogs(), [refreshKey]);
  const fixedAssets = useMemo(() => db.getFixedAssets(), [refreshKey]);
  const assetTransfers = useMemo(() => db.getState().assetTransfers || [], [refreshKey]);
  const assetMaintenance = useMemo(() => db.getState().assetMaintenanceLogs || [], [refreshKey]);
  const studentFees = useMemo(() => db.getStudentFeeRecords(), [refreshKey]);

  // Specific Registrar Master Entities
  const statutoryApprovals = useMemo(() => db.getStatutoryApprovals(selectedDeptFilter === 'ALL' ? undefined : selectedDeptFilter, statusFilter === 'ALL' ? undefined : statusFilter), [refreshKey, selectedDeptFilter, statusFilter]);
  const officialCorrespondence = useMemo(() => db.getOfficialCorrespondence(undefined, selectedInstFilter), [refreshKey, selectedInstFilter]);
  const fileMovements = useMemo(() => db.getFileMovements(searchQuery || undefined), [refreshKey, searchQuery]);
  const committees = useMemo(() => db.getCommittees(), [refreshKey]);
  const committeeMeetings = useMemo(() => db.getCommitteeMeetings(), [refreshKey]);
  const committeeActionItems = useMemo(() => db.getCommitteeActionItems(), [refreshKey]);

  // Deep-link Auto-Open Exact Record
  useEffect(() => {
    if (initialRecordId) {
      if (activeTab === 'NOTESHEETS' && noteSheets.length > 0) {
        const match = noteSheets.find(n => n.id === initialRecordId || n.noteSheetNumber === initialRecordId);
        if (match) setSelectedNotesheet(match);
      } else if (activeTab === 'APPROVALS' && statutoryApprovals.length > 0) {
        const match = statutoryApprovals.find(a => a.id === initialRecordId || a.requestNo === initialRecordId);
        if (match) setSelectedApproval(match);
      }
    }
  }, [initialRecordId, activeTab, noteSheets, statutoryApprovals]);
  const internationalStudents = useMemo(() => db.getInternationalStudents(searchQuery || undefined), [refreshKey, searchQuery]);

  // ──────────────────────────────────────────────────────────────────────────
  // DASHBOARD KPI METRICS
  // ──────────────────────────────────────────────────────────────────────────
  const kpiStats = useMemo(() => {
    const totalInst = institutes.length;
    const totalDept = departments.length;
    const totalProg = programs.length;
    const totalStud = students.length;
    const totalFac = faculty.length;
    
    // Notesheets pending with registrar (derived strictly from central Single Source of Truth)
    const pendingNotesheets = db.getPendingWithMeNotesheets(user, role).length;
    const pendingApprovalsCount = statutoryApprovals.filter(a => a.status === 'PENDING').length;
    const escalatedRequestsCount = allRequests.filter(r => r.status === 'SUBMITTED' || (r as any).escalated).length + sectionRequests.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'PROCESSING').length;
    const pendingDocsCount = allDocs.filter(d => (d as any).verificationStatus === 'PENDING_VERIFICATION' || (d as any).status === 'PENDING').length;
    
    // Examination overview
    const activeExamsCount = exams.filter(e => e.status === 'SCHEDULED' || e.status === 'ONGOING').length;
    
    // Low attendance students (< 75%)
    const attendanceShortageCount = students.filter(s => {
      const semHistory = s.academicHistory?.[s.academicHistory.length - 1];
      return (semHistory?.attendancePercentage || 85) < 75;
    }).length;

    return {
      totalInst,
      totalDept,
      totalProg,
      totalStud,
      totalFac,
      pendingNotesheets,
      pendingApprovalsCount,
      escalatedRequestsCount,
      pendingDocsCount,
      activeExamsCount,
      attendanceShortageCount,
      totalCorrespondence: officialCorrespondence.length,
      activeFilesCount: fileMovements.filter(f => f.status === 'IN_TRANSIT' || f.status === 'RECEIVED').length,
      totalCommittees: committees.length,
      pendingActions: committeeActionItems.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length
    };
  }, [institutes, departments, programs, students, faculty, noteSheets, statutoryApprovals, allRequests, sectionRequests, allDocs, exams, officialCorrespondence, fileMovements, committees, committeeActionItems]);

  // ──────────────────────────────────────────────────────────────────────────
  // UNIVERSITY ALL DEPARTMENTS DIRECTORY DATA & COLUMNS
  // ──────────────────────────────────────────────────────────────────────────
  const departmentDirectoryData = useMemo(() => {
    return departments.map((dept, idx) => {
      const inst = institutes.find(i => i.id === dept.instituteId) || allInstitutes.find(i => i.id === dept.instituteId);
      const dProgs = programs.filter(p => p.departmentId === dept.id);
      const dStudents = students.filter(s => s.departmentId === dept.id);
      const dFaculty = faculty.filter(f => f.departmentId === dept.id);
      const dSections = dProgs.length * 2;
      
      const dAttendanceShortages = dStudents.filter(s => {
        const stats = db.getStudentAttendanceStats(s.id);
        const avg = stats ? stats.percentage : 85;
        return avg < 75;
      }).length;

      const dAcademicRisks = dStudents.filter(s => {
        const sem = s.academicHistory?.[s.academicHistory.length - 1];
        return (sem && ((sem as any).gpa < 5.0 || ((sem as any).backlogs && (sem as any).backlogs > 0)));
      }).length;

      const dPendingApprovals = statutoryApprovals.filter(a => a.departmentId === dept.id && a.status === 'PENDING').length;
      const dPendingRequests = allRequests.filter(r => r.departmentId === dept.id && (r.status === 'SUBMITTED' || r.status === 'FORWARDED_TO_DEPARTMENT')).length;
      const dHOD = faculty.find(f => f.departmentId === dept.id && (f.designation?.toLowerCase().includes('hod') || f.email?.includes('hod'))) || faculty.find(f => f.departmentId === dept.id);

      return {
        id: dept.id,
        index: idx + 1,
        department: dept,
        name: dept.name,
        code: dept.code,
        instituteId: dept.instituteId,
        instituteCode: inst?.code || 'INST',
        instituteName: inst?.name || 'Constituent Institute',
        hodName: dHOD?.name || (dept as any).hodName || 'Prof. Appointed HOD',
        hodEmail: dHOD?.email || (dept as any).hodEmail || 'hod@swarrnim.edu.in',
        programsCount: dProgs.length,
        studentsCount: dStudents.length,
        facultyCount: dFaculty.length,
        sectionsCount: dSections,
        activeAY: currentAY.name,
        attendanceRiskCount: dAttendanceShortages,
        academicRiskCount: dAcademicRisks,
        pendingApprovalsCount: dPendingApprovals,
        pendingRequestsCount: dPendingRequests,
        examStatus: 'SCHEDULED',
        status: (dept as any).status || 'ACTIVE'
      };
    });
  }, [departments, institutes, allInstitutes, programs, students, faculty, statutoryApprovals, allRequests, currentAY]);

  const departmentDirectoryColumns: ExcelColumn<any>[] = [
    {
      key: 'code',
      header: 'Dept Code',
      width: '120px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.code}</code>
    },
    {
      key: 'name',
      header: 'Department Name',
      width: '230px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.instituteName} ({item.instituteCode})</div>
        </div>
      )
    },
    {
      key: 'hodName',
      header: 'Head of Department (HOD)',
      width: '180px',
      render: item => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.hodName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.hodEmail}</div>
        </div>
      )
    },
    {
      key: 'programsCount',
      header: 'Programs',
      width: '95px',
      align: 'center',
      render: item => <Badge variant="navy">{item.programsCount} Degree</Badge>
    },
    {
      key: 'studentsCount',
      header: 'Students',
      width: '95px',
      align: 'center',
      render: item => <span style={{ fontWeight: 700, color: '#10B981' }}>{item.studentsCount}</span>
    },
    {
      key: 'facultyCount',
      header: 'Faculty',
      width: '90px',
      align: 'center',
      render: item => <span style={{ fontWeight: 700, color: '#6366F1' }}>{item.facultyCount}</span>
    },
    {
      key: 'attendanceRiskCount',
      header: 'Attendance Risk',
      width: '120px',
      align: 'center',
      render: item => (
        <Badge variant={item.attendanceRiskCount > 0 ? 'warning' : 'active'}>
          {item.attendanceRiskCount > 0 ? `${item.attendanceRiskCount} Shortage` : 'Normal (≥75%)'}
        </Badge>
      )
    },
    {
      key: 'academicRiskCount',
      header: 'Academic Risk',
      width: '110px',
      align: 'center',
      render: item => (
        <Badge variant={item.academicRiskCount > 0 ? 'danger' : 'active'}>
          {item.academicRiskCount > 0 ? `${item.academicRiskCount} At-Risk` : 'Clear'}
        </Badge>
      )
    },
    {
      key: 'pendingApprovalsCount',
      header: 'Approvals',
      width: '95px',
      align: 'center',
      render: item => (
        <Badge variant={item.pendingApprovalsCount > 0 ? 'gold' : 'inactive'}>
          {item.pendingApprovalsCount}
        </Badge>
      )
    },
    {
      key: 'pendingRequestsCount',
      header: 'Requests',
      width: '95px',
      align: 'center',
      render: item => (
        <Badge variant={item.pendingRequestsCount > 0 ? 'warning' : 'inactive'}>
          {item.pendingRequestsCount}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '95px',
      align: 'center',
      render: item => <Badge variant="active">{item.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={() => {
            setSelectedDepartmentForDrilldown(item.department);
            setDepartmentDrilldownTab('OVERVIEW');
          }}
        >
          Open Management View →
        </button>
      )
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT UTILITY: XLSX ONLY (NO CSV)
  // ──────────────────────────────────────────────────────────────────────────
  const exportToExcel = (data: any[], fileName: string, sheetName = 'Registrar_Report') => {
    if (!data || data.length === 0) {
      showToast('No data available to export.', 'error');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Successfully exported ${fileName}.xlsx`);
  };

  const handlePrintPDF = (title: string) => {
    window.print();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS FOR ACTIONS & SCOPE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────
  const handleAssignScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeTargetUserId || !scopeTargetInstId) {
      showToast('Please select Deputy Registrar and Institute.', 'error');
      return;
    }
    if (user?.id === scopeTargetUserId) {
      showToast('Deputy Registrar cannot assign or modify their own scope.', 'error');
      return;
    }

    const assigningUser = user || {
      id: 'usr-reg-1',
      name: 'Dr. Registrar',
      role: 'REGISTRAR',
      email: 'registrar@swarrnim.edu.in'
    } as User;

    try {
      db.assignDeputyRegistrarScope({
        userId: scopeTargetUserId,
        instituteId: scopeTargetInstId,
        departmentIds: scopeSelectedDeptIds,
        assignedByUser: assigningUser
      });
      showToast('Deputy Registrar jurisdictional scope assigned successfully.');
      setIsScopeModalOpen(false);
      setScopeTargetUserId('');
      setScopeTargetInstId('');
      setScopeSelectedDeptIds([]);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign scope', 'error');
    }
  };

  const handleRevokeScope = (scopeId: string) => {
    if (!user) return;
    if (role === 'DEPUTY_REGISTRAR') {
      showToast('Deputy Registrar cannot revoke scopes.', 'error');
      return;
    }
    try {
      db.removeDeputyRegistrarScope(scopeId, user);
      showToast('Scope assignment revoked successfully.');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke scope', 'error');
    }
  };

  const handleRemoveDepartmentFromScope = (scopeId: string, departmentId: string) => {
    if (!user) return;
    if (role === 'DEPUTY_REGISTRAR') {
      showToast('Deputy Registrar cannot modify scopes.', 'error');
      return;
    }
    try {
      db.removeDepartmentFromDeputyRegistrarScope(scopeId, departmentId, user);
      showToast('Department removed from scope.');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to modify scope', 'error');
    }
  };

  const handleActionNotesheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotesheet) return;
    
    const activeUser: User = user || {
      id: 'usr-reg-1',
      name: 'Dr. Sanjay Patel',
      role: 'REGISTRAR',
      instituteId: 'inst-sit',
      email: 'registrar@swarrnim.edu.in'
    } as User;

    let forwardToOffice: string | undefined = undefined;
    if (notesheetAction === 'FORWARD') {
      forwardToOffice = 'FINANCE';
    }

    db.processNoteSheetAction(
      selectedNotesheet.id,
      notesheetAction as NoteSheetAction,
      notesheetRemarks || `Action ${notesheetAction} taken by Registrar`,
      undefined,
      activeUser,
      forwardToOffice
    );

    showToast(`Notesheet ${selectedNotesheet.noteSheetNumber || selectedNotesheet.id} updated with action ${notesheetAction}.`);
    setSelectedNotesheet(null);
    setNotesheetRemarks('');
    triggerRefresh();
  };

  const handleActionStatutoryApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    db.actionStatutoryApproval(selectedApproval.id, approvalAction, approvalRemarks, user || undefined);
    db.logAudit(
      `STATUTORY_APPROVAL_${approvalAction}`,
      'STATUTORY_APPROVALS',
      `Approval Request ${selectedApproval.requestNo} status set to ${approvalAction}: ${approvalRemarks}`,
      user?.name || 'Dr. Sanjay Patel',
      'REGISTRAR'
    );
    showToast(`Approval request ${selectedApproval.requestNo} updated to ${approvalAction}`);
    setSelectedApproval(null);
    setApprovalRemarks('');
    triggerRefresh();
  };

  const handleCreateCorrespondence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrRefNo || !corrSenderRecipient || !corrSubject) {
      showToast('Please fill all mandatory fields.', 'error');
      return;
    }
    const instObj = institutes.find(i => i.id === corrInst);
    db.createOfficialCorrespondence({
      correspondenceType: corrType,
      referenceNumber: corrRefNo,
      date: new Date().toISOString().slice(0, 10),
      senderOrRecipient: corrSenderRecipient,
      subject: corrSubject,
      instituteId: corrInst === 'ALL' ? undefined : corrInst,
      instituteName: instObj ? instObj.name : 'University Wide',
      category: corrCategory,
      priority: corrPriority,
      status: corrType === 'OUTGOING' ? 'DISPATCHED' : 'RECEIVED',
      receivedOrPreparedByName: user?.name || 'Dr. Sanjay Patel (Registrar)',
      approvedByName: 'Dr. Sanjay Patel (Registrar)',
      actionTaken: corrActionTaken,
      remarks: corrRemarks
    });
    db.logAudit(
      'CREATE_CORRESPONDENCE',
      'OFFICIAL_CORRESPONDENCE',
      `Logged correspondence ${corrRefNo} (${corrType}) from/to ${corrSenderRecipient}: ${corrSubject}`,
      user?.name || 'Dr. Sanjay Patel',
      'REGISTRAR'
    );
    showToast(`Official Correspondence ${corrRefNo} logged successfully.`);
    setIsCorrModalOpen(false);
    setCorrRefNo('');
    setCorrSenderRecipient('');
    setCorrSubject('');
    setCorrRemarks('');
    setCorrActionTaken('');
    triggerRefresh();
  };

  const handleCreateFileMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNumber || !fileSubject || !fileToOffice) {
      showToast('Please fill all required file movement fields.', 'error');
      return;
    }
    db.createFileMovement({
      fileNumber,
      subject: fileSubject,
      currentHolder: fileCurrentHolder,
      fromOffice: fileFromOffice,
      toOffice: fileToOffice,
      sentDate: new Date().toISOString(),
      actionRequired: fileActionRequired || 'Administrative Scrutiny & Endorsement',
      status: 'IN_TRANSIT',
      remarks: fileRemarks
    });
    db.logAudit(
      'TRANSFER_FILE',
      'FILE_MOVEMENT',
      `File ${fileNumber} transferred from ${fileFromOffice} to ${fileToOffice}`,
      user?.name || 'Dr. Sanjay Patel',
      'REGISTRAR'
    );
    showToast(`File Movement for ${fileNumber} dispatched to ${fileToOffice}.`);
    setIsFileMovementModalOpen(false);
    setFileNumber('');
    setFileSubject('');
    setFileRemarks('');
    setFileActionRequired('');
    triggerRefresh();
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCommitteeId || !meetingNumber || !meetingDate || !meetingAgenda) {
      showToast('Please fill all committee meeting fields.', 'error');
      return;
    }
    const cmt = committees.find(c => c.id === meetingCommitteeId);
    db.createCommitteeMeeting({
      committeeId: meetingCommitteeId,
      committeeName: cmt ? cmt.name : 'University Committee',
      meetingNumber,
      meetingDate,
      venue: meetingVenue,
      agenda: meetingAgenda,
      momText: meetingMom || undefined,
      attendanceCount: Number(meetingAttendance) || 10,
      status: meetingMom ? 'MOM_CIRCULATED' : 'SCHEDULED'
    });
    db.logAudit(
      'CONVENE_MEETING',
      'COMMITTEES',
      `Convened meeting ${meetingNumber} for ${cmt?.name || 'Committee'} on ${meetingDate}`,
      user?.name || 'Dr. Sanjay Patel',
      'REGISTRAR'
    );
    showToast(`Meeting ${meetingNumber} scheduled for ${cmt?.name}.`);
    setIsMeetingModalOpen(false);
    setMeetingNumber('');
    setMeetingAgenda('');
    setMeetingMom('');
    triggerRefresh();
  };

  const handleUpdateActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActionItem) return;
    db.updateCommitteeActionItemStatus(selectedActionItem.id, actionItemStatus, actionItemRemarks);
    db.logAudit(
      'UPDATE_ACTION_ITEM',
      'COMMITTEE_ACTIONS',
      `Updated Action Item ${selectedActionItem.itemNumber} status to ${actionItemStatus}`,
      user?.name || 'Dr. Sanjay Patel',
      'REGISTRAR'
    );
    showToast(`Action Item ${selectedActionItem.itemNumber} updated to ${actionItemStatus}.`);
    setSelectedActionItem(null);
    setActionItemRemarks('');
    triggerRefresh();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER CONTENT BASED ON ACTIVE TAB
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & University Governance Branding */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-white">Office of the Registrar</h1>
                <Badge variant="navy" className="bg-blue-500/30 text-blue-200 border-blue-400/40">
                  Apex Academic & Statutory Custodian
                </Badge>
                <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  AY {currentAY.name} Active
                </Badge>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Swarrnim Startup & Innovation University • Central Governance, Statutory Affiliations & Cross-Institute Oversight
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerRefresh}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition border border-white/10"
              title="Refresh Data from Real Database"
            >
              <RefreshCw className="w-4 h-4" />
              Sync DB
            </button>
            <button
              onClick={() => handlePrintPDF('Registrar_Official_Summary')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print Roster
            </button>
          </div>
        </div>

        {/* Global KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div 
            onClick={() => setActiveTab('UNIVERSITY')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-xl p-3 border border-white/5"
            title="View Constituent Institutes"
          >
            <span className="text-xs text-slate-400 font-medium">Institutes</span>
            <div className="text-xl font-bold text-white mt-0.5">{kpiStats.totalInst}</div>
            <span className="text-[11px] text-blue-300">Constituent Units</span>
          </div>
          <div 
            onClick={() => setActiveTab('STUDENTS')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-xl p-3 border border-white/5"
            title="View Student Administration"
          >
            <span className="text-xs text-slate-400 font-medium">Enrolled Students</span>
            <div className="text-xl font-bold text-white mt-0.5">{kpiStats.totalStud}</div>
            <span className="text-[11px] text-emerald-300">All Semesters</span>
          </div>
          <div 
            onClick={() => setActiveTab('FACULTY')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-xl p-3 border border-white/5"
            title="View Complete Faculty & Staff Control Center"
          >
            <span className="text-xs text-slate-400 font-medium">Faculty & Staff</span>
            <div className="text-xl font-bold text-white mt-0.5">{kpiStats.totalFac}</div>
            <span className="text-[11px] text-indigo-300">Academic Workforce</span>
          </div>
          <div 
            onClick={() => setActiveTab('APPROVALS')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-xl p-3 border border-white/5"
            title="View Pending Approvals"
          >
            <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{kpiStats.pendingApprovalsCount}</div>
            <span className="text-[11px] text-amber-300">Statutory / Programs</span>
          </div>
          <div 
            onClick={() => setActiveTab('NOTESHEETS')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-xl p-3 border border-white/5"
            title="View Notesheet Queue"
          >
            <span className="text-xs text-slate-400 font-medium">Pending Notesheets</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{kpiStats.pendingNotesheets}</div>
            <span className="text-[11px] text-rose-300">Workflow Concurrence</span>
          </div>
          <div 
            onClick={() => setActiveTab('COMMITTEES')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-xl p-3 border border-white/5"
            title="View Active Committees"
          >
            <span className="text-xs text-slate-400 font-medium">Active Committees</span>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">{kpiStats.totalCommittees}</div>
            <span className="text-[11px] text-cyan-200">{kpiStats.pendingActions} Action Items</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between text-sm font-medium transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50' 
            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
        }`}>
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. DASHBOARD VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. DASHBOARD VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'DASHBOARD') && (
        selectedDepartmentForDrilldown ? (
          <DepartmentCompleteManagementView
            department={selectedDepartmentForDrilldown}
            onBack={() => setSelectedDepartmentForDrilldown(null)}
          />
        ) : selectedInstituteForDrilldown ? (
          <InstituteCompleteManagementView
            institute={selectedInstituteForDrilldown}
            onBack={() => setSelectedInstituteForDrilldown(null)}
            onSelectDepartment={(dept) => setSelectedDepartmentForDrilldown(dept)}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrar Secretariat</p>
                  <h3 className="text-2xl font-bold text-indigo-950 dark:text-white mt-1">My Office</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Staff Hierarchy & Tasks</p>
                </div>
                <button 
                  onClick={() => setActiveTab('MY_OFFICE')}
                  className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition"
                  title="Open Registrar Office Organization & Staff Control"
                >
                  <Building2 className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Official Correspondence</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpiStats.totalCorrespondence}</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">UGC, AICTE & Govt Letters</p>
                </div>
                <button 
                  onClick={() => { setActiveTab('CORRESPONDENCE'); setIsCorrModalOpen(true); }}
                  className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active File Movements</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpiStats.activeFilesCount}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">In Transit / Scrutiny</p>
                </div>
                <button 
                  onClick={() => { setActiveTab('FILES'); setIsFileMovementModalOpen(true); }}
                  className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Approvals</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpiStats.pendingApprovalsCount}</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Requires Registrar Sign-off</p>
                </div>
                <button 
                  onClick={() => setActiveTab('APPROVALS')}
                  className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition"
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Notesheets</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpiStats.pendingNotesheets}</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Institute Concurrence Queue</p>
                </div>
                <button 
                  onClick={() => setActiveTab('NOTESHEETS')}
                  className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition"
                >
                  <FileSignature className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* What Needs My Attention? Action Center */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    What Needs My Attention?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live action items categorized by priority requiring Registrar review, sign-off or concurrence</p>
                </div>
                <Badge variant="warning" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  {kpiStats.pendingNotesheets + kpiStats.pendingApprovalsCount + kpiStats.pendingActions} Action Items
                </Badge>
              </div>

              <div 
                className="dashboard-attention-cards-grid"
                style={{ '--action-count': 4 } as React.CSSProperties}
              >
                {/* Critical Priority Card */}
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      Critical
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                      {db.getPendingWithMeNotesheets(user, role).length} Items
                    </span>
                  </div>
                  <div className="space-y-2">
                    {db.getPendingWithMeNotesheets(user, role).slice(0, 2).map(n => (
                      <button
                        key={n.id}
                        onClick={() => { setSelectedNotesheet(n); }}
                        className="w-full text-left p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-600 transition shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">{n.noteSheetNumber}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{n.subject}</p>
                        <span className="text-[10px] text-slate-500">{n.estimatedCost ? `₹${n.estimatedCost.toLocaleString('en-IN')}` : 'Non-financial'} • Pending Concurrence</span>
                      </button>
                    ))}
                    {db.getPendingWithMeNotesheets(user, role).length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">No critical notesheets pending</p>
                    )}
                  </div>
                </div>

                {/* High Priority Card */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      High
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {statutoryApprovals.filter(a => a.status === 'PENDING').length} Approvals
                    </span>
                  </div>
                  <div className="space-y-2">
                    {statutoryApprovals.filter(a => a.status === 'PENDING').slice(0, 2).map(a => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedApproval(a); }}
                        className="w-full text-left p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 transition shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">{a.requestNo}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{a.title}</p>
                        <span className="text-[10px] text-slate-500">{a.applicantEntity} • Statutory Sign-off</span>
                      </button>
                    ))}
                    {statutoryApprovals.filter(a => a.status === 'PENDING').length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">No pending statutory requests</p>
                    )}
                  </div>
                </div>

                {/* Medium Priority Card */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Medium
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {committeeActionItems.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length} Actions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {committeeActionItems.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').slice(0, 2).map(i => (
                      <button
                        key={i.id}
                        onClick={() => { setSelectedActionItem(i); }}
                        className="w-full text-left p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">{i.itemNumber}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{i.description}</p>
                        <span className="text-[10px] text-slate-500">Due: {i.deadline} • {i.committeeName}</span>
                      </button>
                    ))}
                    {committeeActionItems.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">All committee actions resolved</p>
                    )}
                  </div>
                </div>

                {/* Normal Priority Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Routine
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {officialCorrespondence.length} Records
                    </span>
                  </div>
                  <div className="space-y-2">
                    {officialCorrespondence.slice(0, 2).map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveTab('CORRESPONDENCE'); }}
                        className="w-full text-left p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.referenceNumber}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{c.subject}</p>
                        <span className="text-[10px] text-slate-500">{c.correspondenceType} • {c.senderOrRecipient}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MY UNIVERSITY — CONSTITUENT INSTITUTES DIRECTORY */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    MY UNIVERSITY — INSTITUTES DIRECTORY ({institutes.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Central Academic Master governance across all constituent SSIU institutions</p>
                </div>
                <button
                  onClick={() => exportToExcel(institutes.map(i => {
                    const instStudents = students.filter(s => s.instituteId === i.id);
                    const instFaculty = faculty.filter(f => f.instituteId === i.id);
                    const instProgs = programs.filter(p => p.instituteId === i.id);
                    const instDepts = departments.filter(d => d.instituteId === i.id);
                    return {
                      'Institute Code': i.code,
                      'Institute Name': i.name,
                      'Dean / HOI': (i as any).deanName || 'Dr. Principal',
                      'Total Departments': instDepts.length,
                      'Total Programs': instProgs.length,
                      'Total Students': instStudents.length,
                      'Total Faculty': instFaculty.length,
                      'FSR Ratio': `1:${Math.round(instStudents.length / Math.max(1, instFaculty.length))}`
                    };
                  }), 'SSIU_Constituent_Institutes_Roster')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Institute Roster (.xlsx)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Institute</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Head of Institute (HOI)</th>
                      <th className="py-3 px-4 text-center">Depts</th>
                      <th className="py-3 px-4 text-center">Programs</th>
                      <th className="py-3 px-4 text-center">Students</th>
                      <th className="py-3 px-4 text-center">Faculty</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {institutes.map(inst => {
                      const instStudents = students.filter(s => s.instituteId === inst.id);
                      const instFaculty = faculty.filter(f => f.instituteId === inst.id);
                      const instProgs = programs.filter(p => p.instituteId === inst.id);
                      const instDepts = departments.filter(d => d.instituteId === inst.id);
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              {inst.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{inst.code}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{(inst as any).deanName || 'Dr. Principal / Director'}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">{instDepts.length}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-200">{instProgs.length}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{instStudents.length}</td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{instFaculty.length}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="active">Active</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedInstituteForDrilldown(inst)}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
                            >
                              VIEW INSTITUTE →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ALL UNIVERSITY DEPARTMENTS DIRECTORY (EXCEL DATA TABLE) */}
            <ExcelDataTable
              data={departmentDirectoryData}
              columns={departmentDirectoryColumns}
              title={`All University Departments & Academic Divisions (${departments.length})`}
              subtitle="Comprehensive department directory across constituent institutes with live headcount, workload, and risk metrics. Click 'Open Management View →' to open the complete 16-tab department dossier."
              storageKey="reg_dash_all_depts"
              searchPlaceholder="Search departments by code, name, HOD, or institute..."
              searchFields={['name', 'code', 'instituteName', 'hodName']}
              exportFilename="University_All_Departments_Roster"
              onRefresh={triggerRefresh}
            />
          </div>
        )
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. UNIVERSITY ADMINISTRATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'UNIVERSITY') && (
        selectedDepartmentForDrilldown ? (
          <DepartmentCompleteManagementView
            department={selectedDepartmentForDrilldown}
            onBack={() => setSelectedDepartmentForDrilldown(null)}
          />
        ) : selectedInstituteForDrilldown ? (
          <InstituteCompleteManagementView
            institute={selectedInstituteForDrilldown}
            onBack={() => setSelectedInstituteForDrilldown(null)}
            onSelectDepartment={(dept) => setSelectedDepartmentForDrilldown(dept)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto">
                {['OVERVIEW', 'INSTITUTES', 'DEPARTMENTS', 'PROGRAMS', 'STRUCTURE', 'DELEGATED_SCOPES'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSubFilter(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      subFilter === tab 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'OVERVIEW' && 'University Overview'}
                    {tab === 'INSTITUTES' && 'Institute Overview'}
                    {tab === 'DEPARTMENTS' && 'Department Overview'}
                    {tab === 'PROGRAMS' && 'Program Overview'}
                    {tab === 'STRUCTURE' && 'Organization Structure'}
                    {tab === 'DELEGATED_SCOPES' && 'Deputy Registrar Scopes'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => exportToExcel(institutes, 'University_Administration_Report')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export Excel (.xlsx)
              </button>
            </div>

            {/* Sub-view: Structure */}
            {subFilter === 'STRUCTURE' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Statutory Organization Structure</h3>
                <p className="text-xs text-slate-500 mb-6">Apex University Governance Hierarchy pursuant to the Swarrnim University Act</p>
                
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-center">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Apex Authority</span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Honorable Chancellor & Board of Governors (BOG)</h4>
                    <p className="text-xs text-slate-500 mt-1">Trustees, State Government Nominees & Eminent Academicians</p>
                  </div>
                  
                  <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-slate-400 rotate-90" /></div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Chief Executive & Academic Officer</span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Provost / Vice-Chancellor</h4>
                    <p className="text-xs text-slate-500 mt-1">Chairperson - Academic Council & Executive Committee</p>
                  </div>

                  <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-slate-400 rotate-90" /></div>

                  <div className="p-4 bg-slate-900 text-white rounded-xl text-center shadow-lg border border-blue-500">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Chief Administrative & Statutory Custodian</span>
                    <h4 className="text-lg font-extrabold text-white">Office of the Registrar</h4>
                    <p className="text-xs text-slate-300 mt-1">Secretary - BOG & Academic Council | Legal & Compliance Apex</p>
                  </div>

                  <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-slate-400 rotate-90" /></div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">12 Deans & Heads of Institutes (HOIs)</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Faculty of Tech, Design, Health, Ayurveda, Pharma, Management</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">Statutory University Cells</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Controller of Exams, Finance Officer, IQAC, Student Welfare</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Delegated Scopes */}
            {subFilter === 'DELEGATED_SCOPES' && (
              <RegistrarDeputyScopeManagementView />
            )}

            {/* Sub-view: DEPARTMENTS (ExcelDataTable) */}
            {subFilter === 'DEPARTMENTS' && (
              <ExcelDataTable
                data={departmentDirectoryData}
                columns={departmentDirectoryColumns}
                title={`All University Departments & Academic Divisions (${departments.length})`}
                subtitle="Complete department roster across all constituent institutes. Click 'Open Management View →' to open full 16-tab dossier."
                storageKey="reg_univ_all_depts"
                searchPlaceholder="Search departments by code, name, or institute..."
                searchFields={['name', 'code', 'instituteName', 'hodName']}
                exportFilename="University_Departments_Directory"
                onRefresh={triggerRefresh}
              />
            )}

            {/* Sub-view: INSTITUTES */}
            {subFilter === 'INSTITUTES' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Constituent Institutes Directory ({institutes.length})
                  </h3>
                  <input
                    type="text"
                    placeholder="Search institutes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {institutes
                    .filter(inst => searchQuery ? (inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || inst.code.toLowerCase().includes(searchQuery.toLowerCase())) : true)
                    .map(inst => {
                      const instStudents = students.filter(s => s.instituteId === inst.id);
                      const instFaculty = faculty.filter(f => f.instituteId === inst.id);
                      const instProgs = programs.filter(p => p.instituteId === inst.id);
                      const instDepts = departments.filter(d => d.instituteId === inst.id);

                      return (
                        <div key={inst.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 transition flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{inst.code}</span>
                              <Badge variant="navy">Constituent Unit</Badge>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{inst.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">Dean: {(inst as any).deanName || 'Dr. Principal / Director'}</p>
                            <div className="flex gap-2 mt-3 text-xs">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{instDepts.length} Depts</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">{instStudents.length} Students</span>
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">{instFaculty.length} Faculty</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedInstituteForDrilldown(inst)}
                            className="mt-4 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition text-center shadow-sm"
                          >
                            VIEW INSTITUTE →
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Sub-view: Overview / Programs */}
            {subFilter !== 'STRUCTURE' && subFilter !== 'DELEGATED_SCOPES' && subFilter !== 'DEPARTMENTS' && subFilter !== 'INSTITUTES' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {subFilter === 'PROGRAMS' ? `Approved Programs (${programs.length})` : `University Overview (${institutes.length} Institutes)`}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search master record..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(subFilter === 'PROGRAMS' ? programs : institutes)
                    .filter((item: any) => searchQuery ? (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.code?.toLowerCase().includes(searchQuery.toLowerCase())) : true)
                    .map((item: any) => (
                      <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 transition">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{item.code}</span>
                          <Badge variant="navy" className="text-[10px]">{item.degreeLevel || item.type || 'ACTIVE'}</Badge>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{item.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{item.description || (item as any).deanName || item.hodName || 'SSIU Constituent Unit'}</p>
                        {item.intakeCapacity && (
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">Sanctioned Intake: {item.intakeCapacity} Seats</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. OFFICIAL CORRESPONDENCE (INWARD / OUTWARD / CIRCULARS) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'CORRESPONDENCE') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'INCOMING', 'OUTGOING', 'CIRCULAR', 'EXTERNAL_GOV'].map(type => (
                <button
                  key={type}
                  onClick={() => setSubFilter(type)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    subFilter === type 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {type === 'ALL' && 'All Correspondence'}
                  {type === 'INCOMING' && 'Incoming Letters'}
                  {type === 'OUTGOING' && 'Outgoing Letters'}
                  {type === 'CIRCULAR' && 'Official Circulars'}
                  {type === 'EXTERNAL_GOV' && 'Govt & Statutory'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCorrModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Log New Letter
              </button>
              <button
                onClick={() => exportToExcel(officialCorrespondence, 'SSIU_Correspondence_Register')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Register (.xlsx)
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Official Correspondence Register</h3>
              <span className="text-xs text-slate-500">{officialCorrespondence.length} Records Found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">From / To Entity</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {officialCorrespondence
                    .filter(c => subFilter === 'ALL' ? true : c.correspondenceType === subFilter)
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{item.referenceNumber}</td>
                        <td className="py-3 px-4">
                          <Badge variant={item.correspondenceType === 'INCOMING' ? 'navy' : item.correspondenceType === 'OUTGOING' ? 'active' : 'warning'}>
                            {item.correspondenceType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.date}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{item.senderOrRecipient}</td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-xs truncate" title={item.subject}>{item.subject}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[11px]">{item.category}</span></td>
                        <td className="py-3 px-4">
                          <Badge variant={item.priority === 'URGENT' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'inactive'}>
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={item.status === 'CLOSED' || item.status === 'ACTION_TAKEN' ? 'success' : 'navy'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.actionTaken || 'Pending Review'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. FILE MOVEMENT & RECORD MANAGEMENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'FILES') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official Physical & Digital File Movement</h3>
              <p className="text-xs text-slate-500">Immutable audit register of official file routing across university secretariats</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFileMovementModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Dispatch File
              </button>
              <button
                onClick={() => exportToExcel(fileMovements, 'SSIU_File_Movement_Register')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Movement Log (.xlsx)
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">File Number</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">From Office</th>
                    <th className="py-3 px-4">To Office</th>
                    <th className="py-3 px-4">Current Custodian</th>
                    <th className="py-3 px-4">Sent Date</th>
                    <th className="py-3 px-4">Action Required</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fileMovements.map(file => (
                    <tr key={file.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{file.fileNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs">{file.subject}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{file.fromOffice}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{file.toOffice}</td>
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">{file.currentHolder}</td>
                      <td className="py-3 px-4 text-slate-500">{file.sentDate.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{file.actionRequired}</td>
                      <td className="py-3 px-4">
                        <Badge variant={file.status === 'ACTIONED' ? 'success' : file.status === 'IN_TRANSIT' ? 'warning' : 'navy'}>
                          {file.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. COMMITTEE MANAGEMENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'COMMITTEES') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">University Statutory & Standing Committees</h3>
              <p className="text-xs text-slate-500">Board of Governors, Academic Council, Grievance & Anti-Ragging Committees</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule Committee Meeting
              </button>
              <button
                onClick={() => exportToExcel(committeeActionItems, 'SSIU_Committee_Action_Items')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Action Items (.xlsx)
              </button>
            </div>
          </div>

          {/* Committees Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {committees.map(cmt => (
              <div key={cmt.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600 text-xs">{cmt.code}</span>
                  <Badge variant="navy">{cmt.type}</Badge>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cmt.name}</h4>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p><span className="font-semibold">Chairperson:</span> {cmt.chairpersonName}</p>
                  <p><span className="font-semibold">Secretary:</span> {cmt.memberSecretary}</p>
                  <p><span className="font-semibold">Tenure:</span> {cmt.tenureYears} Years (Est. {cmt.establishedDate})</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-500 mb-1.5">Committee Members ({cmt.members.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {cmt.members.map(m => (
                      <span key={m.id} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium text-slate-700 dark:text-slate-300">
                        {m.name} ({m.role})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Committee Action Items & Statutory Compliance</h3>
              <span className="text-xs text-slate-500">{committeeActionItems.length} Tracked Actions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Item #</th>
                    <th className="py-3 px-4">Committee</th>
                    <th className="py-3 px-4">Meeting #</th>
                    <th className="py-3 px-4">Action Item Description</th>
                    <th className="py-3 px-4">Responsible Dept & Person</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {committeeActionItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.itemNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{item.committeeName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.meetingNumber}</td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-sm">{item.description}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <p className="font-semibold">{item.responsibleDepartment}</p>
                        <p className="text-[11px] text-slate-500">{item.responsiblePerson}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">{item.deadline}</td>
                      <td className="py-3 px-4">
                        <Badge variant={item.status === 'COMPLETED' ? 'success' : item.status === 'IN_PROGRESS' ? 'warning' : 'danger'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedActionItem(item);
                            setActionItemStatus(item.status);
                            setActionItemRemarks(item.complianceRemarks || '');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 font-medium transition"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. APPROVAL CENTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'APPROVALS') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REQUEST_INFO'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportToExcel(statutoryApprovals, 'Statutory_Approvals_Register')}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Approvals (.xlsx)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Request No</th>
                    <th className="py-3 px-4">Title / Purpose</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Applicant Entity</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actioned By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {statutoryApprovals.map(appr => (
                    <tr key={appr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{appr.requestNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-sm">{appr.title}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold rounded">{appr.category}</span></td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{appr.applicantEntity}</td>
                      <td className="py-3 px-4 text-slate-500">{appr.submittedDate.slice(0, 10)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={appr.status === 'APPROVED' ? 'success' : appr.status === 'PENDING' ? 'warning' : 'danger'}>
                          {appr.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{appr.actionedByName || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedApproval(appr);
                            setApprovalAction(appr.status === 'PENDING' ? 'APPROVED' : appr.status as any);
                            setApprovalRemarks(appr.remarks || '');
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium transition"
                        >
                          Review Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6.5 FACULTY & STAFF MANAGEMENT & ACADEMIC WORKFORCE CONTROL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {((activeTab === 'FACULTY') || ((activeTab as string) === 'FACULTY_STAFF')) && (
        <RegistrarFacultyStaffControlView
          onBackToDashboard={() => setActiveTab('DASHBOARD')}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6.6 REGISTRAR OFFICE ORGANIZATION & STAFF CONTROL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {((activeTab === 'MY_OFFICE') || ((activeTab as string) === 'REGISTRAR_OFFICE')) && (
        <RegistrarOfficeOrganizationView
          onBackToMainDashboard={() => setActiveTab('DASHBOARD')}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. STUDENT ADMINISTRATION & INTERNATIONAL STUDENTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'STUDENTS') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['SEARCH', 'RECORDS', 'DATA_CHANGES', 'INTERNATIONAL', 'STATS'].map(view => (
                <button
                  key={view}
                  onClick={() => setSubFilter(view)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    subFilter === view 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {view === 'SEARCH' && 'Student Search & Profile'}
                  {view === 'RECORDS' && 'Student Records Master'}
                  {view === 'DATA_CHANGES' && 'Data Change Requests & Audits'}
                  {view === 'INTERNATIONAL' && `International Students (${internationalStudents.length})`}
                  {view === 'STATS' && 'Enrollment Statistics'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedInstFilter}
                onChange={e => setSelectedInstFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Institutes</option>
                {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>

              <button
                onClick={() => exportToExcel(subFilter === 'INTERNATIONAL' ? internationalStudents : students, 'SSIU_Student_Registry')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Sub-view: Student Data Change Requests & Audits */}
          {subFilter === 'DATA_CHANGES' && (
            <StudentDataChangeTab isQueueMode={false} />
          )}

          {/* Sub-view: International Students */}
          {subFilter === 'INTERNATIONAL' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">International Student Visa & FRRO Regulatory Register</h3>
                <p className="text-xs text-slate-500">Foreign national students, Embassy NOC, Visa tracking, and FRRO clearance records</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Enrollment No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Country of Origin</th>
                      <th className="py-3 px-4">Passport #</th>
                      <th className="py-3 px-4">Visa #</th>
                      <th className="py-3 px-4">Visa Expiry</th>
                      <th className="py-3 px-4">FRRO Reg #</th>
                      <th className="py-3 px-4">FRRO Status</th>
                      <th className="py-3 px-4">Embassy NOC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {internationalStudents.map(intl => (
                      <tr key={intl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{intl.enrollmentNo}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{intl.studentName}</td>
                        <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            {intl.country}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{intl.passportNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{intl.visaNumber}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">{intl.visaExpiryDate}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{intl.frroRegistrationNo}</td>
                        <td className="py-3 px-4">
                          <Badge variant={intl.frroStatus === 'VALID' ? 'success' : 'warning'}>{intl.frroStatus}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={intl.embassyNocStatus === 'RECEIVED' ? 'success' : 'danger'}>{intl.embassyNocStatus}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: Standard Student Search & Profiles */}
          {subFilter !== 'INTERNATIONAL' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Search student by Name, Enrollment No, Program..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <span className="text-xs text-slate-500 font-medium">{students.length} Total Enrolled</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Enrollment No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Institute</th>
                      <th className="py-3 px-4">Program</th>
                      <th className="py-3 px-4 text-center">Semester</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students
                      .filter(s => selectedInstFilter === 'ALL' || s.instituteId === selectedInstFilter)
                      .filter(s => searchQuery ? (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase())) : true)
                      .slice(0, 50)
                      .map(stu => {
                        const inst = institutes.find(i => i.id === stu.instituteId);
                        const prog = programs.find(p => p.id === stu.programId);
                        return (
                          <tr key={stu.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">{stu.enrollmentNo}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{stu.name}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{inst?.name || 'SIT'}</td>
                            <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{prog?.name || 'B.Tech CSE'}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">Sem {stu.semesterId?.replace(/\D/g, '') || '1'}</td>
                            <td className="py-3 px-4"><Badge variant="success">ACTIVE</Badge></td>
                            <td className="py-3 px-4 text-right">
                              <StudentRowActionMenu 
                                student={stu}
                                onViewProfile={() => setSelectedStudentForProfile(stu)}
                                onViewAcademic={() => setSelectedStudentForProfile(stu)}
                                onViewAttendance={() => setSelectedStudentForProfile(stu)}
                                onViewDocuments={() => setSelectedStudentForProfile(stu)}
                                onViewExamination={() => setSelectedStudentForProfile(stu)}
                                onViewRequests={() => setSelectedStudentForProfile(stu)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. NOTESHEETS WORKFLOW INTEGRATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'NOTESHEETS') && (
        <NoteSheetPage initialTab="DASHBOARD" />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. EXCEL CENTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'EXCEL_CENTER') && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Central Excel Master Templates & Export Center</h3>
            <p className="text-xs text-slate-500 mb-6">Standardized .xlsx templates for university-level imports and exports (NO CSV allowed)</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg w-fit"><Building2 className="w-5 h-5" /></div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Constituent Institute Master</h4>
                <p className="text-xs text-slate-500">Master template with Institute codes, HOI details and sanctioned capacities.</p>
                <button
                  onClick={() => exportToExcel(institutes, 'Institute_Master_Template')}
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Download .xlsx Template
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg w-fit"><Mail className="w-5 h-5" /></div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Official Correspondence Log</h4>
                <p className="text-xs text-slate-500">Inward/Outward letter registry with reference numbers and dispatch dates.</p>
                <button
                  onClick={() => exportToExcel(officialCorrespondence, 'Official_Correspondence_Template')}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Download .xlsx Template
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg w-fit"><Globe className="w-5 h-5" /></div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">International Student Registry</h4>
                <p className="text-xs text-slate-500">Foreign national visa, passport, and FRRO registration compliance format.</p>
                <button
                  onClick={() => exportToExcel(internationalStudents, 'International_Students_Template')}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" /> Download .xlsx Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. AUDIT & ACTIVITY LOG (IMMUTABLE) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'AUDIT_LOGS') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Read-Only Immutable University Audit Log</h3>
              <p className="text-xs text-slate-500">Chronological history of all approvals, correspondence, notices, and governance actions</p>
            </div>
            <button
              onClick={() => exportToExcel(auditLogs, 'SSIU_Registrar_Audit_Trail')}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Audit Trail (.xlsx)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.slice(0, 50).map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{log.userName}</td>
                      <td className="py-3 px-4"><Badge variant="navy">{log.userRole}</Badge></td>
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{log.module || log.entity}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{log.action}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 max-w-sm truncate" title={log.details}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: EXAMINATION GOVERNANCE CENTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'EXAMINATION' && (
        <RegistrarExamGovernanceView />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: ACADEMIC REQUESTS GOVERNANCE CENTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REQUESTS' && (
        <RegistrarAcademicRequestsGovernanceView />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: ACADEMIC ADMINISTRATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ACADEMICS' && (
        <RegistrarAcademicAdministrationView />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: ATTENDANCE GOVERNANCE CENTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ATTENDANCE' && (
        <RegistrarAttendanceGovernanceView />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: ACADEMIC REPORTS & ANALYTICS GOVERNANCE CENTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <RegistrarAcademicReportsView />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* OTHER TABS FALLBACK HANDLER (INVENTORY, NOTICES, ETC.) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!['DASHBOARD', 'UNIVERSITY', 'CORRESPONDENCE', 'FILES', 'COMMITTEES', 'APPROVALS', 'STUDENTS', 'NOTESHEETS', 'EXCEL_CENTER', 'AUDIT_LOGS', 'EXAMINATION', 'REQUESTS', 'REPORTS', 'ACADEMICS', 'ATTENDANCE'].includes(activeTab) && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto">
            <Landmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase">{activeTab.replace('_', ' ')} Governance Center</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Centralized oversight view for {activeTab.toLowerCase().replace('_', ' ')} across all 12 SSIU constituent institutions.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Return to Registrar Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: STATUTORY APPROVAL ACTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedApproval && (
        <Modal
          isOpen={Boolean(selectedApproval)}
          onClose={() => setSelectedApproval(null)}
          title={`Review Statutory Approval: ${selectedApproval.requestNo}`}
        >
          <form onSubmit={handleActionStatutoryApproval} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5">
              <p><span className="font-semibold text-slate-500">Title:</span> <span className="font-bold text-slate-900 dark:text-white">{selectedApproval.title}</span></p>
              <p><span className="font-semibold text-slate-500">Applicant:</span> {selectedApproval.applicantEntity}</p>
              <p><span className="font-semibold text-slate-500">Category:</span> {selectedApproval.category}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Approval Decision</label>
              <select
                value={approvalAction}
                onChange={e => setApprovalAction(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="APPROVED">APPROVE REQUEST</option>
                <option value="REJECTED">REJECT REQUEST</option>
                <option value="REQUEST_INFO">RETURN FOR CLARIFICATION</option>
                <option value="FORWARDED">FORWARD TO PROVOST / BOG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registrar Endorsement Remarks</label>
              <textarea
                required
                rows={3}
                value={approvalRemarks}
                onChange={e => setApprovalRemarks(e.target.value)}
                placeholder="Enter statutory grounds and regulatory compliance remarks..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Submit Decision
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE CORRESPONDENCE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isCorrModalOpen && (
        <Modal
          isOpen={isCorrModalOpen}
          onClose={() => setIsCorrModalOpen(false)}
          title="Log Official University Correspondence"
        >
          <form onSubmit={handleCreateCorrespondence} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correspondence Type</label>
                <select
                  value={corrType}
                  onChange={e => setCorrType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="INCOMING">Incoming Letter</option>
                  <option value="OUTGOING">Outgoing Letter</option>
                  <option value="CIRCULAR">Official Circular</option>
                  <option value="EXTERNAL_GOV">Govt / UGC / AICTE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Reference Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSIU/REG/2026/045"
                  value={corrRefNo}
                  onChange={e => setCorrRefNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Sender / Recipient Entity</label>
              <input
                type="text"
                required
                placeholder="e.g. Education Dept, Govt of Gujarat"
                value={corrSenderRecipient}
                onChange={e => setCorrSenderRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="Subject of official letter"
                value={corrSubject}
                onChange={e => setCorrSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={corrCategory}
                  onChange={e => setCorrCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="UGC">UGC New Delhi</option>
                  <option value="AICTE">AICTE Western Region</option>
                  <option value="GOV_GUJARAT">Government of Gujarat</option>
                  <option value="AFFILIATION">Affiliation & Sanctions</option>
                  <option value="ACADEMIC">Academic Governance</option>
                  <option value="GENERAL">General Administrative</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Priority</label>
                <select
                  value={corrPriority}
                  onChange={e => setCorrPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Statutory</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Action Taken / Forwarding Notes</label>
              <textarea
                rows={2}
                value={corrActionTaken}
                onChange={e => setCorrActionTaken(e.target.value)}
                placeholder="Details of action taken or department forwarding..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCorrModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Save to Register
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: FILE MOVEMENT DISPATCH */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isFileMovementModalOpen && (
        <Modal
          isOpen={isFileMovementModalOpen}
          onClose={() => setIsFileMovementModalOpen(false)}
          title="Dispatch Official File (Movement Log)"
        >
          <form onSubmit={handleCreateFileMovement} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">File Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSIU/REG/FILE/2026/030"
                  value={fileNumber}
                  onChange={e => setFileNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">To Office / Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Examination Cell (CoE)"
                  value={fileToOffice}
                  onChange={e => setFileToOffice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">File Subject</label>
              <input
                type="text"
                required
                placeholder="Official matter subject"
                value={fileSubject}
                onChange={e => setFileSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Action Required by Recipient</label>
              <textarea
                rows={2}
                value={fileActionRequired}
                onChange={e => setFileActionRequired(e.target.value)}
                placeholder="Action required (e.g. Verification of transcripts, financial scrutiny)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFileMovementModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Log File Movement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN DEPUTY REGISTRAR JURISDICTIONAL SCOPE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isScopeModalOpen && (
        <Modal
          isOpen={isScopeModalOpen}
          onClose={() => setIsScopeModalOpen(false)}
          title="Delegate Jurisdictional Scope to Deputy Registrar"
        >
          <form onSubmit={handleAssignScope} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Deputy Registrar <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={scopeTargetUserId}
                onChange={e => setScopeTargetUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="">-- Choose Deputy Registrar --</option>
                {allDeputyRegistrars.map(dr => (
                  <option key={dr.id} value={dr.id}>
                    {dr.name} ({dr.email || dr.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Constituent Institute <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={scopeTargetInstId}
                onChange={e => {
                  setScopeTargetInstId(e.target.value);
                  setScopeSelectedDeptIds([]);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="">-- Choose Institute --</option>
                {allInstitutes.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            {scopeTargetInstId && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Departments (Select multiple)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Select one or more departments to delegate. If none selected, full institute oversight is granted.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {allDepartments
                    .filter(d => d.instituteId === scopeTargetInstId)
                    .map(dept => {
                      const isChecked = scopeSelectedDeptIds.includes(dept.id);
                      return (
                        <label
                          key={dept.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setScopeSelectedDeptIds(scopeSelectedDeptIds.filter(id => id !== dept.id));
                              } else {
                                setScopeSelectedDeptIds([...scopeSelectedDeptIds, dept.id]);
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.name}</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">({dept.code})</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsScopeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Confirm Scope Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: COMMITTEE ACTION ITEM UPDATE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedActionItem && (
        <Modal
          isOpen={Boolean(selectedActionItem)}
          onClose={() => setSelectedActionItem(null)}
          title={`Update Action Item: ${selectedActionItem.itemNumber}`}
        >
          <form onSubmit={handleUpdateActionItem} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
              <p><span className="font-semibold text-slate-500">Committee:</span> <span className="font-bold text-slate-900 dark:text-white">{selectedActionItem.committeeName}</span></p>
              <p><span className="font-semibold text-slate-500">Description:</span> {selectedActionItem.description}</p>
              <p><span className="font-semibold text-slate-500">Deadline:</span> {selectedActionItem.deadline}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Action Status</label>
              <select
                value={actionItemStatus}
                onChange={e => setActionItemStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Compliance & Resolution Remarks</label>
              <textarea
                rows={3}
                value={actionItemRemarks}
                onChange={e => setActionItemRemarks(e.target.value)}
                placeholder="Enter compliance details or resolution order..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedActionItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Update Compliance
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: NOTESHEET REGISTRAR CONCURRENCE & APPROVAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedNotesheet && (
        <Modal
          isOpen={Boolean(selectedNotesheet)}
          onClose={() => setSelectedNotesheet(null)}
          title={`Notesheet Concurrence: ${selectedNotesheet.noteSheetNumber || selectedNotesheet.id}`}
        >
          <form onSubmit={handleActionNotesheet} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedNotesheet.noteSheetNumber || selectedNotesheet.id}</span>
                <Badge variant={selectedNotesheet.status === 'APPROVED' ? 'success' : selectedNotesheet.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {selectedNotesheet.status}
                </Badge>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Subject:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedNotesheet.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <p><span className="font-semibold">Initiator:</span> {selectedNotesheet.creatorName || (selectedNotesheet as any).authorName}</p>
                <p><span className="font-semibold">Institute/Branch:</span> {selectedNotesheet.instituteName || selectedNotesheet.branch || 'ACADEMIC'}</p>
                <p><span className="font-semibold">Financial Requirement:</span> {selectedNotesheet.budgetRequired ? `₹${(selectedNotesheet.estimatedCost || 0).toLocaleString('en-IN')}` : 'Non-Financial'}</p>
                <p><span className="font-semibold">Date:</span> {selectedNotesheet.date || (selectedNotesheet as any).createdAt?.slice(0, 10)}</p>
              </div>
              {selectedNotesheet.proposal && (
                <div>
                  <p className="font-semibold text-slate-500">Proposal & Justification:</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                    {selectedNotesheet.proposal}
                  </p>
                </div>
              )}
            </div>

            {/* Action Decision Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registrar Decision</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'APPROVE', label: 'Approve', color: 'bg-emerald-600 text-white' },
                  { value: 'FORWARD', label: 'Forward to Finance', color: 'bg-indigo-600 text-white' },
                  { value: 'RETURN', label: 'Return to Creator', color: 'bg-amber-600 text-white' },
                  { value: 'REJECT', label: 'Reject', color: 'bg-rose-600 text-white' },
                  { value: 'CLARIFICATION', label: 'Ask Clarification', color: 'bg-cyan-600 text-white' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNotesheetAction(opt.value as any)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition text-center ${
                      notesheetAction === opt.value
                        ? opt.color + ' shadow-sm ring-2 ring-offset-1 ring-blue-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks & Official Endorsement <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={notesheetRemarks}
                onChange={e => setNotesheetRemarks(e.target.value)}
                placeholder="Enter official endorsement, finance reference, or clarification query..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedNotesheet(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Confirm {notesheetAction}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: STUDENT PROFILE DOSSIER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={Boolean(selectedStudentForProfile)}
          onClose={() => setSelectedStudentForProfile(null)}
          student={selectedStudentForProfile}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: FACULTY STAFF DOSSIER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedFacultyForProfile && (
        <StaffProfileDossierModal
          isOpen={Boolean(selectedFacultyForProfile)}
          faculty={selectedFacultyForProfile}
          onClose={() => setSelectedFacultyForProfile(null)}
        />
      )}
    </div>
  );
};
