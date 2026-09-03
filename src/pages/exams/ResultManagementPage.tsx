import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Exam, Student, StudentMarks, StudentResult, ResultRevisionHistory } from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  Download,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit3,
  ShieldAlert,
  FileCheck,
  Printer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  QrCode,
  Lock,
  Layers,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoSvg from '../../assets/swarrnim-logo.svg';

export const ResultManagementPage: React.FC = () => {
  const { user, role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<StudentMarks[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Active Actions
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishBreakdown, setPublishBreakdown] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isWithholdModalOpen, setIsWithholdModalOpen] = useState(false);
  const [targetWithholdResult, setTargetWithholdResult] = useState<StudentResult | null>(null);
  const [withheldCategory, setWithheldCategory] = useState('Fee Dues');
  const [withheldReason, setWithheldReason] = useState('');

  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [targetReviseResult, setTargetReviseResult] = useState<StudentResult | null>(null);
  const [revisedMarks, setRevisedMarks] = useState<number>(0);
  const [revisionReason, setRevisionReason] = useState('');

  const [isMarksheetModalOpen, setIsMarksheetModalOpen] = useState(false);
  const [selectedMarksheetResult, setSelectedMarksheetResult] = useState<StudentResult | null>(null);

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = db.getExams();
    const allResults = db.getStudentResults();
    const allStudents = db.getStudents();
    const allMarks = db.getStudentMarks();

    setStudents(allStudents);
    setMarks(allMarks);

    if (role === 'STUDENT') {
      const student = allStudents.find(s => s.id === user?.id || s.email === user?.email);
      if (student) {
        const publishedExams = allExams.filter(e => e.status === 'RESULTS_PUBLISHED');
        setExams(publishedExams);
        setResults(allResults.filter(r => r.studentId === student.id && r.isPublished));
        if (publishedExams.length > 0) setSelectedExamId(publishedExams[0].id);
      }
    } else if (role === 'HOD') {
      const deptId = (user as any)?.departmentId || (user as any)?.department || 'dept-cse';
      setExams(allExams);
      setResults(allResults.filter(r => (r.departmentId === deptId || !r.departmentId) && r.isPublished));
      if (allExams.length > 0) setSelectedExamId(allExams[0].id);
    } else {
      setExams(allExams);
      setResults(allResults);
      if (allExams.length > 0) setSelectedExamId(allExams[0].id);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  const currentExam = exams.find(e => e.id === selectedExamId);

  // Executive KPI summary calculations
  const totalExams = exams.length;
  const publishedExamsCount = exams.filter(e => e.status === 'RESULTS_PUBLISHED').length;
  const resultsPending = exams.filter(e => e.status !== 'RESULTS_PUBLISHED').length;
  const marksPending = marks.filter(m => m.evaluationStatus === 'DRAFT' || m.evaluationStatus === 'RETURNED').length;
  const marksUnderVerification = marks.filter(m => m.evaluationStatus === 'SUBMITTED').length;
  const marksVerified = marks.filter(m => m.evaluationStatus === 'VERIFIED').length;
  const totalPublishedResults = results.filter(r => r.isPublished).length;
  const totalWithheldResults = results.filter(r => r.status === 'WITHHELD').length;
  const totalRevisions = results.reduce((acc, r) => acc + (r.revisions?.length || 0), 0);

  // Filtered Results List
  const filteredResults = results.filter(r => {
    if (selectedExamId && selectedExamId !== 'ALL' && r.examId !== selectedExamId) return false;
    if (selectedAcademicYear !== 'ALL' && r.academicYearCode !== selectedAcademicYear) return false;
    if (selectedDepartmentId !== 'ALL' && r.departmentId !== selectedDepartmentId) return false;
    if (selectedProgramId !== 'ALL' && r.programId !== selectedProgramId) return false;
    if (selectedSemester !== 'ALL' && r.semesterNumber?.toString() !== selectedSemester) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchEnrollment = r.enrollmentNo.toLowerCase().includes(q);
      const matchMarksheet = r.marksheetNo?.toLowerCase().includes(q);
      if (!matchName && !matchEnrollment && !matchMarksheet) return false;
    }

    return true;
  });

  // 1. Process Results Action
  const handleProcessResults = () => {
    if (!selectedExamId || selectedExamId === 'ALL') {
      alert('Please select a specific exam to process.');
      return;
    }
    try {
      const res = db.processStudentResults(selectedExamId, user);
      loadData();
      showToast(`Successfully processed result calculations for ${res.count} students.`);
    } catch (err: any) {
      alert(err.message || 'Error processing results.');
    }
  };

  // 2. Open Publish Modal with Confirmation Breakdown
  const handleOpenPublishModal = () => {
    if (!selectedExamId || selectedExamId === 'ALL') {
      alert('Please select an exam to publish.');
      return;
    }
    const examResults = results.filter(r => r.examId === selectedExamId);
    if (examResults.length === 0) {
      alert('No processed results found for this exam. Please click "Process Results" first.');
      return;
    }

    const breakdown = {
      total: examResults.length,
      passed: examResults.filter(r => r.status === 'PASS').length,
      failed: examResults.filter(r => r.status === 'FAIL').length,
      atkt: examResults.filter(r => r.status === 'ATKT').length,
      withheld: examResults.filter(r => r.status === 'WITHHELD').length,
    };
    setPublishBreakdown(breakdown);
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = () => {
    if (!selectedExamId) return;
    setIsPublishing(true);
    try {
      const res = db.publishStudentResults(selectedExamId, user);
      setIsPublishing(false);
      setIsPublishModalOpen(false);
      loadData();
      showToast(`Results published successfully for ${res.publishedCount} students with unique Marksheet numbers & QR codes.`);
    } catch (err: any) {
      setIsPublishing(false);
      alert(err.message || 'Error publishing results.');
    }
  };

  // 3. Withhold Result Handler
  const handleOpenWithholdModal = (result: StudentResult) => {
    setTargetWithholdResult(result);
    setWithheldCategory(result.withheldCategory || 'Fee Dues');
    setWithheldReason(result.withheldReason || '');
    setIsWithholdModalOpen(true);
  };

  const handleConfirmWithhold = () => {
    if (!targetWithholdResult) return;
    if (!withheldReason.trim()) {
      alert('Withheld reason is mandatory.');
      return;
    }
    try {
      db.withholdStudentResult(targetWithholdResult.studentId, targetWithholdResult.examId, withheldCategory, withheldReason, user);
      setIsWithholdModalOpen(false);
      loadData();
      showToast(`Result status for ${targetWithholdResult.studentName} updated to WITHHELD.`);
    } catch (err: any) {
      alert(err.message || 'Failed to withhold result.');
    }
  };

  // 4. Revise Result Handler
  const handleOpenReviseModal = (result: StudentResult) => {
    setTargetReviseResult(result);
    setRevisedMarks(result.totalMarksObtained);
    setRevisionReason('');
    setIsReviseModalOpen(true);
  };

  const handleConfirmRevise = () => {
    if (!targetReviseResult) return;
    if (!revisionReason.trim()) {
      alert('Revision reason is mandatory.');
      return;
    }
    try {
      db.reviseStudentResult(targetReviseResult.id, undefined, revisedMarks, revisionReason, user);
      setIsReviseModalOpen(false);
      loadData();
      showToast(`Result revised successfully for ${targetReviseResult.studentName}. Audit log recorded.`);
    } catch (err: any) {
      alert(err.message || 'Failed to revise result.');
    }
  };

  // 5. Open Marksheet Modal
  const handleOpenMarksheet = (result: StudentResult) => {
    setSelectedMarksheetResult(result);
    setIsMarksheetModalOpen(true);
  };

  const isControllerOrAdmin = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(role || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Result Management, Marks Verification &amp; Publishing
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {role === 'STUDENT'
              ? 'View official published results, SGPA, CGPA, and Statement of Marks'
              : role === 'HOD'
              ? 'Departmental result analysis, pass/fail performance scorecard, and exports'
              : 'Exam Controller result processing pipeline, grade calculation, verification, withhold & publication'}
          </p>
        </div>

        {actionSuccessMessage && (
          <div style={{ padding: '0.625rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} color="#10B981" /> {actionSuccessMessage}
          </div>
        )}
      </div>

      {/* ── 1. Executive Summary KPI Cards (Controller/Admin/HOD View) ── */}
      {isControllerOrAdmin && (
        <div className="grid-4" style={{ gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-navy)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL EXAMS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '0.25rem' }}>
              {totalExams}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {publishedExamsCount} Published • {resultsPending} Pending
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-orange)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MARKS EVALUATION QUEUE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '0.25rem' }}>
              {marksUnderVerification}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Under Verification • {marksPending} Drafts Pending
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PUBLISHED RESULTS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '0.25rem' }}>
              {totalPublishedResults}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Mark sheets Issued with Verification QR
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>WITHHELD &amp; REVISIONS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B5CF6', marginTop: '0.25rem' }}>
              {totalWithheldResults} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {totalRevisions} Revs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Audit Log Tracked
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Filter & Action Control Bar ── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>EXAM SESSION</label>
              <select
                className="form-select"
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
              >
                <option value="ALL">All Examination Sessions</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>RESULT STATUS</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PASS">PASS</option>
                <option value="ATKT">ATKT / Backlog</option>
                <option value="FAIL">FAIL</option>
                <option value="WITHHELD">WITHHELD</option>
                <option value="REVISED">REVISED</option>
              </select>
            </div>

            <div style={{ flex: '1 1 140px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>ACADEMIC YEAR</label>
              <select
                className="form-select"
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
              >
                <option value="ALL">All Years</option>
                <option value="2026-27">2026-27</option>
                <option value="2025-26">2025-26</option>
              </select>
            </div>

            <div style={{ flex: '2 1 250px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>SEARCH SCHOLAR</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by student name, enrollment no, or marksheet no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* Workflow Action Buttons (Controller Only) */}
          {isControllerOrAdmin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <Layers size={16} color="var(--brand-orange)" />
                <strong>Workflow Stage:</strong> {currentExam?.status || 'Active Examination'}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  onClick={handleProcessResults}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RefreshCw size={15} /> Process / Recalculate Results
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleOpenPublishModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <UploadCloud size={15} /> Publish Results &amp; Issue Marksheets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Results Queue Table ── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Candidate Result Roster ({filteredResults.length})
            </h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Official tabulated grades, SGPA/CGPA calculations, and verification tokens
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table style={{ width: 'auto', borderCollapse: 'collapse', border: '1px solid #CBD5E1', fontSize: '0.84375rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Marksheet No</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Enrollment No</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Student Name</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Total Marks</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>%</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>SGPA</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>CGPA</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Published</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#64748B', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                    <AlertTriangle size={32} color="var(--brand-orange, #F26B21)" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
                    <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.9375rem' }}>No examination result records match the current filters.</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: '#64748B' }}>Select an exam event and click "Process / Recalculate Results" to calculate student grades.</div>
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={res.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy, #0F2C59)', fontSize: '0.84375rem' }}>
                          {res.marksheetNo || <span style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 500 }}>Pending Publication</span>}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 700, color: '#0F2C59', whiteSpace: 'nowrap' }}>
                        {res.enrollmentNo}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#0F2C59', fontSize: '0.84375rem' }}>{res.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px' }}>{res.programName || 'B.Tech Engineering'}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: '#0F2C59' }}>{res.totalMarksObtained}</strong> <span style={{ fontSize: '0.75rem', color: '#64748B' }}>/ {res.totalMaxMarks}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                        {res.percentage ? `${res.percentage}%` : '-'}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 800, color: 'var(--brand-orange, #F26B21)', whiteSpace: 'nowrap' }}>
                        {res.sgpa}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 800, color: '#0F2C59', whiteSpace: 'nowrap' }}>
                        {res.cgpa}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {res.status === 'PASS' && <Badge variant="active">PASS</Badge>}
                        {res.status === 'ATKT' && <Badge variant="warning">ATKT ({res.backlogsCount || 1})</Badge>}
                        {res.status === 'FAIL' && <Badge variant="inactive">FAIL</Badge>}
                        {res.status === 'WITHHELD' && <Badge variant="navy">WITHHELD</Badge>}
                        {res.status === 'REVISED' && <Badge variant="active">REVISED</Badge>}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {res.isPublished ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                            <CheckCircle2 size={13} /> {res.publishedDate || 'Published'}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>Draft / Internal</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Statement of Marks */}
                          <button
                            className="btn btn-outline btn-sm"
                            title="View Official Statement of Marks"
                            onClick={() => handleOpenMarksheet(res)}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* Controller Actions */}
                          {isControllerOrAdmin && (
                            <>
                              <button
                                className="btn btn-outline btn-sm"
                                title="Withhold Result (Fees/Attendance/Malpractice)"
                                onClick={() => handleOpenWithholdModal(res)}
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <ShieldAlert size={13} color="#8B5CF6" /> Withhold
                              </button>

                              <button
                                className="btn btn-outline btn-sm"
                                title="Revise Published Result with Mandatory Audit Reason"
                                onClick={() => handleOpenReviseModal(res)}
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Edit3 size={13} color="var(--brand-orange, #F26B21)" /> Revise
                              </button>
                            </>
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

      {/* ── MODAL 1: PUBLISH RESULTS CONFIRMATION BREAKDOWN ── */}
      {isPublishModalOpen && publishBreakdown && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: '50%', color: '#D97706' }}>
                <UploadCloud size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Publish Examination Results
                </h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {currentExam?.name}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Publishing will make results immediately visible on the Student and HOD portals, generate non-editable Marksheet numbers (<code style={{ color: 'var(--brand-navy)' }}>MS-YYYY-XXXXXX</code>), and activate public QR authenticity verification.
            </p>

            <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
                RESULT BREAKDOWN SUMMARY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>Total Candidates: <strong>{publishBreakdown.total}</strong></div>
                <div style={{ color: '#10B981' }}>Passed: <strong>{publishBreakdown.passed}</strong></div>
                <div style={{ color: '#F59E0B' }}>ATKT / Backlogs: <strong>{publishBreakdown.atkt}</strong></div>
                <div style={{ color: '#EF4444' }}>Failed: <strong>{publishBreakdown.failed}</strong></div>
                <div style={{ color: '#8B5CF6' }}>Withheld: <strong>{publishBreakdown.withheld}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setIsPublishModalOpen(false)} disabled={isPublishing}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmPublish} disabled={isPublishing}>
                {isPublishing ? 'Publishing...' : 'Confirm & Publish Results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: WITHHOLD RESULT ── */}
      {isWithholdModalOpen && targetWithholdResult && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Withhold Student Result
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Candidate: <strong>{targetWithholdResult.studentName}</strong> ({targetWithholdResult.enrollmentNo})
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Withheld Category *</label>
              <select className="form-select" value={withheldCategory} onChange={e => setWithheldCategory(e.target.value)}>
                <option value="Fee Dues">Fee Dues / Financial Clearance Pending</option>
                <option value="Attendance Shortage">Attendance Shortage (&lt; 75%)</option>
                <option value="Malpractice Investigation">Unfair Means / Malpractice Committee Review</option>
                <option value="Document Pending">Eligibility / Identity Documents Pending</option>
                <option value="Administrative Hold">Administrative Hold</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Confidential Internal Reason *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Enter detailed reason for withholding result (audited internally, not displayed to student)..."
                value={withheldReason}
                onChange={e => setWithheldReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setIsWithholdModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmWithhold} style={{ backgroundColor: '#8B5CF6' }}>
                Withhold Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: REVISE RESULT ── */}
      {isReviseModalOpen && targetReviseResult && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Revise Published Examination Result
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Candidate: <strong>{targetReviseResult.studentName}</strong> ({targetReviseResult.enrollmentNo})
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Previous Marks</label>
                <input type="text" className="form-control" disabled value={targetReviseResult.totalMarksObtained} />
              </div>
              <div className="form-group">
                <label className="form-label">New Total Marks *</label>
                <input
                  type="number"
                  className="form-control"
                  value={revisedMarks}
                  onChange={e => setRevisedMarks(parseFloat(e.target.value) || 0)}
                  max={targetReviseResult.totalMaxMarks}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mandatory Revision Justification *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="State the regulatory/revaluation justification for modifying published grades..."
                value={revisionReason}
                onChange={e => setRevisionReason(e.target.value)}
              />
            </div>

            {/* Revision History List */}
            {targetReviseResult.revisions && targetReviseResult.revisions.length > 0 && (
              <div style={{ marginBottom: '1.5rem', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Previous Revisions:</div>
                {targetReviseResult.revisions.map((rev, idx) => (
                  <div key={idx} style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    • {rev.previousMarks} &rarr; {rev.newMarks} ({rev.reason}) by {rev.changedBy} at {rev.changedAt.split('T')[0]}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setIsReviseModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmRevise}>
                Save Revision &amp; Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: STATEMENT OF MARKSHEET PREVIEW & PRINT ── */}
      {isMarksheetModalOpen && selectedMarksheetResult && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '820px', width: '100%', padding: '2.5rem', borderRadius: '12px', borderTop: '8px solid var(--brand-navy)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--brand-orange)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={logoSvg} alt="University Logo" style={{ height: '56px', objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0 }}>
                    SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Established under Gujarat Private Universities Act • Gandhinagar, Gujarat
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge variant="navy">STATEMENT OF MARKS</Badge>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Marksheet No: <strong style={{ color: 'var(--brand-navy)' }}>{selectedMarksheetResult.marksheetNo || 'MS-2026-PREVIEW'}</strong>
                </div>
              </div>
            </div>

            {/* Student Info Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Student Name:</span> <strong>{selectedMarksheetResult.studentName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Enrollment No:</span> <strong style={{ color: 'var(--brand-navy)' }}>{selectedMarksheetResult.enrollmentNo}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Program:</span> <strong>{selectedMarksheetResult.programName || 'B.Tech Computer Engineering'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Semester / Year:</span> <strong>Semester {selectedMarksheetResult.semesterNumber || 4} ({selectedMarksheetResult.academicYearCode || '2026-27'})</strong>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
              <table className="table">
                <thead>
                  <tr style={{ backgroundColor: 'var(--brand-navy)', color: '#FFFFFF' }}>
                    <th style={{ color: '#FFFFFF' }}>Subject Code</th>
                    <th style={{ color: '#FFFFFF' }}>Subject Title</th>
                    <th style={{ color: '#FFFFFF' }}>Credits</th>
                    <th style={{ color: '#FFFFFF' }}>Internal (30)</th>
                    <th style={{ color: '#FFFFFF' }}>External (70)</th>
                    <th style={{ color: '#FFFFFF' }}>Total (100)</th>
                    <th style={{ color: '#FFFFFF' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.filter(m => (m.examId === selectedMarksheetResult.examId || !m.examId) && m.studentId === selectedMarksheetResult.studentId).length === 0 ? (
                    <tr>
                      <td>CS401</td>
                      <td>Advanced Database Management Systems</td>
                      <td>4</td>
                      <td>26</td>
                      <td>58</td>
                      <td><strong>84</strong></td>
                      <td><Badge variant="active">A+</Badge></td>
                    </tr>
                  ) : (
                    marks
                      .filter(m => (m.examId === selectedMarksheetResult.examId || !m.examId) && m.studentId === selectedMarksheetResult.studentId)
                      .map((m, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{m.subjectCode || 'CS40' + (idx + 1)}</td>
                          <td>{m.subjectName || 'Engineering Subject ' + (idx + 1)}</td>
                          <td>4</td>
                          <td>{m.internalMarks}</td>
                          <td>{m.externalMarks}</td>
                          <td><strong>{m.totalMarks}</strong></td>
                          <td><Badge variant={m.isPass ? 'active' : 'inactive'}>{m.grade}</Badge></td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Performance Summary Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL MARKS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  {selectedMarksheetResult.totalMarksObtained} / {selectedMarksheetResult.totalMaxMarks}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SEMESTER SGPA</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-orange)' }}>
                  {selectedMarksheetResult.sgpa}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUMULATIVE CGPA</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                  {selectedMarksheetResult.cgpa}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FINAL RESULT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: selectedMarksheetResult.status === 'PASS' ? '#10B981' : '#EF4444' }}>
                  {selectedMarksheetResult.status}
                </div>
              </div>
            </div>

            {/* QR Verification Seal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ border: '2px solid #E5E7EB', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <QrCode size={48} color="var(--brand-navy)" />
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.2rem' }}>AUTHENTIC QR</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    Verification Code: {selectedMarksheetResult.verificationCode || 'VREF-RES-2026-000001'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    Scan QR code or verify online at /public/result/verify
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Controller of Examinations
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Swarrnim Startup &amp; Innovation University
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setIsMarksheetModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Statement of Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
