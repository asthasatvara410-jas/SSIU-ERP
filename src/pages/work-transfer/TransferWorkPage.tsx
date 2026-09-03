import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { workTransferService } from '../../services/workTransferService';
import { TransferReason, WorkItemSummary, WorkPriority } from '../../types/workTransfer';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { 
  ArrowLeftRight, CheckSquare, Calendar, UserCheck, AlertTriangle, 
  CheckCircle2, ArrowRight, ShieldCheck, HelpCircle, FileText, Send, 
  ArrowLeft, Search, Filter, RotateCcw, Eye, Clock, User, Layers,
  ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Info, Lock,
  Check, X, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';

interface TransferWorkPageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

export interface EnrichedWorkItem extends WorkItemSummary {
  rawModule: string;
  displayModule: string;
  studentRefDisplay: string;
  isAvailable: boolean;
  lockReason?: string;
  weeklyHours?: number;
  divisionName?: string;
  departmentName?: string;
  programName?: string;
  semesterNumber?: number;
  responsibility?: string;
}

export const TransferWorkPage: React.FC<TransferWorkPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'fac-1';

  // Workflow steps
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState<TransferReason>('LEAVE');
  const [remarks, setRemarks] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdTrackingCode, setCreatedTrackingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Table filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'displayModule' | 'title' | 'priority' | 'status' | 'studentRefDisplay'>('displayModule');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Detail drawer / modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<EnrichedWorkItem | null>(null);

  // 1. Available Workload to transfer (combines central workload & task items)
  const assignableItems: EnrichedWorkItem[] = useMemo(() => {
    const workItems = workTransferService.getAssignableWorkItemsForUser(currentUserId);
    const facultyWorkloads = workTransferService.getFacultyWorkloadItems(currentUserId);
    
    const enrichedList: EnrichedWorkItem[] = [];
    const seenIds = new Set<string>();

    // A. Add Task items from central work transfer service
    workItems.forEach(w => {
      if (!seenIds.has(w.id)) {
        seenIds.add(w.id);
        const moduleName = w.type ? w.type.replace(/_/g, ' ') : (w.module || 'GENERAL');
        const studentRef = w.studentName 
          ? `${w.studentName} (${w.enrollmentNo || w.studentEnrollment || w.studentId || ''})`
          : (w.studentEnrollment ? `Enrollment No: ${w.studentEnrollment}` : 'General Task');

        enrichedList.push({
          ...w,
          rawModule: w.module || 'GENERAL',
          displayModule: moduleName,
          studentRefDisplay: studentRef,
          isAvailable: true,
          status: w.status || 'PENDING'
        });
      }
    });

    // B. Add Faculty Workload items (Lectures, Labs, Mentoring, Coordination)
    facultyWorkloads.forEach(w => {
      const isAlreadyTransferred = w.status === 'TRANSFERRED';
      const isCompleted = w.status === 'COMPLETED';
      const isLocked = isAlreadyTransferred || isCompleted;
      const lockReason = isAlreadyTransferred 
        ? 'Already actively transferred to another faculty member' 
        : isCompleted 
        ? 'Task marked as completed' 
        : undefined;

      const itemId = w.workId || w.id;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        const moduleName = w.workType ? w.workType.replace(/_/g, ' ') : 'ACADEMIC LOAD';
        const studentRef = w.studentReference 
          ? w.studentReference 
          : (w.divisionName ? `${w.divisionName} ${w.semesterNumber ? `(Sem ${w.semesterNumber})` : ''}` : 'All Students');

        enrichedList.push({
          id: itemId,
          type: w.workType,
          title: w.workTitle,
          description: w.description || `${w.workType.replace(/_/g, ' ')} for ${w.departmentName || 'SSIU'}`,
          module: w.departmentName || 'Academic Load',
          rawModule: w.departmentName || 'Academic Load',
          displayModule: moduleName,
          studentName: w.studentReference || undefined,
          studentRefDisplay: studentRef,
          priority: w.priority || 'MEDIUM',
          status: isAlreadyTransferred ? 'COMPLETED' : (w.status === 'ACTIVE' ? 'IN_PROGRESS' : 'PENDING'),
          assignedAt: w.assignedDate || '2026-08-20',
          dueDate: w.dueDate,
          weeklyHours: w.weeklyHours,
          divisionName: w.divisionName,
          departmentName: w.departmentName,
          programName: w.programName,
          semesterNumber: w.semesterNumber,
          responsibility: w.responsibility,
          isAvailable: !isLocked,
          lockReason: lockReason
        });
      }
    });

    return enrichedList;
  }, [currentUserId]);

  // Filtered and Sorted Work Items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...assignableItems];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.displayModule && item.displayModule.toLowerCase().includes(q)) ||
        (item.studentRefDisplay && item.studentRefDisplay.toLowerCase().includes(q)) ||
        (item.departmentName && item.departmentName.toLowerCase().includes(q)) ||
        (item.programName && item.programName.toLowerCase().includes(q))
      );
    }

    // Module filter
    if (selectedModuleFilter !== 'ALL') {
      result = result.filter(item => item.displayModule === selectedModuleFilter);
    }

    // Priority filter
    if (selectedPriorityFilter !== 'ALL') {
      result = result.filter(item => item.priority === selectedPriorityFilter);
    }

    // Status filter
    if (selectedStatusFilter !== 'ALL') {
      if (selectedStatusFilter === 'AVAILABLE') {
        result = result.filter(item => item.isAvailable);
      } else if (selectedStatusFilter === 'LOCKED') {
        result = result.filter(item => !item.isAvailable);
      }
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'priority') {
        const pWeights: Record<WorkPriority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        valA = pWeights[a.priority as WorkPriority] || 0;
        valB = pWeights[b.priority as WorkPriority] || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return 0;
    });

    return result;
  }, [assignableItems, searchQuery, selectedModuleFilter, selectedPriorityFilter, selectedStatusFilter, sortField, sortDirection]);

  // Unique Modules for Filter Dropdown
  const uniqueModules = useMemo(() => {
    const set = new Set<string>();
    assignableItems.forEach(i => set.add(i.displayModule));
    return Array.from(set).sort();
  }, [assignableItems]);

  // 2. Eligible Recipients
  const facultyList = useMemo(() => {
    const allFac = db.getFaculty();
    const allUsers = db.getUsers().filter(u => u.role === 'FACULTY' || u.role === 'HOD' || u.role === 'PRINCIPAL' || u.role === 'STUDENT_SECTION');
    
    const list: Array<{ id: string; name: string; designation: string; departmentName: string; email: string }> = [];
    const seenIds = new Set<string>();

    allFac.forEach(f => {
      if (f.id !== currentUserId && !seenIds.has(f.id)) {
        seenIds.add(f.id);
        const dept = db.getDepartmentById(f.departmentId);
        list.push({
          id: f.id,
          name: f.name,
          designation: f.designation || 'Faculty Member',
          departmentName: dept?.name || 'Academic Dept',
          email: f.email || `${f.id}@swarrnim.edu.in`
        });
      }
    });

    allUsers.forEach(u => {
      if (u.id !== currentUserId && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        list.push({
          id: u.id,
          name: u.name,
          designation: u.role,
          departmentName: 'SSIU University',
          email: u.email || `${u.username}@swarrnim.edu.in`
        });
      }
    });

    return list;
  }, [currentUserId]);

  // Filtered Recipients
  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return facultyList;
    const q = recipientSearch.toLowerCase();
    return facultyList.filter(f => f.name.toLowerCase().includes(q) || f.departmentName.toLowerCase().includes(q) || f.designation.toLowerCase().includes(q));
  }, [facultyList, recipientSearch]);

  const selectedRecipient = useMemo(() => {
    return facultyList.find(f => f.id === selectedRecipientId);
  }, [facultyList, selectedRecipientId]);

  // Checkbox helpers
  const handleToggleWorkItem = (item: EnrichedWorkItem) => {
    if (!item.isAvailable) return;
    setSelectedWorkItemIds(prev => 
      prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
    );
  };

  const handleSelectAllVisible = () => {
    const availableVisibleIds = filteredAndSortedItems.filter(i => i.isAvailable).map(i => i.id);
    const allSelected = availableVisibleIds.every(id => selectedWorkItemIds.includes(id));
    
    if (allSelected) {
      // Unselect visible items
      setSelectedWorkItemIds(prev => prev.filter(id => !availableVisibleIds.includes(id)));
    } else {
      // Select all visible items
      setSelectedWorkItemIds(prev => Array.from(new Set([...prev, ...availableVisibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedWorkItemIds([]);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedModuleFilter('ALL');
    setSelectedPriorityFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSortField('displayModule');
    setSortDirection('asc');
  };

  const handleSort = (field: 'displayModule' | 'title' | 'priority' | 'status' | 'studentRefDisplay') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenDetailModal = (item: EnrichedWorkItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedItemForDetail(item);
    setDetailModalOpen(true);
  };

  const handleFinalSubmit = () => {
    setErrorMessage('');
    if (selectedWorkItemIds.length === 0) {
      setErrorMessage('Please select at least one task or work item to transfer.');
      return;
    }
    if (!selectedRecipientId) {
      setErrorMessage('Please select an authorized faculty member or staff recipient.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Start date and end date are required.');
      return;
    }
    if (endDate < startDate) {
      setErrorMessage('End date cannot be earlier than start date.');
      return;
    }

    try {
      const record = workTransferService.createWorkTransfer({
        fromUserId: currentUserId,
        toUserId: selectedRecipientId,
        startAt: startDate,
        endAt: endDate,
        reason,
        remarks,
        workItemIds: selectedWorkItemIds
      }, user);

      setCreatedTrackingCode(record.trackingCode);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute work transfer.');
    }
  };

  // Helper for priority badge
  const renderPriorityBadge = (priority: WorkPriority) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '3px',
            fontSize: '0.6875rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#FEE2E2', 
            color: '#B91C1C', 
            border: '1px solid #FECACA' 
          }}>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '3px',
            fontSize: '0.6875rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#FEF3C7', 
            color: '#B45309', 
            border: '1px solid #FDE68A' 
          }}>
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '3px',
            fontSize: '0.6875rem', 
            fontWeight: 700, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#F1F5F9', 
            color: '#475569', 
            border: '1px solid #E2E8F0' 
          }}>
            LOW
          </span>
        );
    }
  };

  // Helper for status badge
  const renderStatusBadge = (item: EnrichedWorkItem) => {
    if (!item.isAvailable) {
      return (
        <span 
          title={item.lockReason || 'Not available for transfer'}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '0.6875rem', 
            fontWeight: 700, 
            padding: '2px 7px', 
            borderRadius: '4px', 
            background: '#F1F5F9', 
            color: '#64748B', 
            border: '1px solid #CBD5E1' 
          }}
        >
          <Lock size={11} /> Locked
        </span>
      );
    }

    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px',
        fontSize: '0.6875rem', 
        fontWeight: 800, 
        padding: '2px 7px', 
        borderRadius: '4px', 
        background: '#DCFCE7', 
        color: '#15803D', 
        border: '1px solid #86EFAC' 
      }}>
        <Check size={11} /> Available
      </span>
    );
  };

  // ─── Post-Submission Success Screen ──────────────────────────────────
  if (isSubmitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
            Workload Transfer Successfully Registered!
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748B)', margin: '8px 0 1.5rem 0' }}>
            Official Transfer Tracking Code: <strong style={{ color: 'var(--brand-navy, #0B192C)' }}><code>{createdTrackingCode}</code></strong>
          </p>

          <div style={{ maxWidth: '520px', margin: '0 auto 2rem auto', background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'left', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Recipient Faculty:</span>
              <strong style={{ color: 'var(--brand-navy)' }}>{selectedRecipient?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Effective Period:</span>
              <strong>{startDate} → {endDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Delegation Reason:</span>
              <Badge variant="orange">{reason.replace(/_/g, ' ')}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '8px' }}>
              <span style={{ color: '#64748B' }}>Transferred Workload:</span>
              <strong style={{ color: 'var(--brand-orange)' }}>{selectedWorkItemIds.length} Work Items</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setActiveTab && setActiveTab('work-transfer-active')}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800, padding: '0.55rem 1.35rem' }}
            >
              View Active Transfers
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('work-transfer')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.55rem 1.35rem' }}
            >
              Back to My Workload
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAllVisibleSelected = filteredAndSortedItems.length > 0 && 
    filteredAndSortedItems.filter(i => i.isAvailable).every(i => selectedWorkItemIds.includes(i.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* ─── 1. Page Header ─── */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 16px rgba(11,25,44,0.15)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ArrowLeftRight size={22} color="var(--brand-orange, #F37023)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Transfer Workload &amp; Delegate Responsibilities
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0 0' }}>
            Temporarily transfer authorized responsibilities during leaves, vacations, or official duties.
          </p>
        </div>

        <button
          onClick={() => setActiveTab && setActiveTab('work-transfer')}
          className="btn btn-secondary btn-sm"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.25)', fontSize: '0.78125rem' }}
        >
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Back to My Work
        </button>
      </div>

      {/* ─── 2. Step Indicator ─── */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', background: '#FFFFFF', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {[
            { step: 1, label: '1. Select Tasks' },
            { step: 2, label: '2. Select Recipient' },
            { step: 3, label: '3. Period & Reason' },
            { step: 4, label: '4. Confirm & Submit' }
          ].map(s => {
            const isCur = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <div
                key={s.step}
                onClick={() => isDone && setCurrentStep(s.step as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isCur || isDone ? 1 : 0.45,
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  background: isCur ? 'rgba(243, 112, 35, 0.08)' : 'transparent'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCur ? 'var(--brand-orange, #F37023)' : isDone ? '#10B981' : '#CBD5E1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {isDone ? '✓' : s.step}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: isCur ? 800 : 600, color: isCur ? 'var(--brand-navy, #0B192C)' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', borderLeft: '4px solid #DC2626', color: '#B91C1C', borderRadius: '6px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── STEP 1: EXCEL-LIKE TASK SELECTION GRID ─── */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px' }}>
          
          {/* Header & Stats Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                  Step 1: Choose Work Items to Delegate
                </h3>
                <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  {assignableItems.length} work items available
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Select rows from the Excel grid below to delegate authorized responsibilities.
              </p>
            </div>

            {/* Selection Summary Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ 
                background: selectedWorkItemIds.length > 0 ? 'rgba(243, 112, 35, 0.1)' : '#F8FAFC', 
                border: `1px solid ${selectedWorkItemIds.length > 0 ? '#FDBA74' : '#E2E8F0'}`,
                padding: '0.4rem 0.85rem', 
                borderRadius: '6px',
                fontSize: '0.78125rem',
                fontWeight: 700,
                color: selectedWorkItemIds.length > 0 ? 'var(--brand-navy)' : '#64748B'
              }}>
                {selectedWorkItemIds.length > 0 ? (
                  <span><strong>{selectedWorkItemIds.length}</strong> work items selected • Selected workload: <strong>{selectedWorkItemIds.length}</strong> items</span>
                ) : (
                  <span>0 work items selected</span>
                )}
              </div>

              {selectedWorkItemIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* ─── Compact Excel Search & Filter Toolbar ─── */}
          <div style={{ 
            background: '#F8FAFC', 
            border: '1px solid #E2E8F0', 
            borderRadius: '6px', 
            padding: '0.75rem', 
            marginBottom: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search work items, tasks, descriptions, references..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-control"
                  style={{ height: '32px', fontSize: '0.78125rem', paddingLeft: '1.85rem' }}
                />
                <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {/* Module Dropdown */}
              <select
                value={selectedModuleFilter}
                onChange={e => setSelectedModuleFilter(e.target.value)}
                className="form-control"
                style={{ width: 'auto', minWidth: '130px', height: '32px', fontSize: '0.78125rem' }}
              >
                <option value="ALL">All Modules</option>
                {uniqueModules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Priority Dropdown */}
              <select
                value={selectedPriorityFilter}
                onChange={e => setSelectedPriorityFilter(e.target.value)}
                className="form-control"
                style={{ width: 'auto', minWidth: '110px', height: '32px', fontSize: '0.78125rem' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="form-control"
                style={{ width: 'auto', minWidth: '110px', height: '32px', fontSize: '0.78125rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="LOCKED">Locked</option>
              </select>

              {(searchQuery || selectedModuleFilter !== 'ALL' || selectedPriorityFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-outline btn-sm"
                  style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  title="Reset Search and Filters"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}

            </div>

            {/* Quick Bulk Select Button */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="btn btn-secondary btn-sm"
                style={{ height: '32px', fontSize: '0.75rem', fontWeight: 700, padding: '0 0.75rem' }}
              >
                {isAllVisibleSelected ? 'Deselect Visible' : 'Select All Visible'}
              </button>
            </div>
          </div>

          {/* ─── Excel Grid Table ─── */}
          {assignableItems.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.5rem auto' }} />
              <strong style={{ display: 'block', fontSize: '0.925rem', color: 'var(--brand-navy)' }}>No Pending Workload</strong>
              <p style={{ fontSize: '0.8125rem', margin: '4px 0 0 0' }}>You have no active pending tasks in your workload to transfer at this time.</p>
            </div>
          ) : (
            <div style={{ 
              overflowX: 'auto', 
              border: '1px solid #CBD5E1', 
              borderRadius: '6px',
              maxHeight: '520px',
              overflowY: 'auto'
            }}>
              <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0B192C', color: '#FFFFFF' }}>
                  <tr>
                    {/* 1. Select Checkbox */}
                    <th style={{ width: '45px', padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={handleSelectAllVisible}
                        title="Select All Visible Tasks"
                        style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                      />
                    </th>

                    {/* 2. Module */}
                    <th 
                      onClick={() => handleSort('displayModule')}
                      style={{ width: '160px', padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>MODULE</span>
                        {sortField === 'displayModule' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                      </div>
                    </th>

                    {/* 3. Work Item / Task */}
                    <th 
                      onClick={() => handleSort('title')}
                      style={{ width: '250px', padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>WORK ITEM / TASK</span>
                        {sortField === 'title' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                      </div>
                    </th>

                    {/* 4. Description */}
                    <th style={{ minWidth: '240px', padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                      DESCRIPTION
                    </th>

                    {/* 5. Student / Reference */}
                    <th 
                      onClick={() => handleSort('studentRefDisplay')}
                      style={{ width: '180px', padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>STUDENT / REFERENCE</span>
                        {sortField === 'studentRefDisplay' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                      </div>
                    </th>

                    {/* 6. Priority */}
                    <th 
                      onClick={() => handleSort('priority')}
                      style={{ width: '100px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <span>PRIORITY</span>
                        {sortField === 'priority' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                      </div>
                    </th>

                    {/* 7. Status */}
                    <th style={{ width: '110px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                      STATUS
                    </th>

                    {/* 8. Info / Actions */}
                    <th style={{ width: '65px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>
                      INFO
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAndSortedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                          <AlertCircle size={28} color="#94A3B8" />
                          <strong style={{ fontSize: '0.875rem', color: 'var(--brand-navy)' }}>No matching work items found</strong>
                          <p style={{ margin: 0, fontSize: '0.78125rem' }}>Try clearing your search query or reset the module/priority filters.</p>
                          <button onClick={handleResetFilters} className="btn btn-sm btn-secondary" style={{ marginTop: '0.4rem', fontSize: '0.75rem' }}>
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedItems.map((item, index) => {
                      const isSelected = selectedWorkItemIds.includes(item.id);
                      const isLocked = !item.isAvailable;

                      const rowBg = isSelected 
                        ? 'rgba(243, 112, 35, 0.08)' 
                        : isLocked 
                        ? '#F8FAFC' 
                        : index % 2 === 0 ? '#FFFFFF' : '#FAFCFF';

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleToggleWorkItem(item)}
                          style={{
                            background: rowBg,
                            borderBottom: '1px solid #E2E8F0',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            opacity: isLocked ? 0.65 : 1,
                            transition: 'background-color 0.15s ease'
                          }}
                          className={isLocked ? '' : 'table-row-hover'}
                          title={isLocked ? item.lockReason : 'Click row to select/deselect'}
                        >
                          {/* 1. Checkbox */}
                          <td 
                            style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isLocked}
                              onChange={() => handleToggleWorkItem(item)}
                              style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                            />
                          </td>

                          {/* 2. Module */}
                          <td style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#0B192C',
                              color: '#FFFFFF',
                              letterSpacing: '0.2px',
                              display: 'inline-block',
                              maxWidth: '140px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.displayModule}
                            </span>
                          </td>

                          {/* 3. Work Item / Task */}
                          <td style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>
                              {item.title}
                            </div>
                            {item.weeklyHours ? (
                              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
                                Academic Load: <strong>{item.weeklyHours} Hrs/Week</strong>
                              </div>
                            ) : null}
                          </td>

                          {/* 4. Description (Truncated with tooltip) */}
                          <td 
                            style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid #E2E8F0', color: '#475569', fontSize: '0.78125rem' }}
                            title={item.description}
                          >
                            <div style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.35
                            }}>
                              {item.description}
                            </div>
                          </td>

                          {/* 5. Student / Reference */}
                          <td style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                            <span style={{ fontSize: '0.78125rem', color: '#334155', fontWeight: 600 }}>
                              {item.studentRefDisplay}
                            </span>
                          </td>

                          {/* 6. Priority */}
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            {renderPriorityBadge(item.priority as WorkPriority)}
                          </td>

                          {/* 7. Status */}
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            {renderStatusBadge(item)}
                          </td>

                          {/* 8. Info Details Button */}
                          <td 
                            style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={e => handleOpenDetailModal(item, e)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#64748B' }}
                              title="View Full Task Details"
                            >
                              <Eye size={13} />
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Bottom Footer & Continue Action ─── */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '1.25rem', 
            flexWrap: 'wrap', 
            gap: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Showing <strong>{filteredAndSortedItems.length}</strong> of <strong>{assignableItems.length}</strong> available tasks
            </div>

            <button
              type="button"
              disabled={selectedWorkItemIds.length === 0}
              onClick={() => {
                if (selectedWorkItemIds.length === 0) {
                  setErrorMessage('Please select at least 1 work item to proceed.');
                  return;
                }
                setErrorMessage('');
                setCurrentStep(2);
              }}
              className="btn btn-primary"
              style={{
                background: selectedWorkItemIds.length > 0 ? 'var(--brand-orange, #F37023)' : '#CBD5E1',
                borderColor: selectedWorkItemIds.length > 0 ? 'var(--brand-orange, #F37023)' : '#CBD5E1',
                fontWeight: 800,
                fontSize: '0.84rem',
                padding: '0.55rem 1.4rem',
                cursor: selectedWorkItemIds.length > 0 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {selectedWorkItemIds.length > 0 ? (
                <>Continue with {selectedWorkItemIds.length} Selected →</>
              ) : (
                <>Select work items to continue →</>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ─── STEP 2: SELECT RECIPIENT ─── */}
      {currentStep === 2 && (
        <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: '8px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Step 2: Choose Authorized Recipient
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Select a colleague within your department or institute to temporarily take over responsibility.
            </p>
          </div>

          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search faculty by name, department, designation..."
              value={recipientSearch}
              onChange={e => setRecipientSearch(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8125rem', paddingLeft: '2rem' }}
            />
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.5rem' }}>
            {filteredRecipients.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                No faculty members match your search.
              </div>
            ) : (
              filteredRecipients.map(fac => {
                const isSelected = selectedRecipientId === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedRecipientId(fac.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid var(--brand-orange, #F37023)' : '1px solid #E2E8F0',
                      background: isSelected ? 'rgba(243, 112, 35, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--brand-navy, #0B192C)' }}>{fac.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {fac.designation} • {fac.departmentName}
                      </div>
                    </div>
                    {isSelected ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-orange)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={16} /> Selected
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Click to select</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button onClick={() => setCurrentStep(1)} className="btn btn-secondary btn-sm">
              ← Back to Tasks
            </button>
            <button
              onClick={() => {
                if (!selectedRecipientId) {
                  setErrorMessage('Please select a recipient faculty member.');
                  return;
                }
                setErrorMessage('');
                setCurrentStep(3);
              }}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800, padding: '0.5rem 1.25rem' }}
            >
              Continue to Details →
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: DATES & REASON ─── */}
      {currentStep === 3 && (
        <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: '8px' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Step 3: Transfer Period &amp; Absence Justification
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Define when the transfer begins, when it expires, and the official absence reason.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                Effective Start Date <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                Effective End Date <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              Absence Reason <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as any)}
              className="form-control"
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="LEAVE">Approved Leave</option>
              <option value="VACATION">Vacation / Semester Break</option>
              <option value="OFFICIAL_DUTY">Official University Duty</option>
              <option value="WEEK_OFF">Scheduled Week Off Coverage</option>
              <option value="TEMPORARY_ASSIGNMENT">Temporary Special Assignment</option>
              <option value="EMERGENCY">Medical / Personal Emergency</option>
              <option value="OTHER">Other Administrative Reason</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              Special Instructions / Notes for Recipient
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Please verify laboratory submissions and sign lecture register before Friday."
              className="form-control"
              style={{ fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button onClick={() => setCurrentStep(2)} className="btn btn-secondary btn-sm">
              ← Back to Recipient
            </button>
            <button
              onClick={() => {
                if (!startDate || !endDate) {
                  setErrorMessage('Start and End dates are required.');
                  return;
                }
                setErrorMessage('');
                setCurrentStep(4);
              }}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', border: 'none', fontWeight: 800, padding: '0.5rem 1.25rem' }}
            >
              Review Transfer Summary →
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: REVIEW & CONFIRMATION ─── */}
      {currentStep === 4 && (
        <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: '8px' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Step 4: Review &amp; Confirm Responsibility Transfer
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Please review all transfer details before submitting to the SSIU audit ledger.
            </p>
          </div>

          {/* Warning Banner */}
          <div style={{ padding: '0.85rem 1rem', background: '#FEF3C7', borderLeft: '4px solid #F59E0B', borderRadius: '6px', color: '#92400E', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', gap: '8px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Responsibility Notice:</strong> You are transferring official operational responsibility for these <strong>{selectedWorkItemIds.length} tasks</strong>. During the active transfer period, they will be delegated to <strong>{selectedRecipient?.name}</strong>. Upon expiry or revocation, remaining incomplete items will restore to your account.
            </div>
          </div>

          {/* Live Summary Card */}
          <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>ORIGIN USER (FROM)</span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--brand-navy, #0B192C)' }}>{user?.name || 'Faculty Member'}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user?.role || 'FACULTY'}</div>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>RECIPIENT USER (TO)</span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--brand-orange, #F37023)' }}>{selectedRecipient?.name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedRecipient?.designation} • {selectedRecipient?.departmentName}</div>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>EFFECTIVE PERIOD</span>
                <strong>{startDate}</strong> to <strong>{endDate}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>ABSENCE REASON</span>
                <Badge variant="orange">{reason.replace(/_/g, ' ')}</Badge>
              </div>
            </div>

            {remarks && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>Instructions: </span>
                <em>"{remarks}"</em>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setCurrentStep(3)} className="btn btn-secondary btn-sm">
              ← Back to Details
            </button>
            <button
              onClick={handleFinalSubmit}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #F37023 0%, #D95D16 100%)',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.875rem',
                padding: '0.6rem 1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={15} /> Authorize &amp; Submit Transfer ({selectedWorkItemIds.length} Tasks)
            </button>
          </div>
        </div>
      )}

      {/* ─── 5. MODAL: Work Item Details ─── */}
      {detailModalOpen && selectedItemForDetail && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Work Item &amp; Task Dossier"
          maxWidth="650px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#0B192C', color: '#FFFFFF' }}>
                  {selectedItemForDetail.displayModule}
                </span>
                {renderPriorityBadge(selectedItemForDetail.priority as WorkPriority)}
              </div>
              <h4 style={{ margin: '0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                {selectedItemForDetail.title}
              </h4>
              <div style={{ color: '#475569', lineHeight: 1.5, marginTop: '0.35rem' }}>
                {selectedItemForDetail.description}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'block' }}>STUDENT / REFERENCE</span>
                <strong style={{ color: 'var(--brand-navy)' }}>{selectedItemForDetail.studentRefDisplay}</strong>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'block' }}>DEPARTMENT / MODULE</span>
                <strong style={{ color: 'var(--brand-navy)' }}>{selectedItemForDetail.departmentName || selectedItemForDetail.rawModule}</strong>
              </div>

              {selectedItemForDetail.divisionName && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'block' }}>DIVISION / SEMESTER</span>
                  <strong>{selectedItemForDetail.divisionName} {selectedItemForDetail.semesterNumber ? `(Sem ${selectedItemForDetail.semesterNumber})` : ''}</strong>
                </div>
              )}

              {selectedItemForDetail.weeklyHours && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'block' }}>ACADEMIC LOAD</span>
                  <strong style={{ color: 'var(--brand-orange)' }}>{selectedItemForDetail.weeklyHours} Hours / Week</strong>
                </div>
              )}

              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'block' }}>STATUS</span>
                {renderStatusBadge(selectedItemForDetail)}
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem' }}>
                <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'block' }}>CURRENT OWNER</span>
                <strong>{user?.name || 'Self (Faculty)'}</strong>
              </div>
            </div>

            {selectedItemForDetail.lockReason && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.75rem', borderRadius: '6px', color: '#B91C1C' }}>
                <strong>Restriction:</strong> {selectedItemForDetail.lockReason}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </button>
              {selectedItemForDetail.isAvailable && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--brand-orange)', borderColor: 'var(--brand-orange)' }}
                  onClick={() => {
                    handleToggleWorkItem(selectedItemForDetail);
                    setDetailModalOpen(false);
                  }}
                >
                  {selectedWorkItemIds.includes(selectedItemForDetail.id) ? 'Deselect Task' : 'Select Task'}
                </button>
              )}
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
