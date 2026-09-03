import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Student, StudentDataChangeRequest, DataChangeCategory, DataChangeStatus } from '../../types';
import { studentDataChangeRequestService } from '../../services/studentDataChangeRequestService';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { StudentDataChangeRequestModal } from './StudentDataChangeRequestModal';
import { StudentDataChangeDetailModal } from './StudentDataChangeDetailModal';
import { 
  FileText, Plus, Search, Filter, Download, 
  Clock, CheckCircle, XCircle, ArrowRight, ShieldCheck, 
  RotateCcw, Eye, HelpCircle, Layers, CheckCircle2, CornerDownLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentDataChangeTabProps {
  student?: Student | null; // If viewing inside specific student profile
  initialStatusFilter?: string;
  isQueueMode?: boolean; // Mentor or HOD review queue mode
}

export const StudentDataChangeTab: React.FC<StudentDataChangeTabProps> = ({
  student,
  initialStatusFilter = 'ALL',
  isQueueMode = false,
}) => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const isMentor = role === 'FACULTY' || (role as string) === 'MENTOR';
  const isHOD = role === 'HOD';

  const [activeQueueTab, setActiveQueueTab] = useState<string>(initialStatusFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<StudentDataChangeRequest | null>(null);

  const refreshData = () => {
    setRefreshKey(k => k + 1);
  };

  // Metrics
  const stats = useMemo(() => {
    return studentDataChangeRequestService.getDashboardStats(user, role);
  }, [user, role, refreshKey]);

  // Scoped list
  const requests = useMemo(() => {
    return studentDataChangeRequestService.getScopedRequests(user, role, {
      status: activeQueueTab === 'PENDING_MY_ACTION' ? undefined : activeQueueTab,
      fieldCategory: selectedCategory,
      studentId: student?.id,
      search: searchQuery,
    });
  }, [user, role, activeQueueTab, selectedCategory, searchQuery, student, refreshKey]);

  // Filtered by "Pending My Action" if selected
  const displayRequests = useMemo(() => {
    if (activeQueueTab === 'PENDING_MY_ACTION') {
      if (isMentor) {
        return requests.filter(r => r.status === 'MENTOR_PENDING' || r.status === 'SUBMITTED' || r.status === 'SENT_BACK');
      }
      if (isHOD) {
        return requests.filter(r => r.status === 'HOD_PENDING' || r.status === 'MENTOR_APPROVED');
      }
      if (isStudent) {
        return requests.filter(r => r.status === 'SENT_BACK');
      }
    }
    return requests;
  }, [requests, activeQueueTab, isMentor, isHOD, isStudent]);

  // Target student for create modal
  const targetStudentForCreate = useMemo<Student | null>(() => {
    if (student) return student;
    if (isStudent && user) {
      return db.getStudents().find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo) || null;
    }
    return db.getStudents()[0] || null;
  }, [student, isStudent, user]);

  const handleExportExcel = () => {
    const exportData = displayRequests.map(r => ({
      'Request No': r.requestNo,
      'Student Name': r.studentName,
      'Enrollment No': r.enrollmentNo,
      'Department': r.departmentName || '',
      'Category': r.fieldCategory,
      'Field': r.fieldLabel,
      'Old Value': r.oldValue || '',
      'Requested Value': r.newValue,
      'Reason': r.reason,
      'Status': r.status,
      'Mentor': r.mentorName || '',
      'Mentor Remarks': r.mentorRemarks || '',
      'HOD': r.hodName || '',
      'HOD Remarks': r.hodRemarks || '',
      'Created Date': r.createdAt ? r.createdAt.slice(0, 10) : '',
      'Completed Date': r.completedAt ? r.completedAt.slice(0, 10) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Change Requests');
    XLSX.writeFile(wb, `Student_Data_Change_Requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusBadge = (status: DataChangeStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="active">APPROVED &amp; APPLIED</Badge>;
      case 'MENTOR_PENDING':
      case 'SUBMITTED':
        return <Badge variant="orange">MENTOR REVIEW PENDING</Badge>;
      case 'HOD_PENDING':
      case 'MENTOR_APPROVED':
        return <Badge variant="gold">HOD FINAL APPROVAL PENDING</Badge>;
      case 'REJECTED_BY_MENTOR':
        return <Badge variant="danger">REJECTED BY MENTOR</Badge>;
      case 'REJECTED_BY_HOD':
        return <Badge variant="danger">REJECTED BY HOD</Badge>;
      case 'SENT_BACK':
        return <Badge variant="orange">SENT BACK</Badge>;
      case 'CANCELLED':
        return <Badge variant="inactive">CANCELLED</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <StatCard
          title="Total Change Requests"
          value={stats.total}
          icon={FileText}
          subtitle="All time requests"
          colorScheme="navy"
        />
        <StatCard
          title="Mentor Pending"
          value={stats.mentorPending}
          icon={Clock}
          subtitle="Awaiting Mentor Review"
          colorScheme="orange"
        />
        <StatCard
          title="HOD Pending"
          value={stats.hodPending}
          icon={ShieldCheck}
          subtitle="Awaiting Final HOD Approval"
          colorScheme="gold"
        />
        <StatCard
          title="Approved &amp; Applied"
          value={stats.approved}
          icon={CheckCircle}
          subtitle="Master records updated"
          colorScheme="green"
        />
        <StatCard
          title="Returned / Sent Back"
          value={stats.sentBack}
          icon={CornerDownLeft}
          subtitle="Needs student correction"
          colorScheme="orange"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          subtitle="Mentor or HOD rejected"
          colorScheme="navy"
        />
      </div>

      {/* 2. Controls & Actions Bar */}
      <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface, #FFFFFF)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by Request No, Student, Enrollment, Field..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
            >
              <option value="ALL">All Categories</option>
              <option value="PERSONAL">Personal Details</option>
              <option value="CONTACT">Contact Info</option>
              <option value="PARENT">Parents / Guardian</option>
              <option value="ACADEMIC">Academic Details</option>
              <option value="OTHER">Other Master Info</option>
            </select>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
            >
              <Download size={14} /> Export Excel
            </button>

            {/* Submit Request Button (for student or authorized users) */}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
            >
              <Plus size={14} /> New Change Request
            </button>
          </div>
        </div>

        {/* 3. Sub-Queue Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', marginTop: '0.85rem', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING_MY_ACTION', label: isMentor ? 'My Mentor Queue' : isHOD ? 'My HOD Queue' : 'Action Required' },
            { id: 'MENTOR_PENDING', label: 'Mentor Pending' },
            { id: 'HOD_PENDING', label: 'HOD Pending' },
            { id: 'APPROVED', label: 'Approved & Applied' },
            { id: 'SENT_BACK', label: 'Sent Back' },
            { id: 'REJECTED_BY_MENTOR', label: 'Mentor Rejected' },
            { id: 'REJECTED_BY_HOD', label: 'HOD Rejected' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveQueueTab(tab.id)}
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: activeQueueTab === tab.id ? 800 : 600,
                color: activeQueueTab === tab.id ? 'var(--brand-orange, #F37023)' : 'var(--text-muted, #64748B)',
                borderBottom: activeQueueTab === tab.id ? '2px solid var(--brand-orange, #F37023)' : '2px solid transparent',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Requests Data Table */}
      <div className="card" style={{ padding: '0', background: 'var(--bg-surface, #FFFFFF)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Request ID</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Student Details</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Field to Update</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Current &rarr; Requested Value</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted, #64748B)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={32} color="#CBD5E1" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>No student data change requests found.</span>
                      <span style={{ fontSize: '0.75rem' }}>Try adjusting your filters or submit a new change request.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRequests.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--border-light, #F1F5F9)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onClick={() => setSelectedRequestForDetail(r)}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>
                        {r.requestNo}
                      </code>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)', display: 'block' }}>
                        {r.studentName}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        {r.enrollmentNo} • {r.departmentName || 'Computer Eng'}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#E2E8F0',
                          color: '#334155'
                        }}>
                          {r.fieldCategory}
                        </span>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)' }}>
                          {r.fieldLabel}
                        </strong>
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#64748B', textDecoration: 'line-through' }}>{r.oldValue || '(empty)'}</span>
                        <ArrowRight size={12} color="var(--brand-orange, #F37023)" />
                        <span style={{ color: '#047857', fontWeight: 800 }}>{r.newValue}</span>
                      </div>
                      {r.attachmentName && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <FileText size={11} /> {r.attachmentName}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getStatusBadge(r.status)}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '2026-08-20'}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        onClick={() => setSelectedRequestForDetail(r)}
                      >
                        <Eye size={13} /> View &amp; Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create Request Modal */}
      <StudentDataChangeRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        student={targetStudentForCreate}
        onSuccess={refreshData}
      />

      {/* 6. Detail & Review Action Modal */}
      <StudentDataChangeDetailModal
        isOpen={Boolean(selectedRequestForDetail)}
        onClose={() => setSelectedRequestForDetail(null)}
        request={selectedRequestForDetail}
        onActionComplete={refreshData}
      />

    </div>
  );
};
