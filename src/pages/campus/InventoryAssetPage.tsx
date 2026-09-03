import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import * as XLSX from 'xlsx';
import { 
  inventoryManagementService, 
  InventoryDashboardKPIs,
  FacultyAssetDashboardData,
  HODAssetDashboardData,
  HOIAssetDashboardData
} from '../../services/inventoryManagementService';
import {
  FixedAsset, ConsumableItem, StockTransactionRecord, PhysicalFileRecord,
  AssetAssignmentRecord, AssetTransferRecord, AssetMaintenanceRecord,
  PhysicalVerificationRecord, AssetDisposalRecord, InventoryAuditRecord,
  InventoryCategoryItem, InventoryLocationRecord, AssetStatus, AssetCondition,
  InventoryCategoryGroup, AssetMovementRecord, AssetTransferRequestRecord,
  AssetReturnRequestRecord, AssetReplacementRequestRecord, AssetIssueReportRecord,
  AssetRequestRecord, AssetRequisitionType, AssetRequisitionStatus, User
} from '../../types';
import {
  Boxes, Plus, Search, Filter, Download, Upload, Eye, Edit2, ArrowRightLeft,
  Wrench, ShieldCheck, Trash2, QrCode, FileText, CheckCircle2, AlertTriangle,
  Clock, Package, Archive, Layers, HardDrive, RefreshCw, X, Check, Printer,
  UserCheck, AlertCircle, Building2, ChevronRight, FileSpreadsheet, History,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, RotateCcw, Sparkles, Send,
  Shield, CheckSquare, BarChart3, AlertOctagon, HelpCircle, FileCheck,
  Smartphone, Monitor, Tag, UserPlus, Laptop, CheckCircle, PackagePlus,
  SendHorizontal, FileArchive, SearchCode, FolderArchive, ArrowDownToLine,
  Calendar, MapPin, AlertCircle as AlertIcon
} from 'lucide-react';

export type InventoryTabType =
  | 'DASHBOARD'
  | 'ASSET_REGISTER'
  | 'CONSUMABLES_STOCK'
  | 'STATIONERY_REGISTER'
  | 'DEPARTMENT_STORE'
  | 'ASSET_ASSIGNMENT'
  | 'STOCK_TRANSACTIONS'
  | 'MAINTENANCE'
  | 'PHYSICAL_VERIFICATION'
  | 'TRANSFERS'
  | 'DISPOSAL'
  | 'PHYSICAL_FILES'
  | 'EXCEL_IMPORT'
  | 'REPORTS'
  | 'AUDIT_LOG'
  | 'REPORTS_AUDIT';

export type FacultySubTabType = 
  | 'MY_ASSETS'
  | 'ASSET_REQUESTS'
  | 'TRANSFER_REQUESTS'
  | 'RETURN_REQUESTS'
  | 'REPLACEMENT_REQUESTS'
  | 'REPORTED_ISSUES';

export type HODSubTabType =
  | 'DEPT_REGISTER'
  | 'ASSET_REQUISITIONS'
  | 'FACULTY_ASSIGNMENTS'
  | 'TRANSFER_APPROVALS'
  | 'RETURN_INSPECTIONS'
  | 'REPLACEMENT_REVIEWS'
  | 'ISSUE_REPORTS'
  | 'MOVEMENT_HISTORY';

export type HOISubTabType =
  | 'INST_REGISTER'
  | 'REPLACEMENT_APPROVALS'
  | 'DEPT_ALLOCATIONS'
  | 'INST_MOVEMENTS';

interface Props {
  initialTab?: InventoryTabType;
  initialFacultySubTab?: FacultySubTabType;
}

