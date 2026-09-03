import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workTransferService } from '../../services/workTransferService';
import { WorkTransferRecord, WorkTransferStatus, WorkItemSummary } from '../../types/workTransfer';
import { WorkTransferModal } from '../../components/work-transfer/WorkTransferModal';
import { WorkAssignmentHistoryModal } from '../../components/work-transfer/WorkAssignmentHistoryModal';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { 
  ArrowLeftRight, Plus, Clock, CheckCircle2, AlertTriangle, 
  History, UserCheck, Calendar, ShieldCheck, XCircle, RefreshCw, FileText,
  Send, Inbox, ListOrdered, CheckSquare, Layers
} from 'lucide-react';

interface WorkTransferManagementPageProps {
  initialSubTab?: 'MY_WORK' | 'TRANSFER_WORK' | 'RECEIVED' | 'ACTIVE' | 'HISTORY';
}

export const WorkTransferManagementPage: React.FC<WorkTransferManagementPageProps> = ({ initialSubTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'MY_WORK' | 'RECEIVED' | 'ACTIVE' | 'SCHEDULED' | 'HISTORY'>(
    initialSubTab === 'RECEIVED' ? 'RECEIVED' :
    initialSubTab === 'ACTIVE' ? 'ACTIVE' :
    initialSubTab === 'HISTORY' ? 'HISTORY' : 'MY_WORK'
  );

  const [transfers, setTransfers] = useState<WorkTransferRecord[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [revokingTransfer, setRevokingTransfer] = useState<WorkTransferRecord | null>(null);
  const [selectedHistoryWorkItem, setSelectedHistoryWorkItem] = useState<{ id: string; title: string } | null>(null);
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUserId = user?.id || 'fac-1';

  // Automatically trigger transfer modal if accessed via 'Transfer Work' submenu
  useEffect(() => {
    if (initialSubTab === 'TRANSFER_WORK') {
      setIsTransferModalOpen(true);
    }
  }, [initialSubTab]);

  const loadData = () => {
    workTransferService.autoSyncTransferStatuses();
    setTransfers(workTransferService.getAllTransfers());
  };

  useEffect(() => {
    loadData();
  }, [refreshKey, user?.id]);

  // 1. My Assignable Active Work Items
  const myWorkItems: WorkItemSummary[] = useMemo(() => {
    return workTransferService.getAssignableWorkItemsForUser(currentUserId);
  }, [currentUserId, refreshKey]);

  // 2. Transferred Out Active
  const myActiveTransfers = useMemo(() => {
    return transfers.filter(t => t.fromUserId === currentUserId && t.status === 'ACTIVE');
  }, [transfers, currentUserId]);

  // 3. Transfers Received Active
  const transfersReceived = useMemo(() => {
    return transfers.filter(t => t.toUserId === currentUserId && t.status === 'ACTIVE');
  }, [transfers, currentUserId]);

  // 4. Scheduled Transfers
  const scheduledTransfers = useMemo(() => {
    return transfers.filter(t => (t.fromUserId === currentUserId || t.toUserId === currentUserId) && t.status === 'SCHEDULED');
  }, [transfers, currentUserId]);

  // 5. Transfer History
  const transferHistory = useMemo(() => {
    return transfers.filter(t => (t.fromUserId === currentUserId || t.toUserId === currentUserId) && (t.status === 'EXPIRED' || t.status === 'REVOKED' || t.status === 'CANCELLED' || t.status === 'COMPLETED'));
  }, [transfers, currentUserId]);

  const handleRevokeConfirm = () => {
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

  const handleCompleteWorkItem = (itemId: string) => {
    try {
      workTransferService.markWorkItemCompleted(itemId, user?.id || 'fac-1', user?.name || 'Faculty Member');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const getStatusBadge = (status: WorkTransferStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="active">ACTIVE</Badge>;
      case 'SCHEDULED': return <Badge variant="navy">SCHEDULED</Badge>;
      case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
      case 'EXPIRED': return <Badge variant="inactive">EXPIRED</Badge>;
      case 'REVOKED': return <Badge variant="danger">REVOKED</Badge>;
      default: return <Badge variant="warning">{status}</Badge>;
    }
  };

  const renderTransferTable = (list: WorkTransferRecord[], emptyMessage: string, canRevoke = false) => {
    if (list.length === 0) {
      return (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-surface, #FFFFFF)' }}>
          <Clock size={36} color="var(--text-muted, #64748B)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>No Records Found</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0' }}>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: '0', background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Tracking Code</th>
                <th>From (Original)</th>
                <th>To (Recipient)</th>
                <th>Effective Period</th>
                <th>Reason</th>
                <th>Work Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(tr => (
                <tr key={tr.id}>
                  <td><code>{tr.trackingCode}</code></td>
                  <td>
                    <strong>{tr.fromUserName}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>{tr.fromUserRole}</div>
                  </td>
                  <td>
                    <strong>{tr.toUserName}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>{tr.toUserRole}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{tr.startAt}</span>
                    <span style={{ margin: '0 4px', color: 'var(--text-muted, #64748B)' }}>→</span>
                    <span style={{ fontWeight: 600 }}>{tr.endAt}</span>
                  </td>
                  <td><Badge variant="orange">{tr.reason}</Badge></td>
                  <td>
                    <strong>{tr.totalItemsCount} Tasks</strong>
                    {tr.completedItemIds.length > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#047857', display: 'block' }}>
                        {tr.completedItemIds.length} completed
                      </span>
                    )}
                  </td>
                  <td>{getStatusBadge(tr.status)}</td>
                  <td>
                    {canRevoke && (tr.status === 'ACTIVE' || tr.status === 'SCHEDULED') && (
                      <button
                        onClick={() => setRevokingTransfer(tr)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#DC2626', borderColor: '#FCA5A5', fontSize: '0.71875rem' }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={22} color="var(--brand-orange, #F37023)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Workload &amp; Work Transfer / Delegation Management
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0 0' }}>
            Temporarily transfer tasks, student mentoring, and approvals during leaves, vacations, or official duty.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800, fontSize: '0.78125rem' }}
          >
            <Plus size={15} /> Transfer Work
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div 
          onClick={() => setActiveTab('MY_WORK')}
          className="card" 
          style={{ 
            padding: '0.9rem 1rem', 
            background: 'var(--bg-surface, #FFFFFF)', 
            borderLeft: '4px solid var(--brand-navy, #0B192C)',
            cursor: 'pointer' 
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>MY ACTIVE WORKLOAD</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>
            {myWorkItems.length} Tasks
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Ready to Process / Delegate</div>
        </div>

        <div 
          onClick={() => setActiveTab('RECEIVED')}
          className="card" 
          style={{ 
            padding: '0.9rem 1rem', 
            background: 'var(--bg-surface, #FFFFFF)', 
            borderLeft: '4px solid var(--brand-orange, #F37023)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>RECEIVED WORKLOAD</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>
            {transfersReceived.reduce((acc, t) => acc + (t.totalItemsCount - t.completedItemIds.length), 0)} Tasks
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>{transfersReceived.length} Active Transfer(s)</div>
        </div>

        <div 
          onClick={() => setActiveTab('ACTIVE')}
          className="card" 
          style={{ 
            padding: '0.9rem 1rem', 
            background: 'var(--bg-surface, #FFFFFF)', 
            borderLeft: '4px solid #3B82F6',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>MY TRANSFERS OUT</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1D4ED8', marginTop: '2px' }}>
            {myActiveTransfers.length} Active
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Temporarily Delegated</div>
        </div>

        <div 
          onClick={() => setActiveTab('HISTORY')}
          className="card" 
          style={{ 
            padding: '0.9rem 1rem', 
            background: 'var(--bg-surface, #FFFFFF)', 
            borderLeft: '4px solid #10B981',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TRANSFER HISTORY</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
            {transferHistory.length} Records
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Completed &amp; Restored</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color, #E2E8F0)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'MY_WORK', label: 'My Work / Workload', count: myWorkItems.length, icon: ListOrdered },
          { id: 'RECEIVED', label: 'Received Work', count: transfersReceived.length, icon: Inbox },
          { id: 'ACTIVE', label: 'Active Transfers', count: myActiveTransfers.length, icon: Send },
          { id: 'SCHEDULED', label: 'Scheduled Transfers', count: scheduledTransfers.length, icon: Clock },
          { id: 'HISTORY', label: 'Transfer History', count: transferHistory.length, icon: History }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                background: isActive ? 'var(--brand-navy, #0B192C)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-muted, #64748B)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(243, 112, 35, 0.25)' : 'var(--bg-surface-hover, #F1F5F9)',
                color: isActive ? 'var(--brand-gold, #FBBF24)' : 'var(--text-muted, #64748B)',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.6875rem'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: MY WORK & ACTIVE WORKLOAD ─── */}
      {activeTab === 'MY_WORK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                Active Workload &amp; Task Items ({myWorkItems.length})
              </h3>
              <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                All pending tasks assigned to you. Select items to delegate during leave or absences.
              </p>
            </div>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800 }}
            >
              <ArrowLeftRight size={14} /> Transfer Workload
            </button>
          </div>

          {myWorkItems.length === 0 ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-surface, #FFFFFF)' }}>
              <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>No Pending Tasks</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '4px 0 0 0' }}>
                All assigned work items, mentoring requests, and verifications are up to date.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Module / Type</th>
                      <th>Work Description</th>
                      <th>Reference / Student</th>
                      <th>Assigned Date</th>
                      <th>Status &amp; Responsibility</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myWorkItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          <Badge variant="navy">{item.type.replace('_', ' ')}</Badge>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{item.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>{item.description}</div>
                        </td>
                        <td>
                          {item.studentName ? (
                            <div>
                              <strong>{item.studentName}</strong>
                              <code style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted, #64748B)' }}>
                                {item.enrollmentNo || item.studentEnrollment || item.studentId || 'N/A'}
                              </code>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted, #64748B)' }}>N/A</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem' }}>{(item.assignedAt || item.createdAt || '').slice(0, 10)}</span>
                        </td>
                        <td>
                          {item.isReturnedFromDelegation ? (
                            <Badge variant="navy">{item.delegationLabel || 'Returned from Delegation'}</Badge>
                          ) : (
                            <Badge variant="active">Active Assignment</Badge>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedHistoryWorkItem({ id: item.id, title: item.title })}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.71875rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <History size={12} /> History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: RECEIVED WORK ─── */}
      {activeTab === 'RECEIVED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Received Delegated Work Items ({transfersReceived.length} Active Transfer{transfersReceived.length > 1 ? 's' : ''})
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
              Work delegated to you by colleagues on leave or official duty. Process tasks before delegation period ends.
            </p>
          </div>

          {renderTransferTable(transfersReceived, 'You have not received any delegated workload from other faculty members.')}
        </div>
      )}

      {/* ─── TAB 3: ACTIVE TRANSFERS OUT ─── */}
      {activeTab === 'ACTIVE' && renderTransferTable(myActiveTransfers, 'You have no active workload transfers currently active.', true)}

      {/* ─── TAB 4: SCHEDULED TRANSFERS ─── */}
      {activeTab === 'SCHEDULED' && renderTransferTable(scheduledTransfers, 'No future scheduled transfers are registered.', true)}

      {/* ─── TAB 5: TRANSFER HISTORY ─── */}
      {activeTab === 'HISTORY' && renderTransferTable(transferHistory, 'No past or archived transfer history.')}

      {/* Work Transfer Modal */}
      <WorkTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      {/* Work Assignment History Modal */}
      <WorkAssignmentHistoryModal
        isOpen={Boolean(selectedHistoryWorkItem)}
        onClose={() => setSelectedHistoryWorkItem(null)}
        workItemId={selectedHistoryWorkItem?.id || null}
        workItemTitle={selectedHistoryWorkItem?.title}
      />

      {/* Revocation Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(revokingTransfer)}
        onClose={() => setRevokingTransfer(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Workload Transfer"
        message={`Are you sure you want to revoke transfer ${revokingTransfer?.trackingCode}? All remaining incomplete work items will immediately return to ${revokingTransfer?.fromUserName}.`}
        confirmLabel="Revoke Transfer"
      />
    </div>
  );
};
