import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  studentOnboardingService, 
  OnboardingStatistics, 
  OnboardStudentResult,
  OnboardingHistoryRecord 
} from '../../services/studentOnboardingService';
import { AdmissionApplication, FeePaymentTransaction } from '../../types';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { StudentOnboardingModal } from './StudentOnboardingModal';
import { StudentApplicantDetailModal } from './StudentApplicantDetailModal';
import { StudentOnboardingFormModal } from './StudentOnboardingFormModal';
import { AdmissionFeePaymentModal } from './AdmissionFeePaymentModal';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../receipt/receiptTypes';
import { 
  Users, UserPlus, CheckCircle2, AlertCircle, Clock, 
  FileText, IndianRupee, RotateCcw, Search, Download, 
  Eye, Check, XCircle, ShieldCheck, Filter, AlertTriangle, Layers, History, CreditCard, Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const StudentOnboardingTab: React.FC = () => {
  const { user, role } = useAuth();

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();

  // Sub-Tab State
  const [activeSubTab, setActiveSubTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');

  // Filters State
  const [academicYearFilter, setAcademicYearFilter] = useState('ALL');
  const [instituteFilter, setInstituteFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('ALL');
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Refresh
  const [refreshKey, setRefreshKey] = useState(0);
  const [isOnboardingFormOpen, setIsOnboardingFormOpen] = useState(false);
  const [selectedAppForForm, setSelectedAppForForm] = useState<AdmissionApplication | null>(null);
  const [selectedAppForOnboarding, setSelectedAppForOnboarding] = useState<AdmissionApplication | null>(null);
  const [selectedAppForDossier, setSelectedAppForDossier] = useState<AdmissionApplication | null>(null);
  const [selectedAppForPayment, setSelectedAppForPayment] = useState<AdmissionApplication | null>(null);
  const [selectedTxnForReceipt, setSelectedTxnForReceipt] = useState<FeePaymentTransaction | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // KPI Metrics
  const stats: OnboardingStatistics = useMemo(() => {
    return studentOnboardingService.getOnboardingStatistics();
  }, [refreshKey]);

  // Filtered Applications
  const applications = useMemo(() => {
    return studentOnboardingService.getFilteredApplications({
      academicYearId: academicYearFilter,
      instituteId: instituteFilter,
      departmentId: departmentFilter,
      programId: programFilter,
      admissionStatus: admissionStatusFilter,
      onboardingStatus: onboardingStatusFilter,
      searchQuery
    }, user, role);
  }, [academicYearFilter, instituteFilter, departmentFilter, programFilter, admissionStatusFilter, onboardingStatusFilter, searchQuery, user, role, refreshKey]);

  // Onboarding History
  const historyList = useMemo(() => {
    return studentOnboardingService.getOnboardingHistory();
  }, [refreshKey]);

  const handleResetFilters = () => {
    setAcademicYearFilter('ALL');
    setInstituteFilter('ALL');
    setDepartmentFilter('ALL');
    setProgramFilter('ALL');
    setAdmissionStatusFilter('ALL');
    setOnboardingStatusFilter('ALL');
    setSearchQuery('');
  };

  const handleExportExcel = () => {
    if (activeSubTab === 'QUEUE') {
      const data = applications.map(app => ({
        'Application No': app.applicationNumber || app.id,
        'Admission No': app.admissionNumber || '—',
        'Applicant Name': app.applicantName,
        'Email': app.email,
        'Mobile': app.phone,
        'Program': programs.find(p => p.id === app.programId)?.name || '—',
        'Department': departments.find(d => d.id === app.departmentId)?.name || '—',
        'Admission Status': app.status,
        'Fee Paid': app.isFeePaid ? `Rs. ${app.feeAmountPaid}` : 'Pending',
        'Onboarding Status': app.onboardingStatus || 'PENDING',
        'Enrollment No': app.enrollmentNo || '—',
        'Submission Date': app.submittedAt
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Onboarding Queue');
      XLSX.writeFile(wb, `SSIU_Student_Onboarding_Queue_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('success', `Exported ${data.length} onboarding records to Excel.`);
    } else {
      const data = historyList.map(h => ({
        'Student Name': h.studentName,
        'Enrollment No': h.enrollmentNo,
        'Application No': h.applicationNumber,
        'Program': h.programName,
        'Department': h.departmentName,
        'Onboarded By': h.onboardedBy,
        'Role': h.role,
        'Date': h.date,
        'Time': h.time,
        'Previous Status': h.previousStatus,
        'New Status': h.newStatus,
        'Remarks': h.remarks || '—'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Onboarding History');
      XLSX.writeFile(wb, `SSIU_Onboarding_Audit_History_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('success', `Exported ${data.length} onboarding history records to Excel.`);
    }
  };

  const handleHold = (app: AdmissionApplication) => {
    const reason = window.prompt(`Enter reason for putting ${app.applicantName}'s application on hold:`);
    if (reason && user) {
      studentOnboardingService.holdApplication(app.id, reason, user);
      showToast('success', `Application ${app.applicationNumber || app.id} put on hold.`);
      setRefreshKey(k => k + 1);
    }
  };

  const handleReject = (app: AdmissionApplication) => {
    const reason = window.prompt(`Enter rejection reason for ${app.applicantName}:`);
    if (reason && user) {
      studentOnboardingService.rejectApplication(app.id, reason, user);
      showToast('error', `Application ${app.applicationNumber || app.id} rejected.`);
      setRefreshKey(k => k + 1);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONBOARDED':
      case 'CONVERTED':
        return <Badge variant="active">ONBOARDED / ACTIVE</Badge>;
      case 'READY':
      case 'READY_FOR_ONBOARDING':
        return <Badge variant="active">READY FOR ONBOARDING</Badge>;
      case 'APPROVED':
      case 'ADMISSION_CONFIRMED':
        return <Badge variant="active">ADMISSION CONFIRMED</Badge>;
      case 'DOCUMENTS_VERIFIED':
      case 'DOC_VERIFIED':
        return <Badge variant="navy">DOCS VERIFIED</Badge>;
      case 'FEE_VERIFIED':
        return <Badge variant="navy">FEE VERIFIED</Badge>;
      case 'DOCUMENT_VERIFICATION':
        return <Badge variant="orange">DOC PENDING</Badge>;
      case 'FEE_PENDING':
        return <Badge variant="gold">FEE PENDING</Badge>;
      case 'HOLD':
        return <Badge variant="gold">ON HOLD</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {toast && (
        <div style={{
          padding: '0.75rem 1rem',
          background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: toast.type === 'success' ? '#047857' : '#B91C1C',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
            Student Administration &amp; Onboarding Hub
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '3px 0 0 0' }}>
            Verify confirmed admission applications, execute atomic student master creation, assign mentors &amp; activate ERP login accounts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSelectedAppForForm(null);
              setIsOnboardingFormOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #F37023 0%, #EA580C 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(243, 112, 35, 0.35)',
              cursor: 'pointer'
            }}
            title="Create and Onboard Student"
          >
            <UserPlus size={15} strokeWidth={2.5} /> + Add Student
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={14} /> Export Register (.xlsx)
          </button>
        </div>
      </div>

      {/* 2. Onboarding KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <StatCard
          title="Total Admissions"
          value={stats.totalAdmissions.toString()}
          icon={Users}
          subtitle="All applicant records"
          colorScheme="navy"
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmed.toString()}
          icon={CheckCircle2}
          subtitle="Admission approved"
          colorScheme="green"
        />
        <StatCard
          title="Doc Pending"
          value={stats.docPending.toString()}
          icon={FileText}
          subtitle="Awaiting verification"
          colorScheme="orange"
        />
        <StatCard
          title="Fee Pending"
          value={stats.feePending.toString()}
          icon={IndianRupee}
          subtitle="Payment settlement"
          colorScheme="gold"
        />
        <StatCard
          title="Ready to Onboard"
          value={stats.readyForOnboarding.toString()}
          icon={ShieldCheck}
          subtitle="Docs & fee confirmed"
          colorScheme="green"
        />
        <StatCard
          title="Active Onboarded"
          value={stats.onboarded.toString()}
          icon={UserPlus}
          subtitle="ERP login generated"
          colorScheme="navy"
        />
        <StatCard
          title="On Hold"
          value={stats.onHold.toString()}
          icon={Clock}
          subtitle="Query / review pause"
          colorScheme="gold"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected.toString()}
          icon={XCircle}
          subtitle="Eligibility declined"
          colorScheme="orange"
        />
      </div>

      {/* 3. Sub-Tab Switcher: Queue vs History */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeSubTab === 'QUEUE' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('QUEUE')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
        >
          <Layers size={15} /> Active Onboarding Queue ({applications.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeSubTab === 'HISTORY' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('HISTORY')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
        >
          <History size={15} /> Onboarding Audit History ({historyList.length})
        </button>
      </div>

      {activeSubTab === 'QUEUE' ? (
        <>
          {/* 4. Multi-Criteria Filter Bar */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              
              {/* Search Box */}
              <div style={{ gridColumn: 'span 2', minWidth: '220px', position: 'relative' }}>
                <Search size={14} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search App No, Admission No, Student Name, Email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.75rem', height: '34px' }}
                />
              </div>

              {/* Department Filter */}
              <div>
                <select
                  className="form-control"
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px' }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Program Filter */}
              <div>
                <select
                  className="form-control"
                  value={programFilter}
                  onChange={e => setProgramFilter(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px' }}
                >
                  <option value="ALL">All Programs</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Admission Status Filter */}
              <div>
                <select
                  className="form-control"
                  value={admissionStatusFilter}
                  onChange={e => setAdmissionStatusFilter(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px' }}
                >
                  <option value="ALL">All Admission Status</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="ADMISSION_CONFIRMED">ADMISSION CONFIRMED</option>
                  <option value="DOCUMENT_VERIFICATION">DOC VERIFICATION</option>
                  <option value="DOCUMENTS_VERIFIED">DOCS VERIFIED</option>
                  <option value="FEE_PENDING">FEE PENDING</option>
                  <option value="CONVERTED">ONBOARDED / ENROLLED</option>
                  <option value="HOLD">HOLD</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Onboarding Readiness Filter */}
              <div>
                <select
                  className="form-control"
                  value={onboardingStatusFilter}
                  onChange={e => setOnboardingStatusFilter(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px' }}
                >
                  <option value="ALL">All Onboarding Status</option>
                  <option value="READY">READY FOR ONBOARDING</option>
                  <option value="ONBOARDED">ONBOARDED</option>
                  <option value="DOC_VERIFIED">DOCS VERIFIED</option>
                  <option value="FEE_VERIFIED">FEE VERIFIED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="HOLD">HOLD</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Reset Filters */}
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ width: '100%', height: '34px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* 5. Onboarding Candidates Data Table */}
          <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="var(--brand-orange, #F37023)" /> Student Admission &amp; Onboarding Candidates
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                Showing {applications.length} admission applications
              </span>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                    <th style={{ width: '45px', padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Sr. No.</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Application No.</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Student Name</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Mobile</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Email</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Program</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Department</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Academic Year</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Application Status</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Document Status</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Fee Amount</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Payment Status</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Receipt No.</th>
                    <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Onboarding Status</th>
                    <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={15} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted, #64748B)' }}>
                        No admission applications matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app, idx) => {
                      const prog = programs.find(p => p.id === app.programId);
                      const dept = departments.find(d => d.id === app.departmentId) || departments.find(d => d.id === prog?.departmentId);
                      const ay = academicYears.find(a => a.id === app.academicYearId);
                      const docs = app.documents || [];
                      const verifiedDocs = docs.filter(d => d.status === 'VERIFIED').length;
                      const isDocsComplete = docs.length > 0 && verifiedDocs === docs.length;
                      const isOnboarded = app.status === 'CONVERTED' || app.status === 'ONBOARDED' || app.onboardingStatus === 'ONBOARDED';
                      const isFeePaid = app.isFeePaid || app.feePaymentStatus === 'PAID' || app.feePaymentStatus === 'SUCCESS';
                      const readiness = studentOnboardingService.evaluateReadiness(app);
                      const isEven = idx % 2 === 0;

                      return (
                        <tr key={app.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ textAlign: 'center', padding: '0.5rem', borderRight: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                            {idx + 1}
                          </td>

                          <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                            <code style={{ fontWeight: 800, color: '#F37023', fontSize: '0.8125rem' }}>
                              {app.applicationNumber || app.id}
                            </code>
                            {app.admissionNumber && (
                              <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>
                                Adm: {app.admissionNumber}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                            <strong style={{ fontSize: '0.84375rem', color: '#0F2C59', display: 'block' }}>
                              {app.applicantName}
                            </strong>
                            {app.enrollmentNo && (
                              <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#047857' }}>
                                Enr: <code>{app.enrollmentNo}</code>
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {app.phone}
                          </td>

                          <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.email}
                          </td>

                          <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem', fontWeight: 600, color: '#0F2C59' }}>
                            {prog?.code || prog?.name || 'B.Tech CSE'}
                          </td>

                          <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569' }}>
                            {dept?.name || 'Computer Engineering'}
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem' }}>
                            {ay?.name || app.academicYearId || '2026-27'}
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            <Badge variant={
                              app.status === 'APPROVED' || app.status === 'ADMISSION_CONFIRMED' ? 'active' :
                              app.status === 'HOLD' ? 'gold' :
                              app.status === 'REJECTED' ? 'danger' : 'navy'
                            }>
                              {app.status}
                            </Badge>
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            <Badge variant={isDocsComplete ? 'active' : 'orange'}>
                              {isDocsComplete ? 'VERIFIED' : `${verifiedDocs}/${docs.length} PENDING`}
                            </Badge>
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 800, color: '#0F2C59', fontSize: '0.78125rem' }}>
                            ₹{(app.feeAmountPaid || app.feeTotal || 25000).toLocaleString('en-IN')}
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            <Badge variant={isFeePaid ? 'active' : app.feePaymentStatus === 'FAILED' ? 'danger' : 'gold'}>
                              {isFeePaid ? 'PAID' : app.feePaymentStatus === 'FAILED' ? 'FAILED' : 'PENDING'}
                            </Badge>
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.71875rem' }}>
                            {app.feeReceiptNo ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const txn = db.getFeePaymentTransactions().find(t => t.receiptNo === app.feeReceiptNo || t.studentId === app.id || t.studentName === app.applicantName) || {
                                    id: `pay-${app.id}`,
                                    studentFeeRecordId: `fee-rec-${app.id}`,
                                    receiptNo: app.feeReceiptNo || 'SSIU-REC-2026',
                                    studentId: app.studentId || app.id,
                                    studentName: app.applicantName,
                                    enrollmentNo: app.enrollmentNo || app.applicationNumber || 'ADM-2026',
                                    programId: app.programId || 'prog-1',
                                    semesterId: app.semesterId || 'sem-1',
                                    semesterName: 'Semester 1 (Admission)',
                                    academicYear: '2026-2027',
                                    paidAmount: app.feeAmountPaid || 25000,
                                    paymentMode: 'UPI',
                                    transactionId: app.paymentTransactionId || 'TXN-20260824',
                                    feeType: 'TUITION',
                                    status: 'SUCCESS',
                                    paymentDate: app.paymentDate || new Date().toISOString().split('T')[0],
                                    recordedBy: 'Admission Accounts Office'
                                  };
                                  setSelectedTxnForReceipt(txn as any);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700, color: '#047857', padding: 0, textDecoration: 'underline' }}
                                title="View Official Fee Receipt"
                              >
                                {app.feeReceiptNo}
                              </button>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>—</span>
                            )}
                          </td>

                          <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            {getStatusBadge(app.onboardingStatus || app.status)}
                          </td>

                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.71875rem', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '2px' }}
                                onClick={() => setSelectedAppForDossier(app)}
                                title="View Complete Admission Profile"
                              >
                                <Eye size={12} /> View
                              </button>

                              {!isFeePaid && !isOnboarded && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.71875rem', padding: '2px 8px', fontWeight: 800, background: '#047857', borderColor: '#047857', color: '#FFF', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  onClick={() => setSelectedAppForPayment(app)}
                                  title="Pay Initial Admission Fee"
                                >
                                  <CreditCard size={11} /> Pay Fee
                                </button>
                              )}

                              {!isOnboarded ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.71875rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800, background: readiness.isReady ? '#0F2C59' : '#94A3B8', borderColor: readiness.isReady ? '#0F2C59' : '#94A3B8' }}
                                  onClick={() => setSelectedAppForOnboarding(app)}
                                  disabled={!readiness.isReady}
                                  title={readiness.isReady ? 'Confirm & Final Onboard Student' : `Locked: ${readiness.blockers.join(' ')}`}
                                >
                                  <UserPlus size={11} /> Onboard
                                </button>
                              ) : (
                                <Badge variant="active">
                                  <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '2px' }} /> Done
                                </Badge>
                              )}
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
        </>
      ) : (
        /* 6. Onboarding Audit History Table */
        <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderBottom: '1px solid var(--border-color, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={16} color="var(--brand-orange, #F37023)" /> Student Onboarding Execution &amp; Audit Trail
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
              Showing {historyList.length} completed student onboardings
            </span>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800 }}>Date &amp; Time</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800 }}>Student Details</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800 }}>Program &amp; Department</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800 }}>Onboarded By</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800 }}>Actions Completed</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800 }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                      No onboarding transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  historyList.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748B' }}>
                        <strong style={{ display: 'block', color: '#0F2C59' }}>{item.date}</strong>
                        <span>{item.time}</span>
                      </td>

                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <strong style={{ fontSize: '0.84375rem', color: '#0F2C59', display: 'block' }}>
                          {item.studentName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#F37023', fontWeight: 700 }}>
                          Enrollment: <code>{item.enrollmentNo}</code>
                        </span>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>
                          App: {item.applicationNumber} • ID: {item.studentId}
                        </span>
                      </td>

                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#0F2C59', display: 'block' }}>
                          {item.programName}
                        </span>
                        <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                          {item.departmentName}
                        </span>
                      </td>

                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#0F2C59', display: 'block' }}>
                          {item.onboardedBy}
                        </span>
                        <Badge variant="navy">{item.role}</Badge>
                      </td>

                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.71875rem', color: '#64748B' }}>
                          {item.actionsCompleted.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </td>

                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748B' }}>
                        {item.remarks || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pre-Onboarding Detailed Dossier & Document Verification Modal */}
      {selectedAppForDossier && (
        <StudentApplicantDetailModal
          isOpen={Boolean(selectedAppForDossier)}
          onClose={() => setSelectedAppForDossier(null)}
          application={selectedAppForDossier}
          onRefresh={() => setRefreshKey(k => k + 1)}
          onOpenOnboard={(app) => setSelectedAppForOnboarding(app)}
          onOpenPayment={(app) => setSelectedAppForPayment(app)}
        />
      )}

      {/* Admission Fee Payment Modal (with Demo Simulation) */}
      {selectedAppForPayment && (
        <AdmissionFeePaymentModal
          isOpen={Boolean(selectedAppForPayment)}
          onClose={() => setSelectedAppForPayment(null)}
          application={selectedAppForPayment}
          onPaymentSuccess={(txn, updatedApp) => {
            showToast('success', `Fee payment of ₹${txn.paidAmount.toLocaleString('en-IN')} confirmed for ${txn.studentName}. Receipt: ${txn.receiptNo}`);
            setRefreshKey(k => k + 1);
          }}
          onOpenReceipt={(txn) => feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(txn))}
          onOpenOnboard={(app) => setSelectedAppForOnboarding(app)}
        />
      )}

      {/* Final Student Onboarding Confirmation Modal */}
      {selectedAppForOnboarding && (
        <StudentOnboardingModal
          isOpen={Boolean(selectedAppForOnboarding)}
          onClose={() => setSelectedAppForOnboarding(null)}
          application={selectedAppForOnboarding}
          onSuccess={(result) => {
            showToast('success', `Student ${result.student?.name} (${result.student?.enrollmentNo}) successfully onboarded.`);
            setSelectedAppForOnboarding(null);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* 11-Step Comprehensive Student Onboarding Wizard Form Modal */}
      {isOnboardingFormOpen && (
        <StudentOnboardingFormModal
          isOpen={isOnboardingFormOpen}
          onClose={() => {
            setIsOnboardingFormOpen(false);
            setSelectedAppForForm(null);
          }}
          initialApplication={selectedAppForForm}
          onSuccess={(student) => {
            showToast('success', `Student ${student.name} (${student.enrollmentNo}) onboarded successfully.`);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

    </div>
  );
};
