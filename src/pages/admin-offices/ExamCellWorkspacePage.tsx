import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { FileCheck, ShieldCheck, Ticket, Award, CheckCircle2, Clock, FileText, Plus, Eye } from 'lucide-react';
import { NoteSheet } from '../../types';

export const ExamCellWorkspacePage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'FORMS' | 'NOTESHEETS'>('FORMS');

  const exams = db.getExams();
  const forms = db.getExamForms();
  const results = db.getStudentResults();
  const students = db.getStudents();
  const examNoteSheets = db.getNoteSheets(user, 'EXAM');

  const approvedForms = forms.filter(f => f.status === 'APPROVED');
  const pendingForms = forms.filter(f => f.status === 'VERIFICATION_PENDING' || f.status === 'SUBMITTED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Examination Cell &amp; Controller of Examinations
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage university examination schedules, hall ticket issuance, result compilation, and exam office Notesheets
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard title="Active University Exams" value={String(exams.length)} icon={FileCheck} subtitle="Current Exam Series" />
        <StatCard title="Exam Forms Approved" value={String(approvedForms.length)} icon={ShieldCheck} subtitle="Hall Tickets Released" />
        <StatCard title="Pending Form Approvals" value={String(pendingForms.length)} icon={Clock} subtitle="Awaiting Verification" />
        <StatCard title="Exam Notesheets" value={String(examNoteSheets.length)} icon={FileText} subtitle="Official Proposals" colorScheme="navy" />
      </div>

      {/* Workspace Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'FORMS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('FORMS')}
        >
          <ShieldCheck size={16} /> Exam Form Approvals ({forms.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'NOTESHEETS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('NOTESHEETS')}
        >
          <FileText size={16} /> Examination Notesheets ({examNoteSheets.length})
        </button>
      </div>

      {/* ─── TAB 1: EXAM FORMS ─── */}
      {activeTab === 'FORMS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Examination Form Approvals &amp; Hall Ticket Queue
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Form ID</th>
                  <th>Student Name</th>
                  <th>Enrollment No</th>
                  <th>Fee Payment</th>
                  <th>Attendance Eligibility</th>
                  <th>Final Status</th>
                </tr>
              </thead>
              <tbody>
                {forms.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.id}</strong></td>
                    <td>{f.studentName}</td>
                    <td>{f.enrollmentNo}</td>
                    <td><Badge variant={f.paymentStatus === 'PAID' ? 'active' : 'danger'}>{f.paymentStatus}</Badge></td>
                    <td><Badge variant={f.isEligible !== false ? 'active' : 'danger'}>{f.isEligible !== false ? 'ELIGIBLE' : 'SHORT ATTENDANCE'}</Badge></td>
                    <td>
                      <Badge variant={f.status === 'APPROVED' ? 'active' : f.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {f.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: EXAM SECTION NOTESHEETS ─── */}
      {activeTab === 'NOTESHEETS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
              Official Examination Section Notesheets
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Note: Full Notesheet workflow management is also accessible via the sidebar "<strong>Note Sheets</strong>" menu.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Notesheet No.</th>
                  <th>Section</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Estimated Cost</th>
                  <th>Current Office</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {examNoteSheets.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No Examination Notesheets created yet. Use the sidebar "Note Sheets" menu to draft a new Exam proposal.
                    </td>
                  </tr>
                ) : (
                  examNoteSheets.map(ns => (
                    <tr key={ns.id}>
                      <td><strong style={{ color: 'var(--brand-orange)', fontFamily: 'monospace' }}>{ns.noteSheetNumber}</strong></td>
                      <td>{ns.section || 'General Exam'}</td>
                      <td>
                        <Badge variant={ns.priority === 'URGENT' ? 'danger' : ns.priority === 'HIGH' ? 'orange' : 'navy'}>
                          {ns.priority || 'MEDIUM'}
                        </Badge>
                      </td>
                      <td>{ns.date}</td>
                      <td><strong>{ns.subject || ns.title}</strong></td>
                      <td>₹{((ns.totalEstimatedAmount || ns.estimatedCost) || 0).toLocaleString('en-IN')}</td>
                      <td><Badge variant="gold">{ns.currentOffice.replace('_', ' ')}</Badge></td>
                      <td>
                        <Badge variant={
                          ns.status === 'APPROVED' || ns.status === 'COMPLETED' ? 'active' :
                          ns.status === 'REJECTED' ? 'danger' :
                          ns.status === 'RETURNED' ? 'orange' : 'navy'
                        }>
                          {ns.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
