import React, { useState, useMemo } from 'react';
import { StudentSectionRequest, StudentSectionRequestStatus, StudentServiceCategory } from '../../types/studentSection';
import { User } from '../../types';
import { studentSectionService } from '../../services/studentSectionService';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { RejectRequestModal } from './RejectRequestModal';
import { OfficialDocumentViewerModal } from './OfficialDocumentViewerModal';
import { 
  Search, Filter, CheckCircle2, Clock, XCircle, AlertCircle, 
  Eye, FileText, ArrowUpDown, ArrowUp, ArrowDown, UserCheck, 
  Play, Award, Check, RefreshCw, ChevronLeft, ChevronRight, X,
  ShieldCheck, Send, Layers, QrCode
} from 'lucide-react';

interface StaffServiceQueueViewProps {
  requests: StudentSectionRequest[];
  currentUser: User;
  onRefresh: () => void;
  onShowToast: (type: 'success' | 'error', text: string) => void;
}

type StaffSortField = 'requestNo' | 'createdAt' | 'studentName' | 'serviceName' | 'departmentName' | 'status' | 'isUrgent' | 'workingDaysDueDate' | 'paymentStatus';

export const StaffServiceQueueView: React.FC<StaffServiceQueueViewProps> = ({
  requests,
  currentUser,
  onRefresh,
  onShowToast
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<StaffSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Request Modals
  const [reviewingRequest, setReviewingRequest] = useState<StudentSectionRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<StudentSectionRequest | null>(null);
  const [viewingDocRequest, setViewingDocRequest] = useState<StudentSectionRequest | null>(null);

  const handleSort = (field: StaffSortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      const matchesPriority = priorityFilter === 'ALL' || (priorityFilter === 'URGENT' ? r.isUrgent : !r.isUrgent);
      const matchesPayment = paymentFilter === 'ALL' || r.paymentStatus === paymentFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        r.requestNo.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.enrollmentNo.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q);

      return matchesStatus && matchesCategory && matchesPriority && matchesPayment && matchesSearch;
    });
  }, [requests, statusFilter, categoryFilter, priorityFilter, paymentFilter, searchQuery]);

  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let comp = 0;
      if (sortField === 'requestNo') comp = a.requestNo.localeCompare(b.requestNo);
      else if (sortField === 'createdAt') comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === 'studentName') comp = a.studentName.localeCompare(b.studentName);
      else if (sortField === 'serviceName') comp = a.serviceName.localeCompare(b.serviceName);
      else if (sortField === 'departmentName') comp = a.departmentName.localeCompare(b.departmentName);
      else if (sortField === 'status') comp = a.status.localeCompare(b.status);
      else if (sortField === 'isUrgent') comp = (a.isUrgent ? 1 : 0) - (b.isUrgent ? 1 : 0);
      else if (sortField === 'paymentStatus') comp = a.paymentStatus.localeCompare(b.paymentStatus);
      else if (sortField === 'workingDaysDueDate') comp = (a.workingDaysDueDate || '').localeCompare(b.workingDaysDueDate || '');

      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredRequests, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, currentPage, pageSize]);

  // Lifecycle Action Handlers
  const handleAccept = (req: StudentSectionRequest) => {
    try {
      studentSectionService.acceptRequest(req.id, currentUser);
      onRefresh();
      onShowToast('success', `Request ${req.requestNo} accepted and moved to UNDER REVIEW.`);
      if (reviewingRequest?.id === req.id) {
        setReviewingRequest(studentSectionService.getRequestById(req.id) || null);
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to accept request.');
    }
  };

  const handleStartProcessing = (req: StudentSectionRequest) => {
    try {
      studentSectionService.startProcessingRequest(req.id, currentUser);
      onRefresh();
      onShowToast('success', `Processing initiated for ${req.requestNo}. Working-day due date scheduled.`);
      if (reviewingRequest?.id === req.id) {
        setReviewingRequest(studentSectionService.getRequestById(req.id) || null);
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to start processing.');
    }
  };

  const handleGenerateDoc = (req: StudentSectionRequest) => {
    try {
      const { document } = studentSectionService.generateOfficialDocument(req.id, currentUser);
      onRefresh();
      onShowToast('success', `Official document ${document.documentNo} generated! Status updated to DOCUMENT READY.`);
      if (reviewingRequest?.id === req.id) {
        setReviewingRequest(studentSectionService.getRequestById(req.id) || null);
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to generate document.');
    }
  };

  const handleMarkCollected = (req: StudentSectionRequest) => {
    try {
      studentSectionService.markDocumentCollected(req.id, currentUser);
      onRefresh();
      onShowToast('success', `Document for ${req.requestNo} marked as collected. Request completed!`);
      if (reviewingRequest?.id === req.id) {
        setReviewingRequest(studentSectionService.getRequestById(req.id) || null);
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to mark as collected.');
    }
  };

  const getStatusBadge = (status: StudentSectionRequestStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="navy">SUBMITTED</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="purple">UNDER REVIEW</Badge>;
      case 'PROCESSING':
        return <Badge variant="active">PROCESSING</Badge>;
      case 'DOCUMENT_READY':
      case 'READY':
        return <Badge variant="success">DOCUMENT READY</Badge>;
      case 'COMPLETED':
      case 'COLLECTED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      case 'PAYMENT_PENDING':
        return <Badge variant="gold">PAYMENT PENDING</Badge>;
      default:
        return <Badge variant="navy">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* ── EXCEL-STYLE STAFF QUEUE CARD CONTAINER ──────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Top Queue Banner */}
        <div style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color="var(--brand-orange)" />
              Student Section Staff Operations &amp; Verification Queue
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Verify student eligibility, process certificates &amp; transcripts, and issue verified digital documents
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '4px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              Queue Total: <strong>{filteredRequests.length}</strong> applications
            </span>
          </div>
        </div>

        {/* Multi-Filter & Search Toolbar */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #CBD5E1',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.625rem'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search request no, student, enrollment..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                height: '32px',
                paddingLeft: '30px',
                paddingRight: '24px',
                fontSize: '0.8125rem',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F2C59'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.75rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F2C59',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted (New)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PROCESSING">Processing</option>
              <option value="DOCUMENT_READY">Document Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
            </select>

            {/* Service Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.75rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F2C59',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Service Types</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="TRANSCRIPT">Transcript</option>
              <option value="DEGREE">Degree</option>
              <option value="MIGRATION">Migration</option>
              <option value="TRANSFER">Transfer (TC)</option>
              <option value="DUPLICATE_ID">Duplicate ID</option>
              <option value="VERIFICATION">Verification</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.75rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F2C59',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="STANDARD">Standard SLA</option>
              <option value="URGENT">Urgent Priority ⚡</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={e => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
              style={{
                height: '32px',
                fontSize: '0.75rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F2C59',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending Payment</option>
              <option value="NOT_REQUIRED">Free / Not Required</option>
            </select>

            {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || paymentFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                  setPriorityFilter('ALL');
                  setPaymentFilter('ALL');
                  setCurrentPage(1);
                }}
                style={{ height: '32px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* ── EXCEL-STYLE DATA TABLE ── */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8125rem',
            textAlign: 'left',
            background: '#FFFFFF',
            minWidth: '1350px'
          }}>
            <thead>
              <tr style={{
                background: '#F1F5F9',
                color: '#0F2C59',
                borderBottom: '2px solid #CBD5E1'
              }}>
                <th onClick={() => handleSort('requestNo')} style={{ padding: '9px 10px', width: '130px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Request No. {sortField === 'requestNo' ? (sortOrder === 'asc' ? <ArrowUp size={11} color="#F37023" /> : <ArrowDown size={11} color="#F37023" />) : <ArrowUpDown size={11} color="#94A3B8" />}
                  </div>
                </th>

                <th onClick={() => handleSort('createdAt')} style={{ padding: '9px 10px', width: '105px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Applied On {sortField === 'createdAt' ? (sortOrder === 'asc' ? <ArrowUp size={11} color="#F37023" /> : <ArrowDown size={11} color="#F37023" />) : <ArrowUpDown size={11} color="#94A3B8" />}
                  </div>
                </th>

                <th style={{ padding: '9px 10px', width: '115px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0' }}>
                  Student ID
                </th>

                <th onClick={() => handleSort('studentName')} style={{ padding: '9px 12px', width: '200px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Student Name {sortField === 'studentName' ? (sortOrder === 'asc' ? <ArrowUp size={11} color="#F37023" /> : <ArrowDown size={11} color="#F37023" />) : <ArrowUpDown size={11} color="#94A3B8" />}
                  </div>
                </th>

                <th onClick={() => handleSort('serviceName')} style={{ padding: '9px 12px', width: '210px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Service {sortField === 'serviceName' ? (sortOrder === 'asc' ? <ArrowUp size={11} color="#F37023" /> : <ArrowDown size={11} color="#F37023" />) : <ArrowUpDown size={11} color="#94A3B8" />}
                  </div>
                </th>

                <th onClick={() => handleSort('departmentName')} style={{ padding: '9px 10px', width: '160px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  Department
                </th>

                <th onClick={() => handleSort('isUrgent')} style={{ padding: '9px 8px', width: '90px', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  Priority
                </th>

                <th onClick={() => handleSort('paymentStatus')} style={{ padding: '9px 10px', width: '110px', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  Payment
                </th>

                <th onClick={() => handleSort('status')} style={{ padding: '9px 10px', width: '130px', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  Status
                </th>

                <th onClick={() => handleSort('workingDaysDueDate')} style={{ padding: '9px 10px', width: '115px', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  SLA / Due
                </th>

                <th style={{ padding: '9px 10px', width: '170px', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <FileText size={36} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-navy)' }}>No service requests match the current filters</div>
                    <div style={{ fontSize: '0.78125rem', marginTop: '4px' }}>Try switching filter tabs or searching with different criteria.</div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, idx) => {
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={req.id}
                      style={{
                        background: isEven ? '#F8FAFC' : '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = isEven ? '#F8FAFC' : '#FFFFFF')}
                    >
                      {/* Request No */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F2C59', fontSize: '0.78125rem' }}>
                          {req.requestNo}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Enrollment No. */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>
                        {req.enrollmentNo}
                      </td>

                      {/* Student Name */}
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0' }}>
                        <strong style={{ color: '#0F2C59', fontSize: '0.8125rem' }}>{req.studentName}</strong>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{req.email}</div>
                      </td>

                      {/* Service */}
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.8125rem' }}>{req.serviceName}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {req.copies} {req.copies > 1 ? 'copies' : 'copy'} • Physical Hardcopy
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569' }}>
                        {req.departmentName}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '8px 8px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {req.isUrgent ? (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                            URGENT ⚡
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B' }}>
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {req.calculatedFee === 0 ? (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>FREE</span>
                        ) : req.paymentStatus === 'PAID' ? (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>PAID (₹{req.calculatedFee})</span>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>PENDING</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {getStatusBadge(req.status)}
                      </td>

                      {/* SLA / Due */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#0F2C59', fontWeight: 700 }}>
                        {req.workingDaysDueDate || req.expectedCompletionDate || '3 Days'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setReviewingRequest(req)}
                            style={{ padding: '3px 7px', fontSize: '0.71875rem', fontWeight: 700 }}
                            title="Review complete application"
                          >
                            <Eye size={12} /> Review
                          </button>

                          {req.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleAccept(req)}
                              style={{ padding: '3px 7px', fontSize: '0.71875rem', fontWeight: 700, background: '#1E40AF', borderColor: '#1E40AF' }}
                              title="Accept request"
                            >
                              <Check size={12} /> Accept
                            </button>
                          )}

                          {req.status === 'UNDER_REVIEW' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleStartProcessing(req)}
                              style={{ padding: '3px 7px', fontSize: '0.71875rem', fontWeight: 700, background: 'var(--brand-orange)', borderColor: 'var(--brand-orange)' }}
                              title="Start administrative processing"
                            >
                              <Play size={12} /> Process
                            </button>
                          )}

                          {req.status === 'PROCESSING' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleGenerateDoc(req)}
                              style={{ padding: '3px 7px', fontSize: '0.71875rem', fontWeight: 700, background: '#16A34A', borderColor: '#16A34A' }}
                              title="Generate verified official document"
                            >
                              <Award size={12} /> Generate
                            </button>
                          )}

                          {req.status === 'DOCUMENT_READY' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleMarkCollected(req)}
                              style={{ padding: '3px 7px', fontSize: '0.71875rem', fontWeight: 700, background: '#047857', borderColor: '#047857' }}
                              title="Mark document collected by student"
                            >
                              <CheckCircle2 size={12} /> Handover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{
          background: '#F8FAFC',
          borderTop: '1px solid #CBD5E1',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          color: '#475569'
        }}>
          <div>
            Showing <strong>{filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredRequests.length)}</strong> of <strong>{filteredRequests.length}</strong> applications
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Rows:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ height: '26px', fontSize: '0.75rem', padding: '0 4px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 4px' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL: COMPREHENSIVE APPLICATION REVIEW & WORKFLOW ACTIONS ──────── */}
      {reviewingRequest && (
        <Modal
          isOpen={Boolean(reviewingRequest)}
          onClose={() => setReviewingRequest(null)}
          title={`Review Application: ${reviewingRequest.requestNo}`}
          subtitle={`Applied: ${new Date(reviewingRequest.createdAt).toLocaleString('en-IN')} • Service: ${reviewingRequest.serviceName}`}
          maxWidth="840px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Status & Priority Ribbon */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '0.875rem 1.15rem',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Current Application Status:</div>
                <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getStatusBadge(reviewingRequest.status)}
                  {reviewingRequest.isUrgent && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706' }}>
                      URGENT SLA (1 DAY)
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Financial Clearance:</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: reviewingRequest.paymentStatus === 'PAID' ? '#16A34A' : '#0F2C59' }}>
                  {reviewingRequest.calculatedFee === 0 ? 'FREE OF CHARGE' : `${reviewingRequest.paymentStatus} (₹${reviewingRequest.calculatedFee})`}
                </div>
                {reviewingRequest.receiptNo && (
                  <div style={{ fontSize: '0.6875rem', color: '#047857', fontFamily: 'monospace' }}>
                    Receipt: {reviewingRequest.receiptNo}
                  </div>
                )}
              </div>
            </div>

            {/* Read-Only Student Master Information */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                Student Profile Master Data (Read Only)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.78125rem' }}>
                <div><span style={{ color: '#64748B' }}>Student:</span> <strong>{reviewingRequest.studentName}</strong></div>
                <div><span style={{ color: '#64748B' }}>Enrollment:</span> <strong style={{ fontFamily: 'monospace' }}>{reviewingRequest.enrollmentNo}</strong></div>
                <div><span style={{ color: '#64748B' }}>Admission No:</span> <strong style={{ fontFamily: 'monospace' }}>{reviewingRequest.admissionNo || 'ADM-2026-0089'}</strong></div>
                <div><span style={{ color: '#64748B' }}>Department:</span> <strong>{reviewingRequest.departmentName}</strong></div>
                <div><span style={{ color: '#64748B' }}>Program:</span> <strong>{reviewingRequest.programName}</strong></div>
                <div><span style={{ color: '#64748B' }}>Semester:</span> <strong>{reviewingRequest.semesterName || 'Semester 4'}</strong></div>
              </div>
            </div>

            {/* Service-Specific Application Data */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                Service Information &amp; Student Purpose
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#1E293B', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748B' }}>Application Purpose:</span><br />
                <strong style={{ fontSize: '0.875rem' }}>{reviewingRequest.purpose}</strong>
              </div>

              {reviewingRequest.serviceSpecificData && Object.keys(reviewingRequest.serviceSpecificData).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.78125rem', background: '#F8FAFC', padding: '0.625rem', borderRadius: '6px' }}>
                  {Object.entries(reviewingRequest.serviceSpecificData)
                    .filter(([key]) => !['feeBreakdown', 'baseFee', 'perCopyFee', 'additionalCopiesCount', 'copiesFeeTotal', 'urgentFee', 'postalCharges'].includes(key))
                    .map(([key, val]) => (
                      <div key={key}>
                        <span style={{ color: '#64748B', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                        <strong>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</strong>
                      </div>
                    ))}
                </div>
              )}

              {/* Fee Master Assessment Particulars */}
              {reviewingRequest.serviceSpecificData?.feeBreakdown && (
                <div style={{ marginTop: '0.75rem', background: '#F1F5F9', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Fee Master Assessment Ledger:
                  </div>
                  {reviewingRequest.serviceSpecificData.feeBreakdown.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0', color: '#334155' }}>
                      <span>{item.head}</span>
                      <strong style={{ fontFamily: 'monospace' }}>{item.qty} • ₹{item.amount}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uploaded Documents Verification */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                Attached Supporting Documents ({reviewingRequest.attachments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {reviewingRequest.attachments.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F8FAFC', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#0F2C59" />
                      <strong>{doc.name}</strong>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-xs" style={{ padding: '2px 8px', fontSize: '0.71875rem' }}>
                      <Eye size={11} /> View Attachment
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Timeline */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
                Application Audit Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {reviewingRequest.timeline.map((t, idx) => (
                  <div key={t.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#EEF2FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.625rem', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div><strong>{t.action.replace(/_/g, ' ')}</strong> • <span style={{ color: '#64748B' }}>{new Date(t.timestamp).toLocaleString('en-IN')}</span></div>
                      <div style={{ color: '#334155' }}>{t.remarks}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>By: {t.fromUserName} ({t.fromUserRole})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Action Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {reviewingRequest.status !== 'REJECTED' && reviewingRequest.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      const req = reviewingRequest;
                      setReviewingRequest(null);
                      setRejectingRequest(req);
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    <XCircle size={14} /> Reject Application
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setReviewingRequest(null)}
                >
                  Close
                </button>

                {reviewingRequest.status === 'SUBMITTED' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAccept(reviewingRequest)}
                    style={{ background: '#1E40AF', borderColor: '#1E40AF', fontWeight: 800 }}
                  >
                    <Check size={14} /> Accept Request &amp; Move to Review
                  </button>
                )}

                {reviewingRequest.status === 'UNDER_REVIEW' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStartProcessing(reviewingRequest)}
                    style={{ background: 'var(--brand-orange)', borderColor: 'var(--brand-orange)', fontWeight: 800 }}
                  >
                    <Play size={14} /> Start Official Processing
                  </button>
                )}

                {reviewingRequest.status === 'PROCESSING' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleGenerateDoc(reviewingRequest)}
                    style={{ background: '#16A34A', borderColor: '#16A34A', fontWeight: 800 }}
                  >
                    <Award size={14} /> Generate &amp; Issue Official Document
                  </button>
                )}

                {reviewingRequest.documentNo && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setViewingDocRequest(reviewingRequest);
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    <Award size={14} /> View Generated Document
                  </button>
                )}

                {reviewingRequest.status === 'DOCUMENT_READY' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleMarkCollected(reviewingRequest)}
                    style={{ background: '#047857', borderColor: '#047857', fontWeight: 800 }}
                  >
                    <CheckCircle2 size={14} /> Mark Document Handed Over
                  </button>
                )}
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {rejectingRequest && (
        <RejectRequestModal
          isOpen={Boolean(rejectingRequest)}
          onClose={() => setRejectingRequest(null)}
          request={rejectingRequest}
          staffUser={currentUser}
          onSuccess={() => {
            onRefresh();
            onShowToast('success', `Request ${rejectingRequest.requestNo} has been officially rejected.`);
          }}
        />
      )}

      {/* Generated Document Viewer Modal */}
      {viewingDocRequest && viewingDocRequest.documentNo && (
        <OfficialDocumentViewerModal
          isOpen={Boolean(viewingDocRequest)}
          onClose={() => setViewingDocRequest(null)}
          document={{
            id: viewingDocRequest.documentId || 'doc-1',
            documentNo: viewingDocRequest.documentNo,
            requestId: viewingDocRequest.id,
            requestNo: viewingDocRequest.requestNo,
            studentId: viewingDocRequest.studentId,
            studentName: viewingDocRequest.studentName,
            enrollmentNo: viewingDocRequest.enrollmentNo,
            departmentName: viewingDocRequest.departmentName,
            programName: viewingDocRequest.programName,
            serviceName: viewingDocRequest.serviceName,
            title: `Official ${viewingDocRequest.serviceName}`,
            fileUrl: viewingDocRequest.documentUrl || '#',
            fileType: 'PDF',
            generatedBy: viewingDocRequest.assignedStaffId || 'staff-1',
            generatedByName: viewingDocRequest.assignedStaffName || 'Registrar Office',
            generatedAt: viewingDocRequest.documentIssuedAt || new Date().toISOString(),
            version: 1,
            verificationCode: `SSIU-VERIFY-${viewingDocRequest.enrollmentNo}-2026`,
            status: 'ACTIVE',
            downloadsCount: 1
          }}
          request={viewingDocRequest}
        />
      )}

    </div>
  );
};
