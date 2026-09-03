import React, { useMemo } from 'react';
import { db } from '../../services/db';
import { Printer, Download, X, BarChart3, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StudentAttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  user?: any;
  role?: string | null;
}

export const StudentAttendanceReportModal: React.FC<StudentAttendanceReportModalProps> = ({
  isOpen,
  onClose,
  studentId,
  user,
  role
}) => {
  // 1. Identify Student (Single Source of Truth)
  const student = useMemo(() => {
    const students = db.getStudents();
    if (studentId) {
      return students.find(s => s.id === studentId || s.enrollmentNo === studentId) || students[0];
    }
    if (user?.id) {
      return students.find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo || s.email === user.email) || students[0];
    }
    return students[0];
  }, [studentId, user]);

  // 2. Fetch Department, Program, Semester, Division metadata
  const department = useMemo(() => {
    if (!student?.departmentId) return 'Computer Engineering';
    const dept = db.getDepartmentById(student.departmentId);
    return dept?.name || 'Computer Engineering';
  }, [student]);

  const program = useMemo(() => {
    if (!student?.programId) return 'B.Tech Computer Science & Engineering';
    const prog = db.getProgramById(student.programId);
    return prog?.name || 'B.Tech Computer Science & Engineering';
  }, [student]);

  const semester = useMemo(() => {
    if (!student?.semesterId) return 'Semester 4';
    return student.semesterId.replace('sem-', 'Semester ').replace('-', ' ');
  }, [student]);

  const division = useMemo(() => {
    if (!student?.divisionId) return 'Division A';
    return student.divisionId.replace('div-', 'Division ').replace('cse-4a', 'A').replace('cse-4b', 'B');
  }, [student]);

  const academicYear = '2026-2027';

  // 3. Compile Attendance Records (Single Source of Truth from db.getAttendanceSessions)
  const { sessionRows, summaryStats } = useMemo(() => {
    if (!student) {
      return {
        sessionRows: [],
        summaryStats: {
          totalConducted: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          overallPct: 0,
          rule75Status: 'Shortage' as 'Eligible' | 'Shortage'
        }
      };
    }

    const sessions = db.getAttendanceSessions();
    const subjects = db.getSubjects();
    const timetables = db.getTimetableEntries();

    // Map subjects dictionary for fast lookup
    const subjectMap: Record<string, { code: string; name: string }> = {};
    subjects.forEach(sub => {
      subjectMap[sub.id] = { code: sub.code || 'CSE-401', name: sub.name };
      subjectMap[sub.code] = { code: sub.code, name: sub.name };
    });

    // Default subject fallbacks if not mapped
    const fallbackMap: Record<string, { code: string; name: string }> = {
      'sub-dbms': { code: 'CSE-401', name: 'Database Management Systems' },
      'sub-cn': { code: 'CSE-402', name: 'Computer Networks' },
      'sub-dsa': { code: 'CSE-403', name: 'Data Structures & Algorithms' },
      'sub-webtech': { code: 'CSE-404', name: 'Modern Web Architecture & Lab' },
      'sub-os': { code: 'CSE-405', name: 'Operating Systems & System Calls' },
      'sub-ai': { code: 'CSE-406', name: 'Artificial Intelligence & Neural Nets' }
    };

    // Filter sessions where the student has an attendance record
    const studentSessions: Array<{
      id: string;
      date: string;
      day: string;
      subjectCode: string;
      subjectName: string;
      facultyName: string;
      timeSlot: string;
      roomNo: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE';
    }> = [];

    sessions.forEach(sess => {
      const rec = sess.records?.find(r => r.studentId === student.id || r.enrollmentNo === student.enrollmentNo);
      if (rec) {
        // Date parsing
        const dateObj = new Date(sess.date);
        const dayName = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('en-US', { weekday: 'long' })
          : 'Monday';

        // Subject resolution
        const subInfo = subjectMap[sess.subjectId] || fallbackMap[sess.subjectId] || {
          code: sess.subjectId.toUpperCase(),
          name: sess.subjectId
        };

        // Timing resolution
        const ttMatch = timetables.find((t: any) => t.subjectId === sess.subjectId && t.dayOfWeek === dayName);
        const timeSlot = ttMatch?.timeSlot || (
          sess.lectureNo === 1 ? '09:00-10:00' :
          sess.lectureNo === 2 ? '10:00-11:00' :
          sess.lectureNo === 3 ? '11:15-12:15' :
          sess.lectureNo === 4 ? '12:15-01:15' :
          sess.lectureNo === 5 ? '02:00-03:00' : '03:00-04:00'
        );

        // Room resolution
        const roomNo = ttMatch?.roomNo || (
          sess.subjectId.includes('lab') || sess.subjectId.includes('web') ? 'Lab-301' : 'Room-302'
        );

        studentSessions.push({
          id: sess.id,
          date: sess.date,
          day: dayName,
          subjectCode: subInfo.code,
          subjectName: subInfo.name,
          facultyName: sess.facultyName || 'Demo Faculty',
          timeSlot,
          roomNo,
          status: (rec.status as any) || 'PRESENT'
        });
      }
    });

    // If student sessions exist in db, sort chronologically by date and lecture
    studentSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute progressive cumulative percentage for each row
    let runningPresent = 0;
    let runningLate = 0;

    const rowsWithRunningPct = studentSessions.map((s, idx) => {
      if (s.status === 'PRESENT') runningPresent++;
      else if (s.status === 'LATE') runningLate++;

      const conductedSoFar = idx + 1;
      const currentPct = Math.round(((runningPresent + runningLate) / conductedSoFar) * 1000) / 10;

      // Format Date to DD/MM/YYYY
      const parts = s.date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : s.date;

      return {
        srNo: idx + 1,
        date: formattedDate,
        day: s.day,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        facultyName: s.facultyName,
        timeSlot: s.timeSlot,
        roomNo: s.roomNo,
        status: s.status,
        attendancePct: `${currentPct}%`
      };
    });

    // Summary calculations
    const totalConducted = rowsWithRunningPct.length;
    const totalPresent = runningPresent;
    const totalLate = runningLate;
    const totalAbsent = totalConducted - (totalPresent + totalLate);
    const overallPct = totalConducted > 0
      ? Math.round(((totalPresent + totalLate) / totalConducted) * 1000) / 10
      : 100;
    const rule75Status: 'Eligible' | 'Shortage' = overallPct >= 75 ? 'Eligible' : 'Shortage';

    return {
      sessionRows: rowsWithRunningPct,
      summaryStats: {
        totalConducted,
        totalPresent,
        totalAbsent,
        totalLate,
        overallPct,
        rule75Status
      }
    };
  }, [student]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!student || sessionRows.length === 0) return;

    const headers = [
      'Sr. No.',
      'Date',
      'Day',
      'Subject Code',
      'Subject',
      'Faculty',
      'Time',
      'Room',
      'Status',
      'Attendance %'
    ];

    const rows = sessionRows.map(r => [
      r.srNo,
      `"${r.date}"`,
      `"${r.day}"`,
      `"${r.subjectCode}"`,
      `"${r.subjectName}"`,
      `"${r.facultyName}"`,
      `"${r.timeSlot}"`,
      `"${r.roomNo}"`,
      `"${r.status}"`,
      `"${r.attendancePct}"`
    ]);

    const csvContent = [
      `SWARRNIM STARTUP & INNOVATION UNIVERSITY - STUDENT ATTENDANCE SHEET`,
      `Student Name:,${student.name}`,
      `Enrollment No.:,${student.enrollmentNo}`,
      `Program:,${program}`,
      `Department:,${department}`,
      `Semester:,${semester}`,
      `Division:,${division}`,
      `Academic Year:,${academicYear}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `SUMMARY:`,
      `Total Conducted Classes:,${summaryStats.totalConducted}`,
      `Total Present:,${summaryStats.totalPresent}`,
      `Total Absent:,${summaryStats.totalAbsent}`,
      `Total Late:,${summaryStats.totalLate}`,
      `Overall Attendance:,${summaryStats.overallPct}%`,
      `75% Rule Status:,${summaryStats.rule75Status}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${student.enrollmentNo}_Attendance_Sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* ─── EMBEDDED PRINT MEDIA STYLES ────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          html, body {
            background: #FFFFFF !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide all surrounding app UI, headers, sidebars, modals, backdrops */
          body * {
            visibility: hidden !important;
          }

          .student-attendance-print-modal-overlay,
          .student-attendance-print-modal-overlay * {
            visibility: visible !important;
          }

          .student-attendance-print-modal-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: #FFFFFF !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }

          .student-attendance-modal-box {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .no-print,
          .modal-actions-bar {
            display: none !important;
            visibility: hidden !important;
          }

          .print-only {
            display: block !important;
          }

          /* Professional Excel-style table print styling */
          .excel-attendance-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #1E293B !important;
            font-size: 8.5pt !important;
            line-height: 1.2 !important;
            page-break-inside: auto !important;
          }

          .excel-attendance-table thead {
            display: table-header-group !important;
          }

          .excel-attendance-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .excel-attendance-table th,
          .excel-attendance-table td {
            border: 1px solid #475569 !important;
            padding: 4px 6px !important;
            vertical-align: middle !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .excel-attendance-table th {
            background-color: #E2E8F0 !important;
            color: #0F172A !important;
            font-weight: bold !important;
            text-align: center !important;
            text-transform: uppercase !important;
            font-size: 8pt !important;
          }

          .status-cell-present {
            color: #047857 !important;
            font-weight: bold !important;
          }

          .status-cell-absent {
            color: #DC2626 !important;
            font-weight: bold !important;
          }

          .status-cell-late {
            color: #D97706 !important;
            font-weight: bold !important;
          }

          .attendance-header-banner {
            border-bottom: 2px solid #0F2C59 !important;
            padding-bottom: 6px !important;
            margin-bottom: 8px !important;
          }

          .metadata-grid-print {
            border: 1px solid #94A3B8 !important;
            background-color: #F8FAFC !important;
            padding: 6px 10px !important;
            margin-bottom: 10px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .summary-footer-print {
            border: 1.5px solid #0F2C59 !important;
            background-color: #F8FAFC !important;
            padding: 8px 12px !important;
            margin-top: 10px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .verification-signatures-print {
            margin-top: 20px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── MODAL CONTAINER ──────────────────────────────────────────────────────── */}
      <div
        className="student-attendance-print-modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}
      >
        <div
          className="student-attendance-modal-box"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1150px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden'
          }}
        >
          {/* Top Interactive Action Bar (Screen Only) */}
          <div
            className="modal-actions-bar no-print"
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#0F2C59',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <BarChart3 size={22} color="#F37023" />
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>
                  Student Attendance Sheet &amp; Report
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, marginTop: '2px' }}>
                  A4 Landscape Excel-Style Printable Document • Live Synchronized Records
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                  padding: '0.45rem 0.875rem',
                  backgroundColor: '#F37023',
                  borderColor: '#F37023',
                  fontWeight: 700
                }}
              >
                <Printer size={15} /> Print Attendance Sheet
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                  padding: '0.45rem 0.875rem',
                  backgroundColor: '#FFFFFF',
                  color: '#0F2C59',
                  fontWeight: 700
                }}
              >
                <Download size={15} /> Export CSV / Excel
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                title="Close Window"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Document Content Viewport (Scrollable on Screen, Full Page in Print) */}
          <div
            id="student-attendance-print-sheet"
            style={{
              padding: '2rem',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.84375rem'
            }}
          >
            {/* ─── 1. INSTITUTIONAL HEADER ────────────────────────────────────────── */}
            <div className="attendance-header-banner" style={{ textAlign: 'center', borderBottom: '2px solid #0F2C59', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F2C59', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
              </h1>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F37023', textTransform: 'uppercase', letterSpacing: '0.75px', margin: '4px 0 0 0' }}>
                STUDENT ATTENDANCE SHEET
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px' }}>
                Accredited Statutory Academic Report • Academic Year {academicYear}
              </div>
            </div>

            {/* ─── 2. STUDENT METADATA INFO BOX ───────────────────────────────────── */}
            <div
              className="metadata-grid-print"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.5rem 1.5rem',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '0.875rem 1.25rem',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem'
              }}
            >
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Student Name: </span>
                <strong style={{ color: '#0F2C59' }}>{student?.name || 'Demo Student'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Enrollment No.: </span>
                <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{student?.enrollmentNo || 'STUDENT-001'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Program: </span>
                <strong style={{ color: '#0F2C59' }}>{program}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Department: </span>
                <strong style={{ color: '#0F2C59' }}>{department}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Semester: </span>
                <strong style={{ color: '#0F2C59' }}>{semester}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Division: </span>
                <strong style={{ color: '#0F2C59' }}>{division}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Academic Year: </span>
                <strong style={{ color: '#0F2C59' }}>{academicYear}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Report Date: </span>
                <strong style={{ color: '#0F2C59' }}>{new Date().toLocaleDateString('en-GB')}</strong>
              </div>
            </div>

            {/* ─── 3. MAIN EXCEL-STYLE ATTENDANCE TABLE ───────────────────────────── */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table
                className="excel-attendance-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1.5px solid #0F2C59',
                  textAlign: 'left',
                  fontSize: '0.8125rem'
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#0F2C59', color: '#FFFFFF' }}>
                    <th scope="col" style={{ width: '45px', padding: '7px 4px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Sr. No.
                    </th>
                    <th scope="col" style={{ width: '85px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Date
                    </th>
                    <th scope="col" style={{ width: '85px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Day
                    </th>
                    <th scope="col" style={{ width: '95px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Subject Code
                    </th>
                    <th scope="col" style={{ padding: '7px 10px', fontWeight: 800, border: '1px solid #475569' }}>
                      Subject
                    </th>
                    <th scope="col" style={{ padding: '7px 8px', fontWeight: 800, border: '1px solid #475569' }}>
                      Faculty
                    </th>
                    <th scope="col" style={{ width: '95px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Time
                    </th>
                    <th scope="col" style={{ width: '75px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Room
                    </th>
                    <th scope="col" style={{ width: '80px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Status
                    </th>
                    <th scope="col" style={{ width: '85px', padding: '7px 6px', textAlign: 'center', fontWeight: 800, border: '1px solid #475569' }}>
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessionRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontStyle: 'italic', border: '1px solid #CBD5E1' }}>
                        No attendance records found for this student.
                      </td>
                    </tr>
                  ) : (
                    sessionRows.map((row, idx) => {
                      const isEven = idx % 2 === 0;
                      const isPresent = row.status === 'PRESENT';
                      const isLate = row.status === 'LATE';

                      return (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: isEven ? '#FFFFFF' : '#F8FAFC'
                          }}
                        >
                          {/* 1. Sr. No. */}
                          <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 600, color: '#64748B', border: '1px solid #CBD5E1' }}>
                            {row.srNo}
                          </td>

                          {/* 2. Date */}
                          <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 600, color: '#334155', border: '1px solid #CBD5E1' }}>
                            {row.date}
                          </td>

                          {/* 3. Day */}
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#475569', border: '1px solid #CBD5E1' }}>
                            {row.day}
                          </td>

                          {/* 4. Subject Code */}
                          <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: '#0F2C59', border: '1px solid #CBD5E1' }}>
                            {row.subjectCode}
                          </td>

                          {/* 5. Subject */}
                          <td style={{ padding: '5px 10px', fontWeight: 700, color: '#0F2C59', border: '1px solid #CBD5E1' }}>
                            {row.subjectName}
                          </td>

                          {/* 6. Faculty */}
                          <td style={{ padding: '5px 8px', color: '#334155', border: '1px solid #CBD5E1' }}>
                            {row.facultyName}
                          </td>

                          {/* 7. Time */}
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#475569', border: '1px solid #CBD5E1' }}>
                            {row.timeSlot}
                          </td>

                          {/* 8. Room */}
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#475569', border: '1px solid #CBD5E1' }}>
                            {row.roomNo}
                          </td>

                          {/* 9. Status */}
                          <td
                            className={isPresent ? 'status-cell-present' : isLate ? 'status-cell-late' : 'status-cell-absent'}
                            style={{
                              padding: '5px 6px',
                              textAlign: 'center',
                              fontWeight: 800,
                              color: isPresent ? '#047857' : isLate ? '#D97706' : '#DC2626',
                              backgroundColor: isPresent ? 'rgba(16,185,129,0.06)' : isLate ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                              border: '1px solid #CBD5E1'
                            }}
                          >
                            {row.status}
                          </td>

                          {/* 10. Attendance % */}
                          <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800, color: '#0F2C59', border: '1px solid #CBD5E1' }}>
                            {row.attendancePct}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── 4. SUMMARY STATISTICS FOOTER ───────────────────────────────────── */}
            <div
              className="summary-footer-print"
              style={{
                marginTop: '1.25rem',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #0F2C59',
                borderRadius: '6px',
                padding: '0.875rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Conducted Classes
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2C59', marginTop: '2px' }}>
                  {summaryStats.totalConducted}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Present
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
                  {summaryStats.totalPresent}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Absent
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                  {summaryStats.totalAbsent}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Late
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>
                  {summaryStats.totalLate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Overall Attendance
                </div>
                <div style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: summaryStats.overallPct >= 75 ? '#047857' : '#DC2626',
                  marginTop: '2px'
                }}>
                  {summaryStats.overallPct}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  75% Rule Status
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: summaryStats.rule75Status === 'Eligible' ? '#047857' : '#DC2626',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {summaryStats.rule75Status === 'Eligible' ? (
                    <><CheckCircle2 size={16} /> Eligible</>
                  ) : (
                    <><AlertTriangle size={16} /> Shortage (&lt;75%)</>
                  )}
                </div>
              </div>
            </div>

            {/* ─── 5. VERIFICATION & SIGNATURE BLOCKS (PRINT ONLY & PREVIEW) ──────── */}
            <div
              className="verification-signatures-print"
              style={{
                marginTop: '2.5rem',
                paddingTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#475569'
              }}
            >
              <div>
                <div style={{ height: '35px' }}></div>
                <div style={{ borderTop: '1px dashed #64748B', paddingTop: '4px', fontWeight: 700, color: '#0F2C59' }}>
                  Class Coordinator / Mentor
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Verified from Session Logs</div>
              </div>

              <div>
                <div style={{ height: '35px' }}></div>
                <div style={{ borderTop: '1px dashed #64748B', paddingTop: '4px', fontWeight: 700, color: '#0F2C59' }}>
                  Head of Department (HOD)
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Department of {department}</div>
              </div>

              <div>
                <div style={{ height: '35px' }}></div>
                <div style={{ borderTop: '1px dashed #64748B', paddingTop: '4px', fontWeight: 700, color: '#0F2C59' }}>
                  Dean / Registrar Verification
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Swarrnim University ERP Bureau</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
