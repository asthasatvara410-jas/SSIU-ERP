import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { 
  CRMLead, AdmissionApplication, LeadSource, LeadStatus, 
  AdmissionApplicationStatus, LeadFollowUp, Program, Batch, Semester, Division,
  Institute, AcademicYear, Department, Student
} from '../../types';
import { 
  Users, UserPlus, PhoneCall, CheckCircle, Plus, Search, 
  ArrowRight, MessageSquare, ShieldAlert, Award, FileText, Check, X, Upload,
  Edit3, Trash2, Download, Eye, Calendar, Building, GraduationCap, Clock,
  RefreshCw, CheckSquare, Sparkles, Filter, ExternalLink, Send, FileCheck, AlertTriangle
} from 'lucide-react';
import { exportToExcel } from '../../services/exportService';
import { DashboardReportModal } from '../../components/reports/DashboardReportModal';
import { StudentOnboardingTab } from '../../components/admission/StudentOnboardingTab';

export const CRMPage: React.FC = () => {
  const { user, role, canMutate } = useAuth();

  // Master Data
  const [leads, setLeads] = useState<CRMLead[]>(() => db.getCRMLeads());
  const [applications, setApplications] = useState<AdmissionApplication[]>(() => db.getAdmissionApplications());
  const facultyList = db.getFaculty();
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();
  const batches = db.getBatches();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();

  const [activeTab, setActiveTab] = useState<'LEADS' | 'APPLICATIONS' | 'ONBOARDING' | 'REPORTS'>('LEADS');

  // Multi-Criteria Filters State
  const [filterInstitute, setFilterInstitute] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterCounsellor, setFilterCounsellor] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // Modals State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isReviewApplicationModalOpen, setIsReviewApplicationModalOpen] = useState(false);
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [deletingLead, setDeletingLead] = useState<CRMLead | null>(null);

  // Toast notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State: Add/Edit Lead
  const [leadFormId, setLeadFormId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadInstituteId, setLeadInstituteId] = useState(institutes[0]?.id || 'inst-1');
  const [leadProgramId, setLeadProgramId] = useState(programs[0]?.id || 'prog-1');
  const [leadAcademicYearId, setLeadAcademicYearId] = useState(academicYears[0]?.id || 'ay-2026');
  const [leadSource, setLeadSource] = useState<LeadSource>('Website');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('NEW');
  const [leadCounsellorId, setLeadCounsellorId] = useState(facultyList[0]?.id || 'fac-1');
  const [leadFollowUpDate, setLeadFollowUpDate] = useState('');
  const [leadRemarks, setLeadRemarks] = useState('');

  // Form State: Add Follow-up
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpNextDate, setFollowUpNextDate] = useState('');
  const [updateStatus, setUpdateStatus] = useState<LeadStatus>('FOLLOW_UP');

  // Form State: Admission Application review
  const [appStatus, setAppStatus] = useState<AdmissionApplicationStatus>('APPLIED');
  const [appReviewerRemarks, setAppReviewerRemarks] = useState('');

  // Form State: Direct Admission Application
  const [appName, setAppName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appGender, setAppGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [appDob, setAppDob] = useState('2005-05-15');
  const [appBloodGroup, setAppBloodGroup] = useState('O+');
  const [appAddress, setAppAddress] = useState('');
  const [appGuardianName, setAppGuardianName] = useState('');
  const [appGuardianPhone, setAppGuardianPhone] = useState('');
  const [appInstId, setAppInstId] = useState(institutes[0]?.id || 'inst-1');
  const [appProgId, setAppProgId] = useState(programs[0]?.id || 'prog-1');
  const [appSemId, setAppSemId] = useState(semesters[0]?.id || 'sem-1');
  const [appBatchId, setAppBatchId] = useState(batches[0]?.id || 'batch-2026');
  const [appDivId, setAppDivId] = useState(divisions[0]?.id || 'div-1');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshData = () => {
    setLeads([...db.getCRMLeads()]);
    setApplications([...db.getAdmissionApplications()]);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    return db.getCRMLeadDashboardStats(user, role);
  }, [leads, user, role]);

  const filteredLeads = useMemo(() => {
    return db.getFilteredCRMLeads({
      instituteId: filterInstitute,
      programId: filterProgram,
      departmentId: filterDepartment,
      academicYearId: filterAcademicYear,
      status: filterStatus,
      source: filterSource,
      counsellorId: filterCounsellor,
      startDate: filterDate || undefined,
      searchQuery: searchTerm
    }, user, role);
  }, [leads, filterInstitute, filterProgram, filterDepartment, filterAcademicYear, filterStatus, filterSource, filterCounsellor, filterDate, searchTerm, user, role]);

  // Scoped & Filtered Applications
  const filteredApplications = useMemo(() => {
    let list = [...applications];
    if (role === 'STUDENT') {
      return list.filter(a => a.email === user?.email || a.studentId === user?.id);
    }
    if (appStatusFilter !== 'ALL') {
      list = list.filter(a => a.status === appStatusFilter);
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(a => 
        (a.applicationNumber && a.applicationNumber.toLowerCase().includes(q)) ||
        a.applicantName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q)
      );
    }
    return list;
  }, [applications, appStatusFilter, searchTerm, user, role]);

  // Handlers: Lead Modal
  const handleOpenAddLead = () => {
    setSelectedLead(null);
    setLeadFormId(db.generateLeadNumber());
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setLeadInstituteId(institutes[0]?.id || 'inst-1');
    setLeadProgramId(programs[0]?.id || 'prog-1');
    setLeadAcademicYearId(academicYears[0]?.id || 'ay-2026');
    setLeadSource('Website');
    setLeadStatus('NEW');
    setLeadCounsellorId(facultyList[0]?.id || 'fac-1');
    setLeadFollowUpDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
    setLeadRemarks('');
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead: CRMLead) => {
    setSelectedLead(lead);
    setLeadFormId(lead.leadNumber || lead.id);
    setLeadName(lead.name);
    setLeadEmail(lead.email);
    setLeadPhone(lead.phone);
    setLeadInstituteId(lead.instituteId || institutes[0]?.id || 'inst-1');
    setLeadProgramId(lead.programId || programs[0]?.id || 'prog-1');
    setLeadAcademicYearId(lead.academicYearId || academicYears[0]?.id || 'ay-2026');
    setLeadSource(lead.source);
    setLeadStatus(lead.status);
    setLeadCounsellorId(lead.counsellorId);
    setLeadFollowUpDate(lead.followUpDate || '');
    setLeadRemarks(lead.remarks || '');
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) {
      showToast('error', 'Student Name and Mobile Number are required.');
      return;
    }

    const counsellor = facultyList.find(f => f.id === leadCounsellorId);
    const counsellorName = counsellor ? counsellor.name : 'Unassigned';
    const prog = programs.find(p => p.id === leadProgramId);
    const inst = institutes.find(i => i.id === leadInstituteId);
    const ay = academicYears.find(a => a.id === leadAcademicYearId);

    if (selectedLead) {
      db.updateCRMLead(selectedLead.id, {
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        instituteId: leadInstituteId,
        instituteName: inst?.name || 'Swarrnim University',
        programId: leadProgramId,
        programName: prog?.name || 'B.Tech Program',
        academicYearId: leadAcademicYearId,
        academicYearName: ay?.name || '2025-2026',
        source: leadSource,
        status: leadStatus,
        counsellorId: leadCounsellorId,
        counsellorName,
        followUpDate: leadFollowUpDate,
        remarks: leadRemarks
      }, user);
      showToast('success', `Lead "${leadName}" updated successfully.`);
    } else {
      const created = db.createCRMLead({
        leadNumber: leadFormId,
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        instituteId: leadInstituteId,
        instituteName: inst?.name || 'Swarrnim University',
        programId: leadProgramId,
        programName: prog?.name || 'B.Tech Program',
        academicYearId: leadAcademicYearId,
        academicYearName: ay?.name || '2025-2026',
        source: leadSource,
        status: leadStatus,
        counsellorId: leadCounsellorId,
        counsellorName,
        followUpDate: leadFollowUpDate,
        remarks: leadRemarks
      }, user);
      showToast('success', `Lead registered successfully with ID: ${created.leadNumber}`);
    }
    
    refreshData();
    setIsLeadModalOpen(false);
  };

  // Quick Status Updater
  const handleQuickStatusChange = (lead: CRMLead, newStatus: LeadStatus) => {
    db.updateCRMLead(lead.id, { status: newStatus }, user);
    showToast('success', `Lead ${lead.leadNumber || lead.name} status updated to ${newStatus}`);
    refreshData();
  };

  // Lead Details Modal
  const handleOpenLeadDetails = (lead: CRMLead) => {
    setSelectedLead(lead);
    setIsLeadDetailModalOpen(true);
  };

  // Follow-up Handler
  const handleOpenFollowUp = (lead: CRMLead) => {
    setSelectedLead(lead);
    setFollowUpNotes('');
    setFollowUpNextDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setUpdateStatus(lead.status === 'NEW' ? 'CONTACTED' : lead.status === 'CONTACTED' ? 'FOLLOW_UP' : lead.status);
    setIsFollowUpModalOpen(true);
  };

  const handleAddFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !followUpNotes) {
      showToast('error', 'Please enter follow-up notes.');
      return;
    }

    db.addLeadFollowUp(selectedLead.id, followUpNotes, updateStatus, followUpNextDate, user);
    showToast('success', `Follow-up notes added for ${selectedLead.name}. Status updated to ${updateStatus}.`);
    refreshData();
    setIsFollowUpModalOpen(false);
    if (isLeadDetailModalOpen) {
      setSelectedLead(db.getCRMLeads().find(l => l.id === selectedLead.id) || null);
    }
  };

  // Convert Lead to Admission Application
  const handleConvertLeadToApplicant = (lead: CRMLead) => {
    const newApp = db.convertLeadToApplication(lead.id, {
      gender: 'Male',
      dateOfBirth: '2005-05-15',
      bloodGroup: 'O+',
      address: 'Gandhinagar, Gujarat',
      guardianName: 'Guardian',
      guardianPhone: lead.phone,
      programId: lead.programId,
      semesterId: semesters[0]?.id || 'sem-1',
      batchId: batches[0]?.id || 'batch-2026',
      divisionId: divisions[0]?.id || 'div-1'
    }, user);

    if (newApp) {
      showToast('success', `Lead converted! Application ${newApp.applicationNumber} generated.`);
      refreshData();
      setIsLeadDetailModalOpen(false);
      setActiveTab('APPLICATIONS');
    }
  };

  // Review Application
  const handleOpenReviewApplication = (app: AdmissionApplication) => {
    setSelectedApplication(app);
    setAppStatus(app.status);
    setAppReviewerRemarks(app.reviewerRemarks || '');
    setIsReviewApplicationModalOpen(true);
  };

  const handleSaveApplicationReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    db.updateEntity<AdmissionApplication>('admissionApplications', selectedApplication.id, {
      status: appStatus,
      reviewerRemarks: appReviewerRemarks
    }, `Reviewed admission application status to ${appStatus} for ${selectedApplication.applicantName}`);

    showToast('success', `Application ${selectedApplication.applicationNumber || selectedApplication.applicantName} status set to ${appStatus}`);
    refreshData();
    setIsReviewApplicationModalOpen(false);
  };

  // Convert Application to Student
  const handleConvertApplicationToStudent = (app: AdmissionApplication) => {
    const student = db.convertApplicantToStudent(app.id);
    if (student) {
      showToast('success', `Enrolled ${app.applicantName} successfully! Enrollment No: ${student.enrollmentNo}`);
      refreshData();
      setIsReviewApplicationModalOpen(false);
    } else {
      showToast('error', 'Only APPROVED applications can be enrolled as active students.');
    }
  };

  const handleToggleDocVerification = (app: AdmissionApplication, docId: string, verified: boolean) => {
    const updatedDocs = app.documents.map(d => d.id === docId ? { ...d, status: verified ? 'VERIFIED' as const : 'REJECTED' as const } : d);
    db.updateEntity<AdmissionApplication>('admissionApplications', app.id, {
      documents: updatedDocs
    });
    showToast('success', `Document ${verified ? 'Verified' : 'Rejected'}.`);
    refreshData();
    setSelectedApplication(prev => prev ? { ...prev, documents: updatedDocs } : null);
  };

  // Direct Admission Application Submit
  const handleDirectAdmissionApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appPhone) {
      showToast('error', 'Applicant Name and Mobile Number are required.');
      return;
    }

    const appNumber = db.generateApplicationNumber();
    const prog = programs.find(p => p.id === appProgId);
    const inst = prog ? institutes.find(i => i.id === prog.instituteId) : institutes[0];

    db.addEntity<AdmissionApplication>('admissionApplications', {
      applicationNumber: appNumber,
      applicantName: appName,
      email: appEmail,
      phone: appPhone,
      gender: appGender,
      dateOfBirth: appDob,
      bloodGroup: appBloodGroup,
      address: appAddress,
      guardianName: appGuardianName,
      guardianPhone: appGuardianPhone,
      instituteId: inst?.id || 'inst-1',
      instituteName: inst?.name || 'Swarrnim University',
      programId: appProgId,
      semesterId: appSemId,
      batchId: appBatchId,
      divisionId: appDivId,
      status: 'APPLIED',
      submittedAt: new Date().toISOString().split('T')[0],
      documents: [
        { id: `doc-app-${Date.now()}-1`, name: '10th & 12th Marksheets', status: 'PENDING' },
        { id: `doc-app-${Date.now()}-2`, name: 'Government ID Proof (Aadhaar)', status: 'PENDING' },
        { id: `doc-app-${Date.now()}-3`, name: 'Passport Size Photograph', status: 'PENDING' }
      ]
    }, `Direct admission application registered for ${appName}`);

    showToast('success', `Application ${appNumber} submitted successfully for ${appName}.`);
    refreshData();
    setIsNewApplicationModalOpen(false);
  };

  // Delete Lead
  const handleDeleteLeadConfirm = () => {
    if (deletingLead) {
      db.deleteCRMLead(deletingLead.id, user);
      showToast('success', `Lead "${deletingLead.name}" deleted.`);
      setDeletingLead(null);
      refreshData();
    }
  };

  // Export to Excel
  const handleExportLeads = () => {
    const headers = ['Lead ID', 'Student Name', 'Mobile', 'Email', 'Interested Institute', 'Interested Program', 'Academic Year', 'Source', 'Counsellor', 'Status', 'Follow-up Date', 'Remarks', 'Created Date'];
    const rows = filteredLeads.map(l => [
      l.leadNumber || l.id,
      l.name,
      l.phone,
      l.email,
      l.instituteName || '',
      l.programName || '',
      l.academicYearName || '',
      l.source,
      l.counsellorName,
      l.status,
      l.followUpDate || '',
      l.remarks || '',
      l.createdAt
    ]);

    exportToExcel(`CRM_Leads_Register_${new Date().toISOString().split('T')[0]}`, headers, rows, {
      departmentName: filterDepartment !== 'ALL' ? departments.find(d => d.id === filterDepartment)?.name : 'All Departments',
      searchQuery: searchTerm || undefined
    }, {
      name: user?.name || 'Administrator',
      role: role || 'SUPER_ADMIN'
    });
    showToast('success', `Exported ${rows.length} leads to Excel.`);
  };

  // Badges
  const getLeadStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'CONVERTED': return <Badge variant="active">CONVERTED</Badge>;
      case 'APPLICATION': return <Badge variant="orange">APPLICATION</Badge>;
      case 'FOLLOW_UP': return <Badge variant="orange">FOLLOW UP</Badge>;
      case 'INTERESTED': return <Badge variant="gold">INTERESTED</Badge>;
      case 'CONTACTED': return <Badge variant="navy">CONTACTED</Badge>;
      case 'NEW': return <Badge variant="navy">NEW</Badge>;
      case 'LOST':
      case 'CLOSED': return <Badge variant="inactive">LOST / CLOSED</Badge>;
      default: return <Badge variant="inactive">{status}</Badge>;
    }
  };

  const getAppStatusBadge = (status: AdmissionApplicationStatus) => {
    switch (status) {
      case 'CONVERTED': return <Badge variant="active">ENROLLED</Badge>;
      case 'APPROVED': return <Badge variant="active">APPROVED</Badge>;
      case 'SHORTLISTED': return <Badge variant="gold">SHORTLISTED</Badge>;
      case 'DOCUMENT_VERIFICATION': return <Badge variant="orange">DOC VERIFICATION</Badge>;
      case 'APPLIED': return <Badge variant="navy">APPLIED</Badge>;
      case 'REJECTED': return <Badge variant="danger">REJECTED</Badge>;
      default: return <Badge variant="inactive">{status}</Badge>;
    }
  };

  // Direct Student Profile view
  if (role === 'STUDENT') {
    const myApp = applications.find(a => a.email === user?.email || a.studentId === user?.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Admission &amp; Application Desk
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Check your admission verification progress and upload supporting identity documents
            </p>
          </div>
        </div>

        {myApp ? (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-navy)' }}>{myApp.applicantName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Application Ref: <strong>{myApp.applicationNumber || myApp.id}</strong> • Applied for: {programs.find(p => p.id === myApp.programId)?.name}
                </p>
              </div>
              {getAppStatusBadge(myApp.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Mobile</span>
                <p style={{ fontWeight: 600 }}>{myApp.phone}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email ID</span>
                <p style={{ fontWeight: 600 }}>{myApp.email}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submission Date</span>
                <p style={{ fontWeight: 600 }}>{myApp.submittedAt}</p>
              </div>
            </div>

            <h4 style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>Required Application Documents</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myApp.documents.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={18} color="var(--brand-navy)" />
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <Badge variant={d.status === 'VERIFIED' ? 'active' : d.status === 'REJECTED' ? 'danger' : 'warning'}>
                    {d.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No active admission application found for your email account.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: notification.type === 'success' ? '#10B981' : '#EF4444',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Admission &amp; Enrollment Management Desk
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            End-to-end prospective student inquiry capture, lead counselling, admission applications, document verification &amp; university enrollment
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setIsReportModalOpen(true)}>
            <FileText size={16} /> Admission Analytics
          </button>
          <button className="btn btn-secondary" onClick={handleExportLeads}>
            <Download size={16} /> Export to Excel
          </button>
          {canMutate() && (
            <>
              <button className="btn btn-secondary" onClick={() => setIsNewApplicationModalOpen(true)}>
                <UserPlus size={16} /> Direct Application
              </button>
              <button className="btn btn-primary" onClick={handleOpenAddLead}>
                <Plus size={16} /> Generate New Lead
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <StatCard title="Total Leads" value={String(stats.totalLeads)} icon={Users} subtitle="All Inquiries" />
        <StatCard title="New Leads" value={String(stats.newLeads)} icon={Sparkles} subtitle="Unassigned / Fresh" />
        <StatCard title="Contacted" value={String(stats.contacted)} icon={PhoneCall} subtitle="Initial Dialogue" />
        <StatCard title="Follow-up" value={String(stats.followUp)} icon={Clock} subtitle="In Active Discussion" />
        <StatCard title="Converted" value={String(stats.converted)} icon={CheckCircle} subtitle="Registered Applications" />
        <StatCard title="Lost / Closed" value={String(stats.lost)} icon={X} subtitle="Dropouts / Ineligible" />
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={Award} subtitle="Inquiry to Admission" />
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'LEADS' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('LEADS')}
        >
          <Users size={16} /> Prospective CRM Leads ({filteredLeads.length})
        </button>
        <button
          className={`btn ${activeTab === 'APPLICATIONS' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('APPLICATIONS')}
        >
          <FileCheck size={16} /> Admission Applications ({filteredApplications.length})
        </button>
        <button
          className={`btn ${activeTab === 'ONBOARDING' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('ONBOARDING')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
        >
          <UserPlus size={16} /> Student Onboarding Desk
        </button>
      </div>

      {/* TAB 1: PROSPECTIVE CRM LEADS */}
      {activeTab === 'LEADS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Multi-Criteria Filter Bar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Search Query</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '28px', fontSize: '0.8125rem' }}
                    placeholder="Search ID, name, phone, email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Interested Institute</label>
                <select className="form-select" style={{ fontSize: '0.8125rem' }} value={filterInstitute} onChange={e => setFilterInstitute(e.target.value)}>
                  <option value="ALL">All Institutes</option>
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Interested Program</label>
                <select className="form-select" style={{ fontSize: '0.8125rem' }} value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
                  <option value="ALL">All Programs</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Academic Year</label>
                <select className="form-select" style={{ fontSize: '0.8125rem' }} value={filterAcademicYear} onChange={e => setFilterAcademicYear(e.target.value)}>
                  <option value="ALL">All Academic Years</option>
                  {academicYears.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lead Status</label>
                <select className="form-select" style={{ fontSize: '0.8125rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="APPLICATION">APPLICATION</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lead Source</label>
                <select className="form-select" style={{ fontSize: '0.8125rem' }} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                  <option value="ALL">All Sources</option>
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Reference">Reference / Referral</option>
                  <option value="Educational Fair">Educational Fair</option>
                  <option value="Direct">Direct</option>
                  <option value="Campaign">Campaign</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assigned Counsellor</label>
                <select className="form-select" style={{ fontSize: '0.8125rem' }} value={filterCounsellor} onChange={e => setFilterCounsellor(e.target.value)}>
                  <option value="ALL">All Counsellors</option>
                  {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Showing <strong>{filteredLeads.length}</strong> matching prospective leads</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setSearchTerm('');
                  setFilterInstitute('ALL');
                  setFilterDepartment('ALL');
                  setFilterProgram('ALL');
                  setFilterAcademicYear('ALL');
                  setFilterStatus('ALL');
                  setFilterSource('ALL');
                  setFilterCounsellor('ALL');
                  setFilterDate('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Lead ID</th>
                    <th>Student Name</th>
                    <th>Contact Details</th>
                    <th>Interested Program</th>
                    <th>Academic Year</th>
                    <th>Source</th>
                    <th>Counsellor</th>
                    <th>Status</th>
                    <th>Follow-up Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No prospective leads match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map(lead => (
                      <tr key={lead.id}>
                        <td>
                          <strong>{lead.leadNumber || lead.id}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.createdAt}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{lead.name}</div>
                        </td>
                        <td>
                          <div>{lead.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{lead.programName || programs.find(p => p.id === lead.programId)?.name || 'B.Tech Program'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.instituteName || 'Swarrnim University'}</div>
                        </td>
                        <td>
                          <Badge variant="navy">{lead.academicYearName || '2025-2026'}</Badge>
                        </td>
                        <td>
                          <Badge variant="gold">{lead.source}</Badge>
                        </td>
                        <td>{lead.counsellorName}</td>
                        <td>
                          {canMutate() ? (
                            <select
                              className="form-select"
                              style={{ fontSize: '0.75rem', padding: '2px 6px', height: '28px', width: '120px' }}
                              value={lead.status}
                              onChange={e => handleQuickStatusChange(lead, e.target.value as LeadStatus)}
                            >
                              <option value="NEW">NEW</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="FOLLOW_UP">FOLLOW_UP</option>
                              <option value="APPLICATION">APPLICATION</option>
                              <option value="CONVERTED">CONVERTED</option>
                              <option value="LOST">LOST</option>
                            </select>
                          ) : (
                            getLeadStatusBadge(lead.status)
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                            <Calendar size={12} color="var(--text-muted)" />
                            <span>{lead.followUpDate || 'Not set'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-ghost btn-xs"
                              title="View Lead Details & Timeline"
                              onClick={() => handleOpenLeadDetails(lead)}
                            >
                              <Eye size={15} />
                            </button>
                            {canMutate() && (
                              <>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  title="Log Follow-up"
                                  onClick={() => handleOpenFollowUp(lead)}
                                >
                                  <MessageSquare size={15} color="#3B82F6" />
                                </button>
                                {lead.status !== 'CONVERTED' && lead.status !== 'APPLICATION' && (
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    title="Convert to Admission Application"
                                    onClick={() => handleConvertLeadToApplicant(lead)}
                                  >
                                    <CheckCircle size={15} color="#10B981" />
                                  </button>
                                )}
                                <button
                                  className="btn btn-ghost btn-xs"
                                  title="Edit Lead"
                                  onClick={() => handleOpenEditLead(lead)}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  title="Delete Lead"
                                  onClick={() => setDeletingLead(lead)}
                                >
                                  <Trash2 size={15} color="#EF4444" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMISSION APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '28px', fontSize: '0.8125rem' }}
                  placeholder="Search application no, name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: '180px', fontSize: '0.8125rem' }}
                value={appStatusFilter}
                onChange={e => setAppStatusFilter(e.target.value)}
              >
                <option value="ALL">All Application Statuses</option>
                <option value="APPLIED">APPLIED</option>
                <option value="DOCUMENT_VERIFICATION">DOCUMENT_VERIFICATION</option>
                <option value="SHORTLISTED">SHORTLISTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="CONVERTED">CONVERTED (ENROLLED)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {canMutate() && (
              <button className="btn btn-primary" onClick={() => setIsNewApplicationModalOpen(true)}>
                <Plus size={16} /> Direct Admission Application
              </button>
            )}
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Application No</th>
                    <th>Applicant Name</th>
                    <th>Contact</th>
                    <th>Program &amp; Department</th>
                    <th>Submitted On</th>
                    <th>Documents</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No admission applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map(app => (
                      <tr key={app.id}>
                        <td>
                          <strong>{app.applicationNumber || app.id}</strong>
                          {app.leadId && <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Converted from CRM</div>}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{app.applicantName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guardian: {app.guardianName || 'N/A'}</div>
                        </td>
                        <td>
                          <div>{app.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{programs.find(p => p.id === app.programId)?.name || 'B.Tech Program'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instituteName || 'Swarrnim University'}</div>
                        </td>
                        <td>{app.submittedAt}</td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {app.documents.filter(d => d.status === 'VERIFIED').length} / {app.documents.length} Verified
                          </span>
                        </td>
                        <td>{getAppStatusBadge(app.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleOpenReviewApplication(app)}
                            >
                              <CheckSquare size={14} /> Review / Docs
                            </button>
                            {app.status === 'APPROVED' && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handleConvertApplicationToStudent(app)}
                              >
                                <Award size={14} /> Enroll Student
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT ONBOARDING DESK */}
      {activeTab === 'ONBOARDING' && (
        <StudentOnboardingTab />
      )}

      {/* CREATE / EDIT LEAD MODAL */}
      {isLeadModalOpen && (
        <Modal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          title={selectedLead ? 'Edit Prospective Student Lead' : 'Register Prospective Student Inquiry'}
          subtitle="Capture applicant requirements, interested program, source channel, and assign counselling faculty"
          maxWidth="720px"
        >
          <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Lead Identification Number</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}
                  value={leadFormId}
                  readOnly
                />
              </div>

              <div>
                <label className="form-label">Applicant Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Sharma"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Contact Mobile Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={leadPhone}
                  onChange={e => setLeadPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="aarav.sharma@example.com"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Interested Institute</label>
                <select
                  className="form-select"
                  value={leadInstituteId}
                  onChange={e => setLeadInstituteId(e.target.value)}
                >
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Interested Program</label>
                <select
                  className="form-select"
                  value={leadProgramId}
                  onChange={e => setLeadProgramId(e.target.value)}
                >
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Academic Year</label>
                <select
                  className="form-select"
                  value={leadAcademicYearId}
                  onChange={e => setLeadAcademicYearId(e.target.value)}
                >
                  {academicYears.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Inquiry Source</label>
                <select
                  className="form-select"
                  value={leadSource}
                  onChange={e => setLeadSource(e.target.value as LeadSource)}
                >
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Reference">Reference / Referral</option>
                  <option value="Educational Fair">Educational Fair</option>
                  <option value="Direct">Direct</option>
                  <option value="Campaign">Campaign</option>
                </select>
              </div>

              <div>
                <label className="form-label">Assigned Counsellor</label>
                <select
                  className="form-select"
                  value={leadCounsellorId}
                  onChange={e => setLeadCounsellorId(e.target.value)}
                >
                  {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Current Pipeline Status</label>
                <select
                  className="form-select"
                  value={leadStatus}
                  onChange={e => setLeadStatus(e.target.value as LeadStatus)}
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="APPLICATION">APPLICATION</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div>
                <label className="form-label">Next Scheduled Follow-up Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={leadFollowUpDate}
                  onChange={e => setLeadFollowUpDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Initial Remarks &amp; Student Inquiries</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. Enquired for hostel facility, merit scholarship test, syllabus..."
                value={leadRemarks}
                onChange={e => setLeadRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsLeadModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {selectedLead ? 'Update Lead Record' : 'Save & Register Lead'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* LEAD DETAILS & TIMELINE MODAL */}
      {isLeadDetailModalOpen && selectedLead && (
        <Modal
          isOpen={isLeadDetailModalOpen}
          onClose={() => setIsLeadDetailModalOpen(false)}
          title={selectedLead.name}
          subtitle={`Lead ID: ${selectedLead.leadNumber || selectedLead.id} • Registered: ${selectedLead.createdAt}`}
          maxWidth="720px"
        >
          <div>
            {/* Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Interested Program: <strong>{selectedLead.programName || programs.find(p => p.id === selectedLead.programId)?.name || 'B.Tech Program'}</strong>
              </div>
              {getLeadStatusBadge(selectedLead.status)}
            </div>

            {/* Profile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</span>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedLead.phone}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email ID</span>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedLead.email || 'N/A'}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interested Institute</span>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedLead.instituteName || 'Swarrnim University'}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Counsellor</span>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedLead.counsellorName}</p>
              </div>
            </div>

            {/* Remarks Section */}
            {selectedLead.remarks && (
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Initial Inquiries &amp; Remarks</span>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>{selectedLead.remarks}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleOpenFollowUp(selectedLead)}>
                <MessageSquare size={15} /> Log Follow-up Note
              </button>
              {selectedLead.status !== 'CONVERTED' && selectedLead.status !== 'APPLICATION' && (
                <button className="btn btn-primary btn-sm" onClick={() => handleConvertLeadToApplicant(selectedLead)}>
                  <Award size={15} /> Convert to Admission Application
                </button>
              )}
            </div>

            {/* Follow-up Timeline */}
            <h4 style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
              Counselling &amp; Follow-up Activity History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
              {selectedLead.followUps && selectedLead.followUps.length > 0 ? (
                selectedLead.followUps.map(f => (
                  <div key={f.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--brand-navy)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{f.counsellorName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{f.notes}</p>
                    {f.nextFollowUpDate && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#3B82F6' }}>
                        Next Follow-up Date: {f.nextFollowUpDate}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No follow-up notes logged yet.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* LOG FOLLOW-UP MODAL */}
      {isFollowUpModalOpen && selectedLead && (
        <Modal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          title={`Log Follow-up Note: ${selectedLead.name}`}
          subtitle="Record counsellor interaction, parent discussion, fee queries and pipeline status update"
          maxWidth="560px"
        >
          <form onSubmit={handleAddFollowUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Discussion Notes &amp; Feedback *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Record counsellor interaction, parent discussion, fee inquiries..."
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Updated Pipeline Status</label>
                <select
                  className="form-select"
                  value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value as LeadStatus)}
                >
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="APPLICATION">APPLICATION</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div>
                <label className="form-label">Next Follow-up Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={followUpNextDate}
                  onChange={e => setFollowUpNextDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFollowUpModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Follow-up Note
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* REVIEW APPLICATION MODAL */}
      {isReviewApplicationModalOpen && selectedApplication && (
        <Modal
          isOpen={isReviewApplicationModalOpen}
          onClose={() => setIsReviewApplicationModalOpen(false)}
          title={`Review Application: ${selectedApplication.applicantName}`}
          subtitle={`Application No: ${selectedApplication.applicationNumber || selectedApplication.id}`}
          maxWidth="720px"
        >
          <div>
            {/* Document Verification Checklist */}
            <h4 style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
              Supporting Identity &amp; Academic Documents
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedApplication.documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={18} color="var(--brand-navy)" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{doc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {doc.status}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${doc.status === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleToggleDocVerification(selectedApplication, doc.id, true)}
                    >
                      <Check size={12} /> Verify
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${doc.status === 'REJECTED' ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleToggleDocVerification(selectedApplication, doc.id, false)}
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSaveApplicationReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Application Review Decision</label>
                <select
                  className="form-select"
                  value={appStatus}
                  onChange={e => setAppStatus(e.target.value as AdmissionApplicationStatus)}
                >
                  <option value="APPLIED">APPLIED</option>
                  <option value="DOCUMENT_VERIFICATION">DOCUMENT_VERIFICATION</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="APPROVED">APPROVED (Ready for Enrollment)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="form-label">Reviewer Comments / Remarks</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={appReviewerRemarks}
                  onChange={e => setAppReviewerRemarks(e.target.value)}
                  placeholder="Remarks on marksheet verification, fee clearance..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {appStatus === 'APPROVED' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleConvertApplicationToStudent(selectedApplication)}
                  >
                    <Award size={16} /> Enroll as Active Student
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsReviewApplicationModalOpen(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Review Decision
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* DIRECT ADMISSION APPLICATION MODAL */}
      {isNewApplicationModalOpen && (
        <Modal
          isOpen={isNewApplicationModalOpen}
          onClose={() => setIsNewApplicationModalOpen(false)}
          title="Direct Admission Application Form"
          subtitle="Register candidate without prior CRM inquiry and initiate document verification"
          maxWidth="720px"
        >
          <form onSubmit={handleDirectAdmissionApplicationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Applicant Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={appEmail}
                  onChange={e => setAppEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={appPhone}
                  onChange={e => setAppPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={appDob}
                  onChange={e => setAppDob(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Guardian Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={appGuardianName}
                  onChange={e => setAppGuardianName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Guardian Phone *</label>
                <input
                  type="text"
                  className="form-input"
                  value={appGuardianPhone}
                  onChange={e => setAppGuardianPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Target Institute</label>
                <select className="form-select" value={appInstId} onChange={e => setAppInstId(e.target.value)}>
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Target Program</label>
                <select className="form-select" value={appProgId} onChange={e => setAppProgId(e.target.value)}>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Target Batch</label>
                <select className="form-select" value={appBatchId} onChange={e => setAppBatchId(e.target.value)}>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsNewApplicationModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Direct Application
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE LEAD */}
      {deletingLead && (
        <ConfirmDialog
          isOpen={!!deletingLead}
          title="Delete Prospective Lead"
          message={`Are you sure you want to permanently delete lead record "${deletingLead.name}" (${deletingLead.leadNumber || deletingLead.id})?`}
          confirmLabel="Delete Lead"
          onConfirm={handleDeleteLeadConfirm}
          onClose={() => setDeletingLead(null)}
        />
      )}

      {/* ADMISSION DASHBOARD REPORT MODAL */}
      {isReportModalOpen && (
        <DashboardReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          dashboardType="ADMISSION"
        />
      )}
    </div>
  );
};
