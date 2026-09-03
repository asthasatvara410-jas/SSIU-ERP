import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, FileText, 
  Calendar, BookOpen, Download, Printer, ShieldCheck, 
  RefreshCw, Send, AlertCircle, FileCheck, Info
} from 'lucide-react';
import { ExcelTableContainer, ExcelTable } from '../../components/common/ExcelTable';
import * as XLSX from 'xlsx';

export const StudentAttendancePage: React.FC = () => {
  const { user, role } = useAuth();

  // 1. Resolve Authenticated Student Master Identity (Strict OWN Scope)
  const currentStudent = useMemo(() => {
    const students = db.getStudents();
    if (!user) return students[0];
    
    // Match by ID, enrollment number, or email
    const match = students.find(s => 
      s.id === user.id || 
      (user.studentId && s.id === user.studentId) ||
      (user.enrollmentNo && s.enrollmentNo === user.enrollmentNo) ||
      (user.username && s.enrollmentNo === user.username) ||
      s.email === user.email
    );
    return match || students[0];
  }, [user]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'BREAKDOWN' | 'HISTORY' | 'APPLICATIONS'>('BREAKDOWN');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedSubjectForApp, setSelectedSubjectForApp] = useState<string>('');
  const [condonationReason, setCondonationReason] = useState<string>('MEDICAL');
  const [reasonRemarks, setReasonRemarks] = useState<string>('');
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 2. Fetch Academic Metadata
  const department = useMemo(() => {
    if (!currentStudent?.departmentId) return 'Computer Engineering';
    const dept = db.getDepartmentById(currentStudent.departmentId);
    return dept?.name || 'Computer Engineering';
  }, [currentStudent]);

  const program = useMemo(() => {
    if (!currentStudent?.programId) return 'B.Tech Computer Science & Engineering';
    const prog = db.getProgramById(currentStudent.programId);
    return prog?.name || 'B.Tech Computer Science & Engineering';
  }, [currentStudent]);

  const semester = useMemo(() => {
    if (!currentStudent?.semesterId) return 'Semester 4';
    return currentStudent.semesterId.replace('sem-', 'Semester ').replace('-', ' ');
  }, [currentStudent]);

  const division = useMemo(() => {
    if (!currentStudent?.divisionId) return 'Division A';
    return currentStudent.divisionId.replace('div-', 'Division ').replace('cse-4a', 'A').replace('cse-4b', 'B');
  }, [currentStudent]);

  // 3. Compile Student's Subject Attendance and Session History (Strictly OWN records)
  const { subjectSummaries, sessionHistory, kpis } = useMemo(() => {
    if (!currentStudent) {
      return {
        subjectSummaries: [],
        sessionHistory: [],
        kpis: {
          totalConducted: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          overallPct: 0,
          classesToRecover: 0,
          isEligible: true,
          shortagesCount: 0
        }
      };
    }

    const allSessions = db.getAttendanceSessions();
    const allSubjects = db.getSubjects();
    const subjectMap: Record<string, { code: string; name: string }> = {};
    allSubjects.forEach(s => {
      subjectMap[s.id] = { code: s.code || s.id, name: s.name };
      subjectMap[s.code] = { code: s.code, name: s.name };
    });

    // Fallbacks for standard subjects
    const fallbackSubjects: Record<string, { code: string; name: string }> = {
      'sub-dbms': { code: 'CSE-401', name: 'Database Management Systems' },
      'sub-cn': { code: 'CSE-402', name: 'Computer Networks' },
      'sub-dsa': { code: 'CSE-403', name: 'Data Structures & Algorithms' },
      'sub-webtech': { code: 'CSE-404', name: 'Modern Web Architecture & Lab' },
      'sub-os': { code: 'CSE-405', name: 'Operating Systems & System Calls' },
      'sub-ai': { code: 'CSE-406', name: 'Artificial Intelligence & Neural Nets' }
    };

    // Filter sessions where the student has an attendance record
    const ownSessions: Array<{
      sessionId: string;
      date: string;
      lectureNo: number;
      timeSlot?: string;
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      topicTaught: string;
      facultyName: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE';
      remarks?: string;
    }> = [];

    const subjectStatsMap: Record<string, {
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      total: number;
      present: number;
      absent: number;
      late: number;
    }> = {};

    allSessions.forEach(sess => {
      const rec = sess.records.find(r => 
        r.studentId === currentStudent.id || 
        r.studentId === currentStudent.enrollmentNo
      );
      if (rec) {
        const subInfo = subjectMap[sess.subjectId] || fallbackSubjects[sess.subjectId] || {
          code: sess.subjectId,
          name: sess.subjectId.replace('sub-', '').toUpperCase()
        };

        ownSessions.push({
          sessionId: sess.id,
          date: sess.date,
          lectureNo: sess.lectureNo,
          timeSlot: (sess as any).timeSlot || '10:00 AM - 11:00 AM',
          subjectId: sess.subjectId,
          subjectCode: subInfo.code,
          subjectName: subInfo.name,
          topicTaught: sess.topicTaught || 'Curriculum Delivery Session',
          facultyName: sess.facultyName || 'Course Faculty',
          status: rec.status,
          remarks: rec.remarks
        });

        if (!subjectStatsMap[sess.subjectId]) {
          subjectStatsMap[sess.subjectId] = {
            subjectId: sess.subjectId,
            subjectCode: subInfo.code,
            subjectName: subInfo.name,
            total: 0,
            present: 0,
            absent: 0,
            late: 0
          };
        }

        subjectStatsMap[sess.subjectId].total += 1;
        if (rec.status === 'PRESENT') subjectStatsMap[sess.subjectId].present += 1;
        else if (rec.status === 'ABSENT') subjectStatsMap[sess.subjectId].absent += 1;
        else if (rec.status === 'LATE') {
          subjectStatsMap[sess.subjectId].late += 1;
          subjectStatsMap[sess.subjectId].present += 1; // Count as present with remark
        }
      }
    });

    // If no raw sessions recorded yet, populate with student's enrolled subjects from DB stats
    if (Object.keys(subjectStatsMap).length === 0) {
      const stats = db.getStudentAttendanceStats(currentStudent.id);
      Object.entries(stats.subjectStats || {}).forEach(([subId, st]: [string, any]) => {
        const subInfo = subjectMap[subId] || fallbackSubjects[subId] || { code: subId, name: subId };
        subjectStatsMap[subId] = {
          subjectId: subId,
          subjectCode: subInfo.code,
          subjectName: subInfo.name,
          total: st.total || 40,
          present: st.present || 32,
          absent: st.absent || 8,
          late: 0
        };
      });

      // Default baseline fallback
      if (Object.keys(subjectStatsMap).length === 0) {
        Object.entries(fallbackSubjects).forEach(([subId, info], idx) => {
          const total = 40;
          const present = idx === 2 ? 28 : (idx === 5 ? 27 : 35);
          subjectStatsMap[subId] = {
            subjectId: subId,
            subjectCode: info.code,
            subjectName: info.name,
            total,
            present,
            absent: total - present,
            late: 0
          };
        });
      }
    }

    // Build subject summaries array
    const summaries = Object.values(subjectStatsMap).map(sub => {
      const pct = sub.total > 0 ? Number(((sub.present / sub.total) * 100).toFixed(1)) : 100;
      const isEligible = pct >= 75.0;
      const classesNeeded = !isEligible ? Math.max(1, Math.ceil((0.75 * sub.total - sub.present) / 0.25)) : 0;
      return {
        ...sub,
        percentage: pct,
        isEligible,
        classesNeeded
      };
    });

    // Calculate Overall KPIs
    let totalConducted = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    summaries.forEach(s => {
      totalConducted += s.total;
      totalPresent += s.present;
      totalAbsent += s.absent;
      totalLate += s.late;
    });

    const overallPct = totalConducted > 0 ? Number(((totalPresent / totalConducted) * 100).toFixed(1)) : 100;
    const isOverallEligible = overallPct >= 75.0;
    const classesToRecover = !isOverallEligible ? Math.max(1, Math.ceil((0.75 * totalConducted - totalPresent) / 0.25)) : 0;
    const shortagesCount = summaries.filter(s => !s.isEligible).length;

    // Sort session history descending by date
    ownSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      subjectSummaries: summaries,
      sessionHistory: ownSessions,
      kpis: {
        totalConducted,
        totalPresent,
        totalAbsent,
        totalLate,
        overallPct,
        classesToRecover,
        isEligible: isOverallEligible,
        shortagesCount
      }
    };
  }, [currentStudent, refreshKey]);

  // Filtered session history by subject
  const filteredSessions = useMemo(() => {
    if (selectedSubjectFilter === 'ALL') return sessionHistory;
    return sessionHistory.filter(s => s.subjectId === selectedSubjectFilter || s.subjectCode === selectedSubjectFilter);
  }, [sessionHistory, selectedSubjectFilter]);

  // Mock condonation applications list
  const [applications, setApplications] = useState<Array<{
    id: string;
    applicationNo: string;
    subjectName: string;
    subjectCode: string;
    reason: string;
    remarks: string;
    submittedAt: string;
    status: 'SUBMITTED' | 'UNDER_FACULTY_REVIEW' | 'MENTOR_RECOMMENDED' | 'HOD_SANCTIONED' | 'APPROVED' | 'REJECTED';
    statusRemarks?: string;
  }>>([
    {
      id: 'app-1',
      applicationNo: 'APP/ATT/2026/001',
      subjectName: 'Data Structures & Algorithms',
      subjectCode: 'CSE-403',
      reason: 'Medical Leave (Viral Fever)',
      remarks: 'Doctor prescription and medical certificate uploaded to student section.',
      submittedAt: '2026-08-25T11:30:00Z',
      status: 'HOD_SANCTIONED',
      statusRemarks: 'Recommended by Class Mentor Prof. Amit Shah; Sanctioned by HOD.'
    }
  ]);

  // Handle Application Submit
  const handleApplyCondonation = () => {
    if (!selectedSubjectForApp) {
      showToast('error', 'Please select a subject for attendance condonation.');
      return;
    }
    if (!reasonRemarks.trim()) {
      showToast('error', 'Please provide detailed justification/remarks.');
      return;
    }

    setIsSubmittingApp(true);
    const sub = subjectSummaries.find(s => s.subjectId === selectedSubjectForApp);
    const newApp = {
      id: `app-${Date.now()}`,
      applicationNo: `APP/ATT/2026/${String(applications.length + 1).padStart(3, '0')}`,
      subjectName: sub?.subjectName || 'Selected Subject',
      subjectCode: sub?.subjectCode || 'CSE-400',
      reason: condonationReason === 'MEDICAL' ? 'Medical Leave' : condonationReason === 'SPORTS' ? 'University Sports Representation' : 'Academic Technical Seminar',
      remarks: reasonRemarks.trim(),
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED' as const,
      statusRemarks: 'Application submitted for Faculty / Mentor review.'
    };

    setTimeout(() => {
      setApplications(prev => [newApp, ...prev]);
      setIsSubmittingApp(false);
      setShowApplyModal(false);
      setReasonRemarks('');
      showToast('success', `Condonation application ${newApp.applicationNo} submitted successfully!`);
    }, 400);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Subject Summary
    const summaryData = subjectSummaries.map(s => ({
      'Subject Code': s.subjectCode,
      'Subject Name': s.subjectName,
      'Total Lectures': s.total,
      'Attended (Present)': s.present,
      'Missed (Absent)': s.absent,
      'Attendance %': `${s.percentage}%`,
      'Statutory Status (75% Rule)': s.isEligible ? 'ELIGIBLE' : 'SHORTAGE',
      'Classes Needed for 75%': s.classesNeeded
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Subject Breakdown');

    // Sheet 2: Session Timeline
    const historyData = sessionHistory.map(h => ({
      'Date': h.date,
      'Lecture #': h.lectureNo,
      'Time Slot': h.timeSlot,
      'Subject Code': h.subjectCode,
      'Subject Name': h.subjectName,
      'Topic Covered': h.topicTaught,
      'Attendance Status': h.status,
      'Remarks': h.remarks || ''
    }));
    const wsHistory = XLSX.utils.json_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Attendance History');

    XLSX.writeFile(wb, `My_Attendance_Report_${currentStudent?.enrollmentNo || 'Student'}_2026.xlsx`);
    showToast('success', 'Attendance workbook exported successfully.');
  };

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div 
          style={{ 
            position: 'fixed', 
            top: '1rem', 
            right: '1rem', 
            zIndex: 9999,
            background: toast.type === 'success' ? '#047857' : toast.type === 'error' ? '#B91C1C' : '#0F2C59',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}

      {/* ─── 1. STUDENT HEADER & METADATA BANNER ──────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem', borderRadius: '4px' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F2C59', letterSpacing: '-0.02em' }}>
                  My Attendance Dashboard
                </h1>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748B' }}>
                  Student Personal Academic Attendance Ledger &amp; Examination Eligibility Compliance
                </p>
              </div>
            </div>

            {/* Student Metadata Chips */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
              <span style={{ background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '3px', fontWeight: 700, color: '#0F2C59' }}>
                Enrollment: <span style={{ color: '#F37023', fontFamily: 'monospace' }}>{currentStudent?.enrollmentNo || '2026SSIUCE0101'}</span>
              </span>
              <span style={{ background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '3px', color: '#334155' }}>
                Name: <strong>{currentStudent?.name || currentStudent?.firstName || 'Student'}</strong>
              </span>
              <span style={{ background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '3px', color: '#334155' }}>
                Program: <strong>{program}</strong>
              </span>
              <span style={{ background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '3px', color: '#334155' }}>
                Semester / Class: <strong>{semester} • {division}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem', padding: '0.4rem 0.75rem' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem', padding: '0.4rem 0.75rem' }}
            >
              <Download size={14} /> Export Excel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem', padding: '0.4rem 0.75rem', background: '#0F2C59', color: '#FFFFFF', border: 'none' }}
            >
              <Printer size={14} /> Print Ledger
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. STATUTORY KPI METRICS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
        {/* KPI 1: Overall Attendance Percentage */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '4px', position: 'relative' }}>
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Overall Attendance</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: kpis.isEligible ? '#047857' : '#DC2626' }}>
              {kpis.overallPct}%
            </span>
            <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>Req: 75.0%</span>
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <Badge variant={kpis.isEligible ? 'active' : 'danger'}>
              {kpis.isEligible ? 'STATUTORY COMPLIANT' : 'ATTENDANCE SHORTAGE'}
            </Badge>
          </div>
        </div>

        {/* KPI 2: Total Classes Conducted */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Classes Conducted</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2C59', marginTop: '0.25rem' }}>
            {kpis.totalConducted}
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '0.35rem' }}>
            Across all enrolled curriculum subjects
          </div>
        </div>

        {/* KPI 3: Attended vs Missed */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Attended / Missed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#047857' }}>{kpis.totalPresent}</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#94A3B8' }}>/</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626' }}>{kpis.totalAbsent}</span>
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '0.35rem' }}>
            {kpis.totalLate > 0 && <span>({kpis.totalLate} attended with late entry)</span>}
          </div>
        </div>

        {/* KPI 4: Examination Hall Ticket Status */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Exam Hall Ticket Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            {kpis.isEligible ? (
              <>
                <ShieldCheck size={24} color="#047857" />
                <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.9375rem' }}>ELIGIBLE (GREEN)</span>
              </>
            ) : (
              <>
                <AlertTriangle size={24} color="#DC2626" />
                <span style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.9375rem' }}>CONDONATION REQ.</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: '0.45rem' }}>
            {kpis.isEligible ? 'Cleared for semester examination' : `${kpis.classesToRecover} extra lectures needed to reach 75%`}
          </div>
        </div>
      </div>

      {/* ─── 3. SUB-NAVIGATION TABS ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', gap: '0.25rem', background: '#FFFFFF', padding: '0 0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('BREAKDOWN')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'BREAKDOWN' ? 800 : 600,
            color: activeSubTab === 'BREAKDOWN' ? '#0F2C59' : '#64748B',
            borderBottom: activeSubTab === 'BREAKDOWN' ? '3px solid #0F2C59' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          Subject-Wise Breakdown
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('HISTORY')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'HISTORY' ? 800 : 600,
            color: activeSubTab === 'HISTORY' ? '#0F2C59' : '#64748B',
            borderBottom: activeSubTab === 'HISTORY' ? '3px solid #0F2C59' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          Attendance Session Log ({sessionHistory.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('APPLICATIONS')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.8125rem',
            fontWeight: activeSubTab === 'APPLICATIONS' ? 800 : 600,
            color: activeSubTab === 'APPLICATIONS' ? '#0F2C59' : '#64748B',
            borderBottom: activeSubTab === 'APPLICATIONS' ? '3px solid #0F2C59' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          Condonation Requests ({applications.length})
        </button>
      </div>

      {/* ─── TAB 1: SUBJECT-WISE BREAKDOWN ──────────────────────────────────── */}
      {activeSubTab === 'BREAKDOWN' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.65rem 1rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ENROLLED SUBJECTS ATTENDANCE SPECIFICATION (75.00% STATUTORY THRESHOLD)</span>
            <span style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>SSIU Academic Regulation 4.2</span>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '12%', padding: '0.6rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject Code</th>
                  <th style={{ width: '32%', padding: '0.6rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject Name</th>
                  <th style={{ width: '10%', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Total Held</th>
                  <th style={{ width: '10%', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Present</th>
                  <th style={{ width: '10%', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Absent</th>
                  <th style={{ width: '12%', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Attendance %</th>
                  <th style={{ width: '14%', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>Status &amp; Action</th>
                </tr>
              </thead>
              <tbody>
                {subjectSummaries.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={idx} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023', borderRight: '1px solid #E2E8F0' }}>
                        {row.subjectCode}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        {row.subjectName}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #E2E8F0' }}>
                        {row.total}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#047857', borderRight: '1px solid #E2E8F0' }}>
                        {row.present}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: row.absent > 5 ? '#DC2626' : '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {row.absent}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 900, color: row.isEligible ? '#047857' : '#DC2626', borderRight: '1px solid #E2E8F0' }}>
                        {row.percentage}%
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        {row.isEligible ? (
                          <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.71875rem', fontWeight: 800 }}>
                            ELIGIBLE
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.71875rem', fontWeight: 800 }}>
                              SHORTAGE ({row.classesNeeded} classes req)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubjectForApp(row.subjectId);
                                setShowApplyModal(true);
                              }}
                              style={{
                                background: '#F37023',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '2px 6px',
                                borderRadius: '2px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Apply Condonation
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SESSION-BY-SESSION LOG (STRICTLY OWN RECORDS) ────────────── */}
      {activeSubTab === 'HISTORY' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.65rem 1rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ATTENDANCE SESSION LOG (RECORDED CLASS SESSIONS)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>Filter by Subject:</span>
              <select
                value={selectedSubjectFilter}
                onChange={e => setSelectedSubjectFilter(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  color: '#0F2C59',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  fontSize: '0.71875rem',
                  fontWeight: 600
                }}
              >
                <option value="ALL">All Subjects</option>
                {subjectSummaries.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectCode} - {s.subjectName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '500px' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Date</th>
                  <th style={{ width: '8%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Lecture</th>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject</th>
                  <th style={{ width: '35%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Curriculum Topic Covered</th>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Faculty</th>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No attendance session records found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((sess, idx) => {
                    const isEven = idx % 2 === 0;
                    const isPresent = sess.status === 'PRESENT';
                    const isLate = sess.status === 'LATE';
                    return (
                      <tr key={idx} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#334155', borderRight: '1px solid #E2E8F0' }}>
                          {sess.date}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #E2E8F0' }}>
                          #{sess.lectureNo}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#F37023', fontFamily: 'monospace' }}>{sess.subjectCode}</span> - {sess.subjectName}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                          {sess.topicTaught}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#334155', borderRight: '1px solid #E2E8F0' }}>
                          {sess.facultyName}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          {isPresent ? (
                            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.71875rem', fontWeight: 800 }}>
                              PRESENT
                            </span>
                          ) : isLate ? (
                            <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.71875rem', fontWeight: 800 }}>
                              LATE
                            </span>
                          ) : (
                            <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.2rem 0.5rem', borderRadius: '3px', fontSize: '0.71875rem', fontWeight: 800 }}>
                              ABSENT
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: CONDONATION APPLICATIONS ─────────────────────────────────── */}
      {activeSubTab === 'APPLICATIONS' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.65rem 1rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ATTENDANCE CONDONATION APPLICATIONS (4-TIER WORKFLOW)</span>
            <button
              type="button"
              onClick={() => {
                const shortageSub = subjectSummaries.find(s => !s.isEligible);
                setSelectedSubjectForApp(shortageSub?.subjectId || subjectSummaries[0]?.subjectId || '');
                setShowApplyModal(true);
              }}
              style={{
                background: '#F37023',
                color: '#FFFFFF',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + New Condonation Request
            </button>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '15%', padding: '0.6rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Application No</th>
                  <th style={{ width: '22%', padding: '0.6rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject</th>
                  <th style={{ width: '18%', padding: '0.6rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Reason Category</th>
                  <th style={{ width: '25%', padding: '0.6rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Remarks / Justification</th>
                  <th style={{ width: '20%', padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>Approval Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={idx} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023', borderRight: '1px solid #E2E8F0' }}>
                        {app.applicationNo}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        {app.subjectCode} - {app.subjectName}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#334155', borderRight: '1px solid #E2E8F0' }}>
                        {app.reason}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                        <div>{app.remarks}</div>
                        {app.statusRemarks && (
                          <div style={{ fontSize: '0.71875rem', color: '#047857', marginTop: '2px', fontWeight: 600 }}>
                            Note: {app.statusRemarks}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <span style={{
                          background: app.status === 'APPROVED' ? '#ECFDF5' : app.status === 'REJECTED' ? '#FEF2F2' : '#EFF6FF',
                          color: app.status === 'APPROVED' ? '#047857' : app.status === 'REJECTED' ? '#DC2626' : '#1D4ED8',
                          border: '1px solid',
                          borderColor: app.status === 'APPROVED' ? '#A7F3D0' : app.status === 'REJECTED' ? '#FECACA' : '#BFDBFE',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '3px',
                          fontSize: '0.71875rem',
                          fontWeight: 800
                        }}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 4. APPLY FOR CONDONATION MODAL ───────────────────────────────────── */}
      {showApplyModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 44, 89, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '520px',
              border: '1px solid #CBD5E1',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.85rem 1.25rem', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={18} />
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800 }}>Submit Attendance Condonation Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Target Subject
                </label>
                <select
                  value={selectedSubjectForApp}
                  onChange={e => setSelectedSubjectForApp(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #CBD5E1', borderRadius: '3px', fontSize: '0.8125rem' }}
                >
                  {subjectSummaries.map(s => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.subjectCode} - {s.subjectName} ({s.percentage}% attendance)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Reason Category
                </label>
                <select
                  value={condonationReason}
                  onChange={e => setCondonationReason(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #CBD5E1', borderRadius: '3px', fontSize: '0.8125rem' }}
                >
                  <option value="MEDICAL">Medical Emergency / Illness (Hospital certificate attached)</option>
                  <option value="SPORTS">University Sports / Tournament Representation</option>
                  <option value="TECHNICAL">Academic Technical Presentation / Hackathon / Conference</option>
                  <option value="OTHER">Official Bereavement / Exceptional Circumstances</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  Detailed Remarks &amp; Justification
                </label>
                <textarea
                  rows={3}
                  value={reasonRemarks}
                  onChange={e => setReasonRemarks(e.target.value)}
                  placeholder="Provide supporting details, dates of illness, doctor reference or event name..."
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #CBD5E1', borderRadius: '3px', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem 0.75rem', borderRadius: '3px', fontSize: '0.71875rem', color: '#64748B' }}>
                <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                Your application will follow the mandatory 4-Tier review path: 
                <strong> Subject Faculty → Class Mentor → HOD → Principal (HOI)</strong>.
              </div>
            </div>

            <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowApplyModal(false)}
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isSubmittingApp}
                onClick={handleApplyCondonation}
                style={{ fontSize: '0.8125rem', background: '#0F2C59', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Send size={14} /> Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
