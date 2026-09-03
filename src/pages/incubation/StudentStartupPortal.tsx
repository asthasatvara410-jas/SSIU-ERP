import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import {
  Rocket, Users, Lightbulb, TrendingUp, Award, FileSpreadsheet,
  Plus, CheckCircle2, XCircle, Clock, FileText, Star, Calendar,
  BookOpen, DollarSign, ShieldCheck, Eye, ChevronRight, AlertTriangle,
  Target, Zap, Upload, Briefcase, Globe, Bell, RefreshCcw, Edit3,
  AlertCircle, Info, ArrowRight, Building2, GraduationCap, MapPin
} from 'lucide-react';
import {
  StartupIdea, StartupSector, StartupStage, StartupMilestone, StartupDocument, IncubationApplicationStatus
} from '../../types';
import { exportToExcel } from '../../services/exportService';

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGE_ORDER: StartupStage[] = ['IDEA', 'VALIDATION', 'PROTOTYPE', 'MVP', 'EARLY_REVENUE', 'GROWTH', 'SCALING', 'GRADUATED'];

const stageColor = (s: StartupStage): string => {
  const m: Record<string, string> = {
    IDEA: '#8B5CF6', VALIDATION: '#3B82F6', PROTOTYPE: '#06B6D4',
    MVP: '#10B981', EARLY_REVENUE: '#F59E0B', GROWTH: '#F97316',
    SCALING: '#EF4444', GRADUATED: '#059669', ALUMNI: '#6B7280'
  };
  return m[s] || '#6B7280';
};

const statusConfig: Record<IncubationApplicationStatus, { label: string; color: string; bg: string; icon: string }> = {
  DRAFT:            { label: 'Draft',            color: '#6B7280', bg: '#F3F4F6', icon: '📝' },
  SUBMITTED:        { label: 'Submitted',         color: '#3B82F6', bg: '#EFF6FF', icon: '📤' },
  UNDER_SCREENING:  { label: 'Under Screening',   color: '#F59E0B', bg: '#FFFBEB', icon: '🔍' },
  SCREENED:         { label: 'Screened',           color: '#8B5CF6', bg: '#F5F3FF', icon: '✅' },
  COMMITTEE_REVIEW: { label: 'Committee Review',   color: '#F97316', bg: '#FFF7ED', icon: '🏛️' },
  APPROVED:         { label: 'Approved',           color: '#059669', bg: '#ECFDF5', icon: '✅' },
  REJECTED:         { label: 'Rejected',           color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
  INCUBATING:       { label: 'Incubating',         color: '#059669', bg: '#ECFDF5', icon: '🚀' },
  GRADUATED:        { label: 'Graduated',          color: '#D97706', bg: '#FFF7ED', icon: '🎓' },
  WITHDRAWN:        { label: 'Withdrawn',          color: '#6B7280', bg: '#F3F4F6', icon: '↩️' },
};

type TabType = 'HOME' | 'PROFILE' | 'TEAM' | 'MILESTONES' | 'MENTOR' | 'WORKSHOPS' | 'FUNDING' | 'DOCUMENTS' | 'IPR' | 'REPORTS';

const SECTOR_LABELS: Record<StartupSector, string> = {
  EDTECH: 'EdTech', HEALTHTECH: 'HealthTech', AGRITECH: 'AgriTech',
  FINTECH: 'FinTech', CLEAN_ENERGY: 'Clean Energy', MANUFACTURING: 'Manufacturing',
  IOT_ROBOTICS: 'IoT / Robotics', AI_ML: 'AI / ML', SOCIAL_IMPACT: 'Social Impact', OTHER: 'Other'
};

// ─── Shared helpers ────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value?: string | number | React.ReactNode; muted?: boolean }> = ({ label, value, muted }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    <span style={{ fontSize: '0.875rem', color: muted ? 'var(--text-muted)' : 'var(--brand-navy)', fontWeight: 600 }}>{value ?? '—'}</span>
  </div>
);

