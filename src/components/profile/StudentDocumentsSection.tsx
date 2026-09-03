import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../../types';
import { db } from '../../services/db';
import { documentMasterService } from '../../services/documentMasterService';
import { useAuth } from '../../context/AuthContext';
import { fileStorage } from '../../services/fileStorage';
import { Badge } from '../common/Badge';
import {
  DocumentCategory,
  DocumentMasterItem,
  StudentAcademicDocumentItem,
  StudentDocumentVersionItem
} from '../../types/documentMaster';
import {
  FileText, Upload, Download, Eye, CheckCircle2, XCircle, AlertCircle,
  Lock, Unlock, RefreshCw, Trash2, Edit3, ShieldCheck, Check, AlertTriangle,
  Plus, Search, Filter, Globe, Clock, History, Calendar, Info
} from 'lucide-react';

interface StudentDocumentsSectionProps {
  student: Student;
  onRefresh?: () => void;
}

const CATEGORY_TABS: { id: DocumentCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'ACADEMIC', label: 'Academic' },
  { id: 'IDENTITY', label: 'Identity' },
  { id: 'ADMISSION', label: 'Admission' },
  { id: 'INTERNATIONAL_STUDENT', label: 'International' },
  { id: 'UNIVERSITY_RECORD', label: 'University Records' },
  { id: 'INTERNSHIP_TRAINING', label: 'Internship' },
  { id: 'MEDICAL', label: 'Medical' },
  { id: 'FINANCIAL_SCHOLARSHIP', label: 'Financial' },
  { id: 'COMPLETION_EXIT', label: 'Completion & Exit' },
  { id: 'OTHER', label: 'Other' }
];

