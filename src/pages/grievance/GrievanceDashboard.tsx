import React, { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, RefreshCw, Plus,
  FileText, Search, Lock, UserX, Eye, ArrowRight, Clock, Check, Send, AlertCircle,
  Copy, ExternalLink, Paperclip, Building, User, HelpCircle, Filter, Edit3, X,
  ShieldCheck, MessageSquare, ChevronRight, CheckSquare, Sparkles, Inbox, Download
} from 'lucide-react';
import {
  GrievanceApiService,
  GrievanceSummary,
  GrievanceCaseItem,
  TrackGrievanceResponse,
} from '../../services/grievanceApiService';

export type GrievanceTabKey =
  | 'OVERVIEW'
  | 'ANONYMOUS_FILE'
  | 'ANONYMOUS_TRACK'
  | 'AUTHORIZED_DESK'
  | 'MY_COMPLAINTS';

interface GrievanceDashboardProps {
  initialTab?: GrievanceTabKey;
}

export const GrievanceDashboard: React.FC<GrievanceDashboardProps> = ({ initialTab = 'OVERVIEW' }) => {
  const [summary, setSummary] = useState<GrievanceSummary | null>(null);
  const [adminCases, setAdminCases] = useState<GrievanceCaseItem[]>([]);
  const [myComplaints, setMyComplaints] = useState<GrievanceCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GrievanceTabKey>(initialTab);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Anonymous Filing Form State
  const [category, setCategory] = useState('ACADEMIC');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [allowContact, setAllowContact] = useState(false);
  const [optionalContactEmail, setOptionalContactEmail] = useState('');
  const [optionalContactPhone, setOptionalContactPhone] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState('PDF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Submission Result State
  const [submissionResult, setSubmissionResult] = useState<{
    caseNumber: string;
    trackingToken?: string;
    status: string;
    createdAt: string;
    message: string;
  } | null>(null);

  // Tracking Lookup State
  const [trackCaseNumber, setTrackCaseNumber] = useState('');
  const [trackToken, setTrackToken] = useState('');
  const [trackedCase, setTrackedCase] = useState<TrackGrievanceResponse | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Authorized Desk Filters & Modals
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCaseForAction, setSelectedCaseForAction] = useState<GrievanceCaseItem | null>(null);
  const [actionModalType, setActionModalType] = useState<'STATUS' | 'NOTE' | 'RESOLVE' | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<string>('UNDER_REVIEW');
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [internalNoteText, setInternalNoteText] = useState<string>('');
  const [resolutionSummaryText, setResolutionSummaryText] = useState<string>('');
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, admRes, myRes] = await Promise.all([
        GrievanceApiService.getDashboard(),
        GrievanceApiService.listAllGrievances(),
        GrievanceApiService.listMyComplaints(),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (admRes.success) setAdminCases(admRes.data);
      if (myRes.success) setMyComplaints(myRes.data);
    } catch {
      // Fallbacks handled in service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Handle Anonymous Submission
  const handleAnonymousSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setNotice({ type: 'error', message: 'Subject and detailed description are mandatory.' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      const res = await GrievanceApiService.submitAnonymousGrievance({
        category,
        type: 'ANONYMOUS',
        subject: subject.trim(),
        description: description.trim(),
        priority,
        department,
        incidentLocation: incidentLocation.trim() || undefined,
        incidentDate: incidentDate || undefined,
        optionalContactEmail: allowContact && optionalContactEmail.trim() ? optionalContactEmail.trim() : undefined,
        optionalContactPhone: allowContact && optionalContactPhone.trim() ? optionalContactPhone.trim() : undefined,
        attachmentName: attachmentName.trim() || undefined,
        attachmentType: attachmentName.trim() ? attachmentType : undefined,
      });

      if (res.success && res.data) {
        setSubmissionResult(res.data);
        setNotice({ type: 'success', message: 'Anonymous grievance filed securely with zero identity exposure.' });
        // Reset inputs
        setSubject('');
        setDescription('');
        setIncidentLocation('');
        setAttachmentName('');
        setOptionalContactEmail('');
        setOptionalContactPhone('');
        setAllowContact(false);
        await loadData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to submit anonymous grievance.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Anonymous Status Tracking Lookup
  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackCaseNumber.trim() || !trackToken.trim()) {
      setTrackError('Please provide both the Grievance Reference (GRV-...) and Tracking Token.');
      return;
    }

    setIsSearching(true);
    setTrackError(null);
    try {
      const res = await GrievanceApiService.trackAnonymous(trackCaseNumber.trim(), trackToken.trim());
      if (res.success && res.data) {
        setTrackedCase(res.data);
      } else {
        setTrackError('Invalid Grievance Reference or Tracking Token.');
      }
    } catch (err: any) {
      setTrackError(err.message || 'Unable to find grievance with provided reference and token.');
      setTrackedCase(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Execute Authorized Actions (Status, Note, Resolve)
  const handleExecuteAction = async () => {
    if (!selectedCaseForAction) return;
    setIsExecutingAction(true);
    setNotice(null);
    try {
      if (actionModalType === 'STATUS') {
        const res = await GrievanceApiService.updateCaseStatus(
          selectedCaseForAction.id,
          newStatusValue,
          actionRemarks.trim() || undefined
        );
        if (res.success) {
          setNotice({ type: 'success', message: `Case ${selectedCaseForAction.caseNumber} status updated to ${newStatusValue}.` });
        }
      } else if (actionModalType === 'NOTE') {
        if (!internalNoteText.trim()) {
          setNotice({ type: 'error', message: 'Internal note cannot be empty.' });
          setIsExecutingAction(false);
          return;
        }
        const res = await GrievanceApiService.addInternalNote(selectedCaseForAction.id, internalNoteText.trim());
        if (res.success) {
          setNotice({ type: 'success', message: `Internal note recorded on case ${selectedCaseForAction.caseNumber}.` });
        }
      } else if (actionModalType === 'RESOLVE') {
        if (!resolutionSummaryText.trim()) {
          setNotice({ type: 'error', message: 'Resolution summary is required.' });
          setIsExecutingAction(false);
          return;
        }
        const res = await GrievanceApiService.resolveCase(selectedCaseForAction.id, resolutionSummaryText.trim());
        if (res.success) {
          setNotice({ type: 'success', message: `Case ${selectedCaseForAction.caseNumber} resolved and closed.` });
        }
      }
      setActionModalType(null);
      setSelectedCaseForAction(null);
      setActionRemarks('');
      setInternalNoteText('');
      setResolutionSummaryText('');
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to execute administrative action.' });
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Filtered Admin Cases
  const filteredAdminCases = adminCases.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && c.category !== filterCategory) return false;
    if (filterType !== 'ALL' && c.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.caseNumber.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading Grievance & Student Safety Redressal engine...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" /> UGC Grievance Redressal • Anti-Ragging • ICC • NEP 2020 Compliance
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Student & Staff Grievance Redressal Desk</h1>
          <p className="text-slate-300 text-xs mt-1">
            Zero-retaliation grievance management with cryptographically tracked anonymous complaints, SLA auto-escalation, and privacy-shielded officer review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('ANONYMOUS_FILE'); setSubmissionResult(null); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <Plus className="w-4 h-4" /> File Anonymous Grievance
          </button>
          <button
            onClick={() => setActiveTab('ANONYMOUS_TRACK')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <Search className="w-4 h-4" /> Track Status
          </button>
        </div>
      </div>

      {/* Notice / Toast Banner */}
      {notice && (
        <div
          className={`rounded-xl p-4 flex items-center justify-between gap-3 text-xs border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : notice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-[11px] font-bold underline hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Grievances</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{summary.totalCases}</span>
              <span className="text-xs text-indigo-600 font-bold">({summary.anonymousCasesCount} Anonymous)</span>
            </div>
            <p className="text-[11px] text-slate-500">Across all faculties & institutes</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Open & In-Review</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">{summary.openCases}</span>
              <span className="text-xs text-amber-700 font-bold">Active Cases</span>
            </div>
            <p className="text-[11px] text-slate-500">Under inquiry by Grievance Cell</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Resolved Cases</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600">{summary.resolvedCases}</span>
              <span className="text-xs text-emerald-700 font-bold">Closed</span>
            </div>
            <p className="text-[11px] text-slate-500">Avg Resolution: {summary.averageResolutionDays} Days</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-600">{summary.slaComplianceRate}%</span>
              <span className="text-xs text-emerald-600 font-bold">UGC Target Met</span>
            </div>
            <p className="text-[11px] text-slate-500">7-Day Maximum Redressal SLA</p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overview & Policies
          </button>
          <button
            onClick={() => { setActiveTab('ANONYMOUS_FILE'); setSubmissionResult(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ANONYMOUS_FILE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-3.5 h-3.5" /> File Anonymous Grievance
          </button>
          <button
            onClick={() => setActiveTab('ANONYMOUS_TRACK')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ANONYMOUS_TRACK' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Anonymous Tracking
          </button>
          <button
            onClick={() => setActiveTab('AUTHORIZED_DESK')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'AUTHORIZED_DESK' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Grievance Officer Desk ({adminCases.length})
          </button>
          <button
            onClick={() => setActiveTab('MY_COMPLAINTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'MY_COMPLAINTS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Filed Cases ({myComplaints.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & POLICY                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                UGC & Institutional Zero-Retaliation Grievance Policy
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                SSIU enforces strict anonymity safeguards for student, faculty, and staff complaints in compliance with UGC (Grievance Redressal) Regulations.
                When submitting anonymously, no session token, user ID, student enrolment number, or identifying digital fingerprint is ever recorded in the grievance record.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    Cryptographic Case Identifier
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Each submission generates an unguessable Reference (GRV-YYYY-XXXXXX) + 32-character tracking token.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    7-Day Statutory SLA
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Complaints are automatically reviewed by the designated cell within 48 hours and redressed within 7 working days.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" /> Redressal Committees
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-white block">Students Grievance Redressal Cell (SGRC)</span>
                  <span className="text-[11px] text-slate-400">Head: Dean of Student Welfare</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-white block">Anti-Ragging Squad & Committee</span>
                  <span className="text-[11px] text-slate-400">24x7 Emergency Helpline Desk</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-white block">Internal Complaints Committee (ICC)</span>
                  <span className="text-[11px] text-slate-400">POSH Act 2013 Statutory Compliance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANONYMOUS GRIEVANCE SUBMISSION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'ANONYMOUS_FILE' && (
        <div className="space-y-6">
          {submissionResult ? (
            /* Confirmation Screen */
            <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-lg max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  Anonymous Grievance Registered
                </span>
                <h2 className="text-2xl font-bold text-slate-900">Your Identity is Protected</h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your grievance has been securely submitted into the university redressal queue.
                  Please save your <strong>Grievance Reference</strong> and <strong>Secret Tracking Token</strong> below to track status.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Grievance Reference Number
                  </label>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-indigo-700">
                    <span>{submissionResult.caseNumber}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(submissionResult.caseNumber);
                        setCopiedRef(true);
                        setTimeout(() => setCopiedRef(false), 2000);
                      }}
                      className="text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 text-xs"
                    >
                      {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copiedRef ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {submissionResult.trackingToken && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Secret Tracking Token (Keep Private)
                    </label>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-800 break-all">
                      <span>{submissionResult.trackingToken}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(submissionResult.trackingToken || '');
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 text-xs ml-2 flex-shrink-0"
                      >
                        {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copiedToken ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Important Note:</strong> Because this submission is completely anonymous, the university cannot email or look up your account.
                    You <em>must</em> save these credentials to check resolution updates.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setTrackCaseNumber(submissionResult.caseNumber);
                    setTrackToken(submissionResult.trackingToken || '');
                    setActiveTab('ANONYMOUS_TRACK');
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Search className="w-4 h-4" /> Go to Status Tracker
                </button>
                <button
                  onClick={() => setSubmissionResult(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  File Another Grievance
                </button>
              </div>
            </div>
          ) : (
            /* Filing Form */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  <UserX className="w-4 h-4" /> Anonymous Submission Channel
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Submit Confidential / Anonymous Grievance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your identity and account credentials will NOT be linked or revealed to grievance handlers.
                </p>
              </div>

              <form onSubmit={handleAnonymousSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Grievance Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ACADEMIC">Academic & Curriculum Issues</option>
                      <option value="EXAMINATION">Examinations & Grading</option>
                      <option value="FEES">Fees & Financial Aid</option>
                      <option value="FACILITY">Campus Facilities & Infrastructure</option>
                      <option value="HOSTEL">Hostel & Accommodation</option>
                      <option value="TRANSPORT">University Bus & Transport</option>
                      <option value="FACULTY">Faculty / Staff Conduct</option>
                      <option value="ANTI_RAGGING">Anti-Ragging Incident</option>
                      <option value="HARASSMENT">Harassment & Discrimination</option>
                      <option value="SAFETY">Campus Safety & Security</option>
                      <option value="OTHER">General Grievance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Urgency / Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low (General Query / Request)</option>
                      <option value="MEDIUM">Medium (Standard 7-Day Redressal)</option>
                      <option value="HIGH">High (Urgent Attention Required)</option>
                      <option value="CRITICAL">Critical (Immediate Action / Safety Hazard)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department / Branch Context</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Department of Computer Science & Engineering">Department of Computer Science & Engineering</option>
                      <option value="Department of Information Technology">Department of Information Technology</option>
                      <option value="Department of Mechanical Engineering">Department of Mechanical Engineering</option>
                      <option value="Department of Civil Engineering">Department of Civil Engineering</option>
                      <option value="Hostel Administration Cell">Hostel Administration Cell</option>
                      <option value="Examination Section">Examination Section</option>
                      <option value="Central Library">Central Library</option>
                      <option value="General University Campus">General University Campus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specific Incident Location / Room</label>
                    <input
                      type="text"
                      value={incidentLocation}
                      onChange={(e) => setIncidentLocation(e.target.value)}
                      placeholder="e.g. Block 3 Lab 204 or Boys Hostel 2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subject / Summary Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Concise summary of your grievance..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Detailed Grievance Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full details of the incident or concern. Avoid writing personal names if you wish to maintain complete anonymity..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  ></textarea>
                </div>

                {/* Optional Attachment Metadata */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>Supporting Evidence / Attachment (Optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      placeholder="Filename e.g. incident_photo.png or document.pdf"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={attachmentType}
                      onChange={(e) => setAttachmentType(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="PDF">PDF Document (.pdf)</option>
                      <option value="IMAGE">Image File (.png, .jpg)</option>
                      <option value="DOCX">Word Document (.docx)</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500">Max size 10MB. Executable formats are blocked automatically.</p>
                </div>

                {/* Optional Contact Opt-in */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowContact}
                      onChange={(e) => setAllowContact(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="font-bold text-indigo-950 text-xs">
                      Opt-in: Provide optional email/phone for follow-up notifications
                    </span>
                  </label>

                  {allowContact && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <input
                        type="email"
                        value={optionalContactEmail}
                        onChange={(e) => setOptionalContactEmail(e.target.value)}
                        placeholder="Optional contact email..."
                        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="tel"
                        value={optionalContactPhone}
                        onChange={(e) => setOptionalContactPhone(e.target.value)}
                        placeholder="Optional contact phone..."
                        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-indigo-800">
                    If provided, contact information is used solely for grievance resolution messages and never reveals your identity to staff.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
                  >
                    <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    {isSubmitting ? 'Submitting Anonymously...' : 'Submit Anonymous Grievance'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANONYMOUS STATUS TRACKING                                          */}
      {/* ========================================================================= */}
      {activeTab === 'ANONYMOUS_TRACK' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Search className="w-4 h-4" /> Anonymous Redressal Tracking
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Check Grievance Status</h2>
              <p className="text-xs text-slate-500">
                Enter your unique Grievance Reference number and Secret Tracking Token to view real-time status.
              </p>
            </div>

            <form onSubmit={handleTrackSearch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grievance Reference (GRV-...)</label>
                  <input
                    type="text"
                    required
                    value={trackCaseNumber}
                    onChange={(e) => setTrackCaseNumber(e.target.value)}
                    placeholder="e.g. GRV-2026-4FA89B"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secret Tracking Token</label>
                  <input
                    type="text"
                    required
                    value={trackToken}
                    onChange={(e) => setTrackToken(e.target.value)}
                    placeholder="Paste 32-character token..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {trackError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
                >
                  <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  {isSearching ? 'Searching...' : 'Track Grievance'}
                </button>
              </div>
            </form>
          </div>

          {/* Tracked Case Details */}
          {trackedCase && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {trackedCase.caseNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-600">Category: {trackedCase.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{trackedCase.subject}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  trackedCase.status === 'RESOLVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : trackedCase.status === 'UNDER_REVIEW' || trackedCase.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  Status: {trackedCase.status.replace(/_/g, ' ')}
                </span>
              </div>

              {trackedCase.resolutionSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Resolution Summary / Action Taken
                  </span>
                  <p className="text-xs text-emerald-800 leading-relaxed">{trackedCase.resolutionSummary}</p>
                </div>
              )}

              {/* Timeline Events Progression */}
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-900 block">Case Lifecycle Progression</span>
                <div className="space-y-3 border-l-2 border-indigo-200 pl-4 ml-2">
                  {(trackedCase.timeline || []).map((event, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                      <span className="text-xs font-bold text-slate-900 block">{event.title}</span>
                      <p className="text-[11px] text-slate-600">{event.details}</p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUTHORIZED GRIEVANCE MANAGEMENT DESK                               */}
      {/* ========================================================================= */}
      {activeTab === 'AUTHORIZED_DESK' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Status Filter</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Category</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                >
                  <option value="ALL">All Categories</option>
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="FACILITY">FACILITY</option>
                  <option value="HOSTEL">HOSTEL</option>
                  <option value="ANTI_RAGGING">ANTI_RAGGING</option>
                  <option value="HARASSMENT">HARASSMENT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Type</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                >
                  <option value="ALL">All Types</option>
                  <option value="ANONYMOUS">ANONYMOUS</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="IDENTIFIED">IDENTIFIED</option>
                </select>
              </div>
            </div>

            <div className="w-full sm:w-64">
              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Search Subject / Ref</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search complaints..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-3 px-4">Case Number</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Subject & Description</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Created Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAdminCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {c.caseNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.type === 'ANONYMOUS' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">{c.category}</td>
                      <td className="py-3 px-4 max-w-sm">
                        <span className="font-bold text-slate-900 block truncate">{c.subject}</span>
                        <span className="text-slate-500 text-[11px] truncate block">{c.description}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          c.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'RESOLVED' || c.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'UNDER_REVIEW' || c.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCaseForAction(c);
                              setNewStatusValue(c.status);
                              setActionModalType('STATUS');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition"
                            title="Update Status"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCaseForAction(c);
                              setActionModalType('NOTE');
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold transition"
                            title="Add Internal Note"
                          >
                            Note
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCaseForAction(c);
                              setActionModalType('RESOLVE');
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold transition"
                            title="Resolve Case"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MY COMPLAINTS (STUDENT VIEW)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'MY_COMPLAINTS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-indigo-600" />
                My Registered Grievance Cases
              </h2>
              <p className="text-xs text-slate-500">Cases submitted under your authenticated student account.</p>
            </div>
            <button
              onClick={() => setActiveTab('ANONYMOUS_FILE')}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              File New Case
            </button>
          </div>

          <div className="space-y-3">
            {myComplaints.map((c) => (
              <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-indigo-700">{c.caseNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {c.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">{c.subject}</h3>
                <p className="text-xs text-slate-600">{c.description}</p>
                {c.resolutionSummary && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-[11px] text-emerald-900">
                    <strong>Resolution:</strong> {c.resolutionSummary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTION MODAL (STATUS, NOTE, RESOLVE)                                      */}
      {/* ========================================================================= */}
      {actionModalType && selectedCaseForAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {actionModalType === 'STATUS' && 'Update Grievance Status'}
                  {actionModalType === 'NOTE' && 'Add Officer Internal Note'}
                  {actionModalType === 'RESOLVE' && 'Resolve & Close Grievance'}
                </h3>
              </div>
              <button
                onClick={() => setActionModalType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-indigo-700 font-mono block">{selectedCaseForAction.caseNumber}</span>
              <p className="text-slate-800 font-bold">{selectedCaseForAction.subject}</p>
              <span className="text-[11px] text-slate-500 block">Type: {selectedCaseForAction.type}</span>
            </div>

            {actionModalType === 'STATUS' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Workflow Status</label>
                  <select
                    value={newStatusValue}
                    onChange={(e) => setNewStatusValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="ACTION_REQUIRED">ACTION_REQUIRED</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Remarks / Public Note</label>
                  <textarea
                    rows={3}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Enter status transition details (visible in tracking timeline)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>
              </div>
            )}

            {actionModalType === 'NOTE' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Officer Internal Confidential Note</label>
                  <textarea
                    rows={4}
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="Internal investigation details, committee comments, or witness findings (hidden from complainant)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>
              </div>
            )}

            {actionModalType === 'RESOLVE' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Resolution Summary & Corrective Action</label>
                  <textarea
                    rows={4}
                    value={resolutionSummaryText}
                    onChange={(e) => setResolutionSummaryText(e.target.value)}
                    placeholder="Document the corrective actions taken to resolve this grievance..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isExecutingAction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Check className={`w-4 h-4 ${isExecutingAction ? 'animate-spin' : ''}`} />
                {isExecutingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
