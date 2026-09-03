import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  studentOnboardingService, 
  OnboardingStatistics, 
  OnboardStudentResult, 
  OnboardingHistoryRecord 
} from '../../services/studentOnboardingService';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { AdmissionApplication, Student, User } from '../../types';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { StudentOnboardingStepperModal } from '../../components/admission/StudentOnboardingStepperModal';
import { StudentOnboardingFormModal } from '../../components/admission/StudentOnboardingFormModal';
import { StudentApplicantDetailModal } from '../../components/admission/StudentApplicantDetailModal';
import { StudentProfileModal } from '../../components/profile/StudentProfileModal';
import { FinalEnrollmentAssignModal } from '../../components/admission/FinalEnrollmentAssignModal';
import { 
  UserPlus, FileCheck, IndianRupee, KeyRound, 
  GraduationCap, ShieldCheck, CheckCircle2, Clock, 
  XCircle, Search, Download, Printer, Eye, RotateCcw, 
  Check, Filter, Users, Building2, BookOpen, Layers, 
  Sparkles, Calendar, Phone, Mail, Award, AlertCircle, 
  CheckSquare, History, FileText, ArrowRight, BarChart3, Edit3, Copy, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

export type StudentAdminTab = 
  | 'DASHBOARD'
  | 'APPLICATIONS'
  | 'DOC_VERIFICATION'
  | 'FEE_VERIFICATION'
  | 'STUDENT_CREATION'
  | 'ENROLLMENT'
  | 'MENTOR_ASSIGNMENT'
  | 'ACCOUNT_ACTIVATION'
  | 'ONBOARDING_REGISTER'
  | 'STUDENTS_DIRECTORY'
  | 'REPORTS'
  | 'NOTIFICATIONS';

interface StudentAdminWorkspacePageProps {
  initialTab?: string;
}

export const StudentAdminWorkspacePage: React.FC<StudentAdminWorkspacePageProps> = ({ 
  initialTab = 'DASHBOARD' 
}) => {
  const { user, role } = useAuth();

  // Active Tab State
  const resolveInitialTab = (tabStr: string): StudentAdminTab => {
    switch (tabStr) {
      case 'onboarding-applications':
      case 'onboarding-queue':
        return 'APPLICATIONS';
      case 'onboarding-doc-verification':
        return 'DOC_VERIFICATION';
      case 'onboarding-fee-verification':
        return 'FEE_VERIFICATION';
      case 'onboarding-student-creation':
        return 'STUDENT_CREATION';
      case 'onboarding-enrollment':
        return 'ENROLLMENT';
      case 'onboarding-mentor-assignment':
      case 'mentor-assignment':
        return 'MENTOR_ASSIGNMENT';
      case 'onboarding-account-activation':
        return 'ACCOUNT_ACTIVATION';
      case 'onboarding-register':
        return 'ONBOARDING_REGISTER';
      case 'students-directory':
      case 'student-search':
      case 'students':
        return 'STUDENTS_DIRECTORY';
      case 'onboarding-reports':
      case 'onboarding-pending-verification':
      case 'onboarding-export-register':
      case 'reports':
        return 'REPORTS';
      case 'notifications':
        return 'NOTIFICATIONS';
      default:
        return 'DASHBOARD';
    }
  };

  const [activeTab, setActiveTab] = useState<StudentAdminTab>(resolveInitialTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(resolveInitialTab(initialTab));
    }
  }, [initialTab]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  // Master Data
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();
  const semesters = db.getSemesters();
  const facultyMembers = db.getUsers().filter(u => u.role === 'FACULTY' || u.role === 'MENTOR' || u.role === 'HOD');

  // Filter States
  const [academicYearFilter, setAcademicYearFilter] = useState('ALL');
  const [instituteFilter, setInstituteFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('ALL');
  const [documentStatusFilter, setDocumentStatusFilter] = useState('ALL');
  const [feeStatusFilter, setFeeStatusFilter] = useState('ALL');
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Enrollment Desk State
  const [selectedAppForStepper, setSelectedAppForStepper] = useState<AdmissionApplication | null>(null);
  const [selectedAppForDossier, setSelectedAppForDossier] = useState<AdmissionApplication | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [isOnboardingFormOpen, setIsOnboardingFormOpen] = useState(false);
  const [selectedDraftStudent, setSelectedDraftStudent] = useState<Student | null>(null);
  const [selectedAppForForm, setSelectedAppForForm] = useState<AdmissionApplication | null>(null);
  const [assignFinalModalOpen, setAssignFinalModalOpen] = useState(false);
  const [selectedStudentForFinalAssign, setSelectedStudentForFinalAssign] = useState<Student | null>(null);
  const [enrollmentTabStatusFilter, setEnrollmentTabStatusFilter] = useState<'ALL' | 'TEMPORARY' | 'FINAL'>('ALL');
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');

  // Statistics
  const stats: OnboardingStatistics = useMemo(() => {
    return studentOnboardingService.getOnboardingStatistics();
  }, [refreshKey]);

  // Applications
  const applications = useMemo(() => {
    let list = studentOnboardingService.getFilteredApplications({
      academicYearId: academicYearFilter,
      instituteId: instituteFilter,
      departmentId: departmentFilter,
      programId: programFilter,
      admissionStatus: admissionStatusFilter,
      onboardingStatus: onboardingStatusFilter,
      searchQuery
    }, user, role);

    if (semesterFilter !== 'ALL') {
      list = list.filter(app => app.semesterId === semesterFilter);
    }

    if (documentStatusFilter !== 'ALL') {
      list = list.filter(app => {
        const docs = app.documents || [];
        const isVerified = docs.length > 0 && docs.every(d => d.status === 'VERIFIED');
        if (documentStatusFilter === 'VERIFIED') return isVerified;
        if (documentStatusFilter === 'PENDING') return !isVerified;
        return true;
      });
    }

    if (feeStatusFilter !== 'ALL') {
      list = list.filter(app => {
        if (feeStatusFilter === 'PAID') return app.isFeePaid;
        if (feeStatusFilter === 'PENDING') return !app.isFeePaid;
        return true;
      });
    }

    return list;
  }, [academicYearFilter, instituteFilter, departmentFilter, programFilter, semesterFilter, admissionStatusFilter, documentStatusFilter, feeStatusFilter, onboardingStatusFilter, searchQuery, user, role, refreshKey]);

  // Onboarding History
  const historyRecords: OnboardingHistoryRecord[] = useMemo(() => {
    return studentOnboardingService.getOnboardingHistory();
  }, [refreshKey]);

  // Students Master
  const students = useMemo(() => {
    return db.getStudents();
  }, [refreshKey]);

  // Combined Creation Desk List (Students + Admission Candidates)
  const creationDeskList = useMemo(() => {
    const list: Array<{
      id: string;
      studentId?: string;
      applicationNumber: string;
      name: string;
      email: string;
      instituteCode: string;
      programName: string;
      departmentCode: string;
      academicYearName: string;
      semesterName: string;
      mentorName: string;
      admissionStatus: 'Admission Confirmed' | 'Admission Pending' | 'Rejected' | 'On Hold';
      documentStatus: 'Documents Verified' | 'Documents Pending';
      feeStatus: 'Fee Verified' | 'Fee Pending';
      onboardingStatus: 'Onboarded' | 'Ready to Onboard' | 'Onboarding Draft' | 'Pending' | 'Rejected';
      isEligibleForOnboarding: boolean;
      erpStatus: string;
      studentRef?: Student;
      appRef?: AdmissionApplication;
    }> = [];

    // 1. Add students (including drafts)
    students.forEach(st => {
      const prog = programs.find(p => p.id === st.programId);
      const dept = departments.find(d => d.id === st.departmentId) || departments.find(d => d.id === prog?.departmentId);
      const inst = institutes.find(i => i.id === st.instituteId);
      const mentor = facultyMembers.find(f => f.id === st.mentorId);
      const sem = semesters.find(s => s.id === st.semesterId);
      const ay = academicYears.find(y => y.id === st.academicYearId);

      const isDraft = st.onboardingStatus === 'ONBOARDING_DRAFT' || st.status === 'INACTIVE';
      const isOnboarded = st.status === 'ACTIVE' || st.onboardingStatus === 'ONBOARDED';

      list.push({
        id: st.id,
        studentId: st.id,
        applicationNumber: st.applicationNumber || `APP-${st.id}`,
        name: st.name,
        email: st.email,
        instituteCode: inst?.code || 'SSCIT',
        programName: prog?.name?.replace('B.Tech ', '') || 'B.Tech',
        departmentCode: dept?.code || 'CSE',
        academicYearName: ay?.name || '2026–2027',
        semesterName: sem ? `Sem ${sem.number}` : 'Sem 1',
        mentorName: mentor?.name || st.mentorName || 'Unassigned',
        admissionStatus: 'Admission Confirmed',
        documentStatus: 'Documents Verified',
        feeStatus: 'Fee Verified',
        onboardingStatus: isOnboarded ? 'Onboarded' : isDraft ? 'Onboarding Draft' : 'Pending',
        isEligibleForOnboarding: true,
        erpStatus: isOnboarded ? 'ACTIVE' : 'NOT_CREATED',
        studentRef: st
      });
    });

    // 2. Add un-onboarded admission applications
    applications.forEach(app => {
      if (app.status !== 'CONVERTED' && !list.some(item => item.id === app.studentId || item.applicationNumber === app.applicationNumber)) {
        const prog = programs.find(p => p.id === app.programId);
        const dept = departments.find(d => d.id === app.departmentId) || departments.find(d => d.id === prog?.departmentId);
        const inst = institutes.find(i => i.id === app.instituteId);
        const sem = semesters.find(s => s.id === app.semesterId);
        const ay = academicYears.find(y => y.id === app.academicYearId);

        const docs = app.documents || [];
        const isDocVerified = docs.length > 0 && docs.every(d => d.status === 'VERIFIED');
        const isFeePaid = Boolean(app.isFeePaid);
        const isAdmissionConfirmed = app.status === 'APPROVED' || app.status === 'ADMISSION_CONFIRMED';
        const isRejected = app.status === 'REJECTED';
        const isHold = app.status === 'HOLD';

        const isEligible = isAdmissionConfirmed && isDocVerified && isFeePaid;

        const admStatusLabel: 'Admission Confirmed' | 'Admission Pending' | 'Rejected' | 'On Hold' = 
          isAdmissionConfirmed ? 'Admission Confirmed' : isRejected ? 'Rejected' : isHold ? 'On Hold' : 'Admission Pending';
        const docStatusLabel = isDocVerified ? 'Documents Verified' : 'Documents Pending';
        const feeStatusLabel = isFeePaid ? 'Fee Verified' : 'Fee Pending';
        const onbStatusLabel = isRejected ? 'Rejected' : isEligible ? 'Ready to Onboard' : 'Pending';

        list.push({
          id: app.id,
          studentId: undefined,
          applicationNumber: app.applicationNumber || app.id,
          name: app.applicantName,
          email: app.email,
          instituteCode: inst?.code || 'SSCIT',
          programName: prog?.name?.replace('B.Tech ', '') || 'B.Tech',
          departmentCode: dept?.code || 'CSE',
          academicYearName: ay?.name || '2026–2027',
          semesterName: sem ? `Sem ${sem.number}` : 'Sem 1',
          mentorName: 'Unassigned',
          admissionStatus: admStatusLabel,
          documentStatus: docStatusLabel,
          feeStatus: feeStatusLabel,
          onboardingStatus: onbStatusLabel,
          isEligibleForOnboarding: isEligible,
          erpStatus: 'NOT_CREATED',
          appRef: app
        });
      }
    });

    return list;
  }, [students, applications, programs, departments, institutes, facultyMembers, semesters, academicYears]);

  const handleResetFilters = () => {
    setAcademicYearFilter('ALL');
    setInstituteFilter('ALL');
    setDepartmentFilter('ALL');
    setProgramFilter('ALL');
    setSemesterFilter('ALL');
    setAdmissionStatusFilter('ALL');
    setDocumentStatusFilter('ALL');
    setFeeStatusFilter('ALL');
    setOnboardingStatusFilter('ALL');
    setSearchQuery('');
  };

  const users = useMemo(() => db.getUsers(), [refreshKey]);
  const loginActivatedCount = useMemo(() => users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE').length, [users]);
  const mentorAssignedCount = useMemo(() => students.filter(s => s.mentorId && s.mentorId.trim() !== '').length, [students]);

  const handleExportExcel = () => {
    const data = applications.map((app, idx) => {
      const prog = programs.find(p => p.id === app.programId);
      const dept = departments.find(d => d.id === app.departmentId) || departments.find(d => d.id === prog?.departmentId);
      const inst = institutes.find(i => i.id === app.instituteId);
      const docs = app.documents || [];
      const verifiedDocs = docs.filter(d => d.status === 'VERIFIED').length;

      return {
        'Sr.': idx + 1,
        'Application No': app.applicationNumber || app.id,
        'Student Name': app.applicantName,
        'Admission Date': app.submittedAt || '2026-06-01',
        'Institute': inst?.name || 'SSCIT',
        'Program': prog?.name || 'B.Tech Program',
        'Department': dept?.name || 'Computer Engineering',
        'Admission Status': app.status,
        'Document Status': `${verifiedDocs}/${docs.length} Verified`,
        'Fee Status': app.isFeePaid ? `Paid (₹${app.feeAmountPaid || 45000})` : 'Pending',
        'Mentor Status': app.studentId ? 'Assigned' : 'Pending',
        'ERP Account': app.studentUserId ? 'Active' : 'Not Created',
        'Enrollment No': app.enrollmentNo || '—',
        'Overall Status': app.onboardingStatus || 'PENDING'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Onboarding Register');
    XLSX.writeFile(wb, `SSIU_Student_Onboarding_Register_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', `Exported ${data.length} records to Excel.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div style={{
          padding: '0.75rem 1rem',
          background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: toast.type === 'success' ? '#047857' : '#B91C1C',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      {/* ── 1. DEDICATED ONBOARDING WORKSPACE HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: '10px',
        color: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(11,25,44,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.8px', color: '#F37023', textTransform: 'uppercase' }}>
              SSIU ERP • UNIVERSITY MANAGEMENT SYSTEM
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>•</span>
            <span style={{
              background: '#F37023',
              color: '#FFFFFF',
              fontSize: '0.6875rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Admission &amp; Onboarding Officer
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Student Administration &amp; Onboarding
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', margin: '4px 0 0 0' }}>
            Admission verification, student master creation, mentor assignment and ERP account activation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSelectedAppForForm(null);
              setSelectedDraftStudent(null);
              setIsOnboardingFormOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #F37023 0%, #EA580C 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 14px rgba(243, 112, 35, 0.4)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
            title="Create and Onboard a Student"
          >
            <UserPlus size={16} strokeWidth={2.5} /> + Add Student
          </button>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Session</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#F5A623' }}>Academic Year 2026–27</div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', color: '#0B192C', fontWeight: 700 }}
          >
            <Download size={14} /> Export Register (.xlsx)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700 }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* ── 2. CLICKABLE STAT CARDS (8 ONBOARDING METRICS) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <div 
          onClick={() => {
            handleResetFilters();
            setActiveTab('APPLICATIONS');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Total Applications"
            value={stats.totalAdmissions.toString()}
            icon={Users}
            subtitle="All applicant records"
            colorScheme="navy"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setAdmissionStatusFilter('APPROVED');
            setActiveTab('APPLICATIONS');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Confirmed Admissions"
            value={stats.confirmed.toString()}
            icon={CheckCircle2}
            subtitle="Approved admissions"
            colorScheme="green"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setDocumentStatusFilter('PENDING');
            setActiveTab('DOC_VERIFICATION');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Document Pending"
            value={stats.docPending.toString()}
            icon={FileCheck}
            subtitle="Document review"
            colorScheme="orange"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setFeeStatusFilter('PENDING');
            setActiveTab('FEE_VERIFICATION');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Fee Pending"
            value={stats.feePending.toString()}
            icon={IndianRupee}
            subtitle="Payment verification"
            colorScheme="gold"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setOnboardingStatusFilter('READY');
            setActiveTab('APPLICATIONS');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Ready to Onboard"
            value={stats.readyForOnboarding.toString()}
            icon={ShieldCheck}
            subtitle="Prerequisites fulfilled"
            colorScheme="green"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setOnboardingStatusFilter('ONBOARDED');
            setActiveTab('APPLICATIONS');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Onboarded"
            value={stats.onboarded.toString()}
            icon={GraduationCap}
            subtitle="Student master created"
            colorScheme="navy"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setActiveTab('ACCOUNT_ACTIVATION');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Login Activated"
            value={loginActivatedCount.toString()}
            icon={KeyRound}
            subtitle="Active student accounts"
            colorScheme="navy"
          />
        </div>

        <div 
          onClick={() => {
            handleResetFilters();
            setActiveTab('MENTOR_ASSIGNMENT');
          }}
          style={{ cursor: 'pointer' }}
        >
          <StatCard
            title="Mentor Assigned"
            value={mentorAssignedCount.toString()}
            icon={UserPlus}
            subtitle="Counselor assigned"
            colorScheme="blue"
          />
        </div>
      </div>

      {/* ── 3. WORKSPACE SUB-TABS NAVIGATION ── */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        borderBottom: '1px solid var(--border-color, #E2E8F0)',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'DASHBOARD', label: 'Overview', icon: BarChart3 },
          { id: 'APPLICATIONS', label: `Onboarding Queue (${applications.length})`, icon: Layers },
          { id: 'STUDENT_CREATION', label: 'Student Creation', icon: UserPlus },
          { id: 'STUDENTS_DIRECTORY', label: `Student Master (${students.length})`, icon: GraduationCap },
          { id: 'MENTOR_ASSIGNMENT', label: 'Mentor Assignment', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.id as StudentAdminTab)}
              style={{
                fontSize: '0.75rem',
                fontWeight: isActive ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--brand-navy, #0B192C)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-color, #334155)'
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 4. TAB CONTENT: CENTRAL ONBOARDING QUEUE ── */}
      {(activeTab === 'APPLICATIONS' || activeTab === 'DOC_VERIFICATION' || activeTab === 'FEE_VERIFICATION' || activeTab === 'DASHBOARD') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Multi-Criteria Filters Bar */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              
              {/* Search Box */}
              <div style={{ gridColumn: 'span 2', minWidth: '220px', position: 'relative' }}>
                <Search size={14} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Name, App No, Enrollment No, Email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.75rem', height: '34px' }}
                />
              </div>

              {/* Academic Year Filter */}
              <div>
                <select className="form-control" value={academicYearFilter} onChange={e => setAcademicYearFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Academic Years</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>

              {/* Institute Filter */}
              <div>
                <select className="form-control" value={instituteFilter} onChange={e => setInstituteFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Institutes</option>
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              {/* Program Filter */}
              <div>
                <select className="form-control" value={programFilter} onChange={e => setProgramFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Programs</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <select className="form-control" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <select className="form-control" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Semesters</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{`Semester ${s.number}`}</option>)}
                </select>
              </div>

              {/* Admission Status */}
              <div>
                <select className="form-control" value={admissionStatusFilter} onChange={e => setAdmissionStatusFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">Admission Status</option>
                  <option value="APPROVED">APPROVED / CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="DOCUMENT_VERIFICATION">DOC VERIFICATION</option>
                  <option value="FEE_PENDING">FEE PENDING</option>
                  <option value="HOLD">HOLD</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CONVERTED">ONBOARDED</option>
                </select>
              </div>

              {/* Onboarding Status */}
              <div>
                <select className="form-control" value={onboardingStatusFilter} onChange={e => setOnboardingStatusFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">Onboarding Status</option>
                  <option value="READY">READY TO ONBOARD</option>
                  <option value="ONBOARDED">ONBOARDED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="HOLD">HOLD</option>
                </select>
              </div>

              {/* Reset */}
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ width: '100%', height: '34px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* 13-Column Central Onboarding Register Table */}
          <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="var(--brand-orange, #F37023)" /> Student Onboarding Register
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                Showing {applications.length} applicant records
              </span>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Application No.</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Student Name</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Program</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Department</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Admission Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Document Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Fee Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Mentor</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Enrollment No.</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Login Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Onboarding Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted, #64748B)' }}>
                        No admission applications match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const prog = programs.find(p => p.id === app.programId);
                      const dept = departments.find(d => d.id === app.departmentId) || departments.find(d => d.id === prog?.departmentId);
                      const st = students.find(s => s.id === app.studentId || s.enrollmentNo === app.enrollmentNo);
                      const mentor = facultyMembers.find(f => f.id === st?.mentorId);
                      const docs = app.documents || [];
                      const verifiedDocs = docs.filter(d => d.status === 'VERIFIED').length;
                      const areDocsDone = docs.length > 0 && verifiedDocs === docs.length;
                      const isOnboarded = app.status === 'CONVERTED' || app.status === 'ONBOARDED' || app.onboardingStatus === 'ONBOARDED';
                      const readiness = studentOnboardingService.evaluateReadiness(app);
                      const studentUser = users.find(u => u.username === app.enrollmentNo || u.id === app.studentId);

                      return (
                        <tr key={app.id} style={{ borderBottom: '1px solid var(--border-light, #F1F5F9)' }}>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>
                              {app.applicationNumber || app.id}
                            </code>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <strong style={{ color: 'var(--brand-navy, #0B192C)', display: 'block' }}>{app.applicantName}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>{app.email}</span>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>{prog?.name?.replace('B.Tech ', '') || 'B.Tech'}</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>{dept?.code || 'CSE'}</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <Badge variant={app.status === 'APPROVED' || app.status === 'ADMISSION_CONFIRMED' ? 'active' : 'navy'}>
                              {app.status === 'APPROVED' ? 'CONFIRMED' : app.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <Badge variant={areDocsDone ? 'active' : 'orange'}>
                              {verifiedDocs}/{docs.length} Verified
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <Badge variant={app.isFeePaid ? 'active' : 'gold'}>
                              {app.isFeePaid ? 'Paid' : 'Pending'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {mentor?.name || (st?.mentorId ? 'Assigned' : 'Unassigned')}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            {app.enrollmentNo ? <code style={{ color: 'var(--brand-orange, #F37023)', fontWeight: 800 }}>{app.enrollmentNo}</code> : <span style={{ color: '#94A3B8' }}>—</span>}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <Badge variant={studentUser?.status === 'ACTIVE' ? 'active' : 'navy'}>
                              {studentUser?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <Badge variant={isOnboarded ? 'active' : readiness.isReady ? 'active' : 'orange'}>
                              {isOnboarded ? 'ONBOARDED' : readiness.isReady ? 'READY' : 'PENDING'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => setSelectedAppForDossier(app)}
                                title="View Complete Admission Dossier"
                              >
                                <Eye size={12} /> View
                              </button>

                              {!areDocsDone && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => setSelectedAppForStepper(app)}
                                  style={{ fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '2px' }}
                                  title="Verify Admission Documents"
                                >
                                  <FileCheck size={11} /> Verify Docs
                                </button>
                              )}

                              {!app.isFeePaid && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => setSelectedAppForStepper(app)}
                                  style={{ fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '2px' }}
                                  title="Verify Fee Receipt"
                                >
                                  <IndianRupee size={11} /> Verify Fee
                                </button>
                              )}

                              {!isOnboarded ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => setSelectedAppForStepper(app)}
                                  style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}
                                  title="Start 8-Step Onboarding Stepper"
                                >
                                  <Sparkles size={11} /> Onboard
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => {
                                    if (st) setSelectedStudentForProfile(st);
                                  }}
                                  style={{ color: '#059669', fontWeight: 700 }}
                                >
                                  <CheckCircle2 size={12} /> Profile
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── 5. TAB CONTENT: ONBOARDING REGISTER ── */}
      {activeTab === 'ONBOARDING_REGISTER' && (
        <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                Master University Student Onboarding Register (2026–27)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                Complete audited ledger of onboarded students, assigned mentors, and active ERP logins.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Download size={14} /> Download Register (.xlsx)
            </button>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Sr.</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Enrollment No.</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Student Name</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Institute &amp; Program</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Department</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Admission Date</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Assigned Mentor</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Fee Status</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Onboarded By</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>ERP Status</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{idx + 1}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <code style={{ fontWeight: 800, color: '#047857' }}>{item.enrollmentNo}</code>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.studentName}</strong>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{item.programName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{item.departmentName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{item.date}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>Prof. Dr. Bhavin Patel</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><Badge variant="active">Confirmed</Badge></td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{item.onboardedBy}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><Badge variant="active">Active Login</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. TAB CONTENT: MENTOR ASSIGNMENT DESK ── */}
      {activeTab === 'MENTOR_ASSIGNMENT' && (
        <div className="card" style={{ padding: '1rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                Faculty Mentorship &amp; Workload Allocation Desk
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                Verify department faculty mentorship capacity and assign verified students to mentors.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)' }}>
                  <th>Faculty Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Active Mentee Count</th>
                  <th>Capacity Limit</th>
                  <th>Workload Status</th>
                </tr>
              </thead>
              <tbody>
                {facultyMembers.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.designation || 'Associate Professor'}</td>
                    <td>Computer Engineering</td>
                    <td>14 Mentees</td>
                    <td>25 Max</td>
                    <td><Badge variant="active">Capacity Available</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6b. TAB CONTENT: STUDENT ID & UNIVERSITY ENROLLMENT DESK ── */}
      {activeTab === 'ENROLLMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard
              title="Total Enrolled Students"
              value={students.length}
              icon={GraduationCap}
              colorScheme="navy"
              subtitle="All registered student masters"
            />
            <StatCard
              title="Temporary Enrollment"
              value={students.filter(s => s.enrollmentStatus === 'TEMPORARY' || s.enrollmentNo?.startsWith('TEMP-')).length}
              icon={Clock}
              colorScheme="orange"
              subtitle="Provisional student accounts"
            />
            <StatCard
              title="Final Enrollment Assigned"
              value={students.filter(s => s.enrollmentStatus === 'FINAL' || s.finalEnrollmentNumber).length}
              icon={ShieldCheck}
              colorScheme="green"
              subtitle="Permanent institutional IDs"
            />
            <StatCard
              title="Pending Final Conversion"
              value={students.filter(s => s.enrollmentStatus !== 'FINAL' && !s.finalEnrollmentNumber).length}
              icon={KeyRound}
              colorScheme="navy"
              subtitle="Awaiting registrar final allocation"
            />
          </div>

          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ gridColumn: 'span 2', minWidth: '240px', position: 'relative' }}>
                <Search size={14} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Name, Temp Enrollment, Final Enrollment, ID..."
                  value={enrollmentSearchQuery}
                  onChange={e => setEnrollmentSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.8125rem', height: '36px' }}
                />
              </div>

              <div>
                <select
                  className="form-control"
                  value={enrollmentTabStatusFilter}
                  onChange={e => setEnrollmentTabStatusFilter(e.target.value as any)}
                  style={{ fontSize: '0.8125rem', height: '36px' }}
                >
                  <option value="ALL">All Enrollment Statuses</option>
                  <option value="TEMPORARY">Temporary Enrollment Only</option>
                  <option value="FINAL">Final Enrollment Only</option>
                </select>
              </div>

              <div>
                <select
                  className="form-control"
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  style={{ fontSize: '0.8125rem', height: '36px' }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Students Enrollment Ledger Table */}
          <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                  Student Enrollment &amp; Access Code Registry
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                  Manage temporary provisional numbers, assign official final university enrollments, and regenerate access codes.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)' }}>
                    <th style={{ padding: '0.75rem' }}>Student Details</th>
                    <th style={{ padding: '0.75rem' }}>Temporary Enrollment</th>
                    <th style={{ padding: '0.75rem' }}>5-Digit Access Code</th>
                    <th style={{ padding: '0.75rem' }}>Final Enrollment</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Department &amp; Program</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter(s => {
                      if (enrollmentTabStatusFilter === 'TEMPORARY') {
                        if (s.enrollmentStatus === 'FINAL' || s.finalEnrollmentNumber) return false;
                      }
                      if (enrollmentTabStatusFilter === 'FINAL') {
                        if (s.enrollmentStatus !== 'FINAL' && !s.finalEnrollmentNumber) return false;
                      }
                      if (departmentFilter !== 'ALL' && s.departmentId !== departmentFilter) return false;
                      if (enrollmentSearchQuery) {
                        const q = enrollmentSearchQuery.toLowerCase();
                        const nameMatch = s.name?.toLowerCase().includes(q);
                        const enrollMatch = s.enrollmentNo?.toLowerCase().includes(q);
                        const tempMatch = s.temporaryEnrollmentNumber?.toLowerCase().includes(q);
                        const finalMatch = s.finalEnrollmentNumber?.toLowerCase().includes(q);
                        const idMatch = s.id?.toLowerCase().includes(q);
                        if (!nameMatch && !enrollMatch && !tempMatch && !finalMatch && !idMatch) return false;
                      }
                      return true;
                    })
                    .map(s => {
                      const prog = programs.find(p => p.id === s.programId);
                      const dept = departments.find(d => d.id === s.departmentId);
                      const isFinal = s.enrollmentStatus === 'FINAL' || Boolean(s.finalEnrollmentNumber);
                      const tempNo = s.temporaryEnrollmentNumber || (s.enrollmentNo.startsWith('TEMP-') ? s.enrollmentNo : 'TEMP-2026-00001');
                      const accessCode = s.studentAccessCode || '48271';

                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img
                                src={s.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                                alt=""
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <strong style={{ color: 'var(--brand-navy, #0B192C)', display: 'block' }}>{s.name}</strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', fontFamily: 'monospace' }}>ID: {s.id}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <code style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>
                              {tempNo}
                            </code>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <code style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', letterSpacing: '1px' }}>
                                {accessCode}
                              </code>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                title="Copy Access Code"
                                onClick={() => {
                                  navigator.clipboard.writeText(accessCode);
                                  showToast('success', `Access Code copied for ${s.name}`);
                                }}
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {s.finalEnrollmentNumber ? (
                              <code style={{ fontSize: '0.85rem', fontWeight: 800, color: '#047857' }}>
                                {s.finalEnrollmentNumber}
                              </code>
                            ) : (
                              <Badge variant="orange">PENDING</Badge>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <Badge variant={isFinal ? 'active' : 'orange'}>
                              {isFinal ? 'FINAL ENROLLMENT' : 'TEMPORARY ENROLLMENT'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{dept?.name || 'Department'}</span>
                              <div style={{ color: 'var(--text-muted, #64748B)' }}>{prog?.name || 'Program'}</div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                              {!isFinal && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => {
                                    setSelectedStudentForFinalAssign(s);
                                    setAssignFinalModalOpen(true);
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800 }}
                                >
                                  <KeyRound size={12} /> Assign Final ID
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                title="Regenerate 5-digit Access Code"
                                onClick={() => {
                                  if (user) {
                                    const res = studentOnboardingService.resetStudentAccessCode(s.id, user, 'Admin requested access code regeneration');
                                    if (res.success) {
                                      showToast('success', res.message);
                                      setRefreshKey(k => k + 1);
                                    }
                                  }
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <RefreshCw size={12} /> Reset Code
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => setSelectedStudentForProfile(s)}
                                title="View Student Dossier"
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 6c. TAB CONTENT: ERP ACCOUNTS & ACTIVATION DESK ── */}
      {activeTab === 'ACCOUNT_ACTIVATION' && (
        <div className="card" style={{ padding: '1rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                Student ERP Login Accounts &amp; Activation Status
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                Single canonical master record and instant department auto-sync for all verified students.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('ENROLLMENT')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <KeyRound size={14} /> Open Enrollment Desk
            </button>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)' }}>
                  <th>Student Name</th>
                  <th>Temporary Enrollment</th>
                  <th>Login Username</th>
                  <th>Department Sync</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td><strong>{s.name}</strong></td>
                    <td><code>{s.temporaryEnrollmentNumber || s.enrollmentNo}</code></td>
                    <td><code>{s.erpUsername || s.enrollmentNo}</code></td>
                    <td><Badge variant="active">SYNCED TO DEPARTMENT</Badge></td>
                    <td><Badge variant="active">{s.erpAccountStatus || 'ACTIVE'}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setSelectedStudentForProfile(s)}
                      >
                        <Eye size={12} /> View Master
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 7. TAB CONTENT: STUDENTS DIRECTORY ── */}
      {activeTab === 'STUDENTS_DIRECTORY' && (
        <div className="card" style={{ padding: '1rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Enrolled Students Master Directory ({students.length})
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)' }}>
                  <th>Enrollment No.</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td><code>{s.enrollmentNo}</code></td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>Computer Engineering</td>
                    <td><Badge variant="active">{s.status}</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setSelectedStudentForProfile(s)}
                      >
                        <Eye size={12} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 8. TAB CONTENT: REPORTS ── */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
              Onboarding Completion Summary
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Candidate Applications:</span>
                <strong>{stats.totalAdmissions}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Approved &amp; Confirmed:</span>
                <strong style={{ color: '#059669' }}>{stats.confirmed}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Successfully Onboarded:</span>
                <strong style={{ color: '#047857' }}>{stats.onboarded}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending Verification:</span>
                <strong style={{ color: '#D97706' }}>{stats.docPending + stats.feePending}</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
              Export Options
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={14} /> Download Comprehensive Register (.xlsx)
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={14} /> Print Formal University Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. TAB CONTENT: NOTIFICATIONS ── */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
            Admission &amp; Onboarding Notification Stream
          </h3>
          <div style={{ padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', fontSize: '0.8125rem' }}>
            <strong>🎉 Student Account Activated:</strong> Onboarded candidate Neha Patel (2601010042) • Credentials dispatched via in-app notification.
          </div>
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8125rem' }}>
            <strong>📋 Faculty Mentor Assigned:</strong> Dr. Bhavin Patel assigned as mentor for Batch 2026 candidates.
          </div>
        </div>
      )}

      {/* ── 4B. TAB CONTENT: STUDENT CREATION DESK ── */}
      {activeTab === 'STUDENT_CREATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Header Card for Student Creation */}
          <div className="card" style={{
            padding: '1.25rem 1.5rem',
            background: '#FFFFFF',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={22} color="var(--brand-orange, #F37023)" /> Student Creation
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0' }}>
                Create and onboard a new student with complete academic, personal, contact, parent, address and document information.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSelectedDraftStudent(null);
                setSelectedAppForForm(null);
                setIsOnboardingFormOpen(true);
              }}
              style={{
                background: 'var(--brand-orange, #F37023)',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.1rem',
                boxShadow: '0 2px 8px rgba(243,112,35,0.25)'
              }}
            >
              <UserPlus size={16} /> + Add / Onboard Student
            </button>
          </div>

          {/* Filters Bar */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              <div style={{ gridColumn: 'span 2', minWidth: '220px', position: 'relative' }}>
                <Search size={14} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Student Name, Student ID, App No, Enrollment No..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.75rem', height: '34px' }}
                />
              </div>

              <div>
                <select className="form-control" value={academicYearFilter} onChange={e => setAcademicYearFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Academic Years</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>

              <div>
                <select className="form-control" value={instituteFilter} onChange={e => setInstituteFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Institutes</option>
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <select className="form-control" value={programFilter} onChange={e => setProgramFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Programs</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <select className="form-control" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <select className="form-control" value={onboardingStatusFilter} onChange={e => setOnboardingStatusFilter(e.target.value)} style={{ fontSize: '0.75rem', height: '34px' }}>
                  <option value="ALL">All Statuses</option>
                  <option value="ONBOARDED">ONBOARDED</option>
                  <option value="READY">READY</option>
                  <option value="ONBOARDING_DRAFT">DRAFT</option>
                  <option value="PENDING">PENDING</option>
                  <option value="HOLD">HOLD</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ width: '100%', height: '34px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* 12-Column Table */}
          <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="var(--brand-orange, #F37023)" /> Student Creation Master List
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                Showing student records and admission candidates
              </span>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Application No.</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Student Name</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Program</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Institute</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Department</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Academic Year</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Admission Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Document Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Fee Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Onboarding Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creationDeskList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <code style={{ fontWeight: 700, color: 'var(--brand-orange, #F37023)' }}>{item.applicationNumber}</code>
                        {item.studentId && (
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)' }}>
                            ID: {item.studentId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <strong style={{ color: 'var(--brand-navy, #0B192C)', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.email}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>{item.programName}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>{item.instituteCode}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>{item.departmentCode}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>{item.academicYearName}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <Badge variant={item.admissionStatus === 'Admission Confirmed' ? 'active' : item.admissionStatus === 'Rejected' ? 'danger' : 'orange'}>
                          {item.admissionStatus}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <Badge variant={item.documentStatus === 'Documents Verified' ? 'active' : 'orange'}>
                          {item.documentStatus}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <Badge variant={item.feeStatus === 'Fee Verified' ? 'active' : 'orange'}>
                          {item.feeStatus}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <Badge variant={item.onboardingStatus === 'Onboarded' ? 'active' : item.onboardingStatus === 'Ready to Onboard' ? 'active' : item.onboardingStatus === 'Onboarding Draft' ? 'gold' : item.onboardingStatus === 'Rejected' ? 'danger' : 'orange'}>
                          {item.onboardingStatus}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => {
                              if (item.studentRef) {
                                setSelectedStudentForProfile(item.studentRef);
                              } else if (item.appRef) {
                                setSelectedAppForDossier(item.appRef);
                              }
                            }}
                            title="View Record"
                          >
                            <Eye size={12} /> View
                          </button>

                          {item.onboardingStatus === 'Onboarding Draft' ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => {
                                setSelectedDraftStudent(item.studentRef || null);
                                setSelectedAppForForm(item.appRef || null);
                                setIsOnboardingFormOpen(true);
                              }}
                              style={{ fontWeight: 800, background: '#D97706', border: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                              title="Edit Saved Draft"
                            >
                              <Edit3 size={11} /> Edit Draft
                            </button>
                          ) : item.onboardingStatus === 'Onboarded' ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                if (item.studentRef) setSelectedStudentForProfile(item.studentRef);
                              }}
                              style={{ color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}
                              title="View Student Profile"
                            >
                              <CheckCircle2 size={12} /> View Profile
                            </button>
                          ) : item.isEligibleForOnboarding ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => {
                                setSelectedDraftStudent(item.studentRef || null);
                                setSelectedAppForForm(item.appRef || null);
                                setIsOnboardingFormOpen(true);
                              }}
                              style={{ fontWeight: 800, background: 'var(--brand-orange, #F37023)', border: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                              title="Admission, Docs & Fee Verified — Start 7-Section Onboarding"
                            >
                              <UserPlus size={11} /> Onboard Student
                            </button>
                          ) : (
                            <span 
                              style={{ fontSize: '0.6875rem', color: '#94A3B8', fontStyle: 'italic', padding: '2px 4px' }}
                              title="Prerequisites not met: Requires Admission Confirmed + Documents Verified + Fee Verified"
                            >
                              Prerequisites Pending
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── MODALS ── */}

      {/* 11-Step Comprehensive Student Onboarding Wizard Form Modal */}
      {isOnboardingFormOpen && (
        <StudentOnboardingFormModal
          isOpen={isOnboardingFormOpen}
          onClose={() => {
            setIsOnboardingFormOpen(false);
            setSelectedDraftStudent(null);
            setSelectedAppForForm(null);
          }}
          initialDraftStudent={selectedDraftStudent}
          initialApplication={selectedAppForForm}
          onSuccess={(student) => {
            showToast('success', `Student ${student.name} (${student.enrollmentNo}) onboarded successfully.`);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* 8-Step Interactive Onboarding Stepper */}
      {selectedAppForStepper && (
        <StudentOnboardingStepperModal
          isOpen={Boolean(selectedAppForStepper)}
          onClose={() => setSelectedAppForStepper(null)}
          application={selectedAppForStepper}
          onSuccess={(res) => {
            showToast('success', res.message);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* Detailed Pre-Onboarding Dossier */}
      {selectedAppForDossier && (
        <StudentApplicantDetailModal
          isOpen={Boolean(selectedAppForDossier)}
          onClose={() => setSelectedAppForDossier(null)}
          application={selectedAppForDossier}
          onRefresh={() => setRefreshKey(k => k + 1)}
          onOpenOnboard={(app) => setSelectedAppForStepper(app)}
        />
      )}

      {/* Student Master Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={Boolean(selectedStudentForProfile)}
          onClose={() => setSelectedStudentForProfile(null)}
          student={selectedStudentForProfile}
        />
      )}

      {/* Assign Final Enrollment Modal */}
      {assignFinalModalOpen && (
        <FinalEnrollmentAssignModal
          isOpen={assignFinalModalOpen}
          onClose={() => {
            setAssignFinalModalOpen(false);
            setSelectedStudentForFinalAssign(null);
          }}
          student={selectedStudentForFinalAssign}
          onSuccess={(updatedStudent) => {
            showToast('success', `Student ${updatedStudent.name} successfully converted to Final Enrollment ${updatedStudent.finalEnrollmentNumber}!`);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

    </div>
  );
};
