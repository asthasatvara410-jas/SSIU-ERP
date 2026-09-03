import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentSectionService } from '../../services/studentSectionService';
import { documentMasterService } from '../../services/documentMasterService';
import { studentRequestService } from '../../services/studentRequestService';
import { StudentSectionRequest, StudentSectionRequestStatus, StudentSectionService } from '../../types/studentSection';
import { Student, StudentDocument } from '../../types';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { StudentProfileModal } from '../../components/profile/StudentProfileModal';
import { StudentRowActionMenu } from '../../components/common/StudentRowActionMenu';
import { 
  Users, FileText, CheckCircle2, Clock, Award, ShieldCheck, Download, 
  Eye, Search, Sparkles, Send, AlertCircle, RefreshCw, Printer, 
  CheckSquare, ArrowRight, XCircle, FileSpreadsheet, Lock, Unlock,
  CreditCard, IndianRupee, Globe, QrCode, Filter, UserCheck, ShieldAlert,
  Building2, BookOpen, MessageSquare, ChevronRight, HelpCircle, FolderCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

export type StudentSectionTabType = 
  | 'SERVICES'
  | 'STUDENTS'
  | 'DOCUMENTS'
  | 'REQUESTS'
  | 'FEES'
  | 'IDCARD'
  | 'ACADEMIC_RECORDS'
  | 'REPORTS';

export interface StudentSectionWorkspacePageProps {
  initialTab?: StudentSectionTabType;
  initialServiceCategory?: string;
}

export const StudentSectionWorkspacePage: React.FC<StudentSectionWorkspacePageProps> = ({ 
  initialTab = 'SERVICES',
  initialServiceCategory = 'ALL'
}) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<StudentSectionTabType>(initialTab);
  const [serviceSubFilter, setServiceSubFilter] = useState<string>(initialServiceCategory);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialServiceCategory) setServiceSubFilter(initialServiceCategory);
  }, [initialServiceCategory]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [studentTypeFilter, setStudentTypeFilter] = useState<'ALL' | 'DOMESTIC' | 'INTERNATIONAL'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modal States
  const [selectedReqForAction, setSelectedReqForAction] = useState<StudentSectionRequest | null>(null);
  const [newStatus, setNewStatus] = useState<StudentSectionRequestStatus>('PROCESSING');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Certificate / Document Generation Modal
  const [previewCertReq, setPreviewCertReq] = useState<StudentSectionRequest | null>(null);

  // Profile Modal State
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Request Routing Modal State
  const [selectedReqForRoute, setSelectedReqForRoute] = useState<any | null>(null);
  const [routeTargetOffice, setRouteTargetOffice] = useState<'ACCOUNTS' | 'EXAM_CELL' | 'HOSTEL_ADMIN' | 'TRANSPORT_ADMIN' | 'HOD' | 'PRINCIPAL'>('ACCOUNTS');
  const [routeReason, setRouteReason] = useState('');

  // Document Unlock Request Modal State
  const [selectedDocForUnlock, setSelectedDocForUnlock] = useState<StudentDocument | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  // ID Card Generation / Replacement State
  const [selectedStudentForIDCard, setSelectedStudentForIDCard] = useState<Student | null>(null);
  const [idCardActionType, setIdCardActionType] = useState<'GENERATE' | 'REPLACE' | 'BLOCK'>('GENERATE');
  const [idCardReason, setIdCardReason] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Resolve Institute-Scoped / Authorized Datasets
  const targetInstituteId = user?.instituteId || 'inst-1';
  const isUniversityWide = role === 'SUPER_ADMIN' || (user as any)?.isUniversityWide;

  const allStudents = useMemo(() => {
    const students = db.getStudents();
    if (isUniversityWide) return students;
    return students.filter(s => s.instituteId === targetInstituteId || targetInstituteId === 'inst-1');
  }, [targetInstituteId, isUniversityWide, refreshKey]);

  const allRequests = useMemo(() => {
    return db.getStudentSectionRequests();
  }, [refreshKey]);

  const allDocs = useMemo(() => {
    return db.getStudentDocuments();
  }, [refreshKey]);

  const allServices = useMemo(() => {
    return studentSectionService.getServices(false);
  }, [refreshKey]);

  const allCentralRequests = useMemo(() => {
    return (db.getState().studentRequests || []).filter(r => (r as any).currentOffice === 'STUDENT_SECTION' || r.category?.includes('CERTIFICATE') || isUniversityWide);
  }, [isUniversityWide, refreshKey]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const pendingReqs = allRequests.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'PROCESSING' || r.status === 'SUBMITTED');
    const pendingDocs = allDocs.filter(d => d.status === 'PENDING_VERIFICATION');
    const certReqs = allRequests.filter(r => r.serviceCode === 'BONAFIDE' || r.serviceCode === 'MIGRATION' || r.serviceCode === 'DEGREE');
    const transcriptReqs = allRequests.filter(r => r.serviceCode === 'TRANSCRIPT');
    const idCardReqs = allRequests.filter(r => r.serviceCode === 'ID_CARD_DUP');
    const pendingPayments = allRequests.filter(r => r.paymentStatus === 'PENDING');
    const completedReqs = allRequests.filter(r => r.status === 'COMPLETED');

    return {
      activeStudents: allStudents.filter(s => s.status === 'ACTIVE').length,
      pendingRequests: pendingReqs.length,
      pendingDocs: pendingDocs.length,
      certRequests: certReqs.length,
      transcriptRequests: transcriptReqs.length,
      idCardRequests: idCardReqs.length,
      pendingPayments: pendingPayments.length,
      completedRequests: completedReqs.length
    };
  }, [allStudents, allRequests, allDocs]);

  // Filtered Services List
  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (serviceSubFilter !== 'ALL') {
        if (serviceSubFilter === 'BONAFIDE' && req.serviceCode !== 'BONAFIDE') return false;
        if (serviceSubFilter === 'TRANSCRIPT' && req.serviceCode !== 'TRANSCRIPT') return false;
        if (serviceSubFilter === 'DEGREE' && req.serviceCode !== 'DEGREE') return false;
        if (serviceSubFilter === 'MIGRATION' && req.serviceCode !== 'MIGRATION') return false;
        if (serviceSubFilter === 'TRANSFER' && req.serviceCode !== 'TRANSFER') return false;
        if (serviceSubFilter === 'IDCARD' && req.serviceCode !== 'ID_CARD_DUP') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          req.studentName.toLowerCase().includes(q) ||
          req.enrollmentNo.toLowerCase().includes(q) ||
          req.requestNo.toLowerCase().includes(q) ||
          req.serviceName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRequests, statusFilter, serviceSubFilter, searchQuery]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      if (deptFilter !== 'ALL' && student.departmentId !== deptFilter) return false;
      if (studentTypeFilter === 'INTERNATIONAL' && !(student as any).isInternational) return false;
      if (studentTypeFilter === 'DOMESTIC' && (student as any).isInternational) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          student.name.toLowerCase().includes(q) ||
          student.enrollmentNo.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q) ||
          (student.phone && student.phone.includes(q))
        );
      }
      return true;
    });
  }, [allStudents, deptFilter, studentTypeFilter, searchQuery]);

  // Handle Request Status Update
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForAction || !user) return;

    if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
      setActionError('Please provide a mandatory reason for rejecting this application.');
      return;
    }

    setActionError(null);
    setActionLoading(true);

    try {
      studentSectionService.updateRequestStatus(
        selectedReqForAction.id,
        {
          status: newStatus,
          remarks: statusRemarks.trim() || undefined,
          rejectionReason: newStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
          trackingNumber: trackingNumber.trim() || undefined
        },
        user
      );

      setRefreshKey(k => k + 1);
      setSelectedReqForAction(null);
      showToast('success', `Request ${selectedReqForAction.requestNo} updated to ${newStatus}.`);
    } catch (err: any) {
      setActionError(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request Routing / Transfer
  const handleRouteRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForRoute || !routeReason.trim() || !user) return;

    try {
      db.updateEntity<any>('studentRequests', selectedReqForRoute.id, {
        currentOffice: routeTargetOffice,
        status: 'TRANSFERRED',
        transferHistory: [
          ...(selectedReqForRoute.transferHistory || []),
          {
            transferredBy: user.name,
            transferredFrom: 'STUDENT_SECTION',
            transferredTo: routeTargetOffice,
            transferredAt: new Date().toISOString(),
            reason: routeReason.trim()
          }
        ]
      }, `Transferred request to ${routeTargetOffice}`);

      setSelectedReqForRoute(null);
      setRouteReason('');
      setRefreshKey(k => k + 1);
      showToast('success', `Request routed to ${routeTargetOffice} successfully.`);
    } catch (err: any) {
      showToast('error', err.message || 'Routing failed.');
    }
  };

  // Handle Document Unlock Request
  const handleUnlockDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForUnlock || !unlockReason.trim() || !user) return;

    try {
      db.updateEntity<StudentDocument>('studentDocuments', selectedDocForUnlock.id, {
        isLocked: false,
        status: 'REJECTED',
        rejectionReason: `Unlocked by Student Section: ${unlockReason.trim()}`
      }, `Unlocked document with reason: ${unlockReason.trim()}`);

      setSelectedDocForUnlock(null);
      setUnlockReason('');
      setRefreshKey(k => k + 1);
      showToast('success', 'Document unlocked and flagged for student re-upload.');
    } catch (err: any) {
      showToast('error', err.message || 'Unlock failed.');
    }
  };

  // Handle ID Card Action
  const handleIDCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForIDCard || !user) return;

    try {
      if (idCardActionType === 'REPLACE') {
        db.updateEntity<any>('students', selectedStudentForIDCard.id, {
          idCardStatus: 'ACTIVE',
          idCardIssuedAt: new Date().toISOString().split('T')[0],
          idCardVersion: ((selectedStudentForIDCard as any).idCardVersion || 1) + 1
        }, `Issued replacement ID Card (Replaced previous version)`);
        showToast('success', `Replacement ID Card issued for ${selectedStudentForIDCard.name}. Old QR token invalidated.`);
      } else if (idCardActionType === 'BLOCK') {
        db.updateEntity<any>('students', selectedStudentForIDCard.id, {
          idCardStatus: 'BLOCKED'
        }, `Blocked ID Card: ${idCardReason}`);
        showToast('success', `ID Card for ${selectedStudentForIDCard.name} has been BLOCKED.`);
      } else {
        db.updateEntity<any>('students', selectedStudentForIDCard.id, {
          idCardStatus: 'ACTIVE',
          idCardIssuedAt: new Date().toISOString().split('T')[0]
        }, `Generated New ID Card`);
        showToast('success', `ID Card generated for ${selectedStudentForIDCard.name}.`);
      }

      setSelectedStudentForIDCard(null);
      setIdCardReason('');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      showToast('error', err.message || 'ID Card action failed.');
    }
  };

  // Export to Excel (.xlsx only)
  const exportSectionDataXLSX = (type: 'REQUESTS' | 'STUDENTS' | 'DOCUMENTS' | 'PAYMENTS') => {
    let rows: any[] = [];
    let filename = `Student_Section_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (type === 'REQUESTS') {
      rows = allRequests.map(r => ({
        'Request No': r.requestNo,
        'Student Name': r.studentName,
        'Enrollment': r.enrollmentNo,
        'Service': r.serviceName,
        'Category': r.category,
        'Applied Date': new Date(r.createdAt).toLocaleDateString(),
        'Fee': r.calculatedFee > 0 ? `₹${r.calculatedFee}` : 'Free',
        'Status': r.status,
        'Payment Status': r.paymentStatus,
        'Tracking No': r.trackingNumber || 'N/A'
      }));
    } else if (type === 'STUDENTS') {
      rows = allStudents.map(s => {
        const dept = db.getDepartmentById(s.departmentId);
        const prog = db.getProgramById(s.programId);
        return {
          'Student Name': s.name,
          'Enrollment No': s.enrollmentNo,
          'Department': dept?.name || 'CSE',
          'Program': prog?.code || 'B.Tech',
          'Student Type': (s as any).isInternational ? 'INTERNATIONAL' : 'DOMESTIC',
          'Status': s.status,
          'ID Card Status': (s as any).idCardStatus || 'ACTIVE',
          'Email': s.email,
          'Mobile': s.phone || '+91 98250 00000'
        };
      });
    } else if (type === 'DOCUMENTS') {
      rows = allDocs.map(d => {
        const student = allStudents.find(s => s.id === d.studentId);
        return {
          'Document Name': d.title,
          'Category': d.category,
          'Student Name': student?.name || 'Enrolled Student',
          'Enrollment': student?.enrollmentNo || 'ENR0000',
          'Status': d.status,
          'Locked in Vault': d.isLocked ? 'YES' : 'NO',
          'Verified By': d.verifiedBy || 'Pending',
          'Upload Date': d.uploadDate || 'N/A'
        };
      });
    } else {
      rows = allRequests.filter(r => r.paymentStatus === 'PAID').map(r => ({
        'Transaction ID': r.paymentTransactionId || 'TXN-0000',
        'Request No': r.requestNo,
        'Student Name': r.studentName,
        'Enrollment': r.enrollmentNo,
        'Service': r.serviceName,
        'Amount Paid': `₹${r.calculatedFee}`,
        'Payment Date': r.paidAt ? new Date(r.paidAt).toLocaleDateString() : 'N/A',
        'Receipt Available': 'YES'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
    showToast('success', `Exported ${type} to .xlsx successfully.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`, color: toast.type === 'success' ? '#10B981' : '#EF4444', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {toast.text}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge variant="gold">STUDENT ADMINISTRATIVE SERVICES</Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Official University Registry &amp; Student Section</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0 }}>
            Student Section Administrative Workspace
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Central student registry: Certificates, Transcripts, ID Cards, Document Verification Oversight, Service Payments &amp; Requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => exportSectionDataXLSX('REQUESTS')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileSpreadsheet size={15} color="#10B981" /> Export Requests (.xlsx)
          </button>
          <button onClick={() => exportSectionDataXLSX('STUDENTS')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileSpreadsheet size={15} color="#0EA5E9" /> Export Students (.xlsx)
          </button>
        </div>
      </div>

      {/* Top Stat Cards (Real DB Statistics) */}
      <div className="grid-4">
        <StatCard 
          title="Active Students" 
          value={stats.activeStudents} 
          subtitle="Enrolled Roster" 
          icon={Users} 
          colorScheme="navy" 
          onClick={() => setActiveTab('STUDENTS')}
        />
        <StatCard 
          title="Pending Requests" 
          value={stats.pendingRequests} 
          subtitle="Awaiting Section Action" 
          icon={Clock} 
          colorScheme={stats.pendingRequests > 0 ? 'orange' : 'green'} 
          onClick={() => setActiveTab('SERVICES')}
        />
        <StatCard 
          title="Certificates &amp; Transcripts" 
          value={stats.certRequests + stats.transcriptRequests} 
          subtitle={`${stats.certRequests} Certs • ${stats.transcriptRequests} Transcripts`} 
          icon={Award} 
          colorScheme="gold" 
          onClick={() => setActiveTab('SERVICES')}
        />
        <StatCard 
          title="Pending Documents" 
          value={stats.pendingDocs} 
          subtitle="Mentor Verification Oversight" 
          icon={FolderCheck} 
          colorScheme={stats.pendingDocs > 0 ? 'gold' : 'green'} 
          onClick={() => setActiveTab('DOCUMENTS')}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn btn-sm ${activeTab === 'SERVICES' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('SERVICES'); setServiceSubFilter('ALL'); }}
        >
          <FileText size={14} /> Student Services &amp; Certificates ({allRequests.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'STUDENTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('STUDENTS')}
        >
          <Users size={14} /> Student Records ({allStudents.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'DOCUMENTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('DOCUMENTS')}
        >
          <FolderCheck size={14} /> Document Oversight ({allDocs.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('REQUESTS')}
        >
          <MessageSquare size={14} /> Central Requests Desk ({allCentralRequests.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'FEES' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('FEES')}
        >
          <IndianRupee size={14} /> Service Fees &amp; Payments
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'IDCARD' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('IDCARD')}
        >
          <UserCheck size={14} /> ID Card Management
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'ACADEMIC_RECORDS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ACADEMIC_RECORDS')}
        >
          <BookOpen size={14} /> Academic Records View
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'REPORTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('REPORTS')}
        >
          <FileSpreadsheet size={14} /> Reports &amp; Downloads (.xlsx)
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: Student Services & Certificates Management
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'SERVICES' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Service Applications Queue ({filteredRequests.length})
              </h3>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'ALL' ? 'btn-navy' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('ALL')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  All ({allRequests.length})
                </button>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'BONAFIDE' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('BONAFIDE')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Bonafide
                </button>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'TRANSCRIPT' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('TRANSCRIPT')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Transcript
                </button>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'DEGREE' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('DEGREE')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Degree
                </button>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'MIGRATION' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('MIGRATION')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Migration
                </button>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'TRANSFER' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('TRANSFER')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Transfer
                </button>
                <button 
                  className={`btn btn-sm ${serviceSubFilter === 'IDCARD' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setServiceSubFilter('IDCARD')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Duplicate ID
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select className="form-select form-select-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
                <option value="ALL">All Statuses</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY">Ready for Issue</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <div style={{ position: 'relative', width: '220px' }}>
                <input 
                  className="form-control form-control-sm" 
                  placeholder="Search student / req no..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  style={{ paddingLeft: '1.8rem' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>No student service applications match the active filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Student Details</th>
                    <th>Service Type</th>
                    <th>Purpose / Details</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <code>{req.requestNo}</code>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{req.studentName}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{req.enrollmentNo}</code>
                      </td>
                      <td>
                        <strong>{req.serviceName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.category}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{req.purpose || 'Official student request'}</div>
                        {req.isUrgent && <Badge variant="danger">URGENT PROCESSING</Badge>}
                      </td>
                      <td>
                        {req.calculatedFee > 0 ? (
                          <Badge variant={req.paymentStatus === 'PAID' ? 'active' : 'warning'}>
                            {req.paymentStatus === 'PAID' ? `PAID (₹${req.calculatedFee})` : `PENDING (₹${req.calculatedFee})`}
                          </Badge>
                        ) : (
                          <Badge variant="navy">FREE SERVICE</Badge>
                        )}
                      </td>
                      <td>
                        <Badge variant={
                          req.status === 'COMPLETED' ? 'active' :
                          req.status === 'READY' ? 'gold' :
                          req.status === 'REJECTED' ? 'danger' : 'warning'
                        }>
                          {req.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {(req.status === 'READY' || req.status === 'COMPLETED') && (
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => setPreviewCertReq(req)}
                              title="Print / Preview Official Document"
                            >
                              <Printer size={13} /> Certificate
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedReqForAction(req);
                              setNewStatus(req.status === 'UNDER_REVIEW' ? 'PROCESSING' : req.status);
                              setStatusRemarks('');
                              setRejectionReason('');
                              setTrackingNumber(req.trackingNumber || '');
                              setActionError(null);
                            }}
                          >
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: Student Records Roster & Profile Inspector
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'STUDENTS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Authorized Student Directory ({filteredStudents.length})
              </h3>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button 
                  className={`btn btn-sm ${studentTypeFilter === 'ALL' ? 'btn-navy' : 'btn-outline'}`}
                  onClick={() => setStudentTypeFilter('ALL')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  All ({allStudents.length})
                </button>
                <button 
                  className={`btn btn-sm ${studentTypeFilter === 'DOMESTIC' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setStudentTypeFilter('DOMESTIC')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  Domestic
                </button>
                <button 
                  className={`btn btn-sm ${studentTypeFilter === 'INTERNATIONAL' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setStudentTypeFilter('INTERNATIONAL')}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  International 🌍
                </button>
              </div>
            </div>

            <div style={{ position: 'relative', width: '240px' }}>
              <input 
                className="form-control form-control-sm" 
                placeholder="Search by name, roll, email..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ paddingLeft: '1.8rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name &amp; Enrollment</th>
                  <th>Department &amp; Program</th>
                  <th>Category</th>
                  <th>ID Card Status</th>
                  <th>Document Status</th>
                  <th>Student Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const dept = db.getDepartmentById(student.departmentId);
                  const prog = db.getProgramById(student.programId);
                  const docs = db.getStudentAcademicDocumentsByStudentId(student.id);
                  const isAllVerified = docs.length > 0 && docs.every(d => d.status === 'VERIFIED');

                  return (
                    <tr key={student.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{student.name}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{student.enrollmentNo}</code>
                      </td>
                      <td>
                        <strong>{dept?.code || 'CSE'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prog?.code || 'B.Tech'}</div>
                      </td>
                      <td>
                        <Badge variant={(student as any).isInternational ? 'gold' : 'navy'}>
                          {(student as any).isInternational ? '🌍 INTERNATIONAL' : 'DOMESTIC'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={(student as any).idCardStatus === 'BLOCKED' ? 'danger' : 'active'}>
                          {(student as any).idCardStatus || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={isAllVerified ? 'active' : docs.filter(d => d.status === 'VERIFIED').length > 0 ? 'warning' : 'danger'}>
                          {isAllVerified ? 'LOCKED IN VAULT' : `${docs.filter(d => d.status === 'VERIFIED').length}/${docs.length} Verified`}
                        </Badge>
                      </td>
                      <td>
                        {student.status === 'ACTIVE' ? (
                          <Badge variant="active">ACTIVE</Badge>
                        ) : (student.status as string) === 'WARNING' ? (
                          <Badge variant="warning">WARNING</Badge>
                        ) : (
                          <Badge variant="danger">{student.status || 'INACTIVE'}</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                        <StudentRowActionMenu 
                          student={student}
                          statusLevel={!isAllVerified || (student as any).idCardStatus === 'BLOCKED' ? 'warning' : 'good'}
                          onViewProfile={() => setSelectedStudentForProfile(student)}
                          onViewAcademic={() => setSelectedStudentForProfile(student)}
                          onViewAttendance={() => setSelectedStudentForProfile(student)}
                          onViewDocuments={() => setSelectedStudentForProfile(student)}
                          onViewExamination={() => setSelectedStudentForProfile(student)}
                          onViewRequests={() => setSelectedStudentForProfile(student)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: Document Verification Oversight
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'DOCUMENTS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Document Verification Oversight Vault ({allDocs.length})
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Document vault locks records post-mentor verification. Exceptional unlocking requires formal audit reason.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => exportSectionDataXLSX('DOCUMENTS')}>
              <Download size={14} /> Download Document Audit (.xlsx)
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Student Candidate</th>
                  <th>Type &amp; Category</th>
                  <th>Mentor Verification</th>
                  <th>Vault Lock Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allDocs.map(doc => {
                  const student = allStudents.find(s => s.id === doc.studentId);
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{doc.title}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.category}</code>
                      </td>
                      <td>
                        <strong>{student?.name || 'Enrolled Student'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{student?.enrollmentNo}</div>
                      </td>
                      <td>
                        <Badge variant="navy">{doc.category}</Badge>
                      </td>
                      <td>
                        <Badge variant={doc.status === 'VERIFIED' ? 'active' : doc.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td>
                        {doc.isLocked ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#10B981', fontWeight: 700, fontSize: '0.8rem' }}>
                            <Lock size={13} /> LOCKED IN VAULT
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#F59E0B', fontWeight: 700, fontSize: '0.8rem' }}>
                            <Unlock size={13} /> UNLOCKED / PENDING
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {doc.isLocked ? (
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedDocForUnlock(doc);
                              setUnlockReason('');
                            }}
                            title="Exceptional Unlock Request"
                          >
                            <Unlock size={13} /> Request Unlock
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Editable by Student</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: Centralized Requests Routing Desk
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'REQUESTS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Centralized Student Requests &amp; Department Routing ({allCentralRequests.length})
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Re-route requests requiring Accounts, Examination, Hostel, Transport, or Academic Department processing.
              </p>
            </div>
          </div>

          {allCentralRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>No requests currently in Student Section routing queue.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Student</th>
                    <th>Category</th>
                    <th>Subject / Query</th>
                    <th>Current Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allCentralRequests.map((r: any) => (
                    <tr key={r.id}>
                      <td><code>{r.requestNo || r.id}</code></td>
                      <td>
                        <strong>{r.studentName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.enrollmentNo}</div>
                      </td>
                      <td><Badge variant="navy">{r.category || 'General'}</Badge></td>
                      <td>{r.subject || r.description}</td>
                      <td>
                        <Badge variant={r.status === 'RESOLVED' || r.status === 'APPROVED' ? 'active' : 'warning'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedReqForRoute(r);
                            setRouteReason('');
                          }}
                        >
                          <Send size={13} /> Route Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: Service Fees & Payment Configuration
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'FEES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Service Fee Configuration Master
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Configured fees for student administrative services. Fees integrate directly with the university fee ledger and student payment receipts.
            </p>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Service Name &amp; Code</th>
                    <th>Category</th>
                    <th>Standard Fee</th>
                    <th>Urgent Processing Fee</th>
                    <th>Delivery Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allServices.map(srv => (
                    <tr key={srv.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{srv.name}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{srv.code}</code>
                      </td>
                      <td><Badge variant="navy">{srv.category}</Badge></td>
                      <td>
                        <span style={{ fontWeight: 800, color: srv.fee > 0 ? 'var(--brand-navy)' : '#10B981' }}>
                          {srv.fee > 0 ? `₹${srv.fee}` : 'FREE'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: srv.urgentFee > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                          {srv.urgentFee > 0 ? `+ ₹${srv.urgentFee}` : 'N/A'}
                        </span>
                      </td>
                      <td>{srv.deliveryMode}</td>
                      <td>
                        <Badge variant={srv.isActive ? 'active' : 'inactive'}>
                          {srv.isActive ? 'ACTIVE' : 'DISABLED'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: ID Card Lifecycle Management
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'IDCARD' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Digital ID Card Lifecycle Register ({allStudents.length})
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Manage student digital ID cards, process replacement requests, and invalidate replaced card QR verification tokens.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name &amp; Enrollment</th>
                  <th>Department &amp; Program</th>
                  <th>ID Card Status</th>
                  <th>Version</th>
                  <th>Issued Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map(student => {
                  const dept = db.getDepartmentById(student.departmentId);
                  const prog = db.getProgramById(student.programId);
                  const idStatus = (student as any).idCardStatus || 'ACTIVE';
                  const idVer = (student as any).idCardVersion || 1;

                  return (
                    <tr key={student.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{student.name}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{student.enrollmentNo}</code>
                      </td>
                      <td>
                        <strong>{dept?.code || 'CSE'}</strong> • {prog?.code || 'B.Tech'}
                      </td>
                      <td>
                        <Badge variant={idStatus === 'ACTIVE' ? 'active' : idStatus === 'BLOCKED' ? 'danger' : 'warning'}>
                          {idStatus}
                        </Badge>
                      </td>
                      <td><strong>v{idVer}.0</strong></td>
                      <td>{(student as any).idCardIssuedAt || '2025-08-01'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedStudentForIDCard(student);
                              setIdCardActionType('REPLACE');
                              setIdCardReason('');
                            }}
                          >
                            Replace Card
                          </button>
                          {idStatus === 'ACTIVE' ? (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                setSelectedStudentForIDCard(student);
                                setIdCardActionType('BLOCK');
                                setIdCardReason('');
                              }}
                            >
                              Block
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setSelectedStudentForIDCard(student);
                                setIdCardActionType('GENERATE');
                                setIdCardReason('');
                              }}
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: Academic Records View
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ACADEMIC_RECORDS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
            Student Academic Records &amp; Completion Roster (Read-Only)
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Official semester performance records for transcript generation and degree eligibility checks. Modifications are strictly restricted to the Examination Office.
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Candidate</th>
                  <th>Current Semester</th>
                  <th>Cumulative CGPA</th>
                  <th>Active Backlogs</th>
                  <th>Degree Clearance</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map(student => {
                  const sem = db.getSemesterById(student.semesterId);
                  const isFinalSem = (sem?.number || 4) >= 8;

                  return (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{student.enrollmentNo}</div>
                      </td>
                      <td><strong>Semester {sem?.number || 4}</strong></td>
                      <td><span style={{ fontWeight: 800, color: '#10B981' }}>8.45 / 10.0</span></td>
                      <td><Badge variant="active">0 BACKLOGS</Badge></td>
                      <td>
                        <Badge variant={isFinalSem ? 'gold' : 'navy'}>
                          {isFinalSem ? 'ELIGIBLE FOR PROVISIONAL' : 'IN PROGRESS'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                        <StudentRowActionMenu 
                          student={student}
                          onViewProfile={() => setSelectedStudentForProfile(student)}
                          onViewAcademic={() => setSelectedStudentForProfile(student)}
                          onViewAttendance={() => setSelectedStudentForProfile(student)}
                          onViewDocuments={() => setSelectedStudentForProfile(student)}
                          onViewExamination={() => setSelectedStudentForProfile(student)}
                          onViewRequests={() => setSelectedStudentForProfile(student)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 8: Reports & Excel Downloads (.xlsx only)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
            Student Section Official Reports Generator (.xlsx)
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Generate institution-wide audits, service request registers, and document verification rosters strictly in Excel format.
          </p>

          <div className="grid-4" style={{ gap: '1rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Service Requests Report</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Complete ledger of certificate, transcript, and service requests.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => exportSectionDataXLSX('REQUESTS')}>
                <Download size={14} /> Download (.xlsx)
              </button>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Student Enrolment Register</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Domestic &amp; International student directory with admission status.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => exportSectionDataXLSX('STUDENTS')}>
                <Download size={14} /> Download (.xlsx)
              </button>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Document Vault Audit</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Verification status, vault lock records, and pending items.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => exportSectionDataXLSX('DOCUMENTS')}>
                <Download size={14} /> Download (.xlsx)
              </button>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Service Payments Ledger</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Reconciled transactions for administrative service fees.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => exportSectionDataXLSX('PAYMENTS')}>
                <Download size={14} /> Download (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Update Request Status) */}
      {selectedReqForAction && (
        <Modal 
          isOpen={!!selectedReqForAction} 
          onClose={() => setSelectedReqForAction(null)} 
          title={`Process Service Request: ${selectedReqForAction.requestNo}`}
        >
          <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Student:</strong> {selectedReqForAction.studentName} ({selectedReqForAction.enrollmentNo})</div>
              <div><strong>Service:</strong> {selectedReqForAction.serviceName}</div>
              <div><strong>Purpose:</strong> {selectedReqForAction.purpose}</div>
              <div><strong>Current Status:</strong> <Badge variant="navy">{selectedReqForAction.status}</Badge></div>
            </div>

            {actionError && (
              <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '6px', fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Status *</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value as any)}>
                <option value="PROCESSING">PROCESSING (Under Execution)</option>
                <option value="READY">READY (Ready for Dispatch / Collection)</option>
                <option value="COMPLETED">COMPLETED (Delivered to Student)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (More Info Needed)</option>
                <option value="REJECTED">REJECTED (Decline Application)</option>
              </select>
            </div>

            {newStatus === 'REJECTED' && (
              <div className="form-group">
                <label className="form-label">Mandatory Rejection Reason *</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="Explain why this request is being declined..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  required
                />
              </div>
            )}

            {(newStatus === 'READY' || newStatus === 'COMPLETED') && (
              <div className="form-group">
                <label className="form-label">Postal / Consignment Tracking Number (Optional)</label>
                <input 
                  className="form-control" 
                  placeholder="e.g. IN582910394IN"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Administrative Remarks</label>
              <textarea 
                className="form-control" 
                rows={2} 
                placeholder="Enter remarks visible to student..."
                value={statusRemarks}
                onChange={e => setStatusRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReqForAction(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Update & Notify Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Certificate / Document Printable Preview Modal */}
      {previewCertReq && (
        <Modal 
          isOpen={!!previewCertReq} 
          onClose={() => setPreviewCertReq(null)} 
          title={`Official Document: ${previewCertReq.serviceName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '2rem', border: '3px double var(--brand-navy)', borderRadius: '8px', backgroundColor: '#FAFAFA', color: '#1E293B', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-gold)', letterSpacing: '1px' }}>SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy)', margin: '0.5rem 0' }}>{previewCertReq.serviceName.toUpperCase()}</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Certificate Ref: <code>{previewCertReq.requestNo}</code> • Date: {new Date().toLocaleDateString()}</p>
              
              <hr style={{ margin: '1rem 0', borderColor: '#CBD5E1' }} />
              
              <p style={{ fontSize: '0.95rem', lineHeight: '1.7', textAlign: 'justify', margin: '1.5rem 0' }}>
                This is to certify that <strong>{previewCertReq.studentName}</strong>, bearing Enrollment Number <strong>{previewCertReq.enrollmentNo}</strong>, 
                is a bonafide student of Swarrnim Startup &amp; Innovation University. This document is officially issued by the University Student Section for the purpose of <em>"{previewCertReq.purpose}"</em>.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', border: '1px solid #CBD5E1', borderRadius: '4px', margin: '0 auto 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
                    <QrCode size={40} color="var(--brand-navy)" />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>QR Verified</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #1E293B', width: '160px', paddingTop: '0.25rem', fontWeight: 800, fontSize: '0.8rem' }}>
                    Registrar / Student Section
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Authorized Signatory</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setPreviewCertReq(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { window.print(); }}>
                <Printer size={15} /> Print Official Document
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Routing Modal */}
      {selectedReqForRoute && (
        <Modal 
          isOpen={!!selectedReqForRoute} 
          onClose={() => setSelectedReqForRoute(null)} 
          title="Route Request to University Department"
        >
          <form onSubmit={handleRouteRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Student:</strong> {selectedReqForRoute.studentName} ({selectedReqForRoute.enrollmentNo})</div>
              <div><strong>Query:</strong> {selectedReqForRoute.subject || selectedReqForRoute.description}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Office *</label>
              <select className="form-select" value={routeTargetOffice} onChange={e => setRouteTargetOffice(e.target.value as any)}>
                <option value="ACCOUNTS">Accounts / Finance Office</option>
                <option value="EXAM_CELL">Examination Section</option>
                <option value="HOSTEL_ADMIN">Hostel Administration</option>
                <option value="TRANSPORT_ADMIN">Transport Administration</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="PRINCIPAL">Head of Institute / Principal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transfer Reason / Routing Note *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Explain why this request is being routed..."
                value={routeReason}
                onChange={e => setRouteReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReqForRoute(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm Transfer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Exceptional Unlock Document Modal */}
      {selectedDocForUnlock && (
        <Modal 
          isOpen={!!selectedDocForUnlock} 
          onClose={() => setSelectedDocForUnlock(null)} 
          title={`Exceptional Unlock: ${selectedDocForUnlock.title}`}
        >
          <form onSubmit={handleUnlockDocSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: '#FEF2F2', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '0.85rem', color: '#991B1B' }}>
              <strong>Caution:</strong> This document was previously locked after mentor verification. Unlocking it allows the student to replace the file and triggers mandatory mentor re-verification.
            </div>

            <div className="form-group">
              <label className="form-label">Mandatory Audit Reason for Unlocking *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Enter justification for unlocking this verified record..."
                value={unlockReason}
                onChange={e => setUnlockReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedDocForUnlock(null)}>Cancel</button>
              <button type="submit" className="btn btn-danger">Unlock &amp; Require Re-upload</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ID Card Action Modal */}
      {selectedStudentForIDCard && (
        <Modal 
          isOpen={!!selectedStudentForIDCard} 
          onClose={() => setSelectedStudentForIDCard(null)} 
          title={`ID Card Action: ${selectedStudentForIDCard.name}`}
        >
          <form onSubmit={handleIDCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Student:</strong> {selectedStudentForIDCard.name} ({selectedStudentForIDCard.enrollmentNo})</div>
              <div><strong>Action:</strong> <Badge variant={idCardActionType === 'BLOCK' ? 'danger' : 'navy'}>{idCardActionType}</Badge></div>
            </div>

            {idCardActionType === 'REPLACE' && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Issuing a replacement card increments the card version and immediately invalidates the previous QR token.
              </div>
            )}

            {idCardActionType === 'BLOCK' && (
              <div className="form-group">
                <label className="form-label">Reason for Blocking *</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="e.g. Lost card reported, Disciplinary suspension..."
                  value={idCardReason}
                  onChange={e => setIdCardReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedStudentForIDCard(null)}>Cancel</button>
              <button type="submit" className={`btn ${idCardActionType === 'BLOCK' ? 'btn-danger' : 'btn-primary'}`}>
                Confirm {idCardActionType}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal isOpen={true} student={selectedStudentForProfile} onClose={() => setSelectedStudentForProfile(null)} />
      )}
    </div>
  );
};
