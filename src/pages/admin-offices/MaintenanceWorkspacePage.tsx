import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  CampusServiceRequest, CampusServiceType, CampusServicePriority,
  CampusServiceStatus, CampusServiceResponse, Institute, Department, Faculty
} from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Wrench, Zap, Droplet, Sparkles, Monitor, Armchair, Shield,
  Bus, Building2, HelpCircle, CheckCircle2, Clock, AlertTriangle,
  Plus, Search, Filter, Calendar, RefreshCw, BarChart3, Download,
  Printer, Eye, MessageSquare, Send, Paperclip, CheckSquare, X,
  UserCheck, AlertCircle, ArrowRight, Star, ThumbsUp, Trash2, Edit2,
  Phone, Mail, MapPin, User, ChevronRight, FileText, Upload
} from 'lucide-react';
import { DashboardReportModal } from '../../components/reports/DashboardReportModal';
import { exportToExcel } from '../../services/exportService';
import { getPermittedCampusServices, canUserAccessCampusService } from '../../services/securityService';

// Service Category Icon Helper
export const getServiceIcon = (service: CampusServiceType, size = 16) => {
  switch (service) {
    case 'Maintenance': return <Wrench size={size} color="#0F2C59" />;
    case 'Electrical': return <Zap size={size} color="#F59E0B" />;
    case 'Plumbing': return <Droplet size={size} color="#0284C7" />;
    case 'Cleaning': return <Sparkles size={size} color="#10B981" />;
    case 'IT Support': return <Monitor size={size} color="#8B5CF6" />;
    case 'Furniture': return <Armchair size={size} color="#D97706" />;
    case 'Security': return <Shield size={size} color="#DC2626" />;
    case 'Transport': return <Bus size={size} color="#0284C7" />;
    case 'Hostel': return <Building2 size={size} color="#0F2C59" />;
    default: return <HelpCircle size={size} color="#64748B" />;
  }
};

// Priority Badge Helper
export const renderPriorityBadge = (priority: CampusServicePriority) => {
  switch (priority) {
    case 'URGENT':
      return <Badge variant="danger">⚡ URGENT</Badge>;
    case 'HIGH':
      return <Badge variant="orange">HIGH</Badge>;
    case 'MEDIUM':
      return <Badge variant="gold">MEDIUM</Badge>;
    case 'LOW':
      return <Badge variant="navy">LOW</Badge>;
    default:
      return <Badge variant="navy">{priority}</Badge>;
  }
};

// Status Badge Helper
export const renderStatusBadge = (status: CampusServiceStatus) => {
  switch (status) {
    case 'OPEN':
      return <Badge variant="danger">OPEN</Badge>;
    case 'ASSIGNED':
      return <Badge variant="gold">ASSIGNED</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="warning">IN PROGRESS</Badge>;
    case 'RESOLVED':
      return <Badge variant="active">RESOLVED</Badge>;
    case 'CLOSED':
      return <Badge variant="active">CLOSED</Badge>;
    case 'REJECTED':
      return <Badge variant="inactive">REJECTED</Badge>;
    default:
      return <Badge variant="navy">{status}</Badge>;
  }
};

