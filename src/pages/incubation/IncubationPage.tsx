import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import {
  Rocket, Users, Lightbulb, TrendingUp, Award, FileSpreadsheet,
  Plus, Search, Filter, CheckCircle2, XCircle, Clock, FileText,
  Star, Calendar, BookOpen, DollarSign, ShieldCheck, Eye, Edit3,
  ChevronRight, AlertTriangle, RefreshCcw
} from 'lucide-react';
import {
  StartupIdea, StartupFunding, IncubationMentorSession, IncubationWorkshop,
  StartupSector, StartupStage, IncubationApplicationStatus
} from '../../types';
import { exportToExcel } from '../../services/exportService';

// ─── Stage Timeline chips ──────────────────────────────────────────────────────
const STAGE_ORDER: StartupStage[] = ['IDEA', 'VALIDATION', 'PROTOTYPE', 'MVP', 'EARLY_REVENUE', 'GROWTH', 'SCALING', 'GRADUATED'];

const stageColor = (s: StartupStage) => {
  const m: Record<string, string> = {
    IDEA: '#8B5CF6', VALIDATION: '#3B82F6', PROTOTYPE: '#06B6D4',
    MVP: '#10B981', EARLY_REVENUE: '#F59E0B', GROWTH: '#F97316',
    SCALING: '#EF4444', GRADUATED: '#059669', ALUMNI: '#6B7280'
  };
  return m[s] || '#6B7280';
};

const statusBadgeVariant = (s: IncubationApplicationStatus) => {
  const m: Record<string, string> = {
    DRAFT: 'orange', SUBMITTED: 'navy', UNDER_SCREENING: 'orange',
    SCREENED: 'navy', COMMITTEE_REVIEW: 'orange', APPROVED: 'active',
    REJECTED: 'inactive', INCUBATING: 'active', GRADUATED: 'active', WITHDRAWN: 'inactive'
  };
  return (m[s] || 'navy') as any;
};

type TabType = 'DASHBOARD' | 'STARTUPS' | 'REGISTER' | 'SCREENING' | 'FUNDING' | 'MENTOR' | 'WORKSHOPS' | 'REPORTS';

import { StudentStartupPortal } from './StudentStartupPortal';

