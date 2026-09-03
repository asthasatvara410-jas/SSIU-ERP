import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { attendanceService, StudentImportRow, AttendanceImportRow } from '../../services/attendanceService';
import { Badge } from '../../components/common/Badge';
import { AttendanceSession, AttendanceStatus } from '../../types';
import { 
  Users, CheckCircle2, Clock, Search,
  Save, AlertTriangle, BarChart3, UserCheck, FileText,
  Upload, Eye, Edit3, Trash2, Download, RefreshCw, X,
  FileSpreadsheet, Printer
} from 'lucide-react';
import { ExcelTableContainer, ExcelTable } from '../../components/common/ExcelTable';
import * as XLSX from 'xlsx';

export interface AttendancePageProps {
  initialTab?: 'ATTENDANCE' | 'HISTORY' | 'SUBJECT_STATS' | 'REPORTS' | 'IMPORT_STUDENTS' | 'IMPORT_ATTENDANCE' | 'TEMPLATES' | 'APPLICATIONS' | 'MY_APPLICATIONS';
}

import { StudentAttendancePage } from './StudentAttendancePage';

type TabType = 'ATTENDANCE' | 'HISTORY' | 'SUBJECT_STATS' | 'REPORTS' | 'IMPORT_STUDENTS' | 'IMPORT_ATTENDANCE' | 'TEMPLATES';