const Section: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }> = ({ title, subtitle, icon, children, action }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
        </h3>
        {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT STARTUP PORTAL (Full Component)
// ══════════════════════════════════════════════════════════════════════════════
export const StudentStartupPortal: React.FC = () => {
  const { user, role } = useAuth();
  const studentRecord = db.getStudents().find(s => s.id === user?.id || s.enrollmentNo === user?.enrollmentNo);
  const institute = db.getInstituteById(studentRecord?.instituteId || '');
  const dept = db.getDepartmentById(studentRecord?.departmentId || '');
  const program = db.getProgramById(studentRecord?.programId || '');

  // My startups (where I am a founder)
  const [myStartups, setMyStartups] = useState<StartupIdea[]>(() =>
    user ? db.getStartupsByFounder(user.id) : []
  );
  const [selectedStartup, setSelectedStartup] = useState<StartupIdea | null>(
    myStartups[0] || null
  );
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const allWorkshops = db.getIncubationWorkshops();
  const myFundings = selectedStartup ? db.getStartupFundingsByStartup(selectedStartup.id) : [];
  const mySessions = selectedStartup ? db.getMentorSessionsByStartup(selectedStartup.id) : [];
  const myWorkshops = selectedStartup
    ? allWorkshops.filter(w => w.registeredStartupIds.includes(selectedStartup.id))
    : [];
  const allFaculty = db.getFaculty();
  const mentor = selectedStartup?.mentorId ? allFaculty.find(f => f.id === selectedStartup.mentorId) : null;

  // ─── Register new idea form ────────────────────────────────────────────────
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regTitle, setRegTitle] = useState('');
  const [regSector, setRegSector] = useState<StartupSector>('AI_ML');
  const [regDesc, setRegDesc] = useState('');
  const [regProblem, setRegProblem] = useState('');
  const [regSolution, setRegSolution] = useState('');
  const [regMarket, setRegMarket] = useState('');
  const [regBizModel, setRegBizModel] = useState('');

  // ─── Profile edit form ─────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editSolution, setEditSolution] = useState('');
  const [editMarket, setEditMarket] = useState('');
  const [editRevenue, setEditRevenue] = useState(0);
  const [editEmployees, setEditEmployees] = useState(0);
  const [editInvestors, setEditInvestors] = useState('');
  const [editAwards, setEditAwards] = useState('');

  // ─── Milestone add form ────────────────────────────────────────────────────
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msTarget, setMsTarget] = useState('');

  // ─── Document upload form ──────────────────────────────────────────────────
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<StartupDocument['type']>('PITCH_DECK');
  const [docFile, setDocFile] = useState('');

  // ─── IPR form ─────────────────────────────────────────────────────────────
  const [showIprModal, setShowIprModal] = useState(false);
  const [iprNo, setIprNo] = useState(selectedStartup?.patentApplicationNo || '');
  const [iprStatus, setIprStatus] = useState<StartupIdea['patentStatus']>(selectedStartup?.patentStatus || 'NONE');

  const refreshData = () => {
    if (!user) return;
    const updated = db.getStartupsByFounder(user.id);
    setMyStartups(updated);
    if (selectedStartup) {
      setSelectedStartup(updated.find(s => s.id === selectedStartup.id) || updated[0] || null);
    } else {
      setSelectedStartup(updated[0] || null);
    }
  };

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
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
      instituteId: studentRecord?.instituteId || 'inst-1',
      departmentId: studentRecord?.departmentId || 'dept-1',
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      applicationStatus: 'SUBMITTED',
      hasPrototype: false, hasProduct: false,
      fundingReceived: 0, totalInvestment: 0, annualRevenue: 0, employeesCount: 1,
    }, user);
    refreshData();
    setShowRegisterModal(false);
    setRegTitle(''); setRegDesc(''); setRegProblem(''); setRegSolution(''); setRegMarket(''); setRegBizModel('');
    setActiveTab('HOME');
    flashSuccess(`Startup idea "${regTitle}" submitted for incubation screening! Track your application status below.`);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStartup) return;
    db.updateStartupByStudent(selectedStartup.id, {
      description: editDesc,
      problemStatement: editProblem,
      proposedSolution: editSolution,
      targetMarket: editMarket,
      annualRevenue: editRevenue,
      employeesCount: editEmployees,
      investorNames: editInvestors,
      awards: editAwards,
    }, user);
    refreshData();
    setShowEditModal(false);
    flashSuccess('Startup profile updated successfully.');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStartup) return;
    db.addMilestoneUpdate(selectedStartup.id, {
      startupId: selectedStartup.id,
      title: msTitle,
      description: msDesc,
      targetDate: msTarget,
      status: 'IN_PROGRESS',
    }, user);
    refreshData();
    setShowMilestoneModal(false);
    setMsTitle(''); setMsDesc(''); setMsTarget('');
    flashSuccess(`Milestone "${msTitle}" added. Your mentor can now track your progress.`);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStartup) return;
    db.addStartupDocument(selectedStartup.id, {
      startupId: selectedStartup.id,
      name: docName,
      type: docType,
      uploadedDate: new Date().toISOString().split('T')[0],
      fileUrl: docFile,
      verified: false,
    }, user);
    refreshData();
    setShowDocModal(false);
    setDocName(''); setDocFile('');
    flashSuccess(`Document "${docName}" uploaded and sent for Admin verification.`);
  };

  const handleSaveIpr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStartup) return;
    db.updateStartupByStudent(selectedStartup.id, {
      patentApplicationNo: iprNo,
      patentStatus: iprStatus,
    }, user);
    refreshData();
    setShowIprModal(false);
    flashSuccess('IPR / Patent details updated successfully.');
  };

  const openEditModal = (startup: StartupIdea) => {
    setEditDesc(startup.description);
    setEditProblem(startup.problemStatement);
    setEditSolution(startup.proposedSolution);
    setEditMarket(startup.targetMarket);
    setEditRevenue(startup.annualRevenue);
    setEditEmployees(startup.employeesCount);
    setEditInvestors(startup.investorNames || '');
    setEditAwards(startup.awards || '');
    setShowEditModal(true);
  };

  const openIprModal = (startup: StartupIdea) => {
    setIprNo(startup.patentApplicationNo || '');
    setIprStatus(startup.patentStatus || 'NONE');
    setShowIprModal(true);
  };

  // ─── No startup yet ────────────────────────────────────────────────────────
  if (myStartups.length === 0 && !showRegisterModal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              My Startup & Incubation Portal
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              SSIU Incubation Centre — Idea → Validation → Prototype → MVP → Market → Graduation
            </p>
          </div>
        </div>

        {/* Welcome / No startup state */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {[
            { icon: Lightbulb, label: 'Register Your Idea', desc: 'Submit your startup idea for incubation screening', color: '#8B5CF6' },
            { icon: Rocket, label: 'Get Incubated', desc: 'Receive mentorship, workspace, and resources', color: '#3B82F6' },
            { icon: TrendingUp, label: 'Scale & Graduate', desc: 'Build your product, raise funding, and graduate', color: '#10B981' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="card" style={{ padding: '1.5rem', textAlign: 'center', border: `2px solid ${color}20` }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Icon size={28} color={color} />
              </div>
              <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>{label}</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '3rem', textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--brand-orange)' }}>
          <Rocket size={52} color="var(--brand-orange)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.375rem', marginBottom: '0.5rem' }}>
            You haven't registered a startup yet!
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 1.5rem' }}>
            Join the SSIU Incubation Programme. Register your idea, get mentored by experienced faculty, 
            access funding opportunities, and build the next successful startup from campus!
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)} style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
              <Plus size={18} /> Register My Startup Idea
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Your application will be connected to: <strong>{institute?.name}</strong> · <strong>{dept?.name}</strong> · <strong>{program?.name}</strong>
          </p>
        </div>

        {/* Available Workshops */}
        {allWorkshops.filter(w => w.status === 'UPCOMING').length > 0 && (
          <Section title="Upcoming Incubation Workshops" subtitle="Open for all student innovators" icon={<BookOpen size={18} color="var(--brand-orange)" />}>
            <div className="grid-2">
              {allWorkshops.filter(w => w.status === 'UPCOMING').map(ws => (
                <div key={ws.id} style={{ padding: '1rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <Badge variant="orange">UPCOMING</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ws.date}</span>
                  </div>
                  <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>{ws.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{ws.description}</p>
                  <div style={{ fontSize: '0.8rem' }}><strong>Venue:</strong> {ws.venue}</div>
                  <div style={{ fontSize: '0.8rem' }}><strong>By:</strong> {ws.conductedBy}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {showRegisterModal && renderRegisterModal()}
      </div>
    );
  }

  // ─── Render Register Modal (extracted for reuse) ────────────────────────────
  function renderRegisterModal() {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>
              <Rocket size={20} color="var(--brand-orange)" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Register New Startup Idea
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowRegisterModal(false)}>✕</button>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem', color: '#1E40AF' }}>
            <strong>Auto-connected to:</strong> {institute?.name || 'Institute'} · {dept?.name || 'Department'} · {program?.name || 'Program'} · Enrollment No: {user?.enrollmentNo || '—'}
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Startup / Idea Title *</label>
              <input type="text" className="form-input" value={regTitle} onChange={e => setRegTitle(e.target.value)} placeholder="e.g. AI-powered Rural Health Diagnostics" required />
            </div>
            <div className="form-group">
              <label className="form-label">Industry Sector *</label>
              <select className="form-select" value={regSector} onChange={e => setRegSector(e.target.value as StartupSector)}>
                {(Object.entries(SECTOR_LABELS) as [StartupSector, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brief Description *</label>
              <textarea className="form-input" rows={2} value={regDesc} onChange={e => setRegDesc(e.target.value)} placeholder="Describe your startup in 2-3 sentences..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Problem Statement *</label>
              <textarea className="form-input" rows={3} value={regProblem} onChange={e => setRegProblem(e.target.value)} placeholder="What specific problem are you solving? Who suffers from this and what is its scale?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Proposed Solution *</label>
              <textarea className="form-input" rows={3} value={regSolution} onChange={e => setRegSolution(e.target.value)} placeholder="How does your product/service uniquely solve this problem?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Market *</label>
              <input type="text" className="form-input" value={regMarket} onChange={e => setRegMarket(e.target.value)} placeholder="Who are your primary customers? Market size / geography?" required />
            </div>
            <div className="form-group">
              <label className="form-label">Business Model (Revenue Strategy)</label>
              <textarea className="form-input" rows={2} value={regBizModel} onChange={e => setRegBizModel(e.target.value)} placeholder="How will your startup make money? (Subscription, B2B, B2C, Freemium, etc.)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Rocket size={16} /> Submit for Incubation Screening <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── Startup switcher (when student has multiple startups) ─────────────────
  const StartupSwitcher = () => myStartups.length > 1 ? (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {myStartups.map(s => (
        <button key={s.id} className={`btn btn-sm ${selectedStartup?.id === s.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedStartup(s)}>
          {s.ideaCode}
        </button>
      ))}
    </div>
  ) : null;

  if (!selectedStartup) return null;

  const statusCfg = statusConfig[selectedStartup.status];
  const stageIdx = STAGE_ORDER.indexOf(selectedStartup.stage);
  const nextMilestone = selectedStartup.milestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING');
  const completedMilestones = selectedStartup.milestones.filter(m => m.status === 'COMPLETED').length;

  // ─── TABS ──────────────────────────────────────────────────────────────────
  const tabs: Array<[TabType, string, React.ReactNode]> = [
    ['HOME', 'My Dashboard', <Rocket size={14} />],
    ['PROFILE', 'Startup Profile', <Lightbulb size={14} />],
    ['TEAM', 'Team & Founders', <Users size={14} />],
    ['MILESTONES', `Milestones (${selectedStartup.milestones.length})`, <Target size={14} />],
    ['MENTOR', `Mentor (${mySessions.length} sessions)`, <Star size={14} />],
    ['WORKSHOPS', `Workshops (${myWorkshops.length})`, <BookOpen size={14} />],
    ['FUNDING', `Funding (${myFundings.length})`, <DollarSign size={14} />],
    ['DOCUMENTS', `Documents (${selectedStartup.documents.length})`, <FileText size={14} />],
    ['IPR', 'IPR / Patent', <ShieldCheck size={14} />],
    ['REPORTS', 'Reports', <FileSpreadsheet size={14} />],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>My Startup Portal</h2>
            <div style={{ padding: '4px 12px', background: statusCfg.bg, border: `1px solid ${statusCfg.color}40`, borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: statusCfg.color }}>
              {statusCfg.icon} {statusCfg.label}
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selectedStartup.ideaCode} · {selectedStartup.title}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { refreshData(); flashSuccess('Data refreshed.'); }}>
            <RefreshCcw size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(selectedStartup)}>
            <Edit3 size={14} /> Update Profile
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRegisterModal(true)}>
            <Plus size={14} /> New Idea
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#059669" /> {successMsg}
        </div>
      )}

      <StartupSwitcher />

      {/* ─── Application Status Timeline ──────────────────────────────────────── */}
      {(selectedStartup.status === 'SUBMITTED' || selectedStartup.status === 'UNDER_SCREENING' || selectedStartup.status === 'COMMITTEE_REVIEW') && (
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#FFF7ED', borderLeft: '4px solid #F97316' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={16} color="#F97316" />
            <strong style={{ color: '#C2410C' }}>Application In Progress</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#92400E', margin: 0 }}>
            Your application <strong>{selectedStartup.ideaCode}</strong> is currently: <strong>{statusCfg.label}</strong>. 
            The Incubation Team will review and respond within 7 working days. You will receive a notification once a decision is made.
          </p>
          {selectedStartup.screeningRemarks && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 1rem', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
              <strong>Screening Remarks:</strong> {selectedStartup.screeningRemarks}
            </div>
          )}
        </div>
      )}

      {selectedStartup.status === 'REJECTED' && (
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <XCircle size={16} color="#EF4444" />
            <strong style={{ color: '#B91C1C' }}>Application Not Selected</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
            {selectedStartup.rejectionReason || 'Your application was not selected in this cycle. You may revise and resubmit.'}
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setShowRegisterModal(true)}>
            <RefreshCcw size={14} /> Register Revised Idea
          </button>
        </div>
      )}

      {/* ─── Tab Bar ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {tabs.map(([id, label, icon]) => (
          <button key={id} className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(id)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MY DASHBOARD                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'HOME' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* KPI Row */}
          <div className="grid-4">
            <StatCard title="Current Stage" value={selectedStartup.stage.replace('_', ' ')} icon={Rocket} subtitle={`Stage ${stageIdx + 1} of ${STAGE_ORDER.length}`} />
            <StatCard title="Milestones Done" value={`${completedMilestones} / ${selectedStartup.milestones.length}`} icon={Target} subtitle="Completed milestones" />
            <StatCard title="Funding Raised" value={`₹${(selectedStartup.fundingReceived / 100000).toFixed(1)}L`} icon={DollarSign} subtitle="Total grants & investments" />
            <StatCard title="Team Size" value={String(selectedStartup.employeesCount)} icon={Users} subtitle="Founders & team members" />
          </div>

          {/* Stage Timeline */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--brand-orange)" /> Startup Lifecycle Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {STAGE_ORDER.map((stage, i) => {
                const active = selectedStartup.stage === stage;
                const done = stageIdx > i;
                return (
                  <React.Fragment key={stage}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: 90 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: done ? '#059669' : active ? stageColor(stage) : '#E2E8F0',
                        border: active ? `3px solid ${stageColor(stage)}` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: done || active ? '#FFF' : '#94A3B8',
                        fontWeight: 800, fontSize: '0.875rem',
                        boxShadow: active ? `0 0 0 4px ${stageColor(stage)}30` : 'none',
                        transition: 'all 0.2s'
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: active ? 800 : 600, color: active ? stageColor(stage) : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2, width: 80 }}>
                        {stage.replace('_', ' ')}
                      </span>
                    </div>
                    {i < STAGE_ORDER.length - 1 && (
                      <div style={{ height: 3, flex: 1, minWidth: 20, background: done ? '#059669' : '#E2E8F0', marginTop: -18 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Two column: Startup Summary + Next Actions */}
          <div className="grid-2">
            <Section title="Startup Summary" icon={<Lightbulb size={16} color="var(--brand-orange)" />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <InfoRow label="Title" value={selectedStartup.title} />
                <InfoRow label="Sector" value={SECTOR_LABELS[selectedStartup.sector]} />
                <InfoRow label="Registered" value={selectedStartup.registeredDate} />
                <InfoRow label="Idea Code" value={selectedStartup.ideaCode} />
                <InfoRow label="Institute" value={institute?.name} />
                <InfoRow label="Department" value={dept?.name} />
                <InfoRow label="Program" value={program?.name} />
                <InfoRow label="Enrollment No." value={user?.enrollmentNo || '—'} />
              </div>
            </Section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Mentor card */}
              <Section title="Assigned Mentor" icon={<Star size={16} color="var(--brand-orange)" />}>
                {mentor ? (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                      {mentor.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{mentor.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mentor.designation}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mentor.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {mySessions.length} session{mySessions.length !== 1 ? 's' : ''} logged
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <Clock size={16} style={{ marginBottom: '0.35rem' }} />
                    <div>Mentor will be assigned by the Incubation Team after application approval.</div>
                  </div>
                )}
              </Section>

              {/* Next milestone */}
              <Section title="Next Milestone" icon={<Target size={16} color="var(--brand-orange)" />}
                action={<button className="btn btn-primary btn-sm" onClick={() => setActiveTab('MILESTONES')}><Eye size={13} /></button>}>
                {nextMilestone ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>{nextMilestone.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{nextMilestone.description}</div>
                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '1rem' }}>
                      <span>🎯 Target: <strong>{nextMilestone.targetDate}</strong></span>
                      <Badge variant={nextMilestone.status === 'IN_PROGRESS' ? 'orange' : 'navy'}>{nextMilestone.status}</Badge>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    {selectedStartup.milestones.length === 0 ? 'No milestones added yet. Add your first milestone!' : 'All milestones completed! 🎉'}
                  </div>
                )}
              </Section>
            </div>
          </div>

          {/* Pending actions */}
          <Section title="Pending Tasks & Recommended Actions" icon={<Bell size={16} color="var(--brand-orange)" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {!selectedStartup.mentorId && selectedStartup.status === 'APPROVED' && (
                <div style={{ padding: '0.75rem 1rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={15} /> Awaiting mentor assignment from Incubation Team.
                </div>
              )}
              {selectedStartup.documents.length === 0 && (
                <div style={{ padding: '0.75rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span><Info size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> No documents uploaded. Add your Pitch Deck and Business Plan.</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('DOCUMENTS')}>Upload Now</button>
                </div>
              )}
              {(!selectedStartup.patentStatus || selectedStartup.patentStatus === 'NONE') && selectedStartup.hasPrototype && (
                <div style={{ padding: '0.75rem 1rem', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: '#5B21B6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span><ShieldCheck size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> You have a prototype — consider filing for a Patent to protect your innovation.</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('IPR')}>File IPR</button>
                </div>
              )}
              {nextMilestone && (
                <div style={{ padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span><Target size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Upcoming milestone: <strong>{nextMilestone.title}</strong> due on {nextMilestone.targetDate}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('MILESTONES')}>View</button>
                </div>
              )}
              {selectedStartup.status === 'INCUBATING' && selectedStartup.fundingReceived === 0 && (
                <div style={{ padding: '0.75rem 1rem', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span><DollarSign size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Explore SSIP Government funding and seed grants available for incubated startups.</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('FUNDING')}>Explore</button>
                </div>
              )}
              {selectedStartup.status !== 'INCUBATING' && selectedStartup.status !== 'APPROVED' && selectedStartup.status !== 'SUBMITTED' && selectedStartup.status !== 'UNDER_SCREENING' && selectedStartup.status !== 'COMMITTEE_REVIEW' && (
                <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="#10B981" /> All tasks up to date. Keep updating your milestones and documents regularly.
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: STARTUP PROFILE                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PROFILE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            <Section title="Startup Identity" icon={<Lightbulb size={16} color="var(--brand-orange)" />}
              action={<button className="btn btn-secondary btn-sm" onClick={() => openEditModal(selectedStartup)}><Edit3 size={14} /> Edit</button>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <InfoRow label="Idea Code" value={selectedStartup.ideaCode} />
                <InfoRow label="Title" value={selectedStartup.title} />
                <InfoRow label="Sector" value={SECTOR_LABELS[selectedStartup.sector]} />
                <InfoRow label="Current Stage" value={selectedStartup.stage.replace('_', ' ')} />
                <InfoRow label="Application Status" value={statusCfg.label} />
                <InfoRow label="Registered Date" value={selectedStartup.registeredDate} />
                <InfoRow label="Has Prototype" value={selectedStartup.hasPrototype ? '✅ Yes' : '❌ No'} />
                <InfoRow label="Has Product" value={selectedStartup.hasProduct ? '✅ Yes' : '❌ No'} />
              </div>
            </Section>

            <Section title="Business Overview" icon={<Briefcase size={16} color="var(--brand-orange)" />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <InfoRow label="Annual Revenue" value={`₹${selectedStartup.annualRevenue.toLocaleString()}`} />
                <InfoRow label="Total Investment" value={`₹${selectedStartup.totalInvestment.toLocaleString()}`} />
                <InfoRow label="Funding Received" value={`₹${selectedStartup.fundingReceived.toLocaleString()}`} />
                <InfoRow label="Employees / Team Size" value={selectedStartup.employeesCount} />
                <InfoRow label="Investors" value={selectedStartup.investorNames || 'None yet'} muted={!selectedStartup.investorNames} />
                <InfoRow label="Awards & Recognition" value={selectedStartup.awards || 'None yet'} muted={!selectedStartup.awards} />
              </div>
            </Section>
          </div>

          <Section title="Problem Statement" icon={<AlertCircle size={16} color="var(--brand-orange)" />}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedStartup.problemStatement}</p>
          </Section>

          <Section title="Proposed Solution" icon={<Zap size={16} color="var(--brand-orange)" />}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedStartup.proposedSolution}</p>
          </Section>

          <Section title="Target Market" icon={<Globe size={16} color="var(--brand-orange)" />}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedStartup.targetMarket}</p>
          </Section>

          <Section title="Full Description" icon={<BookOpen size={16} color="var(--brand-orange)" />}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedStartup.description}</p>
          </Section>

          {/* Screening/Committee Remarks */}
          {(selectedStartup.screeningRemarks || selectedStartup.committeeRemarks) && (
            <Section title="Incubation Team Remarks" icon={<Info size={16} color="var(--brand-orange)" />}>
              {selectedStartup.screeningRemarks && (
                <div style={{ padding: '0.875rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.35rem' }}>SCREENING REMARKS</div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{selectedStartup.screeningRemarks}</p>
                  {selectedStartup.screeningScore && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', fontWeight: 700 }}>Screening Score: {selectedStartup.screeningScore}/100</p>}
                </div>
              )}
              {selectedStartup.committeeRemarks && (
                <div style={{ padding: '0.875rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', marginBottom: '0.35rem' }}>COMMITTEE DECISION</div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{selectedStartup.committeeRemarks}</p>
                </div>
              )}
            </Section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: TEAM & FOUNDERS                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'TEAM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Section title="Founding Team" subtitle="DEMO founders connected to this startup" icon={<Users size={16} color="var(--brand-orange)" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedStartup.founderIds.map((fid, i) => {
                const student = db.getStudents().find(s => s.id === fid);
                const fac = allFaculty.find(f => f.id === fid);
                const person = student || fac;
                const isLead = fid === selectedStartup.leadFounderId;
                return (
                  <div key={fid} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: isLead ? '2px solid var(--brand-orange)' : '1px solid var(--border-color)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: isLead ? 'var(--brand-orange)' : 'var(--brand-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0 }}>
                      {(person?.name || `F${i + 1}`).charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {person?.name || fid}
                        {isLead && <Badge variant="orange">Lead Founder</Badge>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {student ? `Student · ${student.enrollmentNo}` : fac ? `${fac.designation} · Faculty` : 'Co-Founder'}
                      </div>
                      {person && 'email' in person && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{person.email}</div>}
                    </div>
                    <Badge variant={isLead ? 'active' : 'navy'}>{isLead ? 'Lead' : `Co-Founder ${i}`}</Badge>
                  </div>
                );
              })}
            </div>
          </Section>

          {mentor && (
            <Section title="Assigned Mentor" icon={<Star size={16} color="var(--brand-orange)" />}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#FFF7ED', borderRadius: 'var(--radius-md)', border: '2px solid var(--brand-orange)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0 }}>
                  {mentor.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{mentor.name} <Badge variant="gold">Mentor</Badge></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mentor.designation} · {mentor.departmentId}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mentor.email} · {mentor.phone}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Specialization: {mentor.specialization || '—'} · Experience: {mentor.experienceYears} yrs</div>
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MILESTONES                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'MILESTONES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneModal(true)}>
              <Plus size={14} /> Add Milestone
            </button>
          </div>

          <div className="grid-3">
            <StatCard title="Total Milestones" value={String(selectedStartup.milestones.length)} icon={Target} subtitle="Planned" />
            <StatCard title="Completed" value={String(completedMilestones)} icon={CheckCircle2} subtitle="Successfully achieved" />
            <StatCard title="In Progress" value={String(selectedStartup.milestones.filter(m => m.status === 'IN_PROGRESS').length)} icon={Clock} subtitle="Currently active" />
          </div>

          {selectedStartup.milestones.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', borderStyle: 'dashed' }}>
              <Target size={40} color="var(--brand-orange)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>No milestones added yet</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Define milestones to track your startup's progress. Your mentor can review and validate them.</p>
              <button className="btn btn-primary" onClick={() => setShowMilestoneModal(true)}><Plus size={16} /> Add First Milestone</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedStartup.milestones.map((ms, i) => (
                <div key={ms.id} style={{
                  display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.25rem',
                  background: ms.status === 'COMPLETED' ? '#F0FDF4' : ms.status === 'IN_PROGRESS' ? '#FFFBEB' : '#F8FAFC',
                  border: `1px solid ${ms.status === 'COMPLETED' ? '#6EE7B7' : ms.status === 'IN_PROGRESS' ? '#FEF3C7' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {ms.status === 'COMPLETED' ? <CheckCircle2 size={22} color="#059669" /> : ms.status === 'IN_PROGRESS' ? <Clock size={22} color="#F59E0B" /> : ms.status === 'OVERDUE' ? <XCircle size={22} color="#EF4444" /> : <Target size={22} color="#CBD5E1" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--brand-navy)' }}>{ms.title}</strong>
                      <Badge variant={ms.status === 'COMPLETED' ? 'active' : ms.status === 'IN_PROGRESS' ? 'orange' : ms.status === 'OVERDUE' ? 'inactive' : 'navy'}>{ms.status}</Badge>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.35rem 0' }}>{ms.description}</p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                      <span>🎯 Target: <strong>{ms.targetDate}</strong></span>
                      {ms.completedDate && <span>✅ Completed: <strong>{ms.completedDate}</strong></span>}
                      {ms.evidenceUrl && <a href={ms.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-orange)' }}>📎 Evidence</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MENTOR SESSIONS                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'MENTOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!mentor && (
            <div style={{ padding: '1rem 1.25rem', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: '#92400E', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Clock size={16} /> Mentor not yet assigned. Sessions will appear once the Incubation Team assigns your mentor.
            </div>
          )}

          {mySessions.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <Star size={36} color="var(--brand-orange)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>No mentor sessions logged yet</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sessions logged by your mentor will appear here with agenda, notes and next steps.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mySessions.map(session => (
                <div key={session.id} style={{ padding: '1.25rem', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.9375rem' }}>{session.mentorName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{session.sessionDate} · {session.duration} minutes</div>
                    </div>
                    {session.rating && (
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} fill={n <= session.rating! ? '#F59E0B' : 'none'} color={n <= session.rating! ? '#F59E0B' : '#CBD5E1'} />)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
                    <div><strong>Agenda:</strong><br />{session.agenda}</div>
                    <div><strong>Session Notes:</strong><br />{session.notes}</div>
                    <div><strong>Next Steps:</strong><br />{session.nextSteps}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: WORKSHOPS                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'WORKSHOPS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-3">
            <StatCard title="Workshops Attended" value={String(myWorkshops.filter(w => w.status === 'COMPLETED').length)} icon={BookOpen} subtitle="Completed" />
            <StatCard title="Upcoming Workshops" value={String(allWorkshops.filter(w => w.status === 'UPCOMING').length)} icon={Calendar} subtitle="Open for registration" />
            <StatCard title="Total Institute Workshops" value={String(allWorkshops.length)} icon={Award} subtitle="All time" />
          </div>

          {myWorkshops.length > 0 && (
            <Section title={`My Workshop History (${myWorkshops.length})`} icon={<Award size={16} color="var(--brand-orange)" />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myWorkshops.map(ws => (
                  <div key={ws.id} style={{ padding: '1rem', background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{ws.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ws.date} · {ws.venue} · By: {ws.conductedBy}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Topic: {ws.topic}</div>
                    </div>
                    <Badge variant="active">COMPLETED</Badge>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="All Upcoming Workshops — Open for Registration" icon={<Calendar size={16} color="var(--brand-orange)" />}>
            {allWorkshops.filter(w => w.status === 'UPCOMING').length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No upcoming workshops currently scheduled.</p>
            ) : (
              <div className="grid-2">
                {allWorkshops.filter(w => w.status === 'UPCOMING').map(ws => (
                  <div key={ws.id} style={{ padding: '1.25rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <Badge variant="orange">UPCOMING</Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ws.date}</span>
                    </div>
                    <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.875rem', marginBottom: '0.35rem' }}>{ws.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{ws.description}</p>
                    <div style={{ fontSize: '0.8rem' }}><strong>Venue:</strong> {ws.venue}</div>
                    <div style={{ fontSize: '0.8rem' }}><strong>Topic:</strong> {ws.topic}</div>
                    <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}><strong>By:</strong> {ws.conductedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: FUNDING                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'FUNDING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-3">
            <StatCard title="Total Funding Received" value={`₹${(selectedStartup.fundingReceived / 100000).toFixed(2)}L`} icon={DollarSign} subtitle="Grants + Investments" />
            <StatCard title="Total Investment" value={`₹${(selectedStartup.totalInvestment / 100000).toFixed(2)}L`} icon={TrendingUp} subtitle="All capital raised" />
            <StatCard title="Annual Revenue" value={`₹${(selectedStartup.annualRevenue / 100000).toFixed(2)}L`} icon={Briefcase} subtitle="Last 12 months" />
          </div>

          {myFundings.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <DollarSign size={36} color="var(--brand-orange)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>No funding records yet</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Once approved, you can apply for SSIP, DST-NIDHI, MSME and Angel Investor grants through the Incubation Centre.</p>
            </div>
          ) : (
            <Section title="Funding Disbursement Records" icon={<DollarSign size={16} color="var(--brand-orange)" />}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>Funding Type</th><th>Source</th><th>Amount</th><th>Received Date</th><th>Status</th><th>Utilization</th></tr>
                  </thead>
                  <tbody>
                    {myFundings.map(f => (
                      <tr key={f.id}>
                        <td><Badge variant="navy">{f.fundingType}</Badge></td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{f.source}</td>
                        <td><strong style={{ color: '#10B981' }}>₹{f.amount.toLocaleString()}</strong></td>
                        <td>{f.receivedDate}</td>
                        <td><Badge variant={f.status === 'DISBURSED' ? 'active' : 'orange'}>{f.status}</Badge></td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{f.utilizationReport || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section title="Funding Opportunities" subtitle="Available grants and schemes for incubated startups" icon={<Lightbulb size={16} color="var(--brand-orange)" />}>
            <div className="grid-2">
              {[
                { name: 'SSIP (Gujarat Govt)', amount: '₹5–25 Lakhs', eligibility: 'Student / Faculty Led Startups at SSIU', link: 'SSIP Government of Gujarat' },
                { name: 'DST-NIDHI PRAYAS', amount: '₹10 Lakhs', eligibility: 'Prototype development stage', link: 'DST Innovation Portal' },
                { name: 'MSME Technology Scheme', amount: '₹2–10 Lakhs', eligibility: 'Registered LLP / Pvt Ltd', link: 'MSME.gov.in' },
                { name: 'Startup India Seed Fund', amount: '₹20 Lakhs', eligibility: 'DPIIT-recognized startups', link: 'Startup India Portal' },
              ].map(op => (
                <div key={op.name} style={{ padding: '1.25rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>{op.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Up to: <strong style={{ color: '#059669' }}>{op.amount}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Eligibility: {op.eligibility}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)', fontWeight: 600 }}>📎 {op.link}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DOCUMENTS                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'DOCUMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDocModal(true)}>
              <Upload size={14} /> Upload Document
            </button>
          </div>
          {selectedStartup.documents.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', borderStyle: 'dashed' }}>
              <FileText size={36} color="var(--brand-orange)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>No documents uploaded yet</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload your Pitch Deck, Business Plan, Prototype Video, Registration Certificate and other relevant documents.</p>
              <button className="btn btn-primary" onClick={() => setShowDocModal(true)}><Upload size={16} /> Upload First Document</button>
            </div>
          ) : (
            <Section title={`Startup Documents (${selectedStartup.documents.length})`} icon={<FileText size={16} color="var(--brand-orange)" />}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>Document Name</th><th>Type</th><th>Uploaded Date</th><th>Verification</th></tr>
                  </thead>
                  <tbody>
                    {selectedStartup.documents.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={15} color="var(--brand-orange)" />
                            {doc.fileUrl ? <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-navy)', fontWeight: 600 }}>{doc.name}</a> : <strong>{doc.name}</strong>}
                          </div>
                        </td>
                        <td><Badge variant="navy">{doc.type.replace('_', ' ')}</Badge></td>
                        <td>{doc.uploadedDate}</td>
                        <td><Badge variant={doc.verified ? 'active' : 'orange'}>{doc.verified ? '✓ Verified' : '⏳ Pending'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: IPR / PATENT                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'IPR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Section title="Intellectual Property Rights (IPR) & Patent Details" icon={<ShieldCheck size={16} color="var(--brand-orange)" />}
            action={<button className="btn btn-primary btn-sm" onClick={() => openIprModal(selectedStartup)}><Edit3 size={14} /> Update IPR</button>}>
            <div className="grid-2" style={{ gap: '1.25rem' }}>
              <InfoRow label="Patent Application Number" value={selectedStartup.patentApplicationNo || 'Not filed yet'} muted={!selectedStartup.patentApplicationNo} />
              <InfoRow label="Patent Status"
                value={<Badge variant={selectedStartup.patentStatus === 'GRANTED' ? 'active' : selectedStartup.patentStatus === 'FILED' ? 'navy' : selectedStartup.patentStatus === 'PUBLISHED' ? 'orange' : 'inactive'}>
                  {selectedStartup.patentStatus || 'NONE'}
                </Badge>} />
            </div>
          </Section>

          <Section title="IPR Timeline & Process Guide" icon={<Info size={16} color="var(--brand-orange)" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { step: 1, label: 'Prior Art Search', desc: 'Check if a similar patent exists on IPIndia.gov.in before applying', status: 'GUIDE' },
                { step: 2, label: 'Provisional Patent Filing', desc: 'File a provisional application to secure priority date (₹1750 govt fee for startups)', status: 'GUIDE' },
                { step: 3, label: 'Complete Specification', desc: 'Submit complete specification within 12 months of provisional filing', status: 'GUIDE' },
                { step: 4, label: 'Examination & Publication', desc: 'Patent office publishes application after 18 months, examination starts', status: 'GUIDE' },
                { step: 5, label: 'Grant', desc: 'Patent granted after successful examination (2-5 years typical timeline)', status: 'GUIDE' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.875rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>{item.step}</div>
                  <div>
                    <strong style={{ color: 'var(--brand-navy)' }}>{item.label}</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0.875rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#1E40AF', marginTop: '0.5rem' }}>
              <strong>💡 SSIU IP Cell:</strong> Contact the SSIU IP Cell or your mentor for assistance with patent filing. SSIU provides legal support for student innovations.
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: REPORTS                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            {[
              {
                title: 'Startup Profile Report',
                desc: 'Complete startup details: idea, solution, sector, stage, IPR, mentor, funding and achievements.',
                onClick: () => exportToExcel(`SSIU Startup Report - ${selectedStartup.ideaCode}`,
                  ['Field', 'Details'],
                  [
                    ['Idea Code', selectedStartup.ideaCode],
                    ['Title', selectedStartup.title],
                    ['Sector', selectedStartup.sector],
                    ['Stage', selectedStartup.stage],
                    ['Status', selectedStartup.status],
                    ['Registered', selectedStartup.registeredDate],
                    ['Mentor', selectedStartup.mentorName || 'Not Assigned'],
                    ['Patent Status', selectedStartup.patentStatus || 'NONE'],
                    ['Patent No.', selectedStartup.patentApplicationNo || '—'],
                    ['Funding Received', `₹${selectedStartup.fundingReceived}`],
                    ['Annual Revenue', `₹${selectedStartup.annualRevenue}`],
                    ['Team Size', selectedStartup.employeesCount],
                    ['Investors', selectedStartup.investorNames || '—'],
                    ['Awards', selectedStartup.awards || '—'],
                  ],
                  {}, { name: user?.name, role: 'STUDENT' })
              },
              {
                title: 'Milestone Progress Report',
                desc: 'All milestones with completion status and dates for IQAC/NAAC submission.',
                onClick: () => exportToExcel(`SSIU Milestones - ${selectedStartup.ideaCode}`,
                  ['Milestone', 'Description', 'Target Date', 'Completed Date', 'Status'],
                  selectedStartup.milestones.map(m => [m.title, m.description, m.targetDate, m.completedDate || '—', m.status]),
                  {}, { name: user?.name, role: 'STUDENT' })
              },
              {
                title: 'Funding & Revenue Report',
                desc: 'Funding received, sources, disbursement status and revenue data.',
                onClick: () => exportToExcel(`SSIU Funding - ${selectedStartup.ideaCode}`,
                  ['Type', 'Source', 'Amount (₹)', 'Date', 'Status'],
                  myFundings.map(f => [f.fundingType, f.source, f.amount, f.receivedDate, f.status]),
                  {}, { name: user?.name, role: 'STUDENT' })
              },
              {
                title: 'Mentor Session Log',
                desc: 'All mentor interaction records for your startup portfolio and academic records.',
                onClick: () => exportToExcel(`SSIU Mentor Sessions - ${selectedStartup.ideaCode}`,
                  ['Date', 'Mentor', 'Duration (min)', 'Agenda', 'Next Steps'],
                  mySessions.map(s => [s.sessionDate, s.mentorName, s.duration, s.agenda, s.nextSteps]),
                  {}, { name: user?.name, role: 'STUDENT' })
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
      {/* MODALS                                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {showRegisterModal && renderRegisterModal()}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>Update Startup Profile</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ padding: '0.65rem', background: '#FFF7ED', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem', color: '#92400E' }}>
              ⚠️ You can update operational details freely. Changes to core idea or sector require Incubation Team approval.
            </div>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Problem Statement</label><textarea className="form-input" rows={2} value={editProblem} onChange={e => setEditProblem(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Proposed Solution</label><textarea className="form-input" rows={2} value={editSolution} onChange={e => setEditSolution(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Target Market</label><input type="text" className="form-input" value={editMarket} onChange={e => setEditMarket(e.target.value)} /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Annual Revenue (₹)</label><input type="number" className="form-input" value={editRevenue} onChange={e => setEditRevenue(Number(e.target.value))} /></div>
                <div className="form-group"><label className="form-label">Team Size / Employees</label><input type="number" className="form-input" value={editEmployees} onChange={e => setEditEmployees(Number(e.target.value))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Investors / Partners</label><input type="text" className="form-input" value={editInvestors} onChange={e => setEditInvestors(e.target.value)} placeholder="e.g. Gujarat Angels, SSIP" /></div>
              <div className="form-group"><label className="form-label">Awards & Recognition</label><input type="text" className="form-input" value={editAwards} onChange={e => setEditAwards(e.target.value)} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>Add New Milestone</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMilestoneModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group"><label className="form-label">Milestone Title *</label><input type="text" className="form-input" value={msTitle} onChange={e => setMsTitle(e.target.value)} required placeholder="e.g. Complete Working Prototype" /></div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={2} value={msDesc} onChange={e => setMsDesc(e.target.value)} required placeholder="What will be achieved and how will it be measured?" /></div>
              <div className="form-group"><label className="form-label">Target Completion Date *</label><input type="date" className="form-input" value={msTarget} onChange={e => setMsTarget(e.target.value)} required /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>Upload Startup Document</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDocModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Document Name *</label>
                <input type="text" className="form-input" value={docName} onChange={e => setDocName(e.target.value)} required placeholder="e.g. EduReach AI Pitch Deck v2.0" />
              </div>
              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select className="form-select" value={docType} onChange={e => setDocType(e.target.value as StartupDocument['type'])}>
                  {(['PITCH_DECK', 'BUSINESS_PLAN', 'PROTOTYPE_VIDEO', 'IPR_CERT', 'FUNDING_LETTER', 'REGISTRATION_CERT', 'OTHER'] as StartupDocument['type'][]).map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Upload File (DEMO: paste file URL)</label>
                <input type="text" className="form-input" value={docFile} onChange={e => setDocFile(e.target.value)} placeholder="https://drive.google.com/..." />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>In production, file upload would be integrated with cloud storage.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDocModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Upload size={14} /> Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IPR Update Modal */}
      {showIprModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>Update IPR / Patent Details</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowIprModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveIpr} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Patent Application Number</label>
                <input type="text" className="form-input" value={iprNo} onChange={e => setIprNo(e.target.value)} placeholder="e.g. IN-2024-PA-00782" />
              </div>
              <div className="form-group">
                <label className="form-label">Patent Status</label>
                <select className="form-select" value={iprStatus || 'NONE'} onChange={e => setIprStatus(e.target.value as StartupIdea['patentStatus'])}>
                  {(['NONE', 'FILED', 'PUBLISHED', 'GRANTED'] as StartupIdea['patentStatus'][]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowIprModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save IPR Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
