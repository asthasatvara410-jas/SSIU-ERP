import React from 'react';
import { Badge } from '../common/Badge';
import { ApprovalOfficeType, ApprovalPriority, ApprovalStatus } from '../../types';

export const getOfficeLabel = (office: ApprovalOfficeType): string => {
  switch (office) {
    case 'REGISTRAR': return 'Registrar Office';
    case 'UNIVERSITY_ADMIN': return 'Vice Chancellor / Admin';
    case 'IQAC': return 'IQAC Cell';
    case 'EXAM_CELL': return 'Exam Controller';
    case 'STUDENT_SECTION': return 'Student Section';
    case 'HOSTEL_ADMIN': return 'Hostel Warden Office';
    case 'LIBRARY_ADMIN': return 'Library Office';
    case 'TRANSPORT_ADMIN': return 'Transport Office';
    case 'MAINTENANCE_ADMIN': return 'Estate & Maintenance';
    case 'HOD_ACADEMIC': return 'Department HOD Desk';
    case 'FINANCE_CELL': return 'Finance & Accounts';
    default: return office;
  }
};

export const getCategoryLabel = (cat: string): string => {
  switch (cat) {
    case 'BONAFIDE_CERTIFICATE': return 'Bonafide Certificate';
    case 'TRANSCRIPT_DEGREE': return 'Transcript / Degree';
    case 'FEE_CONCESSION': return 'Fee Concession';
    case 'HOSTEL_NO_DUES': return 'Hostel No-Dues';
    case 'RE_EVALUATION': return 'Re-evaluation Script';
    case 'NO_OBJECTION_CERTIFICATE': return 'NOC Certificate';
    case 'LEAVE_APPLICATION': return 'Leave Application';
    case 'RESEARCH_GRANT': return 'Research Grant Sanction';
    case 'EVENT_PERMISSION': return 'Event Permission';
    case 'INFRASTRUCTURE_MAINTENANCE': return 'Maintenance Ticket';
    case 'GENERAL_ADMINISTRATIVE': return 'General Admin';
    default: return cat;
  }
};

export const StatusBadge: React.FC<{ status: ApprovalStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return <Badge variant="active">APPROVED</Badge>;
    case 'LOCKED':
      return <Badge variant="navy">APPROVED &amp; LOCKED</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">REJECTED</Badge>;
    case 'RETURNED':
      return <Badge variant="orange">RETURNED</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="navy">UNDER REVIEW</Badge>;
    case 'FORWARDED':
      return <Badge variant="orange">FORWARDED</Badge>;
    case 'CHANGES_REQUESTED':
      return <Badge variant="warning">CHANGES REQUIRED</Badge>;
    case 'WITHDRAWN':
      return <Badge variant="inactive">WITHDRAWN</Badge>;
    case 'DRAFT':
      return <Badge variant="inactive">DRAFT</Badge>;
    case 'SUBMITTED':
      return <Badge variant="gold">SUBMITTED</Badge>;
    case 'PENDING':
    default:
      return <Badge variant="gold">PENDING</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: ApprovalPriority }> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FEE2E2', color: '#991B1B', fontWeight: 800, fontSize: '0.72rem' }}>URGENT</span>;
    case 'HIGH':
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FFEDD5', color: '#C2410C', fontWeight: 700, fontSize: '0.72rem' }}>HIGH</span>;
    case 'MEDIUM':
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', fontWeight: 600, fontSize: '0.72rem' }}>MEDIUM</span>;
    case 'LOW':
    default:
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F3F4F6', color: '#4B5563', fontWeight: 500, fontSize: '0.72rem' }}>LOW</span>;
  }
};