export const AttendancePage: React.FC<AttendancePageProps> = ({ initialTab = 'ATTENDANCE' }) => {
  const { user, role } = useAuth();

  // Defense-in-depth guard: Students MUST NOT access faculty attendance marking interface
  if (role === 'STUDENT') {
    return <StudentAttendancePage />;
  }

  // Active Tab state
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialTab === 'HISTORY') return 'HISTORY';
    if (initialTab === 'SUBJECT_STATS') return 'SUBJECT_STATS';
    if (initialTab === 'REPORTS') return 'REPORTS';
    if (initialTab === 'IMPORT_STUDENTS') return 'IMPORT_STUDENTS';
    if (initialTab === 'IMPORT_ATTENDANCE') return 'IMPORT_ATTENDANCE';
    if (initialTab === 'TEMPLATES') return 'TEMPLATES';
    return 'ATTENDANCE';
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ERP Master Collections
  const subjects = useMemo(() => attendanceService.getFacultySubjects(user, role || undefined), [user, role, refreshKey]);
  const divisions = useMemo(() => db.getDivisions(), [refreshKey]);
  const programs = useMemo(() => db.getPrograms(), [refreshKey]);
  const departments = useMemo(() => db.getDepartments(), [refreshKey]);
  const semesters = useMemo(() => db.getSemesters(), [refreshKey]);
  const allSessions = useMemo(() => db.getAttendanceSessions(), [refreshKey]);

  // ─── 1. TAB 1: MARK ATTENDANCE STATE ───────────────────────────────────────
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sub-dsa');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(divisions[0]?.id || 'div-cse-4a');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lectureNo, setLectureNo] = useState<number>(1);
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 11:00 AM');
  const [topicTaught, setTopicTaught] = useState<string>('Binary Search Trees & Balancing Operations');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Active student roster for selected subject/division
  const activeRoster = useMemo(() => {
    return attendanceService.getStudentRoster(selectedSubjectId, selectedDivisionId);
  }, [selectedSubjectId, selectedDivisionId, refreshKey]);

  // Attendance marking state (StudentId -> Status & Remarks)
  const [markingState, setMarkingState] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  // Reset or initialize marking state when roster or editing session changes
  useEffect(() => {
    if (editingSessionId) {
      const sess = allSessions.find(s => s.id === editingSessionId);
      if (sess) {
        const state: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        sess.records.forEach(r => {
          state[r.studentId] = { status: r.status, remarks: r.remarks || '' };
        });
        setMarkingState(state);
        return;
      }
    }

    const state: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    activeRoster.forEach((stu, idx) => {
      // Default: Most present, 1 or 2 absent/late for realistic initial state
      const seedStatus: AttendanceStatus = (idx === 2 || idx === 7) ? 'ABSENT' : (idx === 4) ? 'LATE' : 'PRESENT';
      state[stu.id] = { status: seedStatus, remarks: '' };
    });
    setMarkingState(state);
  }, [activeRoster, editingSessionId]);

  // Duplicate session check
  const duplicateSession = useMemo(() => {
    if (editingSessionId) return null;
    return attendanceService.checkDuplicateSession(selectedSubjectId, selectedDivisionId, selectedDate, lectureNo);
  }, [selectedSubjectId, selectedDivisionId, selectedDate, lectureNo, editingSessionId, allSessions]);

  // Filtered roster for table display
  const filteredRoster = useMemo(() => {
    return activeRoster.filter(stu => {
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = stu.name.toLowerCase().includes(q);
        const matchEnroll = (stu.enrollmentNo || '').toLowerCase().includes(q);
        const matchRoll = (stu.rollNo || '').toLowerCase().includes(q);
        if (!matchName && !matchEnroll && !matchRoll) return false;
      }

      if (statusFilter !== 'ALL') {
        const curr = markingState[stu.id]?.status || 'PRESENT';
        if (curr !== statusFilter) return false;
      }

      return true;
    });
  }, [activeRoster, studentSearch, statusFilter, markingState]);

  // Quick statistics calculated live for current session
  const sessionStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    activeRoster.forEach(stu => {
      const st = markingState[stu.id]?.status || 'PRESENT';
      if (st === 'PRESENT') present++;
      else if (st === 'ABSENT') absent++;
      else if (st === 'LATE') late++;
    });
    const total = activeRoster.length;
    const effectivePresent = present + late;
    const percentage = total > 0 ? Math.round((effectivePresent / total) * 10000) / 100 : 100;
    return { total, present, absent, late, percentage };
  }, [activeRoster, markingState]);

  // Handle Mark Status Toggle for single student
  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setMarkingState(prev => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || ''
      }
    }));
  };

  // Handle Bulk Status Toggles
  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    activeRoster.forEach(stu => {
      next[stu.id] = { status, remarks: markingState[stu.id]?.remarks || '' };
    });
    setMarkingState(next);
    showToast('info', `Marked all ${activeRoster.length} students as ${status}.`);
  };

  // Submit Attendance Handler
  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubjectId || !selectedDivisionId) {
      showToast('error', 'Please select both Subject and Division.');
      return;
    }

    if (duplicateSession && !editingSessionId) {
      showToast('error', 'Attendance already exists for this lecture. Edit existing record instead.');
      return;
    }

    const records = activeRoster.map(stu => ({
      studentId: stu.id,
      studentName: stu.name,
      enrollmentNo: stu.enrollmentNo || `23010100${stu.id}`,
      status: markingState[stu.id]?.status || 'PRESENT',
      remarks: markingState[stu.id]?.remarks || ''
    }));

    attendanceService.saveAttendanceSession({
      id: editingSessionId || undefined,
      subjectId: selectedSubjectId,
      divisionId: selectedDivisionId,
      date: selectedDate,
      lectureNo,
      timeSlot,
      topicTaught,
      records
    }, user);

    showToast('success', editingSessionId ? 'Attendance updated successfully!' : `Attendance submitted for ${records.length} students!`);
    setEditingSessionId(null);
    setRefreshKey(k => k + 1);
  };

  // ─── 2. TAB 2: ATTENDANCE HISTORY STATE ───────────────────────────────────
  const [historySearch, setHistorySearch] = useState('');
  const [historySubjectFilter, setHistorySubjectFilter] = useState('ALL');
  const [viewingHistorySession, setViewingHistorySession] = useState<AttendanceSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    return allSessions.filter(sess => {
      if (historySubjectFilter !== 'ALL' && sess.subjectId !== historySubjectFilter) {
        return false;
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const subj = subjects.find(s => s.id === sess.subjectId);
        const matchSubj = (subj?.name || '').toLowerCase().includes(q) || (subj?.code || '').toLowerCase().includes(q);
        const matchTopic = (sess.topicTaught || '').toLowerCase().includes(q);
        const matchDate = sess.date.includes(q);
        if (!matchSubj && !matchTopic && !matchDate) return false;
      }
      return true;
    });
  }, [allSessions, historySubjectFilter, historySearch, subjects]);

  const handleEditHistorySession = (sess: AttendanceSession) => {
    setSelectedSubjectId(sess.subjectId);
    setSelectedDivisionId(sess.divisionId);
    setSelectedDate(sess.date);
    setLectureNo(sess.lectureNo);
    setTopicTaught(sess.topicTaught || '');
    setEditingSessionId(sess.id);
    setActiveTab('ATTENDANCE');
    showToast('info', `Loaded Lecture #${sess.lectureNo} (${sess.date}) for editing.`);
  };

  const handleConfirmDeleteSession = () => {
    if (!deletingSessionId) return;
    attendanceService.deleteAttendanceSession(deletingSessionId, user);
    setDeletingSessionId(null);
    setRefreshKey(k => k + 1);
    showToast('success', 'Attendance session deleted.');
  };

  // ─── 3. TAB 3: SUBJECT ATTENDANCE (75% RULE) STATE ────────────────────────
  const [statSubjectId, setStatSubjectId] = useState<string>(subjects[0]?.id || 'sub-dsa');
  const [statDivisionId, setStatDivisionId] = useState<string>(divisions[0]?.id || 'div-cse-4a');
  const [statSearch, setStatSearch] = useState('');

  const subjectSummaryList = useMemo(() => {
    const list = attendanceService.getSubjectAttendanceSummary(statSubjectId, statDivisionId);
    if (!statSearch.trim()) return list;
    const q = statSearch.toLowerCase();
    return list.filter(item => 
      item.studentName.toLowerCase().includes(q) || 
      item.enrollmentNo.toLowerCase().includes(q) ||
      item.rollNo.includes(q)
    );
  }, [statSubjectId, statDivisionId, statSearch, refreshKey]);

  // ─── 4. TAB 4: REPORTS STATE ──────────────────────────────────────────────
  const [reportType, setReportType] = useState<'DAILY' | 'SUBJECT' | 'STUDENT' | 'SHORTAGE' | 'MONTHLY'>('SUBJECT');
  const [reportSubjectId, setReportSubjectId] = useState('ALL');
  const [reportDivisionId, setReportDivisionId] = useState('ALL');

  const handleExportReportExcel = () => {
    const { workbookBuffer, filename } = attendanceService.generateOfficialAttendanceExcelReport({
      reportType,
      subjectId: reportSubjectId,
      divisionId: reportDivisionId,
      facultyName: user?.name || 'Prof. Demo Faculty',
      academicYear: '2026-27'
    });

    const blob = new Blob([workbookBuffer as any], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', `Official University Attendance Report exported successfully (${filename})`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // ─── 5. TAB 5: IMPORT STUDENTS STATE ──────────────────────────────────────
  const [studentImportFile, setStudentImportFile] = useState<File | null>(null);
  const [studentValidationResult, setStudentValidationResult] = useState<{
    totalRows: number;
    validRows: StudentImportRow[];
    invalidRows: StudentImportRow[];
    duplicateRows: StudentImportRow[];
    existingRows: StudentImportRow[];
  } | null>(null);
  const [isImportingStudents, setIsImportingStudents] = useState(false);
  const [classImportContext, setClassImportContext] = useState({
    programId: programs[0]?.id || 'prog-1',
    departmentId: departments[0]?.id || 'dept-1',
    semesterId: semesters[3]?.id || 'sem-cse-4',
    divisionId: divisions[0]?.id || 'div-cse-4a',
    batch: '2023-2027',
    academicYear: '2026-27'
  });

  const handleStudentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudentImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        const result = attendanceService.parseAndValidateStudentExcel(buffer);
        setStudentValidationResult(result);
        showToast('info', `Validated ${result.totalRows} student rows from Excel.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmStudentImport = () => {
    if (!studentValidationResult || studentValidationResult.validRows.length === 0) return;
    setIsImportingStudents(true);

    setTimeout(() => {
      const count = attendanceService.commitStudentImport(studentValidationResult.validRows, classImportContext, user);
      setIsImportingStudents(false);
      setStudentValidationResult(null);
      setStudentImportFile(null);
      setRefreshKey(k => k + 1);
      showToast('success', `Successfully imported ${count} students into central ERP database!`);
    }, 600);
  };

  const handleDownloadStudentErrorReport = () => {
    if (!studentValidationResult || studentValidationResult.invalidRows.length === 0) return;
    const errors = studentValidationResult.invalidRows.map(r => ({
      'Row Number': r.rowNumber,
      'Enrollment No': r.enrollmentNo,
      'Student Name': r.name,
      'Identified Issues': r.errors.join('; '),
      'Suggested Correction': 'Check email format, unique enrollment number, and required fields.'
    }));

    const ws = XLSX.utils.json_to_sheet(errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation_Errors');
    XLSX.writeFile(wb, 'Student_Import_Validation_Errors.xlsx');
  };

  // ─── 6. TAB 6: IMPORT ATTENDANCE STATE ────────────────────────────────────
  const [attendanceImportFile, setAttendanceImportFile] = useState<File | null>(null);
  const [attendanceValidationResult, setAttendanceValidationResult] = useState<{
    totalRows: number;
    validRows: AttendanceImportRow[];
    invalidRows: AttendanceImportRow[];
  } | null>(null);
  const [isImportingAttendance, setIsImportingAttendance] = useState(false);

  const handleAttendanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttendanceImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        const result = attendanceService.parseAndValidateAttendanceExcel(buffer);
        setAttendanceValidationResult(result);
        showToast('info', `Validated ${result.totalRows} attendance rows.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmAttendanceImport = () => {
    if (!attendanceValidationResult || attendanceValidationResult.validRows.length === 0) return;
    setIsImportingAttendance(true);

    setTimeout(() => {
      const count = attendanceService.commitAttendanceImport(attendanceValidationResult.validRows, user);
      setIsImportingAttendance(false);
      setAttendanceValidationResult(null);
      setAttendanceImportFile(null);
      setRefreshKey(k => k + 1);
      showToast('success', `Imported ${count} attendance records successfully!`);
    }, 600);
  };

  // ─── 7. TAB 7: TEMPLATE DOWNLOADERS ───────────────────────────────────────
  const handleDownloadTemplate = (type: 'STUDENT_MASTER' | 'CLASS_STUDENTS' | 'SUBJECT_ENROLLMENT' | 'ATTENDANCE_IMPORT') => {
    const bytes = attendanceService.generateTemplateWorkbook(type);
    const blob = new Blob([bytes as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSIU_${type}_Template.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', `Downloaded ${type} template.`);
  };

  // Active Subject & Division Info
  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const activeDivision = divisions.find(d => d.id === selectedDivisionId) || divisions[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999, padding: '0.85rem 1.25rem',
          background: toast.type === 'success' ? '#D1FAE5' : toast.type === 'error' ? '#FEE2E2' : '#E0F2FE',
          border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : toast.type === 'error' ? '#FECACA' : '#BAE6FD'}`,
          borderRadius: '8px', color: toast.type === 'success' ? '#065F46' : toast.type === 'error' ? '#991B1B' : '#0369A1',
          fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── 1. Attendance Header & Quick Statistics ───────────────────────── */}
      <div className="card" style={{ 
        padding: '1.35rem 1.75rem', 
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', 
        color: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(11,25,44,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Users size={24} color="#F37023" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Attendance Management
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94A3B8' }}>
              Mark, manage, import and review student attendance by class, subject and lecture.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button"
              onClick={() => { setRefreshKey(k => k + 1); showToast('info', 'Attendance database synchronized.'); }}
              className="btn btn-outline"
              style={{ 
                borderColor: 'rgba(255,255,255,0.3)', 
                color: '#FFFFFF', 
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                fontWeight: 700,
                background: 'rgba(255,255,255,0.08)'
              }}
            >
              <RefreshCw size={14} /> Sync Database
            </button>
          </div>
        </div>

        {/* 5-Column Context Strip */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.18)',
          fontSize: '0.8125rem'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Academic Year</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>2026-27</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Faculty Name</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{user?.name || 'Demo Faculty 1'}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
            <strong style={{ color: '#38BDF8', fontSize: '0.95rem' }}>Computer Science &amp; Engineering</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Semester</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>Semester 4 (Division A)</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Current Date</span>
            <strong style={{ color: '#F37023', fontFamily: 'monospace', fontSize: '0.95rem' }}>26 Aug 2026</strong>
          </div>
        </div>

        {/* Quick Statistics KPI Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '0.75rem', 
          marginTop: '1.25rem',
          background: 'rgba(0,0,0,0.25)',
          padding: '0.85rem 1rem',
          borderRadius: '8px'
        }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1', textTransform: 'uppercase', fontWeight: 700 }}>Total Students</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF' }}>{sessionStats.total}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#6EE7B7', textTransform: 'uppercase', fontWeight: 700 }}>Present</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34D399' }}>{sessionStats.present}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#FCA5A5', textTransform: 'uppercase', fontWeight: 700 }}>Absent</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F87171' }}>{sessionStats.absent}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#FDE68A', textTransform: 'uppercase', fontWeight: 700 }}>Late</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FBBF24' }}>{sessionStats.late}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#93C5FD', textTransform: 'uppercase', fontWeight: 700 }}>Attendance %</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: sessionStats.percentage >= 75 ? '#38BDF8' : '#F87171' }}>
              {sessionStats.percentage}%
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#CBD5E1', textTransform: 'uppercase', fontWeight: 700 }}>Classes Today</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F37023' }}>3 Sessions</div>
          </div>
        </div>
      </div>

      {/* ─── 2. Attendance Navigation Tabs ─────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        gap: '0.4rem', 
        borderBottom: '2px solid var(--border-color, #E2E8F0)', 
        paddingBottom: '0.1rem',
        overflowX: 'auto'
      }}>
        {[
          { key: 'ATTENDANCE', label: '1. Mark Attendance', icon: UserCheck },
          { key: 'HISTORY', label: '2. Attendance History', icon: Clock, count: allSessions.length },
          { key: 'SUBJECT_STATS', label: '3. Subject Attendance', icon: BarChart3 },
          { key: 'REPORTS', label: '4. Attendance Reports', icon: FileText },
          { key: 'IMPORT_STUDENTS', label: '5. Import Students', icon: Upload },
          { key: 'IMPORT_ATTENDANCE', label: '6. Import Attendance', icon: FileSpreadsheet },
          { key: 'TEMPLATES', label: '7. Templates', icon: Download }
        ].map(tabItem => {
          const isActive = activeTab === tabItem.key;
          const TabIcon = tabItem.icon;

          return (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setActiveTab(tabItem.key as TabType)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid var(--brand-orange, #F37023)' : '3px solid transparent',
                color: isActive ? 'var(--brand-orange, #F37023)' : 'var(--text-muted, #64748B)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <TabIcon size={15} /> {tabItem.label}
              {tabItem.count !== undefined && tabItem.count > 0 && (
                <span style={{ 
                  background: isActive ? 'var(--brand-orange, #F37023)' : 'var(--brand-navy, #0B192C)', 
                  color: '#FFF', 
                  fontSize: '0.65rem', 
                  padding: '1px 6px', 
                  borderRadius: '10px', 
                  fontWeight: 800 
                }}>
                  {tabItem.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: MARK ATTENDANCE ────────────────────────────────────────── */}
      {activeTab === 'ATTENDANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Duplicate Attendance Warning Alert */}
          {duplicateSession && !editingSessionId && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px',
              padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', color: '#92400E'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <AlertTriangle size={18} color="#D97706" />
                <span>Attendance already exists for this lecture (Lecture #{lectureNo} on {selectedDate}).</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setViewingHistorySession(duplicateSession)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  <Eye size={13} /> View Existing Attendance
                </button>
                <button
                  type="button"
                  onClick={() => handleEditHistorySession(duplicateSession)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', fontWeight: 700, background: '#D97706', borderColor: '#D97706' }}
                >
                  <Edit3 size={13} /> Edit Attendance
                </button>
              </div>
            </div>
          )}

          {/* Form Filter Card */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                {editingSessionId ? 'Edit Attendance Session' : 'Lecture Attendance Parameters'}
              </h3>
              {editingSessionId && (
                <button
                  type="button"
                  onClick={() => { setEditingSessionId(null); showToast('info', 'Switched back to new session.'); }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    Subject *
                  </label>
                  <select
                    className="form-control"
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px' }}
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    Division / Class *
                  </label>
                  <select
                    className="form-control"
                    value={selectedDivisionId}
                    onChange={e => setSelectedDivisionId(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px' }}
                    required
                  >
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name} (Sem 4)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    Attendance Date *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    Lecture Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="form-control"
                    value={lectureNo}
                    onChange={e => setLectureNo(Number(e.target.value))}
                    style={{ width: '100%', fontSize: '0.85rem', borderRadius: '6px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    Time Slot
                  </label>
                  <select
                    className="form-control"
                    value={timeSlot}
                    onChange={e => setTimeSlot(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', borderRadius: '6px' }}
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM (Slot 1)</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM (Slot 2)</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM (Slot 3)</option>
                    <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM (Slot 4)</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Lab Practical)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                    Curriculum Topic Taught
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Graph BFS & DFS Implementation"
                    value={topicTaught}
                    onChange={e => setTopicTaught(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Roster Controls & Action Bar */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  
                  {/* Search Student Input */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search student / roll no..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      style={{ paddingLeft: '28px', fontSize: '0.8rem', height: '32px', borderRadius: '5px' }}
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    style={{ width: 'auto', fontSize: '0.8rem', height: '32px', borderRadius: '5px' }}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PRESENT">Present Only</option>
                    <option value="ABSENT">Absent Only</option>
                    <option value="LATE">Late Only</option>
                  </select>

                  {/* Bulk Mark Buttons */}
                  <button
                    type="button"
                    onClick={() => handleMarkAll('PRESENT')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', fontWeight: 700, color: '#059669', borderColor: '#A7F3D0' }}
                  >
                    Mark All Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkAll('ABSENT')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', fontWeight: 700, color: '#DC2626', borderColor: '#FECACA' }}
                  >
                    Mark All Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkAll('LATE')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', fontWeight: 700, color: '#D97706', borderColor: '#FDE68A' }}
                  >
                    Mark All Late
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      fontWeight: 800, fontSize: '0.85rem', padding: '0.55rem 1.4rem',
                      background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)'
                    }}
                  >
                    <Save size={16} /> {editingSessionId ? 'Update Attendance Session' : 'Submit Attendance Session'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Student Attendance Excel Table */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Enrolled Students Attendance Roster ({filteredRoster.length} Candidates)
                </h4>
                <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  Subject: <strong>{activeSubject?.name}</strong> • Division: <strong>{activeDivision?.name}</strong>
                </span>
              </div>

              <Badge variant="navy">{filteredRoster.length} Students</Badge>
            </div>

            <ExcelTableContainer minWidth="980px">
              <ExcelTable>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ width: '65px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Sr. No.</th>
                    <th style={{ width: '130px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Enrollment No.</th>
                    <th style={{ minWidth: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Student Name</th>
                    <th style={{ width: '80px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Roll No.</th>
                    <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Program</th>
                    <th style={{ width: '90px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Semester</th>
                    <th style={{ width: '90px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Division</th>
                    <th style={{ width: '220px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Attendance Status</th>
                    <th style={{ width: '160px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((stu, idx) => {
                    const currentStatus = markingState[stu.id]?.status || 'PRESENT';
                    const currentRemarks = markingState[stu.id]?.remarks || '';

                    return (
                      <tr 
                        key={stu.id}
                        style={{ 
                          background: currentStatus === 'ABSENT' ? '#FEF2F2' : currentStatus === 'LATE' ? '#FFFBEB' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                          transition: 'background 0.15s ease'
                        }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '0.7rem 0.85rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '0.7rem 0.85rem', fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', fontSize: '0.825rem', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          {stu.enrollmentNo || `23010100${idx + 1}`}
                        </td>
                        <td style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          {stu.name}
                        </td>
                        <td style={{ padding: '0.7rem 0.85rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          {stu.rollNo || String(idx + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '0.7rem 0.85rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          BTECH-CSE
                        </td>
                        <td style={{ padding: '0.7rem 0.85rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          Sem 4
                        </td>
                        <td style={{ padding: '0.7rem 0.85rem', textAlign: 'center', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          <Badge variant="navy">Div A</Badge>
                        </td>

                        {/* Status Toggle Buttons */}
                        <td style={{ padding: '0.7rem 0.85rem', textAlign: 'center', borderRight: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '3px', background: '#F1F5F9', padding: '2px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(stu.id, 'PRESENT')}
                              style={{
                                border: 'none', padding: '0.25rem 0.55rem', borderRadius: '4px',
                                fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                                background: currentStatus === 'PRESENT' ? '#10B981' : 'transparent',
                                color: currentStatus === 'PRESENT' ? '#FFFFFF' : '#475569',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              PRESENT
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(stu.id, 'ABSENT')}
                              style={{
                                border: 'none', padding: '0.25rem 0.55rem', borderRadius: '4px',
                                fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                                background: currentStatus === 'ABSENT' ? '#EF4444' : 'transparent',
                                color: currentStatus === 'ABSENT' ? '#FFFFFF' : '#475569',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              ABSENT
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(stu.id, 'LATE')}
                              style={{
                                border: 'none', padding: '0.25rem 0.55rem', borderRadius: '4px',
                                fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                                background: currentStatus === 'LATE' ? '#F59E0B' : 'transparent',
                                color: currentStatus === 'LATE' ? '#FFFFFF' : '#475569',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              LATE
                            </button>
                          </div>
                        </td>

                        {/* Student Remark Input */}
                        <td style={{ padding: '0.7rem 0.85rem', verticalAlign: 'middle' }}>
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={currentRemarks}
                            onChange={e => {
                              const val = e.target.value;
                              setMarkingState(prev => ({
                                ...prev,
                                [stu.id]: {
                                  status: prev[stu.id]?.status || 'PRESENT',
                                  remarks: val
                                }
                              }));
                            }}
                            className="form-control"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.78125rem', height: '28px', borderRadius: '4px' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>
          </div>

        </div>
      )}

      {/* ─── TAB 2: ATTENDANCE HISTORY & LOGS ──────────────────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Attendance Sessions Register &amp; Historical Logs
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Full record of all submitted lecture attendance sessions with present/absent breakdown.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search date, topic..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  style={{ paddingLeft: '28px', fontSize: '0.8rem', height: '34px', borderRadius: '5px' }}
                />
              </div>

              <select
                className="form-control"
                value={historySubjectFilter}
                onChange={e => setHistorySubjectFilter(e.target.value)}
                style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px' }}
              >
                <option value="ALL">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
              </select>
            </div>
          </div>

          <ExcelTableContainer minWidth="1050px">
            <ExcelTable>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Date</th>
                  <th style={{ width: '200px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Subject</th>
                  <th style={{ width: '90px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Division</th>
                  <th style={{ width: '100px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Lecture No.</th>
                  <th style={{ minWidth: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Topic</th>
                  <th style={{ width: '70px', padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#059669', borderRight: '1px solid #E2E8F0' }}>Present</th>
                  <th style={{ width: '70px', padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#DC2626', borderRight: '1px solid #E2E8F0' }}>Absent</th>
                  <th style={{ width: '65px', padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#D97706', borderRight: '1px solid #E2E8F0' }}>Late</th>
                  <th style={{ width: '105px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Attendance %</th>
                  <th style={{ width: '150px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Marked By</th>
                  <th style={{ width: '100px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ width: '160px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((sess, idx) => {
                  const subj = subjects.find(s => s.id === sess.subjectId);
                  const div = divisions.find(d => d.id === sess.divisionId);
                  let p = 0; let a = 0; let l = 0;
                  sess.records.forEach(r => {
                    if (r.status === 'PRESENT') p++;
                    else if (r.status === 'ABSENT') a++;
                    else if (r.status === 'LATE') l++;
                  });
                  const total = sess.records.length;
                  const pct = total > 0 ? Math.round(((p + l) / total) * 1000) / 10 : 0;

                  return (
                    <tr key={sess.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF', borderRight: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                        {sess.date}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9' }}>
                        {subj?.name || sess.subjectId} ({subj?.code || 'CSE'})
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                        <Badge variant="navy">{div?.name || 'Div A'}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #F1F5F9' }}>
                        Lec #{sess.lectureNo}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', borderRight: '1px solid #F1F5F9' }}>
                        {sess.topicTaught || 'Regular Lecture Session'}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#059669', borderRight: '1px solid #F1F5F9' }}>
                        {p}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#DC2626', borderRight: '1px solid #F1F5F9' }}>
                        {a}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#D97706', borderRight: '1px solid #F1F5F9' }}>
                        {l}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: pct >= 75 ? '#059669' : '#DC2626', borderRight: '1px solid #F1F5F9' }}>
                        {pct}%
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.8rem', borderRight: '1px solid #F1F5F9' }}>
                        {sess.facultyName || 'Faculty'}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                        <Badge variant="active">{sess.status || 'SUBMITTED'}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setViewingHistorySession(sess)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', fontWeight: 700 }}
                            title="View Session Details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditHistorySession(sess)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', fontWeight: 700, color: 'var(--brand-orange)' }}
                            title="Edit Attendance Session"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSessionId(sess.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', fontWeight: 700, color: '#DC2626' }}
                            title="Delete Session"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 3: SUBJECT ATTENDANCE (75% RULE GATE) ────────────────────── */}
      {activeTab === 'SUBJECT_STATS' && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Subject-Wise Cumulative Attendance &amp; 75% Rule Eligibility
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Cumulative academic attendance tracking across conducted lectures for examination qualification.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={statSubjectId}
                onChange={e => setStatSubjectId(e.target.value)}
                style={{ width: 'auto', fontSize: '0.8rem', height: '34px', fontWeight: 700 }}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>

              <select
                className="form-control"
                value={statDivisionId}
                onChange={e => setStatDivisionId(e.target.value)}
                style={{ width: 'auto', fontSize: '0.8rem', height: '34px', fontWeight: 700 }}
              >
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <input
                type="text"
                placeholder="Search student..."
                value={statSearch}
                onChange={e => setStatSearch(e.target.value)}
                className="form-control"
                style={{ width: '160px', fontSize: '0.8rem', height: '34px' }}
              />
            </div>
          </div>

          <ExcelTableContainer minWidth="1000px">
            <ExcelTable>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <th style={{ width: '130px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Enrollment No.</th>
                  <th style={{ minWidth: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Student Name</th>
                  <th style={{ width: '80px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Roll No.</th>
                  <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Total Lectures</th>
                  <th style={{ width: '80px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#059669', borderRight: '1px solid #E2E8F0' }}>Present</th>
                  <th style={{ width: '80px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#DC2626', borderRight: '1px solid #E2E8F0' }}>Absent</th>
                  <th style={{ width: '70px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#D97706', borderRight: '1px solid #E2E8F0' }}>Late</th>
                  <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Attendance %</th>
                  <th style={{ width: '140px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>75% Eligibility</th>
                  <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjectSummaryList.map((row, idx) => (
                  <tr key={row.studentId} style={{ background: !row.isEligible ? '#FEF2F2' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', borderRight: '1px solid #F1F5F9' }}>
                      {row.enrollmentNo}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9' }}>
                      {row.studentName}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #F1F5F9' }}>
                      {row.rollNo}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #F1F5F9' }}>
                      {row.totalLectures} Lectures
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#059669', borderRight: '1px solid #F1F5F9' }}>
                      {row.presentCount}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#DC2626', borderRight: '1px solid #F1F5F9' }}>
                      {row.absentCount}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#D97706', borderRight: '1px solid #F1F5F9' }}>
                      {row.lateCount}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 900, color: row.isEligible ? '#059669' : '#DC2626', borderRight: '1px solid #F1F5F9' }}>
                      {row.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 800,
                        background: row.isEligible ? '#DCFCE7' : '#FEE2E2',
                        color: row.isEligible ? '#15803D' : '#991B1B'
                      }}>
                        {row.isEligible ? 'Eligible' : 'Below 75% Requirement'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                      <Badge variant={row.eligibilityStatus === 'GOOD' ? 'active' : row.eligibilityStatus === 'SHORT_ATTENDANCE' ? 'warning' : 'inactive'}>
                        {row.eligibilityStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 4: ATTENDANCE REPORTS ─────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                University Attendance Analytics &amp; Compliance Reports
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Generate official academic compliance registers, shortage notices, and audit worksheets.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleExportReportExcel}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <Download size={14} /> Export Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
              >
                <Printer size={14} /> Print / PDF
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Report Type</label>
              <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value as any)} style={{ fontSize: '0.85rem' }}>
                <option value="SUBJECT">Subject Attendance Summary</option>
                <option value="DAILY">Daily Attendance Register</option>
                <option value="STUDENT">Student-Wise Detailed Log</option>
                <option value="SHORTAGE">Low Attendance Shortage Alert (&lt; 75%)</option>
                <option value="MONTHLY">Monthly Faculty Workload Register</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Subject Filter</label>
              <select className="form-control" value={reportSubjectId} onChange={e => setReportSubjectId(e.target.value)} style={{ fontSize: '0.85rem' }}>
                <option value="ALL">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Division Filter</label>
              <select className="form-control" value={reportDivisionId} onChange={e => setReportDivisionId(e.target.value)} style={{ fontSize: '0.85rem' }}>
                <option value="ALL">All Divisions</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <ExcelTableContainer minWidth="900px">
            <ExcelTable>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <th style={{ width: '130px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Enrollment No.</th>
                  <th style={{ minWidth: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Student Name</th>
                  <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Total Classes</th>
                  <th style={{ width: '90px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#059669', borderRight: '1px solid #E2E8F0' }}>Attended</th>
                  <th style={{ width: '90px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#DC2626', borderRight: '1px solid #E2E8F0' }}>Missed</th>
                  <th style={{ width: '110px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Attendance %</th>
                  <th style={{ width: '140px', padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Exam Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {subjectSummaryList.map((item, idx) => (
                  <tr key={item.studentId} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', borderRight: '1px solid #F1F5F9' }}>
                      {item.enrollmentNo}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9' }}>
                      {item.studentName}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #F1F5F9' }}>
                      {item.totalLectures}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#059669', borderRight: '1px solid #F1F5F9' }}>
                      {item.presentCount + item.lateCount}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#DC2626', borderRight: '1px solid #F1F5F9' }}>
                      {item.absentCount}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 900, color: item.isEligible ? '#059669' : '#DC2626', borderRight: '1px solid #F1F5F9' }}>
                      {item.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 800,
                        background: item.isEligible ? '#DCFCE7' : '#FEE2E2',
                        color: item.isEligible ? '#15803D' : '#991B1B'
                      }}>
                        {item.isEligible ? 'Qualified' : 'Shortage'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 5: IMPORT STUDENTS (BULK EXCEL IMPORT WORKFLOW) ──────────── */}
      {activeTab === 'IMPORT_STUDENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Bulk Student Excel Onboarding &amp; Class Enrollment
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Standardized 7-step student enrollment directly into the centralized University Database.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadTemplate('STUDENT_MASTER')}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <Download size={14} /> Download Student Excel Template
              </button>
            </div>

            {/* Target Class Context Selector */}
            <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Class / Cohort Enrollment Mapping:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Academic Year</label>
                  <select
                    className="form-control"
                    value={classImportContext.academicYear}
                    onChange={e => setClassImportContext(c => ({ ...c, academicYear: e.target.value }))}
                    style={{ fontSize: '0.825rem' }}
                  >
                    <option value="2026-27">2026-27</option>
                    <option value="2025-26">2025-26</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Program</label>
                  <select
                    className="form-control"
                    value={classImportContext.programId}
                    onChange={e => setClassImportContext(c => ({ ...c, programId: e.target.value }))}
                    style={{ fontSize: '0.825rem' }}
                  >
                    {programs.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Semester</label>
                  <select
                    className="form-control"
                    value={classImportContext.semesterId}
                    onChange={e => setClassImportContext(c => ({ ...c, semesterId: e.target.value }))}
                    style={{ fontSize: '0.825rem' }}
                  >
                    {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Division</label>
                  <select
                    className="form-control"
                    value={classImportContext.divisionId}
                    onChange={e => setClassImportContext(c => ({ ...c, divisionId: e.target.value }))}
                    style={{ fontSize: '0.825rem' }}
                  >
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* File Drag / Select Area */}
            <div style={{
              border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '1.75rem',
              textAlign: 'center', background: '#F8FAFC', cursor: 'pointer'
            }}>
              <Upload size={32} color="var(--brand-orange, #F37023)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.95rem' }}>
                {studentImportFile ? studentImportFile.name : 'Select or Drag & Drop Student Master Excel (.xlsx)'}
              </div>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.85rem' }}>
                Strictly .xlsx Excel files matching the official ERP column template.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleStudentFileUpload}
                id="student-excel-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="student-excel-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', fontWeight: 700 }}>
                Browse Excel File
              </label>
            </div>

            {/* Validation Feedback & Preview */}
            {studentValidationResult && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Summary Banner */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem',
                  background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Uploaded</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy)' }}>{studentValidationResult.totalRows}</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>Valid Rows</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669' }}>{studentValidationResult.validRows.length}</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase' }}>Duplicate Rows</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#D97706' }}>{studentValidationResult.duplicateRows.length}</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700, textTransform: 'uppercase' }}>Invalid Rows</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#DC2626' }}>{studentValidationResult.invalidRows.length}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {studentValidationResult.invalidRows.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleDownloadStudentErrorReport}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#DC2626', borderColor: '#FECACA', fontWeight: 700 }}
                    >
                      <Download size={13} /> Download Error Report
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setStudentValidationResult(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isImportingStudents || studentValidationResult.validRows.length === 0}
                      onClick={handleConfirmStudentImport}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#059669', borderColor: '#059669', fontWeight: 800 }}
                    >
                      {isImportingStudents ? 'Saving to Database...' : `Confirm & Import ${studentValidationResult.validRows.length} Students`}
                    </button>
                  </div>
                </div>

                {/* Preview Grid */}
                <ExcelTableContainer minWidth="900px">
                  <ExcelTable>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                        <th style={{ width: '60px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Row</th>
                        <th style={{ width: '130px', padding: '0.65rem 0.75rem', textAlign: 'left' }}>Enrollment No</th>
                        <th style={{ minWidth: '200px', padding: '0.65rem 0.75rem', textAlign: 'left' }}>Student Name</th>
                        <th style={{ width: '200px', padding: '0.65rem 0.75rem', textAlign: 'left' }}>Email</th>
                        <th style={{ width: '100px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Gender</th>
                        <th style={{ width: '110px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentValidationResult.validRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ background: row.isValid ? '#FFFFFF' : '#FEF2F2', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>{row.rowNumber}</td>
                          <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF' }}>{row.enrollmentNo}</td>
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{row.name}</td>
                          <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem' }}>{row.email}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>{row.gender}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.75rem' }}>✓ Valid</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ExcelTable>
                </ExcelTableContainer>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: IMPORT ATTENDANCE ──────────────────────────────────────── */}
      {activeTab === 'IMPORT_ATTENDANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Bulk Attendance Session Excel Import
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Upload completed lecture sheets to update student portal records instantaneously.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadTemplate('ATTENDANCE_IMPORT')}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <Download size={14} /> Download Attendance Template
              </button>
            </div>

            {/* File Upload Box */}
            <div style={{
              border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '1.75rem',
              textAlign: 'center', background: '#F8FAFC', cursor: 'pointer'
            }}>
              <FileSpreadsheet size={32} color="var(--brand-orange, #F37023)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.95rem' }}>
                {attendanceImportFile ? attendanceImportFile.name : 'Select or Drag & Drop Attendance Import Excel (.xlsx)'}
              </div>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.85rem' }}>
                Columns: Enrollment No | Subject Code | Division | Date | Lecture No | Status | Remarks
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleAttendanceFileUpload}
                id="attendance-excel-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="attendance-excel-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', fontWeight: 700 }}>
                Browse Excel File
              </label>
            </div>

            {/* Validation Feedback */}
            {attendanceValidationResult && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <span>Total Rows: <strong>{attendanceValidationResult.totalRows}</strong></span>
                    <span style={{ color: '#059669' }}>Valid Rows: <strong>{attendanceValidationResult.validRows.length}</strong></span>
                    {attendanceValidationResult.invalidRows.length > 0 && (
                      <span style={{ color: '#DC2626' }}>Invalid Rows: <strong>{attendanceValidationResult.invalidRows.length}</strong></span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isImportingAttendance || attendanceValidationResult.validRows.length === 0}
                    onClick={handleConfirmAttendanceImport}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#059669', borderColor: '#059669', fontWeight: 800 }}
                  >
                    {isImportingAttendance ? 'Processing...' : `Confirm & Import ${attendanceValidationResult.validRows.length} Records`}
                  </button>
                </div>

                <ExcelTableContainer minWidth="850px">
                  <ExcelTable>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                        <th style={{ width: '60px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Row</th>
                        <th style={{ width: '130px', padding: '0.65rem 0.75rem', textAlign: 'left' }}>Enrollment No</th>
                        <th style={{ width: '120px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Subject</th>
                        <th style={{ width: '110px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Date</th>
                        <th style={{ width: '90px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Lecture</th>
                        <th style={{ width: '110px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Status</th>
                        <th style={{ width: '100px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceValidationResult.validRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ background: row.isValid ? '#FFFFFF' : '#FEF2F2', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>{row.rowNumber}</td>
                          <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF' }}>{row.enrollmentNo}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{row.subjectCode}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>{row.date}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>#{row.lectureNo}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <Badge variant={row.status === 'PRESENT' ? 'active' : row.status === 'LATE' ? 'warning' : 'inactive'}>
                              {row.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.75rem' }}>✓ Valid</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ExcelTable>
                </ExcelTableContainer>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 7: TEMPLATES ──────────────────────────────────────────────── */}
      {activeTab === 'TEMPLATES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-navy)' }}>
            <FileSpreadsheet size={28} color="var(--brand-navy)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              1. Student Master Template
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem', lineHeight: 1.4 }}>
              Includes 15 standardized university student fields (Personal info, Academic Program, Department, Semester, Division, Contact).
            </p>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('STUDENT_MASTER')}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', fontWeight: 700 }}
            >
              <Download size={14} /> Download Student Master .xlsx
            </button>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
            <FileSpreadsheet size={28} color="var(--brand-orange, #F37023)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              2. Class / Division Cohort Template
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem', lineHeight: 1.4 }}>
              Simplified roster format for fast batch enrollment into a specific Academic Year, Semester, and Class Division.
            </p>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('CLASS_STUDENTS')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontWeight: 700 }}
            >
              <Download size={14} /> Download Class Cohort .xlsx
            </button>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10B981' }}>
            <FileSpreadsheet size={28} color="#10B981" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              3. Subject Enrollment Template
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem', lineHeight: 1.4 }}>
              Maps students to specific theory, practical, and elective subjects for course registration and exams.
            </p>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('SUBJECT_ENROLLMENT')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontWeight: 700 }}
            >
              <Download size={14} /> Download Subject Mapping .xlsx
            </button>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #3B82F6' }}>
            <FileSpreadsheet size={28} color="#3B82F6" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              4. Attendance Session Import Template
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem', lineHeight: 1.4 }}>
              Batch upload daily lecture sheets with PRESENT, ABSENT, and LATE statuses directly into the database.
            </p>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('ATTENDANCE_IMPORT')}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', fontWeight: 700, background: '#2563EB', borderColor: '#2563EB' }}
            >
              <Download size={14} /> Download Attendance Import .xlsx
            </button>
          </div>

        </div>
      )}

      {/* ─── Session Details Modal ─────────────────────────────────────────── */}
      {viewingHistorySession && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '620px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Lecture #{viewingHistorySession.lectureNo} Attendance Details
                </h4>
                <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  Date: <strong>{viewingHistorySession.date}</strong> • Division: <strong>Division A</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistorySession(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.825rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Topic Taught</span>
                <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  {viewingHistorySession.topicTaught || 'Regular Curriculum Session'}
                </div>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.8rem', margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9' }}>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Enrollment</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Student Name</th>
                      <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingHistorySession.records.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', fontWeight: 700 }}>{r.enrollmentNo}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>{r.studentName}</td>
                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                          <Badge variant={r.status === 'PRESENT' ? 'active' : r.status === 'LATE' ? 'warning' : 'inactive'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-muted)' }}>{r.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setViewingHistorySession(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEditHistorySession(viewingHistorySession);
                    setViewingHistorySession(null);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                >
                  <Edit3 size={13} /> Edit Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────────────── */}
      {deletingSessionId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={20} /> Delete Attendance Session?
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.65rem 0 1.25rem', lineHeight: 1.4 }}>
              Are you sure you want to delete this attendance session? This action will update student cumulative percentages immediately.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeletingSessionId(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSession}
                className="btn btn-danger btn-sm"
                style={{ fontWeight: 700 }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendancePage;
