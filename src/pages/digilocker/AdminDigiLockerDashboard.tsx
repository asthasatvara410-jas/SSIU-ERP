import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Search,
  Filter, Plus, Clock, ExternalLink, Award, FileText, CheckCircle,
  X, Building2, Layers, Activity, Lock, Radio, KeyRound
} from 'lucide-react';
import {
  DigiLockerApiService,
  DigiLockerOverviewData,
  DigiLockerAdminStudentSummary
} from '../../services/digilockerApiService';

export const AdminDigiLockerDashboard: React.FC = () => {
  const [overview, setOverview] = useState<DigiLockerOverviewData | null>(null);
  const [students, setStudents] = useState<DigiLockerAdminStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRetrying, setIsRetrying] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Selected student for document issuance
  const [selectedStudent, setSelectedStudent] = useState<DigiLockerAdminStudentSummary | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [docType, setDocType] = useState<'DEGREE' | 'MARKSHEET' | 'TRANSCRIPT' | 'PROVISIONAL' | 'MIGRATION'>('DEGREE');
  const [docNumber, setDocNumber] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, studentsRes] = await Promise.all([
        DigiLockerApiService.getOverview(),
        DigiLockerApiService.listAdminStudents(1, 100),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading DigiLocker overview.');
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
      const res = await DigiLockerApiService.retrySync();
      setNotice({ type: 'success', message: res.message || 'Batch sync retry processed successfully.' });
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Batch retry executed.' });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !docNumber.trim()) return;

    setIsIssuing(true);
    try {
      const res = await DigiLockerApiService.issueDocument(selectedStudent.id, docType, docNumber.trim());
      setNotice({ type: 'success', message: res.message });
      setIsIssueModalOpen(false);
      setDocNumber('');
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Document issuance failed.' });
    } finally {
      setIsIssuing(false);
    }
  };

  const filtered = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.connectionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scopeBadgeColor =
    overview?.scope === 'UNIVERSITY'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : overview?.scope === 'INSTITUTE'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : overview?.scope === 'DEPARTMENT'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-indigo-100 text-indigo-800 border-indigo-200';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> DigiLocker National Depository • Stage 7.2 Integration
            {overview?.scope && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${scopeBadgeColor}`}>
                {overview.scope.replace('_', ' ')} SCOPE
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {overview?.scopeTitle || 'DigiLocker Integration Administration'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {overview?.scopeSubtitle ||
              'National Academic Depository citizen credential issuance, institutional verification, and audit tracking.'}
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
              {isRetrying ? 'Retrying...' : 'Retry Depository Sync'}
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 border ${
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
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── INTEGRATION HEALTH & KPI METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Authorized Cohort</span>
          <div className="text-2xl font-bold text-slate-900">{overview?.metrics.totalStudents ?? 0}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Students in Scope</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Connected Accounts</span>
          <div className="text-2xl font-bold text-emerald-600">{overview?.metrics.connectedAccounts ?? 0}</div>
          <span className="text-[11px] text-emerald-700 font-medium">DigiLocker Linked</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Citizen Consent</span>
          <div className="text-2xl font-bold text-blue-600">{overview?.metrics.consentGranted ?? 0}</div>
          <span className="text-[11px] text-blue-700 font-medium">Consent Granted</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Issued Documents</span>
          <div className="text-2xl font-bold text-purple-600">{overview?.metrics.issuedDocuments ?? 0}</div>
          <span className="text-[11px] text-purple-700 font-medium">Published in Depository</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Issuance</span>
          <div className="text-2xl font-bold text-amber-600">{overview?.metrics.pendingDocuments ?? 0}</div>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting Depository Sync</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gateway Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                overview?.integration.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <div className="text-base font-bold text-slate-900">
              {overview?.integration.isConfigured ? 'Connected' : 'Not Configured'}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {overview?.integration.issuerId || 'IN-GJ-SSIU-001'}
          </span>
        </div>
      </div>

      {/* ─── INTEGRATION DETAILS & AUDIT LOGS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gateway Architecture & Compliance Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" /> Gateway Configuration & Compliance
            </h3>
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                overview?.integration.isConfigured
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {overview?.integration.isConfigured ? 'Production Live' : 'Ready for Government Onboarding'}
            </span>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Issuer Institution ID:</span>
              <span className="font-mono font-bold text-slate-900">
                {overview?.integration.issuerId || 'IN-GJ-SSIU-001'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">OAuth Provider:</span>
              <span className="font-semibold text-slate-900">
                {overview?.integration.provider || 'DIGILOCKER_NAD'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Redirect URI:</span>
              <span className="font-mono text-slate-700 truncate max-w-[280px]">
                {overview?.integration.redirectUri || 'https://erp.ssiu.ac.in/api/v1/digilocker/callback'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Supported Documents:</span>
              <span className="font-semibold text-indigo-600">
                Degrees, Marksheets, Transcripts, Migration Certificates
              </span>
            </div>
          </div>
        </div>

        {/* Recent Audit & Depository Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Recent Depository Audit Logs
          </h3>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {overview?.recentActivity && overview.recentActivity.length > 0 ? (
              overview.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {act.operation}
                      </span>
                      <span className="font-mono text-slate-600">{act.correlationId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'SUCCESS' || act.status === 'ISSUED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No depository activity logs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── STUDENT DOCUMENT ISSUANCE & VERIFICATION REGISTER ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Student DigiLocker Document Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized student cohort for digital certificate publishing, verification, and depository synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or enrollment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {(['ALL', 'CONNECTED', 'NOT_CONNECTED', 'DISCONNECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
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
                <th className="py-3.5 px-4">Department & Institute</th>
                <th className="py-3.5 px-4">DigiLocker Status</th>
                <th className="py-3.5 px-4">Citizen Consent</th>
                <th className="py-3.5 px-4">Issued Documents</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.program}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.enrollmentNo}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{s.department}</div>
                      <div className="text-[10px] text-slate-400">{s.institute}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          s.connectionStatus === 'CONNECTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {s.connectionStatus === 'CONNECTED' && <CheckCircle2 className="w-3 h-3" />}
                        {s.connectionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.consentGiven ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {s.issuedCount} Issued <span className="text-slate-400 font-normal">({s.documentsCount} Total)</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsIssueModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                      >
                        Issue Document
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading student records...' : 'No student records found in your authorized scope.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: ISSUE DOCUMENT TO DIGILOCKER ─── */}
      {isIssueModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleIssueSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Issue Document to DigiLocker</h3>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrollment:</span>
                <span className="font-mono text-slate-900">{selectedStudent.enrollmentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-900">{selectedStudent.department}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Document Type:</label>
              <select
                value={docType}
                onChange={(e: any) => setDocType(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="DEGREE">Degree Certificate</option>
                <option value="MARKSHEET">Consolidated Grade Marksheet</option>
                <option value="TRANSCRIPT">Official Academic Transcript</option>
                <option value="PROVISIONAL">Provisional Certificate</option>
                <option value="MIGRATION">Migration Certificate</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Document / Certificate Serial Number:</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. SSIU-DEG-2026-0042"
                required
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isIssuing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                {isIssuing ? 'Issuing...' : 'Publish to DigiLocker'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
