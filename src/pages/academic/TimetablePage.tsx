import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { TimetableEntry, Subject, Faculty, Division } from '../../types';
import { 
  Calendar, Clock,
  Printer, Search, 
  ChevronLeft, ChevronRight,
  Download, CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface TimetablePageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface PeriodDef {
  id: string;
  periodNumber: number | string;
  timeSlot: string;
  shortLabel: string;
  startMinutes: number;
  endMinutes: number;
  isBreak?: boolean;
  breakTitle?: string;
}

// Standard University Timetable Periods
const PERIOD_SLOTS: PeriodDef[] = [
  {
    id: 'p1',
    periodNumber: 1,
    timeSlot: '09:00 AM - 10:00 AM',
    shortLabel: '09:00 – 10:00',
    startMinutes: 540,
    endMinutes: 600
  },
  {
    id: 'p2',
    periodNumber: 2,
    timeSlot: '10:00 AM - 11:00 AM',
    shortLabel: '10:00 – 11:00',
    startMinutes: 600,
    endMinutes: 660
  },
  {
    id: 'p3',
    periodNumber: 3,
    timeSlot: '11:00 AM - 12:00 PM',
    shortLabel: '11:00 – 12:00',
    startMinutes: 660,
    endMinutes: 720
  },
  {
    id: 'p-break',
    periodNumber: 'RECESS',
    timeSlot: '12:00 PM - 01:00 PM',
    shortLabel: '12:00 – 01:00',
    startMinutes: 720,
    endMinutes: 780,
    isBreak: true,
    breakTitle: '🍱 Lunch Break & Campus Recess'
  },
  {
    id: 'p4',
    periodNumber: 4,
    timeSlot: '01:00 PM - 02:00 PM',
    shortLabel: '01:00 – 02:00',
    startMinutes: 780,
    endMinutes: 840
  },
  {
    id: 'p5',
    periodNumber: 5,
    timeSlot: '02:00 PM - 03:00 PM',
    shortLabel: '02:00 – 03:00',
    startMinutes: 840,
    endMinutes: 900
  },
  {
    id: 'p6',
    periodNumber: 6,
    timeSlot: '03:00 PM - 04:00 PM',
    shortLabel: '03:00 – 04:00',
    startMinutes: 900,
    endMinutes: 960
  },
  {
    id: 'p7',
    periodNumber: 7,
    timeSlot: '04:00 PM - 05:00 PM',
    shortLabel: '04:00 – 05:00',
    startMinutes: 960,
    endMinutes: 1020
  }
];

function parseTimeToMinutes(timeStr: string): { start: number; end: number } {
  if (!timeStr) return { start: 0, end: 0 };
  const parts = timeStr.split('-').map(s => s.trim());
  if (parts.length < 2) return { start: 0, end: 0 };

  const parseSingle = (t: string): number => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = (match[3] || '').toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  return {
    start: parseSingle(parts[0]),
    end: parseSingle(parts[1])
  };
}

export const TimetablePage: React.FC<TimetablePageProps> = ({ setActiveTab }) => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';

  // Data sources from central ERP store
  const subjects = db.getSubjects();
  const divisions = db.getDivisions();
  const facultyList = db.getFaculty();
  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const timetableEntries = db.getTimetableEntries();

  // Current faculty or student profile
  const currentFaculty = useMemo(() => {
    if (role !== 'FACULTY' || !user) return null;
    return facultyList.find(f => f.id === user.id || f.email === user.email) || facultyList[0];
  }, [role, user, facultyList]);

  const currentStudent = useMemo(() => {
    if (role !== 'STUDENT' || !user) return null;
    return db.getStudents().find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo || s.email === user.email);
  }, [role, user]);

  // ── Filters State ──
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-27');
  const [selectedSemester, setSelectedSemester] = useState<string>('sem-cse-4');
  const [selectedProgram, setSelectedProgram] = useState<string>('prog-1');
  const [selectedDivision, setSelectedDivision] = useState<string>('div-cse-4a');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'THEORY' | 'PRACTICAL' | 'LAB' | 'TUTORIAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);

  // Faculty View Mode: MY_CLASSES (default for faculty) vs ALL_DIVISION
  const [facultyViewMode, setFacultyViewMode] = useState<'MY_CLASSES' | 'ALL_DIVISION'>(
    role === 'FACULTY' ? 'MY_CLASSES' : 'ALL_DIVISION'
  );

  // Modal State for detail view
  const [selectedLectureDetail, setSelectedLectureDetail] = useState<{
    entry: TimetableEntry;
    subject?: Subject;
    faculty?: Faculty;
    division?: Division;
  } | null>(null);

  // ── 1. Calculate Week Dates (Default anchor: Mon Aug 24 - Sat Aug 29, 2026) ──
  const weekDates = useMemo(() => {
    // Fixed anchor date for demo: Aug 26, 2026 (Wednesday)
    const baseAnchor = new Date(2026, 7, 26); // Month is 0-indexed (7 = August)
    baseAnchor.setDate(baseAnchor.getDate() + currentWeekOffset * 7);

    const day = baseAnchor.getDay(); // 0 = Sun, 1 = Mon ...
    const diffToMonday = baseAnchor.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(baseAnchor.setDate(diffToMonday));

    const datesMap: Record<DayOfWeek, { dateStr: string; dayNumber: number; monthName: string; isToday: boolean }> = {
      Monday: { dateStr: '', dayNumber: 0, monthName: '', isToday: false },
      Tuesday: { dateStr: '', dayNumber: 0, monthName: '', isToday: false },
      Wednesday: { dateStr: '', dayNumber: 0, monthName: '', isToday: false },
      Thursday: { dateStr: '', dayNumber: 0, monthName: '', isToday: false },
      Friday: { dateStr: '', dayNumber: 0, monthName: '', isToday: false },
      Saturday: { dateStr: '', dayNumber: 0, monthName: '', isToday: false }
    };

    DAYS.forEach((dName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const isToday = currentWeekOffset === 0 && dName === 'Wednesday'; // Aug 26, 2026 is Wednesday
      datesMap[dName] = {
        dateStr: `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}`,
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday
      };
    });

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const label = `${monday.getDate()} ${monday.toLocaleDateString('en-US', { month: 'short' })} – ${saturday.getDate()} ${saturday.toLocaleDateString('en-US', { month: 'short' })}, ${saturday.getFullYear()}`;

    return {
      datesMap,
      label: currentWeekOffset === 0 ? `Current Week (${label})` : `Week (${label})`
    };
  }, [currentWeekOffset]);

  // ── 2. Filter Timetable Entries by Logged-in Faculty / Criteria ──
  const filteredEntries = useMemo(() => {
    return timetableEntries.filter(entry => {
      if (entry.status === 'CANCELLED') return false;

      // Faculty login filter: Show ONLY assigned lectures for Demo Faculty 1 when in MY_CLASSES mode
      if (role === 'FACULTY' && facultyViewMode === 'MY_CLASSES') {
        const facId = currentFaculty?.id || user?.id || 'fac-1';
        if (entry.facultyId !== facId) return false;
      }

      // Student login filter
      if (isStudent && currentStudent) {
        if (entry.divisionId !== currentStudent.divisionId) return false;
      }

      // Division filter
      if (selectedDivision !== 'ALL' && entry.divisionId !== selectedDivision) {
        // If in MY_CLASSES mode, allow if division matches or ALL
        if (facultyViewMode !== 'MY_CLASSES') return false;
      }

      // Semester filter
      if (selectedSemester !== 'ALL') {
        const subj = subjects.find(s => s.id === entry.subjectId);
        if (subj?.semesterId && subj.semesterId !== selectedSemester) {
          if (facultyViewMode !== 'MY_CLASSES') return false;
        }
      }

      // Lecture Type filter
      const subj = subjects.find(s => s.id === entry.subjectId);
      if (selectedTypeFilter !== 'ALL') {
        const entryType = entry.lectureType || subj?.type || 'THEORY';
        if (selectedTypeFilter === 'THEORY' && entryType !== 'THEORY') return false;
        if (selectedTypeFilter === 'PRACTICAL' && entryType !== 'PRACTICAL') return false;
        if (selectedTypeFilter === 'LAB' && entryType !== 'LAB' && entryType !== 'PRACTICAL') return false;
        if (selectedTypeFilter === 'TUTORIAL' && entryType !== 'TUTORIAL') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const subjName = subj?.name?.toLowerCase() || '';
        const subjCode = subj?.code?.toLowerCase() || '';
        const room = entry.roomNo.toLowerCase();
        const building = (entry.buildingName || 'Block B').toLowerCase();
        if (!subjName.includes(q) && !subjCode.includes(q) && !room.includes(q) && !building.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    timetableEntries, role, facultyViewMode, currentFaculty, user, isStudent, currentStudent,
    selectedDivision, selectedSemester, selectedTypeFilter, searchQuery, subjects
  ]);

  // ── 3. Today's Lectures & Upcoming Class calculation ──
  const todayDayName: DayOfWeek = 'Wednesday'; // Anchored Wednesday, 26 Aug 2026

  const todayClasses = useMemo(() => {
    return filteredEntries
      .filter(e => e.dayOfWeek === todayDayName)
      .sort((a, b) => parseTimeToMinutes(a.timeSlot).start - parseTimeToMinutes(b.timeSlot).start);
  }, [filteredEntries, todayDayName]);

  const upcomingLecture = useMemo(() => {
    // If today has classes, return the second or first; otherwise Thursday's first lecture
    if (todayClasses.length > 1) return todayClasses[1];
    if (todayClasses.length === 1) return todayClasses[0];
    const thursdayClass = filteredEntries.find(e => e.dayOfWeek === 'Thursday');
    return thursdayClass || filteredEntries[0];
  }, [todayClasses, filteredEntries]);

  // Dynamic summary counts for header
  const dynamicAssignedSubjectsCount = useMemo(() => {
    const set = new Set<string>();
    filteredEntries.forEach(e => set.add(e.subjectId));
    return set.size;
  }, [filteredEntries]);

  // Day wise lecture counts
  const dayLectureCounts = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
    };
    filteredEntries.forEach(e => {
      if (counts[e.dayOfWeek] !== undefined) {
        counts[e.dayOfWeek]++;
      }
    });
    return counts;
  }, [filteredEntries]);

  // ── 4. Navigation action to Attendance module ──
  const handleNavigateToAttendance = (entry: TimetableEntry) => {
    if (setActiveTab) {
      setActiveTab('attendance', {
        subjectId: entry.subjectId,
        divisionId: entry.divisionId,
        date: '2026-08-26'
      });
    }
  };

  const handleNavigateToSessionPlan = (subjectId: string) => {
    if (setActiveTab) {
      setActiveTab('session-plan', { subjectId });
    }
  };

  const handleNavigateToSubjects = () => {
    if (setActiveTab) {
      setActiveTab('subjects');
    }
  };

  const handleNavigateToStudents = () => {
    if (setActiveTab) {
      setActiveTab('students');
    }
  };

  // ── 5. Export Timetable to Excel (.xlsx) ──
  const handleExportExcel = () => {
    const exportData = filteredEntries.map(e => {
      const subj = subjects.find(s => s.id === e.subjectId);
      const fac = facultyList.find(f => f.id === e.facultyId);
      const div = divisions.find(d => d.id === e.divisionId);

      return {
        'Day': e.dayOfWeek,
        'Time Slot': e.timeSlot,
        'Subject Code': subj?.code || 'CSE-401',
        'Subject Name': subj?.name || 'Subject',
        'Lecture Type': e.lectureType || subj?.type || 'THEORY',
        'Faculty': fac?.name || 'Prof. Demo Faculty',
        'Program': 'B.Tech CSE',
        'Semester': 'Semester 4',
        'Division': div?.name || 'Division A',
        'Room': e.roomNo,
        'Building': e.buildingName || 'Block B',
        'Academic Year': '2026-27'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Timetable');
    XLSX.writeFile(wb, `SSIU_Faculty_Timetable_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper for lecture type styling badge
  const getLectureTypeBadge = (type: string) => {
    switch (type) {
      case 'PRACTICAL':
      case 'LAB':
        return { label: 'LAB / PRACTICAL', bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' };
      case 'TUTORIAL':
        return { label: 'TUTORIAL', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      default:
        return { label: 'THEORY', bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ─── 1. Faculty Timetable Header & Compact Summary ───────────────── */}
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
              <Calendar size={24} color="#F37023" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Class &amp; Academic Timetable
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94A3B8' }}>
              Your assigned weekly teaching lectures, laboratory sessions &amp; student sections
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleExportExcel}
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
              <Download size={14} /> Export Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary"
              style={{
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                fontWeight: 800,
                background: 'var(--brand-orange, #F37023)',
                borderColor: 'var(--brand-orange, #F37023)'
              }}
            >
              <Printer size={14} /> Print Timetable
            </button>
          </div>
        </div>

        {/* 6-Column Summary Strip */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
          gap: '1rem', 
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.18)',
          fontSize: '0.8125rem'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Faculty</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{user?.name || 'Prof. Demo Faculty'}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
            <strong style={{ color: '#38BDF8', fontSize: '0.95rem' }}>Computer Science &amp; Engg.</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Academic Year</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>2026–27</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Current Semester</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>Semester 4 (Division A)</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Classes</span>
            <strong style={{ color: '#F37023', fontSize: '0.95rem' }}>{dynamicAssignedSubjectsCount} Subjects • {filteredEntries.length} Weekly Slots</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Today's Lectures</span>
            <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>{todayClasses.length} Sessions Scheduled</strong>
          </div>
        </div>
      </div>

      {/* ─── 2. Today's Classes & Next Lecture Bar ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Today's Classes Card */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#10B981" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                TODAY — Wednesday, 26 August 2026
              </h4>
            </div>
            <Badge variant="active">{todayClasses.length} Sessions</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {todayClasses.map(cls => {
              const subj = subjects.find(s => s.id === cls.subjectId);
              const typeBadge = getLectureTypeBadge(cls.lectureType || subj?.type || 'THEORY');

              return (
                <div 
                  key={cls.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '6px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', fontSize: '0.8rem' }}>
                        {cls.timeSlot}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: typeBadge.bg, color: typeBadge.text, border: `1px solid ${typeBadge.border}` }}>
                        {typeBadge.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.875rem', marginTop: '0.15rem' }}>
                      {subj?.name || 'Curriculum Lecture'} ({subj?.code || 'CSE'})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      B.Tech CSE • Sem 4 • Div A • <strong style={{ color: 'var(--brand-navy)' }}>{cls.roomNo}</strong> ({cls.buildingName || 'Block B'})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateToAttendance(cls)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--brand-orange)', borderColor: '#FED7AA' }}
                  >
                    Mark Attendance
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Lecture Highlight Card */}
        {upcomingLecture && (
          <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={16} color="var(--brand-orange, #F37023)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Next Scheduled Class
                </h4>
              </div>
              <Badge variant="orange">{upcomingLecture.dayOfWeek}</Badge>
            </div>

            {(() => {
              const subj = subjects.find(s => s.id === upcomingLecture.subjectId);
              const typeBadge = getLectureTypeBadge(upcomingLecture.lectureType || subj?.type || 'THEORY');

              return (
                <div style={{ background: '#FFF8F5', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #FFEDD5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: typeBadge.bg, color: typeBadge.text, border: `1px solid ${typeBadge.border}` }}>
                        {typeBadge.label}
                      </span>
                      <div style={{ fontWeight: 900, color: 'var(--brand-navy)', fontSize: '1rem', marginTop: '0.35rem' }}>
                        {subj?.name} ({subj?.code})
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
                        Time: <strong style={{ color: '#1E40AF' }}>{upcomingLecture.timeSlot}</strong> • Location: <strong>{upcomingLecture.roomNo} ({upcomingLecture.buildingName || 'Block B'})</strong>
                      </div>
                      <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '0.15rem' }}>
                        Cohort: B.Tech CSE • Semester 4 • Division A
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLectureDetail({
                        entry: upcomingLecture,
                        subject: subj,
                        faculty: currentFaculty || undefined,
                        division: divisions.find(d => d.id === upcomingLecture.divisionId)
                      })}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.75rem', background: 'var(--brand-orange)', borderColor: 'var(--brand-orange)' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* ─── 3. Professional Filter Toolbar ───────────────────────────────── */}
      <div className="card" style={{ padding: '1rem 1.25rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Left: Search & Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search subject / room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '28px', fontSize: '0.8rem', height: '34px', borderRadius: '5px' }}
              />
            </div>

            {/* Academic Year */}
            <select
              className="form-control"
              value={selectedAcademicYear}
              onChange={e => setSelectedAcademicYear(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px', fontWeight: 700 }}
            >
              <option value="2026-27">AY 2026–27</option>
              <option value="2025-26">AY 2025–26</option>
            </select>

            {/* Program */}
            <select
              className="form-control"
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px', fontWeight: 700 }}
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>

            {/* Semester */}
            <select
              className="form-control"
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px', fontWeight: 700 }}
            >
              <option value="ALL">All Semesters</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>Semester {s.number}</option>
              ))}
            </select>

            {/* Division */}
            <select
              className="form-control"
              value={selectedDivision}
              onChange={e => setSelectedDivision(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px', fontWeight: 700 }}
            >
              <option value="ALL">All Divisions</option>
              {divisions.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Lecture Type */}
            <select
              className="form-control"
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value as any)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px' }}
            >
              <option value="ALL">All Types</option>
              <option value="THEORY">Theory</option>
              <option value="PRACTICAL">Practical / Lab</option>
              <option value="TUTORIAL">Tutorial</option>
            </select>
          </div>

          {/* Right: Faculty Filter Toggle */}
          {role === 'FACULTY' && (
            <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setFacultyViewMode('MY_CLASSES')}
                style={{
                  border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                  background: facultyViewMode === 'MY_CLASSES' ? 'var(--brand-navy, #0B192C)' : 'transparent',
                  color: facultyViewMode === 'MY_CLASSES' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                My Assigned Classes
              </button>
              <button
                type="button"
                onClick={() => setFacultyViewMode('ALL_DIVISION')}
                style={{
                  border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                  background: facultyViewMode === 'ALL_DIVISION' ? 'var(--brand-navy, #0B192C)' : 'transparent',
                  color: facultyViewMode === 'ALL_DIVISION' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                Full Class Timetable
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ─── 4. Week Navigation Bar ────────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '8px',
        border: '1px solid #E2E8F0'
      }}>
        <button
          type="button"
          onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <ChevronLeft size={14} /> Previous Week
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <strong style={{ color: 'var(--brand-navy)', fontSize: '0.95rem' }}>
            {weekDates.label}
          </strong>
          {currentWeekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setCurrentWeekOffset(0)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', fontWeight: 700 }}
            >
              Today
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          Next Week <ChevronRight size={14} />
        </button>
      </div>

      {/* ─── 5. Excel-Style Weekly Timetable Grid ──────────────────────────── */}
      <div className="card" style={{ padding: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1050px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            
            {/* Header Columns */}
            <thead>
              <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
                <th style={{ width: '130px', padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  TIME SLOT
                </th>
                {DAYS.map(dayName => {
                  const dayInfo = weekDates.datesMap[dayName];
                  const lectureCount = dayLectureCounts[dayName];
                  const isToday = dayInfo.isToday;

                  return (
                    <th 
                      key={dayName}
                      style={{ 
                        width: '150px', padding: '0.85rem 0.75rem', textAlign: 'center', 
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        background: isToday ? '#1E3E62' : 'transparent',
                        borderBottom: isToday ? '3px solid #F37023' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.5px' }}>{dayName.toUpperCase()}</div>
                      <div style={{ fontSize: '0.7rem', color: isToday ? '#FBBF24' : '#94A3B8', fontWeight: 700 }}>{dayInfo.dateStr}</div>
                      <div style={{ fontSize: '0.65rem', color: '#CBD5E1', marginTop: '0.15rem' }}>{lectureCount} Lectures</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Time Slot Rows */}
            <tbody>
              {PERIOD_SLOTS.map((period, pIdx) => {
                
                // Full width Lunch Break row
                if (period.isBreak) {
                  return (
                    <tr key={period.id} style={{ background: '#FEF3C7', borderBottom: '2px solid #FCD34D' }}>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#92400E', fontFamily: 'monospace', borderRight: '1px solid #FCD34D' }}>
                        {period.shortLabel}
                      </td>
                      <td colSpan={6} style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 800, color: '#92400E', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                        🍱 12:00 – 01:00 PM • Lunch Break &amp; Campus Recess
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={period.id} style={{ borderBottom: '1px solid #E2E8F0', background: pIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    
                    {/* Time Slot Column */}
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace', borderRight: '1px solid #E2E8F0', background: '#F1F5F9' }}>
                      {period.shortLabel}
                    </td>

                    {/* Day Cells */}
                    {DAYS.map(dayName => {
                      const isToday = weekDates.datesMap[dayName].isToday;

                      // Find entry matching this day and time window
                      const entry = filteredEntries.find(e => {
                        if (e.dayOfWeek !== dayName) return false;
                        const { start } = parseTimeToMinutes(e.timeSlot);
                        return Math.abs(start - period.startMinutes) < 20;
                      });

                      if (!entry) {
                        return (
                          <td 
                            key={dayName}
                            style={{ 
                              padding: '0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0',
                              background: isToday ? '#FFFBF5' : 'transparent',
                              color: '#CBD5E1', fontSize: '0.75rem', fontStyle: 'italic'
                            }}
                          >
                            No Class
                          </td>
                        );
                      }

                      const subj = subjects.find(s => s.id === entry.subjectId);
                      const fac = facultyList.find(f => f.id === entry.facultyId);
                      const typeBadge = getLectureTypeBadge(entry.lectureType || subj?.type || 'THEORY');

                      return (
                        <td 
                          key={dayName}
                          style={{ 
                            padding: '0.45rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'top',
                            background: isToday ? '#FFF8F5' : 'transparent'
                          }}
                        >
                          <div 
                            onClick={() => setSelectedLectureDetail({
                              entry,
                              subject: subj,
                              faculty: fac,
                              division: divisions.find(d => d.id === entry.divisionId)
                            })}
                            style={{
                              background: '#FFFFFF',
                              border: `1px solid ${typeBadge.border}`,
                              borderRadius: '6px',
                              padding: '0.55rem 0.65rem',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              transition: 'all 0.15s ease'
                            }}
                            className="timetable-cell-card"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#1E40AF', fontSize: '0.75rem' }}>
                                {subj?.code || 'CSE-401'}
                              </span>
                              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 4px', borderRadius: '3px', background: typeBadge.bg, color: typeBadge.text }}>
                                {typeBadge.label}
                              </span>
                            </div>

                            <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.8rem', lineHeight: 1.2, marginTop: '0.1rem' }}>
                              {subj?.name || 'Subject'}
                            </div>

                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              B.Tech CSE • Div A
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed #E2E8F0', fontSize: '0.6875rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                                📍 {entry.roomNo}
                              </span>
                              <span style={{ color: '#64748B' }}>
                                {entry.buildingName || 'Block B'}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 6. Lecture Detail Modal ───────────────────────────────────────── */}
      {selectedLectureDetail && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', fontSize: '0.85rem' }}>
                    {selectedLectureDetail.subject?.code}
                  </span>
                  <Badge variant="orange">{selectedLectureDetail.entry.dayOfWeek}</Badge>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                  {selectedLectureDetail.subject?.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLectureDetail(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {/* 2-Column Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Time Slot</span>
                <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.9rem' }}>{selectedLectureDetail.entry.timeSlot}</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Location &amp; Room</span>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.9rem' }}>
                  {selectedLectureDetail.entry.roomNo} ({selectedLectureDetail.entry.buildingName || 'Block B'})
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Cohort / Section</span>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>B.Tech CSE • Semester 4 • Division A</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Enrolled Students</span>
                <div style={{ fontWeight: 800, color: '#059669' }}>64 Candidates Enrolled</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Computer Science &amp; Engineering</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Faculty</span>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{selectedLectureDetail.faculty?.name || user?.name}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleNavigateToSubjects();
                    setSelectedLectureDetail(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Open Subject
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleNavigateToSessionPlan(selectedLectureDetail.entry.subjectId);
                    setSelectedLectureDetail(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  View Session Plan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleNavigateToStudents();
                    setSelectedLectureDetail(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  View Students
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLectureDetail(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleNavigateToAttendance(selectedLectureDetail.entry);
                    setSelectedLectureDetail(null);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                >
                  Mark Attendance
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TimetablePage;
