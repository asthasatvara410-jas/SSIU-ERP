import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { workTransferService } from '../../services/workTransferService';
import { WorkItemSummary, TransferReason, WorkTransferRecord } from '../../types/workTransfer';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  ArrowRight, CheckCircle2, AlertCircle, Calendar, UserCheck, 
  FileText, ShieldCheck, Clock, Users, ArrowLeftRight, Check, X
} from 'lucide-react';

interface WorkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: WorkTransferRecord) => void;
  preselectedItemIds?: string[];
}

export const WorkTransferModal: React.FC<WorkTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedItemIds = []
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [availableItems, setAvailableItems] = useState<WorkItemSummary[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(preselectedItemIds);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState<TransferReason>('LEAVE');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load assignable work items for current user
  useEffect(() => {
    if (isOpen && user?.id) {
      const items = workTransferService.getAssignableWorkItemsForUser(user.id);
      setAvailableItems(items);
      if (preselectedItemIds.length > 0) {
        setSelectedItemIds(preselectedItemIds);
      } else if (items.length > 0) {
        setSelectedItemIds(items.slice(0, 3).map(i => i.id));
      }
      setErrorMessage(null);
      setCurrentStep(1);
    }
  }, [isOpen, user?.id]);

  // Recipient directory
  const eligibleRecipients = useMemo(() => {
    const faculty = db.getFaculty().filter(f => f.id !== user?.id && f.status === 'ACTIVE');
    return faculty;
  }, [user?.id]);

  const selectedRecipient = useMemo(() => {
    return eligibleRecipients.find(f => f.id === selectedRecipientId);
  }, [eligibleRecipients, selectedRecipientId]);

  // Filtered available items
  const filteredItems = useMemo(() => {
    if (selectedModuleFilter === 'ALL') return availableItems;
    return availableItems.filter(i => i.module === selectedModuleFilter);
  }, [availableItems, selectedModuleFilter]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map(i => i.id));
    }
  };

  // Step Validation
  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (selectedItemIds.length === 0) {
        setErrorMessage('Please select at least one work item to transfer.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedRecipientId) {
        setErrorMessage('Please select a recipient faculty member.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!startDate || !endDate) {
        setErrorMessage('Please specify both Start Date and End Date.');
        return;
      }
      if (endDate < startDate) {
        setErrorMessage('End Date must be on or after Start Date.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleConfirmTransfer = () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const record = workTransferService.createWorkTransfer({
        fromUserId: user?.id || 'fac-1',
        toUserId: selectedRecipientId,
        startAt: startDate,
        endAt: endDate,
        reason,
        remarks,
        workItemIds: selectedItemIds
      }, user);

      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess(record);
      }
      onClose();
    } catch (e: any) {
      setIsSubmitting(false);
      setErrorMessage(e.message || 'Failed to complete work transfer.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workload &amp; Work Transfer / Delegation"
      subtitle="Temporarily delegate tasks, student responsibilities, and approvals to another authorized faculty member"
      maxWidth="880px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Stepper Progress Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          {[
            { step: 1, label: '1. Select Work' },
            { step: 2, label: '2. Select Recipient' },
            { step: 3, label: '3. Dates & Reason' },
            { step: 4, label: '4. Preview & Confirm' }
          ].map(s => {
            const isCurrent = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: isCurrent ? 'var(--brand-navy, #0B192C)' : isCompleted ? '#10B981' : 'var(--border-color, #E2E8F0)',
                  color: isCurrent || isCompleted ? '#FFFFFF' : 'var(--text-muted, #64748B)'
                }}>
                  {isCompleted ? <Check size={14} /> : s.step}
                </div>
                <span style={{
                  fontSize: '0.78125rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? 'var(--brand-navy, #0B192C)' : 'var(--text-muted, #64748B)'
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '6px',
            color: '#991B1B',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1: SELECT WORK ITEMS
            ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                  Select Tasks &amp; Workload to Transfer ({selectedItemIds.length} of {availableItems.length} selected)
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                  Choose the active student requests, verifications, or operational duties to delegate.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                {selectedItemIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div style={{
              maxHeight: '280px',
              overflowY: 'auto',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: '6px'
            }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748B)', fontSize: '0.8125rem' }}>
                  No active pending tasks found in your workload queue.
                </div>
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderBottom: '1px solid var(--border-light, #F1F5F9)',
                        background: isSelected ? 'rgba(243, 112, 35, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'background 150ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted, #64748B)', display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                            <span>Module: <strong>{item.module}</strong></span>
                            {item.studentName && <span>Student: <strong>{item.studentName} ({item.enrollmentNo})</strong></span>}
                          </div>
                        </div>
                      </div>
                      <Badge variant={item.priority === 'CRITICAL' ? 'danger' : item.priority === 'HIGH' ? 'orange' : 'navy'}>
                        {item.priority}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2: SELECT RECIPIENT
            ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.5rem' }}>
              Select Authorized Recipient Faculty
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', marginBottom: '0.85rem' }}>
              The chosen faculty member will temporarily receive responsibility for the {selectedItemIds.length} selected work items.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {eligibleRecipients.map(fac => {
                const isSelected = selectedRecipientId === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedRecipientId(fac.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: isSelected ? '2px solid var(--brand-orange, #F37023)' : '1px solid var(--border-color, #E2E8F0)',
                      background: isSelected ? 'rgba(243, 112, 35, 0.04)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--brand-navy, #0B192C)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      flexShrink: 0
                    }}>
                      {fac.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                        {fac.name}
                      </div>
                      <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted, #64748B)' }}>
                        {fac.designation} • <code>{fac.employeeId}</code>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3: DATES & REASON
            ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Transfer Effective Dates &amp; Justification
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78125rem', fontWeight: 700 }}>Start Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78125rem', fontWeight: 700 }}>End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78125rem', fontWeight: 700 }}>Absence / Delegation Reason *</label>
              <select
                className="form-select"
                value={reason}
                onChange={e => setReason(e.target.value as TransferReason)}
              >
                <option value="LEAVE">Leave (Annual / Casual / Medical)</option>
                <option value="VACATION">Vacation / Semester Break</option>
                <option value="WEEK_OFF">Week Off / Compensatory Leave</option>
                <option value="OFFICIAL_DUTY">Official Duty / University Deputation</option>
                <option value="TEMPORARY_ASSIGNMENT">Temporary Exam / Incubation Assignment</option>
                <option value="OTHER">Other Approved Absence</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78125rem', fontWeight: 700 }}>Handover Instructions &amp; Remarks</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Provide context or specific guidelines for the recipient faculty..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 4: PREVIEW & CONFIRM
            ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1.25rem',
              background: 'var(--bg-surface-hover, #F8FAFC)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--border-color, #E2E8F0)'
            }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeftRight size={18} color="var(--brand-orange, #F37023)" /> Work Transfer Preview Summary
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Transfer From:</span> <strong>{user?.name || 'Faculty A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Transfer To:</span> <strong>{selectedRecipient?.name || 'Faculty B'}</strong></div>
                <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Effective Period:</span> <strong>{startDate} → {endDate}</strong></div>
                <div><span style={{ color: 'var(--text-muted, #64748B)' }}>Reason:</span> <Badge variant="orange">{reason}</Badge></div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.4rem' }}>
                  Delegated Work Breakdown ({selectedItemIds.length} Total Items):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedItemIds.map(id => {
                    const item = availableItems.find(i => i.id === id);
                    return (
                      <span key={id} style={{
                        padding: '2px 8px',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: '4px',
                        fontSize: '0.71875rem',
                        fontWeight: 600,
                        color: 'var(--brand-navy, #0B192C)'
                      }}>
                        {item?.title || id}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', padding: '0.5rem', background: '#FEF3C7', borderRadius: '4px', border: '1px solid #FDE68A' }}>
              <strong>Notice:</strong> Once confirmed, these work items will be transferred to <strong>{selectedRecipient?.name}</strong> and hidden from your active queue until the transfer period concludes on {endDate}.
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-color, #E2E8F0)',
          paddingTop: '1rem',
          marginTop: '0.5rem'
        }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem' }}
            >
              Continue to Step {currentStep + 1}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontSize: '0.8125rem', fontWeight: 800 }}
            >
              {isSubmitting ? 'Registering Transfer...' : 'Confirm Work Transfer'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
