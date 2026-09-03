import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  deputyRegistrarScopeService, 
  DeputyRegistrarScopeSummaryKPIs,
  ScopeFilterParams,
  ScopeConflictResult
} from '../../services/deputyRegistrarScopeService';
import { 
  DeputyRegistrarScopeMapping, 
  DeputyRegistrarScopeAudit, 
  DeputyRegistrarScopeLevel, 
  DeputyRegistrarScopeStatus,
  User 
} from '../../types';
import { 
  ShieldCheck, Plus, RefreshCw, Printer, Download, 
  Search, Filter, Edit2, ArrowRightLeft, AlertTriangle, 
  CheckCircle2, XCircle, RotateCcw, History, Eye, 
  Building2, Layers, Users, UserCheck, AlertCircle, Sparkles
} from 'lucide-react';

export const RegistrarDeputyScopeManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'INACTIVE'>('ALL');
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState<boolean>(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isViewDossierModalOpen, setIsViewDossierModalOpen] = useState<boolean>(false);
  const [isPrintRegisterModalOpen, setIsPrintRegisterModalOpen] = useState<boolean>(false);

  // Selected records for modals
  const [selectedScope, setSelectedScope] = useState<DeputyRegistrarScopeMapping | null>(null);

  // Form states for Assign / Edit
  const [formUserId, setFormUserId] = useState<string>('');
  const [formInstId, setFormInstId] = useState<string>('');
  const [formDeptIds, setFormDeptIds] = useState<string[]>([]);
  const [formScopeLevel, setFormScopeLevel] = useState<DeputyRegistrarScopeLevel>('MULTI_DEPARTMENT');
  const [formEffectiveFrom, setFormEffectiveFrom] = useState<string>('');
  const [formEffectiveTo, setFormEffectiveTo] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');

  // Form states for Transfer
  const [transferFromUserId, setTransferFromUserId] = useState<string>('');
  const [transferToUserId, setTransferToUserId] = useState<string>('');
  const [transferInstId, setTransferInstId] = useState<string>('');
  const [transferDeptIds, setTransferDeptIds] = useState<string[]>([]);
  const [transferReason, setTransferReason] = useState<string>('');

  // Form states for Revoke / Suspend
  const [revokeActionStatus, setRevokeActionStatus] = useState<'REVOKED' | 'SUSPENDED'>('SUSPENDED');
  const [revokeReason, setRevokeReason] = useState<string>('');

  // Form states for Reactivate
  const [reactivateEffectiveFrom, setReactivateEffectiveFrom] = useState<string>('');
  const [reactivateReason, setReactivateReason] = useState<string>('');

  // Master lists
  const institutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const departments = useMemo(() => db.getDepartments(), [refreshKey]);
  const deputyRegistrars = useMemo(() => deputyRegistrarScopeService.getDeputyRegistrarsList(), [refreshKey]);

  // Active filter params
  const filterParams: ScopeFilterParams = useMemo(() => ({
    status: activeStatusTab,
    instituteId: selectedInstFilter,
    searchQuery
  }), [activeStatusTab, selectedInstFilter, searchQuery]);

  // Queries
  const assignments = useMemo(() => {
    return deputyRegistrarScopeService.getDeputyRegistrarAssignments(filterParams);
  }, [filterParams, refreshKey]);

  const summaryKPIs = useMemo(() => {
    return deputyRegistrarScopeService.getSummaryKPIs();
  }, [refreshKey]);

  const auditHistory = useMemo(() => {
    return deputyRegistrarScopeService.getAuditHistory();
  }, [refreshKey]);

  // Available departments for selected institute in form
  const availableFormDepartments = useMemo(() => {
    if (!formInstId) return [];
    return departments.filter(d => d.instituteId === formInstId);
  }, [formInstId, departments]);

  const availableTransferDepartments = useMemo(() => {
    if (!transferInstId || !transferFromUserId) return [];
    const fromScope = assignments.find(s => s.userId === transferFromUserId && s.instituteId === transferInstId && s.status === 'ACTIVE');
    if (!fromScope) return [];
    return departments.filter(d => fromScope.departmentIds.includes(d.id));
  }, [transferInstId, transferFromUserId, assignments, departments]);

  // Conflict Check
  const scopeConflict = useMemo(() => {
    if (!formUserId || !formInstId || formDeptIds.length === 0) {
      return { hasConflict: false, conflictingDetails: [] };
    }
    return deputyRegistrarScopeService.checkScopeConflicts({
      targetUserId: formUserId,
      instituteId: formInstId,
      departmentIds: formDeptIds,
      excludeScopeId: selectedScope?.id
    });
  }, [formUserId, formInstId, formDeptIds, selectedScope]);

  // Actions
  const handleOpenAssignModal = () => {
    setSelectedScope(null);
    setFormUserId(deputyRegistrars[0]?.id || '');
    setFormInstId(institutes[0]?.id || '');
    setFormDeptIds([]);
    setFormScopeLevel('MULTI_DEPARTMENT');
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
    setFormEffectiveTo('');
    setFormReason('');
    setIsAssignModalOpen(true);
  };

  const handleOpenEditModal = (scope: DeputyRegistrarScopeMapping) => {
    setSelectedScope(scope);
    setFormUserId(scope.userId);
    setFormInstId(scope.instituteId);
    setFormDeptIds([...(scope.departmentIds || [])]);
    setFormScopeLevel(scope.scopeLevel || 'MULTI_DEPARTMENT');
    setFormEffectiveFrom(scope.effectiveFrom || new Date().toISOString().split('T')[0]);
    setFormEffectiveTo(scope.effectiveTo || '');
    setFormReason('');
    setIsEditModalOpen(true);
  };

  const handleOpenTransferModal = (scope: DeputyRegistrarScopeMapping) => {
    setSelectedScope(scope);
    setTransferFromUserId(scope.userId);
    const otherDRs = deputyRegistrars.filter(u => u.id !== scope.userId);
    setTransferToUserId(otherDRs[0]?.id || '');
    setTransferInstId(scope.instituteId);
    setTransferDeptIds([...(scope.departmentIds || [])]);
    setTransferReason('');
    setIsTransferModalOpen(true);
  };

  const handleOpenRevokeModal = (scope: DeputyRegistrarScopeMapping) => {
    setSelectedScope(scope);
    setRevokeActionStatus('SUSPENDED');
    setRevokeReason('');
    setIsRevokeModalOpen(true);
  };

  const handleOpenReactivateModal = (scope: DeputyRegistrarScopeMapping) => {
    setSelectedScope(scope);
    setReactivateEffectiveFrom(new Date().toISOString().split('T')[0]);
    setReactivateReason('');
    setIsReactivateModalOpen(true);
  };

  const handleSaveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      deputyRegistrarScopeService.createAssignment({
        userId: formUserId,
        instituteId: formInstId,
        departmentIds: formDeptIds,
        scopeLevel: formScopeLevel,
        effectiveFrom: formEffectiveFrom,
        effectiveTo: formEffectiveTo || undefined,
        reason: formReason
      }, currentUser);
      setIsAssignModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedScope) return;
    try {
      deputyRegistrarScopeService.updateAssignment(selectedScope.id, {
        instituteId: formInstId,
        departmentIds: formDeptIds,
        scopeLevel: formScopeLevel,
        effectiveFrom: formEffectiveFrom,
        effectiveTo: formEffectiveTo || undefined,
        reason: formReason
      }, currentUser);
      setIsEditModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment.');
    }
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (transferDeptIds.length === 0) {
      alert('Please select at least one department to transfer.');
      return;
    }
    try {
      deputyRegistrarScopeService.transferScope({
        fromUserId: transferFromUserId,
        toUserId: transferToUserId,
        instituteId: transferInstId,
        departmentIds: transferDeptIds,
        reason: transferReason
      }, currentUser);
      setIsTransferModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to transfer scope.');
    }
  };

  const handleSaveRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedScope) return;
    try {
      deputyRegistrarScopeService.revokeScope(selectedScope.id, revokeReason, revokeActionStatus, currentUser);
      setIsRevokeModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke scope.');
    }
  };

  const handleSaveReactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedScope) return;
    try {
      deputyRegistrarScopeService.reactivateScope(selectedScope.id, reactivateReason, reactivateEffectiveFrom, currentUser);
      setIsReactivateModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate scope.');
    }
  };

  const handleExport = (format: 'XLSX' | 'CSV') => {
    deputyRegistrarScopeService.exportRoster(filterParams, format);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & TOP ACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(11,25,44,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.4rem', background: 'rgba(243,112,35,0.2)', borderRadius: '8px', border: '1px solid #F37023' }}>
                <ShieldCheck size={22} color="#F37023" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.4px', color: '#FFFFFF' }}>
                Deputy Registrar Jurisdiction & Delegation
              </h1>
              <Badge variant="active">Registrar Office Governance</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: '0.35rem 0 0 0', maxWidth: '750px' }}>
              Manage institutional and departmental responsibilities delegated under the Office of the Registrar with full audit traceability and conflict prevention.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenAssignModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F37023', borderColor: '#F37023' }}
            >
              <Plus size={14} /> + Assign Deputy Registrar
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('XLSX')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} color="#10B981" /> Export Excel
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsPrintRegisterModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print Roster
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAuditModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <History size={14} /> Delegation Audit
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Sync DB
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. SUMMARY CARDS (6 LIVE ERP-QUERY DRIVEN METRICS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.65rem'
      }}>
        {/* 1. Active Deputy Registrars */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0B192C' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active DRs</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{summaryKPIs.activeDeputyRegistrars}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Assigned Officers</div>
        </div>

        {/* 2. Assigned Institutes */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Assigned Institutes</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{summaryKPIs.assignedInstitutes}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Under Jurisdiction</div>
        </div>

        {/* 3. Assigned Departments */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0284C7' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Assigned Depts</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{summaryKPIs.assignedDepartments}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Covered Departments</div>
        </div>

        {/* 4. Unassigned Institutes */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Unassigned Inst.</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>{summaryKPIs.unassignedInstitutes}</div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Direct Registrar Scope</div>
        </div>

        {/* 5. Unassigned Departments */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Unassigned Depts</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>{summaryKPIs.unassignedDepartments}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Direct Oversight</div>
        </div>

        {/* 6. Recent Changes */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Recent Changes</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>{summaryKPIs.recentChangesCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Audit Event Log</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. FILTER BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'INACTIVE'] as const).map(tab => (
            <button
              key={tab}
              className={`btn btn-xs ${activeStatusTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveStatusTab(tab)}
            >
              {tab === 'ALL' ? 'All Assignments' : tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Filter by Institute</label>
            <select
              value={selectedInstFilter}
              onChange={(e) => setSelectedInstFilter(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Institutes</option>
              {institutes.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Search Directory</label>
            <div style={{ position: 'relative', marginTop: '2px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Deputy Registrar, Emp ID, Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.6rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. MANAGEMENT DIRECTORY TABLE
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Deputy Registrar Scope Delegation Register ({assignments.length} Jurisdictions)
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Controlled directly by the Office of the Registrar</span>
          </div>
          <Badge variant="navy">{assignments.length} Active Records</Badge>
        </div>

        {assignments.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px' }}>
            <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>No Jurisdictional Scopes Found</h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.35rem auto 0.75rem auto' }}>
              Click "+ Assign Deputy Registrar" above to delegate institutional responsibilities.
            </p>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAssignModal}>
              + Assign Deputy Registrar
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Deputy Registrar</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Emp ID</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Assigned Institute</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Assigned Department(s)</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Scope Level</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Effective</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((scope, idx) => (
                  <tr key={scope.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    
                    {/* Deputy Registrar Profile */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ fontWeight: 800, color: '#0B192C' }}>{scope.userName}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{scope.userEmail}</div>
                    </td>

                    {/* Emp ID */}
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023' }}>
                      {scope.employeeId}
                    </td>

                    {/* Institute */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#0B192C' }}>{scope.instituteName}</div>
                      <Badge variant="navy" className="text-[10px]">{scope.instituteCode}</Badge>
                    </td>

                    {/* Departments */}
                    <td style={{ padding: '0.65rem 0.8rem', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(scope.departmentNames || []).map((dName, dIdx) => (
                          <span
                            key={dIdx}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              border: '1px solid #BFDBFE'
                            }}
                          >
                            {dName}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Scope Level */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="navy">{scope.scopeLevel}</Badge>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={scope.status === 'ACTIVE' ? 'active' : (scope.status === 'SUSPENDED' ? 'warning' : 'danger')}>
                        {scope.status}
                      </Badge>
                    </td>

                    {/* Effective Date */}
                    <td style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#64748B' }}>
                      {scope.effectiveFrom}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            setSelectedScope(scope);
                            setIsViewDossierModalOpen(true);
                          }}
                          title="View Dossier"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleOpenEditModal(scope)}
                          title="Edit Scope"
                        >
                          Edit
                        </button>
                        {scope.status === 'ACTIVE' && (
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenTransferModal(scope)}
                            title="Transfer Scope"
                          >
                            Transfer
                          </button>
                        )}
                        {scope.status === 'ACTIVE' ? (
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleOpenRevokeModal(scope)}
                            title="Revoke / Suspend"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleOpenReactivateModal(scope)}
                            title="Reactivate Scope"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. MODAL: ASSIGN NEW SCOPE
      ══════════════════════════════════════════════════════════════════════ */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Deputy Registrar Jurisdiction"
          maxWidth="640px"
        >
          <form onSubmit={handleSaveAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            {/* Step 1: Select Deputy Registrar */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Select Deputy Registrar *</label>
              <select
                required
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              >
                {deputyRegistrars.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Scope Level */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Scope Delegation Level</label>
              <select
                value={formScopeLevel}
                onChange={(e) => setFormScopeLevel(e.target.value as any)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              >
                <option value="INSTITUTE">Institute-Wide Jurisdiction</option>
                <option value="MULTI_DEPARTMENT">Multi-Departmental Jurisdiction</option>
                <option value="DEPARTMENT">Single Department Jurisdiction</option>
              </select>
            </div>

            {/* Step 3: Select Institute */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Target Institute *</label>
              <select
                required
                value={formInstId}
                onChange={(e) => {
                  setFormInstId(e.target.value);
                  setFormDeptIds([]);
                }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              >
                {institutes.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                ))}
              </select>
            </div>

            {/* Step 4: Select Departments */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Select Delegated Departments</label>
                <button
                  type="button"
                  onClick={() => {
                    if (formDeptIds.length === availableFormDepartments.length) {
                      setFormDeptIds([]);
                    } else {
                      setFormDeptIds(availableFormDepartments.map(d => d.id));
                    }
                  }}
                  className="btn btn-secondary btn-xs"
                >
                  {formDeptIds.length === availableFormDepartments.length ? 'Deselect All' : 'Select All Departments'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', marginTop: '0.4rem', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {availableFormDepartments.map(dept => {
                  const isChecked = formDeptIds.includes(dept.id);
                  return (
                    <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setFormDeptIds(formDeptIds.filter(id => id !== dept.id));
                          } else {
                            setFormDeptIds([...formDeptIds, dept.id]);
                          }
                        }}
                      />
                      <span>{dept.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Conflict Warning Box if any */}
            {scopeConflict.hasConflict && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 800, fontSize: '0.8rem' }}>
                  <AlertTriangle size={16} /> Overlapping Jurisdiction Conflict Detected
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '0.25rem' }}>
                  {scopeConflict.conflictingDetails.map((c, i) => (
                    <div key={i}>• <strong>{c.departmentName}</strong> is already assigned to <strong>{c.assignedToUserName}</strong>.</div>
                  ))}
                  <span style={{ display: 'block', marginTop: '0.25rem', fontWeight: 700 }}>
                    Please use the "Transfer Scope" workflow if you wish to reassign these departments.
                  </span>
                </div>
              </div>
            )}

            {/* Step 5: Effective Dates & Reason */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Effective From *</label>
                <input
                  type="date"
                  required
                  value={formEffectiveFrom}
                  onChange={(e) => setFormEffectiveFrom(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Effective To (Optional)</label>
                <input
                  type="date"
                  value={formEffectiveTo}
                  onChange={(e) => setFormEffectiveTo(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Delegation Order Reference / Reason</label>
              <input
                type="text"
                placeholder="e.g. Registrar Order No. SSIU/REG/2026/042"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            {/* Confirmation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ background: '#F37023', borderColor: '#F37023' }}
              >
                Save Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          6. MODAL: EDIT SCOPE
      ══════════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedScope && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Scope: ${selectedScope.userName}`}
          maxWidth="640px"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div>Deputy Registrar: <strong>{selectedScope.userName}</strong> ({selectedScope.employeeId})</div>
              <div>Current Institute: <strong>{selectedScope.instituteName}</strong></div>
            </div>

            {/* Departments */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Modify Delegated Departments</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', marginTop: '0.4rem', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {availableFormDepartments.map(dept => {
                  const isChecked = formDeptIds.includes(dept.id);
                  return (
                    <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setFormDeptIds(formDeptIds.filter(id => id !== dept.id));
                          } else {
                            setFormDeptIds([...formDeptIds, dept.id]);
                          }
                        }}
                      />
                      <span>{dept.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scope Change Summary (OLD vs NEW) */}
            <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
              <strong style={{ color: '#0B192C', display: 'block', marginBottom: '4px' }}>Scope Change Summary</strong>
              <div style={{ color: '#64748B' }}>OLD: {(selectedScope.departmentNames || []).join(', ') || 'None'}</div>
              <div style={{ color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
                NEW: {formDeptIds.map(dId => departments.find(d => d.id === dId)?.name).join(', ') || 'None'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Reason for Modification</label>
              <input
                type="text"
                required
                placeholder="Enter justification for scope modification..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Confirm Scope Change
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. MODAL: TRANSFER JURISDICTION WORKFLOW
      ══════════════════════════════════════════════════════════════════════ */}
      {isTransferModalOpen && selectedScope && (
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Transfer Jurisdiction Between Deputy Registrars"
          maxWidth="640px"
        >
          <form onSubmit={handleSaveTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#92400E' }}>
              <AlertTriangle size={15} style={{ display: 'inline', marginRight: '4px' }} />
              <strong>Warning:</strong> This action will remove the selected jurisdiction from <strong>{selectedScope.userName}</strong> and assign it to the selected recipient. Historical audit entries will be permanently preserved.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Transfer FROM (Current Holder)</label>
                <input
                  type="text"
                  disabled
                  value={selectedScope.userName}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8125rem', background: '#F1F5F9', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Transfer TO (New Holder) *</label>
                <select
                  required
                  value={transferToUserId}
                  onChange={(e) => setTransferToUserId(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
                >
                  {deputyRegistrars.filter(u => u.id !== selectedScope.userId).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Departments to Transfer */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Select Department(s) to Transfer</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem', marginTop: '0.4rem', padding: '0.5rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {availableTransferDepartments.map(dept => {
                  const isChecked = transferDeptIds.includes(dept.id);
                  return (
                    <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTransferDeptIds(transferDeptIds.filter(id => id !== dept.id));
                          } else {
                            setTransferDeptIds([...transferDeptIds, dept.id]);
                          }
                        }}
                      />
                      <span>{dept.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Transfer Order / Administrative Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Administrative restructuring and decentralization order..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsTransferModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#F37023', borderColor: '#F37023' }}>
                Confirm Transfer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          8. MODAL: REVOKE / SUSPEND SCOPE
      ══════════════════════════════════════════════════════════════════════ */}
      {isRevokeModalOpen && selectedScope && (
        <Modal
          isOpen={isRevokeModalOpen}
          onClose={() => setIsRevokeModalOpen(false)}
          title={`Revoke / Suspend Delegation: ${selectedScope.userName}`}
          maxWidth="560px"
        >
          <form onSubmit={handleSaveRevoke} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div>Deputy Registrar: <strong>{selectedScope.userName}</strong></div>
              <div>Institute: <strong>{selectedScope.instituteName}</strong></div>
              <div>Departments: <strong>{(selectedScope.departmentNames || []).join(', ')}</strong></div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Select Revocation Action</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setRevokeActionStatus('SUSPENDED')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: revokeActionStatus === 'SUSPENDED' ? '#F59E0B' : '#FFFFFF',
                    color: revokeActionStatus === 'SUSPENDED' ? '#FFFFFF' : '#0B192C',
                    border: '1px solid #F59E0B'
                  }}
                >
                  Temporary Suspension
                </button>
                <button
                  type="button"
                  onClick={() => setRevokeActionStatus('REVOKED')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: revokeActionStatus === 'REVOKED' ? '#EF4444' : '#FFFFFF',
                    color: revokeActionStatus === 'REVOKED' ? '#FFFFFF' : '#0B192C',
                    border: '1px solid #EF4444'
                  }}
                >
                  Permanent Revocation
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Mandatory Justification Reason *</label>
              <textarea
                required
                placeholder="Enter official reason for revoking/suspending this delegation..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                style={{ width: '100%', minHeight: '70px', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRevokeModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger btn-sm">
                Confirm {revokeActionStatus === 'SUSPENDED' ? 'Suspension' : 'Revocation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          9. MODAL: REACTIVATE SCOPE
      ══════════════════════════════════════════════════════════════════════ */}
      {isReactivateModalOpen && selectedScope && (
        <Modal
          isOpen={isReactivateModalOpen}
          onClose={() => setIsReactivateModalOpen(false)}
          title={`Reactivate Jurisdiction: ${selectedScope.userName}`}
          maxWidth="560px"
        >
          <form onSubmit={handleSaveReactivate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div>Deputy Registrar: <strong>{selectedScope.userName}</strong></div>
              <div>Institute: <strong>{selectedScope.instituteName}</strong></div>
              <div>Departments: <strong>{(selectedScope.departmentNames || []).join(', ')}</strong></div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Effective From *</label>
              <input
                type="date"
                required
                value={reactivateEffectiveFrom}
                onChange={(e) => setReactivateEffectiveFrom(e.target.value)}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Reactivation Reason / Order Ref</label>
              <input
                type="text"
                placeholder="e.g. Reinstatement upon completion of administrative review"
                value={reactivateReason}
                onChange={(e) => setReactivateReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsReactivateModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Confirm Reactivation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          10. MODAL: VIEW DOSSIER
      ══════════════════════════════════════════════════════════════════════ */}
      {isViewDossierModalOpen && selectedScope && (
        <Modal
          isOpen={isViewDossierModalOpen}
          onClose={() => setIsViewDossierModalOpen(false)}
          title={`Deputy Registrar Profile Dossier: ${selectedScope.userName}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            <div style={{ background: '#0B192C', color: '#FFFFFF', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{selectedScope.userName}</h3>
                <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '2px' }}>
                  {selectedScope.designation} • {selectedScope.employeeId} • {selectedScope.userEmail}
                </div>
              </div>
              <Badge variant={selectedScope.status === 'ACTIVE' ? 'active' : (selectedScope.status === 'SUSPENDED' ? 'warning' : 'danger')}>
                {selectedScope.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Assigned Institute</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginTop: '2px' }}>{selectedScope.instituteName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Code: {selectedScope.instituteCode}</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Scope Delegation Level</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginTop: '2px' }}>{selectedScope.scopeLevel}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Effective: {selectedScope.effectiveFrom}</div>
              </div>
            </div>

            {/* Departments */}
            <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <strong style={{ fontSize: '0.8125rem', color: '#0B192C', display: 'block', marginBottom: '6px' }}>
                Covered Academic Departments ({(selectedScope.departmentNames || []).length})
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(selectedScope.departmentNames || []).map((dName, idx) => (
                  <span key={idx} style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {dName}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsViewDossierModalOpen(false)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          11. MODAL: DELEGATION AUDIT TRAIL
      ══════════════════════════════════════════════════════════════════════ */}
      {isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Deputy Registrar Delegation Audit Trail"
          maxWidth="900px"
        >
          <div style={{ padding: '0.5rem' }}>
            <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Date & Time</th>
                    <th style={{ padding: '6px 8px' }}>Action</th>
                    <th style={{ padding: '6px 8px' }}>Deputy Registrar</th>
                    <th style={{ padding: '6px 8px' }}>Previous Scope</th>
                    <th style={{ padding: '6px 8px' }}>New Scope</th>
                    <th style={{ padding: '6px 8px' }}>Reason</th>
                    <th style={{ padding: '6px 8px' }}>Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{new Date(item.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <Badge variant={item.action === 'ASSIGNED' ? 'active' : (item.action === 'TRANSFERRED' ? 'purple' : (item.action === 'REVOKED' ? 'danger' : 'warning'))}>
                          {item.action}
                        </Badge>
                      </td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.userName}</td>
                      <td style={{ padding: '6px 8px', color: '#64748B' }}>{item.oldScope || '—'}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#0B192C' }}>{item.newScope || item.departmentName || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{item.reason || item.details || '—'}</td>
                      <td style={{ padding: '6px 8px', color: '#64748B' }}>{item.assignedByName} ({item.assignedByRole})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAuditModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          12. MODAL: OFFICIAL PRINTABLE JURISDICTION REGISTER
      ══════════════════════════════════════════════════════════════════════ */}
      {isPrintRegisterModalOpen && (
        <Modal
          isOpen={isPrintRegisterModalOpen}
          onClose={() => setIsPrintRegisterModalOpen(false)}
          title="Official Jurisdiction Register"
          maxWidth="900px"
        >
          <div style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Official A4 University Administration Document</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Now
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsPrintRegisterModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ border: '2px solid #0B192C', padding: '1.5rem', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #F37023', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0B192C', textTransform: 'uppercase' }}>SWARRNIM STARTUP & INNOVATION UNIVERSITY</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>OFFICE OF THE REGISTRAR • UNIVERSITY ADMINISTRATION DIVISION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F37023', marginTop: '0.35rem' }}>DEPUTY REGISTRAR JURISDICTION REGISTER (AY 2026–27)</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', textAlign: 'left', background: '#F1F5F9' }}>
                    <th style={{ padding: '4px 6px' }}>Emp ID</th>
                    <th style={{ padding: '4px 6px' }}>Deputy Registrar</th>
                    <th style={{ padding: '4px 6px' }}>Assigned Institute</th>
                    <th style={{ padding: '4px 6px' }}>Assigned Department(s)</th>
                    <th style={{ padding: '4px 6px' }}>Scope Level</th>
                    <th style={{ padding: '4px 6px' }}>Status</th>
                    <th style={{ padding: '4px 6px' }}>Effective Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{s.employeeId}</td>
                      <td style={{ padding: '4px 6px', fontWeight: 600 }}>{s.userName}</td>
                      <td style={{ padding: '4px 6px' }}>{s.instituteName}</td>
                      <td style={{ padding: '4px 6px' }}>{(s.departmentNames || []).join(', ')}</td>
                      <td style={{ padding: '4px 6px' }}>{s.scopeLevel}</td>
                      <td style={{ padding: '4px 6px' }}>{s.status}</td>
                      <td style={{ padding: '4px 6px' }}>{s.effectiveFrom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#0B192C' }}>
                <div>Generated By: <strong>Office of the Registrar</strong></div>
                <div>Statutory Seal: <strong>Registrar & Custodian of Institutional Records</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
