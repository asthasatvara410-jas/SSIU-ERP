import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  EdpDuty, EdpDutyStatus, EdpDutyPhoto, EdpDutyDashboardStats,
  Faculty, Department, Program, Semester, Division, Subject, UserRole 
} from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { 
  CalendarDays, MapPin, Clock, Camera, CheckCircle2, ShieldCheck, 
  Plus, Search, ListFilter as Filter, FileSpreadsheet, FileText, UserCheck, 
  AlertCircle, ChevronRight, Eye, Navigation, Award, Users, BookOpen, 
  Layers, School, Check, X, RefreshCw, Printer, Trash2, Edit3, Image as ImageIcon,
  Upload, AlertTriangle, ArrowRight, UserPlus, PlayCircle, Send, CheckSquare
} from 'lucide-react';
import { exportToExcel } from '../../services/exportService';
import { DashboardReportModal } from '../../components/reports/DashboardReportModal';

export const EdpDutyPage: React.FC = () => {
  const { user, role } = useAuth();

  // Master Data
  const institutes = useMemo(() => db.getInstitutes(), []);
  const departments = useMemo(() => db.getDepartments(), []);
  const facultyList = useMemo(() => db.getFaculty(), []);
  const programs = useMemo(() => db.getPrograms(), []);
  const semesters = useMemo(() => db.getSemesters(), []);
  const divisions = useMemo(() => db.getDivisions(), []);
  const subjects = useMemo(() => db.getSubjects(), []);

  // State
  const [duties, setDuties] = useState<EdpDuty[]>([]);
  const [activeQueueTab, setActiveQueueTab] = useState<'ALL' | 'MY_DUTIES' | 'PENDING_REVIEW' | 'VERIFIED'>('ALL');

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('ALL');
  const [filterFacultyId, setFilterFacultyId] = useState('ALL');
  const [filterProgramId, setFilterProgramId] = useState('ALL');
  const [filterSubjectId, setFilterSubjectId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRecordDutyModalOpen, setIsRecordDutyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<EdpDuty | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form State: Assign Duty (Admin/HOD)
  const [assignDeptId, setAssignDeptId] = useState('dept-1');
  const [assignFacultyId, setAssignFacultyId] = useState('fac-1');
  const [assignProgramId, setAssignProgramId] = useState('prog-1');
  const [assignSemesterId, setAssignSemesterId] = useState('sem-cse-4');
  const [assignDivisionId, setAssignDivisionId] = useState('div-cse-4a');
  const [assignSubjectId, setAssignSubjectId] = useState('sub-cse-401');
  const [assignRoomNo, setAssignRoomNo] = useState('Room 302 (Block A)');
  const [assignDutyDate, setAssignDutyDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignStartTime, setAssignStartTime] = useState('09:30 AM');
  const [assignEndTime, setAssignEndTime] = useState('11:30 AM');
  const [assignTotalStudents, setAssignTotalStudents] = useState<number>(60);
  const [assignInstructions, setAssignInstructions] = useState('Classroom monitoring, student attendance count and photo evidence reporting.');

  // Form State: Record Classroom Duty (Faculty)
  const [recordRoomNo, setRecordRoomNo] = useState('');
  const [recordSubjectId, setRecordSubjectId] = useState('');
  const [recordTotalStudents, setRecordTotalStudents] = useState<number>(60);
  const [recordPresentStudents, setRecordPresentStudents] = useState<number>(0);
  const [recordAbsentStudents, setRecordAbsentStudents] = useState<number>(0);
  const [recordRemarks, setRecordRemarks] = useState('');
  const [recordPhotos, setRecordPhotos] = useState<EdpDutyPhoto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form State: Review & Verify (Admin/HOD)
  const [reviewStatus, setReviewStatus] = useState<EdpDutyStatus>('VERIFIED');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = () => {
    const list = db.getScopedEdpDuties(user, role);
    setDuties(list);
  };

  useEffect(() => {
    loadData();
  }, [user, role]);

  // Set default tab for faculty
  useEffect(() => {
    if (role === 'FACULTY') {
      setActiveQueueTab('MY_DUTIES');
    }
  }, [role]);

  // Real-time KPI Dashboard Stats
  const dashboardStats: EdpDutyDashboardStats = useMemo(() => {
    return db.getEdpDutyDashboardStats(user, role, {
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      departmentId: filterDeptId !== 'ALL' ? filterDeptId : undefined,
      facultyId: filterFacultyId !== 'ALL' ? filterFacultyId : undefined,
      programId: filterProgramId !== 'ALL' ? filterProgramId : undefined,
      subjectId: filterSubjectId !== 'ALL' ? filterSubjectId : undefined
    });
  }, [duties, user, role, filterDateFrom, filterDateTo, filterDeptId, filterFacultyId, filterProgramId, filterSubjectId]);

  // Filtered Duties Queue
  const filteredDuties = useMemo(() => {
    return duties.filter(d => {
      // Tab filter
      if (activeQueueTab === 'MY_DUTIES') {
        const isMine = d.assignedUserId === user?.id || d.facultyId === user?.id || (user?.name && d.assignedUserName && d.assignedUserName.toLowerCase().includes(user.name.toLowerCase()));
        if (!isMine) return false;
      } else if (activeQueueTab === 'PENDING_REVIEW') {
        if (d.status !== 'SUBMITTED') return false;
      } else if (activeQueueTab === 'VERIFIED') {
        if (d.status !== 'VERIFIED') return false;
      }

      // Dropdown filters
      if (filterDeptId !== 'ALL' && d.departmentId !== filterDeptId) return false;
      if (filterFacultyId !== 'ALL' && d.facultyId !== filterFacultyId && d.assignedUserId !== filterFacultyId) return false;
      if (filterProgramId !== 'ALL' && d.programId !== filterProgramId) return false;
      if (filterSubjectId !== 'ALL' && d.subjectId !== filterSubjectId && d.subjectCode !== filterSubjectId) return false;
      if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;

      // Date Range
      if (filterDateFrom) {
        const from = new Date(filterDateFrom).getTime();
        if (new Date(d.dutyDate).getTime() < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo).getTime();
        if (new Date(d.dutyDate).getTime() > to + 86400000) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          d.dutyCode.toLowerCase().includes(q) ||
          (d.assignedUserName && d.assignedUserName.toLowerCase().includes(q)) ||
          (d.facultyName && d.facultyName.toLowerCase().includes(q)) ||
          (d.roomNo && d.roomNo.toLowerCase().includes(q)) ||
          (d.classroom && d.classroom.toLowerCase().includes(q)) ||
          (d.subjectName && d.subjectName.toLowerCase().includes(q)) ||
          (d.subjectCode && d.subjectCode.toLowerCase().includes(q)) ||
          (d.remarks && d.remarks.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    duties, activeQueueTab, filterDeptId, filterFacultyId, filterProgramId, 
    filterSubjectId, filterStatus, filterDateFrom, filterDateTo, searchQuery, user
  ]);

  // Auto-calculate enrolled students when program/semester/division changes
  const autoEnrolledStudentCount = useMemo(() => {
    const studentList = db.getStudents();
    const matches = studentList.filter(s => 
      (!assignProgramId || s.programId === assignProgramId) &&
      (!assignDeptId || s.departmentId === assignDeptId)
    );
    return matches.length > 0 ? matches.length : 60;
  }, [assignProgramId, assignDeptId]);

  // Helper: Status badge
  const renderStatusBadge = (status: EdpDutyStatus) => {
    switch (status) {
      case 'ASSIGNED':
        return <Badge variant="navy">📋 ASSIGNED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="gold">⏳ IN PROGRESS</Badge>;
      case 'SUBMITTED':
        return <Badge variant="orange">🚀 SUBMITTED</Badge>;
      case 'VERIFIED':
        return <Badge variant="success">✅ VERIFIED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">❌ REJECTED</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  // ─── ACTION HANDLERS ───

  // Open Assign Modal
  const handleOpenAssignModal = () => {
    setAssignDeptId(user?.departmentId || 'dept-1');
    setAssignFacultyId(facultyList[0]?.id || 'fac-1');
    setAssignProgramId(programs[0]?.id || 'prog-1');
    setAssignSemesterId(semesters[0]?.id || 'sem-cse-4');
    setAssignDivisionId(divisions[0]?.id || 'div-cse-4a');
    setAssignSubjectId(subjects[0]?.id || 'sub-cse-401');
    setAssignRoomNo('Room 302 (Block A)');
    setAssignDutyDate(new Date().toISOString().split('T')[0]);
    setAssignStartTime('09:30 AM');
    setAssignEndTime('11:30 AM');
    setAssignTotalStudents(autoEnrolledStudentCount);
    setAssignInstructions('Classroom monitoring, student attendance count and photo evidence reporting.');
    setIsAssignModalOpen(true);
  };

  // Submit Assign Form
  const handleAssignDutySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFaculty = facultyList.find(f => f.id === assignFacultyId);
    const targetDept = departments.find(d => d.id === assignDeptId);
    const targetProg = programs.find(p => p.id === assignProgramId);
    const targetSem = semesters.find(s => s.id === assignSemesterId);
    const targetDiv = divisions.find(d => d.id === assignDivisionId);
    const targetSub = subjects.find(s => s.id === assignSubjectId);

    try {
      const created = db.addEdpDuty({
        facultyId: assignFacultyId,
        facultyName: targetFaculty?.name || 'Assigned Faculty',
        facultyDesignation: targetFaculty?.designation || 'Faculty Member',
        assignedUserId: assignFacultyId,
        assignedUserName: targetFaculty?.name || 'Assigned Faculty',
        assignedUserRole: 'FACULTY',
        departmentId: assignDeptId,
        departmentName: targetDept?.name || 'Academic Department',
        programId: assignProgramId,
        programName: targetProg?.name,
        semesterId: assignSemesterId,
        semesterName: targetSem ? `Semester ${targetSem.number}` : undefined,
        divisionId: assignDivisionId,
        divisionName: targetDiv?.name,
        subjectId: assignSubjectId,
        subjectName: targetSub?.name,
        subjectCode: targetSub?.code,
        roomNo: assignRoomNo,
        classroom: assignRoomNo,
        dutyDate: assignDutyDate,
        startTime: assignStartTime,
        endTime: assignEndTime,
        totalStudents: Number(assignTotalStudents) || 60,
        responsibilityDetails: assignInstructions
      }, user);

      showToast('success', `Classroom EDP Duty ${created.dutyCode} assigned successfully to ${created.assignedUserName}.`);
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to assign EDP Duty.');
    }
  };

  // Start Duty (Faculty enters classroom)
  const handleStartDuty = (duty: EdpDuty) => {
    try {
      db.startEdpDuty(duty.id, user);
      showToast('success', `Classroom Duty ${duty.dutyCode} is now IN PROGRESS.`);
      loadData();
      handleOpenRecordModal(duty);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to start duty.');
    }
  };

  // Open Record Modal
  const handleOpenRecordModal = (duty: EdpDuty) => {
    setSelectedDuty(duty);
    setRecordRoomNo(duty.roomNo || duty.classroom || 'Room 302');
    setRecordSubjectId(duty.subjectId || subjects[0]?.id || '');
    setRecordTotalStudents(duty.totalStudents || 60);
    setRecordPresentStudents(duty.presentStudents || 0);
    setRecordAbsentStudents(duty.absentStudents || Math.max(0, (duty.totalStudents || 60) - (duty.presentStudents || 0)));
    setRecordRemarks(duty.remarks || '');
    setRecordPhotos(duty.photos ? [...duty.photos] : []);
    setIsRecordDutyModalOpen(true);
  };

  // Handle Headcount change with auto-calculate
  const handlePresentCountChange = (val: number) => {
    const p = Math.max(0, val);
    setRecordPresentStudents(p);
    const a = Math.max(0, recordTotalStudents - p);
    setRecordAbsentStudents(a);
  };

  const handleTotalCountChange = (val: number) => {
    const t = Math.max(0, val);
    setRecordTotalStudents(t);
    const a = Math.max(0, t - recordPresentStudents);
    setRecordAbsentStudents(a);
  };

  // Add Photo Sample / Capture
  const handleAddSamplePhoto = (category: string) => {
    setUploadProgress(10);
    const mockUrls: Record<string, string> = {
      'Front View': 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
      'Back View': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      'Podium View': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      'Attendance Sheet': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
    };

    setTimeout(() => setUploadProgress(50), 300);
    setTimeout(() => {
      setUploadProgress(100);
      const newPhoto: EdpDutyPhoto = {
        id: `photo-${Date.now()}`,
        photoUrl: mockUrls[category] || mockUrls['Front View'],
        caption: `${category} - ${recordRoomNo || 'Classroom'} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        uploadedAt: new Date().toISOString(),
        fileName: `${category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`,
        fileSize: '2.5 MB'
      };
      setRecordPhotos(prev => [...prev, newPhoto]);
      setTimeout(() => setUploadProgress(null), 400);
    }, 600);
  };

  // Upload Custom Photo File
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(20);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadProgress(80);
      setTimeout(() => {
        setUploadProgress(100);
        const newPhoto: EdpDutyPhoto = {
          id: `photo-${Date.now()}`,
          photoUrl: reader.result as string,
          caption: `Classroom Upload - ${file.name}`,
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        };
        setRecordPhotos(prev => [...prev, newPhoto]);
        setTimeout(() => setUploadProgress(null), 400);
      }, 300);
    };
    reader.readAsDataURL(file);
  };

  // Delete Photo from recording
  const handleDeletePhoto = (photoId: string) => {
    setRecordPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // Submit Duty Report
  const handleSubmitDutyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty) return;

    if (recordPresentStudents > recordTotalStudents) {
      showToast('error', `Present students (${recordPresentStudents}) cannot exceed total students (${recordTotalStudents}).`);
      return;
    }

    if (recordPhotos.length === 0) {
      showToast('error', 'Please capture or upload at least 1 classroom photo proof.');
      return;
    }

    const sub = subjects.find(s => s.id === recordSubjectId);

    try {
      db.submitEdpDutyReport(selectedDuty.id, {
        totalStudents: Number(recordTotalStudents),
        presentStudents: Number(recordPresentStudents),
        absentStudents: Number(recordAbsentStudents),
        photos: recordPhotos,
        remarks: recordRemarks.trim() || 'Classroom session conducted and attendance verified.',
        roomNo: recordRoomNo.trim() || selectedDuty.roomNo,
        classroom: recordRoomNo.trim() || selectedDuty.classroom,
        subjectId: recordSubjectId || selectedDuty.subjectId,
        subjectName: sub?.name || selectedDuty.subjectName,
        subjectCode: sub?.code || selectedDuty.subjectCode
      }, user);

      showToast('success', `Classroom EDP Duty report for ${selectedDuty.dutyCode} submitted successfully.`);
      setIsRecordDutyModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit duty report.');
    }
  };

  // Open Review / Verify Modal (Admin/HOD)
  const handleOpenReviewModal = (duty: EdpDuty) => {
    setSelectedDuty(duty);
    setReviewStatus('VERIFIED');
    setReviewRemarks(duty.verificationRemarks || 'Verified classroom session report and student attendance.');
    setIsReviewModalOpen(true);
  };

  // Confirm Verification
  const handleVerifyDutyConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty || !user) return;

    try {
      db.verifyEdpDuty(selectedDuty.id, user, reviewStatus, reviewRemarks);
      showToast('success', `Duty ${selectedDuty.dutyCode} marked as ${reviewStatus}.`);
      setIsReviewModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to verify duty.');
    }
  };

  // Open Duty Slip Detail Modal
  const handleOpenDetailModal = (duty: EdpDuty) => {
    setSelectedDuty(duty);
    setIsDetailModalOpen(true);
  };

  // Delete Duty
  const handleDeleteDuty = (dutyId: string) => {
    if (!window.confirm('Are you sure you want to delete this EDP Duty record?')) return;
    try {
      db.deleteEdpDuty(dutyId, user, role);
      showToast('success', 'EDP Duty record deleted.');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete duty.');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      'Duty ID', 'Date', 'Time Slot', 'Faculty Name', 'Department', 
      'Class / Program', 'Division', 'Subject', 'Room No', 
      'Total Students', 'Present Students', 'Absent Students', 
      'Attendance %', 'Photos Count', 'Status', 'Submitted At', 'Verified By', 'Remarks'
    ];

    const rows = filteredDuties.map(d => [
      d.dutyCode,
      d.dutyDate,
      `${d.startTime} - ${d.endTime}`,
      d.assignedUserName,
      d.departmentName || d.departmentId,
      d.programName || 'B.Tech CSE',
      d.divisionName || 'Div A',
      `${d.subjectCode || ''} ${d.subjectName || ''}`.trim(),
      d.roomNo || d.classroom || '',
      d.totalStudents || 0,
      d.presentStudents || 0,
      d.absentStudents || 0,
      d.totalStudents && d.totalStudents > 0 ? `${Math.round(((d.presentStudents || 0) / d.totalStudents) * 100)}%` : '0%',
      (d.photos || []).length,
      d.status,
      d.submittedAt || 'N/A',
      d.verifiedByAdminName || 'N/A',
      d.remarks || ''
    ]);

    exportToExcel(
      'Classroom EDP Duty Roster & Attendance Audit',
      headers,
      rows,
      { startDate: filterDateFrom, endDate: filterDateTo, searchQuery },
      { name: user?.name, role: role as UserRole }
    );
    showToast('success', 'Classroom EDP Duty records exported to Excel.');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDeptId('ALL');
    setFilterFacultyId('ALL');
    setFilterProgramId('ALL');
    setFilterSubjectId('ALL');
    setFilterStatus('ALL');
    setSearchQuery('');
  };

  const canManageDuties = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR' || role === 'PRINCIPAL' || role === 'HOD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? '#059669' : '#DC2626',
          color: '#FFFFFF',
          fontWeight: 700,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideIn 0.25s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── HEADER & WORKSPACE TOOLBAR ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: '#FEF3C7', borderRadius: 'var(--radius-md)' }}>
              <School size={24} color="#D97706" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Classroom EDP Duty Management Desk
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                Classroom entry verification, student headcount audit, geo-tagged photo proofs &amp; administrative review
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => setIsReportModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          >
            <FileText size={15} /> Reports &amp; Analytics
          </button>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={handleExportExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          >
            <FileSpreadsheet size={15} color="#059669" /> Export Excel
          </button>

          {canManageDuties && (
            <button 
              type="button" 
              className="btn btn-primary btn-sm" 
              onClick={handleOpenAssignModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
            >
              <UserPlus size={15} /> Assign Classroom Duty
            </button>
          )}

          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={loadData}
            title="Refresh duties"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ─── REAL-DATA KPI METRIC DASHBOARD (9 STATS) ─── */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <StatCard 
          title="Total Duties" 
          value={String(dashboardStats.totalDuties)} 
          icon={Layers} 
          subtitle="All Tracked Duties" 
        />
        <StatCard 
          title="Assigned" 
          value={String(dashboardStats.assigned)} 
          icon={Clock} 
          colorScheme="gold" 
          subtitle="Scheduled For Duty" 
        />
        <StatCard 
          title="In Progress" 
          value={String(dashboardStats.inProgress)} 
          icon={PlayCircle} 
          colorScheme="gold" 
          subtitle="Faculty in Classroom" 
        />
        <StatCard 
          title="Submitted" 
          value={String(dashboardStats.submitted)} 
          icon={Send} 
          colorScheme="orange" 
          subtitle="Awaiting Review" 
        />
        <StatCard 
          title="Verified" 
          value={String(dashboardStats.verified)} 
          icon={CheckCircle2} 
          colorScheme="green" 
          subtitle="Approved Sessions" 
        />
        <StatCard 
          title="Rejected" 
          value={String(dashboardStats.rejected)} 
          icon={AlertCircle} 
          colorScheme="orange" 
          subtitle="Revision Requested" 
        />
        <StatCard 
          title="Classes Covered" 
          value={String(dashboardStats.classesCovered)} 
          icon={School} 
          colorScheme="navy" 
          subtitle="Unique Classrooms" 
        />
        <StatCard 
          title="Students Covered" 
          value={String(dashboardStats.studentsCovered)} 
          icon={Users} 
          colorScheme="green" 
          subtitle="Total Present Count" 
        />
        <StatCard 
          title="Photos Uploaded" 
          value={String(dashboardStats.photosUploaded)} 
          icon={Camera} 
          colorScheme="navy" 
          subtitle="Classroom Proofs" 
        />
      </div>

      {/* ─── QUEUE TABS & FILTER TOOLBAR ─── */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Queue Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All Classroom Duties (${duties.length})` },
            { key: 'MY_DUTIES', label: 'My Assigned Duties' },
            { key: 'PENDING_REVIEW', label: `Pending Verification (${duties.filter(d => d.status === 'SUBMITTED').length})` },
            { key: 'VERIFIED', label: `Verified Archive (${duties.filter(d => d.status === 'VERIFIED').length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveQueueTab(tab.key as any)}
              className={`btn btn-sm ${activeQueueTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8125rem', fontWeight: activeQueueTab === tab.key ? 800 : 600 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Multi-Criteria Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.84375rem' }}
              placeholder="Search Duty ID, Faculty, Room No, Subject, Remarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Department */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8125rem' }}
              value={filterDeptId}
              onChange={e => setFilterDeptId(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Faculty */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8125rem' }}
              value={filterFacultyId}
              onChange={e => setFilterFacultyId(e.target.value)}
            >
              <option value="ALL">All Faculty Staff</option>
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
              ))}
            </select>

            {/* Program / Class */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8125rem' }}
              value={filterProgramId}
              onChange={e => setFilterProgramId(e.target.value)}
            >
              <option value="ALL">All Classes / Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Subject */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8125rem' }}
              value={filterSubjectId}
              onChange={e => setFilterSubjectId(e.target.value)}
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>

            {/* Status */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8125rem' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            {/* Date Range Inputs */}
            <input
              type="date"
              className="form-input"
              style={{ width: '130px', fontSize: '0.8125rem' }}
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              title="From Date"
            />
            <input
              type="date"
              className="form-input"
              style={{ width: '130px', fontSize: '0.8125rem' }}
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              title="To Date"
            />

            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredDuties.length}</strong> classroom EDP duty records matching filter criteria
        </div>
      </div>

      {/* ─── CLASSROOM EDP DUTY QUEUE TABLE ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)' }}>
                <th>Duty Code &amp; Date</th>
                <th>Assigned Faculty</th>
                <th>Class, Division &amp; Room</th>
                <th>Subject</th>
                <th>Schedule</th>
                <th>Student Headcount</th>
                <th>Photos</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action Desk</th>
              </tr>
            </thead>
            <tbody>
              {filteredDuties.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    <School size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--brand-navy)' }}>No Classroom EDP Duties Found</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Try adjusting your filters or assign a new classroom duty.</div>
                  </td>
                </tr>
              ) : (
                filteredDuties.map(duty => {
                  const photosCount = (duty.photos || []).length + (duty.evidenceList || []).length;
                  const attendancePct = duty.totalStudents && duty.totalStudents > 0 
                    ? Math.round(((duty.presentStudents || 0) / duty.totalStudents) * 100) 
                    : 0;

                  const isAssignedToMe = duty.assignedUserId === user?.id || duty.facultyId === user?.id || (user?.name && duty.assignedUserName?.toLowerCase().includes(user.name.toLowerCase()));

                  return (
                    <tr key={duty.id}>
                      {/* Duty Code & Date */}
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                          {duty.dutyCode}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CalendarDays size={12} /> {duty.dutyDate}
                        </div>
                      </td>

                      {/* Assigned Faculty */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {duty.assignedUserName || duty.facultyName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {duty.assignedUserDesignation || duty.facultyDesignation || 'Faculty Member'}
                        </div>
                      </td>

                      {/* Class, Division & Room */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {duty.programName || 'B.Tech CSE'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {duty.divisionName || 'Div A'} • <strong style={{ color: 'var(--brand-orange)' }}>{duty.roomNo || duty.classroom}</strong>
                        </div>
                      </td>

                      {/* Subject */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--brand-navy)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={duty.subjectName}>
                          {duty.subjectName || 'Academic Lecture Session'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {duty.subjectCode || 'ACAD-01'}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} color="var(--brand-navy)" /> {duty.startTime} - {duty.endTime}
                        </div>
                      </td>

                      {/* Headcount */}
                      <td>
                        {duty.status === 'ASSIGNED' ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Total Enrolled: {duty.totalStudents || 60}
                          </span>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                              <span style={{ color: '#059669' }}>{duty.presentStudents || 0} Present</span> / {duty.totalStudents || 0}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                              <div style={{ flex: 1, height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', width: '60px' }}>
                                <div style={{ width: `${Math.min(100, attendancePct)}%`, height: '100%', background: attendancePct >= 75 ? '#10B981' : '#F59E0B' }} />
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{attendancePct}%</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Photos Count */}
                      <td>
                        {photosCount > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span className="badge badge-navy" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>
                              <Camera size={12} /> {photosCount} Photos
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No photos</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {renderStatusBadge(duty.status)}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          
                          {/* Enter Classroom / Start Duty Button */}
                          {duty.status === 'ASSIGNED' && (isAssignedToMe || canManageDuties) && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleStartDuty(duty)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}
                              title="Enter Classroom & Start Recording"
                            >
                              <PlayCircle size={13} /> Enter Class
                            </button>
                          )}

                          {/* Record / Submit Report Button */}
                          {duty.status === 'IN_PROGRESS' && (isAssignedToMe || canManageDuties) && (
                            <button
                              type="button"
                              className="btn btn-warning btn-xs"
                              onClick={() => handleOpenRecordModal(duty)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
                              title="Record Student Count & Upload Photos"
                            >
                              <Edit3 size={13} /> Record Duty
                            </button>
                          )}

                          {/* View Detail / Slip Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenDetailModal(duty)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}
                            title="View Classroom Duty Slip & Evidence"
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* Admin Review / Verify Button */}
                          {duty.status === 'SUBMITTED' && canManageDuties && (
                            <button
                              type="button"
                              className="btn btn-xs"
                              style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 700 }}
                              onClick={() => handleOpenReviewModal(duty)}
                              title="Review & Verify Duty Report"
                            >
                              <ShieldCheck size={13} /> Verify
                            </button>
                          )}

                          {/* Delete Button (Admin Only) */}
                          {canManageDuties && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              style={{ color: '#EF4444' }}
                              onClick={() => handleDeleteDuty(duty.id)}
                              title="Delete Duty"
                            >
                              <Trash2 size={13} />
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

      {/* ════════════════════════════════════════════════════════════════════════
          ─── MODAL 1: ASSIGN CLASSROOM EDP DUTY (ADMIN / HOD) ───
      ════════════════════════════════════════════════════════════════════════ */}
      {isAssignModalOpen && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <School size={22} color="var(--brand-orange)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Assign New Classroom EDP Duty</h3>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>Schedule faculty member for classroom monitoring and student headcount reporting</p>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAssignModalOpen(false)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignDutySubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Academic Department *</label>
                    <select
                      className="form-select"
                      required
                      value={assignDeptId}
                      onChange={e => setAssignDeptId(e.target.value)}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Faculty Staff *</label>
                    <select
                      className="form-select"
                      required
                      value={assignFacultyId}
                      onChange={e => setAssignFacultyId(e.target.value)}
                    >
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>{f.name} — {f.designation}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Academic Program *</label>
                    <select
                      className="form-select"
                      required
                      value={assignProgramId}
                      onChange={e => setAssignProgramId(e.target.value)}
                    >
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <select
                      className="form-select"
                      required
                      value={assignSemesterId}
                      onChange={e => setAssignSemesterId(e.target.value)}
                    >
                      {semesters.map(s => (
                        <option key={s.id} value={s.id}>Semester {s.number}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Division *</label>
                    <select
                      className="form-select"
                      required
                      value={assignDivisionId}
                      onChange={e => setAssignDivisionId(e.target.value)}
                    >
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select
                      className="form-select"
                      required
                      value={assignSubjectId}
                      onChange={e => setAssignSubjectId(e.target.value)}
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Classroom / Room No *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Room 302 (Block A)"
                      value={assignRoomNo}
                      onChange={e => setAssignRoomNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Duty Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={assignDutyDate}
                      onChange={e => setAssignDutyDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="09:30 AM"
                      value={assignStartTime}
                      onChange={e => setAssignStartTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="11:30 AM"
                      value={assignEndTime}
                      onChange={e => setAssignEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Enrolled Students (Auto-suggested from class enrollment)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={assignTotalStudents}
                    onChange={e => setAssignTotalStudents(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duty Responsibilities &amp; Special Instructions</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={assignInstructions}
                    onChange={e => setAssignInstructions(e.target.value)}
                  />
                </div>

              </div>

              <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                  <UserPlus size={16} /> Confirm Duty Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── MODAL 2: ENTER CLASSROOM & RECORD DUTY REPORT (FACULTY) ───
      ════════════════════════════════════════════════════════════════════════ */}
      {isRecordDutyModalOpen && selectedDuty && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '850px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.45rem', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-md)' }}>
                  <School size={24} color="var(--brand-orange)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    Classroom EDP Duty Recording — {selectedDuty.dutyCode}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
                    Faculty: <strong>{selectedDuty.assignedUserName}</strong> • Date: <strong>{selectedDuty.dutyDate}</strong> • Slot: <strong>{selectedDuty.startTime} - {selectedDuty.endTime}</strong>
                  </p>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsRecordDutyModalOpen(false)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDutyReport} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* ── Section 1: Classroom & Session Details Verification ── */}
                <div style={{ background: '#F8FAFC', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={16} color="var(--brand-orange)" /> Step 1: Verify Classroom &amp; Subject Details
                  </div>
                  
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Classroom / Room No *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        value={recordRoomNo}
                        onChange={e => setRecordRoomNo(e.target.value)}
                        placeholder="e.g. Room 302 (Block A)"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Subject Under Session *</label>
                      <select
                        className="form-select"
                        required
                        value={recordSubjectId}
                        onChange={e => setRecordSubjectId(e.target.value)}
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Class: <strong>{selectedDuty.programName || 'B.Tech CSE'} ({selectedDuty.divisionName || 'Division A'})</strong> • Department: <strong>{selectedDuty.departmentName || 'Computer Engineering'}</strong>
                  </div>
                </div>

                {/* ── Section 2: Student Headcount Recording ── */}
                <div style={{ background: '#EFF6FF', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={16} color="#2563EB" /> Step 2: Record Classroom Student Headcount
                    </div>
                    {recordTotalStudents > 0 && (
                      <span className="badge badge-navy" style={{ background: '#1E40AF', color: '#FFFFFF' }}>
                        Attendance: {Math.round((recordPresentStudents / recordTotalStudents) * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="grid-3">
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#1E3A8A' }}>Total Enrolled Students *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="form-input"
                        value={recordTotalStudents}
                        onChange={e => handleTotalCountChange(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#047857', fontWeight: 800 }}>Present Students (Counted) *</label>
                      <input
                        type="number"
                        min="0"
                        max={recordTotalStudents}
                        required
                        className="form-input"
                        style={{ borderColor: '#10B981', background: '#F0FDF4', fontWeight: 800, color: '#065F46' }}
                        value={recordPresentStudents}
                        onChange={e => handlePresentCountChange(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#B91C1C' }}>Absent Students (Auto-calculated)</label>
                      <input
                        type="number"
                        readOnly
                        className="form-input"
                        style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B', fontWeight: 700 }}
                        value={recordAbsentStudents}
                      />
                    </div>
                  </div>

                  {recordPresentStudents > recordTotalStudents && (
                    <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={14} /> Validation Error: Present students cannot exceed total enrolled students ({recordTotalStudents}).
                    </div>
                  )}
                </div>

                {/* ── Section 3: Classroom Photo Proofs & Documentation ── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Camera size={16} color="var(--brand-orange)" /> Step 3: Capture / Upload Required Classroom Photos ({recordPhotos.length})
                    </div>

                    <label className="btn btn-secondary btn-xs" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                      <Upload size={13} /> Custom Photo Upload
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFileUpload} />
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress !== null && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
                        <span>Uploading Classroom Photo Proof...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--brand-orange)', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Quick Photo Capture Presets */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                      { key: 'Front View', label: '📸 Capture Front Classroom View' },
                      { key: 'Back View', label: '📸 Capture Back Classroom View' },
                      { key: 'Podium View', label: '📸 Capture Teacher / Podium' },
                      { key: 'Attendance Sheet', label: '📄 Capture Attendance Register' }
                    ].map(preset => (
                      <button
                        key={preset.key}
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleAddSamplePhoto(preset.key)}
                        style={{ fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Photo Proofs Grid */}
                  {recordPhotos.length === 0 ? (
                    <div style={{ border: '2px dashed #CBD5E1', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: '#F8FAFC' }}>
                      <ImageIcon size={36} style={{ margin: '0 auto 0.5rem auto', color: '#94A3B8' }} />
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>No Classroom Photos Captured Yet</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Click any of the quick capture buttons above or upload your classroom photos.
                      </div>
                    </div>
                  ) : (
                    <div className="grid-3" style={{ gap: '0.75rem' }}>
                      {recordPhotos.map((photo, idx) => (
                        <div key={photo.id} style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }}>
                          <img
                            src={photo.photoUrl}
                            alt={photo.caption}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setPreviewPhotoUrl(photo.photoUrl)}
                          />
                          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {photo.caption}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{photo.fileSize || '2.0 MB'}</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                style={{ color: '#EF4444', padding: '0.15rem 0.35rem', height: 'auto' }}
                                onClick={() => handleDeletePhoto(photo.id)}
                                title="Delete Photo"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Section 4: Remarks & Observations ── */}
                <div className="form-group">
                  <label className="form-label">Classroom Observations &amp; Remarks</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Enter observations on student discipline, teaching aids, audiovisual projector, lighting, or session coverage..."
                    value={recordRemarks}
                    onChange={e => setRecordRemarks(e.target.value)}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All photos and headcount will be audited and archived.
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsRecordDutyModalOpen(false)}>
                    Close
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: '#059669', borderColor: '#059669' }}
                  >
                    <Send size={16} /> Submit Classroom Duty Report
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── MODAL 3: REVIEW & VERIFY DUTY REPORT (ADMIN / HOD) ───
      ════════════════════════════════════════════════════════════════════════ */}
      {isReviewModalOpen && selectedDuty && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="var(--brand-orange)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Review &amp; Verify Classroom EDP Duty</h3>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>Duty ID: <strong>{selectedDuty.dutyCode}</strong> • Faculty: <strong>{selectedDuty.assignedUserName}</strong></p>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsReviewModalOpen(false)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVerifyDutyConfirm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Summary Box */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div><strong>Classroom:</strong> {selectedDuty.roomNo || selectedDuty.classroom}</div>
                  <div><strong>Subject:</strong> {selectedDuty.subjectCode} — {selectedDuty.subjectName}</div>
                  <div><strong>Duty Date:</strong> {selectedDuty.dutyDate} ({selectedDuty.startTime} - {selectedDuty.endTime})</div>
                  <div><strong>Headcount:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>{selectedDuty.presentStudents || 0} Present</span> / {selectedDuty.totalStudents || 0} Enrolled ({selectedDuty.absentStudents || 0} Absent)</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Faculty Remarks:</strong> <em>"{selectedDuty.remarks || 'No remarks provided.'}"</em>
                  </div>
                </div>

                {/* Photo Previews */}
                {(selectedDuty.photos || []).length > 0 && (
                  <div>
                    <label className="form-label">Submitted Classroom Photo Proofs ({(selectedDuty.photos || []).length})</label>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {(selectedDuty.photos || []).map(photo => (
                        <img
                          key={photo.id}
                          src={photo.photoUrl}
                          alt={photo.caption}
                          style={{ width: '130px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                          onClick={() => setPreviewPhotoUrl(photo.photoUrl)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Decision */}
                <div className="form-group">
                  <label className="form-label">Verification Status Decision *</label>
                  <select
                    className="form-select"
                    required
                    value={reviewStatus}
                    onChange={e => setReviewStatus(e.target.value as EdpDutyStatus)}
                  >
                    <option value="VERIFIED">✅ VERIFIED (Approve &amp; Archive)</option>
                    <option value="REJECTED">❌ REJECTED (Request Revision / Recount)</option>
                  </select>
                </div>

                {/* Review Remarks */}
                <div className="form-group">
                  <label className="form-label">Administrative Verification Remarks *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-input"
                    placeholder="Enter review findings, attendance audit confirmation, or revision instructions..."
                    value={reviewRemarks}
                    onChange={e => setReviewRemarks(e.target.value)}
                  />
                </div>

              </div>

              <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: reviewStatus === 'VERIFIED' ? '#059669' : '#DC2626', borderColor: reviewStatus === 'VERIFIED' ? '#059669' : '#DC2626' }}
                >
                  <CheckCircle2 size={16} /> Confirm Verification Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── MODAL 4: COMPREHENSIVE CLASSROOM DUTY DOSSIER & SLIP (PRINTABLE) ───
      ════════════════════════════════════════════════════════════════════════ */}
      {isDetailModalOpen && selectedDuty && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '820px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <School size={22} color="var(--brand-orange)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Official Classroom EDP Duty Record Slip</h3>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>Ref: {selectedDuty.dutyCode} • Status: {selectedDuty.status}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary btn-xs" onClick={() => window.print()} style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }}>
                  <Printer size={14} /> Print Slip
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsDetailModalOpen(false)} style={{ color: '#FFFFFF' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Slip Header Banner */}
              <div style={{ borderBottom: '2px solid var(--brand-navy)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                    SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    SSCIT Academic Duty Verification &amp; Classroom Monitoring Cell
                  </div>
                </div>
                <div>
                  {renderStatusBadge(selectedDuty.status)}
                </div>
              </div>

              {/* Grid Record Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>DUTY CODE / ID</div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{selectedDuty.dutyCode}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>DUTY DATE &amp; TIME</div>
                  <div style={{ fontWeight: 700 }}>{selectedDuty.dutyDate} ({selectedDuty.startTime} - {selectedDuty.endTime})</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ASSIGNED FACULTY</div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{selectedDuty.assignedUserName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedDuty.assignedUserDesignation}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>DEPARTMENT &amp; INSTITUTE</div>
                  <div style={{ fontWeight: 700 }}>{selectedDuty.departmentName || 'Computer Engineering'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedDuty.instituteName || 'Swarrnim Institute of Technology'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CLASS &amp; DIVISION</div>
                  <div style={{ fontWeight: 700 }}>{selectedDuty.programName || 'B.Tech CSE'} ({selectedDuty.divisionName || 'Division A'})</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CLASSROOM / ROOM NO</div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-orange)' }}>{selectedDuty.roomNo || selectedDuty.classroom}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SUBJECT</div>
                  <div style={{ fontWeight: 700 }}>{selectedDuty.subjectCode} — {selectedDuty.subjectName}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SUBMISSION TIMESTAMP</div>
                  <div style={{ fontWeight: 700 }}>{selectedDuty.submittedAt ? new Date(selectedDuty.submittedAt).toLocaleString() : 'Pending Submission'}</div>
                </div>
              </div>

              {/* Headcount Statistics Card */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={16} /> Verified Classroom Student Headcount
                </div>
                <div className="grid-4" style={{ textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Enrolled</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{selectedDuty.totalStudents || 0}</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Present Count</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>{selectedDuty.presentStudents || 0}</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Absent Count</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626' }}>{selectedDuty.absentStudents || 0}</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance %</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563EB' }}>
                      {selectedDuty.totalStudents && selectedDuty.totalStudents > 0 
                        ? `${Math.round(((selectedDuty.presentStudents || 0) / selectedDuty.totalStudents) * 100)}%` 
                        : '0%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Proof Gallery */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Camera size={16} color="var(--brand-orange)" /> Classroom Photo Proofs ({(selectedDuty.photos || []).length})
                </div>

                {(selectedDuty.photos || []).length === 0 ? (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No photos submitted for this duty record.
                  </div>
                ) : (
                  <div className="grid-3" style={{ gap: '0.75rem' }}>
                    {(selectedDuty.photos || []).map(photo => (
                      <div key={photo.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setPreviewPhotoUrl(photo.photoUrl)}
                        />
                        <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-navy)' }}>
                          {photo.caption}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Faculty Remarks & Verification Sign-off */}
              <div className="grid-2">
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>FACULTY OBSERVATIONS</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontStyle: selectedDuty.remarks ? 'normal' : 'italic' }}>
                    {selectedDuty.remarks || 'No remarks recorded.'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>ADMIN / HOD VERIFICATION</div>
                  {selectedDuty.verifiedAt ? (
                    <div style={{ fontSize: '0.8125rem' }}>
                      <div style={{ fontWeight: 700, color: '#059669' }}>Verified by {selectedDuty.verifiedByAdminName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {new Date(selectedDuty.verifiedAt).toLocaleString()}</div>
                      <div style={{ marginTop: '0.25rem', color: 'var(--text-primary)' }}>"{selectedDuty.verificationRemarks}"</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Awaiting administrative sign-off.
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX PHOTO PREVIEW MODAL ─── */}
      {previewPhotoUrl && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)' }} onClick={() => setPreviewPhotoUrl(null)}>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <img src={previewPhotoUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-md)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', top: '-2.5rem', right: '0', color: '#FFFFFF' }}
              onClick={() => setPreviewPhotoUrl(null)}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ─── REPORTS & ANALYTICS MODAL ─── */}
      <DashboardReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        dashboardType="EDP_DUTY"
        user={user}
        role={role}
        currentFilters={{
          startDate: filterDateFrom,
          endDate: filterDateTo,
          searchQuery
        }}
      />

    </div>
  );
};
