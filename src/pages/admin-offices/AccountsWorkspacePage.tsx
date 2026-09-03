import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  FeeHead,
  FeeStructure,
  StudentFeeRecord,
  FeePaymentTransaction,
  ConcessionItem,
  RefundItem,
  PaymentReconciliationItem,
  NoteSheet,
  Student,
  Program,
  Semester,
} from '../../types';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../../components/receipt/receiptTypes';
import { Badge } from '../../components/common/Badge';
import {
  IndianRupee,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  ShieldAlert,
  Calendar,
  RotateCcw,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye,
  AlertCircle,
  XCircle,
  Building2,
  GraduationCap,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  CheckSquare,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileCheck,
  BarChart3,
  PieChart,
  HelpCircle,
  X,
} from 'lucide-react';
import { exportToExcel } from '../../services/exportService';

export type AccountsTabType =
  | 'DASHBOARD'
  | 'STUDENTS'
  | 'FEE_HEADS'
  | 'FEE_STRUCTURES'
  | 'FEE_ASSIGNMENT'
  | 'PAYMENTS'
  | 'RECEIPTS'
  | 'PENDING_FEES'
  | 'LATE_FEES'
  | 'REFUNDS'
  | 'CONCESSIONS'
  | 'RECONCILIATION'
  | 'NOTESHEETS'
  | 'REPORTS';

export interface AccountsWorkspacePageProps {
  initialTab?: AccountsTabType | string;
  initialRecordId?: string;
}

