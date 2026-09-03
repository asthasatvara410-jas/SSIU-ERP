import React, { useState, useMemo, useRef } from 'react';
import { Student } from '../../types';
import { db } from '../../services/db';
import { documentMasterService } from '../../services/documentMasterService';
import { Badge } from '../common/Badge';
import {
  Search, Filter, Download, Upload, RefreshCw, SlidersHorizontal,
  CheckCircle2, AlertTriangle, Clock, FileText, CheckSquare,
  ChevronLeft, ChevronRight, FolderCheck, X, FileSpreadsheet, Eye,
  CheckCheck, AlertCircle
} from 'lucide-react';

interface StudentDocumentsVerificationGridProps {
  students: Student[];
  onOpenVault: (student: Student) => void;
  currentUser: any;
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width: string;
  align?: 'left' | 'center' | 'right';
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, width: '55px', align: 'center' },
  { key: 'sr', label: 'Sr. No.', visible: true, width: '65px', align: 'center' },
  { key: 'studentName', label: 'Student Name', visible: true, width: '180px', align: 'left' },
  { key: 'enrollmentNo', label: 'Enrollment No.', visible: true, width: '130px', align: 'center' },
  { key: 'program', label: 'Program', visible: true, width: '140px', align: 'left' },
  { key: 'department', label: 'Department', visible: true, width: '150px', align: 'left' },
  { key: 'academicYear', label: 'Academic Year', visible: true, width: '110px', align: 'center' },
  { key: 'semester', label: 'Semester', visible: true, width: '85px', align: 'center' },
  { key: 'division', label: 'Division', visible: true, width: '85px', align: 'center' },
  { key: 'abcIdStatus', label: 'ABC ID Status', visible: true, width: '130px', align: 'center' },
  { key: 'totalDocs', label: 'Total Documents', visible: true, width: '120px', align: 'center' },
  { key: 'verified', label: 'Verified', visible: true, width: '85px', align: 'center' },
  { key: 'pending', label: 'Pending', visible: true, width: '85px', align: 'center' },
  { key: 'missing', label: 'Missing', visible: true, width: '85px', align: 'center' },
  { key: 'overallStatus', label: 'Overall Status', visible: true, width: '150px', align: 'center' },
  { key: 'lastUpdated', label: 'Last Updated', visible: true, width: '110px', align: 'center' },
  { key: 'action', label: 'Action', visible: true, width: '150px', align: 'center' }
];

