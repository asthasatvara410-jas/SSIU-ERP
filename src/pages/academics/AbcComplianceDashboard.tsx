import React, { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, CheckCircle2, XCircle, Search, RefreshCw,
  AlertTriangle, Users, FileText, ArrowUpRight, X, Filter, Check, Eye,
  Building2, GraduationCap, Calendar, BookOpen, Layers, Clock, Activity,
  ExternalLink, ArrowRight, ShieldAlert, Sparkles, CheckCircle, Database
} from 'lucide-react';
import { 
  AbcApiService, 
  AbcFoundationOverviewData, 
  AbcAdminStudentSummary 
} from '../../services/abcApiService';

export const AbcComplianceDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AbcFoundationOverviewData | null>(null);
  const [students, setStudents] = useState<AbcAdminStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRetrying, setIsRetrying] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Selected student for detail / verify modal
  const [selectedStudent, setSelectedStudent] = useState<AbcAdminStudentSummary | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkAbcIdInput, setLinkAbcIdInput] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, studentsRes] = await Promise.all([
        AbcApiService.getFoundationOverview(),
        AbcApiService.listAdminStudents(1, 100),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading ABC Foundation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetrySync = async () => {
    setIsRetrying(true);
    setNotice(null);
    try {
      const res = await AbcApiService.retrySync();
      setNotice({ type: 'success', message: res.message || 'Batch sync retry processed successfully.' });
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Batch retry executed.' });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      const res = await AbcApiService.verifyAbcId(selectedStudent.id, status, rejectionReason);
      setNotice({ type: 'success', message: res.message });
      setIsVerifyModalOpen(false);
      setRejectionReason('');
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Verification update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkAbcId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !linkAbcIdInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await AbcApiService.linkAbcId(selectedStudent.id, linkAbcIdInput.trim());
      setNotice({ type: 'success', message: res.message || 'ABC ID linked successfully.' });
      setIsLinkModalOpen(false);
      setLinkAbcIdInput('');
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to link ABC ID.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncStudent = async (studentId: string) => {
    setActionLoading(true);
    try {
      const res = await AbcApiService.syncCredits(studentId);
      setNotice({ type: 'success', message: res.message || 'DigiLocker synchronization completed.' });
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Sync failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.abcId && s.abcId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.abcIdStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const compliancePercentage = overview?.abcCompliance?.totalStudents 
    ? Math.round((overview.abcCompliance.verified / overview.abcCompliance.totalStudents) * 100)
    : 0;

  const scopeBadgeColor = 
    overview?.scope === 'UNIVERSITY' ? 'bg-purple-100 text-purple-800 border-purple-200' :
    overview?.scope === 'INSTITUTE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
    overview?.scope === 'DEPARTMENT' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
    'bg-indigo-100 text-indigo-800 border-indigo-200';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" /> Academic Bank of Credits • Stage 7.1 ABC Foundation
            {overview?.scope && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${scopeBadgeColor}`}>
                {overview.scope.replace('_', ' ')} SCOPE
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {overview?.scopeTitle || 'ABC Foundation & Institutional Governance'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {overview?.scopeSubtitle || 'Real-time synchronization across Academic Structure, Student Credit Ledgers, and National Academic Depository.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
              Live DB • {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {overview?.scope !== 'FACULTY_ASSIGNED' && overview?.scope !== 'STUDENT' && (
            <button
              onClick={handleRetrySync}
              disabled={isRetrying}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Syncing...' : 'Batch Sync Depository'}
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 border ${
          notice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : notice.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── SECTION 1: ABC FOUNDATION OVERVIEW KPI CARDS ─── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" /> Section 1: Foundation Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Authorized Cohort</span>
            <div className="text-2xl font-bold text-slate-900">{overview?.abcCompliance.totalStudents ?? 0}</div>
            <span className="text-[11px] text-indigo-600 font-medium">Students in Scope</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ABC Linked</span>
            <div className="text-2xl font-bold text-blue-600">{overview?.abcCompliance.abcLinked ?? 0}</div>
            <span className="text-[11px] text-blue-700 font-medium">National Portal IDs</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ABC Verified</span>
            <div className="text-2xl font-bold text-emerald-600">{overview?.abcCompliance.verified ?? 0}</div>
            <span className="text-[11px] text-emerald-700 font-medium">{compliancePercentage}% Compliance</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
            <div className="text-2xl font-bold text-amber-600">{overview?.abcCompliance.pending ?? 0}</div>
            <span className="text-[11px] text-amber-700 font-medium">Awaiting Action</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Credits</span>
            <div className="text-2xl font-bold text-purple-600">{overview?.creditLedger.earnedCredits ?? 0}</div>
            <span className="text-[11px] text-purple-700 font-medium">Earned NEP Credits</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Depository Syncs</span>
            <div className="text-2xl font-bold text-teal-600">{overview?.sync.successful ?? 0}</div>
            <span className="text-[11px] text-teal-700 font-medium">NAD Records Stored</span>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2 & SECTION 3: ACADEMIC STRUCTURE & ABC COMPLIANCE PROGRESS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2: ERP Academic Structure Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" /> Section 2: Academic Master Foundation
            </h3>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
              Live Database
            </span>
          </div>
          <p className="text-xs text-slate-500">
            SSIU ERP governance hierarchy backing ABC credit calculations and course offerings.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Institutes</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.institutes ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Departments</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.departments ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Programs</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.programs ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Courses/Subjects</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.subjects ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Academic Years</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.academicYears ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Batches</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.batches ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Semesters</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.semesters ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-medium">Universities</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{overview?.academicStructure.universities ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Section 3: ABC Compliance Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Section 3: Authorized ABC Compliance
            </h3>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
              {compliancePercentage}% Verified
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${compliancePercentage}%` }} 
              className="bg-emerald-500 transition-all duration-500" 
              title={`Verified: ${overview?.abcCompliance.verified}`}
            />
            <div 
              style={{ width: `${overview?.abcCompliance.totalStudents ? ((overview.abcCompliance.pending / overview.abcCompliance.totalStudents) * 100) : 0}%` }} 
              className="bg-amber-400 transition-all duration-500" 
              title={`Pending: ${overview?.abcCompliance.pending}`}
            />
            <div 
              style={{ width: `${overview?.abcCompliance.totalStudents ? ((overview.abcCompliance.rejected / overview.abcCompliance.totalStudents) * 100) : 0}%` }} 
              className="bg-rose-400 transition-all duration-500" 
              title={`Rejected: ${overview?.abcCompliance.rejected}`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-[11px] font-bold text-emerald-700 uppercase">Verified</div>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">{overview?.abcCompliance.verified ?? 0}</div>
              <div className="text-[10px] text-emerald-600">Locked & Audited</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="text-[11px] font-bold text-amber-700 uppercase">Pending</div>
              <div className="text-xl font-bold text-amber-900 mt-0.5">{overview?.abcCompliance.pending ?? 0}</div>
              <div className="text-[10px] text-amber-600">Verification Queue</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="text-[11px] font-bold text-rose-700 uppercase">Rejected</div>
              <div className="text-xl font-bold text-rose-900 mt-0.5">{overview?.abcCompliance.rejected ?? 0}</div>
              <div className="text-[10px] text-rose-600">Needs Correction</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase">Not Submitted</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{overview?.abcCompliance.notSubmitted ?? 0}</div>
              <div className="text-[10px] text-slate-500">Unlinked Profiles</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="text-[11px] font-bold text-blue-700 uppercase">Total Linked</div>
              <div className="text-xl font-bold text-blue-900 mt-0.5">{overview?.abcCompliance.abcLinked ?? 0}</div>
              <div className="text-[10px] text-blue-600">Active IDs</div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="text-[11px] font-bold text-purple-700 uppercase">Total in Scope</div>
              <div className="text-xl font-bold text-purple-900 mt-0.5">{overview?.abcCompliance.totalStudents ?? 0}</div>
              <div className="text-[10px] text-purple-600">Authorized Cohort</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 4, SECTION 5 & SECTION 6: CREDIT LEDGER, SYNC & AUDIT TRAIL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 4: Academic Credit Ledger */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" /> Section 4: Credit Ledger
          </h3>
          <p className="text-xs text-slate-500">
            Course credit evaluation under NEP 2020 multi-disciplinary curriculum guidelines.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Total Credit Transactions</span>
              <span className="font-bold text-slate-900">{overview?.creditLedger.totalTransactions ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
              <span className="text-emerald-800 font-medium">Earned Credits</span>
              <span className="font-bold text-emerald-900">{overview?.creditLedger.earnedCredits ?? 0} Credits</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs">
              <span className="text-amber-800 font-medium">In-Progress Credits</span>
              <span className="font-bold text-amber-900">{overview?.creditLedger.pendingCredits ?? 0} Credits</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs">
              <span className="text-rose-800 font-medium">Failed / Incomplete</span>
              <span className="font-bold text-rose-900">{overview?.creditLedger.rejectedCredits ?? 0} Credits</span>
            </div>
          </div>
        </div>

        {/* Section 5: DigiLocker / NAD Depository Sync Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" /> Section 5: NAD / DigiLocker Status
          </h3>
          <p className="text-xs text-slate-500">
            National Academic Depository synchronization health and audit logs.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Total Sync Attempts</span>
              <span className="font-bold text-slate-900">{overview?.sync.totalSyncRecords ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs">
              <span className="text-teal-800 font-medium">Successful Syncs</span>
              <span className="font-bold text-teal-900">{overview?.sync.successful ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs">
              <span className="text-amber-800 font-medium">Queued / Retrying</span>
              <span className="font-bold text-amber-900">{overview?.sync.pending ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Failed Attempts</span>
              <span className="font-bold text-rose-600">{overview?.sync.failed ?? 0}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            <strong>Depository Status:</strong> Stored safely in local ERP database. External DigiLocker NAD API adapter operates in compliant simulation mode.
          </div>
        </div>

        {/* Section 6: Real-time Audit & Activity Trail */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Section 6: Audit Activity Trail
          </h3>
          <p className="text-xs text-slate-500">
            Chronological log of recent ABC mutations and verification operations.
          </p>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {overview?.recentActivity && overview.recentActivity.length > 0 ? (
              overview.recentActivity.map((act) => (
                <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {act.operation}
                      </span>
                      <span className="font-mono text-slate-600">{act.abcId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    act.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity records found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 7: STUDENT ABC COMPLIANCE REGISTER ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Section 7: Student ABC Compliance Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-authorized student list for APAAR / ABC ID linking, mentor verification, and individual credit sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or ABC ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {(['ALL', 'VERIFIED', 'PENDING_VERIFICATION', 'REJECTED', 'NOT_SUBMITTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    statusFilter === st 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'PENDING_VERIFICATION' ? 'Pending' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Enrollment</th>
                <th className="py-3.5 px-4">Program & Batch</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">ABC ID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verified Info</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.firstName} {s.lastName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.enrollmentNo}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{s.batch?.program?.name || 'B.Tech in Computer Engineering'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.batch?.code || 'BATCH-2026-30'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{s.department?.name || 'Computer Engineering'}</td>
                    <td className="py-3.5 px-4">
                      {s.abcId ? (
                        <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                          {s.abcId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Linked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        s.abcIdStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.abcIdStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : s.abcIdStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {s.abcIdStatus === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                        {s.abcIdStatus === 'PENDING_VERIFICATION' && <Clock className="w-3 h-3" />}
                        {s.abcIdStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {s.abcIdStatus || 'NOT_SUBMITTED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {s.abcIdVerifiedAt ? (
                        <div>
                          <div>{new Date(s.abcIdVerifiedAt).toLocaleDateString()}</div>
                          {s.abcIdVerifiedByName && <div className="text-[10px] text-slate-400 font-medium">By {s.abcIdVerifiedByName}</div>}
                        </div>
                      ) : s.abcIdRejectionReason ? (
                        <div className="text-rose-600 text-[10px] max-w-[150px] truncate" title={s.abcIdRejectionReason}>
                          {s.abcIdRejectionReason}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {!s.abcId && (
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsLinkModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition"
                        >
                          Link ID
                        </button>
                      )}

                      {s.abcId && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setIsVerifyModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition"
                          >
                            Verify / Review
                          </button>
                          <button
                            onClick={() => handleSyncStudent(s.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition"
                          >
                            Sync
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    {loading ? 'Loading ABC compliance records...' : 'No student ABC records found in your authorized scope.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: VERIFY / REJECT ABC ID ─── */}
      {isVerifyModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">ABC ID Institutional Verification</h3>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrollment:</span>
                <span className="font-mono text-slate-900">{selectedStudent.enrollmentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ABC ID:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedStudent.abcId}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Rejection Reason (Required only if Rejecting):</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Name on national portal does not match university records"
                rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleVerify('REJECTED')}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
              >
                Reject ABC ID
              </button>
              <button
                onClick={() => handleVerify('VERIFIED')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: LINK ABC ID ─── */}
      {isLinkModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLinkAbcId} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Link National ABC ID</h3>
              <button type="button" onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrollment:</span>
                <span className="font-mono text-slate-900">{selectedStudent.enrollmentNo}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">12-Digit ABC ID (APAAR ID):</label>
              <input
                type="text"
                value={linkAbcIdInput}
                onChange={(e) => setLinkAbcIdInput(e.target.value)}
                placeholder="e.g. ABC-8940-12345 or 12 alphanumeric characters"
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Link & Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
