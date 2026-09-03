// ==============================================================================
// SWARRNIM UNIVERSITY ERP — GLOBAL STUDENT SEARCH & DOCUMENT VAULT
// ==============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentProfileAccessService, StudentIdentitySummary } from '../../services/studentProfileAccessService';
import { documentMasterService } from '../../services/documentMasterService';
import { StudentProfileModal, StudentProfileTabType } from '../../components/profile/StudentProfileModal';
import { Modal } from '../../components/common/Modal';
import { StudentRowActionMenu } from '../../components/common/StudentRowActionMenu';
import { Student, StudentDocument } from '../../types';
import { DocumentCategory, DocumentMasterItem, StudentAcademicDocumentItem } from '../../types/documentMaster';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { 
  Users, Search, Filter, GraduationCap, Building2, BookOpen, 
  Eye, ShieldCheck, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, 
  UserCheck, Award, FileText, Download, CheckCircle2, Clock, XCircle,
  LayoutGrid, List, Lock, FileCheck, ArrowRight, X, ExternalLink
} from 'lucide-react';

interface StudentDirectorySearchPageProps {
  initialSearchQuery?: string;
  initialRecordId?: string;
  initialStudentId?: string;
  initialTab?: StudentProfileTabType;
  initialDocId?: string;
}

