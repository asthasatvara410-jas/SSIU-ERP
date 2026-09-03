import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, ORGANOGRAM_BRANCH_WORKFLOWS } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import {
  FileText, Plus, Search, Filter, CheckCircle2, XCircle, Clock,
  ArrowRight, ShieldCheck, Download, Upload, AlertCircle, RefreshCw,
  DollarSign, Settings, Eye, Edit3, Trash2, User as UserIcon, Info, Check, Calendar,
  Landmark, Receipt, RotateCcw, BarChart3, PieChart, Tag, Send,
  XSquare, Printer, MessageSquare, HelpCircle, FileCheck, Layers, GitFork,
  ArrowUpRight, ArrowDownLeft, Paperclip, ChevronRight, AlertTriangle,
  Network, GitCommit, GitPullRequest, GitMerge, ChevronDown, Share2, Building2,
  FileSpreadsheet, FilePlus, CornerUpLeft, MessageCircle, FileUp, Lock, ShieldAlert,
  ListOrdered, CheckSquare, Sparkles, FolderArchive, TrendingUp, ClipboardCheck
} from 'lucide-react';
import {
  NoteSheet, NoteSheetStatus, NoteSheetAction, NoteSheetWorkflowConfig,
  NoteSheetEstimateItem, NoteSheetPriority, NoteSheetVisibility, NoteSheetAttachmentItem,
  NoteSheetClarificationItem, NoteSheetComplianceItem, UniversityBranch, Institute, Department, User
} from '../../types';
import * as XLSX from 'xlsx';
import { notesheetImportService, NOTESHEET_TYPES_LIST } from '../../services/notesheetImportService';
import { notesheetPdfService } from '../../services/notesheetPdfService';
import { NoteSheetReportsTab } from '../../components/notesheet/NoteSheetReportsTab';
import { NoteSheetAnalyticsTab } from '../../components/notesheet/NoteSheetAnalyticsTab';
import { NoteSheetVerificationPage } from '../public/NoteSheetVerificationPage';
import { UniversityNoteSheetDocument } from '../../components/notesheet/UniversityNoteSheetDocument';
import { NoteSheetTestingQATab } from '../../components/notesheet/NoteSheetTestingQATab';
import { qaTestingService } from '../../services/qaTestingService';
import { amountToWords, formatIndianNumber, formatIndianCurrency } from '../../utils/numberFormat';

export const DOCUMENT_CATEGORIES = [
  'Quotation',
  'Quotation 1',
  'Quotation 2',
  'Quotation 3',
  'Bill',
  'Proposal',
  'Estimate',
  'Comparative Statement',
  'Supporting Evidence',
  'Approval Letter',
  'Sanction Letter',
  'Purchase Document',
  'Official Letter',
  'Other Supporting Document'
];

export const EXPENSE_CATEGORIES = [
  { value: 'CAPEX', label: 'CAPEX - Capital Expenditure' },
  { value: 'OPEX', label: 'OPEX - Operational Expenditure' },
  { value: 'EVENT', label: 'Event & Hospitality' },
  { value: 'RESEARCH_EQUIPMENT', label: 'Lab & Research Equipment' },
  { value: 'SOFTWARE', label: 'Software & Licenses' },
  { value: 'TRAVEL', label: 'Travel & Logistics' },
  { value: 'STATIONERY', label: 'Printing & Stationery' },
  { value: 'OTHER', label: 'Other Expenditure' }
];

export const BUDGET_HEADS = [
  'Department Academic & Lab Fund',
  'Student Activity & Cultural Fund',
  'Research & Innovation Seed Grant',
  'Campus Infrastructure & Maintenance',
  'Examination & Assessment Fund',
  'Central University General Fund',
  'Executive Directorate Special Sanction'
];

