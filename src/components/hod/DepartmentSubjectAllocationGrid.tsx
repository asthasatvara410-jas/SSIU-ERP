import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { departmentScopeService, SubjectAllocationItem, FacultyWorkloadItem } from '../../services/departmentScopeService';
import { Subject, Faculty, Program, Semester } from '../../types';
import { ExcelDataTable, ExcelColumn, ExcelFilterOption, ExcelBulkAction } from '../common/ExcelDataTable';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  BookOpen, CheckCircle2, AlertTriangle, AlertCircle, Plus, 
  Users, UserCheck, Clock, Download, Edit3, Eye, ArrowRight,
  Sparkles, Layers, ShieldCheck, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DepartmentSubjectAllocationGridProps {
  onRefreshParent?: () => void;
  onNavigateToWorkload?: () => void;
}

export const DepartmentSubjectAllocationGrid: React.FC<DepartmentSubjectAllocationGridProps> = ({
  onRefreshParent,
  onNavigateToWorkload
}) => {
  const { user, role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Filter States ────────────────────────────────────────────────────────
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('ALL');

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedSubjectForAllocation, setSelectedSubjectForAllocation] = useState<SubjectAllocationItem | null>(null);
  const [viewingSubjectInfo, setViewingSubjectInfo] = useState<SubjectAllocationItem | null>(null);

  // Allocation Wizard Form States
  const [allocProgramId, setAllocProgramId] = useState<string>('');
  const [allocSemesterId, setAllocSemesterId] = useState<string>('');
  const [allocSubjectId, setAllocSubjectId] = useState<string>('');
  const [allocFacultyId, setAllocFacultyId] = useState<string>('');
  const [allocTheoryHours, setAllocTheoryHours] = useState<number>(3);
  const [allocLabHours, setAllocLabHours] = useState<number>(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const scope = useMemo(() => {
    return departmentScopeService.resolveScopeIdentity(user, role || undefined);
  }, [user, role, refreshKey]);

  const scopedFaculty = useMemo(() => {
    return departmentScopeService.getScopedFaculty(user, role || undefined);
  }, [user, role, refreshKey]);

  const facultyWorkloadMap = useMemo(() => {
    const list = departmentScopeService.getFacultyWorkloadOverview(user, role || undefined);
    const map = new Map<string, FacultyWorkloadItem>();
    list.forEach(item => map.set(item.facultyId, item));
    return map;
  }, [user, role, refreshKey]);

  // Subject-Centric Allocation Records
  const subjectAllocations: SubjectAllocationItem[] = useMemo(() => {
    void refreshKey;
    return departmentScopeService.getSubjectAllocations(user, role || undefined);
  }, [user, role, refreshKey]);

  // ─── Filtered Subject Allocations ─────────────────────────────────────────
  const filteredAllocations = useMemo(() => {
    return subjectAllocations.filter(sub => {
      if (selectedProgramFilter !== 'ALL' && sub.programId !== selectedProgramFilter && sub.programCode !== selectedProgramFilter) {
        return false;
      }
      if (selectedSemesterFilter !== 'ALL' && sub.semesterId !== selectedSemesterFilter && String(sub.semesterNumber) !== selectedSemesterFilter) {
        return false;
      }
      if (selectedTypeFilter !== 'ALL' && sub.courseType !== selectedTypeFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && sub.allocationStatus !== selectedStatusFilter) {
        return false;
      }
      if (selectedFacultyFilter !== 'ALL' && sub.assignedFacultyId !== selectedFacultyFilter) {
        return false;
      }
      return true;
    });
  }, [
    subjectAllocations,
    selectedProgramFilter,
    selectedSemesterFilter,
    selectedTypeFilter,
    selectedStatusFilter,
    selectedFacultyFilter
  ]);

  // ─── KPI Cards ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalSubjects = filteredAllocations.length;
    const allocatedSubjects = filteredAllocations.filter(s => s.allocationStatus === 'FULLY_ALLOCATED').length;
    const unallocatedSubjects = filteredAllocations.filter(s => s.allocationStatus === 'UNALLOCATED').length;
    const partiallyAllocated = filteredAllocations.filter(s => s.allocationStatus === 'PARTIALLY_ALLOCATED').length;
    const theorySubjects = filteredAllocations.filter(s => s.theoryHours > 0).length;
    const labSubjects = filteredAllocations.filter(s => s.labHours > 0).length;

    return {
      totalSubjects,
      allocatedSubjects,
      unallocatedSubjects,
      partiallyAllocated,
      theorySubjects,
      labSubjects
    };
  }, [filteredAllocations]);

  // ─── Reset Filters ────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedProgramFilter('ALL');
    setSelectedSemesterFilter('ALL');
    setSelectedTypeFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSelectedFacultyFilter('ALL');
  };

  // ─── Open Allocation Wizard ───────────────────────────────────────────────
  const handleOpenAllocateModal = (subjectItem?: SubjectAllocationItem) => {
    if (subjectItem) {
      setSelectedSubjectForAllocation(subjectItem);
      setAllocProgramId(subjectItem.programId);
      setAllocSemesterId(subjectItem.semesterId);
      setAllocSubjectId(subjectItem.subjectId);
      setAllocFacultyId(subjectItem.assignedFacultyId || scopedFaculty[0]?.id || '');
      setAllocTheoryHours(subjectItem.theoryHours || 3);
      setAllocLabHours(subjectItem.labHours || 2);
    } else {
      setSelectedSubjectForAllocation(null);
      setAllocProgramId(scope.programs[0]?.id || '');
      setAllocSemesterId(scope.semesters[0]?.id || '');
      setAllocSubjectId(subjectAllocations[0]?.subjectId || '');
      setAllocFacultyId(scopedFaculty[0]?.id || '');
      setAllocTheoryHours(3);
      setAllocLabHours(2);
    }
    setIsAllocateModalOpen(true);
  };

  // ─── Submit Allocation ────────────────────────────────────────────────────
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocSubjectId || !allocFacultyId) return;

    departmentScopeService.allocateSubjectToFaculty(
      allocSubjectId,
      allocFacultyId,
      allocTheoryHours,
      allocLabHours
    );

    setIsAllocateModalOpen(false);
    setRefreshKey(k => k + 1);
    if (onRefreshParent) onRefreshParent();

    const fac = scopedFaculty.find(f => f.id === allocFacultyId);
    const sub = subjectAllocations.find(s => s.subjectId === allocSubjectId);
    showToast(`Successfully allocated ${sub?.subjectCode || 'Course'} to Prof. ${fac?.name || 'Faculty'}. Workload recalculated.`);
  };

  // ─── Dependent Filter Options ─────────────────────────────────────────────
  const filterOptions: ExcelFilterOption[] = useMemo(() => {
    const progOpt: ExcelFilterOption = {
      key: 'program',
      label: 'Program / Branch',
      value: selectedProgramFilter,
      options: [
        { label: 'All Department Branches', value: 'ALL' },
        ...scope.programs.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))
      ]
    };

    const semOpt: ExcelFilterOption = {
      key: 'semester',
      label: 'Semester',
      value: selectedSemesterFilter,
      options: [
        { label: 'All Semesters', value: 'ALL' },
        ...scope.semesters.map(s => ({ label: `Sem ${s.number}`, value: s.id }))
      ]
    };

    const typeOpt: ExcelFilterOption = {
      key: 'courseType',
      label: 'Course Type',
      value: selectedTypeFilter,
      options: [
        { label: 'All Course Types', value: 'ALL' },
        { label: 'Theory Only', value: 'THEORY' },
        { label: 'Lab / Practical Only', value: 'LAB' },
        { label: 'Integrated (Theory + Lab)', value: 'INTEGRATED' },
        { label: 'Department Elective', value: 'ELECTIVE' }
      ]
    };

    const statusOpt: ExcelFilterOption = {
      key: 'status',
      label: 'Allocation Status',
      value: selectedStatusFilter,
      options: [
        { label: 'All Allocation Status', value: 'ALL' },
        { label: 'Fully Allocated (100%)', value: 'FULLY_ALLOCATED' },
        { label: 'Partially Allocated (50%)', value: 'PARTIALLY_ALLOCATED' },
        { label: 'Unallocated (0%)', value: 'UNALLOCATED' }
      ]
    };

    const facOpt: ExcelFilterOption = {
      key: 'faculty',
      label: 'Assigned Faculty',
      value: selectedFacultyFilter,
      options: [
        { label: 'All Faculty', value: 'ALL' },
        ...scopedFaculty.map(f => ({ label: `Prof. ${f.name}`, value: f.id }))
      ]
    };

    return [progOpt, semOpt, typeOpt, statusOpt, facOpt];
  }, [scope, selectedProgramFilter, selectedSemesterFilter, selectedTypeFilter, selectedStatusFilter, selectedFacultyFilter, scopedFaculty]);

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'program': setSelectedProgramFilter(value); break;
      case 'semester': setSelectedSemesterFilter(value); break;
      case 'courseType': setSelectedTypeFilter(value); break;
      case 'status': setSelectedStatusFilter(value); break;
      case 'faculty': setSelectedFacultyFilter(value); break;
    }
  };

  // ─── 15 Subject-Centric Columns ───────────────────────────────────────────
  const columns: ExcelColumn<SubjectAllocationItem>[] = useMemo(() => [
    // 1. Index
    {
      key: 'index',
      header: '#',
      width: '45px',
      align: 'center',
      sortable: false,
      render: (_, idx) => <span style={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</span>,
      getRawValue: item => item.id
    },
    // 2. Subject Code
    {
      key: 'subjectCode',
      header: 'SUBJECT CODE',
      width: '120px',
      sortable: true,
      render: item => (
        <code style={{ 
          fontSize: '0.78125rem', 
          fontWeight: 800, 
          color: 'var(--brand-orange, #F37023)',
          background: 'rgba(243, 112, 35, 0.08)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {item.subjectCode}
        </code>
      ),
      getRawValue: item => item.subjectCode
    },
    // 3. Subject Name
    {
      key: 'subjectName',
      header: 'SUBJECT NAME',
      width: '230px',
      minWidth: '200px',
      sortable: true,
      render: item => (
        <div style={{ color: 'var(--brand-navy, #0B192C)', fontWeight: 700, fontSize: '0.84rem' }}>
          {item.subjectName}
        </div>
      ),
      getRawValue: item => item.subjectName
    },
    // 4. Course Type
    {
      key: 'courseType',
      header: 'COURSE TYPE',
      width: '125px',
      sortable: true,
      render: item => {
        switch (item.courseType) {
          case 'THEORY': return <Badge variant="navy">Theory</Badge>;
          case 'LAB': return <Badge variant="active">Lab</Badge>;
          case 'INTEGRATED': return <Badge variant="warning">Integrated</Badge>;
          case 'ELECTIVE': return <Badge variant="purple">Elective</Badge>;
        }
      },
      getRawValue: item => item.courseType
    },
    // 5. Program
    {
      key: 'programCode',
      header: 'BRANCH',
      width: '120px',
      sortable: true,
      render: item => (
        <span style={{ 
          fontSize: '0.725rem', 
          fontWeight: 800, 
          color: 'var(--brand-navy)',
          background: '#F1F5F9',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {item.programCode}
        </span>
      ),
      getRawValue: item => item.programCode
    },
    // 6. Semester
    {
      key: 'semesterNumber',
      header: 'SEM',
      width: '65px',
      align: 'center',
      sortable: true,
      render: item => <strong style={{ color: '#1E293B' }}>Sem {item.semesterNumber}</strong>,
      getRawValue: item => item.semesterNumber
    },
    // 7. Credits
    {
      key: 'credits',
      header: 'CREDITS',
      width: '75px',
      align: 'center',
      sortable: true,
      render: item => <strong>{item.credits} Cr</strong>,
      getRawValue: item => item.credits
    },
    // 8. Theory Hours
    {
      key: 'theoryHours',
      header: 'TH HRS',
      width: '75px',
      align: 'center',
      sortable: true,
      render: item => <span style={{ fontWeight: 700, color: '#334155' }}>{item.theoryHours}h</span>,
      getRawValue: item => item.theoryHours
    },
    // 9. Lab Hours
    {
      key: 'labHours',
      header: 'LAB HRS',
      width: '75px',
      align: 'center',
      sortable: true,
      render: item => <span style={{ fontWeight: 700, color: '#0284C7' }}>{item.labHours}h</span>,
      getRawValue: item => item.labHours
    },
    // 10. Student Count
    {
      key: 'studentCount',
      header: 'STUDENTS',
      width: '90px',
      align: 'center',
      sortable: true,
      render: item => <span style={{ fontWeight: 700, color: '#475569' }}>{item.studentCount}</span>,
      getRawValue: item => item.studentCount
    },
    // 11. Faculty Assigned
    {
      key: 'assignedFacultyName',
      header: 'FACULTY ASSIGNED',
      width: '190px',
      sortable: true,
      render: item => (
        item.assignedFacultyId ? (
          <div>
            <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.825rem' }}>
              {item.assignedFacultyName}
            </strong>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
              <code>{item.assignedFacultyEmployeeId}</code>
            </div>
          </div>
        ) : (
          <span style={{ 
            fontSize: '0.725rem', 
            fontWeight: 800, 
            color: '#DC2626', 
            background: '#FEF2F2', 
            padding: '2px 7px', 
            borderRadius: '4px',
            border: '1px solid #FECACA'
          }}>
            UNASSIGNED
          </span>
        )
      ),
      getRawValue: item => item.assignedFacultyName
    },
    // 12. Allocation %
    {
      key: 'allocationPercentage',
      header: 'ALLOC %',
      width: '95px',
      align: 'center',
      sortable: true,
      render: item => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: item.allocationPercentage === 100 ? '#15803D' : item.allocationPercentage > 0 ? '#D97706' : '#DC2626' }}>
            {item.allocationPercentage}%
          </span>
          <div style={{ width: '50px', height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${item.allocationPercentage}%`, 
              height: '100%', 
              background: item.allocationPercentage === 100 ? '#10B981' : item.allocationPercentage > 0 ? '#F59E0B' : '#EF4444' 
            }} />
          </div>
        </div>
      ),
      getRawValue: item => item.allocationPercentage
    },
    // 13. Allocation Status Badge
    {
      key: 'allocationStatus',
      header: 'STATUS',
      width: '140px',
      align: 'center',
      sortable: true,
      render: item => {
        switch (item.allocationStatus) {
          case 'FULLY_ALLOCATED': return <Badge variant="active">FULLY ALLOCATED</Badge>;
          case 'PARTIALLY_ALLOCATED': return <Badge variant="warning">PARTIALLY ALLOCATED</Badge>;
          case 'UNALLOCATED': return <Badge variant="danger">UNALLOCATED</Badge>;
        }
      },
      getRawValue: item => item.allocationStatus
    },
    // 14. Actions
    {
      key: 'actions',
      header: 'ACTIONS',
      width: '160px',
      align: 'center',
      sortable: false,
      render: item => (
        <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleOpenAllocateModal(item)}
            className={`btn btn-sm ${item.allocationStatus === 'UNALLOCATED' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="Allocate / Change Faculty Assignment"
          >
            <Edit3 size={11} /> {item.allocationStatus === 'UNALLOCATED' ? 'Allocate' : 'Change'}
          </button>
          <button
            type="button"
            onClick={() => setViewingSubjectInfo(item)}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="View Course Curriculum"
          >
            <Eye size={11} /> Info
          </button>
        </div>
      )
    }
  ], []);

  // ─── Bulk Actions ─────────────────────────────────────────────────────────
  const bulkActions: ExcelBulkAction<SubjectAllocationItem>[] = useMemo(() => [
    {
      key: 'export_selected',
      label: 'Export Selected',
      icon: <Download size={12} />,
      variant: 'secondary',
      onClick: selected => {
        const rows = selected.map((s, idx) => ({
          '#': idx + 1,
          'Subject Code': s.subjectCode,
          'Subject Name': s.subjectName,
          'Course Type': s.courseType,
          'Program': s.programCode,
          'Semester': `Sem ${s.semesterNumber}`,
          'Credits': s.credits,
          'Theory Hours': s.theoryHours,
          'Lab Hours': s.labHours,
          'Students': s.studentCount,
          'Faculty Assigned': s.assignedFacultyName,
          'Allocation Status': s.allocationStatus
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Subject_Allocations');
        XLSX.writeFile(wb, `SSIU_${scope.departmentCode}_Subject_Allocations_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast(`Exported ${selected.length} subject allocations to Excel.`);
      }
    }
  ], [scope]);

  // Selected faculty candidate workload preview
  const candidateWorkload = useMemo(() => {
    if (!allocFacultyId) return null;
    return facultyWorkloadMap.get(allocFacultyId) || null;
  }, [allocFacultyId, facultyWorkloadMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', width: '100%' }}>
      
      {/* Toast */}
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
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} color="#10B981" /> {toastMessage}
        </div>
      )}

      {/* ═══ 1. TOP KPI CARDS (SUBJECT ALLOCATION FOCUS) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        
        {/* Total Subjects */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-navy, #0B192C)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL SUBJECTS</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
            {kpis.totalSubjects}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Curriculum courses</div>
        </div>

        {/* Allocated Subjects */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>FULLY ALLOCATED</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            {kpis.allocatedSubjects}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803D', marginTop: '2px', fontWeight: 700 }}>
            {kpis.totalSubjects > 0 ? Math.round((kpis.allocatedSubjects / kpis.totalSubjects) * 100) : 0}% Assigned
          </div>
        </div>

        {/* Unallocated Subjects */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${kpis.unallocatedSubjects > 0 ? '#EF4444' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>UNALLOCATED COURSES</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: kpis.unallocatedSubjects > 0 ? '#DC2626' : '#15803D', marginTop: '2px' }}>
            {kpis.unallocatedSubjects}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px' }}>Requires faculty assignment</div>
        </div>

        {/* Theory Subjects */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #0284C7', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>THEORY COURSES</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0369A1', marginTop: '2px' }}>
            {kpis.theorySubjects}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Classroom lectures</div>
        </div>

        {/* Lab Subjects */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-orange, #F37023)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>LABORATORY COURSES</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '2px' }}>
            {kpis.labSubjects}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Hands-on practicals</div>
        </div>

      </div>

      {/* ═══ 2. EXCEL DATA TABLE (SUBJECT-CENTRIC) ═══ */}
      <ExcelDataTable<SubjectAllocationItem>
        data={filteredAllocations}
        columns={columns}
        keyField="id"
        title="Subject & Faculty Allocation"
        subtitle="Allocate department subjects to eligible faculty and monitor assignment coverage."
        searchPlaceholder="Search subject code, subject name, faculty name, branch..."
        searchFields={['subjectCode', 'subjectName', 'assignedFacultyName', 'assignedFacultyEmployeeId', 'programCode']}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        bulkActions={bulkActions}
        enableSelection={true}
        enableInlineEditing={false}
        exportFilename={`SSIU_${scope.departmentCode}_Subject_Allocations`}
        exportTitle={`${scope.departmentName} — Subject Allocation Register`}
        exportMetadata={{
          'Department': scope.departmentName,
          'Total Courses': String(kpis.totalSubjects),
          'Allocated': String(kpis.allocatedSubjects),
          'Unallocated': String(kpis.unallocatedSubjects)
        }}
        defaultPageSize={25}
        onRefresh={() => {
          setRefreshKey(k => k + 1);
          if (onRefreshParent) onRefreshParent();
          showToast('Subject allocations refreshed.');
        }}
        toolbarExtra={
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleOpenAllocateModal()}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} /> Allocate Course Subject
            </button>
            {onNavigateToWorkload && (
              <button
                type="button"
                onClick={onNavigateToWorkload}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Workload Matrix →
              </button>
            )}
          </div>
        }
      />

      {/* ═══ 3. STEP-BY-STEP ALLOCATION WIZARD MODAL ═══ */}
      {isAllocateModalOpen && (
        <Modal
          isOpen={isAllocateModalOpen}
          onClose={() => setIsAllocateModalOpen(false)}
          title="Step-by-Step Course Subject Allocation Wizard"
        >
          <form onSubmit={handleSaveAllocation} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            
            {/* Step 1 & 2: Select Branch, Semester & Subject */}
            <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                STEP 1: SELECT CURRICULUM COURSE
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Program / Branch *</label>
                  <select
                    className="form-control"
                    value={allocProgramId}
                    onChange={e => setAllocProgramId(e.target.value)}
                    required
                  >
                    {scope.programs.map(p => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Semester *</label>
                  <select
                    className="form-control"
                    value={allocSemesterId}
                    onChange={e => setAllocSemesterId(e.target.value)}
                    required
                  >
                    {scope.semesters.map(s => (
                      <option key={s.id} value={s.id}>Semester {s.number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '0.65rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Course Subject *</label>
                <select
                  className="form-control"
                  value={allocSubjectId}
                  onChange={e => {
                    const subId = e.target.value;
                    setAllocSubjectId(subId);
                    const sub = subjectAllocations.find(s => s.subjectId === subId);
                    if (sub) {
                      setAllocTheoryHours(sub.theoryHours || 3);
                      setAllocLabHours(sub.labHours || 2);
                      if (sub.assignedFacultyId) setAllocFacultyId(sub.assignedFacultyId);
                    }
                  }}
                  required
                >
                  {subjectAllocations.map(s => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.subjectCode} — {s.subjectName} ({s.credits} Cr)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3 & 4: Select Eligible Faculty */}
            <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                STEP 2: SELECT ELIGIBLE FACULTY INSTRUCTOR
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Assigned Faculty Member *</label>
                <select
                  className="form-control"
                  value={allocFacultyId}
                  onChange={e => setAllocFacultyId(e.target.value)}
                  required
                >
                  {scopedFaculty.map(f => {
                    const w = facultyWorkloadMap.get(f.id);
                    return (
                      <option key={f.id} value={f.id}>
                        Prof. {f.name} ({f.designation}) — Current Load: {w ? `${w.totalWeeklyHours}h (${w.workloadStatus})` : '0h'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Hours Adjustment */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginTop: '0.65rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Theory Hours / Wk *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocTheoryHours}
                    min={0}
                    max={12}
                    onChange={e => setAllocTheoryHours(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Lab Hours / Wk *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocLabHours}
                    min={0}
                    max={12}
                    onChange={e => setAllocLabHours(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Workload Impact Preview */}
            {candidateWorkload && (
              <div style={{ padding: '0.85rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 800, color: '#1E40AF', marginBottom: '0.35rem' }}>
                  WORKLOAD IMPACT PREVIEW
                </div>
                <div>Instructor: <strong>Prof. {candidateWorkload.facultyName}</strong></div>
                <div style={{ marginTop: '2px' }}>
                  Current Load: <strong>{candidateWorkload.totalWeeklyHours}h/wk</strong> ({candidateWorkload.workloadStatus})
                </div>
                <div style={{ marginTop: '2px', color: '#1E40AF' }}>
                  New Projected Load: <strong>{candidateWorkload.totalWeeklyHours + allocTheoryHours + allocLabHours}h/wk</strong> (Target: 12–16h)
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Confirm Allocation
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ═══ 4. VIEW SUBJECT INFO MODAL ═══ */}
      {viewingSubjectInfo && (
        <Modal
          isOpen={!!viewingSubjectInfo}
          onClose={() => setViewingSubjectInfo(null)}
          title={`Course Syllabus: ${viewingSubjectInfo.subjectCode} — ${viewingSubjectInfo.subjectName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div><strong>Course Code:</strong> {viewingSubjectInfo.subjectCode}</div>
              <div style={{ marginTop: '3px' }}><strong>Subject Title:</strong> {viewingSubjectInfo.subjectName}</div>
              <div style={{ marginTop: '3px' }}><strong>Program:</strong> {viewingSubjectInfo.programName} ({viewingSubjectInfo.programCode})</div>
              <div style={{ marginTop: '3px' }}><strong>Semester:</strong> Semester {viewingSubjectInfo.semesterNumber}</div>
              <div style={{ marginTop: '3px' }}><strong>Credits:</strong> {viewingSubjectInfo.credits} Credits ({viewingSubjectInfo.theoryHours}h Theory + {viewingSubjectInfo.labHours}h Lab)</div>
              <div style={{ marginTop: '3px' }}><strong>Enrolled Students:</strong> {viewingSubjectInfo.studentCount} Students</div>
              <div style={{ marginTop: '3px' }}><strong>Current Instructor:</strong> {viewingSubjectInfo.assignedFacultyName}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingSubjectInfo(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
