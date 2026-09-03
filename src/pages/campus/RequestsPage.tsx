import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentRequestService } from '../../services/studentRequestService';
import { exportToExcel } from '../../services/exportService';
import { StudentRequest, StudentRequestStatus } from '../../types/studentRequest';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import { StudentRequestModal } from '../../components/approval/StudentRequestModal';
import { StudentRequestDetailModal } from '../../components/approval/StudentRequestDetailModal';
import { 
  FileCheck, CheckCircle2, Clock, Plus, Filter, Search, ShieldCheck, 
  AlertCircle, Eye, Inbox, Send, CornerDownLeft, FileText, Download, RotateCcw,
  Sparkles, Layers, CheckCircle, XCircle, UserCheck, ArrowRight
} from 'lucide-react';

interface RequestsPageProps {
  initialCategory?: string;
  initialRecordId?: string;
  initialRequestId?: string;
  initialQueue?: 'ALL' | 'PENDING_MY_ACTION' | 'WITH_MENTOR' | 'WITH_DEPT' | 'COMPLETED' | 'REOPENED';
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ 
  initialCategory = 'ALL',
  initialRecordId,
  initialRequestId,
  initialQueue
}) => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const isFaculty = role === 'FACULTY';
  const isHod = role === 'HOD';

  const [activeQueueTab, setActiveQueueTab] = useState<'ALL' | 'PENDING_MY_ACTION' | 'WITH_MENTOR' | 'WITH_DEPT' | 'COMPLETED' | 'REOPENED'>(
    initialQueue || (isStudent ? 'ALL' : 'PENDING_MY_ACTION')
  );
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);

  React.useEffect(() => {
    if (initialCategory) {
      setFilterCategory(initialCategory);
    }
  }, [initialCategory]);

  React.useEffect(() => {
    if (initialQueue) {
      setActiveQueueTab(initialQueue);
    }
  }, [initialQueue]);

  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedStudentRequest, setSelectedStudentRequest] = useState<StudentRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Scoped Student Requests
  const allScopedRequests = useMemo(() => {
    return studentRequestService.getScopedRequests(user, role);
  }, [user, role, refreshKey]);

  // Deep-link Auto-Open Exact Request Record
  React.useEffect(() => {
    const targetId = initialRecordId || initialRequestId;
    if (targetId && allScopedRequests.length > 0) {
      const match = allScopedRequests.find(r => r.id === targetId || r.requestNo === targetId);
      if (match) {
        setSelectedStudentRequest(match);
      } else {
        showToast('error', 'This item is no longer available or you do not have permission to view it.');
      }
    }
  }, [initialRecordId, initialRequestId, allScopedRequests]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = allScopedRequests.length;
    const pendingMyAction = allScopedRequests.filter(r => {
      if (isStudent) return r.status === 'COMPLETED'; // Action: confirm or reopen
      if (isFaculty && r.currentHandler === 'MENTOR') return true; // Action: mentor route or complete
      if (isFaculty && r.currentHandler === 'SUBJECT_FACULTY') return true; // Action: work or resolve
      if (isHod && r.currentHandler === 'HOD') return true;
      return r.currentHandlerId === user?.id || r.currentHandlerRole === (role as any);
    }).length;

    const withMentor = allScopedRequests.filter(r => r.currentHandler === 'MENTOR').length;
    const withDept = allScopedRequests.filter(r => r.currentHandler === 'DEPARTMENT' || r.currentHandler === 'SUBJECT_FACULTY' || r.currentHandler === 'HOD' || r.currentHandler === 'HOI').length;
    const completed = allScopedRequests.filter(r => r.status === 'COMPLETED').length;
    const reopened = allScopedRequests.filter(r => r.status === 'REOPENED').length;

    return { total, pendingMyAction, withMentor, withDept, completed, reopened };
  }, [allScopedRequests, user, role, isStudent, isFaculty, isHod]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let list = allScopedRequests;

    if (activeQueueTab === 'PENDING_MY_ACTION') {
      list = list.filter(r => {
        if (isStudent) return r.status === 'COMPLETED';
        if (isFaculty && r.currentHandler === 'MENTOR') return true;
        if (isFaculty && r.currentHandler === 'SUBJECT_FACULTY') return true;
        if (isHod && r.currentHandler === 'HOD') return true;
        return r.currentHandlerId === user?.id || r.currentHandlerRole === (role as any);
      });
    } else if (activeQueueTab === 'WITH_MENTOR') {
      list = list.filter(r => r.currentHandler === 'MENTOR');
    } else if (activeQueueTab === 'WITH_DEPT') {
      list = list.filter(r => r.currentHandler === 'DEPARTMENT' || r.currentHandler === 'SUBJECT_FACULTY' || r.currentHandler === 'HOD' || r.currentHandler === 'HOI');
    } else if (activeQueueTab === 'COMPLETED') {
      list = list.filter(r => r.status === 'COMPLETED');
    } else if (activeQueueTab === 'REOPENED') {
      list = list.filter(r => r.status === 'REOPENED');
    }

    return list.filter(r => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          r.requestNo.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.enrollmentNo.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.mentorName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category
      if (filterCategory !== 'ALL' && r.category !== filterCategory) {
        return false;
      }

      // Priority
      if (filterPriority !== 'ALL' && r.priority !== filterPriority) {
        return false;
      }

      // Status
      if (filterStatus !== 'ALL' && r.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [allScopedRequests, activeQueueTab, searchQuery, filterCategory, filterPriority, filterStatus, user, role, isStudent, isFaculty, isHod]);

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      'Request No', 'Date', 'Student Name', 'Enrollment No', 'Department',
      'Category', 'Subject / Title', 'Assigned Mentor', 'Current Handler',
      'Priority', 'Status', 'Resolved At', 'Completed At'
    ];

    const rows = filteredRequests.map(r => [
      r.requestNo,
      new Date(r.createdAt).toLocaleDateString(),
      r.studentName,
      r.enrollmentNo,
      r.departmentName,
      r.category.replace(/_/g, ' '),
      r.subject,
      r.mentorName,
      r.currentHandlerName || r.currentHandler,
      r.priority,
      r.status,
      r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '-',
      r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '-'
    ]);

    exportToExcel('Student_Requests_Ledger', headers, rows, {}, { name: user?.name, role: user?.role });
    showToast('success', 'Student Requests exported to Excel successfully.');
  };

  const getStatusBadge = (status: StudentRequestStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'RETURNED_TO_MENTOR':
      case 'RESOLVED':
        return <Badge variant="gold">Returned to Mentor</Badge>;
      case 'WORK_IN_PROGRESS':
        return <Badge variant="active">Work In Progress</Badge>;
      case 'FORWARDED_TO_FACULTY':
      case 'WITH_FACULTY':
        return <Badge variant="active">With Subject Faculty</Badge>;
      case 'FORWARDED_TO_HOD':
      case 'WITH_HOD':
        return <Badge variant="warning">With HOD</Badge>;
      case 'FORWARDED_TO_HOI':
      case 'WITH_HOI':
        return <Badge variant="warning">With HOI (Principal)</Badge>;
      case 'FORWARDED_TO_DEPARTMENT':
      case 'WITH_DEPARTMENT':
        return <Badge variant="navy">With Department</Badge>;
      case 'REOPENED':
        return <Badge variant="danger">Reopened</Badge>;
      case 'RETURNED_FOR_REWORK':
        return <Badge variant="danger">Rework Requested</Badge>;
      default:
        return <Badge variant="navy">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          backgroundColor: toastMessage.type === 'success' ? 'var(--brand-green)' : 'var(--brand-red)',
          color: '#FFF',
          padding: '0.875rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      {isSubmitModalOpen && (
        <StudentRequestModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={() => {
            refreshData();
            showToast('success', 'Student request submitted directly to your Mentor.');
          }}
        />
      )}

      {selectedStudentRequest && (
        <StudentRequestDetailModal
          request={selectedStudentRequest}
          isOpen={Boolean(selectedStudentRequest)}
          onClose={() => setSelectedStudentRequest(null)}
          onRefresh={() => {
            refreshData();
            showToast('success', 'Request state updated successfully.');
          }}
        />
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UserCheck size={28} style={{ color: 'var(--brand-gold)' }} />
            Student Request Central Routing &amp; Escalation Portal
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {isStudent
              ? 'Submit academic, department, and campus requests. Every request is automatically routed to your assigned Mentor for controlled processing.'
              : 'Review mentee requests, perform controlled subject faculty/HOD routing, track department resolutions, and verify student problem closure.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary">
            <Download size={16} /> Export Ledger
          </button>
          
          {isStudent && (
            <button onClick={() => setIsSubmitModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Create New Request
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards (Single Horizontal Row) */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', paddingBottom: '2px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: '0.75rem', minWidth: '950px' }}>
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={FileText}
            colorScheme="navy"
            subtitle="All scoped student requests"
          />
          <StatCard
            title={isStudent ? "Awaiting Your Confirmation" : "Pending My Action"}
            value={stats.pendingMyAction}
            icon={Clock}
            colorScheme="gold"
            subtitle={isStudent ? "Requests marked completed" : "Action required on your desk"}
          />
          <StatCard
            title="With Mentor"
            value={stats.withMentor}
            icon={UserCheck}
            colorScheme="orange"
            subtitle="Initial routing / review"
          />
          <StatCard
            title="Completed & Verified"
            value={stats.completed}
            icon={CheckCircle2}
            colorScheme="green"
            subtitle="Closed by Mentor / Student"
          />
          <StatCard
            title="Reopened Requests"
            value={stats.reopened}
            icon={RotateCcw}
            colorScheme="blue"
            subtitle="Unresolved / Returned"
          />
        </div>
      </div>

      {/* Queue Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveQueueTab('ALL')}
          className={`btn ${activeQueueTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          All Requests ({allScopedRequests.length})
        </button>

        <button
          onClick={() => setActiveQueueTab('PENDING_MY_ACTION')}
          className={`btn ${activeQueueTab === 'PENDING_MY_ACTION' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          <Clock size={14} /> Action Required ({stats.pendingMyAction})
        </button>

        <button
          onClick={() => setActiveQueueTab('WITH_MENTOR')}
          className={`btn ${activeQueueTab === 'WITH_MENTOR' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          With Mentor ({stats.withMentor})
        </button>

        <button
          onClick={() => setActiveQueueTab('WITH_DEPT')}
          className={`btn ${activeQueueTab === 'WITH_DEPT' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          With Dept / Faculty ({stats.withDept})
        </button>

        <button
          onClick={() => setActiveQueueTab('COMPLETED')}
          className={`btn ${activeQueueTab === 'COMPLETED' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          Completed ({stats.completed})
        </button>

        <button
          onClick={() => setActiveQueueTab('REOPENED')}
          className={`btn ${activeQueueTab === 'REOPENED' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          Reopened ({stats.reopened})
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', backgroundColor: '#FFF', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Request No, Student, Subject, Mentor..."
            className="input-field"
            style={{ width: '100%', paddingLeft: '2.25rem' }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input-field"
          style={{ minWidth: '160px', flex: '0 1 auto' }}
        >
          <option value="ALL">All Categories</option>
          <option value="SUBJECT_RELATED">Subject Related</option>
          <option value="ACADEMIC">Academic</option>
          <option value="ATTENDANCE">Attendance</option>
          <option value="EXAMINATION">Examination</option>
          <option value="FEES">Fees & Accounts</option>
          <option value="HOSTEL">Hostel</option>
          <option value="TRANSPORT">Transport</option>
          <option value="IT_SUPPORT">IT Support</option>
          <option value="COMPLAINT">Complaint</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="input-field"
          style={{ minWidth: '140px', flex: '0 1 auto' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-field"
          style={{ minWidth: '160px', flex: '0 1 auto' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="WITH_MENTOR">With Mentor</option>
          <option value="FORWARDED_TO_FACULTY">With Faculty</option>
          <option value="FORWARDED_TO_HOD">With HOD</option>
          <option value="FORWARDED_TO_DEPARTMENT">With Department</option>
          <option value="WORK_IN_PROGRESS">Work In Progress</option>
          <option value="RETURNED_TO_MENTOR">Returned to Mentor</option>
          <option value="COMPLETED">Completed</option>
          <option value="REOPENED">Reopened</option>
        </select>
      </div>

      {/* Requests Table */}
      <ExcelTableContainer minWidth="1200px">
        <ExcelTable>
          <thead>
            <tr>
              <ExcelTh align="left" style={{ minWidth: '130px' }}>Request No</ExcelTh>
              <ExcelTh align="left" style={{ minWidth: '220px' }}>Student Details</ExcelTh>
              <ExcelTh align="center" style={{ minWidth: '140px' }}>Category</ExcelTh>
              <ExcelTh align="left" style={{ minWidth: '240px' }}>Subject</ExcelTh>
              <ExcelTh align="left" style={{ minWidth: '160px' }}>Assigned Mentor</ExcelTh>
              <ExcelTh align="left" style={{ minWidth: '170px' }}>Current Desk</ExcelTh>
              <ExcelTh align="center" style={{ minWidth: '95px' }}>Priority</ExcelTh>
              <ExcelTh align="center" style={{ minWidth: '140px' }}>Status</ExcelTh>
              <ExcelTh align="center" style={{ minWidth: '130px' }}>Actions</ExcelTh>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <ExcelTd colSpan={9} align="center" style={{ padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <UserCheck size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--border-color)', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--brand-navy)' }}>No student requests found in this view</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem' }}>Try adjusting your search query or tab filters</p>
                </ExcelTd>
              </tr>
            ) : (
              filteredRequests.map(r => (
                <tr key={r.id}>
                  <ExcelTd align="left" mono color="#1E40AF">
                    <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{r.requestNo}</span>
                  </ExcelTd>

                  <ExcelTd align="left">
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.15rem' }}>
                      {r.studentName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {r.enrollmentNo} • {r.departmentName}
                    </div>
                  </ExcelTd>

                  <ExcelTd align="center">
                    <Badge variant="navy">
                      {r.category.replace(/_/g, ' ')}
                    </Badge>
                  </ExcelTd>

                  <ExcelTd align="left">
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {r.subject}
                    </div>
                    {r.subjectCode && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Subject Code: {r.subjectCode}
                      </div>
                    )}
                  </ExcelTd>

                  <ExcelTd align="left" bold color="var(--brand-green)">
                    {r.mentorName || 'Not Assigned'}
                  </ExcelTd>

                  <ExcelTd align="left">
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-navy)', display: 'block' }}>
                      {r.currentHandlerName || r.currentHandler.replace(/_/g, ' ')}
                    </span>
                    {r.currentHandlerRole && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({r.currentHandlerRole})
                      </span>
                    )}
                  </ExcelTd>

                  <ExcelTd align="center">
                    <Badge variant={r.priority === 'URGENT' ? 'danger' : r.priority === 'HIGH' ? 'warning' : 'navy'}>
                      {r.priority}
                    </Badge>
                  </ExcelTd>

                  <ExcelTd align="center">
                    {getStatusBadge(r.status)}
                  </ExcelTd>

                  <ExcelTd align="center">
                    <button
                      onClick={() => setSelectedStudentRequest(r)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                    >
                      <Eye size={13} /> View &amp; Action
                    </button>
                  </ExcelTd>
                </tr>
              ))
            )}
          </tbody>
        </ExcelTable>
      </ExcelTableContainer>

    </div>
  );
};
