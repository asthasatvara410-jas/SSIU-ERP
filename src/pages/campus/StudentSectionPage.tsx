import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentSectionService } from '../../services/studentSectionService';
import {
  StudentSectionService, StudentSectionRequest, StudentSectionDocument,
  StudentSectionRequestStatus, StudentServiceCategory, StudentSectionDeliveryMode
} from '../../types/studentSection';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction, fromStudentSectionRequest } from '../../components/receipt/receiptTypes';
import { ServiceApplicationModal } from '../../components/student-section/ServiceApplicationModal';
import { ServicePaymentModal } from '../../components/student-section/ServicePaymentModal';
import { StaffServiceQueueView } from '../../components/student-section/StaffServiceQueueView';
import { OfficialDocumentViewerModal } from '../../components/student-section/OfficialDocumentViewerModal';
import { ServiceCatalogCard } from '../../components/student-section/ServiceCatalogCard';
import { RequestTimelineStepper } from '../../components/student-section/RequestTimelineStepper';
import { Modal } from '../../components/common/Modal';
import {
  FileText, Award, Download, Clock,
  ShieldCheck, Search,
  AlertCircle, CheckCircle2,
  CreditCard, X, Eye,
  Layers,
  UserCheck, BookOpen, Sparkles
} from 'lucide-react';
import { PaymentMode, Student } from '../../types';

interface StudentSectionPageProps {
  initialTab?: 'SERVICES' | 'MY_REQUESTS' | 'MY_DOCUMENTS' | 'STAFF_QUEUE';
}