export const IncubationPage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');

  if (role === 'STUDENT') {
    return <StudentStartupPortal />;
  }

  // DB state
  const [startups, setStartups] = useState<StartupIdea[]>(db.getStartupIdeas());
  const [fundings, setFundings] = useState<StartupFunding[]>(db.getStartupFundings());
  const [sessions, setSessions] = useState<IncubationMentorSession[]>(db.getMentorSessions());
  const [workshops, setWorkshops] = useState<IncubationWorkshop[]>(db.getIncubationWorkshops());
  const faculty = db.getFaculty();

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<StartupIdea | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');

  // Register form
  const [regTitle, setRegTitle] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regProblem, setRegProblem] = useState('');
  const [regSolution, setRegSolution] = useState('');
  const [regMarket, setRegMarket] = useState('');
  const [regSector, setRegSector] = useState<StartupSector>('AI_ML');

  // Session form
  const [sessionStartupId, setSessionStartupId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessionAgenda, setSessionAgenda] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionNext, setSessionNext] = useState('');

  // Workshop form
  const [wsTitle, setWsTitle] = useState('');
  const [wsDate, setWsDate] = useState('');
  const [wsVenue, setWsVenue] = useState('');
  const [wsConductedBy, setWsConductedBy] = useState('');
  const [wsTopic, setWsTopic] = useState('');

  const isAdmin = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR' || role === 'PRINCIPAL';
  const isScreener = isAdmin || role === 'IQAC' || role === 'HOD';
  const isMentor = role === 'FACULTY' || role === 'HOD' || isAdmin;

  // ─── Derived KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total: startups.length,
    incubating: startups.filter(s => s.status === 'INCUBATING').length,
    approved: startups.filter(s => s.status === 'APPROVED').length,
    pending: startups.filter(s => s.status === 'SUBMITTED' || s.status === 'UNDER_SCREENING' || s.status === 'COMMITTEE_REVIEW').length,
    totalFunding: startups.reduce((acc, s) => acc + s.fundingReceived, 0),
    totalRevenue: startups.reduce((acc, s) => acc + s.annualRevenue, 0),
    totalEmployees: startups.reduce((acc, s) => acc + s.employeesCount, 0),
    patents: startups.filter(s => s.patentStatus && s.patentStatus !== 'NONE').length,
  }), [startups]);

  // ─── Filtered startups ─────────────────────────────────────────────────────
  const filteredStartups = useMemo(() => startups.filter(s => {
    if (filterSector !== 'ALL' && s.sector !== filterSector) return false;
    if (filterStage !== 'ALL' && s.stage !== filterStage) return false;
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.ideaCode.toLowerCase().includes(q);
    }
    return true;
  }), [startups, filterSector, filterStage, filterStatus, searchQ]);

  const refreshData = () => {
    setStartups(db.getStartupIdeas());
    setFundings(db.getStartupFundings());
    setSessions(db.getMentorSessions());
    setWorkshops(db.getIncubationWorkshops());
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    db.submitStartupIdea({
      title: regTitle,
      description: regDesc,
      problemStatement: regProblem,
      proposedSolution: regSolution,
      targetMarket: regMarket,
      sector: regSector,
      stage: 'IDEA',
      founderIds: [user.id],
      leadFounderId: user.id,
      instituteId: user.instituteId || 'inst-1',
      departmentId: user.departmentId || 'dept-1',
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      applicationStatus: 'SUBMITTED',
      hasPrototype: false, hasProduct: false,
      fundingReceived: 0, totalInvestment: 0, annualRevenue: 0, employeesCount: 1,
    }, user);
    refreshData();
    setShowRegisterModal(false);
    setSuccessMsg(`Idea '${regTitle}' registered and submitted for screening. Track status in the Screening tab.`);
    setRegTitle(''); setRegDesc(''); setRegProblem(''); setRegSolution(''); setRegMarket('');
  };

  const handleStatusUpdate = (startup: StartupIdea, newStatus: IncubationApplicationStatus) => {
    if (!user) return;
    db.updateStartupApplicationStatus(startup.id, newStatus, actionRemarks, user);
    refreshData();
    setActionRemarks('');
    setSuccessMsg(`Startup '${startup.title}' status updated to ${newStatus}.`);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const startup = startups.find(s => s.id === sessionStartupId);
    db.addMentorSession({
      startupId: sessionStartupId,
      startupName: startup?.title || '',
      mentorId: user.id,
      mentorName: user.name,
      sessionDate,
      duration: sessionDuration,
      agenda: sessionAgenda,
      notes: sessionNotes,
      nextSteps: sessionNext,
    }, user);
    refreshData();
    setShowSessionModal(false);
    setSuccessMsg('Mentor session logged successfully.');
    setSessionAgenda(''); setSessionNotes(''); setSessionNext('');
  };

  const handleAddWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    db.addIncubationWorkshop({
      title: wsTitle, description: wsTopic, date: wsDate,
      venue: wsVenue, conductedBy: wsConductedBy, topic: wsTopic,
      registeredStartupIds: [], status: 'UPCOMING'
    }, user);
    refreshData();
    setShowWorkshopModal(false);
    setSuccessMsg(`Workshop '${wsTitle}' scheduled for ${wsDate}.`);
    setWsTitle(''); setWsDate(''); setWsVenue(''); setWsConductedBy(''); setWsTopic('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Incubation &amp; Startup Management
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Complete startup lifecycle — Idea → Validation → Incubation → Funding → Market → Graduation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { refreshData(); setSuccessMsg('Data refreshed.'); }}>
            <RefreshCcw size={15} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRegisterModal(true)}>
            <Plus size={15} /> Register Startup Idea
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#059669" /> {successMsg}
        </div>
      )}

      {/* ─── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {([
          ['DASHBOARD', 'Dashboard', Rocket],
          ['STARTUPS', `All Startups (${startups.length})`, Lightbulb],
          ['REGISTER', 'Register Idea', Plus],
          ['SCREENING', `Screening Queue (${kpis.pending})`, ShieldCheck],
          ['FUNDING', `Funding Tracker (${fundings.length})`, DollarSign],
          ['MENTOR', `Mentor Sessions (${sessions.length})`, Users],
          ['WORKSHOPS', `Workshops (${workshops.length})`, BookOpen],
          ['REPORTS', 'Reports & Export', FileSpreadsheet],
        ] as [TabType, string, any][]).map(([id, label, Icon]) => (
          <button key={id} className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(id)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DASHBOARD                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Grid */}
          <div className="grid-4">
            <StatCard title="Total Startups Registered" value={String(kpis.total)} icon={Lightbulb} subtitle="All-time registrations" />
            <StatCard title="Currently Incubating" value={String(kpis.incubating)} icon={Rocket} subtitle="Active in incubation program" />
            <StatCard title="Total Funding Raised" value={`₹${(kpis.totalFunding / 100000).toFixed(1)} L`} icon={DollarSign} subtitle="Across all startups" />
            <StatCard title="Total Employees Created" value={String(kpis.totalEmployees)} icon={Users} subtitle="Jobs created by startups" />
          </div>

          {/* Secondary KPIs */}
          <div className="grid-4">
            <StatCard title="Patents Filed / Granted" value={String(kpis.patents)} icon={Award} subtitle="IPR portfolio" />
            <StatCard title="Annual Revenue" value={`₹${(kpis.totalRevenue / 100000).toFixed(1)} L`} icon={TrendingUp} subtitle="Combined startup revenue" />
            <StatCard title="Pending Applications" value={String(kpis.pending)} icon={Clock} subtitle="Awaiting screening/approval" />
            <StatCard title="Workshops Conducted" value={String(workshops.filter(w => w.status === 'COMPLETED').length)} icon={BookOpen} subtitle="Training events completed" />
          </div>

          {/* Sector Breakdown */}
          <div className="grid-2">
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>Portfolio by Sector</h3>
              {(['EDTECH', 'AGRITECH', 'HEALTHTECH', 'AI_ML', 'FINTECH', 'IOT_ROBOTICS', 'SOCIAL_IMPACT', 'OTHER'] as StartupSector[]).map(sec => {
                const count = startups.filter(s => s.sector === sec).length;
                if (count === 0) return null;
                const pct = Math.round((count / startups.length) * 100);
                return (
                  <div key={sec} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600 }}>{sec}</span><span>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#E2E8F0' }}>
                      <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: 'var(--brand-orange)' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Startup Pipeline */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>Startup Pipeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {startups.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    onClick={() => { setSelectedStartup(s); setShowDetailModal(true); }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: stageColor(s.stage), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.ideaCode} · {s.sector}</div>
                    </div>
                    <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stage Timeline */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>Startup Lifecycle Stage Distribution</h3>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
              {STAGE_ORDER.map((stage, i) => {
                const cnt = startups.filter(s => s.stage === stage).length;
                return (
                  <React.Fragment key={stage}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', minWidth: 90 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: cnt > 0 ? stageColor(stage) : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cnt > 0 ? '#FFF' : '#94A3B8', fontWeight: 800, fontSize: '1rem' }}>{cnt}</div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{stage.replace('_', ' ')}</span>
                    </div>
                    {i < STAGE_ORDER.length - 1 && <div style={{ alignSelf: 'center', color: '#CBD5E1', fontSize: '1.25rem', flexShrink: 0, paddingTop: 4 }}>›</div>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: ALL STARTUPS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'STARTUPS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filter bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={16} color="var(--brand-orange)" />
            <input type="text" className="form-input" style={{ maxWidth: 220 }} placeholder="Search startup title / IDEA code..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            <select className="form-select" style={{ maxWidth: 160 }} value={filterSector} onChange={e => setFilterSector(e.target.value)}>
              <option value="ALL">All Sectors</option>
              {(['EDTECH', 'AGRITECH', 'HEALTHTECH', 'AI_ML', 'FINTECH', 'IOT_ROBOTICS', 'CLEAN_ENERGY', 'SOCIAL_IMPACT', 'OTHER'] as StartupSector[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" style={{ maxWidth: 160 }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="ALL">All Stages</option>
              {STAGE_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {(['SUBMITTED', 'UNDER_SCREENING', 'APPROVED', 'INCUBATING', 'REJECTED', 'GRADUATED'] as IncubationApplicationStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Startup Portfolio ({filteredStartups.length})</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToExcel(
                'SSIU Incubation – Startup Portfolio Register',
                ['Code', 'Title', 'Sector', 'Stage', 'Status', 'Funding (₹)', 'Revenue (₹)', 'Employees', 'Patent'],
                filteredStartups.map(s => [s.ideaCode, s.title, s.sector, s.stage, s.status, s.fundingReceived, s.annualRevenue, s.employeesCount, s.patentStatus || 'NONE']),
                {}, { name: user?.name, role: user?.role }
              )}>
                <FileSpreadsheet size={15} /> Export Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Startup / Idea</th>
                    <th>Sector</th>
                    <th>Stage</th>
                    <th>Funding</th>
                    <th>Revenue</th>
                    <th>Patent</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStartups.map(s => (
                    <tr key={s.id}>
                      <td><strong style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.ideaCode}</strong></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)', maxWidth: 260 }}>{s.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered: {s.registeredDate}</div>
                      </td>
                      <td><Badge variant="navy">{s.sector}</Badge></td>
                      <td>
                        <span style={{ background: stageColor(s.stage), color: '#FFF', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>{s.stage}</span>
                      </td>
                      <td>₹{(s.fundingReceived / 100000).toFixed(1)}L</td>
                      <td>₹{(s.annualRevenue / 100000).toFixed(1)}L</td>
                      <td><Badge variant={s.patentStatus && s.patentStatus !== 'NONE' ? 'active' : 'orange'}>{s.patentStatus || 'NONE'}</Badge></td>
                      <td><Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedStartup(s); setShowDetailModal(true); }}>
                          <Eye size={14} /> View
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: REGISTER IDEA                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'REGISTER' && (
        <div className="card" style={{ padding: '2rem', maxWidth: 720 }}>
          <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>Register a New Startup Idea</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Submit your startup idea for incubation screening. The incubation team will review and respond within 7 working days.
          </p>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Startup / Idea Title *</label>
              <input type="text" className="form-input" value={regTitle} onChange={e => setRegTitle(e.target.value)} placeholder="e.g. AI-powered Supply Chain Optimizer" required />
            </div>
            <div className="form-group">
              <label className="form-label">Sector *</label>
              <select className="form-select" value={regSector} onChange={e => setRegSector(e.target.value as StartupSector)}>
                {(['EDTECH','HEALTHTECH','AGRITECH','FINTECH','CLEAN_ENERGY','MANUFACTURING','IOT_ROBOTICS','AI_ML','SOCIAL_IMPACT','OTHER'] as StartupSector[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brief Description *</label>
              <textarea className="form-input" rows={3} value={regDesc} onChange={e => setRegDesc(e.target.value)} placeholder="Describe your startup idea in 2-3 sentences..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Problem Statement *</label>
              <textarea className="form-input" rows={3} value={regProblem} onChange={e => setRegProblem(e.target.value)} placeholder="What specific problem are you solving? Who faces this problem?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Proposed Solution *</label>
              <textarea className="form-input" rows={3} value={regSolution} onChange={e => setRegSolution(e.target.value)} placeholder="How does your product/service solve this problem?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Market *</label>
              <input type="text" className="form-input" value={regMarket} onChange={e => setRegMarket(e.target.value)} placeholder="Who are your primary customers? What is the market size?" required />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Submit for Screening <ChevronRight size={16} /></button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SCREENING QUEUE                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SCREENING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isScreener && (
            <div style={{ padding: '1rem 1.25rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: '#92400E', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertTriangle size={16} /> Access restricted. Only Incubation Admin, HOD, IQAC, and Registrar can review and approve startup applications.
            </div>
          )}

          {(['SUBMITTED', 'UNDER_SCREENING', 'COMMITTEE_REVIEW'] as IncubationApplicationStatus[]).map(qStatus => {
            const qItems = startups.filter(s => s.status === qStatus);
            if (qItems.length === 0) return null;
            return (
              <div key={qStatus} className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
                  {qStatus === 'SUBMITTED' ? '🔵 Newly Submitted' : qStatus === 'UNDER_SCREENING' ? '🟡 Under Initial Screening' : '🟠 Committee Review'} ({qItems.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr><th>Code</th><th>Title</th><th>Sector</th><th>Submitted</th><th>Screening Score</th><th>Remarks</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {qItems.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.ideaCode}</strong></td>
                          <td style={{ maxWidth: 240 }}>{s.title}</td>
                          <td><Badge variant="navy">{s.sector}</Badge></td>
                          <td>{s.registeredDate}</td>
                          <td>{s.screeningScore ? <strong style={{ color: 'var(--brand-orange)' }}>{s.screeningScore}/100</strong> : <span style={{ color: 'var(--text-muted)' }}>Not scored</span>}</td>
                          <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{s.screeningRemarks || '—'}</td>
                          <td>
                            {isScreener ? (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => { setSelectedStartup(s); setShowDetailModal(true); }}><Eye size={13} /> Review</button>
                                {qStatus === 'SUBMITTED' && <button className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => handleStatusUpdate(s, 'UNDER_SCREENING')}>▶ Screen</button>}
                                {qStatus === 'UNDER_SCREENING' && <button className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => handleStatusUpdate(s, 'COMMITTEE_REVIEW')}>▶ To Committee</button>}
                                {qStatus === 'COMMITTEE_REVIEW' && <>
                                  <button className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', background: '#059669' }} onClick={() => handleStatusUpdate(s, 'APPROVED')}>✓ Approve</button>
                                  <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', color: '#EF4444' }} onClick={() => handleStatusUpdate(s, 'REJECTED')}>✗ Reject</button>
                                </>}
                              </div>
                            ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Read-only</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Approved - awaiting mentor assignment */}
          {startups.filter(s => s.status === 'APPROVED' && !s.mentorId).length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>✅ Approved – Pending Mentor Assignment ({startups.filter(s => s.status === 'APPROVED' && !s.mentorId).length})</h3>
              {startups.filter(s => s.status === 'APPROVED' && !s.mentorId).map(s => (
                <div key={s.id} style={{ padding: '1rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{s.title}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({s.ideaCode})</span>
                  </div>
                  {isAdmin && (
                    <select className="form-select" style={{ maxWidth: 220 }} defaultValue="" onChange={e => {
                      const fac = faculty.find(f => f.id === e.target.value);
                      if (fac && user) { db.assignMentorToStartup(s.id, fac.id, fac.name, user); refreshData(); setSuccessMsg(`Mentor ${fac.name} assigned to ${s.title}.`); }
                    }}>
                      <option value="" disabled>Assign Mentor...</option>
                      {faculty.map(f => <option key={f.id} value={f.id}>{f.name} – {f.designation}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: FUNDING TRACKER                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'FUNDING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            <StatCard title="Total Funding Disbursed" value={`₹${(fundings.filter(f => f.status === 'DISBURSED').reduce((a, f) => a + f.amount, 0) / 100000).toFixed(2)}L`} icon={DollarSign} subtitle="Government + Private Grants" />
            <StatCard title="Funding Applications" value={String(fundings.length)} icon={FileText} subtitle="Across all startups" />
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>Startup Funding Disbursement Ledger</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToExcel('SSIU Incubation – Funding Ledger',
                ['Startup', 'Funding Type', 'Source', 'Amount (₹)', 'Received Date', 'Status'],
                fundings.map(f => [f.startupName, f.fundingType, f.source, f.amount, f.receivedDate, f.status]),
                {}, { name: user?.name, role: user?.role })}>
                <FileSpreadsheet size={15} /> Export
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>Startup</th><th>Funding Type</th><th>Source</th><th>Amount</th><th>Received Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {fundings.map(f => (
                    <tr key={f.id}>
                      <td style={{ maxWidth: 220 }}>{f.startupName}</td>
                      <td><Badge variant="navy">{f.fundingType}</Badge></td>
                      <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{f.source}</td>
                      <td><strong style={{ color: '#10B981' }}>₹{(f.amount / 100000).toFixed(2)}L</strong></td>
                      <td>{f.receivedDate}</td>
                      <td><Badge variant={f.status === 'DISBURSED' ? 'active' : 'orange'}>{f.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MENTOR SESSIONS                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'MENTOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isMentor && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSessionModal(true)}>
                <Plus size={15} /> Log Mentor Session
              </button>
            </div>
          )}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>Mentor Session Log ({sessions.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sessions.map(session => {
                const startup = startups.find(s => s.id === session.startupId);
                return (
                  <div key={session.id} style={{ padding: '1.25rem', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.9375rem' }}>{session.startupName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mentor: {session.mentorName} · {session.sessionDate} · {session.duration} min</div>
                      </div>
                      {session.rating && (
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(n => <Star key={n} size={14} fill={n <= session.rating! ? '#F59E0B' : 'none'} color={n <= session.rating! ? '#F59E0B' : '#CBD5E1'} />)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                      <div><strong>Agenda:</strong><br/>{session.agenda}</div>
                      <div><strong>Session Notes:</strong><br/>{session.notes}</div>
                      <div><strong>Next Steps:</strong><br/>{session.nextSteps}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: WORKSHOPS                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'WORKSHOPS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowWorkshopModal(true)}>
                <Plus size={15} /> Schedule Workshop
              </button>
            </div>
          )}
          <div className="grid-2">
            {workshops.map(ws => (
              <div key={ws.id} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${ws.status === 'UPCOMING' ? 'var(--brand-orange)' : '#10B981'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <Badge variant={ws.status === 'UPCOMING' ? 'orange' : 'active'}>{ws.status}</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ws.date}</span>
                </div>
                <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>{ws.title}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{ws.description}</p>
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>Venue:</strong> {ws.venue}</div>
                  <div><strong>By:</strong> {ws.conductedBy}</div>
                  <div><strong>Topic:</strong> {ws.topic}</div>
                  <div><strong>Registered Startups:</strong> {ws.registeredStartupIds.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: REPORTS                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            {[
              {
                title: 'Startup Portfolio Register',
                desc: 'All startups with sector, stage, funding, revenue, employment and IPR data. Used for NAAC Criterion 3.2 & 3.5.',
                onClick: () => exportToExcel('SSIU Incubation – Startup Portfolio Register (NAAC)',
                  ['Code', 'Title', 'Sector', 'Stage', 'Status', 'Mentor', 'Funding (₹)', 'Revenue (₹)', 'Jobs', 'Patent'],
                  startups.map(s => [s.ideaCode, s.title, s.sector, s.stage, s.status, s.mentorName || '—', s.fundingReceived, s.annualRevenue, s.employeesCount, s.patentStatus || 'NONE']),
                  {}, { name: user?.name, role: user?.role })
              },
              {
                title: 'Funding Disbursement Report',
                desc: 'SSIP, MSME, DST and private funding records with utilization status.',
                onClick: () => exportToExcel('SSIU Incubation – Funding Disbursement Report',
                  ['Startup', 'Type', 'Source', 'Amount (₹)', 'Date', 'Status'],
                  fundings.map(f => [f.startupName, f.fundingType, f.source, f.amount, f.receivedDate, f.status]),
                  {}, { name: user?.name, role: user?.role })
              },
              {
                title: 'Mentor Session Log Report',
                desc: 'All mentor-startup interaction logs with agenda, notes and next steps.',
                onClick: () => exportToExcel('SSIU Incubation – Mentor Session Log',
                  ['Date', 'Startup', 'Mentor', 'Duration (min)', 'Agenda', 'Next Steps'],
                  sessions.map(s => [s.sessionDate, s.startupName, s.mentorName, s.duration, s.agenda, s.nextSteps]),
                  {}, { name: user?.name, role: user?.role })
              },
              {
                title: 'IPR & Patent Portfolio',
                desc: 'Patents filed, published, and granted. Used for NAAC Criterion 3.4.',
                onClick: () => exportToExcel('SSIU Incubation – IPR & Patent Portfolio',
                  ['Code', 'Startup', 'Sector', 'Patent No.', 'Status'],
                  startups.filter(s => s.patentStatus && s.patentStatus !== 'NONE').map(s => [s.ideaCode, s.title, s.sector, s.patentApplicationNo || '—', s.patentStatus || 'NONE']),
                  {}, { name: user?.name, role: user?.role })
              },
            ].map((report, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <FileSpreadsheet size={20} color="var(--brand-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>{report.title}</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{report.desc}</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={report.onClick}>
                  <FileSpreadsheet size={14} /> Export to Excel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: REGISTER IDEA (inline)                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showRegisterModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>Register New Startup Idea</h3>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Startup Title *</label>
                <input type="text" className="form-input" value={regTitle} onChange={e => setRegTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sector *</label>
                <select className="form-select" value={regSector} onChange={e => setRegSector(e.target.value as StartupSector)}>
                  {(['EDTECH','HEALTHTECH','AGRITECH','FINTECH','CLEAN_ENERGY','MANUFACTURING','IOT_ROBOTICS','AI_ML','SOCIAL_IMPACT','OTHER'] as StartupSector[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Brief Description *</label>
                <textarea className="form-input" rows={2} value={regDesc} onChange={e => setRegDesc(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Problem Statement *</label>
                <textarea className="form-input" rows={2} value={regProblem} onChange={e => setRegProblem(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Proposed Solution *</label>
                <textarea className="form-input" rows={2} value={regSolution} onChange={e => setRegSolution(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Market *</label>
                <input type="text" className="form-input" value={regMarket} onChange={e => setRegMarket(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Screening</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: LOG MENTOR SESSION                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showSessionModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 580 }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>Log Mentor Session</h3>
            <form onSubmit={handleAddSession} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Startup *</label>
                <select className="form-select" value={sessionStartupId} onChange={e => setSessionStartupId(e.target.value)} required>
                  <option value="">Select Startup...</option>
                  {startups.filter(s => s.status === 'INCUBATING' || s.status === 'APPROVED').map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Session Date *</label>
                  <input type="date" className="form-input" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes) *</label>
                  <input type="number" className="form-input" value={sessionDuration} onChange={e => setSessionDuration(Number(e.target.value))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Agenda *</label>
                <input type="text" className="form-input" value={sessionAgenda} onChange={e => setSessionAgenda(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Session Notes *</label>
                <textarea className="form-input" rows={3} value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Next Steps *</label>
                <textarea className="form-input" rows={2} value={sessionNext} onChange={e => setSessionNext(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSessionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: SCHEDULE WORKSHOP                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showWorkshopModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>Schedule Incubation Workshop</h3>
            <form onSubmit={handleAddWorkshop} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Workshop Title *</label>
                <input type="text" className="form-input" value={wsTitle} onChange={e => setWsTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Topic / Description *</label>
                <textarea className="form-input" rows={2} value={wsTopic} onChange={e => setWsTopic(e.target.value)} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={wsDate} onChange={e => setWsDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input type="text" className="form-input" value={wsVenue} onChange={e => setWsVenue(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Conducted By *</label>
                <input type="text" className="form-input" value={wsConductedBy} onChange={e => setWsConductedBy(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWorkshopModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Workshop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: STARTUP DETAIL VIEW                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showDetailModal && selectedStartup && (
        <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" style={{ maxWidth: 780, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.25rem' }}>{selectedStartup.ideaCode}</div>
                <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>{selectedStartup.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Badge variant={statusBadgeVariant(selectedStartup.status)}>{selectedStartup.status}</Badge>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDetailModal(false)}>✕</button>
              </div>
            </div>

            {/* Two-column detail grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                ['Sector', selectedStartup.sector],
                ['Stage', selectedStartup.stage],
                ['Mentor', selectedStartup.mentorName || 'Not Assigned'],
                ['Patent Status', selectedStartup.patentStatus || 'NONE'],
                ['Patent No.', selectedStartup.patentApplicationNo || '—'],
                ['Funding Received', `₹${(selectedStartup.fundingReceived / 100000).toFixed(2)}L`],
                ['Annual Revenue', `₹${(selectedStartup.annualRevenue / 100000).toFixed(2)}L`],
                ['Employees Created', String(selectedStartup.employeesCount)],
                ['Awards', selectedStartup.awards || '—'],
                ['Investors', selectedStartup.investorNames || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Problem Statement:</strong>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selectedStartup.problemStatement}</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Proposed Solution:</strong>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selectedStartup.proposedSolution}</p>
            </div>

            {/* Milestones */}
            {selectedStartup.milestones.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Milestones ({selectedStartup.milestones.length})</strong>
                {selectedStartup.milestones.map(ms => (
                  <div key={ms.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem', marginBottom: '0.35rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}>
                      {ms.status === 'COMPLETED' ? <CheckCircle2 size={16} color="#059669" /> : ms.status === 'IN_PROGRESS' ? <Clock size={16} color="#F59E0B" /> : <XCircle size={16} color="#CBD5E1" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{ms.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {ms.targetDate}{ms.completedDate ? ` · Completed: ${ms.completedDate}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents */}
            {selectedStartup.documents.length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Documents ({selectedStartup.documents.length})</strong>
                {selectedStartup.documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', marginBottom: '0.35rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.8125rem' }}><FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--brand-orange)' }} />{doc.name}</div>
                    <Badge variant={doc.verified ? 'active' : 'orange'}>{doc.verified ? 'Verified' : 'Pending'}</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Screening Remarks */}
            {selectedStartup.screeningRemarks && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.25rem' }}>Screening Remarks</div>
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>{selectedStartup.screeningRemarks}</p>
              </div>
            )}
            {selectedStartup.committeeRemarks && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', marginBottom: '0.25rem' }}>Committee Approval Remarks</div>
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>{selectedStartup.committeeRemarks}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
