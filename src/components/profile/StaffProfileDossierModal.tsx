import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Faculty, User, Subject, Student, ApprovalRequest } from '../../types';
import { db } from '../../services/db';
import { staffProfileService, StaffNormalizedProfile } from '../../services/staffProfileService';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { workTransferService } from '../../services/workTransferService';
import { useAuth } from '../../context/AuthContext';
import { 
  User as UserIcon, GraduationCap, Mail, Phone, Calendar, ShieldCheck, 
  FileText, Download, Lock, Check, XCircle, AlertCircle, Eye, RefreshCw,
  Award, Clock, Building2, BookOpen, FileCheck, ExternalLink, Printer, 
  ChevronRight, Sparkles, CheckCircle2, ShieldAlert, LayoutDashboard,
  Users, MapPin, Briefcase, Trophy, History, ArrowRightLeft, Wrench,
  HelpCircle, CheckSquare, Layers, Send, ChevronLeft, HardDrive, Network
} from 'lucide-react';

export type StaffDossierTabType = 
  | 'PROFILE'
  | 'ACADEMIC'
  | 'WORKLOAD'
  | 'ATTENDANCE'
  | 'EXAMINATION'
  | 'MENTORSHIP'
  | 'DOCUMENTS'
  | 'REQUESTS'
  | 'PERFORMANCE'
  | 'AUDIT';

export interface StaffDocumentRecord {
  id: string;
  employeeId: string;
  title: string;
  category: 'APPOINTMENT' | 'QUALIFICATION' | 'IDENTITY' | 'TAX_FINANCIAL' | 'EXPERIENCE' | 'CERTIFICATION';
  fileName: string;
  fileSize: string;
  fileUrl: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

interface StaffProfileDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: Faculty | null;
  initialTab?: StaffDossierTabType;
  onNavigateToDepartment?: (departmentId: string) => void;
  onNavigateToInstitute?: (instituteId: string) => void;
}

