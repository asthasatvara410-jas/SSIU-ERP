import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workTransferService } from '../../services/workTransferService';
import { WorkTransferRecord, WorkTransferStatus } from '../../types/workTransfer';
import { WorkAssignmentHistoryModal } from '../../components/work-transfer/WorkAssignmentHistoryModal';
import { Badge } from '../../components/common/Badge';
import { 
  ArrowLeftRight, Send, Inbox, AlertTriangle, CheckCircle2, 
  RotateCcw, History, Calendar, Search, UserCheck, ShieldAlert
} from 'lucide-react';

interface ActiveTransfersPageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

export const ActiveTransfersPage: React.FC<ActiveTransfersPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'fac-1';

  const [searchQuery, setSearchQuery] = useState('');
  const [revokingTransfer, setRevokingTransfer] = useState<WorkTransferRecord | null>(null);
  const [selectedHistoryTransfer, setSelectedHistoryTransfer] = useState<WorkTransferRecord | null>(null);
  const [activeSection, setActiveSection] = useState<'SENT' | 'RECEIVED'>('SENT');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    workTransferService.autoSyncTransferStatuses();
  }, [refreshKey]);

  const allActiveTransfers = useMemo(() => {
    return workTransferService.getActiveTransfers();
  }, [refreshKey]);

  // Section A: Transfers I Sent
  const transfersSent = useMemo(() => {
    return allActiveTransfers.filter(t => t.fromUserId === currentUserId);
  }, [allActiveTransfers, currentUserId]);

  // Section B: Transfers I Received
  const transfersReceived = useMemo(() => {
    return allActiveTransfers.filter(t => t.toUserId === currentUserId);
  }, [allActiveTransfers, currentUserId]);

  const handleRevoke = (transfer: WorkTransferRecord) => {
    setRevokingTransfer(transfer);
  };

  const handleConfirmRevoke = () => {
    if (revokingTransfer) {
      try {
        workTransferService.revokeWorkTransfer(revokingTransfer.id, user);
        setRevokingTransfer(null);
        setRefreshKey(k => k + 1);
      } catch (err: any) {
        alert(err.message || 'Failed to revoke transfer.');
      }
    }
  };

  const getStatusBadge = (status: WorkTransferStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="active">ACTIVE</Badge>;
      case 'SCHEDULED': return <Badge variant="navy">SCHEDULED</Badge>;
      case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
      case 'EXPIRED': return <Badge variant="inactive">EXPIRED</Badge>;
      case 'REVOKED': return <Badge variant="danger">REVOKED</Badge>;
      default: return <Badge variant="inactive">{status}</Badge>;
    }
  };

  const filteredSent = useMemo(() => {
    if (!searchQuery.trim()) return transfersSent;
    const q = searchQuery.toLowerCase();
    return transfersSent.filter(t => 
      t.trackingCode.toLowerCase().includes(q) ||
      t.toUserName.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q)
    );
  }, [transfersSent, searchQuery]);

  const filteredReceived = useMemo(() => {
    if (!searchQuery.trim()) return transfersReceived;
    const q = searchQuery.toLowerCase();
    return transfersReceived.filter(t => 
      t.trackingCode.toLowerCase().includes(q) ||
      t.fromUserName.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q)
    );
  }, [transfersReceived, searchQuery]);

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
            <ArrowLeftRight size={24} color="var(--brand-orange, #F37023)" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Active Workload Transfers
            </h1>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0 0' }}>
            Real-time status of delegations currently underway. Revoke outbound delegations at any time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            + New Transfer
          </button>
        </div>
      </div>

      {/* ─── Section Tabs (Transfers I Sent vs Transfers I Received) ─── */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveSection('SENT')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                border: 'none',
                background: activeSection === 'SENT' ? 'var(--brand-navy, #0B192C)' : 'var(--bg-surface-hover, #F1F5F9)',
                color: activeSection === 'SENT' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={15} />
              <span>Transfers I Sent (Outbound)</span>
              <span style={{
                background: activeSection === 'SENT' ? 'rgba(243,112,35,0.3)' : '#E2E8F0',
                color: activeSection === 'SENT' ? 'var(--brand-gold, #FBBF24)' : '#64748B',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.7rem'
              }}>
                {transfersSent.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('RECEIVED')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                border: 'none',
                background: activeSection === 'RECEIVED' ? 'var(--brand-navy, #0B192C)' : 'var(--bg-surface-hover, #F1F5F9)',
                color: activeSection === 'RECEIVED' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Inbox size={15} />
              <span>Transfers I Received (Inbound)</span>
              <span style={{
                background: activeSection === 'RECEIVED' ? 'rgba(243,112,35,0.3)' : '#E2E8F0',
                color: activeSection === 'RECEIVED' ? 'var(--brand-gold, #FBBF24)' : '#64748B',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.7rem'
              }}>
                {transfersReceived.length}
              </span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px', maxWidth: '320px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748B)' }} />
              <input
                type="text"
                placeholder="Search active transfers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-control form-control-sm"
                style={{ paddingLeft: '32px', borderRadius: '20px', fontSize: '0.78125rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table Section ─── */}
      {activeSection === 'SENT' ? (
        filteredSent.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--bg-surface, #FFFFFF)' }}>
            <Send size={40} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>No Outbound Active Transfers</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0' }}>
              You have not delegated any active workload to colleagues at this time.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>Delegated Recipient (To)</th>
                    <th>Absence Reason</th>
                    <th>Effective Period</th>
                    <th>Tasks Delegated</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSent.map(t => (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.8125rem' }}>
                          <code>{t.trackingCode}</code>
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                          Created: {t.createdAt.slice(0, 10)}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)' }}>{t.toUserName}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                          {t.toUserRole} • {t.toUserDepartmentName || 'Department'}
                        </div>
                      </td>
                      <td>
                        <Badge variant="orange">{t.reason}</Badge>
                        {t.remarks && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                            {t.remarks}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78125rem' }}>
                          <strong>{t.startAt}</strong> to <strong>{t.endAt}</strong>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--brand-navy, #0B192C)' }}>
                          {t.totalItemsCount} Tasks
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: '#10B981' }}>
                          {t.completedItemIds?.length || 0} completed by recipient
                        </div>
                      </td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleRevoke(t)}
                            className="btn btn-primary btn-sm"
                            style={{
                              fontSize: '0.71875rem',
                              padding: '3px 8px',
                              background: '#DC2626',
                              border: 'none',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <RotateCcw size={12} /> Revoke
                          </button>
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
                            <History size={12} /> Timeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        filteredReceived.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--bg-surface, #FFFFFF)' }}>
            <Inbox size={40} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>No Inbound Active Transfers</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0' }}>
              No colleagues have transferred active workload to you currently.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>Originating Colleague (From)</th>
                    <th>Absence Reason</th>
                    <th>Effective Period</th>
                    <th>Delegated Tasks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceived.map(t => (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.8125rem' }}>
                          <code>{t.trackingCode}</code>
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                          Created: {t.createdAt.slice(0, 10)}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)' }}>{t.fromUserName}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                          {t.fromUserRole} • {t.fromUserDepartmentName || 'Department'}
                        </div>
                      </td>
                      <td>
                        <Badge variant="orange">{t.reason}</Badge>
                        {t.remarks && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                            {t.remarks}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78125rem' }}>
                          <strong>{t.startAt}</strong> to <strong>{t.endAt}</strong>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--brand-navy, #0B192C)' }}>
                          {t.totalItemsCount} Tasks
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: '#10B981' }}>
                          {t.completedItemIds?.length || 0} marked completed
                        </div>
                      </td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => setActiveTab && setActiveTab('work-transfer-received')}
                            className="btn btn-primary btn-sm"
                            style={{
                              fontSize: '0.71875rem',
                              padding: '3px 8px',
                              background: 'var(--brand-navy, #0B192C)',
                              border: 'none',
                              fontWeight: 700
                            }}
                          >
                            Open Tasks
                          </button>
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
                            <History size={12} /> Timeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ─── Revoke Confirmation Modal ─── */}
      {revokingTransfer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 25, 44, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', background: 'var(--bg-surface, #FFFFFF)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', marginBottom: '0.75rem' }}>
              <ShieldAlert size={22} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Confirm Transfer Revocation</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5 }}>
              Are you sure you want to revoke transfer <strong><code>{revokingTransfer.trackingCode}</code></strong>?
            </p>
            <div style={{ padding: '0.75rem', background: '#FEE2E2', borderRadius: '6px', fontSize: '0.75rem', color: '#B91C1C', marginBottom: '1.25rem' }}>
              All {revokingTransfer.totalItemsCount - (revokingTransfer.completedItemIds?.length || 0)} remaining incomplete tasks will instantly return to your active workload. Completed tasks will remain recorded in transfer history.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setRevokingTransfer(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="btn btn-primary btn-sm"
                style={{ background: '#DC2626', borderColor: '#DC2626', fontWeight: 800 }}
              >
                Yes, Revoke Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Timeline / Audit Modal ─── */}
      <WorkAssignmentHistoryModal
        isOpen={Boolean(selectedHistoryTransfer)}
        onClose={() => setSelectedHistoryTransfer(null)}
        workItemId={selectedHistoryTransfer?.workItemIds[0] || null}
        workItemTitle={`Transfer ${selectedHistoryTransfer?.trackingCode} (${selectedHistoryTransfer?.reason})`}
      />
    </div>
  );
};