export const StudentDirectorySearchPage: React.FC<StudentDirectorySearchPageProps> = ({
  initialSearchQuery = '',
  initialRecordId,
  initialStudentId,
  initialTab = 'OVERVIEW',
  initialDocId
}) => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [filterInstitute, setFilterInstitute] = useState<string>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStudentType, setFilterStudentType] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const limit = 12;

  // Selected Student Profile Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<StudentProfileTabType>(initialTab);
  const [activeDocId, setActiveDocId] = useState<string | undefined>(initialDocId);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dedicated Quick Document Vault Modal State
  const [vaultStudent, setVaultStudent] = useState<Student | null>(null);
  const [vaultStatusFilter, setVaultStatusFilter] = useState<'ALL' | 'UPLOADED' | 'PENDING' | 'NOT_UPLOADED'>('ALL');
  const [previewDoc, setPreviewDoc] = useState<{
    master: DocumentMasterItem;
    doc?: StudentAcademicDocumentItem;
    studentName: string;
    enrollmentNo: string;
  } | null>(null);

  // Deep link auto-open student profile
  useEffect(() => {
    const targetId = initialRecordId || initialStudentId;
    if (targetId && user && role) {
      const student = db.getStudents().find(s => s.id === targetId || s.enrollmentNo === targetId);
      if (student) {
        if (studentProfileAccessService.isUserAuthorizedForStudent(user, role, student)) {
          setSelectedStudent(student);
          if (initialTab) setActiveProfileTab(initialTab);
          if (initialDocId) setActiveDocId(initialDocId);
        }
      }
    }
  }, [initialRecordId, initialStudentId, initialTab, initialDocId, user, role]);

  // Master Data Lookups for Filters
  const institutes = useMemo(() => db.getInstitutes(), []);
  const departments = useMemo(() => {
    const all = db.getDepartments();
    if (filterInstitute !== 'ALL') {
      return all.filter(d => d.instituteId === filterInstitute);
    }
    return all;
  }, [filterInstitute]);
  const programs = useMemo(() => {
    const all = db.getPrograms();
    if (filterDepartment !== 'ALL') {
      return all.filter(p => p.departmentId === filterDepartment);
    }
    if (filterInstitute !== 'ALL') {
      return all.filter(p => p.instituteId === filterInstitute);
    }
    return all;
  }, [filterInstitute, filterDepartment]);
  const semesters = useMemo(() => db.getSemesters(), []);

  // Execute Server-Side Search via Central Authorized Service
  const [searchResults, setSearchResults] = useState<{
    records: StudentIdentitySummary[];
    total: number;
    page: number;
    totalPages: number;
  }>({ records: [], total: 0, page: 1, totalPages: 1 });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    if (isStudent || !user || !role) {
      setSearchResults({ records: [], total: 0, page: 1, totalPages: 1 });
      return;
    }

    setIsSearching(true);
    studentProfileAccessService
      .searchStudentsServer(
        user,
        role,
        searchQuery,
        {
          instituteId: filterInstitute,
          departmentId: filterDepartment,
          programId: filterProgram,
          semesterId: filterSemester,
          status: filterStatus,
          studentType: filterStudentType,
        },
        page,
        limit,
      )
      .then(res => {
        if (isCurrent) {
          setSearchResults(res);
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsSearching(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [user, role, isStudent, searchQuery, filterInstitute, filterDepartment, filterProgram, filterSemester, filterStatus, filterStudentType, page, limit, refreshKey]);

  // Total Students Scoped
  const totalScopedCount = useMemo(() => {
    if (!user || !role || isStudent) return 0;
    return db.getStudents().filter(s => studentProfileAccessService.isUserAuthorizedForStudent(user, role, s)).length;
  }, [user, role, isStudent, refreshKey]);

  // Open Profile Handler
  const handleOpenProfile = (studentSummary: StudentIdentitySummary | Student, targetTab: StudentProfileTabType = 'OVERVIEW') => {
    const fullStudent = db.getStudents().find(s => s.id === studentSummary.id);
    if (fullStudent) {
      setSelectedStudent(fullStudent);
      setActiveProfileTab(targetTab);
    }
  };

  // Open Direct Document Vault Modal Handler
  const handleOpenVault = (studentSummary: StudentIdentitySummary | Student) => {
    const fullStudent = db.getStudents().find(s => s.id === studentSummary.id);
    if (fullStudent) {
      setVaultStudent(fullStudent);
      setVaultStatusFilter('ALL');
    }
  };

  // Load applicable documents for the Vault student
  const vaultDocuments = useMemo(() => {
    if (!vaultStudent) return [];
    try {
      return documentMasterService.getApplicableDocumentsForStudent(vaultStudent);
    } catch {
      return [];
    }
  }, [vaultStudent, refreshKey]);

  // Filtered Vault documents
  const filteredVaultDocs = useMemo(() => {
    if (!vaultDocuments) return [];
    return vaultDocuments.filter(item => {
      if (vaultStatusFilter === 'UPLOADED') {
        return item.status === 'VERIFIED' || item.status === 'PENDING_VERIFICATION';
      }
      if (vaultStatusFilter === 'PENDING') {
        return item.status === 'PENDING_VERIFICATION';
      }
      if (vaultStatusFilter === 'NOT_UPLOADED') {
        return item.status === 'NOT_UPLOADED' || item.status === 'REUPLOAD_REQUIRED';
      }
      return true;
    });
  }, [vaultDocuments, vaultStatusFilter]);

  // Document Vault Counts
  const vaultCounts = useMemo(() => {
    const all = vaultDocuments.length;
    const uploaded = vaultDocuments.filter(d => d.status === 'VERIFIED' || d.status === 'PENDING_VERIFICATION').length;
    const pending = vaultDocuments.filter(d => d.status === 'PENDING_VERIFICATION').length;
    const notUploaded = vaultDocuments.filter(d => d.status === 'NOT_UPLOADED' || d.status === 'REUPLOAD_REQUIRED').length;
    return { all, uploaded, pending, notUploaded };
  }, [vaultDocuments]);

  // Secure Audited Document Download Handler
  const handleSecureDownload = (master: DocumentMasterItem, doc: StudentAcademicDocumentItem, studentName: string) => {
    if (!user || !role || !vaultStudent) return;
    try {
      // Record secure audit log
      db.logAudit(
        'DOWNLOAD',
        'STUDENT_DOCUMENTS',
        `Downloaded ${master.name} for student ${studentName} (${vaultStudent.enrollmentNo})`,
        user.name || user.username,
        role
      );

      const fileUrl = doc.fileUrl || 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1200&q=80';
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${vaultStudent.enrollmentNo}_${master.code}_${doc.fileName || 'document.pdf'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err?.message || 'Unauthorized download.');
    }
  };

  // Secure Audited Document Preview Handler
  const handleSecurePreview = (master: DocumentMasterItem, doc: StudentAcademicDocumentItem, studentName: string, enrollmentNo: string) => {
    if (!user || !role || !vaultStudent) return;
    try {
      // Record secure audit log
      db.logAudit(
        'VIEW',
        'STUDENT_DOCUMENTS',
        `Viewed ${master.name} for student ${studentName} (${enrollmentNo})`,
        user.name || user.username,
        role
      );

      setPreviewDoc({ master, doc, studentName, enrollmentNo });
    } catch (err: any) {
      alert(err?.message || 'Unauthorized access to document preview.');
    }
  };

  // RESTRICT STUDENT ACCESS COMPLETELY
  if (isStudent) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
        <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Students are strictly prohibited from using the global student search and lookup directory. 
          Please visit <strong>My Profile</strong> or <strong>Student Documents</strong> to view your personal records.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Users size={26} color="var(--brand-orange)" /> Student Search
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
            Search and access authorized student information.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-hover)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: viewMode === 'TABLE' ? 'var(--brand-navy)' : 'transparent',
                color: viewMode === 'TABLE' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={15} /> Table View
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: viewMode === 'GRID' ? 'var(--brand-navy)' : 'transparent',
                color: viewMode === 'GRID' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={15} /> Card View
            </button>
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setRefreshKey(k => k + 1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4">
        <StatCard
          icon={Users}
          title="Authorized Students"
          value={totalScopedCount}
          subtitle="In your role & department scope"
          colorScheme="blue"
        />
        <StatCard
          icon={Search}
          title="Search Matches"
          value={searchResults.total}
          subtitle={searchQuery ? `Matching "${searchQuery}"` : 'All authorized'}
          colorScheme="orange"
        />
        <StatCard
          icon={Building2}
          title="Institute Scope"
          value={user?.instituteId ? 'SCOPED' : 'ALL INSTITUTES'}
          subtitle={user?.instituteId || 'University-Wide Access'}
          colorScheme="gold"
        />
        <StatCard
          icon={ShieldCheck}
          title="Document Vault"
          value="RBAC SECURED"
          subtitle="Audited access logging enabled"
          colorScheme="green"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Search Input */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={20} 
                color="var(--brand-navy)" 
                style={{ position: 'absolute', left: '1.125rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by: Student Name, Enrollment Number, University ID, Email, Mobile Number..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{ 
                  paddingLeft: '3rem', 
                  fontSize: '0.9375rem', 
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setPage(1); }}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setRefreshKey(k => k + 1)}
              style={{
                height: '48px',
                padding: '0 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexShrink: 0
              }}
            >
              <Search size={16} /> Search
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Institute</label>
              <select 
                className="form-control" 
                value={filterInstitute} 
                onChange={e => {
                  setFilterInstitute(e.target.value);
                  setFilterDepartment('ALL');
                  setFilterProgram('ALL');
                  setPage(1);
                }}
                style={{ fontSize: '0.8125rem', height: '36px' }}
              >
                <option value="ALL">All Institutes</option>
                {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Department</label>
              <select 
                className="form-control" 
                value={filterDepartment} 
                onChange={e => {
                  setFilterDepartment(e.target.value);
                  setFilterProgram('ALL');
                  setPage(1);
                }}
                style={{ fontSize: '0.8125rem', height: '36px' }}
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Program</label>
              <select 
                className="form-control" 
                value={filterProgram} 
                onChange={e => {
                  setFilterProgram(e.target.value);
                  setPage(1);
                }}
                style={{ fontSize: '0.8125rem', height: '36px' }}
              >
                <option value="ALL">All Programs</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Semester</label>
              <select 
                className="form-control" 
                value={filterSemester} 
                onChange={e => {
                  setFilterSemester(e.target.value);
                  setPage(1);
                }}
                style={{ fontSize: '0.8125rem', height: '36px' }}
              >
                <option value="ALL">All Semesters</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.code} (Sem {s.number})</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Status</label>
              <select 
                className="form-control" 
                value={filterStatus} 
                onChange={e => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                style={{ fontSize: '0.8125rem', height: '36px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="GRADUATED">Graduated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {searchResults.total > 0 ? (
            <span>Showing <strong>{searchResults.records.length}</strong> of <strong>{searchResults.total}</strong> matching students</span>
          ) : (
            <span>Search for a student to view their authorized records.</span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {searchResults.records.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'var(--brand-orange-10)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1rem auto' 
          }}>
            <Search size={30} color="var(--brand-orange)" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            {searchQuery ? 'No Students Found' : 'Search for a Student'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0.35rem auto 0 auto', lineHeight: 1.5 }}>
            {searchQuery ? (
              <span>No student records match "<strong>{searchQuery}</strong>" within your authorized permissions. Please check your spelling or clear filters.</span>
            ) : (
              <span>Enter a student's name (e.g. <em>"Demo Student"</em>) or enrollment number (e.g. <em>"230101001"</em>) in the search field above to retrieve records.</span>
            )}
          </p>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* TABLE VIEW */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem' }}>Student Name</th>
                  <th>Enrollment No.</th>
                  <th>Program</th>
                  <th>Semester</th>
                  <th>Department / Institute</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.records.map(student => (
                  <tr key={student.id} style={{ transition: 'background-color 0.15s ease' }}>
                    {/* Student Name & Avatar */}
                    <td style={{ paddingLeft: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'}
                          alt={student.name}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid var(--brand-orange)',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.9375rem' }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Enrollment No */}
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: 'var(--brand-orange)', 
                        background: 'rgba(245, 130, 32, 0.08)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {student.enrollmentNo}
                      </span>
                    </td>

                    {/* Program */}
                    <td style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {student.programName}
                    </td>

                    {/* Semester */}
                    <td>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.15rem 0.5rem',
                        background: 'var(--brand-navy-10)',
                        color: 'var(--brand-navy)',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        fontWeight: 700
                      }}>
                        Sem {student.semesterNumber}
                      </span>
                    </td>

                    {/* Department / Institute */}
                    <td style={{ fontSize: '0.8125rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.departmentName || 'General'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{student.instituteName}</div>
                    </td>

                    {/* Status */}
                    <td>
                      {student.status === 'ACTIVE' ? (
                        <Badge variant="active">ACTIVE</Badge>
                      ) : (student.status as string) === 'WARNING' ? (
                        <Badge variant="warning">WARNING</Badge>
                      ) : (
                        <Badge variant="danger">{student.status || 'INACTIVE'}</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                      <StudentRowActionMenu
                        student={student}
                        statusLevel={student.status === 'ACTIVE' ? 'good' : (student.status as string) === 'WARNING' ? 'warning' : 'critical'}
                        onViewProfile={() => handleOpenProfile(student, 'OVERVIEW')}
                        onViewDocuments={() => handleOpenVault(student)}
                        onViewAcademic={() => handleOpenProfile(student, 'ACADEMIC')}
                        onViewAttendance={() => handleOpenProfile(student, 'ATTENDANCE')}
                        onViewExamination={() => handleOpenProfile(student, 'EXAMINATIONS')}
                        onViewRequests={() => handleOpenProfile(student, 'REQUESTS')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {searchResults.records.map(student => (
            <div 
              key={student.id} 
              className="card" 
              style={{ 
                padding: '1.25rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Header: Photo + Name + Badges */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <img
                  src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'}
                  alt={student.name}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--brand-orange)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {student.name}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--brand-orange)', fontWeight: 700, marginTop: '0.15rem', fontFamily: 'monospace' }}>
                    {student.enrollmentNo}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <Badge variant={student.status === 'ACTIVE' ? 'active' : 'inactive'}>{student.status}</Badge>
                    <Badge variant="gold">{student.studentType}</Badge>
                  </div>
                </div>
              </div>

              {/* Academic Placement Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', background: 'var(--bg-surface-hover)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Program:</span> <strong>{student.programName}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Department:</span> <strong>{student.departmentName || 'General'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Institute:</span> <strong>{student.instituteName}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Semester:</span> <strong>Semester {student.semesterNumber}</strong> ({student.divisionName})</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenProfile(student, 'OVERVIEW')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Eye size={14} /> View Profile
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenVault(student)}
                  title="Open Document Vault"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)' }}
                >
                  <FileText size={14} /> Documents
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {searchResults.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Page {searchResults.page} of {searchResults.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= searchResults.totalPages}
            onClick={() => setPage(p => Math.min(searchResults.totalPages, p + 1))}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECT STUDENT DOCUMENT VAULT MODAL */}
      {/* ========================================================================= */}
      {vaultStudent && (
        <Modal
          isOpen={Boolean(vaultStudent)}
          onClose={() => setVaultStudent(null)}
          title="STUDENT DOCUMENT VAULT"
          maxWidth="900px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Student Header Info Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #12366B 0%, #0d2850 100%)', 
              color: '#FFFFFF', 
              padding: '1.25rem 1.5rem', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(18, 54, 107, 0.15)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-orange)', fontWeight: 800 }}>
                  Official Student Identity
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0', color: '#FFFFFF' }}>
                  {vaultStudent.name}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#E2E8F0', marginTop: '0.35rem' }}>
                  <div>Enrollment No: <strong style={{ color: 'var(--brand-orange)' }}>{vaultStudent.enrollmentNo}</strong></div>
                  <div>•</div>
                  <div>Program: <strong>{db.getProgramById(vaultStudent.programId)?.name || vaultStudent.programId}</strong></div>
                  <div>•</div>
                  <div>Semester: <strong>{db.getSemesterById(vaultStudent.semesterId)?.number || vaultStudent.semesterId}</strong></div>
                  <div>•</div>
                  <div>Department: <strong>{db.getDepartmentById(vaultStudent.departmentId || '')?.name || 'Computer Engineering'}</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const st = vaultStudent;
                    setVaultStudent(null);
                    handleOpenProfile(st, 'DOCUMENTS');
                  }}
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  Full Profile Details
                </button>
              </div>
            </div>

            {/* Document Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setVaultStatusFilter('ALL')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: vaultStatusFilter === 'ALL' ? 'var(--brand-navy)' : 'var(--bg-surface-hover)',
                    color: vaultStatusFilter === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  All ({vaultCounts.all})
                </button>
                <button
                  onClick={() => setVaultStatusFilter('UPLOADED')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: vaultStatusFilter === 'UPLOADED' ? '#10B981' : 'var(--bg-surface-hover)',
                    color: vaultStatusFilter === 'UPLOADED' ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  Uploaded ({vaultCounts.uploaded})
                </button>
                <button
                  onClick={() => setVaultStatusFilter('PENDING')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: vaultStatusFilter === 'PENDING' ? '#F59E0B' : 'var(--bg-surface-hover)',
                    color: vaultStatusFilter === 'PENDING' ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  Pending ({vaultCounts.pending})
                </button>
                <button
                  onClick={() => setVaultStatusFilter('NOT_UPLOADED')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: vaultStatusFilter === 'NOT_UPLOADED' ? '#6B7280' : 'var(--bg-surface-hover)',
                    color: vaultStatusFilter === 'NOT_UPLOADED' ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  Not Uploaded ({vaultCounts.notUploaded})
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Viewing authorized university vault documents
              </div>
            </div>

            {/* Document Vault Table */}
            <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Required</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVaultDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No documents found matching the "{vaultStatusFilter}" filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVaultDocs.map(item => {
                      const isUploaded = Boolean(item.uploadedDoc);
                      const isVerified = item.status === 'VERIFIED';
                      const isPending = item.status === 'PENDING_VERIFICATION';

                      return (
                        <tr key={item.masterDoc.id}>
                          {/* Document Name */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <FileText size={18} color="var(--brand-navy)" />
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>
                                  {item.masterDoc.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Code: <span style={{ fontFamily: 'monospace' }}>{item.masterDoc.code}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <span style={{ textTransform: 'capitalize' }}>
                              {item.masterDoc.category.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </td>

                          {/* Requirement */}
                          <td>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: item.masterDoc.required === 'REQUIRED' ? '#DC2626' : 'var(--text-muted)' 
                            }}>
                              {item.masterDoc.required === 'REQUIRED' ? 'Mandatory' : 'Optional'}
                            </span>
                          </td>

                          {/* Status */}
                          <td>
                            {isVerified ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.3rem', 
                                padding: '0.2rem 0.5rem', 
                                background: '#D1FAE5', 
                                color: '#065F46', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700 
                              }}>
                                <CheckCircle2 size={12} /> Uploaded &amp; Verified
                              </span>
                            ) : isPending ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.3rem', 
                                padding: '0.2rem 0.5rem', 
                                background: '#FEF3C7', 
                                color: '#92400E', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700 
                              }}>
                                <Clock size={12} /> Pending Verification
                              </span>
                            ) : isUploaded ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.3rem', 
                                padding: '0.2rem 0.5rem', 
                                background: '#E0F2FE', 
                                color: '#0369A1', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700 
                              }}>
                                Uploaded
                              </span>
                            ) : (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.3rem', 
                                padding: '0.2rem 0.5rem', 
                                background: 'var(--bg-surface-hover)', 
                                color: 'var(--text-muted)', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600 
                              }}>
                                Not Uploaded
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td style={{ textAlign: 'right' }}>
                            {isUploaded && item.uploadedDoc ? (
                              <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleSecurePreview(item.masterDoc, item.uploadedDoc!, vaultStudent.name, vaultStudent.enrollmentNo)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  <Eye size={12} /> View
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleSecureDownload(item.masterDoc, item.uploadedDoc!, vaultStudent.name)}
                                  title="Download authorized document"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  <Download size={12} /> Download
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setVaultStudent(null)}>
                Close Vault
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* SECURE AUTHENTICATED DOCUMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`DOCUMENT PREVIEW: ${previewDoc.master.name}`}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.9375rem' }}>
                  {previewDoc.studentName} ({previewDoc.enrollmentNo})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Document: {previewDoc.master.name} • Code: {previewDoc.master.code}
                </div>
              </div>

              {previewDoc.doc && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSecureDownload(previewDoc.master, previewDoc.doc!, previewDoc.studentName)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={13} /> Download File
                </button>
              )}
            </div>

            {/* Document Viewer Frame */}
            <div style={{ 
              width: '100%', 
              height: '480px', 
              background: '#1E293B', 
              borderRadius: 'var(--radius-sm)', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {previewDoc.doc?.fileUrl?.endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.doc.fileUrl}
                  title={previewDoc.master.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <img
                  src={previewDoc.doc?.fileUrl || 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1200&q=80'}
                  alt={previewDoc.master.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>🔒 Authenticated Document Preview • Logged to Security Audit Log</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* AUTHORIZED FULL STUDENT PROFILE CENTRAL GATEWAY */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <StudentProfileModal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
          initialTab={activeProfileTab}
          initialDocId={activeDocId}
        />
      )}
    </div>
  );
};
