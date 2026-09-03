import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { 
  Award, CheckCircle2, ShieldCheck, FileText, Download, BarChart3, 
  Layers, Lock, Clock, CheckSquare, RefreshCw, Upload, Eye, FileSpreadsheet, 
  MapPin, ExternalLink, Filter, Plus, ArrowRight, AlertTriangle, Building2, UserCheck, GraduationCap
} from 'lucide-react';
import { NaacCriterion, NaacMetric, NaacDataSubmission, ApprovalStatus } from '../../types';
import { exportToExcel, exportToWord } from '../../services/exportService';

export const IQACWorkspacePage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CRITERIA' | 'WORKFLOW' | 'PROFILE' | 'REPORTS' | 'EVIDENCE'>('DASHBOARD');
  
  // Data state
  const criteria = db.getNaacCriteria();
  const keyIndicators = db.getNaacKeyIndicators();
  const metrics = db.getNaacMetrics();
  const [submissions, setSubmissions] = useState<NaacDataSubmission[]>(db.getNaacSubmissions());

  // Filter & Search State
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>('ALL');
  const [selectedMetricType, setSelectedMetricType] = useState<string>('ALL');

  // Modal State for Data Entry
  const [selectedMetricForEntry, setSelectedMetricForEntry] = useState<NaacMetric | null>(null);
  const [quantValueInput, setQuantValueInput] = useState<string>('');
  const [qualTextInput, setQualTextInput] = useState<string>('');
  const [evidenceUrlInput, setEvidenceUrlInput] = useState<string>('https://swarrnim.edu.in/docs/naac_proof_sample.pdf');
  const [webLinkInput, setWebLinkInput] = useState<string>('https://swarrnim.edu.in/iqac');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Selected Submission detail modal
  const [viewSubmission, setViewSubmission] = useState<NaacDataSubmission | null>(null);
  const [actionRemarks, setActionRemarks] = useState<string>('');

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const faculty = db.getFaculty();
  const students = db.getStudents();
  const researchProjects = db.getResearchProjects();
  const publications = db.getPublications();

  // Handlers
  const handleOpenDataEntry = (m: NaacMetric) => {
    setSelectedMetricForEntry(m);
    const autoCalc = db.calculateNaacAutoValue(m);
    setQuantValueInput(String(autoCalc.calculatedValue || ''));
    setQualTextInput(`Qualitative assessment and compliance report for NAAC Metric ${m.code}. Verified against departmental records.`);
    setSuccessMsg('');
  };

  const handleSaveDataSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMetricForEntry || !user) return;

    setSubmitting(true);
    const newSub = db.submitNaacMetricData({
      metricId: selectedMetricForEntry.id,
      metricCode: selectedMetricForEntry.code,
      criterionId: selectedMetricForEntry.criterionId,
      departmentId: user.departmentId || 'dept-1',
      instituteId: user.instituteId || 'inst-1',
      academicYearId: 'ay-2024',
      quantitativeValue: Number(quantValueInput) || undefined,
      qualitativeText: qualTextInput || undefined,
      evidenceUrls: evidenceUrlInput ? [evidenceUrlInput] : [],
      websiteLinks: webLinkInput ? [webLinkInput] : [],
      status: 'SUBMITTED',
      currentApproverRole: 'HOD',
      submittedByUserId: user.id,
      submittedByUserName: user.name,
      submittedAt: new Date().toISOString().split('T')[0]
    }, user);

    setSubmissions(db.getNaacSubmissions());
    setSubmitting(false);
    setSelectedMetricForEntry(null);
    setSuccessMsg(`Data for Metric ${newSub.metricCode} submitted successfully to HOD & IQAC workflow.`);
  };

  const handleWorkflowAction = (submissionId: string, action: ApprovalStatus) => {
    if (!user) return;
    const updated = db.advanceNaacSubmissionStatus(submissionId, user, action, actionRemarks);
    if (updated) {
      setSubmissions(db.getNaacSubmissions());
      setViewSubmission(null);
      setActionRemarks('');
    }
  };

  // Metric Filtering
  const filteredMetrics = metrics.filter(m => {
    if (selectedCriterionId !== 'ALL' && m.criterionId !== selectedCriterionId) return false;
    if (selectedMetricType !== 'ALL' && m.type !== selectedMetricType) return false;
    return true;
  });

  // Calculate AQAR Completion Ratio
  const totalMetricsCount = metrics.length;
  const approvedSubmissionsCount = submissions.filter(s => s.status === 'APPROVED' || s.status === 'LOCKED').length;
  const completionPercentage = ((approvedSubmissionsCount / (totalMetricsCount || 1)) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Mode Notice */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Internal Quality Assurance Cell (IQAC) &amp; NAAC Framework
            </h2>
            <Badge variant="active" icon={<Award size={14} />}>NAAC CYCLE 2 GRADE A+</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Configurable NAAC Framework (Criteria 1–7), QnM/QlM Metric Auto-Sync, Multi-Stage Approvals &amp; AQAR/SSR Reports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('REPORTS')}>
            <Download size={16} /> AQAR / SSR Reports
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('CRITERIA')}>
            <Plus size={16} /> Submit NAAC Data
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#059669" />
          {successMsg}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeTab === 'DASHBOARD' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('DASHBOARD')}
        >
          <BarChart3 size={16} /> NAAC Dashboard
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'CRITERIA' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('CRITERIA')}
        >
          <Layers size={16} /> Criteria 1–7 Explorer ({metrics.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'WORKFLOW' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('WORKFLOW')}
        >
          <CheckSquare size={16} /> Approval Workflow ({submissions.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'PROFILE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('PROFILE')}
        >
          <Building2 size={16} /> University Profile &amp; Stats
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'REPORTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('REPORTS')}
        >
          <FileSpreadsheet size={16} /> AQAR &amp; SSR Exports
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'EVIDENCE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('EVIDENCE')}
        >
          <MapPin size={16} /> Geo-Tagged Evidence Vault
        </button>
      </div>

      {/* ─── TAB 1: NAAC DASHBOARD OVERVIEW ─────────────────────────────────── */}
      {activeTab === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-4">
            <StatCard title="NAAC Score Projection" value="3.62 / 4.00" icon={Award} subtitle="Grade A+ Target Benchmark" />
            <StatCard title="AQAR Submissions Ready" value={`${completionPercentage}%`} icon={CheckCircle2} subtitle={`${approvedSubmissionsCount} of ${totalMetricsCount} Metrics Verified`} />
            <StatCard title="Research Publications" value={String(publications.length)} icon={FileText} subtitle="Scopus &amp; Web of Science" />
            <StatCard title="Extramural Grants" value={`₹30.5 Lakhs`} icon={ShieldCheck} subtitle={`${researchProjects.length} Active R&D Projects`} />
          </div>

          {/* Criteria Cards Grid */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
              NAAC 7 Criteria Performance &amp; Weightage Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1px))', gap: '1rem' }} className="grid-3">
              {criteria.map(crit => {
                const critMetrics = metrics.filter(m => m.criterionId === crit.id);
                const critSubmissions = submissions.filter(s => s.criterionId === crit.id && (s.status === 'APPROVED' || s.status === 'LOCKED'));
                const progress = critMetrics.length > 0 ? ((critSubmissions.length / critMetrics.length) * 100).toFixed(0) : '100';

                return (
                  <div key={crit.id} className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-navy)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase' }}>
                        Criterion {crit.number} • Weightage {crit.weightage}
                      </span>
                      <Badge variant="navy">{crit.keyIndicatorsCount} Key Indicators</Badge>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                      {crit.title}
                    </h4>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                      {crit.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span>Audit Compliance Progress</span>
                      <span style={{ color: 'var(--brand-orange)' }}>{progress}% ({critSubmissions.length}/{critMetrics.length})</span>
                    </div>

                    <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--brand-orange)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CRITERIA 1–7 METRIC EXPLORER & DATA ENTRY ─────────────────── */}
      {activeTab === 'CRITERIA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--brand-orange)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Filter NAAC Metrics:</span>
            </div>

            <select className="form-select" style={{ maxWidth: '240px' }} value={selectedCriterionId} onChange={e => setSelectedCriterionId(e.target.value)}>
              <option value="ALL">All 7 Criteria</option>
              {criteria.map(c => (
                <option key={c.id} value={c.id}>Criterion {c.number}: {c.title}</option>
              ))}
            </select>

            <select className="form-select" style={{ maxWidth: '200px' }} value={selectedMetricType} onChange={e => setSelectedMetricType(e.target.value)}>
              <option value="ALL">All Types (QnM &amp; QlM)</option>
              <option value="QnM">QnM (Quantitative Metrics)</option>
              <option value="QlM">QlM (Qualitative Metrics)</option>
            </select>
          </div>

          {/* Metrics List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredMetrics.map(m => {
              const autoCalc = db.calculateNaacAutoValue(m);
              const sub = submissions.find(s => s.metricId === m.id);

              return (
                <div key={m.id} className="card" style={{ padding: '1.5rem', borderLeft: m.type === 'QnM' ? '4px solid #10B981' : '4px solid #0097D7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                          Metric {m.code}
                        </span>
                        <Badge variant={m.type === 'QnM' ? 'active' : 'navy'}>
                          {m.type === 'QnM' ? 'QnM • Quantitative' : 'QlM • Qualitative'}
                        </Badge>
                        <Badge variant="gold">Weightage: {m.weightage} Points</Badge>
                        {sub && (
                          <Badge variant={sub.status === 'LOCKED' ? 'navy' : sub.status === 'APPROVED' ? 'active' : 'orange'}>
                            Status: {sub.status}
                          </Badge>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--brand-navy)', margin: '0.25rem 0 0.5rem 0' }}>
                        {m.title}
                      </h4>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenDataEntry(m)}>
                      <Plus size={16} /> Enter Data &amp; Evidence
                    </button>
                  </div>

                  {/* Formula Calculation Box (Single-Entry ERP Auto-Sync) */}
                  {m.type === 'QnM' && (
                    <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ⚡ Single-Entry ERP Auto-Calculation Formula
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-orange)', marginTop: '0.2rem' }}>
                        {m.formulaDescription}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Auto Computed Value: <strong style={{ color: '#059669', fontSize: '0.9375rem' }}>{autoCalc.calculatedValue}%</strong> • {autoCalc.erpSummary}
                      </div>
                    </div>
                  )}

                  {/* Required Evidence Tags */}
                  <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Required Documents:</span>
                    {m.requiredEvidence.map((ev, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: 'rgba(15,44,89,0.06)', color: 'var(--brand-navy)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        📄 {ev}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: MULTI-STAGE APPROVAL WORKFLOW ─────────────────────────────── */}
      {activeTab === 'WORKFLOW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Multi-Stage NAAC Data Verification &amp; Approval Workflow
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Sequential Routing: Department/Office → HOD → IQAC Director → Registrar → Approved &amp; Locked
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Metric Code</th>
                    <th>Department / Office</th>
                    <th>Submitted By</th>
                    <th>Quantitative Value</th>
                    <th>Workflow Stage</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id}>
                      <td><strong>Metric {sub.metricCode}</strong></td>
                      <td>Swarrnim Computer &amp; IT</td>
                      <td>{sub.submittedByUserName}</td>
                      <td><strong>{sub.quantitativeValue !== undefined ? `${sub.quantitativeValue}%` : 'Qualitative Report'}</strong></td>
                      <td><Badge variant="navy">Role: {sub.currentApproverRole}</Badge></td>
                      <td>
                        <Badge variant={sub.status === 'LOCKED' ? 'navy' : sub.status === 'APPROVED' ? 'active' : 'orange'}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewSubmission(sub)}>
                          Review &amp; Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: UNIVERSITY PROFILE & EXTENDED PROFILE ─────────────────────── */}
      {activeTab === 'PROFILE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Swarrnim Startup &amp; Innovation University — Extended Profile
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Official Institutional Data for NAAC SSR Section I &amp; Statutory Disclosures
            </p>

            <div className="grid-2">
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
                  Institutional Identity
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                  <div><strong>Name of University:</strong> Swarrnim Startup &amp; Innovation University</div>
                  <div><strong>UGC Recognition Status:</strong> UGC 2(f) State Private University</div>
                  <div><strong>Establishment Year:</strong> 2017</div>
                  <div><strong>Campus Location:</strong> Gandhinagar, Gujarat - 382421</div>
                  <div><strong>Constituent Institutes:</strong> 10 Professional Colleges</div>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
                  Academic &amp; Student Profile (Connected ERP)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                  <div><strong>Total Active Students:</strong> {students.length} Enrolled Candidates</div>
                  <div><strong>Full-Time Teaching Staff:</strong> {faculty.length} Appointed Faculty</div>
                  <div><strong>Ph.D Qualified Professors:</strong> {faculty.filter(f => f.qualification.includes('Ph.D')).length || 2} Professors</div>
                  <div><strong>Active Degree Programs:</strong> 12 Approved Programs</div>
                  <div><strong>Campus Infrastructure:</strong> 42 Smart Classrooms, 16 R&amp;D Labs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: AQAR & SSR REPORT EXPORTS ───────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              AQAR &amp; SSR Automated Report Generator
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Export NAAC Annual Quality Assurance Report (AQAR) &amp; Self Study Report (SSR) in Excel (.xlsx) &amp; Word (.docx) formats
            </p>

            <div className="grid-2">
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Annual Quality Assurance Report (AQAR 2024)
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Complete metric-wise data report containing Criteria 1 to 7 values, formulas, and verified evidence links.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    exportToExcel(
                      'SSIU NAAC AQAR Metric Submissions Report 2024',
                      ['Metric Code', 'Criterion ID', 'Quantitative Value', 'Submitted By', 'Status', 'Date'],
                      submissions.map(s => [s.metricCode, s.criterionId, s.quantitativeValue || 'Qualitative', s.submittedByUserName, s.status, s.submittedAt]),
                      {},
                      { name: user?.name, role: user?.role }
                    );
                  }}>
                    <FileSpreadsheet size={16} /> Export AQAR (Excel)
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    exportToWord(
                      'SSIU NAAC AQAR Executive Report 2024',
                      ['Metric Code', 'Quantitative Score', 'Submitted By', 'Status'],
                      submissions.map(s => [s.metricCode, String(s.quantitativeValue || 'Qualitative Report'), s.submittedByUserName, s.status]),
                      {},
                      { name: user?.name, role: user?.role }
                    );
                  }}>
                    <FileText size={16} /> Export AQAR (Word)
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  NAAC Self Study Report (SSR Cycle 2)
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Executive SSR document compiled with university profile, extended profile, and 7 criteria metrics.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => alert('Generating full SSR PDF Document Package...')}>
                    <Download size={16} /> Download Complete SSR (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: GEO-TAGGED EVIDENCE VAULT ───────────────────────────────── */}
      {activeTab === 'EVIDENCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Geo-Tagged Photo Evidence Vault &amp; Verified Proofs
            </h3>

            <div className="grid-3">
              {db.getEdpDuties().flatMap(d => d.evidenceList || []).map(ev => (
                <div key={ev.id} className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
                  <img src={ev.photoUrl} alt="Evidence" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-orange)', marginBottom: '0.2rem' }}>
                    <MapPin size={12} /> {ev.latitude}° N, {ev.longitude}° E
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--brand-navy)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {ev.locationAddress}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Captured: {new Date(ev.capturedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DATA ENTRY MODAL ────────────────────────────────────────────────── */}
      {selectedMetricForEntry && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Submit NAAC Data: Metric {selectedMetricForEntry.code}
            </h3>

            <form onSubmit={handleSaveDataSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Metric Title</label>
                <input type="text" className="form-input" value={selectedMetricForEntry.title} disabled />
              </div>

              {selectedMetricForEntry.type === 'QnM' ? (
                <div className="form-group">
                  <label className="form-label">Quantitative Value (%) *</label>
                  <input type="number" step="0.01" className="form-input" value={quantValueInput} onChange={e => setQuantValueInput(e.target.value)} required />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Qualitative Compliance Report (max 500 words) *</label>
                  <textarea className="form-input" rows={4} value={qualTextInput} onChange={e => setQualTextInput(e.target.value)} required />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Document Evidence File URL *</label>
                <input type="text" className="form-input" value={evidenceUrlInput} onChange={e => setEvidenceUrlInput(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Statutory Website / Proof Link</label>
                <input type="text" className="form-input" value={webLinkInput} onChange={e => setWebLinkInput(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedMetricForEntry(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit to IQAC Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REVIEW & WORKFLOW ADVANCE MODAL ─────────────────────────────────── */}
      {viewSubmission && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Review Metric {viewSubmission.metricCode} Submission
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <div><strong>Submitted By:</strong> {viewSubmission.submittedByUserName} ({viewSubmission.submittedAt})</div>
              <div><strong>Current Stage:</strong> Approver Role ({viewSubmission.currentApproverRole})</div>
              <div><strong>Quantitative Score:</strong> {viewSubmission.quantitativeValue !== undefined ? `${viewSubmission.quantitativeValue}%` : 'Qualitative Report'}</div>
              {viewSubmission.qualitativeText && <div><strong>Description:</strong> {viewSubmission.qualitativeText}</div>}
              <div><strong>Evidence Documents:</strong> <a href={viewSubmission.evidenceUrls[0]} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-orange)' }}>View PDF Proof</a></div>
            </div>

            <div className="form-group">
              <label className="form-label">Reviewer Official Remarks</label>
              <textarea className="form-input" rows={3} placeholder="Enter verification notes or reasons..." value={actionRemarks} onChange={e => setActionRemarks(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setViewSubmission(null)}>Close</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-danger btn-sm" onClick={() => handleWorkflowAction(viewSubmission.id, 'RETURNED')}>
                  Return for Correction
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => handleWorkflowAction(viewSubmission.id, 'APPROVED')}>
                  Approve &amp; Advance Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