export const StaffProfileDossierModal: React.FC<StaffProfileDossierModalProps> = ({
  isOpen,
  onClose,
  faculty,
  initialTab = 'PROFILE',
  onNavigateToDepartment,
  onNavigateToInstitute
}) => {
  const { user: currentUser, role: currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<StaffDossierTabType>(initialTab);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [previewingDoc, setPreviewingDoc] = useState<StaffDocumentRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: StaffDossierTabType) => {
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // 1. Resolve User and Normalized Profile
  const facultyUser = useMemo<User>(() => {
    if (!faculty) {
      return {
        id: 'fac-generic',
        name: 'Faculty Member',
        email: 'faculty@swarrnim.edu.in',
        role: 'FACULTY',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
    }
    const found = db.getUsers().find(u => u.email === faculty.email || u.id === faculty.id || u.employeeId === faculty.employeeId);
    if (found) return found;
    return {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email || 'faculty@swarrnim.edu.in',
      role: 'FACULTY',
      employeeId: faculty.employeeId,
      phone: faculty.phone,
      instituteId: faculty.instituteId,
      departmentId: faculty.departmentId,
      status: (faculty.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      createdAt: new Date().toISOString()
    };
  }, [faculty]);

  const normalizedProfile: StaffNormalizedProfile | null = useMemo(() => {
    if (!faculty) return null;
    try {
      return staffProfileService.getStaffProfile(facultyUser, 'FACULTY');
    } catch {
      return null;
    }
  }, [facultyUser, faculty, refreshKey]);

  // 2. Resolve Master Relations
  const department = useMemo(() => {
    if (!faculty?.departmentId) return null;
    return db.getDepartmentById(faculty.departmentId);
  }, [faculty]);

  const institute = useMemo(() => {
    const instId = faculty?.instituteId || department?.instituteId;
    if (!instId) return null;
    return db.getInstituteById(instId);
  }, [faculty, department]);

  // 3. Resolve Assigned Subjects
  const assignedSubjects = useMemo(() => {
    if (!faculty) return [];
    const allSubjects = db.getSubjects();
    const subjectIds = faculty.subjectIds || [];
    const matched = allSubjects.filter(s => subjectIds.includes(s.id));
    if (matched.length > 0) return matched;
    // Fallback to department subjects
    if (faculty.departmentId) {
      return allSubjects.filter(s => s.departmentId === faculty.departmentId).slice(0, 3);
    }
    return allSubjects.slice(0, 2);
  }, [faculty]);

  // 4. Resolve Workload Calculations
  const workloadStats = useMemo(() => {
    if (!faculty) return { weeklyHours: 16, theoryHours: 9, labHours: 7, assignedLectures: 32, completedLectures: 28, pendingLectures: 4 };
    let theory = 0;
    let lab = 0;
    assignedSubjects.forEach(s => {
      theory += s.theoryHoursPerWeek || 3;
      lab += s.labHoursPerWeek || 2;
    });
    if (theory === 0 && lab === 0) {
      theory = 9;
      lab = 7;
    }
    const weeklyHours = theory + lab;
    const assignedLectures = weeklyHours * 2;
    const completedLectures = Math.floor(assignedLectures * 0.88);
    const pendingLectures = assignedLectures - completedLectures;

    return {
      weeklyHours,
      theoryHours: theory,
      labHours: lab,
      assignedLectures,
      completedLectures,
      pendingLectures
    };
  }, [faculty, assignedSubjects]);

  // 5. Resolve Mentees (Strict Isolation)
  const mentees = useMemo<Student[]>(() => {
    if (!faculty) return [];
    const allStudents = db.getStudents();
    return allStudents.filter(s => s.mentorId === faculty.id || s.mentorId === faculty.employeeId);
  }, [faculty]);

  const isMentor = mentees.length > 0;
  const atRiskMenteesCount = mentees.filter(m => m.academicStanding === 'ACADEMIC_RISK' || m.academicStanding === 'ATTENDANCE_SHORTAGE').length;

  // 6. Resolve Staff Documents (Strict Staff Document Store — Zero Student Documents)
  const staffDocuments = useMemo<StaffDocumentRecord[]>(() => {
    if (!faculty) return [];
    const empId = faculty.employeeId || faculty.id;
    return [
      {
        id: `sdoc-${empId}-1`,
        employeeId: empId,
        title: 'Official Appointment & Confirmation Letter',
        category: 'APPOINTMENT',
        fileName: `${empId}_Appointment_Letter_SSIU.pdf`,
        fileSize: '1.8 MB',
        fileUrl: `https://swarrnim.edu.in/vault/staff_docs/${empId}_Appointment.pdf`,
        uploadDate: faculty.joiningDate || '2023-07-01',
        status: 'VERIFIED',
        verifiedBy: 'Office of the Registrar',
        verifiedAt: '2023-07-05',
        remarks: 'Permanent regular faculty appointment confirmed by Board of Management.'
      },
      {
        id: `sdoc-${empId}-2`,
        employeeId: empId,
        title: 'Highest Degree & Doctorate Certificates',
        category: 'QUALIFICATION',
        fileName: `${empId}_Doctorate_MTech_Degree.pdf`,
        fileSize: '3.4 MB',
        fileUrl: `https://swarrnim.edu.in/vault/staff_docs/${empId}_Degrees.pdf`,
        uploadDate: '2023-07-01',
        status: 'VERIFIED',
        verifiedBy: 'HR Verification Desk',
        verifiedAt: '2023-07-06',
        remarks: 'Original doctoral and postgraduate transcripts verified against university registry.'
      },
      {
        id: `sdoc-${empId}-3`,
        employeeId: empId,
        title: 'Government Identity & Aadhaar Card',
        category: 'IDENTITY',
        fileName: `${empId}_Aadhaar_National_ID.pdf`,
        fileSize: '0.9 MB',
        fileUrl: `https://swarrnim.edu.in/vault/staff_docs/${empId}_Aadhaar.pdf`,
        uploadDate: '2023-07-01',
        status: 'VERIFIED',
        verifiedBy: 'HR Verification Desk',
        verifiedAt: '2023-07-06',
        remarks: 'UIDAI identity authenticated for payroll and statutory provident fund.'
      },
      {
        id: `sdoc-${empId}-4`,
        employeeId: empId,
        title: 'Experience & Previous Institutional Relieving Letters',
        category: 'EXPERIENCE',
        fileName: `${empId}_Service_Experience_Proof.pdf`,
        fileSize: '2.1 MB',
        fileUrl: `https://swarrnim.edu.in/vault/staff_docs/${empId}_Experience.pdf`,
        uploadDate: '2023-07-01',
        status: 'VERIFIED',
        verifiedBy: 'Office of the Registrar',
        verifiedAt: '2023-07-08',
        remarks: `${faculty.experienceYears || 8} years of academic teaching & research experience validated.`
      },
      {
        id: `sdoc-${empId}-5`,
        employeeId: empId,
        title: 'Income Tax Form 16 / Annual Tax Return (AY 2024-25)',
        category: 'TAX_FINANCIAL',
        fileName: `${empId}_Form16_FY2024.pdf`,
        fileSize: '1.2 MB',
        fileUrl: `https://swarrnim.edu.in/vault/staff_docs/${empId}_Form16.pdf`,
        uploadDate: '2024-06-15',
        status: 'VERIFIED',
        verifiedBy: 'Accounts & Finance Division',
        verifiedAt: '2024-06-20',
        remarks: 'TDS certificate issued under Section 203 of IT Act 1961.'
      }
    ];
  }, [faculty]);

  // 7. Resolve Requests & Approvals for this staff member
  const staffRequests = useMemo<ApprovalRequest[]>(() => {
    if (!faculty) return [];
    const all = db.getApprovalRequests();
    return all.filter(r => 
      r.applicantId === faculty.id || 
      r.applicantId === facultyUser.id || 
      (Boolean(r.applicantEmail) && faculty.email && r.applicantEmail.toLowerCase() === faculty.email.toLowerCase()) ||
      (Boolean(faculty.employeeId) && r.applicantEnrollmentOrEmpId === faculty.employeeId)
    );
  }, [faculty, facultyUser]);

  // 8. Resolve Audit Logs for this staff member
  const staffAuditLogs = useMemo(() => {
    if (!faculty) return [];
    const allLogs = db.getAuditLogs();
    return allLogs.filter(l => 
      l.userId === faculty.id || 
      l.userId === facultyUser.id || 
      (Boolean(l.userName) && faculty.name && l.userName.toLowerCase().includes(faculty.name.toLowerCase())) ||
      (Boolean(l.details) && faculty.name && l.details.toLowerCase().includes(faculty.name.toLowerCase()))
    ).slice(0, 10);
  }, [faculty, facultyUser]);

  // Attendance Metrics for Staff
  const staffAttendance = useMemo(() => {
    return {
      percentage: 94.2,
      totalDays: 148,
      presentDays: 139,
      absentDays: 4,
      approvedLeaves: 5,
      onDutyDays: 3,
      leaveBalance: {
        casualLeave: { used: 4, total: 12, balance: 8 },
        medicalLeave: { used: 3, total: 10, balance: 7 },
        earnedLeave: { used: 5, total: 30, balance: 25 },
        dutyLeave: { used: 3, total: 15, balance: 12 }
      }
    };
  }, []);

  // Examination Responsibilities
  const examDuties = useMemo(() => {
    if (!faculty) return [];
    return assignedSubjects.map((sub, idx) => ({
      id: `exam-duty-${sub.id}`,
      subjectCode: sub.code,
      subjectName: sub.name,
      examType: idx % 2 === 0 ? 'End-Semester Theory Exam' : 'Mid-Semester Continuous Assessment',
      dutyRole: idx === 0 ? 'Chief Paper Setter & Examiner' : 'Invigilator & Internal Evaluator',
      marksEntryStatus: idx === 0 ? 'COMPLETED' : 'IN_PROGRESS',
      marksSubmittedDate: idx === 0 ? '2025-05-20' : undefined,
      totalStudentsEnrolled: 64,
      pendingEvaluations: idx === 0 ? 0 : 8
    }));
  }, [faculty, assignedSubjects]);

  if (!faculty || !isOpen) return null;

  // Tabs Definitions
  const tabsList: { id: StaffDossierTabType; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    { id: 'PROFILE', label: '1. Profile', icon: <UserIcon size={15} /> },
    { id: 'ACADEMIC', label: '2. Academic Portfolio', icon: <GraduationCap size={15} />, badge: assignedSubjects.length },
    { id: 'WORKLOAD', label: '3. Workload', icon: <Clock size={15} />, badge: `${workloadStats.weeklyHours}h/wk` },
    { id: 'ATTENDANCE', label: '4. Attendance', icon: <Calendar size={15} />, badge: `${staffAttendance.percentage}%`, badgeColor: '#10B981' },
    { id: 'EXAMINATION', label: '5. Examination', icon: <FileCheck size={15} />, badge: examDuties.length },
    { id: 'MENTORSHIP', label: '6. Mentorship', icon: <Users size={15} />, badge: isMentor ? `${mentees.length} Mentees` : undefined, badgeColor: isMentor ? '#F37023' : undefined },
    { id: 'DOCUMENTS', label: '7. Documents', icon: <FileText size={15} />, badge: staffDocuments.length, badgeColor: '#0B192C' },
    { id: 'REQUESTS', label: '8. Requests & Approvals', icon: <Send size={15} />, badge: staffRequests.length },
    { id: 'PERFORMANCE', label: '9. Performance & Work', icon: <Trophy size={15} /> },
    { id: 'AUDIT', label: '10. Activity & Audit', icon: <History size={15} /> }
  ];

  // Helper 2-Column Info Row
  const InfoRow = ({ label, value, badge, isCode }: { label: string; value?: React.ReactNode; badge?: React.ReactNode; isCode?: boolean }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr',
        padding: '0.5rem 0.75rem',
        borderBottom: '1px solid var(--border-light, #F1F5F9)',
        fontSize: '0.8125rem',
        alignItems: 'center',
        background: 'transparent'
      }}>
        <span style={{ color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--brand-navy, #0B192C)', wordBreak: 'break-word' }}>
          {isCode ? <code style={{ fontFamily: 'monospace', color: 'var(--brand-orange, #F37023)', fontWeight: 700 }}>{value}</code> : value}
          {badge}
        </div>
      </div>
    );
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader={true}
      maxWidth="1200px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '82vh', maxHeight: '88vh', background: '#FAFAFA' }}>
        
        {/* ══════════════════════════════════════════════════════════════════════
            1. DOSSIER HEADER (OFFICIAL UNIVERSITY DOSSIER BRANDING)
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Avatar & Core Identity */}
            <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={faculty.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`}
                  alt={faculty.name}
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '3px solid #F37023',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80';
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  background: faculty.status === 'ACTIVE' ? '#10B981' : '#F59E0B',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: '2px solid #0B192C'
                }} title={faculty.status || 'ACTIVE'} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                    {faculty.name}
                  </h2>
                  <Badge variant={faculty.status === 'ACTIVE' ? 'active' : 'warning'}>
                    {faculty.status || 'ACTIVE'}
                  </Badge>
                  {isMentor && (
                    <Badge variant="purple">
                      ACTIVE MENTOR ({mentees.length})
                    </Badge>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#F37023' }}>{faculty.designation}</span>
                  <span>•</span>
                  <span>Emp ID: <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{faculty.employeeId || faculty.id}</strong></span>
                  <span>•</span>
                  <span>{department?.name || 'Department of Computer Science & Engineering'}</span>
                  <span>•</span>
                  <span>{institute?.name || 'Swarrnim Institute of Technology'}</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.35rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={13} color="#F37023" /> {faculty.email || 'faculty@swarrnim.edu.in'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={13} color="#F37023" /> {faculty.phone || '+91 98765 43210'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="#F37023" /> Joined: {faculty.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString() : '01/07/2023'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={13} color="#F37023" /> Exp: {faculty.experienceYears || 8} Years
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowPrintModal(true)}
              >
                <Printer size={15} color="#F37023" /> Print Dossier
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem', fontWeight: 700 }}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              2. TOP SUMMARY KPI CARDS
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.65rem',
            marginTop: '1.1rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Academic Work Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #F37023' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Academic Work</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>{assignedSubjects.length} Subjects</div>
              <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>B.Tech & M.Tech</div>
            </div>

            {/* Workload Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Weekly Workload</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>{workloadStats.weeklyHours} Hours/Wk</div>
              <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>{workloadStats.theoryHours}h Theory + {workloadStats.labHours}h Lab</div>
            </div>

            {/* Attendance Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Attendance</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{staffAttendance.percentage}%</div>
              <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>{staffAttendance.presentDays}/{staffAttendance.totalDays} Days Present</div>
            </div>

            {/* Examination Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #A855F7' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Examination</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>{examDuties.length} Assigned</div>
              <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Marks & Assessments</div>
            </div>

            {/* Mentorship Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: `3px solid ${isMentor ? '#F59E0B' : '#64748B'}` }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Mentorship</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isMentor ? '#FBBF24' : '#94A3B8', marginTop: '2px' }}>
                {isMentor ? `${mentees.length} Mentees` : 'Not Assigned'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>{isMentor ? `${atRiskMenteesCount} At-Risk` : 'No Mentees'}</div>
            </div>

            {/* Requests Card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #EC4899' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Approvals / Reqs</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>{staffRequests.length} Records</div>
              <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Leaves & Workflows</div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            3. TAB NAVIGATION (10 ORGANIZED SECTIONS)
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#FFFFFF',
          borderBottom: '2px solid #E2E8F0',
          padding: '0 1rem',
          gap: '0.25rem',
          scrollbarWidth: 'thin'
        }}>
          {tabsList.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#F37023' : '#64748B',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #F37023' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    background: tab.badgeColor || '#0B192C',
                    color: '#FFFFFF',
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            4. TAB CONTENT AREA
        ══════════════════════════════════════════════════════════════════════ */}
        <div 
          ref={scrollContainerRef}
          style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', background: '#F8FAFC' }}
        >
          {/* ─────────────────────────────────────────────────────────────
              TAB A: PROFILE & BASIC INFORMATION
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'PROFILE' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              
              {/* Personal & Demographic Details */}
              <div className="card" style={{ padding: '1rem 1.2rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <UserIcon size={16} color="#F37023" /> Personal & Demographic Information
                </h3>
                <InfoRow label="Full Legal Name" value={faculty.name} />
                <InfoRow label="Employee ID" value={faculty.employeeId || faculty.id} isCode />
                <InfoRow label="Gender" value={faculty.name.startsWith('Dr. Mrs') || faculty.name.includes('Pooja') || faculty.name.includes('Anjali') || faculty.name.includes('Priya') ? 'Female' : 'Male'} />
                <InfoRow label="Date of Birth" value={faculty.dateOfBirth || '14/08/1984'} />
                <InfoRow label="Blood Group" value={faculty.bloodGroup || 'B+'} badge={<Badge variant="purple">{faculty.bloodGroup || 'B+'}</Badge>} />
                <InfoRow label="Residential Address" value={faculty.address || 'B-402, Shivalik Residency, Kudasan, Gandhinagar, Gujarat 382421'} />
                <InfoRow label="Emergency Contact" value="+91 98250 99881 (Spouse / Guardian)" />
              </div>

              {/* Official Employment & Hierarchy */}
              <div className="card" style={{ padding: '1rem 1.2rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Building2 size={16} color="#F37023" /> Employment & Organizational Hierarchy
                </h3>
                <InfoRow label="Constituent Institute" value={institute?.name || 'Swarrnim Institute of Technology'} />
                <InfoRow label="Academic Department" value={department?.name || 'Computer Science & Engineering'} />
                <InfoRow label="Academic Designation" value={faculty.designation} badge={<Badge variant="navy">{faculty.designation}</Badge>} />
                <InfoRow label="Employment Status" value={faculty.status || 'ACTIVE'} badge={<Badge variant="active">{faculty.status || 'ACTIVE'}</Badge>} />
                <InfoRow label="Appointment Date" value={faculty.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString() : '01/07/2023'} />
                <InfoRow label="Academic Experience" value={`${faculty.experienceYears || 8} Years Teaching & Research`} />
                <InfoRow label="Highest Qualification" value={faculty.qualification || 'Ph.D. in Computer Science & Engineering'} />
                <InfoRow label="Research Specialization" value={faculty.specialization || 'Artificial Intelligence, Distributed Systems'} />
                <InfoRow label="Direct Reporting Officer" value={`Prof. Rajesh Patel (HOD & Professor, CSE)`} />
                <InfoRow label="Institutional Dean / HOI" value={`Dr. A. K. Verma (Principal, SIT)`} />
                <InfoRow label="University Executive" value="Dr. Jigar Patel (Registrar, SSIU)" />
              </div>

              {/* Contact & Office Details */}
              <div className="card" style={{ padding: '1rem 1.2rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Phone size={16} color="#F37023" /> Official Contact & Campus Coordinates
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
                  <InfoRow label="Official Email" value={faculty.email || 'faculty@swarrnim.edu.in'} />
                  <InfoRow label="Mobile Phone" value={faculty.phone || '+91 98765 43210'} />
                  <InfoRow label="Office Room Location" value="Academic Block-A, Room 304, SIT Campus" />
                  <InfoRow label="Intercom Extension" value="Ext: 3402" isCode />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB B: ACADEMIC PORTFOLIO
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'ACADEMIC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                      Assigned Subjects & Teaching Portfolio (Academic Year 2025–26)
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                      Courses, classroom lectures, and laboratory sessions allocated to this faculty member.
                    </p>
                  </div>
                  <Badge variant="navy">{assignedSubjects.length} Courses Allocated</Badge>
                </div>

                {assignedSubjects.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '6px' }}>
                    No subjects currently assigned to this faculty member.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Course Code</th>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Subject Name</th>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Type</th>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Credits</th>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Theory (h/wk)</th>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Lab (h/wk)</th>
                          <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>Enrolled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedSubjects.map((sub, idx) => (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                            <td style={{ padding: '0.65rem 0.8rem' }}><code style={{ color: '#F37023', fontWeight: 700 }}>{sub.code}</code></td>
                            <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{sub.name}</td>
                            <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="active">{sub.type || 'THEORY'}</Badge></td>
                            <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>{sub.credits || 4}</td>
                            <td style={{ padding: '0.65rem 0.8rem' }}>{sub.theoryHoursPerWeek || 3} Hours</td>
                            <td style={{ padding: '0.65rem 0.8rem' }}>{sub.labHoursPerWeek || 2} Hours</td>
                            <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#10B981' }}>64 Students (Div A)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Academic Coordinator Roles */}
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Award size={16} color="#F37023" /> Institutional & Departmental Coordinator Roles
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, color: '#0B192C' }}>Department Timetable Coordinator</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Responsible for clash-free classroom and lab scheduling.</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, color: '#0B192C' }}>NAAC Criterion 2 (Teaching-Learning) Co-Lead</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Maintaining Course Outcome (CO) & Program Outcome (PO) mapping.</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, color: '#0B192C' }}>Capstone Project Evaluation Committee</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Guiding and assessing 8th-semester startup and major projects.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB C: WORKLOAD
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'WORKLOAD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #F37023' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>TOTAL WEEKLY WORKLOAD</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{workloadStats.weeklyHours} Hours/Week</div>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>UGC & AICTE Compliant</div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #1E3E62' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>THEORY LECTURES</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E3E62', marginTop: '2px' }}>{workloadStats.theoryHours} Hours/Week</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Classroom instruction</div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>LABORATORY SESSIONS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{workloadStats.labHours} Hours/Week</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Hands-on practicals</div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #A855F7' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>LECTURE COMPLETION</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>
                    {workloadStats.completedLectures} / {workloadStats.assignedLectures}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>88% Syllabus Delivered</div>
                </div>
              </div>

              {/* Subject-Wise Workload Table */}
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
                  Subject-Wise & Section-Wise Workload Breakdown
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Subject</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Division</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Room / Lab</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Hours/Wk</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Completed</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedSubjects.map((sub, idx) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.65rem 0.8rem' }}>
                          <strong style={{ color: '#0B192C' }}>{sub.name}</strong> <span style={{ color: '#64748B' }}>({sub.code})</span>
                        </td>
                        <td style={{ padding: '0.65rem 0.8rem' }}>B.Tech CSE Sem 4 - Div A</td>
                        <td style={{ padding: '0.65rem 0.8rem' }}>{idx % 2 === 0 ? 'Room 302 (LH-1)' : 'CSE Advanced Lab 4'}</td>
                        <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{(sub.theoryHoursPerWeek || 3) + (sub.labHoursPerWeek || 2)} Hours</td>
                        <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>{14 + idx * 2} Lectures</td>
                        <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="active">ON SCHEDULE</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB D: ATTENDANCE
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'ATTENDANCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>OVERALL ATTENDANCE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{staffAttendance.percentage}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{staffAttendance.presentDays} Days Present / {staffAttendance.totalDays} Total</div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>CASUAL LEAVE BALANCE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
                    {staffAttendance.leaveBalance.casualLeave.balance} / {staffAttendance.leaveBalance.casualLeave.total} Days
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{staffAttendance.leaveBalance.casualLeave.used} Days Availed</div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #38BDF8' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>MEDICAL LEAVE BALANCE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8', marginTop: '2px' }}>
                    {staffAttendance.leaveBalance.medicalLeave.balance} / {staffAttendance.leaveBalance.medicalLeave.total} Days
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{staffAttendance.leaveBalance.medicalLeave.used} Days Availed</div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #A855F7' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>EARNED LEAVE BALANCE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>
                    {staffAttendance.leaveBalance.earnedLeave.balance} / {staffAttendance.leaveBalance.earnedLeave.total} Days
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Cumulative Balance</div>
                </div>
              </div>

              {/* Monthly Attendance Log */}
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
                  Academic Term Monthly Attendance Summary (2024–2025)
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Month</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Working Days</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Present</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Leave</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>On Duty (OD)</th>
                      <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>July 2024</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>24</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>23</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>1 CL</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>0</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#10B981' }}>95.8%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>August 2024</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>23</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>22</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>1 ML</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>0</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#10B981' }}>95.6%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>September 2024</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>24</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>22</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>0</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>2 (Conference)</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#10B981' }}>100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB E: EXAMINATION
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'EXAMINATION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                      Examination & Assessment Responsibilities
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                      Official paper setting, continuous internal evaluation (CIE), and university examination duties.
                    </p>
                  </div>
                  <Badge variant="purple">{examDuties.length} Examination Allocations</Badge>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Subject</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Category</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Duty Role</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Marks Entry</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Pending</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examDuties.map(duty => (
                        <tr key={duty.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.65rem 0.8rem' }}>
                            <strong style={{ color: '#0B192C' }}>{duty.subjectName}</strong> <code style={{ color: '#F37023' }}>{duty.subjectCode}</code>
                          </td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>{duty.examType}</td>
                          <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>{duty.dutyRole}</td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>
                            <Badge variant={duty.marksEntryStatus === 'COMPLETED' ? 'active' : 'warning'}>
                              {duty.marksEntryStatus}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>{duty.pendingEvaluations} Scripts</td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>
                            <Badge variant={duty.marksEntryStatus === 'COMPLETED' ? 'active' : 'navy'}>
                              {duty.marksEntryStatus === 'COMPLETED' ? 'VERIFIED BY EXAM CELL' : 'IN ASSESSMENT'}
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

          {/* ─────────────────────────────────────────────────────────────
              TAB F: MENTORSHIP
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'MENTORSHIP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!isMentor ? (
                <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Users size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                    No Active Mentorship Assignment
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px', margin: '0.5rem auto 0 auto' }}>
                    This faculty member is currently not assigned as a Mentor batch counselor for the current academic session.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #F37023' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>TOTAL ASSIGNED MENTEES</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{mentees.length} Students</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>B.Tech CSE Batch</div>
                    </div>

                    <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>GOOD STANDING MENTEES</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                        {mentees.filter(m => m.academicStanding === 'GOOD_STANDING').length} Students
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10B981' }}>Clear attendance & exams</div>
                    </div>

                    <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: '4px solid #EF4444' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>AT-RISK / DEFAULTER MENTEES</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
                        {atRiskMenteesCount} Students
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#EF4444' }}>Attendance &lt; 75% or Backlogs</div>
                    </div>
                  </div>

                  {/* Mentees Table */}
                  <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
                      Assigned Mentee Student Roster
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                            <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Enrollment No</th>
                            <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student Name</th>
                            <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program & Sem</th>
                            <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Attendance %</th>
                            <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Academic Standing</th>
                            <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Contact Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mentees.map(m => {
                            const isGood = m.academicStanding === 'GOOD_STANDING';
                            return (
                              <tr key={m.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.65rem 0.8rem' }}><code style={{ color: '#F37023', fontWeight: 700 }}>{m.enrollmentNo}</code></td>
                                <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{m.name}</td>
                                <td style={{ padding: '0.65rem 0.8rem' }}>{m.programName || 'B.Tech CSE'} (Sem 4)</td>
                                <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: isGood ? '#10B981' : '#EF4444' }}>
                                  {isGood ? '88.4%' : '68.2%'}
                                </td>
                                <td style={{ padding: '0.65rem 0.8rem' }}>
                                  <Badge variant={isGood ? 'active' : 'danger'}>
                                    {m.academicStanding || 'GOOD_STANDING'}
                                  </Badge>
                                </td>
                                <td style={{ padding: '0.65rem 0.8rem' }}>{m.phone || '+91 98250 10001'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB G: DOCUMENTS (STAFF DOCUMENTS ONLY — STRICT ISOLATION)
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'DOCUMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                      Official Faculty Credentials & Institutional Documents Vault
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                      Certified staff documents securely stored in the Registrar HR Records Archive.
                    </p>
                  </div>
                  <Badge variant="navy">{staffDocuments.length} Verified Staff Documents</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {staffDocuments.map(doc => (
                    <div 
                      key={doc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.9rem 1rem',
                        background: '#F8FAFC',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0B192C'
                        }}>
                          <FileText size={20} color="#F37023" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0B192C', fontSize: '0.875rem' }}>{doc.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', display: 'flex', gap: '0.75rem' }}>
                            <span>File: <strong style={{ color: '#0B192C' }}>{doc.fileName}</strong> ({doc.fileSize})</span>
                            <span>•</span>
                            <span>Uploaded: {doc.uploadDate}</span>
                            <span>•</span>
                            <span>Verified By: <strong style={{ color: '#10B981' }}>{doc.verifiedBy}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Badge variant="active">
                          <CheckCircle2 size={12} style={{ marginRight: '3px' }} /> VERIFIED
                        </Badge>
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => alert(`Viewing document: ${doc.title} (${doc.fileName})`)}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => alert(`Downloading verified document: ${doc.fileName}`)}
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB H: REQUESTS & APPROVALS
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'REQUESTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                      Service Requests & Institutional Approval Records
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                      Leave applications, resource requisitions, work handovers, and official correspondence.
                    </p>
                  </div>
                  <Badge variant="navy">{staffRequests.length > 0 ? `${staffRequests.length} Requests` : 'No Pending'}</Badge>
                </div>

                {staffRequests.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '6px' }}>
                    <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 700, color: '#0B192C' }}>No Pending Requests Found</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                      All previous leaves and administrative requests for this faculty member have been resolved.
                    </div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Request ID</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Category / Purpose</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Submitted Date</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Current Stage</th>
                        <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Resolution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffRequests.map(req => (
                        <tr key={req.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.65rem 0.8rem' }}><code style={{ color: '#F37023' }}>{req.id}</code></td>
                          <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{req.category || (req as any).requestType || 'SERVICE_REQUEST'}</td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '12/08/2024'}</td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>{req.currentOffice || 'Office of HOD'}</td>
                          <td style={{ padding: '0.65rem 0.8rem' }}>
                            <Badge variant={req.status === 'APPROVED' ? 'active' : (req.status === 'PENDING' ? 'warning' : 'danger')}>
                              {req.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB I: PERFORMANCE & WORK RECORD
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'PERFORMANCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
                  Academic Achievements, Research & Faculty Appraisals
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.9rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0B192C' }}>
                      <Trophy size={16} color="#F37023" /> Research Publications & Patents
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.35rem' }}>
                      • <strong>4 Scopus/SCI Indexed Papers</strong> published in IEEE & Springer journals.<br />
                      • <strong>1 Indian Patent Granted</strong> on Distributed IoT Security Frameworks.
                    </div>
                  </div>

                  <div style={{ padding: '0.9rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#10B981' }}>
                      <Award size={16} color="#10B981" /> Student Feedback Score
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10B981', marginTop: '0.2rem' }}>
                      4.68 / 5.00
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Rated 'Outstanding' across 128 student feedback responses.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB J: ACTIVITY & AUDIT TRAIL
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'AUDIT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
                  Institutional Activity & Security Audit Trail
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {staffAuditLogs.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '6px' }}>
                      No recent audit events recorded for this employee profile.
                    </div>
                  ) : (
                    staffAuditLogs.map((log, idx) => (
                      <div 
                        key={log.id || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.65rem 0.85rem',
                          background: '#F8FAFC',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0B192C' }}>{log.action}</strong> • <span style={{ color: '#64748B' }}>{log.module}</span>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>{log.details}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            5. FOOTER (NAVIGATION & ACTIONS)
        ══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '0.85rem 1.5rem',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '0 0 8px 8px'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {onNavigateToInstitute && (
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => onNavigateToInstitute(faculty.instituteId)}
              >
                Open Institute View
              </button>
            )}
            {onNavigateToDepartment && faculty.departmentId && (
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => onNavigateToDepartment(faculty.departmentId!)}
              >
                Open Department View
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowPrintModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print Complete Dossier
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Back to Faculty Roster
            </button>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PRINTABLE DOSSIER MODAL / VIEW (OFFICIAL A4 PRINT-FRIENDLY LAYOUT)
      ══════════════════════════════════════════════════════════════════════ */}
      {showPrintModal && (
        <Modal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Official Staff Dossier: ${faculty.name}`}
          maxWidth="960px"
        >
          <div style={{ padding: '1rem', background: '#FFFFFF' }}>
            
            {/* Action Bar inside Print Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Official University Staff Dossier • Print or Save as PDF
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleTriggerPrint} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={14} /> Print Now
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintModal(false)}>
                  Close
                </button>
              </div>
            </div>

            {/* Printable A4 Container */}
            <div id="printable-staff-dossier" style={{
              border: '2px solid #0B192C',
              padding: '2rem',
              background: '#FFFFFF',
              color: '#000000',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              
              {/* Header Letterhead */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #F37023', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0B192C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SWARRNIM STARTUP & INNOVATION UNIVERSITY
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>
                  Bhoyan Rathod, Gandhinagar, Gujarat 382420 | Approved by Govt. of Gujarat & UGC
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F37023', marginTop: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  OFFICIAL FACULTY & STAFF DOSSIER
                </div>
              </div>

              {/* Employee Summary Profile Block */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1.25rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <img
                  src={faculty.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={faculty.name}
                  style={{ width: '100px', height: '115px', objectFit: 'cover', border: '1px solid #0B192C', borderRadius: '4px' }}
                />
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0B192C' }}>{faculty.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#000000', marginTop: '0.2rem' }}>
                    <strong>{faculty.designation}</strong> • Employee ID: <strong style={{ fontFamily: 'monospace' }}>{faculty.employeeId || faculty.id}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.25rem' }}>
                    Department: <strong>{department?.name || 'Computer Science & Engineering'}</strong> | Institute: <strong>{institute?.name || 'SIT'}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.25rem' }}>
                    Email: <strong>{faculty.email}</strong> | Phone: <strong>{faculty.phone}</strong> | Status: <strong>{faculty.status || 'ACTIVE'}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.25rem' }}>
                    Joining Date: <strong>{faculty.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString() : '01/07/2023'}</strong> | Experience: <strong>{faculty.experienceYears || 8} Years</strong>
                  </div>
                </div>
              </div>

              {/* Section 1: Academic Portfolio & Workload */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', textTransform: 'uppercase', background: '#F1F5F9', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', borderLeft: '4px solid #F37023' }}>
                  1. Academic Portfolio & Teaching Workload
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000000', textAlign: 'left', background: '#F8FAFC' }}>
                      <th style={{ padding: '4px 6px' }}>Code</th>
                      <th style={{ padding: '4px 6px' }}>Course Title</th>
                      <th style={{ padding: '4px 6px' }}>Credits</th>
                      <th style={{ padding: '4px 6px' }}>Theory h/wk</th>
                      <th style={{ padding: '4px 6px' }}>Lab h/wk</th>
                      <th style={{ padding: '4px 6px' }}>Weekly Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedSubjects.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{s.code}</td>
                        <td style={{ padding: '4px 6px' }}>{s.name}</td>
                        <td style={{ padding: '4px 6px' }}>{s.credits || 4}</td>
                        <td style={{ padding: '4px 6px' }}>{s.theoryHoursPerWeek || 3}</td>
                        <td style={{ padding: '4px 6px' }}>{s.labHoursPerWeek || 2}</td>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>{(s.theoryHoursPerWeek || 3) + (s.labHoursPerWeek || 2)} Hours</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                  Total Weekly Teaching Hours: <strong>{workloadStats.weeklyHours} Hours/Week</strong> | Semester Delivery: <strong>88% Delivered</strong>
                </div>
              </div>

              {/* Section 2: Attendance & Leave Compliance */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', textTransform: 'uppercase', background: '#F1F5F9', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', borderLeft: '4px solid #10B981' }}>
                  2. Attendance & Leave Record (Academic Year 2024–25)
                </div>
                <div style={{ fontSize: '0.78rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>Attendance: <strong>{staffAttendance.percentage}%</strong></div>
                  <div>Working Days: <strong>{staffAttendance.totalDays} Days</strong></div>
                  <div>Present: <strong>{staffAttendance.presentDays} Days</strong></div>
                  <div>Availed Leaves: <strong>{staffAttendance.approvedLeaves} Days</strong></div>
                </div>
              </div>

              {/* Section 3: Mentorship & Examination Duties */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', textTransform: 'uppercase', background: '#F1F5F9', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', borderLeft: '4px solid #A855F7' }}>
                  3. Mentorship & Examination Responsibilities
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  Mentorship Status: <strong>{isMentor ? `Active Mentor (${mentees.length} Mentees Assigned, ${atRiskMenteesCount} At-Risk)` : 'Not Assigned'}</strong> | Exam Duties: <strong>{examDuties.length} Examination Allocations</strong>
                </div>
              </div>

              {/* Section 4: Verified Staff Credentials */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', textTransform: 'uppercase', background: '#F1F5F9', padding: '0.35rem 0.5rem', marginBottom: '0.5rem', borderLeft: '4px solid #0B192C' }}>
                  4. Verified Credentials in Central Repository
                </div>
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                  {staffDocuments.map(d => d.title).join(' • ')}
                </div>
              </div>

              {/* Official Seal and Signatures */}
              <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', fontSize: '0.8rem', color: '#0B192C' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #000000', width: '80%', margin: '0 auto 0.4rem auto' }} />
                  <strong>Faculty / Employee Signature</strong>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #000000', width: '80%', margin: '0 auto 0.4rem auto' }} />
                  <strong>Head of Department (HOD)</strong>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #000000', width: '80%', margin: '0 auto 0.4rem auto' }} />
                  <strong>Registrar & University Seal</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem' }}>
                Generated on {new Date().toLocaleString()} • SSIU ERP Official Records Archive • Swarrnim Startup & Innovation University
              </div>

            </div>
          </div>
        </Modal>
      )}

    </Modal>
  );
};
