import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import {
  Exam, Program, AcademicYear, Semester, Institute, Department,
  Subject, Student, StudentMarks, StudentResult, ExamTimetable,
  ExamSubjectItem, ExamFeeItem, ExamLateFeeRule, NoteSheet
} from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Plus, Edit2, Trash2, Calendar as CalendarIcon, FileSignature,
  Search, Filter, BookOpen, Users, CheckCircle2, AlertTriangle,
  Award, Clock, Layers, ChevronRight, X, Save, UploadCloud,
  FileCheck, ShieldCheck, Printer, RefreshCw, CheckSquare, Eye,
  IndianRupee, AlertCircle, FileText, ArrowRight, Check, XCircle, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExamsListPage: React.FC = () => {
  const { user, role } = useAuth();

  // Master lists
  const [exams, setExams] = useState<Exam[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [noteSheets, setNoteSheets] = useState<NoteSheet[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Modals & Active State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeWizardTab, setActiveWizardTab] = useState<'BASIC' | 'SUBJECTS' | 'FEES' | 'NOTESHEET'>('BASIC');
  const [selectedExamDetails, setSelectedExamDetails] = useState<Exam | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State for Wizard
  const defaultFormData: Partial<Exam> = {
    examCode: '',
    name: '',
    type: 'Regular',
    session: 'Summer 2026',
    academicYearId: 'ay-2026',
    academicYearCode: '2026-27',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-btech-cse',
    semesterId: 'sem-4',
    semesterNumber: 4,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    formStartDate: new Date().toISOString().split('T')[0],
    formEndDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    lateFeeStartDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    lateFeeEndDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    minAttendanceRequired: 75,
    status: 'DRAFT',
    description: '',
    instructions: 'Candidates must carry valid University Identity Card and official Hall Ticket to the examination hall.',
    notesheetId: '',
    subjects: [],
    fees: [
      { examType: 'Regular', amount: 2500, currency: 'INR', isMandatory: true },
      { examType: 'Backlog', amount: 500, currency: 'INR', isMandatory: false },
      { examType: 'Supplementary', amount: 800, currency: 'INR', isMandatory: false },
    ],
    lateFeeRule: {
      calculationType: 'FIXED',
      amount: 500,
      maximumAmount: 2000,
      gracePeriodDays: 2,
      isActive: true,
    },
  };

  const [formData, setFormData] = useState<Partial<Exam>>(defaultFormData);

  // Broadcast Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeData, setNoticeData] = useState({
    title: '',
    message: '',
    examId: '',
    noticeType: 'IMPORTANT_NOTICE' as any,
    priority: 'HIGH' as any,
    programId: '',
    departmentId: '',
    semesterId: '',
    attachmentName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExams(db.getExams(undefined, user));
    setInstitutes(db.getInstitutes());
    setDepartments(db.getDepartments());
    setPrograms(db.getPrograms());
    setAcademicYears(db.getAcademicYears());
    setSemesters(db.getSemesters());
    setSubjects(db.getSubjects());
    setNoteSheets(db.getNoteSheets(user, 'EXAM'));
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Programs by Department & Institute
  const availablePrograms = useMemo(() => {
    return programs.filter(p => {
      if (formData.departmentId && p.departmentId !== formData.departmentId) return false;
      if (formData.instituteId && p.instituteId !== formData.instituteId) return false;
      return true;
    });
  }, [programs, formData.departmentId, formData.instituteId]);

  // Load eligible subjects when program/semester changes
  const eligibleSubjects = useMemo(() => {
    if (!formData.programId || !formData.semesterId) return [];
    return subjects.filter(
      s => s.programId === formData.programId && s.semesterId === formData.semesterId
    );
  }, [subjects, formData.programId, formData.semesterId]);

  // Update subjects in formData when academic context changes
  const handlePopulateEligibleSubjects = () => {
    const list: ExamSubjectItem[] = eligibleSubjects.map(s => ({
      subjectId: s.id,
      subjectCode: s.code,
      subjectName: s.name,
      examType: formData.type || 'Regular',
      durationMinutes: 180,
      maximumMarks: 100,
      passingMarks: 40,
      internalMarks: 30,
      externalMarks: 70,
      credits: s.credits || 3,
      examMode: 'OFFLINE',
      status: 'ACTIVE',
    }));
    setFormData(prev => ({ ...prev, subjects: list }));
  };

  // Open Create Exam Modal
  const handleOpenCreateModal = (examToEdit?: Exam) => {
    if (examToEdit) {
      setFormData({
        ...examToEdit,
      });
      setIsEditing(true);
    } else {
      const initCode = `EXAM-${new Date().getFullYear()}-CSE-SEM4-REG`;
      const initData: Partial<Exam> = {
        ...defaultFormData,
        examCode: initCode,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        formStartDate: new Date().toISOString().split('T')[0],
        formEndDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      };
      setFormData(initData);
      setIsEditing(false);
    }
    setActiveWizardTab('BASIC');
    setShowCreateModal(true);
  };

  // Save Examination (Draft or Configured)
  const handleSaveExam = (targetStatus: 'DRAFT' | 'FORM_OPEN' = 'DRAFT') => {
    if (!formData.name?.trim()) {
      showToast('error', 'Examination Name is mandatory.');
      return;
    }
    if (!formData.programId) {
      showToast('error', 'Please select an Academic Program.');
      return;
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      showToast('error', 'Exam Start Date cannot be after Exam End Date.');
      return;
    }
    if (formData.formStartDate && formData.formEndDate && new Date(formData.formStartDate) >= new Date(formData.formEndDate)) {
      showToast('error', 'Form Start Date must be strictly before Form End Date.');
      return;
    }

    try {
      const payload: Partial<Exam> = {
        ...formData,
        status: targetStatus,
      };

      if (isEditing && formData.id) {
        db.updateExam(formData.id, payload, user);
        showToast('success', `Examination "${formData.name}" updated successfully.`);
      } else {
        db.createExam(payload, user);
        showToast('success', `Examination "${formData.name}" created successfully with status ${targetStatus}.`);
      }

      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save examination.');
    }
  };

  // Status Action Handlers
  const handlePublishForm = (exam: Exam) => {
    if (!exam.formStartDate || !exam.formEndDate) {
      showToast('error', 'Exam Form Start and End dates must be set before publishing form.');
      return;
    }
    db.publishExamForm(exam.id, user);
    showToast('success', `Exam "${exam.name}" is now PUBLISHED and open for student form submission.`);
    loadData();
  };

  const handleUnpublishExam = (exam: Exam) => {
    db.unpublishExam(exam.id, user);
    showToast('success', `Exam "${exam.name}" has been UNPUBLISHED and reverted to DRAFT.`);
    loadData();
  };

  const handleCloseForm = (exam: Exam) => {
    db.closeExamForm(exam.id, user);
    showToast('success', `Exam form window for "${exam.name}" has been CLOSED.`);
    loadData();
  };

  const handleCancelExam = (exam: Exam) => {
    const reason = window.prompt(`Enter reason for cancelling "${exam.name}":`, 'Cancelled by Controller of Examinations.');
    if (reason !== null) {
      db.cancelExam(exam.id, user, reason);
      showToast('success', `Examination "${exam.name}" has been CANCELLED.`);
      loadData();
    }
  };

  // Filtered examinations list
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      if (filterInstitute !== 'ALL' && e.instituteId !== filterInstitute) return false;
      if (filterDepartment !== 'ALL' && e.departmentId !== filterDepartment) return false;
      if (filterProgram !== 'ALL' && e.programId !== filterProgram) return false;
      if (filterAcademicYear !== 'ALL' && e.academicYearId !== filterAcademicYear) return false;
      if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
      if (filterType !== 'ALL' && e.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesCode = (e.examCode || e.code || '').toLowerCase().includes(q);
        const matchesName = (e.name || '').toLowerCase().includes(q);
        const matchesSession = (e.session || '').toLowerCase().includes(q);
        const matchesType = (e.type || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesSession && !matchesType) return false;
      }
      return true;
    });
  }, [exams, filterInstitute, filterDepartment, filterProgram, filterAcademicYear, filterStatus, filterType, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: notification.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            University Examination Management Core
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Phase 2: Controller of Examinations — Examination Creation, Academic Mapping, Subjects, Fee &amp; Late Fee Rules
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setNoticeData({
                title: '',
                message: '',
                examId: exams[0]?.id || '',
                noticeType: 'IMPORTANT_NOTICE',
                priority: 'HIGH',
                programId: '',
                departmentId: '',
                semesterId: '',
                attachmentName: '',
              });
              setShowNoticeModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <AlertCircle size={18} /> Broadcast Notice
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenCreateModal()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Plus size={18} /> Create Examination
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search exam code, name, session, or type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Exam Types</option>
              <option value="Regular">Regular</option>
              <option value="Backlog">Backlog</option>
              <option value="Supplementary">Supplementary</option>
              <option value="Remedial">Remedial</option>
              <option value="Re-Examination">Re-Examination</option>
              <option value="Improvement">Improvement</option>
              <option value="Special Examination">Special Examination</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="FORM_OPEN">FORM_OPEN</option>
              <option value="FORM_CLOSED">FORM_CLOSED</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RESULT_PROCESSING">RESULT_PROCESSING</option>
              <option value="RESULT_PUBLISHED">RESULT_PUBLISHED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <select className="select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Examinations List Table */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            Configured Examinations ({filteredExams.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Official examination sessions and registration windows configured by the Controller of Examinations
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                <th style={{ width: '45px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Sr</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Exam Code</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Examination Name</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Exam Type</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Session</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Academic Year</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Program</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Semester</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Form Start</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Form End</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Exam Start</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Exam End</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Status</th>
                <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Notesheet</th>
                <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No examinations match the selected criteria. Click "<strong>Create Examination</strong>" to draft a new session.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam, idx) => {
                  const prog = programs.find(p => p.id === exam.programId);
                  const isFormOpen = exam.status === 'FORM_OPEN' || exam.status === 'PUBLISHED' || exam.status === 'OPEN';
                  const isDraft = exam.status === 'DRAFT';
                  const isFormClosed = exam.status === 'FORM_CLOSED' || exam.status === 'CLOSED';
                  const isEven = idx % 2 === 0;

                  return (
                    <tr key={exam.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ textAlign: 'center', padding: '0.5rem', borderRight: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        <strong style={{ color: '#F37023', fontFamily: 'monospace', fontSize: '0.78125rem' }}>
                          {exam.examCode || exam.code}
                        </strong>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        <strong style={{ color: '#0F2C59' }}>{exam.name}</strong>
                        {exam.description && (
                          <div style={{ fontSize: '0.71875rem', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exam.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <Badge variant={exam.type === 'Regular' ? 'navy' : exam.type === 'Backlog' ? 'orange' : 'gold'}>
                          {exam.type}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>
                        {exam.session || 'Summer 2026'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem', color: '#475569' }}>
                        {exam.academicYearCode || '2026-27'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                        {prog?.name || prog?.code || exam.programId}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F2C59' }}>
                        Sem {exam.semesterNumber || 4}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                        {exam.formStartDate || exam.startDate}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                        {exam.formEndDate || exam.formDeadline || exam.endDate}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569' }}>
                        {exam.startDate}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569' }}>
                        {exam.endDate}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <Badge variant={
                          exam.status === 'FORM_OPEN' || exam.status === 'PUBLISHED' || exam.status === 'OPEN' ? 'active' :
                          exam.status === 'DRAFT' ? 'warning' :
                          exam.status === 'FORM_CLOSED' || exam.status === 'CLOSED' ? 'orange' :
                          exam.status === 'SCHEDULED' || exam.status === 'ONGOING' ? 'navy' :
                          exam.status === 'COMPLETED' || exam.status === 'RESULT_PUBLISHED' ? 'active' : 'danger'
                        }>
                          {exam.status === 'PUBLISHED' ? 'OPEN' : exam.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {exam.notesheetNumber || exam.notesheetId ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0F2C59', fontWeight: 700 }}>
                            📄 {exam.notesheetNumber || exam.notesheetId}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="View Exam Details & Sub-Configs"
                            onClick={() => setSelectedExamDetails(exam)}
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={14} />
                          </button>

                          {(isDraft || isFormClosed) && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              title="Publish / Open Exam Form Window"
                              onClick={() => handlePublishForm(exam)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.71875rem', fontWeight: 700, background: '#0F2C59', borderColor: '#0F2C59', color: '#FFF' }}
                            >
                              Publish
                            </button>
                          )}

                          {isFormOpen && (
                            <>
                              <button
                                type="button"
                                className="btn btn-warning btn-sm"
                                title="Close Exam Form Window"
                                onClick={() => handleCloseForm(exam)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.71875rem', fontWeight: 700 }}
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                title="Unpublish Exam (revert to DRAFT)"
                                onClick={() => handleUnpublishExam(exam)}
                                style={{ padding: '0.25rem 0.45rem', fontSize: '0.71875rem' }}
                              >
                                Draft
                              </button>
                            </>
                          )}

                          {(isDraft || isFormClosed) && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              title="Edit Exam Configuration"
                              onClick={() => handleOpenCreateModal(exam)}
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {exam.status !== 'CANCELLED' && exam.status !== 'COMPLETED' && exam.status !== 'RESULT_PUBLISHED' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title="Cancel Examination"
                              onClick={() => handleCancelExam(exam)}
                              style={{ padding: '0.25rem 0.45rem', color: '#DC2626' }}
                            >
                              <XCircle size={14} />
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

      {/* ─── CREATE / EDIT EXAMINATION WIZARD MODAL (OFFICIAL UNIVERSITY ADMINISTRATIVE FORM) ─── */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              padding: 0
            }}
          >
            {/* Modal Header (Official Dark-Navy Header with University Orange Top Accent) */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                background: '#0F2C59',
                color: '#FFFFFF',
                borderTop: '4px solid #F37023',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <ShieldCheck size={24} color="#F37023" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '0.25px' }}>
                    {isEditing ? 'Edit Examination Configuration' : 'Create New Examination Session'}
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78125rem', color: '#94A3B8' }}>
                  Office of the Controller of Examinations • Swarrnim Startup &amp; Innovation University
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                title="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* 4-Step Navigation Bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #CBD5E1',
                background: '#F8FAFC',
                flexShrink: 0,
                overflowX: 'auto'
              }}
            >
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setActiveWizardTab('BASIC')}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: activeWizardTab === 'BASIC' ? '3px solid #F37023' : '3px solid transparent',
                  background: activeWizardTab === 'BASIC' ? '#0F2C59' : '#F8FAFC',
                  color: activeWizardTab === 'BASIC' ? '#FFFFFF' : '#475569',
                  fontWeight: activeWizardTab === 'BASIC' ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: activeWizardTab === 'BASIC' ? '#F37023' : '#E2E8F0',
                    color: activeWizardTab === 'BASIC' ? '#FFFFFF' : '#0F2C59',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  1
                </span>
                Academic Mapping &amp; Dates
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => {
                  if (formData.subjects?.length === 0) handlePopulateEligibleSubjects();
                  setActiveWizardTab('SUBJECTS');
                }}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: activeWizardTab === 'SUBJECTS' ? '3px solid #F37023' : '3px solid transparent',
                  background: activeWizardTab === 'SUBJECTS' ? '#0F2C59' : '#F8FAFC',
                  color: activeWizardTab === 'SUBJECTS' ? '#FFFFFF' : '#475569',
                  fontWeight: activeWizardTab === 'SUBJECTS' ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: activeWizardTab === 'SUBJECTS' ? '#F37023' : (formData.subjects?.length || 0) > 0 ? '#10B981' : '#E2E8F0',
                    color: activeWizardTab === 'SUBJECTS' || (formData.subjects?.length || 0) > 0 ? '#FFFFFF' : '#0F2C59',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {(formData.subjects?.length || 0) > 0 && activeWizardTab !== 'SUBJECTS' ? <Check size={13} /> : '2'}
                </span>
                Subjects ({formData.subjects?.length || 0})
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => setActiveWizardTab('FEES')}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: activeWizardTab === 'FEES' ? '3px solid #F37023' : '3px solid transparent',
                  background: activeWizardTab === 'FEES' ? '#0F2C59' : '#F8FAFC',
                  color: activeWizardTab === 'FEES' ? '#FFFFFF' : '#475569',
                  fontWeight: activeWizardTab === 'FEES' ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: activeWizardTab === 'FEES' ? '#F37023' : '#E2E8F0',
                    color: activeWizardTab === 'FEES' ? '#FFFFFF' : '#0F2C59',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  3
                </span>
                Fees &amp; Late Fee Rules
              </button>

              {/* Step 4 */}
              <button
                type="button"
                onClick={() => setActiveWizardTab('NOTESHEET')}
                style={{
                  flex: 1,
                  minWidth: '210px',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderBottom: activeWizardTab === 'NOTESHEET' ? '3px solid #F37023' : '3px solid transparent',
                  background: activeWizardTab === 'NOTESHEET' ? '#0F2C59' : '#F8FAFC',
                  color: activeWizardTab === 'NOTESHEET' ? '#FFFFFF' : '#475569',
                  fontWeight: activeWizardTab === 'NOTESHEET' ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: activeWizardTab === 'NOTESHEET' ? '#F37023' : '#E2E8F0',
                    color: activeWizardTab === 'NOTESHEET' ? '#FFFFFF' : '#0F2C59',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  4
                </span>
                Notesheet Link &amp; Review
              </button>
            </div>

            {/* Modal Body (Scrollable Administrative Document Form) */}
            <div
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                backgroundColor: '#F8FAFC'
              }}
            >
              {/* ─── TAB 1: ACADEMIC MAPPING & DATES ─── */}
              {activeWizardTab === 'BASIC' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* SECTION 1: Academic Mapping & Examination Details */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#F1F5F9',
                        borderBottom: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Layers size={16} color="#0F2C59" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        1. Academic Mapping &amp; Examination Details
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="grid-2">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Examination Code <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. EXAM-2026-CSE-SEM4-REG"
                            value={formData.examCode || formData.code || ''}
                            onChange={e => setFormData({ ...formData, examCode: e.target.value, code: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Examination Type <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <select
                            className="select"
                            value={formData.type || 'Regular'}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          >
                            <option value="Regular">Regular</option>
                            <option value="Backlog">Backlog</option>
                            <option value="Supplementary">Supplementary</option>
                            <option value="Remedial">Remedial</option>
                            <option value="Re-Examination">Re-Examination</option>
                            <option value="Improvement">Improvement</option>
                            <option value="Special Examination">Special Examination</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Examination Name / Title <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. B.Tech CSE Semester-4 Summer 2026 Regular Examination"
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                        />
                      </div>

                      <div className="grid-3">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Institute
                          </label>
                          <select
                            className="select"
                            value={formData.instituteId || 'inst-1'}
                            onChange={e => setFormData({ ...formData, instituteId: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          >
                            {institutes.map(inst => (
                              <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Department
                          </label>
                          <select
                            className="select"
                            value={formData.departmentId || 'dept-cse'}
                            onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          >
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Program <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <select
                            className="select"
                            value={formData.programId || 'prog-btech-cse'}
                            onChange={e => setFormData({ ...formData, programId: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          >
                            {availablePrograms.map(p => (
                              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid-3">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Academic Year
                          </label>
                          <select
                            className="select"
                            value={formData.academicYearId || 'ay-2026'}
                            onChange={e => {
                              const ay = academicYears.find(a => a.id === e.target.value);
                              setFormData({ ...formData, academicYearId: e.target.value, academicYearCode: ay?.name || '2026-27' });
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          >
                            {academicYears.map(ay => (
                              <option key={ay.id} value={ay.id}>{ay.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Semester
                          </label>
                          <select
                            className="select"
                            value={formData.semesterId || 'sem-4'}
                            onChange={e => {
                              const sem = semesters.find(s => s.id === e.target.value);
                              setFormData({ ...formData, semesterId: e.target.value, semesterNumber: sem?.number || 4 });
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          >
                            {semesters.map(s => (
                              <option key={s.id} value={s.id}>Semester {s.number} ({s.code})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Exam Session
                          </label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. Summer 2026 / Winter 2026"
                            value={formData.session || ''}
                            onChange={e => setFormData({ ...formData, session: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Examination Window & Timeline */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#F1F5F9',
                        borderBottom: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <CalendarIcon size={16} color="#0F2C59" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        2. Examination Window &amp; Timeline
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="grid-4">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Exam Form Start <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.formStartDate || ''}
                            onChange={e => setFormData({ ...formData, formStartDate: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Examination Form End <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.formEndDate || ''}
                            onChange={e => setFormData({ ...formData, formEndDate: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Examination Start <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.startDate || ''}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Examination End <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.endDate || ''}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>
                      </div>

                      <div className="grid-3">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Late Fee Form Start
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.lateFeeStartDate || ''}
                            onChange={e => setFormData({ ...formData, lateFeeStartDate: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Late Fee Final End Deadline
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={formData.lateFeeEndDate || ''}
                            onChange={e => setFormData({ ...formData, lateFeeEndDate: e.target.value, lateFeeDeadline: e.target.value })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Mandatory Attendance Gate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="input"
                            value={formData.minAttendanceRequired ?? 75}
                            onChange={e => setFormData({ ...formData, minAttendanceRequired: Number(e.target.value), minAttendancePercentage: Number(e.target.value) })}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: General Instructions */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#F1F5F9',
                        borderBottom: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FileText size={16} color="#0F2C59" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        3. General Instructions
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Instructions for Student Hall Tickets &amp; Candidate Guidelines
                      </label>
                      <textarea
                        className="input"
                        rows={2}
                        value={formData.instructions || ''}
                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="e.g. Candidates must carry valid University Identity Card and official Hall Ticket to the examination hall."
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: SUBJECTS CONFIGURATION ─── */}
              {activeWizardTab === 'SUBJECTS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#FFFFFF',
                      padding: '1rem 1.25rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2C59', margin: 0 }}>
                        Academic Paper / Subject Configuration
                      </h4>
                      <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: '2px 0 0 0' }}>
                        Loaded from Program academic structure. Configure Max Marks, Passing Marks, Duration &amp; Mode.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handlePopulateEligibleSubjects}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700 }}
                    >
                      <RefreshCw size={14} /> Re-populate from Academic Structure
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                            <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Subject Code &amp; Name</th>
                            <th style={{ width: '85px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Credits</th>
                            <th style={{ width: '95px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Max Marks</th>
                            <th style={{ width: '85px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Passing</th>
                            <th style={{ width: '135px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Internal / External</th>
                            <th style={{ width: '105px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Duration (min)</th>
                            <th style={{ width: '115px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>Mode</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!formData.subjects || formData.subjects.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontStyle: 'italic' }}>
                                No subjects configured yet. Click "<strong>Re-populate from Academic Structure</strong>".
                              </td>
                            </tr>
                          ) : (
                            formData.subjects.map((sub, sIdx) => {
                              const isEven = sIdx % 2 === 0;
                              return (
                                <tr key={sub.subjectId || sIdx} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                  <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                                    <div style={{ fontWeight: 800, color: '#0F2C59' }}>{sub.subjectCode}</div>
                                    <div style={{ color: '#475569', fontSize: '0.75rem' }}>{sub.subjectName}</div>
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                                    <input
                                      type="number"
                                      className="input"
                                      value={sub.credits ?? 3}
                                      onChange={e => {
                                        const next = [...(formData.subjects || [])];
                                        next[sIdx].credits = Number(e.target.value);
                                        setFormData({ ...formData, subjects: next });
                                      }}
                                      style={{ width: '100%', height: '32px', textAlign: 'center', padding: '0.2rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                                    <input
                                      type="number"
                                      className="input"
                                      value={sub.maximumMarks ?? 100}
                                      onChange={e => {
                                        const next = [...(formData.subjects || [])];
                                        next[sIdx].maximumMarks = Number(e.target.value);
                                        setFormData({ ...formData, subjects: next });
                                      }}
                                      style={{ width: '100%', height: '32px', textAlign: 'center', padding: '0.2rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                                    <input
                                      type="number"
                                      className="input"
                                      value={sub.passingMarks ?? 40}
                                      onChange={e => {
                                        const next = [...(formData.subjects || [])];
                                        next[sIdx].passingMarks = Number(e.target.value);
                                        setFormData({ ...formData, subjects: next });
                                      }}
                                      style={{ width: '100%', height: '32px', textAlign: 'center', padding: '0.2rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                      <input
                                        type="number"
                                        className="input"
                                        title="Internal Marks"
                                        value={sub.internalMarks ?? 30}
                                        onChange={e => {
                                          const next = [...(formData.subjects || [])];
                                          next[sIdx].internalMarks = Number(e.target.value);
                                          setFormData({ ...formData, subjects: next });
                                        }}
                                        style={{ width: '48px', height: '32px', textAlign: 'center', padding: '0.2rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                      />
                                      <span style={{ fontWeight: 700, color: '#94A3B8' }}>/</span>
                                      <input
                                        type="number"
                                        className="input"
                                        title="External Marks"
                                        value={sub.externalMarks ?? 70}
                                        onChange={e => {
                                          const next = [...(formData.subjects || [])];
                                          next[sIdx].externalMarks = Number(e.target.value);
                                          setFormData({ ...formData, subjects: next });
                                        }}
                                        style={{ width: '48px', height: '32px', textAlign: 'center', padding: '0.2rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                      />
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                                    <input
                                      type="number"
                                      className="input"
                                      value={sub.durationMinutes ?? 180}
                                      onChange={e => {
                                        const next = [...(formData.subjects || [])];
                                        next[sIdx].durationMinutes = Number(e.target.value);
                                        setFormData({ ...formData, subjects: next });
                                      }}
                                      style={{ width: '100%', height: '32px', textAlign: 'center', padding: '0.2rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.35rem 0.5rem' }}>
                                    <select
                                      className="select"
                                      value={sub.examMode || 'OFFLINE'}
                                      onChange={e => {
                                        const next = [...(formData.subjects || [])];
                                        next[sIdx].examMode = e.target.value as any;
                                        setFormData({ ...formData, subjects: next });
                                      }}
                                      style={{ width: '100%', height: '32px', fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                                    >
                                      <option value="OFFLINE">OFFLINE</option>
                                      <option value="ONLINE">ONLINE</option>
                                      <option value="OTHER">OTHER</option>
                                    </select>
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

              {/* ─── TAB 3: FEES & LATE FEE RULES ─── */}
              {activeWizardTab === 'FEES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Fee Structure Box */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#F1F5F9',
                        borderBottom: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <IndianRupee size={16} color="#0F2C59" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Examination Fee Structure
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                        Set statutory university exam fee amounts per registration type (Regular, Backlog, Supplementary).
                      </p>

                      <div className="grid-3">
                        {(formData.fees || []).map((fee, fIdx) => (
                          <div
                            key={fee.examType || fIdx}
                            style={{
                              padding: '1rem',
                              background: '#F8FAFC',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1'
                            }}
                          >
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#0F2C59', marginBottom: '6px' }}>
                              {fee.examType} Exam Fee (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="input"
                              value={fee.amount}
                              onChange={e => {
                                const next = [...(formData.fees || [])];
                                next[fIdx].amount = Number(e.target.value);
                                setFormData({ ...formData, fees: next, baseFee: next[0]?.amount });
                              }}
                              style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                            />
                            <div style={{ marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78125rem', color: '#475569' }}>
                              <input
                                type="checkbox"
                                checked={fee.isMandatory !== false}
                                onChange={e => {
                                  const next = [...(formData.fees || [])];
                                  next[fIdx].isMandatory = e.target.checked;
                                  setFormData({ ...formData, fees: next });
                                }}
                              />
                              <span>Mandatory Registration Fee</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Late Fee Penalty Rule Box */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #F59E0B',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#FEF3C7',
                        borderBottom: '1px solid #FDE68A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <AlertTriangle size={16} color="#92400E" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#92400E', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Late Exam Form Submission Penalty Rule
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <div className="grid-3">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                            Calculation Type
                          </label>
                          <select
                            className="select"
                            value={formData.lateFeeRule?.calculationType || 'FIXED'}
                            onChange={e => {
                              setFormData({
                                ...formData,
                                lateFeeRule: {
                                  ...(formData.lateFeeRule as any),
                                  calculationType: e.target.value as any,
                                },
                              });
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #FDE68A', background: '#FFFBEB', fontSize: '0.84375rem' }}
                          >
                            <option value="FIXED">Fixed Amount (₹)</option>
                            <option value="PER_DAY">Per Day Rate (₹/day)</option>
                            <option value="PERCENTAGE">Percentage (%)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                            Late Fee Amount (₹ / %)
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            value={formData.lateFeeRule?.amount ?? 500}
                            onChange={e => {
                              setFormData({
                                ...formData,
                                lateFeeRule: {
                                  ...(formData.lateFeeRule as any),
                                  amount: Number(e.target.value),
                                },
                                lateFee: Number(e.target.value),
                              });
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #FDE68A', background: '#FFFBEB', fontSize: '0.84375rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                            Grace Period (Days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            value={formData.lateFeeRule?.gracePeriodDays ?? 2}
                            onChange={e => {
                              setFormData({
                                ...formData,
                                lateFeeRule: {
                                  ...(formData.lateFeeRule as any),
                                  gracePeriodDays: Number(e.target.value),
                                },
                              });
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #FDE68A', background: '#FFFBEB', fontSize: '0.84375rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 4: NOTESHEET LINK & REVIEW ─── */}
              {activeWizardTab === 'NOTESHEET' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Notesheet Link Box */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#F1F5F9',
                        borderBottom: '1px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FileSignature size={16} color="#0F2C59" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Link Phase 1 Examination Proposal Notesheet
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                        Optionally associate this examination session with an official university Notesheet sanction.
                      </p>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Select Approved / Pending Examination Notesheet
                        </label>
                        <select
                          className="select"
                          value={formData.notesheetId || ''}
                          onChange={e => {
                            const ns = noteSheets.find(n => n.id === e.target.value);
                            setFormData({
                              ...formData,
                              notesheetId: e.target.value,
                              notesheetNumber: ns?.noteSheetNumber,
                            });
                          }}
                          style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.84375rem' }}
                        >
                          <option value="">-- No Linked Notesheet --</option>
                          {noteSheets.map(ns => (
                            <option key={ns.id} value={ns.id}>
                              {ns.noteSheetNumber} — {ns.title} ({ns.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Configuration Review Box */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1.5px solid #0F2C59',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#0F2C59',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <CheckSquare size={16} color="#F37023" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Examination Summary &amp; Configuration Review
                      </h4>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <div className="grid-2" style={{ fontSize: '0.8125rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><span style={{ color: '#64748B' }}>Examination Code:</span> <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{formData.examCode || formData.code || 'N/A'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Title / Name:</span> <strong style={{ color: '#0F2C59' }}>{formData.name || 'N/A'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Type:</span> <Badge variant="navy">{formData.type || 'Regular'}</Badge></div>
                          <div><span style={{ color: '#64748B' }}>Session:</span> <strong>{formData.session || 'N/A'}</strong> ({formData.academicYearCode || '2026-27'})</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><span style={{ color: '#64748B' }}>Program:</span> <strong>{availablePrograms.find(p => p.id === formData.programId)?.name || 'B.Tech CSE'}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Form Window:</span> <strong style={{ color: '#047857' }}>{formData.formStartDate}</strong> to <strong style={{ color: '#047857' }}>{formData.formEndDate}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Exam Dates:</span> <strong>{formData.startDate}</strong> to <strong>{formData.endDate}</strong></div>
                          <div><span style={{ color: '#64748B' }}>Configured Subjects:</span> <strong style={{ color: '#F37023' }}>{formData.subjects?.length || 0} Papers</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions (Fixed at Bottom with Clean Hierarchy) */}
            <div
              style={{
                padding: '1rem 1.75rem',
                background: '#F8FAFC',
                borderTop: '1px solid #CBD5E1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <div>
                {activeWizardTab !== 'BASIC' ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (activeWizardTab === 'NOTESHEET') setActiveWizardTab('FEES');
                      else if (activeWizardTab === 'FEES') setActiveWizardTab('SUBJECTS');
                      else if (activeWizardTab === 'SUBJECTS') setActiveWizardTab('BASIC');
                    }}
                    style={{
                      padding: '0.45rem 0.875rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#475569'
                    }}
                  >
                    ← Back
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.45rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#64748B'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSaveExam('DRAFT')}
                  style={{
                    padding: '0.45rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    background: '#FFFFFF',
                    border: '1px solid #0F2C59',
                    color: '#0F2C59'
                  }}
                >
                  Save as Draft
                </button>

                {activeWizardTab !== 'NOTESHEET' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (activeWizardTab === 'BASIC') {
                        if (formData.subjects?.length === 0) handlePopulateEligibleSubjects();
                        setActiveWizardTab('SUBJECTS');
                      } else if (activeWizardTab === 'SUBJECTS') {
                        setActiveWizardTab('FEES');
                      } else if (activeWizardTab === 'FEES') {
                        setActiveWizardTab('NOTESHEET');
                      }
                    }}
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      background: '#0F2C59',
                      borderColor: '#0F2C59',
                      color: '#FFFFFF'
                    }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveExam('FORM_OPEN')}
                    style={{
                      padding: '0.45rem 1.125rem',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      background: '#F37023',
                      borderColor: '#F37023',
                      color: '#FFFFFF'
                    }}
                  >
                    Save &amp; Publish Form Window
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EXAM DETAILS INSPECTOR MODAL ─── */}
      {selectedExamDetails && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Inspector Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>Examination Details</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  {selectedExamDetails.name}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedExamDetails(null)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            {/* Inspector Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
              
              {/* Top Meta Bar */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge variant={selectedExamDetails.type === 'Regular' ? 'navy' : 'orange'}>
                  {selectedExamDetails.type}
                </Badge>
                <Badge variant={
                  selectedExamDetails.status === 'FORM_OPEN' ? 'active' :
                  selectedExamDetails.status === 'DRAFT' ? 'warning' :
                  selectedExamDetails.status === 'FORM_CLOSED' ? 'orange' : 'navy'
                }>
                  {selectedExamDetails.status}
                </Badge>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  {selectedExamDetails.examCode || selectedExamDetails.code}
                </span>
                {selectedExamDetails.notesheetNumber && (
                  <Badge variant="gold">
                    📄 Notesheet: {selectedExamDetails.notesheetNumber}
                  </Badge>
                )}
              </div>

              {/* Academic Hierarchy */}
              <div className="grid-2 card" style={{ padding: '1rem', background: '#F8FAFC' }}>
                <div>
                  <div><strong>Program:</strong> {programs.find(p => p.id === selectedExamDetails.programId)?.name || selectedExamDetails.programId}</div>
                  <div><strong>Session:</strong> {selectedExamDetails.session} ({selectedExamDetails.academicYearCode})</div>
                  <div><strong>Semester:</strong> Semester {selectedExamDetails.semesterNumber || 4}</div>
                </div>
                <div>
                  <div><strong>Form Window:</strong> {selectedExamDetails.formStartDate} to {selectedExamDetails.formEndDate}</div>
                  <div><strong>Exam Window:</strong> {selectedExamDetails.startDate} to {selectedExamDetails.endDate}</div>
                  <div><strong>Created By:</strong> {selectedExamDetails.createdBy || 'Exam Controller'}</div>
                </div>
              </div>

              {/* Configured Subjects Table */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Configured Subjects &amp; Paper Marks Scheme ({selectedExamDetails.subjects?.length || 0})
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-hover)' }}>
                        <th>Subject</th>
                        <th>Credits</th>
                        <th>Max</th>
                        <th>Pass</th>
                        <th>Internal</th>
                        <th>External</th>
                        <th>Duration</th>
                        <th>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedExamDetails.subjects || selectedExamDetails.subjects.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                            No detailed subject breakdown attached.
                          </td>
                        </tr>
                      ) : (
                        selectedExamDetails.subjects.map(s => (
                          <tr key={s.subjectId}>
                            <td><strong>{s.subjectCode}</strong> - {s.subjectName}</td>
                            <td>{s.credits}</td>
                            <td>{s.maximumMarks}</td>
                            <td>{s.passingMarks}</td>
                            <td>{s.internalMarks}</td>
                            <td>{s.externalMarks}</td>
                            <td>{s.durationMinutes} min</td>
                            <td><Badge variant="navy">{s.examMode}</Badge></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Configured Fees & Late Fee Rules */}
              <div className="grid-2">
                <div className="card" style={{ padding: '1rem', background: '#F8FAFC' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 0.5rem 0' }}>
                    Exam Fee Schedule
                  </h4>
                  {(selectedExamDetails.fees || []).map(f => (
                    <div key={f.examType} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                      <span>{f.examType} Fee:</span>
                      <strong>₹{f.amount.toLocaleString('en-IN')}</strong>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: '1rem', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400E', margin: '0 0 0.5rem 0' }}>
                    Late Fee Calculation Rule
                  </h4>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div><strong>Type:</strong> {selectedExamDetails.lateFeeRule?.calculationType || 'FIXED'}</div>
                    <div><strong>Amount:</strong> ₹{selectedExamDetails.lateFeeRule?.amount ?? selectedExamDetails.lateFee}</div>
                    <div><strong>Grace Period:</strong> {selectedExamDetails.lateFeeRule?.gracePeriodDays ?? 2} Days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspector Footer */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedExamDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BROADCAST EXAM NOTICE MODAL ─── */}
      {showNoticeModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={22} color="var(--brand-orange)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Broadcast Official Examination Notice
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNoticeModal(false)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <label className="label" style={{ fontWeight: 700 }}>Associated Examination (Optional)</label>
                <select
                  className="select"
                  value={noticeData.examId}
                  onChange={e => {
                    const ex = exams.find(x => x.id === e.target.value);
                    setNoticeData({
                      ...noticeData,
                      examId: e.target.value,
                      programId: ex?.programId || noticeData.programId,
                      departmentId: ex?.departmentId || noticeData.departmentId,
                      semesterId: ex?.semesterId || noticeData.semesterId
                    });
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">-- General University Examination Broadcast --</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name} ({ex.session})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" style={{ fontWeight: 700 }}>Notice Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Mandatory Guidelines for Summer 2026 Examination Hall Conduct"
                  value={noticeData.title}
                  onChange={e => setNoticeData({ ...noticeData, title: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label" style={{ fontWeight: 700 }}>Notice Category</label>
                  <select
                    className="select"
                    value={noticeData.noticeType}
                    onChange={e => setNoticeData({ ...noticeData, noticeType: e.target.value as any })}
                  >
                    <option value="IMPORTANT_NOTICE">IMPORTANT_NOTICE</option>
                    <option value="EXAM_FORM">EXAM_FORM</option>
                    <option value="EXAM_DEADLINE">EXAM_DEADLINE</option>
                    <option value="EXAM_SCHEDULE">EXAM_SCHEDULE</option>
                    <option value="EXAM_CENTRE">EXAM_CENTRE</option>
                    <option value="HALL_TICKET">HALL_TICKET</option>
                    <option value="RESULT">RESULT</option>
                    <option value="REASSESSMENT">REASSESSMENT</option>
                  </select>
                </div>

                <div>
                  <label className="label" style={{ fontWeight: 700 }}>Priority Level</label>
                  <select
                    className="select"
                    value={noticeData.priority}
                    onChange={e => setNoticeData({ ...noticeData, priority: e.target.value as any })}
                  >
                    <option value="HIGH">HIGH (Urgent Alert)</option>
                    <option value="URGENT">URGENT (Top Banner)</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label" style={{ fontWeight: 700 }}>Notice Content / Message *</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Type the detailed circular, instructions, or deadline warning for eligible students..."
                  value={noticeData.message}
                  onChange={e => setNoticeData({ ...noticeData, message: e.target.value })}
                />
              </div>

              <div>
                <label className="label" style={{ fontWeight: 700 }}>Attachment File Name (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Exam_Ordinance_Summer_2026.pdf"
                  value={noticeData.attachmentName}
                  onChange={e => setNoticeData({ ...noticeData, attachmentName: e.target.value })}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNoticeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!noticeData.title.trim() || !noticeData.message.trim()) {
                    showToast('error', 'Notice Title and Message are required.');
                    return;
                  }
                  try {
                    db.createManualExamNotice({
                      title: noticeData.title.trim(),
                      message: noticeData.message.trim(),
                      examId: noticeData.examId || undefined,
                      noticeType: noticeData.noticeType,
                      priority: noticeData.priority,
                      programId: noticeData.programId || undefined,
                      departmentId: noticeData.departmentId || undefined,
                      semesterId: noticeData.semesterId || undefined,
                      attachmentName: noticeData.attachmentName.trim() || undefined,
                    }, user);
                    showToast('success', `Examination notice "${noticeData.title}" broadcasted successfully.`);
                    setShowNoticeModal(false);
                  } catch (err: any) {
                    showToast('error', err.message || 'Failed to broadcast notice.');
                  }
                }}
                style={{ fontWeight: 800 }}
              >
                <Send size={15} /> Dispatch Broadcast Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
