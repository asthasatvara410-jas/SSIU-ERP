import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Plus, Search, 
  Filter, Download, Edit3, Trash2, Eye, ArrowRight, ShieldCheck, Bug,
  Activity, Layers, FileSpreadsheet, Check, ChevronRight, X, ArrowUpRight,
  Sparkles, History, ListFilter, ClipboardCheck
} from 'lucide-react';
import { qaTestingService } from '../../services/qaTestingService';
import * as XLSX from 'xlsx';
import { useModalScrollLock } from '../../utils/modalScrollLock';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { 
  ManualTestRecord, ManualTestStatus, ManualTestType, ManualTestPriority, User 
} from '../../types';

interface NoteSheetTestingQATabProps {
  currentUser: User;
  onRefresh?: () => void;
  isPendingOnlyView?: boolean;
}

export const NoteSheetTestingQATab: React.FC<NoteSheetTestingQATabProps> = ({
  currentUser,
  onRefresh,
  isPendingOnlyView = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'ALL' | 'MANUAL' | 'PASSED' | 'FAILED' | 'PENDING' | 'RETEST' | 'FIXED' | 'MODULE_WISE' | 'HISTORY'
  >(isPendingOnlyView ? 'PENDING' : 'ALL');

  const [refreshKey, setRefreshKey] = useState(0);
  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
    if (onRefresh) onRefresh();
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(isPendingOnlyView ? 'PENDING_WORK' : 'ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedTestForView, setSelectedTestForView] = useState<ManualTestRecord | null>(null);
  const [selectedTestForEdit, setSelectedTestForEdit] = useState<ManualTestRecord | null>(null);
  const [selectedTestForStatusChange, setSelectedTestForStatusChange] = useState<ManualTestRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useModalScrollLock(
    !!(selectedTestForView || selectedTestForEdit || selectedTestForStatusChange || showCreateModal),
    () => {
      setSelectedTestForView(null);
      setSelectedTestForEdit(null);
      setSelectedTestForStatusChange(null);
      setShowCreateModal(false);
    }
  );

  // Status Change Form State
  const [newStatus, setNewStatus] = useState<ManualTestStatus>('Pass');
  const [statusChangeRemarks, setStatusChangeRemarks] = useState('');
  const [newActualResult, setNewActualResult] = useState('');

  // Toast / Banner
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showBanner = (type: 'success' | 'error', text: string) => {
    setBannerMsg({ type, text });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  // Raw Tests
  const allTests = useMemo(() => {
    return qaTestingService.getManualTests();
  }, [refreshKey]);

  // Metrics
  const metrics = useMemo(() => {
    return qaTestingService.getQASummaryMetrics();
  }, [allTests]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    let list = [...allTests];

    // Sub-tab view filtering
    if (isPendingOnlyView || selectedStatus === 'PENDING_WORK') {
      list = list.filter(t => t.status === 'Pending' || t.status === 'Fail' || t.status === 'Retest Required' || t.status === 'Blocked');
    } else if (activeSubTab === 'MANUAL') {
      list = list.filter(t => t.testType === 'Manual');
    } else if (activeSubTab === 'PASSED') {
      list = list.filter(t => t.status === 'Pass');
    } else if (activeSubTab === 'FAILED') {
      list = list.filter(t => t.status === 'Fail');
    } else if (activeSubTab === 'PENDING') {
      list = list.filter(t => t.status === 'Pending');
    } else if (activeSubTab === 'RETEST') {
      list = list.filter(t => t.status === 'Retest Required');
    } else if (activeSubTab === 'FIXED') {
      list = list.filter(t => t.status === 'Fixed');
    }

    // Dropdown filters
    if (selectedModule !== 'ALL') {
      list = list.filter(t => t.module.toLowerCase() === selectedModule.toLowerCase());
    }

    if (selectedStatus !== 'ALL' && selectedStatus !== 'PENDING_WORK') {
      list = list.filter(t => t.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    if (selectedType !== 'ALL') {
      list = list.filter(t => t.testType.toLowerCase() === selectedType.toLowerCase());
    }

    if (selectedPriority !== 'ALL') {
      list = list.filter(t => t.priority.toLowerCase() === selectedPriority.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.testId.toLowerCase().includes(q) ||
        t.feature.toLowerCase().includes(q) ||
        t.testScenario.toLowerCase().includes(q) ||
        t.module.toLowerCase().includes(q) ||
        (t.bugIssue && t.bugIssue.toLowerCase().includes(q)) ||
        (t.remarks && t.remarks.toLowerCase().includes(q)) ||
        (t.testedBy && t.testedBy.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allTests, activeSubTab, isPendingOnlyView, selectedModule, selectedStatus, selectedType, selectedPriority, searchQuery]);

  // Distinct Modules for Module-wise view
  const modulesList = useMemo(() => {
    const set = new Set<string>();
    allTests.forEach(t => set.add(t.module));
    return Array.from(set).sort();
  }, [allTests]);

  // Handle Quick Status Change
  const handleExecuteStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForStatusChange) return;

    const res = qaTestingService.updateTestRecord(
      selectedTestForStatusChange.id,
      {
        status: newStatus,
        remarks: statusChangeRemarks.trim() || `Status updated to ${newStatus}.`,
        actualResult: newActualResult.trim() || selectedTestForStatusChange.actualResult,
        fixStatus: newStatus === 'Fixed' ? 'Fixed' : newStatus === 'Pass' ? 'Verified' : newStatus === 'Fail' ? 'Open' : selectedTestForStatusChange.fixStatus,
        retestResult: newStatus === 'Pass' ? 'Pass' : newStatus === 'Fail' ? 'Fail' : 'Pending',
        testedBy: currentUser.name,
        testDate: new Date().toISOString().split('T')[0]
      },
      currentUser
    );

    if (res.success) {
      showBanner('success', `Test ${selectedTestForStatusChange.testId} marked as "${newStatus}"! Record and audit history updated.`);
      setSelectedTestForStatusChange(null);
      setStatusChangeRemarks('');
      setNewActualResult('');
      handleReload();
    } else {
      showBanner('error', res.message);
    }
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    const data = filteredTests.map(t => ({
      'Test ID': t.testId,
      'Module': t.module,
      'Feature': t.feature,
      'Test Scenario': t.testScenario,
      'Test Type': t.testType,
      'Priority': t.priority,
      'Status': t.status,
      'Expected Result': t.expectedResult,
      'Actual Result': t.actualResult,
      'Bug / Issue': t.bugIssue || 'None',
      'Fix Status': t.fixStatus || 'N/A',
      'Retest Result': t.retestResult || 'N/A',
      'Tester': t.testedBy,
      'Test Date': t.testDate,
      'Remarks': t.remarks || '',
      'Last Updated': t.lastUpdated
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QA Testing Report');
    XLSX.writeFile(wb, `${isPendingOnlyView ? 'SSIU_ERP_Pending_Testing_Register' : 'SSIU_ERP_Manual_QA_Test_Report'}.xlsx`);
  };

  const getStatusBadge = (status: ManualTestStatus) => {
    switch (status) {
      case 'Pass':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Pass</span>;
      case 'Fail':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800"><XCircle className="w-3.5 h-3.5" /> Fail</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'Retest Required':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800"><RefreshCw className="w-3.5 h-3.5" /> Retest Required</span>;
      case 'Fixed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800"><Check className="w-3.5 h-3.5" /> Fixed</span>;
      case 'Blocked':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"><AlertTriangle className="w-3.5 h-3.5" /> Blocked</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: ManualTestPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500 text-white">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Banner */}
      {bannerMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          bannerMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
        }`}>
          {bannerMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-semibold">{bannerMsg.text}</span>
        </div>
      )}

      {/* Top QA Summary Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => { setActiveSubTab('ALL'); setSelectedStatus('ALL'); }}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            activeSubTab === 'ALL' && selectedStatus === 'ALL'
              ? 'bg-blue-50/80 border-blue-400 dark:bg-blue-950/40 dark:border-blue-700 ring-2 ring-blue-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Tests</span>
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{metrics.total}</p>
          <span className="text-[11px] text-blue-600 font-medium">{metrics.passRate}% Pass Rate</span>
        </div>

        <div 
          onClick={() => { setActiveSubTab('PASSED'); setSelectedStatus('Pass'); }}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedStatus === 'Pass'
              ? 'bg-emerald-50/80 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700 ring-2 ring-emerald-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
            <span>Passed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{metrics.passed}</p>
          <span className="text-[11px] text-slate-500">Verified & Working</span>
        </div>

        <div 
          onClick={() => { setActiveSubTab('FAILED'); setSelectedStatus('Fail'); }}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedStatus === 'Fail'
              ? 'bg-rose-50/80 border-rose-400 dark:bg-rose-950/40 dark:border-rose-700 ring-2 ring-rose-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-600 font-semibold">
            <span>Failed</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">{metrics.failed}</p>
          <span className="text-[11px] text-slate-500">Requires Fix</span>
        </div>

        <div 
          onClick={() => { setActiveSubTab('PENDING'); setSelectedStatus('Pending'); }}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedStatus === 'Pending'
              ? 'bg-amber-50/80 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 ring-2 ring-amber-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 font-semibold">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">{metrics.pending}</p>
          <span className="text-[11px] text-slate-500">Awaiting Testing</span>
        </div>

        <div 
          onClick={() => { setActiveSubTab('RETEST'); setSelectedStatus('Retest Required'); }}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedStatus === 'Retest Required'
              ? 'bg-purple-50/80 border-purple-400 dark:bg-purple-950/40 dark:border-purple-700 ring-2 ring-purple-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-purple-600 font-semibold">
            <span>Retest</span>
            <RefreshCw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">{metrics.retest}</p>
          <span className="text-[11px] text-slate-500">Post-Fix Verification</span>
        </div>

        <div 
          onClick={() => { setActiveSubTab('FIXED'); setSelectedStatus('Fixed'); }}
          className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            selectedStatus === 'Fixed'
              ? 'bg-cyan-50/80 border-cyan-400 dark:bg-cyan-950/40 dark:border-cyan-700 ring-2 ring-cyan-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-cyan-600 font-semibold">
            <span>Fixed</span>
            <Check className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1.5">{metrics.fixed}</p>
          <span className="text-[11px] text-slate-500">Ready for Retest</span>
        </div>
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Tests' },
            { id: 'MANUAL', label: 'Manual Tests' },
            { id: 'PASSED', label: `Passed (${metrics.passed})` },
            { id: 'FAILED', label: `Failed (${metrics.failed})` },
            { id: 'PENDING', label: `Pending (${metrics.pending})` },
            { id: 'RETEST', label: `Retest Required (${metrics.retest})` },
            { id: 'FIXED', label: `Fixed (${metrics.fixed})` },
            { id: 'MODULE_WISE', label: 'Module-wise View' },
            { id: 'HISTORY', label: 'Testing History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                if (tab.id === 'ALL') setSelectedStatus('ALL');
                else if (tab.id === 'PASSED') setSelectedStatus('Pass');
                else if (tab.id === 'FAILED') setSelectedStatus('Fail');
                else if (tab.id === 'PENDING') setSelectedStatus('Pending');
                else if (tab.id === 'RETEST') setSelectedStatus('Retest Required');
                else if (tab.id === 'FIXED') setSelectedStatus('Fixed');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export .xlsx
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Test Case
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Test ID, Scenario, Bug..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        <div>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          >
            <option value="ALL">All Modules ({modulesList.length})</option>
            {modulesList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_WORK">⚠️ Pending Work (Pending, Fail, Retest, Blocked)</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="Pending">Pending</option>
            <option value="Retest Required">Retest Required</option>
            <option value="Fixed">Fixed</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          >
            <option value="ALL">All Test Types</option>
            <option value="Manual">Manual</option>
            <option value="Functional">Functional</option>
            <option value="UI">UI / Layout</option>
            <option value="Workflow">Workflow</option>
            <option value="Validation">Validation</option>
            <option value="RBAC">RBAC / Security</option>
            <option value="Regression">Regression</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODULE-WISE VIEW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'MODULE_WISE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulesList.map(mod => {
            const modTests = allTests.filter(t => t.module === mod);
            const modPassed = modTests.filter(t => t.status === 'Pass').length;
            const modFailed = modTests.filter(t => t.status === 'Fail').length;
            const modPending = modTests.filter(t => t.status === 'Pending').length;
            const modRetest = modTests.filter(t => t.status === 'Retest Required').length;
            const pct = Math.round((modPassed / modTests.length) * 100);

            return (
              <div 
                key={mod} 
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 cursor-pointer hover:border-blue-400 transition"
                onClick={() => { setSelectedModule(mod); setActiveSubTab('ALL'); }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> {mod}
                  </h4>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    {pct}% Pass
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div style={{ width: `${(modPassed / modTests.length) * 100}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${(modFailed / modTests.length) * 100}%` }} className="bg-rose-500 h-full" />
                  <div style={{ width: `${(modRetest / modTests.length) * 100}%` }} className="bg-purple-500 h-full" />
                  <div style={{ width: `${(modPending / modTests.length) * 100}%` }} className="bg-amber-500 h-full" />
                </div>

                <div className="grid grid-cols-4 gap-1 text-[11px] text-center pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <div><span className="font-bold text-slate-900 dark:text-white">{modTests.length}</span> Total</div>
                  <div><span className="font-bold text-emerald-600">{modPassed}</span> Pass</div>
                  <div><span className="font-bold text-rose-600">{modFailed}</span> Fail</div>
                  <div><span className="font-bold text-amber-600">{modPending}</span> Pend</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TESTING HISTORY VIEW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'HISTORY' && (
        <div className="space-y-3">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-blue-600" /> Chronological Test Execution & Retest Audit History
            </h4>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {allTests.flatMap(t => (t.history || []).map(h => ({ ...h, test: t }))).sort((a, b) => (b.changedDate || '').localeCompare(a.changedDate || '')).map((item, idx) => (
                <div key={idx} className="pt-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.test.testId} • {item.test.feature}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{item.changedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span>Status transition:</span>
                      <span className="font-semibold text-slate-500">{item.previousStatus}</span>
                      <ArrowRight className="w-3 h-3 text-blue-600" />
                      <strong className="text-blue-600">{item.newStatus}</strong>
                      <span className="text-slate-400">• By {item.changedBy}</span>
                    </div>
                    {item.remarks && <p className="text-slate-500 italic text-[11px]">"{item.remarks}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MAIN TEST REGISTER TABLE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab !== 'MODULE_WISE' && activeSubTab !== 'HISTORY' && (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Test ID & Priority</th>
                <th className="p-3.5">Module & Feature</th>
                <th className="p-3.5">Test Scenario & Type</th>
                <th className="p-3.5">Expected vs Actual</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Tester & Date</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTests.length > 0 ? (
                filteredTests.map(test => (
                  <tr key={test.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    
                    {/* Test ID & Priority */}
                    <td className="p-3.5 align-top">
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{test.testId}</p>
                      <div className="mt-1">{getPriorityBadge(test.priority)}</div>
                    </td>

                    {/* Module & Feature */}
                    <td className="p-3.5 align-top">
                      <span className="font-bold text-slate-900 dark:text-white block">{test.feature}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300 mt-1">
                        {test.module}
                      </span>
                    </td>

                    {/* Test Scenario & Type */}
                    <td className="p-3.5 align-top max-w-xs">
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">{test.testScenario}</p>
                      <span className="text-[10px] text-blue-600 font-semibold block mt-1">Type: {test.testType}</span>
                    </td>

                    {/* Expected vs Actual */}
                    <td className="p-3.5 align-top max-w-xs">
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-1"><strong>Exp:</strong> {test.expectedResult}</p>
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5"><strong>Act:</strong> {test.actualResult}</p>
                      {test.bugIssue && test.bugIssue !== 'None' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-1">
                          <Bug className="w-3 h-3" /> {test.bugIssue}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 align-top">
                      <button
                        onClick={() => {
                          setSelectedTestForStatusChange(test);
                          setNewStatus(test.status === 'Pass' ? 'Retest Required' : 'Pass');
                        }}
                        title="Click to change status"
                        className="hover:opacity-80 transition cursor-pointer"
                      >
                        {getStatusBadge(test.status)}
                      </button>
                    </td>

                    {/* Tester & Date */}
                    <td className="p-3.5 align-top">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{test.testedBy}</p>
                      <span className="text-[11px] text-slate-400 font-mono">{test.testDate}</span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedTestForView(test)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 hover:bg-blue-100"
                          title="View Full Test Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTestForStatusChange(test);
                            setNewStatus(test.status === 'Pass' ? 'Retest Required' : 'Pass');
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100"
                          title="Update Pass/Fail Status"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedTestForEdit(test)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                          title="Edit Test Case"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No manual test records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. QUICK STATUS UPDATE MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedTestForStatusChange && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1rem'
        }}>
          <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Update Test Result • {selectedTestForStatusChange.testId}</h3>
              </div>
              <button onClick={() => setSelectedTestForStatusChange(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteStatusChange} className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{selectedTestForStatusChange.feature}</p>
                <p className="text-slate-500 line-clamp-2">{selectedTestForStatusChange.testScenario}</p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select New Status *</label>
                <select 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value as any)} 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="Pass">✅ Pass (Verified & Working)</option>
                  <option value="Fail">❌ Fail (Bug Detected)</option>
                  <option value="Retest Required">🔄 Retest Required</option>
                  <option value="Fixed">🛠️ Fixed (Ready for Retest)</option>
                  <option value="Blocked">🚫 Blocked (Dependency Missing)</option>
                  <option value="Pending">⏳ Pending</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Actual Observed Result</label>
                <input 
                  type="text" 
                  value={newActualResult} 
                  onChange={e => setNewActualResult(e.target.value)} 
                  placeholder={selectedTestForStatusChange.actualResult}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Verification Remarks / Audit Reason *</label>
                <textarea 
                  value={statusChangeRemarks} 
                  onChange={e => setStatusChangeRemarks(e.target.value)} 
                  rows={2}
                  placeholder="e.g. Verified on browser reload; persistence confirmed."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTestForStatusChange(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Save Result & Record History
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. VIEW TEST DOSSIER MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedTestForView && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1rem'
        }}>
          <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">{selectedTestForView.testId} • {selectedTestForView.feature}</h3>
                  <span className="text-[11px] text-slate-300">Module: {selectedTestForView.module}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTestForView(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400">Current Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedTestForView.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Priority:</span>
                  <div className="mt-1">{getPriorityBadge(selectedTestForView.priority)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Test Type:</span>
                  <p className="font-semibold mt-1">{selectedTestForView.testType}</p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 dark:text-white mb-1">Test Scenario:</h5>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 leading-relaxed">
                  {selectedTestForView.testScenario}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white mb-1">Expected Result:</h5>
                  <p className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-900 dark:text-emerald-200">
                    {selectedTestForView.expectedResult}
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white mb-1">Actual Result:</h5>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg">
                    {selectedTestForView.actualResult}
                  </p>
                </div>
              </div>

              {selectedTestForView.bugIssue && selectedTestForView.bugIssue !== 'None' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200">
                  <span className="font-bold flex items-center gap-1"><Bug className="w-3.5 h-3.5" /> Bug / Issue:</span>
                  <p className="mt-1">{selectedTestForView.bugIssue} (Fix Status: <strong>{selectedTestForView.fixStatus}</strong>)</p>
                </div>
              )}

              {/* History Timeline */}
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" /> Execution & Retest History:
                </h5>
                <div className="space-y-2 border-l-2 border-blue-500 pl-3 ml-2">
                  {(selectedTestForView.history || []).map((h, i) => (
                    <div key={i} className="text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{h.previousStatus} $\rightarrow$ {h.newStatus}</span>
                        <span className="text-slate-400 font-mono">{h.changedDate}</span>
                      </div>
                      <p className="text-slate-500">By {h.changedBy} • "{h.remarks}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedTestForView(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs hover:bg-slate-300"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. CREATE / EDIT TEST MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(showCreateModal || selectedTestForEdit) && (
        <CreateEditTestModal
          currentUser={currentUser}
          existingTest={selectedTestForEdit}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTestForEdit(null);
          }}
          onSuccess={(msg) => {
            setShowCreateModal(false);
            setSelectedTestForEdit(null);
            showBanner('success', msg);
            handleReload();
          }}
        />
      )}

    </div>
  );
};

interface CreateEditTestModalProps {
  currentUser: User;
  existingTest?: ManualTestRecord | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const CreateEditTestModal: React.FC<CreateEditTestModalProps> = ({
  currentUser,
  existingTest,
  onClose,
  onSuccess
}) => {
  const [testId, setTestId] = useState(existingTest?.testId || '');
  const [moduleName, setModuleName] = useState(existingTest?.module || 'Notesheet');
  const [feature, setFeature] = useState(existingTest?.feature || '');
  const [testScenario, setTestScenario] = useState(existingTest?.testScenario || '');
  const [testType, setTestType] = useState<ManualTestType>(existingTest?.testType || 'Manual');
  const [expectedResult, setExpectedResult] = useState(existingTest?.expectedResult || '');
  const [actualResult, setActualResult] = useState(existingTest?.actualResult || 'Pending verification');
  const [status, setStatus] = useState<ManualTestStatus>(existingTest?.status || 'Pending');
  const [priority, setPriority] = useState<ManualTestPriority>(existingTest?.priority || 'HIGH');
  const [remarks, setRemarks] = useState(existingTest?.remarks || '');
  const [bugIssue, setBugIssue] = useState(existingTest?.bugIssue || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!feature.trim() || !testScenario.trim() || !expectedResult.trim()) {
      setErrorMsg('Please provide Feature name, Test Scenario description, and Expected Result.');
      return;
    }

    if (existingTest) {
      const res = qaTestingService.updateTestRecord(
        existingTest.id,
        {
          module: moduleName.trim(),
          feature: feature.trim(),
          testScenario: testScenario.trim(),
          testType,
          expectedResult: expectedResult.trim(),
          actualResult: actualResult.trim(),
          status,
          priority,
          remarks: remarks.trim(),
          bugIssue: bugIssue.trim(),
          testedBy: currentUser.name,
          testDate: new Date().toISOString().split('T')[0]
        },
        currentUser
      );
      if (res.success) onSuccess(`Test ${existingTest.testId} updated successfully.`);
      else setErrorMsg(res.message);
    } else {
      const res = qaTestingService.createTestRecord(
        {
          testId: testId.trim() || undefined,
          module: moduleName.trim(),
          feature: feature.trim(),
          testScenario: testScenario.trim(),
          testType,
          expectedResult: expectedResult.trim(),
          actualResult: actualResult.trim(),
          status,
          priority,
          remarks: remarks.trim(),
          bugIssue: bugIssue.trim(),
          testedBy: currentUser.name
        },
        currentUser
      );
      if (res.success) onSuccess(`New test record created and persisted.`);
      else setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <h3 className="font-bold text-sm">{existingTest ? `Edit Test Case • ${existingTest.testId}` : 'Create New Manual Test Case'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Test ID (Optional, auto-generated if blank)</label>
              <input 
                type="text" 
                value={testId} 
                onChange={e => setTestId(e.target.value)} 
                placeholder="e.g. TC-MAN-012" 
                disabled={!!existingTest}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono disabled:opacity-60" 
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Module *</label>
              <select 
                value={moduleName} 
                onChange={e => setModuleName(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="Notesheet">Notesheet</option>
                <option value="Student Master">Student Master</option>
                <option value="Admissions & CRM">Admissions & CRM</option>
                <option value="Hostel Management">Hostel Management</option>
                <option value="HRMS">HRMS</option>
                <option value="Fees & Finance">Fees & Finance</option>
                <option value="Exams & Results">Exams & Results</option>
                <option value="Asset Management">Asset Management</option>
                <option value="RBAC & Security">RBAC & Security</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Feature / Component Name *</label>
            <input 
              type="text" 
              value={feature} 
              onChange={e => setFeature(e.target.value)} 
              placeholder="e.g. Organogram Approval Hierarchy or Biometric Late Sync" 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Test Scenario *</label>
            <textarea 
              value={testScenario} 
              onChange={e => setTestScenario(e.target.value)} 
              rows={2} 
              placeholder="Describe user workflow, inputs, and testing conditions..." 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Test Type *</label>
              <select value={testType} onChange={e => setTestType(e.target.value as any)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                <option value="Manual">Manual</option>
                <option value="Functional">Functional</option>
                <option value="UI">UI</option>
                <option value="Workflow">Workflow</option>
                <option value="Validation">Validation</option>
                <option value="RBAC">RBAC</option>
                <option value="Regression">Regression</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Priority *</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold">
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Status *</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold">
                <option value="Pending">Pending</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Retest Required">Retest Required</option>
                <option value="Fixed">Fixed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Expected Result *</label>
            <input 
              type="text" 
              value={expectedResult} 
              onChange={e => setExpectedResult(e.target.value)} 
              placeholder="What should correctly occur..." 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Actual Observed Result</label>
            <input 
              type="text" 
              value={actualResult} 
              onChange={e => setActualResult(e.target.value)} 
              placeholder="What actually occurred during testing..." 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Bug / Issue Observed</label>
              <input 
                type="text" 
                value={bugIssue} 
                onChange={e => setBugIssue(e.target.value)} 
                placeholder="Optional bug summary" 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Remarks & Notes</label>
              <input 
                type="text" 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)} 
                placeholder="Testing remarks..." 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              {existingTest ? 'Update Test Case' : 'Save Test Case to Register'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
