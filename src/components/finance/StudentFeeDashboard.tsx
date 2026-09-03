import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentFeeService, StudentFeeSummary, SemesterFeeRow } from '../../services/studentFeeService';
import { Student, StudentFeeRecord, FeePaymentTransaction } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../receipt/receiptTypes';
import { FeeQueryModal } from './FeeQueryModal';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../common/ExcelTable';
import { Modal } from '../common/Modal';
import { 
  IndianRupee, CreditCard, FileText, CheckCircle2, Clock, 
  AlertTriangle, Search, Download, Printer, ShieldCheck, 
  Calendar, Eye, RefreshCw, AlertCircle, XCircle, RotateCcw,
  ArrowRight, Landmark, Lock, HelpCircle, Layers, Filter, CheckCircle,
  Building2, Bus, BookOpen, Wrench, Shield, Sparkles, Send, FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentFeeDashboardProps {
  student?: Student | null;
  onRefresh?: () => void;
}

export type StudentFeeSubTab = 
  | 'FEE_DASHBOARD' 
  | 'ACADEMIC_FEES' 
  | 'OTHER_FEES' 
  | 'PAYMENT_HISTORY' 
  | 'RECEIPTS' 
  | 'TRANSACTION_HISTORY' 
  | 'OUTSTANDING_FEES';

export const StudentFeeDashboard: React.FC<StudentFeeDashboardProps> = ({
  student,
  onRefresh
}) => {
  const { user, role } = useAuth();

  // Resolve target student (Strict RBAC scoping: Student only views their own record)
  const activeStudent = useMemo<Student | null>(() => {
    if (student) return student;
    if (role === 'STUDENT' && user) {
      return db.getStudents().find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo || s.email === user.email) || null;
    }
    return db.getStudents()[0] || null;
  }, [student, role, user]);

  const [activeSubTab, setActiveSubTab] = useState<StudentFeeSubTab>('FEE_DASHBOARD');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [viewingReceiptTx, setViewingReceiptTx] = useState<FeePaymentTransaction | null>(null);
  const [viewingTxDetails, setViewingTxDetails] = useState<FeePaymentTransaction | null>(null);
  const [isFeeQueryModalOpen, setIsFeeQueryModalOpen] = useState(false);
  const [selectedRecordForQuery, setSelectedRecordForQuery] = useState<SemesterFeeRow | null>(null);
  const [isPayOnlineModalOpen, setIsPayOnlineModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paySemesterRow, setPaySemesterRow] = useState<SemesterFeeRow | null>(null);
  const [payPaymentMode, setPayPaymentMode] = useState<'ONLINE_UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD'>('ONLINE_UPI');
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  const studentId = activeStudent?.id || 'stu-1';

  // Metrics Summary
  const summary: StudentFeeSummary = useMemo(() => {
    return studentFeeService.calculateStudentFeeSummary(studentId);
  }, [studentId, activeStudent]);

  // Semester Breakdown
  const semesterRows = useMemo(() => {
    return studentFeeService.getSemesterFeeDetails(studentId, {
      semesterId: selectedSemester,
      academicYear: selectedAcademicYear
    });
  }, [studentId, selectedSemester, selectedAcademicYear]);

  // Payment History Transactions (Strictly successful/settled or explicit transactions)
  const paymentHistory = useMemo(() => {
    return studentFeeService.getStudentPaymentHistory(studentId, {
      search: searchQuery,
      semesterId: selectedSemester,
      academicYear: selectedAcademicYear,
      status: selectedStatus,
      paymentMode: selectedPaymentMode,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  }, [studentId, searchQuery, selectedSemester, selectedAcademicYear, selectedStatus, selectedPaymentMode, startDate, endDate]);

  // Receipts List (Transactions with confirmed receipts)
  const receiptsList = useMemo(() => {
    return paymentHistory.filter(t => t.receiptNo && t.receiptNo.trim() !== '');
  }, [paymentHistory]);

  // Outstanding Records (Records with pending balance > 0)
  const outstandingRows = useMemo(() => {
    return semesterRows.filter(r => r.outstanding > 0);
  }, [semesterRows]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSemester('ALL');
    setSelectedAcademicYear('ALL');
    setSelectedStatus('ALL');
    setSelectedPaymentMode('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleExportPaymentHistoryExcel = () => {
    const exportData = paymentHistory.map(tx => ({
      'Receipt No': tx.receiptNo,
      'Payment Date': tx.paymentDate,
      'Academic Year': tx.academicYear || '2026-2027',
      'Semester': tx.semesterName || 'Semester 1',
      'Amount (INR)': tx.paidAmount,
      'Payment Mode': tx.paymentMode,
      'Transaction ID': tx.transactionId,
      'Reference No': tx.referenceNo || '',
      'Reference Date': tx.referenceDate || '',
      'Bank / Gateway': tx.bankName || tx.gatewayName || '',
      'Fee Category': tx.feeType || 'TUITION',
      'Payment Status': tx.status || 'SUCCESS',
      'Refund Amount': tx.refundAmount || 0,
      'Remarks': tx.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');
    XLSX.writeFile(wb, `Student_Payment_History_${activeStudent?.enrollmentNo || 'SSIU'}.xlsx`);
  };

  const getAcademicStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PAID' || s === 'CLEARED' || s === 'SUCCESS') {
      return <Badge variant="active">PAID</Badge>;
    }
    if (s === 'PARTIAL' || s === 'PARTIALLY_PAID') {
      return <Badge variant="orange">PARTIAL</Badge>;
    }
    if (s === 'OVERDUE') {
      return <Badge variant="danger">OVERDUE</Badge>;
    }
    return <Badge variant="gold">PENDING</Badge>;
  };

  const getTransactionStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS' || s === 'PAID') {
      return <Badge variant="active">SUCCESS</Badge>;
    }
    if (s === 'FAILED') {
      return <Badge variant="danger">FAILED</Badge>;
    }
    if (s === 'REFUNDED') {
      return <Badge variant="orange">REFUNDED</Badge>;
    }
    return <Badge variant="gold">PENDING</Badge>;
  };

  // Online Payment Simulation Handler
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySemesterRow || payAmount <= 0) return;

    const receiptNo = `SSIU-REC-${Date.now().toString().slice(-6)}`;
    const txId = `TXN-ONL-${Date.now()}`;
    const newPaid = (paySemesterRow.currentPaid || 0) + payAmount;
    const newPending = Math.max(0, paySemesterRow.totalFee - newPaid);
    const newStatus = newPending === 0 ? 'PAID' : 'PARTIAL';

    // 1. Update StudentFeeRecord
    db.updateEntity<StudentFeeRecord>('studentFeeRecords', paySemesterRow.id, {
      paidAmount: newPaid,
      pendingAmount: newPending,
      status: newStatus as any
    }, `Student online payment: ₹${payAmount}`);

    // 2. Add FeePaymentTransaction
    const newTx: FeePaymentTransaction = {
      id: `tx-pay-${Date.now()}`,
      studentFeeRecordId: paySemesterRow.id,
      studentId: activeStudent!.id,
      studentName: activeStudent!.name,
      enrollmentNo: activeStudent!.enrollmentNo,
      programId: activeStudent!.programId || 'prog-1',
      semesterId: paySemesterRow.semesterId,
      semesterName: paySemesterRow.semesterName,
      academicYear: paySemesterRow.academicYear,
      feeType: (paySemesterRow.feeType === 'TUITION & ACADEMIC' ? 'TUITION' : 'OTHER') as any,
      paidAmount: payAmount,
      paymentMode: (payPaymentMode === 'ONLINE_UPI' ? 'Online UPI' : payPaymentMode === 'NET_BANKING' ? 'Net Banking' : 'Card') as any,
      transactionId: txId,
      referenceNo: `GATEWAY-${Math.floor(100000 + Math.random() * 900000)}`,
      referenceDate: new Date().toISOString().split('T')[0],
      bankName: 'HDFC University Payment Gateway',
      gatewayName: 'HDFC SmartHub',
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNo: receiptNo,
      status: 'SUCCESS',
      remarks: `Online Payment settled by student via Portal`,
      recordedBy: activeStudent!.name
    };

    db.addEntity<FeePaymentTransaction>('feePaymentTransactions', newTx, `Online fee payment settled: ${receiptNo}`);

    // 3. Central Audit Log
    db.logAudit(
      'FEE_PAYMENT_SETTLED',
      'FeePaymentTransaction',
      `Student ${activeStudent!.name} (${activeStudent!.enrollmentNo}) paid ₹${payAmount} for ${paySemesterRow.semesterName}. Receipt: ${receiptNo}.`,
      activeStudent!.name,
      'STUDENT',
      { recordId: newTx.id, module: 'FINANCE_FEES' }
    );

    setPaySuccessMsg(`Payment of ₹${payAmount.toLocaleString('en-IN')} settled successfully! Official Receipt PDF opened in new tab. Receipt: ${receiptNo}`);
    setTimeout(() => {
      setIsPayOnlineModalOpen(false);
      setPaySuccessMsg(null);
      feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(newTx));
      if (onRefresh) onRefresh();
    }, 1200);
  };

  if (!activeStudent) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={32} color="#EF4444" style={{ margin: '0 auto 0.5rem auto' }} />
        <h4 style={{ color: 'var(--brand-navy, #0B192C)' }}>Student Record Not Found</h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)' }}>Please select a valid student profile to inspect fee ledger details.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Official Read-Only Regulatory Banner & Raise Fee Query Shortcut */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(11, 25, 44, 0.04)',
        borderLeft: '4px solid var(--brand-navy, #0B192C)',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lock size={16} color="var(--brand-navy, #0B192C)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)', fontWeight: 600 }}>
            <strong>Official Financial Ledger:</strong> Financial transactions, receipts, and invoices are managed by the University Accounts Directorate. Student view is <strong>read-only</strong>.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setSelectedRecordForQuery(null);
              setIsFeeQueryModalOpen(true);
            }}
            style={{
              background: 'var(--brand-orange, #F37023)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <HelpCircle size={14} /> Raise Fee Query
          </button>
        </div>
      </div>

      {/* 2. 7-SUBTAB NAVIGATION BAR */}
      <div className="card" style={{ padding: '0.5rem', background: '#FFFFFF', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[
            { id: 'FEE_DASHBOARD', label: '1. Fee Dashboard', icon: IndianRupee },
            { id: 'ACADEMIC_FEES', label: `2. Academic Fee Details (${semesterRows.length})`, icon: Layers },
            { id: 'OTHER_FEES', label: '3. Other Fee Details', icon: Building2 },
            { id: 'PAYMENT_HISTORY', label: `4. Payment History (${paymentHistory.length})`, icon: Clock },
            { id: 'RECEIPTS', label: `5. Receipts (${receiptsList.length})`, icon: FileText },
            { id: 'TRANSACTION_HISTORY', label: '6. Transaction History', icon: CreditCard },
            { id: 'OUTSTANDING_FEES', label: `7. Outstanding Fees (${outstandingRows.length})`, icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveSubTab(tab.id as StudentFeeSubTab)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 800 : 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  background: isActive ? 'var(--brand-navy, #0B192C)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-color, #334155)'
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: FEE DASHBOARD (5 KPI Cards, Settled %, Summary Cards)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'FEE_DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 5 KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <StatCard
              title="Total Fees"
              value={`₹${summary.totalFees.toLocaleString('en-IN')}`}
              icon={IndianRupee}
              subtitle="All academic semesters"
              colorScheme="navy"
            />
            <StatCard
              title="Previous Paid"
              value={`₹${summary.previouslyPaid.toLocaleString('en-IN')}`}
              icon={CheckCircle2}
              subtitle="Prior semester settlements"
              colorScheme="blue"
            />
            <StatCard
              title="Paid"
              value={`₹${summary.totalPaid.toLocaleString('en-IN')}`}
              icon={CheckCircle}
              subtitle="Cumulative fees cleared"
              colorScheme="green"
            />
            <StatCard
              title="Outstanding Amount"
              value={`₹${summary.outstandingAmount.toLocaleString('en-IN')}`}
              icon={AlertTriangle}
              subtitle={summary.outstandingAmount > 0 ? 'Payment due' : 'Zero dues'}
              colorScheme={summary.outstandingAmount > 0 ? 'gold' : 'green'}
            />
            <StatCard
              title="Refund Amount"
              value={`₹${summary.refundAmount.toLocaleString('en-IN')}`}
              icon={RotateCcw}
              subtitle="Caution & fee refunds"
              colorScheme="orange"
            />
          </div>

          {/* Settlement Progress & Breakdown Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Progress Card */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                Fee Settlement Status
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                  Cleared: ₹{summary.totalPaid.toLocaleString('en-IN')} of ₹{summary.totalFees.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 900, color: summary.outstandingAmount === 0 ? '#10B981' : '#F37023' }}>
                  {summary.totalFees > 0 ? Math.round((summary.totalPaid / summary.totalFees) * 100) : 100}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${summary.totalFees > 0 ? Math.min(100, Math.round((summary.totalPaid / summary.totalFees) * 100)) : 100}%`,
                  height: '100%',
                  background: summary.outstandingAmount === 0 ? '#10B981' : 'linear-gradient(90deg, #10B981 0%, #F37023 100%)'
                }} />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Semester Records</span>
                  <strong style={{ color: '#0B192C' }}>{semesterRows.length} Semesters</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Receipts Generated</span>
                  <strong style={{ color: '#0B192C' }}>{receiptsList.length} Invoices</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Due Status</span>
                  <strong style={{ color: summary.outstandingAmount > 0 ? '#D97706' : '#047857' }}>
                    {summary.outstandingAmount > 0 ? 'PENDING' : 'ALL CLEARED'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Actions & Bank Account Info */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                Direct University Bank &amp; NEFT Details
              </h4>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#334155' }}>
                <div><strong>Account Name:</strong> Swarrnim Startup and Innovation University</div>
                <div><strong>Bank Name:</strong> State Bank of India, SSIU Campus Branch</div>
                <div><strong>Account No:</strong> <code>38492019482</code></div>
                <div><strong>IFSC Code:</strong> <code>SBIN0001234</code></div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.25rem' }}>
                  * Please mention your Enrollment Number (<code>{activeStudent.enrollmentNo}</code>) in the NEFT remarks.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: ACADEMIC FEE DETAILS (11-Column Table)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'ACADEMIC_FEES' && (
        <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} color="var(--brand-orange, #F37023)" /> Official Semester Academic Fee Register
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Showing {semesterRows.length} academic terms
            </span>
          </div>

          <ExcelTableContainer minWidth="1050px">
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="center" style={{ width: '50px' }}>Sr.</ExcelTh>
                  <ExcelTh align="left" style={{ minWidth: '120px' }}>Semester</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Academic Year</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '120px' }}>Fees To Collect</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '100px' }}>Prev. Paid</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '100px' }}>Paid</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '90px' }}>Refunded</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '110px' }}>Outstanding</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '100px' }}>Other Due</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Status</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '140px' }}>Action</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {semesterRows.map((row, idx) => (
                  <tr key={row.id}>
                    <ExcelTd align="center" color="#64748B">{idx + 1}</ExcelTd>
                    <ExcelTd align="left" bold color="var(--brand-navy, #0B192C)">
                      {row.semesterName}
                    </ExcelTd>
                    <ExcelTd align="center">{row.academicYear}</ExcelTd>
                    <ExcelTd align="right" bold>₹{row.totalFee.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="right" color="#64748B">₹{row.previouslyPaid.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="right" bold color="#047857">₹{row.currentPaid.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="right" color={row.refunded > 0 ? '#D97706' : '#64748B'}>₹{row.refunded.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="right" bold color={row.outstanding > 0 ? '#DC2626' : '#047857'}>
                      ₹{row.outstanding.toLocaleString('en-IN')}
                    </ExcelTd>
                    <ExcelTd align="right" color="#64748B">₹0</ExcelTd>
                    <ExcelTd align="center">
                      {getAcademicStatusBadge(row.status)}
                    </ExcelTd>
                    <ExcelTd align="center">
                      <div style={{ display: 'inline-flex', gap: '0.3rem', justifyContent: 'center' }}>
                        {row.outstanding > 0 && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => {
                              setPaySemesterRow(row);
                              setPayAmount(row.outstanding);
                              setIsPayOnlineModalOpen(true);
                            }}
                            style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800 }}
                          >
                            Pay Online
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            setSelectedRecordForQuery(row);
                            setIsFeeQueryModalOpen(true);
                          }}
                          title="Raise fee query for this semester"
                        >
                          Query
                        </button>
                      </div>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 3: OTHER FEE DETAILS (Hostel, Transport, Exam, Lab, Library, Late Fee)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'OTHER_FEES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {[
            { name: 'Hostel Accommodation Fee', fee: activeStudent.hostelRequired ? 65000 : 0, paid: activeStudent.hostelRequired ? 65000 : 0, status: activeStudent.hostelRequired ? 'PAID' : 'NOT_APPLICABLE', icon: Building2, desc: 'Block A, Room 204 (AC Triple Sharing)' },
            { name: 'University Transport / Bus Fee', fee: activeStudent.transportRequired ? 22000 : 0, paid: activeStudent.transportRequired ? 22000 : 0, status: activeStudent.transportRequired ? 'PAID' : 'NOT_APPLICABLE', icon: Bus, desc: 'Route 12 - Gandhinagar Sector 11 Pickup' },
            { name: 'End-Sem Examination Registration Fee', fee: 1500, paid: 1500, status: 'PAID', icon: FileCheck, desc: 'Summer 2026 Regular Exam Enrolment' },
            { name: 'Laboratory & Workshop Caution Deposit', fee: 5000, paid: 5000, status: 'PAID', icon: Wrench, desc: 'Refundable Security Deposit at Degree Completion' },
            { name: 'Library Caution Deposit', fee: 2000, paid: 2000, status: 'PAID', icon: BookOpen, desc: 'Central University Digital Library Access' },
            { name: 'Late Fee / Fine Penalties', fee: 0, paid: 0, status: 'PAID', icon: Shield, desc: 'Zero penalty recorded' }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '1.25rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <item.icon size={18} color="var(--brand-orange, #F37023)" />
                  <strong style={{ fontSize: '0.875rem', color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
                </div>
                <Badge variant={item.status === 'PAID' ? 'active' : item.status === 'NOT_APPLICABLE' ? 'inactive' : 'gold'}>
                  {item.status}
                </Badge>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {item.desc}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', fontSize: '0.8125rem' }}>
                <span>Fee: <strong>₹{item.fee.toLocaleString('en-IN')}</strong></span>
                <span style={{ color: '#047857' }}>Paid: <strong>₹{item.paid.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 4: PAYMENT HISTORY
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'PAYMENT_HISTORY' && (
        <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
              Complete Payment History
            </h4>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleExportPaymentHistoryExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={12} /> Export Excel
            </button>
          </div>

          <ExcelTableContainer minWidth="920px">
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left" style={{ minWidth: '160px' }}>Receipt No</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '100px' }}>Date</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Semester</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '120px' }}>Amount</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '120px' }}>Mode</ExcelTh>
                  <ExcelTh align="left" style={{ minWidth: '160px' }}>Transaction / UTR ID</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Status</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '130px' }}>Receipt</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((tx) => (
                  <tr key={tx.id}>
                    <ExcelTd align="left" mono color="var(--brand-orange, #F37023)">
                      {tx.receiptNo}
                    </ExcelTd>
                    <ExcelTd align="center">{tx.paymentDate}</ExcelTd>
                    <ExcelTd align="center">{tx.semesterName || 'Semester 1'}</ExcelTd>
                    <ExcelTd align="right" bold color="#047857">₹{tx.paidAmount.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="center">{tx.paymentMode}</ExcelTd>
                    <ExcelTd align="left" mono style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {tx.transactionId}
                    </ExcelTd>
                    <ExcelTd align="center">
                      {getTransactionStatusBadge(tx.status || 'SUCCESS')}
                    </ExcelTd>
                    <ExcelTd align="center">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(tx))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Printer size={11} /> Receipt PDF
                      </button>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 5: RECEIPTS (Receipt Number, Date, Semester, Mode, Ref No, Ref Date, Bank, Amount, Print)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'RECEIPTS' && (
        <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
              Official Fee Receipts &amp; Tax Invoices
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {receiptsList.length} Verified Receipts
            </span>
          </div>

          <ExcelTableContainer minWidth="980px">
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left" style={{ minWidth: '160px' }}>Receipt Number</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '100px' }}>Date</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '100px' }}>Semester</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '120px' }}>Payment Mode</ExcelTh>
                  <ExcelTh align="left" style={{ minWidth: '150px' }}>Reference Number</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Reference Date</ExcelTh>
                  <ExcelTh align="left" style={{ minWidth: '150px' }}>Bank / Gateway</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '110px' }}>Amount</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '130px' }}>Download / Print</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {receiptsList.map((r) => (
                  <tr key={r.id}>
                    <ExcelTd align="left" mono color="var(--brand-orange, #F37023)">
                      {r.receiptNo}
                    </ExcelTd>
                    <ExcelTd align="center">{r.paymentDate}</ExcelTd>
                    <ExcelTd align="center">{r.semesterName || 'Semester 1'}</ExcelTd>
                    <ExcelTd align="center">{r.paymentMode}</ExcelTd>
                    <ExcelTd align="left" mono style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {r.referenceNo || r.transactionId}
                    </ExcelTd>
                    <ExcelTd align="center">{r.referenceDate || r.paymentDate}</ExcelTd>
                    <ExcelTd align="left">{r.bankName || r.gatewayName || 'HDFC Gateway'}</ExcelTd>
                    <ExcelTd align="right" bold color="#047857">₹{r.paidAmount.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="center">
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(r))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'var(--brand-navy, #0B192C)', color: '#FFFFFF' }}
                      >
                        <Printer size={11} /> Receipt PDF
                      </button>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 6: TRANSACTION HISTORY (9 Columns)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'TRANSACTION_HISTORY' && (
        <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
              Online Gateway &amp; Banking Transaction Log
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Official Financial Settlement Logs
            </span>
          </div>

          <ExcelTableContainer minWidth="980px">
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="center" style={{ width: '50px' }}>Sr.</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '130px' }}>Payment Date</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Academic Year</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Semester / Year</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '120px' }}>Payment Mode</ExcelTh>
                  <ExcelTh align="right" style={{ minWidth: '120px' }}>Total Amount</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '110px' }}>Status</ExcelTh>
                  <ExcelTh align="left" style={{ minWidth: '180px' }}>Payment Details</ExcelTh>
                  <ExcelTh align="center" style={{ minWidth: '130px' }}>Action</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((tx, idx) => (
                  <tr key={tx.id}>
                    <ExcelTd align="center" color="#64748B">{idx + 1}</ExcelTd>
                    <ExcelTd align="center">{tx.paymentDate}</ExcelTd>
                    <ExcelTd align="center">{tx.academicYear || '2026-2027'}</ExcelTd>
                    <ExcelTd align="center">{tx.semesterName || 'Semester 1'}</ExcelTd>
                    <ExcelTd align="center">{tx.paymentMode}</ExcelTd>
                    <ExcelTd align="right" bold color="#047857">₹{tx.paidAmount.toLocaleString('en-IN')}</ExcelTd>
                    <ExcelTd align="center">
                      {getTransactionStatusBadge(tx.status || 'SUCCESS')}
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontSize: '0.72rem' }}>
                        <div><strong>Gateway:</strong> {tx.gatewayName || tx.bankName || 'Direct'}</div>
                        <div><strong>Ref ID:</strong> <code style={{ fontSize: '0.68rem' }}>{tx.transactionId}</code></div>
                      </div>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <div style={{ display: 'inline-flex', gap: '0.3rem', justifyContent: 'center' }}>
                        {tx.status === 'SUCCESS' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(tx))}
                          >
                            <Printer size={11} /> Receipt PDF
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setViewingTxDetails(tx)}
                        >
                          <Eye size={11} />
                        </button>
                      </div>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 7: OUTSTANDING FEES
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'OUTSTANDING_FEES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {outstandingRows.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#ECFDF5', border: '1px solid #10B981' }}>
              <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ margin: 0, color: '#065F46' }}>No Outstanding Balance</h3>
              <p style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>
                All academic terms and institutional fee dues have been fully settled. You have a zero balance.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1.25rem', background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B' }}>
                  <AlertTriangle size={18} />
                  <strong>Outstanding Fee Dues: Total ₹{summary.outstandingAmount.toLocaleString('en-IN')}</strong>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#991B1B' }}>
                  Please clear your dues prior to term exam registration.
                </span>
              </div>

              <ExcelTableContainer minWidth="880px">
                <ExcelTable>
                  <thead>
                    <tr>
                      <ExcelTh align="left" style={{ minWidth: '130px' }}>Semester</ExcelTh>
                      <ExcelTh align="center" style={{ minWidth: '110px' }}>Academic Year</ExcelTh>
                      <ExcelTh align="right" style={{ minWidth: '120px' }}>Total Fee</ExcelTh>
                      <ExcelTh align="right" style={{ minWidth: '110px' }}>Paid</ExcelTh>
                      <ExcelTh align="right" style={{ minWidth: '130px' }}>Outstanding Balance</ExcelTh>
                      <ExcelTh align="center" style={{ minWidth: '110px' }}>Due Date</ExcelTh>
                      <ExcelTh align="center" style={{ minWidth: '160px' }}>Action</ExcelTh>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingRows.map(row => (
                      <tr key={row.id}>
                        <ExcelTd align="left" bold color="var(--brand-navy, #0B192C)">{row.semesterName}</ExcelTd>
                        <ExcelTd align="center">{row.academicYear}</ExcelTd>
                        <ExcelTd align="right" bold>₹{row.totalFee.toLocaleString('en-IN')}</ExcelTd>
                        <ExcelTd align="right" bold color="#047857">₹{row.currentPaid.toLocaleString('en-IN')}</ExcelTd>
                        <ExcelTd align="right" bold color="#DC2626">₹{row.outstanding.toLocaleString('en-IN')}</ExcelTd>
                        <ExcelTd align="center">{row.dueDate}</ExcelTd>
                        <ExcelTd align="center">
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => {
                              setPaySemesterRow(row);
                              setPayAmount(row.outstanding);
                              setIsPayOnlineModalOpen(true);
                            }}
                            style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800 }}
                          >
                            Pay Online (₹{row.outstanding.toLocaleString('en-IN')})
                          </button>
                        </ExcelTd>
                      </tr>
                    ))}
                  </tbody>
                </ExcelTable>
              </ExcelTableContainer>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 2. Transaction Detail View Modal */}
      {viewingTxDetails && (
        <Modal
          isOpen={Boolean(viewingTxDetails)}
          onClose={() => setViewingTxDetails(null)}
          title="Payment Transaction Verification Record"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Receipt Number</span>
              <code>{viewingTxDetails.receiptNo}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Transaction Reference ID</span>
              <code>{viewingTxDetails.transactionId}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Payment Gateway / Bank</span>
              <strong>{viewingTxDetails.gatewayName || viewingTxDetails.bankName || 'HDFC Gateway'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Amount Paid</span>
              <strong style={{ color: '#047857' }}>₹{viewingTxDetails.paidAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Payment Status</span>
              {getTransactionStatusBadge(viewingTxDetails.status || 'SUCCESS')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Settlement Date</span>
              <span>{viewingTxDetails.paymentDate}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Raise Fee Query Modal */}
      {isFeeQueryModalOpen && (
        <FeeQueryModal
          isOpen={isFeeQueryModalOpen}
          onClose={() => setIsFeeQueryModalOpen(false)}
          onSuccess={() => {
            setIsFeeQueryModalOpen(false);
            if (onRefresh) onRefresh();
          }}
          defaultCategory={selectedRecordForQuery ? 'SEMESTER_FEE' : 'PAYMENT_ISSUE'}
        />
      )}

      {/* 4. Pay Online Modal */}
      {isPayOnlineModalOpen && paySemesterRow && (
        <Modal
          isOpen={isPayOnlineModalOpen}
          onClose={() => setIsPayOnlineModalOpen(false)}
          title={`Online Fee Payment — ${paySemesterRow.semesterName}`}
          maxWidth="520px"
        >
          {paySuccessMsg ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 0.5rem auto' }} />
              <h4 style={{ color: '#065F46' }}>{paySuccessMsg}</h4>
            </div>
          ) : (
            <form onSubmit={handleSimulatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.8125rem' }}>
                <div><strong>Student:</strong> {activeStudent.name} (<code>{activeStudent.enrollmentNo}</code>)</div>
                <div><strong>Semester:</strong> {paySemesterRow.semesterName} ({paySemesterRow.academicYear})</div>
                <div><strong>Outstanding Dues:</strong> <strong style={{ color: '#DC2626' }}>₹{paySemesterRow.outstanding.toLocaleString('en-IN')}</strong></div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Payment Amount (INR) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  min={1}
                  max={paySemesterRow.outstanding}
                  required
                  style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Select Payment Mode *</label>
                <select
                  className="form-control"
                  value={payPaymentMode}
                  onChange={e => setPayPaymentMode(e.target.value as any)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  <option value="ONLINE_UPI">UPI / QR (Google Pay, PhonePe, Paytm)</option>
                  <option value="NET_BANKING">Net Banking (All Indian Banks)</option>
                  <option value="DEBIT_CARD">Debit Card (Visa / Mastercard / RuPay)</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsPayOnlineModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800 }}>
                  Pay ₹{payAmount.toLocaleString('en-IN')}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

    </div>
  );
};