export const AccountsWorkspacePage: React.FC<AccountsWorkspacePageProps> = ({ initialTab = 'DASHBOARD', initialRecordId }) => {
  const { user, role } = useAuth();

  // 14 Module Sub-Tabs
  const [activeTab, setActiveTab] = useState<AccountsTabType>((initialTab as AccountsTabType) || 'DASHBOARD');

  useEffect(() => {
    if (initialTab) {
      setActiveTab((initialTab as AccountsTabType) || 'DASHBOARD');
    }
  }, [initialTab]);

  // Master Data State
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<FeePaymentTransaction[]>([]);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [reconciliations, setReconciliations] = useState<PaymentReconciliationItem[]>([]);
  const [notesheets, setNotesheets] = useState<NoteSheet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgFilter, setSelectedProgFilter] = useState('ALL');
  const [selectedSemFilter, setSelectedSemFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedReportType, setSelectedReportType] = useState('DAILY_COLLECTION');

  // Modal States
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [editingHead, setEditingHead] = useState<Partial<FeeHead> | null>(null);

  const [showStructureModal, setShowStructureModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<Partial<FeeStructure> | null>(null);

  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignForm, setBulkAssignForm] = useState({
    feeStructureId: '',
    programId: 'ALL',
    semesterId: 'ALL',
    academicYear: '2026-27',
  });
  const [bulkPreview, setBulkPreview] = useState<any>(null);

  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [concessionForm, setConcessionForm] = useState<Partial<ConcessionItem>>({
    studentId: '',
    concessionType: 'MERIT_SCHOLARSHIP',
    calculationType: 'FIXED',
    amount: 5000,
    reason: '',
    notesheetId: '',
  });

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState<Partial<RefundItem>>({
    studentId: '',
    originalAmount: 45000,
    refundAmount: 5000,
    reason: '',
    refundMode: 'ONLINE_UPI',
    notesheetId: '',
  });

  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [viewingLedgerStudentId, setViewingLedgerStudentId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = () => {
    setFeeHeads(db.getFeeHeads());
    setFeeStructures(db.getFeeStructures());
    setFeeRecords(db.getStudentFeeRecords());
    setPayments(db.getFeePaymentTransactions());
    setConcessions(db.getConcessions());
    setRefunds(db.getRefundsList());
    setReconciliations(db.getPaymentReconciliations());
    setNotesheets(db.getNoteSheets({ department: 'ACCOUNTS' } as any));
    setStudents(db.getStudents());
    setPrograms(db.getPrograms());
    setSemesters(db.getSemesters());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    return db.getAccountsDashboardStats();
  }, [feeRecords, payments, concessions, refunds, reconciliations]);

  // ── Handlers ──

  const handleSaveFeeHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHead?.code || !editingHead?.name) {
      showToast('error', 'Please provide Fee Code and Name.');
      return;
    }

    if (editingHead.id) {
      db.updateFeeHead(editingHead.id, editingHead);
      showToast('success', 'Fee Head updated.');
    } else {
      db.addFeeHead(editingHead as any);
      showToast('success', 'Fee Head created.');
    }
    setShowHeadModal(false);
    setEditingHead(null);
    loadAllData();
  };

  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructure?.name || !editingStructure?.programId) {
      showToast('error', 'Please provide structure name and program.');
      return;
    }

    if (editingStructure.id) {
      db.updateFeeStructure(editingStructure.id, editingStructure);
      showToast('success', 'Fee Structure updated.');
    } else {
      db.addFeeStructure(editingStructure as any);
      showToast('success', 'Fee Structure created.');
    }
    setShowStructureModal(false);
    setEditingStructure(null);
    loadAllData();
  };

  const handlePreviewBulkAssign = () => {
    if (!bulkAssignForm.feeStructureId) {
      showToast('error', 'Please select a fee structure first.');
      return;
    }
    const preview = db.previewBulkAssignFees(bulkAssignForm);
    if (preview.success) {
      setBulkPreview(preview);
    } else {
      showToast('error', preview.message || 'Failed to preview bulk fee assignment.');
    }
  };

  const handleExecuteBulkAssign = () => {
    const res = db.executeBulkAssignFees(bulkAssignForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowBulkAssignModal(false);
      setBulkPreview(null);
      loadAllData();
    } else {
      showToast('error', res.message);
    }
  };

  const handleCreateConcession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concessionForm.studentId || !concessionForm.amount) {
      showToast('error', 'Please select a student and specify concession amount.');
      return;
    }
    const res = db.createConcession(concessionForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowConcessionModal(false);
      loadAllData();
    } else {
      showToast('error', res.message);
    }
  };

  const handleCreateRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.studentId || !refundForm.refundAmount || !refundForm.reason) {
      showToast('error', 'Please select a student, specify refund amount and mandatory reason.');
      return;
    }
    const res = db.createRefundRequest(refundForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowRefundModal(false);
      loadAllData();
    } else {
      showToast('error', res.message);
    }
  };

  const handleReconcile = (id: string) => {
    const res = db.reconcilePaymentRecord(id, { reconciliationStatus: 'RECONCILED' }, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      loadAllData();
    }
  };

  const handleExportReports = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let headers: string[] = [];
    let rows: any[][] = [];

    if (selectedReportType === 'DAILY_COLLECTION') {
      headers = ['Receipt No', 'Student', 'Enrollment', 'Date', 'Payment Mode', 'Amount (₹)', 'Status'];
      rows = payments.map((p) => [
        p.receiptNo || 'N/A',
        p.studentName,
        p.enrollmentNo,
        p.paymentDate,
        p.paymentMode,
        p.paidAmount,
        p.status,
      ]);
    } else if (selectedReportType === 'PENDING_FEES') {
      headers = ['Student Name', 'Enrollment No', 'Program', 'Total Due (₹)', 'Paid (₹)', 'Pending (₹)', 'Status'];
      rows = feeRecords
        .filter((r) => r.pendingAmount > 0)
        .map((r) => [
          r.studentName,
          r.enrollmentNo,
          programs.find((p) => p.id === r.programId)?.name || 'N/A',
          r.totalAmount,
          r.paidAmount,
          r.pendingAmount,
          r.status,
        ]);
    } else if (selectedReportType === 'CONCESSION_REPORT') {
      headers = ['Concession No', 'Student Name', 'Enrollment No', 'Type', 'Amount (₹)', 'Reason', 'Status'];
      rows = concessions.map((c) => [
        c.concessionNo,
        c.studentName,
        c.enrollmentNo,
        c.concessionType,
        c.amount,
        c.reason,
        c.status,
      ]);
    } else if (selectedReportType === 'REFUND_REPORT') {
      headers = ['Refund No', 'Student Name', 'Enrollment No', 'Original (₹)', 'Refund (₹)', 'Reason', 'Status'];
      rows = refunds.map((r) => [
        r.refundNumber,
        r.studentName,
        r.enrollmentNo,
        r.originalAmount,
        r.refundAmount,
        r.reason,
        r.status,
      ]);
    } else {
      headers = ['Item', 'Amount (₹)', 'Status'];
      rows = feeRecords.map((r) => [r.studentName, r.pendingAmount, r.status]);
    }

    exportToExcel(
      `Accounts_Report_${selectedReportType}_${dateStr}`,
      headers,
      rows,
      { departmentName: 'Accounts & Financial Directorate' },
      {
        name: user?.name || 'Chief Accounts Officer',
        role: (role as any) || 'ACCOUNTS_ADMIN',
      }
    );
    showToast('success', `Exported ${selectedReportType} to Excel (.xlsx) successfully.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                <IndianRupee size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  University Accounts &amp; Financial Directorate
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Centralized Fee Heads, Automated Billing, Gateway Reconciliation, Concessions &amp; Immutable Ledgers
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setBulkAssignForm({
                  feeStructureId: feeStructures[0]?.id || '',
                  programId: 'ALL',
                  semesterId: 'ALL',
                  academicYear: '2026-27',
                });
                setBulkPreview(null);
                setShowBulkAssignModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} /> Bulk Fee Assignment
            </button>
            <button
              onClick={() => {
                setConcessionForm({
                  studentId: students[0]?.id || '',
                  concessionType: 'MERIT_SCHOLARSHIP',
                  calculationType: 'FIXED',
                  amount: 5000,
                  reason: '',
                  notesheetId: '',
                });
                setShowConcessionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Award size={16} /> Apply Concession
            </button>
            <button
              onClick={() => {
                setRefundForm({
                  studentId: students[0]?.id || '',
                  originalAmount: 45000,
                  refundAmount: 5000,
                  reason: '',
                  refundMode: 'ONLINE_UPI',
                  notesheetId: '',
                });
                setShowRefundModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw size={16} /> Process Refund
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (14 Modules) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none text-xs font-semibold">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
          { id: 'STUDENTS', label: 'Student Directory', icon: Users, count: students.length },
          { id: 'FEE_HEADS', label: 'Fee Heads', icon: Layers, count: feeHeads.length },
          { id: 'FEE_STRUCTURES', label: 'Fee Structures', icon: Building2, count: feeStructures.length },
          { id: 'FEE_ASSIGNMENT', label: 'Fee Assignment', icon: Plus, count: feeRecords.length },
          { id: 'PAYMENTS', label: 'Payments & Transactions', icon: CreditCard, count: payments.length },
          { id: 'RECEIPTS', label: 'Receipts', icon: FileCheck },
          { id: 'PENDING_FEES', label: 'Pending Fees', icon: AlertCircle },
          { id: 'LATE_FEES', label: 'Late Fees', icon: Clock },
          { id: 'REFUNDS', label: 'Refunds', icon: RotateCcw, count: refunds.length },
          { id: 'CONCESSIONS', label: 'Concessions / Scholarships', icon: Award, count: concessions.length },
          { id: 'RECONCILIATION', label: 'Payment Reconciliation', icon: CheckSquare, count: reconciliations.length },
          { id: 'NOTESHEETS', label: 'Notesheet', icon: FileText, count: notesheets.length },
          { id: 'REPORTS', label: 'Reports', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: DASHBOARD ─── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Fees Assigned</div>
              <div className="text-2xl font-black text-white">₹{dashboardStats.totalFeesAssigned.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Across {dashboardStats.totalStudents} enrolled students</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Fee Collected</div>
              <div className="text-2xl font-black text-emerald-400">₹{dashboardStats.totalCollected.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">{dashboardStats.collectionPercentage}% Realization rate</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Outstanding Dues</div>
              <div className="text-2xl font-black text-rose-400">₹{dashboardStats.totalPending.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-rose-400 font-medium mt-1">Pending fee collections</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Concessions &amp; Refunds</div>
              <div className="text-2xl font-black text-indigo-400">₹{(dashboardStats.totalConcessions + dashboardStats.totalRefunds).toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">₹{dashboardStats.totalConcessions.toLocaleString('en-IN')} concessions / ₹{dashboardStats.totalRefunds.toLocaleString('en-IN')} refunds</div>
            </div>
          </div>

          {/* Quick Collection Overview */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-400" /> Recent Payment Transactions &amp; Receipts
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Enrollment</th>
                    <th className="px-4 py-3">Amount (₹)</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">{p.receiptNo || 'N/A'}</td>
                      <td className="px-4 py-3 font-semibold text-white">{p.studentName}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 text-xs">{p.enrollmentNo}</td>
                      <td className="px-4 py-3 font-mono text-white font-bold">₹{p.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-400">{p.paymentMode}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.paymentDate}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success">CONFIRMED</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: STUDENTS ─── */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search students by name, enrollment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Enrollment No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Program &amp; Sem</th>
                  <th className="px-4 py-3">Fee Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students
                  .filter(
                    (s) =>
                      !searchTerm ||
                      s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((s) => {
                    const feeRec = feeRecords.find((r) => r.studentId === s.id);
                    const sem = semesters.find((sm) => sm.id === s.semesterId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">{s.enrollmentNo}</td>
                        <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          {programs.find((p) => p.id === s.programId)?.name} • {sem ? `Semester ${sem.number}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={feeRec?.status === 'PAID' ? 'success' : 'warning'}>
                            {feeRec?.status || 'PENDING'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewingLedgerStudentId(s.id)}
                            className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all"
                          >
                            View Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: FEE HEADS ─── */}
      {activeTab === 'FEE_HEADS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">University Fee Heads Directory</h3>
              <p className="text-xs text-slate-400">16 standard core fee heads across academic, hostel, transport, and examination categories</p>
            </div>
            <button
              onClick={() => {
                setEditingHead({
                  code: '',
                  name: '',
                  category: 'ACADEMIC',
                  defaultAmount: 5000,
                  isMandatory: true,
                  isActive: true,
                });
                setShowHeadModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Add Fee Head
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Fee Code</th>
                  <th className="px-4 py-3">Fee Head Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Default (₹)</th>
                  <th className="px-4 py-3">Mandatory</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {feeHeads.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{h.code}</td>
                    <td className="px-4 py-3 font-semibold text-white">{h.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{h.category}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">₹{(h.defaultAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-400">{h.isMandatory ? 'Yes' : 'Optional'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={h.isActive ? 'success' : 'inactive'}>{h.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: FEE STRUCTURES ─── */}
      {activeTab === 'FEE_STRUCTURES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Program Fee Structures</h3>
              <p className="text-xs text-slate-400">Semester-wise standard &amp; international student fee templates</p>
            </div>
            <button
              onClick={() => {
                setEditingStructure({
                  name: '',
                  programId: programs[0]?.id || '',
                  semesterId: semesters[0]?.id || '',
                  academicYearCode: '2026-27',
                  totalAmount: 60000,
                  status: 'ACTIVE',
                });
                setShowStructureModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Create Structure
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Structure Code</th>
                  <th className="px-4 py-3">Structure Name</th>
                  <th className="px-4 py-3">Program &amp; Sem</th>
                  <th className="px-4 py-3">Academic Year</th>
                  <th className="px-4 py-3">Total Amount (₹)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {feeStructures.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{s.structureCode || 'FS-GEN'}</td>
                    <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {programs.find((p) => p.id === s.programId)?.name} • {semesters.find((sem) => sem.id === s.semesterId)?.code || 'Semester'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{s.academicYearCode}</td>
                    <td className="px-4 py-3 font-mono text-white font-bold">₹{s.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'inactive'}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: FEE ASSIGNMENT ─── */}
      {activeTab === 'FEE_ASSIGNMENT' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search fee assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              />
            </div>
            <button
              onClick={() => {
                setBulkAssignForm({
                  feeStructureId: feeStructures[0]?.id || '',
                  programId: 'ALL',
                  semesterId: 'ALL',
                  academicYear: '2026-27',
                });
                setBulkPreview(null);
                setShowBulkAssignModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Bulk Fee Assignment
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment No</th>
                  <th className="px-4 py-3">Assigned Structure</th>
                  <th className="px-4 py-3">Total Due (₹)</th>
                  <th className="px-4 py-3">Paid (₹)</th>
                  <th className="px-4 py-3">Pending (₹)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {feeRecords
                  .filter(
                    (r) =>
                      !searchTerm ||
                      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.enrollmentNo.includes(searchTerm)
                  )
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-semibold text-white">{r.studentName}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-xs">{r.enrollmentNo}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{r.feeStructureName}</td>
                      <td className="px-4 py-3 font-mono text-white font-bold">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">₹{r.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-rose-400 font-bold">₹{r.pendingAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === 'PAID' ? 'success' : 'warning'}>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PAYMENTS ─── */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Payment Transactions &amp; Settlement Log</h3>
            <p className="text-xs text-slate-400">Immutable record of online gateway, UPI, and manual bank transfer collections</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment No</th>
                  <th className="px-4 py-3">Amount (₹)</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{p.receiptNo || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{p.enrollmentNo}</td>
                    <td className="px-4 py-3 font-mono text-white font-bold">₹{p.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-400">{p.paymentMode}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.paymentDate}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">CONFIRMED</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 7: RECEIPTS ─── */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Official University Payment Receipts</h3>
            <p className="text-xs text-slate-400">Sequential receipt records generated under format SSIU/REC/YYYY-YY/XXXXXX</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Receipt Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{p.receiptNo || 'SSIU/REC/2026-27/000001'}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{p.enrollmentNo}</td>
                    <td className="px-4 py-3 font-mono text-white font-bold">₹{p.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(p))}
                        className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        PDF Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 8: PENDING FEES ─── */}
      {activeTab === 'PENDING_FEES' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Outstanding &amp; Overdue Fees Roster</h3>
            <p className="text-xs text-slate-400">Students with outstanding fee balances and overdue milestones</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment No</th>
                  <th className="px-4 py-3">Assigned Total (₹)</th>
                  <th className="px-4 py-3">Paid (₹)</th>
                  <th className="px-4 py-3">Pending Amount (₹)</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {feeRecords
                  .filter((r) => r.pendingAmount > 0)
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-semibold text-white">{r.studentName}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-xs">{r.enrollmentNo}</td>
                      <td className="px-4 py-3 font-mono text-white font-bold">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">₹{r.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-rose-400 font-bold">₹{r.pendingAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-xs">{r.dueDate}</td>
                      <td className="px-4 py-3">
                        <Badge variant="warning">{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 9: LATE FEES ─── */}
      {activeTab === 'LATE_FEES' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Configurable Late Fee Calculation Rules</h3>
            <p className="text-xs text-slate-400">Automated late fee penalties computed securely on the backend</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Standard Academic Late Fee</div>
              <div className="text-xl font-bold text-white mb-2">₹50 / Day</div>
              <div className="text-xs text-slate-400">Applies after 7-day grace period from invoice due date. Max cap: ₹2,500.</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Late Exam Form Penalty</div>
              <div className="text-xl font-bold text-white mb-2">₹500 Fixed</div>
              <div className="text-xs text-slate-400">Applies for late examination form submissions within supplementary window.</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Hostel &amp; Transport Surcharge</div>
              <div className="text-xl font-bold text-white mb-2">5% Outstanding</div>
              <div className="text-xs text-slate-400">Levied on hostel and transport term balances overdue by &gt;15 days.</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 10: REFUNDS ─── */}
      {activeTab === 'REFUNDS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Fee Refund &amp; Reversal Processing</h3>
              <p className="text-xs text-slate-400">Multi-tier verified refund requests with immutable original payment preservation</p>
            </div>
            <button
              onClick={() => {
                setRefundForm({
                  studentId: students[0]?.id || '',
                  originalAmount: 45000,
                  refundAmount: 5000,
                  reason: '',
                  refundMode: 'ONLINE_UPI',
                  notesheetId: '',
                });
                setShowRefundModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              <RotateCcw size={16} /> Process Refund
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Refund No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Refund Amount (₹)</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-rose-400">{r.refundNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{r.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{r.enrollmentNo}</td>
                    <td className="px-4 py-3 font-mono text-rose-400 font-bold">₹{r.refundAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{r.reason}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{r.refundReference || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 11: CONCESSIONS ─── */}
      {activeTab === 'CONCESSIONS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Student Scholarships, Concessions &amp; Waivers</h3>
              <p className="text-xs text-slate-400">Merit scholarships, need-based fee discounts, and staff ward fee adjustments</p>
            </div>
            <button
              onClick={() => {
                setConcessionForm({
                  studentId: students[0]?.id || '',
                  concessionType: 'MERIT_SCHOLARSHIP',
                  calculationType: 'FIXED',
                  amount: 5000,
                  reason: '',
                  notesheetId: '',
                });
                setShowConcessionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              <Award size={16} /> Apply Concession
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Concession No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Concession Type</th>
                  <th className="px-4 py-3">Amount (₹)</th>
                  <th className="px-4 py-3">Approved By</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {concessions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{c.concessionNo}</td>
                    <td className="px-4 py-3 font-semibold text-white">{c.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{c.enrollmentNo}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{c.concessionType}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">₹{c.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{c.approvedBy}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 12: RECONCILIATION ─── */}
      {activeTab === 'RECONCILIATION' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Payment Gateway &amp; Bank Settlement Reconciliation</h3>
            <p className="text-xs text-slate-400">Automated mismatch detection between gateway transaction logs and ERP ledger</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Reconciliation No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Gateway Payment ID</th>
                  <th className="px-4 py-3">Gateway Amt (₹)</th>
                  <th className="px-4 py-3">ERP Amt (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{rec.reconciliationNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{rec.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{rec.gatewayPaymentId || 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">₹{(rec.gatewayAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">₹{(rec.erpAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rec.reconciliationStatus === 'MATCHED' || rec.reconciliationStatus === 'RECONCILED' ? 'success' : 'warning'}>
                        {rec.reconciliationStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rec.reconciliationStatus !== 'RECONCILED' && (
                        <button
                          onClick={() => handleReconcile(rec.id)}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Mark Reconciled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 13: NOTESHEETS ─── */}
      {activeTab === 'NOTESHEETS' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Accounts Directorate Notesheet Approvals</h3>
            <p className="text-xs text-slate-400">Institutional Notesheets for fee structure approvals, large concessions &amp; budget sanctions</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Note Sheet No</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Initiated By</th>
                  <th className="px-4 py-3">Current Office</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {notesheets.map((ns) => (
                  <tr key={ns.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{ns.noteSheetNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{ns.subject}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{ns.creatorName}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{ns.currentOffice}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ns.status === 'APPROVED' ? 'success' : 'warning'}>{ns.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{ns.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 14: REPORTS ─── */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Accounts &amp; Financial Reporting Center</h3>
              <p className="text-xs text-slate-400">Generate and export 14 standard university accounts reports in official .xlsx format</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold"
              >
                <option value="DAILY_COLLECTION">1. Daily Collection Summary</option>
                <option value="MONTHLY_COLLECTION">2. Monthly Collection Report</option>
                <option value="FEE_HEAD_COLLECTION">3. Fee Head Realization</option>
                <option value="PENDING_FEES">4. Outstanding Pending Fees</option>
                <option value="OVERDUE_FEES">5. Overdue Fees Report</option>
                <option value="PAYMENT_TRANSACTIONS">6. Payment Transactions</option>
                <option value="FAILED_PAYMENTS">7. Failed Payment Transactions</option>
                <option value="REFUND_REPORT">8. Refunds &amp; Reversals</option>
                <option value="CONCESSION_REPORT">9. Scholarships &amp; Concessions</option>
                <option value="INTERNATIONAL_STUDENT_REPORT">10. International Student Fees</option>
                <option value="INSTITUTE_COLLECTION">11. Institute-wise Collection</option>
                <option value="DEPARTMENT_COLLECTION">12. Department-wise Collection</option>
                <option value="ACADEMIC_YEAR_COLLECTION">13. Academic Year Collection</option>
                <option value="STUDENT_LEDGER">14. Student Ledger Register</option>
              </select>
              <button
                onClick={handleExportReports}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                <Download size={15} /> Export Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BULK ASSIGN MODAL ─── */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="text-emerald-400" size={20} /> Bulk Fee Assignment
              </h3>
              <button onClick={() => setShowBulkAssignModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Fee Structure</label>
                <select
                  value={bulkAssignForm.feeStructureId}
                  onChange={(e) => setBulkAssignForm({ ...bulkAssignForm, feeStructureId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="">-- Select Structure --</option>
                  {feeStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.totalAmount.toLocaleString('en-IN')}) - {s.academicYearCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Filter Program</label>
                  <select
                    value={bulkAssignForm.programId}
                    onChange={(e) => setBulkAssignForm({ ...bulkAssignForm, programId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="ALL">All Programs</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Filter Semester</label>
                  <select
                    value={bulkAssignForm.semesterId}
                    onChange={(e) => setBulkAssignForm({ ...bulkAssignForm, semesterId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="ALL">All Semesters</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.code || `Sem ${s.number}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreviewBulkAssign}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700"
              >
                Generate Preview Metrics
              </button>

              {bulkPreview && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white">Preview Summary:</div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <div className="text-slate-400">Students Selected</div>
                      <div className="text-sm font-bold text-white">{bulkPreview.studentsSelected}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <div className="text-slate-400">Already Assigned</div>
                      <div className="text-sm font-bold text-amber-400">{bulkPreview.alreadyAssigned}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <div className="text-slate-400">New Assignments</div>
                      <div className="text-sm font-bold text-emerald-400">{bulkPreview.newAssignments}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bulkPreview || bulkPreview.newAssignments === 0}
                  onClick={handleExecuteBulkAssign}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONCESSION MODAL ─── */}
      {showConcessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="text-emerald-400" size={20} /> Apply Scholarship / Concession
              </h3>
              <button onClick={() => setShowConcessionModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateConcession} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Student</label>
                <select
                  value={concessionForm.studentId}
                  onChange={(e) => setConcessionForm({ ...concessionForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrollmentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Concession Type</label>
                  <select
                    value={concessionForm.concessionType}
                    onChange={(e) => setConcessionForm({ ...concessionForm, concessionType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="MERIT_SCHOLARSHIP">Merit Scholarship</option>
                    <option value="NEED_BASED_CONCESSION">Need-Based Concession</option>
                    <option value="SIBLING_DISCOUNT">Sibling Discount</option>
                    <option value="STAFF_WARD">Staff Ward Waiver</option>
                    <option value="SPECIAL_WAIVER">Special University Waiver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={concessionForm.amount || 0}
                    onChange={(e) => setConcessionForm({ ...concessionForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason / Justification</label>
                <textarea
                  value={concessionForm.reason || ''}
                  onChange={(e) => setConcessionForm({ ...concessionForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  placeholder="Official reason for concession approval..."
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConcessionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Apply Concession
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REFUND MODAL ─── */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCcw className="text-rose-400" size={20} /> Process Fee Refund
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Student</label>
                <select
                  value={refundForm.studentId}
                  onChange={(e) => setRefundForm({ ...refundForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrollmentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={refundForm.refundAmount || 0}
                    onChange={(e) => setRefundForm({ ...refundForm, refundAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Refund Mode</label>
                  <select
                    value={refundForm.refundMode}
                    onChange={(e) => setRefundForm({ ...refundForm, refundMode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="ONLINE_UPI">Online UPI</option>
                    <option value="NET_BANKING">Net Banking / NEFT</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mandatory Refund Reason</label>
                <textarea
                  value={refundForm.reason || ''}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  placeholder="Official reason for reversal/refund..."
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── STUDENT LEDGER MODAL ─── */}
      {viewingLedgerStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="text-emerald-400" size={20} /> Student Financial Ledger
                </h3>
                <p className="text-xs text-slate-400">Complete chronological audit trail of all fees, payments, and concessions</p>
              </div>
              <button onClick={() => setViewingLedgerStudentId(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {(() => {
              const summary = db.getStudentLedgerSummary(viewingLedgerStudentId);
              if (!summary) return <div>No ledger details available.</div>;
              return (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-slate-400">Student Name</div>
                      <div className="font-bold text-white">{summary.studentName} ({summary.enrollmentNo})</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Total Fees Assigned</div>
                      <div className="font-mono text-white font-bold">₹{summary.totalFeesAssigned.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Closing Balance Due</div>
                      <div className="font-mono text-rose-400 font-bold">₹{summary.closingBalance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800 text-slate-400 uppercase">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Reference</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Debit (₹)</th>
                          <th className="px-3 py-2">Credit (₹)</th>
                          <th className="px-3 py-2">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {summary.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-400">{entry.date}</td>
                            <td className="px-3 py-2 font-mono text-indigo-400">{entry.referenceNo}</td>
                            <td className="px-3 py-2 text-white">{entry.description}</td>
                            <td className="px-3 py-2 font-mono text-rose-400">{entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="px-3 py-2 font-mono text-emerald-400">{entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="px-3 py-2 font-mono font-bold text-white">₹{entry.balance.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