export const PROCUREMENT_MODES = [
  { value: 'DIRECT_PAYMENT', label: 'Direct Vendor Payment' },
  { value: 'ADVANCE_DISBURSEMENT', label: 'Advance Disbursement to Staff' },
  { value: 'REIMBURSEMENT', label: 'Reimbursement Claim' },
  { value: 'PURCHASE_ORDER', label: 'Formal Purchase Order (PO) Creation' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable / Nil' }
];

export type NotesheetTabType = 
  | 'DASHBOARD'
  | 'CREATE'
  | 'REGISTER'
  | 'PENDING_WITH_ME'
  | 'MY_SHEETS'
  | 'SENT'
  | 'RETURNED'
  | 'CLARIFICATION'
  | 'ACTION_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'
  | 'DRAFTS'
  | 'FINANCIAL_SHEETS'
  | 'WORKFLOW_CONFIG'
  | 'ORGANOGRAM'
  | 'ANALYTICS'
  | 'REPORTS'
  | 'VERIFICATION'
  | 'TESTING_QA'
  | 'PENDING_TESTING';

export interface NoteSheetPageProps {
  initialTab?: NotesheetTabType;
  initialCategory?: string;
  initialRecordId?: string;
  initialAction?: NoteSheetAction | string;
}

export const NoteSheetPage: React.FC<NoteSheetPageProps> = ({
  initialTab = 'DASHBOARD',
  initialCategory = 'ALL',
  initialRecordId,
  initialAction
}) => {
  const { user, role } = useAuth();
  
  const [noteSheets, setNoteSheets] = useState<NoteSheet[]>(() => db.getScopedNoteSheets(user, role));
  const [institutes, setInstitutes] = useState<Institute[]>(() => db.getInstitutes());
  const [departments, setDepartments] = useState<Department[]>(() => db.getDepartments());
  const [activeTab, setActiveTab] = useState<NotesheetTabType>(initialTab);
  
  // Quick Dashboard Filter Selection
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<string>('ALL');

  // Filters
  const [selectedInstituteFilter, setSelectedInstituteFilter] = useState<string>('ALL');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedFinancialFilter, setSelectedFinancialFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialTab) {
      if (['PENDING_WITH_ME', 'MY_SHEETS', 'SENT', 'RETURNED', 'CLARIFICATION', 'ACTION_PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'DRAFTS', 'FINANCIAL_SHEETS'].includes(initialTab)) {
        if (initialTab === 'PENDING_WITH_ME') setDashboardStatusFilter('PENDING_WITH_ME');
        else if (initialTab === 'MY_SHEETS') setDashboardStatusFilter('SUBMITTED');
        else if (initialTab === 'DRAFTS') setDashboardStatusFilter('MY_DRAFTS');
        else if (initialTab === 'SENT') setDashboardStatusFilter('FORWARDED');
        else if (initialTab === 'RETURNED') setDashboardStatusFilter('RETURNED');
        else if (initialTab === 'CLARIFICATION') setDashboardStatusFilter('CLARIFICATION');
        else if (initialTab === 'ACTION_PENDING') setDashboardStatusFilter('ACTION_PENDING');
        else if (initialTab === 'APPROVED') setDashboardStatusFilter('APPROVED');
        else if (initialTab === 'REJECTED') setDashboardStatusFilter('REJECTED');
        else if (initialTab === 'CLOSED') setDashboardStatusFilter('CLOSED');
        else if (initialTab === 'FINANCIAL_SHEETS') setDashboardStatusFilter('FINANCIAL');
        setActiveTab('REGISTER');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  // Deep-link Auto-Open Exact Notesheet Record
  useEffect(() => {
    if (initialRecordId && user) {
      const authorizedNotes = db.getAuthorizedNotesheetsForUser(user, role);
      const match = authorizedNotes.find(
        n => n.id === initialRecordId || n.noteSheetNumber === initialRecordId || n.notesheetNumber === initialRecordId
      );
      if (match) {
        setSelectedNote(match);
        if (initialAction) {
          setActionType(initialAction as NoteSheetAction);
          setShowActionModal(true);
        }
      } else {
        showFeedback('This item is no longer available or you do not have permission to view it.', true);
      }
    }
  }, [initialRecordId, user, role, initialAction]);

  // Modals & Details
  const [selectedNote, setSelectedNote] = useState<NoteSheet | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [showProvideClarificationModal, setShowProvideClarificationModal] = useState(false);
  const [showActionTakenModal, setShowActionTakenModal] = useState(false);
  const [showAddComplianceModal, setShowAddComplianceModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showUploadVersionModal, setShowUploadVersionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showValidationPreviewModal, setShowValidationPreviewModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);

  // Action fields
  const [actionType, setActionType] = useState<NoteSheetAction>('APPROVE');
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionApprovedAmount, setActionApprovedAmount] = useState<number | undefined>(undefined);
  const [isRevisingAmount, setIsRevisingAmount] = useState<boolean>(false);
  const [revisedAmountInput, setRevisedAmountInput] = useState<number | undefined>(undefined);
  const [revisionReasonInput, setRevisionReasonInput] = useState<string>('');
  const [actionFile, setActionFile] = useState('');
  const [forwardOffice, setForwardOffice] = useState('');
  
  // Specific action modals inputs
  const [clarificationQueryInput, setClarificationQueryInput] = useState('');
  const [clarificationResponseInput, setClarificationResponseInput] = useState('');
  const [actionTakenSummaryInput, setActionTakenSummaryInput] = useState('');
  const [actionTakenProofUrlInput, setActionTakenProofUrlInput] = useState('');
  const [reopenReasonInput, setReopenReasonInput] = useState('');
  const [newRemarkInput, setNewRemarkInput] = useState('');

  // Compliance item inputs
  const [newComplianceDesc, setNewComplianceDesc] = useState('');
  const [newComplianceDept, setNewComplianceDept] = useState('');
  const [newComplianceUser, setNewComplianceUser] = useState('');
  const [newComplianceDeadline, setNewComplianceDeadline] = useState('');

  // Version attachment upload
  const [versionDocName, setVersionDocName] = useState('');
  const [versionDocCategory, setVersionDocCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [versionDocUrl, setVersionDocUrl] = useState('');

  // Bulk Actions & Operations
  const [selectedNotesheetIds, setSelectedNotesheetIds] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<NoteSheetAction | null>(null);
  const [bulkRemarks, setBulkRemarks] = useState<string>('');
  const [bulkForwardOffice, setBulkForwardOffice] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Version Amendment
  const [showAmendmentModal, setShowAmendmentModal] = useState<boolean>(false);
  const [amendmentReasonInput, setAmendmentReasonInput] = useState<string>('');
  const [versionDocType, setVersionDocType] = useState('PDF');

  // Excel Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<{ row: number; field: string; message: string }[]>([]);

  // Toast
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setMessage(msg);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Preview Scale State & Document Print / PDF Handlers
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewAttachmentModal, setPreviewAttachmentModal] = useState<NoteSheetAttachmentItem | null>(null);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [modalPreviewPdfUrl, setModalPreviewPdfUrl] = useState<string | null>(null);
  const [draftPreviewPdfUrl, setDraftPreviewPdfUrl] = useState<string | null>(null);
  const [isLoadingPdfPreview, setIsLoadingPdfPreview] = useState(false);

  // Load official backend PDF for Modal 10 Preview (Single Source of Truth: Preview = Actual PDF)
  useEffect(() => {
    let active = true;
    const fetchOfficialPdfPreview = async () => {
      if (!showPrintModal || !selectedNote || !user) {
        setModalPreviewPdfUrl(null);
        return;
      }
      setIsLoadingPdfPreview(true);
      try {
        const effectiveRole = role || user.role;
        const res = await notesheetPdfService.generatePdf(selectedNote.id, user, effectiveRole);
        const blobUrl = notesheetPdfService.createPdfBlobUrl(res.downloadUrl);
        if (active) {
          setModalPreviewPdfUrl(blobUrl);
        }
      } catch (err: any) {
        console.error('Failed to load official PDF preview:', err);
      } finally {
        if (active) setIsLoadingPdfPreview(false);
      }
    };

    fetchOfficialPdfPreview();
    return () => { active = false; };
  }, [showPrintModal, selectedNote?.id, selectedNote?.version, selectedNote?.status, user, role]);

  const handlePrintBackendPdf = async (noteId: string) => {
    if (!user) return;
    const effectiveRole = role || user.role;
    setIsGeneratingPdf(true);
    try {
      showFeedback('Generating official Notesheet PDF for printing...');
      await notesheetPdfService.printPdf(noteId, user, effectiveRole);
      showFeedback('Official Notesheet PDF sent to print dialog.');
    } catch (err: any) {
      showFeedback(err.message || 'Failed to print official Notesheet PDF', true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintDraftPdf = async (draftNote: NoteSheet) => {
    if (!user) return;
    const effectiveRole = role || user.role;
    setIsGeneratingPdf(true);
    try {
      showFeedback('Generating official draft Notesheet PDF for printing...');
      await notesheetPdfService.printDraftPdf(draftNote, user, effectiveRole);
      showFeedback('Draft Notesheet PDF sent to print dialog.');
    } catch (err: any) {
      showFeedback(err.message || 'Failed to print draft Notesheet PDF', true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenPdfInNewTab = async (noteId: string) => {
    if (!user) return;
    const effectiveRole = role || user.role;
    setIsGeneratingPdf(true);
    try {
      showFeedback('Opening official Notesheet PDF viewer...');
      await notesheetPdfService.openPdfInNewTab(noteId, user, effectiveRole);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to open official Notesheet PDF', true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadBackendPdf = async (noteId: string) => {
    if (!user) return;
    const effectiveRole = role || user.role;
    setIsGeneratingPdf(true);
    try {
      const res = await notesheetPdfService.downloadPdf(noteId, user, effectiveRole);
      // Trigger secure direct browser download
      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showFeedback(`Official University PDF "${res.fileName}" downloaded successfully.`);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to generate official PDF', true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRegenerateBackendPdf = async (noteId: string) => {
    if (!user) return;
    const effectiveRole = role || user.role;
    setIsGeneratingPdf(true);
    try {
      const res = await notesheetPdfService.regeneratePdf(noteId, user, effectiveRole);
      const blobUrl = notesheetPdfService.createPdfBlobUrl(res.downloadUrl);
      setModalPreviewPdfUrl(blobUrl);
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showFeedback(`Regenerated new version (v${res.version}) of official PDF "${res.fileName}".`);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to regenerate official PDF', true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const refreshData = () => {
    const fresh = db.getScopedNoteSheets(user, role);
    setNoteSheets(fresh);
    setInstitutes(db.getInstitutes());
    setDepartments(db.getDepartments());
    if (selectedNote) {
      const updated = fresh.find(n => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  };

  // Form State
  const defaultUserInst = useMemo(() => user?.instituteId || 'inst-sit', [user]);
  const defaultUserDept = useMemo(() => db.resolveUserDepartment(user), [user]);

  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [formInstituteId, setFormInstituteId] = useState<string>(defaultUserInst);
  const [formDepartmentId, setFormDepartmentId] = useState<string>(user?.departmentId || '');
  const [formDepartmentName, setFormDepartmentName] = useState<string>(defaultUserDept);
  const [formSubject, setFormSubject] = useState('');
  const [formNotesheetType, setFormNotesheetType] = useState('Academic');
  const [formPriority, setFormPriority] = useState<NoteSheetPriority>('NORMAL');
  const [formVisibility, setFormVisibility] = useState<NoteSheetVisibility>('NORMAL');
  const [formSection, setFormSection] = useState('');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formContactNumber, setFormContactNumber] = useState(user?.phone || '079-68161600');
  const [formProposal, setFormProposal] = useState('');
  const [formPurposeJustification, setFormPurposeJustification] = useState('');
  const [formRequiredDate, setFormRequiredDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [formWorkflowDueDate, setFormWorkflowDueDate] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
  const [formPreviousNoteSheetId, setFormPreviousNoteSheetId] = useState<string>('');

  // Financial fields
  const [formFinancialRequirement, setFormFinancialRequirement] = useState<boolean>(false);
  const [formFinanceRemarks, setFormFinanceRemarks] = useState<string>('');
  const [formItems, setFormItems] = useState<NoteSheetEstimateItem[]>([
    { id: `item-1`, itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }
  ]);

  // Supporting Documents State
  const [formAttachments, setFormAttachments] = useState<NoteSheetAttachmentItem[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [newDocType, setNewDocType] = useState('PDF');
  const [newDocUrl, setNewDocUrl] = useState('');

  // Dynamic Departments for selected Institute in form
  const formAvailableDepartments = useMemo(() => {
    return departments.filter(d => d.instituteId === formInstituteId);
  }, [departments, formInstituteId]);

  // Live estimated number preview
  const liveNotesheetNumberPreview = useMemo(() => {
    const instObj = institutes.find(i => i.id === formInstituteId || i.code === formInstituteId || i.name === formInstituteId) || {
      code: 'SIT',
      name: 'Swarrnim Institute of Technology'
    };
    const instCode = instObj.code || 'SIT';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const periodMMYY = `${mm}${yy}`;
    
    return `${instCode}-NOTESHEET-${periodMMYY}-XXX (Generated on Submit)`;
  }, [formInstituteId, institutes]);

  // Total Estimated Amount Calculation from line items
  const calculatedTotalAmount = useMemo(() => {
    if (!formFinancialRequirement) return 0;
    return formItems.reduce((sum, it) => sum + (Math.max(0, Number(it.quantity) || 0) * Math.max(0, Number(it.rate) || 0)), 0);
  }, [formFinancialRequirement, formItems]);

  // Draft Preview NoteSheet constructed for live pre-submission validation preview
  const draftPreviewNoteSheet: NoteSheet = useMemo(() => {
    const instObj = institutes.find(i => i.id === formInstituteId || i.code === formInstituteId || i.name === formInstituteId);
    return {
      id: editingDraftId || 'draft-preview',
      noteSheetNumber: editingDraftId ? (noteSheets.find(n => n.id === editingDraftId)?.noteSheetNumber || 'DRAFT-PREVIEW') : 'DRAFT-PREVIEW',
      date: new Date().toISOString().split('T')[0],
      instituteId: formInstituteId,
      instituteName: instObj?.name || 'Swarrnim School of Computing & IT',
      instituteCode: instObj?.code || 'SSCIT',
      departmentId: formDepartmentId,
      department: formDepartmentName || formDepartmentId,
      subject: formSubject || 'Untitled Subject Proposal',
      proposal: formProposal || 'No proposal description specified.',
      purposeJustification: formPurposeJustification || 'No detailed purpose/justification specified.',
      priority: formPriority,
      visibility: formVisibility,
      requiredDate: formRequiredDate,
      workflowDueDate: formWorkflowDueDate,
      notesheetType: formNotesheetType,
      category: formNotesheetType,
      referenceNumber: formReferenceNumber,
      previousNoteSheetId: formPreviousNoteSheetId,
      financialRequirement: formFinancialRequirement,
      budgetRequired: formFinancialRequirement,
      estimatedCost: calculatedTotalAmount,
      requestedAmount: calculatedTotalAmount,
      currentAmount: calculatedTotalAmount,
      contactNumber: formContactNumber || '079-68161600',
      items: formItems.map((it, idx) => ({
        id: it.id || `item-${idx + 1}`,
        itemName: it.itemName || `Item ${idx + 1}`,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit || 'Nos',
        rate: it.rate,
        amount: (it.quantity || 1) * (it.rate || 0)
      })),
      attachments: formAttachments.map(a => a.fileName),
      attachmentObjects: formAttachments,
      creatorId: user?.id || 'usr-creator',
      creatorName: user?.name || 'Initiator',
      creatorRole: user?.role || 'FACULTY',
      status: 'DRAFT',
      currentOffice: 'HOD',
      movements: [
        {
          id: 'mvt-draft-init',
          noteSheetId: 'draft-preview',
          fromUserId: user?.id || 'usr-creator',
          fromUser: user?.name || 'Initiator',
          fromUserRole: user?.role || 'FACULTY',
          toUserId: 'usr-hod',
          toUser: 'Head of Department',
          action: 'FORWARD',
          remarks: 'Pre-submission draft preview',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [
    editingDraftId, noteSheets, formInstituteId, institutes, formDepartmentId, formDepartmentName,
    formSubject, formProposal, formPurposeJustification, formPriority, formVisibility,
    formRequiredDate, formWorkflowDueDate, formNotesheetType, formReferenceNumber,
    formPreviousNoteSheetId, formFinancialRequirement, calculatedTotalAmount,
    formContactNumber, formItems, formAttachments, user
  ]);

  // Load official draft backend PDF for Modal 9 Preview (Single Source of Truth: Preview = Actual PDF)
  useEffect(() => {
    let active = true;
    const fetchDraftPdfPreview = async () => {
      if (!showValidationPreviewModal || !draftPreviewNoteSheet || !user) {
        setDraftPreviewPdfUrl(null);
        return;
      }
      setIsLoadingPdfPreview(true);
      try {
        const effectiveRole = role || user.role;
        const res = await notesheetPdfService.generateDraftPdf(draftPreviewNoteSheet, user, effectiveRole);
        const blobUrl = notesheetPdfService.createPdfBlobUrl(res.downloadUrl);
        if (active) {
          setDraftPreviewPdfUrl(blobUrl);
        }
      } catch (err: any) {
        console.error('Failed to load draft PDF preview:', err);
      } finally {
        if (active) setIsLoadingPdfPreview(false);
      }
    };

    fetchDraftPdfPreview();
    return () => { active = false; };
  }, [showValidationPreviewModal, draftPreviewNoteSheet, user, role]);

  // Add Line Item
  const handleAddLineItem = () => {
    setFormItems(prev => [
      ...prev,
      { id: `item-${Date.now()}`, itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }
    ]);
  };

  const handleUpdateLineItem = (id: string, field: keyof NoteSheetEstimateItem, val: any) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'rate') {
        const q = field === 'quantity' ? Number(val) : item.quantity;
        const r = field === 'rate' ? Number(val) : item.rate;
        updated.amount = Math.max(0, q) * Math.max(0, r);
      }
      return updated;
    }));
  };

  const handleRemoveLineItem = (id: string) => {
    if (formItems.length === 1) return;
    setFormItems(prev => prev.filter(i => i.id !== id));
  };

  // Helper: Format raw file size in bytes to clean readable string
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Dynamic Multiple Files Upload Handler (PDF, JPG, JPEG, PNG, DOC, XLS)
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, forcedCategory?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachments(true);
    const newItems: NoteSheetAttachmentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = (file.name.split('.').pop() || 'PDF').toUpperCase();
      const categoryToUse = forcedCategory || newDocCategory || 'Supporting Evidence';

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `att-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileType: extension,
          fileSize: file.size,
          fileSizeFormatted: formatFileSize(file.size),
          fileUrl: dataUrl,
          documentCategory: categoryToUse,
          version: 1,
          status: 'ACTIVE',
          uploadedByUserId: user?.id,
          uploadedByName: user?.name,
          uploadedByRole: user?.role,
          createdAt: new Date().toISOString()
        });
      } catch (readErr) {
        console.warn('Failed reading file:', file.name, readErr);
      }
    }

    if (newItems.length > 0) {
      setFormAttachments(prev => [...prev, ...newItems]);
      showFeedback(`Successfully attached ${newItems.length} file${newItems.length > 1 ? 's' : ''}.`);
    }

    // Reset input value so same files can be re-selected if needed
    e.target.value = '';
    setIsUploadingAttachments(false);
  };

  // Add attachment before submission (Manual URL or Title)
  const handleAddFormAttachment = () => {
    if (!newDocName.trim()) {
      showFeedback('Please provide a Document Name', true);
      return;
    }
    const newAtt: NoteSheetAttachmentItem = {
      id: `att-${Date.now()}`,
      fileName: newDocName.trim(),
      fileType: newDocType.toUpperCase(),
      fileSize: 1024 * 1024,
      fileSizeFormatted: '1.0 MB',
      fileUrl: newDocUrl.trim() || `https://erp.swarrnim.edu.in/docs/${newDocName.toLowerCase().replace(/\s+/g, '_')}.${newDocType.toLowerCase()}`,
      documentCategory: newDocCategory,
      version: 1,
      status: 'ACTIVE',
      uploadedByUserId: user?.id,
      uploadedByName: user?.name,
      uploadedByRole: user?.role,
      createdAt: new Date().toISOString()
    };
    setFormAttachments(prev => [...prev, newAtt]);
    setNewDocName('');
    setNewDocUrl('');
  };

  const handleRemoveFormAttachment = (id: string) => {
    setFormAttachments(prev => prev.filter(a => a.id !== id));
  };

  const resetForm = () => {
    setEditingDraftId(null);
    setFormInstituteId(defaultUserInst);
    setFormDepartmentName(defaultUserDept);
    setFormSubject('');
    setFormNotesheetType('Academic');
    setFormPriority('NORMAL');
    setFormVisibility('NORMAL');
    setFormSection('');
    setFormReferenceNumber('');
    setFormContactNumber(user?.phone || '079-68161600');
    setFormProposal('');
    setFormPurposeJustification('');
    setFormRequiredDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setFormWorkflowDueDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    setFormPreviousNoteSheetId('');
    setFormFinancialRequirement(false);
    setFormFinanceRemarks('');
    setFormItems([{ id: `item-1`, itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]);
    setFormAttachments([]);
  };

  const loadDraftIntoForm = (ns: NoteSheet) => {
    setEditingDraftId(ns.id);
    setFormInstituteId(ns.instituteId || defaultUserInst);
    setFormDepartmentName(ns.department || defaultUserDept);
    setFormSubject(ns.subject || '');
    setFormNotesheetType(ns.notesheetType || ns.category || 'Academic');
    setFormPriority(ns.priority || 'NORMAL');
    setFormVisibility(ns.visibility || 'NORMAL');
    setFormSection(ns.section || '');
    setFormReferenceNumber(ns.referenceNumber || '');
    setFormContactNumber(ns.contactNumber || user?.phone || '');
    setFormProposal(ns.proposal || '');
    setFormPurposeJustification(ns.purposeJustification || '');
    setFormRequiredDate(ns.requiredDate || new Date().toISOString().split('T')[0]);
    setFormWorkflowDueDate(ns.workflowDueDate || new Date().toISOString().split('T')[0]);
    setFormPreviousNoteSheetId(ns.previousNoteSheetId || '');
    setFormFinancialRequirement(Boolean(ns.financialRequirement || ns.budgetRequired || (ns.requestedAmount && ns.requestedAmount > 0)));
    setFormFinanceRemarks(ns.financeRemarks || '');
    setFormItems(ns.items && ns.items.length > 0 ? ns.items : [{ id: `item-1`, itemName: '', description: '', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]);
    setFormAttachments(ns.attachmentObjects || []);
    setActiveTab('CREATE');
  };

  // Save Draft Handler
  const handleSaveDraft = () => {
    if (!user) {
      showFeedback('User session not found', true);
      return;
    }
    try {
      const draftPayload: Partial<NoteSheet> = {
        id: editingDraftId || undefined,
        instituteId: formInstituteId,
        department: formDepartmentName,
        departmentName: formDepartmentName,
        subject: formSubject.trim() || 'Untitled Draft Notesheet',
        title: formSubject.trim() || 'Untitled Draft Notesheet',
        notesheetType: formNotesheetType,
        category: formNotesheetType,
        priority: formPriority,
        visibility: formVisibility,
        section: formSection,
        referenceNumber: formReferenceNumber,
        contactNumber: formContactNumber,
        proposal: formProposal,
        purposeJustification: formPurposeJustification,
        requiredDate: formRequiredDate,
        workflowDueDate: formWorkflowDueDate,
        previousNoteSheetId: formPreviousNoteSheetId,
        financialRequirement: formFinancialRequirement,
        budgetRequired: formFinancialRequirement,
        estimatedCost: formFinancialRequirement ? calculatedTotalAmount : 0,
        requestedAmount: formFinancialRequirement ? calculatedTotalAmount : 0,
        financeRemarks: formFinancialRequirement ? formFinanceRemarks : undefined,
        items: formFinancialRequirement ? formItems : [],
        attachmentObjects: formAttachments,
        attachments: formAttachments.map(a => a.fileName)
      };

      const saved = db.saveNoteSheetDraft(draftPayload, user);
      setEditingDraftId(saved.id);
      refreshData();
      showFeedback('Draft saved successfully.');
    } catch (e: any) {
      showFeedback(e.message || 'Failed to save draft', true);
    }
  };

  // Submit Official Notesheet Handler
  const handleSubmitNotesheet = () => {
    if (!user) {
      showFeedback('User session not found', true);
      return;
    }
    if (!formSubject.trim()) {
      showFeedback('Subject is mandatory.', true);
      return;
    }
    if (!formProposal.trim()) {
      showFeedback('Proposal description is mandatory.', true);
      return;
    }
    if (!formPurposeJustification.trim()) {
      showFeedback('Purpose and Justification is mandatory.', true);
      return;
    }
    if (formFinancialRequirement && calculatedTotalAmount <= 0) {
      showFeedback('Financial Notesheets must have at least one line item with a positive amount.', true);
      return;
    }

    try {
      if (editingDraftId) {
        // Update draft fields first then submit
        db.saveNoteSheetDraft({
          id: editingDraftId,
          instituteId: formInstituteId,
          department: formDepartmentName,
          subject: formSubject.trim(),
          title: formSubject.trim(),
          notesheetType: formNotesheetType,
          category: formNotesheetType,
          priority: formPriority,
          visibility: formVisibility,
          section: formSection,
          referenceNumber: formReferenceNumber,
          contactNumber: formContactNumber,
          proposal: formProposal,
          purposeJustification: formPurposeJustification,
          requiredDate: formRequiredDate,
          workflowDueDate: formWorkflowDueDate,
          previousNoteSheetId: formPreviousNoteSheetId,
          financialRequirement: formFinancialRequirement,
          budgetRequired: formFinancialRequirement,
          estimatedCost: formFinancialRequirement ? calculatedTotalAmount : 0,
          requestedAmount: formFinancialRequirement ? calculatedTotalAmount : 0,
          financeRemarks: formFinancialRequirement ? formFinanceRemarks : undefined,
          items: formFinancialRequirement ? formItems : [],
          attachmentObjects: formAttachments,
          attachments: formAttachments.map(a => a.fileName)
        }, user);

        const submitted = db.submitDraftNoteSheet(editingDraftId, user);
        showFeedback(`Notesheet officially submitted as ${submitted.noteSheetNumber}!`);
      } else {
        const created = db.createNoteSheet({
          instituteId: formInstituteId,
          department: formDepartmentName,
          departmentName: formDepartmentName,
          subject: formSubject.trim(),
          title: formSubject.trim(),
          notesheetType: formNotesheetType,
          category: formNotesheetType,
          priority: formPriority,
          visibility: formVisibility,
          section: formSection,
          referenceNumber: formReferenceNumber,
          contactNumber: formContactNumber,
          proposal: formProposal,
          purposeJustification: formPurposeJustification,
          requiredDate: formRequiredDate,
          workflowDueDate: formWorkflowDueDate,
          previousNoteSheetId: formPreviousNoteSheetId,
          financialRequirement: formFinancialRequirement,
          budgetRequired: formFinancialRequirement,
          estimatedCost: formFinancialRequirement ? calculatedTotalAmount : 0,
          requestedAmount: formFinancialRequirement ? calculatedTotalAmount : 0,
          financeRemarks: formFinancialRequirement ? formFinanceRemarks : undefined,
          items: formFinancialRequirement ? formItems : [],
          attachmentObjects: formAttachments,
          attachments: formAttachments.map(a => a.fileName)
        }, user, false);

        showFeedback(`Notesheet officially submitted as ${created.noteSheetNumber}!`);
      }

      resetForm();
      refreshData();
      setActiveTab('REGISTER');
    } catch (e: any) {
      showFeedback(e.message || 'Failed to submit notesheet', true);
    }
  };

  // Action Dispatcher
  const handleExecuteAction = () => {
    if (!selectedNote || !user) return;
    try {
      const prevAmt = selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0);
      const isAmountChanged = isRevisingAmount && revisedAmountInput !== undefined && revisedAmountInput !== prevAmt;

      if (isAmountChanged && (!revisionReasonInput.trim() && !actionRemarks.trim())) {
        showFeedback('Reason / Remarks is mandatory when revising the financial amount.', true);
        return;
      }

      db.processNoteSheetAction(
        selectedNote.id,
        actionType,
        actionRemarks,
        actionFile || undefined,
        user,
        forwardOffice || undefined,
        {
          approvedAmount: actionApprovedAmount,
          revisedAmount: isRevisingAmount ? revisedAmountInput : undefined,
          revisionReason: revisionReasonInput.trim() || undefined
        }
      );
      showFeedback(`Action "${actionType}" executed on ${selectedNote.noteSheetNumber}`);
      setShowActionModal(false);
      setActionRemarks('');
      setIsRevisingAmount(false);
      setRevisedAmountInput(undefined);
      setRevisionReasonInput('');
      setActionApprovedAmount(undefined);
      setForwardOffice('');
      refreshData();
    } catch (e: any) {
      showFeedback(e.message || 'Action failed', true);
    }
  };

  // Pending With Me computation based on strict RBAC and assignment
  const canAccessPendingWithMe = useMemo(() => db.hasPendingWithMeAccess(user, role), [user, role]);
  const pendingWithMeList = useMemo(() => db.getPendingWithMeNotesheets(user, role), [noteSheets, user, role]);

  // Filtered Register Notesheets
  const filteredRegisterNotesheets = useMemo(() => {
    if (!user || !role) return [];
    
    // Step 1: Base category filtering from backend source of truth
    let list = db.filterNotesheetsByCategory(noteSheets, dashboardStatusFilter, user, role);

    // Step 2: Dropdown filters
    return list.filter(n => {
      if (selectedInstituteFilter !== 'ALL' && n.instituteId !== selectedInstituteFilter && n.instituteCode !== selectedInstituteFilter) return false;
      if (selectedDepartmentFilter !== 'ALL' && n.department !== selectedDepartmentFilter && n.departmentId !== selectedDepartmentFilter) return false;
      if (selectedStatusFilter !== 'ALL' && n.status !== selectedStatusFilter) return false;
      if (selectedPriorityFilter !== 'ALL' && n.priority !== selectedPriorityFilter) return false;
      if (selectedFinancialFilter === 'FINANCIAL' && !n.financialRequirement) return false;
      if (selectedFinancialFilter === 'NON_FINANCIAL' && n.financialRequirement) return false;
      if (selectedTypeFilter !== 'ALL' && n.notesheetType !== selectedTypeFilter && n.category !== selectedTypeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = n.noteSheetNumber?.toLowerCase().includes(q);
        const matchSubj = n.subject?.toLowerCase().includes(q);
        const matchProp = n.proposal?.toLowerCase().includes(q);
        const matchCreator = n.creatorName?.toLowerCase().includes(q);
        const matchInst = n.instituteName?.toLowerCase().includes(q);
        if (!matchNum && !matchSubj && !matchProp && !matchCreator && !matchInst) return false;
      }

      return true;
    });
  }, [noteSheets, dashboardStatusFilter, selectedInstituteFilter, selectedDepartmentFilter, selectedStatusFilter, selectedPriorityFilter, selectedFinancialFilter, selectedTypeFilter, searchQuery, user, role]);

  // KPI Dashboard Counts using exact authorized backend filtering
  const kpiStats = useMemo(() => {
    if (!user || !role) {
      return {
        total: 0, myDrafts: 0, pendingWithMe: 0, submitted: 0, forwarded: 0,
        returned: 0, clarification: 0, financial: 0, urgent: 0, overdue: 0,
        approved: 0, actionPending: 0, closed: 0, rejected: 0
      };
    }

    return {
      total: noteSheets.length,
      myDrafts: db.filterNotesheetsByCategory(noteSheets, 'MY_DRAFTS', user, role).length,
      pendingWithMe: pendingWithMeList.length,
      submitted: db.filterNotesheetsByCategory(noteSheets, 'MY_NOTESHEETS', user, role).length,
      forwarded: db.filterNotesheetsByCategory(noteSheets, 'FORWARDED', user, role).length,
      returned: db.filterNotesheetsByCategory(noteSheets, 'RETURNED', user, role).length,
      clarification: db.filterNotesheetsByCategory(noteSheets, 'CLARIFICATION', user, role).length,
      financial: db.filterNotesheetsByCategory(noteSheets, 'FINANCIAL', user, role).length,
      urgent: db.filterNotesheetsByCategory(noteSheets, 'URGENT', user, role).length,
      overdue: db.filterNotesheetsByCategory(noteSheets, 'OVERDUE', user, role).length,
      approved: db.filterNotesheetsByCategory(noteSheets, 'APPROVED', user, role).length,
      actionPending: db.filterNotesheetsByCategory(noteSheets, 'ACTION_PENDING', user, role).length,
      closed: db.filterNotesheetsByCategory(noteSheets, 'CLOSED', user, role).length,
      rejected: db.filterNotesheetsByCategory(noteSheets, 'REJECTED', user, role).length
    };
  }, [noteSheets, pendingWithMeList, user, role]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredRegisterNotesheets.map(n => ({
      'Notesheet Number': n.noteSheetNumber,
      'Institute': n.instituteName || n.instituteCode || n.instituteId,
      'Department': n.department,
      'Notesheet Type': n.notesheetType || n.category || 'Administrative',
      'Subject': n.subject,
      'Priority': n.priority,
      'Visibility': n.visibility || 'NORMAL',
      'Status': n.status,
      'Current Office': n.currentOffice,
      'Financial': n.financialRequirement ? 'YES' : 'NO',
      'Requested Amount (₹)': n.requestedAmount || n.estimatedCost || 0,
      'Approved Amount (₹)': n.approvedAmount !== undefined ? n.approvedAmount : '-',
      'Budget Head': n.budgetHead || '-',
      'Created By': n.creatorName,
      'Created Date': n.date,
      'Required By Date': n.requiredDate || '-',
      'Workflow Due Date': n.workflowDueDate || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Notesheet_Register');
    XLSX.writeFile(wb, `SSIU_Notesheet_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (st: NoteSheetStatus) => {
    switch (st) {
      case 'DRAFT': return <Badge variant="navy">DRAFT</Badge>;
      case 'SUBMITTED': return <Badge variant="gold">SUBMITTED</Badge>;
      case 'UNDER_REVIEW':
      case 'PENDING_APPROVAL': return <Badge variant="orange">UNDER REVIEW</Badge>;
      case 'FORWARDED': return <Badge variant="navy">FORWARDED</Badge>;
      case 'CLARIFICATION_REQUIRED': return <Badge variant="danger">CLARIFICATION</Badge>;
      case 'RETURNED': return <Badge variant="danger">RETURNED</Badge>;
      case 'APPROVED': return <Badge variant="success">APPROVED</Badge>;
      case 'ACTION_PENDING': return <Badge variant="warning">ACTION PENDING</Badge>;
      case 'ACTION_IN_PROGRESS': return <Badge variant="orange">ACTION IN PROGRESS</Badge>;
      case 'ACTION_COMPLETED': return <Badge variant="success">ACTION COMPLETED</Badge>;
      case 'REJECTED': return <Badge variant="danger">REJECTED</Badge>;
      case 'CLOSED': return <Badge variant="navy">CLOSED</Badge>;
      case 'REOPENED': return <Badge variant="orange">REOPENED</Badge>;
      default: return <Badge variant="navy">{st}</Badge>;
    }
  };

  if (user?.role === 'STUDENT' || role === 'STUDENT') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">403 Forbidden — Access Denied</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Students are strictly prohibited from creating or accessing university statutory Notesheets. Please use the Student Service Desk for student applications and inquiries.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full notesheet-module-container space-y-6 pb-24 text-slate-800 dark:text-slate-200">
      {/* Toast Feedback */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-2xl flex items-center gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/50">
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            <div className="p-3.5 bg-blue-500/20 rounded-2xl border border-blue-400/30 text-blue-300 flex-shrink-0">
              <FileSignatureIcon className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">University Notesheet Management System</h1>
                <Badge variant="navy" className="bg-blue-500/30 text-blue-200 border-blue-400/40 text-xs font-bold px-2.5 py-0.5">
                  Institute-Scoped Workflow
                </Badge>
                <Badge variant="gold" className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs font-bold px-2.5 py-0.5">
                  Production Ready
                </Badge>
              </div>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Official statutory file movement, hierarchical approval chains, financial governance, document versioning &amp; compliance
              </p>
            </div>
          </div>

          <div className="flex items-center justify-start lg:justify-end gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0 lg:self-center lg:ml-auto">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold flex items-center gap-2 border border-white/10 transition whitespace-nowrap"
              title="Import Excel Notesheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Import Excel
            </button>
            <button
              onClick={refreshData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10 flex-shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard &amp; KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'CREATE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{editingDraftId ? 'Edit Draft' : 'Create Notesheet'}</span>
          </button>

          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'REGISTER' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notesheet Register</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              {noteSheets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'ANALYTICS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics &amp; SLA</span>
          </button>

          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'REPORTS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Reports &amp; Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'VERIFICATION' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Document Verification</span>
          </button>

          <button
            onClick={() => setActiveTab('TESTING_QA')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'TESTING_QA' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-indigo-400" />
            <span>Testing &amp; QA</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
              {qaTestingService.getManualTests().length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING_TESTING')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'PENDING_TESTING' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Pending Testing</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {qaTestingService.getManualTests().filter(t => t.status === 'Pending' || t.status === 'Fail' || t.status === 'Retest Required' || t.status === 'Blocked').length}
            </span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: DASHBOARD & 13 KPI VIEWS ─────────────────────────────────── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Smart Hero Highlight Summary Row (Role-Scoped Database Counts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => {
                setDashboardStatusFilter(canAccessPendingWithMe ? 'PENDING_WITH_ME' : 'ALL');
                setActiveTab('REGISTER');
              }}
              className="p-5 rounded-2xl border-2 border-amber-400/80 dark:border-amber-600/80 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 text-left shadow-sm hover:shadow-md transition relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {canAccessPendingWithMe ? 'Pending Action With Me' : 'Total Pending Notesheets'}
                </span>
                <span className="p-2 rounded-xl bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  <Clock className="w-5 h-5 animate-pulse" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-950 dark:text-amber-100 font-mono">
                  {canAccessPendingWithMe ? kpiStats.pendingWithMe : (kpiStats.submitted + kpiStats.forwarded)}
                </span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Awaiting your review</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Click to view pending queue →
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDashboardStatusFilter('APPROVED');
                setActiveTab('REGISTER');
              }}
              className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 text-left shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Total Approved
                </span>
                <span className="p-2 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-950 dark:text-emerald-100 font-mono">
                  {kpiStats.approved}
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Sanctioned</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View sanctioned notesheets →
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDashboardStatusFilter('OVERDUE');
                setActiveTab('REGISTER');
              }}
              className="p-5 rounded-2xl border border-rose-200 dark:border-rose-800 bg-linear-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/20 text-left shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Overdue / Escalated (&gt;3 Days)
                </span>
                <span className="p-2 rounded-xl bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                  <AlertCircle className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-950 dark:text-rose-100 font-mono">
                  {kpiStats.overdue}
                </span>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Auto Reminders active</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Review overdue items →
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDashboardStatusFilter('REJECTED');
                setActiveTab('REGISTER');
              }}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-800/40 dark:to-gray-800/30 text-left shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rejected / Returned
                </span>
                <span className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  <XCircle className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {kpiStats.rejected + kpiStats.returned}
                </span>
                <span className="text-xs font-semibold text-slate-500">Needs rectification</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View rejected records →
              </div>
            </button>
          </div>

          {/* 13 KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { id: 'ALL', label: 'All Sheets', count: kpiStats.total, color: 'text-blue-600', icon: FileText, border: 'border-blue-200 dark:border-blue-900', show: true },
              { id: 'MY_DRAFTS', label: 'My Drafts', count: kpiStats.myDrafts, color: 'text-slate-600', icon: Edit3, border: 'border-slate-300 dark:border-slate-700', show: true },
              { id: 'PENDING_WITH_ME', label: 'Pending With Me', count: kpiStats.pendingWithMe, color: 'text-amber-600', icon: Clock, border: 'border-amber-300 dark:border-amber-800', show: canAccessPendingWithMe },
              { id: 'SUBMITTED', label: 'Submitted', count: kpiStats.submitted, color: 'text-blue-500', icon: Send, border: 'border-blue-300 dark:border-blue-800', show: true },
              { id: 'FORWARDED', label: 'Forwarded', count: kpiStats.forwarded, color: 'text-indigo-500', icon: ArrowRight, border: 'border-indigo-300 dark:border-indigo-800', show: true },
              { id: 'RETURNED', label: 'Returned', count: kpiStats.returned, color: 'text-rose-500', icon: CornerUpLeft, border: 'border-rose-300 dark:border-rose-800', show: true },
              { id: 'CLARIFICATION', label: 'Clarification', count: kpiStats.clarification, color: 'text-amber-500', icon: HelpCircle, border: 'border-amber-300 dark:border-amber-800', show: true },
              { id: 'FINANCIAL', label: 'Financial', count: kpiStats.financial, color: 'text-emerald-600', icon: DollarSign, border: 'border-emerald-300 dark:border-emerald-800', show: true },
              { id: 'URGENT', label: 'Urgent', count: kpiStats.urgent, color: 'text-rose-600', icon: AlertTriangle, border: 'border-rose-300 dark:border-rose-800', show: true },
              { id: 'OVERDUE', label: 'Overdue', count: kpiStats.overdue, color: 'text-red-700', icon: AlertCircle, border: 'border-red-400 dark:border-red-900', show: true },
              { id: 'APPROVED', label: 'Approved', count: kpiStats.approved, color: 'text-emerald-600', icon: CheckCircle2, border: 'border-emerald-300 dark:border-emerald-800', show: true },
              { id: 'ACTION_PENDING', label: 'Action Pending', count: kpiStats.actionPending, color: 'text-cyan-600', icon: ListOrdered, border: 'border-cyan-300 dark:border-cyan-800', show: true },
              { id: 'CLOSED', label: 'Closed', count: kpiStats.closed, color: 'text-slate-500', icon: FolderArchive, border: 'border-slate-200 dark:border-slate-800', show: true },
              { id: 'REJECTED', label: 'Rejected', count: kpiStats.rejected, color: 'text-rose-700', icon: XCircle, border: 'border-rose-300 dark:border-rose-800', show: true }
            ]
              .filter(item => item.show)
              .map(item => {
              const IconComp = item.icon;
              const isSelected = dashboardStatusFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setDashboardStatusFilter(item.id);
                    setActiveTab('REGISTER');
                  }}
                  className={`p-4 rounded-2xl border text-left transition shadow-sm hover:shadow-md bg-white dark:bg-slate-900 ${
                    isSelected ? 'ring-2 ring-blue-500 ' + item.border : item.border
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <IconComp className={`w-5 h-5 ${item.color}`} />
                    <span className={`text-xl font-black ${item.color}`}>{item.count}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-2.5 truncate">
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Organogram Hierarchical Workflow Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">University Organogram &amp; Administrative Workflow Routing</h3>
                  <p className="text-sm text-slate-500">Autonomous multi-tier hierarchy according to SSIU University Statutes</p>
                </div>
              </div>
              <Badge variant="navy" className="text-xs font-bold px-3 py-1">Statutory Hierarchy</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {Object.entries(ORGANOGRAM_BRANCH_WORKFLOWS).map(([key, wf]) => (
                <div key={key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{wf.name}</span>
                    <Badge variant="orange" className="text-xs font-bold px-2 py-0.5">{wf.finalAuthority}</Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
                    {wf.steps.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{step}</span>
                        {idx < wf.steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CREATE / EDIT NOTESHEET (DRAFT & SUBMISSION WIZARD) ──────── */}
      {activeTab === 'CREATE' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <FileSignatureIcon className="w-6 h-6 text-blue-600" />
                {editingDraftId ? 'Edit Draft Notesheet' : 'Create New Official Notesheet'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Notesheet numbering is generated per Institute on official submission. Drafts are safely saved anytime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="notesheet-number-highlight text-sm sm:text-base font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                {liveNotesheetNumberPreview}
              </span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Institute */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Institute <span className="text-rose-500">*</span>
              </label>
              <select
                value={formInstituteId}
                onChange={e => setFormInstituteId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              >
                {institutes.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    [{inst.code}] {inst.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Department / Office <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formDepartmentName}
                onChange={e => setFormDepartmentName(e.target.value)}
                placeholder="e.g. CSE, Exam Cell, Hostel Admin, Finance..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            {/* Notesheet Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Notesheet Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formNotesheetType}
                onChange={e => setFormNotesheetType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              >
                {NOTESHEET_TYPES_LIST.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                {formNotesheetType && !(NOTESHEET_TYPES_LIST as readonly string[]).includes(formNotesheetType) && (
                  <option value={formNotesheetType}>{formNotesheetType}</option>
                )}
              </select>
            </div>

            {/* Subject */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Subject / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
                placeholder="Enter clear, concise subject of the proposal..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            {/* Priority & Visibility */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select
                  value={formPriority}
                  onChange={e => setFormPriority(e.target.value as NoteSheetPriority)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="URGENT">URGENT</option>
                  <option value="IMMEDIATE">IMMEDIATE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Visibility</label>
                <select
                  value={formVisibility}
                  onChange={e => setFormVisibility(e.target.value as NoteSheetVisibility)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="HIGHLY_CONFIDENTIAL">HIGHLY CONFIDENTIAL</option>
                </select>
              </div>
            </div>

            {/* Required By Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Required By Date</label>
              <input
                type="date"
                value={formRequiredDate}
                onChange={e => setFormRequiredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            {/* Workflow Due Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Workflow Due Date</label>
              <input
                type="date"
                value={formWorkflowDueDate}
                onChange={e => setFormWorkflowDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            {/* Reference Number */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reference Number / Memo Ref</label>
              <input
                type="text"
                value={formReferenceNumber}
                onChange={e => setFormReferenceNumber(e.target.value)}
                placeholder="e.g. SSIU/MEMO/2026/042, Quotation Ref..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            {/* Previous / Related Notesheet */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Previous / Related Notesheet</label>
              <select
                value={formPreviousNoteSheetId}
                onChange={e => setFormPreviousNoteSheetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              >
                <option value="">None (Independent Notesheet)</option>
                {noteSheets.filter(n => n.status !== 'DRAFT').map(n => (
                  <option key={n.id} value={n.id}>
                    {n.noteSheetNumber} - {n.subject.slice(0, 35)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proposal Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Proposal / Request Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formProposal}
              onChange={e => setFormProposal(e.target.value)}
              placeholder="State the core proposal clearly and concisely..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
            />
          </div>

          {/* Detailed Purpose & Justification */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Detailed Note &amp; Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formPurposeJustification}
              onChange={e => setFormPurposeJustification(e.target.value)}
              placeholder="Provide comprehensive background, regulatory context, benefits, academic justification, and quotes..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
            />
          </div>

          {/* Requested Action & Remarks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Requested Action / Sanction Sought
              </label>
              <input
                type="text"
                value={formSection}
                onChange={e => setFormSection(e.target.value)}
                placeholder="e.g. Administrative Approval, Budgetary Sanction, PO Release..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Additional Remarks / Routing Notes
              </label>
              <input
                type="text"
                value={formFinanceRemarks}
                onChange={e => setFormFinanceRemarks(e.target.value)}
                placeholder="Special instructions, deadline remarks, or routing notes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              />
            </div>
          </div>

          {/* ─── FINANCIAL REQUIREMENT SECTION ─────────────────────────────────── */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Expenditure Requirement</h3>
                  <p className="text-sm text-slate-500">Does this Notesheet involve financial expenditure or budgetary sanction?</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormFinancialRequirement(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    !formFinancialRequirement ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  NO
                </button>
                <button
                  type="button"
                  onClick={() => setFormFinancialRequirement(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    formFinancialRequirement ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  YES
                </button>
              </div>
            </div>

            {formFinancialRequirement && (
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                {/* Line Items Table */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Financial Line Items Breakdown:</span>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-sm font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Description</th>
                          <th className="p-3 w-28">Qty</th>
                          <th className="p-3 w-32">Rate (₹)</th>
                          <th className="p-3 w-36">Amount (₹)</th>
                          <th className="p-3 w-14 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {formItems.map((item, idx) => (
                          <tr key={item.id}>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.itemName}
                                onChange={e => handleUpdateLineItem(item.id, 'itemName', e.target.value)}
                                placeholder="e.g. Server RAM, Stage Decor..."
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={e => handleUpdateLineItem(item.id, 'description', e.target.value)}
                                placeholder="Specs / remarks"
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={0}
                                value={item.rate}
                                onChange={e => handleUpdateLineItem(item.id, 'rate', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                              ₹{(item.quantity * item.rate).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(item.id)}
                                disabled={formItems.length === 1}
                                className="text-slate-400 hover:text-rose-500 disabled:opacity-30 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                        <tr>
                          <td colSpan={4} className="p-3 text-right text-slate-700 dark:text-slate-300 text-sm">
                            Total Requested Amount:
                          </td>
                          <td className="p-3 text-emerald-600 font-mono text-base font-bold">
                            ₹{calculatedTotalAmount.toLocaleString('en-IN')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── SUPPORTING DOCUMENTS & QUOTATIONS SECTION ──────────────────────── */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="text-base font-bold text-slate-900 dark:text-white">Dynamic Attachments, Bills &amp; Quotations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  {formAttachments.length} Attached
                </span>
              </div>
            </div>

            {/* Quick Upload Buttons for Procurement / Quotations 1-3 & Bill */}
            <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FilePlus className="w-3.5 h-3.5 text-blue-600" /> Quick Add Quotations &amp; Bills:
                </span>
                <span className="text-slate-500 italic">Upload PDF, JPG, PNG or DOCX (Max 25MB each)</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Quotation 1</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={e => handleMultiFileUpload(e, 'Quotation 1')}
                  />
                </label>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Quotation 2</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={e => handleMultiFileUpload(e, 'Quotation 2')}
                  />
                </label>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Quotation 3</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={e => handleMultiFileUpload(e, 'Quotation 3')}
                  />
                </label>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ Vendor Bill / Invoice</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={e => handleMultiFileUpload(e, 'Bill')}
                  />
                </label>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm ml-auto">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Multiple Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={e => handleMultiFileUpload(e)}
                  />
                </label>
              </div>
            </div>

            {/* Custom Manual File / Cloud Link Entry */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Document Title / File Name"
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
              <select
                value={newDocCategory}
                onChange={e => setNewDocCategory(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
              >
                {DOCUMENT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Document URL / Cloud link (Optional)"
                value={newDocUrl}
                onChange={e => setNewDocUrl(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
              <button
                type="button"
                onClick={handleAddFormAttachment}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>

            {/* List of Form Attachments with Category, Size, Preview & Remove */}
            {formAttachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {formAttachments.map(att => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs sm:text-sm">
                          {att.fileName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                            {att.documentCategory || 'Supporting Doc'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {att.fileSizeFormatted || formatFileSize(att.fileSize || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {att.fileUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewAttachmentModal(att)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFormAttachment(att.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 transition"
            >
              Reset Form
            </button>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-sm font-bold flex items-center gap-2 transition"
              >
                <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => setShowValidationPreviewModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-sm font-bold flex items-center gap-2 transition"
              >
                <Eye className="w-4 h-4" />
                Preview &amp; Validate
              </button>

              <button
                type="button"
                onClick={handleSubmitNotesheet}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold flex items-center gap-2 shadow-md transition"
              >
                <Send className="w-4 h-4" />
                Submit Official Notesheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: NOTESHEET REGISTER / LIST VIEW ───────────────────────────── */}
      {activeTab === 'REGISTER' && (
        <div className="space-y-4">
          {/* Multi-Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Notesheet #, subject, proposal, creator..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Institute Filter */}
                <select
                  value={selectedInstituteFilter}
                  onChange={e => setSelectedInstituteFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="ALL">All Institutes</option>
                  {institutes.map(i => (
                    <option key={i.id} value={i.id}>[{i.code}] {i.name}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RETURNED">Returned</option>
                  <option value="CLARIFICATION_REQUIRED">Clarification</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ACTION_PENDING">Action Pending</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                {/* Financial Filter */}
                <select
                  value={selectedFinancialFilter}
                  onChange={e => setSelectedFinancialFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="ALL">All Financial Types</option>
                  <option value="FINANCIAL">Financial (₹)</option>
                  <option value="NON_FINANCIAL">Non-Financial</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={selectedPriorityFilter}
                  onChange={e => setSelectedPriorityFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="NORMAL">Normal</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent</option>
                  <option value="IMMEDIATE">Immediate</option>
                </select>

                {/* Notesheet Type Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="ALL">All Notesheet Types</option>
                  {NOTESHEET_TYPES_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Export Excel Button */}
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Quick Filter Pill Bar */}
            {dashboardStatusFilter !== 'ALL' && (
              <div className="flex items-center gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 font-semibold">Active Filter:</span>
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center gap-1.5">
                  {dashboardStatusFilter}
                  <button onClick={() => setDashboardStatusFilter('ALL')} className="hover:text-rose-500 font-bold ml-1">×</button>
                </span>
                <button
                  onClick={() => setDashboardStatusFilter('ALL')}
                  className="text-sm text-blue-600 hover:underline font-semibold"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {/* Floating Bulk Action Bar */}
          {selectedNotesheetIds.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-3 border border-blue-500/40 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">
                  {selectedNotesheetIds.length} Selected
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  Bulk Operations for Queue
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {db.hasNoteSheetPermission(user, role, 'NOTESHEET_FORWARD') && (
                  <button
                    onClick={() => {
                      setBulkActionType('FORWARD');
                      setBulkRemarks('');
                      setBulkForwardOffice('');
                      setShowBulkModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Bulk Forward
                  </button>
                )}
                {db.hasNoteSheetPermission(user, role, 'NOTESHEET_APPROVE') && (
                  <button
                    onClick={() => {
                      setBulkActionType('APPROVE');
                      setBulkRemarks('');
                      setBulkForwardOffice('');
                      setShowBulkModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bulk Approve
                  </button>
                )}
                {db.hasNoteSheetPermission(user, role, 'NOTESHEET_RETURN') && (
                  <button
                    onClick={() => {
                      setBulkActionType('RETURN');
                      setBulkRemarks('');
                      setBulkForwardOffice('');
                      setShowBulkModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" /> Bulk Return
                  </button>
                )}
                <button
                  onClick={() => {
                    const selectedDocs = noteSheets.filter(n => selectedNotesheetIds.includes(n.id));
                    const exportData = selectedDocs.map(n => ({
                      'Notesheet Number': n.noteSheetNumber,
                      'Verification ID': n.verificationId || 'N/A',
                      'Version': `v${n.version || '1.0'}`,
                      'Subject': n.subject,
                      'Institute': n.instituteName || n.instituteCode,
                      'Department': n.department,
                      'Creator': n.creatorName,
                      'Status': n.status,
                      'Requested Amount': n.requestedAmount || 0,
                      'Approved Amount': n.approvedAmount || 0,
                      'Inward No': n.inwardNumber || 'N/A',
                      'Outward No': n.outwardNumber || 'N/A'
                    }));
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    XLSX.utils.book_append_sheet(wb, ws, 'Selected_Notesheets');
                    XLSX.writeFile(wb, `SSIU_Notesheet_Selected_${Date.now()}.xlsx`);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export Selected
                </button>
                <button
                  onClick={() => setSelectedNotesheetIds([])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Notesheets Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredRegisterNotesheets.length > 0 &&
                          filteredRegisterNotesheets.every(ns => selectedNotesheetIds.includes(ns.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotesheetIds(filteredRegisterNotesheets.map(ns => ns.id));
                          } else {
                            setSelectedNotesheetIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Notesheet #</th>
                    <th className="p-3.5">Institute &amp; Dept</th>
                    <th className="p-3.5">Subject &amp; Type</th>
                    <th className="p-3.5">Priority / Vis.</th>
                    <th className="p-3.5">Amount (₹)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Current Holder</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {filteredRegisterNotesheets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <div className="font-bold text-slate-700 dark:text-slate-300 text-base">No Notesheets found</div>
                        <div className="text-sm mt-1">There are no files matching the selected filters.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredRegisterNotesheets.map(ns => {
                      const isOverdue = ns.workflowDueDate && new Date(ns.workflowDueDate) < new Date() && !['APPROVED', 'CLOSED', 'REJECTED'].includes(ns.status);
                      const isSelected = selectedNotesheetIds.includes(ns.id);
                      return (
                        <tr
                          key={ns.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                            isSelected ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                          }`}
                          onClick={() => setSelectedNote(ns)}
                        >
                          <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNotesheetIds(prev => [...prev, ns.id]);
                                } else {
                                  setSelectedNotesheetIds(prev => prev.filter(id => id !== ns.id));
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-[15px]">
                            {ns.noteSheetNumber}
                            {ns.version && ns.version !== '1.0' && (
                              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                                v{ns.version}
                              </span>
                            )}
                            {ns.status === 'DRAFT' && <span className="ml-1.5 text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">DRAFT</span>}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{ns.instituteCode || ns.instituteName || 'SIT'}</div>
                            <div className="text-xs text-slate-500">{ns.department}</div>
                          </td>
                          <td className="p-3.5 min-w-[240px]">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">{ns.subject}</div>
                            <div className="text-xs text-slate-500">{ns.notesheetType || ns.category || 'Administrative'}</div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={ns.priority === 'URGENT' || ns.priority === 'IMMEDIATE' ? 'danger' : 'navy'} className="text-xs font-bold px-2 py-0.5">
                                {ns.priority}
                              </Badge>
                              {ns.visibility && ns.visibility !== 'NORMAL' && (
                                <Badge variant="warning" className="text-xs font-bold px-2 py-0.5">
                                  <Lock className="w-3 h-3 inline mr-1" />
                                  {ns.visibility}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            {ns.financialRequirement ? (
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                  ₹{(ns.requestedAmount || ns.estimatedCost || 0).toLocaleString('en-IN')}
                                </span>
                                {ns.approvedAmount !== undefined && (
                                  <div className="text-xs text-emerald-600 font-bold">
                                    Appr: ₹{ns.approvedAmount.toLocaleString('en-IN')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal text-xs">Non-Fin</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {getStatusBadge(ns.status)}
                              {isOverdue && <span className="text-xs text-rose-600 font-bold">⚠️ OVERDUE</span>}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{ns.currentOffice}</div>
                            <div className="text-xs text-slate-400">By: {ns.creatorName}</div>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {ns.status === 'DRAFT' && ns.creatorId === user?.id && (
                                <>
                                  <button
                                    onClick={() => loadDraftIntoForm(ns)}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    title="Edit Draft"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this draft?')) {
                                        db.deleteNoteSheetDraft(ns.id, user!);
                                        refreshData();
                                        showFeedback('Draft deleted.');
                                      }
                                    }}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 text-rose-600"
                                    title="Delete Draft"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handlePrintBackendPdf(ns.id)}
                                disabled={isGeneratingPdf}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                                title="Print official Notesheet PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Print
                              </button>

                              <button
                                onClick={() => setSelectedNote(ns)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1.5 transition hover:bg-blue-100"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
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
        </div>
      )}

      {/* ─── TAB 5: ANALYTICS & TURNAROUND SLA ──────────────────────────────── */}
      {activeTab === 'ANALYTICS' && (
        <NoteSheetAnalyticsTab notesheets={noteSheets} />
      )}

      {/* ─── TAB 6: REPORTS & AUDIT ─────────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <NoteSheetReportsTab />
      )}

      {/* ─── TAB 7: DOCUMENT VERIFICATION DASHBOARD ─────────────────────────── */}
      {activeTab === 'VERIFICATION' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <NoteSheetVerificationPage
            onNavigateToNotesheet={(id) => {
              const matched = db.getNoteSheetById(id);
              if (matched) {
                setSelectedNote(matched);
                setActiveTab('REGISTER');
              }
            }}
          />
        </div>
      )}

      {/* ─── TAB 8: DEDICATED TESTING & QA SECTION ───────────────────────────── */}
      {activeTab === 'TESTING_QA' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <NoteSheetTestingQATab
            currentUser={user || { id: 'admin', name: 'QA Admin', role: 'SUPER_ADMIN', email: 'admin@ssiu.edu.in', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' }}
            onRefresh={refreshData}
            isPendingOnlyView={false}
          />
        </div>
      )}

      {/* ─── TAB 9: PENDING TESTING VIEW ─────────────────────────────────────── */}
      {activeTab === 'PENDING_TESTING' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <NoteSheetTestingQATab
            currentUser={user || { id: 'admin', name: 'QA Admin', role: 'SUPER_ADMIN', email: 'admin@ssiu.edu.in', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' }}
            onRefresh={refreshData}
            isPendingOnlyView={true}
          />
        </div>
      )}

      {/* ─── MODAL 1: NOTESHEET DETAILS & WORKFLOW TIMELINE MODAL ──────────── */}
      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title={`Notesheet Details: ${selectedNote.noteSheetNumber}`}
          maxWidth="900px"
        >
          <div className="notesheet-modal-scope space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            {/* Top Summary Banner */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="notesheet-number-highlight font-mono font-black text-base text-blue-600 dark:text-blue-400">{selectedNote.noteSheetNumber}</span>
                  {getStatusBadge(selectedNote.status)}
                  <Badge variant={selectedNote.priority === 'URGENT' || selectedNote.priority === 'IMMEDIATE' ? 'danger' : 'navy'} className="text-xs font-bold px-2.5 py-0.5">
                    {selectedNote.priority}
                  </Badge>
                  {selectedNote.visibility && (
                    <Badge variant="warning" className="text-xs font-bold px-2 py-0.5">
                      <Lock className="w-3.5 h-3.5 inline mr-1" />
                      {selectedNote.visibility}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{selectedNote.subject}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Institute: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedNote.instituteName || selectedNote.instituteCode}</span> • Department: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedNote.department}</span> • Created By: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedNote.creatorName}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <button
                  onClick={() => handlePrintBackendPdf(selectedNote.id)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Print official Notesheet PDF directly"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Notesheet
                </button>
                <button
                  onClick={() => handleDownloadBackendPdf(selectedNote.id)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Generate and download official University PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Open high-fidelity A4 preview and print dialog"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Preview &amp; Actions
                </button>
              </div>
            </div>

            {/* Proposal & Detailed Justification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposal Description:</span>
                <p className="notesheet-prose-body text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{selectedNote.proposal}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purpose &amp; Detailed Note:</span>
                <p className="notesheet-prose-body text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{selectedNote.purposeJustification}</p>
              </div>
            </div>

            {/* Financial Details (if financial) */}
            {selectedNote.financialRequirement && (
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Financial Sanction Details</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Requested: <strong className="font-mono text-slate-900 dark:text-white text-sm">₹{(selectedNote.requestedAmount || selectedNote.estimatedCost || 0).toLocaleString('en-IN')}</strong>
                    </span>
                    {selectedNote.approvedAmount !== undefined && (
                      <span className="text-sm text-emerald-700 dark:text-emerald-400 font-black">
                        Approved: <strong className="font-mono text-base">₹{selectedNote.approvedAmount.toLocaleString('en-IN')}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-slate-500">Category:</span> <strong>{selectedNote.expenseCategory || '-'}</strong></div>
                  <div><span className="text-slate-500">Budget Head:</span> <strong>{selectedNote.budgetHead || '-'}</strong></div>
                  <div><span className="text-slate-500">Budget Available:</span> <strong>{selectedNote.budgetAvailable ? 'YES' : 'NO'}</strong></div>
                  <div><span className="text-slate-500">Procurement:</span> <strong>{selectedNote.procurementRequirement || '-'}</strong></div>
                </div>

                {selectedNote.items && selectedNote.items.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-emerald-100/60 dark:bg-emerald-950/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-xs">
                        <tr>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 w-24">Qty</th>
                          <th className="p-2.5 w-28">Rate (₹)</th>
                          <th className="p-2.5 text-right w-32">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {selectedNote.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td className="p-2.5 font-medium">{it.itemName}</td>
                            <td className="p-2.5 text-slate-500">{it.description || '-'}</td>
                            <td className="p-2.5">{it.quantity}</td>
                            <td className="p-2.5 font-mono">₹{it.rate?.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{it.amount?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Financial History & Amount Revision Trail */}
            {selectedNote.financialRequirement && (
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Financial History &amp; Amount Revisions</span>
                  </div>
                  {selectedNote.financialRevisionHistory && selectedNote.financialRevisionHistory.length > 0 ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      {selectedNote.financialRevisionHistory.length} Revision{selectedNote.financialRevisionHistory.length > 1 ? 's' : ''} Recorded
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Original Amount Maintained</span>
                  )}
                </div>

                {/* Financial Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-xs font-semibold text-slate-500 block">Total Requested Amount</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white block">
                      ₹{(selectedNote.originalRequestedAmount || selectedNote.requestedAmount || selectedNote.estimatedCost || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] italic text-slate-600 dark:text-slate-400 mt-1 block">
                      {amountToWords(selectedNote.originalRequestedAmount || selectedNote.requestedAmount || selectedNote.estimatedCost || 0)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-xs font-semibold text-slate-500 block">
                      {selectedNote.status === 'APPROVED' ? 'Final Approved / Sanctioned Amount' : 'Current / Proposed Amount'}
                    </span>
                    <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 block">
                      ₹{(selectedNote.finalApprovedAmount !== undefined ? selectedNote.finalApprovedAmount : (selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0))).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] italic text-blue-700 dark:text-blue-300 mt-1 block">
                      {amountToWords(selectedNote.finalApprovedAmount !== undefined ? selectedNote.finalApprovedAmount : (selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0)))}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-xs font-semibold text-slate-500 block">Total Net Change</span>
                    {(() => {
                      const orig = selectedNote.originalRequestedAmount || selectedNote.requestedAmount || selectedNote.estimatedCost || 0;
                      const curr = selectedNote.finalApprovedAmount !== undefined ? selectedNote.finalApprovedAmount : (selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : orig);
                      const net = curr - orig;
                      return (
                        <span className={`text-base font-bold font-mono block ${net < 0 ? 'text-rose-600 dark:text-rose-400' : net > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                          {net > 0 ? `+₹${net.toLocaleString('en-IN')}` : net < 0 ? `-₹${Math.abs(net).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Revisions Table */}
                {selectedNote.financialRevisionHistory && selectedNote.financialRevisionHistory.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Stage / Approver</th>
                          <th className="p-3 font-mono">Previous Amount</th>
                          <th className="p-3 font-mono">Revised Amount</th>
                          <th className="p-3 font-mono">Change</th>
                          <th className="p-3">Reason / Remarks</th>
                          <th className="p-3">Date &amp; Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {selectedNote.financialRevisionHistory.map((rev, rIdx) => (
                          <tr key={rev.id || rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-bold text-slate-500">{rIdx + 1}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">{rev.actorName}</div>
                              <div className="text-xs text-slate-400">{rev.workflowStage || rev.actorRole}</div>
                            </td>
                            <td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                              ₹{rev.previousAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              ₹{rev.newAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-xs ${rev.changeAmount < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : rev.changeAmount > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                                {rev.changeAmount > 0 ? `+₹${rev.changeAmount.toLocaleString('en-IN')}` : rev.changeAmount < 0 ? `-₹${Math.abs(rev.changeAmount).toLocaleString('en-IN')}` : '₹0'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs">{rev.reason}</td>
                            <td className="p-3 text-xs text-slate-400 font-mono">
                              {new Date(rev.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                    No amount revisions have been made. The Notesheet is progressing with its initial requested amount.
                  </div>
                )}
              </div>
            )}

            {/* Supporting Documents Repository with Version History */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Supporting Documents Repository</span>
                </div>
                <button
                  onClick={() => setShowUploadVersionModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-sm font-bold flex items-center gap-1.5 hover:bg-blue-100 transition"
                >
                  <Plus className="w-4 h-4" />
                  Upload Version
                </button>
              </div>

              {(!selectedNote.attachmentObjects || selectedNote.attachmentObjects.length === 0) ? (
                <p className="text-sm text-slate-400 italic">No supporting documents attached.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedNote.attachmentObjects.map(att => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{att.fileName}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                            v{att.version || 1}
                          </span>
                          {att.status === 'SUPERSEDED' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-500 font-bold">OLD</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{att.documentCategory}</span>
                          {att.fileSizeFormatted ? ` • ${att.fileSizeFormatted}` : ''}
                          {att.uploadedByName ? ` • Uploaded by ${att.uploadedByName}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachmentModal(att)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <a
                          href={att.fileUrl}
                          download={att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Digital Approval Trail / Stepper */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileSignatureIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Digital Approval Chain &amp; Stage Progress</span>
                </div>
                {selectedNote.status === 'APPROVED' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Final Approved
                  </span>
                )}
              </div>

              {/* Amazon-Style Visual Workflow Movement Tracker */}
              <div className="space-y-4">
                {/* Stepper Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(() => {
                    const chainSteps = ['FACULTY', ...(selectedNote.organogramPath || ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'])];
                    const movements = selectedNote.movements || [];

                    // Calculate pending days for current holder
                    const calculatePendingDuration = () => {
                      const nowTime = Date.now();
                      let enteredTime = selectedNote.officerPendingSince ? new Date(selectedNote.officerPendingSince).getTime() : null;
                      if (!enteredTime && movements.length > 0) {
                        const lastMvt = [...movements].reverse().find(m => m.toOffice === selectedNote.currentOffice || ['SUBMIT', 'FORWARD', 'RETURN'].includes(m.action));
                        if (lastMvt) {
                          const parsed = new Date(lastMvt.timestamp || lastMvt.date || '').getTime();
                          if (!isNaN(parsed)) enteredTime = parsed;
                        }
                      }
                      if (!enteredTime) enteredTime = new Date(selectedNote.createdAt || selectedNote.date).getTime();
                      const days = Math.floor((nowTime - (enteredTime || nowTime)) / 86400000);
                      return Math.max(0, days);
                    };

                    const pendingDaysCount = calculatePendingDuration();

                    return chainSteps.map((stepRole, idx) => {
                      let isCompleted = false;
                      let isCurrent = false;
                      let stepTitle = '';
                      let approverName = '';
                      let approvalTimestamp = '';
                      let approvalId = '';

                      if (stepRole === 'FACULTY') {
                        stepTitle = '1. Faculty (Creator)';
                        isCompleted = true;
                        approverName = selectedNote.creatorName;
                        approvalTimestamp = selectedNote.date;
                      } else if (stepRole === 'HOD') {
                        stepTitle = '2. HOD Endorsement';
                        const m = movements.find(mvt => (mvt.fromUserRole === 'HOD' || (mvt.fromUser && mvt.fromUser.includes('HOD'))) && (mvt.action === 'APPROVE' || mvt.action === 'FORWARD'));
                        if (m) {
                          isCompleted = true;
                          approverName = m.actorName || m.fromUser.split(' (')[0];
                          approvalTimestamp = m.timestamp || `${m.date} ${m.time}`;
                          approvalId = m.approvalId || '';
                        } else if (selectedNote.status === 'PENDING_HOD' || selectedNote.currentOffice === 'HOD') {
                          isCurrent = true;
                          approverName = selectedNote.currentAssigneeName || 'Head of Department';
                        }
                      } else if (stepRole === 'HOI' || stepRole === 'PRINCIPAL') {
                        stepTitle = '3. HOI / Principal';
                        const m = movements.find(mvt => (mvt.fromUserRole === 'PRINCIPAL' || (mvt.fromUser && (mvt.fromUser.includes('PRINCIPAL') || mvt.fromUser.includes('HOI')))) && (mvt.action === 'APPROVE' || mvt.action === 'FORWARD'));
                        if (m) {
                          isCompleted = true;
                          approverName = m.actorName || m.fromUser.split(' (')[0];
                          approvalTimestamp = m.timestamp || `${m.date} ${m.time}`;
                          approvalId = m.approvalId || '';
                        } else if (selectedNote.status === 'PENDING_HOI' || selectedNote.currentOffice === 'HOI' || selectedNote.currentOffice === 'PRINCIPAL') {
                          isCurrent = true;
                          approverName = selectedNote.currentAssigneeName || 'Principal / HOI';
                        }
                      } else if (stepRole === 'DEPUTY_REGISTRAR') {
                        stepTitle = '4. Deputy Registrar';
                        const m = movements.find(mvt => (mvt.fromUserRole === 'DEPUTY_REGISTRAR' || (mvt.fromUser && mvt.fromUser.includes('DEPUTY_REGISTRAR'))) && (mvt.action === 'APPROVE' || mvt.action === 'FORWARD'));
                        if (m) {
                          isCompleted = true;
                          approverName = m.actorName || m.fromUser.split(' (')[0];
                          approvalTimestamp = m.timestamp || `${m.date} ${m.time}`;
                          approvalId = m.approvalId || '';
                        } else if (selectedNote.status === 'PENDING_DEPUTY_REGISTRAR' || selectedNote.currentOffice === 'DEPUTY_REGISTRAR') {
                          isCurrent = true;
                          approverName = selectedNote.currentAssigneeName || 'Deputy Registrar';
                        }
                      } else if (stepRole === 'REGISTRAR') {
                        stepTitle = '5. Registrar Review';
                        const m = movements.find(mvt => (mvt.fromUserRole === 'REGISTRAR' || (mvt.fromUser && mvt.fromUser.includes('REGISTRAR'))) && (mvt.action === 'APPROVE' || mvt.action === 'FORWARD'));
                        if (m) {
                          isCompleted = true;
                          approverName = m.actorName || m.fromUser.split(' (')[0];
                          approvalTimestamp = m.timestamp || `${m.date} ${m.time}`;
                          approvalId = m.approvalId || '';
                        } else if (selectedNote.status === 'PENDING_REGISTRAR' || selectedNote.currentOffice === 'REGISTRAR') {
                          isCurrent = true;
                          approverName = selectedNote.currentAssigneeName || 'Registrar';
                        }
                      } else if (stepRole === 'VICE_PRESIDENT') {
                        stepTitle = '6. Vice President (Sanction)';
                        if (selectedNote.status === 'APPROVED' || selectedNote.decision === 'APPROVED') {
                          isCompleted = true;
                          approverName = selectedNote.approvedByName || 'Vice President';
                          approvalTimestamp = selectedNote.approvedAt ? new Date(selectedNote.approvedAt).toLocaleString() : selectedNote.date;
                          approvalId = selectedNote.finalApprovalId || '';
                        } else if (selectedNote.status === 'PENDING_VICE_PRESIDENT' || selectedNote.currentOffice === 'VICE_PRESIDENT') {
                          isCurrent = true;
                          approverName = selectedNote.currentAssigneeName || 'Vice President';
                        }
                      } else {
                        stepTitle = stepRole;
                        const m = movements.find(mvt => (mvt.fromUserRole === stepRole || (mvt.fromUser && mvt.fromUser.includes(stepRole))) && (mvt.action === 'APPROVE' || mvt.action === 'FORWARD'));
                        if (m) {
                          isCompleted = true;
                          approverName = m.actorName || m.fromUser.split(' (')[0];
                          approvalTimestamp = m.timestamp || `${m.date} ${m.time}`;
                        } else if (selectedNote.currentOffice === stepRole) {
                          isCurrent = true;
                          approverName = selectedNote.currentAssigneeName || stepRole;
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition relative overflow-hidden ${
                            isCompleted
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                              : isCurrent
                              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700/80 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/50 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-80'
                          }`}
                        >
                          {/* Top progress accent stripe */}
                          <div className={`absolute top-0 left-0 right-0 h-1 ${
                            isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-amber-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'
                          }`} />

                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="uppercase tracking-wider truncate text-[11px]">{stepTitle}</span>
                              {isCompleted ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                </span>
                              ) : isCurrent ? (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold animate-pulse shrink-0 ml-1">
                                  <Clock className="w-3.5 h-3.5" /> Pending
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] shrink-0 ml-1">○ Upcoming</span>
                              )}
                            </div>

                            <div className="text-xs font-semibold truncate">
                              {approverName || (isCurrent ? 'Awaiting Action' : 'Upcoming Stage')}
                            </div>

                            {/* Pending duration badge if currently pending */}
                            {isCurrent && (
                              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-2 py-0.5 rounded-md inline-block">
                                ⏳ Pending for {pendingDaysCount} day{pendingDaysCount === 1 ? '' : 's'}
                              </div>
                            )}
                          </div>

                          {approvalTimestamp && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 mt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 truncate">
                              {approvalTimestamp}
                            </div>
                          )}
                          {approvalId && (
                            <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                              ID: {approvalId}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Tracking summary bar for creator */}
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Live Status:</span>
                    <Badge variant={selectedNote.status === 'APPROVED' ? 'success' : selectedNote.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {selectedNote.status}
                    </Badge>
                    <span className="text-slate-500">• Current Holder: <strong className="text-slate-800 dark:text-slate-200">{selectedNote.currentOffice || 'Office'}</strong></span>
                  </div>
                  <div className="text-slate-500">
                    Created on <strong className="text-slate-700 dark:text-slate-300">{selectedNote.date}</strong> by <strong className="text-slate-700 dark:text-slate-300">{selectedNote.creatorName}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Registrar Office Official Tracking (Inward & Outward Register) */}
            {(selectedNote.status === 'APPROVED' || selectedNote.inwardNumber || selectedNote.outwardNumber) && (
              <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Registrar Office Tracking &amp; Official Registry
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                    selectedNote.outwardNumber
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {selectedNote.outwardNumber ? 'Dispatched / Completed' : 'Inward Registered'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inward Register Information */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inward Entry (Registrar Registry)</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500">Inward Number:</span>
                      <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
                        {selectedNote.inwardNumber || 'REG-IN-PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>Inward Date:</span>
                      <span className="font-medium">{selectedNote.inwardDate || selectedNote.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>Received By:</span>
                      <span className="font-medium">{selectedNote.inwardReceivedByName || 'Registrar Directorate'}</span>
                    </div>
                  </div>

                  {/* Outward Dispatch Information */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outward Entry (Dispatched)</span>
                      {selectedNote.outwardNumber ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pending Dispatch
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500">Outward Number:</span>
                      <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
                        {selectedNote.outwardNumber || 'Pending Registrar Dispatch'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>Outward Date:</span>
                      <span className="font-medium">{selectedNote.outwardDate || 'Awaiting Dispatch'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>Dispatched To:</span>
                      <span className="font-medium">{selectedNote.outwardRecipient || selectedNote.creatorName || 'Faculty / Staff'}</span>
                    </div>
                    {role && !selectedNote.outwardNumber && ['REGISTRAR', 'ADMIN', 'SUPER_ADMIN', 'VICE_PRESIDENT'].includes(role) && (
                      <button
                        onClick={() => {
                          const res = db.processRegistrarOutwardForNotesheet(selectedNote.id, {}, user);
                          if (res.success) {
                            setSelectedNote({ ...db.getNoteSheetById(selectedNote.id)! });
                            setNoteSheets(db.getScopedNoteSheets(user, role));
                          }
                        }}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" /> Generate &amp; Dispatch Outward
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Version History & Amendments */}
            {selectedNote.versionHistory && selectedNote.versionHistory.length > 0 && (
              <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Document Version History &amp; Amendments
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {selectedNote.versionHistory.map((vh, vIdx) => (
                    <div key={vIdx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-purple-700 dark:text-purple-400 mr-2 font-mono">v{vh.version}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{vh.amendmentReason || 'Prior Version State'}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">By: {vh.changedByName} ({vh.changedDate})</div>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {vh.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Movement Timeline */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <GitCommit className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Official File Movement &amp; Remarks Timeline</span>
              </div>

              <div className="space-y-3.5 pl-2 border-l-2 border-blue-200 dark:border-blue-900 ml-2">
                {selectedNote.movements.map((mvt, idx) => (
                  <div key={mvt.id || idx} className="relative pl-4">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {mvt.fromUser} <ArrowRight className="w-3.5 h-3.5 inline mx-1 text-slate-400" /> {mvt.toUser}
                      </span>
                      <span className="text-xs text-slate-400">{mvt.timestamp}</span>
                    </div>
                    <div className="notesheet-prose-body text-sm text-slate-700 dark:text-slate-300 mt-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                      <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-xs mr-2">[{mvt.action}]</span>
                      {mvt.remarks}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Immutable Audit Trail */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Immutable Security Audit Trail</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedNote.auditTrail ? `${selectedNote.auditTrail.length} Logged Entries` : 'Audit Active'}
                </span>
              </div>

              {(!selectedNote.auditTrail || selectedNote.auditTrail.length === 0) ? (
                <div className="text-sm text-slate-400 italic p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  Initial audit baseline initialized upon creation.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Action</th>
                        <th className="p-3">User / Role</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">State Transition</th>
                        <th className="p-3">Audit Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {selectedNote.auditTrail.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{entry.action}</td>
                          <td className="p-3 font-medium">{entry.userName} <span className="text-xs text-slate-400">({entry.userRole})</span></td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{entry.timestamp || `${entry.date} ${entry.time}`}</td>
                          <td className="p-3 text-xs">
                            {entry.previousState && entry.newState && entry.previousState !== entry.newState ? (
                              <span className="font-mono font-semibold">{entry.previousState} <ArrowRight className="w-3 h-3 inline text-slate-400" /> {entry.newState}</span>
                            ) : (
                              <span className="font-mono text-slate-400">{entry.newState || '-'}</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 leading-relaxed">{entry.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="flex items-center justify-between flex-wrap gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowRemarkModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition"
              >
                <MessageSquare className="w-4 h-4" />
                Add Official Remark
              </button>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Clarification buttons */}
                {selectedNote.status === 'CLARIFICATION_REQUIRED' && selectedNote.creatorId === user?.id && (
                  <button
                    onClick={() => setShowProvideClarificationModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Provide Clarification
                  </button>
                )}

                {/* Draft Edit button */}
                {selectedNote.status === 'DRAFT' && selectedNote.creatorId === user?.id && (
                  <button
                    onClick={() => {
                      loadDraftIntoForm(selectedNote);
                      setSelectedNote(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Draft
                  </button>
                )}

                {/* Return Resubmit button */}
                {selectedNote.status === 'RETURNED' && selectedNote.creatorId === user?.id && (
                  <button
                    onClick={() => {
                      loadDraftIntoForm(selectedNote);
                      setSelectedNote(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit &amp; Resubmit (Same #)
                  </button>
                )}

                {/* Action Required Authorities */}
                {!['DRAFT', 'APPROVED', 'CLOSED', 'REJECTED'].includes(selectedNote.status) && (
                  <>
                    {db.hasNoteSheetPermission(user, role, 'NOTESHEET_APPROVE') && (
                      <button
                        onClick={() => {
                          setActionType('APPROVE');
                          setIsRevisingAmount(false);
                          const curr = selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0);
                          setRevisedAmountInput(curr);
                          setRevisionReasonInput('');
                          setShowActionModal(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve / Sanction
                      </button>
                    )}

                    {db.hasNoteSheetPermission(user, role, 'NOTESHEET_FORWARD') && (
                      <button
                        onClick={() => {
                          setActionType('FORWARD');
                          setIsRevisingAmount(false);
                          const curr = selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0);
                          setRevisedAmountInput(curr);
                          setRevisionReasonInput('');
                          setShowActionModal(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Forward
                      </button>
                    )}

                    {db.hasNoteSheetPermission(user, role, 'NOTESHEET_RETURN') && (
                      <button
                        onClick={() => { setActionType('RETURN'); setShowActionModal(true); }}
                        className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                      >
                        <CornerUpLeft className="w-4 h-4" />
                        Return
                      </button>
                    )}

                    {db.hasNoteSheetPermission(user, role, 'NOTESHEET_CLARIFICATION') && (
                      <button
                        onClick={() => setShowClarificationModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Query
                      </button>
                    )}
                  </>
                )}

                {/* Create Amendment Version for Approved Notesheets */}
                {selectedNote.status === 'APPROVED' && (
                  <button
                    onClick={() => {
                      setAmendmentReasonInput('');
                      setShowAmendmentModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <GitFork className="w-4 h-4" />
                    Create Amendment Version
                  </button>
                )}

                {/* Post-Approval Action Taken / Close */}
                {selectedNote.status === 'APPROVED' && db.hasNoteSheetPermission(user, role, 'NOTESHEET_ACTION') && (
                  <button
                    onClick={() => setShowActionTakenModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Record Action Taken
                  </button>
                )}

                {selectedNote.status === 'ACTION_COMPLETED' && db.hasNoteSheetPermission(user, role, 'NOTESHEET_CLOSE') && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to close and archive Notesheet ${selectedNote.noteSheetNumber}?`)) {
                        try {
                          db.processNoteSheetAction(selectedNote.id, 'CLOSE', 'Completed and closed.', undefined, user!);
                          refreshData();
                          showFeedback('Notesheet successfully closed.');
                        } catch (e: any) {
                          showFeedback(e.message || 'Cannot close notesheet', true);
                        }
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
                  >
                    <FolderArchive className="w-4 h-4" />
                    Close Notesheet
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 2: APPROVE / FORWARD / RETURN ACTION MODAL ──────────────── */}
      {showActionModal && selectedNote && (
        <Modal
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          title={`${actionType === 'APPROVE' ? 'Approve & Sanction' : actionType === 'FORWARD' ? 'Forward Notesheet' : 'Return Notesheet'}: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            {(actionType === 'APPROVE' || actionType === 'FORWARD') && selectedNote.financialRequirement && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Financial Amount Review</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRevisingAmount(false);
                        setRevisedAmountInput(selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0));
                        setRevisionReasonInput('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!isRevisingAmount ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      Keep Current Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRevisingAmount(true);
                        if (revisedAmountInput === undefined) {
                          setRevisedAmountInput(selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0));
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${isRevisingAmount ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      Revise Amount
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500">Original Requested:</span>
                    <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                      ₹{(selectedNote.originalRequestedAmount || selectedNote.requestedAmount || selectedNote.estimatedCost || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Current Proposed Amount:</span>
                    <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                      ₹{(selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {isRevisingAmount && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          New Revised Amount (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={revisedAmountInput !== undefined ? revisedAmountInput : ''}
                          onChange={e => setRevisedAmountInput(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm font-mono font-bold"
                          placeholder="Enter new amount"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Calculated Change
                        </label>
                        {(() => {
                          const curr = selectedNote.currentAmount !== undefined ? selectedNote.currentAmount : (selectedNote.requestedAmount || selectedNote.estimatedCost || 0);
                          const rev = revisedAmountInput !== undefined ? revisedAmountInput : curr;
                          const diff = rev - curr;
                          return (
                            <div className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border ${diff < 0 ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900' : diff > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800'}`}>
                              {diff > 0 ? `+₹${diff.toLocaleString('en-IN')} (Increase)` : diff < 0 ? `-₹${Math.abs(diff).toLocaleString('en-IN')} (Decrease)` : '₹0 (No Change)'}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                        Reason / Remarks for Amount Revision *
                      </label>
                      <input
                        type="text"
                        value={revisionReasonInput}
                        onChange={e => setRevisionReasonInput(e.target.value)}
                        placeholder="e.g. Budget optimization, Scope adjustment, Market negotiation..."
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {(actionType === 'FORWARD' || actionType === 'APPROVE') && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {actionType === 'APPROVE' ? 'Forward To Next Authority (Optional Override):' : 'Forward To Authority Office:'}
                </label>
                <select
                  value={forwardOffice}
                  onChange={e => setForwardOffice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="">Next in Organogram Sequence (Recommended)</option>
                  <option value="HOD">HOD (Head of Department)</option>
                  <option value="HOI">HOI (Head of Institute / Principal)</option>
                  <option value="DEPUTY_REGISTRAR">Deputy Registrar Office</option>
                  <option value="ACADEMIC_DEAN">Academic Dean</option>
                  <option value="REGISTRAR">Registrar Secretariat</option>
                  <option value="VICE_PRESIDENT">Vice President Office</option>
                  <option value="FINANCE">Finance &amp; Accounts Officer</option>
                  <option value="EXAM_CELL">Controller of Examination</option>
                  <option value="PROVOST">Provost / Vice-Chancellor</option>
                  <option value="COMPLETED">Final Sanction &amp; Close (Final Authority Only)</option>
                </select>
                {actionType === 'APPROVE' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ℹ Intermediate endorsement forwards this Notesheet to the next authority stage. Final approval is recorded by the terminal authority in the hierarchy (Vice President).
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {actionType === 'RETURN' ? 'Mandatory Return Reason *' : 'Official Endorsement Remarks:'}
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={e => setActionRemarks(e.target.value)}
                placeholder={actionType === 'RETURN' ? 'Specify required revisions or errors to correct...' : 'Enter official endorsement note...'}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-sm"
              >
                Confirm {actionType === 'APPROVE' ? (role === 'VICE_PRESIDENT' ? 'Approve & Finalize' : 'Approve & Forward') : actionType}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 3: REQUEST CLARIFICATION MODAL ─────────────────────────── */}
      {showClarificationModal && selectedNote && (
        <Modal
          isOpen={showClarificationModal}
          onClose={() => setShowClarificationModal(false)}
          title={`Request Clarification: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Query / Question for Creator *</label>
              <textarea
                rows={4}
                value={clarificationQueryInput}
                onChange={e => setClarificationQueryInput(e.target.value)}
                placeholder="State your clarification question regarding scope, budget, quotation, or justification..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowClarificationModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Cancel</button>
              <button
                onClick={() => {
                  if (!clarificationQueryInput.trim()) return showFeedback('Query is mandatory', true);
                  db.processNoteSheetAction(selectedNote.id, 'REQUEST_CLARIFICATION', clarificationQueryInput.trim(), undefined, user!);
                  showFeedback('Clarification query dispatched to creator.');
                  setShowClarificationModal(false);
                  setClarificationQueryInput('');
                  refreshData();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition shadow-sm"
              >
                Send Clarification Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 4: PROVIDE CLARIFICATION MODAL ─────────────────────────── */}
      {showProvideClarificationModal && selectedNote && (
        <Modal
          isOpen={showProvideClarificationModal}
          onClose={() => setShowProvideClarificationModal(false)}
          title={`Respond to Clarification: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clarification Response &amp; Details *</label>
              <textarea
                rows={4}
                value={clarificationResponseInput}
                onChange={e => setClarificationResponseInput(e.target.value)}
                placeholder="Provide detailed clarification answers and updated details..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowProvideClarificationModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Cancel</button>
              <button
                onClick={() => {
                  if (!clarificationResponseInput.trim()) return showFeedback('Response is mandatory', true);
                  db.processNoteSheetAction(selectedNote.id, 'PROVIDE_CLARIFICATION', clarificationResponseInput.trim(), undefined, user!);
                  showFeedback('Clarification submitted. Notesheet returned to review.');
                  setShowProvideClarificationModal(false);
                  setClarificationResponseInput('');
                  refreshData();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-sm"
              >
                Submit Response
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 5: RECORD ACTION TAKEN MODAL ────────────────────────────── */}
      {showActionTakenModal && selectedNote && (
        <Modal
          isOpen={showActionTakenModal}
          onClose={() => setShowActionTakenModal(false)}
          title={`Record Action Taken: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Action Taken Description *</label>
              <textarea
                rows={3}
                value={actionTakenSummaryInput}
                onChange={e => setActionTakenSummaryInput(e.target.value)}
                placeholder="Describe execution, work order, dispatch, procurement, or completion details..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proof / Completion Document URL</label>
              <input
                type="text"
                value={actionTakenProofUrlInput}
                onChange={e => setActionTakenProofUrlInput(e.target.value)}
                placeholder="https://erp.swarrnim.edu.in/docs/action_proof.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowActionTakenModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Cancel</button>
              <button
                onClick={() => {
                  if (!actionTakenSummaryInput.trim()) return showFeedback('Action taken description is required', true);
                  db.processNoteSheetAction(selectedNote.id, 'ACTION_TAKEN', actionTakenSummaryInput.trim(), actionTakenProofUrlInput || undefined, user!, undefined, {
                    actionTakenSummary: actionTakenSummaryInput.trim(),
                    proofUrl: actionTakenProofUrlInput || undefined
                  });
                  showFeedback('Action Taken recorded successfully.');
                  setShowActionTakenModal(false);
                  setActionTakenSummaryInput('');
                  refreshData();
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold transition shadow-sm"
              >
                Save Action Taken
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 6: ADD OFFICIAL REMARK MODAL ────────────────────────────── */}
      {showRemarkModal && selectedNote && (
        <Modal
          isOpen={showRemarkModal}
          onClose={() => setShowRemarkModal(false)}
          title={`Add Official Remark: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Official Remark / Note *</label>
              <textarea
                rows={3}
                value={newRemarkInput}
                onChange={e => setNewRemarkInput(e.target.value)}
                placeholder="Enter discussion comment, departmental note or observation..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowRemarkModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Cancel</button>
              <button
                onClick={() => {
                  if (!newRemarkInput.trim()) return showFeedback('Remark cannot be empty', true);
                  db.processNoteSheetAction(selectedNote.id, 'ADD_REMARK', newRemarkInput.trim(), undefined, user!);
                  showFeedback('Remark added to discussion thread.');
                  setShowRemarkModal(false);
                  setNewRemarkInput('');
                  refreshData();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-sm"
              >
                Post Remark
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 7: UPLOAD ATTACHMENT VERSION MODAL ──────────────────────── */}
      {showUploadVersionModal && selectedNote && (
        <Modal
          isOpen={showUploadVersionModal}
          onClose={() => setShowUploadVersionModal(false)}
          title={`Upload Document Version: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document Title / File Name *</label>
              <input
                type="text"
                placeholder="e.g. Revised Quotation, Compliance Letter..."
                value={versionDocName}
                onChange={e => setVersionDocName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document Category</label>
              <select
                value={versionDocCategory}
                onChange={e => setVersionDocCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
              >
                {DOCUMENT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">File URL / Cloud Link</label>
              <input
                type="text"
                placeholder="https://erp.swarrnim.edu.in/docs/revised_quote_v2.pdf"
                value={versionDocUrl}
                onChange={e => setVersionDocUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setShowUploadVersionModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Cancel</button>
              <button
                onClick={() => {
                  if (!versionDocName.trim()) return showFeedback('Document Name is required', true);
                  db.addNoteSheetAttachment(
                    selectedNote.id,
                    versionDocName.trim(),
                    versionDocType,
                    versionDocUrl.trim() || `https://erp.swarrnim.edu.in/docs/${versionDocName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
                    user!,
                    1024 * 1024,
                    versionDocCategory
                  );
                  showFeedback('Document version added to audit repository.');
                  setShowUploadVersionModal(false);
                  setVersionDocName('');
                  setVersionDocUrl('');
                  refreshData();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-sm"
              >
                Upload Version
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 8: EXCEL IMPORT MODAL ───────────────────────────────────── */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => { setShowImportModal(false); setImportErrors([]); }}
          title="Import Notesheets from Official Excel (.xlsx)"
          maxWidth="750px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Official Template Required</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Only .xlsx format. Numbers are auto-generated atomically per Institute.
                </p>
              </div>
              <button
                onClick={() => notesheetImportService.downloadImportTemplate()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Template (.xlsx)
              </button>
            </div>

            <div className="p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
              <input
                type="file"
                accept=".xlsx"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-500"
              />
              <p className="text-xs text-slate-400">Upload filled Notesheet_Import_Template.xlsx</p>
            </div>

            {importErrors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
                <span className="text-sm font-bold text-rose-700">Validation Errors ({importErrors.length}):</span>
                <ul className="text-xs text-rose-600 list-disc pl-4 space-y-0.5 max-h-36 overflow-y-auto">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>Row {err.row}: [{err.field}] {err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Cancel</button>
              <button
                disabled={!importFile || importLoading}
                onClick={async () => {
                  if (!importFile || !user) return;
                  setImportLoading(true);
                  try {
                    const res = await notesheetImportService.parseAndImportNotesheets(importFile, user, true);
                    if (res.success) {
                      showFeedback(`Successfully imported ${res.importedCount} draft Notesheets.`);
                      setShowImportModal(false);
                      setImportFile(null);
                      refreshData();
                    } else {
                      setImportErrors(res.errors);
                    }
                  } catch (e: any) {
                    showFeedback(e.message || 'Import failed', true);
                  } finally {
                    setImportLoading(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 transition shadow-sm"
              >
                {importLoading ? 'Validating...' : 'Import Notesheets'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 9: PRE-SUBMISSION VALIDATION & PREVIEW MODAL ───────────── */}
      {showValidationPreviewModal && (
        <Modal
          isOpen={showValidationPreviewModal}
          onClose={() => setShowValidationPreviewModal(false)}
          title="Pre-Submission Notesheet Preview & Verification"
          maxWidth="1050px"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800 no-print flex-wrap gap-2">
              <div>
                <div className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Pre-Submission Document Verification
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Review the authentic official University Notesheet layout before final submission into the approval hierarchy.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowValidationPreviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Edit Form
                </button>
                <button
                  onClick={() => draftPreviewNoteSheet && handlePrintDraftPdf(draftPreviewNoteSheet)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-600 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Print official draft Notesheet PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? 'Preparing...' : 'Print Draft PDF'}
                </button>
                <button
                  onClick={() => {
                    setShowValidationPreviewModal(false);
                    handleSubmitNotesheet();
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Notesheet Now
                </button>
              </div>
            </div>

            {/* Canonical Vector PDF Document Preview Canvas */}
            <div className="university-notesheet-preview-container max-h-[75vh] h-[75vh] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-inner">
              {draftPreviewPdfUrl ? (
                <iframe
                  src={`${draftPreviewPdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0 bg-white"
                  title="Official Draft Notesheet Document PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Rendering Official Vector Notesheet PDF...
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Building pixel-perfect A4 University document stream.
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 10: OFFICIAL UNIVERSITY NOTESHEET DOCUMENT (PREVIEW = PRINT = PDF) ─── */}
      {showPrintModal && selectedNote && (
        <Modal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Official Notesheet Document: ${selectedNote.noteSheetNumber}`}
          maxWidth="1050px"
        >
          <div className="space-y-4">
            {/* Top Toolbar / Action Controls (Hidden during print) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl no-print border border-slate-200 dark:border-slate-700 flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#0F2C59]/10 dark:bg-[#0097D7]/15">
                  <FileText className="w-5 h-5 text-[#0F2C59] dark:text-[#0097D7]" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Swarrnim University Official Notesheet
                  </div>
                  <div className="text-[11px] text-slate-500">
                    A4 Portrait • High Fidelity Template • Preview, Print &amp; PDF Unified
                  </div>
                </div>
              </div>

              {/* Viewport Scale & Print Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Print Official PDF Button */}
                <button
                  onClick={() => handlePrintBackendPdf(selectedNote.id)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                  title="Print official Notesheet PDF directly"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? 'Preparing...' : 'Print Document'}
                </button>

                {/* Open in PDF Viewer Tab */}
                <button
                  onClick={() => handleOpenPdfInNewTab(selectedNote.id)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                  title="Open official PDF in full browser tab / native viewer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Open PDF Viewer
                </button>

                {/* Download Backend PDF Button */}
                <button
                  onClick={() => handleDownloadBackendPdf(selectedNote.id)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Generate and download secure backend PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}
                </button>

                {/* Regenerate PDF Button */}
                <button
                  onClick={() => handleRegenerateBackendPdf(selectedNote.id)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-600 transition cursor-pointer"
                  title="Force regenerate fresh official PDF version"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                  Regenerate PDF
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Canonical Vector PDF Document Preview Canvas */}
            <div className="university-notesheet-preview-container max-h-[78vh] h-[78vh] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-inner">
              {modalPreviewPdfUrl ? (
                <iframe
                  src={`${modalPreviewPdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0 bg-white"
                  title={`Official Notesheet PDF - ${selectedNote.noteSheetNumber}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Rendering Official Vector Notesheet PDF...
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Building pixel-perfect A4 University document stream.
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 8: CREATE AMENDMENT VERSION MODAL ───────────────────────── */}
      {showAmendmentModal && selectedNote && (
        <Modal
          isOpen={showAmendmentModal}
          onClose={() => setShowAmendmentModal(false)}
          title={`Create Amendment Version: ${selectedNote.noteSheetNumber}`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300">
              <strong>University Statutory Amendment Notice:</strong> Creating an amendment will snapshot the current version (v{selectedNote.version || '1.0'}) into the permanent audit ledger and advance this Notesheet to a new editable version for authorized amendments without overwriting historical records.
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mandatory Amendment Justification *</label>
              <textarea
                rows={3}
                value={amendmentReasonInput}
                onChange={e => setAmendmentReasonInput(e.target.value)}
                placeholder="Specify the official justification for amendment (e.g., revised scope, vendor adjustment, updated regulatory requirements)..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowAmendmentModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!amendmentReasonInput.trim()) {
                    showFeedback('Amendment justification is mandatory.', true);
                    return;
                  }
                  try {
                    const res = db.createNoteSheetAmendmentVersion(selectedNote.id, amendmentReasonInput.trim(), user!);
                    if (res.success && res.notesheet) {
                      setSelectedNote(res.notesheet);
                      refreshData();
                      setShowAmendmentModal(false);
                      showFeedback(`Amendment version v${res.notesheet.version} created successfully.`);
                    } else {
                      showFeedback(res.message || 'Failed to create amendment version', true);
                    }
                  } catch (e: any) {
                    showFeedback(e.message || 'Failed to create amendment version', true);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition shadow-sm"
              >
                Create Version
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 9: BULK OPERATIONS MODAL ─────────────────────────────────── */}
      {showBulkModal && bulkActionType && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title={`Confirm Bulk ${bulkActionType}: ${selectedNotesheetIds.length} Notesheets`}
          maxWidth="600px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
              You are about to execute <strong>{bulkActionType}</strong> across <strong>{selectedNotesheetIds.length}</strong> selected Notesheets. Each document will receive an individual cryptographically logged audit entry.
            </div>

            {(bulkActionType === 'FORWARD' || bulkActionType === 'APPROVE') && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Forward To Office (Optional Override):</label>
                <select
                  value={bulkForwardOffice}
                  onChange={e => setBulkForwardOffice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="">Next in Organogram Sequence</option>
                  <option value="HOD">HOD (Head of Department)</option>
                  <option value="HOI">HOI (Head of Institute / Principal)</option>
                  <option value="DEPUTY_REGISTRAR">Deputy Registrar Office</option>
                  <option value="ACADEMIC_DEAN">Academic Dean</option>
                  <option value="REGISTRAR">Registrar Secretariat</option>
                  <option value="VICE_PRESIDENT">Vice President Office</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {bulkActionType === 'RETURN' ? 'Mandatory Return Reason *' : 'Official Bulk Remarks:'}
              </label>
              <textarea
                rows={3}
                value={bulkRemarks}
                onChange={e => setBulkRemarks(e.target.value)}
                placeholder={bulkActionType === 'RETURN' ? 'Specify required corrections...' : 'Enter official bulk processing remark...'}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkActionType === 'RETURN' && !bulkRemarks.trim()) {
                    showFeedback('Return remarks are mandatory.', true);
                    return;
                  }
                  const res = db.processBulkNoteSheetActions(
                    selectedNotesheetIds,
                    bulkActionType,
                    bulkRemarks.trim() || `Bulk ${bulkActionType} executed`,
                    user!,
                    bulkForwardOffice || undefined
                  );
                  showFeedback(`Bulk processed ${res.successCount} of ${selectedNotesheetIds.length} notesheets.`);
                  setSelectedNotesheetIds([]);
                  setShowBulkModal(false);
                  refreshData();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-sm"
              >
                Confirm Bulk {bulkActionType}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 10: ATTACHMENT PREVIEW MODAL ──────────────────────────────── */}
      {previewAttachmentModal && (
        <Modal
          isOpen={!!previewAttachmentModal}
          onClose={() => setPreviewAttachmentModal(null)}
          title={`Document Preview: ${previewAttachmentModal.fileName}`}
          maxWidth="900px"
        >
          <div className="notesheet-modal-scope space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewAttachmentModal.fileName}</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold dark:bg-blue-900/60 dark:text-blue-300">
                  {previewAttachmentModal.documentCategory || 'Attachment'}
                </span>
                <span className="text-slate-500 font-mono">
                  {previewAttachmentModal.fileSizeFormatted || formatFileSize(previewAttachmentModal.fileSize || 0)}
                </span>
              </div>
              <a
                href={previewAttachmentModal.fileUrl}
                download={previewAttachmentModal.fileName}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>

            <div className="max-h-[70vh] min-h-[350px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(previewAttachmentModal.fileType?.toUpperCase()) ? (
                <img
                  src={previewAttachmentModal.fileUrl}
                  alt={previewAttachmentModal.fileName}
                  className="max-h-[68vh] max-w-full object-contain p-2"
                />
              ) : previewAttachmentModal.fileType?.toUpperCase() === 'PDF' ? (
                <iframe
                  src={`${previewAttachmentModal.fileUrl}#toolbar=0`}
                  title={previewAttachmentModal.fileName}
                  className="w-full h-[68vh] border-0"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Preview not available directly for {previewAttachmentModal.fileType} format.
                  </div>
                  <a
                    href={previewAttachmentModal.fileUrl}
                    download={previewAttachmentModal.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const FileSignatureIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
