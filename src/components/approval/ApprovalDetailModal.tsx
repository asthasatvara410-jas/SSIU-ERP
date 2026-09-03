import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { approvalWorkflowEngine } from '../../services/approvalEngine';
import { ApprovalOfficeType, ApprovalRequest, ApprovalStatus, UserRole } from '../../types';
import { getCategoryLabel, getOfficeLabel, PriorityBadge, StatusBadge } from './ApprovalWorkflowBadge';
import { 
  CheckCircle, XCircle, ArrowRight, MessageSquare, Clock, FileText, 
  Download, AlertTriangle, UserCheck, DollarSign, Layers, ChevronRight, CornerDownLeft, ShieldCheck
} from 'lucide-react';

interface ApprovalDetailModalProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, role } = useAuth();
  
  const [actionStatus, setActionStatus] = useState<'APPROVED' | 'REJECTED' | 'RETURNED' | 'FORWARDED'>('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [forwardOffice, setForwardOffice] = useState<ApprovalOfficeType>('REGISTRAR');
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!request || !user) return null;

  const effectiveRole = (role || user.role) as UserRole;
  const canAct = approvalWorkflowEngine.canUserActOnRequest(request, user, effectiveRole);
  const isCompleted = request.status === 'APPROVED' || request.status === 'REJECTED' || request.status === 'WITHDRAWN';

  const handleOpenActionPanel = (status: 'APPROVED' | 'REJECTED' | 'RETURNED' | 'FORWARDED') => {
    setActionStatus(status);
    setRemarks('');
    setErrorMessage(null);
    setShowActionPanel(true);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Enforce mandatory remarks for REJECTED and RETURNED
    if ((actionStatus === 'REJECTED' || actionStatus === 'RETURNED') && !remarks.trim()) {
      setErrorMessage(`Mandatory review remarks are required when ${actionStatus === 'REJECTED' ? 'rejecting' : 'returning'} a request.`);
      return;
    }

    try {
      setIsSubmitting(true);
      approvalWorkflowEngine.executeApprovalAction(
        request.id,
        actionStatus,
        remarks.trim() || `Decision: ${actionStatus}`,
        user,
        effectiveRole,
        actionStatus === 'FORWARDED' ? { forwardOffice } : undefined
      );

      setIsSubmitting(false);
      setShowActionPanel(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to record decision.');
    }
  };

  // Determine stage visual state
  const stages = request.stages && request.stages.length > 0 ? request.stages : [];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Digital Approval Details — ${request.requestNo}`} 
      maxWidth="840px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Top Header Card */}
        <div style={{ 
          padding: '1.2rem 1.4rem', 
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid #E2E8F0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', letterSpacing: '0.5px' }}>
                {request.requestNo}
              </span>
              <PriorityBadge priority={request.priority} />
              <StatusBadge status={request.status} />
              {request.moduleSource && (
                <span className="badge badge-navy" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  {request.moduleSource.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 0.35rem 0' }}>
              {request.title}
            </h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Category: <strong style={{ color: 'var(--text-main)' }}>{getCategoryLabel(request.category)}</strong> • 
              Target Office: <strong style={{ color: 'var(--brand-orange)' }}>{getOfficeLabel(request.targetOffice)}</strong> • 
              Deadline: <strong style={{ color: '#DC2626' }}>{request.deadlineDate}</strong>
            </div>
          </div>

          {request.amount && request.amount > 0 && (
            <div style={{ 
              background: '#FFFFFF', 
              padding: '0.6rem 1rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid #E2E8F0',
              textAlign: 'right',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Financial Estimate</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16A34A' }}>
                ₹{request.amount.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>

        {/* ─── MULTI-STAGE WORKFLOW VISUAL PROGRESS STEPPER ─── */}
        {stages.length > 0 && (
          <div style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.1rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem' }}>
              <Layers size={16} color="var(--brand-navy)" />
              <span>Multi-Stage Approval Progression ({stages.length} Stages)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stages.map((st, idx) => {
                const isCurrent = idx === request.currentStageIndex && !isCompleted;
                const isPassed = st.status === 'APPROVED';
                const isRejected = st.status === 'REJECTED';
                const isReturned = st.status === 'RETURNED';

                let borderLeftColor = '#CBD5E1';
                let bgBadge = '#F1F5F9';
                let iconColor = '#64748B';

                if (isPassed) {
                  borderLeftColor = '#16A34A';
                  bgBadge = '#DCFCE7';
                  iconColor = '#16A34A';
                } else if (isRejected) {
                  borderLeftColor = '#DC2626';
                  bgBadge = '#FEE2E2';
                  iconColor = '#DC2626';
                } else if (isReturned) {
                  borderLeftColor = '#EA580C';
                  bgBadge = '#FFEDD5';
                  iconColor = '#EA580C';
                } else if (isCurrent) {
                  borderLeftColor = 'var(--brand-orange)';
                  bgBadge = '#FEF3C7';
                  iconColor = 'var(--brand-orange)';
                }

                return (
                  <div 
                    key={st.stageIndex || idx}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem', 
                      background: isCurrent ? '#FFFBEB' : '#F8FAFC', 
                      borderLeft: `4px solid ${borderLeftColor}`,
                      borderRadius: 'var(--radius-sm)',
                      border: isCurrent ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        background: bgBadge, 
                        color: iconColor,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        marginTop: '2px'
                      }}>
                        {isPassed ? '✓' : isRejected ? '✗' : isReturned ? '↩' : idx + 1}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>
                          Stage {idx + 1}: {st.stageName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Authority Role: <strong>{st.requiredRole}</strong> 
                          {st.requiredOffice && ` • Office: ${getOfficeLabel(st.requiredOffice)}`}
                        </div>
                        {st.remarks && (
                          <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#334155', marginTop: '4px', background: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            "{st.remarks}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                      <span className={`badge ${
                        isPassed ? 'badge-success' : 
                        isRejected ? 'badge-danger' : 
                        isReturned ? 'badge-warning' : 
                        isCurrent ? 'badge-gold' : 'badge-navy'
                      }`}>
                        {isPassed ? 'APPROVED' : isRejected ? 'REJECTED' : isReturned ? 'RETURNED' : isCurrent ? 'PENDING ACTION' : 'AWAITING'}
                      </span>
                      {st.actionByUserName && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          By: {st.actionByUserName}
                        </div>
                      )}
                      {st.actionAt && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(st.actionAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-Column Info Grid */}
        <div className="grid-2" style={{ fontSize: '0.875rem' }}>
          <div className="card" style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="var(--brand-orange)" /> Applicant Profile
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div><strong>Name:</strong> {request.applicantName} ({request.applicantRole})</div>
              <div><strong>Email:</strong> {request.applicantEmail}</div>
              <div><strong>ID / Reg No:</strong> {request.applicantEnrollmentOrEmpId || '-'}</div>
              <div><strong>Department:</strong> {request.departmentName || request.departmentId || '-'}</div>
              <div><strong>Phone:</strong> {request.applicantPhone || '-'}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--brand-navy)" /> Custody &amp; Routing Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div><strong>Original Office:</strong> {getOfficeLabel(request.targetOffice)}</div>
              <div><strong>Current Custodian:</strong> <span style={{ color: 'var(--brand-orange)', fontWeight: 800 }}>{getOfficeLabel(request.currentOffice)}</span></div>
              <div><strong>Submitted At:</strong> {new Date(request.createdAt).toLocaleString()}</div>
              <div><strong>Overall Status:</strong> <strong>{request.status}</strong></div>
              {request.completedAt && (
                <div><strong>Resolved At:</strong> {new Date(request.completedAt).toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>

        {/* Proposal / Description Body */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
            Detailed Proposal / Description
          </h4>
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.875rem', 
            lineHeight: 1.6, 
            whiteSpace: 'pre-wrap' 
          }}>
            {request.description}
          </div>
          {request.financialEstimateSummary && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#0369A1', background: '#E0F2FE', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #BAE6FD' }}>
              <strong>Financial Summary:</strong> {request.financialEstimateSummary}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        {request.attachments && request.attachments.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
              Supporting Documents ({request.attachments.length})
            </h4>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {request.attachments.map(att => (
                <div 
                  key={att.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.6rem', 
                    padding: '0.6rem 0.85rem', 
                    background: '#F8FAFC', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.8125rem' 
                  }}
                >
                  <FileText size={18} color="var(--brand-orange)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{att.fileName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{att.fileSize} • {att.fileType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remarks & Full Audit History Timeline */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} color="var(--brand-gold)" /> Complete Audit Trail &amp; Remarks History
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {request.remarksHistory && request.remarksHistory.length > 0 ? (
              request.remarksHistory.map((rem, idx) => (
                <div 
                  key={rem.id || idx} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    background: '#F8FAFC', 
                    borderLeft: '3px solid var(--brand-navy)', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.8125rem',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                      {rem.actionByUserName} ({rem.actionByUserRole})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rem.timestamp}</span>
                  </div>
                  <div style={{ color: 'var(--text-main)', marginBottom: '2px' }}>
                    Action: <strong>{rem.action}</strong> • Office: <strong>{getOfficeLabel(rem.office)}</strong>
                  </div>
                  <div style={{ fontStyle: 'italic', color: '#475569' }}>"{rem.remarks}"</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No audit history available yet.</div>
            )}
          </div>
        </div>

        {/* ─── ACTION PANEL FOR AUTHORIZED REVIEWER ─── */}
        {canAct && !isCompleted && (
          <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '1.1rem', marginTop: '0.5rem' }}>
            {!showActionPanel ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#16A34A', fontWeight: 700 }}>
                  <ShieldCheck size={16} />
                  <span>You are authorized to review and take action at this stage ({effectiveRole}).</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-active btn-sm" onClick={() => handleOpenActionPanel('APPROVED')}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button className="btn btn-warning btn-sm" onClick={() => handleOpenActionPanel('RETURNED')}>
                    <CornerDownLeft size={14} /> Return for Correction
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleOpenActionPanel('REJECTED')}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenActionPanel('FORWARDED')}>
                    <ArrowRight size={14} /> Forward
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmSubmit} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.85rem', 
                background: '#FFFBEB', 
                padding: '1.2rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid #FCD34D' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.925rem' }}>
                    Confirm Action: <span style={{ color: actionStatus === 'APPROVED' ? '#16A34A' : actionStatus === 'REJECTED' ? '#DC2626' : '#D97706' }}>{actionStatus}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Acting as: <strong>{user.name} ({effectiveRole})</strong>
                  </span>
                </div>

                {errorMessage && (
                  <div style={{ color: '#DC2626', background: '#FEE2E2', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
                    {errorMessage}
                  </div>
                )}

                {actionStatus === 'FORWARDED' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Select Office to Forward Request To *</label>
                    <select
                      className="form-select"
                      value={forwardOffice}
                      onChange={e => setForwardOffice(e.target.value as ApprovalOfficeType)}
                      required
                    >
                      <option value="REGISTRAR">Registrar Office</option>
                      <option value="UNIVERSITY_ADMIN">Vice Chancellor / University Admin</option>
                      <option value="IQAC">IQAC Quality Assurance Cell</option>
                      <option value="EXAM_CELL">Examination Controller Office</option>
                      <option value="STUDENT_SECTION">Student Section &amp; Certificates</option>
                      <option value="HOSTEL_ADMIN">Hostel Warden Office</option>
                      <option value="LIBRARY_ADMIN">Library Administration</option>
                      <option value="TRANSPORT_ADMIN">Transport Office</option>
                      <option value="MAINTENANCE_ADMIN">Estate &amp; Maintenance Office</option>
                      <option value="HOD_ACADEMIC">Department HOD Desk</option>
                      <option value="FINANCE_CELL">Finance &amp; Accounts Office</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Official Comments / Remarks {actionStatus !== 'APPROVED' ? '(Mandatory *)' : '(Optional)'}
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder={
                      actionStatus === 'REJECTED' ? 'Specify the exact reason for rejecting this proposal...' :
                      actionStatus === 'RETURNED' ? 'Specify what corrections or missing documents are required from the applicant...' :
                      'Enter official endorsement remarks or conditions (if any)...'
                    }
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    required={actionStatus === 'REJECTED' || actionStatus === 'RETURNED'}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActionPanel(false)} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Recording Decision...' : 'Confirm & Record Decision'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
};