export const MaintenanceWorkspacePage: React.FC = () => {
  const { user, role } = useAuth();

  // Data State
  const [requests, setRequests] = useState<CampusServiceRequest[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyStaffList, setFacultyStaffList] = useState<Faculty[]>([]);

  // Workspace View Tab
  const [activeTab, setActiveTab] = useState<'ALL_REQUESTS' | 'MY_REQUESTS' | 'ASSIGNED_TO_ME' | 'ANALYTICS'>('ALL_REQUESTS');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterInstitute, setFilterInstitute] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestForView, setSelectedRequestForView] = useState<CampusServiceRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // New Request Form State
  const [newService, setNewService] = useState<CampusServiceType>('Maintenance');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPriority, setNewPriority] = useState<CampusServicePriority>('MEDIUM');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newInstituteId, setNewInstituteId] = useState('inst-1');
  const [newDepartmentId, setNewDepartmentId] = useState('');

  // Staff Assignment State
  const [targetStaffName, setTargetStaffName] = useState('');
  const [targetStaffRole, setTargetStaffRole] = useState('Senior Field Technician');
  const [targetStaffPhone, setTargetStaffPhone] = useState('+91 98250 11224');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Response / Reply State
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatusChange, setReplyStatusChange] = useState<CampusServiceStatus | ''>('');
  const [replyAttachmentName, setReplyAttachmentName] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [replyIsInternalNote, setReplyIsInternalNote] = useState(false);

  // Resolution Form State
  const [resolutionRemarksText, setResolutionRemarksText] = useState('');

  // Close & Feedback State
  const [feedbackRatingValue, setFeedbackRatingValue] = useState<number>(5);
  const [feedbackRemarksText, setFeedbackRemarksText] = useState('');

  // Toast Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRequests(db.getCampusServiceRequests(undefined, user, role || undefined));
    setInstitutes(db.getInstitutes());
    setDepartments(db.getDepartments());
    setFacultyStaffList(db.getFaculty());
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // KPI Dashboard Stats
  const dashboardStats = useMemo(() => {
    return db.getCampusServiceDashboardStats({
      service: filterService !== 'ALL' ? filterService : undefined,
      instituteId: filterInstitute !== 'ALL' ? filterInstitute : undefined,
      departmentId: filterDepartment !== 'ALL' ? filterDepartment : undefined,
      assignedTo: filterStaff !== 'ALL' ? filterStaff : undefined
    }, user, role || undefined);
  }, [requests, filterService, filterInstitute, filterDepartment, filterStaff, user, role]);

  // Filtered Requests Queue
  const filteredRequests = useMemo(() => {
    let list = requests;

    // View tab scoping
    if (activeTab === 'MY_REQUESTS') {
      list = list.filter(r => r.requestedById === user?.id || r.requestedByEmail === user?.email || (user?.enrollmentNo && r.requestedByEnrollmentOrEmpId === user.enrollmentNo));
    } else if (activeTab === 'ASSIGNED_TO_ME') {
      list = list.filter(r => r.assignedToId === user?.id || (user?.name && r.assignedToName?.includes(user.name)) || r.assignedToRole === role);
    }

    if (filterService !== 'ALL') {
      list = list.filter(r => r.service === filterService);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter(r => r.status === filterStatus);
    }
    if (filterPriority !== 'ALL') {
      list = list.filter(r => r.priority === filterPriority);
    }
    if (filterInstitute !== 'ALL') {
      list = list.filter(r => r.instituteId === filterInstitute);
    }
    if (filterDepartment !== 'ALL') {
      list = list.filter(r => r.departmentId === filterDepartment);
    }
    if (filterStaff !== 'ALL') {
      list = list.filter(r => r.assignedToName === filterStaff || r.assignedToId === filterStaff);
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom).getTime();
      list = list.filter(r => new Date(r.createdDate).getTime() >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo).getTime();
      list = list.filter(r => new Date(r.createdDate).getTime() <= to + 86400000);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(r =>
        r.requestId.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.requestedByName.toLowerCase().includes(q) ||
        (r.assignedToName && r.assignedToName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [
    requests, activeTab, filterService, filterStatus, filterPriority,
    filterInstitute, filterDepartment, filterStaff, filterDateFrom,
    filterDateTo, searchTerm, user, role
  ]);

  // Unique Assigned Staff List for Filter Dropdown
  const uniqueStaffList = useMemo(() => {
    const names = new Set<string>();
    requests.forEach(r => {
      if (r.assignedToName) names.add(r.assignedToName);
    });
    return Array.from(names);
  }, [requests]);

  // ─── ACTION HANDLERS ───

  const permittedServices = useMemo(() => getPermittedCampusServices(role), [role]);

  const handleOpenCreateModal = () => {
    setNewService(permittedServices[0] || 'Maintenance');
    setNewSubject('');
    setNewDescription('');
    setNewLocation('');
    setNewPriority('MEDIUM');
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    setNewInstituteId(user?.instituteId || 'inst-1');
    setNewDepartmentId(user?.departmentId || '');
    setShowCreateModal(true);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim() || !newLocation.trim()) {
      showToast('error', 'Subject, Description, and Location are required.');
      return;
    }

    const instObj = institutes.find(i => i.id === newInstituteId);
    const deptObj = departments.find(d => d.id === newDepartmentId);

    try {
      const created = db.createCampusServiceRequest({
        service: newService,
        subject: newSubject.trim(),
        description: newDescription.trim(),
        location: newLocation.trim(),
        priority: newPriority,
        attachmentName: newAttachmentName.trim() || undefined,
        attachmentUrl: newAttachmentUrl.trim() || (newAttachmentName ? '#' : undefined),
        attachmentSize: newAttachmentName ? '1.2 MB' : undefined,
        instituteId: newInstituteId,
        instituteName: instObj?.name || 'Swarrnim Startup & Innovation University',
        departmentId: newDepartmentId || undefined,
        departmentName: deptObj?.name || undefined,
        requestedById: user?.id || 'stu-1',
        requestedByName: user?.name || 'Demo Requester',
        requestedByRole: (role as any) || 'STUDENT',
        requestedByEmail: user?.email || 'student@swarrnim.edu.in',
        requestedByPhone: user?.phone || '+91 98250 11223'
      }, user || undefined, role || undefined);

      showToast('success', `Service Request ${created.requestId} logged successfully.`);
      loadData();
      setShowCreateModal(false);
      setSelectedRequestForView(created);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit service request.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isResponse = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isResponse) {
      setReplyAttachmentName(file.name);
      setReplyAttachmentUrl(URL.createObjectURL(file));
    } else {
      setNewAttachmentName(file.name);
      setNewAttachmentUrl(URL.createObjectURL(file));
    }
  };

  const handleAssignStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForView || !targetStaffName.trim()) {
      showToast('error', 'Please select or enter staff name.');
      return;
    }

    const updated = db.assignCampusServiceStaff(
      selectedRequestForView.id,
      {
        staffId: `staff-${Date.now()}`,
        staffName: targetStaffName.trim(),
        staffRole: targetStaffRole.trim() || 'Field Technician',
        staffPhone: targetStaffPhone.trim() || '+91 98250 00000',
        assignmentNotes: assignmentNotes.trim()
      },
      user || undefined
    );

    if (updated) {
      showToast('success', `Request ${updated.requestId} assigned to ${updated.assignedToName}.`);
      setSelectedRequestForView(updated);
      loadData();
      setShowAssignModal(false);
      setAssignmentNotes('');
    }
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForView || !replyMessage.trim()) return;

    const updated = db.addCampusServiceResponse(
      selectedRequestForView.id,
      {
        message: replyMessage.trim(),
        attachmentName: replyAttachmentName.trim() || undefined,
        attachmentUrl: replyAttachmentUrl.trim() || undefined,
        statusChange: replyStatusChange ? (replyStatusChange as CampusServiceStatus) : undefined,
        isInternalNote: replyIsInternalNote
      },
      user || undefined
    );

    if (updated) {
      showToast('success', 'Response recorded in request timeline.');
      setSelectedRequestForView(updated);
      loadData();
      setReplyMessage('');
      setReplyStatusChange('');
      setReplyAttachmentName('');
      setReplyAttachmentUrl('');
      setReplyIsInternalNote(false);
    }
  };

  const handleResolveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForView || !resolutionRemarksText.trim()) {
      showToast('error', 'Resolution remarks are required.');
      return;
    }

    const updated = db.resolveCampusServiceRequest(
      selectedRequestForView.id,
      resolutionRemarksText.trim(),
      user || undefined
    );

    if (updated) {
      showToast('success', `Request ${updated.requestId} marked RESOLVED.`);
      setSelectedRequestForView(updated);
      loadData();
      setShowResolveModal(false);
      setResolutionRemarksText('');
    }
  };

  const handleCloseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForView) return;

    const updated = db.closeCampusServiceRequest(
      selectedRequestForView.id,
      {
        rating: feedbackRatingValue,
        remarks: feedbackRemarksText.trim()
      },
      user || undefined
    );

    if (updated) {
      showToast('success', `Request ${updated.requestId} confirmed CLOSED.`);
      setSelectedRequestForView(updated);
      loadData();
      setShowCloseModal(false);
      setFeedbackRemarksText('');
    }
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campus service request?')) {
      const ok = db.deleteCampusServiceRequest(id, user || undefined);
      if (ok) {
        showToast('success', 'Service request deleted.');
        if (selectedRequestForView?.id === id) setSelectedRequestForView(null);
        loadData();
      }
    }
  };

  // ─── EXPORT SUITE ───

  const handleExportFullTable = () => {
    const headers = [
      'Request ID', 'Service Category', 'Subject Matter', 'Location / Facility',
      'Priority', 'Requested By Name', 'Requester Role', 'Requester Phone',
      'Department / Institute', 'Assigned Staff', 'Staff Role', 'Status',
      'Created Date', 'Resolved Date', 'Resolution Remarks', 'Rating (1-5)'
    ];

    const rows = filteredRequests.map(r => [
      r.requestId, r.service, r.subject, r.location, r.priority,
      r.requestedByName, r.requestedByRole, r.requestedByPhone || '-',
      r.departmentName || r.instituteName || 'SSIU Campus',
      r.assignedToName || 'Unassigned', r.assignedToRole || '-', r.status,
      r.createdDate ? new Date(r.createdDate).toLocaleDateString() : '-',
      r.resolvedDate ? new Date(r.resolvedDate).toLocaleDateString() : '-',
      r.resolutionRemarks || '-', r.feedbackRating ? `${r.feedbackRating}/5` : '-'
    ]);

    exportToExcel(`SSIU_Campus_Service_Requests_${new Date().toISOString().split('T')[0]}`, headers, rows, {
      departmentName: 'Campus Services & Auxiliary Hub',
      searchQuery: searchTerm || undefined
    }, {
      name: user?.name || 'Campus Services Officer',
      role: (role as any) || 'MAINTENANCE_ADMIN'
    });

    showToast('success', `Exported ${rows.length} service request records to Excel.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
            <span>{notification.message}</span>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={28} color="var(--brand-orange)" /> SSIU Campus Services &amp; Auxiliary Hub
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Central university portal for maintenance, electrical, plumbing, cleaning, IT support, furniture, security, and campus operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <BarChart3 size={15} /> Executive Reports
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportFullTable} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Download size={15} /> Export Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Printer size={15} /> Print View
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          >
            <Plus size={16} /> + New Service Request
          </button>
        </div>
      </div>

      {/* ─── 7 REAL DATABASE DASHBOARD KPI CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
        
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #1e3a8a' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REQUESTS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>
            {dashboardStats.total}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#1e3a8a', fontWeight: 600 }}>All Logged Work Orders</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>OPEN QUEUE</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>
            {dashboardStats.open}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>Unassigned Requests</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #eab308' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ASSIGNED</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ca8a04', marginTop: '0.2rem' }}>
            {dashboardStats.assigned}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ca8a04', fontWeight: 600 }}>Staff Allocated</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
            {dashboardStats.inProgress}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>Field Work Underway</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>RESOLVED</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
            {dashboardStats.resolved}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>Awaiting Requester Close</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>CLOSED</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
            {dashboardStats.closed}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>Completed &amp; Rated</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>HIGH / URGENT</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>
            {dashboardStats.highPriority}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>Expedited SLA</div>
        </div>

      </div>

      {/* ─── WORKSPACE QUEUE TABS ─── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'ALL_REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ALL_REQUESTS')}
          style={{ fontWeight: activeTab === 'ALL_REQUESTS' ? 800 : 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <CheckSquare size={16} /> All Service Requests ({requests.length})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'MY_REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('MY_REQUESTS')}
          style={{ fontWeight: activeTab === 'MY_REQUESTS' ? 800 : 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <User size={16} /> My Submitted Requests
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'ASSIGNED_TO_ME' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ASSIGNED_TO_ME')}
          style={{ fontWeight: activeTab === 'ASSIGNED_TO_ME' ? 800 : 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <UserCheck size={16} /> Assigned To Me / My Office
        </button>
      </div>

      {/* ─── MULTI-CRITERIA FILTER TOOLBAR ─── */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
              placeholder="Search request ID, subject, location, requester, technician, keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Service Category */}
            <select
              className="form-select"
              style={{ fontSize: '0.8125rem' }}
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
            >
              <option value="ALL">All Services</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Cleaning">Cleaning</option>
              <option value="IT Support">IT Support</option>
              <option value="Furniture">Furniture</option>
              <option value="Security">Security</option>
              <option value="Transport">Transport</option>
              <option value="Hostel">Hostel</option>
              <option value="Other">Other</option>
            </select>

            {/* Status */}
            <select
              className="form-select"
              style={{ fontSize: '0.8125rem' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            {/* Priority */}
            <select
              className="form-select"
              style={{ fontSize: '0.8125rem' }}
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            {/* Assigned Staff */}
            <select
              className="form-select"
              style={{ fontSize: '0.8125rem' }}
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
            >
              <option value="ALL">All Assigned Staff</option>
              {uniqueStaffList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Institute Filter */}
            <select
              className="form-select"
              style={{ fontSize: '0.8125rem' }}
              value={filterInstitute}
              onChange={e => {
                setFilterInstitute(e.target.value);
                setFilterDepartment('ALL');
              }}
            >
              <option value="ALL">All Institutes</option>
              {institutes.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.code}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Showing <strong>{filteredRequests.length}</strong> service request records</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setSearchTerm('');
              setFilterService('ALL');
              setFilterStatus('ALL');
              setFilterPriority('ALL');
              setFilterInstitute('ALL');
              setFilterDepartment('ALL');
              setFilterStaff('ALL');
              setFilterDateFrom('');
              setFilterDateTo('');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ─── REQUESTS QUEUE TABLE ─── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)' }}>
                <th>Request ID &amp; Service</th>
                <th>Subject &amp; Location</th>
                <th>Priority</th>
                <th>Requested By</th>
                <th>Assigned Technician / Staff</th>
                <th>Date Logged</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action Desk</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    <Wrench size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--brand-navy)' }}>No Service Requests Found</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Try adjusting your filters or search terms.</div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const responsesCount = (req.responses || []).length;

                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {getServiceIcon(req.service, 15)}
                          {req.requestId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {req.service}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.subject}>
                          {req.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={11} /> {req.location}
                        </div>
                      </td>

                      <td>
                        {renderPriorityBadge(req.priority)}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{req.requestedByName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {req.requestedByRole} • {req.departmentName || req.requestedByPhone || ''}
                        </div>
                      </td>

                      <td>
                        {req.assignedToName ? (
                          <div>
                            <div style={{ fontWeight: 800, color: '#0369a1' }}>{req.assignedToName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.assignedToRole || 'Field Staff'}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <AlertCircle size={12} /> Unassigned
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>{new Date(req.createdDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(req.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      <td>
                        {renderStatusBadge(req.status)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => {
                              const full = db.getCampusServiceRequestById(req.id, user, role || undefined);
                              if (!full) {
                                showToast('error', '403 Forbidden: You do not have permission to view this request.');
                                return;
                              }
                              setSelectedRequestForView(full);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}
                            title="View Dossier & Threaded Responses"
                          >
                            <Eye size={13} /> View ({responsesCount})
                          </button>

                          {req.status === 'OPEN' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => {
                                setSelectedRequestForView(req);
                                setTargetStaffName('');
                                setAssignmentNotes('');
                                setShowAssignModal(true);
                              }}
                              title="Assign Staff"
                            >
                              Assign
                            </button>
                          )}

                          {req.status !== 'RESOLVED' && req.status !== 'CLOSED' && req.status !== 'REJECTED' && (
                            <button
                              type="button"
                              className="btn btn-xs"
                              style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
                              onClick={() => {
                                setSelectedRequestForView(req);
                                setResolutionRemarksText('');
                                setShowResolveModal(true);
                              }}
                              title="Resolve Request"
                            >
                              Resolve
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteRequest(req.id)}
                            title="Delete Request"
                          >
                            <Trash2 size={13} />
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

      {/* ════════════════════════════════════════════════════════════════════════
          ─── CREATE SERVICE REQUEST MODAL ───
      ════════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={22} color="var(--brand-orange)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Submit Campus Auxiliary Service Request
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Service Category *</label>
                    <select
                      className="form-select"
                      required
                      value={newService}
                      onChange={e => setNewService(e.target.value as CampusServiceType)}
                    >
                      {permittedServices.map(srv => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority Level *</label>
                    <select
                      className="form-select"
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as CampusServicePriority)}
                    >
                      <option value="LOW">LOW (General Routine)</option>
                      <option value="MEDIUM">MEDIUM (Standard - 48 Hours)</option>
                      <option value="HIGH">HIGH (Urgent - 24 Hours)</option>
                      <option value="URGENT">URGENT (Critical Safety/Emergency)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Exact Location / Room / Block *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. SSCIT Block A, Room 302"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Request Subject / Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Ceiling Projector Power Trip in Classroom 302"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description of Issue / Service Needed *</label>
                  <textarea
                    required
                    rows={4}
                    className="form-input"
                    placeholder="Describe the issue in detail, frequency, equipment affected, and optimal times for technicians to visit..."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                  />
                </div>

                {/* Institute & Department */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Campus Institute</label>
                    <select
                      className="form-select"
                      value={newInstituteId}
                      onChange={e => setNewInstituteId(e.target.value)}
                    >
                      {institutes.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Department (If applicable)</label>
                    <select
                      className="form-select"
                      value={newDepartmentId}
                      onChange={e => setNewDepartmentId(e.target.value)}
                    >
                      <option value="">Campus-wide / General</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Supporting Attachment */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Paperclip size={15} color="var(--brand-orange)" /> Supporting Photo / Document Attachment (Optional)
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                      <Upload size={14} /> Choose File
                      <input type="file" style={{ display: 'none' }} onChange={e => handleFileUpload(e, false)} />
                    </label>

                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.8125rem' }}
                      placeholder="or enter file name e.g. Faulty_Switch_Photo.jpg"
                      value={newAttachmentName}
                      onChange={e => setNewAttachmentName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Requester Identity Info (RBAC) */}
                <div style={{ background: '#F1F5F9', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Logged in as: <strong>{user?.name || 'Authorized User'}</strong> ({role || 'STUDENT'})</span>
                  <span>Contact: <strong>{user?.phone || user?.email || '+91 98250 11223'}</strong></span>
                </div>

              </div>

              <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Submit Service Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── VIEW REQUEST DOSSIER & RESPONSE THREAD MODAL ───
      ════════════════════════════════════════════════════════════════════════ */}
      {selectedRequestForView && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '920px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 800 }}>
                    {selectedRequestForView.requestId}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                    {selectedRequestForView.service} Service Request
                  </span>
                  {renderPriorityBadge(selectedRequestForView.priority)}
                  {renderStatusBadge(selectedRequestForView.status)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginTop: '0.2rem' }}>
                  {selectedRequestForView.subject}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRequestForView(null)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              
              {/* Top Overview Cards */}
              <div className="grid-3">
                <div className="card" style={{ padding: '1rem', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>REQUESTER PROFILE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>
                    {selectedRequestForView.requestedByName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Role: <Badge variant="navy">{selectedRequestForView.requestedByRole}</Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {selectedRequestForView.requestedByPhone || selectedRequestForView.requestedByEmail}
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>FACILITY LOCATION</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0369a1', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={15} /> {selectedRequestForView.location}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {selectedRequestForView.departmentName || selectedRequestForView.instituteName || 'SSIU Campus'}
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ASSIGNED TECHNICIAN / STAFF</div>
                  {selectedRequestForView.assignedToName ? (
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                        {selectedRequestForView.assignedToName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {selectedRequestForView.assignedToRole || 'Technician'} • {selectedRequestForView.assignedToPhone || ''}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#DC2626', fontWeight: 700 }}>Awaiting Staff Assignment</span>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        style={{ marginTop: '0.35rem', display: 'block' }}
                        onClick={() => {
                          setTargetStaffName('');
                          setAssignmentNotes('');
                          setShowAssignModal(true);
                        }}
                      >
                        Assign Technician Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Box */}
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-orange)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 0.5rem 0' }}>
                  Issue Description &amp; Scope:
                </h4>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-main)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedRequestForView.description}
                </p>

                {selectedRequestForView.attachmentName && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Paperclip size={15} color="var(--brand-orange)" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                      Attachment: {selectedRequestForView.attachmentName} ({selectedRequestForView.attachmentSize || '1.2 MB'})
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => showToast('success', `Downloading ${selectedRequestForView.attachmentName}...`)}
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                )}
              </div>

              {/* Resolution Remarks if Resolved */}
              {selectedRequestForView.resolutionRemarks && (
                <div className="card" style={{ padding: '1.25rem', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#065F46', fontWeight: 800, fontSize: '0.875rem' }}>
                    <CheckCircle2 size={16} /> Official Resolution Remarks ({selectedRequestForView.resolvedDate ? new Date(selectedRequestForView.resolvedDate).toLocaleDateString() : 'Completed'}):
                  </div>
                  <p style={{ fontSize: '0.84375rem', color: '#047857', margin: '0.4rem 0 0 0', lineHeight: 1.5 }}>
                    {selectedRequestForView.resolutionRemarks}
                  </p>
                </div>
              )}

              {/* Feedback Rating if Closed */}
              {selectedRequestForView.feedbackRating && (
                <div className="card" style={{ padding: '1rem', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', color: '#F59E0B' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={18} fill={star <= (selectedRequestForView.feedbackRating || 5) ? '#F59E0B' : 'none'} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#92400E' }}>
                    Requester Verified &amp; Closed: <strong>"{selectedRequestForView.feedbackRemarks || 'Satisfied with timely resolution.'}"</strong>
                  </div>
                </div>
              )}

              {/* ─── RESPONSE & COMMUNICATION TIMELINE THREAD ─── */}
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={17} color="var(--brand-orange)" /> Service Request Response &amp; Communication History ({(selectedRequestForView.responses || []).length} Updates)
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                  {(selectedRequestForView.responses || []).map((resp, idx) => {
                    const isStaff = resp.senderRole === 'MAINTENANCE_ADMIN' || resp.senderRole === 'STAFF' || resp.senderRole.includes('Technician') || resp.senderRole.includes('Electrician') || resp.senderRole.includes('Plumber');

                    return (
                      <div
                        key={resp.id || idx}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: resp.isInternalNote ? '#FFFBEB' : isStaff ? '#F0F9FF' : '#F8FAFC',
                          border: `1px solid ${resp.isInternalNote ? '#FDE68A' : isStaff ? '#BAE6FD' : 'var(--border-color)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.84375rem' }}>
                              {resp.senderName}
                            </span>
                            <Badge variant={isStaff ? 'navy' : 'active'}>{resp.senderRole}</Badge>
                            {resp.isInternalNote && <Badge variant="gold">INTERNAL NOTE</Badge>}
                            {resp.statusChange && (
                              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginLeft: '0.25rem' }}>
                                ➔ Status changed to {resp.statusChange}
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(resp.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {resp.message}
                        </p>

                        {resp.attachmentName && (
                          <div style={{ marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#0369a1' }}>
                            <Paperclip size={12} /> {resp.attachmentName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Response Input Box */}
                {selectedRequestForView.status !== 'CLOSED' && (
                  <form onSubmit={handleSendResponse} style={{ marginTop: '0.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                        Add Response / Status Update:
                      </span>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: '28px' }}
                          value={replyStatusChange}
                          onChange={e => setReplyStatusChange(e.target.value as any)}
                        >
                          <option value="">Keep Status ({selectedRequestForView.status})</option>
                          <option value="IN_PROGRESS">Transition to IN_PROGRESS</option>
                          <option value="RESOLVED">Transition to RESOLVED</option>
                          <option value="REJECTED">Transition to REJECTED</option>
                        </select>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={replyIsInternalNote}
                            onChange={e => setReplyIsInternalNote(e.target.checked)}
                          />
                          <span>Internal Staff Note</span>
                        </label>
                      </div>
                    </div>

                    <textarea
                      required
                      rows={2}
                      className="form-input"
                      placeholder="Type response message, progress update, or technician findings..."
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="btn btn-secondary btn-xs" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
                        <Paperclip size={12} /> {replyAttachmentName || 'Attach File'}
                        <input type="file" style={{ display: 'none' }} onChange={e => handleFileUpload(e, true)} />
                      </label>

                      <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                        <Send size={14} /> Send Response
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> Print Work Order Slip
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedRequestForView.status === 'OPEN' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setTargetStaffName('');
                      setAssignmentNotes('');
                      setShowAssignModal(true);
                    }}
                  >
                    Assign Staff
                  </button>
                )}

                {selectedRequestForView.status !== 'RESOLVED' && selectedRequestForView.status !== 'CLOSED' && selectedRequestForView.status !== 'REJECTED' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#10B981', color: '#FFFFFF', fontWeight: 700 }}
                    onClick={() => {
                      setResolutionRemarksText('');
                      setShowResolveModal(true);
                    }}
                  >
                    Mark Resolved
                  </button>
                )}

                {selectedRequestForView.status === 'RESOLVED' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#059669', color: '#FFFFFF', fontWeight: 700 }}
                    onClick={() => {
                      setFeedbackRatingValue(5);
                      setFeedbackRemarksText('');
                      setShowCloseModal(true);
                    }}
                  >
                    Confirm &amp; Close Request
                  </button>
                )}

                <button className="btn btn-secondary" onClick={() => setSelectedRequestForView(null)}>
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── ASSIGN STAFF MODAL ───
      ════════════════════════════════════════════════════════════════════════ */}
      {showAssignModal && selectedRequestForView && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '520px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={20} color="var(--brand-orange)" /> Assign Staff to {selectedRequestForView.requestId}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssignModal(false)} style={{ color: '#FFFFFF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignStaff}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Select Registered Technician / Faculty Staff *</label>
                  <select
                    className="form-select"
                    value={targetStaffName}
                    onChange={e => {
                      setTargetStaffName(e.target.value);
                      const f = facultyStaffList.find(fac => fac.name === e.target.value);
                      if (f) {
                        setTargetStaffRole(f.designation || 'Field Staff');
                        setTargetStaffPhone(f.phone || '+91 98250 11224');
                      }
                    }}
                  >
                    <option value="">Choose Staff Member...</option>
                    <option value="Mukeshbhai Patel">Mukeshbhai Patel (Senior Campus Electrician)</option>
                    <option value="Dineshbhai Prajapati">Dineshbhai Prajapati (Campus Plumber)</option>
                    <option value="Nirav Shah">Nirav Shah (Network & IT Systems Engineer)</option>
                    <option value="Kailashben Vankar">Kailashben Vankar (Housekeeping Supervisor)</option>
                    <option value="Suresh Parmar">Suresh Parmar (Hostel Maintenance Staff)</option>
                    <option value="Vikrambhai Vaghela">Vikrambhai Vaghela (Transport Dispatcher)</option>
                    {facultyStaffList.map(f => (
                      <option key={f.id} value={f.name}>{f.name} ({f.designation || 'Faculty'})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Staff Designation / Role</label>
                    <input
                      type="text"
                      className="form-input"
                      value={targetStaffRole}
                      onChange={e => setTargetStaffRole(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={targetStaffPhone}
                      onChange={e => setTargetStaffPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignment Instructions &amp; Work Order Notes</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="e.g. Inspect power panel before 10:30 AM practical class..."
                    value={assignmentNotes}
                    onChange={e => setAssignmentNotes(e.target.value)}
                  />
                </div>

              </div>

              <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Confirm Assignment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── RESOLVE REQUEST MODAL ───
      ════════════════════════════════════════════════════════════════════════ */}
      {showResolveModal && selectedRequestForView && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '540px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: '#059669', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={20} /> Mark Resolved: {selectedRequestForView.requestId}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowResolveModal(false)} style={{ color: '#FFFFFF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveRequest}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ fontSize: '0.84375rem', color: 'var(--text-main)' }}>
                  Recording completion details for <strong>{selectedRequestForView.subject}</strong> at <strong>{selectedRequestForView.location}</strong>.
                </div>

                <div className="form-group">
                  <label className="form-label">Resolution Summary &amp; Action Taken *</label>
                  <textarea
                    required
                    rows={4}
                    className="form-input"
                    placeholder="Describe what was repaired, parts replaced, testing done, and confirmation of normal operation..."
                    value={resolutionRemarksText}
                    onChange={e => setResolutionRemarksText(e.target.value)}
                  />
                </div>

              </div>

              <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}>
                  Confirm Resolution
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ─── CLOSE & FEEDBACK MODAL ───
      ════════════════════════════════════════════════════════════════════════ */}
      {showCloseModal && selectedRequestForView && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '500px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckSquare size={20} color="var(--brand-orange)" /> Close &amp; Rate Request
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCloseModal(false)} style={{ color: '#FFFFFF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloseRequest}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>How satisfied are you with the service provided?</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRatingValue(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Star size={28} color="#F59E0B" fill={star <= feedbackRatingValue ? '#F59E0B' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F59E0B', marginTop: '0.25rem' }}>
                    {feedbackRatingValue === 5 ? 'Excellent Service' : feedbackRatingValue === 4 ? 'Good Service' : feedbackRatingValue === 3 ? 'Satisfactory' : 'Needs Improvement'}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback Remarks (Optional)</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="e.g. Fixed quickly and cleanly on the same day..."
                    value={feedbackRemarksText}
                    onChange={e => setFeedbackRemarksText(e.target.value)}
                  />
                </div>

              </div>

              <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Confirm Closure
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── EXECUTIVE REPORT MODAL INTEGRATION ─── */}
      <DashboardReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        dashboardType="CAMPUS_SERVICES"
        currentFilters={{
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          instituteId: filterInstitute !== 'ALL' ? filterInstitute : undefined,
          departmentId: filterDepartment !== 'ALL' ? filterDepartment : undefined,
          searchQuery: filterService !== 'ALL' ? filterService : undefined
        }}
        user={user}
        role={role}
      />

    </div>
  );
};
