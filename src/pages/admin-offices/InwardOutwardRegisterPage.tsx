import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import {
  InwardOutwardRecord,
  InwardOutwardType,
  InwardOutwardStatus,
  InwardOutwardPriority,
  InwardOutwardMode,
  RegisterDocumentType,
  Department,
  User,
  InwardOutwardDocument,
  InwardForwardingItem,
  OutwardDispatchItem,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  Upload,
  Paperclip,
  RefreshCw,
  Building,
  UserCheck,
  ShieldCheck,
  Tag,
  ExternalLink,
  Send,
  BarChart3,
  Truck,
  RotateCcw,
  Layers,
  Inbox,
  SendHorizontal,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel } from '../../services/exportService';

export interface InwardOutwardRegisterPageProps {
  initialRecordId?: string;
}

export const InwardOutwardRegisterPage: React.FC<InwardOutwardRegisterPageProps> = ({ initialRecordId }) => {
  const { user, role } = useAuth();

  // Master Data
  const [records, setRecords] = useState<InwardOutwardRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'INWARD' | 'OUTWARD'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAssignedUser, setFilterAssignedUser] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  // Modals
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Selected Records
  const [selectedRecordForView, setSelectedRecordForView] = useState<InwardOutwardRecord | null>(null);
  const [selectedRecordForAction, setSelectedRecordForAction] = useState<InwardOutwardRecord | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Inward Form State
  const defaultInwardForm: Partial<InwardOutwardRecord> = {
    type: 'INWARD',
    recordNumber: '',
    receiptDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    senderOrganization: '',
    letterNumber: '',
    letterDate: '',
    subject: '',
    description: '',
    documentType: 'LETTER',
    departmentId: 'dept-cse',
    assignedTo: user?.id || 'user-registrar',
    assignedToUserId: user?.id || 'user-registrar',
    priority: 'NORMAL',
    status: 'RECEIVED',
    modeOfReceipt: 'POST',
    dueDate: '',
    remarks: '',
    notesheetId: '',
    supportingDocuments: [],
  };
  const [inwardForm, setInwardForm] = useState<Partial<InwardOutwardRecord>>(defaultInwardForm);

  // Outward Form State
  const defaultOutwardForm: Partial<InwardOutwardRecord> = {
    type: 'OUTWARD',
    recordNumber: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    letterDate: new Date().toISOString().split('T')[0],
    recipient: '',
    sentTo: '',
    recipientOrganization: '',
    receiverAddress: '',
    address: '',
    recipientEmail: '',
    receiverPhone: '',
    subject: '',
    referenceNumber: '',
    documentType: 'LETTER',
    departmentId: 'dept-cse',
    preparedBy: user?.id || 'user-registrar',
    modeOfDispatch: 'COURIER',
    courierService: 'India Post Speed Post',
    trackingNumber: '',
    priority: 'NORMAL',
    status: 'DRAFT',
    expectedDeliveryDate: '',
    remarks: '',
    notesheetId: '',
    supportingDocuments: [],
  };
  const [outwardForm, setOutwardForm] = useState<Partial<InwardOutwardRecord>>(defaultOutwardForm);

  // Sub-modal states
  const [forwardForm, setForwardForm] = useState<{
    forwardedToOffice: string;
    forwardedToDepartmentId: string;
    forwardedToUserId: string;
    actionRequired: string;
    dueDate: string;
    remarks: string;
  }>({
    forwardedToOffice: 'Principal Office',
    forwardedToDepartmentId: 'dept-cse',
    forwardedToUserId: '',
    actionRequired: 'Review and provide departmental compliance response',
    dueDate: '',
    remarks: '',
  });

  const [actionForm, setActionForm] = useState<{
    actionTaken: string;
    remarks: string;
    status: InwardOutwardStatus;
  }>({
    actionTaken: '',
    remarks: '',
    status: 'UNDER_PROCESS',
  });

  const [dispatchForm, setDispatchForm] = useState<{
    courierService: string;
    trackingNumber: string;
    dispatchDate: string;
    expectedDeliveryDate: string;
    remarks: string;
  }>({
    courierService: 'India Post Speed Post',
    trackingNumber: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    remarks: 'Dispatched from University Central Dispatch Desk',
  });

  const [deliveryForm, setDeliveryForm] = useState<{
    deliveryDate: string;
    remarks: string;
  }>({
    deliveryDate: new Date().toISOString().split('T')[0],
    remarks: 'Delivered and acknowledged by recipient',
  });

  const [returnForm, setReturnForm] = useState<{
    returnReason: string;
    remarks: string;
  }>({
    returnReason: 'Addressee moved / Incorrect premise address',
    remarks: 'Package returned back to University Central Registry',
  });

  const [selectedReportType, setSelectedReportType] = useState<string>('INWARD_REGISTER');

  useEffect(() => {
    loadData();
  }, [user, role]);

  // Deep-link Auto-Open Exact Record
  useEffect(() => {
    if (initialRecordId && records.length > 0) {
      const match = records.find(r => r.id === initialRecordId || r.recordNumber === initialRecordId || r.inwardNumber === initialRecordId || r.outwardNumber === initialRecordId);
      if (match) {
        setSelectedRecordForView(match);
        setShowTimelineModal(true);
      }
    }
  }, [initialRecordId, records]);

  const loadData = () => {
    setRecords(db.getInwardOutwardRecords(undefined, user, role));
    setDepartments(db.getDepartments());
    setUsersList(db.getUsers());
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Open Inward Modal
  const handleOpenInwardModal = (recordToEdit?: InwardOutwardRecord) => {
    if (recordToEdit) {
      setInwardForm({ ...recordToEdit });
      setIsEditing(true);
    } else {
      const generatedNumber = db.generateInwardNumber();
      setInwardForm({
        ...defaultInwardForm,
        recordNumber: generatedNumber,
        inwardNumber: generatedNumber,
        receiptDate: new Date().toISOString().split('T')[0],
        receivedDate: new Date().toISOString().split('T')[0],
        assignedTo: user?.id || 'user-registrar',
        assignedToUserId: user?.id || 'user-registrar',
      });
      setIsEditing(false);
    }
    setShowInwardModal(true);
  };

  // Open Outward Modal
  const handleOpenOutwardModal = (recordToEdit?: InwardOutwardRecord) => {
    if (recordToEdit) {
      setOutwardForm({ ...recordToEdit });
      setIsEditing(true);
    } else {
      const generatedNumber = db.generateOutwardNumber();
      setOutwardForm({
        ...defaultOutwardForm,
        recordNumber: generatedNumber,
        outwardNumber: generatedNumber,
        dispatchDate: new Date().toISOString().split('T')[0],
        letterDate: new Date().toISOString().split('T')[0],
        preparedBy: user?.id || 'user-registrar',
        trackingNumber: `SP${Math.floor(100000000 + Math.random() * 900000000)}IN`,
      });
      setIsEditing(false);
    }
    setShowOutwardModal(true);
  };

  // Save Inward
  const handleSaveInward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardForm.subject?.trim() || !inwardForm.receivedFrom?.trim()) {
      showToast('error', 'Subject and Received From are required.');
      return;
    }

    if (isEditing && inwardForm.id) {
      const updated = db.updateInwardOutwardRecord(inwardForm.id, inwardForm, user || undefined);
      if (updated) {
        showToast('success', `Inward entry ${updated.recordNumber} updated successfully.`);
      } else {
        showToast('error', 'Failed to update record.');
      }
    } else {
      const created = db.createInwardRecord(inwardForm, user || undefined);
      showToast('success', `Inward entry ${created.recordNumber} registered successfully.`);
    }

    loadData();
    setShowInwardModal(false);
  };

  // Save Outward
  const handleSaveOutward = (e: React.FormEvent) => {
    e.preventDefault();
    const recip = outwardForm.recipient || outwardForm.sentTo;
    if (!outwardForm.subject?.trim() || !recip?.trim()) {
      showToast('error', 'Subject and Recipient are required.');
      return;
    }

    if (isEditing && outwardForm.id) {
      const updated = db.updateInwardOutwardRecord(outwardForm.id, outwardForm, user || undefined);
      if (updated) {
        showToast('success', `Outward entry ${updated.recordNumber} updated successfully.`);
      } else {
        showToast('error', 'Failed to update record.');
      }
    } else {
      const created = db.createOutwardRecord(outwardForm, user || undefined);
      showToast('success', `Outward letter ${created.recordNumber} prepared successfully.`);
    }

    loadData();
    setShowOutwardModal(false);
  };

  // Forward Inward
  const handleForwardInward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAction) return;

    const res = db.forwardInwardRecord(selectedRecordForAction.id, forwardForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowForwardModal(false);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  // Record Action
  const handleRecordAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAction || !actionForm.actionTaken.trim()) {
      showToast('error', 'Action taken description is mandatory.');
      return;
    }

    const res = db.recordInwardActionTaken(selectedRecordForAction.id, actionForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowActionModal(false);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  // Dispatch Outward
  const handleDispatchOutward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAction) return;

    const res = db.dispatchOutwardRecord(selectedRecordForAction.id, dispatchForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowDispatchModal(false);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  // Delivery Outward
  const handleDeliveryOutward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAction) return;

    const res = db.recordOutwardDelivery(selectedRecordForAction.id, deliveryForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowDeliveryModal(false);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  // Return Outward
  const handleReturnOutward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAction || !returnForm.returnReason.trim()) {
      showToast('error', 'Return reason is required.');
      return;
    }

    const res = db.recordOutwardReturn(selectedRecordForAction.id, returnForm, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      setShowReturnModal(false);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  // Complete Inward
  const handleCompleteInward = (id: string) => {
    const res = db.completeInwardRecord(id, 'Inward communication processed and completed.', user || undefined);
    if (res.success) {
      showToast('success', res.message);
      loadData();
    }
  };

  // Close Inward
  const handleCloseInward = (id: string) => {
    const res = db.closeInwardRecord(id, 'Inward record closed and archived in registry.', user || undefined);
    if (res.success) {
      showToast('success', res.message);
      loadData();
    }
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this register record?')) {
      const ok = db.deleteInwardOutwardRecord(id, user || undefined);
      if (ok) {
        showToast('success', 'Register record deleted.');
        if (selectedRecordForView?.id === id) setSelectedRecordForView(null);
      } else {
        showToast('error', 'Failed to delete record.');
      }
      loadData();
    }
  };

  // Document Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isForInward: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const newDoc: InwardOutwardDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${sizeInMb} MB`,
      fileType: file.type || 'application/pdf',
      uploadedBy: user?.name || 'Authorized Staff',
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    if (isForInward) {
      setInwardForm((prev) => ({
        ...prev,
        supportingDocuments: [...(prev.supportingDocuments || []), newDoc],
      }));
    } else {
      setOutwardForm((prev) => ({
        ...prev,
        supportingDocuments: [...(prev.supportingDocuments || []), newDoc],
      }));
    }
    e.target.value = '';
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    return db.getInwardOutwardDashboardStats(user, role);
  }, [records, user, role]);

  // Filtered List
  const filteredRecords = useMemo(() => {
    return db.getInwardOutwardRecords(
      {
        type: activeTab,
        departmentId: filterDepartment,
        status: filterStatus,
        priority: filterPriority,
        assignedTo: filterAssignedUser,
        search: searchTerm,
        startDate: filterDate || undefined,
        endDate: filterDate || undefined,
      },
      user,
      role
    );
  }, [records, activeTab, filterDepartment, filterStatus, filterPriority, filterAssignedUser, searchTerm, filterDate, user, role]);

  // Export 10 Official Reports as Excel (.xlsx)
  const handleExportReportsExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `SSIU_${selectedReportType}_${dateStr}`;

    if (selectedReportType === 'INWARD_REGISTER') {
      headers = ['Inward No', 'Receipt Date', 'Received From', 'Letter No', 'Subject', 'Department', 'Priority', 'Status', 'Due Date'];
      rows = records
        .filter((r) => r.type === 'INWARD')
        .map((r) => [
          r.recordNumber,
          r.receiptDate || r.receivedDate || 'N/A',
          r.senderOrganization ? `${r.receivedFrom} (${r.senderOrganization})` : r.receivedFrom || 'N/A',
          r.letterNumber || 'N/A',
          r.subject,
          r.departmentName || 'N/A',
          r.priority,
          r.status,
          r.dueDate || 'N/A',
        ]);
    } else if (selectedReportType === 'OUTWARD_REGISTER') {
      headers = ['Outward No', 'Dispatch Date', 'Recipient', 'Reference No', 'Subject', 'Department', 'Mode', 'Tracking No', 'Status'];
      rows = records
        .filter((r) => r.type === 'OUTWARD')
        .map((r) => [
          r.recordNumber,
          r.dispatchDate || 'N/A',
          r.recipientOrganization ? `${r.recipient} (${r.recipientOrganization})` : r.recipient || 'N/A',
          r.referenceNumber || 'N/A',
          r.subject,
          r.departmentName || 'N/A',
          r.modeOfDispatch || r.dispatchMode || 'N/A',
          r.trackingNumber || 'N/A',
          r.status,
        ]);
    } else if (selectedReportType === 'PENDING_INWARD') {
      headers = ['Inward No', 'Received Date', 'Received From', 'Subject', 'Assigned Department', 'Status', 'Due Date'];
      rows = records
        .filter((r) => r.type === 'INWARD' && r.status !== 'COMPLETED' && r.status !== 'CLOSED')
        .map((r) => [
          r.recordNumber,
          r.receivedDate || 'N/A',
          r.receivedFrom || 'N/A',
          r.subject,
          r.departmentName || 'N/A',
          r.status,
          r.dueDate || 'N/A',
        ]);
    } else if (selectedReportType === 'OVERDUE_INWARD') {
      headers = ['Inward No', 'Received Date', 'Received From', 'Subject', 'Department', 'Due Date', 'Status'];
      rows = records
        .filter((r) => r.type === 'INWARD' && r.dueDate && r.dueDate < dateStr && r.status !== 'COMPLETED' && r.status !== 'CLOSED')
        .map((r) => [
          r.recordNumber,
          r.receivedDate || 'N/A',
          r.receivedFrom || 'N/A',
          r.subject,
          r.departmentName || 'N/A',
          r.dueDate,
          'OVERDUE',
        ]);
    } else if (selectedReportType === 'DISPATCH_REPORT') {
      headers = ['Outward No', 'Dispatch Date', 'Recipient', 'Courier Service', 'Tracking No', 'Status'];
      rows = records
        .filter((r) => r.type === 'OUTWARD' && (r.status === 'DISPATCHED' || r.status === 'DELIVERED'))
        .map((r) => [
          r.recordNumber,
          r.dispatchDate || 'N/A',
          r.recipient || 'N/A',
          r.courierService || 'N/A',
          r.trackingNumber || 'N/A',
          r.deliveryStatus || r.status,
        ]);
    } else {
      headers = ['Record No', 'Type', 'Date', 'Party', 'Subject', 'Department', 'Status'];
      rows = records.map((r) => [
        r.recordNumber,
        r.type,
        r.receivedDate || r.dispatchDate || 'N/A',
        r.type === 'INWARD' ? r.receivedFrom : r.recipient,
        r.subject,
        r.departmentName || 'N/A',
        r.status,
      ]);
    }

    exportToExcel(
      filename,
      headers,
      rows,
      { departmentName: 'Central Registry Secretariat' },
      {
        name: user?.name || 'Registrar Office',
        role: (role as any) || 'REGISTRAR',
      }
    );
    showToast('success', `Exported ${selectedReportType} to ${filename}.xlsx`);
    setShowReportModal(false);
  };

  const getStatusBadge = (status: InwardOutwardStatus) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant="navy">RECEIVED</Badge>;
      case 'ACTION_REQUIRED':
        return <Badge variant="orange">ACTION REQUIRED</Badge>;
      case 'UNDER_PROCESS':
      case 'IN_PROGRESS':
        return <Badge variant="warning">UNDER PROCESS</Badge>;
      case 'FORWARDED':
        return <Badge variant="gold">FORWARDED</Badge>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <Badge variant="success">{status}</Badge>;
      case 'CLOSED':
        return <Badge variant="inactive">CLOSED</Badge>;
      case 'DISPATCHED':
        return <Badge variant="navy">DISPATCHED</Badge>;
      case 'RETURNED':
      case 'CANCELLED':
        return <Badge variant="danger">{status}</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="inactive">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: InwardOutwardPriority) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="orange">HIGH</Badge>;
      case 'LOW':
        return <Badge variant="inactive">LOW</Badge>;
      case 'MEDIUM':
      case 'NORMAL':
      default:
        return <Badge variant="navy">NORMAL</Badge>;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toast.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : '#FECACA'}`,
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        className="card"
        style={{
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-navy-subtle)',
                color: 'var(--brand-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Inbox size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Central Inward &amp; Outward Register
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Enterprise university postal, courier, email communication tracking and document workflow registry
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowReportModal(true)}>
            <BarChart3 size={16} /> Official Reports (.xlsx)
          </button>

          <button className="btn btn-primary" onClick={() => handleOpenInwardModal()}>
            <ArrowDownLeft size={16} /> Register Inward
          </button>

          <button className="btn btn-navy" onClick={() => handleOpenOutwardModal()}>
            <ArrowUpRight size={16} /> Register Outward
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid - 4 per row on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid-4">
        <StatCard
          title="Today's Inward"
          value={stats.todayInward}
          subtitle="Received today"
          icon={ArrowDownLeft}
          colorScheme="green"
        />
        <StatCard
          title="Pending Inward"
          value={stats.pendingInward}
          subtitle="Under process"
          icon={Clock}
          colorScheme="gold"
        />
        <StatCard
          title="Action Required"
          value={stats.actionRequired}
          subtitle="Forwarded / Action"
          icon={AlertCircle}
          colorScheme="orange"
        />
        <StatCard
          title="Overdue Inward"
          value={stats.overdueInward}
          subtitle="Past due date"
          icon={AlertTriangle}
          colorScheme="orange"
        />
      </div>

      <div className="grid-4">
        <StatCard
          title="Today's Outward"
          value={stats.todayOutward}
          subtitle="Dispatched today"
          icon={ArrowUpRight}
          colorScheme="blue"
        />
        <StatCard
          title="In Transit"
          value={stats.dispatchedOutward}
          subtitle="En-route couriers"
          icon={Truck}
          colorScheme="navy"
        />
        <StatCard
          title="Delivered"
          value={stats.deliveredOutward}
          subtitle="Confirmed delivery"
          icon={CheckCircle2}
          colorScheme="green"
        />
        <StatCard
          title="Returned"
          value={stats.returnedOutward}
          subtitle="Undelivered items"
          icon={RotateCcw}
          colorScheme="orange"
        />
      </div>

      {/* Navigation Tabs and Search / Filters */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Communications ({records.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'INWARD' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('INWARD')}
            >
              <ArrowDownLeft size={14} /> Inward Register ({stats.totalInward})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'OUTWARD' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('OUTWARD')}
            >
              <ArrowUpRight size={14} /> Outward Register ({stats.totalOutward})
            </button>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search number, subject, sender..."
              className="form-input"
              style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.8125rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Department</label>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.8125rem' }}
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Status</label>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.8125rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="UNDER_PROCESS">UNDER PROCESS</option>
              <option value="ACTION_REQUIRED">ACTION REQUIRED</option>
              <option value="FORWARDED">FORWARDED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Priority</label>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.8125rem' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="NORMAL">NORMAL</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Date</label>
            <input
              type="date"
              className="form-input"
              style={{ height: '38px', fontSize: '0.8125rem' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', height: '38px' }}
              onClick={() => {
                setFilterDepartment('ALL');
                setFilterStatus('ALL');
                setFilterPriority('ALL');
                setFilterAssignedUser('ALL');
                setFilterDate('');
                setSearchTerm('');
              }}
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Register No / Date</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Type &amp; Category</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Correspondent Party</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Subject &amp; Notesheet</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Department</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Priority</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status / Tracking</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Inbox size={40} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5, display: 'block' }} />
                    No inward/outward communications found matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isOverdue = r.type === 'INWARD' && r.dueDate && r.dueDate < todayStr && r.status !== 'COMPLETED' && r.status !== 'CLOSED';
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {r.type === 'INWARD' ? <ArrowDownLeft size={14} color="#10B981" /> : <ArrowUpRight size={14} color="#0F2C59" />}
                          {r.recordNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {r.type === 'INWARD' ? r.receivedDate || r.receiptDate : r.dispatchDate}
                        </div>
                        {r.letterNumber && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Ref: {r.letterNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={r.type === 'INWARD' ? 'success' : 'navy'}>
                          {r.type}
                        </Badge>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {r.documentType || 'LETTER'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.type === 'INWARD' ? r.receivedFrom : r.recipient || r.sentTo}
                        </div>
                        {(r.senderOrganization || r.recipientOrganization) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.type === 'INWARD' ? r.senderOrganization : r.recipientOrganization}
                          </div>
                        )}
                        {r.trackingNumber && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--brand-navy)', fontFamily: 'monospace', marginTop: '2px' }}>
                            Track: {r.trackingNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.3 }}>{r.subject}</div>
                        {(r.notesheetNumber || r.notesheetId) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--brand-orange)', fontFamily: 'monospace', marginTop: '3px' }}>
                            <Layers size={11} /> {r.notesheetNumber || r.notesheetId}
                          </div>
                        )}
                        {r.outwardNumber && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--brand-navy)', fontFamily: 'monospace', marginTop: '1px' }}>
                            Outward: {r.outwardNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{r.departmentName || 'General Administration'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.assignedToName || r.preparedByName}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>{getPriorityBadge(r.priority)}</td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                          {getStatusBadge(r.status)}
                          {isOverdue && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                              OVERDUE ({r.dueDate})
                            </span>
                          )}
                          {r.deliveryStatus && r.type === 'OUTWARD' && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--brand-navy)', fontFamily: 'monospace' }}>
                              Deliv: {r.deliveryStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                            onClick={() => {
                              setSelectedRecordForView(r);
                              setShowTimelineModal(true);
                            }}
                            title="View Lifecycle Timeline"
                          >
                            <Clock size={14} />
                          </button>

                          {r.type === 'INWARD' && r.status !== 'CLOSED' && (
                            <>
                              {r.notesheetId && !r.outwardNumber && (
                                <button
                                  className="btn btn-secondary btn-icon"
                                  style={{ width: '30px', height: '30px', padding: 0, color: '#2563EB' }}
                                  onClick={() => {
                                    const res = db.processRegistrarOutwardForNotesheet(r.notesheetId || r.id, {}, user);
                                    if (res.success) {
                                      showToast('success', res.message);
                                      setRecords(db.getInwardOutwardRecords(undefined, user, role));
                                    } else {
                                      showToast('error', res.message);
                                    }
                                  }}
                                  title="Generate Outward Dispatch for Notesheet"
                                >
                                  <Truck size={14} />
                                </button>
                              )}

                              <button
                                className="btn btn-secondary btn-icon"
                                style={{ width: '30px', height: '30px', padding: 0, color: 'var(--brand-navy)' }}
                                onClick={() => {
                                  setSelectedRecordForAction(r);
                                  setShowForwardModal(true);
                                }}
                                title="Forward to Office / Department"
                              >
                                <Send size={14} />
                              </button>

                              <button
                                className="btn btn-secondary btn-icon"
                                style={{ width: '30px', height: '30px', padding: 0, color: '#10B981' }}
                                onClick={() => {
                                  setSelectedRecordForAction(r);
                                  setActionForm({ actionTaken: '', remarks: '', status: 'UNDER_PROCESS' });
                                  setShowActionModal(true);
                                }}
                                title="Record Action Taken"
                              >
                                <FileCheck size={14} />
                              </button>

                              {r.status !== 'COMPLETED' && (
                                <button
                                  className="btn btn-secondary btn-icon"
                                  style={{ width: '30px', height: '30px', padding: 0, color: '#10B981' }}
                                  onClick={() => handleCompleteInward(r.id)}
                                  title="Mark Completed"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}

                              <button
                                className="btn btn-secondary btn-icon"
                                style={{ width: '30px', height: '30px', padding: 0 }}
                                onClick={() => handleCloseInward(r.id)}
                                title="Archive / Close Record"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}

                          {r.type === 'OUTWARD' && (
                            <>
                              {(r.status === 'DRAFT' || r.status === 'READY') && (
                                <button
                                  className="btn btn-secondary btn-icon"
                                  style={{ width: '30px', height: '30px', padding: 0, color: 'var(--brand-navy)' }}
                                  onClick={() => {
                                    setSelectedRecordForAction(r);
                                    setDispatchForm({
                                      courierService: r.courierService || 'India Post Speed Post',
                                      trackingNumber: r.trackingNumber || `SP${Math.floor(100000000 + Math.random() * 900000000)}IN`,
                                      dispatchDate: new Date().toISOString().split('T')[0],
                                      expectedDeliveryDate: '',
                                      remarks: 'Dispatched through Central Registry',
                                    });
                                    setShowDispatchModal(true);
                                  }}
                                  title="Dispatch Consignment"
                                >
                                  <Truck size={14} />
                                </button>
                              )}

                              {r.status === 'DISPATCHED' && (
                                <>
                                  <button
                                    className="btn btn-secondary btn-icon"
                                    style={{ width: '30px', height: '30px', padding: 0, color: '#10B981' }}
                                    onClick={() => {
                                      setSelectedRecordForAction(r);
                                      setDeliveryForm({ deliveryDate: new Date().toISOString().split('T')[0], remarks: 'Delivered successfully' });
                                      setShowDeliveryModal(true);
                                    }}
                                    title="Mark Delivered"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>

                                  <button
                                    className="btn btn-secondary btn-icon"
                                    style={{ width: '30px', height: '30px', padding: 0, color: '#DC2626' }}
                                    onClick={() => {
                                      setSelectedRecordForAction(r);
                                      setReturnForm({ returnReason: 'Undelivered / Addressee moved', remarks: '' });
                                      setShowReturnModal(true);
                                    }}
                                    title="Mark Returned"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                            onClick={() => (r.type === 'INWARD' ? handleOpenInwardModal(r) : handleOpenOutwardModal(r))}
                            title="Edit Record"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', padding: 0, color: '#DC2626' }}
                            onClick={() => handleDeleteRecord(r.id)}
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
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

      {/* ─── MODAL 1: INWARD ENTRY MODAL ─── */}
      <Modal
        isOpen={showInwardModal}
        onClose={() => setShowInwardModal(false)}
        title={isEditing ? 'Edit Inward Register Entry' : 'New Inward Register Entry'}
        subtitle="Log incoming university correspondence and assign workflow route"
        maxWidth="680px"
      >
        <form onSubmit={handleSaveInward}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Inward Number (Auto)</label>
              <input
                type="text"
                value={inwardForm.recordNumber}
                disabled
                className="form-input"
                style={{ backgroundColor: 'var(--bg-surface-hover)', fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Receipt Date *</label>
              <input
                type="date"
                value={inwardForm.receiptDate || inwardForm.receivedDate}
                onChange={(e) => setInwardForm({ ...inwardForm, receiptDate: e.target.value, receivedDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Received From (Person / Designee) *</label>
              <input
                type="text"
                placeholder="e.g. Joint Director (Technical)"
                value={inwardForm.receivedFrom}
                onChange={(e) => setInwardForm({ ...inwardForm, receivedFrom: e.target.value, senderOrRecipient: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sender Organization / Department</label>
              <input
                type="text"
                placeholder="e.g. AICTE Western Regional Office"
                value={inwardForm.senderOrganization}
                onChange={(e) => setInwardForm({ ...inwardForm, senderOrganization: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Sender Letter / Reference No</label>
              <input
                type="text"
                placeholder="e.g. AICTE/WRO/2026/908"
                value={inwardForm.letterNumber}
                onChange={(e) => setInwardForm({ ...inwardForm, letterNumber: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Letter Date</label>
              <input
                type="date"
                value={inwardForm.letterDate}
                onChange={(e) => setInwardForm({ ...inwardForm, letterDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject / Title *</label>
            <input
              type="text"
              placeholder="Subject of the inward communication..."
              value={inwardForm.subject}
              onChange={(e) => setInwardForm({ ...inwardForm, subject: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Communication Abstract</label>
            <textarea
              rows={2}
              placeholder="Details of letter contents, requirements, or directives..."
              value={inwardForm.description}
              onChange={(e) => setInwardForm({ ...inwardForm, description: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select
                value={inwardForm.documentType}
                onChange={(e) => setInwardForm({ ...inwardForm, documentType: e.target.value as RegisterDocumentType })}
                className="form-select"
              >
                <option value="LETTER">Letter</option>
                <option value="CIRCULAR">Circular</option>
                <option value="NOTICE">Notice</option>
                <option value="APPLICATION">Application</option>
                <option value="GOVERNMENT_COMMUNICATION">Government Communication</option>
                <option value="UNIVERSITY_COMMUNICATION">University Communication</option>
                <option value="INVOICE">Invoice</option>
                <option value="LEGAL_DOCUMENT">Legal Document</option>
                <option value="ACADEMIC_DOCUMENT">Academic Document</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mode of Receipt</label>
              <select
                value={inwardForm.modeOfReceipt}
                onChange={(e) => setInwardForm({ ...inwardForm, modeOfReceipt: e.target.value as InwardOutwardMode, mode: e.target.value as InwardOutwardMode })}
                className="form-select"
              >
                <option value="POST">Post</option>
                <option value="SPEED_POST">Speed Post</option>
                <option value="REGISTERED_POST">Registered Post</option>
                <option value="COURIER">Courier</option>
                <option value="EMAIL">Email</option>
                <option value="HAND_DELIVERY">Hand Delivery</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={inwardForm.priority}
                onChange={(e) => setInwardForm({ ...inwardForm, priority: e.target.value as InwardOutwardPriority })}
                className="form-select"
              >
                <option value="NORMAL">Normal</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                value={inwardForm.departmentId}
                onChange={(e) => {
                  const dept = departments.find((d) => d.id === e.target.value);
                  setInwardForm({ ...inwardForm, departmentId: e.target.value, departmentName: dept?.name });
                }}
                className="form-select"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Official</label>
              <select
                value={inwardForm.assignedTo || inwardForm.assignedToUserId}
                onChange={(e) => {
                  const usr = usersList.find((u) => u.id === e.target.value);
                  setInwardForm({ ...inwardForm, assignedTo: e.target.value, assignedToUserId: e.target.value, assignedToName: usr?.name });
                }}
                className="form-select"
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due / Target Date</label>
              <input
                type="date"
                value={inwardForm.dueDate}
                onChange={(e) => setInwardForm({ ...inwardForm, dueDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Link Central Notesheet (Optional)</label>
              <input
                type="text"
                placeholder="e.g. NS/ADMIN/2026/0045"
                value={inwardForm.notesheetId}
                onChange={(e) => setInwardForm({ ...inwardForm, notesheetId: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Upload Document Attachment</label>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, true)}
                className="form-input"
                style={{ padding: '0.4rem' }}
              />
            </div>
          </div>

          {inwardForm.supportingDocuments && inwardForm.supportingDocuments.length > 0 && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Attached Documents:</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {inwardForm.supportingDocuments.map((d) => (
                  <span key={d.id} className="badge badge-navy" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Paperclip size={12} /> {d.name} ({d.size})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowInwardModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Inward Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: OUTWARD ENTRY MODAL ─── */}
      <Modal
        isOpen={showOutwardModal}
        onClose={() => setShowOutwardModal(false)}
        title={isEditing ? 'Edit Outward Register Entry' : 'New Outward Register Entry'}
        subtitle="Prepare official university outward communication and dispatch details"
        maxWidth="680px"
      >
        <form onSubmit={handleSaveOutward}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Outward Number (Auto)</label>
              <input
                type="text"
                value={outwardForm.recordNumber}
                disabled
                className="form-input"
                style={{ backgroundColor: 'var(--bg-surface-hover)', fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dispatch / Letter Date *</label>
              <input
                type="date"
                value={outwardForm.dispatchDate}
                onChange={(e) => setOutwardForm({ ...outwardForm, dispatchDate: e.target.value, letterDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Recipient Name / Designation *</label>
              <input
                type="text"
                placeholder="e.g. Member Secretary, ACPC"
                value={outwardForm.recipient || outwardForm.sentTo}
                onChange={(e) => setOutwardForm({ ...outwardForm, recipient: e.target.value, sentTo: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Recipient Organization</label>
              <input
                type="text"
                placeholder="e.g. Gujarat Technological University"
                value={outwardForm.recipientOrganization}
                onChange={(e) => setOutwardForm({ ...outwardForm, recipientOrganization: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Postal Address</label>
            <textarea
              rows={2}
              placeholder="Full postal address of the recipient..."
              value={outwardForm.receiverAddress || outwardForm.address}
              onChange={(e) => setOutwardForm({ ...outwardForm, receiverAddress: e.target.value, address: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                type="text"
                placeholder="Subject of outward correspondence..."
                value={outwardForm.subject}
                onChange={(e) => setOutwardForm({ ...outwardForm, subject: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Reference / File Number</label>
              <input
                type="text"
                placeholder="e.g. SSIU/REG/ADM/2026/089"
                value={outwardForm.referenceNumber}
                onChange={(e) => setOutwardForm({ ...outwardForm, referenceNumber: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">From Department</label>
              <select
                value={outwardForm.departmentId}
                onChange={(e) => {
                  const dept = departments.find((d) => d.id === e.target.value);
                  setOutwardForm({ ...outwardForm, departmentId: e.target.value, departmentName: dept?.name });
                }}
                className="form-select"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mode of Dispatch</label>
              <select
                value={outwardForm.modeOfDispatch || outwardForm.dispatchMode}
                onChange={(e) => setOutwardForm({ ...outwardForm, modeOfDispatch: e.target.value as InwardOutwardMode, dispatchMode: e.target.value as InwardOutwardMode })}
                className="form-select"
              >
                <option value="COURIER">Courier</option>
                <option value="SPEED_POST">Speed Post</option>
                <option value="POST">Regular Post</option>
                <option value="EMAIL">Email</option>
                <option value="HAND_DELIVERY">Hand Delivery</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={outwardForm.priority}
                onChange={(e) => setOutwardForm({ ...outwardForm, priority: e.target.value as InwardOutwardPriority })}
                className="form-select"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Link Central Notesheet (Optional)</label>
              <input
                type="text"
                placeholder="e.g. NS/ADMIN/2026/0078"
                value={outwardForm.notesheetId}
                onChange={(e) => setOutwardForm({ ...outwardForm, notesheetId: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Upload Letter Copy</label>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, false)}
                className="form-input"
                style={{ padding: '0.4rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowOutwardModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-navy">
              <Save size={16} /> Save Outward Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 3: INWARD FORWARDING MODAL ─── */}
      <Modal
        isOpen={showForwardModal && !!selectedRecordForAction}
        onClose={() => setShowForwardModal(false)}
        title="Forward Inward Communication"
        subtitle={`Routing ${selectedRecordForAction?.recordNumber} for action`}
        maxWidth="520px"
      >
        <form onSubmit={handleForwardInward}>
          <div className="form-group">
            <label className="form-label">Forward To Department / Office *</label>
            <select
              value={forwardForm.forwardedToDepartmentId}
              onChange={(e) => setForwardForm({ ...forwardForm, forwardedToDepartmentId: e.target.value })}
              className="form-select"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Specific Assignee User (Optional)</label>
            <select
              value={forwardForm.forwardedToUserId}
              onChange={(e) => setForwardForm({ ...forwardForm, forwardedToUserId: e.target.value })}
              className="form-select"
            >
              <option value="">-- Assign to Head / Office --</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Action Required / Directive *</label>
            <textarea
              rows={2}
              value={forwardForm.actionRequired}
              onChange={(e) => setForwardForm({ ...forwardForm, actionRequired: e.target.value })}
              className="form-textarea"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Action Target Due Date</label>
            <input
              type="date"
              value={forwardForm.dueDate}
              onChange={(e) => setForwardForm({ ...forwardForm, dueDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForwardModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Confirm Forward
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 4: INWARD ACTION MODAL ─── */}
      <Modal
        isOpen={showActionModal && !!selectedRecordForAction}
        onClose={() => setShowActionModal(false)}
        title="Record Action Taken"
        subtitle={`Action update for ${selectedRecordForAction?.recordNumber}`}
        maxWidth="520px"
      >
        <form onSubmit={handleRecordAction}>
          <div className="form-group">
            <label className="form-label">Action Taken Description *</label>
            <textarea
              rows={3}
              placeholder="Details of action taken, response drafted, or compliance report..."
              value={actionForm.actionTaken}
              onChange={(e) => setActionForm({ ...actionForm, actionTaken: e.target.value })}
              className="form-textarea"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transition Status</label>
            <select
              value={actionForm.status}
              onChange={(e) => setActionForm({ ...actionForm, status: e.target.value as InwardOutwardStatus })}
              className="form-select"
            >
              <option value="UNDER_PROCESS">UNDER PROCESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowActionModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Action
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 5: OUTWARD DISPATCH MODAL ─── */}
      <Modal
        isOpen={showDispatchModal && !!selectedRecordForAction}
        onClose={() => setShowDispatchModal(false)}
        title="Dispatch Outward Communication"
        subtitle={`Consignment booking for ${selectedRecordForAction?.recordNumber}`}
        maxWidth="520px"
      >
        <form onSubmit={handleDispatchOutward}>
          <div className="form-group">
            <label className="form-label">Courier / Postal Agency *</label>
            <select
              value={dispatchForm.courierService}
              onChange={(e) => setDispatchForm({ ...dispatchForm, courierService: e.target.value })}
              className="form-select"
            >
              <option value="India Post Speed Post">India Post Speed Post</option>
              <option value="India Post Registered Post">India Post Registered Post</option>
              <option value="Blue Dart Express">Blue Dart Express</option>
              <option value="DTDC Courier">DTDC Courier</option>
              <option value="Professional Couriers">Professional Couriers</option>
              <option value="University Hand Messenger">University Hand Messenger</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Consignment / Tracking Barcode Number *</label>
            <input
              type="text"
              placeholder="e.g. EG998877665IN"
              value={dispatchForm.trackingNumber}
              onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
              className="form-input"
              style={{ fontFamily: 'monospace' }}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Dispatch Date</label>
              <input
                type="date"
                value={dispatchForm.dispatchDate}
                onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery Date</label>
              <input
                type="date"
                value={dispatchForm.expectedDeliveryDate}
                onChange={(e) => setDispatchForm({ ...dispatchForm, expectedDeliveryDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowDispatchModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-navy">
              <Truck size={16} /> Confirm Dispatch
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 6: OUTWARD DELIVERY MODAL ─── */}
      <Modal
        isOpen={showDeliveryModal && !!selectedRecordForAction}
        onClose={() => setShowDeliveryModal(false)}
        title="Confirm Delivery &amp; Acknowledgment"
        subtitle={`Acknowledge delivery of ${selectedRecordForAction?.recordNumber}`}
        maxWidth="480px"
      >
        <form onSubmit={handleDeliveryOutward}>
          <div className="form-group">
            <label className="form-label">Delivered Date *</label>
            <input
              type="date"
              value={deliveryForm.deliveryDate}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Acknowledgment / Remarks</label>
            <textarea
              rows={2}
              value={deliveryForm.remarks}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, remarks: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowDeliveryModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} /> Confirm Delivery
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 7: OUTWARD RETURN MODAL ─── */}
      <Modal
        isOpen={showReturnModal && !!selectedRecordForAction}
        onClose={() => setShowReturnModal(false)}
        title="Record Return / Undelivered Status"
        subtitle={`Undelivered parcel log for ${selectedRecordForAction?.recordNumber}`}
        maxWidth="480px"
      >
        <form onSubmit={handleReturnOutward}>
          <div className="form-group">
            <label className="form-label">Mandatory Return Reason *</label>
            <input
              type="text"
              placeholder="e.g. Addressee moved / Incomplete address"
              value={returnForm.returnReason}
              onChange={(e) => setReturnForm({ ...returnForm, returnReason: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Additional Registry Remarks</label>
            <textarea
              rows={2}
              value={returnForm.remarks}
              onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <RotateCcw size={16} /> Confirm Return
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 8: TIMELINE & AUDIT TRAIL ─── */}
      <Modal
        isOpen={showTimelineModal && !!selectedRecordForView}
        onClose={() => setShowTimelineModal(false)}
        title="Communication Lifecycle Audit Trail"
        subtitle={`${selectedRecordForView?.recordNumber} • ${selectedRecordForView?.subject}`}
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          {(selectedRecordForView?.timeline || []).map((tl, idx) => (
            <div
              key={tl.id || idx}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-navy-subtle)',
                  color: 'var(--brand-navy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>{tl.action}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tl.date}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  Actor: <strong>{tl.actor}</strong>
                </div>
                {tl.remarks && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {tl.remarks}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ─── MODAL 9: 10 OFFICIAL REPORTS MODAL ─── */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="10 Official University Communication Reports"
        subtitle="Generate authoritative institutional registers and dispatch ledgers"
        maxWidth="520px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Select Report Specification</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="form-select"
            >
              <option value="INWARD_REGISTER">1. Inward Register Roster</option>
              <option value="OUTWARD_REGISTER">2. Outward Register Roster</option>
              <option value="PENDING_INWARD">3. Pending Inward Communications</option>
              <option value="OVERDUE_INWARD">4. Overdue Inward Action Report</option>
              <option value="DEPARTMENT_INWARD">5. Department-wise Inward Volume</option>
              <option value="DEPARTMENT_OUTWARD">6. Department-wise Outward Volume</option>
              <option value="DISPATCH_REPORT">7. Postal &amp; Courier Dispatch Report</option>
              <option value="DELIVERY_REPORT">8. Confirmed Delivery Report</option>
              <option value="RETURNED_DISPATCH">9. Returned Dispatch Report</option>
              <option value="DATEWISE_COMMUNICATION">10. Date-wise Communication Traffic</option>
            </select>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--brand-navy)', display: 'block', marginBottom: '4px' }}>
              Export Specifications:
            </span>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
              • Output format: Official Microsoft Excel Spreadsheet (.xlsx)<br />
              • Institutional validation: Full registry audit trail &amp; compliance headers
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportReportsExcel}>
              <Download size={16} /> Export .xlsx Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