export const StudentDocumentsSection: React.FC<StudentDocumentsSectionProps> = ({
  student,
  onRefresh
}) => {
  if (!student) return null;

  const { user, role } = useAuth();
  const isAdmin = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR' || role === 'STUDENT_SECTION' || role === 'PRINCIPAL' || role === 'HOD' || role === 'FACULTY';
  const isStudent = role === 'STUDENT';

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<DocumentCategory | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [uploadModalDoc, setUploadModalDoc] = useState<{ master: DocumentMasterItem; existingDoc?: StudentAcademicDocumentItem } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ master: DocumentMasterItem; doc: StudentAcademicDocumentItem } | null>(null);
  const [historyDoc, setHistoryDoc] = useState<{ master: DocumentMasterItem; doc: StudentAcademicDocumentItem; versions: StudentDocumentVersionItem[] } | null>(null);
  const [rejectModalDoc, setRejectModalDoc] = useState<StudentAcademicDocumentItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Upload modal inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [uploadRemarks, setUploadRemarks] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // ABC ID Submission / Verification State
  const [abcModalOpen, setAbcModalOpen] = useState(false);
  const [abcInput, setAbcInput] = useState(student.abcId || '');
  const [abcRemarksInput, setAbcRemarksInput] = useState(student.abcIdRemarks || '');
  const [abcError, setAbcError] = useState('');
  const [abcRejectModalOpen, setAbcRejectModalOpen] = useState(false);
  const [abcRejectionReason, setAbcRejectionReason] = useState('');

  // Handle ABC ID Input with auto 4-4-4 hyphenation
  const handleAbcInputChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    let formatted = raw;
    if (raw.length > 8) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    } else if (raw.length > 4) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    }
    setAbcInput(formatted);
    setAbcError('');
  };

  const handleSaveAbcId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = abcInput.replace(/\D/g, '');
    if (clean.length !== 12) {
      setAbcError('ABC ID must be exactly 12 digits (e.g. 1234-5678-9012).');
      return;
    }

    const res = db.updateStudentAbcId(student.id, abcInput, { remarks: abcRemarksInput });
    if (!res.success) {
      setAbcError(res.error || 'Failed to update ABC ID.');
      return;
    }

    setAbcModalOpen(false);
    setRefreshKey(k => k + 1);
    if (onRefresh) onRefresh();
  };

  const handleMentorVerifyAbcId = () => {
    const res = db.verifyStudentAbcId(student.id, user?.id || 'fac-1', user?.name || 'Faculty Mentor', role || 'FACULTY_MENTOR');
    if (!res.success) {
      alert(res.error || 'Verification failed.');
      return;
    }
    setRefreshKey(k => k + 1);
    if (onRefresh) onRefresh();
  };

  const handleMentorRejectAbcId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abcRejectionReason.trim()) {
      alert('Mandatory rejection reason required.');
      return;
    }

    const res = db.rejectStudentAbcId(student.id, user?.id || 'fac-1', user?.name || 'Faculty Mentor', role || 'FACULTY_MENTOR', abcRejectionReason.trim());
    if (!res.success) {
      alert(res.error || 'Rejection failed.');
      return;
    }
    setAbcRejectModalOpen(false);
    setAbcRejectionReason('');
    setRefreshKey(k => k + 1);
    if (onRefresh) onRefresh();
  };

  // Dynamic applicable document resolution
  const applicableItems = useMemo(() => {
    return documentMasterService.getApplicableDocumentsForStudent(student);
  }, [student, refreshKey]);

  // Determine whether student is international
  const isInternational = student.studentType === 'INTERNATIONAL' || 
    (student as any).isInternational === true || 
    (student.nationality && student.nationality.toUpperCase() !== 'INDIAN');

  // Filter available tabs based on international status
  const visibleTabs = useMemo(() => {
    if (!isInternational) {
      return CATEGORY_TABS.filter(t => t.id !== 'INTERNATIONAL_STUDENT');
    }
    return CATEGORY_TABS;
  }, [isInternational]);

  // Filter items based on search, tab, and status
  const filteredItems = useMemo(() => {
    return applicableItems.filter(item => {
      // Category Tab filter
      if (selectedCategoryTab !== 'ALL' && item.masterDoc.category !== selectedCategoryTab) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = item.masterDoc.name.toLowerCase().includes(q);
        const matchesCode = item.masterDoc.code.toLowerCase().includes(q);
        const matchesSubcat = item.masterDoc.subcategory ? item.masterDoc.subcategory.toLowerCase().includes(q) : false;
        const matchesFilename = item.uploadedDoc ? item.uploadedDoc.fileName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesSubcat && !matchesFilename) {
          return false;
        }
      }

      return true;
    });
  }, [applicableItems, selectedCategoryTab, filterStatus, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = applicableItems.length;
    const requiredTotal = applicableItems.filter(i => i.masterDoc.required === 'REQUIRED').length;
    const verified = applicableItems.filter(i => i.status === 'VERIFIED').length;
    const pending = applicableItems.filter(i => i.status === 'PENDING_VERIFICATION').length;
    const rejected = applicableItems.filter(i => i.status === 'REJECTED').length;
    const expired = applicableItems.filter(i => i.status === 'EXPIRED').length;
    const notUploaded = applicableItems.filter(i => i.status === 'NOT_UPLOADED').length;

    const progressPct = requiredTotal > 0 ? Math.round((verified / requiredTotal) * 100) : 0;

    return { total, requiredTotal, verified, pending, rejected, expired, notUploaded, progressPct };
  }, [applicableItems]);

  const handleOpenUploadModal = (master: DocumentMasterItem, existingDoc?: StudentAcademicDocumentItem) => {
    if (isStudent && existingDoc && (existingDoc.isLocked || existingDoc.status === 'VERIFIED')) {
      alert('🔒 This document is VERIFIED and PERMANENTLY LOCKED. Modification or replacement is not permitted.');
      return;
    }

    setUploadModalDoc({ master, existingDoc });
    setSelectedFile(null);
    setIssueDate(existingDoc?.issueDate ? existingDoc.issueDate.split('T')[0] : '');
    setExpiryDate(existingDoc?.expiryDate ? existingDoc.expiryDate.split('T')[0] : '');
    setUploadRemarks(existingDoc?.remarks || '');
    setErrorMsg('');
  };

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalDoc) return;

    const { master, existingDoc } = uploadModalDoc;

    if (!selectedFile && !existingDoc) {
      setErrorMsg('Please select a valid document file to upload.');
      return;
    }

    if (master.expiryRequired && !expiryDate) {
      setErrorMsg('Expiry date is mandatory for this document.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      let fileUrl = existingDoc ? existingDoc.fileUrl : '';
      let fileName = existingDoc ? existingDoc.fileName : '';
      let fileSize = existingDoc ? existingDoc.fileSize : '';
      let fileType = existingDoc ? existingDoc.fileType : 'application/pdf';

      if (selectedFile) {
        // Validate file type
        const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
        if (master.allowedFileTypes && master.allowedFileTypes.length > 0) {
          const isAllowed = master.allowedFileTypes.map(t => t.toLowerCase()).includes(ext);
          if (!isAllowed) {
            setErrorMsg(`Invalid file type (.${ext}). Allowed formats: ${master.allowedFileTypes.join(', ')}`);
            setUploading(false);
            return;
          }
        }

        // Validate max file size
        const sizeMb = selectedFile.size / (1024 * 1024);
        if (sizeMb > master.maxFileSize) {
          setErrorMsg(`File size (${sizeMb.toFixed(1)}MB) exceeds the maximum limit of ${master.maxFileSize}MB.`);
          setUploading(false);
          return;
        }

        fileUrl = await fileStorage.saveFile(selectedFile);
        fileName = selectedFile.name;
        fileSize = `${sizeMb.toFixed(2)} MB`;
        fileType = selectedFile.type || 'application/pdf';
      }

      documentMasterService.uploadStudentDocument({
        student,
        documentMasterId: master.id,
        fileName,
        fileSize,
        fileUrl,
        fileType,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        remarks: uploadRemarks
      });

      setRefreshKey(k => k + 1);
      setUploadModalDoc(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleAdminVerify = (doc: StudentAcademicDocumentItem) => {
    try {
      documentMasterService.verifyDocument({
        documentId: doc.id,
        verifierUserId: user?.id || 'admin',
        verifierName: user?.name || 'Authorized Verifier',
        verifierRole: role || 'FACULTY_MENTOR',
        remarks: `Approved and verified by ${user?.name || 'Mentor'} on ${new Date().toISOString().split('T')[0]}`
      });
      setRefreshKey(k => k + 1);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Verification failed: ' + err.message);
    }
  };

  const handleOpenAdminRejectModal = (doc: StudentAcademicDocumentItem) => {
    setRejectModalDoc(doc);
    setRejectionReasonInput(doc.rejectionReason || '');
  };

  const handleConfirmAdminReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalDoc || !rejectionReasonInput.trim()) {
      alert('Please provide a mandatory rejection reason.');
      return;
    }

    try {
      documentMasterService.rejectDocument({
        documentId: rejectModalDoc.id,
        verifierUserId: user?.id || 'admin',
        verifierName: user?.name || 'Authorized Verifier',
        verifierRole: role || 'FACULTY_MENTOR',
        rejectionReason: rejectionReasonInput.trim()
      });
      setRefreshKey(k => k + 1);
      setRejectModalDoc(null);
      setRejectionReasonInput('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    }
  };

  const handleDownload = (doc: StudentAcademicDocumentItem) => {
    if (!doc.fileUrl) {
      alert('Document file is unavailable.');
      return;
    }
    fileStorage.downloadFile(doc.fileUrl, doc.fileName || `${doc.documentName}.pdf`);
  };

  const getStatusBadge = (status: string, isLocked: boolean) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="active" icon={<Lock size={12} />}>VERIFIED &amp; LOCKED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" icon={<XCircle size={12} />}>REJECTED (RE-UPLOAD REQUIRED)</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="orange" icon={<Clock size={12} />}>PENDING VERIFICATION</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger" icon={<AlertTriangle size={12} />}>EXPIRED</Badge>;
      default:
        return <Badge variant="inactive"><AlertTriangle size={12} /> NOT UPLOADED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Vault Banner */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={24} color="#F37023" />
                Student Document Repository &amp; Compliance Vault
              </h3>
              {isInternational ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40">
                  <Globe className="w-3.5 h-3.5" /> International Student Profile
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Domestic Student Profile
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.84375rem', color: '#94A3B8', marginTop: '0.35rem' }}>
              Single centralized repository sourced dynamically from University Document Master for {student.name} ({student.enrollmentNo})
            </p>
          </div>

          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="btn btn-secondary btn-sm"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <RefreshCw size={14} /> Refresh Vault
          </button>
        </div>

        {/* Progress Metrics */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#E2E8F0' }}>
            <span>
              MANDATORY VERIFICATION: {stats.verified} / {stats.requiredTotal} VERIFIED
            </span>
            <span>{stats.progressPct}% COMPLETE</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, stats.progressPct)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #F37023 0%, #10B981 100%)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.85rem', fontSize: '0.78125rem', color: '#CBD5E1' }}>
            <span>📁 Total Applicable: <strong>{stats.total}</strong></span>
            <span>⭐ Required: <strong>{stats.requiredTotal}</strong></span>
            <span>🔒 Verified &amp; Locked: <strong style={{ color: '#10B981' }}>{stats.verified}</strong></span>
            <span>⏳ Pending: <strong style={{ color: '#F37023' }}>{stats.pending}</strong></span>
            {stats.rejected > 0 && <span>❌ Rejected: <strong style={{ color: '#EF4444' }}>{stats.rejected}</strong></span>}
            {stats.expired > 0 && <span>⚠️ Expired: <strong style={{ color: '#F87171' }}>{stats.expired}</strong></span>}
          </div>
        </div>
      </div>

      {/* ─── DEDICATED ACADEMIC BANK OF CREDITS (ABC) ID CARD ─────────────────── */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 dark:from-blue-950/60 dark:to-purple-950/50 rounded-2xl p-5 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-md relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-600/20 dark:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  DOC-ACA-ABC-ID
                </span>
                <h4 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  Academic Bank of Credits (ABC) ID
                </h4>
                {student.abcIdStatus === 'VERIFIED' ? (
                  <Badge variant="active" icon={<Lock size={12} />}>VERIFIED &amp; LOCKED</Badge>
                ) : student.abcIdStatus === 'REJECTED' ? (
                  <Badge variant="danger" icon={<XCircle size={12} />}>REJECTED (ACTION REQUIRED)</Badge>
                ) : student.abcIdStatus === 'PENDING_VERIFICATION' ? (
                  <Badge variant="orange" icon={<Clock size={12} />}>PENDING MENTOR VERIFICATION</Badge>
                ) : (
                  <Badge variant="inactive"><AlertTriangle size={12} /> NOT SUBMITTED</Badge>
                )}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300">
                Official 12-Digit DigiLocker / APAAR Academic Bank of Credits National Identifier. Required for all domestic &amp; international university students.
              </p>

              {/* ABC ID Number Display */}
              <div className="flex items-center gap-4 flex-wrap pt-1 text-xs">
                {student.abcId ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-gray-900/70 border border-indigo-300 dark:border-indigo-800">
                    <span className="text-gray-500 dark:text-gray-400">ABC ID:</span>
                    <span className="font-mono font-bold text-sm text-indigo-700 dark:text-indigo-300 tracking-wider">
                      {student.abcId}
                    </span>
                  </div>
                ) : (
                  <div className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    No ABC ID submitted yet. Please submit your 12-digit number.
                  </div>
                )}

                {student.abcIdStatus === 'VERIFIED' && student.abcIdVerifiedByName && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified by Mentor {student.abcIdVerifiedByName} on {student.abcIdVerifiedAt ? new Date(student.abcIdVerifiedAt).toLocaleDateString() : 'Verified'}
                  </span>
                )}
              </div>

              {/* Rejection Alert */}
              {student.abcIdStatus === 'REJECTED' && student.abcIdRejectionReason && (
                <div className="mt-2.5 p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Mentor Rejection Reason:
                  </div>
                  <p className="mt-0.5 font-medium">{student.abcIdRejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* ABC ID Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap md:flex-nowrap">
            {/* Student Action: Add / Update ABC ID */}
            {student.abcIdStatus !== 'VERIFIED' ? (
              <button
                onClick={() => {
                  setAbcInput(student.abcId || '');
                  setAbcRemarksInput(student.abcIdRemarks || '');
                  setAbcError('');
                  setAbcModalOpen(true);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  student.abcIdStatus === 'REJECTED'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : student.abcId
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {student.abcIdStatus === 'REJECTED'
                  ? 'Correct & Resubmit ABC ID'
                  : student.abcId
                  ? 'Update ABC ID'
                  : 'Add ABC ID'}
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Locked (Verified)
              </div>
            )}

            {/* Mentor / Faculty Verifier Actions */}
            {isAdmin && student.abcId && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-300 dark:border-gray-700">
                {student.abcIdStatus !== 'VERIFIED' && (
                  <button
                    onClick={handleMentorVerifyAbcId}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
                    title="Verify and Lock ABC ID"
                  >
                    <Check className="w-4 h-4" />
                    Verify ABC ID
                  </button>
                )}

                {student.abcIdStatus !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      setAbcRejectionReason(student.abcIdRejectionReason || '');
                      setAbcRejectModalOpen(true);
                    }}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition flex items-center gap-1"
                    title="Reject ABC ID with reason"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategoryTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              selectedCategoryTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search document name, code, subcategory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified &amp; Locked</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="REJECTED">Rejected (Action Required)</option>
            <option value="EXPIRED">Expired</option>
            <option value="NOT_UPLOADED">Not Uploaded</option>
          </select>
        </div>
      </div>

      {/* Dynamic Document Cards List */}
      <div className="space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No applicable documents found</p>
            <p className="text-xs text-gray-400 mt-0.5">Try selecting another category tab or clearing search filters.</p>
          </div>
        ) : (
          filteredItems.map(({ masterDoc, uploadedDoc, status, isLocked, isExpired, isExpiringSoon, versions }, idx) => {
            const isVerified = status === 'VERIFIED';
            const isRejected = status === 'REJECTED';
            const isPending = status === 'PENDING_VERIFICATION';
            const canStudentUpload = !isStudent || !isLocked;

            return (
              <div
                key={masterDoc.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                style={{
                  borderLeft: isVerified
                    ? '4px solid #10B981'
                    : isRejected
                    ? '4px solid #EF4444'
                    : isExpired
                    ? '4px solid #DC2626'
                    : isPending
                    ? '4px solid #F37023'
                    : '4px solid #CBD5E1'
                }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                        {masterDoc.code}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {masterDoc.name}
                      </h4>
                      {masterDoc.required === 'REQUIRED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                          MANDATORY
                        </span>
                      )}
                      {masterDoc.internationalOnly && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> INTL
                        </span>
                      )}
                      {getStatusBadge(status, isLocked)}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {masterDoc.description || 'Official student document as per SSIU Document Master guidelines.'}
                    </p>

                    {/* Metadata Specs */}
                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                      <span>Category: <strong className="text-gray-700 dark:text-gray-300">{masterDoc.category}</strong></span>
                      {masterDoc.subcategory && (
                        <span>Subcategory: <strong className="text-gray-700 dark:text-gray-300">{masterDoc.subcategory.replace(/_/g, ' ')}</strong></span>
                      )}
                      <span>Verified By: <strong className="text-indigo-600 dark:text-indigo-400">{masterDoc.verifiedByRole.replace(/_/g, ' ')}</strong></span>
                      <span>Allowed: <strong className="text-gray-700 dark:text-gray-300">{masterDoc.allowedFileTypes.join(', ').toUpperCase()} ({masterDoc.maxFileSize}MB)</strong></span>
                    </div>

                    {/* Current Uploaded Details */}
                    {uploadedDoc && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5 text-gray-700 dark:text-gray-300">
                        <span>📄 File: <strong>{uploadedDoc.fileName}</strong> ({uploadedDoc.fileSize})</span>
                        <span>🔢 Version: <strong className="text-indigo-600 dark:text-indigo-400">v{uploadedDoc.currentVersion}</strong></span>
                        <span>📅 Uploaded: <strong>{uploadedDoc.updatedAt.split('T')[0]}</strong></span>
                        {uploadedDoc.expiryDate && (
                          <span className={isExpired ? 'text-rose-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-bold' : ''}>
                            ⏰ Valid Until: <strong>{uploadedDoc.expiryDate.split('T')[0]}</strong> {isExpired && '(EXPIRED)'} {isExpiringSoon && '(EXPIRING SOON)'}
                          </span>
                        )}
                        {uploadedDoc.verifiedByName && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            ✔️ Verified by: {uploadedDoc.verifiedByName} on {uploadedDoc.verifiedAt?.split('T')[0]}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rejection Alert Banner */}
                    {isRejected && uploadedDoc && uploadedDoc.rejectionReason && (
                      <div className="mt-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Rejection Reason (Action Required):
                        </div>
                        <p className="pl-5.5 font-medium">{uploadedDoc.rejectionReason}</p>
                        <p className="pl-5.5 text-[11px] text-rose-600 dark:text-rose-400 pt-0.5">
                          💡 Please review the verifier notes, select a corrected file, and click <strong>"Re-upload Document"</strong>. Your new file will be submitted as <strong>Version {uploadedDoc.currentVersion + 1}</strong>.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Column */}
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0">
                    {/* View Preview */}
                    {uploadedDoc && (
                      <button
                        onClick={() => setPreviewDoc({ master: masterDoc, doc: uploadedDoc })}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1.5"
                        title="View / Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    )}

                    {/* Download */}
                    {uploadedDoc && (
                      <button
                        onClick={() => handleDownload(uploadedDoc)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1.5"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Version History */}
                    {uploadedDoc && versions && versions.length > 0 && (
                      <button
                        onClick={() => setHistoryDoc({ master: masterDoc, doc: uploadedDoc, versions })}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition flex items-center gap-1.5"
                        title="View Version History"
                      >
                        <History className="w-3.5 h-3.5" />
                        v{uploadedDoc.currentVersion} History
                      </button>
                    )}

                    {/* Upload / Re-upload button */}
                    {canStudentUpload ? (
                      <button
                        onClick={() => handleOpenUploadModal(masterDoc, uploadedDoc)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          uploadedDoc
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadedDoc ? 'Re-upload' : 'Upload'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 opacity-80 cursor-not-allowed flex items-center gap-1.5"
                        title="Document is verified and permanently locked by Admin"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        Locked
                      </button>
                    )}

                    {/* Verifier Controls for Faculty / Mentor / Admin */}
                    {isAdmin && uploadedDoc && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-gray-700">
                        {uploadedDoc.status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleAdminVerify(uploadedDoc)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1"
                            title="Verify and Lock Document"
                          >
                            <Check className="w-3.5 h-3.5" /> Verify &amp; Lock
                          </button>
                        )}

                        {uploadedDoc.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleOpenAdminRejectModal(uploadedDoc)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition flex items-center gap-1"
                            title="Reject Document with Reason"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* UPLOAD / RE-UPLOAD MODAL */}
      {uploadModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                {uploadModalDoc.existingDoc ? `Re-upload: ${uploadModalDoc.master.name}` : `Upload Document: ${uploadModalDoc.master.name}`}
              </h3>
              <button onClick={() => setUploadModalDoc(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveUpload} className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs space-y-1">
                <div className="text-gray-500">Document: <strong className="text-gray-800 dark:text-gray-200">{uploadModalDoc.master.name}</strong> ({uploadModalDoc.master.code})</div>
                <div className="text-gray-500">Allowed Formats: <strong className="text-gray-800 dark:text-gray-200">{uploadModalDoc.master.allowedFileTypes.join(', ').toUpperCase()}</strong></div>
                <div className="text-gray-500">Max Size: <strong className="text-gray-800 dark:text-gray-200">{uploadModalDoc.master.maxFileSize} MB</strong></div>
                {uploadModalDoc.existingDoc && (
                  <div className="text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                    ℹ️ Uploading will preserve Version {uploadModalDoc.existingDoc.currentVersion} in history and create Version {uploadModalDoc.existingDoc.currentVersion + 1}.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select File ({uploadModalDoc.master.allowedFileTypes.join(', ').toUpperCase()}) *
                </label>
                <input
                  type="file"
                  required={!uploadModalDoc.existingDoc}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {/* Expiry Date input if required */}
              {uploadModalDoc.master.expiryRequired && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={uploadRemarks}
                  onChange={(e) => setUploadRemarks(e.target.value)}
                  placeholder="Optional submission comments..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setUploadModalDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md disabled:opacity-50"
                >
                  {uploading ? 'Encrypting & Uploading...' : uploadModalDoc.existingDoc ? 'Submit New Version' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {historyDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Version History: {historyDoc.master.name}
              </h3>
              <button onClick={() => setHistoryDoc(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {/* Current Active Version */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                    Version {historyDoc.doc.currentVersion} (Current Active)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                    {historyDoc.doc.status}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-300">File: {historyDoc.doc.fileName} ({historyDoc.doc.fileSize})</div>
                <div className="text-gray-500 text-[11px]">Uploaded: {historyDoc.doc.updatedAt.split('T')[0]}</div>
              </div>

              {/* Archived Versions */}
              {historyDoc.versions.map((ver) => (
                <div key={ver.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      Version {ver.versionNumber} (Archived)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {ver.status}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">File: {ver.fileName} ({ver.fileSize})</div>
                  <div className="text-gray-500 text-[11px]">Archived On: {ver.uploadedAt.split('T')[0]}</div>
                  {ver.rejectionReason && (
                    <div className="text-[11px] text-rose-600 pt-0.5">
                      Rejection Reason: {ver.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setHistoryDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {previewDoc.master.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Code: {previewDoc.master.code} • Version {previewDoc.doc.currentVersion}
                </p>
              </div>
              {getStatusBadge(previewDoc.doc.status, previewDoc.doc.isLocked)}
            </div>

            <div className="w-full min-h-60 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-6 border border-gray-200 dark:border-gray-700">
              {previewDoc.doc.fileUrl && (previewDoc.doc.fileUrl.startsWith('http') || previewDoc.doc.fileUrl.startsWith('data:image')) ? (
                <img
                  src={previewDoc.doc.fileUrl}
                  alt={previewDoc.doc.documentName}
                  className="max-h-80 object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto text-indigo-400 mb-2" />
                  <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{previewDoc.doc.fileName}</div>
                  <div className="text-xs text-gray-400 mt-1">Digital SSIU Encrypted Document ({previewDoc.doc.fileSize})</div>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-xs space-y-1">
              <div><strong>Document Name:</strong> {previewDoc.doc.documentName}</div>
              <div><strong>File Name:</strong> {previewDoc.doc.fileName} ({previewDoc.doc.fileSize})</div>
              <div><strong>Upload Date:</strong> {previewDoc.doc.updatedAt.split('T')[0]}</div>
              {previewDoc.doc.expiryDate && (
                <div><strong>Expiry Date:</strong> {previewDoc.doc.expiryDate.split('T')[0]}</div>
              )}
              {previewDoc.doc.verifiedByName && (
                <div className="text-emerald-600"><strong>Verified By:</strong> {previewDoc.doc.verifiedByName} on {previewDoc.doc.verifiedAt?.split('T')[0]}</div>
              )}
              {previewDoc.doc.rejectionReason && (
                <div className="text-rose-600"><strong>Rejection Reason:</strong> {previewDoc.doc.rejectionReason}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewDoc.doc)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REJECT MODAL */}
      {rejectModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Reject Document: {rejectModalDoc.documentName}
            </h3>
            <p className="text-xs text-gray-500">
              State clear reasons for rejection. The student will be notified and required to re-upload.
            </p>

            <form onSubmit={handleConfirmAdminReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Scanned copy is illegible / Mismatch in marksheet details..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ABC ID SUBMISSION MODAL */}
      {abcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                {student.abcId ? 'Update ABC ID Number' : 'Submit Academic Bank of Credits (ABC) ID'}
              </h3>
              <button onClick={() => setAbcModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {abcError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
                {abcError}
              </div>
            )}

            <form onSubmit={handleSaveAbcId} className="space-y-4">
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-xl text-xs space-y-1 border border-indigo-200/60 dark:border-indigo-800/60">
                <div className="font-semibold text-indigo-800 dark:text-indigo-300">
                  ℹ️ 12-Digit Academic Identifier (DigiLocker / APAAR)
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Please enter your 12-digit ABC ID. Once submitted, your Mentor will verify the ID, and upon verification it will be permanently locked.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  12-Digit ABC ID Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1234-5678-9012"
                    value={abcInput}
                    onChange={(e) => handleAbcInputChange(e.target.value)}
                    maxLength={14}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-mono font-bold tracking-wider bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">
                    {abcInput.replace(/\D/g, '').length} / 12
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Format: 12 numeric digits (hyphens auto-formatted).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Submission Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={abcRemarksInput}
                  onChange={(e) => setAbcRemarksInput(e.target.value)}
                  placeholder="e.g. Generated from DigiLocker portal..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setAbcModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={abcInput.replace(/\D/g, '').length !== 12}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md disabled:opacity-50"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABC ID MENTOR REJECT MODAL */}
      {abcRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Reject ABC ID Submission
            </h3>
            <p className="text-xs text-gray-500">
              Provide a clear reason for rejecting student {student.name}'s ABC ID ({student.abcId}). The student will be notified and prompted to correct the ID.
            </p>

            <form onSubmit={handleMentorRejectAbcId} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={abcRejectionReason}
                  onChange={(e) => setAbcRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid ABC ID number or mismatch with DigiLocker records..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAbcRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
