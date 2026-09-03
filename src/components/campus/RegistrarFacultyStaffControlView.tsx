import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { workTransferService } from '../../services/workTransferService';
import { staffProfileService } from '../../services/staffProfileService';
import { Badge } from '../common/Badge';
import { ExcelDataTable, ExcelColumn } from '../common/ExcelDataTable';
import { Modal } from '../common/Modal';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { 
  Building2, Users, ArrowLeft, RefreshCw, Briefcase, Award, 
  BookOpen, Clock, ShieldCheck, AlertTriangle, Search, Filter, 
  Download, Eye, CheckCircle2, UserCheck, Layers, FileText, 
  Calendar, Phone, Mail, GraduationCap, ChevronRight, User as UserIcon,
  PieChart, Activity, HelpCircle, CheckSquare, Plus, Network
} from 'lucide-react';
import { Institute, Department, Faculty, Employee, Student, User } from '../../types';
import { FacultyPortfolioSummary } from '../../types/workTransfer';
import * as XLSX from 'xlsx';

export interface RegistrarFacultyStaffControlViewProps {
  onBackToDashboard?: () => void;
  initialInstituteId?: string;
  initialDepartmentId?: string;
}

export type FacultyStaffSubView = 'INSTITUTES' | 'INSTITUTE_DETAIL' | 'DEPARTMENT_DETAIL';
export type FacultyCategoryFilter = 'ALL' | 'FACULTY' | 'STAFF' | 'HOD' | 'OTHER_ACADEMIC_ROLES' | 'ADMIN_STAFF';

