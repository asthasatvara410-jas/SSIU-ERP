import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { mentorBackendService } from '../../services/mentorBackendService';
import { attendanceApprovalService } from '../../services/attendanceApprovalService';
import { documentMasterService } from '../../services/documentMasterService';
import { MentorAssignmentTab } from '../../components/mentor/MentorAssignmentTab';
import { MenteeAttendanceManager } from '../../components/mentor/MenteeAttendanceManager';
import { MenteeExamEligibilityManager } from '../../components/mentor/MenteeExamEligibilityManager';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { StudentProfileModal } from '../../components/profile/StudentProfileModal';
import { StudentDocumentsSection } from '../../components/profile/StudentDocumentsSection';
import { StudentDocumentsVerificationGrid } from '../../components/mentor/StudentDocumentsVerificationGrid';
import { StudentRowActionMenu } from '../../components/common/StudentRowActionMenu';
import { 
  UserCheck, Calendar, Clock, MessageSquare, Plus, CheckCircle, 
  User, Users, AlertCircle, FileText, CheckCircle2, Search,
  Mail, Phone, Award, BookOpen, ChevronRight, Eye, ShieldCheck, CheckSquare,
  FolderCheck, Lock, XCircle, Download, Check, AlertTriangle, FileSpreadsheet,
  HelpCircle, Sparkles, Filter, RefreshCw, CheckCheck, ListFilter, Upload,
  Printer, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { AttendanceApplication, Student, Subject, Assignment } from '../../types';
import { StudentAcademicDocumentItem } from '../../types/documentMaster';
import { MentoringSessionRecord } from '../../types/mentorAssignment';
import { studentProfileAccessService } from '../../services/studentProfileAccessService';
import { studentDataChangeRequestService } from '../../services/studentDataChangeRequestService';
import { studentEnrollmentMappingService } from '../../services/studentEnrollmentMappingService';
import { BulkStudentMappingModal } from '../../components/students/BulkStudentMappingModal';
import { StudentMappingHistoryModal } from '../../components/students/StudentMappingHistoryModal';
import { StudentDataChangeTab } from '../../components/profile/StudentDataChangeTab';
import * as XLSX from 'xlsx';

export type MentorTabType = 
  | 'MY_STUDENTS' 
  | 'STUDENT_PROFILE'
  | 'ACADEMIC_OVERVIEW' 
  | 'STUDENT_ACADEMICS'
  | 'STUDENT_SUBJECTS'
  | 'TIMETABLE'
  | 'ASSIGNMENTS'
  | 'ACADEMIC_PERFORMANCE'
  | 'ATTENDANCE'
  | 'ATTENDANCE_SHORTAGE'
  | 'ATTENDANCE_APPROVALS'
  | 'EXAM_ELIGIBILITY'
  | 'EXAM_REQUESTS'
  | 'STUDENT_DOCUMENTS' 
  | 'PENDING_VERIFICATION' 
  | 'VERIFIED_DOCUMENTS'
  | 'DOCUMENT_HISTORY'
  | 'STUDENT_REQUESTS'
  | 'DATA_CHANGE_REQUESTS'
  | 'REQUESTS' 
  | 'SESSIONS' 
  | 'MENTORING_SESSIONS' 
  | 'ALLOCATION'
  | 'MENTEE_ALLOCATION';

export interface MentorPageProps {
  initialTab?: MentorTabType;
}

export const MentorPage: React.FC<MentorPageProps> = ({ initialTab = 'MY_STUDENTS' }) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<MentorTabType>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Mentoring session booking modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState('');
  const [topic, setTopic] = useState('');
  const [discussion, setDiscussion] = useState('');
  const [discussionPoints, setDiscussionPoints] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('02:00 PM - 02:30 PM');
  const [academicConcern, setAcademicConcern] = useState('');
  const [attendanceConcern, setAttendanceConcern] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sessionType, setSessionType] = useState<'ONE_ON_ONE' | 'GROUP' | 'PARENT_MEETING' | 'ACADEMIC_REVIEW' | 'CRISIS_COUNSELING'>('ONE_ON_ONE');
  const [category, setCategory] = useState<'ACADEMIC' | 'CAREER' | 'PERSONAL' | 'ATTENDANCE' | 'BEHAVIORAL' | 'FEE_RELATED' | 'EXAM_STRESS' | 'GENERAL'>('ACADEMIC');
  const [urgencyLevel, setUrgencyLevel] = useState<'ROUTINE' | 'MODERATE' | 'CRITICAL'>('ROUTINE');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpAction, setFollowUpAction] = useState('');

  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentForDocs, setSelectedStudentForDocs] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hierarchical Filter States
  const [filterInstituteId, setFilterInstituteId] = useState<string>('ALL');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('ALL');
  const [filterProgramId, setFilterProgramId] = useState<string>('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('ALL');
  const [filterSemesterId, setFilterSemesterId] = useState<string>('ALL');
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  const [filterBatch, setFilterBatch] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [standingFilter, setStandingFilter] = useState<'ALL' | 'GOOD_STANDING' | 'ATTENDANCE_SHORTAGE' | 'ACADEMIC_RISK'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sorting & Pagination States
  const [sortField, setSortField] = useState<string>('srNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Bulk Mapping Modal States
  const [showBulkMapModal, setShowBulkMapModal] = useState(false);
  const [bulkMapInitialStep, setBulkMapInitialStep] = useState<1 | 2>(1);
  const [showMappingHistoryModal, setShowMappingHistoryModal] = useState(false);
  const canBulkMap = studentEnrollmentMappingService.canUserPerformBulkMapping(user, role);

  // Document Verification Action Modal
  const [rejectingDoc, setRejectingDoc] = useState<StudentAcademicDocumentItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Attendance Review Modal state
  const [reviewApp, setReviewApp] = useState<AttendanceApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO'>('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Determine active mentor if user is student
  const studentActiveMentor = useMemo(() => {
    if (role === 'STUDENT') {
      return mentorAssignmentService.getActiveMentorForStudent(user?.id || 'stu-1');
    }
    return null;
  }, [role, user]);

  // 2. Fetch authorized students strictly scoped to current user & active role
  const authorizedStudents = useMemo(() => {
    if (!user || !role) return [];
    const allStudents = db.getStudents();
    if (role === 'STUDENT') {
      return allStudents.filter(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo);
    }
    return allStudents.filter(s => studentProfileAccessService.isUserAuthorizedForStudent(user, role, s));
  }, [user, role, refreshKey]);

  const myMentees = authorizedStudents;

  // 3. Fetch real mentoring sessions from database
  const sessions = useMemo(() => {
    if (!user) return [];
    const allSessions = db.getMentoringSessions();
    if (role === 'STUDENT') {
      return allSessions.filter(s => s.studentId === user.id || s.studentEnrollmentNo === user.enrollmentNo);
    }
    return allSessions.filter(s => s.mentorId === user.id || role === 'SUPER_ADMIN');
  }, [user, role, refreshKey]);

  const pendingFollowUps = useMemo(() => {
    return sessions.filter(s => s.followUpRequired && s.followUpStatus !== 'COMPLETED');
  }, [sessions]);

  // 4. Fetch student requests routed to this user
  const myMentorRequests = useMemo(() => {
    const allRequests = db.getState().studentRequests || [];
    if (role === 'FACULTY' || role === 'MENTOR') {
      const myFac = db.getFaculty().find(f => f.id === user?.id || f.email === user?.email);
      const facId = myFac?.id || user?.id;
      return allRequests.filter(r => r.currentHandlerId === facId || r.mentorId === facId);
    }
    return allRequests;
  }, [role, user, refreshKey]);

  // 5. Fetch documents for authorized students
  const menteeDocuments = useMemo(() => {
    const allDocs = db.getStudentAcademicDocuments();
    const authorizedIds = new Set(authorizedStudents.map(m => m.id));
    return allDocs.filter(d => authorizedIds.has(d.studentId) || role === 'SUPER_ADMIN');
  }, [authorizedStudents, role, refreshKey]);

  const pendingMenteesDocs = useMemo(() => {
    return menteeDocuments.filter(d => d.status === 'PENDING_VERIFICATION' || !d.isLocked);
  }, [menteeDocuments]);

  const verifiedMenteesDocs = useMemo(() => {
    return menteeDocuments.filter(d => d.status === 'VERIFIED' && d.isLocked);
  }, [menteeDocuments]);

  // Cascading Academic Filter Collections
  const availableInstitutes = useMemo(() => db.getInstitutes(), []);
  
  const availableDepartments = useMemo(() => {
    const all = db.getDepartments();
    if (filterInstituteId === 'ALL') return all;
    return all.filter(d => d.instituteId === filterInstituteId);
  }, [filterInstituteId]);

  const availablePrograms = useMemo(() => {
    let progs = db.getPrograms();
    if (filterDepartmentId !== 'ALL') {
      progs = progs.filter(p => p.departmentId === filterDepartmentId);
    } else if (filterInstituteId !== 'ALL') {
      progs = progs.filter(p => p.instituteId === filterInstituteId);
    }
    return progs;
  }, [filterDepartmentId, filterInstituteId]);

  const availableSemesters = useMemo(() => {
    let sems = db.getSemesters();
    if (filterProgramId !== 'ALL') {
      sems = sems.filter(s => s.programId === filterProgramId);
    }
    return sems;
  }, [filterProgramId]);

  const availableDivisions = useMemo(() => {
    let divs = db.getDivisions();
    if (filterSemesterId !== 'ALL') {
      divs = divs.filter(d => d.semesterId === filterSemesterId);
    }
    return divs;
  }, [filterSemesterId]);

  const availableBatches = useMemo(() => db.getBatches(), []);

  // Dynamic KPIs for "My Students" Top Summary
  const kpiMetrics = useMemo(() => {
    const totalAssigned = authorizedStudents.length;
    const activeAssigned = authorizedStudents.filter(s => s.status === 'ACTIVE').length;
    
    // Dynamic Program Breakdown
    const progMap: Record<string, number> = {};
    authorizedStudents.forEach(s => {
      const prog = db.getProgramById(s.programId)?.code || s.programId || 'General';
      progMap[prog] = (progMap[prog] || 0) + 1;
    });

    // Dynamic Semester Breakdown
    const semMap: Record<string, number> = {};
    authorizedStudents.forEach(s => {
      const sem = db.getSemesterById(s.semesterId)?.number;
      const key = sem ? `Semester ${sem}` : 'Other';
      semMap[key] = (semMap[key] || 0) + 1;
    });

    // Dynamic Division Breakdown
    const divMap: Record<string, number> = {};
    authorizedStudents.forEach(s => {
      const divObj = db.getDivisions().find(d => d.id === s.divisionId);
      const divName = divObj?.name ? (divObj.name.startsWith('Division ') ? divObj.name : `Division ${divObj.name}`) : `Div ${s.divisionId || 'A'}`;
      divMap[divName] = (divMap[divName] || 0) + 1;
    });

    return {
      totalAssigned,
      activeAssigned,
      programBreakdown: Object.entries(progMap).sort((a, b) => b[1] - a[1]),
      semesterBreakdown: Object.entries(semMap).sort((a, b) => a[0].localeCompare(b[0])),
      divisionBreakdown: Object.entries(divMap).sort((a, b) => a[0].localeCompare(b[0]))
    };
  }, [authorizedStudents]);

  // 6. Filter authorized students by text search and dropdown criteria
  const filteredStudents = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const programs = db.getPrograms();
    const departments = db.getDepartments();
    const institutes = db.getInstitutes();
    const semesters = db.getSemesters();
    const divisions = db.getDivisions();

    return authorizedStudents.filter(student => {
      // Query text search matching Name, Enrollment No, University ID, Email, Mobile
      if (cleanQuery) {
        const nameMatch = student.name?.toLowerCase().includes(cleanQuery);
        const enrollMatch = student.enrollmentNo?.toLowerCase().includes(cleanQuery);
        const univMatch = (student.universityId || student.id)?.toLowerCase().includes(cleanQuery);
        const emailMatch = student.email?.toLowerCase().includes(cleanQuery);
        const phoneMatch = (student.phone || student.mobile)?.includes(cleanQuery);
        const prog = programs.find(p => p.id === student.programId);
        const progMatch = prog?.name?.toLowerCase().includes(cleanQuery) || prog?.code?.toLowerCase().includes(cleanQuery);
        const dept = departments.find(d => d.id === student.departmentId);
        const deptMatch = dept?.name?.toLowerCase().includes(cleanQuery) || dept?.code?.toLowerCase().includes(cleanQuery);
        const inst = institutes.find(i => i.id === student.instituteId);
        const instMatch = inst?.name?.toLowerCase().includes(cleanQuery) || inst?.code?.toLowerCase().includes(cleanQuery);
        const sem = semesters.find(s => s.id === student.semesterId);
        const semMatch = sem ? `sem ${sem.number}`.includes(cleanQuery) || `${sem.number}` === cleanQuery : false;

        if (!nameMatch && !enrollMatch && !univMatch && !emailMatch && !phoneMatch && !progMatch && !deptMatch && !instMatch && !semMatch) {
          return false;
        }
      }

      // Dropdown filters
      if (filterInstituteId !== 'ALL' && student.instituteId !== filterInstituteId) {
        return false;
      }
      if (filterDepartmentId !== 'ALL' && student.departmentId !== filterDepartmentId) {
        return false;
      }
      if (filterProgramId !== 'ALL' && student.programId !== filterProgramId) {
        return false;
      }
      if (filterAcademicYear !== 'ALL' && student.academicYear !== filterAcademicYear && student.academicYearId !== filterAcademicYear) {
        return false;
      }
      if (filterSemesterId !== 'ALL' && student.semesterId !== filterSemesterId) {
        return false;
      }
      if (filterDivision !== 'ALL') {
        const divObj = divisions.find(d => d.id === student.divisionId);
        const divName = divObj?.name || student.divisionId || '';
        const matchDiv = divName.toLowerCase().includes(filterDivision.toLowerCase());
        if (!matchDiv) return false;
      }
      if (filterBatch !== 'ALL' && student.batchId !== filterBatch) {
        return false;
      }
      if (statusFilter !== 'ALL' && student.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [authorizedStudents, searchQuery, filterInstituteId, filterDepartmentId, filterProgramId, filterAcademicYear, filterSemesterId, filterDivision, filterBatch, statusFilter]);

  // 7. Attendance Shortage Calculation & Academic Risk Tracker
  const menteeAttendanceData = useMemo(() => {
    return filteredStudents.map(student => {
      const stats = db.getStudentAttendanceStats(student.id);
      const studentDocs = menteeDocuments.filter(d => d.studentId === student.id);
      const verifiedDocsCount = studentDocs.filter(d => d.status === 'VERIFIED').length;
      const pendingDocsCount = studentDocs.filter(d => d.status !== 'VERIFIED').length;
      const studentReqs = myMentorRequests.filter(r => r.studentId === student.id);
      const hasShortage = stats.percentage < 75;
      const hasMissingDocs = pendingDocsCount > 0;
      const hasPendingReqs = studentReqs.some(r => r.status === 'SUBMITTED' || r.status === 'WORK_IN_PROGRESS');
      const isRisk = hasShortage || hasMissingDocs;

      return {
        student,
        stats,
        docsCount: studentDocs.length,
        verifiedDocsCount,
        pendingDocsCount,
        reqsCount: studentReqs.length,
        hasShortage,
        hasMissingDocs,
        hasPendingReqs,
        isRisk
      };
    });
  }, [filteredStudents, menteeDocuments, myMentorRequests]);

  const shortageStudents = useMemo(() => {
    return menteeAttendanceData.filter(m => m.hasShortage);
  }, [menteeAttendanceData]);

  const riskStudents = useMemo(() => {
    return menteeAttendanceData.filter(m => m.isRisk);
  }, [menteeAttendanceData]);

  // Filtered mentees by quick status & standing filter
  const filteredMenteeData = useMemo(() => {
    let result = menteeAttendanceData;
    if (standingFilter === 'GOOD_STANDING') {
      result = result.filter(m => !m.hasShortage && !m.isRisk);
    } else if (standingFilter === 'ATTENDANCE_SHORTAGE') {
      result = result.filter(m => m.hasShortage);
    } else if (standingFilter === 'ACADEMIC_RISK') {
      result = result.filter(m => m.isRisk);
    }
    return result;
  }, [menteeAttendanceData, standingFilter]);

  // Sorted & Paginated Data
  const sortedMenteeData = useMemo(() => {
    const data = [...filteredMenteeData];
    data.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'name':
          valA = (a.student.name || '').toLowerCase();
          valB = (b.student.name || '').toLowerCase();
          break;
        case 'enrollmentNo':
          valA = (a.student.enrollmentNo || '').toLowerCase();
          valB = (b.student.enrollmentNo || '').toLowerCase();
          break;
        case 'universityId':
          valA = (a.student.universityId || a.student.id || '').toLowerCase();
          valB = (b.student.universityId || b.student.id || '').toLowerCase();
          break;
        case 'program':
          valA = (db.getProgramById(a.student.programId)?.code || '').toLowerCase();
          valB = (db.getProgramById(b.student.programId)?.code || '').toLowerCase();
          break;
        case 'department':
          valA = (db.getDepartments().find(d => d.id === a.student.departmentId)?.code || '').toLowerCase();
          valB = (db.getDepartments().find(d => d.id === b.student.departmentId)?.code || '').toLowerCase();
          break;
        case 'semester':
          valA = db.getSemesterById(a.student.semesterId)?.number || 0;
          valB = db.getSemesterById(b.student.semesterId)?.number || 0;
          break;
        case 'division':
          valA = (a.student.divisionId || '').toLowerCase();
          valB = (b.student.divisionId || '').toLowerCase();
          break;
        case 'status':
          valA = a.student.status || '';
          valB = b.student.status || '';
          break;
        case 'standing':
          valA = a.isRisk ? 'RISK' : 'GOOD';
          valB = b.isRisk ? 'RISK' : 'GOOD';
          break;
        case 'attendance':
          valA = a.stats.percentage;
          valB = b.stats.percentage;
          break;
        default:
          valA = a.student.enrollmentNo || '';
          valB = b.student.enrollmentNo || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredMenteeData, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedMenteeData.length / pageSize));
  const paginatedMenteeData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedMenteeData.slice(start, start + pageSize);
  }, [sortedMenteeData, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const pendingRequestsCount = myMentorRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'WORK_IN_PROGRESS' || r.status === 'WITH_MENTOR').length;
  const pendingDataChangeCount = studentDataChangeRequestService.getScopedRequests(user, role, { status: 'MENTOR_PENDING' }).length;

  const handleExportExcel = () => {
    const exportData = filteredMenteeData.map(({ student, stats, hasShortage, verifiedDocsCount, pendingDocsCount }) => {
      const inst = db.getInstitutes().find(i => i.id === student.instituteId);
      const dept = db.getDepartments().find(d => d.id === student.departmentId);
      const prog = db.getPrograms().find(p => p.id === student.programId);
      const sem = db.getSemesters().find(s => s.id === student.semesterId);

      return {
        'Student Name': student.name,
        'Enrollment Number': student.enrollmentNo,
        'Email': student.email,
        'Institute': inst?.name || student.instituteId,
        'Department': dept?.name || student.departmentId || '-',
        'Program': prog?.name || student.programId,
        'Semester': sem ? `Semester ${sem.number}` : '-',
        'Attendance %': `${stats.percentage}%`,
        'Academic Status': !hasShortage ? 'IN GOOD STANDING' : 'ATTENDANCE SHORTAGE',
        'Document Status': `${verifiedDocsCount} Verified, ${pendingDocsCount} Pending`,
        'Status': student.status
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Students');
    XLSX.writeFile(wb, `My_Students_${user?.username || 'export'}.xlsx`);
  };

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !user) return;

    try {
      const targetStudentId = role === 'STUDENT' ? user.id : (selectedMenteeId || myMentees[0]?.id);
      if (!targetStudentId) {
        alert('Please select an assigned student mentee.');
        return;
      }

      mentorBackendService.createMentoringSession(user, {
        studentId: targetStudentId,
        date: date || new Date().toISOString().split('T')[0],
        timeSlot,
        topic,
        discussion: discussion || topic,
        academicConcern,
        attendanceConcern,
        actionTaken: actionTaken || 'Guidance provided and logged in student profile.',
        remarks,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        followUpAction: followUpRequired ? followUpAction : undefined,
        status: 'COMPLETED'
      });

      setShowModal(false);
      setSelectedMenteeId('');
      setTopic('');
      setDiscussion('');
      setDate('');
      setAcademicConcern('');
      setAttendanceConcern('');
      setActionTaken('');
      setRemarks('');
      setFollowUpRequired(false);
      setFollowUpDate('');
      setFollowUpAction('');
      setRefreshKey(k => k + 1);
      showToast('Mentoring record saved and linked to student profile successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to save mentoring session.');
    }
  };

  const handleFollowUpStatusChange = (sessionId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!user) return;
    try {
      mentorBackendService.updateFollowUpStatus(user, sessionId, newStatus);
      setRefreshKey(k => k + 1);
      showToast(`Follow-up status updated to ${newStatus}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up status.');
    }
  };

  const handleVerifyDocument = (doc: StudentAcademicDocumentItem) => {
    try {
      documentMasterService.verifyDocument({
        documentId: doc.id,
        verifierUserId: user?.id || 'fac-1',
        verifierName: user?.name || 'Faculty Mentor',
        verifierRole: 'FACULTY_MENTOR',
        remarks: `Verified and approved by Mentor ${user?.name || 'Faculty'}`
      });
      setRefreshKey(k => k + 1);
      showToast(`Document "${doc.documentName}" for ${doc.studentName} has been VERIFIED & LOCKED.`);
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
    }
  };

  const handleRejectDocumentConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDoc || !rejectionReason.trim()) return;

    try {
      documentMasterService.rejectDocument({
        documentId: rejectingDoc.id,
        verifierUserId: user?.id || 'fac-1',
        verifierName: user?.name || 'Faculty Mentor',
        verifierRole: 'FACULTY_MENTOR',
        rejectionReason: rejectionReason.trim()
      });
      setRejectingDoc(null);
      setRejectionReason('');
      setRefreshKey(k => k + 1);
      showToast(`Document "${rejectingDoc.documentName}" marked as REJECTED.`);
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    }
  };

  const handleAttendanceDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApp || !user) return;

    try {
      attendanceApprovalService.mentorReview(
        reviewApp.id,
        {
          decision: reviewDecision,
          remarks: reviewRemarks.trim() || `Mentor ${reviewDecision === 'APPROVE' ? 'recommended approval' : 'decision'}`
        },
        user
      );
      setReviewApp(null);
      setReviewRemarks('');
      setRefreshKey(k => k + 1);
      showToast(`Attendance application ${reviewApp.applicationNo} updated successfully.`);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  // Export Mentee Roster to Excel (.xlsx only)
  const exportMenteeRosterXLSX = () => {
    const rows = menteeAttendanceData.map(m => {
      const prog = db.getProgramById(m.student.programId);
      const sem = db.getSemesterById(m.student.semesterId);
      return {
        'Student Name': m.student.name,
        'Enrollment Number': m.student.enrollmentNo,
        'Program': prog?.code || 'B.Tech',
        'Semester': sem?.number || 4,
        'Section / Division': m.student.divisionId || 'Div A',
        'Attendance %': `${m.stats.percentage}%`,
        'Exam Eligibility': m.hasShortage ? 'ATTENDANCE SHORTAGE' : 'ELIGIBLE',
        'Pending Docs': m.hasMissingDocs ? 'YES' : 'NO',
        'Academic Risk': m.isRisk ? 'HIGH RISK' : 'NORMAL',
        'Email': m.student.email,
        'Contact Phone': m.student.phone || '+91 98250 00000'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mentees Roster');
    XLSX.writeFile(wb, `Mentor_Assigned_Mentees_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Exported mentee roster to .xlsx successfully.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#10B981', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
            {role === 'STUDENT' ? 'My Assigned Faculty Mentor' : 'Mentor Workspace & Mentee Management'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {role === 'STUDENT'
              ? 'Your designated faculty mentor is your academic guide, counselor, and first point of contact.'
              : 'Direct oversight for assigned mentees, academic overview, attendance shortage tracking, and document verification.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {role !== 'STUDENT' && (
            <button onClick={exportMenteeRosterXLSX} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileSpreadsheet size={15} color="#10B981" /> Export Mentees (.xlsx)
            </button>
          )}

          {role === 'STUDENT' && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={16} /> Book Mentoring Session
            </button>
          )}
        </div>
      </div>

      {/* ─── STUDENT VIEW: My Assigned Mentor Card ─────────────────────────── */}
      {role === 'STUDENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a8a 100%)',
            color: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: 'var(--brand-gold)', color: 'var(--brand-navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 900, flexShrink: 0
              }}>
                {studentActiveMentor?.mentorName ? studentActiveMentor.mentorName.charAt(0) : 'M'}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Badge variant="gold">OFFICIAL ACADEMIC MENTOR</Badge>
                  <span style={{ fontSize: '0.8rem', color: '#E2E8F0' }}>Active Designation</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF' }}>
                  {studentActiveMentor?.mentorName || 'Prof. Faculty Member'}
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#E2E8F0', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={15} color="var(--brand-orange)" /> {studentActiveMentor?.mentorEmail || 'faculty@swarrnim.edu.in'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={15} color="var(--brand-gold)" /> {studentActiveMentor?.mentorPhone || '+91 98250 11001'}
                  </span>
                  <span>Dept: <strong>{studentActiveMentor?.departmentName || 'Computer Engineering'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FACULTY / MENTOR VIEW: Full Workspace ──────────────────────── */}
      {role !== 'STUDENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top KPI Summary Cards */}
          <div className="grid-4">
            <StatCard 
              title="Total Mentees" 
              value={myMentees.length} 
              subtitle="Assigned students" 
              icon={Users} 
              colorScheme="navy" 
            />
            <StatCard 
              title="Attendance Shortage" 
              value={shortageStudents.length} 
              subtitle="Below 75% requirement" 
              icon={AlertTriangle} 
              colorScheme={shortageStudents.length > 0 ? 'orange' : 'green'} 
            />
            <StatCard 
              title="Pending Documents" 
              value={pendingMenteesDocs.length} 
              subtitle="Requires verification" 
              icon={FolderCheck} 
              colorScheme={pendingMenteesDocs.length > 0 ? 'orange' : 'green'} 
            />
            <StatCard 
              title="Academic Risk" 
              value={riskStudents.length} 
              subtitle="Shortage or missing docs" 
              icon={AlertCircle} 
              colorScheme={riskStudents.length > 0 ? 'orange' : 'green'} 
            />
          </div>

          {/* Sub-Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'MY_STUDENTS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('MY_STUDENTS'); setSelectedStudentForDocs(null); }}
            >
              <Users size={14} /> Mentee List ({myMentees.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'ACADEMIC_OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('ACADEMIC_OVERVIEW'); setSelectedStudentForDocs(null); }}
            >
              <Award size={14} /> Academic Overview &amp; Risk
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'ATTENDANCE' || activeTab === 'ATTENDANCE_SHORTAGE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('ATTENDANCE'); setSelectedStudentForDocs(null); }}
            >
              <Clock size={14} /> Mentee Attendance ({shortageStudents.length} Shortage)
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'ATTENDANCE_APPROVALS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('ATTENDANCE_APPROVALS'); setSelectedStudentForDocs(null); }}
            >
              <CheckSquare size={14} /> Attendance Approvals
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'EXAM_ELIGIBILITY' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('EXAM_ELIGIBILITY'); setSelectedStudentForDocs(null); }}
            >
              <ShieldCheck size={14} /> Exam Eligibility
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'STUDENT_DOCUMENTS' || activeTab === 'PENDING_VERIFICATION' || activeTab === 'VERIFIED_DOCUMENTS' || activeTab === 'DOCUMENT_HISTORY' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('PENDING_VERIFICATION')}
            >
              <FolderCheck size={14} /> Document Verification ({pendingMenteesDocs.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'DATA_CHANGE_REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('DATA_CHANGE_REQUESTS'); setSelectedStudentForDocs(null); }}
            >
              <ShieldCheck size={14} /> Data Change Requests ({pendingDataChangeCount})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('REQUESTS'); setSelectedStudentForDocs(null); }}
            >
              <MessageSquare size={14} /> Student Requests ({pendingRequestsCount})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'SESSIONS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('SESSIONS'); setSelectedStudentForDocs(null); }}
            >
              <Calendar size={14} /> Counseling Sessions ({sessions.length})
            </button>
            {(role === 'HOD' || role === 'PRINCIPAL' || role === 'SUPER_ADMIN') && (
              <button 
                className={`btn btn-sm ${activeTab === 'ALLOCATION' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('ALLOCATION'); setSelectedStudentForDocs(null); }}
              >
                <UserCheck size={14} /> Mentor Allocation
              </button>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TAB: Data Change Requests Queue (Mentor Review)
              {/* ─────────────────────────────────────────────────────────────
              TAB 1: My Students / Mentee List (Unified Student Management)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'MY_STUDENTS' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              {/* Header with Title and Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={22} color="var(--brand-orange)" />
                    {role === 'FACULTY' 
                      ? 'My Students — Department & Assigned Classes' 
                      : role === 'MENTOR' 
                        ? 'My Mentees — Assigned Mentorship Roster'
                        : role === 'HOD'
                          ? 'Department Students Directory'
                          : role === 'PRINCIPAL'
                            ? 'Institute Students Directory'
                            : 'University Students Directory'}
                  </h3>
                  <Badge variant="navy">{sortedMenteeData.length} Authorized Records</Badge>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {canBulkMap && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setBulkMapInitialStep(1);
                        setShowBulkMapModal(true);
                      }}
                      title="Bulk Map / Register Students from Excel"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--brand-orange) 0%, #D95300 100%)',
                        boxShadow: '0 2px 6px rgba(243, 112, 35, 0.3)'
                      }}
                    >
                      <Plus size={14} /> + Bulk Map Students
                    </button>
                  )}

                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => studentEnrollmentMappingService.downloadExcelTemplate()}
                    title="Download official bulk mapping template (.xlsx)"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <Download size={14} /> Download Excel Template
                  </button>

                  {canBulkMap && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setBulkMapInitialStep(2);
                        setShowBulkMapModal(true);
                      }}
                      title="Directly upload filled student mapping Excel"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <Upload size={14} /> Upload Filled Excel
                    </button>
                  )}

                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowMappingHistoryModal(true)}
                    title="View historical student mapping audit sessions"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <FileText size={14} /> Mapping History
                  </button>

                  <button 
                    className="btn btn-sm btn-navy"
                    onClick={handleExportExcel}
                    title="Export authorized students to Excel"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <FileSpreadsheet size={14} /> Export to Excel
                  </button>

                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={handlePrint}
                    title="Print student master directory"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <Printer size={14} /> Print
                  </button>

                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterInstituteId('ALL');
                      setFilterDepartmentId('ALL');
                      setFilterProgramId('ALL');
                      setFilterAcademicYear('ALL');
                      setFilterSemesterId('ALL');
                      setFilterDivision('ALL');
                      setFilterBatch('ALL');
                      setStatusFilter('ALL');
                      setStandingFilter('ALL');
                      setCurrentPage(1);
                      setRefreshKey(k => k + 1);
                    }}
                    title="Reset all filters"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <RefreshCw size={14} /> Reset
                  </button>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  DYNAMIC UNIVERSITY STUDENT SUMMARY KPI CARDS (Calculated Dynamically)
                  ───────────────────────────────────────────────────────────── */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                {/* 1. Total Assigned */}
                <div 
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid var(--brand-navy)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                    Total Assigned Students
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>
                    {kpiMetrics.totalAssigned}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, marginTop: '0.15rem' }}>
                    {kpiMetrics.activeAssigned} Active Students
                  </div>
                </div>

                {/* 2. Students by Program */}
                <div 
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid var(--brand-orange)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                    Students by Program
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {kpiMetrics.programBreakdown.map(([prog, count]) => (
                      <span 
                        key={prog} 
                        style={{
                          backgroundColor: '#FFF7ED',
                          color: '#C2410C',
                          border: '1px solid #FFEDD5',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}
                      >
                        {prog}: <strong>{count}</strong>
                      </span>
                    ))}
                    {kpiMetrics.programBreakdown.length === 0 && <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>None</span>}
                  </div>
                </div>

                {/* 3. Students by Semester */}
                <div 
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #3B82F6',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                    Students by Semester
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {kpiMetrics.semesterBreakdown.map(([sem, count]) => (
                      <span 
                        key={sem} 
                        style={{
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #DBEAFE',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}
                      >
                        {sem}: <strong>{count}</strong>
                      </span>
                    ))}
                    {kpiMetrics.semesterBreakdown.length === 0 && <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>None</span>}
                  </div>
                </div>

                {/* 4. Students by Division */}
                <div 
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #8B5CF6',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                    Students by Division
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {kpiMetrics.divisionBreakdown.map(([div, count]) => (
                      <span 
                        key={div} 
                        style={{
                          backgroundColor: '#F5F3FF',
                          color: '#6D28D9',
                          border: '1px solid #EDE9FE',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}
                      >
                        {div}: <strong>{count}</strong>
                      </span>
                    ))}
                    {kpiMetrics.divisionBreakdown.length === 0 && <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>None</span>}
                  </div>
                </div>
              </div>

              {/* Main Search Input Bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    className="form-control" 
                    placeholder="Search by Student Name, Enrollment No, University ID, Email, or Mobile number..." 
                    value={searchQuery} 
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }} 
                    style={{ 
                      paddingLeft: '2.5rem', 
                      paddingRight: searchQuery ? '2.5rem' : '1rem',
                      height: '42px',
                      fontSize: '0.9rem',
                      border: '2px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                  />
                  <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-navy)', opacity: 0.6 }} />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  DEPENDENT CASCADING FILTER CONTROLS ROW
                  ───────────────────────────────────────────────────────────── */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', 
                gap: '0.65rem', 
                padding: '0.875rem', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '8px', 
                marginBottom: '1.25rem',
                border: '1px solid #E2E8F0'
              }}>
                {/* 1. Institute */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Institute</label>
                  <select 
                    className="form-control" 
                    value={filterInstituteId} 
                    onChange={e => {
                      setFilterInstituteId(e.target.value);
                      setFilterDepartmentId('ALL');
                      setFilterProgramId('ALL');
                      setFilterSemesterId('ALL');
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Institutes</option>
                    {availableInstitutes.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Department (Dependent on Institute) */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Department</label>
                  <select 
                    className="form-control" 
                    value={filterDepartmentId} 
                    onChange={e => {
                      setFilterDepartmentId(e.target.value);
                      setFilterProgramId('ALL');
                      setFilterSemesterId('ALL');
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Departments</option>
                    {availableDepartments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Program (Dependent on Department) */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Program</label>
                  <select 
                    className="form-control" 
                    value={filterProgramId} 
                    onChange={e => {
                      setFilterProgramId(e.target.value);
                      setFilterSemesterId('ALL');
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Programs</option>
                    {availablePrograms.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Academic Year */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Academic Year</label>
                  <select 
                    className="form-control" 
                    value={filterAcademicYear} 
                    onChange={e => {
                      setFilterAcademicYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>

                {/* 5. Semester (Dependent on Program) */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Semester</label>
                  <select 
                    className="form-control" 
                    value={filterSemesterId} 
                    onChange={e => {
                      setFilterSemesterId(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Semesters</option>
                    {availableSemesters.map(s => (
                      <option key={s.id} value={s.id}>Semester {s.number}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Division (Dependent on Semester) */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Division</label>
                  <select 
                    className="form-control" 
                    value={filterDivision} 
                    onChange={e => {
                      setFilterDivision(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Divisions</option>
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                    <option value="D">Division D</option>
                  </select>
                </div>

                {/* 7. Batch */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Batch</label>
                  <select 
                    className="form-control" 
                    value={filterBatch} 
                    onChange={e => {
                      setFilterBatch(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Batches</option>
                    {availableBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* 8. Student Status */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Student Status</label>
                  <select 
                    className="form-control" 
                    value={statusFilter} 
                    onChange={e => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="DETRAINED">Detrained / Withheld</option>
                  </select>
                </div>

                {/* 9. Academic Standing */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Academic Standing</label>
                  <select 
                    className="form-control" 
                    value={standingFilter} 
                    onChange={e => {
                      setStandingFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', padding: '0.2rem 0.4rem' }}
                  >
                    <option value="ALL">All Standings</option>
                    <option value="GOOD_STANDING">Good Standing</option>
                    <option value="ATTENDANCE_SHORTAGE">Attendance Shortage (&lt;75%)</option>
                    <option value="ACADEMIC_RISK">Academic Risk (Shortage / Docs)</option>
                  </select>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  OFFICIAL 16-COLUMN UNIVERSITY STUDENT MASTER TABLE
                  ───────────────────────────────────────────────────────────── */}
              {paginatedMenteeData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)', backgroundColor: '#FAFAFA', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Users size={48} style={{ opacity: 0.25, margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--brand-navy)', margin: '0 0 0.25rem 0' }}>No student master records found</p>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>Try adjusting your search criteria or resetting filters.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #CBD5E1', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <table className="table" style={{ width: '100%', minWidth: '1750px', borderCollapse: 'collapse', verticalAlign: 'middle', margin: 0, fontSize: '0.8125rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC', borderBottom: '2px solid #94A3B8' }}>
                      <tr>
                        {/* 1. Sr. No. */}
                        <th style={{ width: '60px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Sr. No.
                        </th>

                        {/* 2. Student Name */}
                        <th 
                          onClick={() => handleSort('name')}
                          style={{ width: '220px', padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>Student Name</span>
                            {sortField === 'name' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 3. Enrollment No. */}
                        <th 
                          onClick={() => handleSort('enrollmentNo')}
                          style={{ width: '130px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>Enrollment No.</span>
                            {sortField === 'enrollmentNo' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 4. University ID */}
                        <th 
                          onClick={() => handleSort('universityId')}
                          style={{ width: '140px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>University ID</span>
                            {sortField === 'universityId' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 5. Program */}
                        <th 
                          onClick={() => handleSort('program')}
                          style={{ width: '130px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>Program</span>
                            {sortField === 'program' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 6. Branch / Department */}
                        <th 
                          onClick={() => handleSort('department')}
                          style={{ width: '180px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>Branch / Department</span>
                            {sortField === 'department' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 7. Academic Year */}
                        <th style={{ width: '100px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Academic Year
                        </th>

                        {/* 8. Semester */}
                        <th 
                          onClick={() => handleSort('semester')}
                          style={{ width: '90px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                            <span>Semester</span>
                            {sortField === 'semester' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 9. Division */}
                        <th 
                          onClick={() => handleSort('division')}
                          style={{ width: '80px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                            <span>Division</span>
                            {sortField === 'division' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 10. Batch */}
                        <th style={{ width: '100px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Batch
                        </th>

                        {/* 11. Institute */}
                        <th style={{ width: '100px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Institute
                        </th>

                        {/* 12. Email */}
                        <th style={{ width: '180px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Email
                        </th>

                        {/* 13. Mobile */}
                        <th style={{ width: '120px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Mobile
                        </th>

                        {/* 14. Status */}
                        <th 
                          onClick={() => handleSort('status')}
                          style={{ width: '100px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                            <span>Status</span>
                            {sortField === 'status' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 15. Academic Standing */}
                        <th 
                          onClick={() => handleSort('standing')}
                          style={{ width: '160px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                            <span>Academic Standing</span>
                            {sortField === 'standing' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                          </div>
                        </th>

                        {/* 16. Actions */}
                        <th style={{ width: '80px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', position: 'sticky', right: 0, backgroundColor: '#F8FAFC', zIndex: 11 }}>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedMenteeData.map(({ student, stats, verifiedDocsCount, pendingDocsCount, hasShortage, isRisk, reqsCount }, idx) => {
                        const srNo = (currentPage - 1) * pageSize + idx + 1;
                        const prog = db.getProgramById(student.programId);
                        const sem = db.getSemesterById(student.semesterId);
                        const dept = db.getDepartments().find(d => d.id === student.departmentId);
                        const inst = db.getInstitutes().find(i => i.id === student.instituteId);
                        const divObj = db.getDivisions().find(d => d.id === student.divisionId);
                        const batchObj = db.getBatches().find(b => b.id === student.batchId);

                        const formattedDiv = divObj?.name ? (divObj.name.replace(/^Division\s*/i, '')) : (student.divisionId || 'A');
                        const formattedBatch = batchObj?.name || student.batchId || '2023-2027';
                        const univId = student.universityId || `SSIU-${student.enrollmentNo}`;

                        return (
                          <tr 
                            key={student.id} 
                            style={{ 
                              borderBottom: '1px solid #F1F5F9',
                              backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                            }}
                          >
                            {/* 1. Sr. No. */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                              {srNo}
                            </td>

                            {/* 2. Student Name */}
                            <td 
                              style={{ padding: '0.65rem 0.75rem', cursor: 'pointer' }}
                              onClick={() => setSelectedStudentForProfile(student)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <div style={{ 
                                  width: '30px', 
                                  height: '30px', 
                                  borderRadius: '50%', 
                                  background: 'linear-gradient(135deg, #001F3F 0%, #1E3A8A 100%)', 
                                  color: '#FFFFFF', 
                                  fontWeight: 800, 
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {student.name ? student.name.charAt(0) : 'S'}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {student.name}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {student.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 3. Enrollment No. */}
                            <td 
                              style={{ padding: '0.65rem 0.6rem', cursor: 'pointer' }}
                              onClick={() => setSelectedStudentForProfile(student)}
                            >
                              <code style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-orange)', background: '#FFF7ED', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #FFEDD5', display: 'inline-block' }}>
                                {student.enrollmentNo}
                              </code>
                            </td>

                            {/* 4. University ID */}
                            <td style={{ padding: '0.65rem 0.6rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                                {univId}
                              </span>
                            </td>

                            {/* 5. Program */}
                            <td style={{ padding: '0.65rem 0.6rem' }}>
                              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{prog?.code || 'B.Tech CSE'}</div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{prog?.name || 'Computer Engineering'}</div>
                            </td>

                            {/* 6. Branch / Department */}
                            <td style={{ padding: '0.65rem 0.6rem' }}>
                              <div style={{ fontWeight: 700, color: '#334155' }}>{student.branch || dept?.name || 'Computer Science & Engineering'}</div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{dept?.code || 'CSE'}</div>
                            </td>

                            {/* 7. Academic Year */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <Badge variant="navy">{student.academicYear || '2025-26'}</Badge>
                            </td>

                            {/* 8. Semester */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                                Sem {sem?.number || 4}
                              </span>
                            </td>

                            {/* 9. Division */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, color: 'var(--brand-orange)', backgroundColor: '#FFF7ED', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #FFEDD5' }}>
                                Div {formattedDiv}
                              </span>
                            </td>

                            {/* 10. Batch */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                                {formattedBatch}
                              </span>
                            </td>

                            {/* 11. Institute */}
                            <td style={{ padding: '0.65rem 0.6rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                                {inst?.code || 'SSCIT'}
                              </span>
                            </td>

                            {/* 12. Email */}
                            <td style={{ padding: '0.65rem 0.6rem' }}>
                              <span style={{ fontSize: '0.73rem', color: '#475569' }}>
                                {student.email}
                              </span>
                            </td>

                            {/* 13. Mobile */}
                            <td style={{ padding: '0.65rem 0.6rem' }}>
                              <span style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 600 }}>
                                {student.mobile || student.phone || '-'}
                              </span>
                            </td>

                            {/* 14. Status */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              {student.status === 'ACTIVE' ? (
                                <Badge variant="active">ACTIVE</Badge>
                              ) : (
                                <Badge variant="danger">{student.status || 'INACTIVE'}</Badge>
                              )}
                            </td>

                            {/* 15. Academic Standing */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              {!isRisk ? (
                                <Badge variant="active">GOOD STANDING</Badge>
                              ) : stats.percentage < 60 ? (
                                <Badge variant="danger">CRITICAL RISK</Badge>
                              ) : (
                                <Badge variant="warning">ACADEMIC RISK</Badge>
                              )}
                            </td>

                            {/* 16. Actions */}
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', position: 'sticky', right: 0, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA', zIndex: 5 }}>
                              <StudentRowActionMenu
                                student={student}
                                statusLevel={
                                  (stats.percentage < 60 || reqsCount > 0 || (verifiedDocsCount === 0 && pendingDocsCount > 0))
                                    ? 'critical'
                                    : (stats.percentage < 75 || pendingDocsCount > 0 || isRisk)
                                    ? 'warning'
                                    : 'good'
                                }
                                onViewProfile={() => setSelectedStudentForProfile(student)}
                                onViewDocuments={() => {
                                  setSelectedStudentForDocs(student);
                                  setActiveTab('STUDENT_DOCUMENTS');
                                }}
                                onViewAcademic={() => setActiveTab('ACADEMIC_OVERVIEW')}
                                onViewAttendance={() => setActiveTab('ATTENDANCE')}
                                onViewExamination={() => setActiveTab('EXAM_ELIGIBILITY')}
                                onViewRequests={() => setActiveTab('STUDENT_REQUESTS')}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  PAGINATION CONTROLS FOOTER
                  ───────────────────────────────────────────────────────────── */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                {/* Left: Entries info & page size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: '#64748B' }}>
                  <span>
                    Showing <strong>{sortedMenteeData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
                    <strong>{Math.min(currentPage * pageSize, sortedMenteeData.length)}</strong> of{' '}
                    <strong>{sortedMenteeData.length}</strong> students
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Rows per page:</span>
                    <select
                      className="form-control"
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{ width: '70px', height: '30px', fontSize: '0.78rem', padding: '0.1rem 0.3rem' }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Right: Page navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                    style={{ padding: '0.25rem 0.5rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    <ChevronsLeft size={14} />
                  </button>

                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                    style={{ padding: '0.25rem 0.5rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)', padding: '0 0.5rem' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                    style={{ padding: '0.25rem 0.5rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    <ChevronRight size={14} />
                  </button>

                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                    style={{ padding: '0.25rem 0.5rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: Academic Overview & Academic Risk Tracker
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'ACADEMIC_OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-orange)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={18} color="var(--brand-orange)" /> Academic Risk Identification &amp; Early Intervention
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Identifies students requiring academic counseling based on attendance shortage (&lt;75%), missing verification documents, or backlog subjects.
                    </p>
                  </div>
                  <Badge variant="orange">{riskStudents.length} Students At Risk</Badge>
                </div>

                {riskStudents.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#10B981', backgroundColor: '#ECFDF5', borderRadius: '8px' }}>
                    <CheckCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontWeight: 700 }}>All assigned mentees are in good academic standing. No critical risks detected.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student Mentee</th>
                          <th>Attendance Status</th>
                          <th>Document Vault Status</th>
                          <th>Risk Factor Breakdown</th>
                          <th style={{ textAlign: 'right' }}>Counseling Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskStudents.map(({ student, stats, hasShortage, hasMissingDocs }) => (
                          <tr key={student.id}>
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{student.name}</div>
                              <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{student.enrollmentNo}</code>
                            </td>
                            <td>
                              <Badge variant={!hasShortage ? 'active' : 'danger'}>
                                {stats.percentage}% (Required: 75%)
                              </Badge>
                            </td>
                            <td>
                              <Badge variant={!hasMissingDocs ? 'active' : 'orange'}>
                                {!hasMissingDocs ? 'All Docs Verified' : 'Missing Verification'}
                              </Badge>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                                {hasShortage && <span style={{ color: '#EF4444', fontWeight: 600 }}>• Attendance shortage ({75 - stats.percentage}% below threshold)</span>}
                                {hasMissingDocs && <span style={{ color: '#F59E0B', fontWeight: 600 }}>• Pending academic document verification</span>}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setShowModal(true);
                                  setTopic(`Academic Performance Counseling - ${student.name}`);
                                }}
                              >
                                Schedule Counseling
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: Mentee Attendance & Shortage View (Excel-Style Ledger)
              ───────────────────────────────────────────────────────────── */}
          {(activeTab === 'ATTENDANCE' || activeTab === 'ATTENDANCE_SHORTAGE') && (
            <MenteeAttendanceManager
              onNavigateToCondonations={() => setActiveTab('ATTENDANCE_APPROVALS')}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: Attendance Approval Workflow (4-Tier)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'ATTENDANCE_APPROVALS' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    Mentee Attendance Condonation Approvals Queue
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    4-Tier Workflow: <code>Student → Subject Faculty → Mentor → HOD → HOI</code>. Endorsing forwards to HOD.
                  </p>
                </div>
              </div>

              {(() => {
                const menteeApps = db.getAttendanceApplications().filter(
                  a => (a.mentorFacultyId === user?.id || role === 'SUPER_ADMIN') &&
                       (a.status === 'FACULTY_APPROVED' || a.status === 'WITH_MENTOR' || a.status === 'MENTOR_APPROVED' || a.status.includes('MENTOR'))
                );

                if (menteeApps.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <ShieldCheck size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                      <p style={{ fontWeight: 600 }}>No attendance condonation applications pending your Mentor review.</p>
                    </div>
                  );
                }

                return (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Application No</th>
                          <th>Student Mentee</th>
                          <th>Subject</th>
                          <th>Attendance %</th>
                          <th>Reason &amp; Remarks</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menteeApps.map(app => {
                          const canDecide = app.status === 'FACULTY_APPROVED' || app.status === 'WITH_MENTOR';

                          return (
                            <tr key={app.id}>
                              <td><code>{app.applicationNo}</code></td>
                              <td>
                                <div style={{ fontWeight: 700 }}>{app.studentName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.enrollmentNo}</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{app.subjectName}</div>
                                <code style={{ fontSize: '0.75rem' }}>{app.subjectCode}</code>
                              </td>
                              <td>
                                <span style={{ color: '#EF4444', fontWeight: 800 }}>{app.currentAttendancePct}%</span> / {app.requiredAttendancePct}%
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shortage: {app.shortagePct}%</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{app.reason.replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faculty: <em>"{app.facultyRemarks || 'Approved by Faculty'}"</em></div>
                              </td>
                              <td>
                                {app.status === 'FINAL_APPROVED' ? (
                                  <Badge variant="active">FINAL APPROVED</Badge>
                                ) : app.status.includes('REJECTED') ? (
                                  <Badge variant="danger">{app.status}</Badge>
                                ) : (
                                  <Badge variant="warning">{app.status}</Badge>
                                )}
                              </td>
                              <td>
                                {canDecide ? (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                      setReviewApp(app);
                                      setReviewRemarks('');
                                      setReviewDecision('APPROVE');
                                    }}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                  >
                                    Review &amp; Decide
                                  </button>
                                ) : (
                                  <Badge variant="active">Endorsed to HOD</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 5: Exam Eligibility Official View (Excel-Style Register)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'EXAM_ELIGIBILITY' && (
            <MenteeExamEligibilityManager
              onNavigateToCondonations={() => setActiveTab('ATTENDANCE_APPROVALS')}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 6: Document Verification Vault & Pending Queue
              ───────────────────────────────────────────────────────────── */}
          {(activeTab === 'PENDING_VERIFICATION' || activeTab === 'VERIFIED_DOCUMENTS' || activeTab === 'DOCUMENT_HISTORY') && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    Mentee Document Verification &amp; Locking Queue ({pendingMenteesDocs.length} Pending)
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Review submitted student documents, inspect official attachments, permanently lock verified records, or reject with reason.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    className={`btn btn-sm ${activeTab === 'PENDING_VERIFICATION' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('PENDING_VERIFICATION')}
                  >
                    Pending ({pendingMenteesDocs.length})
                  </button>
                  <button 
                    className={`btn btn-sm ${activeTab === 'VERIFIED_DOCUMENTS' ? 'btn-navy' : 'btn-outline'}`}
                    onClick={() => setActiveTab('VERIFIED_DOCUMENTS')}
                  >
                    Verified &amp; Locked ({verifiedMenteesDocs.length})
                  </button>
                </div>
              </div>

              {((activeTab === 'PENDING_VERIFICATION' ? pendingMenteesDocs : verifiedMenteesDocs).length === 0) ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#10B981' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Queue is Clear</h4>
                  <p style={{ fontSize: '0.875rem' }}>No student documents currently match this status.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student Mentee</th>
                        <th>Document Name &amp; Code</th>
                        <th>Category</th>
                        <th>Uploaded Date</th>
                        <th>File Attachment</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Mentor Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === 'PENDING_VERIFICATION' ? pendingMenteesDocs : verifiedMenteesDocs).map(doc => (
                        <tr key={doc.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{doc.studentName}</div>
                            <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{doc.enrollmentNo}</code>
                          </td>
                          <td>
                            <strong>{doc.documentName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {doc.documentCode} • v{doc.currentVersion}</div>
                          </td>
                          <td>
                            <Badge variant="navy">{doc.category}</Badge>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={14} /> {doc.fileName}
                            </span>
                          </td>
                          <td>
                            <Badge variant={doc.status === 'VERIFIED' ? 'active' : 'orange'}>
                              {doc.status}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {doc.status !== 'VERIFIED' ? (
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleVerifyDocument(doc)}
                                  style={{ backgroundColor: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  title="Approve & Permanently Lock"
                                >
                                  <Lock size={12} /> Verify &amp; Lock
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {
                                    setRejectingDoc(doc);
                                    setRejectionReason('');
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  title="Reject with Reason"
                                >
                                  <XCircle size={12} /> Reject
                                </button>
                              </div>
                            ) : (
                              <Badge variant="active">
                                <Lock size={11} style={{ marginRight: '3px' }} /> Locked &amp; Verified
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 7: Student Documents Vault (Full View)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'STUDENT_DOCUMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedStudentForDocs ? (
                <div>
                  {/* Student Document Vault Header with Complete Academic Metadata */}
                  <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          Student Document Verification Vault: {selectedStudentForDocs.name}
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Verify uploaded student credentials, university records, certificates, and DigiLocker ABC ID
                        </p>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setSelectedStudentForDocs(null)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        ← Back to Document Register
                      </button>
                    </div>

                    {/* Metadata Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>Enrollment No</span>
                        <code style={{ fontWeight: 700 }}>{selectedStudentForDocs.enrollmentNo}</code>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>Program</span>
                        <strong>{db.getProgramById(selectedStudentForDocs.programId)?.name || 'B.Tech Computer Engineering'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
                        <strong>{db.getDepartmentById(selectedStudentForDocs.departmentId)?.name || 'Computer Engineering'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>Academic Year / Sem</span>
                        <strong>2026-2027 (Sem {db.getSemesterById(selectedStudentForDocs.semesterId)?.number || 4})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>Division</span>
                        <strong>{db.getDivisionById(selectedStudentForDocs.divisionId)?.name || 'Division A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>Faculty Mentor</span>
                        <strong>{user?.name || 'Dr. Rajesh Sharma'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>ABC ID Status</span>
                        <Badge variant={selectedStudentForDocs.abcIdStatus === 'VERIFIED' ? 'active' : (selectedStudentForDocs.abcIdStatus === 'PENDING_VERIFICATION' ? 'orange' : 'inactive')}>
                          {selectedStudentForDocs.abcIdStatus || 'NOT_SUBMITTED'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <StudentDocumentsSection student={selectedStudentForDocs} onRefresh={() => setRefreshKey(k => k + 1)} />
                </div>
              ) : (
                <StudentDocumentsVerificationGrid
                  students={myMentees}
                  onOpenVault={(student) => setSelectedStudentForDocs(student)}
                  currentUser={user}
                />
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 8: Student Requests
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'REQUESTS' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
                Incoming Mentee Requests &amp; Queries
              </h3>
              {myMentorRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 600 }}>No requests pending mentor review.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Request ID &amp; Type</th>
                        <th>Student</th>
                        <th>Subject / Query Details</th>
                        <th>Date Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myMentorRequests.map((r: any) => (
                        <tr key={r.id}>
                          <td>
                            <code style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{r.requestNo || r.id}</code>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.category || 'General'}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{r.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.enrollmentNo}</div>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>{r.subject || r.description || 'Student inquiry'}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td>
                            <Badge variant={r.status === 'RESOLVED' || r.status === 'APPROVED' ? 'active' : 'warning'}>
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 9: Mentoring & Counseling Sessions
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'SESSIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Follow-up Action Tracker */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} color="#FBBC05" /> Pending Counseling Follow-ups ({pendingFollowUps.length})
                  </h3>
                  <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Log Mentoring Session
                  </button>
                </div>
                {pendingFollowUps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={36} color="#34A853" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontWeight: 600 }}>No pending follow-ups.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Topic &amp; Concern</th>
                          <th>Action Required</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Update Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingFollowUps.map(f => (
                          <tr key={f.id}>
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{f.studentName}</div>
                              <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{f.studentEnrollmentNo}</code>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{f.topic}</div>
                              {f.academicConcern && <div style={{ fontSize: '0.75rem', color: '#EA4335' }}>Academic: {f.academicConcern}</div>}
                              {f.attendanceConcern && <div style={{ fontSize: '0.75rem', color: '#FBBC05' }}>Attendance: {f.attendanceConcern}</div>}
                            </td>
                            <td style={{ fontSize: '0.8125rem' }}>{f.followUpAction || f.actionTaken || 'Counseling review'}</td>
                            <td style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{f.followUpDate || f.date}</td>
                            <td>
                              <Badge variant={f.followUpStatus === 'IN_PROGRESS' ? 'warning' : 'danger'}>
                                {f.followUpStatus || 'OPEN'}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                {f.followUpStatus !== 'IN_PROGRESS' && (
                                  <button 
                                    className="btn btn-xs btn-outline"
                                    onClick={() => handleFollowUpStatusChange(f.id, 'IN_PROGRESS')}
                                    title="Mark In Progress"
                                  >
                                    In Progress
                                  </button>
                                )}
                                <button 
                                  className="btn btn-xs btn-primary"
                                  onClick={() => handleFollowUpStatusChange(f.id, 'COMPLETED')}
                                  title="Mark Completed"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Check size={12} /> Complete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Complete Mentoring & Counseling History */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
                  All Mentoring &amp; Counseling History ({sessions.length})
                </h3>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Calendar size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                    <p style={{ fontWeight: 600 }}>No counseling sessions logged yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student Mentee</th>
                          <th>Topic / Agenda</th>
                          <th>Date &amp; Slot</th>
                          <th>Action Taken &amp; Remarks</th>
                          <th>Follow-up</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{s.studentName}</div>
                              <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{s.studentEnrollmentNo}</code>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{s.topic}</div>
                              {s.discussion && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.discussion}</div>}
                            </td>
                            <td>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.date}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.timeSlot}</div>
                            </td>
                            <td style={{ fontSize: '0.8125rem' }}>
                              <div><strong>Action:</strong> {s.actionTaken || 'Provided counseling.'}</div>
                              {s.remarks && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.remarks}</div>}
                            </td>
                            <td>
                              {s.followUpRequired ? (
                                <Badge variant={s.followUpStatus === 'COMPLETED' ? 'active' : (s.followUpStatus === 'IN_PROGRESS' ? 'warning' : 'danger')}>
                                  {s.followUpStatus || 'OPEN'} ({s.followUpDate || 'Due'})
                                </Badge>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>
                            <td>
                              <Badge variant={s.status === 'COMPLETED' ? 'active' : 'warning'}>{s.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 10: Institutional Mentor Allocation (Admin / HOD)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === 'ALLOCATION' && (
            <MentorAssignmentTab />
          )}
        </div>
      )}

      {/* Rejection Modal for Documents */}
      {rejectingDoc && (
        <Modal isOpen={!!rejectingDoc} onClose={() => setRejectingDoc(null)} title="Reject Student Document with Reason">
          <form onSubmit={handleRejectDocumentConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '0.84375rem', color: '#EF4444' }}>
              <strong>Document:</strong> {rejectingDoc.documentName} ({rejectingDoc.studentName})
            </div>
            <div className="form-group">
              <label className="form-label">Mandatory Rejection Reason *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Specify why this document is rejected (e.g. Blurred photocopy / Missing official stamp / Wrong semester marksheet)..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRejectingDoc(null)}>Cancel</button>
              <button type="submit" className="btn btn-danger">Confirm Rejection</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Attendance Review Modal */}
      {reviewApp && (
        <Modal isOpen={!!reviewApp} onClose={() => setReviewApp(null)} title={`Review Attendance Application: ${reviewApp.applicationNo}`}>
          <form onSubmit={handleAttendanceDecision} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Student:</strong> {reviewApp.studentName} ({reviewApp.enrollmentNo})</div>
              <div><strong>Subject:</strong> {reviewApp.subjectName} ({reviewApp.subjectCode})</div>
              <div><strong>Current Attendance:</strong> {reviewApp.currentAttendancePct}% (Required: {reviewApp.requiredAttendancePct}%)</div>
              <div><strong>Reason:</strong> {reviewApp.reason.replace(/_/g, ' ')}</div>
              <div><strong>Description:</strong> {reviewApp.description}</div>
              {reviewApp.facultyRemarks && <div style={{ marginTop: '0.35rem', color: 'var(--brand-orange)' }}><strong>Subject Faculty Remarks:</strong> {reviewApp.facultyRemarks}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Mentor Decision *</label>
              <select className="form-select" value={reviewDecision} onChange={e => setReviewDecision(e.target.value as any)}>
                <option value="APPROVE">Endorse &amp; Forward to HOD</option>
                <option value="REJECT">Reject Application</option>
                <option value="REQUEST_MORE_INFO">Request Clarification from Faculty</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mentor Remarks / Assessment *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Enter counseling observations and recommendation..."
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReviewApp(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Decision</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Book / Log Session Modal */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={role === 'STUDENT' ? "Book Mentoring / Counseling Session" : "Log Mentoring & Counseling Record"}>
          <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {role !== 'STUDENT' && (
              <div className="form-group">
                <label className="form-label">Select Assigned Student Mentee *</label>
                <select 
                  className="form-select" 
                  value={selectedMenteeId || (myMentees[0]?.id || '')} 
                  onChange={e => setSelectedMenteeId(e.target.value)}
                  required
                >
                  {myMentees.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.enrollmentNo}) - {m.divisionId || 'Div A'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Discussion Topic / Agenda *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Mid-term Attendance Recovery / Career Guidance / Project Review" 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Session Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={date || new Date().toISOString().split('T')[0]} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot *</label>
                <select className="form-select" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                  <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM</option>
                </select>
              </div>
            </div>

            {role !== 'STUDENT' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Academic Concern (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Difficulty in Data Structures" 
                      value={academicConcern} 
                      onChange={e => setAcademicConcern(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attendance Concern (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Below 75% in Lab Sessions" 
                      value={attendanceConcern} 
                      onChange={e => setAttendanceConcern(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Counseling Action Taken &amp; Guidance Provided *</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    placeholder="Describe specific steps, remedial support, or recommendations given..." 
                    value={actionTaken} 
                    onChange={e => setActionTaken(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mentor Remarks</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="General observations on student attitude/progress" 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)} 
                  />
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer', marginBottom: followUpRequired ? '0.75rem' : 0 }}>
                    <input 
                      type="checkbox" 
                      checked={followUpRequired} 
                      onChange={e => setFollowUpRequired(e.target.checked)} 
                    />
                    Requires Follow-up Session &amp; Milestone Check
                  </label>

                  {followUpRequired && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Follow-up Date *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={followUpDate} 
                          onChange={e => setFollowUpDate(e.target.value)} 
                          required={followUpRequired} 
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Action / Goal to Review *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Check improved attendance after 2 weeks" 
                          value={followUpAction} 
                          onChange={e => setFollowUpAction(e.target.value)} 
                          required={followUpRequired} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{role === 'STUDENT' ? 'Book Session' : 'Save Mentoring Record'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal isOpen={true} student={selectedStudentForProfile} onClose={() => setSelectedStudentForProfile(null)} />
      )}

      {/* Central Bulk Student Mapping Wizard Modal */}
      {showBulkMapModal && (
        <BulkStudentMappingModal
          isOpen={showBulkMapModal}
          initialStep={bulkMapInitialStep}
          onClose={() => setShowBulkMapModal(false)}
          onImportSuccess={() => {
            setRefreshKey(k => k + 1);
            showToast('Student enrollment mappings updated successfully!');
          }}
          onViewHistory={() => {
            setShowBulkMapModal(false);
            setShowMappingHistoryModal(true);
          }}
        />
      )}

      {/* Student Mapping History & Audit Trail Modal */}
      {showMappingHistoryModal && (
        <StudentMappingHistoryModal
          isOpen={showMappingHistoryModal}
          onClose={() => setShowMappingHistoryModal(false)}
          onOpenBulkMapModal={() => {
            setShowMappingHistoryModal(false);
            setBulkMapInitialStep(1);
            setShowBulkMapModal(true);
          }}
        />
      )}
    </div>
  );
};
