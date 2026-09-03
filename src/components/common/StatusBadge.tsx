// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED STATUS BADGE COMPONENT
// ==============================================================================

import React from 'react';
import { 
  CheckCircle2, Clock, XCircle, AlertCircle, AlertTriangle, 
  Sparkles, Award, UserCheck, ShieldAlert, Ban, RefreshCw 
} from 'lucide-react';
import { Badge } from './Badge';
import { StudentStatus, StudentOnboardingStatus } from '../../types';

export interface StatusBadgeProps {
  status: StudentStatus | StudentOnboardingStatus | string;
  type?: 'STUDENT_LIFECYCLE' | 'ONBOARDING' | 'GENERIC';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'GENERIC',
  size = 'sm',
  showIcon = true
}) => {
  const normStatus = (status || '').toUpperCase();

  // 1. Student Lifecycle Statuses (12 Supported)
  if (normStatus === 'APPLICANT') {
    return (
      <Badge variant="navy">
        {showIcon && <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Applicant
      </Badge>
    );
  }

  if (normStatus === 'ADMISSION_CONFIRMED') {
    return (
      <Badge variant="active">
        {showIcon && <CheckCircle2 size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Admission Confirmed
      </Badge>
    );
  }

  if (normStatus === 'DOCUMENT_PENDING') {
    return (
      <Badge variant="orange">
        {showIcon && <AlertTriangle size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Document Pending
      </Badge>
    );
  }

  if (normStatus === 'FEE_PENDING') {
    return (
      <Badge variant="gold">
        {showIcon && <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Fee Pending
      </Badge>
    );
  }

  if (normStatus === 'READY_TO_ONBOARD' || normStatus === 'READY') {
    return (
      <Badge variant="active">
        {showIcon && <Sparkles size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Ready to Onboard
      </Badge>
    );
  }

  if (normStatus === 'ONBOARDING') {
    return (
      <Badge variant="orange">
        {showIcon && <RefreshCw size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Onboarding in Progress
      </Badge>
    );
  }

  if (normStatus === 'ACTIVE' || normStatus === 'ONBOARDED') {
    return (
      <Badge variant="active">
        {showIcon && <CheckCircle2 size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        {normStatus === 'ONBOARDED' ? 'Onboarded' : 'Active Student'}
      </Badge>
    );
  }

  if (normStatus === 'INACTIVE') {
    return (
      <Badge variant="inactive">
        {showIcon && <Ban size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Inactive
      </Badge>
    );
  }

  if (normStatus === 'GRADUATED') {
    return (
      <Badge variant="purple">
        {showIcon && <Award size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Graduated
      </Badge>
    );
  }

  if (normStatus === 'ALUMNI') {
    return (
      <Badge variant="purple">
        {showIcon && <Award size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Alumni
      </Badge>
    );
  }

  if (normStatus === 'SUSPENDED') {
    return (
      <Badge variant="danger">
        {showIcon && <ShieldAlert size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Suspended
      </Badge>
    );
  }

  if (normStatus === 'CANCELLED' || normStatus === 'REJECTED') {
    return (
      <Badge variant="danger">
        {showIcon && <XCircle size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        {normStatus === 'REJECTED' ? 'Rejected' : 'Cancelled'}
      </Badge>
    );
  }

  if (normStatus === 'DRAFT' || normStatus === 'ONBOARDING_DRAFT') {
    return (
      <Badge variant="navy">
        {showIcon && <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Draft
      </Badge>
    );
  }

  if (normStatus === 'SUBMITTED' || normStatus === 'UNDER_VERIFICATION') {
    return (
      <Badge variant="gold">
        {showIcon && <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        {normStatus === 'UNDER_VERIFICATION' ? 'Under Verification' : 'Submitted'}
      </Badge>
    );
  }

  if (normStatus === 'APPROVED') {
    return (
      <Badge variant="active">
        {showIcon && <CheckCircle2 size={11} style={{ marginRight: '3px', display: 'inline' }} />}
        Approved
      </Badge>
    );
  }

  // Generic fallback
  return (
    <Badge variant="navy">
      {status || 'Unknown'}
    </Badge>
  );
};