export const StudentDocumentsVerificationGrid: React.FC<StudentDocumentsVerificationGridProps> = ({
  students,
  onOpenVault,
  currentUser
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterDivision, setFilterDivision] = useState('ALL');
  const [filterAbcIdStatus, setFilterAbcIdStatus] = useState('ALL');
  const [filterDocumentStatus, setFilterDocumentStatus] = useState('ALL');
  const [filterVerificationStatus, setFilterVerificationStatus] = useState('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<string>('sr');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    errors: Array<{ row: number; enrollment: string; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Central Lookups
  const allInstitutes = useMemo(() => db.getInstitutes ? db.getInstitutes() : [], []);
  const allDepartments = useMemo(() => db.getDepartments ? db.getDepartments() : [], []);
  const allPrograms = useMemo(() => db.getPrograms ? db.getPrograms() : [], []);
  const allSemesters = useMemo(() => db.getSemesters ? db.getSemesters() : [], []);
  const allDivisions = useMemo(() => db.getDivisions ? db.getDivisions() : [], []);

  // Compute metrics for each student
  const studentMetricsList = useMemo(() => {
    return students.map(student => {
      const metrics = documentMasterService.getStudentDocumentMetrics(student);
      const prog = db.getProgramById(student.programId);
      const dept = db.getDepartmentById(student.departmentId);
      const sem = db.getSemesterById(student.semesterId);
      const div = db.getDivisionById(student.divisionId);
      const inst = db.getInstituteById(student.instituteId);

      return {
        student,
        metrics,
        programName: prog?.name || prog?.code || 'B.Tech CSE',
        departmentName: dept?.name || 'Computer Engineering',
        departmentId: student.departmentId,
        instituteName: inst?.name || 'Swarrnim SSCIT',
        instituteId: student.instituteId,
        semesterNumber: sem?.number || 4,
        divisionName: div?.name || 'Division A'
      };
    });
  }, [students, refreshKey]);

  // Overall Top KPIs Calculation
  const topKPIs = useMemo(() => {
    let totalDocs = 0;
    let verifiedDocs = 0;
    let pendingDocs = 0;
    let missingDocs = 0;
    let abcPending = 0;

    studentMetricsList.forEach(item => {
      totalDocs += item.metrics.totalDocs;
      verifiedDocs += item.metrics.verifiedDocs;
      pendingDocs += item.metrics.pendingDocs;
      missingDocs += item.metrics.missingDocs;
      if (item.student.abcIdStatus === 'PENDING_VERIFICATION' || !item.student.abcId || item.student.abcIdStatus === 'NOT_SUBMITTED') {
        abcPending++;
      }
    });

    return {
      totalStudents: studentMetricsList.length,
      totalDocuments: totalDocs,
      verified: verifiedDocs,
      pendingVerification: pendingDocs,
      missingDocuments: missingDocs,
      abcIdPending: abcPending
    };
  }, [studentMetricsList]);

  // Filtered Dataset
  const filteredDataset = useMemo(() => {
    return studentMetricsList.filter(item => {
      const st = item.student;
      const m = item.metrics;

      // Institute filter
      if (filterInstitute !== 'ALL' && item.instituteId !== filterInstitute) return false;

      // Department filter
      if (filterDepartment !== 'ALL' && item.departmentId !== filterDepartment) return false;

      // Program filter
      if (filterProgram !== 'ALL' && st.programId !== filterProgram) return false;

      // Semester filter
      if (filterSemester !== 'ALL' && String(item.semesterNumber) !== filterSemester) return false;

      // Division filter
      if (filterDivision !== 'ALL' && item.divisionName !== filterDivision) return false;

      // ABC ID Status filter
      if (filterAbcIdStatus !== 'ALL') {
        const status = st.abcIdStatus || 'NOT_SUBMITTED';
        if (filterAbcIdStatus === 'VERIFIED' && status !== 'VERIFIED') return false;
        if (filterAbcIdStatus === 'PENDING' && status !== 'PENDING_VERIFICATION') return false;
        if (filterAbcIdStatus === 'NOT_SUBMITTED' && status !== 'NOT_SUBMITTED') return false;
      }

      // Document Status filter
      if (filterDocumentStatus !== 'ALL' && m.overallStatus !== filterDocumentStatus) return false;

      // Verification Status filter
      if (filterVerificationStatus === 'VERIFIED' && m.verifiedDocs === 0) return false;
      if (filterVerificationStatus === 'PENDING' && m.pendingDocs === 0) return false;
      if (filterVerificationStatus === 'REJECTED' && m.missingDocs === 0) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchEnroll = st.enrollmentNo.toLowerCase().includes(q);
        const matchEmail = st.email ? st.email.toLowerCase().includes(q) : false;
        const matchProg = item.programName.toLowerCase().includes(q);
        if (!matchName && !matchEnroll && !matchEmail && !matchProg) return false;
      }

      return true;
    });
  }, [studentMetricsList, filterInstitute, filterDepartment, filterProgram, filterSemester, filterDivision, filterAbcIdStatus, filterDocumentStatus, filterVerificationStatus, searchQuery]);

  // Sorted Dataset
  const sortedDataset = useMemo(() => {
    return [...filteredDataset].sort((a, b) => {
      let valA: any = a.student.name;
      let valB: any = b.student.name;

      if (sortField === 'studentName') {
        valA = a.student.name;
        valB = b.student.name;
      } else if (sortField === 'enrollmentNo') {
        valA = a.student.enrollmentNo;
        valB = b.student.enrollmentNo;
      } else if (sortField === 'program') {
        valA = a.programName;
        valB = b.programName;
      } else if (sortField === 'totalDocs') {
        valA = a.metrics.totalDocs;
        valB = b.metrics.totalDocs;
      } else if (sortField === 'verified') {
        valA = a.metrics.verifiedDocs;
        valB = b.metrics.verifiedDocs;
      } else if (sortField === 'pending') {
        valA = a.metrics.pendingDocs;
        valB = b.metrics.pendingDocs;
      } else if (sortField === 'missing') {
        valA = a.metrics.missingDocs;
        valB = b.metrics.missingDocs;
      } else if (sortField === 'lastUpdated') {
        valA = a.metrics.lastUpdated;
        valB = b.metrics.lastUpdated;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDataset, sortField, sortDirection]);

  // Paginated Dataset
  const totalPages = Math.ceil(sortedDataset.length / pageSize) || 1;
  const paginatedDataset = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDataset.slice(start, start + pageSize);
  }, [sortedDataset, currentPage, pageSize]);

  // Selection handlers
  const isAllSelected = paginatedDataset.length > 0 && paginatedDataset.every(item => selectedStudentIds.includes(item.student.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !paginatedDataset.some(item => item.student.id === id)));
    } else {
      const pageIds = paginatedDataset.map(item => item.student.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkVerify = () => {
    if (selectedStudentIds.length === 0) return;
    const res = documentMasterService.bulkVerifyStudentDocuments(selectedStudentIds, currentUser);
    alert(`Successfully verified ${res.verifiedCount} pending document(s) for ${selectedStudentIds.length} student(s).`);
    setSelectedStudentIds([]);
    setRefreshKey(k => k + 1);
  };

  const handleBulkRequestMissing = () => {
    if (selectedStudentIds.length === 0) return;
    const res = documentMasterService.bulkRequestMissingDocuments(selectedStudentIds, currentUser);
    alert(`Notifications dispatched to ${res.requestedCount} student(s) regarding pending documents.`);
    setSelectedStudentIds([]);
  };

  const handleExportExcel = async () => {
    const exportStudents = filteredDataset.map(d => d.student);
    await documentMasterService.exportStudentDocumentRegisterToExcel(exportStudents, filteredDataset);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterInstitute('ALL');
    setFilterDepartment('ALL');
    setFilterProgram('ALL');
    setFilterAcademicYear('ALL');
    setFilterSemester('ALL');
    setFilterDivision('ALL');
    setFilterAbcIdStatus('ALL');
    setFilterDocumentStatus('ALL');
    setFilterVerificationStatus('ALL');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (key: string) => {
    setColumns(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  // Import handler
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    const result = await documentMasterService.parseAndImportStudentDocumentsExcel(importFile);
    setImportResult(result);
    setImporting(false);
    if (result.success || result.importedCount > 0) {
      setRefreshKey(k => k + 1);
    }
  };

  const getAbcBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <Badge variant="success">VERIFIED</Badge>;
      case 'PENDING_VERIFICATION': return <Badge variant="warning">PENDING</Badge>;
      default: return <Badge variant="navy">NOT SUBMITTED</Badge>;
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE': return <Badge variant="success">COMPLETE</Badge>;
      case 'PARTIALLY_COMPLETE': return <Badge variant="orange">PARTIALLY COMPLETE</Badge>;
      case 'MISSING_DOCUMENTS': return <Badge variant="danger">MISSING DOCUMENTS</Badge>;
      default: return <Badge variant="navy">NOT SUBMITTED</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* ─── SECTION ACTION TOOLBAR ─── */}
      <div 
        className="card" 
        style={{ 
          padding: '0.85rem 1.25rem', 
          background: '#FFFFFF', 
          borderRadius: '8px', 
          border: '1px solid #CBD5E1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderCheck size={20} color="#001F3F" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#001F3F' }}>
            Student Documents Verification Register
          </h3>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => documentMasterService.downloadStudentDocumentTemplate()}
            style={{ fontSize: '0.78125rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={13} /> Download Excel Template
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setImportResult(null);
              setImportFile(null);
              setIsImportModalOpen(true);
            }}
            style={{ fontSize: '0.78125rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Upload size={13} /> Import Excel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportExcel}
            style={{ fontSize: '0.78125rem', padding: '0.4rem 0.85rem', background: '#001F3F', borderColor: '#001F3F', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <FileSpreadsheet size={13} /> Export Excel
          </button>

          {/* Columns Visibility Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowColumnDropdown(p => !p)}
              style={{ fontSize: '0.78125rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <SlidersHorizontal size={13} /> Columns
            </button>

            {showColumnDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  padding: '0.5rem',
                  minWidth: '200px',
                  maxHeight: '280px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#001F3F', marginBottom: '0.4rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.25rem' }}>
                  Toggle Visible Columns
                </div>
                {columns.map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '2px 0', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={c.visible}
                      onChange={() => toggleColumnVisibility(c.key)}
                      disabled={c.key === 'select' || c.key === 'studentName'}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
            style={{ fontSize: '0.78125rem', padding: '0.4rem 0.8rem' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ─── 6 COMPACT DYNAMIC TOP DOCUMENT KPIS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
        {[
          { label: 'Total Students', val: topKPIs.totalStudents, bg: '#001F3F', color: '#FFFFFF', icon: FileText },
          { label: 'Total Documents', val: topKPIs.totalDocuments, bg: '#F8FAFC', color: '#0F2C59', icon: FolderCheck },
          { label: 'Verified', val: topKPIs.verified, bg: '#ECFDF5', color: '#065F46', icon: CheckCircle2 },
          { label: 'Pending Verification', val: topKPIs.pendingVerification, bg: '#FFFBEB', color: '#B45309', icon: Clock },
          { label: 'Missing Documents', val: topKPIs.missingDocuments, bg: '#FEF2F2', color: '#991B1B', icon: AlertTriangle },
          { label: 'ABC ID Pending', val: topKPIs.abcIdPending, bg: '#EFF6FF', color: '#1E40AF', icon: AlertCircle }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: '0.75rem 1rem',
                background: kpi.bg,
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: kpi.bg === '#001F3F' ? 'rgba(255,255,255,0.8)' : '#64748B', textTransform: 'uppercase' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: kpi.color, marginTop: '2px' }}>
                  {kpi.val}
                </div>
              </div>
              <Icon size={18} color={kpi.bg === '#001F3F' ? '#F37023' : kpi.color} />
            </div>
          );
        })}
      </div>

      {/* ─── FILTER BAR ─── */}
      <div 
        className="card" 
        style={{ 
          padding: '0.85rem 1.25rem', 
          background: '#FFFFFF', 
          borderRadius: '8px', 
          border: '1px solid #CBD5E1' 
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Search Student</label>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <input
                type="text"
                placeholder="Name, Enrollment, Email, Program..."
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

          {/* Department */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Department</label>
            <select
              className="form-control"
              value={filterDepartment}
              onChange={e => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
              style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value="ALL">All Departments</option>
              {allDepartments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Semester</label>
            <select
              className="form-control"
              value={filterSemester}
              onChange={e => { setFilterSemester(e.target.value); setCurrentPage(1); }}
              style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* ABC ID Status */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ABC ID Status</label>
            <select
              className="form-control"
              value={filterAbcIdStatus}
              onChange={e => { setFilterAbcIdStatus(e.target.value); setCurrentPage(1); }}
              style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value="ALL">All ABC Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>

          {/* Document Status */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Document Status</label>
            <select
              className="form-control"
              value={filterDocumentStatus}
              onChange={e => { setFilterDocumentStatus(e.target.value); setCurrentPage(1); }}
              style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETE">Complete</option>
              <option value="PARTIALLY_COMPLETE">Partially Complete</option>
              <option value="MISSING_DOCUMENTS">Missing Documents</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>

          {/* Rows Per Page */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Rows</label>
            <select
              className="form-control"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── BULK ACTIONS TOOLBAR (WHEN STUDENTS ARE SELECTED) ─── */}
      {selectedStudentIds.length > 0 && (
        <div 
          style={{ 
            padding: '0.75rem 1.25rem', 
            background: '#001F3F', 
            color: '#FFFFFF', 
            borderRadius: '8px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,31,63,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.84rem' }}>
            <CheckCheck size={18} color="#F37023" />
            <span>{selectedStudentIds.length} Student(s) Selected</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleBulkVerify}
              style={{ background: '#059669', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.78125rem', padding: '0.35rem 0.75rem' }}
            >
              ✓ Bulk Verify Pending
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={handleBulkRequestMissing}
              style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.78125rem', padding: '0.35rem 0.75rem' }}
            >
              Request Missing Documents
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setSelectedStudentIds([])}
              style={{ fontSize: '0.78125rem', padding: '0.35rem 0.75rem' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ─── 17-COLUMN EXCEL-STYLE DENSE DATA GRID ─── */}
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
          <table style={{ width: '100%', minWidth: '1750px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#FFFFFF' }}>
              <tr>
                {columns.filter(c => c.visible).map(col => {
                  if (col.key === 'select') {
                    return (
                      <th
                        key={col.key}
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'center',
                          width: col.width,
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                    );
                  }
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.key !== 'action' && handleSort(col.key)}
                      style={{
                        padding: '0.75rem 0.6rem',
                        textAlign: col.align || 'left',
                        width: col.width,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.02em',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: col.key !== 'action' ? 'pointer' : 'default',
                        userSelect: 'none'
                      }}
                    >
                      {col.label}
                      {sortField === col.key && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {paginatedDataset.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length} style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
                    <FolderCheck size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontWeight: 600 }}>No mentee student document records found matching filters.</div>
                  </td>
                </tr>
              ) : (
                paginatedDataset.map((row, idx) => {
                  const st = row.student;
                  const m = row.metrics;
                  const isSelected = selectedStudentIds.includes(st.id);
                  const absoluteIndex = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={st.id}
                      style={{
                        background: isSelected ? 'rgba(243, 112, 35, 0.08)' : (idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF'),
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      {columns.find(c => c.key === 'select')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(st.id)}
                          />
                        </td>
                      )}

                      {columns.find(c => c.key === 'sr')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                          {absoluteIndex}
                        </td>
                      )}

                      {columns.find(c => c.key === 'studentName')?.visible && (
                        <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>
                          {st.name}
                        </td>
                      )}

                      {columns.find(c => c.key === 'enrollmentNo')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          <code>{st.enrollmentNo}</code>
                        </td>
                      )}

                      {columns.find(c => c.key === 'program')?.visible && (
                        <td style={{ padding: '0.65rem' }}>
                          {row.programName}
                        </td>
                      )}

                      {columns.find(c => c.key === 'department')?.visible && (
                        <td style={{ padding: '0.65rem' }}>
                          {row.departmentName}
                        </td>
                      )}

                      {columns.find(c => c.key === 'academicYear')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          2026-2027
                        </td>
                      )}

                      {columns.find(c => c.key === 'semester')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          Sem {row.semesterNumber}
                        </td>
                      )}

                      {columns.find(c => c.key === 'division')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          {row.divisionName}
                        </td>
                      )}

                      {columns.find(c => c.key === 'abcIdStatus')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          {getAbcBadge(st.abcIdStatus || 'NOT_SUBMITTED')}
                        </td>
                      )}

                      {columns.find(c => c.key === 'totalDocs')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: '#001F3F' }}>
                          {m.totalDocs}
                        </td>
                      )}

                      {columns.find(c => c.key === 'verified')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center', color: '#059669', fontWeight: 700 }}>
                          {m.verifiedDocs}
                        </td>
                      )}

                      {columns.find(c => c.key === 'pending')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center', color: '#D97706', fontWeight: 700 }}>
                          {m.pendingDocs}
                        </td>
                      )}

                      {columns.find(c => c.key === 'missing')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center', color: '#DC2626', fontWeight: 700 }}>
                          {m.missingDocs}
                        </td>
                      )}

                      {columns.find(c => c.key === 'overallStatus')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          {getOverallStatusBadge(m.overallStatus)}
                        </td>
                      )}

                      {columns.find(c => c.key === 'lastUpdated')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center', color: '#64748B' }}>
                          {m.lastUpdated}
                        </td>
                      )}

                      {columns.find(c => c.key === 'action')?.visible && (
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onOpenVault(st)}
                            style={{
                              padding: '0.3rem 0.75rem',
                              fontSize: '0.75rem',
                              background: '#001F3F',
                              borderColor: '#001F3F',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FolderCheck size={13} /> Open Vault
                          </button>
                        </td>
                      )}
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredDataset.length)} of {filteredDataset.length} students
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

      {/* ─── IMPORT EXCEL MODAL ─── */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              background: '#FFFFFF',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #001F3F 0%, #0F2C59 100%)',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={20} color="#F37023" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Import Student Documents Register (.xlsx)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem', color: '#475569' }}>
                Upload filled <code>.xlsx</code> document verification template. The engine validates student existence by Enrollment Number in Central Student Master.
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                  required
                />
              </div>

              {importResult && (
                <div style={{ padding: '0.85rem', borderRadius: '6px', border: importResult.failedCount > 0 ? '1px solid #EF4444' : '1px solid #10B981', background: importResult.failedCount > 0 ? '#FEF2F2' : '#ECFDF5' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: importResult.failedCount > 0 ? '#991B1B' : '#065F46' }}>
                    {importResult.importedCount} rows imported successfully. {importResult.failedCount} rows failed validation.
                  </div>
                  {importResult.errors.length > 0 && (
                    <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', fontSize: '0.75rem', color: '#B91C1C' }}>
                      {importResult.errors.map((err, i) => (
                        <div key={i}>• Row {err.row} (<code>{err.enrollment}</code>): {err.error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsImportModalOpen(false)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={importing || !importFile}
                  style={{ fontSize: '0.8125rem', background: '#001F3F', borderColor: '#001F3F' }}
                >
                  {importing ? 'Processing Import...' : 'Import Documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
