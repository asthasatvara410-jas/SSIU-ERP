import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { departmentScopeService, FacultyDirectoryItem } from '../../services/departmentScopeService';
import { Faculty, Program } from '../../types';
import { ExcelDataTable, ExcelColumn, ExcelFilterOption, ExcelBulkAction } from '../common/ExcelDataTable';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  Users, UserCheck, Clock, Award, Mail, Phone, Calendar, 
  BookOpen, ShieldCheck, CheckCircle2, AlertCircle, Edit3, 
  Eye, FileText, Download, Briefcase, GraduationCap, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DepartmentFacultyDirectoryProps {
  onRefreshParent?: () => void;
  onNavigateToWorkload?: () => void;
}

export const DepartmentFacultyDirectory: React.FC<DepartmentFacultyDirectoryProps> = ({
  onRefreshParent,
  onNavigateToWorkload
}) => {
  const { user, role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Filter States ────────────────────────────────────────────────────────
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>('ALL');
  const [selectedEmpTypeFilter, setSelectedEmpTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState<string>('ALL');

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [selectedFacultyForProfile, setSelectedFacultyForProfile] = useState<FacultyDirectoryItem | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<FacultyDirectoryItem | null>(null);
  const [editDesignation, setEditDesignation] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editEmpType, setEditEmpType] = useState<string>('FULL_TIME');
  const [editIsMentor, setEditIsMentor] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const scope = useMemo(() => {
    return departmentScopeService.resolveScopeIdentity(user, role || undefined);
  }, [user, role, refreshKey]);

  // Master Faculty Directory List
  const facultyDirectory: FacultyDirectoryItem[] = useMemo(() => {
    void refreshKey;
    return departmentScopeService.getFacultyDirectory(user, role || undefined);
  }, [user, role, refreshKey]);

  // ─── Filtered Directory ───────────────────────────────────────────────────
  const filteredDirectory = useMemo(() => {
    return facultyDirectory.filter(f => {
      if (selectedProgramFilter !== 'ALL' && f.programId !== selectedProgramFilter && f.programCode !== selectedProgramFilter) {
        return false;
      }
      if (selectedDesignationFilter !== 'ALL' && f.designation !== selectedDesignationFilter) {
        return false;
      }
      if (selectedEmpTypeFilter !== 'ALL' && f.employmentType !== selectedEmpTypeFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && f.accountStatus !== selectedStatusFilter) {
        return false;
      }
      if (selectedMentorFilter !== 'ALL') {
        if (selectedMentorFilter === 'MENTORS_ONLY' && !f.isMentor) return false;
        if (selectedMentorFilter === 'NON_MENTORS' && f.isMentor) return false;
      }
      return true;
    });
  }, [
    facultyDirectory, 
    selectedProgramFilter, 
    selectedDesignationFilter, 
    selectedEmpTypeFilter, 
    selectedStatusFilter, 
    selectedMentorFilter
  ]);

  // ─── KPI Calculations ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalFaculty = filteredDirectory.length;
    const activeFaculty = filteredDirectory.filter(f => f.accountStatus === 'ACTIVE').length;
    const onLeaveFaculty = filteredDirectory.filter(f => f.accountStatus === 'ON_LEAVE').length;
    const visitingFaculty = filteredDirectory.filter(f => f.employmentType === 'VISITING' || f.employmentType === 'ADJUNCT' || f.employmentType === 'CONTRACT').length;
    const mentorFaculty = filteredDirectory.filter(f => f.isMentor).length;

    return {
      totalFaculty,
      activeFaculty,
      onLeaveFaculty,
      visitingFaculty,
      mentorFaculty
    };
  }, [filteredDirectory]);

  // ─── Reset Filters ────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedProgramFilter('ALL');
    setSelectedDesignationFilter('ALL');
    setSelectedEmpTypeFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSelectedMentorFilter('ALL');
  };

  // ─── Save Faculty Profile Edit ────────────────────────────────────────────
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
      (facObj as any).employmentType = editEmpType;
    }

    setEditingFaculty(null);
    setRefreshKey(k => k + 1);
    if (onRefreshParent) onRefreshParent();
    showToast(`Faculty profile for Prof. ${editingFaculty.facultyName} updated successfully.`);
  };

  // ─── Dependent Filter Options ─────────────────────────────────────────────
  const filterOptions: ExcelFilterOption[] = useMemo(() => {
    const deptOpt: ExcelFilterOption = {
      key: 'department',
      label: 'Department',
      value: scope.departmentId,
      disabled: true,
      tooltip: 'Scoped to your assigned department',
      options: [{ label: `[${scope.departmentCode}] ${scope.departmentName}`, value: scope.departmentId }]
    };

    const progOpt: ExcelFilterOption = {
      key: 'program',
      label: 'Program / Branch',
      value: selectedProgramFilter,
      options: [
        { label: 'All Department Branches', value: 'ALL' },
        ...scope.programs.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))
      ]
    };

    const desigOpt: ExcelFilterOption = {
      key: 'designation',
      label: 'Designation',
      value: selectedDesignationFilter,
      options: [
        { label: 'All Designations', value: 'ALL' },
        { label: 'Professor', value: 'Professor' },
        { label: 'Associate Professor', value: 'Associate Professor' },
        { label: 'Assistant Professor', value: 'Assistant Professor' },
        { label: 'Lecturer', value: 'Lecturer' },
        { label: 'Adjunct Faculty', value: 'Adjunct' }
      ]
    };

    const empOpt: ExcelFilterOption = {
      key: 'empType',
      label: 'Employment Type',
      value: selectedEmpTypeFilter,
      options: [
        { label: 'All Employment Types', value: 'ALL' },
        { label: 'Full Time Regular', value: 'FULL_TIME' },
        { label: 'Adjunct Faculty', value: 'ADJUNCT' },
        { label: 'Visiting Professor', value: 'VISITING' },
        { label: 'Contractual Faculty', value: 'CONTRACT' }
      ]
    };

    const statusOpt: ExcelFilterOption = {
      key: 'status',
      label: 'Status',
      value: selectedStatusFilter,
      options: [
        { label: 'All Account Status', value: 'ALL' },
        { label: 'Active Service', value: 'ACTIVE' },
        { label: 'On Sabbatical / Leave', value: 'ON_LEAVE' },
        { label: 'Inactive', value: 'INACTIVE' }
      ]
    };

    const mentorOpt: ExcelFilterOption = {
      key: 'mentor',
      label: 'Mentor Status',
      value: selectedMentorFilter,
      options: [
        { label: 'All Faculty', value: 'ALL' },
        { label: 'Assigned Mentors Only', value: 'MENTORS_ONLY' },
        { label: 'Non-Mentors', value: 'NON_MENTORS' }
      ]
    };

    return [deptOpt, progOpt, desigOpt, empOpt, statusOpt, mentorOpt];
  }, [scope, selectedProgramFilter, selectedDesignationFilter, selectedEmpTypeFilter, selectedStatusFilter, selectedMentorFilter]);

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'program': setSelectedProgramFilter(value); break;
      case 'designation': setSelectedDesignationFilter(value); break;
      case 'empType': setSelectedEmpTypeFilter(value); break;
      case 'status': setSelectedStatusFilter(value); break;
      case 'mentor': setSelectedMentorFilter(value); break;
    }
  };

  // ─── 16 Columns Definition ────────────────────────────────────────────────
  const columns: ExcelColumn<FacultyDirectoryItem>[] = useMemo(() => [
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
    // 2. Faculty Name & Avatar
    {
      key: 'facultyName',
      header: 'FACULTY NAME',
      width: '210px',
      minWidth: '180px',
      sortable: true,
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--brand-navy, #0B192C)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.8rem',
            flexShrink: 0
          }}>
            {item.facultyName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
          </div>
          <div>
            <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.84rem' }}>
              {item.facultyName}
            </strong>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
              {item.officialEmail}
            </div>
          </div>
        </div>
      ),
      getRawValue: item => item.facultyName
    },
    // 3. Employee ID
    {
      key: 'employeeId',
      header: 'EMPLOYEE ID',
      width: '120px',
      sortable: true,
      render: item => (
        <code style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          color: 'var(--brand-orange, #F37023)',
          background: 'rgba(243, 112, 35, 0.08)',
          padding: '2px 5px',
          borderRadius: '3px'
        }}>
          {item.employeeId}
        </code>
      ),
      getRawValue: item => item.employeeId
    },
    // 4. Designation
    {
      key: 'designation',
      header: 'DESIGNATION',
      width: '160px',
      sortable: true,
      render: item => <span style={{ fontWeight: 600, color: '#1E293B' }}>{item.designation}</span>,
      getRawValue: item => item.designation
    },
    // 5. Employment Type
    {
      key: 'employmentType',
      header: 'EMPLOYMENT TYPE',
      width: '140px',
      sortable: true,
      render: item => {
        switch (item.employmentType) {
          case 'FULL_TIME':
            return <Badge variant="navy">Full Time</Badge>;
          case 'ADJUNCT':
            return <Badge variant="warning">Adjunct</Badge>;
          case 'VISITING':
            return <Badge variant="active">Visiting</Badge>;
          case 'CONTRACT':
            return <Badge variant="navy">Contract</Badge>;
        }
      },
      getRawValue: item => item.employmentType
    },
    // 6. Department
    {
      key: 'departmentCode',
      header: 'DEPARTMENT',
      width: '120px',
      sortable: true,
      render: item => <span style={{ color: '#334155' }}>{item.departmentCode}</span>,
      getRawValue: item => item.departmentCode
    },
    // 7. Program
    {
      key: 'programCode',
      header: 'BRANCH / PROGRAM',
      width: '130px',
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
    // 8. Joining Date
    {
      key: 'joiningDate',
      header: 'JOINING DATE',
      width: '115px',
      sortable: true,
      render: item => <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(item.joiningDate).toLocaleDateString()}</span>,
      getRawValue: item => item.joiningDate
    },
    // 9. Qualification
    {
      key: 'qualification',
      header: 'QUALIFICATION',
      width: '180px',
      sortable: true,
      render: item => <span style={{ fontSize: '0.78125rem', color: '#1E293B' }}>{item.qualification}</span>,
      getRawValue: item => item.qualification
    },
    // 10. Experience
    {
      key: 'experienceYears',
      header: 'EXP',
      width: '80px',
      align: 'center',
      sortable: true,
      render: item => <strong>{item.experienceYears} Yrs</strong>,
      getRawValue: item => item.experienceYears
    },
    // 11. Official Email
    {
      key: 'officialEmail',
      header: 'OFFICIAL EMAIL',
      width: '180px',
      sortable: true,
      render: item => <span style={{ fontSize: '0.75rem', color: '#0284C7' }}>{item.officialEmail}</span>,
      getRawValue: item => item.officialEmail
    },
    // 12. Phone
    {
      key: 'phone',
      header: 'CONTACT PHONE',
      width: '130px',
      sortable: true,
      render: item => <span style={{ fontSize: '0.75rem', color: '#334155' }}>{item.phone}</span>,
      getRawValue: item => item.phone
    },
    // 13. Mentor Status
    {
      key: 'isMentor',
      header: 'MENTOR STATUS',
      width: '130px',
      align: 'center',
      sortable: true,
      render: item => (
        item.isMentor ? (
          <span style={{ 
            fontSize: '0.725rem', 
            fontWeight: 800, 
            color: '#15803D', 
            background: '#DCFCE7', 
            padding: '2px 7px', 
            borderRadius: '4px',
            border: '1px solid #BBF7D0'
          }}>
            Mentor ({item.assignedMenteesCount})
          </span>
        ) : (
          <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>No</span>
        )
      ),
      getRawValue: item => (item.isMentor ? 'Yes' : 'No')
    },
    // 14. Account Status
    {
      key: 'accountStatus',
      header: 'STATUS',
      width: '110px',
      align: 'center',
      sortable: true,
      render: item => {
        switch (item.accountStatus) {
          case 'ACTIVE':
            return <Badge variant="active">ACTIVE</Badge>;
          case 'ON_LEAVE':
            return <Badge variant="warning">ON LEAVE</Badge>;
          case 'INACTIVE':
            return <Badge variant="danger">INACTIVE</Badge>;
          default:
            return <Badge variant="inactive">{item.accountStatus}</Badge>;
        }
      },
      getRawValue: item => item.accountStatus
    },
    // 15. Actions
    {
      key: 'actions',
      header: 'ACTIONS',
      width: '150px',
      align: 'center',
      sortable: false,
      render: item => (
        <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSelectedFacultyForProfile(item)}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="View Full Faculty HR Dossier"
          >
            <Eye size={11} /> Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingFaculty(item);
              setEditDesignation(item.designation);
              setEditStatus(item.accountStatus);
              setEditEmpType(item.employmentType);
              setEditIsMentor(item.isMentor);
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="Edit Faculty Record"
          >
            <Edit3 size={11} /> Edit
          </button>
        </div>
      )
    }
  ], []);

  // Bulk Actions
  const bulkActions: ExcelBulkAction<FacultyDirectoryItem>[] = useMemo(() => [
    {
      key: 'export_selected',
      label: 'Export Selected',
      icon: <Download size={12} />,
      variant: 'secondary',
      onClick: selected => {
        const rows = selected.map((f, idx) => ({
          '#': idx + 1,
          'Faculty Name': f.facultyName,
          'Employee ID': f.employeeId,
          'Designation': f.designation,
          'Employment Type': f.employmentType,
          'Department': f.departmentName,
          'Program': f.programCode,
          'Joining Date': f.joiningDate,
          'Qualification': f.qualification,
          'Experience': `${f.experienceYears} Years`,
          'Official Email': f.officialEmail,
          'Phone': f.phone,
          'Mentor Status': f.isMentor ? 'Yes' : 'No',
          'Account Status': f.accountStatus
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Directory');
        XLSX.writeFile(wb, `SSIU_${scope.departmentCode}_Faculty_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast(`Exported ${selected.length} faculty profiles to Excel.`);
      }
    }
  ], [scope]);

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

      {/* ═══ 1. TOP KPI CARDS (HR DIRECTORY FOCUS) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '0.75rem' }}>
        
        {/* Total Faculty */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-navy, #0B192C)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL FACULTY</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
            {kpis.totalFaculty}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Department roster</div>
        </div>

        {/* Active Faculty */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>ACTIVE SERVICE</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            {kpis.activeFaculty}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803D', marginTop: '2px', fontWeight: 700 }}>
            {kpis.totalFaculty > 0 ? Math.round((kpis.activeFaculty / kpis.totalFaculty) * 100) : 0}% On duty
          </div>
        </div>

        {/* On Leave */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${kpis.onLeaveFaculty > 0 ? '#F59E0B' : '#CBD5E1'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>ON LEAVE / SABBATICAL</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: kpis.onLeaveFaculty > 0 ? '#D97706' : '#64748B', marginTop: '2px' }}>
            {kpis.onLeaveFaculty}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Approved leave</div>
        </div>

        {/* Visiting / Contract */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #6366F1', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>VISITING / ADJUNCT</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>
            {kpis.visitingFaculty}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Visiting appointments</div>
        </div>

        {/* Mentor Assigned */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-orange, #F37023)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>MENTOR RESPONSIBILITIES</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '2px' }}>
            {kpis.mentorFaculty}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Active faculty mentors</div>
        </div>

      </div>

      {/* ═══ 2. EXCEL DATA TABLE ═══ */}
      <ExcelDataTable<FacultyDirectoryItem>
        data={filteredDirectory}
        columns={columns}
        keyField="id"
        title="Department Faculty Directory"
        subtitle="Official faculty directory, appointments, qualifications, and department assignments."
        searchPlaceholder="Search faculty name, employee ID, email, qualification..."
        searchFields={['facultyName', 'employeeId', 'officialEmail', 'designation', 'qualification', 'specialization', 'programCode']}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        bulkActions={bulkActions}
        enableSelection={true}
        enableInlineEditing={false}
        exportFilename={`SSIU_${scope.departmentCode}_Faculty_Directory`}
        exportTitle={`${scope.departmentName} — Official Faculty Directory`}
        exportMetadata={{
          'Department': scope.departmentName,
          'Department Code': scope.departmentCode,
          'Total Faculty': String(kpis.totalFaculty),
          'Active Service': String(kpis.activeFaculty)
        }}
        defaultPageSize={25}
        onRefresh={() => {
          setRefreshKey(k => k + 1);
          if (onRefreshParent) onRefreshParent();
          showToast('Faculty directory refreshed.');
        }}
        toolbarExtra={
          onNavigateToWorkload && (
            <button
              type="button"
              onClick={onNavigateToWorkload}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              View Workload Distribution →
            </button>
          )
        }
      />

      {/* ═══ 3. FACULTY HR PROFILE DRAWER / MODAL ═══ */}
      {selectedFacultyForProfile && (
        <Modal
          isOpen={!!selectedFacultyForProfile}
          onClose={() => setSelectedFacultyForProfile(null)}
          title={`Faculty HR Dossier: Prof. ${selectedFacultyForProfile.facultyName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header Hero Banner */}
            <div style={{ 
              padding: '1.15rem 1.35rem', 
              background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 100%)', 
              color: '#FFFFFF', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--brand-orange, #F37023)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.15rem'
                }}>
                  {selectedFacultyForProfile.facultyName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                    {selectedFacultyForProfile.facultyName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#93C5FD', marginTop: '2px' }}>
                    {selectedFacultyForProfile.designation} • <code>{selectedFacultyForProfile.employeeId}</code>
                  </div>
                </div>
              </div>

              <div>
                <Badge variant={selectedFacultyForProfile.accountStatus === 'ACTIVE' ? 'active' : 'warning'}>
                  {selectedFacultyForProfile.accountStatus}
                </Badge>
              </div>
            </div>

            {/* Core Employment & Academic Profile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ACADEMIC APPOINTMENT</div>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)', marginTop: '2px' }}>
                  {selectedFacultyForProfile.departmentName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                  {selectedFacultyForProfile.programName} ({selectedFacultyForProfile.programCode})
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>QUALIFICATION & EXPERIENCE</div>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)', marginTop: '2px' }}>
                  {selectedFacultyForProfile.qualification}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                  {selectedFacultyForProfile.experienceYears} Years Academic & Research Experience
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>SPECIALIZATION</div>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)', marginTop: '2px' }}>
                  {selectedFacultyForProfile.specialization}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                  Joined: {new Date(selectedFacultyForProfile.joiningDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Contact & Official Comms */}
            <div style={{ padding: '0.85rem 1rem', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 800, color: '#0369A1', marginBottom: '0.35rem' }}>OFFICIAL COMMUNICATIONS</div>
              <div><strong>Email:</strong> {selectedFacultyForProfile.officialEmail}</div>
              <div style={{ marginTop: '2px' }}><strong>Contact Phone:</strong> {selectedFacultyForProfile.phone}</div>
              <div style={{ marginTop: '2px' }}><strong>Mentor Allocation:</strong> {selectedFacultyForProfile.isMentor ? `Active Mentor (${selectedFacultyForProfile.assignedMenteesCount} Mentees Assigned)` : 'Not Assigned as Mentor'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedFacultyForProfile(null)}
                className="btn btn-primary btn-sm"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ═══ 4. EDIT FACULTY RECORD MODAL ═══ */}
      {editingFaculty && (
        <Modal
          isOpen={!!editingFaculty}
          onClose={() => setEditingFaculty(null)}
          title={`Edit Faculty Record: Prof. ${editingFaculty.facultyName}`}
        >
          <form onSubmit={handleSaveFacultyEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Academic Designation *</label>
              <select
                className="form-control"
                value={editDesignation}
                onChange={e => setEditDesignation(e.target.value)}
                required
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Adjunct">Adjunct</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Employment Type *</label>
              <select
                className="form-control"
                value={editEmpType}
                onChange={e => setEditEmpType(e.target.value)}
                required
              >
                <option value="FULL_TIME">Full Time Regular</option>
                <option value="ADJUNCT">Adjunct Faculty</option>
                <option value="VISITING">Visiting Professor</option>
                <option value="CONTRACT">Contractual</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Service Status *</label>
              <select
                className="form-control"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Sabbatical / Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="editIsMentor"
                checked={editIsMentor}
                onChange={e => setEditIsMentor(e.target.checked)}
              />
              <label htmlFor="editIsMentor" style={{ fontSize: '0.84rem', fontWeight: 700, margin: 0 }}>
                Assign as Department Student Mentor
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setEditingFaculty(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Profile Updates
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
