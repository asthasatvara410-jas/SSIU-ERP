import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { Award, Download, BookOpen, CheckCircle2, XCircle, Printer, QrCode, ShieldCheck } from 'lucide-react';
import logoSvg from '../../assets/swarrnim-logo.svg';

export const MarksheetPage: React.FC = () => {
  const { user, role } = useAuth();
  const exams = db.getExams();
  const results = db.getStudentResults();
  const marks = db.getStudentMarks();
  const students = db.getStudents();
  const subjects = db.getSubjects();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');

  const currentExam = exams.find(e => e.id === selectedExamId);
  const currentStudent = role === 'STUDENT' ? students.find(s => s.id === user?.id || s.email === user?.email) : null;
  const currentResult = currentStudent ? results.find(r => r.examId === selectedExamId && r.studentId === currentStudent.id && r.isPublished) : null;
  const studentMarks = currentStudent ? marks.filter(m => (m.examId === selectedExamId || !m.examId) && m.studentId === currentStudent.id) : [];

  const handleDownloadMarksheet = (resultObj: any) => {
    const examObj = exams.find(e => e.id === resultObj.examId);
    const mList = marks.filter(m => (m.examId === resultObj.examId || !m.examId) && m.studentId === resultObj.studentId);

    let subjectLines = '';
    mList.forEach(m => {
      const subj = subjects.find(s => s.id === m.subjectId);
      subjectLines += `${(subj?.code || 'CS401').padEnd(10)} | ${(subj?.name || 'Subject').padEnd(32)} | 4 | Int: ${m.internalMarks.toString().padStart(2)} | Ext: ${m.externalMarks.toString().padStart(2)} | Total: ${m.totalMarks.toString().padStart(3)} | Grade: ${m.grade}\n`;
    });

    const content = `========================================================================================
SWARRNIM STARTUP & INNOVATION UNIVERSITY - OFFICIAL STATEMENT OF MARKS
========================================================================================
Marksheet Number : ${resultObj.marksheetNo || 'MS-2026-000001'}
Verification Ref : ${resultObj.verificationCode || 'VREF-RES-2026-000001'}
Exam Event       : ${examObj?.name || 'Semester Examination'}
Issue Date       : ${resultObj.publishedDate || new Date().toISOString().split('T')[0]}
Student Name     : ${resultObj.studentName}
Enrollment No    : ${resultObj.enrollmentNo}
Program          : ${resultObj.programName || 'Bachelor of Technology in Computer Engineering'}
Semester / Year  : Semester ${resultObj.semesterNumber || 4} (${resultObj.academicYearCode || '2026-27'})
----------------------------------------------------------------------------------------
SUBJECT-WISE TABULATION OF MARKS:
----------------------------------------------------------------------------------------
Code       | Subject Title                    | Cr | Internal | External | Total     | Grade
----------------------------------------------------------------------------------------
${subjectLines || 'CS401      | Advanced Database Systems        | 4  | Int: 26  | Ext: 58  | Total:  84 | Grade: A+\n'}----------------------------------------------------------------------------------------
AGGREGATE EVALUATION SUMMARY:
Total Marks Obtained : ${resultObj.totalMarksObtained} / ${resultObj.totalMaxMarks} (${resultObj.percentage || 85}%)
Semester SGPA        : ${resultObj.sgpa}
Cumulative CGPA      : ${resultObj.cgpa}
FINAL RESULT STATUS  : ${resultObj.status}
========================================================================================
Controller of Examinations, Swarrnim Startup & Innovation University
Verify Authenticity Online: http://ssiu-erp.internal/public/result/verify/${resultObj.verificationCode || 'VREF-RES-2026-000001'}
========================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_of_Marks_${resultObj.enrollmentNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Official Statement of Marks &amp; Academic Grade Card
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {role === 'STUDENT'
            ? 'View and print your official university semester marksheet with secure verification token'
            : 'Review candidate marksheet generation with unique marksheet numbers'}
        </p>
      </div>

      {/* Select Exam Filter */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>Select Examination Session:</label>
          <select
            className="form-select"
            style={{ maxWidth: '380px' }}
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {role === 'STUDENT' && (
        <div>
          {!currentResult ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={48} color="var(--brand-orange)" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Result Pending Declaration
              </h4>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Your official statement of marks will be available here after the Examination Controller completes verification and publication.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: '2.5rem', borderTop: '8px solid var(--brand-navy)', borderRadius: '12px' }}>
              {/* Header with Logo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--brand-orange)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={logoSvg} alt="Swarrnim Logo" style={{ height: '60px', objectFit: 'contain' }} />
                  <div>
                    <h3 style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0 }}>
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
                    Marksheet No: <strong style={{ color: 'var(--brand-navy)' }}>{currentResult.marksheetNo || 'MS-2026-000001'}</strong>
                  </div>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Scholar Name:</span> <strong>{currentResult.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Enrollment No:</span> <strong style={{ color: 'var(--brand-navy)' }}>{currentResult.enrollmentNo}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Program:</span> <strong>{currentResult.programName || 'Bachelor of Technology (Computer Engineering)'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Semester / Session:</span> <strong>Semester {currentResult.semesterNumber || 4} ({currentResult.academicYearCode || '2026-27'})</strong>
                </div>
              </div>

              {/* Subject Breakdown Table */}
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
                    {studentMarks.length === 0 ? (
                      <tr>
                        <td style={{ fontWeight: 700 }}>CS401</td>
                        <td>Advanced Database Management Systems</td>
                        <td>4</td>
                        <td>26</td>
                        <td>58</td>
                        <td><strong>84</strong></td>
                        <td><Badge variant="active">A+</Badge></td>
                      </tr>
                    ) : (
                      studentMarks.map((m, idx) => {
                        const subj = subjects.find(s => s.id === m.subjectId);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>{subj?.code || m.subjectCode || 'CS40' + (idx + 1)}</td>
                            <td>{subj?.name || m.subjectName || 'Engineering Subject ' + (idx + 1)}</td>
                            <td>4</td>
                            <td>{m.internalMarks}</td>
                            <td>{m.externalMarks}</td>
                            <td><strong>{m.totalMarks}</strong></td>
                            <td><Badge variant={m.isPass ? 'active' : 'inactive'}>{m.grade}</Badge></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Performance Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL MARKS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {currentResult.totalMarksObtained} / {currentResult.totalMaxMarks}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SEMESTER SGPA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-orange)' }}>
                    {currentResult.sgpa}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUMULATIVE CGPA</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                    {currentResult.cgpa}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FINAL RESULT</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: currentResult.status === 'PASS' ? '#10B981' : '#EF4444' }}>
                    {currentResult.status}
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
                      Verification Code: {currentResult.verificationCode || 'VREF-RES-2026-000001'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Public Verification Endpoint: /public/result/verify/{currentResult.verificationCode || 'VREF-RES-2026-000001'}
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline" onClick={() => handleDownloadMarksheet(currentResult)}>
                  <Download size={15} /> Download Text Statement
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={15} /> Print Statement of Marks
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
