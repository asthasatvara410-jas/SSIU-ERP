import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workTransferService } from '../../services/workTransferService';
import { WorkTransferRecord, WorkTransferStatus, TransferReason } from '../../types/workTransfer';
import { WorkAssignmentHistoryModal } from '../../components/work-transfer/WorkAssignmentHistoryModal';
import { Badge } from '../../components/common/Badge';
import { 
  History, Search, Filter, Calendar, UserCheck, CheckCircle2, 
  ArrowLeftRight, FileSpreadsheet, Download, RefreshCw, Eye
} from 'lucide-react';

interface TransferHistoryPageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

export const TransferHistoryPage: React.FC<TransferHistoryPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'fac-1';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'SENT' | 'RECEIVED'>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [selectedHistoryTransfer, setSelectedHistoryTransfer] = useState<WorkTransferRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    workTransferService.autoSyncTransferStatuses();
  }, [refreshKey]);

  // Load all historical and active transfers
  const allTransfers: WorkTransferRecord[] = useMemo(() => {
    const list = workTransferService.getAllTransfers();
    // Non-superadmin filters to transfers where user was sender or recipient or in same department
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'UNIVERSITY_ADMIN' || user?.role === 'VICE_PRESIDENT' || user?.role === 'REGISTRAR' || user?.role === 'PRINCIPAL') {
      return list;
    }
    return list.filter(t => t.fromUserId === currentUserId || t.toUserId === currentUserId);
  }, [currentUserId, user, refreshKey]);

  const filteredTransfers = useMemo(() => {
    return allTransfers.filter(t => {
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // Direction filter
      if (directionFilter === 'SENT' && t.fromUserId !== currentUserId) return false;
      if (directionFilter === 'RECEIVED' && t.toUserId !== currentUserId) return false;

      // Reason filter
      if (reasonFilter !== 'ALL' && t.reason !== reasonFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = t.trackingCode.toLowerCase().includes(q);
        const matchesFrom = t.fromUserName.toLowerCase().includes(q);
        const matchesTo = t.toUserName.toLowerCase().includes(q);
        const matchesReason = t.reason.toLowerCase().includes(q);
        const matchesRemarks = t.remarks && t.remarks.toLowerCase().includes(q);
        if (!matchesCode && !matchesFrom && !matchesTo && !matchesReason && !matchesRemarks) return false;
      }

      return true;
    });
  }, [allTransfers, statusFilter, directionFilter, reasonFilter, searchQuery, currentUserId]);

  const getStatusBadge = (status: WorkTransferStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="active">ACTIVE</Badge>;
      case 'SCHEDULED': return <Badge variant="navy">SCHEDULED</Badge>;
      case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
      case 'EXPIRED': return <Badge variant="inactive">EXPIRED</Badge>;
      case 'REVOKED': return <Badge variant="danger">REVOKED</Badge>;
      case 'CANCELLED': return <Badge variant="inactive">CANCELLED</Badge>;
      default: return <Badge variant="inactive">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tracking Code', 'From User', 'To User', 'Start Date', 'End Date', 'Reason', 'Total Tasks', 'Completed Tasks', 'Status', 'Created At'];
    const rows = filteredTransfers.map(t => [
      t.trackingCode,
      `"${t.fromUserName} (${t.fromUserRole})"`,
      `"${t.toUserName} (${t.toUserRole})"`,
      t.startAt,
      t.endAt,
      t.reason,
      t.totalItemsCount,
      t.completedItemIds?.length || 0,
      t.status,
      t.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SSIU_Transfer_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ─── Header ─── */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={24} color="var(--brand-orange, #F37023)" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Workload Transfer History &amp; Audit Trail
            </h1>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0 0' }}>
            Complete immutable record of all past, active, completed, expired, and revoked workload delegations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              borderColor: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} /> Export Audit CSV
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('work-transfer-new')}
            className="btn btn-primary btn-sm"
            style={{
              background: 'var(--brand-orange, #F37023)',
              border: 'none',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeftRight size={14} /> Transfer Work
          </button>
        </div>
      </div>

      {/* ─── Multi-Filter Control Bar ─── */}
      <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Search */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Search Tracking / Name</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748B)' }} />
              <input
                type="text"
                placeholder="WTR-2026-..., Colleague..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-control form-control-sm"
                style={{ paddingLeft: '30px', fontSize: '0.78125rem' }}
              />
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Direction</label>
            <select
              value={directionFilter}
              onChange={e => setDirectionFilter(e.target.value as any)}
              className="form-control form-control-sm"
              style={{ fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Directions</option>
              <option value="SENT">Sent by Me (Outbound)</option>
              <option value="RECEIVED">Received by Me (Inbound)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-control form-control-sm"
              style={{ fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Absence Reason</label>
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="form-control form-control-sm"
              style={{ fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Reasons</option>
              <option value="LEAVE">Leave</option>
              <option value="VACATION">Vacation</option>
              <option value="OFFICIAL_DUTY">Official Duty</option>
              <option value="WEEK_OFF">Week Off</option>
              <option value="TEMPORARY_ASSIGNMENT">Temporary Assignment</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          {/* Refresh / Reset */}
          <div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDirectionFilter('ALL');
                setReasonFilter('ALL');
                setRefreshKey(k => k + 1);
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '0.78125rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <RefreshCw size={13} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ─── History Records Table ─── */}
      {filteredTransfers.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--bg-surface, #FFFFFF)' }}>
          <History size={40} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>No Transfer Records Found</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0' }}>
            No workload transfer records match your active search and filter criteria.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Tracking Code &amp; Date</th>
                  <th>Originator (From)</th>
                  <th>Recipient (To)</th>
                  <th>Effective Period</th>
                  <th>Reason</th>
                  <th>Items / Completed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.8125rem' }}>
                        <code>{t.trackingCode}</code>
                      </strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        Logged: {t.createdAt.slice(0, 10)}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)' }}>
                        {t.fromUserName}
                      </strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        {t.fromUserRole}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-orange, #F37023)' }}>
                        {t.toUserName}
                      </strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        {t.toUserRole}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78125rem' }}>
                        {t.startAt} → {t.endAt}
                      </div>
                    </td>
                    <td>
                      <Badge variant="orange">{t.reason}</Badge>
                      {t.remarks && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', marginTop: '2px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.remarks}>
                          {t.remarks}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.8125rem' }}>
                        {t.completedItemIds?.length || 0} / {t.totalItemsCount}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', display: 'block' }}>
                        {t.totalItemsCount === (t.completedItemIds?.length || 0) ? 'All Complete' : 'Tasks'}
                      </span>
                    </td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td>
                      <button
                        onClick={() => setSelectedHistoryTransfer(t)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.71875rem',
                          padding: '3px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Eye size={12} /> Audit Trail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Timeline / Audit Modal ─── */}
      <WorkAssignmentHistoryModal
        isOpen={Boolean(selectedHistoryTransfer)}
        onClose={() => setSelectedHistoryTransfer(null)}
        workItemId={selectedHistoryTransfer?.workItemIds[0] || null}
        workItemTitle={`Transfer ${selectedHistoryTransfer?.trackingCode} (${selectedHistoryTransfer?.fromUserName} → ${selectedHistoryTransfer?.toUserName})`}
      />
    </div>
  );
};
