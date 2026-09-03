import React, { useState, useMemo, useRef } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, Download, Printer, Search, RotateCcw,
  Plus, Upload, Shield, CheckCircle2,
  X, ChevronLeft, ChevronRight, Eye, Edit3, ArrowUpDown, ArrowUp, ArrowDown,
  Clock
} from 'lucide-react';
import {
  notesheetFinancialReportService,
  NoteSheetFinancialRecord,
  FinancialAuditLogItem
} from '../../services/notesheetFinancialReportService';

export const NoteSheetReportsTab: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Financial Report Tab
  const [financialReportTab, setFinancialReportTab] = useState<
    'NOTE_SHEET_FINANCIAL' | 'INCOME' | 'EXPENSE' | 'FUND_BALANCE' |
    'CATEGORY_EXPENSE' | 'VENDOR_EXPENSE' | 'PAYMENT_MODE' | 'REIMBURSEMENT'
  >('NOTE_SHEET_FINANCIAL');

  // Filters State
  const [searchKeywords, setSearchKeywords] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Sorting & Pagination State
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Modals & Drawers State
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<NoteSheetFinancialRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NoteSheetFinancialRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTargetId, setAuditTargetId] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formNotesheetNumber, setFormNotesheetNumber] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDepartment, setFormDepartment] = useState('Computer Engineering');
  const [formSubject, setFormSubject] = useState('');
  const [formCreator, setFormCreator] = useState(user?.name || 'Dr. Rajesh Patel');
  const [formFundHead, setFormFundHead] = useState('University General Fund');
  const [formBudget, setFormBudget] = useState<number>(100000);
  const [formReceived, setFormReceived] = useState<number>(100000);
  const [formSpent, setFormSpent] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('Academic');
  const [formVendor, setFormVendor] = useState('Central University Stores');
  const [formPaymentMode, setFormPaymentMode] = useState('Bank Transfer');
  const [formStatus, setFormStatus] = useState<NoteSheetFinancialRecord['status']>('COMPLETED');
  const [formRemarks, setFormRemarks] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    success: boolean;
    validRows: NoteSheetFinancialRecord[];
    invalidRows: Array<{ row: number; data: any; error: string }>;
    totalRows: number;
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Fresh Data Refresh Trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Central DB data
  const rawFinancialRecords = useMemo(() => {
    return notesheetFinancialReportService.getAllFinancialRecords();
  }, [refreshKey]);

  const fundAccounts = useMemo(() => db.getFundAccounts(), []);
  const receipts = useMemo(() => db.getMoneyReceived(), []);
  const expenses = useMemo(() => db.getExpenses(), []);
  const reimbursements = useMemo(() => db.getReimbursements(), []);

  // Filtered NoteSheet Financial Records
  const filteredFinancialRecords = useMemo(() => {
    const q = searchKeywords.toLowerCase().trim();

    return rawFinancialRecords.filter(r => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (selectedExpenseCategory !== 'ALL' && r.expenseCategory !== selectedExpenseCategory) return false;
      if (selectedPaymentMode !== 'ALL' && r.paymentMode !== selectedPaymentMode) return false;
      if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;

      if (q) {
        const matchNumber = r.noteSheetNumber.toLowerCase().includes(q);
        const matchSubject = r.subject.toLowerCase().includes(q);
        const matchVendor = r.vendor.toLowerCase().includes(q);
        const matchCreator = r.creator.toLowerCase().includes(q);
        const matchDept = r.department.toLowerCase().includes(q);
        if (!matchNumber && !matchSubject && !matchVendor && !matchCreator && !matchDept) return false;
      }

      return true;
    }).sort((a, b) => {
      let aVal: any = (a as any)[sortColumn];
      let bVal: any = (b as any)[sortColumn];

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [rawFinancialRecords, searchKeywords, fromDate, toDate, selectedExpenseCategory, selectedPaymentMode, selectedStatusFilter, sortColumn, sortDirection]);

  // Paginated Financial Records
  const paginatedFinancialRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFinancialRecords.slice(start, start + rowsPerPage);
  }, [filteredFinancialRecords, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredFinancialRecords.length / rowsPerPage) || 1;

  // Financial Totals
  const financialTotals = useMemo(() => {
    const totalBudget = filteredFinancialRecords.reduce((sum, r) => sum + (r.budget || 0), 0);
    const totalReceived = filteredFinancialRecords.reduce((sum, r) => sum + (r.received || 0), 0);
    const totalSpent = filteredFinancialRecords.reduce((sum, r) => sum + (r.spent || 0), 0);
    const totalBalance = totalReceived - totalSpent;
    const overallUtilization = totalReceived > 0 ? (totalSpent / totalReceived) * 100 : (totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0);

    return { totalBudget, totalReceived, totalSpent, totalBalance, overallUtilization };
  }, [filteredFinancialRecords]);

  // Handle Sort Change
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchKeywords('');
    setFromDate('');
    setToDate('');
    setSelectedExpenseCategory('ALL');
    setSelectedPaymentMode('ALL');
    setSelectedStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormNotesheetNumber(`SSIU-NS-${new Date().getFullYear()}-${String(rawFinancialRecords.length + 1).padStart(4, '0')}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDepartment('Computer Engineering');
    setFormSubject('');
    setFormCreator(user?.name || 'Dr. Rajesh Patel');
    setFormFundHead('University General Fund');
    setFormBudget(100000);
    setFormReceived(100000);
    setFormSpent(0);
    setFormCategory('Academic');
    setFormVendor('Central University Stores');
    setFormPaymentMode('Bank Transfer');
    setFormStatus('COMPLETED');
    setFormRemarks('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: NoteSheetFinancialRecord) => {
    setEditingRecord(rec);
    setFormNotesheetNumber(rec.noteSheetNumber);
    setFormDate(rec.date);
    setFormDepartment(rec.department);
    setFormSubject(rec.subject);
    setFormCreator(rec.creator);
    setFormFundHead(rec.fundHead);
    setFormBudget(rec.budget);
    setFormReceived(rec.received);
    setFormSpent(rec.spent);
    setFormCategory(rec.expenseCategory);
    setFormVendor(rec.vendor);
    setFormPaymentMode(rec.paymentMode);
    setFormStatus(rec.status);
    setFormRemarks(rec.remarks || '');
    setIsCreateModalOpen(true);
  };

  // Save Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNotesheetNumber || !formSubject) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    notesheetFinancialReportService.saveFinancialRecord({
      id: editingRecord?.id,
      noteSheetNumber: formNotesheetNumber,
      date: formDate,
      department: formDepartment,
      subject: formSubject,
      creator: formCreator,
      fundHead: formFundHead,
      budget: Number(formBudget) || 0,
      received: Number(formReceived) || 0,
      spent: Number(formSpent) || 0,
      expenseCategory: formCategory,
      vendor: formVendor,
      paymentMode: formPaymentMode,
      status: formStatus,
      remarks: formRemarks
    }, user);

    setIsCreateModalOpen(false);
    setRefreshKey(prev => prev + 1);
    if (selectedRecordForDetail && selectedRecordForDetail.id === editingRecord?.id) {
      setSelectedRecordForDetail(notesheetFinancialReportService.getFinancialRecordById(selectedRecordForDetail.id) || null);
    }
  };

  // Handle File Selection for Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportLoading(true);
    const preview = await notesheetFinancialReportService.parseAndValidateImport(file);
    setImportPreview(preview);
    setImportLoading(false);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importPreview || importPreview.validRows.length === 0) return;

    const count = notesheetFinancialReportService.commitImport(importPreview.validRows, user);
    alert(`Successfully imported ${count} financial record(s).`);
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreview(null);
    setRefreshKey(prev => prev + 1);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Selection toggle
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredFinancialRecords.map(r => r.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Export Trigger
  const handleExportXLSX = () => {
    const recordsToExport = selectedRowIds.length > 0
      ? filteredFinancialRecords.filter(r => selectedRowIds.includes(r.id))
      : filteredFinancialRecords;
    notesheetFinancialReportService.exportFinancialsToExcel(recordsToExport, `Found ${recordsToExport.length} Notesheets`);
  };

  const handleExportCSV = () => {
    const recordsToExport = selectedRowIds.length > 0
      ? filteredFinancialRecords.filter(r => selectedRowIds.includes(r.id))
      : filteredFinancialRecords;
    notesheetFinancialReportService.exportFinancialsToCSV(recordsToExport);
  };

  // Calculations for other tabs
  const incomeRecords = useMemo(() => {
    const q = searchKeywords.toLowerCase().trim();
    return receipts.filter(r => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (selectedPaymentMode !== 'ALL' && r.paymentMode !== selectedPaymentMode) return false;
      if (q && !(r.noteSheetNumber.toLowerCase().includes(q) || r.source.toLowerCase().includes(q) || r.referenceNo.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [receipts, fromDate, toDate, selectedPaymentMode, searchKeywords]);

  const expenseRecords = useMemo(() => {
    const q = searchKeywords.toLowerCase().trim();
    return expenses.filter(e => {
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      if (selectedExpenseCategory !== 'ALL' && e.category !== selectedExpenseCategory) return false;
      if (selectedPaymentMode !== 'ALL' && e.paymentMode !== selectedPaymentMode) return false;
      if (q && !(e.noteSheetNumber.toLowerCase().includes(q) || e.itemName.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [expenses, fromDate, toDate, selectedExpenseCategory, selectedPaymentMode, searchKeywords]);

  const categoryExpenses = useMemo(() => {
    const map: Record<string, { count: number; budget: number; spent: number }> = {};
    rawFinancialRecords.forEach(r => {
      const cat = r.expenseCategory || 'General';
      if (!map[cat]) map[cat] = { count: 0, budget: 0, spent: 0 };
      map[cat].count += 1;
      map[cat].budget += r.budget;
      map[cat].spent += r.spent;
    });
    return Object.entries(map).map(([category, d]) => ({
      category,
      count: d.count,
      budget: d.budget,
      spent: d.spent,
      balance: d.budget - d.spent,
      utilization: d.budget > 0 ? (d.spent / d.budget) * 100 : 0
    }));
  }, [rawFinancialRecords]);

  const vendorExpenses = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    rawFinancialRecords.forEach(r => {
      const v = r.vendor || 'Direct / Miscellaneous';
      if (!map[v]) map[v] = { count: 0, total: 0 };
      map[v].count += 1;
      map[v].total += r.spent;
    });
    return Object.entries(map).map(([vendor, d]) => ({
      vendor,
      bills: d.count,
      total: d.total,
      paid: d.total,
      pending: 0
    })).sort((a, b) => b.total - a.total);
  }, [rawFinancialRecords]);

  const paymentModeData = useMemo(() => {
    const map: Record<string, { inAmt: number; outAmt: number; count: number }> = {};
    rawFinancialRecords.forEach(r => {
      const mode = r.paymentMode || 'Bank Transfer';
      if (!map[mode]) map[mode] = { inAmt: 0, outAmt: 0, count: 0 };
      map[mode].inAmt += r.received;
      map[mode].outAmt += r.spent;
      map[mode].count += 1;
    });
    return Object.entries(map).map(([mode, d]) => ({
      mode,
      transactions: d.count,
      inflow: d.inAmt,
      outflow: d.outAmt,
      netFlow: d.inAmt - d.outAmt
    }));
  }, [rawFinancialRecords]);

  const reimbursementRecords = useMemo(() => {
    const q = searchKeywords.toLowerCase().trim();
    return reimbursements.filter(r => {
      if (fromDate && r.expenseDate < fromDate) return false;
      if (toDate && r.expenseDate > toDate) return false;
      if (selectedExpenseCategory !== 'ALL' && r.category !== selectedExpenseCategory) return false;
      if (q && !(r.applicantName.toLowerCase().includes(q) || r.noteSheetNumber.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [reimbursements, fromDate, toDate, selectedExpenseCategory, searchKeywords]);

  return (
    <div className="financial-reports-engine space-y-6">

      {/* ─── SECTION 1: HEADER & PRIMARY ACTION CONTROLS ───────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Financial &amp; Fund Accounts Reports Engine
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Official statutory fund movements, expense statement reconciliations, voucher tracking &amp; audit ledgers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Financial Record</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-300 dark:border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 hidden group-hover:block z-30">
              <button
                onClick={handleExportXLSX}
                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" /> Export as Excel (.xlsx)
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" /> Export as CSV (.csv)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuditTargetId(null);
              setIsAuditModalOpen(true);
            }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
            title="View Financial Audit Trail"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* ─── SECTION 2: 8 FINANCIAL REPORT NAVIGATION TABS ─────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'NOTE_SHEET_FINANCIAL', label: 'Note Sheet Financials', count: filteredFinancialRecords.length },
            { id: 'INCOME', label: 'Income & Receipts', count: incomeRecords.length },
            { id: 'EXPENSE', label: 'Expenses & Bills', count: expenseRecords.length },
            { id: 'FUND_BALANCE', label: 'Fund Balances', count: fundAccounts.length },
            { id: 'CATEGORY_EXPENSE', label: 'Category-wise Expenses', count: categoryExpenses.length },
            { id: 'VENDOR_EXPENSE', label: 'Vendor-wise Expenses', count: vendorExpenses.length },
            { id: 'PAYMENT_MODE', label: 'Payment Mode Report', count: paymentModeData.length },
            { id: 'REIMBURSEMENT', label: 'Reimbursements', count: reimbursementRecords.length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFinancialReportTab(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                financialReportTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                financialReportTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── SECTION 3: MULTI-CRITERIA FILTER PANEL ───────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Search Keywords */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Search Keywords
            </label>
            <input
              type="text"
              placeholder="Search ref, vendor, subject..."
              value={searchKeywords}
              onChange={e => {
                setSearchKeywords(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* 2. From Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 3. To Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 4. Expense Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Expense Category
            </label>
            <select
              value={selectedExpenseCategory}
              onChange={e => {
                setSelectedExpenseCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Events">Events</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Technology">Technology</option>
              <option value="Research">Research</option>
              <option value="Administration">Administration</option>
              <option value="Student Welfare">Student Welfare</option>
            </select>
          </div>

          {/* 5. Payment Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Payment Mode
            </label>
            <select
              value={selectedPaymentMode}
              onChange={e => {
                setSelectedPaymentMode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Records Showing: <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredFinancialRecords.length}</strong> of {rawFinancialRecords.length}
            </span>
            {selectedRowIds.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-bold">
                {selectedRowIds.length} Selected
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold transition hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 4: EXCEL-STYLE DATA TABLE (FOR ACTIVE TAB) ─────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* ── 1. NOTE SHEET FINANCIALS TAB ── */}
        {financialReportTab === 'NOTE_SHEET_FINANCIAL' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              {/* Sticky Navy Blue Header */}
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10 select-none">
                <tr>
                  <th className="p-3 w-10 text-center border-r border-blue-900/60">
                    <input
                      type="checkbox"
                      checked={
                        filteredFinancialRecords.length > 0 &&
                        filteredFinancialRecords.every(r => selectedRowIds.includes(r.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('noteSheetNumber')}
                    className="p-3 cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>NOTE SHEET NO.</span>
                      {sortColumn === 'noteSheetNumber' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="p-3 cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>DATE</span>
                      {sortColumn === 'date' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('department')}
                    className="p-3 cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>DEPARTMENT</span>
                      {sortColumn === 'department' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th className="p-3 border-r border-blue-900/60 min-w-[280px]">
                    <span>SUBJECT</span>
                  </th>
                  <th
                    onClick={() => handleSort('creator')}
                    className="p-3 cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>CREATOR</span>
                      {sortColumn === 'creator' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('budget')}
                    className="p-3 text-right cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>BUDGET (₹)</span>
                      {sortColumn === 'budget' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('received')}
                    className="p-3 text-right cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap text-emerald-300"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>RECEIVED (₹)</span>
                      {sortColumn === 'received' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('spent')}
                    className="p-3 text-right cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap text-rose-300"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>SPENT (₹)</span>
                      {sortColumn === 'spent' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('balance')}
                    className="p-3 text-right cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap text-amber-300"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>BALANCE (₹)</span>
                      {sortColumn === 'balance' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('utilization')}
                    className="p-3 text-center cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>UTILIZATION</span>
                      {sortColumn === 'utilization' ? (sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th className="p-3 text-center whitespace-nowrap">
                    <span>STATUS</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedFinancialRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-10 text-center text-slate-500 font-semibold">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      No matching financial notesheet records found.
                    </td>
                  </tr>
                ) : (
                  paginatedFinancialRecords.map((r, idx) => {
                    const isSelected = selectedRowIds.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedRecordForDetail(r)}
                        className={`cursor-pointer transition border-b border-slate-100 dark:border-slate-800/80 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40'
                            : idx % 2 === 1
                            ? 'bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <td
                          className="p-3 text-center border-r border-slate-200/60 dark:border-slate-800/60"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(r.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {r.noteSheetNumber}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-200 font-semibold border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {r.department}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200/60 dark:border-slate-800/60 min-w-[280px]">
                          {r.subject}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {r.creator}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap font-mono">
                          ₹{r.budget.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap font-mono">
                          ₹{r.received.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap font-mono">
                          ₹{r.spent.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-black text-[#001F3F] dark:text-blue-300 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap font-mono">
                          ₹{r.balance.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {r.utilization.toFixed(2)}%
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            r.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300'
                              : r.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Dynamic Excel Footer Summary */}
              {filteredFinancialRecords.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  <tr>
                    <td colSpan={6} className="p-3 text-right font-black tracking-wide border-r border-slate-300 dark:border-slate-700">
                      TOTAL SUMMARY ({filteredFinancialRecords.length} Records):
                    </td>
                    <td className="p-3 text-right font-black font-mono border-r border-slate-300 dark:border-slate-700">
                      ₹{financialTotals.totalBudget.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                      ₹{financialTotals.totalReceived.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-black font-mono text-rose-600 dark:text-rose-400 border-r border-slate-300 dark:border-slate-700">
                      ₹{financialTotals.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-black font-mono text-[#001F3F] dark:text-blue-300 border-r border-slate-300 dark:border-slate-700">
                      ₹{financialTotals.totalBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-center font-black text-amber-600 dark:text-amber-400 border-r border-slate-300 dark:border-slate-700">
                      {financialTotals.overallUtilization.toFixed(2)}%
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── 2. INCOME & RECEIPTS TAB ── */}
        {financialReportTab === 'INCOME' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Source / Payee</th>
                  <th className="p-3">Fund Head</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Payment Mode</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {incomeRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-600">{r.referenceNo || r.id}</td>
                    <td className="p-3">{r.date}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{r.source}</td>
                    <td className="p-3">{r.bankAccountName}</td>
                    <td className="p-3">{r.remarks || `Notesheet #${r.noteSheetNumber}`}</td>
                    <td className="p-3 text-right font-black font-mono text-emerald-600">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center font-semibold">{r.paymentMode}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">RECEIVED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 3. EXPENSES & BILLS TAB ── */}
        {financialReportTab === 'EXPENSE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Bill / Voucher No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Vendor / Payee</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Item / Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Payment Mode</th>
                  <th className="p-3 text-center">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {expenseRecords.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-600">{e.invoiceNo || e.id}</td>
                    <td className="p-3">{e.date}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{e.vendor}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">{e.category}</span></td>
                    <td className="p-3">{e.itemName}</td>
                    <td className="p-3 text-right font-black font-mono text-rose-600">₹{e.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center font-semibold">{e.paymentMode}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">APPROVED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 4. FUND BALANCES TAB ── */}
        {financialReportTab === 'FUND_BALANCE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Fund Head / Account</th>
                  <th className="p-3 text-right">Opening Balance (₹)</th>
                  <th className="p-3 text-right">Total Received (₹)</th>
                  <th className="p-3 text-right">Total Spent (₹)</th>
                  <th className="p-3 text-right">Adjustments (₹)</th>
                  <th className="p-3 text-right">Closing Balance (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {fundAccounts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      <div>{a.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{a.code}</div>
                    </td>
                    <td className="p-3 text-right font-mono">₹{(a.openingBalance || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-bold">+ ₹{(a.totalCredits || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-rose-600 font-bold">- ₹{(a.totalDebits || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-slate-500">₹0</td>
                    <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200 text-sm">
                      ₹{(a.currentBalance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. CATEGORY-WISE EXPENSES TAB ── */}
        {financialReportTab === 'CATEGORY_EXPENSE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Expense Category</th>
                  <th className="p-3 text-center">Transactions Count</th>
                  <th className="p-3 text-right">Total Budget (₹)</th>
                  <th className="p-3 text-right">Total Spent (₹)</th>
                  <th className="p-3 text-right">Balance (₹)</th>
                  <th className="p-3 text-center">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {categoryExpenses.map(c => (
                  <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{c.category}</td>
                    <td className="p-3 text-center font-bold">{c.count}</td>
                    <td className="p-3 text-right font-mono">₹{c.budget.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">₹{c.spent.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200">₹{c.balance.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center font-bold text-amber-600">{c.utilization.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 6. VENDOR-WISE EXPENSES TAB ── */}
        {financialReportTab === 'VENDOR_EXPENSE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Vendor / Payee</th>
                  <th className="p-3 text-center">Bills Count</th>
                  <th className="p-3 text-right">Total Amount (₹)</th>
                  <th className="p-3 text-right">Paid Amount (₹)</th>
                  <th className="p-3 text-right">Pending Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {vendorExpenses.map(v => (
                  <tr key={v.vendor} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{v.vendor}</td>
                    <td className="p-3 text-center font-bold">{v.bills}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹{v.total.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">₹{v.paid.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-slate-500">₹{v.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 7. PAYMENT MODE REPORT TAB ── */}
        {financialReportTab === 'PAYMENT_MODE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-center">Transactions Count</th>
                  <th className="p-3 text-right">Total Inflow (₹)</th>
                  <th className="p-3 text-right">Total Outflow (₹)</th>
                  <th className="p-3 text-right">Net Flow (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paymentModeData.map(m => (
                  <tr key={m.mode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{m.mode}</td>
                    <td className="p-3 text-center font-bold">{m.transactions}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-bold">+ ₹{m.inflow.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-rose-600 font-bold">- ₹{m.outflow.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-200">₹{m.netFlow.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 8. REIMBURSEMENTS TAB ── */}
        {financialReportTab === 'REIMBURSEMENT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Claim No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Applicant (Employee / Student)</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3 text-right">Claim Amount (₹)</th>
                  <th className="p-3 text-right">Paid Amount (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {reimbursementRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-600">{r.id}</td>
                    <td className="p-3">{r.expenseDate}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      <div>{r.applicantName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{r.applicantRole}</div>
                    </td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3">{r.purpose}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">SETTLED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Controls ── */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300 font-semibold">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredFinancialRecords.length)} - {Math.min(currentPage * rowsPerPage, filteredFinancialRecords.length)} of {filteredFinancialRecords.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ─── MODAL 1: DETAILED NOTESHEET FINANCIAL DRAWER / MODAL ───────────── */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 font-bold">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-300">{selectedRecordForDetail.noteSheetNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {selectedRecordForDetail.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                    {selectedRecordForDetail.subject}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* Financial KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Approved Budget</div>
                  <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    ₹{selectedRecordForDetail.budget.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Amount Received</div>
                  <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{selectedRecordForDetail.received.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Amount Spent</div>
                  <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                    ₹{selectedRecordForDetail.spent.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Balance Available</div>
                  <div className="text-lg font-black font-mono text-blue-900 dark:text-blue-200">
                    ₹{selectedRecordForDetail.balance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Department</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.department}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Date of Sanction</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.date}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Creator / Proposal In-Charge</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.creator}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Fund Head / Account</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.fundHead}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Expense Category</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.expenseCategory}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Vendor / Beneficiary</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.vendor}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Disbursement Payment Mode</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecordForDetail.paymentMode}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-bold">Overall Utilization Rate</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {selectedRecordForDetail.utilization.toFixed(2)}%
                  </div>
                </div>
              </div>

              {selectedRecordForDetail.remarks && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Financial Reconciliation Remarks</div>
                  <p className="text-slate-600 dark:text-slate-400">{selectedRecordForDetail.remarks}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(selectedRecordForDetail);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuditTargetId(selectedRecordForDetail.noteSheetNumber);
                    setIsAuditModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Shield className="w-3.5 h-3.5" /> Audit Trail
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => notesheetFinancialReportService.exportFinancialsToExcel([selectedRecordForDetail])}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: CREATE / EDIT FINANCIAL RECORD MODAL ─────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-amber-400 font-bold">
                  +
                </div>
                <h3 className="text-base font-bold">
                  {editingRecord ? 'Edit Financial Record' : 'Create New Financial Record'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Notesheet Number *</label>
                  <input
                    type="text"
                    required
                    value={formNotesheetNumber}
                    onChange={e => setFormNotesheetNumber(e.target.value)}
                    placeholder="e.g. SSIU-NS-2026-0004"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Subject / Proposal Title *</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    placeholder="Enter full subject of the sanctioned proposal..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Creator / Coordinator</label>
                  <input
                    type="text"
                    value={formCreator}
                    onChange={e => setFormCreator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Fund Head Account</label>
                  <select
                    value={formFundHead}
                    onChange={e => setFormFundHead(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="University General Fund">University General Fund</option>
                    <option value="Student Welfare Fund">Student Welfare Fund</option>
                    <option value="Research Fund">Research Fund</option>
                    <option value="Infrastructure Fund">Infrastructure Fund</option>
                    <option value="Event Fund">Event Fund</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Expense Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Events">Events</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Technology">Technology</option>
                    <option value="Research">Research</option>
                    <option value="Administration">Administration</option>
                    <option value="Student Welfare">Student Welfare</option>
                  </select>
                </div>

                {/* Amount Inputs with Live Calculations */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Budget Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formBudget}
                    onChange={e => setFormBudget(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-emerald-600 dark:text-emerald-400">Received Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formReceived}
                    onChange={e => setFormReceived(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-rose-600 dark:text-rose-400">Spent Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formSpent}
                    onChange={e => setFormSpent(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-rose-600"
                  />
                </div>

                {/* Calculated Balance & Utilization Banner */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Calculated Balance</div>
                    <div className="text-sm font-black font-mono text-[#001F3F] dark:text-blue-300">
                      ₹{(formReceived - formSpent).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Utilization</div>
                    <div className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                      {formReceived > 0 ? ((formSpent / formReceived) * 100).toFixed(2) : '0.00'}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Vendor / Payee</label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={e => setFormVendor(e.target.value)}
                    placeholder="e.g. Apex Tech Solutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={e => setFormPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="SETTLED">SETTLED</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Remarks / Purpose Justification</label>
                  <textarea
                    rows={2}
                    value={formRemarks}
                    onChange={e => setFormRemarks(e.target.value)}
                    placeholder="Enter audit notes, bill numbers or settlement notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

              </div>

              <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                >
                  {editingRecord ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL 3: IMPORT EXCEL MODAL ───────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Import Financial Records (.xlsx / .csv)</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Template Download Prompt */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">Official Financial Import Template</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">Download sample Excel sheet with required column headers.</div>
                </div>
                <button
                  type="button"
                  onClick={() => notesheetFinancialReportService.downloadImportTemplate()}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>

              {/* Upload Input Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {importFile ? importFile.name : 'Click to select Excel / CSV spreadsheet'}
                </div>
                <div className="text-slate-400 text-xs mt-1">Supports XLSX, XLS and CSV files up to 10MB</div>
              </div>

              {importLoading && (
                <div className="text-center py-4 text-blue-600 font-bold">
                  Parsing and validating spreadsheet data...
                </div>
              )}

              {/* Validation Summary */}
              {importPreview && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <div className="text-slate-500 font-bold">Total Rows</div>
                      <div className="text-base font-black">{importPreview.totalRows}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <div className="font-bold">Valid Rows</div>
                      <div className="text-base font-black">{importPreview.validRows.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      <div className="font-bold">Invalid Rows</div>
                      <div className="text-base font-black">{importPreview.invalidRows.length}</div>
                    </div>
                  </div>

                  {importPreview.invalidRows.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 space-y-1.5 max-h-36 overflow-y-auto">
                      <div className="font-bold text-rose-900 dark:text-rose-200">Validation Errors:</div>
                      {importPreview.invalidRows.map((err, i) => (
                        <div key={i} className="text-rose-700 dark:text-rose-300 text-[11px]">
                          • Row {err.row}: {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importPreview || importPreview.validRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Import ({importPreview?.validRows.length || 0})
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 4: AUDIT TRAIL MODAL ────────────────────────────────────── */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold">Financial Audit Trail &amp; Governance Log</h3>
                  <p className="text-xs text-slate-300">
                    {auditTargetId ? `Scope: Notesheet #${auditTargetId}` : 'Complete University Financial Audit Ledger'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              {(() => {
                const logs: FinancialAuditLogItem[] = auditTargetId
                  ? notesheetFinancialReportService.getAuditLogsForRecord(auditTargetId)
                  : notesheetFinancialReportService.getAllAuditLogs();

                if (logs.length === 0) {
                  return (
                    <div className="py-10 text-center text-slate-500 font-semibold">
                      No audit trail logs recorded yet.
                    </div>
                  );
                }

                return logs.map(l => (
                  <div key={l.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          l.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                          l.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {l.action}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{l.noteSheetNumber}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(l.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">{l.details}</div>
                    <div className="text-slate-400 text-[11px]">
                      Officer: <strong className="text-slate-700 dark:text-slate-300">{l.user}</strong> ({l.role})
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
