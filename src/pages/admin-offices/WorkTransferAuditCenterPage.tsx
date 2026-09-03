import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { workTransferService } from '../../services/workTransferService';
import { 
  WorkTransferRecord, 
  WorkTransferStatus, 
  TransferReason,
  WorkTransferFilterParams,
  WorkTransferAuditEvent
} from '../../types/workTransfer';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { 
  ArrowLeftRight, Filter, Search, Download, Calendar, 
  Clock, CheckCircle2, AlertCircle, RefreshCw, XCircle, 
  Eye, Building2, User, FileText, ChevronRight, History, 
  ShieldCheck, ShieldAlert, Sparkles, FileSpreadsheet
} from 'lucide-react';

export const WorkTransferAuditCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [filterParams, setFilterParams] = useState<WorkTransferFilterParams>({
    status: 'ALL',
    reason: 'ALL',
    departmentId: 'ALL',
    instituteId: 'ALL',
    searchQuery: ''
  });

  const [selectedTransfer, setSelectedTransfer] = useState<WorkTransferRecord | null>(null);
  const [revokingTransfer, setRevokingTransfer] = useState<WorkTransferRecord | null>(null);
  const [cancellingTransfer, setCancellingTransfer] = useState<WorkTransferRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const departments = useMemo(() => db.getDepartments(), []);
  const institutes = useMemo(() => db.getInstitutes(), []);
  const allFaculty = useMemo(() => db.getFaculty(), []);

  // Filtered transfers and KPI metrics
  const { filteredTransfers, metrics } = useMemo(() => {
    const list = workTransferService.getFilteredTransfers(filterParams, user);
    const m = workTransferService.getTransferAuditMetrics(user);
    return { filteredTransfers: list, metrics: m };
  }, [filterParams, refreshTrigger, user]);

  const handleStatusChange = (status: WorkTransferStatus | 'ALL') => {
    setFilterParams(prev => ({ ...prev, status }));
  };

  const handleReasonChange = (reason: TransferReason | 'ALL') => {
    setFilterParams(prev => ({ ...prev, reason }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    setFilterParams(prev => ({ ...prev, departmentId }));
  };

  const handleInstituteChange = (instituteId: string) => {
    setFilterParams(prev => ({ ...prev, instituteId }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterParams(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    setFilterParams(prev => ({ ...prev, [field]: val || undefined }));
  };

  const handleResetFilters = () => {
    setFilterParams({
      status: 'ALL',
      reason: 'ALL',
      departmentId: 'ALL',
      instituteId: 'ALL',
      searchQuery: '',
      startDate: undefined,
      endDate: undefined
    });
  };

  const handleExportCsv = () => {
    const csvContent = workTransferService.generateCsvExport(filteredTransfers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SSIU_Work_Transfer_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRevokeConfirm = () => {
    if (!revokingTransfer) return;
    try {
      workTransferService.revokeWorkTransfer(revokingTransfer.id, user);
      setRevokingTransfer(null);
      setRefreshTrigger(prev => prev + 1);
      if (selectedTransfer?.id === revokingTransfer.id) {
        setSelectedTransfer(workTransferService.getTransferById(revokingTransfer.id) || null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke work transfer.');
    }
  };

  const handleCancelConfirm = () => {
    if (!cancellingTransfer) return;
    try {
      workTransferService.cancelScheduledTransfer(cancellingTransfer.id, user);
      setCancellingTransfer(null);
      setRefreshTrigger(prev => prev + 1);
      if (selectedTransfer?.id === cancellingTransfer.id) {
        setSelectedTransfer(workTransferService.getTransferById(cancellingTransfer.id) || null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel work transfer.');
    }
  };

  const getStatusBadge = (status: WorkTransferStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="active">Active</Badge>;
      case 'SCHEDULED':
        return <Badge variant="orange">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'EXPIRED':
        return <Badge variant="navy">Expired</Badge>;
      case 'REVOKED':
        return <Badge variant="danger">Revoked</Badge>;
      case 'CANCELLED':
        return <Badge variant="inactive">Cancelled</Badge>;
      default:
        return <Badge variant="inactive">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ─── 1. Header & Title Banner ─── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-navy, #0B192C) 0%, #1E3E62 100%)',
        padding: '1.75rem 2rem',
        borderRadius: '12px',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(11, 25, 44, 0.15)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{
              background: 'rgba(243, 112, 35, 0.2)',
              border: '1px solid rgba(243, 112, 35, 0.4)',
              borderRadius: '8px',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <ShieldCheck size={22} color="var(--brand-orange, #F37023)" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#FFFFFF' }}>
              Work Transfer &amp; Workload Delegation Audit Center
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
            Centralized university governance &bull; Full chronological accountability &bull; Append-only audit trail
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleExportCsv}
            className="btn"
            style={{
              background: '#FFFFFF',
              color: 'var(--brand-navy, #0B192C)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: 'none'
            }}
          >
            <FileSpreadsheet size={16} color="var(--brand-orange, #F37023)" />
            Export Audit Report (CSV)
          </button>
        </div>
      </div>

      {/* ─── 2. Higher Authority Metric Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)', borderLeft: '4px solid var(--brand-navy, #0B192C)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TOTAL TRANSFERS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>{metrics.totalCount}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>University-wide delegations</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#047857' }}>ACTIVE DELEGATIONS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>{metrics.activeCount}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Currently shifted responsibility</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>SCHEDULED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>{metrics.scheduledCount}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Pending future start dates</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)', borderLeft: '4px solid #0EA5E9' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0369A1' }}>COMPLETED WORK</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0369A1', marginTop: '2px' }}>{metrics.completedCount}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Fulfilled by delegated assignees</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)', borderLeft: '4px solid #64748B' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#475569' }}>EXPIRED &amp; RETURNED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#475569', marginTop: '2px' }}>{metrics.expiredCount}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Restored to original faculty</div>
        </div>

        <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#B91C1C' }}>REVOKED / CANCELLED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#B91C1C', marginTop: '2px' }}>{metrics.revokedCount + metrics.cancelledCount}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Intervened by administration</div>
        </div>
      </div>

      {/* ─── 3. Filter Controls & Server-Side Search ─── */}
      <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--brand-orange, #F37023)" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Search &amp; Audit Filter Criteria
            </h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Reset Filters
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {/* Universal Search Bar */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              Search (Tracking ID, Faculty, Student, Work ID)
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={filterParams.searchQuery}
                onChange={handleSearchChange}
                placeholder="Search WTR-2026-XXXXXX, Faculty name, Student name, or task..."
                className="input"
                style={{ paddingLeft: '32px', width: '100%', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              Delegation Status
            </label>
            <select
              value={filterParams.status}
              onChange={e => handleStatusChange(e.target.value as any)}
              className="select"
              style={{ width: '100%', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE (Currently Delegated)</option>
              <option value="SCHEDULED">SCHEDULED (Upcoming)</option>
              <option value="COMPLETED">COMPLETED (Tasks Finished)</option>
              <option value="EXPIRED">EXPIRED (Restored to Owner)</option>
              <option value="REVOKED">REVOKED (Administrative Recall)</option>
              <option value="CANCELLED">CANCELLED (Withdrawn)</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              Transfer Reason
            </label>
            <select
              value={filterParams.reason}
              onChange={e => handleReasonChange(e.target.value as any)}
              className="select"
              style={{ width: '100%', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Reasons</option>
              <option value="LEAVE">Leave of Absence</option>
              <option value="VACATION">Vacation / Semester Break</option>
              <option value="WEEK_OFF">Week Off / Compensatory</option>
              <option value="OFFICIAL_DUTY">Official Duty / Deputation</option>
              <option value="UNAVAILABLE">Unavailable / Medical</option>
              <option value="TEMPORARY_ASSIGNMENT">Temporary Assignment</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              Department Scope
            </label>
            <select
              value={filterParams.departmentId}
              onChange={e => handleDepartmentChange(e.target.value)}
              className="select"
              style={{ width: '100%', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Institute Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              Institute Scope
            </label>
            <select
              value={filterParams.instituteId}
              onChange={e => handleInstituteChange(e.target.value)}
              className="select"
              style={{ width: '100%', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Institutes</option>
              {institutes.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              From Date
            </label>
            <input
              type="date"
              value={filterParams.startDate || ''}
              onChange={e => handleDateChange('startDate', e.target.value)}
              className="input"
              style={{ width: '100%', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Date Range End */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '4px' }}>
              To Date
            </label>
            <input
              type="date"
              value={filterParams.endDate || ''}
              onChange={e => handleDateChange('endDate', e.target.value)}
              className="input"
              style={{ width: '100%', fontSize: '0.8125rem' }}
            />
          </div>
        </div>
      </div>

      {/* ─── 4. Transfer Audit Records Table ─── */}
      <div className="card" style={{ padding: '0', background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Master Workload Delegation Records ({filteredTransfers.length})
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>
              Complete chronological audit trail with zero task duplication
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Tracking Code</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Original Owner</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Transferred To</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Department</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Effective Period</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Reason</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Items</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted, #64748B)' }}>
                    <History size={36} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 700 }}>No workload transfer records match the specified filters.</div>
                    <div style={{ fontSize: '0.75rem' }}>Try clearing filters or search term to view all records.</div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(tr => (
                  <tr key={tr.id} style={{ borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <code style={{ fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{tr.trackingCode}</code>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted, #64748B)' }}>ID: {tr.id}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{tr.fromUserName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>Role: {tr.fromUserRole}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-orange, #F37023)' }}>{tr.toUserName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>Role: {tr.toUserRole}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      <div>{tr.fromUserDepartmentName || 'Computer Engineering'}</div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted, #64748B)' }}>{tr.fromUserInstituteName || 'SSIT'}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{tr.startAt} &rarr; {tr.endAt}</div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted, #64748B)' }}>Created {tr.createdAt.slice(0, 10)}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Badge variant="orange">{tr.reason}</Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 800 }}>{tr.totalItemsCount} Tasks</div>
                      <div style={{ fontSize: '0.675rem', color: tr.completedItemIds.length > 0 ? '#047857' : 'var(--text-muted, #64748B)' }}>
                        {tr.completedItemIds.length} completed
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getStatusBadge(tr.status)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedTransfer(tr)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.725rem', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          title="View Full Audit History"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                        {tr.status === 'ACTIVE' && (
                          <button
                            onClick={() => setRevokingTransfer(tr)}
                            className="btn btn-danger"
                            style={{ fontSize: '0.725rem', padding: '0.35rem 0.6rem' }}
                            title="Revoke active delegation"
                          >
                            Revoke
                          </button>
                        )}
                        {tr.status === 'SCHEDULED' && (
                          <button
                            onClick={() => setCancellingTransfer(tr)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.725rem', padding: '0.35rem 0.6rem', color: '#B91C1C' }}
                            title="Cancel scheduled transfer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. Transfer Details & Complete Audit Timeline Modal ─── */}
      {selectedTransfer && (
        <Modal
          isOpen={Boolean(selectedTransfer)}
          onClose={() => setSelectedTransfer(null)}
          title={`Transfer Audit Detail: ${selectedTransfer.trackingCode}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {/* Header Card */}
            <div style={{
              background: 'var(--bg-surface-hover, #F8FAFC)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid var(--brand-navy, #0B192C)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TRACKING CODE</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)' }}>{selectedTransfer.trackingCode}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>Internal ID: {selectedTransfer.id}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {getStatusBadge(selectedTransfer.status)}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', marginTop: '4px' }}>
                  Reason: <strong>{selectedTransfer.reason}</strong>
                </div>
              </div>
            </div>

            {/* Attribution Grid: "Who Did What" */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ORIGINAL OWNER</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{selectedTransfer.fromUserName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>{selectedTransfer.fromUserDepartmentName}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DELEGATED RECIPIENT</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{selectedTransfer.toUserName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>{selectedTransfer.toUserDepartmentName}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>EFFECTIVE TIMEFRAME</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{selectedTransfer.startAt} &rarr; {selectedTransfer.endAt}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>Created {selectedTransfer.createdAt.slice(0, 10)}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>COMPLETED BY</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: selectedTransfer.completedByUserName ? '#047857' : 'var(--text-muted, #64748B)' }}>
                  {selectedTransfer.completedByUserName || 'None (Pending / Restored)'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                  {selectedTransfer.completedItemIds.length} / {selectedTransfer.totalItemsCount} items completed
                </div>
              </div>
            </div>

            {/* Remarks / Justification */}
            {selectedTransfer.remarks && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>Absence Justification / Remarks:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #64748B)' }}>{selectedTransfer.remarks}</p>
              </div>
            )}

            {/* Work Items Delegated */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.5rem' }}>
                Delegated Work Items ({selectedTransfer.workItemIds.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selectedTransfer.workItemIds.map((itemId, idx) => {
                  const isDone = selectedTransfer.completedItemIds.includes(itemId);
                  return (
                    <div
                      key={itemId}
                      style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--bg-surface, #FFFFFF)',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '0.75rem', fontWeight: 700 }}>#{idx + 1} {itemId}</code>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>Work Item</span>
                      </div>
                      <div>
                        {isDone ? (
                          <Badge variant="success">Completed by {selectedTransfer.completedByUserName || selectedTransfer.toUserName}</Badge>
                        ) : selectedTransfer.status === 'EXPIRED' || selectedTransfer.status === 'REVOKED' ? (
                          <Badge variant="navy">Returned to {selectedTransfer.fromUserName}</Badge>
                        ) : (
                          <Badge variant="orange">Active Delegation</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Chronological Audit Trail */}
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} color="var(--brand-orange, #F37023)" />
                Complete Chronological Audit Trail (Append-Only)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(selectedTransfer.auditTrail || []).map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface-hover, #F8FAFC)',
                      borderRadius: '6px',
                      borderLeft: '3px solid var(--brand-navy, #0B192C)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.7875rem', color: 'var(--brand-navy, #0B192C)' }}>
                        {ev.action.replace(/_/g, ' ')}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                      Actor: <strong>{ev.actorName}</strong> ({ev.actorRole})
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                      {ev.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Close Audit View
              </button>
              {selectedTransfer.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    setRevokingTransfer(selectedTransfer);
                  }}
                  className="btn btn-danger"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Revoke Delegation
                </button>
              )}
              {selectedTransfer.status === 'SCHEDULED' && (
                <button
                  type="button"
                  onClick={() => {
                    setCancellingTransfer(selectedTransfer);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', color: '#B91C1C' }}
                >
                  Cancel Delegation
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Revocation Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(revokingTransfer)}
        onClose={() => setRevokingTransfer(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Workload Delegation"
        message={`Are you sure you want to revoke transfer ${revokingTransfer?.trackingCode}? All remaining incomplete tasks will immediately be restored to ${revokingTransfer?.fromUserName}.`}
        confirmLabel="Revoke Transfer"
      />

      {/* Cancellation Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingTransfer)}
        onClose={() => setCancellingTransfer(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Scheduled Delegation"
        message={`Are you sure you want to cancel scheduled transfer ${cancellingTransfer?.trackingCode}?`}
        confirmLabel="Cancel Transfer"
      />
    </div>
  );
};
