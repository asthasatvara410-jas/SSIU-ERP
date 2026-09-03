import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  Layers,
  Award,
  BookOpen,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Printer,
  FileSpreadsheet,
  X,
  UploadCloud,
  Check,
  Ban,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { grantsManagementService } from '../../services/grantsManagementService';
import {
  GrantOpportunityItem,
  GrantApplicationItem,
  GrantSanctionItem,
  GrantDisbursementItem,
  GrantMilestoneItem,
  GrantExpenseItem,
  GrantDocumentItem,
  SSIPProjectItem,
  GrantFilterState,
  GrantType,
  GrantExpenseCategory,
  GrantApplicationStatus,
} from '../../types/grants';

export type GrantsTabType =
  | 'OVERVIEW'
  | 'OPPORTUNITIES'
  | 'APPLICATIONS'
  | 'RESEARCH_GRANTS'
  | 'SSIP_PROJECTS'
  | 'DISBURSEMENTS'
  | 'MILESTONES'
  | 'UTILIZATION'
  | 'DOCUMENTS'
  | 'REPORTS';

interface GrantsManagementDashboardProps {
  initialTab?: GrantsTabType;
  activeRouteTab?: string;
}

export const GrantsManagementDashboard: React.FC<GrantsManagementDashboardProps> = ({
  initialTab = 'OVERVIEW',
  activeRouteTab,
}) => {
  const { user, role } = useAuth();

  // Active sub-tab resolution
  const resolveTabFromRoute = (tabRoute?: string): GrantsTabType => {
    if (!tabRoute) return initialTab;
    switch (tabRoute) {
      case 'grant-opportunities': return 'OPPORTUNITIES';
      case 'grant-applications': return 'APPLICATIONS';
      case 'research-grants': return 'RESEARCH_GRANTS';
      case 'ssip-projects':
      case 'ssip': return 'SSIP_PROJECTS';
      case 'grant-disbursements':
      case 'funding': return 'DISBURSEMENTS';
      case 'grant-milestones':
      case 'milestones': return 'MILESTONES';
      case 'grant-utilization':
      case 'utilization':
      case 'expenses': return 'UTILIZATION';
      case 'grant-documents': return 'DOCUMENTS';
      case 'grant-reports': return 'REPORTS';
      case 'grants-dashboard':
      case 'grants':
      default: return 'OVERVIEW';
    }
  };

  const [activeTab, setActiveTab] = useState<GrantsTabType>(() => resolveTabFromRoute(activeRouteTab));

  useEffect(() => {
    if (activeRouteTab) {
      setActiveTab(resolveTabFromRoute(activeRouteTab));
    }
  }, [activeRouteTab]);

  // Filters
  const [filters, setFilters] = useState<GrantFilterState>({
    academicYear: '2025-26',
    instituteId: 'ALL',
    departmentId: 'ALL',
    grantType: 'ALL',
    grantingAgency: 'ALL',
    status: 'ALL',
    applicantType: 'ALL',
    searchQuery: '',
  });

  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick(t => t + 1);

  // Data fetching
  const metrics = useMemo(() => grantsManagementService.getMetrics(filters, role || undefined, user), [filters, role, user, refreshTick]);
  const opportunities = useMemo(() => grantsManagementService.getOpportunities(filters), [filters, refreshTick]);
  const applications = useMemo(() => grantsManagementService.getApplications(filters, role || undefined, user), [filters, role, user, refreshTick]);
  const sanctions = useMemo(() => grantsManagementService.getSanctions(filters), [filters, refreshTick]);
  const disbursements = useMemo(() => grantsManagementService.getDisbursements(filters), [filters, refreshTick]);
  const milestones = useMemo(() => grantsManagementService.getMilestones(filters), [filters, refreshTick]);
  const expenses = useMemo(() => grantsManagementService.getExpenses(filters), [filters, refreshTick]);
  const documents = useMemo(() => grantsManagementService.getDocuments(filters), [filters, refreshTick]);
  const ssipProjects = useMemo(() => grantsManagementService.getSSIPProjects(filters), [filters, refreshTick]);
  const naacSummary = useMemo(() => grantsManagementService.getNaacSummary(filters), [filters, refreshTick]);

  // Modals state
  const [showNewOppModal, setShowNewOppModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedOppForApply, setSelectedOppForApply] = useState<GrantOpportunityItem | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedAppForWorkflow, setSelectedAppForWorkflow] = useState<GrantApplicationItem | null>(null);
  const [workflowComment, setWorkflowComment] = useState('');
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [selectedSanctionForDisbursement, setSelectedSanctionForDisbursement] = useState<GrantSanctionItem | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [disbursementRemarks, setDisbursementRemarks] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseSanctionId, setExpenseSanctionId] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<GrantExpenseCategory>('PROTOTYPE');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form states for Apply Modal
  const [applyForm, setApplyForm] = useState({
    projectTitle: '',
    projectSummary: '',
    objectives: '',
    methodology: '',
    expectedOutcomes: '',
    requestedAmount: '',
    durationMonths: '12',
    grantType: 'GOVERNMENT' as GrantType,
    grantingAgency: 'DST',
    applicantType: (role === 'STUDENT' ? 'STUDENT' : 'FACULTY') as 'STUDENT' | 'FACULTY',
    applicantName: user?.name || '',
    departmentName: (user as any)?.department || user?.departmentId || 'Computer Engineering',
    facultyMentorName: '',
    linkedStartupName: '',
  });

  const handleOpenApply = (opp?: GrantOpportunityItem) => {
    if (opp) {
      setSelectedOppForApply(opp);
      setApplyForm(prev => ({
        ...prev,
        grantType: opp.grantType,
        grantingAgency: opp.grantingAgency,
      }));
    } else {
      setSelectedOppForApply(null);
    }
    setShowApplyModal(true);
  };

  const handleSaveApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.projectTitle.trim() || !applyForm.requestedAmount) {
      alert('Please enter project title and requested budget.');
      return;
    }

    try {
      grantsManagementService.submitApplication({
        opportunityId: selectedOppForApply?.id,
        opportunityTitle: selectedOppForApply?.title,
        grantType: applyForm.grantType,
        grantingAgency: applyForm.grantingAgency,
        projectTitle: applyForm.projectTitle,
        projectSummary: applyForm.projectSummary,
        objectives: applyForm.objectives,
        methodology: applyForm.methodology,
        expectedOutcomes: applyForm.expectedOutcomes,
        applicantType: applyForm.applicantType,
        applicantId: user?.id || 'usr-1',
        applicantName: applyForm.applicantName || user?.name || 'Applicant',
        departmentId: 'dept-1',
        departmentName: applyForm.departmentName,
        instituteId: 'inst-1',
        instituteName: 'Swarrnim Institute of Technology',
        facultyMentorName: applyForm.facultyMentorName || undefined,
        linkedStartupName: applyForm.linkedStartupName || undefined,
        requestedAmount: Number(applyForm.requestedAmount),
        durationMonths: Number(applyForm.durationMonths),
        budgetBreakdown: [
          { category: 'PROTOTYPE', allocatedAmount: Number(applyForm.requestedAmount) * 0.5, description: 'Core Prototype Fabrication' },
          { category: 'EQUIPMENT', allocatedAmount: Number(applyForm.requestedAmount) * 0.3, description: 'Hardware & Sensor Kits' },
          { category: 'MATERIALS', allocatedAmount: Number(applyForm.requestedAmount) * 0.2, description: 'Consumables & Testing' },
        ],
        supportingDocuments: ['Proposal_Draft.pdf'],
        declarationAccepted: true,
        academicYear: filters.academicYear,
      }, user);

      setShowApplyModal(false);
      triggerRefresh();
      showToast('🎉 Grant Application submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  };

  const handleWorkflowTransition = (action: string, newStatus: GrantApplicationStatus) => {
    if (!selectedAppForWorkflow) return;
    try {
      grantsManagementService.transitionApplicationStatus(
        selectedAppForWorkflow.id,
        action,
        newStatus,
        workflowComment || `Application marked as ${newStatus}`,
        user
      );
      setShowWorkflowModal(false);
      setWorkflowComment('');
      triggerRefresh();
      showToast(`✅ Application status transitioned to ${newStatus}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSanctionForDisbursement || !disbursementAmount) return;
    try {
      grantsManagementService.recordDisbursement({
        sanctionId: selectedSanctionForDisbursement.id,
        applicationId: selectedSanctionForDisbursement.applicationId,
        projectTitle: selectedSanctionForDisbursement.projectTitle,
        installmentNumber: 2,
        amount: Number(disbursementAmount),
        disbursementDate: new Date().toISOString().split('T')[0],
        financeTransactionId: `FT-MANUAL-${Date.now()}`,
        paymentMode: 'BANK_TRANSFER',
        status: 'RELEASED',
        remarks: disbursementRemarks || 'Fund installment released.',
        releasedBy: user?.name || 'Finance Officer',
      });
      setShowDisbursementModal(false);
      setDisbursementAmount('');
      setDisbursementRemarks('');
      triggerRefresh();
      showToast('💰 Fund installment released successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSanction = sanctions.find(s => s.id === expenseSanctionId) || sanctions[0];
    if (!targetSanction || !expenseAmount || !expenseDesc) {
      alert('Please fill all expense details.');
      return;
    }
    try {
      grantsManagementService.recordExpense({
        sanctionId: targetSanction.id,
        applicationId: targetSanction.applicationId,
        projectTitle: targetSanction.projectTitle,
        category: expenseCategory,
        description: expenseDesc,
        amount: Number(expenseAmount),
        expenseDate: new Date().toISOString().split('T')[0],
        vendorName: expenseVendor || 'Approved Vendor',
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        submittedBy: user?.name || 'Project Lead',
      });
      setShowExpenseModal(false);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseVendor('');
      triggerRefresh();
      showToast('🧾 Expense recorded & verified against released funds!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>Institutional Grants, SSIP & Innovation Funding</span>
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px]">
              Stage 10.2
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Grants & SSIP Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            End-to-end lifecycle for government grants, SSIP 2.0 student innovations, disbursements, milestones & utilization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role !== 'STUDENT' && (
            <button
              onClick={() => setShowNewOppModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post Opportunity</span>
            </button>
          )}

          <button
            onClick={() => handleOpenApply()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply for Grant / SSIP</span>
          </button>

          <button
            onClick={() => grantsManagementService.exportFullGrantsWorkbook(filters, role || undefined, user)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl flex items-center gap-2 transition-all"
            title="Download Comprehensive Excel Report"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search grants, SSIP, PI..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={filters.grantType}
            onChange={(e) => setFilters(f => ({ ...f, grantType: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Grant Types</option>
            <option value="GOVERNMENT">Government Grants</option>
            <option value="SSIP">SSIP 2.0 Innovation Grants</option>
            <option value="INSTITUTIONAL">Institutional Seed Funds</option>
            <option value="INDUSTRY">Industry Sponsored</option>
            <option value="RESEARCH">Research Grants</option>
          </select>
        </div>

        <div>
          <select
            value={filters.grantingAgency}
            onChange={(e) => setFilters(f => ({ ...f, grantingAgency: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Funding Agencies</option>
            <option value="DST">DST-SERB</option>
            <option value="SSIP">Gujarat SSIP 2.0</option>
            <option value="GUJCOST">GUJCOST</option>
            <option value="AICTE">AICTE</option>
            <option value="Institutional Seed">Institutional Seed</option>
            <option value="L&T Infotech">Corporate / Industry</option>
          </select>
        </div>

        <div>
          <select
            value={filters.academicYear}
            onChange={(e) => setFilters(f => ({ ...f, academicYear: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Academic Years</option>
            <option value="2025-26">AY 2025-26 (Current)</option>
            <option value="2024-25">AY 2024-25</option>
            <option value="2023-24">AY 2023-24</option>
          </select>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => setFilters({
              academicYear: '2025-26',
              instituteId: 'ALL',
              departmentId: 'ALL',
              grantType: 'ALL',
              grantingAgency: 'ALL',
              status: 'ALL',
              applicantType: 'ALL',
              searchQuery: '',
            })}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* 10 Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'OVERVIEW', label: 'Grants Dashboard', icon: Briefcase },
          { id: 'OPPORTUNITIES', label: 'Opportunities', icon: Award },
          { id: 'APPLICATIONS', label: 'Grant Applications', icon: FileText, badge: metrics.pendingApplications },
          { id: 'RESEARCH_GRANTS', label: 'Research Grants', icon: BookOpen },
          { id: 'SSIP_PROJECTS', label: 'SSIP Projects', icon: Sparkles, badge: metrics.totalSSIPProjects },
          { id: 'DISBURSEMENTS', label: 'Disbursements', icon: DollarSign },
          { id: 'MILESTONES', label: 'Milestones', icon: CheckCircle2, badge: metrics.delayedMilestones ? `${metrics.delayedMilestones} Delayed` : undefined, badgeColor: 'bg-rose-500' },
          { id: 'UTILIZATION', label: 'Utilization & Expenses', icon: Wallet },
          { id: 'DOCUMENTS', label: 'Grant Documents', icon: Layers },
          { id: 'REPORTS', label: 'Reports & NAAC', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GrantsTabType)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold text-white ${tab.badgeColor || (isActive ? 'bg-white/30' : 'bg-indigo-600')}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sanctioned</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ₹{metrics.totalSanctionedAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span>{metrics.totalSanctions} Approved Research & SSIP Grants</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Released</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ₹{metrics.totalReleasedAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {metrics.totalSanctionedAmount > 0
                  ? `${Math.round((metrics.totalReleasedAmount / metrics.totalSanctionedAmount) * 100)}% of Sanctioned Budget`
                  : '0%'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Utilized</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ₹{metrics.totalUtilizedAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {metrics.overallUtilizationPercentage}% Utilization Rate
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Remaining Balance</span>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ₹{metrics.totalRemainingBalance.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Available in project ledgers
              </div>
            </div>
          </div>

          {/* SSIP Highlight & Workflow Quick Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Student Startup & Innovation Policy (SSIP 2.0)</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black">
                  Fueling Student Innovation & Campus Startups
                </h2>
                <p className="text-sm text-indigo-100 max-w-xl leading-relaxed">
                  Support grants up to ₹2.50 Lakh for PoC / Prototype development, patent filings, and seed funding for student ventures at Swarrnim.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-2xl font-black">{metrics.totalSSIPProjects}</div>
                    <div className="text-xs text-indigo-200 mt-1">Active Projects</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-2xl font-black">₹{metrics.totalSSIPFundingSanctioned.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-indigo-200 mt-1">SSIP Sanctioned</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-2xl font-black">₹{metrics.totalSSIPDisbursed.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-indigo-200 mt-1">Disbursed Funds</div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('SSIP_PROJECTS')}
                    className="px-5 py-2.5 bg-white text-indigo-900 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
                  >
                    <span>View SSIP Projects</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenApply()}
                    className="px-5 py-2.5 bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm backdrop-blur-md border border-white/20 transition-all"
                  >
                    Submit SSIP Proposal
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions & Delayed Milestones Alert */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Milestone Alert</h3>
                  {metrics.delayedMilestones > 0 ? (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-xs font-bold rounded-full">
                      {metrics.delayedMilestones} Action Required
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-bold rounded-full">
                      On Track
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Institutional monitoring ensures compliance with DST, GUJCOST, and SSIP sanction deadlines.
                </p>

                <div className="mt-4 space-y-2.5">
                  {milestones.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <div className="font-bold truncate text-slate-800 dark:text-slate-200">{m.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{m.projectTitle}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                        m.status === 'DELAYED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}>
                        {m.completionPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('MILESTONES')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Manage All Project Milestones</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Funding Agency Breakdown Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Agency-wise Sanctions & Utilization Portfolio</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Funding Agency</th>
                    <th className="pb-3 text-center">Sanctioned Grants</th>
                    <th className="pb-3 text-right">Sanctioned Budget</th>
                    <th className="pb-3 text-right">Released Amount</th>
                    <th className="pb-3 text-center">Release %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(metrics.agencyBreakdown).map(([agency, data]) => {
                    const pct = data.sanctionedAmount > 0 ? Math.round((data.releasedAmount / data.sanctionedAmount) * 100) : 0;
                    return (
                      <tr key={agency} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                          <span>{agency}</span>
                        </td>
                        <td className="py-3.5 text-center font-semibold">{data.count}</td>
                        <td className="py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{data.sanctionedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{data.releasedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full font-bold text-xs">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. OPPORTUNITIES */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Open Grant Opportunities & Calls for Proposals ({opportunities.length})
            </h2>
            {role !== 'STUDENT' && (
              <button
                onClick={() => setShowNewOppModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Opportunity</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-full">
                      {opp.grantingAgency}
                    </span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                      opp.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      opp.status === 'CLOSING_SOON' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {opp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
                    {opp.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Max Funding:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        ₹{opp.maxFundingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Deadline:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{opp.closingDate}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Target:</span>
                      <span className="font-semibold">{opp.targetAudience}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  {opp.externalApplicationUrl ? (
                    <a
                      href={opp.externalApplicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Agency Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <div></div>}

                  <button
                    onClick={() => handleOpenApply(opp)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Grant & SSIP Applications Ledger ({applications.length})
            </h2>
            <button
              onClick={() => handleOpenApply()}
              className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Proposal</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">App Number</th>
                    <th className="p-4">Project Title & Abstract</th>
                    <th className="p-4">Applicant & Dept</th>
                    <th className="p-4">Agency / Type</th>
                    <th className="p-4 text-right">Requested</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="p-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {app.applicationNumber}
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{app.projectTitle}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{app.projectSummary}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{app.applicantName}</div>
                        <div className="text-xs text-slate-400">{app.departmentName} • {app.applicantType}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 font-semibold text-xs rounded-full">
                          {app.grantingAgency} ({app.grantType})
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold whitespace-nowrap">
                        ₹{app.requestedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          app.status === 'SANCTIONED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' :
                          app.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300' :
                          app.status === 'RECOMMENDED' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300' :
                          app.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' :
                          app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {role !== 'STUDENT' ? (
                          <button
                            onClick={() => {
                              setSelectedAppForWorkflow(app);
                              setShowWorkflowModal(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg text-xs transition-all"
                          >
                            Review / Action
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. RESEARCH GRANTS */}
      {activeTab === 'RESEARCH_GRANTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Active Sponsored Research Grants ({sanctions.filter(s => s.grantType !== 'SSIP').length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sanctions.filter(s => s.grantType !== 'SSIP').map((san) => (
              <div key={san.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                    {san.sanctionNumber}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs rounded-full">
                    {san.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {san.projectTitle}
                </h3>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-center">
                  <div>
                    <div className="text-slate-400">Sanctioned</div>
                    <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">₹{san.sanctionedAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Released</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">₹{san.totalReleasedAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Utilized</div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">₹{san.totalUtilizedAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div><strong>Agency:</strong> {san.grantingAgency} ({san.fundingSource})</div>
                  <div><strong>Duration:</strong> {san.projectStartDate} to {san.projectEndDate}</div>
                  <div><strong>Signatory:</strong> {san.authorizedSignatory}</div>
                </div>

                {role !== 'STUDENT' && (
                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setSelectedSanctionForDisbursement(san);
                        setShowDisbursementModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Release Funds</span>
                    </button>
                    <button
                      onClick={() => {
                        setExpenseSanctionId(san.id);
                        setShowExpenseModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Log Expense</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. SSIP PROJECTS */}
      {activeTab === 'SSIP_PROJECTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              SSIP 2.0 Student Innovations & Startups ({ssipProjects.length})
            </h2>
            <button
              onClick={() => handleOpenApply()}
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New SSIP Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ssipProjects.map((ssip) => (
              <div key={ssip.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                      {ssip.projectCode}
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-xs rounded-full">
                      {ssip.milestoneStage}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {ssip.title}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div><strong>Student Lead:</strong> {ssip.studentLeadName}</div>
                    <div><strong>Department:</strong> {ssip.departmentName}</div>
                    {ssip.startupName && <div><strong>Startup Venture:</strong> 🚀 {ssip.startupName}</div>}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sanctioned:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">₹{ssip.sanctionedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Disbursed:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{ssip.releasedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Utilized:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">₹{ssip.utilizedAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveTab('MILESTONES')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs"
                  >
                    Milestones
                  </button>
                  <button
                    onClick={() => {
                      setExpenseSanctionId(ssip.id);
                      setShowExpenseModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs"
                  >
                    Log Expense
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. DISBURSEMENTS */}
      {activeTab === 'DISBURSEMENTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Fund Release & Disbursement Ledger ({disbursements.length})
          </h2>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Release Reference</th>
                    <th className="p-4">Project Title</th>
                    <th className="p-4">Installment</th>
                    <th className="p-4 text-right">Amount Released</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {disbursements.map((dis) => (
                    <tr key={dis.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="p-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{dis.releaseReference}</td>
                      <td className="p-4 font-extrabold max-w-sm text-slate-900 dark:text-white truncate">{dis.projectTitle}</td>
                      <td className="p-4 text-center font-semibold">Inst #{dis.installmentNumber}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{dis.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-xs text-slate-400">{dis.disbursementDate}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{dis.financeTransactionId || '-'}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full font-bold text-xs">
                          {dis.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. MILESTONES */}
      {activeTab === 'MILESTONES' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Project Milestones & Deliverables ({milestones.length})
            </h2>
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((mst) => (
              <div key={mst.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Milestone #{mst.milestoneNumber}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    mst.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    mst.status === 'DELAYED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {mst.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {mst.title}
                </h3>
                <div className="text-xs text-slate-400">{mst.projectTitle}</div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Progress</span>
                    <span>{mst.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${mst.status === 'COMPLETED' ? 'bg-emerald-500' : mst.status === 'DELAYED' ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${mst.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span>Due: {mst.dueDate}</span>
                  {mst.completedDate && <span>Completed: {mst.completedDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. UTILIZATION */}
      {activeTab === 'UTILIZATION' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Grant Expenditure & Utilization Logs ({expenses.length})
            </h2>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description & Project</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4">Vendor & Invoice</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="p-4 font-bold text-xs text-indigo-600">{exp.category}</td>
                      <td className="p-4 max-w-sm">
                        <div className="font-extrabold text-slate-900 dark:text-white">{exp.description}</div>
                        <div className="text-xs text-slate-400 truncate">{exp.projectTitle}</div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-xs">
                        <div className="font-semibold">{exp.vendorName || '-'}</div>
                        <div className="text-slate-400 font-mono">{exp.invoiceNumber || '-'}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{exp.expenseDate}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs rounded-full">
                          {exp.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Grant Sanction Orders, UCs & Document Repository ({documents.length})
            </h2>
            <button
              onClick={() => setShowDocUploadModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold rounded-md">
                    {doc.documentType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400">{doc.fileSize || '1.2 MB'}</span>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base line-clamp-2">
                  {doc.title}
                </h3>
                <div className="text-xs text-slate-400 truncate">{doc.projectTitle}</div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-slate-400">By {doc.uploadedBy}</span>
                  <a
                    href={`#download-${doc.id}`}
                    onClick={(e) => { e.preventDefault(); alert(`Downloading: ${doc.fileUrl}`); }}
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 10. REPORTS & NAAC */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* NAAC Criterion 3 Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-600/50 border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-200">
                Accreditation & NAAC RAF Evidence
              </span>
              <span className="text-xs text-slate-400">Metric 3.1.1 & 3.2.1 Compliance</span>
            </div>

            <h2 className="text-2xl font-black">{naacSummary.criterionTitle}</h2>
            <p className="text-sm text-slate-300 max-w-2xl">{naacSummary.metricDescription}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">Total Sanctioned Grants</div>
                <div className="text-xl font-black text-white mt-1">₹{naacSummary.totalSanctionedINR.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">Government Grants</div>
                <div className="text-xl font-black text-emerald-400 mt-1">₹{naacSummary.governmentGrantsINR.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">SSIP Student Grants</div>
                <div className="text-xl font-black text-indigo-400 mt-1">₹{naacSummary.ssipGrantsINR.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="text-xs text-slate-400">Evidence Dossier Files</div>
                <div className="text-xl font-black text-amber-400 mt-1">{naacSummary.evidenceDocumentCount} Verified Files</div>
              </div>
            </div>
          </div>

          {/* 15 Ready-to-Print Reports */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                15 Pre-Configured Administrative & Audit Reports
              </h3>
              <button
                onClick={() => grantsManagementService.exportFullGrantsWorkbook(filters, role || undefined, user)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All 15 Sheets</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                '1. Grant Application Report',
                '2. Approved Grants Report',
                '3. Department-wise Grant Report',
                '4. Faculty-wise Grant Report',
                '5. Agency-wise Grant Report',
                '6. Academic Year-wise Grant Report',
                '7. Funding Summary Report',
                '8. Utilization & Expense Report',
                '9. Pending Applications Report',
                '10. Delayed Milestones Report',
                '11. SSIP Project Report',
                '12. SSIP Funding Report',
                '13. Student Innovation Funding Report',
                '14. Research Funding Report',
                '15. Grant Closure Report',
              ].map((rep, idx) => (
                <div
                  key={idx}
                  onClick={() => grantsManagementService.exportFullGrantsWorkbook(filters, role || undefined, user)}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{rep}</span>
                  <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR GRANT / SSIP */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedOppForApply ? `Apply for: ${selectedOppForApply.title}` : 'Submit New Grant / SSIP Proposal'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOppForApply?.grantingAgency || 'Government / SSIP / Institutional Scheme'}
                </p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApply} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., IoT Autonomous Drone Swarm for Soil Mapping"
                  value={applyForm.projectTitle}
                  onChange={(e) => setApplyForm(f => ({ ...f, projectTitle: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Grant Type</label>
                  <select
                    value={applyForm.grantType}
                    onChange={(e) => setApplyForm(f => ({ ...f, grantType: e.target.value as GrantType }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="GOVERNMENT">Government Grant</option>
                    <option value="SSIP">SSIP 2.0 Student Grant</option>
                    <option value="INSTITUTIONAL">Institutional Seed Fund</option>
                    <option value="INDUSTRY">Industry Sponsored</option>
                    <option value="RESEARCH">Research Grant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Requested Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 250000"
                    value={applyForm.requestedAmount}
                    onChange={(e) => setApplyForm(f => ({ ...f, requestedAmount: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Project Abstract / Executive Summary</label>
                <textarea
                  rows={2}
                  placeholder="Describe problem statement, novelty and proposed solution..."
                  value={applyForm.projectSummary}
                  onChange={(e) => setApplyForm(f => ({ ...f, projectSummary: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Specific Objectives & Methodology</label>
                <textarea
                  rows={2}
                  placeholder="Key milestones and implementation plan..."
                  value={applyForm.objectives}
                  onChange={(e) => setApplyForm(f => ({ ...f, objectives: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Faculty Mentor / PI</label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. Rajesh Sharma"
                    value={applyForm.facultyMentorName}
                    onChange={(e) => setApplyForm(f => ({ ...f, facultyMentorName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Linked Startup / Venture (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., AquaSense IoT Labs"
                    value={applyForm.linkedStartupName}
                    onChange={(e) => setApplyForm(f => ({ ...f, linkedStartupName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WORKFLOW REVIEW ACTION */}
      {showWorkflowModal && selectedAppForWorkflow && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Application Review & Decision
              </h3>
              <button onClick={() => setShowWorkflowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{selectedAppForWorkflow.projectTitle}</div>
              <div className="text-slate-500">Applicant: {selectedAppForWorkflow.applicantName} ({selectedAppForWorkflow.departmentName})</div>
              <div className="text-slate-500">Requested: ₹{selectedAppForWorkflow.requestedAmount.toLocaleString('en-IN')}</div>
              <div className="text-indigo-600 font-bold">Current Status: {selectedAppForWorkflow.status}</div>
            </div>

            <div>
              <label className="block font-bold text-xs mb-1">Review Comments / Justification</label>
              <textarea
                rows={3}
                placeholder="Enter scrutiny feedback or approval remarks..."
                value={workflowComment}
                onChange={(e) => setWorkflowComment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleWorkflowTransition('RECOMMENDED', 'RECOMMENDED')}
                className="py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
              >
                Recommend
              </button>
              <button
                onClick={() => handleWorkflowTransition('APPROVED', 'APPROVED')}
                className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Approve Proposal
              </button>
              <button
                onClick={() => handleWorkflowTransition('SANCTIONED', 'SANCTIONED')}
                className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Issue Sanction
              </button>
              <button
                onClick={() => handleWorkflowTransition('REJECTED', 'REJECTED')}
                className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSEMENT / FUND RELEASE */}
      {showDisbursementModal && selectedSanctionForDisbursement && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Release Grant Installment
              </h3>
              <button onClick={() => setShowDisbursementModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{selectedSanctionForDisbursement.projectTitle}</div>
              <div className="text-slate-500">Sanctioned: ₹{selectedSanctionForDisbursement.sanctionedAmount.toLocaleString('en-IN')}</div>
              <div className="text-slate-500">Already Released: ₹{selectedSanctionForDisbursement.totalReleasedAmount.toLocaleString('en-IN')}</div>
            </div>

            <form onSubmit={handleRecordDisbursement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Installment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500000"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Remarks / Finance Memo</label>
                <input
                  type="text"
                  placeholder="Installment 2 release per milestone 1 clearance"
                  value={disbursementRemarks}
                  onChange={(e) => setDisbursementRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDisbursementModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold">
                  Confirm Fund Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Log Grant Expenditure
              </h3>
              <button onClick={() => setShowExpenseModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Project / Sanction</label>
                <select
                  value={expenseSanctionId}
                  onChange={(e) => setExpenseSanctionId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {sanctions.map(s => (
                    <option key={s.id} value={s.id}>{s.projectTitle.substring(0, 45)}... (₹{s.totalReleasedAmount.toLocaleString('en-IN')} Rel)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as GrantExpenseCategory)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="PROTOTYPE">Prototype / Fabrication</option>
                    <option value="EQUIPMENT">Equipment & Hardware</option>
                    <option value="SOFTWARE">Software & Cloud</option>
                    <option value="MATERIALS">Materials & Chemicals</option>
                    <option value="TRAVEL">Field Trial & Travel</option>
                    <option value="PUBLICATION">Publication & Dissemination</option>
                    <option value="OTHER">Other Approved Item</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Expense Item Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carbon-fiber frame and BLDC motors"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Vendor Name / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. RoboElements Tech Solutions (INV-4122)"
                  value={expenseVendor}
                  onChange={(e) => setExpenseVendor(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrantsManagementDashboard;
