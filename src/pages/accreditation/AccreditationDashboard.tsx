import React, { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, RefreshCw, FileText, CheckCircle, AlertTriangle,
  Download, BarChart2, Check, X, Layers, Database, ArrowRight, Play, Eye,
  Building, GraduationCap, Users, BookOpen, Clock, Lock, FileSpreadsheet,
  FileCheck, ExternalLink, PlusCircle, Search, Filter, AlertCircle, Sparkles,
  ShieldAlert, Hash, Printer, Key, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  AccreditationApiService,
  AccreditationDashboardData,
  AccreditationCriterionDetail,
  AccreditationEvidenceItem,
  AccreditationReportSummary,
  IntegrityCheckResponse,
  AuditLogEntry
} from '../../services/accreditationApiService';

export interface AccreditationDashboardProps {
  initialTab?: 'OVERVIEW' | 'CRITERIA' | 'EVIDENCE' | 'NBA_OBE' | 'REPORTS' | 'AUDIT';
  initialFramework?: 'NAAC' | 'NBA';
}

export const AccreditationDashboard: React.FC<AccreditationDashboardProps> = ({
  initialTab = 'OVERVIEW',
  initialFramework = 'NAAC',
}) => {
  const { user, role } = useAuth();

  const userRole = (role || user?.role || '').toUpperCase();
  const isStudent = userRole === 'STUDENT';
  const isFaculty = userRole === 'FACULTY';
  const isHOD = userRole === 'HOD';
  const isPrivilegedAdmin = ['IQAC', 'REGISTRAR', 'UNIVERSITY_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(userRole);

  const [activeFramework, setActiveFramework] = useState<'NAAC' | 'NBA'>(initialFramework);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CRITERIA' | 'EVIDENCE' | 'NBA_OBE' | 'REPORTS' | 'AUDIT'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialFramework) setActiveFramework(initialFramework);
  }, [initialFramework]);

  // Main data states
  const [dashboardData, setDashboardData] = useState<AccreditationDashboardData | null>(null);
  const [criteriaList, setCriteriaList] = useState<AccreditationCriterionDetail[]>([]);
  const [evidenceList, setEvidenceList] = useState<AccreditationEvidenceItem[]>([]);
  const [reports, setReports] = useState<AccreditationReportSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operational states
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal / drawer states
  const [selectedCriterion, setSelectedCriterion] = useState<AccreditationCriterionDetail | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceCritCode, setEvidenceCritCode] = useState('CR1');
  const [evidenceYear, setEvidenceYear] = useState('2025-26');
  const [evidenceType, setEvidenceType] = useState('PDF');
  const [evidenceDesc, setEvidenceDesc] = useState('');

  // Rejection modal
  const [rejectEvidenceId, setRejectEvidenceId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Integrity Check modal
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResponse | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

  // Selected Program for NBA
  const [nbaProgram, setNbaProgram] = useState('B.Tech Computer Engineering');

  const loadData = async () => {
    if (isStudent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [dashRes, critRes, evRes, repRes] = await Promise.all([
        AccreditationApiService.getDashboard(activeFramework),
        AccreditationApiService.listCriteria(activeFramework),
        AccreditationApiService.listEvidence(activeFramework),
        AccreditationApiService.listReports(activeFramework),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      }
      if (critRes.success && critRes.data) {
        setCriteriaList(critRes.data);
      }
      if (evRes.success && evRes.data) {
        setEvidenceList(evRes.data);
      }
      if (repRes.success && repRes.data) {
        setReports(repRes.data);
      }

      if (isPrivilegedAdmin) {
        try {
          const auditRes = await AccreditationApiService.getAuditLogs(activeFramework);
          if (auditRes.success && auditRes.data) {
            setAuditLogs(auditRes.data);
          }
        } catch {
          // Non-critical if audit logs fail
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load accreditation workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFramework]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setNotice(null);
    try {
      const res = await AccreditationApiService.recalculate(activeFramework);
      setNotice(res.message || `Live database recalculation completed for ${activeFramework}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Recalculation failed.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setNotice(null);
    try {
      const res = await AccreditationApiService.validateData(activeFramework);
      setNotice(`Data quality validation passed: ${res.data.overallCompleteness}% ready for submission.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateReport = async (format: 'PDF' | 'EXCEL') => {
    setIsGeneratingReport(true);
    setNotice(null);
    try {
      const res = await AccreditationApiService.generateReport(activeFramework, format);
      setNotice(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Report generation failed.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleFinalizeReport = async (reportId: string) => {
    try {
      const res = await AccreditationApiService.finalizeReport(reportId);
      setNotice(res.message || 'Report finalized and sealed with cryptographic SHA-256 digest.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to finalize report.');
    }
  };

  const handleVerifyIntegrity = async (reportId: string) => {
    setIsCheckingIntegrity(true);
    try {
      const res = await AccreditationApiService.verifyReportIntegrity(reportId);
      if (res.success && res.data) {
        setIntegrityResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Cryptographic integrity check failed.');
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleDownloadExport = async (reportId: string, format: 'JSON' | 'EXCEL' | 'PDF' | 'HTML') => {
    try {
      const res = await AccreditationApiService.exportReport(reportId, format);
      if (format === 'JSON') {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${reportId}_export.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else if (format === 'HTML' || format === 'PDF') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(res.data.html || res.data);
          printWindow.document.close();
        }
      } else if (format === 'EXCEL') {
        const dataStr = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + (res.data.excelBase64 || '');
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${reportId}_ssr_sar.xlsx`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
      setNotice(`Exported ${format} document package for ${reportId}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to export report.');
    }
  };

  const handleVerifyEvidence = async (id: string) => {
    try {
      const res = await AccreditationApiService.verifyEvidence(id);
      setNotice(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify evidence.');
    }
  };

  const handleConfirmRejectEvidence = async () => {
    if (!rejectEvidenceId || !rejectionReason.trim()) return;
    setIsRejecting(true);
    try {
      const res = await AccreditationApiService.rejectEvidence(rejectEvidenceId, rejectionReason);
      setNotice(res.message);
      setRejectEvidenceId(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject evidence.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle) return;
    try {
      const res = await AccreditationApiService.addEvidence({
        framework: activeFramework,
        criterionCode: evidenceCritCode,
        title: evidenceTitle,
        description: evidenceDesc,
        academicYear: evidenceYear,
        evidenceType,
      });
      setNotice(res.message);
      setIsEvidenceModalOpen(false);
      setEvidenceTitle('');
      setEvidenceDesc('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to link evidence.');
    }
  };

  if (isStudent) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900">Institutional Governance Access Restricted</h2>
          <p className="text-sm text-amber-700 max-w-md mx-auto">
            The NAAC & NBA Accreditation Reporting Engine is restricted to Faculty, Heads of Department, IQAC Coordinators, and University Administrators.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Loading NAAC & NBA Accreditation Engine from live ERP database...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-400" /> National Accreditation • Institutional Quality Assurance Cell (IQAC)
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">NAAC & NBA Accreditation Reporting Engine</h1>
          <p className="text-slate-300 text-xs mt-1">
            5-Year live database metric calculation, evidence mapping, and automated Self-Study Report (SSR / SAR) generation.
          </p>
        </div>

        {/* Framework Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveFramework('NAAC')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFramework === 'NAAC' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              NAAC (7 Criteria)
            </button>
            <button
              onClick={() => setActiveFramework('NBA')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFramework === 'NBA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              NBA (10 Criteria OBE)
            </button>
          </div>

          {(isPrivilegedAdmin || isHOD) && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Calculating...' : 'Recalculate ERP Data'}
            </button>
          )}
        </div>
      </div>

      {/* Notices & Alerts */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {notice}
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Dashboard Overview', icon: BarChart2 },
          { id: 'CRITERIA', label: `${activeFramework} 5-Year Criteria & Metrics`, icon: Layers },
          { id: 'EVIDENCE', label: 'Evidence & Documents Repository', icon: FileCheck },
          ...(activeFramework === 'NBA' ? [{ id: 'NBA_OBE', label: 'OBE Attainment Matrices', icon: Sparkles }] : []),
          { id: 'REPORTS', label: 'SSR / SAR Snapshots & Export', icon: FileText },
          ...(isPrivilegedAdmin ? [{ id: 'AUDIT', label: 'Data Lineage & Audit Trail', icon: Database }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & READINESS SUMMARY
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Overall Data Readiness</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {dashboardData?.overallDataCompleteness || 0}%
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {dashboardData?.criteriaCompleted || 0} of {dashboardData?.totalCriteria || 0} Criteria Met
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active 5-Yr Metrics</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {dashboardData?.totalMetrics || 0}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {dashboardData?.academicYearRange || '2021-22 to 2025-26'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Database className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Evidence Status</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {dashboardData?.evidenceAvailable || 0}
                </h3>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                  {dashboardData?.evidenceMissing || 0} Evidence Gaps
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Generated SSR Snapshots</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {reports.length}
                </h3>
                <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  {reports.filter(r => r.status === 'SEALED').length} Cryptographically Sealed
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Criteria Readiness Breakdown Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeFramework} Criteria Readiness Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Live calculation status across all institutional criteria.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('CRITERIA')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                View 5-Year Data Table <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(dashboardData?.criteria || []).map((crit) => (
                <div
                  key={crit.id}
                  onClick={() => {
                    const fullCrit = criteriaList.find((c) => c.code === crit.code);
                    if (fullCrit) setSelectedCriterion(fullCrit);
                    setActiveTab('CRITERIA');
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition cursor-pointer space-y-3 group"
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-mono font-bold rounded">
                      {crit.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Weightage: {crit.weightage}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                      {crit.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {crit.metricsCount} Metrics • {crit.completeness}% Ready
                    </p>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        crit.completeness >= 80 ? 'bg-emerald-500' : crit.completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${crit.completeness}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 2: 5-YEAR CRITERIA & METRICS GRID
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'CRITERIA' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeFramework} 5-Year Criteria & Deterministic Metric Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Every metric is computed directly from live ERP student, faculty, exam, and research tables.
                </p>
              </div>

              {selectedCriterion && (
                <button
                  onClick={() => setSelectedCriterion(null)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                >
                  ← Show All Criteria
                </button>
              )}
            </div>

            {/* Criteria & Metric Cards */}
            <div className="space-y-6">
              {(selectedCriterion ? [selectedCriterion] : criteriaList).map((crit) => (
                <div key={crit.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-mono font-bold rounded">
                          {crit.code}
                        </span>
                        <h4 className="text-sm font-bold">{crit.title}</h4>
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5">{crit.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-300">Weightage: {crit.weightage} Marks</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {(crit.metrics || []).map((m) => (
                      <div key={m.id} className="p-4 space-y-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-600">{m.code}</span>
                              <span className="text-xs font-bold text-slate-900">{m.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                                Unit: {m.unit}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Formula: <span className="font-mono text-slate-700">{m.formula || 'Direct Aggregation'}</span> • Source: <span className="font-semibold text-slate-700">{m.sourceModule}</span>
                            </p>
                          </div>
                        </div>

                        {/* 5-Year Data Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border border-slate-200 rounded-lg text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-2 border-r border-slate-200">Academic Year</th>
                                <th className="p-2 border-r border-slate-200">Calculated Value</th>
                                <th className="p-2 border-r border-slate-200">Source Records</th>
                                <th className="p-2 border-r border-slate-200">Status</th>
                                <th className="p-2">Lineage Reference</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(m.aggregatedValues || []).map((ag, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 font-medium">
                                  <td className="p-2 font-mono font-bold text-slate-700 border-r border-slate-200">{ag.academicYear}</td>
                                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-200">
                                    {ag.value !== null ? `${ag.value} ${m.unit}` : 'N/A'}
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-slate-600">{ag.sourceRecordCount} records</td>
                                  <td className="p-2 border-r border-slate-200">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                      ag.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {ag.status}
                                    </span>
                                  </td>
                                  <td className="p-2 text-slate-500 font-mono text-[10px] truncate max-w-xs">
                                    {ag.sourceRecordReference || 'Live ERP Query'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 3: EVIDENCE & DOCUMENT REPOSITORY
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Accreditation Evidence Repository</h3>
                <p className="text-xs text-slate-500">
                  Institutional documents, Board of Studies minutes, DigiLocker certificates, and verifiable records.
                </p>
              </div>

              {(isPrivilegedAdmin || isHOD || isFaculty) && (
                <button
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  <PlusCircle className="w-4 h-4" /> Link New Evidence
                </button>
              )}
            </div>

            {/* Evidence List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Criterion / Metric</th>
                    <th className="p-3">Document Title</th>
                    <th className="p-3">Academic Year</th>
                    <th className="p-3">Source Module</th>
                    <th className="p-3">Format</th>
                    <th className="p-3">Verification Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidenceList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No evidence documents linked yet. Click "Link New Evidence" to attach documents.
                      </td>
                    </tr>
                  ) : (
                    evidenceList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-indigo-600">
                          {item.criterionCode || 'CR1'} {item.metricCode ? `(${item.metricCode})` : ''}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          {item.rejectionReason && (
                            <div className="text-[11px] text-rose-600 mt-0.5 font-medium">
                              Rejection Reason: {item.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{item.academicYear || '2025-26'}</td>
                        <td className="p-3 text-slate-600 font-semibold">{item.sourceModule}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                            {item.evidenceType}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.status === 'PENDING' && (isPrivilegedAdmin || isHOD) && (
                              <>
                                <button
                                  onClick={() => handleVerifyEvidence(item.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectEvidenceId(item.id);
                                    setRejectionReason('');
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-indigo-600 hover:text-indigo-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
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

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 4: NBA OBE ATTAINMENT MATRICES
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'NBA_OBE' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Outcome-Based Education (OBE) Attainment Ledger</h3>
                <p className="text-xs text-slate-500">
                  Direct (80%) + Indirect (20%) attainment matrices mapped across Course Outcomes (COs), Program Outcomes (POs 1–12), and PSOs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={nbaProgram}
                  onChange={(e) => setNbaProgram(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="B.Tech Computer Engineering">B.Tech Computer Engineering</option>
                  <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                  <option value="B.Tech Mechanical Engineering">B.Tech Mechanical Engineering</option>
                </select>
              </div>
            </div>

            {/* OBE Attainment Sample Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3">Program Outcome</th>
                    <th className="p-3">PO Description</th>
                    <th className="p-3 text-center">Target Level</th>
                    <th className="p-3 text-center">Direct (80%)</th>
                    <th className="p-3 text-center">Indirect (20%)</th>
                    <th className="p-3 text-center">Overall Attainment</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { code: 'PO1', desc: 'Engineering Knowledge', target: 2.5, direct: 2.65, indirect: 2.70, overall: 2.66, status: 'ATTAINED' },
                    { code: 'PO2', desc: 'Problem Analysis', target: 2.5, direct: 2.45, indirect: 2.60, overall: 2.48, status: 'PROGRESSING' },
                    { code: 'PO3', desc: 'Design/Development of Solutions', target: 2.5, direct: 2.55, indirect: 2.50, overall: 2.54, status: 'ATTAINED' },
                    { code: 'PO4', desc: 'Conduct Investigations of Complex Problems', target: 2.5, direct: 2.30, indirect: 2.40, overall: 2.32, status: 'PROGRESSING' },
                    { code: 'PO5', desc: 'Modern Tool Usage', target: 2.5, direct: 2.80, indirect: 2.75, overall: 2.79, status: 'ATTAINED' },
                    { code: 'PSO1', desc: 'Cloud & Distributed Computing', target: 2.5, direct: 2.72, indirect: 2.65, overall: 2.71, status: 'ATTAINED' },
                    { code: 'PSO2', desc: 'Applied AI & Data Engineering', target: 2.5, direct: 2.68, indirect: 2.60, overall: 2.66, status: 'ATTAINED' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-medium">
                      <td className="p-3 font-mono font-bold text-indigo-600">{row.code}</td>
                      <td className="p-3 text-slate-800 font-semibold">{row.desc}</td>
                      <td className="p-3 text-center font-mono">{row.target}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{row.direct}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">{row.indirect}</td>
                      <td className="p-3 text-center font-mono font-black text-indigo-700">{row.overall} / 3.0</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          row.status === 'ATTAINED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 5: SSR / SAR REPORTS & EXPORTS
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Self-Study Reports (SSR / SAR) Snapshots</h3>
                <p className="text-xs text-slate-500">
                  Immutable 5-year accreditation snapshots sealed with SHA-256 digital cryptographic hash digests.
                </p>
              </div>

              {(isPrivilegedAdmin || isHOD) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateReport('PDF')}
                    disabled={isGeneratingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {isGeneratingReport ? 'Compiling Snapshot...' : `Generate ${activeFramework} SSR`}
                  </button>
                </div>
              )}
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl">
                  No SSR/SAR snapshots compiled yet. Click "Generate SSR" to assemble a 5-year report package.
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{rep.reportId}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                          {rep.framework} {rep.version}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          rep.status === 'SEALED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Academic Window: <span className="font-semibold">{rep.academicYearRange}</span> • Generated By: <span className="font-semibold">{rep.generatedBy}</span>
                      </p>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Key className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-sm">Hash: {rep.hash}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleVerifyIntegrity(rep.id)}
                        disabled={isCheckingIntegrity}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" /> Verify Integrity
                      </button>

                      {rep.status !== 'SEALED' && isPrivilegedAdmin && (
                        <button
                          onClick={() => handleFinalizeReport(rep.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                        >
                          <Lock className="w-3.5 h-3.5" /> Seal Snapshot
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadExport(rep.id, 'EXCEL')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-sm"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (XLSX)
                      </button>

                      <button
                        onClick={() => handleDownloadExport(rep.id, 'HTML')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" /> Print / PDF
                      </button>

                      <button
                        onClick={() => handleDownloadExport(rep.id, 'JSON')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" /> JSON
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 6: AUDIT TRAIL & LINEAGE
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'AUDIT' && isPrivilegedAdmin && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Accreditation Data Lineage & Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Immutable chronological record of calculations, evidence attachments, and report seal executions.
            </p>

            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-xl">
                  No audit log entries recorded yet.
                </div>
              ) : (
                auditLogs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-mono font-bold rounded">
                          {log.framework} {log.metricCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {log.sourceModule} → {log.sourceEntity} ({log.sourceRecordId})
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      {new Date(log.calculatedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Creation Modal */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Link Evidence to {activeFramework} Criterion</h3>
              <button onClick={() => setIsEvidenceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateEvidence} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Criterion Code *</label>
                <select
                  value={evidenceCritCode}
                  onChange={(e) => setEvidenceCritCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  {criteriaList.map((c) => (
                    <option key={c.id} value={c.code}>{c.code} — {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  placeholder="e.g. BOS Minutes of Curriculum Revision 2024-25"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Academic Year</label>
                  <select
                    value={evidenceYear}
                    onChange={(e) => setEvidenceYear(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {['2021-22', '2022-23', '2023-24', '2024-25', '2025-26'].map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Evidence Format</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {['PDF', 'DOC', 'XLSX', 'IMAGE', 'LINK'].map((fmt) => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  placeholder="Additional institutional verification notes..."
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Link & Submit Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Rejection Reason Dialog */}
      {rejectEvidenceId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Reject Accreditation Evidence
              </h3>
              <button onClick={() => setRejectEvidenceId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Please provide a mandatory justification for rejecting this evidence document. This explanation will be logged permanently in the institutional data lineage.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete attendance signature sheet or missing HoD endorsement"
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectEvidenceId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectEvidence}
                disabled={!rejectionReason.trim() || isRejecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Integrity Verification Modal */}
      {integrityResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Cryptographic Integrity Audit
              </h3>
              <button onClick={() => setIntegrityResult(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                integrityResult.status === 'VALID'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {integrityResult.status === 'VALID' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-rose-600 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {integrityResult.status === 'VALID' ? 'SNAPSHOT CRYPTOGRAPHICALLY VALID' : 'INTEGRITY TAMPER DETECTED'}
                  </div>
                  <p className="text-xs mt-0.5">
                    {integrityResult.status === 'VALID'
                      ? 'The snapshot payload exactly matches its sealed SHA-256 cryptographic digest.'
                      : 'The stored report payload has been mutated or tampered with since finalization!'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Stored SHA-256 Digest</span>
                  <span className="text-slate-800 break-all text-[11px] font-bold">{integrityResult.storedHash}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Computed SHA-256 Digest</span>
                  <span className="text-slate-800 break-all text-[11px] font-bold">{integrityResult.computedHash}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Report Code: <span className="font-bold text-slate-700">{integrityResult.reportId}</span></div>
                <div>Signatory: <span className="font-bold text-slate-700">{integrityResult.generatedBy}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIntegrityResult(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