export const InventoryAssetPage: React.FC<Props> = ({ 
  initialTab = 'DASHBOARD',
  initialFacultySubTab = 'MY_ASSETS'
}) => {
  const { user, role } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const isFacultyOrStaff = role === 'FACULTY' || (role as string) === 'STAFF' || role === 'MENTOR';
  const isHOD = role === 'HOD';
  const isHOI = (role as string) === 'HOI' || role === 'PRINCIPAL';
  const isCentralAdmin = ['SUPER_ADMIN', 'ADMIN', 'REGISTRAR', 'INVENTORY_OFFICER', 'ACCOUNTS_ADMIN'].includes(role || '');

  // Sub-tabs for specific roles
  const [facultyTab, setFacultyTab] = useState<FacultySubTabType>(initialFacultySubTab);
  const [hodTab, setHodTab] = useState<HODSubTabType>('DEPT_REGISTER');
  const [hoiTab, setHoiTab] = useState<HOISubTabType>('INST_REGISTER');
  const [activeTab, setActiveTab] = useState<InventoryTabType>(initialTab);

  // Common UI Modals
  const [selectedAssetForView, setSelectedAssetForView] = useState<FixedAsset | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrAsset, setQrAsset] = useState<FixedAsset | null>(null);

  // ── 8 STORE & CUSTODY QUICK ACTIONS MODALS ──
  const [showReceiveStockModal, setShowReceiveStockModal] = useState<boolean>(false);
  const [showIssueStockModal, setShowIssueStockModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showDirectTransferModal, setShowDirectTransferModal] = useState<boolean>(false);
  const [showDirectReturnModal, setShowDirectReturnModal] = useState<boolean>(false);
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);

  // ── Faculty Specific Action Modals ──
  const [showAssetReqModal, setShowAssetReqModal] = useState<boolean>(false);
  const [showTransferReqModal, setShowTransferReqModal] = useState<boolean>(false);
  const [showReturnReqModal, setShowReturnReqModal] = useState<boolean>(false);
  const [showReplacementReqModal, setShowReplacementReqModal] = useState<boolean>(false);
  const [showIssueReportModal, setShowIssueReportModal] = useState<boolean>(false);
  const [activeTargetAsset, setActiveTargetAsset] = useState<FixedAsset | null>(null);
  const [selectedRequisitionForDetails, setSelectedRequisitionForDetails] = useState<AssetRequestRecord | null>(null);

  // ── New Asset Request Form State ──
  const [reqType, setReqType] = useState<AssetRequisitionType>('NEW_ASSET');
  const [reqCategoryId, setReqCategoryId] = useState<string>('cat-it-1');
  const [reqAssetName, setReqAssetName] = useState<string>('');
  const [reqQuantity, setReqQuantity] = useState<number>(1);
  const [reqPurpose, setReqPurpose] = useState<string>('');
  const [reqFromDate, setReqFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reqUntilDate, setReqUntilDate] = useState<string>('');
  const [reqLocation, setReqLocation] = useState<string>('AI Research Lab (A-204)');
  const [reqPriority, setReqPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [reqRemarks, setReqRemarks] = useState<string>('');
  const [reqAttachment, setReqAttachment] = useState<string>('');

  // ── Receive Stock Form State ──
  const [recAssetName, setRecAssetName] = useState<string>('');
  const [recAssetTag, setRecAssetTag] = useState<string>('');
  const [recCategoryId, setRecCategoryId] = useState<string>('cat-it-1');
  const [recSerialNo, setRecSerialNo] = useState<string>('');
  const [recManufacturer, setRecManufacturer] = useState<string>('');
  const [recModelNo, setRecModelNo] = useState<string>('');
  const [recPurchaseDate, setRecPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recPurchasePrice, setRecPurchasePrice] = useState<number>(45000);
  const [recVendor, setRecVendor] = useState<string>('');
  const [recInvoiceRef, setRecInvoiceRef] = useState<string>('');
  const [recLocation, setRecLocation] = useState<string>('Central University Store');
  const [recRemarks, setRecRemarks] = useState<string>('');

  // ── Issue Stock Form State ──
  const [issueAssetId, setIssueAssetId] = useState<string>('');
  const [issueToUserId, setIssueToUserId] = useState<string>('');
  const [issueRecipientRole, setIssueRecipientRole] = useState<'HOI' | 'HOD'>('HOI');
  const [issueDeptId, setIssueDeptId] = useState<string>('');
  const [issueLocation, setIssueLocation] = useState<string>('');
  const [issueRemarks, setIssueRemarks] = useState<string>('');

  // ── Assign Asset Form State ──
  const [assignAssetId, setAssignAssetId] = useState<string>('');
  const [assignAssetItem, setAssignAssetItem] = useState<FixedAsset | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [assignPurpose, setAssignPurpose] = useState<string>('');
  const [assignLocation, setAssignLocation] = useState<string>('');
  const [assignRemarks, setAssignRemarks] = useState<string>('');

  // ── Direct Transfer Form State ──
  const [transferAssetId, setTransferAssetId] = useState<string>('');
  const [transferTargetUserId, setTransferTargetUserId] = useState<string>('');
  const [transferDirectReason, setTransferDirectReason] = useState<string>('');
  const [transferDirectLocation, setTransferDirectLocation] = useState<string>('');
  const [transferDirectRemarks, setTransferDirectRemarks] = useState<string>('');

  // ── Direct Return Form State ──
  const [returnDirectAssetId, setReturnDirectAssetId] = useState<string>('');
  const [returnDirectCondition, setReturnDirectCondition] = useState<AssetCondition>('GOOD');
  const [returnDirectRemarks, setReturnDirectRemarks] = useState<string>('');

  // ── Archive Form State ──
  const [archiveAssetId, setArchiveAssetId] = useState<string>('');
  const [archiveReason, setArchiveReason] = useState<string>('');
  const [archiveRemarks, setArchiveRemarks] = useState<string>('');

  // ── Maintenance Form State ──
  const [maintAssetId, setMaintAssetId] = useState<string>('');
  const [maintIssueDesc, setMaintIssueDesc] = useState<string>('');
  const [maintTechnician, setMaintTechnician] = useState<string>('University Central IT Support');
  const [maintEstCost, setMaintEstCost] = useState<number>(1500);
  const [maintRemarks, setMaintRemarks] = useState<string>('');

  // ── Verification Form State ──
  const [verifAssetId, setVerifAssetId] = useState<string>('');
  const [verifLocation, setVerifLocation] = useState<string>('');
  const [verifCondition, setVerifCondition] = useState<AssetCondition>('GOOD');
  const [verifStatus, setVerifStatus] = useState<'VERIFIED' | 'LOCATION_MISMATCH' | 'CUSTODIAN_MISMATCH' | 'DAMAGED' | 'MISSING'>('VERIFIED');
  const [verifRemarks, setVerifRemarks] = useState<string>('');

  // ── Faculty Request Form States ──
  const [targetFacultyId, setTargetFacultyId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferRemarks, setTransferRemarks] = useState<string>('');

  const [returnReason, setReturnReason] = useState<string>('');
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('GOOD');
  const [returnRemarks, setReturnRemarks] = useState<string>('');

  const [replacementReason, setReplacementReason] = useState<string>('');
  const [replacementProblem, setReplacementProblem] = useState<string>('');
  const [replacementCondition, setReplacementCondition] = useState<AssetCondition>('POOR');
  const [replacementPriority, setReplacementPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [replacementRemarks, setReplacementRemarks] = useState<string>('');

  const [issueType, setIssueType] = useState<'DAMAGED' | 'NOT_WORKING' | 'MISSING_PART' | 'TECHNICAL_PROBLEM' | 'PHYSICAL_DAMAGE' | 'LOST'>('TECHNICAL_PROBLEM');
  const [issueSeverity, setIssueSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [issueDesc, setIssueDesc] = useState<string>('');

  // HOD Approval & Review Modals
  const [selectedRequisitionForReview, setSelectedRequisitionForReview] = useState<AssetRequestRecord | null>(null);
  const [showRequisitionRejectModal, setShowRequisitionRejectModal] = useState<boolean>(false);
  const [requisitionRejectionReason, setRequisitionRejectionReason] = useState<string>('');
  const [showFulfillModal, setShowFulfillModal] = useState<boolean>(false);
  const [selectedRequisitionForFulfill, setSelectedRequisitionForFulfill] = useState<AssetRequestRecord | null>(null);
  const [fulfillAssetId, setFulfillAssetId] = useState<string>('');
  const [fulfillLocation, setFulfillLocation] = useState<string>('');

  const [selectedTransferForReview, setSelectedTransferForReview] = useState<AssetTransferRequestRecord | null>(null);
  const [selectedReturnForInspection, setSelectedReturnForInspection] = useState<AssetReturnRequestRecord | null>(null);
  const [selectedReplacementForHOD, setSelectedReplacementForHOD] = useState<AssetReplacementRequestRecord | null>(null);
  const [selectedReplacementForHOI, setSelectedReplacementForHOI] = useState<AssetReplacementRequestRecord | null>(null);
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<AssetIssueReportRecord | null>(null);

  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [inspectedCondition, setInspectedCondition] = useState<AssetCondition>('GOOD');
  const [allocatedReplacementTag, setAllocatedReplacementTag] = useState<string>('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // List of all faculty in institution/department for assignment dropdowns
  const allUsers = useMemo(() => db.getUsers(), [refreshTrigger]);
  const allAssets = useMemo(() => db.getFixedAssets(), [refreshTrigger]);
  const categories = useMemo(() => db.getInventoryCategories(), [refreshTrigger]);
  const departments = useMemo(() => db.getDepartments(), [refreshTrigger]);

  const departmentFaculty = useMemo(() => {
    return allUsers.filter(u => 
      u.role === 'FACULTY' || (u.role as string) === 'STAFF' || u.role === 'MENTOR'
    );
  }, [allUsers]);

  // Data Providers
  const facultyData: FacultyAssetDashboardData = useMemo(() => {
    if (!user) return {
      assignedAssets: [],
      totalAssignedCount: 0,
      inUseCount: 0,
      underMaintenanceCount: 0,
      pendingRequestsCount: 0,
      assetRequisitions: [],
      transferRequests: [],
      returnRequests: [],
      replacementRequests: [],
      issueReports: []
    };
    return inventoryManagementService.getFacultyDashboardData(user);
  }, [user, refreshTrigger]);

  const hodData: HODAssetDashboardData = useMemo(() => {
    if (!user) return {
      departmentAssets: [],
      totalAssetsCount: 0,
      assignedToFacultyCount: 0,
      assignedToStaffCount: 0,
      availableInStoreCount: 0,
      underMaintenanceCount: 0,
      damagedLostCount: 0,
      pendingAssetRequisitions: [],
      allDepartmentRequisitions: [],
      pendingTransferRequests: [],
      allDepartmentTransfers: [],
      pendingReturnRequests: [],
      allDepartmentReturns: [],
      pendingReplacementRequests: [],
      allDepartmentReplacements: [],
      activeIssueReports: [],
      allDepartmentIssues: [],
      recentMovements: []
    };
    return inventoryManagementService.getHODDashboardData(user);
  }, [user, refreshTrigger]);

  const [issueActionType, setIssueActionType] = useState<'SEND_TO_MAINTENANCE' | 'MARKED_DAMAGED' | 'RESOLVED'>('SEND_TO_MAINTENANCE');
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<{ title: string; data: Record<string, any> } | null>(null);

  const hoiData: HOIAssetDashboardData = useMemo(() => {
    if (!user) return {
      institutionAssets: [],
      totalAssetsCount: 0,
      institutionStoreCount: 0,
      allocatedToDeptsCount: 0,
      escalatedReplacementRequests: [],
      recentMovements: []
    };
    return inventoryManagementService.getHOIDashboardData(user);
  }, [user, refreshTrigger]);

  // Tab-specific filtered datasets for HOD / Admin
  const departmentAssets = useMemo(() => {
    const list = isHOD && user?.departmentId 
      ? hodData.departmentAssets 
      : isHOI && user?.instituteId 
      ? hoiData.institutionAssets 
      : allAssets;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(a => 
      a.assetTag.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.categoryName && a.categoryName.toLowerCase().includes(q)) ||
      (a.departmentName && a.departmentName.toLowerCase().includes(q)) ||
      (a.assignedToName && a.assignedToName.toLowerCase().includes(q)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
      (a.locationName && a.locationName.toLowerCase().includes(q))
    );
  }, [isHOD, isHOI, user, hodData, hoiData, allAssets, searchQuery]);

  const departmentRequisitions = useMemo(() => {
    const list = isHOD ? hodData.allDepartmentRequisitions : (db.getState() as any).assetRequisitions || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((r: AssetRequestRecord) => 
      r.requestNo.toLowerCase().includes(q) ||
      r.requestedByName.toLowerCase().includes(q) ||
      r.assetNameRequirement.toLowerCase().includes(q) ||
      (r.categoryName && r.categoryName.toLowerCase().includes(q)) ||
      (r.purpose && r.purpose.toLowerCase().includes(q)) ||
      r.status.toLowerCase().includes(q)
    );
  }, [isHOD, hodData, searchQuery]);

  const departmentTransfers = useMemo(() => {
    const list = isHOD ? hodData.allDepartmentTransfers : (db.getState() as any).assetTransferRequests || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((t: AssetTransferRequestRecord) => 
      t.requestNo.toLowerCase().includes(q) ||
      t.assetTag.toLowerCase().includes(q) ||
      t.assetName.toLowerCase().includes(q) ||
      t.fromUserName.toLowerCase().includes(q) ||
      t.toUserName.toLowerCase().includes(q) ||
      (t.reason && t.reason.toLowerCase().includes(q)) ||
      t.status.toLowerCase().includes(q)
    );
  }, [isHOD, hodData, searchQuery]);

  const departmentReturns = useMemo(() => {
    const list = isHOD ? hodData.allDepartmentReturns : (db.getState() as any).assetReturnRequests || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((r: AssetReturnRequestRecord) => 
      r.requestNo.toLowerCase().includes(q) ||
      r.assetTag.toLowerCase().includes(q) ||
      r.assetName.toLowerCase().includes(q) ||
      r.requestedByName.toLowerCase().includes(q) ||
      (r.returnReason && r.returnReason.toLowerCase().includes(q)) ||
      (r.remarks && r.remarks.toLowerCase().includes(q)) ||
      r.status.toLowerCase().includes(q)
    );
  }, [isHOD, hodData, searchQuery]);

  const departmentReplacements = useMemo(() => {
    const list = isHOD ? hodData.pendingReplacementRequests : (db.getState() as any).assetReplacementRequests || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((r: AssetReplacementRequestRecord) => 
      r.requestNo.toLowerCase().includes(q) ||
      r.assetTag.toLowerCase().includes(q) ||
      r.assetName.toLowerCase().includes(q) ||
      r.requestedByName.toLowerCase().includes(q) ||
      (r.reason && r.reason.toLowerCase().includes(q)) ||
      (r.problemDescription && r.problemDescription.toLowerCase().includes(q)) ||
      r.status.toLowerCase().includes(q)
    );
  }, [isHOD, hodData, searchQuery]);

  const departmentIssues = useMemo(() => {
    const list = isHOD ? hodData.allDepartmentIssues : (db.getState() as any).assetIssueReports || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((i: AssetIssueReportRecord) => 
      i.reportNo.toLowerCase().includes(q) ||
      i.assetTag.toLowerCase().includes(q) ||
      i.assetName.toLowerCase().includes(q) ||
      i.reportedByName.toLowerCase().includes(q) ||
      i.issueType.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      i.severity.toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q)
    );
  }, [isHOD, hodData, searchQuery]);

  const handleExportActiveTabXLSX = () => {
    const wb = XLSX.utils.book_new();

    if (hodTab === 'DEPT_REGISTER') {
      const data = departmentAssets.map((a: FixedAsset, idx: number) => ({
        '#': idx + 1,
        'Asset Tag': a.assetTag,
        'Asset Name': a.name,
        'Category': a.categoryName,
        'Department': a.departmentName || 'Central Depot',
        'Current Custodian': a.assignedToName || 'Department Store',
        'Cost (₹)': a.purchaseCost || 0,
        'Condition': a.assetCondition,
        'Status': a.status,
        'Location': a.locationName || 'Department Lab'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Department Assets');
      XLSX.writeFile(wb, `Department_Assets_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (hodTab === 'ASSET_REQUISITIONS') {
      const data = departmentRequisitions.map((r: AssetRequestRecord, idx: number) => ({
        '#': idx + 1,
        'Requisition ID': r.requestNo,
        'Requested By': r.requestedByName,
        'Department': r.departmentName,
        'Requested Asset': r.assetNameRequirement,
        'Category': r.categoryName,
        'Quantity': r.quantity,
        'Requested Date': r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '2026-08-25',
        'Priority': r.priority,
        'Purpose': r.purpose,
        'Status': r.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Asset Requisitions');
      XLSX.writeFile(wb, `Asset_Requisitions_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (hodTab === 'TRANSFER_APPROVALS') {
      const data = departmentTransfers.map((t: AssetTransferRequestRecord, idx: number) => ({
        '#': idx + 1,
        'Transfer ID': t.requestNo,
        'Asset Tag': t.assetTag,
        'Asset Name': t.assetName,
        'From Department': t.departmentName,
        'To Department': t.departmentName,
        'From Custodian': t.fromUserName,
        'To Custodian': t.toUserName,
        'Transfer Date': t.requestedDate,
        'Reason': t.reason,
        'Status': t.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Asset Transfers');
      XLSX.writeFile(wb, `Asset_Transfers_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (hodTab === 'RETURN_INSPECTIONS') {
      const data = departmentReturns.map((r: AssetReturnRequestRecord, idx: number) => ({
        '#': idx + 1,
        'Return ID': r.requestNo,
        'Asset Tag': r.assetTag,
        'Asset Name': r.assetName,
        'Returned By': r.requestedByName,
        'Department': r.departmentName,
        'Return Date': r.requestedDate,
        'Condition': r.conditionAtReturn,
        'Reason': r.returnReason,
        'Status': r.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Asset Returns');
      XLSX.writeFile(wb, `Asset_Returns_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (hodTab === 'REPLACEMENT_REVIEWS') {
      const data = departmentReplacements.map((r: AssetReplacementRequestRecord, idx: number) => ({
        '#': idx + 1,
        'Replacement ID': r.requestNo,
        'Original Asset Tag': r.assetTag,
        'Asset Name': r.assetName,
        'Requested By': r.requestedByName,
        'Department': r.departmentName,
        'Reason': r.reason,
        'Problem Description': r.problemDescription,
        'Condition': r.currentCondition,
        'Priority': r.priority,
        'Requested Date': r.requestedDate,
        'Status': r.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Asset Replacements');
      XLSX.writeFile(wb, `Asset_Replacements_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (hodTab === 'ISSUE_REPORTS') {
      const data = departmentIssues.map((i: AssetIssueReportRecord, idx: number) => ({
        '#': idx + 1,
        'Issue ID': i.reportNo,
        'Asset Tag': i.assetTag,
        'Asset Name': i.assetName,
        'Issue Type': i.issueType,
        'Description': i.description,
        'Reported By': i.reportedByName,
        'Reported Date': i.reportedDate,
        'Severity': i.severity,
        'Status': i.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Asset Issues');
      XLSX.writeFile(wb, `Asset_Issues_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const centralKPIs = useMemo(() => {
    return inventoryManagementService.getDashboardKPIs();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. NEW ASSET REQUEST HANDLER
  // ──────────────────────────────────────────────────────────────────────────
  const handleSubmitAssetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqAssetName || !user) {
      alert('Please specify the Asset Requirement / Name.');
      return;
    }

    try {
      inventoryManagementService.createFacultyAssetRequisition({
        requestType: reqType,
        categoryId: reqCategoryId,
        assetNameRequirement: reqAssetName,
        quantity: reqQuantity,
        purpose: reqPurpose,
        requiredFromDate: reqFromDate,
        requiredUntilDate: reqUntilDate || undefined,
        preferredLocation: reqLocation,
        priority: reqPriority,
        remarks: reqRemarks,
        attachmentUrl: reqAttachment || undefined
      }, user);

      setShowAssetReqModal(false);
      setReqAssetName('');
      setReqPurpose('');
      setReqRemarks('');
      setReqAttachment('');
      handleRefresh();
      alert('Asset request submitted successfully to your HOD.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit asset request.');
    }
  };

  // ── HOD Requisition Review Handlers ──
  const handleApproveRequisition = (req: AssetRequestRecord) => {
    if (!user) return;
    try {
      inventoryManagementService.reviewAssetRequisitionByHOD(
        req.id,
        true,
        undefined,
        reviewRemarks || 'Approved by HOD for department store allocation.',
        user
      );
      setReviewRemarks('');
      handleRefresh();
      alert(`Asset request ${req.requestNo} approved by HOD.`);
    } catch (err: any) {
      alert(err.message || 'Failed to approve asset request.');
    }
  };

  const handleRejectRequisition = () => {
    if (!selectedRequisitionForReview || !user) return;
    if (!requisitionRejectionReason.trim()) {
      alert('Please provide a mandatory rejection reason.');
      return;
    }
    try {
      inventoryManagementService.reviewAssetRequisitionByHOD(
        selectedRequisitionForReview.id,
        false,
        requisitionRejectionReason,
        reviewRemarks,
        user
      );
      setShowRequisitionRejectModal(false);
      setSelectedRequisitionForReview(null);
      setRequisitionRejectionReason('');
      setReviewRemarks('');
      handleRefresh();
      alert('Asset request rejected and feedback sent to requester.');
    } catch (err: any) {
      alert(err.message || 'Failed to reject asset request.');
    }
  };

  const handleFulfillRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequisitionForFulfill || !fulfillAssetId || !user) {
      alert('Please select an available store asset to assign.');
      return;
    }

    try {
      inventoryManagementService.fulfillAssetRequisitionWithAssignment(
        selectedRequisitionForFulfill.id,
        fulfillAssetId,
        fulfillLocation,
        selectedRequisitionForFulfill.purpose,
        'Assigned by HOD upon requisition approval.',
        user
      );

      setShowFulfillModal(false);
      setSelectedRequisitionForFulfill(null);
      setFulfillAssetId('');
      setFulfillLocation('');
      handleRefresh();
      alert('Asset successfully assigned to faculty! Custody updated in records.');
    } catch (err: any) {
      alert(err.message || 'Failed to assign asset.');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 8 QUICK ACTIONS SUBMIT HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  // 1. Receive Stock
  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recAssetName || !recAssetTag) {
      alert('Please provide Asset Name and Asset Tag.');
      return;
    }
    try {
      const selectedCat = categories.find(c => c.id === recCategoryId);
      inventoryManagementService.createFixedAsset({
        name: recAssetName,
        assetTag: recAssetTag.trim().toUpperCase(),
        categoryId: recCategoryId,
        categoryName: selectedCat?.name || 'IT Equipment',
        categoryGroup: (selectedCat as any)?.categoryGroup || (selectedCat as any)?.group || 'IT_EQUIPMENT',
        serialNumber: recSerialNo,
        manufacturer: recManufacturer,
        modelNumber: recModelNo,
        purchaseDate: recPurchaseDate,
        purchaseCost: recPurchasePrice,
        currentValue: recPurchasePrice,
        vendor: recVendor,
        invoiceNumber: recInvoiceRef,
        building: 'Central Stores Block',
        roomNo: 'Depot-01',
        locationName: recLocation || 'Central University Store',
        remarks: recRemarks,
        status: 'AVAILABLE',
        assetCondition: 'NEW'
      }, user || undefined);

      setShowReceiveStockModal(false);
      setRecAssetName('');
      setRecAssetTag('');
      setRecSerialNo('');
      setRecVendor('');
      setRecInvoiceRef('');
      setRecRemarks('');
      handleRefresh();
      alert('Stock successfully received and registered in Central Store!');
    } catch (err: any) {
      alert(err.message || 'Failed to receive stock.');
    }
  };

  // 2. Issue Stock
  const handleIssueStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueAssetId || !issueToUserId) {
      alert('Please select an Asset and Recipient.');
      return;
    }
    const targetUser = allUsers.find(u => u.id === issueToUserId);
    if (!targetUser) return;

    try {
      if (issueRecipientRole === 'HOI') {
        inventoryManagementService.allocateAssetToHOI({
          assetId: issueAssetId,
          instituteId: (targetUser as any)?.instituteId || 'inst-sit',
          instituteName: (targetUser as any)?.instituteName || 'Swarrnim Institute of Technology',
          hoiUserId: targetUser.id,
          hoiName: targetUser.name,
          locationName: issueLocation || 'Institution Central Store',
          remarks: issueRemarks
        }, user || undefined);
      } else {
        const targetDept = departments.find(d => d.id === (issueDeptId || targetUser.departmentId));
        inventoryManagementService.allocateAssetToHOD({
          assetId: issueAssetId,
          departmentId: targetDept?.id || 'dept-1',
          departmentName: targetDept?.name || 'Department Store',
          hodUserId: targetUser.id,
          hodName: targetUser.name,
          locationName: issueLocation || `${targetDept?.name || 'Department'} Store`,
          remarks: issueRemarks
        }, user || undefined);
      }

      setShowIssueStockModal(false);
      setIssueAssetId('');
      setIssueToUserId('');
      setIssueRemarks('');
      handleRefresh();
      alert('Stock successfully issued from Store!');
    } catch (err: any) {
      alert(err.message || 'Failed to issue stock.');
    }
  };

  // 3. Assign Asset
  const handleAssignAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = assignAssetId || assignAssetItem?.id;
    if (!targetId || !assigneeId || !user) {
      alert('Please select Asset and Recipient.');
      return;
    }

    const targetUser = allUsers.find(u => u.id === assigneeId);
    if (!targetUser) return;

    try {
      inventoryManagementService.assignAsset({
        assetId: targetId,
        assignedToUserId: targetUser.id,
        assignedToName: targetUser.name,
        assignedToEmpCode: targetUser.employeeId,
        assignedToDesignation: targetUser.designation,
        location: assignLocation,
        purpose: assignPurpose || 'Official Academic & Lab Use',
        remarks: assignRemarks || `Assigned by ${user.name}`
      }, user);

      setShowAssignModal(false);
      setAssignAssetItem(null);
      setAssignAssetId('');
      setAssigneeId('');
      setAssignPurpose('');
      setAssignLocation('');
      setAssignRemarks('');
      handleRefresh();
      alert(`Asset successfully assigned to ${targetUser.name}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign asset.');
    }
  };

  // 4. Direct Transfer Asset (HOD / Admin)
  const handleDirectTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAssetId || !transferTargetUserId || !user) {
      alert('Please select Asset and Target Custodian.');
      return;
    }
    const targetUser = allUsers.find(u => u.id === transferTargetUserId);
    const asset = allAssets.find(a => a.id === transferAssetId);
    if (!targetUser || !asset) return;

    try {
      db.updateFixedAsset(asset.id, {
        assignedToUserId: targetUser.id,
        assignedToName: targetUser.name,
        locationName: transferDirectLocation || asset.locationName,
        status: 'ASSIGNED_TO_FACULTY'
      }, user);

      inventoryManagementService.recordAssetMovement({
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        fromUserId: asset.assignedToUserId,
        fromUserName: asset.assignedToName || 'Department Store',
        fromRole: 'HOD',
        toUserId: targetUser.id,
        toUserName: targetUser.name,
        toRole: 'FACULTY',
        instituteId: asset.instituteId,
        instituteName: asset.instituteName,
        departmentId: asset.departmentId,
        departmentName: asset.departmentName,
        location: transferDirectLocation || asset.locationName || 'Department Room',
        action: 'FACULTY_TRANSFER',
        reason: transferDirectReason || 'Administrative custody transfer',
        conditionBefore: asset.assetCondition,
        conditionAfter: asset.assetCondition,
        approvedByName: user.name,
        remarks: transferDirectRemarks || 'Transfer executed by authorized authority.'
      }, user);

      setShowDirectTransferModal(false);
      setTransferAssetId('');
      setTransferTargetUserId('');
      setTransferDirectReason('');
      setTransferDirectRemarks('');
      handleRefresh();
      alert(`Asset transferred to ${targetUser.name} successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to transfer asset.');
    }
  };

  // 5. Direct Return Asset (HOD / Admin)
  const handleDirectReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDirectAssetId || !user) {
      alert('Please select an Asset to return.');
      return;
    }
    const asset = allAssets.find(a => a.id === returnDirectAssetId);
    if (!asset) return;

    try {
      inventoryManagementService.acceptReturnRequest(
        `direct-${Date.now()}`,
        returnDirectCondition,
        returnDirectRemarks || 'Returned directly to Department Store custody',
        user
      );

      db.returnAsset(asset.id, {
        conditionAtReturn: returnDirectCondition,
        remarks: returnDirectRemarks
      }, user);

      setShowDirectReturnModal(false);
      setReturnDirectAssetId('');
      setReturnDirectRemarks('');
      handleRefresh();
      alert('Asset accepted back into Department Store custody!');
    } catch (err: any) {
      alert(err.message || 'Failed to return asset.');
    }
  };

  // 6. Archive Asset
  const handleArchiveAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveAssetId || !archiveReason || !user) {
      alert('Please select an Asset and state the Archive Reason.');
      return;
    }
    try {
      inventoryManagementService.archiveAsset({
        assetId: archiveAssetId,
        reason: archiveReason,
        approvedBy: user.name,
        remarks: archiveRemarks
      }, user);

      setShowArchiveModal(false);
      setArchiveAssetId('');
      setArchiveReason('');
      setArchiveRemarks('');
      handleRefresh();
      alert('Asset record successfully moved to Historical Archive!');
    } catch (err: any) {
      alert(err.message || 'Failed to archive asset.');
    }
  };

  // 7. Maintenance
  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintAssetId || !maintIssueDesc || !user) {
      alert('Please select an Asset and describe the issue.');
      return;
    }
    try {
      inventoryManagementService.recordMaintenance({
        assetId: maintAssetId,
        issueDescription: maintIssueDesc,
        vendorTechnician: maintTechnician,
        estimatedCost: maintEstCost,
        remarks: maintRemarks
      }, user);

      setShowMaintenanceModal(false);
      setMaintAssetId('');
      setMaintIssueDesc('');
      setMaintRemarks('');
      handleRefresh();
      alert('Maintenance order logged and asset placed Under Maintenance!');
    } catch (err: any) {
      alert(err.message || 'Failed to log maintenance.');
    }
  };

  // 8. Physical Verification
  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifAssetId || !user) {
      alert('Please select an Asset to verify.');
      return;
    }
    try {
      inventoryManagementService.recordPhysicalVerification({
        assetId: verifAssetId,
        foundLocation: verifLocation,
        physicalCondition: verifCondition,
        verificationStatus: verifStatus,
        verifiedByName: user.name,
        remarks: verifRemarks
      }, user);

      setShowVerificationModal(false);
      setVerifAssetId('');
      setVerifLocation('');
      setVerifRemarks('');
      handleRefresh();
      alert(`Physical verification recorded: [${verifStatus}]`);
    } catch (err: any) {
      alert(err.message || 'Failed to record verification.');
    }
  };

  // ── Faculty Handlers ──
  const handleSubmitTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetAsset || !user || !targetFacultyId) return;

    const targetUser = allUsers.find(u => u.id === targetFacultyId);
    if (!targetUser) return;

    try {
      inventoryManagementService.requestAssetTransfer({
        assetId: activeTargetAsset.id,
        toUserId: targetUser.id,
        toUserName: targetUser.name,
        reason: transferReason,
        remarks: transferRemarks
      }, user);

      setShowTransferReqModal(false);
      setTransferReason('');
      setTransferRemarks('');
      setActiveTargetAsset(null);
      handleRefresh();
      alert('Transfer request submitted to HOD successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit transfer request.');
    }
  };

  const handleSubmitReturnRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetAsset || !user) return;

    try {
      inventoryManagementService.requestAssetReturn({
        assetId: activeTargetAsset.id,
        returnReason: returnReason,
        conditionAtReturn: returnCondition,
        remarks: returnRemarks
      }, user);

      setShowReturnReqModal(false);
      setReturnReason('');
      setReturnRemarks('');
      setActiveTargetAsset(null);
      handleRefresh();
      alert('Return request submitted to HOD successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit return request.');
    }
  };

  const handleSubmitReplacementRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetAsset || !user) return;

    try {
      inventoryManagementService.requestAssetReplacement({
        assetId: activeTargetAsset.id,
        reason: replacementReason,
        problemDescription: replacementProblem,
        currentCondition: replacementCondition,
        priority: replacementPriority,
        remarks: replacementRemarks
      }, user);

      setShowReplacementReqModal(false);
      setReplacementReason('');
      setReplacementProblem('');
      setReplacementRemarks('');
      setActiveTargetAsset(null);
      handleRefresh();
      alert('Replacement request submitted to HOD successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit replacement request.');
    }
  };

  const handleSubmitIssueReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetAsset || !user) return;

    try {
      inventoryManagementService.reportAssetIssue({
        assetId: activeTargetAsset.id,
        issueType: issueType,
        severity: issueSeverity,
        description: issueDesc
      }, user);

      setShowIssueReportModal(false);
      setIssueDesc('');
      setActiveTargetAsset(null);
      handleRefresh();
      alert('Damage / technical issue reported to HOD successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to report issue.');
    }
  };

  const handleReviewTransfer = (approved: boolean) => {
    if (!selectedTransferForReview || !user) return;
    try {
      inventoryManagementService.reviewTransferRequest(
        selectedTransferForReview.id,
        approved,
        reviewRemarks,
        user
      );
      setSelectedTransferForReview(null);
      setReviewRemarks('');
      handleRefresh();
      alert(`Transfer request ${approved ? 'approved' : 'rejected'} successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to review transfer request.');
    }
  };

  const handleAcceptReturn = () => {
    if (!selectedReturnForInspection || !user) return;
    try {
      inventoryManagementService.acceptReturnRequest(
        selectedReturnForInspection.id,
        inspectedCondition,
        reviewRemarks,
        user
      );
      setSelectedReturnForInspection(null);
      setReviewRemarks('');
      handleRefresh();
      alert('Return request inspected and asset accepted into Department Store.');
    } catch (err: any) {
      alert(err.message || 'Failed to accept return request.');
    }
  };

  const handleHODReplacementReview = (approved: boolean) => {
    if (!selectedReplacementForHOD || !user) return;
    try {
      inventoryManagementService.reviewReplacementByHOD(
        selectedReplacementForHOD.id,
        approved,
        reviewRemarks,
        user
      );
      setSelectedReplacementForHOD(null);
      setReviewRemarks('');
      handleRefresh();
      alert(`Replacement request ${approved ? 'escalated to HOI' : 'rejected'} successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to review replacement request.');
    }
  };

  const handleHOIReplacementApprove = (approved: boolean) => {
    if (!selectedReplacementForHOI || !user) return;
    try {
      inventoryManagementService.approveReplacementByHOI(
        selectedReplacementForHOI.id,
        approved,
        allocatedReplacementTag,
        reviewRemarks,
        user
      );
      setSelectedReplacementForHOI(null);
      setAllocatedReplacementTag('');
      setReviewRemarks('');
      handleRefresh();
      alert(`Replacement request ${approved ? 'approved' : 'rejected'} by HOI.`);
    } catch (err: any) {
      alert(err.message || 'Failed to process replacement request.');
    }
  };

  const handleHODIssueAction = (actionType: 'SEND_TO_MAINTENANCE' | 'MARKED_DAMAGED' | 'RESOLVED') => {
    if (!selectedIssueForAction || !user) return;
    try {
      inventoryManagementService.resolveIssueReport(
        selectedIssueForAction.id,
        actionType,
        reviewRemarks,
        user
      );
      setSelectedIssueForAction(null);
      setReviewRemarks('');
      handleRefresh();
      alert('Issue report status updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update issue status.');
    }
  };

  // Helper status badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
      case 'IN_STORE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 In Store / Available</span>;
      case 'ASSIGNED':
      case 'ASSIGNED_TO_FACULTY':
      case 'ASSIGNED_TO_STAFF':
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">🔵 In Use / Assigned</span>;
      case 'ASSIGNED_TO_HOD':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">🟣 Dept Store (HOD)</span>;
      case 'ASSIGNED_TO_HOI':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">🏛️ Inst Store (HOI)</span>;
      case 'PENDING_HOD_APPROVAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">⏳ Pending HOD Approval</span>;
      case 'APPROVED_BY_HOD':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">✅ Approved by HOD</span>;
      case 'REJECTED_BY_HOD':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">❌ Rejected by HOD</span>;
      case 'TRANSFER_REQUESTED':
      case 'TRANSFER_PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">🔄 Transfer Pending</span>;
      case 'RETURN_REQUESTED':
      case 'RETURN_PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">📦 Return Pending</span>;
      case 'REPLACEMENT_REQUESTED':
      case 'REPLACEMENT_PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">⚠️ Replacement Pending</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">🔧 Maintenance</span>;
      case 'DAMAGED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">🔴 Damaged</span>;
      case 'LOST':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-900 text-white border border-gray-700">⚫ Lost</span>;
      case 'ARCHIVED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-400">📁 Archived</span>;
      case 'RETIRED':
      case 'DISPOSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-400">⚪ Condemned / Disposed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">{status}</span>;
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. FACULTY / STAFF VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (isFacultyOrStaff) {
    const filteredAssets = facultyData.assignedAssets.filter(a => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.assetTag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return (
      <div className="space-y-6">
        {/* Faculty Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                SSIU Faculty Custody Register
              </div>
              <h1 className="text-2xl font-bold text-navy-900 tracking-tight mt-1">
                MY ASSETS & CUSTODY
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Assets officially assigned to you by your Department for academic, teaching, and research responsibilities.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssetReqModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> + Request Asset
              </button>
              <span className="text-xs bg-navy-50 text-navy-800 font-semibold px-3 py-1.5 rounded-lg border border-navy-200">
                Custodian: <strong className="font-bold">{user?.name}</strong> ({user?.designation || 'Faculty'})
              </span>
              <button 
                onClick={handleRefresh}
                className="p-2 text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                title="Refresh Assets"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Faculty KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-navy-50/70 border border-navy-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">Total Assigned</span>
                <Boxes className="w-5 h-5 text-navy-800" />
              </div>
              <div className="text-2xl font-bold text-navy-900 mt-2">{facultyData.totalAssignedCount}</div>
              <div className="text-xs text-navy-600 mt-1">In your active custody</div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">In Active Use</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-2xl font-bold text-emerald-900 mt-2">{facultyData.inUseCount}</div>
              <div className="text-xs text-emerald-700 mt-1">Fully functional units</div>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Maintenance / Issues</span>
                <Wrench className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-2xl font-bold text-amber-900 mt-2">{facultyData.underMaintenanceCount}</div>
              <div className="text-xs text-amber-700 mt-1">Under service or review</div>
            </div>

            <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">Pending Requests</span>
                <Clock className="w-5 h-5 text-purple-700" />
              </div>
              <div className="text-2xl font-bold text-purple-900 mt-2">{facultyData.pendingRequestsCount}</div>
              <div className="text-xs text-purple-700 mt-1">Requisitions / Transfers / Returns</div>
            </div>
          </div>
        </div>

        {/* DYNAMIC QUICK ACTIONS BAR FOR FACULTY: MY ASSET ACTIONS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              My Asset Actions
            </span>
            <span className="text-[11px] text-slate-500">Quickly trigger custody and maintenance requests</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            <button
              onClick={() => setFacultyTab('MY_ASSETS')}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-navy-50 hover:bg-navy-100 text-navy-900 border border-navy-200 rounded-lg text-xs font-semibold transition"
            >
              <Eye className="w-4 h-4 text-navy-700" /> View My Assets
            </button>
            <button
              onClick={() => setShowAssetReqModal(true)}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Request Asset
            </button>
            <button
              onClick={() => {
                if (facultyData.assignedAssets.length > 0) {
                  setActiveTargetAsset(facultyData.assignedAssets[0]);
                  setShowTransferReqModal(true);
                } else {
                  alert('No assets currently in your custody to transfer.');
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-700" /> Request Transfer
            </button>
            <button
              onClick={() => {
                if (facultyData.assignedAssets.length > 0) {
                  setActiveTargetAsset(facultyData.assignedAssets[0]);
                  setShowReturnReqModal(true);
                } else {
                  alert('No assets currently in your custody to return.');
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold transition"
            >
              <Package className="w-4 h-4 text-emerald-700" /> Request Return
            </button>
            <button
              onClick={() => {
                if (facultyData.assignedAssets.length > 0) {
                  setActiveTargetAsset(facultyData.assignedAssets[0]);
                  setShowReplacementReqModal(true);
                } else {
                  alert('No assets currently in your custody for replacement.');
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4 text-purple-700" /> Request Replacement
            </button>
            <button
              onClick={() => {
                if (facultyData.assignedAssets.length > 0) {
                  setActiveTargetAsset(facultyData.assignedAssets[0]);
                  setShowIssueReportModal(true);
                } else {
                  alert('No assets currently in your custody to report.');
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-xs font-semibold transition"
            >
              <AlertOctagon className="w-4 h-4 text-rose-700" /> Report Issue
            </button>
          </div>
        </div>

        {/* Faculty Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto shadow-sm">
          <button
            onClick={() => setFacultyTab('MY_ASSETS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              facultyTab === 'MY_ASSETS'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            My Assigned Assets ({facultyData.assignedAssets.length})
          </button>
          <button
            onClick={() => setFacultyTab('ASSET_REQUESTS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              facultyTab === 'ASSET_REQUESTS'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Asset Requests ({facultyData.assetRequisitions.length})
          </button>
          <button
            onClick={() => setFacultyTab('TRANSFER_REQUESTS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              facultyTab === 'TRANSFER_REQUESTS'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Requests ({facultyData.transferRequests.length})
          </button>
          <button
            onClick={() => setFacultyTab('RETURN_REQUESTS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              facultyTab === 'RETURN_REQUESTS'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Return Requests ({facultyData.returnRequests.length})
          </button>
          <button
            onClick={() => setFacultyTab('REPLACEMENT_REQUESTS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              facultyTab === 'REPLACEMENT_REQUESTS'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Replacement Requests ({facultyData.replacementRequests.length})
          </button>
          <button
            onClick={() => setFacultyTab('REPORTED_ISSUES')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              facultyTab === 'REPORTED_ISSUES'
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Reported Issues ({facultyData.issueReports.length})
          </button>
        </div>

        {/* Sub-Tab 1: My Assigned Assets Table */}
        {facultyTab === 'MY_ASSETS' && (
          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your assigned assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800"
                />
              </div>
              <div className="text-xs text-slate-500">
                Showing {filteredAssets.length} of {facultyData.assignedAssets.length} assets
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Serial No.</th>
                    <th className="p-3">Assigned Date</th>
                    <th className="p-3">Condition</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No assets currently assigned to your account.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-navy-900">{asset.assetTag}</td>
                        <td className="p-3 font-medium text-slate-900">{asset.name}</td>
                        <td className="p-3 text-slate-600">{asset.categoryName}</td>
                        <td className="p-3 font-mono text-slate-500">{asset.serialNumber || 'N/A'}</td>
                        <td className="p-3 text-slate-600">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('en-IN') : '2026-08-01'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            asset.assetCondition === 'EXCELLENT' || asset.assetCondition === 'NEW' ? 'bg-emerald-100 text-emerald-800' :
                            asset.assetCondition === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                            asset.assetCondition === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {asset.assetCondition}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{asset.locationName || `${asset.building || 'Main Block'} - ${asset.roomNo || 'Room'}`}</td>
                        <td className="p-3">{renderStatusBadge(asset.status)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedAssetForView(asset)}
                              className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded"
                              title="View Details & Movement History"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setQrAsset(asset);
                                setShowQrModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded"
                              title="View QR / Barcode"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTargetAsset(asset);
                                setShowTransferReqModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Request Transfer to Colleague"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTargetAsset(asset);
                                setShowReplacementReqModal(true);
                              }}
                              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                              title="Request Replacement"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTargetAsset(asset);
                                setShowReturnReqModal(true);
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                              title="Return to Department Store"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTargetAsset(asset);
                                setShowIssueReportModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Report Damage / Technical Defect"
                            >
                              <AlertOctagon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 2: Faculty Asset Requisitions */}
        {facultyTab === 'ASSET_REQUESTS' && (
          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-900">Your Submitted Asset Requests / Requisitions</h3>
              <button
                onClick={() => setShowAssetReqModal(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> + Request New Asset
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Request No</th>
                    <th className="p-3">Request Date</th>
                    <th className="p-3">Asset / Requirement</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Submitted To</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facultyData.assetRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        <Plus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No asset requests submitted yet. Click <strong>+ Request Asset</strong> to submit one.
                      </td>
                    </tr>
                  ) : (
                    facultyData.assetRequisitions.map(ar => (
                      <tr key={ar.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-navy-900">{ar.requestNo}</td>
                        <td className="p-3 text-slate-500">{ar.createdAt ? new Date(ar.createdAt).toLocaleDateString('en-IN') : '2026-08-25'}</td>
                        <td className="p-3 font-medium text-slate-900">{ar.assetNameRequirement}</td>
                        <td className="p-3 text-slate-600">{ar.categoryName}</td>
                        <td className="p-3 font-bold">{ar.quantity}</td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{ar.purpose}</td>
                        <td className="p-3 font-semibold text-slate-700">{ar.departmentName} HOD</td>
                        <td className="p-3">{renderStatusBadge(ar.status)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedRequisitionForDetails(ar)}
                            className="px-2.5 py-1 bg-navy-50 hover:bg-navy-100 text-navy-900 font-semibold rounded text-[11px]"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Faculty Transfer Requests */}
        {facultyTab === 'TRANSFER_REQUESTS' && (
          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-navy-900">Your Submitted Custody Transfer Requests</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Request No</th>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Target Faculty</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facultyData.transferRequests.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">No active transfer requests found.</td></tr>
                  ) : (
                    facultyData.transferRequests.map(tr => (
                      <tr key={tr.id}>
                        <td className="p-3 font-mono font-bold text-navy-900">{tr.requestNo}</td>
                        <td className="p-3 font-mono text-slate-700">{tr.assetTag}</td>
                        <td className="p-3 font-medium text-slate-900">{tr.assetName}</td>
                        <td className="p-3 font-semibold text-blue-800">{tr.toUserName}</td>
                        <td className="p-3 text-slate-600">{tr.reason}</td>
                        <td className="p-3 text-slate-500">{tr.requestedDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            tr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            tr.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Faculty Return Requests */}
        {facultyTab === 'RETURN_REQUESTS' && (
          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-navy-900">Your Submitted Return Requests</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Request No</th>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Return Reason</th>
                    <th className="p-3">Condition at Return</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facultyData.returnRequests.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">No active return requests found.</td></tr>
                  ) : (
                    facultyData.returnRequests.map(rt => (
                      <tr key={rt.id}>
                        <td className="p-3 font-mono font-bold text-navy-900">{rt.requestNo}</td>
                        <td className="p-3 font-mono text-slate-700">{rt.assetTag}</td>
                        <td className="p-3 font-medium text-slate-900">{rt.assetName}</td>
                        <td className="p-3 text-slate-600">{rt.returnReason}</td>
                        <td className="p-3 font-semibold text-slate-700">{rt.conditionAtReturn}</td>
                        <td className="p-3 text-slate-500">{rt.requestedDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            rt.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                            rt.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {rt.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 5: Faculty Replacement Requests */}
        {facultyTab === 'REPLACEMENT_REQUESTS' && (
          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-navy-900">Your Submitted Replacement Requests</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Request No</th>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Problem Description</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facultyData.replacementRequests.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">No active replacement requests found.</td></tr>
                  ) : (
                    facultyData.replacementRequests.map(rp => (
                      <tr key={rp.id}>
                        <td className="p-3 font-mono font-bold text-navy-900">{rp.requestNo}</td>
                        <td className="p-3 font-mono text-slate-700">{rp.assetTag}</td>
                        <td className="p-3 font-medium text-slate-900">{rp.assetName}</td>
                        <td className="p-3 text-slate-600">{rp.problemDescription}</td>
                        <td className="p-3 font-bold text-red-700">{rp.priority}</td>
                        <td className="p-3 text-slate-500">{rp.requestedDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            rp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            rp.status === 'ESCALATED_TO_HOI' ? 'bg-purple-100 text-purple-800' :
                            rp.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {rp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 6: Faculty Reported Issues */}
        {facultyTab === 'REPORTED_ISSUES' && (
          <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-navy-900">Your Reported Damage & Technical Issues</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Report No</th>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Issue Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facultyData.issueReports.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">No reported issues found.</td></tr>
                  ) : (
                    facultyData.issueReports.map(is => (
                      <tr key={is.id}>
                        <td className="p-3 font-mono font-bold text-navy-900">{is.reportNo}</td>
                        <td className="p-3 font-mono text-slate-700">{is.assetTag}</td>
                        <td className="p-3 font-medium text-slate-900">{is.assetName}</td>
                        <td className="p-3 font-semibold text-rose-800">{is.issueType}</td>
                        <td className="p-3 text-slate-600">{is.description}</td>
                        <td className="p-3 text-slate-500">{is.reportedDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            is.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            is.status === 'SENT_TO_MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {is.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL: REQUEST NEW ASSET (+ REQUEST ASSET) ── */}
        {showAssetReqModal && (
          <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  Submit Asset Requisition to HOD
                </h3>
                <button onClick={() => setShowAssetReqModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAssetRequest} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Request Type *</label>
                    <select
                      value={reqType}
                      onChange={(e) => setReqType(e.target.value as any)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="NEW_ASSET">New Asset Allocation</option>
                      <option value="ADDITIONAL_ASSET">Additional Lab / Workstation Asset</option>
                      <option value="TEMPORARY_ASSET">Temporary / Event Allocation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Asset Category *</label>
                    <select
                      value={reqCategoryId}
                      onChange={(e) => setReqCategoryId(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Asset Name / Requirement Specification *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dell Latitude 15 Laptop (16GB RAM / Core i7)"
                      value={reqAssetName}
                      onChange={(e) => setReqAssetName(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Purpose & Justification *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="State subject, course code, lab practical or research project requirement..."
                    value={reqPurpose}
                    onChange={(e) => setReqPurpose(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Required From Date *</label>
                    <input
                      type="date"
                      required
                      value={reqFromDate}
                      onChange={(e) => setReqFromDate(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Required Until Date (Optional)</label>
                    <input
                      type="date"
                      value={reqUntilDate}
                      onChange={(e) => setReqUntilDate(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={reqPriority}
                      onChange={(e) => setReqPriority(e.target.value as any)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Lab / Cabin Location</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Research Lab (Room A-204)"
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Additional Remarks</label>
                  <input
                    type="text"
                    placeholder="Optional notes for HOD..."
                    value={reqRemarks}
                    onChange={(e) => setReqRemarks(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAssetReqModal(false)}
                    className="px-4 py-2 border rounded font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" /> Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Details */}
        {selectedRequisitionForDetails && (
          <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <div className="text-xs font-mono text-slate-500">{selectedRequisitionForDetails.requestNo}</div>
                  <h3 className="text-base font-bold text-navy-900">{selectedRequisitionForDetails.assetNameRequirement}</h3>
                </div>
                <button onClick={() => setSelectedRequisitionForDetails(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border">
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <div className="mt-0.5">{renderStatusBadge(selectedRequisitionForDetails.status)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Priority:</span>
                    <div className="font-bold text-red-700 mt-0.5">{selectedRequisitionForDetails.priority}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Category:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{selectedRequisitionForDetails.categoryName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantity:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{selectedRequisitionForDetails.quantity} Unit(s)</div>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">Purpose / Justification:</span>
                  <p className="mt-1 p-2.5 bg-slate-50 border rounded text-slate-800">{selectedRequisitionForDetails.purpose}</p>
                </div>

                {selectedRequisitionForDetails.status === 'REJECTED_BY_HOD' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1 text-rose-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-700" /> HOD Rejection Reason
                    </div>
                    <p className="font-medium">{selectedRequisitionForDetails.hodRejectionReason}</p>
                    <div className="text-[11px] text-rose-700 mt-1">
                      Reviewed by {selectedRequisitionForDetails.hodName || 'Department HOD'} on {selectedRequisitionForDetails.hodActionAt ? new Date(selectedRequisitionForDetails.hodActionAt).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                  </div>
                )}

                {selectedRequisitionForDetails.status === 'ASSIGNED' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700" /> Fulfilled with Asset
                    </div>
                    <p className="font-mono font-bold">{selectedRequisitionForDetails.assignedAssetName} ({selectedRequisitionForDetails.assignedAssetTag})</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => setSelectedRequisitionForDetails(null)}
                  className="px-4 py-2 bg-navy-900 text-white rounded font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Transfer */}
        {showTransferReqModal && activeTargetAsset && (
          <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  Request Custody Transfer
                </h3>
                <button onClick={() => setShowTransferReqModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <div>Asset: <strong>{activeTargetAsset.name}</strong> ({activeTargetAsset.assetTag})</div>
                <div>Current Custodian: <strong>{user?.name}</strong></div>
              </div>

              <form onSubmit={handleSubmitTransferRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Faculty / Colleague *</label>
                  <select
                    required
                    value={targetFacultyId}
                    onChange={(e) => setTargetFacultyId(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  >
                    <option value="">-- Select Eligible Faculty/Staff --</option>
                    {departmentFaculty.filter(f => f.id !== user?.id).map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.departmentName || f.designation || 'Faculty'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Transfer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab relocation / Course assignment handover"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Additional Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Provide any physical location or handover notes..."
                    value={transferRemarks}
                    onChange={(e) => setTransferRemarks(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTransferReqModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Submit to HOD
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Return Asset */}
        {showReturnReqModal && activeTargetAsset && (
          <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Initiate Asset Return to Department Store
                </h3>
                <button onClick={() => setShowReturnReqModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <div>Asset: <strong>{activeTargetAsset.name}</strong> ({activeTargetAsset.assetTag})</div>
                <div>Returning to: <strong>Department Store / HOD Custody</strong></div>
              </div>

              <form onSubmit={handleSubmitReturnRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Return Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project completed / Surplus department asset"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condition at Return *</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  >
                    <option value="EXCELLENT">EXCELLENT (No wear & tear)</option>
                    <option value="GOOD">GOOD (Normal working condition)</option>
                    <option value="FAIR">FAIR (Minor cosmetic blemishes)</option>
                    <option value="POOR">POOR (Requires servicing)</option>
                    <option value="DAMAGED">DAMAGED (Hardware fault)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Handover Notes / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Mention room number or physical cabinet where unit is placed..."
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowReturnReqModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Submit Return for Inspection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Replacement */}
        {showReplacementReqModal && activeTargetAsset && (
          <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  Request Asset Replacement
                </h3>
                <button onClick={() => setShowReplacementReqModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <div>Asset: <strong>{activeTargetAsset.name}</strong> ({activeTargetAsset.assetTag})</div>
                <div>Workflow: <strong>Faculty → HOD Review → HOI Final Approval</strong></div>
              </div>

              <form onSubmit={handleSubmitReplacementRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Replacement *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Obsolete hardware / Recurring power failure / End of useful life"
                    value={replacementReason}
                    onChange={(e) => setReplacementReason(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Problem Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe specific symptoms, diagnostic codes, or failure points..."
                    value={replacementProblem}
                    onChange={(e) => setReplacementProblem(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Physical Condition</label>
                    <select
                      value={replacementCondition}
                      onChange={(e) => setReplacementCondition(e.target.value as AssetCondition)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                    >
                      <option value="POOR">POOR</option>
                      <option value="DAMAGED">DAMAGED</option>
                      <option value="NON_FUNCTIONAL">NON FUNCTIONAL</option>
                      <option value="OBSOLETE">OBSOLETE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Urgency Priority</label>
                    <select
                      value={replacementPriority}
                      onChange={(e) => setReplacementPriority(e.target.value as any)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                    >
                      <option value="HIGH">HIGH (Classroom/Lab Blocker)</option>
                      <option value="CRITICAL">CRITICAL (Server/Exam Infra)</option>
                      <option value="MEDIUM">MEDIUM (Regular)</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="Additional details for HOD and HOI..."
                    value={replacementRemarks}
                    onChange={(e) => setReplacementRemarks(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowReplacementReqModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Submit Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Report Damage / Issue */}
        {showIssueReportModal && activeTargetAsset && (
          <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                  Report Damage / Technical Defect
                </h3>
                <button onClick={() => setShowIssueReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <div>Asset: <strong>{activeTargetAsset.name}</strong> ({activeTargetAsset.assetTag})</div>
              </div>

              <form onSubmit={handleSubmitIssueReport} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Issue Category *</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as any)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                    >
                      <option value="TECHNICAL_PROBLEM">Technical Problem / Software Fault</option>
                      <option value="PHYSICAL_DAMAGE">Physical Damage / Broken Part</option>
                      <option value="NOT_WORKING">Not Powering On / Dead</option>
                      <option value="MISSING_PART">Missing Component / Cable</option>
                      <option value="DAMAGED">General Hardware Damage</option>
                      <option value="LOST">Lost / Misplaced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                    <select
                      value={issueSeverity}
                      onChange={(e) => setIssueSeverity(e.target.value as any)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                    >
                      <option value="HIGH">HIGH (Severe defect)</option>
                      <option value="CRITICAL">CRITICAL (Total failure)</option>
                      <option value="MEDIUM">MEDIUM (Intermittent issue)</option>
                      <option value="LOW">LOW (Minor cosmetic issue)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incident / Defect Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how the damage occurred or exact error message shown..."
                    value={issueDesc}
                    onChange={(e) => setIssueDesc(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowIssueReportModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Report Issue to HOD
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ADMINISTRATIVE STORE & CUSTODY VIEW (ADMIN / HOD / HOI)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-800">
              <Boxes className="w-4 h-4 text-orange-500" />
              SSIU Central Stores & Custody
            </div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight mt-1">
              {isHOD ? 'DEPARTMENT ASSET MANAGEMENT' : isHOI ? 'INSTITUTIONAL ASSET CONTROL & GOVERNANCE' : 'UNIVERSITY ASSET & INVENTORY REGISTER'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isHOD 
                ? 'Manage department inventory, review faculty requisitions, assign custody, inspect returns, and audit movements.'
                : isHOI 
                ? 'Institutional oversight, department store allocations, replacement authorization, and compliance.'
                : 'Central university repository, store inward/issues, physical verifications, and master ledger.'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-navy-50 text-navy-800 font-semibold px-3 py-1.5 rounded-lg border border-navy-200">
              Logged in: <strong className="font-bold">{user?.name}</strong> ({role || 'Admin'})
            </span>
            <button 
              onClick={handleRefresh}
              className="p-2 text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-navy-50/70 border border-navy-100 rounded-lg p-4">
            <span className="text-xs font-semibold uppercase text-navy-700">Total Assets</span>
            <div className="text-2xl font-bold text-navy-900 mt-2">
              {isHOD ? hodData.totalAssetsCount : isHOI ? hoiData.totalAssetsCount : centralKPIs.totalFixedAssets}
            </div>
            <div className="text-xs text-navy-600 mt-1">In official records</div>
          </div>
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-4">
            <span className="text-xs font-semibold uppercase text-blue-700">Assigned / In Use</span>
            <div className="text-2xl font-bold text-blue-900 mt-2">
              {isHOD ? hodData.assignedToFacultyCount + hodData.assignedToStaffCount : isHOI ? hoiData.allocatedToDeptsCount : centralKPIs.assignedCount}
            </div>
            <div className="text-xs text-blue-700 mt-1">Active faculty/dept custody</div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-4">
            <span className="text-xs font-semibold uppercase text-emerald-700">Available in Store</span>
            <div className="text-2xl font-bold text-emerald-900 mt-2">
              {isHOD ? hodData.availableInStoreCount : isHOI ? hoiData.institutionStoreCount : allAssets.filter(a => a.status === 'AVAILABLE' || a.status === 'IN_STORE').length}
            </div>
            <div className="text-xs text-emerald-700 mt-1">Ready for allocation</div>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-4">
            <span className="text-xs font-semibold uppercase text-amber-800">Pending Requisitions</span>
            <div className="text-2xl font-bold text-amber-900 mt-2">
              {isHOD ? hodData.pendingAssetRequisitions.length + hodData.pendingTransferRequests.length + hodData.pendingReturnRequests.length + hodData.pendingReplacementRequests.length : isHOI ? hoiData.escalatedReplacementRequests.length : 0}
            </div>
            <div className="text-xs text-amber-700 mt-1">Awaiting review/assignment</div>
          </div>
        </div>
      </div>

      {/* ── STORE & CUSTODY QUICK ACTIONS BAR (FOR ADMIN / HOD / HOI) ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
            <PackagePlus className="w-4 h-4 text-orange-500" />
            Store & Custody Quick Actions
          </span>
          <span className="text-[11px] text-slate-500">Authorized store transactions and custody management</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <button
            onClick={() => setShowReceiveStockModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg transition text-center group"
          >
            <ArrowDownToLine className="w-5 h-5 text-emerald-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Receive Stock</span>
            <span className="text-[10px] text-emerald-600">Inward Item</span>
          </button>

          <button
            onClick={() => setShowIssueStockModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg transition text-center group"
          >
            <SendHorizontal className="w-5 h-5 text-blue-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Issue Stock</span>
            <span className="text-[10px] text-blue-600">Store → Dept</span>
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg transition text-center group"
          >
            <UserPlus className="w-5 h-5 text-indigo-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Assign Asset</span>
            <span className="text-[10px] text-indigo-600">To Faculty/Staff</span>
          </button>

          <button
            onClick={() => setShowDirectTransferModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg transition text-center group"
          >
            <ArrowRightLeft className="w-5 h-5 text-purple-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Transfer Asset</span>
            <span className="text-[10px] text-purple-600">Inter-Dept / Staff</span>
          </button>

          <button
            onClick={() => setShowDirectReturnModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition text-center group"
          >
            <Package className="w-5 h-5 text-amber-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Return Asset</span>
            <span className="text-[10px] text-amber-600">To Dept Store</span>
          </button>

          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg transition text-center group"
          >
            <FolderArchive className="w-5 h-5 text-slate-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Archive File</span>
            <span className="text-[10px] text-slate-500">Historical Write-off</span>
          </button>

          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-200 rounded-lg transition text-center group"
          >
            <Wrench className="w-5 h-5 text-yellow-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Maintenance</span>
            <span className="text-[10px] text-yellow-600">Log Repair Ticket</span>
          </button>

          <button
            onClick={() => setShowVerificationModal(true)}
            className="flex flex-col items-center justify-center p-3 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg transition text-center group"
          >
            <ShieldCheck className="w-5 h-5 text-teal-700 mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-bold">Verification</span>
            <span className="text-[10px] text-teal-600">Physical Audit</span>
          </button>
        </div>
      </div>

      {/* Management & Authority Sub-Tabs */}
      {!isFacultyOrStaff && (
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto shadow-sm">
          <button
            onClick={() => setHodTab('DEPT_REGISTER')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              hodTab === 'DEPT_REGISTER' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Boxes className="w-4 h-4" />
            {isHOD ? 'Department Assets' : 'Asset Register'} ({departmentAssets.length})
          </button>
          <button
            onClick={() => setHodTab('ASSET_REQUISITIONS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              hodTab === 'ASSET_REQUISITIONS' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-4 h-4 text-amber-500" />
            Asset Requisitions ({departmentRequisitions.length})
          </button>
          <button
            onClick={() => setHodTab('TRANSFER_APPROVALS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              hodTab === 'TRANSFER_APPROVALS' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfers ({departmentTransfers.length})
          </button>
          <button
            onClick={() => setHodTab('RETURN_INSPECTIONS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              hodTab === 'RETURN_INSPECTIONS' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Returns ({departmentReturns.length})
          </button>
          <button
            onClick={() => setHodTab('REPLACEMENT_REVIEWS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              hodTab === 'REPLACEMENT_REVIEWS' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Replacements ({departmentReplacements.length})
          </button>
          <button
            onClick={() => setHodTab('ISSUE_REPORTS')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              hodTab === 'ISSUE_REPORTS' ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Issues ({departmentIssues.length})
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-6 space-y-4">
        {/* Dynamic Header & Search/Export Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-navy-900">
              {hodTab === 'DEPT_REGISTER' ? 'Department Assets Register' :
                hodTab === 'ASSET_REQUISITIONS' ? 'Faculty & Staff Asset Requisitions' :
                hodTab === 'TRANSFER_APPROVALS' ? 'Custody Transfer Requests' :
                hodTab === 'RETURN_INSPECTIONS' ? 'Asset Return & Inward Inspections' :
                hodTab === 'REPLACEMENT_REVIEWS' ? 'Asset Replacement & RMA Requests' :
                'Reported Hardware & Asset Issues'}
            </h3>
            <p className="text-xs text-slate-500">
              {hodTab === 'DEPT_REGISTER' ? 'Official fixed asset master register for your department' :
                hodTab === 'ASSET_REQUISITIONS' ? 'Review faculty requirements and assign available store assets' :
                hodTab === 'TRANSFER_APPROVALS' ? 'Review inter-faculty and lab-to-lab equipment transfer requests' :
                hodTab === 'RETURN_INSPECTIONS' ? 'Inspect returning assets and check condition before store intake' :
                hodTab === 'REPLACEMENT_REVIEWS' ? 'Review defective hardware replacement requests and escalate to HOI' :
                'Track broken, malfunctioning or damaged departmental equipment'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={
                  hodTab === 'DEPT_REGISTER' ? 'Search assets by tag, name, serial...' :
                  hodTab === 'ASSET_REQUISITIONS' ? 'Search requisitions by ID, faculty...' :
                  hodTab === 'TRANSFER_APPROVALS' ? 'Search transfers by ID, tag, faculty...' :
                  hodTab === 'RETURN_INSPECTIONS' ? 'Search returns by ID, tag, returner...' :
                  hodTab === 'REPLACEMENT_REVIEWS' ? 'Search replacements by ID, tag, defect...' :
                  'Search issues by ID, tag, description...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800"
              />
            </div>
            <button
              onClick={handleExportActiveTabXLSX}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-800 transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Register (.xlsx)
            </button>
          </div>
        </div>

        {/* 1. TAB: DEPARTMENT ASSETS REGISTER */}
        {hodTab === 'DEPT_REGISTER' && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Current Custodian</th>
                  <th className="p-3">Cost (₹)</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No assets found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  departmentAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{asset.assetTag}</td>
                      <td className="p-3 font-medium text-slate-900">{asset.name}</td>
                      <td className="p-3 text-slate-600">{asset.categoryName}</td>
                      <td className="p-3 text-slate-600">{asset.departmentName || 'Central Depot'}</td>
                      <td className="p-3 font-semibold text-blue-900">{asset.assignedToName || 'Department Store'}</td>
                      <td className="p-3 font-mono">₹{asset.purchaseCost?.toLocaleString('en-IN') || 0}</td>
                      <td className="p-3">{asset.assetCondition}</td>
                      <td className="p-3">{renderStatusBadge(asset.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedAssetForView(asset)}
                            className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded"
                            title="View Full Ledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAssignAssetItem(asset);
                              setAssignAssetId(asset.id);
                              setShowAssignModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Assign Custody"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. TAB: ASSET REQUISITIONS */}
        {hodTab === 'ASSET_REQUISITIONS' && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Requisition ID</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Requested Asset</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Requested Date</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No asset requisitions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  departmentRequisitions.map((req: AssetRequestRecord) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{req.requestNo}</td>
                      <td className="p-3 font-semibold text-slate-900">{req.requestedByName}</td>
                      <td className="p-3 text-slate-600">{req.departmentName || 'Computer Engineering'}</td>
                      <td className="p-3 font-medium text-slate-900">{req.assetNameRequirement}</td>
                      <td className="p-3 text-slate-600">{req.categoryName}</td>
                      <td className="p-3 font-bold">{req.quantity}</td>
                      <td className="p-3 text-slate-500">{req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : '2026-08-25'}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          req.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                          req.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {req.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="p-3">{renderStatusBadge(req.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'PENDING_HOD_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleApproveRequisition(req)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequisitionForReview(req);
                                  setShowRequisitionRejectModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {req.status === 'APPROVED_BY_HOD' && (
                            <button
                              onClick={() => {
                                setSelectedRequisitionForFulfill(req);
                                setFulfillLocation(req.preferredLocation || 'Faculty Cabin');
                                setShowFulfillModal(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                              title="Assign Available Department Asset"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Assign Asset
                            </button>
                          )}
                          {req.status === 'ASSIGNED' && (
                            <span className="text-[11px] text-emerald-700 font-bold font-mono">
                              Assigned ({req.assignedAssetTag})
                            </span>
                          )}
                          {req.status === 'REJECTED_BY_HOD' && (
                            <button
                              onClick={() => setSelectedRequisitionForDetails(req)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                            >
                              View Reason
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTransactionDetails({
                              title: `Asset Requisition — ${req.requestNo}`,
                              data: {
                                'Requisition No': req.requestNo,
                                'Requested By': `${req.requestedByName} (${req.requestedByEmpCode || 'Faculty'})`,
                                'Department': req.departmentName,
                                'Requirement': req.assetNameRequirement,
                                'Category': req.categoryName,
                                'Quantity': req.quantity,
                                'Priority': req.priority,
                                'Purpose': req.purpose,
                                'Required Date': req.requiredFromDate,
                                'Preferred Location': req.preferredLocation,
                                'Status': req.status,
                                'Remarks': req.remarks || 'None'
                              }
                            })}
                            className="p-1 text-slate-500 hover:text-navy-900 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. TAB: TRANSFERS */}
        {hodTab === 'TRANSFER_APPROVALS' && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">From Department</th>
                  <th className="p-3">To Department</th>
                  <th className="p-3">From Custodian</th>
                  <th className="p-3">To Custodian</th>
                  <th className="p-3">Transfer Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No custody transfer records found.
                    </td>
                  </tr>
                ) : (
                  departmentTransfers.map((trans: AssetTransferRequestRecord) => (
                    <tr key={trans.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{trans.requestNo}</td>
                      <td className="p-3 font-mono text-blue-900 font-semibold">{trans.assetTag}</td>
                      <td className="p-3 font-medium text-slate-900">{trans.assetName}</td>
                      <td className="p-3 text-slate-600">{trans.departmentName || 'Computer Engineering'}</td>
                      <td className="p-3 text-slate-600">{trans.departmentName || 'Computer Engineering'}</td>
                      <td className="p-3 font-medium text-slate-800">{trans.fromUserName}</td>
                      <td className="p-3 font-semibold text-emerald-900">{trans.toUserName}</td>
                      <td className="p-3 text-slate-500">{trans.requestedDate || '2026-08-20'}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={trans.reason}>{trans.reason}</td>
                      <td className="p-3">{renderStatusBadge(trans.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {trans.status === 'PENDING_HOD' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedTransferForReview(trans);
                                  setReviewRemarks('Approved by HOD.');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                                title="Review & Approve Transfer"
                              >
                                <Check className="w-3.5 h-3.5" /> Review
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedTransactionDetails({
                              title: `Custody Transfer — ${trans.requestNo}`,
                              data: {
                                'Transfer ID': trans.requestNo,
                                'Asset Tag': trans.assetTag,
                                'Asset Name': trans.assetName,
                                'From Custodian': trans.fromUserName,
                                'To Custodian': trans.toUserName,
                                'Department': trans.departmentName,
                                'Transfer Date': trans.requestedDate,
                                'Transfer Reason': trans.reason,
                                'Status': trans.status,
                                'Remarks': trans.remarks || 'None'
                              }
                            })}
                            className="p-1 text-slate-500 hover:text-navy-900 rounded"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. TAB: RETURNS */}
        {hodTab === 'RETURN_INSPECTIONS' && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Return ID</th>
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Returned By</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Return Date</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentReturns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No return records found.
                    </td>
                  </tr>
                ) : (
                  departmentReturns.map((ret: AssetReturnRequestRecord) => (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{ret.requestNo}</td>
                      <td className="p-3 font-mono text-blue-900 font-semibold">{ret.assetTag}</td>
                      <td className="p-3 font-medium text-slate-900">{ret.assetName}</td>
                      <td className="p-3 font-semibold text-slate-800">{ret.requestedByName}</td>
                      <td className="p-3 text-slate-600">{ret.departmentName || 'Computer Engineering'}</td>
                      <td className="p-3 text-slate-500">{ret.requestedDate || '2026-08-22'}</td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ret.conditionAtReturn || 'GOOD'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={ret.returnReason}>{ret.returnReason}</td>
                      <td className="p-3">{renderStatusBadge(ret.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ret.status === 'PENDING_INSPECTION' && (
                            <button
                              onClick={() => {
                                setSelectedReturnForInspection(ret);
                                setInspectedCondition(ret.conditionAtReturn || 'GOOD');
                                setReviewRemarks('Inspected and accepted in working order.');
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                              title="Inspect & Accept into Department Store"
                            >
                              <Check className="w-3.5 h-3.5" /> Inspect & Receive
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTransactionDetails({
                              title: `Asset Return Request — ${ret.requestNo}`,
                              data: {
                                'Return ID': ret.requestNo,
                                'Asset Tag': ret.assetTag,
                                'Asset Name': ret.assetName,
                                'Returned By': ret.requestedByName,
                                'Department': ret.departmentName,
                                'Return Date': ret.requestedDate,
                                'Condition at Return': ret.conditionAtReturn,
                                'Return Reason': ret.returnReason,
                                'Status': ret.status,
                                'Remarks': ret.remarks || 'None'
                              }
                            })}
                            className="p-1 text-slate-500 hover:text-navy-900 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. TAB: REPLACEMENTS */}
        {hodTab === 'REPLACEMENT_REVIEWS' && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Replacement ID</th>
                  <th className="p-3">Original Asset</th>
                  <th className="p-3">Replacement Asset</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Requested Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentReplacements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-slate-700">No replacement records found.</div>
                      <div className="text-xs text-slate-400 mt-1">There are no pending asset replacement requests for your department.</div>
                    </td>
                  </tr>
                ) : (
                  departmentReplacements.map((rep: AssetReplacementRequestRecord) => (
                    <tr key={rep.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{rep.requestNo}</td>
                      <td className="p-3 font-mono text-blue-900 font-semibold">{rep.assetTag} — {rep.assetName}</td>
                      <td className="p-3 font-medium text-slate-900">{rep.replacementAssetTag || 'Awaiting Allocation'}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={rep.reason}>{rep.reason}</td>
                      <td className="p-3 font-semibold text-slate-800">{rep.requestedByName}</td>
                      <td className="p-3 text-slate-500">{rep.requestedDate || '2026-08-24'}</td>
                      <td className="p-3">{renderStatusBadge(rep.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rep.status === 'PENDING_HOD' && (
                            <button
                              onClick={() => {
                                setSelectedReplacementForHOD(rep);
                                setReviewRemarks('Verified defect onsite. Recommended for replacement.');
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                              title="Review & Escalate to HOI"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Review Defect
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTransactionDetails({
                              title: `Replacement Request — ${rep.requestNo}`,
                              data: {
                                'Replacement ID': rep.requestNo,
                                'Asset Tag': rep.assetTag,
                                'Asset Name': rep.assetName,
                                'Requested By': rep.requestedByName,
                                'Department': rep.departmentName,
                                'Reason': rep.reason,
                                'Problem Description': rep.problemDescription,
                                'Condition': rep.currentCondition,
                                'Priority': rep.priority,
                                'Status': rep.status,
                                'HOD Review Remarks': rep.hodReviewRemarks || 'None'
                              }
                            })}
                            className="p-1 text-slate-500 hover:text-navy-900 rounded"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. TAB: ISSUES */}
        {hodTab === 'ISSUE_REPORTS' && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Issue ID</th>
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Issue Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Reported By</th>
                  <th className="p-3">Reported Date</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departmentIssues.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No issue reports found.
                    </td>
                  </tr>
                ) : (
                  departmentIssues.map((iss: AssetIssueReportRecord) => (
                    <tr key={iss.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{iss.reportNo}</td>
                      <td className="p-3 font-mono text-blue-900 font-semibold">{iss.assetTag}</td>
                      <td className="p-3 font-medium text-slate-900">{iss.assetName}</td>
                      <td className="p-3 font-semibold text-slate-700">{iss.issueType.replace('_', ' ')}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={iss.description}>{iss.description}</td>
                      <td className="p-3 font-semibold text-slate-800">{iss.reportedByName}</td>
                      <td className="p-3 text-slate-500">{iss.reportedDate || '2026-08-26'}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          iss.severity === 'CRITICAL' || iss.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                          iss.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {iss.severity}
                        </span>
                      </td>
                      <td className="p-3">{renderStatusBadge(iss.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(iss.status === 'REPORTED' || iss.status === 'UNDER_REVIEW') && (
                            <button
                              onClick={() => {
                                setSelectedIssueForAction(iss);
                                setReviewRemarks('Scheduled for maintenance technician visit.');
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                              title="Take Action on Issue"
                            >
                              <Wrench className="w-3.5 h-3.5" /> Action
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTransactionDetails({
                              title: `Maintenance Issue Report — ${iss.reportNo}`,
                              data: {
                                'Issue Report ID': iss.reportNo,
                                'Asset Tag': iss.assetTag,
                                'Asset Name': iss.assetName,
                                'Reported By': iss.reportedByName,
                                'Department': iss.departmentName,
                                'Issue Type': iss.issueType,
                                'Severity': iss.severity,
                                'Description': iss.description,
                                'Reported Date': iss.reportedDate,
                                'Status': iss.status,
                                'Action Remarks': iss.hodActionRemarks || 'None'
                              }
                            })}
                            className="p-1 text-slate-500 hover:text-navy-900 rounded"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: HOD REJECT REQUISITION ── */}
      {showRequisitionRejectModal && selectedRequisitionForReview && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <X className="w-5 h-5 text-rose-600" />
                Reject Asset Requisition
              </h3>
              <button onClick={() => setShowRequisitionRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p>Requisition No: <strong className="font-mono">{selectedRequisitionForReview.requestNo}</strong></p>
              <p>Requester: <strong>{selectedRequisitionForReview.requestedByName}</strong></p>
              <p>Requirement: <strong>{selectedRequisitionForReview.assetNameRequirement}</strong></p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State why this requisition cannot be approved at this time..."
                  value={requisitionRejectionReason}
                  onChange={(e) => setRequisitionRejectionReason(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowRequisitionRejectModal(false)}
                className="px-4 py-2 border rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRequisition}
                className="px-4 py-2 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOD FULFILL REQUISITION WITH ASSET ASSIGNMENT ── */}
      {showFulfillModal && selectedRequisitionForFulfill && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Assign Store Asset to Fulfill Requisition
              </h3>
              <button onClick={() => setShowFulfillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
              <div>Requisition: <strong>{selectedRequisitionForFulfill.requestNo}</strong></div>
              <div>Faculty: <strong>{selectedRequisitionForFulfill.requestedByName}</strong></div>
              <div>Requested: <strong>{selectedRequisitionForFulfill.assetNameRequirement}</strong> (Qty: {selectedRequisitionForFulfill.quantity})</div>
            </div>

            <form onSubmit={handleFulfillRequisitionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Available Department Store Asset *</label>
                <select
                  required
                  value={fulfillAssetId}
                  onChange={(e) => setFulfillAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Available Asset from Store --</option>
                  {allAssets.filter(a => a.status === 'AVAILABLE' || a.status === 'IN_STORE' || a.status === 'ASSIGNED_TO_HOD').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - Condition: {a.assetCondition}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Installation / Lab Location</label>
                <input
                  type="text"
                  placeholder="e.g. AI Lab Room A-204"
                  value={fulfillLocation}
                  onChange={(e) => setFulfillLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFulfillModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Confirm Asset Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 1: RECEIVE STOCK ── */}
      {showReceiveStockModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
                Receive Stock / Inward Master Item
              </h3>
              <button onClick={() => setShowReceiveStockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell OptiPlex 7000 Workstation"
                    value={recAssetName}
                    onChange={(e) => setRecAssetName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Tag *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SIT-CE-PC-0089"
                    value={recAssetTag}
                    onChange={(e) => setRecAssetTag(e.target.value)}
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={recCategoryId}
                    onChange={(e) => setRecCategoryId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Dell / HP / Godrej"
                    value={recManufacturer}
                    onChange={(e) => setRecManufacturer(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model No</label>
                  <input
                    type="text"
                    placeholder="OptiPlex 7000"
                    value={recModelNo}
                    onChange={(e) => setRecModelNo(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="DL-7000-8849"
                    value={recSerialNo}
                    onChange={(e) => setRecSerialNo(e.target.value)}
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={recPurchaseDate}
                    onChange={(e) => setRecPurchaseDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={recPurchasePrice}
                    onChange={(e) => setRecPurchasePrice(Number(e.target.value))}
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="Dell India Enterprise"
                    value={recVendor}
                    onChange={(e) => setRecVendor(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Ref / PO</label>
                  <input
                    type="text"
                    placeholder="INV-DEL-984210"
                    value={recInvoiceRef}
                    onChange={(e) => setRecInvoiceRef(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Storage Location</label>
                <input
                  type="text"
                  placeholder="Central Stores Depot - Bay A3"
                  value={recLocation}
                  onChange={(e) => setRecLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Initial condition notes, warranty documentation..."
                  value={recRemarks}
                  onChange={(e) => setRecRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowReceiveStockModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-emerald-800"
                >
                  <Check className="w-4 h-4" /> Inward into Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ISSUE STOCK ── */}
      {showIssueStockModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <SendHorizontal className="w-5 h-5 text-blue-600" />
                Issue Stock / Allocate to HOI or Department Store
              </h3>
              <button onClick={() => setShowIssueStockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueStockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Store Asset to Issue *</label>
                <select
                  required
                  value={issueAssetId}
                  onChange={(e) => setIssueAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Available Store Asset --</option>
                  {allAssets.filter(a => a.status === 'AVAILABLE' || a.status === 'IN_STORE').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - ₹{a.purchaseCost}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Recipient Role *</label>
                  <select
                    value={issueRecipientRole}
                    onChange={(e) => setIssueRecipientRole(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="HOI">HOI (Principal / Institution)</option>
                    <option value="HOD">HOD (Department Store)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Recipient Officer *</label>
                  <select
                    required
                    value={issueToUserId}
                    onChange={(e) => setIssueToUserId(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">-- Choose Officer --</option>
                    {allUsers.filter(u => issueRecipientRole === 'HOI' ? (u.role === 'PRINCIPAL' || (u.role as string) === 'HOI') : (u.role === 'HOD')).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Location</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Engineering Dept Store"
                  value={issueLocation}
                  onChange={(e) => setIssueLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Order Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Academic intake infrastructure dispatch..."
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowIssueStockModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-blue-800"
                >
                  <Send className="w-4 h-4" /> Issue Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ASSIGN ASSET ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Assign Asset to Faculty / Staff
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignAssetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Department Store Asset *</label>
                <select
                  required
                  value={assignAssetId || assignAssetItem?.id || ''}
                  onChange={(e) => setAssignAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Asset --</option>
                  {allAssets.filter(a => a.status === 'ASSIGNED_TO_HOD' || a.status === 'AVAILABLE' || a.status === 'IN_STORE').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - {a.departmentName || 'Store'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Faculty / Staff Custodian *</label>
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Faculty / Staff Member --</option>
                  {departmentFaculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.departmentName || f.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room / Laboratory Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Data Science Lab (A-204)"
                  value={assignLocation}
                  onChange={(e) => setAssignLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Teaching and Research Station Incharge"
                  value={assignPurpose}
                  onChange={(e) => setAssignPurpose(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-indigo-800"
                >
                  <Check className="w-4 h-4" /> Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DIRECT TRANSFER (HOD / ADMIN) ── */}
      {showDirectTransferModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                Transfer Asset Custody
              </h3>
              <button onClick={() => setShowDirectTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Asset to Transfer *</label>
                <select
                  required
                  value={transferAssetId}
                  onChange={(e) => setTransferAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Asset --</option>
                  {allAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - Current: {a.assignedToName || 'Store'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Target Custodian *</label>
                <select
                  required
                  value={transferTargetUserId}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose New Custodian --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role}) - {u.departmentName || 'SSIU'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Justification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department restructuring / Lab re-allocation"
                  value={transferDirectReason}
                  onChange={(e) => setTransferDirectReason(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDirectTransferModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-purple-800"
                >
                  <Check className="w-4 h-4" /> Transfer Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: DIRECT RETURN (HOD / ADMIN) ── */}
      {showDirectReturnModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Return Asset to Department Store
              </h3>
              <button onClick={() => setShowDirectReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectReturnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Asset to Return *</label>
                <select
                  required
                  value={returnDirectAssetId}
                  onChange={(e) => setReturnDirectAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Assigned Asset --</option>
                  {allAssets.filter(a => a.status === 'ASSIGNED' || a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'RETURN_REQUESTED').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - Custodian: {a.assignedToName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verified Condition at Return</label>
                <select
                  value={returnDirectCondition}
                  onChange={(e) => setReturnDirectCondition(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="POOR">POOR</option>
                  <option value="DAMAGED">DAMAGED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Return Remarks / Inspection Note</label>
                <textarea
                  rows={2}
                  placeholder="Inspected and verified in good working condition..."
                  value={returnDirectRemarks}
                  onChange={(e) => setReturnDirectRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDirectReturnModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-amber-700"
                >
                  <Check className="w-4 h-4" /> Accept into Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: ARCHIVE ASSET ── */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-slate-700" />
                Archive Asset Record
              </h3>
              <button onClick={() => setShowArchiveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" /> Permanent Historical Preservation
              </div>
              <p>Archiving this asset will remove it from active inventory but preserve the complete historical movement ledger and audit records.</p>
            </div>

            <form onSubmit={handleArchiveAssetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Asset to Archive *</label>
                <select
                  required
                  value={archiveAssetId}
                  onChange={(e) => setArchiveAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Asset --</option>
                  {allAssets.filter(a => (a.status as string) !== 'ARCHIVED').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - Status: {a.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Archive Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of useful lifecycle / Replaced by newer workstation model"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Archive Authorization Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Approval reference or university condemnation committee note..."
                  value={archiveRemarks}
                  onChange={(e) => setArchiveRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-slate-900"
                >
                  <Archive className="w-4 h-4" /> Move to Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: MAINTENANCE ORDER ── */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-yellow-600" />
                Asset Maintenance & Service Order
              </h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Asset *</label>
                <select
                  required
                  value={maintAssetId}
                  onChange={(e) => setMaintAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Asset for Maintenance --</option>
                  {allAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - {a.assignedToName || 'Store'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fault / Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe technical defect, fan failure, screen flickering..."
                  value={maintIssueDesc}
                  onChange={(e) => setMaintIssueDesc(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Technician / Vendor</label>
                  <input
                    type="text"
                    value={maintTechnician}
                    onChange={(e) => setMaintTechnician(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={maintEstCost}
                    onChange={(e) => setMaintEstCost(Number(e.target.value))}
                    className="w-full p-2 border rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-yellow-700"
                >
                  <Wrench className="w-4 h-4" /> Start Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 8: PHYSICAL VERIFICATION ── */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Physical Asset Verification & Audit
              </h3>
              <button onClick={() => setShowVerificationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Asset to Verify *</label>
                <select
                  required
                  value={verifAssetId}
                  onChange={(e) => setVerifAssetId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Choose Asset --</option>
                  {allAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - Expected: {a.locationName || 'Main'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verification Status *</label>
                  <select
                    value={verifStatus}
                    onChange={(e) => setVerifStatus(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="VERIFIED">VERIFIED (Location & Custodian Match)</option>
                    <option value="LOCATION_MISMATCH">LOCATION MISMATCH</option>
                    <option value="CUSTODIAN_MISMATCH">CUSTODIAN MISMATCH</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="MISSING">MISSING (Will mark status LOST)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Condition</label>
                  <select
                    value={verifCondition}
                    onChange={(e) => setVerifCondition(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="POOR">POOR</option>
                    <option value="DAMAGED">DAMAGED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Physical Location Found</label>
                <input
                  type="text"
                  placeholder="e.g. AI Lab Room A-204 Rack 3"
                  value={verifLocation}
                  onChange={(e) => setVerifLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification Audit Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Physical serial number matched, label intact..."
                  value={verifRemarks}
                  onChange={(e) => setVerifRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 text-white rounded font-semibold flex items-center gap-1.5 hover:bg-teal-800"
                >
                  <Check className="w-4 h-4" /> Save Verification Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Asset Details & Movement Ledger */}
      {selectedAssetForView && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <div className="text-xs font-mono text-slate-500">{selectedAssetForView.assetTag}</div>
                <h3 className="text-lg font-bold text-navy-900">{selectedAssetForView.name}</h3>
              </div>
              <button onClick={() => setSelectedAssetForView(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="text-slate-500 font-semibold">Category</div>
                <div className="font-bold text-slate-900">{selectedAssetForView.categoryName}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="text-slate-500 font-semibold">Current Custodian</div>
                <div className="font-bold text-blue-900">{selectedAssetForView.assignedToName || 'Department Store'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="text-slate-500 font-semibold">Location</div>
                <div className="font-bold text-slate-900">{selectedAssetForView.locationName || `${selectedAssetForView.building || ''} - ${selectedAssetForView.roomNo || ''}`}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1">
                <div className="text-slate-500 font-semibold">Condition</div>
                <div className="font-bold text-emerald-800">{selectedAssetForView.assetCondition}</div>
              </div>
            </div>

            {/* Movement History */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-navy-800" />
                Official Asset Movement Ledger
              </h4>

              <div className="space-y-2 text-xs">
                {inventoryManagementService.getAssetMovementHistory(selectedAssetForView.id).length === 0 ? (
                  <div className="text-slate-400 italic">No movement transactions recorded yet.</div>
                ) : (
                  inventoryManagementService.getAssetMovementHistory(selectedAssetForView.id).map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between">
                      <div>
                        <div className="font-bold text-navy-900">{m.fromUserName} → {m.toUserName}</div>
                        <div className="text-slate-500 text-[11px]">{m.action}: {m.reason || 'Official assignment'}</div>
                        <div className="text-slate-400 text-[10px]">{m.timestamp ? new Date(m.timestamp).toLocaleString('en-IN') : m.approvalDate}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] rounded font-bold">
                        {m.toRole}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedAssetForView(null)}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOD REVIEW TRANSFER REQUEST ── */}
      {selectedTransferForReview && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                Review Custody Transfer Request
              </h3>
              <button onClick={() => setSelectedTransferForReview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>Transfer ID: <strong className="font-mono text-navy-900">{selectedTransferForReview.requestNo}</strong></div>
                <div>Asset Tag: <strong className="font-mono text-blue-900">{selectedTransferForReview.assetTag}</strong></div>
              </div>
              <div>Asset Name: <strong className="text-slate-900">{selectedTransferForReview.assetName}</strong></div>
              <div className="grid grid-cols-2 gap-2">
                <div>From Custodian: <strong className="text-slate-800">{selectedTransferForReview.fromUserName}</strong></div>
                <div>To Custodian: <strong className="text-emerald-800">{selectedTransferForReview.toUserName}</strong></div>
              </div>
              <div>Reason: <span className="text-slate-700">{selectedTransferForReview.reason}</span></div>
            </div>

            <div className="text-xs space-y-1">
              <label className="block font-semibold text-slate-700">HOD Review Remarks</label>
              <textarea
                rows={2}
                placeholder="Enter remarks or approval notes..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedTransferForReview(null)}
                className="px-4 py-2 border rounded font-semibold text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewTransfer(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Reject Transfer
              </button>
              <button
                type="button"
                onClick={() => handleReviewTransfer(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Approve Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOD INSPECT & ACCEPT RETURN ── */}
      {selectedReturnForInspection && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Inspect & Accept Asset Return
              </h3>
              <button onClick={() => setSelectedReturnForInspection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>Return ID: <strong className="font-mono text-navy-900">{selectedReturnForInspection.requestNo}</strong></div>
                <div>Asset Tag: <strong className="font-mono text-blue-900">{selectedReturnForInspection.assetTag}</strong></div>
              </div>
              <div>Asset Name: <strong className="text-slate-900">{selectedReturnForInspection.assetName}</strong></div>
              <div>Returned By: <strong className="text-slate-800">{selectedReturnForInspection.requestedByName}</strong></div>
              <div>Return Reason: <span className="text-slate-700">{selectedReturnForInspection.returnReason}</span></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspected Physical Condition *</label>
                <select
                  value={inspectedCondition}
                  onChange={(e) => setInspectedCondition(e.target.value as AssetCondition)}
                  className="w-full p-2 border rounded font-semibold"
                >
                  <option value="EXCELLENT">EXCELLENT (Like New)</option>
                  <option value="GOOD">GOOD (Working Fine)</option>
                  <option value="FAIR">FAIR (Minor Wear & Tear)</option>
                  <option value="POOR">POOR (Degraded Performance)</option>
                  <option value="DAMAGED">DAMAGED (Requires Repair)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter condition notes or inward remarks..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedReturnForInspection(null)}
                className="px-4 py-2 border rounded font-semibold text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptReturn}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs flex items-center gap-1 shadow-sm"
              >
                <Check className="w-4 h-4" /> Accept into Department Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOD REVIEW REPLACEMENT REQUEST ── */}
      {selectedReplacementForHOD && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                Review Asset Replacement Request
              </h3>
              <button onClick={() => setSelectedReplacementForHOD(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>Replacement ID: <strong className="font-mono text-navy-900">{selectedReplacementForHOD.requestNo}</strong></div>
                <div>Asset Tag: <strong className="font-mono text-blue-900">{selectedReplacementForHOD.assetTag}</strong></div>
              </div>
              <div>Asset Name: <strong className="text-slate-900">{selectedReplacementForHOD.assetName}</strong></div>
              <div>Requested By: <strong className="text-slate-800">{selectedReplacementForHOD.requestedByName}</strong></div>
              <div>Reason: <span className="text-slate-700">{selectedReplacementForHOD.reason}</span></div>
              <div>Problem Description: <span className="text-slate-700">{selectedReplacementForHOD.problemDescription}</span></div>
            </div>

            <div className="text-xs space-y-1">
              <label className="block font-semibold text-slate-700">HOD Verification & Escalation Remarks *</label>
              <textarea
                rows={2}
                placeholder="Enter onsite diagnostic findings and recommendation for HOI..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedReplacementForHOD(null)}
                className="px-4 py-2 border rounded font-semibold text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleHODReplacementReview(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => handleHODReplacementReview(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs flex items-center gap-1"
              >
                <Send className="w-4 h-4" /> Escalate to HOI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOD ACTION ON ISSUE REPORT ── */}
      {selectedIssueForAction && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                Manage Maintenance Issue Report
              </h3>
              <button onClick={() => setSelectedIssueForAction(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>Issue ID: <strong className="font-mono text-navy-900">{selectedIssueForAction.reportNo}</strong></div>
                <div>Asset Tag: <strong className="font-mono text-blue-900">{selectedIssueForAction.assetTag}</strong></div>
              </div>
              <div>Asset Name: <strong className="text-slate-900">{selectedIssueForAction.assetName}</strong></div>
              <div>Reported By: <strong className="text-slate-800">{selectedIssueForAction.reportedByName}</strong></div>
              <div>Issue Type: <strong className="text-rose-800">{selectedIssueForAction.issueType}</strong> (Severity: {selectedIssueForAction.severity})</div>
              <div>Description: <span className="text-slate-700">{selectedIssueForAction.description}</span></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution Action *</label>
                <select
                  value={issueActionType}
                  onChange={(e) => setIssueActionType(e.target.value as any)}
                  className="w-full p-2 border rounded font-semibold"
                >
                  <option value="SEND_TO_MAINTENANCE">Send to Maintenance / Technician</option>
                  <option value="RESOLVED">Mark as Resolved (Fixed Onsite)</option>
                  <option value="MARKED_DAMAGED">Mark Asset Damaged (Irreparable)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter technician details or repair resolution notes..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedIssueForAction(null)}
                className="px-4 py-2 border rounded font-semibold text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleHODIssueAction(issueActionType)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs flex items-center gap-1 shadow-sm"
              >
                <Check className="w-4 h-4" /> Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TRANSACTION DETAILS MODAL ── */}
      {selectedTransactionDetails && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-navy-800" />
                {selectedTransactionDetails.title}
              </h3>
              <button onClick={() => setSelectedTransactionDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y">
              {Object.entries(selectedTransactionDetails.data).map(([key, value]) => (
                <div key={key} className="pt-2 flex justify-between gap-4">
                  <span className="text-slate-500 font-semibold">{key}:</span>
                  <span className="text-slate-900 font-medium text-right max-w-xs">{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedTransactionDetails(null)}
                className="px-4 py-2 bg-navy-900 text-white rounded font-semibold text-xs"
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
