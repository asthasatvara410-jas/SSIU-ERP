import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workTransferService } from '../../services/workTransferService';
import { WorkItemSummary, WorkTransferRecord } from '../../types/workTransfer';
import { WorkAssignmentHistoryModal } from '../../components/work-transfer/WorkAssignmentHistoryModal';
import { Badge } from '../../components/common/Badge';
import { 
  Inbox, UserCheck, Calendar, CheckCircle2, History, AlertTriangle, 
  ArrowRight, Search, CheckSquare, Clock, ArrowLeftRight
} from 'lucide-react';

interface ReceivedWorkPageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

export const ReceivedWorkPage: React.FC<ReceivedWorkPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'fac-1';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryWorkItem, setSelectedHistoryWorkItem] = useState<{ id: string; title: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    workTransferService.autoSyncTransferStatuses();
  }, [refreshKey]);

  // Retrieve incoming active transfers to current user
  const activeIncomingTransfers = useMemo(() => {
    const active = workTransferService.getActiveTransfers();
    return active.filter(t => t.toUserId === currentUserId);
  }, [currentUserId, refreshKey]);

  // Extract work items delegated to this user
  const receivedWorkItems: Array<WorkItemSummary & { transferMeta: WorkTransferRecord }> = useMemo(() => {
    const items: Array<WorkItemSummary & { transferMeta: WorkTransferRecord }> = [];

    activeIncomingTransfers.forEach(transfer => {
      // Find all tasks from fromUser
      const fromItems = workTransferService.getAssignableWorkItemsForUser(transfer.fromUserId);
      const fromWorkloads = workTransferService.getFacultyWorkloadItems(transfer.fromUserId);
      
      transfer.workItemIds.forEach(itemId => {
        const foundTask = fromItems.find(i => i.id === itemId);
        const foundWorkload = fromWorkloads.find(w => w.workId === itemId || w.id === itemId);

        if (foundWorkload) {
          items.push({
            id: foundWorkload.workId,
            type: foundWorkload.workType,
            title: foundWorkload.workTitle,
            description: foundWorkload.description,
            module: foundWorkload.subjectName || foundWorkload.departmentName || 'Academic Load',
            studentName: foundWorkload.studentReference,
            programName: foundWorkload.programName,
            departmentName: foundWorkload.departmentName,
            priority: foundWorkload.priority,
            status: foundWorkload.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
            assignedAt: transfer.startAt,
            dueDate: transfer.endAt,
            currentAssigneeId: currentUserId,
            currentAssigneeName: user?.name || 'Delegated Assignee',
            isDelegated: true,
            delegationLabel: `Delegated from ${transfer.fromUserName}`,
            transferMeta: transfer
          });
        } else if (foundTask) {
          items.push({
            ...foundTask,
            currentAssigneeId: currentUserId,
            currentAssigneeName: user?.name || 'Delegated Assignee',
            isDelegated: true,
            delegationLabel: `Delegated from ${transfer.fromUserName}`,
            transferMeta: transfer
          });
        } else {
          items.push({
            id: itemId,
            type: 'OTHER',
            title: `Delegated Work Item: ${itemId}`,
            description: `Transferred under order ${transfer.trackingCode}`,
            module: 'Academic Operations',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            assignedAt: transfer.startAt,
            dueDate: transfer.endAt,
            currentAssigneeId: currentUserId,
            currentAssigneeName: user?.name || 'Delegated Assignee',
            isDelegated: true,
            delegationLabel: `Delegated from ${transfer.fromUserName}`,
            transferMeta: transfer
          });
        }
      });
    });

    return items;
  }, [activeIncomingTransfers, currentUserId, user, refreshKey]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return receivedWorkItems;
    const q = searchQuery.toLowerCase();
    return receivedWorkItems.filter(item => 
      item.title.toLowerCase().includes(q) ||
      (item.studentName && item.studentName.toLowerCase().includes(q)) ||
      (item.transferMeta.fromUserName && item.transferMeta.fromUserName.toLowerCase().includes(q)) ||
      (item.transferMeta.trackingCode && item.transferMeta.trackingCode.toLowerCase().includes(q))
    );
  }, [receivedWorkItems, searchQuery]);

  const handleCompleteTask = (item: WorkItemSummary & { transferMeta: WorkTransferRecord }) => {
    try {
      workTransferService.markWorkItemCompleted(item.id, currentUserId, user?.name || 'Faculty Member');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to complete task.');
    }
  };

  const handleOpenWork = (item: WorkItemSummary) => {
    if (setActiveTab) {
      if (item.type === 'STUDENT_REQUEST') {
        setActiveTab('requests', { requestId: item.id });
      } else if (item.type === 'EDP_DUTY') {
        setActiveTab('edp-duties', { recordId: item.id });
      } else if (item.type === 'EXAM_VERIFICATION') {
        setActiveTab('exam-forms', { recordId: item.id });
      } else if (item.type === 'DOCUMENT_VERIFICATION') {
        setActiveTab('student-documents', { recordId: item.id });
      } else {
        setActiveTab('work-transfer');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      {/* ─── Header ─── */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #001F3F 0%, #0F2C59 100%)',
          color: '#FFFFFF',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 14px rgba(0, 31, 63, 0.25)',
          borderLeft: '5px solid #F37023'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Inbox size={24} color="#F37023" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Received Work / Inbound Delegations
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0 0' }}>
            Work responsibilities temporarily delegated to you by colleagues during their leave or absence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => setActiveTab && setActiveTab('work-transfer')}
            className="btn btn-secondary"
            style={{ background: '#FFFFFF', color: '#001F3F', fontWeight: 700, fontSize: '0.8125rem', padding: '0.45rem 0.9rem' }}
          >
            My Main Workload
          </button>
        </div>
      </div>

      {/* ─── Search & Metrics ─── */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#001F3F' }}>
              {receivedWorkItems.length} Delegated Work Items Active
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              across {activeIncomingTransfers.length} active transfer orders
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px', maxWidth: '360px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search received tasks, colleagues, tracking code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 11-Column Official Received Work Table ─── */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
          <Inbox size={40} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#001F3F' }}>No Received Work At This Time</h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '4px 0 0 0' }}>
            You currently have no active work responsibilities transferred to you from other faculty members.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
            <table style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#FFFFFF' }}>
                <tr>
                  {[
                    { label: 'Sr. No.', width: '65px', align: 'center' },
                    { label: 'Transfer ID', width: '120px', align: 'center' },
                    { label: 'Original Faculty', width: '160px', align: 'left' },
                    { label: 'Work Title', width: '220px', align: 'left' },
                    { label: 'Work Type', width: '130px', align: 'center' },
                    { label: 'Subject / Module', width: '150px', align: 'left' },
                    { label: 'Class / Program', width: '140px', align: 'left' },
                    { label: 'Received Date', width: '110px', align: 'center' },
                    { label: 'Effective Date', width: '110px', align: 'center' },
                    { label: 'Priority', width: '100px', align: 'center' },
                    { label: 'Status', width: '110px', align: 'center' },
                    { label: 'Action', width: '150px', align: 'center' }
                  ].map((col, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '0.75rem 0.6rem',
                        textAlign: col.align as any,
                        width: col.width,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.02em',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isCompleted = item.transferMeta.completedItemIds.includes(item.id);
                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0' 
                      }}
                    >
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: '#001F3F' }}>
                        <code>{item.transferMeta.trackingCode}</code>
                      </td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>
                        {item.transferMeta.fromUserName}
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 400 }}>
                          {item.transferMeta.fromUserDepartmentName || 'Department'}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#001F3F' }}>
                        {item.title}
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>
                          {item.description}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700, background: '#EFF6FF', color: '#1E40AF' }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        {item.module || '—'}
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        {item.programName || 'B.Tech CSE Sem 4'}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {item.transferMeta.startAt}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600 }}>
                        {item.transferMeta.endAt}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <Badge variant={item.priority === 'CRITICAL' ? 'danger' : 'orange'}>{item.priority}</Badge>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {isCompleted ? (
                          <Badge variant="success">COMPLETED</Badge>
                        ) : (
                          <Badge variant="active">IN PROGRESS</Badge>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          {!isCompleted && (
                            <button
                              onClick={() => handleCompleteTask(item)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.71875rem', padding: '0.25rem 0.55rem', background: '#059669', borderColor: '#059669' }}
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedHistoryWorkItem({ id: item.id, title: item.title })}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.71875rem', padding: '0.25rem 0.55rem' }}
                            title="View History"
                          >
                            <History size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment History Modal */}
      <WorkAssignmentHistoryModal
        isOpen={Boolean(selectedHistoryWorkItem)}
        onClose={() => setSelectedHistoryWorkItem(null)}
        workItemId={selectedHistoryWorkItem?.id || null}
        workItemTitle={selectedHistoryWorkItem?.title}
      />
    </div>
  );
};
