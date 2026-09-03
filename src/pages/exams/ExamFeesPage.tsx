import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { ExamForm } from '../../types';
import { IndianRupee, CreditCard, Download, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ExamFeesPage: React.FC = () => {
  const { user, role } = useAuth();
  const exams = db.getExams();
  const forms = db.getExamForms();
  const students = db.getStudents();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<string>('ONLINE_UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentExam = exams.find(e => e.id === selectedExamId);
  const currentStudent = role === 'STUDENT' ? students.find(s => s.id === user?.id || s.email === user?.email) : null;
  const currentForm = currentStudent ? forms.find(f => f.examId === selectedExamId && f.studentId === currentStudent.id) : null;

  const handlePayExamFee = () => {
    if (!currentForm) return;

    setIsProcessing(true);
    const txnId = `TXN-FEE-${Date.now().toString().slice(-6)}`;

    setTimeout(() => {
      db.updateEntity<ExamForm>('examForms', currentForm.id, {
        paymentStatus: 'PAID',
        paymentMode,
        transactionId: txnId,
        paidAt: new Date().toISOString().split('T')[0],
        status: currentForm.status === 'DRAFT' ? 'VERIFICATION_PENDING' : currentForm.status
      }, 'Paid Exam Registration Fee');

      setIsProcessing(false);
      alert(`Payment of ₹${currentForm.totalFee} successful! Ref ID: ${txnId}`);
    }, 800);
  };

  const handleDownloadReceipt = (formObj: any) => {
    const examObj = exams.find(e => e.id === formObj.examId);
    const content = `====================================================
SWARRNIM UNIVERSITY - EXAMINATION FEE RECEIPT
====================================================
Receipt No   : REC-EXAM-${formObj.id}
Date         : ${formObj.paidAt || new Date().toISOString().split('T')[0]}
Student Name : ${formObj.studentName}
Enrollment No: ${formObj.enrollmentNo}
Exam Name    : ${examObj?.name || 'Semester Examination'}
Payment Mode : ${formObj.paymentMode || 'ONLINE'}
Txn Ref ID   : ${formObj.transactionId || 'TXN-EXAM-999'}
----------------------------------------------------
Base Exam Fee        : Rs. ${formObj.baseFee || 300}
Subject Fees         : Rs. ${formObj.subjectFee || 200}
Late Fee Penalty     : Rs. ${formObj.lateFee || 0}
TOTAL AMOUNT PAID    : Rs. ${formObj.totalFee}
Status               : PAYMENT VERIFIED & CONFIRMED
====================================================
Finance & Examination Division, Swarrnim University
====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExamFeeReceipt_${formObj.enrollmentNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Exam Fees &amp; Online Payment Gateway
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {role === 'STUDENT' ? 'View examination fee structure, pay registration fees online, and download official receipt' : 'Monitor student examination fee collection and transaction logs'}
        </p>
      </div>

      {/* Select Exam Filter */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Exam Event:</label>
          <select className="form-select" style={{ maxWidth: '360px' }} value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {role === 'STUDENT' && currentExam && (
        <div className="grid-2">
          {/* Fee Structure Summary */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-orange)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Fee Breakdown for {currentExam.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Exam Form Registration Fee:</span>
                <strong>₹{currentExam.baseFee || 300}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Per Subject Assessment Charge:</span>
                <strong>₹{currentExam.perSubjectFee || 100} / subject</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Late Fee Penalty (if past deadline):</span>
                <strong style={{ color: 'var(--color-danger)' }}>₹{currentExam.lateFee || 200}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Regular Registration Deadline:</span>
                <strong>{currentExam.formDeadline || '2026-12-31'}</strong>
              </div>
            </div>

            {currentForm && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--brand-orange-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(243, 112, 35, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase' }}>Calculated Total for Your Form</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>
                  ₹{currentForm.totalFee}
                </div>
              </div>
            )}
          </div>

          {/* Payment Action Box */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Payment Status &amp; Execution
            </h3>

            {!currentForm ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Please fill out your Exam Form first before proceeding to Fee Payment.
              </div>
            ) : currentForm.paymentStatus === 'PAID' ? (
              <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#065F46', fontWeight: 800, fontSize: '1.1rem' }}>
                  <CheckCircle2 size={24} /> Payment Verified &amp; Confirmed
                </div>
                <div style={{ fontSize: '0.84375rem', color: '#047857' }}>
                  <div>Transaction Ref: <strong>{currentForm.transactionId || 'TXN-EXAM-101'}</strong></div>
                  <div>Payment Mode: <strong>{currentForm.paymentMode || 'ONLINE'}</strong></div>
                  <div>Total Amount Paid: <strong>₹{currentForm.totalFee}</strong></div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleDownloadReceipt(currentForm)}>
                  <Download size={16} /> Download Official Fee Receipt
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Choose Payment Gateway Method</label>
                  <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                    <option value="ONLINE_UPI">Google Pay / PhonePe / Paytm UPI</option>
                    <option value="CREDIT_DEBIT_CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.84375rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Amount to Pay:</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange)' }}>₹{currentForm.totalFee}</div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handlePayExamFee} disabled={isProcessing}>
                  <CreditCard size={16} /> {isProcessing ? 'Processing Payment...' : `Pay ₹${currentForm.totalFee} Now`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin / Overview Table */}
      {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
            Fee Payment Collection Log ({currentExam?.name})
          </h3>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Enrollment No</th>
                  <th>Base Fee</th>
                  <th>Subject Fee</th>
                  <th>Late Penalty</th>
                  <th>Total Paid</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {forms.filter(f => f.examId === selectedExamId).length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No form payments recorded.</td></tr>
                ) : (
                  forms.filter(f => f.examId === selectedExamId).map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{f.studentName}</td>
                      <td>{f.enrollmentNo}</td>
                      <td>₹{f.baseFee || 300}</td>
                      <td>₹{f.subjectFee || 200}</td>
                      <td>₹{f.lateFee || 0}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-orange)' }}>₹{f.totalFee}</td>
                      <td>
                        <Badge variant={f.paymentStatus === 'PAID' ? 'active' : 'inactive'}>
                          {f.paymentStatus}
                        </Badge>
                      </td>
                      <td>
                        {f.paymentStatus === 'PAID' ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadReceipt(f)}>
                            <Download size={14} /> Receipt
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>
                        )}
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