export const RegistrarFacultyStaffControlView: React.FC<RegistrarFacultyStaffControlViewProps> = ({
  onBackToDashboard,
  initialInstituteId,
  initialDepartmentId
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // ──────────────────────────────────────────────────────────────────────────
  // CANONICAL MASTER DATA (SINGLE SOURCE OF TRUTH)
  // ──────────────────────────────────────────────────────────────────────────
  const institutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const departments = useMemo(() => db.getDepartments(), [refreshKey]);
  const faculty = useMemo(() => db.getFaculty(), [refreshKey]);
  const employees = useMemo(() => db.getEmployees(), [refreshKey]);
  const subjects = useMemo(() => db.getSubjects(), [refreshKey]);
  const students = useMemo(() => db.getStudents(), [refreshKey]);
  const academicYears = useMemo(() => db.getAcademicYears(), [refreshKey]);
  const activeAY = useMemo(() => academicYears.find(ay => ay.isCurrent) || { name: '2025-2026' }, [academicYears]);

  // ──────────────────────────────────────────────────────────────────────────
  // NAVIGATION & DRILL-DOWN STATE
  // ──────────────────────────────────────────────────────────────────────────
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(() => {
    if (initialInstituteId) return institutes.find(i => i.id === initialInstituteId) || null;
    return null;
  });

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(() => {
    if (initialDepartmentId) return departments.find(d => d.id === initialDepartmentId) || null;
    return null;
  });

  const [categoryFilter, setCategoryFilter] = useState<FacultyCategoryFilter>('ALL');
  const [workloadFilter, setWorkloadFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Profile Modal State
  const [selectedFacultyFor360, setSelectedFacultyFor360] = useState<Faculty | null>(null);
  const [selectedStaffFor360, setSelectedStaffFor360] = useState<Employee | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<
    'OVERVIEW' | 'PORTFOLIOS' | 'WORKLOAD' | 'COURSES' | 'STUDENTS' | 'ADMIN_WORK' | 'PERFORMANCE' | 'DOCUMENTS' | 'HISTORY'
  >('OVERVIEW');

  // ──────────────────────────────────────────────────────────────────────────
  // LIVE COMPUTED PORTFOLIO CACHE (DYNAMIC RELATIONAL COMPUTATION)
  // ──────────────────────────────────────────────────────────────────────────
  const facultyPortfoliosMap = useMemo(() => {
    const map = new Map<string, FacultyPortfolioSummary>();
    faculty.forEach(f => {
      map.set(f.id, workTransferService.getFacultyPortfolio(f.id));
    });
    return map;
  }, [faculty, refreshKey]);

  // ──────────────────────────────────────────────────────────────────────────
  // UNIVERSITY-WIDE FACULTY & STAFF SUMMARY KPIS
  // ──────────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalFaculty = faculty.length;
    const totalStaff = employees.length;
    const teachingFaculty = faculty.filter(f => f.status === 'ACTIVE').length;
    const nonTeachingStaff = employees.filter(e => e.employmentStatus !== 'INACTIVE').length;

    // HODs: Faculty with designation HOD or appointed in Department.hodId
    const hodsCount = departments.filter(d => Boolean(d.hodId || (d as any).hodFacultyId) || faculty.some(f => f.departmentId === d.id && f.designation?.toLowerCase().includes('hod'))).length;

    // Workload distributions
    let overloadedCount = 0;
    let normalCount = 0;
    let underloadedCount = 0;
    let unallocatedCount = 0;
    let withPortfoliosCount = 0;

    faculty.forEach(f => {
      const port = facultyPortfoliosMap.get(f.id);
      const hours = port ? port.totalWeeklyAcademicHours : 0;
      const adminCount = port ? port.administrativeResponsibilities.length + port.committeeResponsibilities.length : 0;

      if (adminCount > 0 || (f.designation && f.designation.toLowerCase().includes('hod'))) {
        withPortfoliosCount++;
      }

      if (hours === 0 && (!f.subjectIds || f.subjectIds.length === 0)) {
        unallocatedCount++;
        underloadedCount++;
      } else if (hours > 20) {
        overloadedCount++;
      } else if (hours < 12) {
        underloadedCount++;
      } else {
        normalCount++;
      }
    });

    const pendingActions = unallocatedCount + overloadedCount;

    return {
      totalFaculty,
      totalStaff,
      teachingFaculty,
      nonTeachingStaff,
      hodsCount,
      withPortfoliosCount,
      withoutPortfoliosCount: Math.max(0, totalFaculty - withPortfoliosCount),
      unallocatedCount,
      underloadedCount,
      normalCount,
      overloadedCount,
      pendingActions
    };
  }, [faculty, employees, departments, facultyPortfoliosMap]);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. INSTITUTE DIRECTORY DATASET (INSTITUTE-FIRST VIEW)
  // ──────────────────────────────────────────────────────────────────────────
  const instituteDirectoryData = useMemo(() => {
    return institutes.map((inst, idx) => {
      const instFaculty = faculty.filter(f => f.instituteId === inst.id);
      const instStaff = employees.filter(e => e.instituteId === inst.id);
      const instDepts = departments.filter(d => d.instituteId === inst.id);
      const instProgs = db.getPrograms().filter(p => p.instituteId === inst.id);
      const instStudents = students.filter(s => s.instituteId === inst.id);

      const hodCount = instDepts.filter(d => (d.hodId || (d as any).hodFacultyId) || instFaculty.some(f => f.departmentId === d.id && f.designation?.toLowerCase().includes('hod'))).length;

      // Workloads in this institute
      let highWorkloadCount = 0;
      let unallocatedCount = 0;

      instFaculty.forEach(f => {
        const port = facultyPortfoliosMap.get(f.id);
        const hours = port ? port.totalWeeklyAcademicHours : 0;
        if (hours > 18) highWorkloadCount++;
        if (hours === 0 && (!f.subjectIds || f.subjectIds.length === 0)) unallocatedCount++;
      });

      const fsr = `1:${Math.round(instStudents.length / Math.max(1, instFaculty.length))}`;

      return {
        id: inst.id,
        index: idx + 1,
        institute: inst,
        code: inst.code,
        name: inst.name,
        principalName: (inst as any).deanName || (inst as any).principalName || 'Dr. Principal / Director',
        totalFaculty: instFaculty.length,
        totalStaff: instStaff.length,
        teachingFaculty: instFaculty.filter(f => f.status === 'ACTIVE').length,
        nonTeachingStaff: instStaff.filter(e => e.employmentStatus !== 'INACTIVE').length,
        departmentsCount: instDepts.length,
        programsCount: instProgs.length,
        studentsCount: instStudents.length,
        hodCount,
        fsr,
        highWorkloadCount,
        unallocatedCount,
        pendingActions: highWorkloadCount + unallocatedCount,
        status: inst.status || 'ACTIVE'
      };
    });
  }, [institutes, faculty, employees, departments, students, facultyPortfoliosMap]);

  // Institute Directory Columns
  const instituteDirectoryColumns: ExcelColumn<any>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '110px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.code}</code>
    },
    {
      key: 'name',
      header: 'Institute / Constituent Unit',
      width: '260px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>HOI: {item.principalName}</div>
        </div>
      )
    },
    {
      key: 'departmentsCount',
      header: 'Depts',
      width: '80px',
      align: 'center',
      render: item => <span>{item.departmentsCount}</span>
    },
    {
      key: 'totalFaculty',
      header: 'Faculty',
      width: '90px',
      align: 'center',
      render: item => <strong style={{ color: '#4338CA' }}>{item.totalFaculty}</strong>
    },
    {
      key: 'totalStaff',
      header: 'Staff',
      width: '80px',
      align: 'center',
      render: item => <span>{item.totalStaff}</span>
    },
    {
      key: 'hodCount',
      header: 'HODs',
      width: '80px',
      align: 'center',
      render: item => <span>{item.hodCount}</span>
    },
    {
      key: 'fsr',
      header: 'FSR',
      width: '85px',
      align: 'center',
      render: item => <span>{item.fsr}</span>
    },
    {
      key: 'highWorkloadCount',
      header: 'High Load',
      width: '95px',
      align: 'center',
      render: item => (
        <Badge variant={item.highWorkloadCount > 0 ? 'warning' : 'active'}>{item.highWorkloadCount}</Badge>
      )
    },
    {
      key: 'unallocatedCount',
      header: 'Unallocated',
      width: '95px',
      align: 'center',
      render: item => (
        <Badge variant={item.unallocatedCount > 0 ? 'danger' : 'active'}>{item.unallocatedCount}</Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '90px',
      align: 'center',
      render: item => <Badge variant="active">{item.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Action',
      width: '150px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={() => setSelectedInstitute(item.institute)}
        >
          OPEN INSTITUTE →
        </button>
      )
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SCOPED FACULTY & STAFF DATASET (INSIDE SELECTED INSTITUTE / DEPT)
  // ──────────────────────────────────────────────────────────────────────────
  const scopedFacultyAndStaff = useMemo(() => {
    const targetInstId = selectedInstitute ? selectedInstitute.id : undefined;
    const targetDeptId = selectedDepartment ? selectedDepartment.id : undefined;

    // Filter Faculty
    let fList = faculty;
    if (targetInstId) fList = fList.filter(f => f.instituteId === targetInstId);
    if (targetDeptId) fList = fList.filter(f => f.departmentId === targetDeptId);

    // Filter Employees (Staff)
    let eList = employees;
    if (targetInstId) eList = eList.filter(e => e.instituteId === targetInstId);
    if (targetDeptId) eList = eList.filter(e => e.departmentId === targetDeptId);

    // Map Faculty records to normalized table rows
    const facultyRows = fList.map(f => {
      const port = facultyPortfoliosMap.get(f.id);
      const dept = departments.find(d => d.id === f.departmentId);
      const inst = institutes.find(i => i.id === f.instituteId);
      const hours = port ? port.totalWeeklyAcademicHours : 0;
      const subjectsCount = port ? port.assignedSubjects.length : (f.subjectIds?.length || 0);
      const studentsCount = port ? port.mentorStudentsCount : 0;

      // Portfolios list
      const portfoliosList: string[] = [];
      if (f.designation?.toLowerCase().includes('hod')) portfoliosList.push('HOD');
      if (port) {
        port.administrativeResponsibilities.forEach(a => portfoliosList.push(a.role || a.title));
        port.committeeResponsibilities.forEach(c => portfoliosList.push(c.committeeName));
        if (port.mentorStudentsCount > 0) portfoliosList.push('Mentor');
      }
      if (portfoliosList.length === 0) portfoliosList.push('Teaching Faculty');

      // Workload status
      let wlStatus = 'NORMAL';
      if (hours === 0 && subjectsCount === 0) wlStatus = 'UNALLOCATED';
      else if (hours > 20) wlStatus = 'OVERLOADED';
      else if (hours < 12) wlStatus = 'UNDERLOADED';

      const isHOD = f.designation?.toLowerCase().includes('hod') || (dept?.hodId === f.id || (dept as any)?.hodFacultyId === f.id);

      // Reporting Authority
      const reportingAuthority = isHOD 
        ? `${(inst as any)?.deanName || 'Dr. Principal / HOI'} (Principal)`
        : `${dept?.name || 'Department'} HOD`;

      return {
        id: f.id,
        employeeId: f.employeeId || f.id,
        name: f.name,
        email: f.email,
        phone: f.phone,
        designation: f.designation,
        departmentId: f.departmentId,
        departmentName: dept?.name || 'Department',
        instituteId: f.instituteId,
        instituteName: inst?.name || 'Institute',
        employmentType: 'Full-Time Academic',
        roleCategory: isHOD ? 'HOD' : 'FACULTY',
        isFaculty: true,
        isStaff: false,
        isHOD,
        reportingAuthority,
        joiningDate: f.joiningDate || '2023-08-01',
        portfolios: portfoliosList,
        workloadHours: hours,
        workloadStatus: wlStatus,
        subjectsCount,
        studentsCount,
        status: f.status || 'ACTIVE',
        facultyObj: f,
        employeeObj: null
      };
    });

    // Map Staff records to normalized table rows
    const staffRows = eList.map(e => {
      const dept = departments.find(d => d.id === e.departmentId);
      const inst = institutes.find(i => i.id === e.instituteId);

      return {
        id: e.id,
        employeeId: e.employeeId || e.id,
        name: e.name,
        email: e.email,
        phone: e.phone,
        designation: e.designation || 'Administrative Staff',
        departmentId: e.departmentId,
        departmentName: dept?.name || e.departmentName || 'Central Administration',
        instituteId: e.instituteId,
        instituteName: inst?.name || e.instituteName || 'Central University Unit',
        employmentType: e.employmentType || e.employeeType || 'Full-Time Staff',
        roleCategory: 'STAFF',
        isFaculty: false,
        isStaff: true,
        isHOD: false,
        reportingAuthority: e.reportingManagerName || 'Registrar / HOI',
        joiningDate: e.joiningDate || '2023-01-15',
        portfolios: [e.designation || 'Administrative Support'],
        workloadHours: 40,
        workloadStatus: 'NORMAL',
        subjectsCount: 0,
        studentsCount: 0,
        status: (e.employmentStatus as any) || 'ACTIVE',
        facultyObj: null,
        employeeObj: e
      };
    });

    // Combine according to category filter
    let combined = [...facultyRows, ...staffRows];

    if (categoryFilter === 'FACULTY') {
      combined = facultyRows;
    } else if (categoryFilter === 'STAFF' || categoryFilter === 'ADMIN_STAFF') {
      combined = staffRows;
    } else if (categoryFilter === 'HOD') {
      combined = facultyRows.filter(f => f.isHOD);
    } else if (categoryFilter === 'OTHER_ACADEMIC_ROLES') {
      combined = facultyRows.filter(f => f.portfolios.length > 1 || f.portfolios.some(p => p !== 'Teaching Faculty'));
    }

    // Workload filter
    if (workloadFilter !== 'ALL') {
      combined = combined.filter(c => c.workloadStatus === workloadFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.employeeId.toLowerCase().includes(q) ||
        c.departmentName.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q) ||
        c.portfolios.some(p => p.toLowerCase().includes(q))
      );
    }

    return combined;
  }, [faculty, employees, departments, institutes, selectedInstitute, selectedDepartment, categoryFilter, workloadFilter, searchQuery, facultyPortfoliosMap]);

  // Scoped Columns
  const facultyStaffColumns: ExcelColumn<any>[] = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      width: '120px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{item.employeeId}</code>
    },
    {
      key: 'name',
      header: 'Employee Name & Email',
      width: '240px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.email}</div>
        </div>
      )
    },
    {
      key: 'designation',
      header: 'Designation & Dept',
      width: '210px',
      render: item => (
        <div>
          <span style={{ fontWeight: 600 }}>{item.designation}</span>
          <div style={{ fontSize: '0.72rem', color: '#4338CA' }}>{item.departmentName}</div>
        </div>
      )
    },
    {
      key: 'roleCategory',
      header: 'Category',
      width: '110px',
      align: 'center',
      render: item => (
        <Badge variant={item.isHOD ? 'gold' : item.isFaculty ? 'navy' : 'purple'}>
          {item.isHOD ? 'HOD' : item.isFaculty ? 'FACULTY' : 'STAFF'}
        </Badge>
      )
    },
    {
      key: 'reportingAuthority',
      header: 'Reports To',
      width: '180px',
      render: item => <span style={{ fontSize: '0.75rem', color: '#475569' }}>{item.reportingAuthority}</span>
    },
    {
      key: 'portfolios',
      header: 'Assigned Portfolios',
      width: '200px',
      render: item => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {item.portfolios.map((p: string, pIdx: number) => (
            <span 
              key={pIdx}
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                backgroundColor: p === 'HOD' ? '#FEF3C7' : '#EFF6FF',
                color: p === 'HOD' ? '#92400E' : '#1E40AF',
                fontWeight: 600,
                border: '1px solid',
                borderColor: p === 'HOD' ? '#FDE68A' : '#DBEAFE'
              }}
            >
              {p}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'workloadHours',
      header: 'Workload',
      width: '120px',
      align: 'center',
      render: item => item.isFaculty ? (
        <div>
          <strong style={{ color: item.workloadHours > 20 ? '#EF4444' : '#10B981' }}>
            {item.workloadHours} hrs/wk
          </strong>
          <div style={{ fontSize: '0.7rem' }}>
            <Badge variant={item.workloadStatus === 'OVERLOADED' ? 'danger' : item.workloadStatus === 'UNALLOCATED' ? 'warning' : 'active'}>
              {item.workloadStatus}
            </Badge>
          </div>
        </div>
      ) : (
        <span>40 hrs/wk</span>
      )
    },
    {
      key: 'subjectsCount',
      header: 'Subjects / Mentees',
      width: '130px',
      align: 'center',
      render: item => item.isFaculty ? (
        <div style={{ fontSize: '0.75rem' }}>
          <span>{item.subjectsCount} Subjects</span> • <strong>{item.studentsCount} Mentees</strong>
        </div>
      ) : (
        <span style={{ color: '#94A3B8' }}>N/A</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '90px',
      align: 'center',
      render: item => <Badge variant={item.status === 'ACTIVE' ? 'active' : 'inactive'}>{item.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => {
            if (item.facultyObj) {
              setSelectedFacultyFor360(item.facultyObj);
            } else if (item.employeeObj) {
              setSelectedStaffFor360(item.employeeObj);
            }
          }}
        >
          VIEW 360° PROFILE
        </button>
      )
    }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT COMPLETE FACULTY & STAFF ROSTER (.XLSX)
  // ──────────────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const exportRows = scopedFacultyAndStaff.map(c => ({
      'Employee ID': c.employeeId,
      'Name': c.name,
      'Email': c.email,
      'Phone': c.phone,
      'Designation': c.designation,
      'Category': c.roleCategory,
      'Department': c.departmentName,
      'Institute': c.instituteName,
      'Employment Type': c.employmentType,
      'Reporting Authority': c.reportingAuthority,
      'Assigned Portfolios': c.portfolios.join(', '),
      'Weekly Academic Hours': c.workloadHours,
      'Workload Status': c.workloadStatus,
      'Assigned Subjects Count': c.subjectsCount,
      'Assigned Mentees Count': c.studentsCount,
      'Joining Date': c.joiningDate,
      'Status': c.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Staff_Roster');
    XLSX.writeFile(wb, `SSIU_Faculty_Staff_Roster_${selectedInstitute ? selectedInstitute.code : 'All_Institutes'}.xlsx`);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER VIEW
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* ─── HEADER & BREADCRUMB ─── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
              Faculty & Staff Management & Academic Workforce Control
            </h2>
            <Badge variant="navy">Apex Registrar Oversight</Badge>
            <Badge variant="active">AY {activeAY.name}</Badge>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            {selectedInstitute ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span 
                  style={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setSelectedInstitute(null); setSelectedDepartment(null); }}
                >
                  All Institutes
                </span>
                <span>/</span>
                <strong>{selectedInstitute.name} ({selectedInstitute.code})</strong>
                {selectedDepartment && (
                  <>
                    <span>/</span>
                    <strong style={{ color: '#F37023' }}>{selectedDepartment.name}</strong>
                  </>
                )}
              </span>
            ) : (
              'Central statutory directory, academic workload matrices, relational portfolio assignments, and reporting hierarchies.'
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {selectedInstitute && (
            <button
              onClick={() => { setSelectedInstitute(null); setSelectedDepartment(null); }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} /> Back to Institutes
            </button>
          )}
          <button 
            onClick={triggerRefresh} 
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} /> Sync Workforce Data
          </button>
          <button 
            onClick={handleExportExcel}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} /> Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* ─── UNIVERSITY-WIDE WORKFORCE KPI RIBBON ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #0B192C' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Faculty</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B192C' }}>{kpis.totalFaculty}</div>
          <div style={{ fontSize: '0.68rem', color: '#10B981' }}>{kpis.teachingFaculty} Active Teaching</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #6366F1' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total Staff</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366F1' }}>{kpis.totalStaff}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{kpis.nonTeachingStaff} Non-Teaching</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Appointed HODs</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{kpis.hodsCount}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Department Heads</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Active Portfolios</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB' }}>{kpis.withPortfoliosCount}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{kpis.withoutPortfoliosCount} Teaching Only</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Overloaded Faculty</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>{kpis.overloadedCount}</div>
          <div style={{ fontSize: '0.68rem', color: '#EF4444' }}>&gt;20 hrs/week</div>
        </div>
        <div className="card" style={{ padding: '0.9rem', borderLeft: '4px solid #F37023' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Unallocated Faculty</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F37023' }}>{kpis.unallocatedCount}</div>
          <div style={{ fontSize: '0.68rem', color: '#F37023' }}>0 Courses Assigned</div>
        </div>
      </div>

      {/* ─── WHAT NEEDS MY ATTENTION? ACTION CENTER ─── */}
      <div style={{ 
        backgroundColor: '#FFFFFF', 
        borderRadius: '12px', 
        border: '1px solid #E2E8F0', 
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={18} color="#F59E0B" /> FACULTY & STAFF — WHAT NEEDS MY ATTENTION?
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Live workforce exceptions requiring Registrar review, workload rebalancing, or portfolio assignments.
            </p>
          </div>
          <Badge variant="warning">{kpis.pendingActions} Actionable Items</Badge>
        </div>

        <div 
          className="dashboard-attention-cards-grid"
          style={{ '--action-count': 4 } as React.CSSProperties}
        >
          <div 
            style={{ 
              padding: '0.85rem', 
              backgroundColor: '#FEF2F2', 
              border: '1px solid #FEE2E2', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
            onClick={() => { setWorkloadFilter('OVERLOADED'); setCategoryFilter('FACULTY'); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem', color: '#991B1B' }}>Faculty Overload Exception (&gt;20h)</strong>
              <Badge variant="danger">{kpis.overloadedCount}</Badge>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#7F1D1D', marginTop: '0.25rem' }}>
              Professors with excessive weekly teaching contact load requiring subject re-distribution.
            </div>
          </div>

          <div 
            style={{ 
              padding: '0.85rem', 
              backgroundColor: '#FFFBEB', 
              border: '1px solid #FEF3C7', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
            onClick={() => { setWorkloadFilter('UNALLOCATED'); setCategoryFilter('FACULTY'); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem', color: '#92400E' }}>Unallocated Faculty (0 Courses)</strong>
              <Badge variant="warning">{kpis.unallocatedCount}</Badge>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#78350F', marginTop: '0.25rem' }}>
              Active faculty members currently having zero course or subject teaching assignments.
            </div>
          </div>

          <div 
            style={{ 
              padding: '0.85rem', 
              backgroundColor: '#EFF6FF', 
              border: '1px solid #DBEAFE', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
            onClick={() => { setCategoryFilter('HOD'); setWorkloadFilter('ALL'); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem', color: '#1E40AF' }}>Appointed Department HODs</strong>
              <Badge variant="navy">{kpis.hodsCount}</Badge>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#1E3A8A', marginTop: '0.25rem' }}>
              Verify HOD reporting lines and statutory responsibilities across constituent institutes.
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRIMARY VIEW 1: INSTITUTE-FIRST DIRECTORY (WHEN NO INSTITUTE IS SELECTED) ─── */}
      {!selectedInstitute && (
        <ExcelDataTable
          data={instituteDirectoryData}
          columns={instituteDirectoryColumns}
          title={`Constituent Institutes Workforce Directory (${institutes.length})`}
          subtitle="Institute-first hierarchy. Click 'OPEN INSTITUTE →' to view constituent departments, faculty rosters, and workload allocations."
          storageKey="reg_fac_inst_dir"
          searchPlaceholder="Search institute by code, name, or principal..."
          searchFields={['name', 'code', 'principalName']}
          exportFilename="SSIU_Institutes_Workforce_Directory"
          onRefresh={triggerRefresh}
        />
      )}

      {/* ─── PRIMARY VIEW 2: INSIDE SELECTED INSTITUTE ─── */}
      {selectedInstitute && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Institute Overview Header */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} color="#2563EB" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                    {selectedInstitute.name} ({selectedInstitute.code})
                  </h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Head of Institute (HOI): <strong>{(selectedInstitute as any).deanName || (selectedInstitute as any).principalName || 'Dr. Principal / Director'}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '0.35rem 0.65rem' }}>
                  {departments.filter(d => d.instituteId === selectedInstitute.id).length} Departments
                </span>
                <span className="badge" style={{ backgroundColor: '#EEF2FF', color: '#4338CA', padding: '0.35rem 0.65rem' }}>
                  {faculty.filter(f => f.instituteId === selectedInstitute.id).length} Faculty
                </span>
                <span className="badge" style={{ backgroundColor: '#F5F3FF', color: '#6D28D9', padding: '0.35rem 0.65rem' }}>
                  {employees.filter(e => e.instituteId === selectedInstitute.id).length} Staff
                </span>
              </div>
            </div>

            {/* Department Quick Filter Buttons */}
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginRight: '0.5rem' }}>
                Filter Department:
              </span>
              <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-xs ${!selectedDepartment ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedDepartment(null)}
                >
                  All Departments in {selectedInstitute.code}
                </button>
                {departments.filter(d => d.instituteId === selectedInstitute.id).map(dept => (
                  <button
                    key={dept.id}
                    className={`btn btn-xs ${selectedDepartment?.id === dept.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    {dept.name} ({faculty.filter(f => f.departmentId === dept.id).length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-Filters Tabs: ALL, FACULTY, STAFF, HOD, OTHER ROLES, ADMIN STAFF */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {([
                { id: 'ALL', label: 'All Faculty & Staff' },
                { id: 'FACULTY', label: 'Teaching Faculty' },
                { id: 'STAFF', label: 'All Staff' },
                { id: 'HOD', label: 'Appointed HODs' },
                { id: 'OTHER_ACADEMIC_ROLES', label: 'Portfolios & Coordinators' },
                { id: 'ADMIN_STAFF', label: 'Administrative Staff' }
              ] as { id: FacultyCategoryFilter; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  className={`btn btn-sm ${categoryFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCategoryFilter(tab.id)}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Workload Status Quick Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Workload:</span>
              <select
                value={workloadFilter}
                onChange={e => setWorkloadFilter(e.target.value)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="ALL">All Workload Statuses</option>
                <option value="NORMAL">Normal (12 - 20 hrs)</option>
                <option value="OVERLOADED">Overloaded (&gt;20 hrs)</option>
                <option value="UNDERLOADED">Underloaded (&lt;12 hrs)</option>
                <option value="UNALLOCATED">Unallocated (0 hrs)</option>
              </select>
            </div>
          </div>

          {/* Excel Data Table for Faculty & Staff in Institute */}
          <ExcelDataTable
            data={scopedFacultyAndStaff}
            columns={facultyStaffColumns}
            title={`${selectedInstitute.code} — Faculty & Staff Roster (${scopedFacultyAndStaff.length})`}
            subtitle={`Scoped to ${selectedInstitute.name}${selectedDepartment ? ` → ${selectedDepartment.name}` : ''}. Click 'VIEW 360° PROFILE' to view complete academic profile, workload matrices, portfolios, and mentee rosters.`}
            storageKey={`reg_fac_staff_${selectedInstitute.id}`}
            searchPlaceholder="Search by name, employee ID, designation, department, or portfolio..."
            searchFields={['name', 'employeeId', 'designation', 'departmentName', 'email']}
            exportFilename={`${selectedInstitute.code}_Faculty_Staff_Roster`}
            onRefresh={triggerRefresh}
          />
        </div>
      )}

      {/* ─── MODAL: FACULTY 360 PROFILE DOSSIER ─── */}
      {selectedFacultyFor360 && (() => {
        const f = selectedFacultyFor360;
        const port = facultyPortfoliosMap.get(f.id) || workTransferService.getFacultyPortfolio(f.id);
        const dept = departments.find(d => d.id === f.departmentId);
        const inst = institutes.find(i => i.id === f.instituteId);
        const isHOD = f.designation?.toLowerCase().includes('hod') || (dept?.hodId === f.id || (dept as any)?.hodFacultyId === f.id);
        const reportingAuthority = isHOD 
          ? `${(inst as any)?.deanName || 'Dr. Principal / HOI'} (Principal / HOI)`
          : `${dept?.name || 'Department'} Head of Department (HOD)`;

        return (
          <Modal
            isOpen={Boolean(selectedFacultyFor360)}
            onClose={() => { setSelectedFacultyFor360(null); setProfileActiveTab('OVERVIEW'); }}
            title={`Faculty 360° Profile: ${f.name} (${f.employeeId || f.id})`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '700px' }}>
              {/* Header Dossier */}
              <div style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#475569'
                }}>
                  {f.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                      {f.name}
                    </h3>
                    <code style={{ fontWeight: 800, color: '#F37023' }}>{f.employeeId || f.id}</code>
                    <Badge variant={isHOD ? 'gold' : 'navy'}>{f.designation}</Badge>
                    <Badge variant={f.status === 'ACTIVE' ? 'active' : 'warning'}>{f.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Department: <strong>{dept?.name || f.departmentId}</strong> • Institute: <strong>{inst?.name}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                    Reporting Authority: <strong style={{ color: '#2563EB' }}>{reportingAuthority}</strong> • Email: <strong>{f.email}</strong> • Phone: <strong>{f.phone}</strong>
                  </div>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'OVERVIEW', label: '1. Overview' },
                  { id: 'PORTFOLIOS', label: '2. Portfolios & Duties' },
                  { id: 'WORKLOAD', label: '3. Workload & Hours' },
                  { id: 'COURSES', label: '4. Subject Allocations' },
                  { id: 'STUDENTS', label: `5. Mentees (${port.mentorStudentsCount})` },
                  { id: 'ADMIN_WORK', label: '6. Committees & Admin' },
                  { id: 'PERFORMANCE', label: '7. Performance & Availability' },
                  { id: 'DOCUMENTS', label: '8. Documents' },
                  { id: 'HISTORY', label: '9. Audit & History' }
                ].map(t => (
                  <button
                    key={t.id}
                    className={`btn btn-xs ${profileActiveTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setProfileActiveTab(t.id as any)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {profileActiveTab === 'OVERVIEW' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0B192C' }}>Academic Profile</h4>
                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569' }}>
                      <div>Qualification: <strong>{f.qualification || 'Ph.D. / M.Tech'}</strong></div>
                      <div>Specialization: <strong>{f.specialization || 'Computer Science & Engineering'}</strong></div>
                      <div>Experience: <strong>{f.experienceYears || 8} Years</strong></div>
                      <div>Joining Date: <strong>{f.joiningDate || '2023-08-01'}</strong></div>
                      <div>Employment Type: <strong>Full-Time Permanent</strong></div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0B192C' }}>Active Workload Summary</h4>
                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569' }}>
                      <div>Total Weekly Load: <strong style={{ color: '#2563EB' }}>{port.totalWeeklyAcademicHours} hrs/wk</strong></div>
                      <div>Lectures / Theory: <strong>{port.lectureLoadHours} hrs</strong></div>
                      <div>Practicals / Labs: <strong>{port.practicalLoadHours} hrs</strong></div>
                      <div>Assigned Subjects: <strong>{port.assignedSubjects.length} Courses</strong></div>
                      <div>Assigned Mentees: <strong>{port.mentorStudentsCount} Students</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PORTFOLIOS & RESPONSIBILITIES */}
              {profileActiveTab === 'PORTFOLIOS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Relational portfolio assignments and statutory responsibilities assigned under SSIU University Master.
                  </div>
                  {isHOD && (
                    <div style={{ padding: '0.85rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#92400E' }}>Head of Department (HOD)</strong>
                        <Badge variant="gold">Statutory Executive</Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '0.35rem' }}>
                        Department academic governance, faculty workload distribution, subject allocations, semester attendance approvals, and COE examination coordination.
                      </div>
                    </div>
                  )}
                  {port.administrativeResponsibilities.map((adm, aIdx) => (
                    <div key={aIdx} style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0B192C' }}>{adm.title}</strong>
                        <Badge variant="navy">{adm.role || 'Coordinator'}</Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                        {adm.description || 'Statutory portfolio responsibilities assigned by Office of the Registrar.'}
                      </div>
                    </div>
                  ))}
                  {port.committeeResponsibilities.map((com, cIdx) => (
                    <div key={cIdx} style={{ padding: '0.85rem', backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#5B21B6' }}>{com.committeeName}</strong>
                        <Badge variant="purple">{com.designation || 'Member'}</Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6D28D9', marginTop: '0.35rem' }}>
                        Institutional accreditation, curriculum review committee, and disciplinary council responsibilities.
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: WORKLOAD */}
              {profileActiveTab === 'WORKLOAD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700 }}>LECTURES</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A' }}>{port.lectureLoadHours}h</div>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#065F46', fontWeight: 700 }}>PRACTICALS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>{port.practicalLoadHours}h</div>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700 }}>TUTORIALS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B45309' }}>{port.tutorialLoadHours}h</div>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>TOTAL LOAD</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B192C' }}>{port.totalWeeklyAcademicHours}h/wk</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SUBJECT ALLOCATIONS */}
              {profileActiveTab === 'COURSES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {port.assignedSubjects.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No subjects currently allocated to this faculty member.
                    </div>
                  ) : (
                    port.assignedSubjects.map((sub, sIdx) => (
                      <div key={sIdx} style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#0B192C' }}>{sub.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Code: <code>{sub.code}</code> • Semester {sub.semester} ({sub.division})</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Badge variant="navy">{sub.type}</Badge>
                          <Badge variant="active">{sub.weeklyHours} hrs/wk</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: STUDENTS / MENTEES */}
              {profileActiveTab === 'STUDENTS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {port.mentorStudentsList.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      No mentees assigned to this faculty member.
                    </div>
                  ) : (
                    port.mentorStudentsList.map((m, mIdx) => (
                      <div key={mIdx} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0B192C' }}>{m.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Enrollment: <code>{m.enrollmentNo}</code> • Sem {m.semester} ({m.division})</div>
                        </div>
                        <button 
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            const foundStudent = students.find(s => s.id === m.id || s.enrollmentNo === m.enrollmentNo);
                            if (foundStudent) setSelectedStudentForProfile(foundStudent);
                          }}
                        >
                          View Student Profile
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: COMMITTEES & ADMIN */}
              {profileActiveTab === 'ADMIN_WORK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>University Committees</h4>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Active statutory appointment across Board of Studies, IQAC, Examination Moderation, and Grievance Cells.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PERFORMANCE & AVAILABILITY */}
              {profileActiveTab === 'PERFORMANCE' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>Workforce Availability</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Badge variant={f.status === 'ACTIVE' ? 'active' : 'warning'}>{f.status}</Badge>
                      <span style={{ fontSize: '0.78rem', color: '#475569' }}>Available for On-Campus Academic Duties</span>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>Performance Assessment</h4>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Semester Student Feedback: <strong>4.6 / 5.0 (Excellent)</strong> • Course Syllabus Completion: <strong>94%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: DOCUMENTS */}
              {profileActiveTab === 'DOCUMENTS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['Ph.D. Degree Certificate', 'Appointment & Joining Order', 'Aadhaar Card / Identification', 'Experience Certificate'].map((docName, dIdx) => (
                    <div key={dIdx} style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#0B192C' }}>{docName}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Verified on Central Vault • Faculty ID: {f.employeeId || f.id}</div>
                      </div>
                      <Badge variant="active">VERIFIED</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 9: HISTORY & AUDIT */}
              {profileActiveTab === 'HISTORY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Portfolio Assignment: {f.designation}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{f.joiningDate || '2023-08-01'}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                      Action executed by Office of the Registrar / Board of Governors.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ─── MODAL: STAFF PROFILE DOSSIER ─── */}
      {selectedStaffFor360 && (() => {
        const e = selectedStaffFor360;
        const dept = departments.find(d => d.id === e.departmentId);
        const inst = institutes.find(i => i.id === e.instituteId);

        return (
          <Modal
            isOpen={Boolean(selectedStaffFor360)}
            onClose={() => setSelectedStaffFor360(null)}
            title={`Staff Dossier: ${e.name} (${e.employeeId || e.id})`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '600px' }}>
              <div style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#6D28D9'
                }}>
                  {e.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                      {e.name}
                    </h3>
                    <code style={{ fontWeight: 800, color: '#6D28D9' }}>{e.employeeId || e.id}</code>
                    <Badge variant="purple">{e.designation || 'Staff'}</Badge>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                    Department: <strong>{dept?.name || e.departmentName || 'Central Administrative Section'}</strong> • Institute: <strong>{inst?.name || e.instituteName}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                    Reports To: <strong>{e.reportingManagerName || 'Registrar Office'}</strong> • Email: <strong>{e.email}</strong> • Phone: <strong>{e.phone}</strong>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0B192C' }}>Assigned Administrative Responsibilities</h4>
                <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>Category: <strong>{e.employmentType || e.employeeType || 'Administrative Support'}</strong></div>
                  <div>Weekly Operational Schedule: <strong>40 hrs/wk (Full-Time Campus Support)</strong></div>
                  <div>Joining Date: <strong>{e.joiningDate || '2023-01-15'}</strong></div>
                  <div>Status: <Badge variant="active">ACTIVE</Badge></div>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ─── MODAL: STUDENT 360 PROFILE (WHEN CLICKED FROM MENTEE LIST) ─── */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          isOpen={true}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
    </div>
  );
};
