import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { workTransferService } from '../../services/workTransferService';
import { 
  FacultyWorkloadItem, 
  FacultyPortfolioSummary, 
  FacultyWorkloadKPIs, 
  WorkItemType, 
  WorkStatus 
} from '../../types/workTransfer';
import { Badge } from '../../components/common/Badge';
import { AssignWorkloadModal } from '../../components/work-transfer/AssignWorkloadModal';
import { 
  Briefcase, CheckSquare, Clock, AlertTriangle, CheckCircle2, 
  Calendar, Search, Filter, ArrowLeftRight, Download, Plus, 
  UserCheck, BookOpen, Layers, Award, FileSpreadsheet, Eye, ChevronRight,
  GraduationCap, Building2, Shield, Users, HelpCircle
} from 'lucide-react';

interface MyWorkPageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

export const MyWorkPage: React.FC<MyWorkPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const isAdminOrHOD = user?.role === 'SUPER_ADMIN' || user?.role === 'UNIVERSITY_ADMIN' || user?.role === 'HOD' || user?.role === 'PRINCIPAL' || user?.role === 'VICE_PRESIDENT';
  
  const allFaculty = useMemo(() => db.getFaculty(), []);
  const allDepartments = useMemo(() => db.getDepartments ? db.getDepartments() : [], []);
  
  // Selected Faculty (Default to logged-in user or fac-1)
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(() => {
    if (!isAdminOrHOD && user?.id) return user.id;
    return user?.id || allFaculty[0]?.id || 'fac-1';
  });

  // Main Tab View Toggle: "WORKLOAD_REGISTER" vs "PORTFOLIO_VIEW"
  const [activeView, setActiveView] = useState<'WORKLOAD_REGISTER' | 'PORTFOLIO_VIEW'>('WORKLOAD_REGISTER');

  // Filters
  const [filterSection, setFilterSection] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DUE_TODAY' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination & Sorting
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof FacultyWorkloadItem>('workId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync transfers on mount / key change
  useEffect(() => {
    workTransferService.autoSyncTransferStatuses();
  }, [refreshKey]);

  // Load Faculty Portfolio & Workloads dynamically from Central Master
  const portfolio: FacultyPortfolioSummary = useMemo(() => {
    return workTransferService.getFacultyPortfolio(selectedFacultyId);
  }, [selectedFacultyId, refreshKey]);

  const kpis: FacultyWorkloadKPIs = useMemo(() => {
    return workTransferService.getFacultyWorkloadKPIs(selectedFacultyId);
  }, [selectedFacultyId, refreshKey]);

  const allWorkloads: FacultyWorkloadItem[] = useMemo(() => {
    return workTransferService.getFacultyWorkloadItems(selectedFacultyId);
  }, [selectedFacultyId, refreshKey]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filtered Items
  const filteredWorkloads = useMemo(() => {
    return allWorkloads.filter(item => {
      // Top status filter
      if (filterSection === 'PENDING' && item.status !== 'PENDING') return false;
      if (filterSection === 'IN_PROGRESS' && item.status !== 'IN_PROGRESS' && item.status !== 'ACTIVE') return false;
      if (filterSection === 'DUE_TODAY' && (!item.dueDate || item.dueDate.slice(0, 10) !== todayStr)) return false;
      if (filterSection === 'OVERDUE' && (!item.dueDate || item.dueDate.slice(0, 10) >= todayStr || item.status === 'COMPLETED')) return false;
      if (filterSection === 'COMPLETED' && item.status !== 'COMPLETED') return false;

      // Work type filter
      if (selectedWorkType !== 'ALL' && item.workType !== selectedWorkType) return false;

      // Department filter
      if (selectedDepartment !== 'ALL' && item.departmentName !== selectedDepartment) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.workId.toLowerCase().includes(q) ||
          item.workTitle.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.subjectName && item.subjectName.toLowerCase().includes(q)) ||
          (item.courseCode && item.courseCode.toLowerCase().includes(q)) ||
          (item.responsibility && item.responsibility.toLowerCase().includes(q)) ||
          (item.studentReference && item.studentReference.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [allWorkloads, filterSection, selectedWorkType, selectedDepartment, searchQuery, todayStr]);

  // Sorted Items
  const sortedWorkloads = useMemo(() => {
    return [...filteredWorkloads].sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredWorkloads, sortField, sortDirection]);

  // Paginated Items
  const totalPages = Math.ceil(sortedWorkloads.length / pageSize) || 1;
  const paginatedWorkloads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedWorkloads.slice(start, start + pageSize);
  }, [sortedWorkloads, currentPage, pageSize]);

  const handleSort = (field: keyof FacultyWorkloadItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportExcel = async () => {
    await workTransferService.exportFacultyWorkloadToExcel(selectedFacultyId, filteredWorkloads, portfolio);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <Badge variant="danger">CRITICAL</Badge>;
      case 'HIGH': return <Badge variant="orange">HIGH</Badge>;
      case 'MEDIUM': return <Badge variant="warning">MEDIUM</Badge>;
      default: return <Badge variant="navy">LOW</Badge>;
    }
  };

  const getStatusBadge = (status: WorkStatus, isTransferredOut?: boolean, isReceivedTransfer?: boolean) => {
    if (isTransferredOut) {
      return <Badge variant="warning">TRANSFERRED</Badge>;
    }
    if (isReceivedTransfer) {
      return <Badge variant="purple">DELEGATED IN</Badge>;
    }
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">ACTIVE</Badge>;
      case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
      case 'IN_PROGRESS': return <Badge variant="active">IN PROGRESS</Badge>;
      case 'PENDING': return <Badge variant="warning">PENDING</Badge>;
      default: return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      
      {/* ═══ HEADER BANNER ═══ */}
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
            <Briefcase size={24} color="#F37023" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
              Faculty Workload & Portfolio Management
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', margin: '4px 0 0 0' }}>
            Official Central Workload Register, Academic Teaching Hours, Student Mentoring & Administrative Portfolios
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {isAdminOrHOD && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="btn btn-primary"
              style={{
                background: '#F37023',
                borderColor: '#F37023',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.45rem 0.9rem'
              }}
            >
              <Plus size={15} /> Assign Workload
            </button>
          )}

          <button
            onClick={() => setActiveTab && setActiveTab('work-transfer-new')}
            className="btn btn-secondary"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0.45rem 0.9rem'
            }}
          >
            <ArrowLeftRight size={15} /> Transfer Work
          </button>

          <button
            onClick={handleExportExcel}
            className="btn btn-secondary"
            style={{
              background: '#FFFFFF',
              borderColor: '#E2E8F0',
              color: '#001F3F',
              fontWeight: 700,
              fontSize: '0.8125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0.45rem 0.9rem'
            }}
          >
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* ═══ FACULTY SELECTOR (FOR ADMIN/HOD) & PROFILE SUMMARY CARD ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: '1rem 1.25rem', 
          background: '#FFFFFF', 
          borderRadius: '8px', 
          border: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Faculty Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Faculty Profile:
            </label>
            {isAdminOrHOD ? (
              <select
                className="form-control"
                value={selectedFacultyId}
                onChange={e => setSelectedFacultyId(e.target.value)}
                style={{ fontSize: '0.84rem', fontWeight: 700, color: '#001F3F', maxWidth: '400px' }}
              >
                {allFaculty.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.employeeId} - {fac.designation})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#001F3F' }}>
                {portfolio.facultyName} ({portfolio.employeeId} • {portfolio.designation})
              </div>
            )}
          </div>

          {/* View Toggle Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setActiveView('WORKLOAD_REGISTER')}
              style={{
                padding: '0.35rem 0.85rem',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.78125rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeView === 'WORKLOAD_REGISTER' ? '#001F3F' : 'transparent',
                color: activeView === 'WORKLOAD_REGISTER' ? '#FFFFFF' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FileSpreadsheet size={14} /> Workload Register
            </button>
            <button
              onClick={() => setActiveView('PORTFOLIO_VIEW')}
              style={{
                padding: '0.35rem 0.85rem',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.78125rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeView === 'PORTFOLIO_VIEW' ? '#001F3F' : 'transparent',
                color: activeView === 'PORTFOLIO_VIEW' ? '#FFFFFF' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Layers size={14} /> Faculty Portfolio View
            </button>
          </div>
        </div>

        {/* Quick Meta Row */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E2E8F0',
            fontSize: '0.75rem'
          }}
        >
          <div>
            <span style={{ color: '#64748B' }}>Department:</span>{' '}
            <strong style={{ color: '#0F2C59' }}>{portfolio.departmentName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Institute:</span>{' '}
            <strong style={{ color: '#0F2C59' }}>{portfolio.instituteName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Academic Year:</span>{' '}
            <strong style={{ color: '#0F2C59' }}>{portfolio.academicYear}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Specialization:</span>{' '}
            <strong style={{ color: '#0F2C59' }}>{portfolio.specialization}</strong>
          </div>
        </div>
      </div>

      {/* ═══ 9 DYNAMIC TOP KPI CARDS (ZERO HARDCODING) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
        {[
          { label: 'Total Weekly Load', val: `${kpis.totalWeeklyLoad} Hrs/Wk`, bg: '#001F3F', color: '#FFFFFF', icon: Clock, sub: 'Lectures + Practicals' },
          { label: 'Lecture Load', val: `${kpis.lectureLoad} Hrs/Wk`, bg: '#EFF6FF', color: '#1E40AF', icon: BookOpen, sub: 'Theory Classes' },
          { label: 'Practical Load', val: `${kpis.practicalLoad} Hrs/Wk`, bg: '#ECFDF5', color: '#065F46', icon: Layers, sub: 'Laboratory Sessions' },
          { label: 'Mentoring Load', val: `${kpis.mentoringLoad} Mentees`, bg: '#FEF3C7', color: '#92400E', icon: Users, sub: 'Assigned Students' },
          { label: 'Admin Duties', val: `${kpis.administrativeDuties}`, bg: '#F5F3FF', color: '#5B21B6', icon: Shield, sub: 'Portfolios & Committees' },
          { label: 'Pending Tasks', val: `${kpis.pendingTasks}`, bg: '#FFFBEB', color: '#B45309', icon: Clock, sub: 'Awaiting Action' },
          { label: 'In Progress', val: `${kpis.inProgress}`, bg: '#E0F2FE', color: '#0369A1', icon: CheckSquare, sub: 'Active Load' },
          { label: 'Due Today', val: `${kpis.dueToday}`, bg: '#FEF2F2', color: '#B91C1C', icon: Calendar, sub: 'Immediate Due' },
          { label: 'Overdue', val: `${kpis.overdue}`, bg: '#FDF2F8', color: '#9D174D', icon: AlertTriangle, sub: 'Action Required' }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="card"
              style={{
                padding: '0.75rem',
                background: card.bg,
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: card.bg === '#001F3F' ? 'rgba(255,255,255,0.8)' : '#64748B', textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <Icon size={14} color={card.bg === '#001F3F' ? '#F37023' : card.color} />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: card.color, marginTop: '0.35rem' }}>
                {card.val}
              </div>
              <div style={{ fontSize: '0.625rem', color: card.bg === '#001F3F' ? 'rgba(255,255,255,0.7)' : '#64748B', marginTop: '0.2rem' }}>
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1: 20-COLUMN OFFICIAL UNIVERSITY WORKLOAD REGISTER TABLE
         ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'WORKLOAD_REGISTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Filter Bar */}
          <div 
            className="card" 
            style={{ 
              padding: '0.85rem 1.25rem', 
              background: '#FFFFFF', 
              borderRadius: '8px', 
              border: '1px solid #CBD5E1' 
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
              {/* Search */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Search Workload</label>
                <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                  <input
                    type="text"
                    placeholder="Work ID, Title, Subject, Code..."
                    className="form-control"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ fontSize: '0.8125rem', paddingLeft: '2rem' }}
                  />
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Work Type Filter */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Work Type</label>
                <select
                  className="form-control"
                  value={selectedWorkType}
                  onChange={e => {
                    setSelectedWorkType(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Work Types</option>
                  <option value="LECTURE">Lecture (Theory)</option>
                  <option value="PRACTICAL">Practical / Lab</option>
                  <option value="TUTORIAL">Tutorial</option>
                  <option value="PROJECT_SUPERVISION">Project Supervision</option>
                  <option value="MENTORING">Student Mentoring</option>
                  <option value="EXAMINATION_DUTY">Examination Duty</option>
                  <option value="EVALUATION">Evaluation / Assessment</option>
                  <option value="ACADEMIC_COORDINATION">Academic Coordination</option>
                  <option value="DEPARTMENT_COORDINATION">Department Coordination</option>
                  <option value="EDP_DUTY">EDP Duty</option>
                  <option value="COMMITTEE">Committee</option>
                  <option value="ADMINISTRATIVE">Administrative</option>
                  <option value="EVENT_ACTIVITY">Event / Activity</option>
                  <option value="OTHER">Other Assigned Work</option>
                </select>
              </div>

              {/* Status Section Tabs */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Filter By Status</label>
                <select
                  className="form-control"
                  value={filterSection}
                  onChange={e => {
                    setFilterSection(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Statuses ({allWorkloads.length})</option>
                  <option value="IN_PROGRESS">Active / In Progress ({kpis.inProgress})</option>
                  <option value="PENDING">Pending Tasks ({kpis.pendingTasks})</option>
                  <option value="DUE_TODAY">Due Today ({kpis.dueToday})</option>
                  <option value="OVERDUE">Overdue ({kpis.overdue})</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Rows Per Page */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Rows Per Page</label>
                <select
                  className="form-control"
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value={10}>10 Records</option>
                  <option value={25}>25 Records</option>
                  <option value={50}>50 Records</option>
                  <option value={100}>100 Records</option>
                </select>
              </div>
            </div>
          </div>

          {/* 20-Column Official University ERP Register */}
          <div 
            className="card" 
            style={{ 
              padding: 0, 
              borderRadius: '8px', 
              border: '1px solid #CBD5E1', 
              overflow: 'hidden', 
              background: '#FFFFFF' 
            }}
          >
            <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
              <table style={{ width: '100%', minWidth: '2100px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#FFFFFF' }}>
                  <tr>
                    {[
                      { key: 'sr', label: 'Sr. No.', width: '65px', align: 'center' },
                      { key: 'workId', label: 'Work ID', width: '95px', align: 'center' },
                      { key: 'workType', label: 'Work Type', width: '160px', align: 'center' },
                      { key: 'workTitle', label: 'Work Title', width: '220px', align: 'left' },
                      { key: 'description', label: 'Description', width: '280px', align: 'left' },
                      { key: 'subjectName', label: 'Subject / Module', width: '180px', align: 'left' },
                      { key: 'courseCode', label: 'Course Code', width: '110px', align: 'center' },
                      { key: 'programName', label: 'Program', width: '160px', align: 'left' },
                      { key: 'semesterNumber', label: 'Semester', width: '90px', align: 'center' },
                      { key: 'divisionName', label: 'Division', width: '100px', align: 'center' },
                      { key: 'instituteName', label: 'Institute', width: '140px', align: 'left' },
                      { key: 'departmentName', label: 'Department', width: '160px', align: 'left' },
                      { key: 'studentReference', label: 'Student / Reference', width: '160px', align: 'left' },
                      { key: 'assignedDate', label: 'Assigned Date', width: '110px', align: 'center' },
                      { key: 'dueDate', label: 'Due Date', width: '110px', align: 'center' },
                      { key: 'weeklyHours', label: 'Weekly Load', width: '120px', align: 'center' },
                      { key: 'priority', label: 'Priority', width: '100px', align: 'center' },
                      { key: 'responsibility', label: 'Responsibility', width: '160px', align: 'left' },
                      { key: 'status', label: 'Status', width: '120px', align: 'center' },
                      { key: 'action', label: 'Action', width: '120px', align: 'center' }
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.key !== 'sr' && col.key !== 'action' && handleSort(col.key as any)}
                        style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: col.align as any,
                          width: col.width,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: col.key !== 'sr' && col.key !== 'action' ? 'pointer' : 'default',
                          userSelect: 'none'
                        }}
                      >
                        {col.label}
                        {sortField === col.key && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedWorkloads.length === 0 ? (
                    <tr>
                      <td colSpan={20} style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                        <Briefcase size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontWeight: 600 }}>No workload records found matching the active criteria.</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedWorkloads.map((item, idx) => {
                      const absoluteIndex = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={item.id}
                          style={{
                            background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                            borderBottom: '1px solid #E2E8F0'
                          }}
                        >
                          {/* 1. Sr. No. */}
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                            {absoluteIndex}
                          </td>

                          {/* 2. Work ID */}
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: '#001F3F' }}>
                            <code>{item.workId}</code>
                          </td>

                          {/* 3. Work Type */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <span 
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '4px', 
                                fontSize: '0.6875rem', 
                                fontWeight: 700,
                                background: item.workType === 'LECTURE' ? '#EFF6FF' : item.workType === 'PRACTICAL' ? '#ECFDF5' : item.workType === 'MENTORING' ? '#FEF3C7' : '#F1F5F9',
                                color: item.workType === 'LECTURE' ? '#1E40AF' : item.workType === 'PRACTICAL' ? '#065F46' : item.workType === 'MENTORING' ? '#92400E' : '#475569'
                              }}
                            >
                              {item.workType}
                            </span>
                          </td>

                          {/* 4. Work Title */}
                          <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>
                            {item.workTitle}
                          </td>

                          {/* 5. Description */}
                          <td style={{ padding: '0.65rem', color: '#475569', lineHeight: '1.4' }}>
                            {item.description}
                          </td>

                          {/* 6. Subject / Module */}
                          <td style={{ padding: '0.65rem' }}>
                            {item.subjectName || '—'}
                          </td>

                          {/* 7. Course Code */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            {item.courseCode ? <code>{item.courseCode}</code> : '—'}
                          </td>

                          {/* 8. Program */}
                          <td style={{ padding: '0.65rem' }}>
                            {item.programName || 'B.Tech CSE'}
                          </td>

                          {/* 9. Semester */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            {item.semesterNumber ? `Sem ${item.semesterNumber}` : '—'}
                          </td>

                          {/* 10. Division */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            {item.divisionName || '—'}
                          </td>

                          {/* 11. Institute */}
                          <td style={{ padding: '0.65rem' }}>
                            {item.instituteName || 'Swarrnim SSCIT'}
                          </td>

                          {/* 12. Department */}
                          <td style={{ padding: '0.65rem' }}>
                            {item.departmentName || 'Computer Engineering'}
                          </td>

                          {/* 13. Student / Reference */}
                          <td style={{ padding: '0.65rem', fontWeight: 600, color: '#001F3F' }}>
                            {item.studentReference || '—'}
                          </td>

                          {/* 14. Assigned Date */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            {item.assignedDate}
                          </td>

                          {/* 15. Due Date */}
                          <td style={{ padding: '0.65rem', textAlign: 'center', color: item.dueDate && item.dueDate < todayStr && item.status !== 'COMPLETED' ? '#DC2626' : '#475569', fontWeight: item.dueDate && item.dueDate < todayStr ? 700 : 400 }}>
                            {item.dueDate || '—'}
                          </td>

                          {/* 16. Weekly Load */}
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: item.weeklyHours ? '#001F3F' : '#94A3B8' }}>
                            {item.weeklyHours ? `${item.weeklyHours} Hrs/Week` : '—'}
                          </td>

                          {/* 17. Priority */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            {getPriorityBadge(item.priority)}
                          </td>

                          {/* 18. Responsibility */}
                          <td style={{ padding: '0.65rem' }}>
                            {item.responsibility}
                          </td>

                          {/* 19. Status */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            {getStatusBadge(item.status, item.isTransferredOut, item.isReceivedTransfer)}
                          </td>

                          {/* 20. Action */}
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                if (setActiveTab) {
                                  setActiveTab('work-transfer-new');
                                }
                              }}
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.71875rem' }}
                            >
                              Transfer &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.75rem 1.25rem', 
                borderTop: '1px solid #CBD5E1', 
                background: '#F8FAFC' 
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredWorkloads.length)} of {filteredWorkloads.length} items
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  &larr; Prev
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 0.5rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2: FACULTY PORTFOLIO & COMPREHENSIVE RESPONSIBILITIES VIEW
         ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'PORTFOLIO_VIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section 1: Academic Load */}
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} color="#001F3F" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#001F3F' }}>
                  1. Academic Load Breakdown ({portfolio.totalWeeklyAcademicHours} Total Weekly Hours)
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge variant="navy">Lectures: {portfolio.lectureLoadHours}h</Badge>
                <Badge variant="success">Practicals: {portfolio.practicalLoadHours}h</Badge>
                <Badge variant="warning">Tutorials: {portfolio.tutorialLoadHours}h</Badge>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '0.65rem', textAlign: 'left', fontWeight: 700 }}>Subject Code</th>
                    <th style={{ padding: '0.65rem', textAlign: 'left', fontWeight: 700 }}>Subject Name</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Type</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Semester & Division</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Weekly Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.assignedSubjects.map((sub, sIdx) => (
                    <tr key={sIdx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.65rem' }}><code>{sub.code}</code></td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>{sub.name}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700, background: sub.type === 'PRACTICAL' ? '#ECFDF5' : '#EFF6FF', color: sub.type === 'PRACTICAL' ? '#065F46' : '#1E40AF' }}>
                          {sub.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>Sem {sub.semester} ({sub.division})</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: '#001F3F' }}>{sub.weeklyHours} Hrs/Week</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Student Mentoring & Proctoring */}
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#F37023" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#001F3F' }}>
                  2. Student Responsibilities & Mentoring ({portfolio.mentorStudentsCount} Assigned Mentees)
                </h3>
              </div>
              <Badge variant="orange">Proctor Head</Badge>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, width: '60px' }}>Sr.</th>
                    <th style={{ padding: '0.65rem', textAlign: 'left', fontWeight: 700 }}>Student Name</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Enrollment No.</th>
                    <th style={{ padding: '0.65rem', textAlign: 'left', fontWeight: 700 }}>Program</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Semester</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>Division</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.mentorStudentsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B' }}>No mentee students assigned currently.</td>
                    </tr>
                  ) : (
                    portfolio.mentorStudentsList.map((m, mIdx) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.65rem', textAlign: 'center', color: '#64748B' }}>{mIdx + 1}</td>
                        <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>{m.name}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}><code>{m.enrollmentNo}</code></td>
                        <td style={{ padding: '0.65rem' }}>{m.program}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>Sem {m.semester}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>{m.division}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Administrative & Committee Portfolios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Administrative */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Shield size={18} color="#001F3F" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#001F3F' }}>
                  3. Administrative Portfolio
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {portfolio.administrativeResponsibilities.map((adm, aIdx) => (
                  <div key={aIdx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#0F2C59' }}>{adm.title}</strong>
                      <Badge variant="navy">{adm.role}</Badge>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>{adm.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Examination & Committees */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Award size={18} color="#F37023" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#001F3F' }}>
                  4. Examination & Committees
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {portfolio.examinationResponsibilities.map((ex, eIdx) => (
                  <div key={eIdx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#0F2C59' }}>{ex.examName}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{ex.date}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600, marginTop: '2px' }}>
                      Duty: {ex.dutyType}
                    </div>
                  </div>
                ))}

                {portfolio.committeeResponsibilities.map((com, cIdx) => (
                  <div key={cIdx} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#0F2C59' }}>{com.committeeName}</strong>
                      <Badge variant="success">{com.designation}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═══ WORKLOAD ASSIGNMENT MODAL ═══ */}
      <AssignWorkloadModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={() => setRefreshKey(k => k + 1)}
        currentUser={user}
        defaultFacultyId={selectedFacultyId}
      />

    </div>
  );
};
