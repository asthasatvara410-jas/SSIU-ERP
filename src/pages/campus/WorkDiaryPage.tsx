import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { exportToExcel } from '../../services/exportService';
import {
  WorkDiaryEntry, WorkDiaryFormData, WorkDiaryCategory,
  WorkDiaryPriority, WorkDiaryStatus
} from '../../types';
import {
  BookOpen, Plus, Search, Filter, Calendar, Clock, CheckCircle2,
  AlertTriangle, Clock4, FileText, Download, Printer, RefreshCw,
  Eye, Edit2, Trash2, Users, Briefcase, Tag, AlertCircle, X,
  ChevronRight, CalendarDays, Paperclip, Check, ListChecks
} from 'lucide-react';

export interface WorkDiaryPageProps {
  initialRecordId?: string;
}

export const WorkDiaryPage: React.FC<WorkDiaryPageProps> = ({ initialRecordId }) => {
  const { user, role } = useAuth();

  // State
  const [diaries, setDiaries] = useState<WorkDiaryEntry[]>(() => db.getWorkDiaries());
  const [departments] = useState(() => db.getDepartments());
  const [institutes] = useState(() => db.getInstitutes());

  // Deep-link Auto-Open Exact Diary Record
  useEffect(() => {
    if (initialRecordId && diaries.length > 0) {
      const match = diaries.find(d => d.id === initialRecordId);
      if (match) {
        setViewingDiary(match);
      }
    }
  }, [initialRecordId, diaries]);

  // Scope filter: My Diary vs All Diaries
  const canViewAll = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL' || role === 'HOD' || role === 'REGISTRAR' || role === 'IQAC';
  const [scope, setScope] = useState<'MY' | 'ALL'>(canViewAll ? 'ALL' : 'MY');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL');

  // Active View
  const [activeView, setActiveView] = useState<'TABLE' | 'TIMELINE'>('TABLE');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDiary, setEditingDiary] = useState<WorkDiaryEntry | null>(null);
  const [viewingDiary, setViewingDiary] = useState<WorkDiaryEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notifications & Loading
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const defaultFormData: WorkDiaryFormData = {
    workTitle: '',
    description: '',
    category: 'ACADEMIC',
    workDate: new Date().toISOString().split('T')[0],
    startTime: '09:30',
    endTime: '12:30',
    priority: 'NORMAL',
    status: 'COMPLETED',
    relatedModule: 'Academic Management',
    relatedPerson: '',
    relatedDepartment: user?.departmentId ? (departments.find(d => d.id === user.departmentId)?.name || 'Computer Science') : 'Computer Science & Engineering',
    relatedInstitute: 'SSCIT',
    meetingDetails: '',
    appointmentDetails: '',
    taskDetails: '',
    remarks: '',
    attachments: []
  };

  const [formData, setFormData] = useState<WorkDiaryFormData>(defaultFormData);
  const [attachmentInput, setAttachmentInput] = useState('');

  // Refresh handler
  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDiaries([...db.getWorkDiaries()]);
      setIsLoading(false);
    }, 150);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Date Preset calculation
  const handleDatePreset = (preset: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH') => {
    setDatePreset(preset);
    const todayStr = new Date().toISOString().split('T')[0];
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'THIS_WEEK') {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'THIS_MONTH') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  };

  // Filtered list
  const filteredDiaries = useMemo(() => {
    let list = [...diaries];

    // Scope filter
    if (scope === 'MY' && user?.id) {
      list = list.filter(d => d.userId === user.id);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(d =>
        d.workTitle.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.userName.toLowerCase().includes(q) ||
        (d.relatedPerson && d.relatedPerson.toLowerCase().includes(q)) ||
        (d.relatedDepartment && d.relatedDepartment.toLowerCase().includes(q)) ||
        (d.meetingDetails && d.meetingDetails.toLowerCase().includes(q)) ||
        (d.appointmentDetails && d.appointmentDetails.toLowerCase().includes(q)) ||
        (d.taskDetails && d.taskDetails.toLowerCase().includes(q)) ||
        (d.remarks && d.remarks.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      list = list.filter(d => d.status === selectedStatus);
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(d => d.category === selectedCategory);
    }

    // Priority filter
    if (selectedPriority !== 'ALL') {
      list = list.filter(d => d.priority === selectedPriority);
    }

    // Date filters
    if (startDate) {
      list = list.filter(d => d.workDate >= startDate);
    }
    if (endDate) {
      list = list.filter(d => d.workDate <= endDate);
    }

    return list.sort((a, b) => (b.workDate > a.workDate ? 1 : b.workDate < a.workDate ? -1 : 0));
  }, [diaries, scope, user?.id, searchQuery, selectedStatus, selectedCategory, selectedPriority, startDate, endDate]);

  // Dashboard Stats (Calculated on current scope)
  const stats = useMemo(() => {
    const activeList = scope === 'MY' && user?.id ? diaries.filter(d => d.userId === user.id) : diaries;
    const today = new Date().toISOString().split('T')[0];

    const completed = activeList.filter(d => d.status === 'COMPLETED').length;
    const inProgress = activeList.filter(d => d.status === 'IN_PROGRESS').length;
    const pending = activeList.filter(d => d.status === 'DRAFT' || d.status === 'SUBMITTED').length;
    const overdue = activeList.filter(d => d.status === 'OVERDUE' || (d.workDate < today && d.status !== 'COMPLETED' && d.status !== 'CANCELLED')).length;
    const todayCount = activeList.filter(d => d.workDate === today).length;

    return {
      total: activeList.length,
      completed,
      pending,
      inProgress,
      overdue,
      todayCount
    };
  }, [diaries, scope, user?.id]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDiary(null);
    setFormData({
      ...defaultFormData,
      workDate: new Date().toISOString().split('T')[0],
      relatedDepartment: user?.departmentId ? (departments.find(d => d.id === user.departmentId)?.name || 'Computer Science') : 'Computer Science & Engineering'
    });
    setAttachmentInput('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (diary: WorkDiaryEntry) => {
    setEditingDiary(diary);
    setFormData({
      workTitle: diary.workTitle,
      description: diary.description || '',
      category: diary.category,
      workDate: diary.workDate,
      startTime: diary.startTime || '',
      endTime: diary.endTime || '',
      priority: diary.priority,
      status: diary.status,
      relatedModule: diary.relatedModule || '',
      relatedPerson: diary.relatedPerson || '',
      relatedDepartment: diary.relatedDepartment || '',
      relatedInstitute: diary.relatedInstitute || 'SSCIT',
      meetingDetails: diary.meetingDetails || '',
      appointmentDetails: diary.appointmentDetails || '',
      taskDetails: diary.taskDetails || '',
      remarks: diary.remarks || '',
      attachments: diary.attachments || []
    });
    setAttachmentInput('');
    setShowCreateModal(true);
  };

  // Handle Form Submit (Draft or Active Submit)
  const handleSubmitDiary = (e: React.FormEvent, forceDraft = false) => {
    e.preventDefault();
    if (!formData.workTitle.trim()) {
      showToast('error', 'Work Title is mandatory.');
      return;
    }
    if (!formData.workDate) {
      showToast('error', 'Work Date is required.');
      return;
    }

    const payload: WorkDiaryFormData = {
      ...formData,
      status: forceDraft ? 'DRAFT' : formData.status
    };

    if (editingDiary) {
      const updated = db.updateWorkDiary(editingDiary.id, payload, user || undefined);
      if (updated) {
        showToast('success', `Work Diary entry "${payload.workTitle}" updated successfully.`);
      } else {
        showToast('error', 'Failed to update Work Diary entry.');
      }
    } else {
      const created = db.createWorkDiary(payload, user || undefined);
      showToast('success', `Work Diary entry "${created.workTitle}" created successfully.`);
    }

    setShowCreateModal(false);
    setEditingDiary(null);
    refreshData();
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!deletingId) return;
    const success = db.deleteWorkDiary(deletingId, user || undefined);
    if (success) {
      showToast('success', 'Work Diary entry deleted successfully.');
    } else {
      showToast('error', 'Failed to delete Work Diary entry.');
    }
    setDeletingId(null);
    refreshData();
  };

  // Add attachment
  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) return;
    setFormData({
      ...formData,
      attachments: [...(formData.attachments || []), attachmentInput.trim()]
    });
    setAttachmentInput('');
  };

  // Remove attachment
  const handleRemoveAttachment = (idx: number) => {
    const next = [...(formData.attachments || [])];
    next.splice(idx, 1);
    setFormData({ ...formData, attachments: next });
  };

  // Export Excel / CSV
  const handleExportExcel = () => {
    const headers = [
      'Date', 'Staff Name', 'Role', 'Work Title', 'Category', 'Time Window',
      'Priority', 'Status', 'Related Department', 'Related Person',
      'Meeting Details', 'Appointment Details', 'Task Details', 'Remarks'
    ];
    const rows = filteredDiaries.map(d => [
      d.workDate,
      d.userName,
      d.userRole || 'Staff',
      d.workTitle,
      d.category,
      (d.startTime && d.endTime) ? `${d.startTime} - ${d.endTime}` : (d.startTime || '-'),
      d.priority,
      d.status,
      d.relatedDepartment || '-',
      d.relatedPerson || '-',
      d.meetingDetails || '-',
      d.appointmentDetails || '-',
      d.taskDetails || '-',
      d.remarks || '-'
    ]);

    exportToExcel(
      'Staff Daily Work Diary Log',
      headers,
      rows,
      {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchQuery: searchQuery || undefined
      },
      { name: user?.name, role: user?.role }
    );
  };

  // Print Log
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} color="#10B981" /> : <AlertTriangle size={18} color="#EF4444" />}
            <span>{notification.message}</span>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={28} color="var(--brand-orange)" /> Staff Daily Work Diary &amp; Activity Log
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Log and audit daily administrative tasks, lectures, committee meetings, visitor appointments, and university duty hours.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={refreshData} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Printer size={15} /> Print Log
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Download size={15} /> Export (Excel / CSV)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
            <Plus size={16} /> + New Work Diary Entry
          </button>
        </div>
      </div>

      {/* Real-time KPI Dashboard Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div
          className="card"
          onClick={() => setSelectedStatus('ALL')}
          style={{ borderLeft: '4px solid var(--brand-navy)', padding: '1rem 1.25rem', cursor: 'pointer', background: selectedStatus === 'ALL' ? 'var(--bg-surface-hover)' : '#FFFFFF' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Entries</span>
            <BookOpen size={18} color="var(--brand-navy)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '0.35rem' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats.todayCount} logged today
          </div>
        </div>

        <div
          className="card"
          onClick={() => setSelectedStatus('COMPLETED')}
          style={{ borderLeft: '4px solid #10b981', padding: '1rem 1.25rem', cursor: 'pointer', background: selectedStatus === 'COMPLETED' ? 'var(--bg-surface-hover)' : '#FFFFFF' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 700 }}>Completed</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
          </div>
        </div>

        <div
          className="card"
          onClick={() => setSelectedStatus('IN_PROGRESS')}
          style={{ borderLeft: '4px solid #3b82f6', padding: '1rem 1.25rem', cursor: 'pointer', background: selectedStatus === 'IN_PROGRESS' ? 'var(--bg-surface-hover)' : '#FFFFFF' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 700 }}>In Progress</span>
            <Clock size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1d4ed8', marginTop: '0.35rem' }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Under active execution
          </div>
        </div>

        <div
          className="card"
          onClick={() => setSelectedStatus('DRAFT')}
          style={{ borderLeft: '4px solid var(--brand-orange)', padding: '1rem 1.25rem', cursor: 'pointer', background: selectedStatus === 'DRAFT' ? 'var(--bg-surface-hover)' : '#FFFFFF' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 700 }}>Pending / Drafts</span>
            <FileText size={18} color="var(--brand-orange)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '0.35rem' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Drafted &amp; submitted
          </div>
        </div>

        <div
          className="card"
          onClick={() => setSelectedStatus('OVERDUE')}
          style={{ borderLeft: '4px solid #ef4444', padding: '1rem 1.25rem', cursor: 'pointer', background: selectedStatus === 'OVERDUE' ? 'var(--bg-surface-hover)' : '#FFFFFF' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 700 }}>Overdue</span>
            <Clock4 size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', marginTop: '0.35rem' }}>
            {stats.overdue}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 600 }}>
            Past due action required
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Panel */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Row 1: Search & Scope Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
              placeholder="Search work title, person, department, meeting details, remarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {canViewAll && (
            <div style={{ display: 'flex', background: 'var(--bg-surface-hover)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-xs ${scope === 'MY' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setScope('MY')}
                style={{ fontWeight: 700 }}
              >
                My Diary
              </button>
              <button
                type="button"
                className={`btn btn-xs ${scope === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setScope('ALL')}
                style={{ fontWeight: 700 }}
              >
                All Staff Entries
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'] as const).map(preset => (
              <button
                key={preset}
                type="button"
                className={`btn btn-xs ${datePreset === preset ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleDatePreset(preset)}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {preset === 'ALL' ? 'All Dates' : preset.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Category, Status, Priority, Custom Date Range Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Category</label>
            <select className="form-select" style={{ fontSize: '0.8125rem' }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="ACADEMIC">Academic / Teaching</option>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="MEETING">Meeting / Committee</option>
              <option value="EXAMINATION">Examination</option>
              <option value="RESEARCH">Research &amp; Innovation</option>
              <option value="NAAC">NAAC / Accreditation</option>
              <option value="STUDENT_AFFAIRS">Student Affairs</option>
              <option value="GENERAL">General</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
            <select className="form-select" style={{ fontSize: '0.8125rem' }} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Priority</label>
            <select className="form-select" style={{ fontSize: '0.8125rem' }} value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>From Date</label>
            <input
              type="date"
              className="form-input"
              style={{ fontSize: '0.8125rem' }}
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setDatePreset('ALL');
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>To Date</label>
            <input
              type="date"
              className="form-input"
              style={{ fontSize: '0.8125rem' }}
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setDatePreset('ALL');
              }}
            />
          </div>
        </div>

        {/* Filter Summary Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Showing <strong>{filteredDiaries.length}</strong> matching diary entries</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
              setSelectedPriority('ALL');
              setStartDate('');
              setEndDate('');
              setDatePreset('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Content: Table View */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)' }}>
                <th>Date &amp; Time</th>
                <th>Staff Member</th>
                <th>Work Title &amp; Scope</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Meetings / Tasks</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiaries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--brand-navy)' }}>No Work Diary Entries Found</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Try adjusting search filters or click "+ New Work Diary Entry" to log activities.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDiaries.map(diary => {
                  const hasMeetings = Boolean(diary.meetingDetails);
                  const hasAppointments = Boolean(diary.appointmentDetails);
                  const hasTasks = Boolean(diary.taskDetails);
                  const hasAttachments = Boolean(diary.attachments && diary.attachments.length > 0);

                  return (
                    <tr key={diary.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{diary.workDate}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(diary.startTime && diary.endTime) ? `${diary.startTime} - ${diary.endTime}` : (diary.startTime || 'Full Day')}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{diary.userName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{diary.userRole || 'Faculty / Staff'}</div>
                      </td>

                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{diary.workTitle}</div>
                        {diary.description && (
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {diary.description}
                          </div>
                        )}
                        {diary.relatedDepartment && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--brand-orange)', marginTop: '0.2rem' }}>
                            Dept: {diary.relatedDepartment}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="badge" style={{
                          background: diary.category === 'ACADEMIC' ? 'rgba(59, 130, 246, 0.12)' :
                            diary.category === 'EXAMINATION' ? 'rgba(126, 34, 206, 0.12)' :
                            diary.category === 'RESEARCH' ? 'rgba(16, 185, 129, 0.12)' :
                            diary.category === 'NAAC' ? 'rgba(249, 115, 22, 0.12)' :
                            'rgba(100, 116, 139, 0.12)',
                          color: diary.category === 'ACADEMIC' ? '#1d4ed8' :
                            diary.category === 'EXAMINATION' ? '#7e22ce' :
                            diary.category === 'RESEARCH' ? '#059669' :
                            diary.category === 'NAAC' ? 'var(--brand-orange)' :
                            '#334155',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {diary.category}
                        </span>
                      </td>

                      <td>
                        <span className="badge" style={{
                          background: diary.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.15)' :
                            diary.priority === 'HIGH' ? 'rgba(249, 115, 22, 0.15)' :
                            diary.priority === 'LOW' ? 'rgba(100, 116, 139, 0.15)' :
                            'rgba(16, 185, 129, 0.15)',
                          color: diary.priority === 'URGENT' ? '#dc2626' :
                            diary.priority === 'HIGH' ? 'var(--brand-orange)' :
                            diary.priority === 'LOW' ? '#64748b' :
                            '#16a34a',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {diary.priority}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {hasMeetings && (
                            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', fontSize: '0.7rem' }} title={diary.meetingDetails}>
                              Meeting
                            </span>
                          )}
                          {hasAppointments && (
                            <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--brand-orange)', fontSize: '0.7rem' }} title={diary.appointmentDetails}>
                              Appt
                            </span>
                          )}
                          {hasTasks && (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#16a34a', fontSize: '0.7rem' }} title={diary.taskDetails}>
                              Tasks
                            </span>
                          )}
                          {hasAttachments && (
                            <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#475569', fontSize: '0.7rem' }}>
                              📎 {diary.attachments?.length}
                            </span>
                          )}
                          {!hasMeetings && !hasAppointments && !hasTasks && !hasAttachments && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="badge" style={{
                          background: diary.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' :
                            diary.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.15)' :
                            diary.status === 'DRAFT' ? 'rgba(234, 179, 8, 0.15)' :
                            diary.status === 'OVERDUE' ? 'rgba(239, 68, 68, 0.15)' :
                            'rgba(100, 116, 139, 0.15)',
                          color: diary.status === 'COMPLETED' ? '#16a34a' :
                            diary.status === 'IN_PROGRESS' ? '#1d4ed8' :
                            diary.status === 'DRAFT' ? '#b45309' :
                            diary.status === 'OVERDUE' ? '#dc2626' :
                            '#475569',
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}>
                          {diary.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => setViewingDiary(diary)}
                            title="View Full Work Diary Dossier"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleOpenEdit(diary)}
                            title="Edit Work Diary Entry"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setDeletingId(diary.id)}
                            style={{ color: '#ef4444' }}
                            title="Delete Entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {showCreateModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} color="var(--brand-orange)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  {editingDiary ? 'Edit Daily Work Diary Entry' : 'Record Daily Work Diary Entry'}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={e => handleSubmitDiary(e, false)} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Basic Details */}
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Work Title / Activity Summary *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Conducted Cloud Architecture Lecture & NAAC Criteria 3 Documentation"
                      value={formData.workTitle}
                      onChange={e => setFormData({ ...formData, workTitle: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Activity Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as WorkDiaryCategory })}
                      required
                    >
                      <option value="ACADEMIC">Academic / Teaching</option>
                      <option value="ADMINISTRATIVE">Administrative</option>
                      <option value="MEETING">Meeting / Committee</option>
                      <option value="EXAMINATION">Examination Cell</option>
                      <option value="RESEARCH">Research &amp; Innovation</option>
                      <option value="NAAC">NAAC / Accreditation</option>
                      <option value="STUDENT_AFFAIRS">Student Affairs</option>
                      <option value="GENERAL">General</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.workDate}
                      onChange={e => setFormData({ ...formData, workDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as WorkDiaryPriority })}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as WorkDiaryStatus })}
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="DRAFT">Draft</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Activity Description &amp; Scope</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Provide details on tasks accomplished, syllabus covered, or administrative actions taken..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Related Stakeholders & Department */}
                <div className="grid-2" style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label className="form-label">Related Department / Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science & Engineering"
                      value={formData.relatedDepartment}
                      onChange={e => setFormData({ ...formData, relatedDepartment: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Related Person / Official</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. Ramesh Sharma (HOD), External Auditor"
                      value={formData.relatedPerson}
                      onChange={e => setFormData({ ...formData, relatedPerson: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Related ERP Module</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Academic Management, Examination, Note Sheet"
                      value={formData.relatedModule}
                      onChange={e => setFormData({ ...formData, relatedModule: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Constituent Institute</label>
                    <select
                      className="form-select"
                      value={formData.relatedInstitute}
                      onChange={e => setFormData({ ...formData, relatedInstitute: e.target.value })}
                    >
                      {institutes.map(inst => (
                        <option key={inst.id} value={inst.code}>{inst.name} ({inst.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Integrated Meetings, Appointments & Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ListChecks size={16} color="var(--brand-orange)" /> Meeting, Appointment &amp; Action Item Tracking
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Meeting Details (Agenda, Attendees &amp; Decisions)</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. Attendees: Principal, Registrar. Decisions: Finalized criteria 3 submission date."
                      value={formData.meetingDetails}
                      onChange={e => setFormData({ ...formData, meetingDetails: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Appointment / Visitor Consultation Details</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. Visitor: Prof. Amit Mehta (GTU). Purpose: External moderation. Outcome: Approved question bank."
                      value={formData.appointmentDetails}
                      onChange={e => setFormData({ ...formData, appointmentDetails: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specific Action Items / Deliverables</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. 1. Submit revised rubric (Done). 2. Prepare student notice (Pending)."
                      value={formData.taskDetails}
                      onChange={e => setFormData({ ...formData, taskDetails: e.target.value })}
                    />
                  </div>
                </div>

                {/* Remarks & Attachments */}
                <div className="form-group">
                  <label className="form-label">Remarks &amp; Personal Notes</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Additional follow-up notes or self-reflections..."
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attachments (Document proof / links)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter file name or URL (e.g. attendance_sheet_aug15.pdf)"
                      value={attachmentInput}
                      onChange={e => setAttachmentInput(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" onClick={handleAddAttachment}>
                      Add
                    </button>
                  </div>

                  {formData.attachments && formData.attachments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {formData.attachments.map((att, idx) => (
                        <span key={idx} className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Paperclip size={12} /> {att}
                          <button type="button" onClick={() => handleRemoveAttachment(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 800 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={e => handleSubmitDiary(e, true)}
                >
                  Save as Draft
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                    {editingDiary ? 'Update Work Diary' : 'Submit Work Diary'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW WORK DIARY DOSSIER MODAL ─── */}
      {viewingDiary && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '750px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 800 }}>
                  {viewingDiary.category}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0 0 0', color: '#FFFFFF' }}>
                  {viewingDiary.workTitle}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewingDiary(null)} style={{ color: '#FFFFFF' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Quick Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staff Member</div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{viewingDiary.userName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Work Date</div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{viewingDiary.workDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Slot</div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {(viewingDiary.startTime && viewingDiary.endTime) ? `${viewingDiary.startTime} - ${viewingDiary.endTime}` : (viewingDiary.startTime || 'Full Day')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                  <span className="badge" style={{ fontWeight: 800 }}>{viewingDiary.status}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>Activity Description</h4>
                <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, background: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  {viewingDiary.description || 'No detailed description recorded.'}
                </div>
              </div>

              {/* Meetings, Appointments & Tasks */}
              {(viewingDiary.meetingDetails || viewingDiary.appointmentDetails || viewingDiary.taskDetails) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                    Meetings, Appointments &amp; Action Items
                  </h4>

                  {viewingDiary.meetingDetails && (
                    <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #3b82f6', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>Meeting Summary:</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{viewingDiary.meetingDetails}</div>
                    </div>
                  )}

                  {viewingDiary.appointmentDetails && (
                    <div style={{ padding: '0.75rem', background: 'rgba(249, 115, 22, 0.05)', borderLeft: '3px solid var(--brand-orange)', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--brand-orange)' }}>Appointment / Visitor Consultation:</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{viewingDiary.appointmentDetails}</div>
                    </div>
                  )}

                  {viewingDiary.taskDetails && (
                    <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10b981', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#059669' }}>Deliverables &amp; Tasks:</strong>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{viewingDiary.taskDetails}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Remarks & Attachments */}
              {viewingDiary.remarks && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>Remarks</h4>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>{viewingDiary.remarks}</div>
                </div>
              )}

              {viewingDiary.attachments && viewingDiary.attachments.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>Attachments</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {viewingDiary.attachments.map((att, idx) => (
                      <span key={idx} className="badge" style={{ background: 'var(--bg-surface-hover)', padding: '0.35rem 0.65rem' }}>
                        📎 {att}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit trail */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                Created: {new Date(viewingDiary.createdAt).toLocaleString()} | Last Updated: {new Date(viewingDiary.updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setViewingDiary(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => { const d = viewingDiary; setViewingDiary(null); handleOpenEdit(d); }}>
                <Edit2 size={14} /> Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingId && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={20} /> Delete Work Diary Entry
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Are you sure you want to delete this Work Diary entry? This action will remove the record from your work audit history.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} style={{ background: '#ef4444', color: '#fff' }}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
