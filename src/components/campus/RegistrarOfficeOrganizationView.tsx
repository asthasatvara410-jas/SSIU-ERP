import React, { useState, useMemo } from 'react';
import { registrarOfficeService } from '../../services/registrarOfficeService';
import {
  RegistrarOfficeStaff,
  RegistrarOfficeSection,
  RegistrarOfficePosition,
  RegistrarOfficeResponsibility,
  RegistrarStaffResponsibilityAssignment,
  RegistrarOfficeWorkItem,
  WorkItemStatus,
  WorkItemPriority,
  WorkItemType
} from '../../types/registrarOffice';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { ExcelDataTable, ExcelColumn } from '../common/ExcelDataTable';
import { Modal } from '../common/Modal';
import {
  Building2, Users, UserCheck, ShieldCheck, AlertTriangle, 
  Briefcase, CheckCircle2, Clock, FileText, ArrowRight, 
  RefreshCw, Plus, Download, Search, Filter, Eye, ChevronRight,
  GitFork, Network, UserPlus, FileCheck, Layers, Calendar, 
  Phone, Mail, ArrowUpRight, Send, AlertCircle, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface RegistrarOfficeOrganizationViewProps {
  onBackToMainDashboard?: () => void;
}

export type OfficeTabType = 
  | 'DASHBOARD' 
  | 'ORGANIZATION_TREE' 
  | 'STAFF_ROSTER' 
  | 'SECTIONS' 
  | 'WORK_ALLOCATION' 
  | 'RESPONSIBILITIES' 
  | 'AUDIT_LOGS';

export const RegistrarOfficeOrganizationView: React.FC<RegistrarOfficeOrganizationViewProps> = ({
  onBackToMainDashboard
}) => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const [activeTab, setActiveTab] = useState<OfficeTabType>('DASHBOARD');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // LIVE DATA FROM SERVICE
  // ──────────────────────────────────────────────────────────────────────────
  const office = useMemo(() => registrarOfficeService.getOffice(), [refreshKey]);
  const sections = useMemo(() => registrarOfficeService.getSections(), [refreshKey]);
  const positions = useMemo(() => registrarOfficeService.getPositions(), [refreshKey]);
  const staffList = useMemo(() => registrarOfficeService.getStaffList(), [refreshKey]);
  const responsibilities = useMemo(() => registrarOfficeService.getResponsibilities(), [refreshKey]);
  const assignments = useMemo(() => registrarOfficeService.getResponsibilityAssignments(), [refreshKey]);
  const workItems = useMemo(() => registrarOfficeService.getWorkItems(), [refreshKey]);
  const auditLogs = useMemo(() => registrarOfficeService.getAuditLogs(), [refreshKey]);
  const kpiStats = useMemo(() => registrarOfficeService.getOfficeDashboardKPIs(), [refreshKey]);

  // Modals state
  const [selectedStaffFor360, setSelectedStaffFor360] = useState<RegistrarOfficeStaff | null>(null);
  const [staff360Tab, setStaff360Tab] = useState<'OVERVIEW' | 'RESPONSIBILITIES' | 'WORK' | 'PERFORMANCE' | 'SUBORDINATES'>('OVERVIEW');

  // Appoint New Staff Modal
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffSectionId, setNewStaffSectionId] = useState(sections[0]?.id || 'SEC-ACAD');
  const [newStaffPositionId, setNewStaffPositionId] = useState(positions[0]?.id || 'POS-SRCLK');
  const [newStaffReportingUserId, setNewStaffReportingUserId] = useState('USER-DEP-REG-1');
  const [newStaffQualifications, setNewStaffQualifications] = useState('');
  const [newStaffRoom, setNewStaffRoom] = useState('');

  // Assign Work Item Modal
  const [isAssignWorkModalOpen, setIsAssignWorkModalOpen] = useState(false);
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workType, setWorkType] = useState<WorkItemType>('TASK');
  const [workPriority, setWorkPriority] = useState<WorkItemPriority>('NORMAL');
  const [workSectionId, setWorkSectionId] = useState(sections[0]?.id || 'SEC-ACAD');
  const [workAssignedToStaffId, setWorkAssignedToStaffId] = useState(staffList[0]?.id || '');
  const [workDueDate, setWorkDueDate] = useState('');
  const [workRemarks, setWorkRemarks] = useState('');

  // Assign Responsibility Modal
  const [isAssignRespModalOpen, setIsAssignRespModalOpen] = useState(false);
  const [respStaffId, setRespStaffId] = useState(staffList[0]?.id || '');
  const [respId, setRespId] = useState(responsibilities[0]?.id || '');
  const [respPriority, setRespPriority] = useState<WorkItemPriority>('NORMAL');
  const [respRemarks, setRespRemarks] = useState('');

  // Reassign Reporting Authority Modal
  const [isReassignReportingModalOpen, setIsReassignReportingModalOpen] = useState(false);
  const [targetStaffToReassign, setTargetStaffToReassign] = useState<RegistrarOfficeStaff | null>(null);
  const [newReportingUserId, setNewReportingUserId] = useState('');

  // Update Work Status Modal
  const [selectedWorkForStatus, setSelectedWorkForStatus] = useState<RegistrarOfficeWorkItem | null>(null);
  const [workNewStatus, setWorkNewStatus] = useState<WorkItemStatus>('COMPLETED');
  const [workStatusNotes, setWorkStatusNotes] = useState('');

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  const handleAppointStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) {
      showToast('Please provide employee name and official email.', 'error');
      return;
    }
    registrarOfficeService.createStaffMember({
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone || '9825000000',
      sectionId: newStaffSectionId,
      positionId: newStaffPositionId,
      reportingToUserId: newStaffReportingUserId,
      qualifications: newStaffQualifications,
      roomNumber: newStaffRoom,
      performedByUser: user || { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    });
    showToast(`Appointed ${newStaffName} to Registrar Office.`);
    setIsAppointModalOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    triggerRefresh();
  };

  const handleAssignWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle || !workDueDate) {
      showToast('Please provide title and due date for the matter.', 'error');
      return;
    }
    registrarOfficeService.assignWorkItem({
      title: workTitle,
      description: workDescription,
      workType,
      priority: workPriority,
      sectionId: workSectionId,
      assignedToStaffId: workAssignedToStaffId || staffList[0]?.id || '',
      dueDate: workDueDate,
      remarks: workRemarks,
      performedByUser: user || { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    });
    showToast(`Work matter "${workTitle}" assigned successfully.`);
    setIsAssignWorkModalOpen(false);
    setWorkTitle('');
    setWorkDescription('');
    setWorkDueDate('');
    triggerRefresh();
  };

  const handleAssignResponsibility = (e: React.FormEvent) => {
    e.preventDefault();
    registrarOfficeService.assignResponsibility({
      staffId: respStaffId || staffList[0]?.id || '',
      responsibilityId: respId || responsibilities[0]?.id || '',
      priority: respPriority,
      remarks: respRemarks,
      performedByUser: user || { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    });
    showToast('Responsibility assigned successfully.');
    setIsAssignRespModalOpen(false);
    setRespRemarks('');
    triggerRefresh();
  };

  const handleReassignReporting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaffToReassign || !newReportingUserId) return;
    registrarOfficeService.updateStaffReportingAuthority(
      targetStaffToReassign.id,
      newReportingUserId,
      user || { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    );
    showToast(`Reporting authority for ${targetStaffToReassign.name} updated.`);
    setIsReassignReportingModalOpen(false);
    setTargetStaffToReassign(null);
    triggerRefresh();
  };

  const handleUpdateWorkStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkForStatus) return;
    registrarOfficeService.updateWorkItemStatus(
      selectedWorkForStatus.id,
      workNewStatus,
      workStatusNotes || `Status changed to ${workNewStatus}`,
      user || { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    );
    showToast(`Updated status of ${selectedWorkForStatus.workNumber} to ${workNewStatus}.`);
    setSelectedWorkForStatus(null);
    setWorkStatusNotes('');
    triggerRefresh();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // EXCEL DATA TABLE COLUMNS
  // ──────────────────────────────────────────────────────────────────────────
  const staffColumns: ExcelColumn<RegistrarOfficeStaff>[] = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      width: '120px',
      render: s => <code style={{ fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{s.employeeId}</code>
    },
    {
      key: 'name',
      header: 'Officer / Staff Name',
      width: '240px',
      render: s => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{s.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.email} • {s.phone}</div>
        </div>
      )
    },
    {
      key: 'positionTitle',
      header: 'Designation / Position',
      width: '210px',
      render: s => (
        <div>
          <span style={{ fontWeight: 700 }}>{s.positionTitle}</span>
          <div style={{ fontSize: '0.7rem', color: '#4338CA' }}>{s.roleLevel}</div>
        </div>
      )
    },
    {
      key: 'sectionName',
      header: 'Assigned Section',
      width: '220px',
      render: s => <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.sectionName}</span>
    },
    {
      key: 'reportingToName',
      header: 'Reports To',
      width: '200px',
      render: s => <span style={{ fontSize: '0.75rem', color: '#475569' }}>{s.reportingToName || 'Dr. Sanjay Patel (Registrar)'}</span>
    },
    {
      key: 'assignedWork',
      header: 'Active Matters',
      width: '120px',
      align: 'center',
      render: s => {
        const count = workItems.filter(w => (w.assignedToStaffId === s.id || w.assignedToUserId === s.userId) && w.status !== 'COMPLETED').length;
        return <Badge variant={count > 3 ? 'warning' : 'navy'}>{count} Matters</Badge>;
      }
    },
    {
      key: 'employmentStatus',
      header: 'Status',
      width: '90px',
      align: 'center',
      render: s => <Badge variant={s.employmentStatus === 'ACTIVE' ? 'active' : 'inactive'}>{s.employmentStatus}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      align: 'right',
      sortable: false,
      render: s => (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => { setSelectedStaffFor360(s); setStaff360Tab('OVERVIEW'); }}
          >
            360° Profile
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            title="Reassign Reporting Line"
            onClick={() => { setTargetStaffToReassign(s); setNewReportingUserId(s.reportingToUserId || 'USER-REGISTRAR'); setIsReassignReportingModalOpen(true); }}
          >
            <Network size={12} />
          </button>
        </div>
      )
    }
  ];

  const workColumns: ExcelColumn<RegistrarOfficeWorkItem>[] = [
    {
      key: 'workNumber',
      header: 'Matter No',
      width: '140px',
      render: w => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{w.workNumber}</code>
    },
    {
      key: 'title',
      header: 'Subject / Matter Title',
      width: '280px',
      render: w => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{w.title}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{w.sectionName}</div>
        </div>
      )
    },
    {
      key: 'workType',
      header: 'Type',
      width: '130px',
      render: w => <Badge variant="navy">{w.workType}</Badge>
    },
    {
      key: 'assignedToName',
      header: 'Assigned Officer',
      width: '180px',
      render: w => (
        <div>
          <span style={{ fontWeight: 600 }}>{w.assignedToName}</span>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>By: {w.assignedByName}</div>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '100px',
      align: 'center',
      render: w => (
        <Badge variant={w.priority === 'URGENT' ? 'danger' : w.priority === 'HIGH' ? 'warning' : 'navy'}>
          {w.priority}
        </Badge>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      width: '110px',
      render: w => <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{w.dueDate}</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      align: 'center',
      render: w => (
        <Badge variant={w.status === 'COMPLETED' ? 'success' : w.status === 'OVERDUE' || w.status === 'ESCALATED' ? 'danger' : 'warning'}>
          {w.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '130px',
      align: 'right',
      sortable: false,
      render: w => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => { setSelectedWorkForStatus(w); setWorkNewStatus(w.status); }}
        >
          Update Status
        </button>
      )
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER MAIN VIEW
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* ─── HEADER & BREADCRUMB ─── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Office of the Registrar — Organization & Workforce Control
            </h2>
            <Badge variant="gold">Autonomous Administrative Unit</Badge>
            <Badge variant="active">Live State</Badge>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Central Secretariat of the Registrar • Direct hierarchy: Registrar → Deputy Registrars → Assistant Registrars → Section Officers → Office Staff
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onBackToMainDashboard && (
            <button
              onClick={onBackToMainDashboard}
              className="btn btn-secondary btn-sm"
            >
              Back to Academic Control
            </button>
          )}
          <button 
            onClick={triggerRefresh} 
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} /> Refresh Roster
          </button>
          <button
            onClick={() => setIsAssignWorkModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={14} /> Assign Office Matter
          </button>
          <button
            onClick={() => setIsAppointModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0B192C' }}
          >
            <UserPlus size={14} /> Appoint Staff
          </button>
        </div>
      </div>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: '1px solid',
          borderColor: toast.type === 'success' ? '#A7F3D0' : '#FECACA',
          color: toast.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── TOP GLOBAL KPI RIBBON ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #0B192C' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Office Staff</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B192C' }}>{kpiStats.totalStaff}</div>
          <div style={{ fontSize: '0.68rem', color: '#10B981' }}>{kpiStats.activeStaff} Active Staff</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Deputy Registrars</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB' }}>{kpiStats.deputyRegistrars}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Tier 1 Administrative Heads</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #6366F1' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Assistant Registrars</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5' }}>{kpiStats.assistantRegistrars}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Tier 2 Branch Heads</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Section Officers</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{kpiStats.sectionOfficers}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Operational In-charges</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Overdue Matters</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>{kpiStats.overdueWork}</div>
          <div style={{ fontSize: '0.68rem', color: '#EF4444' }}>Requires Immediate Action</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Active Sections</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{kpiStats.activeSections}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Registrar Branches</div>
        </div>
      </div>

      {/* ─── PRIMARY TABS NAVIGATION ─── */}
      <div style={{ 
        display: 'flex', 
        gap: '0.4rem', 
        borderBottom: '2px solid #E2E8F0', 
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'DASHBOARD', label: '1. Office Dashboard' },
          { id: 'ORGANIZATION_TREE', label: '2. Hierarchy Tree' },
          { id: 'STAFF_ROSTER', label: `3. Staff Roster (${staffList.length})` },
          { id: 'SECTIONS', label: `4. Sections & Branches (${sections.length})` },
          { id: 'WORK_ALLOCATION', label: `5. Work Allocation & Matters (${workItems.length})` },
          { id: 'RESPONSIBILITIES', label: `6. Responsibility Master (${responsibilities.length})` },
          { id: 'AUDIT_LOGS', label: `7. Office Audit Trail (${auditLogs.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.id as OfficeTabType)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OFFICE DASHBOARD ─── */}
      {activeTab === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* What Needs My Attention? */}
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '12px', 
            border: '1px solid #E2E8F0', 
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={18} color="#F59E0B" /> REGISTRAR OFFICE — WHAT NEEDS MY ATTENTION?
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  Live administrative matters, overdue files, and escalated workflows requiring Registrar sign-off.
                </p>
              </div>
              <Badge variant="warning">{kpiStats.actionableExceptions} Actionable Items</Badge>
            </div>

            <div 
              className="dashboard-attention-cards-grid"
              style={{ '--action-count': 3 } as React.CSSProperties}
            >
              <div 
                style={{ padding: '0.85rem', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setActiveTab('WORK_ALLOCATION')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#991B1B' }}>Overdue Work Matters</strong>
                  <Badge variant="danger">{kpiStats.overdueWork}</Badge>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#7F1D1D', marginTop: '0.25rem' }}>
                  Files or statutory compliance tasks past scheduled target completion dates.
                </div>
              </div>

              <div 
                style={{ padding: '0.85rem', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setActiveTab('WORK_ALLOCATION')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#1E40AF' }}>Pending Scrutiny Matters</strong>
                  <Badge variant="navy">{kpiStats.pendingWork + kpiStats.inProgressWork}</Badge>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#1E3A8A', marginTop: '0.25rem' }}>
                  Active case files and council draft gazettes currently under section scrutiny.
                </div>
              </div>

              <div 
                style={{ padding: '0.85rem', backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setActiveTab('STAFF_ROSTER')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#92400E' }}>Office Staff Roster</strong>
                  <Badge variant="gold">{kpiStats.totalStaff}</Badge>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#78350F', marginTop: '0.25rem' }}>
                  Appointed officers across Academic, Exam, Affiliation, and Records Sections.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Work Items Table Preview */}
          <ExcelDataTable
            data={workItems.slice(0, 5)}
            columns={workColumns}
            title="Priority Registrar Office Matters"
            subtitle="Immediate statutory, academic, and administrative files assigned to officers."
            storageKey="reg_office_recent_matters"
            exportFilename="SSIU_Registrar_Recent_Matters"
            onRefresh={triggerRefresh}
          />
        </div>
      )}

      {/* ─── TAB 2: HIERARCHY TREE VIEW ─── */}
      {activeTab === 'ORGANIZATION_TREE' && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
            Office of the Registrar — Reporting Hierarchy
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1.5rem' }}>
            Strict hierarchical reporting line from Apex Registrar through Deputy Registrars, Assistant Registrars, Section Officers to Administrative Staff.
          </p>

          {/* Level 1: Registrar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#0B192C',
              color: '#FFFFFF',
              borderRadius: '10px',
              border: '2px solid #F37023',
              textAlign: 'center',
              width: '320px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <Badge variant="gold">APEX EXECUTIVE HEAD</Badge>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: '0.35rem', color: '#FFFFFF' }}>Dr. Sanjay Patel</h4>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Registrar • SSIU Central University</div>
            </div>

            <div style={{ width: '2px', height: '24px', backgroundColor: '#CBD5E1' }} />

            {/* Level 2: Deputy Registrars */}
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {staffList.filter(s => s.roleLevel === 'DEPUTY_REGISTRAR').map(dep => {
                const subStaff = staffList.filter(s => s.reportingToUserId === dep.userId);
                return (
                  <div 
                    key={dep.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '10px',
                      width: '280px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#1E3A8A' }}>{dep.name}</strong>
                      <Badge variant="navy">Deputy Registrar</Badge>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569' }}>{dep.sectionName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{subStaff.length} Direct Subordinates</div>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => { setSelectedStaffFor360(dep); setStaff360Tab('OVERVIEW'); }}
                      style={{ marginTop: '0.25rem' }}
                    >
                      View 360° Profile →
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ width: '2px', height: '24px', backgroundColor: '#CBD5E1' }} />

            {/* Level 3: Assistant Registrars & Section Officers */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {staffList.filter(s => s.roleLevel === 'ASSISTANT_REGISTRAR' || s.roleLevel === 'SECTION_OFFICER').map(mid => (
                <div 
                  key={mid.id}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    width: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: '#0B192C' }}>{mid.name}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#4338CA', fontWeight: 600 }}>{mid.positionTitle}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{mid.sectionName}</div>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => { setSelectedStaffFor360(mid); setStaff360Tab('OVERVIEW'); }}
                    style={{ marginTop: '0.25rem' }}
                  >
                    360° Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: STAFF ROSTER (EXCEL DATA TABLE) ─── */}
      {activeTab === 'STAFF_ROSTER' && (
        <ExcelDataTable
          data={staffList}
          columns={staffColumns}
          title={`Registrar Office Staff Roster (${staffList.length})`}
          subtitle="Distinguished administrative personnel assigned exclusively to the Office of the Registrar."
          storageKey="reg_office_staff_roster"
          searchPlaceholder="Search officer by name, employee ID, position, or section..."
          searchFields={['name', 'employeeId', 'positionTitle', 'sectionName', 'email']}
          exportFilename="SSIU_Registrar_Office_Staff_Roster"
          onRefresh={triggerRefresh}
        />
      )}

      {/* ─── TAB 4: SECTIONS & BRANCHES ─── */}
      {activeTab === 'SECTIONS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {sections.map(sec => {
            const secStaff = staffList.filter(s => s.sectionId === sec.id);
            const secWork = workItems.filter(w => w.sectionId === sec.id && w.status !== 'COMPLETED');

            return (
              <div 
                key={sec.id}
                className="card"
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #2563EB' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <code style={{ fontSize: '0.7rem', color: '#F37023', fontWeight: 800 }}>{sec.sectionCode}</code>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: '0.15rem 0 0 0' }}>
                      {sec.sectionName}
                    </h4>
                  </div>
                  <Badge variant="active">ACTIVE</Badge>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                  {sec.description || 'Statutory administrative branch under Office of the Registrar.'}
                </p>

                <div style={{ fontSize: '0.75rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  Section Head: <strong>{sec.sectionHeadName || 'Dr. Rajiv Mehta (Deputy Registrar)'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {secStaff.length} Staff • <strong>{secWork.length} Active Matters</strong>
                  </span>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => { setActiveTab('WORK_ALLOCATION'); }}
                  >
                    View Matters →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── TAB 5: WORK ALLOCATION & MATTERS (EXCEL DATA TABLE) ─── */}
      {activeTab === 'WORK_ALLOCATION' && (
        <ExcelDataTable
          data={workItems}
          columns={workColumns}
          title={`Registrar Office Work & Matters Register (${workItems.length})`}
          subtitle="Complete lifecycle of files, tasks, statutory applications, and correspondence assigned to officers."
          storageKey="reg_office_work_register"
          searchPlaceholder="Search matters by number, title, section, or assigned officer..."
          searchFields={['workNumber', 'title', 'sectionName', 'assignedToName']}
          exportFilename="SSIU_Registrar_Office_Work_Matters"
          onRefresh={triggerRefresh}
        />
      )}

      {/* ─── TAB 6: RESPONSIBILITIES MASTER ─── */}
      {activeTab === 'RESPONSIBILITIES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Central Responsibility Master & Active Assignments
            </h3>
            <button
              onClick={() => setIsAssignRespModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Assign Responsibility to Staff
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {responsibilities.map(resp => {
              const assignedCount = assignments.filter(a => a.responsibilityId === resp.id && a.status === 'ACTIVE').length;
              return (
                <div key={resp.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <code style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB' }}>{resp.code}</code>
                    <Badge variant="navy">{resp.category}</Badge>
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: '#0B192C' }}>{resp.title}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{resp.description}</div>
                  <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '0.35rem', fontWeight: 600 }}>
                    Assigned to {assignedCount} Officer(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 7: AUDIT LOGS ─── */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
            Registrar Office Statutory Audit Log
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {auditLogs.map(log => (
              <div 
                key={log.id} 
                style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#F8FAFC', 
                  borderRadius: '6px', 
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <strong style={{ color: '#0B192C' }}>{log.action}</strong>
                  <div style={{ color: '#64748B' }}>{log.details}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4338CA' }}>By: {log.performedByName}</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{log.timestamp.slice(0, 19).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: EMPLOYEE 360° PROFILE ─── */}
      {selectedStaffFor360 && (() => {
        const s = selectedStaffFor360;
        const staffAssignments = assignments.filter(a => a.staffId === s.id || a.userId === s.userId);
        const staffWork = workItems.filter(w => w.assignedToStaffId === s.id || w.assignedToUserId === s.userId);
        const subordinates = staffList.filter(sub => sub.reportingToUserId === s.userId);

        return (
          <Modal
            isOpen={Boolean(selectedStaffFor360)}
            onClose={() => setSelectedStaffFor360(null)}
            title={`Registrar Officer Dossier: ${s.name} (${s.employeeId})`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '650px' }}>
              {/* Profile Header */}
              <div style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#0B192C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}>
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                      {s.name}
                    </h3>
                    <code style={{ fontWeight: 800, color: '#F37023' }}>{s.employeeId}</code>
                    <Badge variant="navy">{s.positionTitle}</Badge>
                    <Badge variant="active">{s.employmentStatus}</Badge>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                    Section: <strong>{s.sectionName}</strong> • Room: <strong>{s.roomNumber || 'Central Admin'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                    Reports To: <strong style={{ color: '#2563EB' }}>{s.reportingToName || 'Dr. Sanjay Patel (Registrar)'}</strong> • Email: <strong>{s.email}</strong> • Phone: <strong>{s.phone}</strong>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.4rem' }}>
                {[
                  { id: 'OVERVIEW', label: '1. Overview' },
                  { id: 'RESPONSIBILITIES', label: `2. Responsibilities (${staffAssignments.length})` },
                  { id: 'WORK', label: `3. Assigned Matters (${staffWork.length})` },
                  { id: 'PERFORMANCE', label: '4. Performance' },
                  { id: 'SUBORDINATES', label: `5. Direct Reports (${subordinates.length})` }
                ].map(t => (
                  <button
                    key={t.id}
                    className={`btn btn-xs ${staff360Tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStaff360Tab(t.id as any)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content: OVERVIEW */}
              {staff360Tab === 'OVERVIEW' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>Official Information</h4>
                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#475569' }}>
                      <div>Qualifications: <strong>{s.qualifications || 'Graduate / Post Graduate'}</strong></div>
                      <div>Role Level: <strong>{s.roleLevel}</strong></div>
                      <div>Joining Date: <strong>{s.joiningDate}</strong></div>
                      <div>Office Unit: <strong>Office of the Registrar (Central)</strong></div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>Workload Snapshot</h4>
                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#475569' }}>
                      <div>Assigned Responsibilities: <strong>{staffAssignments.length}</strong></div>
                      <div>Active Pending Matters: <strong style={{ color: '#2563EB' }}>{staffWork.filter(w => w.status !== 'COMPLETED').length}</strong></div>
                      <div>Completed Matters: <strong>{staffWork.filter(w => w.status === 'COMPLETED').length}</strong></div>
                      <div>Subordinates Supervised: <strong>{subordinates.length} Officers</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: RESPONSIBILITIES */}
              {staff360Tab === 'RESPONSIBILITIES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {staffAssignments.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No official responsibilities currently assigned.
                    </div>
                  ) : (
                    staffAssignments.map((a, aIdx) => (
                      <div key={aIdx} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0B192C' }}>{a.responsibilityTitle}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Assigned By: {a.assignedByName} • Date: {a.assignedDate}</div>
                        </div>
                        <Badge variant="navy">{a.priority}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: WORK */}
              {staff360Tab === 'WORK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {staffWork.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No active files or matters assigned.
                    </div>
                  ) : (
                    staffWork.map(w => (
                      <div key={w.id} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <code style={{ fontSize: '0.72rem', color: '#F37023', fontWeight: 800 }}>{w.workNumber}</code>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B192C' }}>{w.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Due Date: {w.dueDate}</div>
                        </div>
                        <Badge variant={w.status === 'COMPLETED' ? 'success' : w.status === 'OVERDUE' ? 'danger' : 'warning'}>{w.status}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: PERFORMANCE */}
              {staff360Tab === 'PERFORMANCE' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>Matter Resolution Rate</h4>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Total Matters Handled: <strong>{staffWork.length}</strong> • Completed: <strong>{staffWork.filter(w => w.status === 'COMPLETED').length}</strong>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>Attendance & Availability</h4>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Status: <Badge variant="active">PRESENT ON CAMPUS</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: SUBORDINATES */}
              {staff360Tab === 'SUBORDINATES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {subordinates.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No direct subordinates report to this officer.
                    </div>
                  ) : (
                    subordinates.map(sub => (
                      <div key={sub.id} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0B192C' }}>{sub.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{sub.positionTitle} • {sub.sectionName}</div>
                        </div>
                        <Badge variant="navy">{sub.roleLevel}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ─── MODAL 2: APPOINT STAFF ─── */}
      {isAppointModalOpen && (
        <Modal
          isOpen={isAppointModalOpen}
          onClose={() => setIsAppointModalOpen(false)}
          title="Appoint New Officer / Staff to Registrar Office"
        >
          <form onSubmit={handleAppointStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '500px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh K. Varma"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh.varma@swarrnim.edu.in"
                  value={newStaffEmail}
                  onChange={e => setNewStaffEmail(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="9825012345"
                  value={newStaffPhone}
                  onChange={e => setNewStaffPhone(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Qualifications</label>
                <input
                  type="text"
                  placeholder="M.B.A., B.Tech"
                  value={newStaffQualifications}
                  onChange={e => setNewStaffQualifications(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Assigned Section *</label>
                <select
                  value={newStaffSectionId}
                  onChange={e => setNewStaffSectionId(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.sectionName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Position / Designation *</label>
                <select
                  value={newStaffPositionId}
                  onChange={e => setNewStaffPositionId(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                >
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.positionTitle} ({pos.roleLevel})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Reporting Authority *</label>
              <select
                value={newStaffReportingUserId}
                onChange={e => setNewStaffReportingUserId(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              >
                {staffList.filter(s => s.roleLevel === 'REGISTRAR' || s.roleLevel === 'DEPUTY_REGISTRAR' || s.roleLevel === 'ASSISTANT_REGISTRAR' || s.roleLevel === 'SECTION_OFFICER').map(s => (
                  <option key={s.id} value={s.userId}>{s.name} ({s.positionTitle})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAppointModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Confirm Statutory Appointment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 3: ASSIGN WORK / MATTER ─── */}
      {isAssignWorkModalOpen && (
        <Modal
          isOpen={isAssignWorkModalOpen}
          onClose={() => setIsAssignWorkModalOpen(false)}
          title="Assign Official Work / Matter to Officer"
        >
          <form onSubmit={handleAssignWork} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '500px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Matter Subject / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Scrutinize BoS Resolution for Faculty of Pharmacy"
                value={workTitle}
                onChange={e => setWorkTitle(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Detailed Description / Directives</label>
              <textarea
                rows={3}
                placeholder="Specific instructions, statutory rules, or references..."
                value={workDescription}
                onChange={e => setWorkDescription(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Matter Type</label>
                <select
                  value={workType}
                  onChange={e => setWorkType(e.target.value as any)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="TASK">Task</option>
                  <option value="FILE">File Movement</option>
                  <option value="APPLICATION">Application</option>
                  <option value="CASE">Case Scrutiny</option>
                  <option value="CORRESPONDENCE">Correspondence</option>
                  <option value="APPROVAL">Statutory Approval</option>
                  <option value="ACADEMIC_MATTER">Academic Matter</option>
                  <option value="STATUTORY_COMPLIANCE">Statutory Compliance</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Priority</label>
                <select
                  value={workPriority}
                  onChange={e => setWorkPriority(e.target.value as any)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent (Immediate)</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Assigned Section *</label>
                <select
                  value={workSectionId}
                  onChange={e => setWorkSectionId(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.sectionName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Assign To Officer *</label>
                <select
                  value={workAssignedToStaffId}
                  onChange={e => setWorkAssignedToStaffId(e.target.value)}
                  className="input input-sm w-full"
                  style={{ marginTop: '0.25rem' }}
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.positionTitle})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Target Due Date *</label>
              <input
                type="date"
                required
                value={workDueDate}
                onChange={e => setWorkDueDate(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAssignWorkModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Assign Work Matter
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 4: ASSIGN RESPONSIBILITY ─── */}
      {isAssignRespModalOpen && (
        <Modal
          isOpen={isAssignRespModalOpen}
          onClose={() => setIsAssignRespModalOpen(false)}
          title="Assign Responsibility from Master"
        >
          <form onSubmit={handleAssignResponsibility} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '450px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Select Officer / Staff *</label>
              <select
                value={respStaffId}
                onChange={e => setRespStaffId(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.positionTitle})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Responsibility *</label>
              <select
                value={respId}
                onChange={e => setRespId(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              >
                {responsibilities.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Priority</label>
              <select
                value={respPriority}
                onChange={e => setRespPriority(e.target.value as any)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Remarks / Scope</label>
              <textarea
                rows={2}
                placeholder="Specific scope notes..."
                value={respRemarks}
                onChange={e => setRespRemarks(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAssignRespModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Confirm Responsibility Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 5: REASSIGN REPORTING AUTHORITY ─── */}
      {isReassignReportingModalOpen && targetStaffToReassign && (
        <Modal
          isOpen={isReassignReportingModalOpen}
          onClose={() => setIsReassignReportingModalOpen(false)}
          title={`Reassign Reporting Authority for ${targetStaffToReassign.name}`}
        >
          <form onSubmit={handleReassignReporting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '450px' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
              Current Reporting Authority: <strong>{targetStaffToReassign.reportingToName || 'Dr. Sanjay Patel (Registrar)'}</strong>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Select New Reporting Authority *</label>
              <select
                value={newReportingUserId}
                onChange={e => setNewReportingUserId(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              >
                {staffList.filter(s => s.id !== targetStaffToReassign.id).map(s => (
                  <option key={s.id} value={s.userId}>{s.name} ({s.positionTitle})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsReassignReportingModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Update Reporting Hierarchy
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 6: UPDATE WORK STATUS ─── */}
      {selectedWorkForStatus && (
        <Modal
          isOpen={Boolean(selectedWorkForStatus)}
          onClose={() => setSelectedWorkForStatus(null)}
          title={`Update Matter Status: ${selectedWorkForStatus.workNumber}`}
        >
          <form onSubmit={handleUpdateWorkStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '450px' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#0B192C' }}>{selectedWorkForStatus.title}</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Assigned To: {selectedWorkForStatus.assignedToName}</div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>New Status *</label>
              <select
                value={workNewStatus}
                onChange={e => setWorkNewStatus(e.target.value as any)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed (Resolved)</option>
                <option value="RETURNED">Returned for Clarification</option>
                <option value="REJECTED">Rejected</option>
                <option value="ESCALATED">Escalated to Registrar</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Action Notes / Remarks</label>
              <textarea
                rows={3}
                placeholder="Enter action notes or justification..."
                value={workStatusNotes}
                onChange={e => setWorkStatusNotes(e.target.value)}
                className="input input-sm w-full"
                style={{ marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedWorkForStatus(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Status Update
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
