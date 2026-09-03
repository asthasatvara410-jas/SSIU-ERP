import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Exam, Subject, Student, StudentMarks } from '../../types';
import { Badge } from '../../components/common/Badge';
import { FileText, Save, Check, Lock, Send, RotateCcw, CheckCircle, AlertCircle, ShieldAlert, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MarksManagementPage: React.FC = () => {
  const { user, role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<StudentMarks[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Local state for editing marks per student
  const [editMarks, setEditMarks] = useState<Record<string, { internal: string; external: string; practical: string; isAbsent: boolean; isMalpractice: boolean }>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Return marks modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = db.getExams();
    setExams(allExams);
    setSubjects(db.getSubjects());
    setMarks(db.getStudentMarks());
    if (allExams.length > 0 && !selectedExamId) setSelectedExamId(allExams[0].id);
  };

  const currentExam = exams.find(e => e.id === selectedExamId);

  // Subject filtering based on exam and user role
  let examSubjects = subjects.filter(s => s.semesterId === currentExam?.semesterId && s.programId === currentExam?.programId);
  if (role === 'FACULTY' && user?.id) {
    const facultyObj = db.getFaculty().find(f => f.email === user.email || f.id === user.id);
    if (facultyObj) {
      examSubjects = examSubjects.filter(s => (facultyObj.subjectIds || []).includes(s.id) || s.departmentId === facultyObj.departmentId);
    }
  }

  useEffect(() => {
    if (selectedExamId && selectedSubjectId) {
      const exam = exams.find(e => e.id === selectedExamId);
      if (exam) {
        const enrolledStudents = db.getStudents().filter(s => s.programId === exam.programId && s.semesterId === exam.semesterId);
        setStudents(enrolledStudents);

        const localMarks: Record<string, { internal: string; external: string; practical: string; isAbsent: boolean; isMalpractice: boolean }> = {};
        const subjectMarks = db.getStudentMarks().filter(m => m.examId === selectedExamId && m.subjectId === selectedSubjectId);

        enrolledStudents.forEach(st => {
          const m = subjectMarks.find(x => x.studentId === st.id);
          localMarks[st.id] = {
            internal: m ? m.internalMarks.toString() : '',
            external: m ? m.externalMarks.toString() : '',
            practical: m?.practicalMarks ? m.practicalMarks.toString() : '0',
            isAbsent: !!m?.isAbsent,
            isMalpractice: !!m?.isMalpractice,
          };
        });
        setEditMarks(localMarks);
      }
    } else {
      setStudents([]);
    }
  }, [selectedExamId, selectedSubjectId, exams, marks]);

  const handleMarksChange = (studentId: string, field: 'internal' | 'external' | 'practical', value: string) => {
    setEditMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleToggleFlag = (studentId: string, flag: 'isAbsent' | 'isMalpractice') => {
    setEditMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [flag]: !prev[studentId]?.[flag],
      },
    }));
  };

  // Check current evaluation status for selected subject marks
  const currentSubjectMarks = marks.filter(m => m.examId === selectedExamId && m.subjectId === selectedSubjectId);
  const evaluationStatus = currentSubjectMarks[0]?.evaluationStatus || 'DRAFT';
  const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(role || '');
  const isLockedForFaculty = (evaluationStatus === 'SUBMITTED' || evaluationStatus === 'VERIFIED') && !isController;

  const handleSaveDraftMarks = () => {
    setErrorMessage('');
    const maxInt = 30;
    const maxExt = 70;

    try {
      students.forEach(st => {
        const studentEntry = editMarks[st.id];
        const internalVal = parseFloat(studentEntry?.internal) || 0;
        const externalVal = parseFloat(studentEntry?.external) || 0;
        const practicalVal = parseFloat(studentEntry?.practical) || 0;

        if (internalVal < 0 || externalVal < 0 || practicalVal < 0) {
          throw new Error(`Marks cannot be negative for student ${st.name}.`);
        }
        if (internalVal > maxInt) {
          throw new Error(`Internal marks for ${st.name} cannot exceed 30.`);
        }
        if (externalVal > maxExt) {
          throw new Error(`External marks for ${st.name} cannot exceed 70.`);
        }

        db.saveStudentMarks({
          examId: selectedExamId,
          studentId: st.id,
          studentName: st.name,
          enrollmentNo: st.enrollmentNo,
          subjectId: selectedSubjectId,
          internalMarks: internalVal,
          maxInternalMarks: maxInt,
          externalMarks: externalVal,
          maxExternalMarks: maxExt,
          practicalMarks: practicalVal,
          maxPracticalMarks: 0,
          isAbsent: studentEntry?.isAbsent,
          isMalpractice: studentEntry?.isMalpractice,
        }, user);
      });

      loadData();
      setSaveStatus('Draft marks saved successfully.');
      setTimeout(() => setSaveStatus(''), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving marks.');
    }
  };

  const handleSubmitMarks = () => {
    if (!selectedExamId || !selectedSubjectId) return;
    try {
      // First save current entries
      handleSaveDraftMarks();
      const res = db.submitStudentMarks(selectedExamId, selectedSubjectId, user);
      loadData();
      setSaveStatus(`Marks submitted for Examination Controller verification (${res.count} students).`);
      setTimeout(() => setSaveStatus(''), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting marks.');
    }
  };

  const handleVerifyMarks = () => {
    if (!selectedExamId || !selectedSubjectId) return;
    try {
      const res = db.verifyStudentMarks(selectedExamId, selectedSubjectId, 'Verified by Controller', user);
      loadData();
      setSaveStatus(`Marks successfully verified (${res.count} students).`);
      setTimeout(() => setSaveStatus(''), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying marks.');
    }
  };

  const handleReturnMarks = () => {
    if (!returnReason.trim()) {
      alert('A mandatory reason is required to return marks for correction.');
      return;
    }
    try {
      const res = db.returnStudentMarks(selectedExamId, selectedSubjectId, returnReason, user);
      setIsReturnModalOpen(false);
      setReturnReason('');
      loadData();
      setSaveStatus(`Marks returned to Faculty for correction (${res.count} students).`);
      setTimeout(() => setSaveStatus(''), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error returning marks.');
    }
  };

  const permittedRoles = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'FACULTY', 'HOD', 'PRINCIPAL'];
  if (!permittedRoles.includes((role as string) || '')) {
    return <div style={{ padding: '2rem' }}>Unauthorized Access</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Marks Entry, Verification &amp; Evaluation Pipeline
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Faculty marks entry (Internal 30 / External 70), automated bounds validation, and Controller verification
        </p>
      </div>

      {/* Select Exam & Subject Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="grid-2" style={{ gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Select Examination Session *</label>
            <select
              className="form-select"
              value={selectedExamId}
              onChange={e => {
                setSelectedExamId(e.target.value);
                setSelectedSubjectId('');
              }}
            >
              <option value="">-- Select Exam Event --</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Select Evaluation Subject *</label>
            <select
              className="form-select"
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              disabled={!selectedExamId}
            >
              <option value="">-- Select Subject for Marks Evaluation --</option>
              {examSubjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Toasts */}
      {saveStatus && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} color="#10B981" /> {saveStatus}
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} color="#EF4444" /> {errorMessage}
        </div>
      )}

      {/* Marks Entry & Verification Roster */}
      {selectedExamId && selectedSubjectId && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Subject Evaluation Roster ({students.length} Candidates)
                </h3>
                <Badge
                  variant={
                    evaluationStatus === 'VERIFIED'
                      ? 'active'
                      : evaluationStatus === 'SUBMITTED'
                      ? 'warning'
                      : evaluationStatus === 'RETURNED'
                      ? 'inactive'
                      : 'navy'
                  }
                >
                  {evaluationStatus}
                </Badge>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {currentSubjectMarks[0]?.returnReason && (
                  <span style={{ color: '#EF4444', fontWeight: 600 }}>
                    Return Reason: {currentSubjectMarks[0].returnReason}
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Faculty Actions */}
              {!isLockedForFaculty && (
                <>
                  <button className="btn btn-outline" onClick={handleSaveDraftMarks}>
                    <Save size={15} /> Save Draft
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmitMarks}>
                    <Send size={15} /> Submit for Review
                  </button>
                </>
              )}

              {/* Locked Warning */}
              {isLockedForFaculty && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Badge variant="active">
                    <Lock size={14} /> Marks Submitted / Locked
                  </Badge>
                </span>
              )}

              {/* Controller Actions */}
              {isController && evaluationStatus === 'SUBMITTED' && (
                <>
                  <button className="btn btn-outline" onClick={() => setIsReturnModalOpen(true)} style={{ color: '#EF4444', borderColor: '#EF4444' }}>
                    <RotateCcw size={15} /> Return for Correction
                  </button>
                  <button className="btn btn-primary" onClick={handleVerifyMarks} style={{ backgroundColor: '#10B981' }}>
                    <UserCheck size={15} /> Verify Marks
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Enrollment No</th>
                  <th>Student Name</th>
                  <th>Internal (Max 30)</th>
                  <th>External (Max 70)</th>
                  <th>Total (100)</th>
                  <th>Grade</th>
                  <th>Absent / MP</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No enrolled candidates found for this subject and exam.
                    </td>
                  </tr>
                ) : (
                  students.map(st => {
                    const entry = editMarks[st.id] || { internal: '', external: '', practical: '0', isAbsent: false, isMalpractice: false };
                    const intVal = parseFloat(entry.internal) || 0;
                    const extVal = parseFloat(entry.external) || 0;
                    const totalVal = entry.isAbsent || entry.isMalpractice ? 0 : intVal + extVal;
                    const isPass = !entry.isAbsent && !entry.isMalpractice && totalVal >= 40 && extVal >= 24.5;
                    const grade = entry.isAbsent ? 'AB' : entry.isMalpractice ? 'MP' : totalVal >= 90 ? 'O' : totalVal >= 80 ? 'A+' : totalVal >= 70 ? 'A' : totalVal >= 60 ? 'B+' : totalVal >= 50 ? 'B' : totalVal >= 45 ? 'C' : totalVal >= 40 ? 'P' : 'F';

                    return (
                      <tr key={st.id}>
                        <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{st.enrollmentNo}</td>
                        <td style={{ fontWeight: 600 }}>{st.name}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '90px' }}
                            min={0}
                            max={30}
                            disabled={isLockedForFaculty || entry.isAbsent || entry.isMalpractice}
                            value={entry.internal}
                            onChange={e => handleMarksChange(st.id, 'internal', e.target.value)}
                            placeholder="0-30"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '90px' }}
                            min={0}
                            max={70}
                            disabled={isLockedForFaculty || entry.isAbsent || entry.isMalpractice}
                            value={entry.external}
                            onChange={e => handleMarksChange(st.id, 'external', e.target.value)}
                            placeholder="0-70"
                          />
                        </td>
                        <td>
                          <strong style={{ fontSize: '1rem', color: isPass ? 'var(--brand-navy)' : '#EF4444' }}>
                            {totalVal}
                          </strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
                        </td>
                        <td>
                          <Badge variant={isPass ? 'active' : 'inactive'}>
                            {grade}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                disabled={isLockedForFaculty}
                                checked={entry.isAbsent}
                                onChange={() => handleToggleFlag(st.id, 'isAbsent')}
                              />
                              AB
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', color: '#EF4444' }}>
                              <input
                                type="checkbox"
                                disabled={isLockedForFaculty}
                                checked={entry.isMalpractice}
                                onChange={() => handleToggleFlag(st.id, 'isMalpractice')}
                              />
                              MP
                            </label>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isPass ? '#10B981' : '#EF4444' }}>
                            {entry.isAbsent ? 'ABSENT' : entry.isMalpractice ? 'MALPRACTICE' : isPass ? 'PASS' : 'FAIL'}
                          </span>
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

      {/* Return Modal */}
      {isReturnModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Return Marks for Faculty Correction
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Provide mandatory correction guidelines and reasons for returning this evaluation sheet to faculty.
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Return Reason *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Specify what needs correction (e.g., internal marks mismatch with attendance record)..."
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReturnMarks} style={{ backgroundColor: '#EF4444' }}>
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
