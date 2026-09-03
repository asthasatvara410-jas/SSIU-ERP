import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { 
  MentorAssignment, MentorAssignmentHistory, MentorBulkUploadRow 
} from '../../types/mentorAssignment';
import { Student, Faculty, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { 
  UserCheck, Users, Search, Filter, Download, Upload, Plus, 
  RotateCcw, History, AlertCircle, CheckCircle2, ShieldCheck, 
  FileSpreadsheet, ArrowRight, UserX, Clock, Calendar, Check, X
} from 'lucide-react';

interface MentorAssignmentTabProps {
  initialDeptFilter?: string;
  initialInstFilter?: string;
}

export const MentorAssignmentTab: React.FC<MentorAssignmentTabProps> = ({
  initialDeptFilter,
  initialInstFilter
}) => {
  const { user, role, canMutate } = useAuth();

  // Filters State
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>(initialInstFilter || (user?.instituteId || 'ALL'));
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>(initialDeptFilter || (user?.departmentId || 'ALL'));
  const [selectedProgFilter, setSelectedProgFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [isChangeMode, setIsChangeMode] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [historyList, setHistoryList] = useState<MentorAssignmentHistory[]>([]);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkValidationResult, setBulkValidationResult] = useState<{
    totalRows: number;
    validRows: MentorBulkUploadRow[];
    invalidRows: MentorBulkUploadRow[];
    errorsSummary: string[];
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [deletingAssignment, setDeletingAssignment] = useState<MentorAssignment | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trigger re-render
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();

  // Scoped assignments & students
  const { assignments, students } = useMemo(() => {
    return mentorAssignmentService.getAssignments({
      instituteId: role === 'PRINCIPAL' ? (user?.instituteId || undefined) : selectedInstFilter,
      departmentId: role === 'HOD' ? (user?.departmentId || undefined) : selectedDeptFilter,
      programId: selectedProgFilter,
      searchQuery
    }, user);
  }, [user, role, selectedInstFilter, selectedDeptFilter, selectedProgFilter, searchQuery, refreshKey]);

  // Merge each student with their active mentor
  const studentRows = useMemo(() => {
    return students.map(student => {
      const active = assignments.find(
        a => (a.studentId === student.id || a.studentEnrollmentNo === student.enrollmentNo) && 
             a.status === 'ACTIVE'
      );
      const activeMentor = active || mentorAssignmentService.getActiveMentorForStudent(student.id);
      return {
        student,
        activeMentor,
        isAssigned: Boolean(activeMentor && activeMentor.status === 'ACTIVE')
      };
    }).filter(row => {
      if (selectedStatusFilter === 'ASSIGNED') return row.isAssigned;
      if (selectedStatusFilter === 'UNASSIGNED') return !row.isAssigned;
      return true;
    });
  }, [students, assignments, selectedStatusFilter]);

  // Summary Metrics
  const totalStudents = students.length;
  const assignedStudents = studentRows.filter(r => r.isAssigned).length;
  const unassignedStudents = totalStudents - assignedStudents;
  const eligibleFaculty = useMemo(() => {
    return mentorAssignmentService.getEligibleMentors({
      instituteId: role === 'PRINCIPAL' ? user?.instituteId : (selectedInstFilter !== 'ALL' ? selectedInstFilter : undefined),
      departmentId: role === 'HOD' ? user?.departmentId : (selectedDeptFilter !== 'ALL' ? selectedDeptFilter : undefined)
    });
  }, [role, user, selectedInstFilter, selectedDeptFilter, refreshKey]);

  // Handle open Single Assign / Change Modal
  const handleOpenAssignModal = (student: Student, isChange = false) => {
    setAssigningStudent(student);
    setIsChangeMode(isChange);
    setChangeReason('');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);

    const active = mentorAssignmentService.getActiveMentorForStudent(student.id);
    if (active && !isChange) {
      // Already assigned, switch to change mode
      setIsChangeMode(true);
      setSelectedFacultyId(active.mentorFacultyId);
    } else {
      setSelectedFacultyId(active?.mentorFacultyId || '');
    }
  };

  // Submit Assign / Change
  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent || !selectedFacultyId || !user) return;

    try {
      mentorAssignmentService.assignMentor({
        studentId: assigningStudent.id,
        mentorFacultyId: selectedFacultyId,
        effectiveFrom,
        changeReason,
        isChange: isChangeMode
      }, user);

      setAssigningStudent(null);
      setRefreshKey(k => k + 1);
      showToast('success', `Faculty mentor assigned successfully to student ${assigningStudent.name} (${assigningStudent.enrollmentNo}).`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to assign mentor.');
    }
  };

  // View History
  const handleOpenHistory = (student: Student) => {
    setHistoryStudent(student);
    const history = mentorAssignmentService.getAssignmentHistory(student.id);
    setHistoryList(history);
  };

  // Remove Mentor
  const handleConfirmRemove = () => {
    if (!deletingAssignment || !user) return;
    try {
      mentorAssignmentService.removeMentor(deletingAssignment.id, deleteReason || 'Mentor unassigned by administrator', user);
      setDeletingAssignment(null);
      setDeleteReason('');
      setRefreshKey(k => k + 1);
      showToast('success', `Mentor assignment removed successfully.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove mentor.');
    }
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const bytes = mentorAssignmentService.exportMentorTemplateXlsx();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mentor_Assignment_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Official .XLSX mentor assignment template downloaded.');
  };

  // Bulk File Upload & Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      showToast('error', 'Only official .xlsx files are permitted. CSV and other formats are not supported.');
      return;
    }

    setBulkFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (user) {
          const result = mentorAssignmentService.parseAndValidateBulkXlsx(buffer, user);
          setBulkValidationResult(result);
        }
      } catch (err: any) {
        showToast('error', `Failed to parse XLSX file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Commit Bulk Upload
  const handleCommitBulk = () => {
    if (!bulkValidationResult || bulkValidationResult.validRows.length === 0 || !user) return;

    setIsUploading(true);
    try {
      const count = mentorAssignmentService.commitBulkUpload(bulkValidationResult.validRows, user);
      setIsBulkModalOpen(false);
      setBulkFile(null);
      setBulkValidationResult(null);
      setRefreshKey(k => k + 1);
      showToast('success', `Successfully processed bulk mentor assignment for ${count} students.`);
    } catch (err: any) {
      showToast('error', `Bulk assignment failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
          color: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontWeight: 600
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        padding: '1.75rem',
        background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1a365d 100%)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="gold">
              {role === 'HOD' ? 'Departmental Authority' : role === 'PRINCIPAL' ? 'Institutional Authority' : 'University Central Office'}
            </Badge>
            <span style={{ fontSize: '0.8rem', color: '#FEF3C7' }}>Centralized Student Mentor Allocation Engine</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.5rem' }}>
            Student Mentor Assignment &amp; Allocation
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#E2E8F0', marginTop: '0.25rem' }}>
            {role === 'HOD' 
              ? `Manage faculty mentor mappings for authorized students in ${user?.departmentId || 'your Department'}.`
              : role === 'PRINCIPAL'
              ? `Manage mentor mappings across all constituent departments in ${user?.instituteId || 'your Institute'}.`
              : 'University-wide faculty mentor allocation and oversight management.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleDownloadTemplate} style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Download size={16} /> Download .XLSX Template
          </button>
          <button className="btn btn-primary" onClick={() => { setIsBulkModalOpen(true); setBulkFile(null); setBulkValidationResult(null); }}>
            <Upload size={16} /> Bulk Assign (.XLSX)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard title="Total Students" value={totalStudents} subtitle="In authorized scope" icon={Users} colorScheme="navy" />
        <StatCard title="Mentors Assigned" value={assignedStudents} subtitle={`${totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0}% Allocated`} icon={CheckCircle2} colorScheme="green" onClick={() => setSelectedStatusFilter('ASSIGNED')} />
        <StatCard title="Unassigned Students" value={unassignedStudents} subtitle="Requires faculty mentor" icon={AlertCircle} colorScheme={unassignedStudents > 0 ? 'orange' : 'green'} onClick={() => setSelectedStatusFilter('UNASSIGNED')} />
        <StatCard title="Eligible Mentors" value={eligibleFaculty.length} subtitle="Active faculty in scope" icon={UserCheck} colorScheme="gold" />
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Institute filter for Super Admin */}
          {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Institute</label>
              <select className="form-control" value={selectedInstFilter} onChange={e => setSelectedInstFilter(e.target.value)}>
                <option value="ALL">All Institutes</option>
                {institutes.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
              </select>
            </div>
          )}

          {/* Department filter for HOI / Super Admin */}
          {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL') && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Department</label>
              <select className="form-control" value={selectedDeptFilter} onChange={e => setSelectedDeptFilter(e.target.value)}>
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Program</label>
            <select className="form-control" value={selectedProgFilter} onChange={e => setSelectedProgFilter(e.target.value)}>
              <option value="ALL">All Programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Allocation Status</label>
            <select className="form-control" value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value as any)}>
              <option value="ALL">All Students</option>
              <option value="ASSIGNED">Assigned Only</option>
              <option value="UNASSIGNED">Unassigned Only</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Search Student</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-control" 
                placeholder="Search name, enrollment..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ paddingLeft: '2rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Student Allocations Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Student Mentee Allocations ({studentRows.length})
          </h3>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing authorized student records in current scope
          </span>
        </div>

        {studentRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600 }}>No student records found matching current scope/filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department / Program</th>
                  <th>Current Mentor</th>
                  <th>Assigned Date / By</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map(({ student, activeMentor, isAssigned }) => {
                  const dept = db.getDepartmentById(student.departmentId);
                  const prog = db.getProgramById(student.programId);

                  return (
                    <tr key={student.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{student.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Enrollment: <code style={{ fontWeight: 700, color: 'var(--brand-orange)' }}>{student.enrollmentNo}</code>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{prog?.name || 'B.Tech Program'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dept?.name || 'Department'}</div>
                      </td>

                      <td>
                        {isAssigned && activeMentor ? (
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <UserCheck size={16} color="#10B981" /> {activeMentor.mentorName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ID: {activeMentor.mentorEmployeeId} • {activeMentor.mentorEmail || 'email@university.edu'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <AlertCircle size={15} /> Not Assigned
                          </div>
                        )}
                      </td>

                      <td>
                        {isAssigned && activeMentor ? (
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)' }}>
                              {new Date(activeMentor.assignedDate).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              By: {activeMentor.assignedByName} ({activeMentor.assignedByRole})
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      <td>
                        <Badge variant={isAssigned ? 'active' : 'danger'}>
                          {isAssigned ? 'ACTIVE MENTOR' : 'UNASSIGNED'}
                        </Badge>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          {!isAssigned ? (
                            <button className="btn btn-sm btn-primary" onClick={() => handleOpenAssignModal(student, false)}>
                              <Plus size={14} /> Assign Mentor
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-secondary" onClick={() => handleOpenAssignModal(student, true)} title="Change current mentor (Requires Reason)">
                              <RotateCcw size={14} /> Change Mentor
                            </button>
                          )}

                          <button className="btn btn-sm btn-secondary" onClick={() => handleOpenHistory(student)} title="View Assignment History">
                            <History size={14} /> History
                          </button>

                          {isAssigned && activeMentor && (
                            <button className="btn btn-sm btn-danger" onClick={() => setDeletingAssignment(activeMentor)} title="Remove mentor">
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: Single Assign / Change Mentor ───────────────────────────── */}
      {assigningStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                {isChangeMode ? 'Change Student Mentor' : 'Assign Faculty Mentor'}
              </h3>
              <button className="btn-icon" onClick={() => setAssigningStudent(null)}><X size={18} /></button>
            </div>

            {/* If mentor is already assigned, show overwrite protection warning */}
            {isChangeMode && (
              <div style={{
                padding: '0.85rem 1rem', borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#B45309', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
              }}>
                <AlertCircle size={18} />
                <div>
                  <strong>Mentor already assigned.</strong> Reassigning will archive the current mentor into the assignment history.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Student Metadata */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{assigningStudent.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Enrollment: <strong>{assigningStudent.enrollmentNo}</strong> • Department: <strong>{db.getDepartmentById(assigningStudent.departmentId)?.name}</strong>
                </div>
              </div>

              {/* Eligible Faculty Picker */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Select Eligible Faculty Mentor *
                </label>
                <select 
                  className="form-control" 
                  value={selectedFacultyId} 
                  onChange={e => setSelectedFacultyId(e.target.value)} 
                  required
                >
                  <option value="">-- Choose Eligible Faculty --</option>
                  {mentorAssignmentService.getEligibleMentors({ studentId: assigningStudent.id }).map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.employeeId || 'FAC'}) - {fac.designation} [{fac.departmentId}]
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Only active faculty belonging to the student's authorized department/institute are eligible.
                </span>
              </div>

              {/* Effective From Date */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Effective From Date *</label>
                <input type="date" className="form-control" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} required />
              </div>

              {/* Mandatory Reason when changing mentor */}
              {isChangeMode && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Reason for Mentor Change * (Mandatory)
                  </label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="e.g. Student specialization stream change / Faculty sabbatical leave" 
                    value={changeReason} 
                    onChange={e => setChangeReason(e.target.value)} 
                    required 
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningStudent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> {isChangeMode ? 'Confirm Mentor Change' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: View Mentor Assignment History ───────────────────────────── */}
      {historyStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Mentor Assignment History
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {historyStudent.name} ({historyStudent.enrollmentNo})
                </p>
              </div>
              <button className="btn-icon" onClick={() => setHistoryStudent(null)}><X size={18} /></button>
            </div>

            {historyList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <History size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600 }}>No previous mentor reassignments recorded.</p>
                <p style={{ fontSize: '0.8rem' }}>All historical reassignments and change reasons are permanently preserved here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {historyList.map(item => (
                  <div key={item.id} style={{
                    padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-hover)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Badge variant="navy">PREVIOUS: {item.previousMentorName || 'None'}</Badge>
                        <ArrowRight size={14} color="var(--text-muted)" />
                        <Badge variant="active">NEW: {item.newMentorName}</Badge>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--brand-navy)', fontWeight: 600, marginTop: '0.35rem' }}>
                      Reason: <span style={{ fontWeight: 400 }}>{item.changeReason}</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Changed By: <strong>{item.changedByName}</strong> ({item.changedByRole}) • Active Period: {new Date(item.effectiveFrom).toLocaleDateString()} to {new Date(item.effectiveTo).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setHistoryStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Bulk XLSX Assignment ─────────────────────────────────────── */}
      {isBulkModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '1.75rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Bulk Mentor Assignment (.XLSX)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Upload official Excel spreadsheet to batch assign mentors
                </p>
              </div>
              <button className="btn-icon" onClick={() => setIsBulkModalOpen(false)}><X size={18} /></button>
            </div>

            {/* Template Notice */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>Official .XLSX Template</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format: Student Enrollment, Dept Code, Program Code, Semester, Section, Mentor Employee ID</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={handleDownloadTemplate}>
                <Download size={14} /> Download Template
              </button>
            </div>

            {/* Upload File Input */}
            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
              <FileSpreadsheet size={40} style={{ color: 'var(--brand-orange)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
                {bulkFile ? bulkFile.name : 'Select or drop .XLSX file'}
              </div>
              <input type="file" accept=".xlsx" onChange={handleFileChange} style={{ display: 'none' }} id="mentor-xlsx-upload" />
              <label htmlFor="mentor-xlsx-upload" className="btn btn-sm btn-primary" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Browse .XLSX File
              </label>
            </div>

            {/* Validation Preview */}
            {bulkValidationResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Badge variant="navy">Total Rows: {bulkValidationResult.totalRows}</Badge>
                  <Badge variant="active">Valid: {bulkValidationResult.validRows.length}</Badge>
                  <Badge variant={bulkValidationResult.invalidRows.length > 0 ? 'danger' : 'active'}>
                    Invalid: {bulkValidationResult.invalidRows.length}
                  </Badge>
                </div>

                {bulkValidationResult.errorsSummary.length > 0 && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#DC2626', fontSize: '0.8rem', maxHeight: '120px', overflowY: 'auto' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Validation Errors Found:</div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      {bulkValidationResult.errorsSummary.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {bulkValidationResult.validRows.length > 0 && (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <table className="table" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>Enrollment</th>
                          <th>Student Name</th>
                          <th>Mentor Emp ID</th>
                          <th>Mentor Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkValidationResult.validRows.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td><code>{r.studentEnrollmentNo}</code></td>
                            <td>{r.studentName}</td>
                            <td><code>{r.mentorEmployeeId}</code></td>
                            <td>{r.mentorName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCommitBulk} 
                disabled={!bulkValidationResult || bulkValidationResult.validRows.length === 0 || isUploading}
              >
                {isUploading ? 'Applying Updates...' : `Confirm & Commit (${bulkValidationResult?.validRows.length || 0} Records)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAssignment)}
        title="Remove Mentor Assignment"
        message={`Are you sure you want to unassign mentor ${deletingAssignment?.mentorName} from student ${deletingAssignment?.studentName}?`}
        confirmLabel="Remove Mentor"
        onConfirm={handleConfirmRemove}
        onClose={() => setDeletingAssignment(null)}
      />
    </div>
  );
};