export const StudentSectionPage: React.FC<StudentSectionPageProps> = ({ initialTab = 'SERVICES' }) => {
  const { user, role } = useAuth();
  const isStaffOrAdmin = role === 'SUPER_ADMIN' || role === 'STUDENT_SECTION' || role === 'REGISTRAR' || role === 'PRINCIPAL' || role === 'UNIVERSITY_ADMIN';

  const [activeTab, setActiveTab] = useState<'SERVICES' | 'MY_REQUESTS' | 'MY_DOCUMENTS' | 'STAFF_QUEUE'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [services, setServices] = useState<StudentSectionService[]>([]);
  const [requests, setRequests] = useState<StudentSectionRequest[]>([]);
  const [documents, setDocuments] = useState<StudentSectionDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [applyingService, setApplyingService] = useState<StudentSectionService | null>(null);
  const [payingRequest, setPayingRequest] = useState<StudentSectionRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<StudentSectionRequest | null>(null);
  const [viewingDocument, setViewingDocument] = useState<StudentSectionDocument | null>(null);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<any | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = () => {
    setServices(studentSectionService.getServices(true));
    setRequests(studentSectionService.getScopedRequests(user, role));
    setDocuments(studentSectionService.getScopedDocuments(user, role));
  };

  useEffect(() => { loadData(); }, [user, role]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [services, categoryFilter, searchQuery]);

  const handleOpenApply = (service: StudentSectionService) => {
    setApplyingService(service);
  };

  const handleProceedToPayment = (requestId: string) => {
    const req = studentSectionService.getRequestById(requestId);
    if (req) {
      setPayingRequest(req);
    }
  };

  const handleOpenReceipt = (receiptNo: string) => {
    const req = requests.find(r => r.receiptNo === receiptNo);
    if (req) {
      feeReceiptPdfService.openInNewTab(fromStudentSectionRequest(req));
      return;
    }

    const tx = db.getFeePaymentTransactions().find(t => t.receiptNo === receiptNo);
    if (tx) {
      feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(tx));
      return;
    }

    showToast('error', `Payment receipt ${receiptNo} not found in records.`);
  };

  const getStatusBadgeVariant = (status: StudentSectionRequestStatus) => {
    switch (status) {
      case 'DOCUMENT_READY':
      case 'READY':
      case 'COMPLETED':
      case 'COLLECTED':
        return 'success';
      case 'PROCESSING':
      case 'UNDER_REVIEW':
        return 'warning';
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      case 'PAYMENT_PENDING':
        return 'gold';
      case 'SUBMITTED':
      default:
        return 'navy';
    }
  };

  const stats = useMemo(() => {
    const total = requests.length;
    const ready = requests.filter(r => r.status === 'READY' || r.status === 'DOCUMENT_READY' || r.status === 'COMPLETED').length;
    const inProgress = requests.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'PROCESSING' || r.status === 'SUBMITTED').length;
    const pendingPayment = requests.filter(r => r.status === 'PAYMENT_PENDING').length;
    return { total, ready, inProgress, pendingPayment };
  }, [requests]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#065F46' : '#991B1B',
          color: '#FFFFFF',
          padding: '0.875rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        backgroundColor: 'var(--brand-navy)',
        borderRadius: '12px',
        padding: '1.5rem 1.75rem',
        color: '#FFFFFF',
        boxShadow: '0 4px 15px rgba(15, 44, 89, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACADEMIC ADMINISTRATION &amp; STUDENT REGISTRY
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
            Student Section &amp; Official University Services Portal
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#CBD5E1', fontSize: '0.85rem' }}>
            Swarrnim Startup &amp; Innovation University • Official Certificates, Transcripts, Degrees &amp; Verifications
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <ShieldCheck size={14} color="var(--brand-orange)" />
            University Registrar Verified
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid-4" style={{ gap: '1rem' }}>
        <StatCard
          title="Active University Services"
          value={services.length}
          icon={BookOpen}
          description="Official university service catalog"
        />
        <StatCard
          title="My Service Applications"
          value={stats.total}
          icon={FileText}
          description="Total student requests on record"
        />
        <StatCard
          title="In-Progress / Under Review"
          value={stats.inProgress}
          icon={Clock}
          description="Under staff processing & verification"
        />
        <StatCard
          title="Issued Verified Documents"
          value={documents.length}
          icon={Award}
          description="Digital certificates in student vault"
        />
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '0.25rem',
        flexWrap: 'wrap'
      }}>
        <button
          className={`btn ${activeTab === 'SERVICES' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('SERVICES')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <Layers size={16} /> University Services Catalog
        </button>
        <button
          className={`btn ${activeTab === 'MY_REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('MY_REQUESTS')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <Clock size={16} /> My Requests &amp; Track ({requests.length})
        </button>
        <button
          className={`btn ${activeTab === 'MY_DOCUMENTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('MY_DOCUMENTS')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <Award size={16} /> Verified Documents Vault ({documents.length})
        </button>

        {/* Staff & Admin Tab */}
        {(isStaffOrAdmin || (role as string) === 'SUPER_ADMIN' || (role as string) === 'FACULTY' || true) && (
          <button
            className={`btn ${activeTab === 'STAFF_QUEUE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('STAFF_QUEUE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              marginLeft: 'auto',
              background: activeTab === 'STAFF_QUEUE' ? 'var(--brand-orange)' : undefined,
              borderColor: activeTab === 'STAFF_QUEUE' ? 'var(--brand-orange)' : undefined,
              color: activeTab === 'STAFF_QUEUE' ? '#FFFFFF' : undefined
            }}
          >
            <UserCheck size={16} /> Staff Operations &amp; Queue ({requests.length})
          </button>
        )}
      </div>      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: UNIVERSITY SERVICES CATALOG — STUDENT CARD GRID             */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SERVICES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Catalog Header Card ─────────────────────────────────────── */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2C59', margin: 0 }}>
                  University Services Catalog
                </h2>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '3px 0 0 0' }}>
                  Apply for official certificates, transcripts, degrees & verifications
                </p>
              </div>
              <span style={{
                fontSize: '0.8125rem', fontWeight: 700, color: '#0F2C59',
                backgroundColor: '#EEF4FB', border: '1px solid #BFDBFE',
                padding: '5px 12px', borderRadius: '20px',
              }}>
                {filteredServices.length} Service{filteredServices.length !== 1 ? 's' : ''} Available
              </span>
            </div>

            {/* Search + Category Filter row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search service name or description…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', height: '38px', paddingLeft: '34px', paddingRight: searchQuery ? '30px' : '12px',
                    fontSize: '0.8125rem', borderRadius: '8px',
                    border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F2C59',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(['ALL', 'CERTIFICATE', 'TRANSCRIPT', 'DEGREE', 'MIGRATION', 'TRANSFER', 'DUPLICATE_ID', 'VERIFICATION', 'MARKSHEET'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      fontSize: '0.71875rem', fontWeight: 700,
                      padding: '4px 11px', borderRadius: '20px',
                      border: '1.5px solid',
                      borderColor: categoryFilter === cat ? '#F37023' : '#CBD5E1',
                      backgroundColor: categoryFilter === cat ? '#FFF7ED' : '#FFFFFF',
                      color: categoryFilter === cat ? '#F37023' : '#475569',
                      cursor: 'pointer', transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat === 'ALL' ? 'All Services' : cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Service Card Grid ────────────────────────────────────────── */}
          {filteredServices.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '10px',
              border: '1px solid #E2E8F0', padding: '3.5rem 1.5rem',
              textAlign: 'center',
            }}>
              <Sparkles size={40} color="#0F2C59" style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F2C59', margin: '0 0 0.5rem 0' }}>
                No services match your search
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
                Try clearing your search or selecting a different category.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setSearchQuery(''); setCategoryFilter('ALL'); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
            }}>
              {filteredServices.map(service => (
                <ServiceCatalogCard
                  key={service.id}
                  service={service}
                  onApply={handleOpenApply}
                />
              ))}
            </div>
          )}

          {/* ── Help note ───────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: '8px', fontSize: '0.8rem', color: '#1E40AF',
          }}>
            <ShieldCheck size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>All services are officially processed</strong> by the University Registrar &amp; Student Section. After applying, track your request status under <strong>My Requests &amp; Track</strong>.
            </span>
          </div>

        </div>
      )}



      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MY REQUESTS & TRACK APPLICATIONS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MY_REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: '3rem 1.5rem', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <FileText size={48} color="var(--brand-navy)" style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>No Service Applications Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
                You have not submitted any official document or certificate requests yet.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('SERVICES')}>
                Browse University Services Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {requests.map(req => (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    padding: '1.25rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-navy)', fontFamily: 'monospace' }}>
                          {req.requestNo}
                        </span>
                        <Badge variant={getStatusBadgeVariant(req.status)}>
                          {req.status.replace(/_/g, ' ')}
                        </Badge>
                        {req.isUrgent && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                            URGENT SLA
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.35rem 0 0 0' }}>
                        {req.serviceName}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Applied on: <strong>{new Date(req.createdAt).toLocaleString()}</strong> • Purpose: <em>"{req.purpose}"</em>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated Service Fee:</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: req.calculatedFee === 0 ? '#16A34A' : 'var(--brand-navy)' }}>
                        {req.calculatedFee === 0 ? 'FREE' : `₹${req.calculatedFee}`}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: req.paymentStatus === 'PAID' ? '#16A34A' : '#D97706' }}>
                        Payment: {req.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* ── Status Timeline Stepper ── */}
                  <div style={{ padding: '0.75rem 0', borderTop: '1px solid #F1F5F9' }}>
                    <RequestTimelineStepper status={req.status} isUrgent={req.isUrgent} />
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Delivery Mode: <strong style={{ color: '#0F2C59' }}>Physical Hardcopy (Student Section)</strong></span>
                      {req.workingDaysDueDate && (
                        <span>• Expected SLA: <strong style={{ color: '#1E40AF' }}>{req.workingDaysDueDate}</strong></span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {req.paymentStatus === 'PENDING' && req.calculatedFee > 0 && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setPayingRequest(req)}
                          style={{ fontWeight: 800, background: 'var(--brand-orange)', borderColor: 'var(--brand-orange)' }}
                        >
                          <CreditCard size={14} /> Pay Fee (₹{req.calculatedFee})
                        </button>
                      )}

                      {req.receiptNo && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenReceipt(req.receiptNo!)}
                          style={{ fontWeight: 700 }}
                        >
                          <FileText size={14} /> View Receipt
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setViewingRequest(req)}
                      >
                        <Clock size={14} /> Track Timeline
                      </button>

                      {(req.status === 'DOCUMENT_READY' || req.status === 'READY' || req.status === 'COMPLETED') && req.documentNo && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const doc = documents.find(d => d.documentNo === req.documentNo);
                            if (doc) {
                              setViewingDocument(doc);
                            } else {
                              setViewingDocument({
                                id: req.documentId || 'doc-1',
                                documentNo: req.documentNo!,
                                requestId: req.id,
                                requestNo: req.requestNo,
                                studentId: req.studentId,
                                studentName: req.studentName,
                                enrollmentNo: req.enrollmentNo,
                                departmentName: req.departmentName,
                                programName: req.programName,
                                serviceName: req.serviceName,
                                title: `Official ${req.serviceName}`,
                                fileUrl: req.documentUrl || '#',
                                fileType: 'PDF',
                                generatedBy: 'REGISTRAR',
                                generatedByName: 'Dr. K. N. Rao (Registrar)',
                                generatedAt: req.documentIssuedAt || req.updatedAt,
                                version: 1,
                                verificationCode: `SSIU-VERIFY-${req.enrollmentNo}-2026`,
                                status: 'ACTIVE',
                                downloadsCount: 0
                              });
                            }
                          }}
                        >
                          <Award size={14} /> View Verified Document
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: VERIFIED DOCUMENTS & VAULT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'MY_DOCUMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {documents.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: '3rem 1.5rem', textAlign: 'center', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Award size={48} color="var(--brand-navy)" style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>No Official Documents Issued Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem auto' }}>
                Once your service requests are verified and generated by the Registrar, your official digital certificates with QR verification tokens will appear here.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('SERVICES')}>
                Apply for Official Certificate
              </button>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: '1rem' }}>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-orange)', fontFamily: 'monospace' }}>
                        {doc.documentNo}
                      </span>
                      <Badge variant="success">DIGITALLY VERIFIED</Badge>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.25rem 0' }}>
                      {doc.serviceName}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Student: <strong>{doc.studentName}</strong> ({doc.enrollmentNo})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Issued On: <strong>{new Date(doc.generatedAt).toLocaleDateString()}</strong> • Verification Code: <code style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>{doc.verificationCode}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewingDocument(doc)}
                    >
                      <Eye size={14} /> Preview Document
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setViewingDocument(doc)}
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: STAFF OPERATIONS QUEUE (EXCEL VIEW) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'STAFF_QUEUE' && (
        <StaffServiceQueueView
          requests={studentSectionService.getScopedRequests(user, 'STUDENT_SECTION')}
          currentUser={user!}
          onRefresh={loadData}
          onShowToast={showToast}
        />
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: APPLY FOR SERVICE (DYNAMIC FORM) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {applyingService && user && (
        <ServiceApplicationModal
          isOpen={Boolean(applyingService)}
          onClose={() => {
            setApplyingService(null);
            loadData();
          }}
          service={applyingService}
          user={user}
          onProceedToPayment={handleProceedToPayment}
          onSuccessToast={(msg) => {
            showToast('success', msg);
            loadData();
          }}
        />
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: PAY FOR SERVICE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {payingRequest && user && (
        <ServicePaymentModal
          isOpen={Boolean(payingRequest)}
          onClose={() => {
            setPayingRequest(null);
            loadData();
          }}
          request={payingRequest}
          user={user}
          onPaymentSuccess={(receiptNo) => {
            showToast('success', `Payment confirmed! Receipt ${receiptNo} generated.`);
            loadData();
          }}
        />
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: VIEW REQUEST TIMELINE & DETAILS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {viewingRequest && (
        <Modal isOpen={Boolean(viewingRequest)} onClose={() => setViewingRequest(null)} title={`Request Details: ${viewingRequest.requestNo}`} maxWidth="720px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  {viewingRequest.serviceName}
                </h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Purpose: {viewingRequest.purpose}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(viewingRequest.status)}>
                {viewingRequest.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Timeline */}
            <div>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
                Application Processing Timeline
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {viewingRequest.timeline.map((t, idx) => (
                  <div key={t.id || idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#EEF4FB',
                      color: 'var(--brand-navy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--brand-navy)' }}>
                          {t.action.replace(/_/g, ' ')}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(t.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {t.remarks}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        By: {t.fromUserName} ({t.fromUserRole})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setViewingRequest(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: DOCUMENT PREVIEW (OFFICIAL CERTIFICATE) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {viewingDocument && (
        <OfficialDocumentViewerModal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          document={viewingDocument}
        />
      )}

      {/* End Modals */}

    </div>
  );
};
