import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  departmentScopeService, 
  FacultyWorkloadItem, 
  FacultyWorkloadStatus 
} from '../../services/departmentScopeService';
import { 
  Subject, Faculty, Program, Semester 
} from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  Search, Filter, RotateCcw, Plus, Download, FileSpreadsheet, 
  Eye, Edit, Check, X, ArrowUpDown, ArrowUp, ArrowDown, 
  Users, BookOpen, Clock, AlertTriangle, CheckCircle2, UserCheck,
  Mail, Phone, Building2, Layers, Award, ShieldCheck, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DepartmentFacultyWorkloadGridProps {
  onRefreshParent?: () => void;
}

type SortField = 'facultyName' | 'employeeId' | 'designation' | 'theoryHours' | 'labHours' | 'totalWeeklyHours' | 'workloadStatus';
type SortDirection = 'asc' | 'desc';

export const DepartmentFacultyWorkloadGrid: React.FC<DepartmentFacultyWorkloadGridProps> = ({
  onRefreshParent
}) => {
  const { user, role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Search & Filter State ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('ALL');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState('ALL');
  const [selectedWorkloadStatusFilter, setSelectedWorkloadStatusFilter] = useState('ALL');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState('ALL');

  // ─── Table Sorting & Selection ────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('facultyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [viewingFaculty, setViewingFaculty] = useState<FacultyWorkloadItem | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<FacultyWorkloadItem | null>(null);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocFacultyId, setAllocFacultyId] = useState('');
  const [allocProgramId, setAllocProgramId] = useState('');
  const [allocSemesterId, setAllocSemesterId] = useState('');
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocDivisionId, setAllocDivisionId] = useState('Div A');
  const [allocTheoryHours, setAllocTheoryHours] = useState<number>(3);
  const [allocLabHours, setAllocLabHours] = useState<number>(2);

  // Edit Faculty Form State
  const [editDesignation, setEditDesignation] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editIsMentor, setEditIsMentor] = useState(false);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Scope & Department Faculty Data ──────────────────────────────────────
  const scope = useMemo(() => {
    return departmentScopeService.resolveScopeIdentity(user, role || undefined);
  }, [user, role, refreshKey]);

  const rawFacultyWorkload = useMemo(() => {
    return departmentScopeService.getFacultyWorkloadOverview(user, role || undefined);
  }, [user, role, refreshKey]);

  const deptPrograms = useMemo(() => scope.programs, [scope]);
  const deptSubjects = useMemo(() => departmentScopeService.getScopedSubjects(user, role || undefined), [user, role, refreshKey]);
  const deptSemesters = useMemo(() => scope.semesters, [scope]);

  // Unique designations for filter dropdown
  const uniqueDesignations = useMemo(() => {
    const set = new Set<string>();
    rawFacultyWorkload.forEach(f => {
      if (f.designation) set.add(f.designation);
    });
    return Array.from(set);
  }, [rawFacultyWorkload]);

  // ─── Multi-Parameter Filtered & Searched Faculty List ─────────────────────
  const filteredFaculty = useMemo(() => {
    return rawFacultyWorkload.filter(item => {
      // Program filter
      if (selectedProgramFilter !== 'ALL' && item.programId !== selectedProgramFilter && item.programCode !== selectedProgramFilter) {
        return false;
      }
      // Designation filter
      if (selectedDesignationFilter !== 'ALL' && item.designation !== selectedDesignationFilter) {
        return false;
      }
      // Workload status filter
      if (selectedWorkloadStatusFilter !== 'ALL') {
        if (selectedWorkloadStatusFilter === 'UNDERLOAD' && item.workloadStatus !== 'UNDERLOAD' && item.workloadStatus !== 'UNDERLOADED') return false;
        if (selectedWorkloadStatusFilter === 'NORMAL' && item.workloadStatus !== 'NORMAL') return false;
        if (selectedWorkloadStatusFilter === 'HIGH LOAD' && item.workloadStatus !== 'HIGH LOAD') return false;
        if (selectedWorkloadStatusFilter === 'OVERLOAD' && item.workloadStatus !== 'OVERLOAD' && item.workloadStatus !== 'OVERLOADED') return false;
      }
      // Mentor filter
      if (selectedMentorFilter !== 'ALL') {
        if (selectedMentorFilter === 'YES' && !item.isMentor) return false;
        if (selectedMentorFilter === 'NO' && item.isMentor) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.facultyName.toLowerCase().includes(q);
        const matchesEmpId = item.employeeId.toLowerCase().includes(q);
        const matchesDesignation = item.designation.toLowerCase().includes(q);
        const matchesSubject = item.assignedSubjects.some(s => 
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesEmpId && !matchesDesignation && !matchesSubject) {
          return false;
        }
      }
      return true;
    });
  }, [
    rawFacultyWorkload, 
    selectedProgramFilter, 
    selectedDesignationFilter, 
    selectedWorkloadStatusFilter, 
    selectedMentorFilter, 
    searchQuery
  ]);

  // ─── Sorted Faculty Data ──────────────────────────────────────────────────
  const sortedFaculty = useMemo(() => {
    return [...filteredFaculty].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'facultyName') {
        comparison = a.facultyName.localeCompare(b.facultyName);
      } else if (sortField === 'employeeId') {
        comparison = a.employeeId.localeCompare(b.employeeId);
      } else if (sortField === 'designation') {
        comparison = a.designation.localeCompare(b.designation);
      } else if (sortField === 'theoryHours') {
        comparison = a.theoryHours - b.theoryHours;
      } else if (sortField === 'labHours') {
        comparison = a.labHours - b.labHours;
      } else if (sortField === 'totalWeeklyHours') {
        comparison = a.totalWeeklyHours - b.totalWeeklyHours;
      } else if (sortField === 'workloadStatus') {
        comparison = a.workloadStatus.localeCompare(b.workloadStatus);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredFaculty, sortField, sortDirection]);

  // ─── Workload Specific Dynamic KPI Summary Metrics ───────────────────────
  const summaryKPIs = useMemo(() => {
    const totalFaculty = filteredFaculty.length;
    const totalWeeklyHours = filteredFaculty.reduce((sum, f) => sum + f.totalWeeklyHours, 0);
    const averageWorkload = totalFaculty > 0 ? Math.round((totalWeeklyHours / totalFaculty) * 10) / 10 : 0;
    const underloadedCount = filteredFaculty.filter(f => f.totalWeeklyHours < 12).length;
    const optimalCount = filteredFaculty.filter(f => f.totalWeeklyHours >= 12 && f.totalWeeklyHours <= 16).length;
    const highLoadCount = filteredFaculty.filter(f => f.totalWeeklyHours > 16 && f.totalWeeklyHours <= 20).length;
    const overloadedCount = filteredFaculty.filter(f => f.totalWeeklyHours > 20).length;

    return {
      totalFaculty,
      totalWeeklyHours,
      averageWorkload,
      underloadedCount,
      optimalCount,
      highLoadCount,
      overloadedCount
    };
  }, [filteredFaculty]);

  // ─── Sorting Click Handler ────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.4, marginLeft: '4px', verticalAlign: 'middle' }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} style={{ color: 'var(--brand-orange, #F37023)', marginLeft: '4px', verticalAlign: 'middle' }} />
      : <ArrowDown size={12} style={{ color: 'var(--brand-orange, #F37023)', marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  // ─── Selection Handlers ───────────────────────────────────────────────────
  const isAllSelected = sortedFaculty.length > 0 && selectedFacultyIds.length === sortedFaculty.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFacultyIds([]);
    } else {
      setSelectedFacultyIds(sortedFaculty.map(f => f.facultyId));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedFacultyIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ─── Filter Reset ─────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProgramFilter('ALL');
    setSelectedDesignationFilter('ALL');
    setSelectedWorkloadStatusFilter('ALL');
    setSelectedMentorFilter('ALL');
  };

  // ─── Export to Excel (.xlsx) ──────────────────────────────────────────────
  const handleExportWorkloadXLSX = (onlySelected: boolean = false) => {
    const listToExport = onlySelected 
      ? sortedFaculty.filter(f => selectedFacultyIds.includes(f.facultyId))
      : sortedFaculty;

    if (listToExport.length === 0) {
      showToast('No faculty records to export.');
      return;
    }

    const rows = listToExport.map(f => ({
      'Faculty Name': f.facultyName,
      'Employee ID': f.employeeId,
      'Designation': f.designation,
      'Department': f.departmentName,
      'Program': f.programName,
      'Branch': f.programCode,
      'Assigned Subjects': f.assignedSubjects.map(s => s.code).join(', ') || 'None',
      'Theory Hours / Week': f.theoryHours,
      'Lab Hours / Week': f.labHours,
      'Total Hours / Week': f.totalWeeklyHours,
      'Workload Status': f.workloadStatus,
      'Mentor Assigned': f.isMentor ? `Yes (${f.assignedMenteesCount} Mentees)` : 'No',
      'Contact Email': f.email || '',
      'Status': f.status
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Apply column widths
    const colWidths = [
      { wch: 24 }, // Faculty Name
      { wch: 15 }, // Employee ID
      { wch: 22 }, // Designation
      { wch: 26 }, // Department
      { wch: 24 }, // Program
      { wch: 14 }, // Branch
      { wch: 28 }, // Assigned Subjects
      { wch: 18 }, // Theory Hours
      { wch: 18 }, // Lab Hours
      { wch: 18 }, // Total Hours
      { wch: 16 }, // Workload Status
      { wch: 20 }, // Mentor Assigned
      { wch: 26 }, // Email
      { wch: 12 }  // Status
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Workload');
    
    const fileName = `SSIU_Faculty_Workload_${scope.departmentCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`Exported ${listToExport.length} faculty workload records to ${fileName} successfully.`);
  };

  // ─── Open Subject Allocation Modal ────────────────────────────────────────
  const handleOpenAllocationModal = (preselectedFacultyId?: string) => {
    setAllocFacultyId(preselectedFacultyId || (sortedFaculty[0]?.facultyId || ''));
    setAllocProgramId(deptPrograms[0]?.id || '');
    setAllocSemesterId(deptSemesters[0]?.id || '');
    setAllocSubjectId(deptSubjects[0]?.id || '');
    setAllocDivisionId('Div A');
    setAllocTheoryHours(3);
    setAllocLabHours(2);
    setIsAllocModalOpen(true);
  };

  // ─── Subject Selection Changed in Allocation Modal ────────────────────────
  const handleSubjectChange = (subjectId: string) => {
    setAllocSubjectId(subjectId);
    const sub = deptSubjects.find(s => s.id === subjectId);
    if (sub) {
      setAllocTheoryHours(sub.theoryHoursPerWeek || 3);
      setAllocLabHours(sub.labHoursPerWeek || 2);
    }
  };

  // ─── Save Subject Allocation ──────────────────────────────────────────────
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocSubjectId || !allocFacultyId) {
      showToast('Please select both a subject and a faculty member.');
      return;
    }

    const sub = deptSubjects.find(s => s.id === allocSubjectId);
    const fac = rawFacultyWorkload.find(f => f.facultyId === allocFacultyId);

    if (sub && fac) {
      // Update subject in DB with assignedFacultyId and updated theory/lab hours
      db.updateEntity<Subject>('subjects', sub.id, { 
        assignedFacultyId: fac.facultyId,
        theoryHoursPerWeek: allocTheoryHours,
        labHoursPerWeek: allocLabHours
      }, `Allocated ${sub.code} to ${fac.facultyName} (${allocTheoryHours}h TH, ${allocLabHours}h LAB)`);

      setIsAllocModalOpen(false);
      setRefreshKey(k => k + 1);
      if (onRefreshParent) onRefreshParent();
      showToast(`Subject ${sub.code} (${sub.name}) allocated to Prof. ${fac.facultyName}. Workload updated (${allocTheoryHours + allocLabHours} Hrs).`);
    }
  };

  // ─── Open Edit Faculty Modal ──────────────────────────────────────────────
  const handleOpenEditFaculty = (item: FacultyWorkloadItem) => {
    setEditingFaculty(item);
    setEditDesignation(item.designation);
    setEditStatus(item.status);
    setEditIsMentor(item.isMentor);
  };

  // ─── Save Faculty Edit ────────────────────────────────────────────────────
  const handleSaveFacultyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;

    db.updateEntity<Faculty>('faculty', editingFaculty.facultyId, {
      designation: editDesignation as any,
      status: editStatus as any
    }, `Updated faculty profile for ${editingFaculty.facultyName}`);
    const facObj = db.getFaculty().find(f => f.id === editingFaculty.facultyId);
    if (facObj) {
      (facObj as any).isMentor = editIsMentor;
    }

    setEditingFaculty(null);
    setRefreshKey(k => k + 1);
    if (onRefreshParent) onRefreshParent();
    showToast(`Faculty profile for Prof. ${editingFaculty.facultyName} updated successfully.`);
  };

  // ─── Workload Status Badge Helper ─────────────────────────────────────────
  const renderWorkloadBadge = (status: FacultyWorkloadStatus) => {
    switch (status) {
      case 'UNDERLOAD':
      case 'UNDERLOADED':
        return (
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#FEF3C7', 
            color: '#B45309', 
            border: '1px solid #FDE68A',
            letterSpacing: '0.3px',
            display: 'inline-block'
          }}>
            UNDERLOAD
          </span>
        );
      case 'NORMAL':
        return (
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#DCFCE7', 
            color: '#15803D', 
            border: '1px solid #BBF7D0',
            letterSpacing: '0.3px',
            display: 'inline-block'
          }}>
            NORMAL
          </span>
        );
      case 'HIGH LOAD':
        return (
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#FFEDD5', 
            color: '#C2410C', 
            border: '1px solid #FED7AA',
            letterSpacing: '0.3px',
            display: 'inline-block'
          }}>
            HIGH LOAD
          </span>
        );
      case 'OVERLOAD':
      case 'OVERLOADED':
        return (
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: '#FEE2E2', 
            color: '#B91C1C', 
            border: '1px solid #FECACA',
            letterSpacing: '0.3px',
            display: 'inline-block'
          }}>
            OVERLOAD
          </span>
        );
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ 
          padding: '0.75rem 1.25rem', 
          backgroundColor: '#ECFDF5', 
          border: '1px solid #10B981', 
          color: '#065F46', 
          borderRadius: '8px', 
          fontWeight: 700, 
          fontSize: '0.84rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
        }}>
          <CheckCircle2 size={18} color="#10B981" /> {toastMessage}
        </div>
      )}

      {/* ═══ 1. WORKLOAD SUMMARY KPI CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        
        {/* TOTAL FACULTY */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-navy, #0B192C)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL FACULTY</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
            {summaryKPIs.totalFaculty}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Department instructors</div>
        </div>

        {/* TOTAL WEEKLY HOURS */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #0EA5E9', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL WEEKLY HOURS</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>
            {summaryKPIs.totalWeeklyHours} <span style={{ fontSize: '0.85rem' }}>Hrs</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Cumulative theory &amp; lab</div>
        </div>

        {/* AVERAGE WORKLOAD */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>AVG WORKLOAD</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            {summaryKPIs.averageWorkload} <span style={{ fontSize: '0.85rem' }}>h/wk</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803D', marginTop: '2px', fontWeight: 700 }}>Target: 12–16h</div>
        </div>

        {/* OPTIMAL LOAD (12-16h) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>OPTIMAL LOAD</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            {summaryKPIs.optimalCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>12–16 Hours/Week</div>
        </div>

        {/* UNDERLOADED (<12h) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${summaryKPIs.underloadedCount > 0 ? '#F59E0B' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>UNDERLOADED</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: summaryKPIs.underloadedCount > 0 ? '#D97706' : '#15803D', marginTop: '2px' }}>
            {summaryKPIs.underloadedCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>&lt;12 Hours/Week</div>
        </div>

        {/* HIGH LOAD (16-20h) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${summaryKPIs.highLoadCount > 0 ? '#F97316' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>HIGH LOAD</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: summaryKPIs.highLoadCount > 0 ? '#EA580C' : '#15803D', marginTop: '2px' }}>
            {summaryKPIs.highLoadCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>16–20 Hours/Week</div>
        </div>

        {/* OVERLOADED (>20h) */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${summaryKPIs.overloadedCount > 0 ? '#EF4444' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>OVERLOADED</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: summaryKPIs.overloadedCount > 0 ? '#DC2626' : '#15803D', marginTop: '2px' }}>
            {summaryKPIs.overloadedCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>&gt;20 Hours/Week</div>
        </div>

      </div>

      {/* ═══ 2. CONTROLS BAR: SEARCH, COMPACT FILTERS & ACTIONS ═══ */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
        
        {/* Top Header inside card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={18} color="var(--brand-orange)" /> Faculty Teaching Workload ({filteredFaculty.length})
            </h3>
            <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Monitor teaching hours, subject distribution, workload balance, and capacity.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => handleExportWorkloadXLSX(false)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}
              title="Export all filtered faculty workload to Excel"
            >
              <FileSpreadsheet size={14} color="#10B981" /> Export Workload (.xlsx)
            </button>

            <button 
              type="button" 
              onClick={() => handleOpenAllocationModal()}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <Plus size={14} /> Allocate Course Subject
            </button>
          </div>
        </div>

        {/* Search Bar & Excel-Style Dropdown Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', position: 'relative', minWidth: '220px' }}>
            <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by faculty name, employee ID, subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
            />
          </div>

          {/* Department Filter (Locked/Readonly for HOD) */}
          <div style={{ width: '150px' }}>
            <select
              className="form-control"
              value={scope.departmentId}
              disabled
              style={{ height: '34px', fontSize: '0.78125rem', background: '#F1F5F9', color: 'var(--brand-navy)', fontWeight: 700 }}
              title="Department Scope is strictly locked to HOD department"
            >
              <option value={scope.departmentId}>[{scope.departmentCode}] {scope.departmentName}</option>
            </select>
          </div>

          {/* Program / Branch Filter */}
          <div style={{ width: '160px' }}>
            <select
              className="form-control"
              value={selectedProgramFilter}
              onChange={e => setSelectedProgramFilter(e.target.value)}
              style={{ height: '34px', fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Programs / Branches</option>
              {deptPrograms.map(p => (
                <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div style={{ width: '150px' }}>
            <select
              className="form-control"
              value={selectedDesignationFilter}
              onChange={e => setSelectedDesignationFilter(e.target.value)}
              style={{ height: '34px', fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Designations</option>
              {uniqueDesignations.map(desig => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
            </select>
          </div>

          {/* Workload Status Filter */}
          <div style={{ width: '140px' }}>
            <select
              className="form-control"
              value={selectedWorkloadStatusFilter}
              onChange={e => setSelectedWorkloadStatusFilter(e.target.value)}
              style={{ height: '34px', fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Workload Status</option>
              <option value="UNDERLOAD">UNDERLOAD (&lt;8h)</option>
              <option value="NORMAL">NORMAL (8–16h)</option>
              <option value="HIGH LOAD">HIGH LOAD (17–20h)</option>
              <option value="OVERLOAD">OVERLOAD (&gt;20h)</option>
            </select>
          </div>

          {/* Mentor Filter */}
          <div style={{ width: '130px' }}>
            <select
              className="form-control"
              value={selectedMentorFilter}
              onChange={e => setSelectedMentorFilter(e.target.value)}
              style={{ height: '34px', fontSize: '0.78125rem' }}
            >
              <option value="ALL">All Mentors</option>
              <option value="YES">Mentors Only</option>
              <option value="NO">Non-Mentors</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-outline btn-sm"
            style={{ height: '34px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            title="Reset Filters"
          >
            <RotateCcw size={13} /> Reset
          </button>

        </div>

        {/* ═══ BULK ACTION BAR ═══ */}
        {selectedFacultyIds.length > 0 && (
          <div style={{ 
            marginTop: '0.75rem', 
            padding: '0.5rem 0.85rem', 
            background: '#EFF6FF', 
            border: '1px solid #BFDBFE', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E40AF' }}>
                ✓ {selectedFacultyIds.length} of {sortedFaculty.length} Faculty Selected
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleExportWorkloadXLSX(true)}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.25rem 0.6rem' }}
              >
                <Download size={12} /> Export Selected (.xlsx)
              </button>

              <button
                type="button"
                onClick={() => handleOpenAllocationModal(selectedFacultyIds[0])}
                className="btn btn-sm btn-primary"
                style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.25rem 0.6rem' }}
              >
                <Plus size={12} /> Assign Subject
              </button>

              <button
                type="button"
                onClick={() => setSelectedFacultyIds([])}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.725rem', fontWeight: 700, padding: '0.25rem 0.6rem' }}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ═══ 3. EXCEL-STYLE COMPACT DATA GRID ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: 0, 
          borderRadius: '8px', 
          overflow: 'hidden', 
          border: '1px solid #CBD5E1', 
          background: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ overflowX: 'auto', maxHeight: '650px' }}>
          <table 
            style={{ 
              width: '100%', 
              minWidth: '1200px', 
              borderCollapse: 'collapse', 
              fontSize: '0.8125rem',
              textAlign: 'left'
            }}
          >
            {/* Sticky Table Header */}
            <thead 
              style={{ 
                position: 'sticky', 
                top: 0, 
                zIndex: 4, 
                background: '#0B192C', 
                color: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <tr>
                {/* 1. Select Checkbox */}
                <th style={{ width: '42px', padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', transform: 'scale(1.05)' }}
                    title="Select / Deselect All Visible Faculty"
                  />
                </th>

                {/* 2. Faculty Name */}
                <th 
                  onClick={() => handleSort('facultyName')}
                  style={{ padding: '0.65rem 0.75rem', fontWeight: 800, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', minWidth: '180px', userSelect: 'none' }}
                >
                  FACULTY NAME {renderSortIcon('facultyName')}
                </th>

                {/* 3. Employee ID */}
                <th 
                  onClick={() => handleSort('employeeId')}
                  style={{ padding: '0.65rem 0.6rem', fontWeight: 800, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', width: '120px', userSelect: 'none' }}
                >
                  EMPLOYEE ID {renderSortIcon('employeeId')}
                </th>

                {/* 4. Designation */}
                <th 
                  onClick={() => handleSort('designation')}
                  style={{ padding: '0.65rem 0.75rem', fontWeight: 800, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', minWidth: '150px', userSelect: 'none' }}
                >
                  DESIGNATION {renderSortIcon('designation')}
                </th>

                {/* 5. Department */}
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', minWidth: '150px' }}>
                  DEPARTMENT
                </th>

                {/* 6. Program / Branch */}
                <th style={{ padding: '0.65rem 0.6rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', minWidth: '110px' }}>
                  PROGRAM / BRANCH
                </th>

                {/* 7. Assigned Subjects */}
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', minWidth: '180px' }}>
                  ASSIGNED SUBJECTS
                </th>

                {/* 8. Theory Hours */}
                <th 
                  onClick={() => handleSort('theoryHours')}
                  style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', width: '85px', userSelect: 'none' }}
                >
                  TH HRS {renderSortIcon('theoryHours')}
                </th>

                {/* 9. Lab Hours */}
                <th 
                  onClick={() => handleSort('labHours')}
                  style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', width: '85px', userSelect: 'none' }}
                >
                  LAB HRS {renderSortIcon('labHours')}
                </th>

                {/* 10. Total Hours */}
                <th 
                  onClick={() => handleSort('totalWeeklyHours')}
                  style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', width: '90px', userSelect: 'none' }}
                >
                  TOTAL HRS {renderSortIcon('totalWeeklyHours')}
                </th>

                {/* 11. Target Benchmark */}
                <th style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', width: '85px' }}>
                  TARGET
                </th>

                {/* 12. Difference */}
                <th style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', width: '75px' }}>
                  DIFF
                </th>

                {/* 13. Workload % */}
                <th style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', width: '100px' }}>
                  WORKLOAD %
                </th>

                {/* 14. Workload Status */}
                <th 
                  onClick={() => handleSort('workloadStatus')}
                  style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.15)', width: '115px', userSelect: 'none' }}
                >
                  STATUS {renderSortIcon('workloadStatus')}
                </th>

                {/* 15. Mentor */}
                <th style={{ padding: '0.65rem 0.5rem', fontWeight: 800, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', width: '80px' }}>
                  MENTOR
                </th>

                {/* 16. Actions */}
                <th style={{ padding: '0.65rem 0.6rem', fontWeight: 800, textAlign: 'center', width: '120px' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedFaculty.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <Users size={40} style={{ opacity: 0.35, margin: '0 auto 0.75rem' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                      No Faculty Found
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Faculty assigned to this department and filter criteria will appear here.
                    </p>
                    <button 
                      type="button" 
                      onClick={handleResetFilters}
                      className="btn btn-outline btn-sm" 
                      style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedFaculty.map((fac, idx) => {
                  const isSelected = selectedFacultyIds.includes(fac.facultyId);
                  const diff = fac.totalWeeklyHours - 16;
                  const pct = Math.min(150, Math.round((fac.totalWeeklyHours / 16) * 100));

                  return (
                    <tr
                      key={fac.facultyId}
                      style={{
                        background: isSelected 
                          ? '#EFF6FF' 
                          : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        transition: 'background-color 0.12s ease'
                      }}
                    >
                      {/* 1. Select Checkbox */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(fac.facultyId)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* 2. Faculty Name */}
                      <td style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.84rem' }}>
                          {fac.facultyName}
                        </div>
                        {fac.email && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {fac.email}
                          </div>
                        )}
                      </td>

                      {/* 3. Employee ID */}
                      <td style={{ padding: '0.55rem 0.6rem', borderRight: '1px solid #E2E8F0' }}>
                        <code style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: 'var(--brand-orange, #F37023)',
                          background: 'rgba(243, 112, 35, 0.08)',
                          padding: '2px 5px',
                          borderRadius: '3px'
                        }}>
                          {fac.employeeId}
                        </code>
                      </td>

                      {/* 4. Designation */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, color: '#334155', borderRight: '1px solid #E2E8F0' }}>
                        {fac.designation}
                      </td>

                      {/* 5. Department */}
                      <td style={{ padding: '0.55rem 0.75rem', color: '#475569', fontSize: '0.78125rem', borderRight: '1px solid #E2E8F0' }}>
                        {fac.departmentName}
                      </td>

                      {/* 6. Program / Branch */}
                      <td style={{ padding: '0.55rem 0.6rem', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          fontSize: '0.725rem', 
                          fontWeight: 800, 
                          color: 'var(--brand-navy)',
                          background: '#F1F5F9',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {fac.programCode}
                        </span>
                      </td>

                      {/* 7. Assigned Subjects */}
                      <td style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        {fac.assignedSubjects.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {fac.assignedSubjects.map(s => (
                              <span 
                                key={s.id}
                                title={`${s.code} - ${s.name} (${s.hours} Hrs/Wk)`}
                                style={{ 
                                  fontSize: '0.7125rem', 
                                  fontWeight: 700, 
                                  padding: '1px 6px', 
                                  borderRadius: '3px',
                                  background: '#E0F2FE',
                                  color: '#0369A1',
                                  border: '1px solid #BAE6FD'
                                }}
                              >
                                {s.code} ({s.hours}h)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>

                      {/* 8. Theory Hours */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#334155', borderRight: '1px solid #E2E8F0' }}>
                        {fac.theoryHours}h
                      </td>

                      {/* 9. Lab Hours */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#0284C7', borderRight: '1px solid #E2E8F0' }}>
                        {fac.labHours}h
                      </td>

                      {/* 10. Total Hours */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          fontSize: '0.84rem', 
                          fontWeight: 900, 
                          color: 'var(--brand-navy)'
                        }}>
                          {fac.totalWeeklyHours} <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>h</span>
                        </span>
                      </td>

                      {/* 11. Target Benchmark */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        12–16h
                      </td>

                      {/* 12. Difference */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 800, 
                          color: diff > 4 ? '#DC2626' : diff < -4 ? '#D97706' : '#15803D' 
                        }}>
                          {diff > 0 ? `+${diff}h` : diff < 0 ? `${diff}h` : '0h'}
                        </span>
                      </td>

                      {/* 13. Workload % */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: pct > 125 ? '#DC2626' : pct < 75 ? '#D97706' : '#15803D' }}>
                            {pct}%
                          </span>
                          <div style={{ width: '45px', height: '3px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct > 125 ? '#EF4444' : pct < 75 ? '#F59E0B' : '#10B981' }} />
                          </div>
                        </div>
                      </td>

                      {/* 14. Workload Status */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {renderWorkloadBadge(fac.workloadStatus)}
                      </td>

                      {/* 15. Mentor */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {fac.isMentor ? (
                          <span 
                            title={`Assigned ${fac.assignedMenteesCount} Mentees`}
                            style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 800, 
                              color: '#15803D', 
                              background: '#DCFCE7', 
                              padding: '2px 6px', 
                              borderRadius: '3px',
                              border: '1px solid #BBF7D0'
                            }}
                          >
                            Yes ({fac.assignedMenteesCount})
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 600 }}>No</span>
                        )}
                      </td>

                      {/* 16. Actions */}
                      <td style={{ padding: '0.55rem 0.6rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setViewingFaculty(fac)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.725rem', fontWeight: 700 }}
                            title="View Faculty Dossier"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditFaculty(fac)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.725rem', fontWeight: 700 }}
                            title="Edit Faculty Record"
                          >
                            <Edit size={12} /> Edit
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

        {/* Table Footer with Summary Count */}
        <div style={{ 
          padding: '0.65rem 1rem', 
          background: '#F8FAFC', 
          borderTop: '1px solid #E2E8F0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748B',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            Showing <strong>{sortedFaculty.length}</strong> of <strong>{rawFacultyWorkload.length}</strong> Faculty Members in {scope.departmentName}
          </div>
          <div>
            Total Teaching Hours: <strong>{summaryKPIs.totalWeeklyHours} Hrs / Wk</strong> • Average: <strong>{summaryKPIs.averageWorkload} Hrs/Wk</strong>
          </div>
        </div>

      </div>

      {/* ═══ 4. VIEW FACULTY DOSSIER MODAL ═══ */}
      {viewingFaculty && (
        <Modal 
          isOpen={!!viewingFaculty} 
          onClose={() => setViewingFaculty(null)} 
          title={`Faculty Dossier: Prof. ${viewingFaculty.facultyName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header Profile Box */}
            <div style={{ 
              padding: '1.15rem', 
              background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 100%)', 
              color: '#FFFFFF', 
              borderRadius: '8px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                    {viewingFaculty.facultyName}
                  </h3>
                  <div style={{ fontSize: '0.84rem', color: '#93C5FD', marginTop: '3px' }}>
                    {viewingFaculty.designation} • {viewingFaculty.departmentName}
                  </div>
                  <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#CBD5E1', flexWrap: 'wrap' }}>
                    <span>EMP ID: <strong style={{ color: '#FFFFFF' }}>{viewingFaculty.employeeId}</strong></span>
                    <span>Program: <strong style={{ color: '#FFFFFF' }}>{viewingFaculty.programName}</strong></span>
                    <span>Status: <strong style={{ color: '#FFFFFF' }}>{viewingFaculty.status}</strong></span>
                  </div>
                </div>
                <div>
                  {renderWorkloadBadge(viewingFaculty.workloadStatus)}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Theory Load</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
                  {viewingFaculty.theoryHours} Hrs/Wk
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Lab / Practical</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
                  {viewingFaculty.labHours} Hrs/Wk
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Weekly</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>
                  {viewingFaculty.totalWeeklyHours} Hrs/Wk
                </div>
              </div>
            </div>

            {/* Assigned Subjects Breakdown */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} color="var(--brand-orange)" /> Assigned Teaching Courses ({viewingFaculty.assignedSubjects.length})
              </h4>
              {viewingFaculty.assignedSubjects.length === 0 ? (
                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>
                  No active courses currently allocated to this faculty member.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {viewingFaculty.assignedSubjects.map(s => (
                    <div 
                      key={s.id}
                      style={{ 
                        padding: '0.6rem 0.85rem', 
                        borderRadius: '6px', 
                        background: '#F8FAFC', 
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--brand-navy)', fontSize: '0.825rem' }}>{s.name}</strong>
                        <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                          Code: <code>{s.code}</code> • Credits: {s.credits}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: '#0369A1', background: '#E0F2FE', padding: '2px 8px', borderRadius: '4px' }}>
                        {s.hours} Hrs / Week
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mentorship Oversight */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="#10B981" /> Mentorship &amp; Mentee Oversight
              </h4>
              <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Assigned Mentor Status:</span>
                  <strong>{viewingFaculty.isMentor ? 'Active Mentor' : 'Not Assigned'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                  <span>Total Assigned Mentees:</span>
                  <strong>{viewingFaculty.assignedMenteesCount} Students</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => {
                  const target = viewingFaculty;
                  setViewingFaculty(null);
                  handleOpenAllocationModal(target.facultyId);
                }} 
                className="btn btn-primary btn-sm"
              >
                <Plus size={13} /> Allocate New Subject
              </button>
              <button 
                type="button" 
                onClick={() => setViewingFaculty(null)} 
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ═══ 5. EDIT FACULTY MODAL ═══ */}
      {editingFaculty && (
        <Modal 
          isOpen={!!editingFaculty} 
          onClose={() => setEditingFaculty(null)} 
          title={`Edit Faculty: Prof. ${editingFaculty.facultyName}`}
        >
          <form onSubmit={handleSaveFacultyEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div><strong>Faculty:</strong> {editingFaculty.facultyName} ({editingFaculty.employeeId})</div>
              <div><strong>Department:</strong> {editingFaculty.departmentName}</div>
              <div><strong>Total Hours:</strong> {editingFaculty.totalWeeklyHours} Hrs/Wk</div>
            </div>

            <div className="form-group">
              <label className="form-label">Designation *</label>
              <select 
                className="form-select"
                value={editDesignation}
                onChange={e => setEditDesignation(e.target.value)}
                required
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Adjunct Faculty">Adjunct Faculty</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Faculty Active Status *</label>
              <select 
                className="form-select"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                required
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input 
                type="checkbox"
                id="editIsMentorCheck"
                checked={editIsMentor}
                onChange={e => setEditIsMentor(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="editIsMentorCheck" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer', margin: 0 }}>
                Designate as Student Mentor for this Department
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setEditingFaculty(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ═══ 6. SUBJECT ALLOCATION MODAL ═══ */}
      {isAllocModalOpen && (
        <Modal 
          isOpen={isAllocModalOpen} 
          onClose={() => setIsAllocModalOpen(false)} 
          title="Department Course Subject Allocation"
        >
          <form onSubmit={handleSaveAllocation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Select Faculty */}
            <div className="form-group">
              <label className="form-label">Select Faculty Member *</label>
              <select 
                className="form-select" 
                value={allocFacultyId} 
                onChange={e => setAllocFacultyId(e.target.value)} 
                required
              >
                <option value="">Select Faculty Member...</option>
                {rawFacultyWorkload.map(f => (
                  <option key={f.facultyId} value={f.facultyId}>
                    {f.facultyName} ({f.employeeId}) — {f.designation} [{f.totalWeeklyHours}h current]
                  </option>
                ))}
              </select>
            </div>

            {/* Select Program */}
            <div className="form-group">
              <label className="form-label">Degree Program / Branch *</label>
              <select 
                className="form-select" 
                value={allocProgramId} 
                onChange={e => setAllocProgramId(e.target.value)} 
                required
              >
                {deptPrograms.map(p => (
                  <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>

            {/* Select Semester */}
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select 
                className="form-select" 
                value={allocSemesterId} 
                onChange={e => setAllocSemesterId(e.target.value)} 
                required
              >
                {deptSemesters.map(s => (
                  <option key={s.id} value={s.id}>Semester {s.number} (AY {scope.academicYear})</option>
                ))}
              </select>
            </div>

            {/* Select Subject */}
            <div className="form-group">
              <label className="form-label">Curriculum Course Subject *</label>
              <select 
                className="form-select" 
                value={allocSubjectId} 
                onChange={e => handleSubjectChange(e.target.value)} 
                required
              >
                <option value="">Select Course Subject...</option>
                {deptSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

            {/* Division / Section */}
            <div className="form-group">
              <label className="form-label">Division / Section *</label>
              <select 
                className="form-select" 
                value={allocDivisionId} 
                onChange={e => setAllocDivisionId(e.target.value)}
              >
                <option value="Div A">Division A</option>
                <option value="Div B">Division B</option>
                <option value="Div C">Division C</option>
                <option value="All Divisions">All Divisions</option>
              </select>
            </div>

            {/* Weekly Hours (Theory and Lab) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Weekly Theory Hours *</label>
                <input 
                  type="number"
                  min="0"
                  max="30"
                  className="form-control"
                  value={allocTheoryHours}
                  onChange={e => setAllocTheoryHours(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weekly Lab Hours *</label>
                <input 
                  type="number"
                  min="0"
                  max="30"
                  className="form-control"
                  value={allocLabHours}
                  onChange={e => setAllocLabHours(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Total Hours Preview */}
            <div style={{ 
              padding: '0.65rem 0.85rem', 
              background: '#F0F9FF', 
              border: '1px solid #BAE6FD', 
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8125rem'
            }}>
              <span>Calculated Total Subject Load:</span>
              <strong style={{ color: '#0369A1', fontSize: '0.95rem' }}>
                {allocTheoryHours + allocLabHours} Hours / Week
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsAllocModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Confirm Allocation &amp; Recalculate
              </button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
};
