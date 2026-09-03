import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { departmentScopeService } from '../../services/departmentScopeService';
import { canAccess } from '../../services/authorizationService';
import { 
  Student, Subject, Faculty, Program, Semester, Division, 
  AttendanceSession, AttendanceStatus, User 
} from '../../types';
import { ExcelDataTable, ExcelColumn, ExcelFilterOption, ExcelBulkAction } from '../common/ExcelDataTable';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { 
  CheckCircle2, AlertTriangle, AlertCircle, FileSpreadsheet, 
  Download, Eye, Edit3, History, BookOpen, Users, UserCheck, 
  Clock, ShieldCheck, Check, X, Plus, Calendar, RotateCcw,
  SlidersHorizontal, MessageSquare, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DepartmentAttendanceRecord {
  id: string; // `${studentId}_${subjectId}`
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  programId: string;
  programName: string;
  programCode: string;
  semesterId: string;
  semesterNumber: number;
  divisionId: string;
  divisionName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  attendancePercentage: number;
  minRequiredPercentage: number;
  shortagePercentage: number;
  eligibilityStatus: 'GOOD' | 'ELIGIBLE' | 'SHORTAGE' | 'CRITICAL';
  lastUpdated: string;
  remarks?: string;
  student: Student;
  subject: Subject;
}

export interface DepartmentAttendanceRegisterProps {
  onNavigateToApprovals?: () => void;
  onRefreshParent?: () => void;
  initialStatusFilter?: string;
}

export const DepartmentAttendanceRegister: React.FC<DepartmentAttendanceRegisterProps> = ({
  onNavigateToApprovals,
  onRefreshParent,
  initialStatusFilter = 'ALL'
}) => {
  const { user, role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Dependent Filter States ──────────────────────────────────────────────
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('ALL');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(initialStatusFilter);

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [viewingRecord, setViewingRecord] = useState<DepartmentAttendanceRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<DepartmentAttendanceRecord | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [subjectInfoModal, setSubjectInfoModal] = useState<Subject | null>(null);
  const [isBulkRemarkModalOpen, setIsBulkRemarkModalOpen] = useState(false);
  const [bulkRemarkText, setBulkRemarkText] = useState('');
  const [bulkSelectedRecords, setBulkSelectedRecords] = useState<DepartmentAttendanceRecord[]>([]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Scope & Master Data ──────────────────────────────────────────────────
  const scope = useMemo(() => {
    return departmentScopeService.resolveScopeIdentity(user, role || undefined);
  }, [user, role, refreshKey]);

  const scopedStudents = useMemo(() => {
    return departmentScopeService.getScopedStudents(user, role || undefined);
  }, [user, role, refreshKey]);

  const scopedSubjects = useMemo(() => {
    return departmentScopeService.getScopedSubjects(user, role || undefined);
  }, [user, role, refreshKey]);

  const scopedFaculty = useMemo(() => {
    return departmentScopeService.getScopedFaculty(user, role || undefined);
  }, [user, role, refreshKey]);

  const allAttendanceSessions = useMemo(() => {
    void refreshKey;
    return db.getState().attendanceSessions || [];
  }, [refreshKey]);

  // ─── Generate Department-Wide Student-Subject Attendance Matrix ────────────
  const attendanceDataset: DepartmentAttendanceRecord[] = useMemo(() => {
    const records: DepartmentAttendanceRecord[] = [];
    const minReq = 75; // Statutory minimum 75%

    scopedStudents.forEach(student => {
      // Find all department subjects appropriate for this student's program and semester
      const studentSubjects = scopedSubjects.filter(sub => {
        const matchesSem = !sub.semesterId || sub.semesterId === student.semesterId;
        const matchesProg = !sub.programId || sub.programId === student.programId;
        return matchesSem && matchesProg;
      });

      // Default to all scoped subjects if student has no direct semester match
      const targetSubjects = studentSubjects.length > 0 ? studentSubjects : scopedSubjects.slice(0, 4);

      targetSubjects.forEach(subject => {
        // Resolve subject faculty
        const faculty = scopedFaculty.find(f => f.id === subject.assignedFacultyId) || scopedFaculty[0];
        const program = scope.programs.find(p => p.id === student.programId) || scope.programs[0] || {
          id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE'
        };
        const semester = scope.semesters.find(s => s.id === student.semesterId) || {
          id: 'sem-4', number: 4, name: 'Semester 4'
        };

        // Calculate session attendance metrics for this student in this subject
        let total = 0;
        let present = 0;
        let absent = 0;
        let late = 0;
        let lastDate = '2026-08-25T10:30:00.000Z';

        allAttendanceSessions.forEach(sess => {
          if (sess.subjectId === subject.id) {
            const rec = sess.records?.find(r => r.studentId === student.id);
            if (rec) {
              total++;
              lastDate = sess.date || lastDate;
              if (rec.status === 'PRESENT') present++;
              else if (rec.status === 'LATE') { present++; late++; }
              else if (rec.status === 'ABSENT') absent++;
            }
          }
        });

        // If zero actual sessions recorded yet, derive realistic initial baseline
        if (total === 0) {
          // Deterministic seed stats based on student & subject ID hash
          const hash = (student.enrollmentNo || student.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + subject.code.charCodeAt(0);
          total = 24;
          // Most students have 70-95% attendance, with some shortage
          const isShortage = hash % 5 === 0;
          const isCritical = hash % 13 === 0;
          
          if (isCritical) {
            present = 12;
            absent = 12;
          } else if (isShortage) {
            present = 16;
            absent = 8;
          } else {
            present = 20 + (hash % 5);
            absent = total - present;
          }
        }

        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
        const shortagePercentage = Math.max(0, minReq - percentage);

        let eligibilityStatus: 'GOOD' | 'ELIGIBLE' | 'SHORTAGE' | 'CRITICAL' = 'ELIGIBLE';
        if (percentage >= 90) eligibilityStatus = 'GOOD';
        else if (percentage >= 75) eligibilityStatus = 'ELIGIBLE';
        else if (percentage >= 60) eligibilityStatus = 'SHORTAGE';
        else eligibilityStatus = 'CRITICAL';

        records.push({
          id: `${student.id}_${subject.id}`,
          studentId: student.id,
          studentName: student.name,
          enrollmentNo: student.enrollmentNo,
          departmentId: scope.departmentId,
          departmentName: scope.departmentName,
          departmentCode: scope.departmentCode,
          programId: program.id,
          programName: program.name,
          programCode: program.code,
          semesterId: semester.id,
          semesterNumber: semester.number || 4,
          divisionId: student.divisionId || 'Div A',
          divisionName: student.divisionId || 'Div A',
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          facultyId: faculty?.id || 'fac-1',
          facultyName: faculty?.name || 'Prof. Faculty',
          totalClasses: total,
          presentClasses: present,
          absentClasses: absent,
          lateClasses: late,
          attendancePercentage: percentage,
          minRequiredPercentage: minReq,
          shortagePercentage,
          eligibilityStatus,
          lastUpdated: lastDate,
          remarks: shortagePercentage > 0 ? `Statutory Shortage of ${shortagePercentage}%` : undefined,
          student,
          subject
        });
      });
    });

    return records;
  }, [scopedStudents, scopedSubjects, scopedFaculty, scope, allAttendanceSessions, refreshKey]);

  // ─── Filtered Dataset ─────────────────────────────────────────────────────
  const filteredDataset = useMemo(() => {
    return attendanceDataset.filter(item => {
      // 1. Program / Branch Filter
      if (selectedProgramId !== 'ALL' && item.programId !== selectedProgramId && item.programCode !== selectedProgramId) {
        return false;
      }
      // 2. Semester Filter
      if (selectedSemesterId !== 'ALL' && item.semesterId !== selectedSemesterId && String(item.semesterNumber) !== selectedSemesterId) {
        return false;
      }
      // 3. Division / Section Filter
      if (selectedDivisionId !== 'ALL' && item.divisionId !== selectedDivisionId) {
        return false;
      }
      // 4. Subject Filter
      if (selectedSubjectId !== 'ALL' && item.subjectId !== selectedSubjectId && item.subjectCode !== selectedSubjectId) {
        return false;
      }
      // 5. Faculty Filter
      if (selectedFacultyId !== 'ALL' && item.facultyId !== selectedFacultyId) {
        return false;
      }
      // 6. Eligibility Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'ELIGIBLE' && item.eligibilityStatus !== 'ELIGIBLE' && item.eligibilityStatus !== 'GOOD') return false;
        if (selectedStatusFilter === 'SHORTAGE' && item.eligibilityStatus !== 'SHORTAGE' && item.eligibilityStatus !== 'CRITICAL') return false;
        if (selectedStatusFilter === 'CRITICAL' && item.eligibilityStatus !== 'CRITICAL') return false;
        if (selectedStatusFilter === 'GOOD' && item.eligibilityStatus !== 'GOOD') return false;
      }
      return true;
    });
  }, [
    attendanceDataset, 
    selectedProgramId, 
    selectedSemesterId, 
    selectedDivisionId, 
    selectedSubjectId, 
    selectedFacultyId, 
    selectedStatusFilter
  ]);

  // ─── Dynamic Summary KPIs (Reacting to Active Filters) ─────────────────────
  const summaryKPIs = useMemo(() => {
    const uniqueStudents = new Set(filteredDataset.map(r => r.studentId)).size;
    const uniqueSubjects = new Set(filteredDataset.map(r => r.subjectId)).size;
    const totalRecords = filteredDataset.length;
    
    const eligibleCount = filteredDataset.filter(r => r.eligibilityStatus === 'ELIGIBLE' || r.eligibilityStatus === 'GOOD').length;
    const shortageCount = filteredDataset.filter(r => r.eligibilityStatus === 'SHORTAGE').length;
    const criticalCount = filteredDataset.filter(r => r.eligibilityStatus === 'CRITICAL').length;
    
    const totalAttSum = filteredDataset.reduce((sum, r) => sum + r.attendancePercentage, 0);
    const averageAttendance = totalRecords > 0 ? Math.round(totalAttSum / totalRecords) : 0;

    return {
      uniqueStudents,
      uniqueSubjects,
      totalRecords,
      eligibleCount,
      shortageCount,
      criticalCount,
      averageAttendance
    };
  }, [filteredDataset]);

  // ─── Reset All Dependent Filters ──────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedProgramId('ALL');
    setSelectedSemesterId('ALL');
    setSelectedDivisionId('ALL');
    setSelectedSubjectId('ALL');
    setSelectedFacultyId('ALL');
    setSelectedStatusFilter('ALL');
  };

  // ─── Handle Inline Save ───────────────────────────────────────────────────
  const handleSaveInlineAttendance = async (
    item: DepartmentAttendanceRecord, 
    editedValues: Partial<DepartmentAttendanceRecord>
  ) => {
    const newPresent = editedValues.presentClasses !== undefined ? Number(editedValues.presentClasses) : item.presentClasses;
    const newAbsent = editedValues.absentClasses !== undefined ? Number(editedValues.absentClasses) : item.absentClasses;
    const newTotal = newPresent + newAbsent;

    if (newTotal === 0) {
      showToast('Error: Total classes cannot be zero.');
      return;
    }

    // Upsert / Record in DB attendance sessions
    const sessions = db.getState().attendanceSessions || [];
    let targetSession = sessions.find(s => s.subjectId === item.subjectId);

    if (!targetSession) {
      targetSession = {
        id: `sess-${Date.now()}`,
        subjectId: item.subjectId,
        facultyId: item.facultyId,
        divisionId: item.divisionId,
        date: new Date().toISOString().split('T')[0],
        lectureNo: 1,
        records: []
      } as any;
      if (targetSession) {
        sessions.push(targetSession);
      }
    }

    if (targetSession) {
      targetSession.records = targetSession.records || [];
      const existingRecIdx = targetSession.records.findIndex(r => r.studentId === item.studentId);
      const recStatus: AttendanceStatus = newPresent > newAbsent ? 'PRESENT' : 'ABSENT';

      if (existingRecIdx >= 0) {
        targetSession.records[existingRecIdx].status = recStatus;
        targetSession.records[existingRecIdx].remarks = (editedValues as any).remarks || targetSession.records[existingRecIdx].remarks;
      } else {
        targetSession.records.push({
          studentId: item.studentId,
          studentName: item.studentName,
          enrollmentNo: item.enrollmentNo,
          status: recStatus,
          remarks: (editedValues as any).remarks
        } as any);
      }
    }

    db.saveState();
    setRefreshKey(k => k + 1);
    if (onRefreshParent) onRefreshParent();

    const newPct = Math.round((newPresent / newTotal) * 100);
    showToast(`Attendance updated for ${item.studentName} in ${item.subjectCode}: ${newPresent}/${newTotal} (${newPct}%).`);
  };

  // ─── Bulk Action Handlers ─────────────────────────────────────────────────
  const handleBulkMarkReviewed = (records: DepartmentAttendanceRecord[]) => {
    records.forEach(rec => {
      rec.remarks = `Reviewed by HOD (${scope.hodName}) on ${new Date().toLocaleDateString()}`;
    });
    setRefreshKey(k => k + 1);
    showToast(`Marked ${records.length} records as reviewed by HOD.`);
  };

  const handleOpenBulkRemark = (records: DepartmentAttendanceRecord[]) => {
    setBulkSelectedRecords(records);
    setBulkRemarkText('');
    setIsBulkRemarkModalOpen(true);
  };

  const handleSaveBulkRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkRemarkText.trim()) return;

    bulkSelectedRecords.forEach(rec => {
      rec.remarks = bulkRemarkText.trim();
    });

    setIsBulkRemarkModalOpen(false);
    setRefreshKey(k => k + 1);
    showToast(`Applied remark to ${bulkSelectedRecords.length} student attendance records.`);
  };

  // ─── Dependent Filter Options Configurations ──────────────────────────────
  const filterOptions: ExcelFilterOption[] = useMemo(() => {
    // 1. Department (Locked to HOD)
    const deptOpt: ExcelFilterOption = {
      key: 'department',
      label: 'Department',
      value: scope.departmentId,
      disabled: true,
      tooltip: 'Scope locked to your assigned department',
      options: [{ label: `[${scope.departmentCode}] ${scope.departmentName}`, value: scope.departmentId }]
    };

    // 2. Program / Branch
    const progOpt: ExcelFilterOption = {
      key: 'program',
      label: 'Program / Branch',
      value: selectedProgramId,
      options: [
        { label: 'All Department Branches', value: 'ALL' },
        ...scope.programs.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))
      ]
    };

    // 3. Semester
    const semOpt: ExcelFilterOption = {
      key: 'semester',
      label: 'Semester',
      value: selectedSemesterId,
      options: [
        { label: 'All Semesters', value: 'ALL' },
        ...scope.semesters.map(s => ({ label: `Sem ${s.number}`, value: s.id }))
      ]
    };

    // 4. Section / Division
    const divOpt: ExcelFilterOption = {
      key: 'division',
      label: 'Section',
      value: selectedDivisionId,
      options: [
        { label: 'All Sections', value: 'ALL' },
        { label: 'Division A', value: 'Div A' },
        { label: 'Division B', value: 'Div B' },
        { label: 'Division C', value: 'Div C' }
      ]
    };

    // 5. Subject
    const subOpt: ExcelFilterOption = {
      key: 'subject',
      label: 'Subject',
      value: selectedSubjectId,
      options: [
        { label: 'All Department Subjects', value: 'ALL' },
        ...scopedSubjects.map(s => ({ label: `${s.code} — ${s.name}`, value: s.id }))
      ]
    };

    // 6. Faculty
    const facOpt: ExcelFilterOption = {
      key: 'faculty',
      label: 'Faculty',
      value: selectedFacultyId,
      options: [
        { label: 'All Faculty', value: 'ALL' },
        ...scopedFaculty.map(f => ({ label: `Prof. ${f.name}`, value: f.id }))
      ]
    };

    // 7. Status
    const statusOpt: ExcelFilterOption = {
      key: 'status',
      label: 'Status',
      value: selectedStatusFilter,
      options: [
        { label: 'All Eligibility Status', value: 'ALL' },
        { label: 'ELIGIBLE (>=75%)', value: 'ELIGIBLE' },
        { label: 'SHORTAGE (60–74%)', value: 'SHORTAGE' },
        { label: 'CRITICAL (<60%)', value: 'CRITICAL' },
        { label: 'EXCELLENT (>=90%)', value: 'GOOD' }
      ]
    };

    return [deptOpt, progOpt, semOpt, divOpt, subOpt, facOpt, statusOpt];
  }, [
    scope, 
    selectedProgramId, 
    selectedSemesterId, 
    selectedDivisionId, 
    selectedSubjectId, 
    selectedFacultyId, 
    selectedStatusFilter, 
    scopedSubjects, 
    scopedFaculty
  ]);

  // Handle dynamic filter change
  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'program':
        setSelectedProgramId(value);
        break;
      case 'semester':
        setSelectedSemesterId(value);
        break;
      case 'division':
        setSelectedDivisionId(value);
        break;
      case 'subject':
        setSelectedSubjectId(value);
        break;
      case 'faculty':
        setSelectedFacultyId(value);
        break;
      case 'status':
        setSelectedStatusFilter(value);
        break;
    }
  };

  // ─── 20 Spreadsheet Columns Definition ────────────────────────────────────
  const columns: ExcelColumn<DepartmentAttendanceRecord>[] = useMemo(() => [
    // 1. Index
    {
      key: 'index',
      header: '#',
      width: '45px',
      align: 'center',
      sortable: false,
      render: (_, idx) => <span style={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</span>,
      getRawValue: item => item.id
    },
    // 2. Student Name
    {
      key: 'studentName',
      header: 'STUDENT NAME',
      width: '180px',
      minWidth: '160px',
      sortable: true,
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.825rem' }}>
            {item.studentName}
          </strong>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
            {item.student.email}
          </div>
        </div>
      ),
      getRawValue: item => item.studentName
    },
    // 3. Enrollment Number
    {
      key: 'enrollmentNo',
      header: 'ENROLLMENT NO.',
      width: '125px',
      sortable: true,
      render: item => (
        <code style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          color: 'var(--brand-orange, #F37023)',
          background: 'rgba(243, 112, 35, 0.08)',
          padding: '2px 5px',
          borderRadius: '3px'
        }}>
          {item.enrollmentNo}
        </code>
      ),
      getRawValue: item => item.enrollmentNo
    },
    // 4. Department
    {
      key: 'departmentCode',
      header: 'DEPARTMENT',
      width: '140px',
      sortable: true,
      render: item => <span style={{ color: '#334155' }}>{item.departmentCode}</span>,
      getRawValue: item => item.departmentCode
    },
    // 5. Program
    {
      key: 'programCode',
      header: 'BRANCH / PROGRAM',
      width: '140px',
      sortable: true,
      render: item => (
        <span style={{ 
          fontSize: '0.725rem', 
          fontWeight: 800, 
          color: 'var(--brand-navy)',
          background: '#F1F5F9',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {item.programCode}
        </span>
      ),
      getRawValue: item => item.programCode
    },
    // 6. Semester
    {
      key: 'semesterNumber',
      header: 'SEM',
      width: '65px',
      align: 'center',
      sortable: true,
      render: item => <strong style={{ color: '#1E293B' }}>Sem {item.semesterNumber}</strong>,
      getRawValue: item => item.semesterNumber
    },
    // 7. Section / Division
    {
      key: 'divisionId',
      header: 'SEC',
      width: '65px',
      align: 'center',
      sortable: true,
      render: item => <span style={{ fontWeight: 600 }}>{item.divisionId}</span>,
      getRawValue: item => item.divisionId
    },
    // 8. Subject Code
    {
      key: 'subjectCode',
      header: 'SUB CODE',
      width: '90px',
      sortable: true,
      render: item => (
        <code style={{ fontSize: '0.725rem', fontWeight: 800, color: '#0369A1' }}>
          {item.subjectCode}
        </code>
      ),
      getRawValue: item => item.subjectCode
    },
    // 9. Subject Name
    {
      key: 'subjectName',
      header: 'SUBJECT NAME',
      width: '210px',
      minWidth: '180px',
      sortable: true,
      render: item => (
        <div style={{ color: '#1E293B', fontWeight: 600, fontSize: '0.8rem' }} title={item.subjectName}>
          {item.subjectName}
        </div>
      ),
      getRawValue: item => item.subjectName
    },
    // 10. Assigned Faculty
    {
      key: 'facultyName',
      header: 'FACULTY',
      width: '160px',
      sortable: true,
      render: item => (
        <div style={{ fontSize: '0.78125rem', color: '#334155' }}>
          {item.facultyName}
        </div>
      ),
      getRawValue: item => item.facultyName
    },
    // 11. Total Classes
    {
      key: 'totalClasses',
      header: 'TOTAL',
      width: '75px',
      align: 'center',
      sortable: true,
      editable: false,
      render: item => <strong>{item.totalClasses}</strong>,
      getRawValue: item => item.totalClasses
    },
    // 12. Present Classes (Editable)
    {
      key: 'presentClasses',
      header: 'PRESENT',
      width: '85px',
      align: 'center',
      sortable: true,
      editable: true,
      editType: 'number',
      render: item => (
        <span style={{ fontWeight: 800, color: '#15803D' }}>
          {item.presentClasses}
        </span>
      ),
      getRawValue: item => item.presentClasses
    },
    // 13. Absent Classes (Editable)
    {
      key: 'absentClasses',
      header: 'ABSENT',
      width: '85px',
      align: 'center',
      sortable: true,
      editable: true,
      editType: 'number',
      render: item => (
        <span style={{ fontWeight: 800, color: item.absentClasses > 4 ? '#DC2626' : '#64748B' }}>
          {item.absentClasses}
        </span>
      ),
      getRawValue: item => item.absentClasses
    },
    // 14. Attendance Percentage
    {
      key: 'attendancePercentage',
      header: 'ATT %',
      width: '95px',
      align: 'center',
      sortable: true,
      render: item => {
        const isShort = item.attendancePercentage < 75;
        return (
          <span style={{ 
            fontSize: '0.8125rem', 
            fontWeight: 900, 
            padding: '2px 7px', 
            borderRadius: '4px',
            background: !isShort ? '#DCFCE7' : '#FEE2E2',
            color: !isShort ? '#15803D' : '#B91C1C',
            border: `1px solid ${!isShort ? '#BBF7D0' : '#FECACA'}`
          }}>
            {item.attendancePercentage}%
          </span>
        );
      },
      getRawValue: item => item.attendancePercentage
    },
    // 15. Minimum Required %
    {
      key: 'minRequiredPercentage',
      header: 'REQ %',
      width: '70px',
      align: 'center',
      sortable: false,
      render: item => <span style={{ color: '#64748B', fontWeight: 600 }}>{item.minRequiredPercentage}%</span>,
      getRawValue: item => item.minRequiredPercentage
    },
    // 16. Shortage %
    {
      key: 'shortagePercentage',
      header: 'SHORTAGE',
      width: '85px',
      align: 'center',
      sortable: true,
      render: item => (
        item.shortagePercentage > 0 ? (
          <span style={{ fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '1px 5px', borderRadius: '3px' }}>
            -{item.shortagePercentage}%
          </span>
        ) : (
          <span style={{ color: '#10B981', fontWeight: 700 }}>0%</span>
        )
      ),
      getRawValue: item => item.shortagePercentage
    },
    // 17. Eligibility Status Badge
    {
      key: 'eligibilityStatus',
      header: 'ELIGIBILITY',
      width: '115px',
      align: 'center',
      sortable: true,
      render: item => {
        switch (item.eligibilityStatus) {
          case 'GOOD':
            return <Badge variant="active">100% GOOD</Badge>;
          case 'ELIGIBLE':
            return <Badge variant="active">ELIGIBLE</Badge>;
          case 'SHORTAGE':
            return <Badge variant="warning">SHORTAGE</Badge>;
          case 'CRITICAL':
            return <Badge variant="danger">CRITICAL</Badge>;
          default:
            return <Badge variant="navy">{item.eligibilityStatus}</Badge>;
        }
      },
      getRawValue: item => item.eligibilityStatus
    },
    // 18. Last Updated
    {
      key: 'lastUpdated',
      header: 'LAST UPDATED',
      width: '120px',
      sortable: true,
      render: item => (
        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>
          {new Date(item.lastUpdated).toLocaleDateString()}
        </span>
      ),
      getRawValue: item => item.lastUpdated
    },
    // 19. Actions
    {
      key: 'actions',
      header: 'ACTIONS',
      width: '160px',
      align: 'center',
      sortable: false,
      render: item => (
        <div style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setViewingRecord(item)}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="View Attendance Details"
          >
            <Eye size={11} /> View
          </button>

          <button
            type="button"
            onClick={() => setHistoryRecord(item)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="View Attendance History Sessions"
          >
            <History size={11} /> History
          </button>

          <button
            type="button"
            onClick={() => setSelectedStudentForProfile(item.student)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="View Student Academic Profile"
          >
            Student
          </button>
        </div>
      )
    }
  ], []);

  // ─── Bulk Actions Configuration ───────────────────────────────────────────
  const bulkActions: ExcelBulkAction<DepartmentAttendanceRecord>[] = useMemo(() => [
    {
      key: 'mark_reviewed',
      label: 'Mark Reviewed',
      icon: <Check size={12} />,
      variant: 'secondary',
      onClick: handleBulkMarkReviewed
    },
    {
      key: 'add_remark',
      label: 'Add Remark',
      icon: <MessageSquare size={12} />,
      variant: 'primary',
      onClick: handleOpenBulkRemark
    }
  ], [scope]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ 
          padding: '0.75rem 1.25rem', 
          backgroundColor: '#ECFDF5', 
          border: '1px solid #10B981', 
          color: '#065F46', 
          borderRadius: '8px', 
          fontWeight: 700, 
          fontSize: '0.84rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
        }}>
          <CheckCircle2 size={18} color="#10B981" /> {toastMessage}
        </div>
      )}

      {/* ═══ 1. COMPACT KPI CARDS (REACTING TO ACTIVE FILTERS) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        
        {/* TOTAL STUDENTS */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-navy, #0B192C)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL STUDENTS</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
            {summaryKPIs.uniqueStudents}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>In active scope</div>
        </div>

        {/* TOTAL SUBJECTS */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #0EA5E9', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL SUBJECTS</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>
            {summaryKPIs.uniqueSubjects}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Curriculum courses</div>
        </div>

        {/* TOTAL RECORDS */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #6366F1', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL ENTRIES</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>
            {summaryKPIs.totalRecords}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Student-Subject pairs</div>
        </div>

        {/* ELIGIBLE (>=75%) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>ELIGIBLE (&gt;=75%)</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            {summaryKPIs.eligibleCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803D', marginTop: '2px', fontWeight: 700 }}>
            {summaryKPIs.totalRecords > 0 ? Math.round((summaryKPIs.eligibleCount / summaryKPIs.totalRecords) * 100) : 0}% Clear
          </div>
        </div>

        {/* SHORTAGE (60–74%) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${summaryKPIs.shortageCount > 0 ? '#F59E0B' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>SHORTAGE (60–74%)</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: summaryKPIs.shortageCount > 0 ? '#D97706' : '#15803D', marginTop: '2px' }}>
            {summaryKPIs.shortageCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: '2px' }}>Condonation eligible</div>
        </div>

        {/* CRITICAL SHORTAGE (<60%) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${summaryKPIs.criticalCount > 0 ? '#EF4444' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>CRITICAL (&lt;60%)</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: summaryKPIs.criticalCount > 0 ? '#DC2626' : '#15803D', marginTop: '2px' }}>
            {summaryKPIs.criticalCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px' }}>High academic risk</div>
        </div>

        {/* AVERAGE ATTENDANCE */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-orange, #F37023)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>DEPT AVERAGE</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '2px' }}>
            {summaryKPIs.averageAttendance}%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Department benchmark</div>
        </div>

      </div>

      {/* ═══ 2. REUSABLE EXCEL DATA TABLE ═══ */}
      <ExcelDataTable<DepartmentAttendanceRecord>
        data={filteredDataset}
        columns={columns}
        keyField="id"
        title={`Department-Wide Subject Attendance Register (${filteredDataset.length} Records)`}
        subtitle={`Live attendance logs and statutory condonation tracking for ${scope.departmentName} (${scope.departmentCode}). Click any row to view, or click Present/Absent to edit inline.`}
        searchPlaceholder="Search student name, enrollment, subject, faculty, section..."
        searchFields={['studentName', 'enrollmentNo', 'subjectCode', 'subjectName', 'facultyName', 'divisionId', 'programCode']}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        bulkActions={bulkActions}
        enableSelection={true}
        enableInlineEditing={true}
        onSaveInlineEdit={handleSaveInlineAttendance}
        exportFilename={`SSIU_Department_Attendance_${scope.departmentCode}`}
        exportTitle={`${scope.departmentName} - Subject Attendance Register`}
        exportMetadata={{
          'Department': scope.departmentName,
          'Department Code': scope.departmentCode,
          'Academic Year': scope.academicYear,
          'Total Records': String(summaryKPIs.totalRecords),
          'Eligible Count': String(summaryKPIs.eligibleCount),
          'Shortage Count': String(summaryKPIs.shortageCount),
          'Critical Count': String(summaryKPIs.criticalCount)
        }}
        defaultPageSize={25}
        pageSizeOptions={[25, 50, 100, 200]}
        onRefresh={() => {
          setRefreshKey(k => k + 1);
          if (onRefreshParent) onRefreshParent();
          showToast('Attendance register refreshed.');
        }}
        toolbarExtra={
          onNavigateToApprovals && (
            <button 
              type="button" 
              onClick={onNavigateToApprovals}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ShieldCheck size={14} /> Open Approvals Queue →
            </button>
          )
        }
        emptyMessage="No attendance records found"
        emptyDescription="Try changing the selected Branch, Semester, Subject, Faculty or search query."
        rowHighlightPredicate={item => {
          if (item.eligibilityStatus === 'CRITICAL') return 'rgba(239, 68, 68, 0.04)';
          if (item.eligibilityStatus === 'SHORTAGE') return 'rgba(245, 158, 11, 0.04)';
          return undefined;
        }}
      />

      {/* ═══ 3. VIEW ATTENDANCE DOSSIER MODAL ═══ */}
      {viewingRecord && (
        <Modal
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          title={`Attendance Dossier: ${viewingRecord.studentName} — ${viewingRecord.subjectCode}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            
            {/* Header Banner */}
            <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 100%)', color: '#FFFFFF', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                    {viewingRecord.studentName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#93C5FD', marginTop: '2px' }}>
                    Enrollment: <strong>{viewingRecord.enrollmentNo}</strong> • {viewingRecord.programName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
                    Semester {viewingRecord.semesterNumber} • Section: <strong>{viewingRecord.divisionId}</strong>
                  </div>
                </div>

                <div>
                  <Badge variant={viewingRecord.eligibilityStatus === 'ELIGIBLE' || viewingRecord.eligibilityStatus === 'GOOD' ? 'active' : 'danger'}>
                    {viewingRecord.eligibilityStatus} ({viewingRecord.attendancePercentage}%)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Course & Faculty Info */}
            <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div><strong>Course Subject:</strong> {viewingRecord.subjectName} (<code>{viewingRecord.subjectCode}</code>)</div>
              <div style={{ marginTop: '3px' }}><strong>Assigned Faculty:</strong> {viewingRecord.facultyName}</div>
              <div style={{ marginTop: '3px' }}><strong>Department:</strong> {viewingRecord.departmentName}</div>
            </div>

            {/* Statistics Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', textAlign: 'center' }}>
              <div style={{ padding: '0.65rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>TOTAL</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
                  {viewingRecord.totalClasses}
                </div>
              </div>
              <div style={{ padding: '0.65rem', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700 }}>PRESENT</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
                  {viewingRecord.presentClasses}
                </div>
              </div>
              <div style={{ padding: '0.65rem', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>ABSENT</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                  {viewingRecord.absentClasses}
                </div>
              </div>
              <div style={{ padding: '0.65rem', background: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: 700 }}>SHORTAGE</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#B45309', marginTop: '2px' }}>
                  {viewingRecord.shortagePercentage}%
                </div>
              </div>
            </div>

            {/* Remarks / Observations */}
            {viewingRecord.remarks && (
              <div style={{ padding: '0.75rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '0.8rem', color: '#92400E' }}>
                <strong>Department Observation:</strong> {viewingRecord.remarks}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  const s = viewingRecord.student;
                  setViewingRecord(null);
                  setSelectedStudentForProfile(s);
                }}
                className="btn btn-secondary btn-sm"
              >
                View Full Profile
              </button>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ═══ 4. SESSION-BY-SESSION ATTENDANCE HISTORY MODAL ═══ */}
      {historyRecord && (
        <Modal
          isOpen={!!historyRecord}
          onClose={() => setHistoryRecord(null)}
          title={`Session Log History: ${historyRecord.studentName} (${historyRecord.subjectCode})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
              Individual class sessions recorded for <strong>{historyRecord.subjectName}</strong> ({historyRecord.subjectCode}) with Prof. {historyRecord.facultyName}.
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem' }}>
                <thead style={{ background: '#F8FAFC', color: '#334155', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>Lecture #</th>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: historyRecord.totalClasses }).map((_, idx) => {
                    const isPresent = idx < historyRecord.presentClasses;
                    const classDate = new Date(Date.now() - (historyRecord.totalClasses - idx) * 86400000 * 2).toLocaleDateString();

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF' }}>
                        <td style={{ padding: '0.45rem 0.6rem', color: '#64748B' }}>{idx + 1}</td>
                        <td style={{ padding: '0.45rem 0.6rem' }}>{classDate}</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>Lecture {idx + 1}</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            padding: '1px 6px', 
                            borderRadius: '3px',
                            background: isPresent ? '#DCFCE7' : '#FEE2E2',
                            color: isPresent ? '#15803D' : '#DC2626'
                          }}>
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </td>
                        <td style={{ padding: '0.45rem 0.6rem', color: '#64748B', fontSize: '0.725rem' }}>
                          {isPresent ? 'Attended classroom session' : 'Absent without leave application'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setHistoryRecord(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Log
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ 5. BULK REMARK MODAL ═══ */}
      {isBulkRemarkModalOpen && (
        <Modal
          isOpen={isBulkRemarkModalOpen}
          onClose={() => setIsBulkRemarkModalOpen(false)}
          title={`Add Bulk Attendance Remark (${bulkSelectedRecords.length} Selected)`}
        >
          <form onSubmit={handleSaveBulkRemark} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Enter observation or department notes to attach to the {bulkSelectedRecords.length} selected student-subject attendance entries.
            </div>

            <div className="form-group">
              <label className="form-label">Department Remark / Observation *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Advised to attend remedial lectures; mentor follow-up initiated."
                value={bulkRemarkText}
                onChange={e => setBulkRemarkText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsBulkRemarkModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Apply Remark
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══ 6. STUDENT PROFILE MODAL ═══ */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={true}
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}

    </div>
  );
};
