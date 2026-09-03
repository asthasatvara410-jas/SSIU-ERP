import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { innovationService } from '../../services/innovationService';
import {
  InnovationCategory,
  InnovationStage,
  StartupStage,
  FounderType,
  MentorType,
  FundingType,
  CollaborationType,
  InnovationFilterState,
} from '../../types/innovation';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import {
  Rocket, Lightbulb, Building, Users, Award, Download, Printer,
  Filter, RotateCcw, Search, Plus, TrendingUp, Briefcase, Globe,
  Shield, CheckCircle2, X, Bookmark, Layers, FileText
} from 'lucide-react';

export type InnovationTabType =
  | 'OVERVIEW'
  | 'PROJECTS'
  | 'INCUBATION'
  | 'STARTUPS'
  | 'MENTORS'
  | 'FUNDING'
  | 'COLLABORATIONS'
  | 'EVENTS'
  | 'HACKATHONS'
  | 'AWARDS'
  | 'NAAC_SUMMARY';

interface StartupGrantDashboardProps {
  initialTab?: InnovationTabType;
  activeRouteTab?: string;
}

export const StartupGrantDashboard: React.FC<StartupGrantDashboardProps> = ({ initialTab, activeRouteTab }) => {
  const { user, role } = useAuth();

  const resolveTabFromRoute = (route?: string): InnovationTabType => {
    if (!route) return initialTab || 'OVERVIEW';
    if (route === 'innovation-projects') return 'PROJECTS';
    if (route === 'incubation-centre' || route === 'incubation') return 'INCUBATION';
    if (route === 'startups' || route === 'startups-directory') return 'STARTUPS';
    if (route === 'innovation-mentors') return 'MENTORS';
    if (route === 'innovation-funding') return 'FUNDING';
    if (route === 'industry-collaboration') return 'COLLABORATIONS';
    if (route === 'innovation-events') return 'EVENTS';
    if (route === 'innovation-hackathons' || route === 'hackathons') return 'HACKATHONS';
    if (route === 'innovation-awards') return 'AWARDS';
    if (route === 'innovation-reports') return 'NAAC_SUMMARY';
    return initialTab || 'OVERVIEW';
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<InnovationTabType>(() => resolveTabFromRoute(activeRouteTab));

  useEffect(() => {
    if (activeRouteTab) {
      setActiveTab(resolveTabFromRoute(activeRouteTab));
    }
  }, [activeRouteTab]);

  // Filters
  const [filters, setFilters] = useState<InnovationFilterState>({
    academicYear: '2025-26',
    instituteId: 'ALL',
    departmentId: 'ALL',
    stage: 'ALL',
    category: 'ALL',
    status: 'ALL',
    founderType: 'ALL',
    fundingSource: 'ALL',
    searchQuery: '',
  });

  // Modal States
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddStartupModal, setShowAddStartupModal] = useState(false);
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [showAddFundingModal, setShowAddFundingModal] = useState(false);
  const [showAddCollabModal, setShowAddCollabModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

  // Form States
  const [newPrjTitle, setNewPrjTitle] = useState('');
  const [newPrjCategory, setNewPrjCategory] = useState<InnovationCategory>('Technology');
  const [newPrjLead, setNewPrjLead] = useState(user?.name || 'Darshan Varma');
  const [newPrjMentor, setNewPrjMentor] = useState('Dr. Rajesh Sharma');
  const [newPrjStage, setNewPrjStage] = useState<InnovationStage>('PROTOTYPE');
  const [newPrjDept, setNewPrjDept] = useState('Computer Engineering');

  const [newStpName, setNewStpName] = useState('');
  const [newStpFounder, setNewStpFounder] = useState(user?.name || 'Darshan Varma');
  const [newStpCategory, setNewStpCategory] = useState<InnovationCategory>('Technology');
  const [newStpSector, setNewStpSector] = useState('Software & Automation');
  const [newStpStage, setNewStpStage] = useState<StartupStage>('EARLY_STAGE');
  const [newStpDpiit, setNewStpDpiit] = useState(true);

  const [newMntName, setNewMntName] = useState('');
  const [newMntType, setNewMntType] = useState<MentorType>('Entrepreneur');
  const [newMntOrg, setNewMntOrg] = useState('');
  const [newMntExp, setNewMntExp] = useState('');

  const [newFndRecipient, setNewFndRecipient] = useState('');
  const [newFndSource, setNewFndSource] = useState('SSIP 2.0 PoC Grant');
  const [newFndType, setNewFndType] = useState<FundingType>('Government');
  const [newFndAmount, setNewFndAmount] = useState(250000);

  const [newColIndustry, setNewColIndustry] = useState('');
  const [newColType, setNewColType] = useState<CollaborationType>('MoU');
  const [newColScope, setNewColScope] = useState('');

  const [newMstStartup, setNewMstStartup] = useState('KisanDrone AeroTech Pvt. Ltd.');
  const [newMstTitle, setNewMstTitle] = useState('');
  const [newMstStage, setNewMstStage] = useState<StartupStage>('MVP');

  // Derived filtered data & metrics
  const innovationData = useMemo(() => {
    return innovationService.getFilteredData(filters, role || undefined, user);
  }, [filters, role, user]);

  const metrics = useMemo(() => {
    return innovationService.getMetrics(filters, role || undefined, user);
  }, [filters, role, user]);

  const naacSummary = useMemo(() => {
    return innovationService.getNaacSummary(filters, role || undefined, user);
  }, [filters, role, user]);

  const handleResetFilters = () => {
    setFilters({
      academicYear: 'ALL',
      instituteId: 'ALL',
      departmentId: 'ALL',
      stage: 'ALL',
      category: 'ALL',
      status: 'ALL',
      founderType: 'ALL',
      fundingSource: 'ALL',
      searchQuery: '',
    });
  };

  const handleExportExcel = () => {
    innovationService.exportMultiSheetExcel(filters, role || undefined, user);
  };

  const handlePrint = () => {
    window.print();
  };

  // Submit Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrjTitle.trim()) return;
    innovationService.createInnovationProject({
      innovationCode: `INN-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newPrjTitle,
      description: 'Innovative student/faculty project.',
      category: newPrjCategory,
      problemStatement: 'Problem addressed by innovation.',
      proposedSolution: 'Solution proposed by team.',
      leadName: newPrjLead,
      leadType: 'STUDENT',
      facultyMentorName: newPrjMentor,
      departmentId: 'dept-1',
      departmentName: newPrjDept,
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      academicYear: '2025-26',
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      stage: newPrjStage,
      technologyArea: 'AI & Automation',
    });
    setNewPrjTitle('');
    setShowAddProjectModal(false);
    setActiveTab('PROJECTS');
  };

  const handleCreateStartup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStpName.trim()) return;
    innovationService.createStartup({
      startupCode: `STP-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupName: newStpName,
      founders: [
        {
          id: `fnd-${Date.now()}`,
          name: newStpFounder,
          role: 'Founder',
          founderType: 'Student',
          departmentName: 'Computer Engineering',
          joiningDate: new Date().toISOString().split('T')[0],
          ownershipPercentage: 100,
          email: `${newStpFounder.toLowerCase().replace(/\s+/g, '')}@startup.in`,
        },
      ],
      primaryFounderName: newStpFounder,
      founderType: 'Student',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      category: newStpCategory,
      sector: newStpSector,
      dpiitRecognized: newStpDpiit,
      dpiitNumber: newStpDpiit ? `DIPP${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      stage: newStpStage,
      status: 'INCUBATING',
      incubationCentreName: 'Swarrnim Incubation Centre (SInC)',
      incubationStartDate: new Date().toISOString().split('T')[0],
      teamSize: 4,
      fundingRaised: 500000,
      annualRevenue: 0,
      academicYear: '2025-26',
    });
    setNewStpName('');
    setShowAddStartupModal(false);
    setActiveTab('STARTUPS');
  };

  const handleCreateMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMntName.trim()) return;
    innovationService.createMentor({
      mentorName: newMntName,
      mentorType: newMntType,
      organization: newMntOrg || 'Industry Enterprise',
      expertise: newMntExp || 'Startup Scaling & GTM Strategy',
      email: `${newMntName.toLowerCase().replace(/\s+/g, '')}@advisor.in`,
      contactNumber: '+91 98250 00000',
      experienceYears: 10,
      availability: 'Monthly Mentorship Clinic',
      assignedStartupsCount: 1,
      assignedProjectsCount: 1,
      status: 'ACTIVE',
    });
    setNewMntName('');
    setShowAddMentorModal(false);
    setActiveTab('MENTORS');
  };

  const handleCreateFunding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFndRecipient.trim()) return;
    innovationService.createFunding({
      fundingCode: `FND-2026-${Math.floor(100 + Math.random() * 900)}`,
      recipientType: 'STARTUP',
      recipientId: 'stp-1',
      recipientName: newFndRecipient,
      fundingSource: newFndSource,
      fundingType: newFndType,
      sanctionDate: new Date().toISOString().split('T')[0],
      sanctionedAmount: Number(newFndAmount),
      releasedAmount: Number(newFndAmount) * 0.7,
      utilizedAmount: 0,
      balanceAmount: Number(newFndAmount) * 0.7,
      purpose: 'Prototyping & Field Validation',
      status: 'RELEASED',
      academicYear: '2025-26',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
    });
    setNewFndRecipient('');
    setShowAddFundingModal(false);
    setActiveTab('FUNDING');
  };

  const handleCreateCollaboration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColIndustry.trim()) return;
    innovationService.createCollaboration({
      collaborationCode: `MOU-2026-${Math.floor(100 + Math.random() * 900)}`,
      industryName: newColIndustry,
      collaborationType: newColType,
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      instituteName: 'Swarrnim Institute of Technology',
      facultyCoordinatorName: 'Dr. Amit Trivedi',
      startDate: new Date().toISOString().split('T')[0],
      scope: newColScope || 'Joint innovation, incubation mentoring and internships.',
      deliverables: '2 Prototypes, student internships',
      status: 'ACTIVE',
    });
    setNewColIndustry('');
    setShowAddCollabModal(false);
    setActiveTab('COLLABORATIONS');
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMstTitle.trim()) return;
    innovationService.createMilestone({
      startupId: 'stp-1',
      startupName: newMstStartup,
      milestoneTitle: newMstTitle,
      milestoneStage: newMstStage,
      targetDate: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      remarks: 'Milestone successfully delivered.',
    });
    setNewMstTitle('');
    setShowAddMilestoneModal(false);
    setActiveTab('STARTUPS');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
      {/* ─── 1. BANNER & CONTROLS ────────────────────────────────────────── */}
      <div className="card no-print" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a8a 100%)',
        color: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Rocket size={16} /> Directorate of Innovation, Incubation &amp; Startup Cell
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0.25rem 0 0.15rem 0' }}>
              Swarrnim Incubation Centre (SInC) &amp; Startup Portal
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              Institutional hub for Student &amp; Faculty Innovations, Incubated Startups, SSIP Grants, Mentors, and NAAC Criterion 3 Evidence.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--brand-gold)',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '0.8125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Download size={15} /> Export 11-Sheet Excel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> Print / Export PDF
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          flexWrap: 'wrap',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          {[
            { id: 'OVERVIEW', label: 'Executive Dashboard', icon: Layers },
            { id: 'PROJECTS', label: `Innovations (${innovationData.projects.length})`, icon: Lightbulb },
            { id: 'INCUBATION', label: `Incubation Centre (${innovationData.incubationCentres.length})`, icon: Building },
            { id: 'STARTUPS', label: `Startups (${innovationData.startups.length})`, icon: Rocket },
            { id: 'MENTORS', label: `Mentors (${innovationData.mentors.length})`, icon: Users },
            { id: 'FUNDING', label: `Funding & Grants (${innovationData.fundings.length})`, icon: TrendingUp },
            { id: 'COLLABORATIONS', label: `MoUs (${innovationData.collaborations.length})`, icon: Globe },
            { id: 'EVENTS', label: `Events (${innovationData.events.length})`, icon: Bookmark },
            { id: 'HACKATHONS', label: `Hackathons (${innovationData.hackathons.length})`, icon: Briefcase },
            { id: 'AWARDS', label: `Awards (${innovationData.awards.length})`, icon: Award },
            { id: 'NAAC_SUMMARY', label: 'NAAC Innovation Dossier', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as InnovationTabType)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 800 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.12)',
                  color: isActive ? '#0F172A' : '#F8FAFC',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. ADVANCED FILTER BAR ────────────────────────────────────────── */}
      <div className="card no-print" style={{ padding: '1rem 1.25rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.8125rem', color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
          <Filter size={15} /> Multi-Parameter Innovation &amp; Incubation Filters
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Search Projects / Startups / Founders</label>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search innovation records..."
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="input-field"
                style={{ width: '100%', paddingLeft: '2rem', height: '34px', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Academic Year</label>
            <select
              value={filters.academicYear}
              onChange={e => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
              className="input-field"
              style={{ width: '100%', height: '34px', fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value="ALL">All Academic Years</option>
              <option value="2026-27">2026-27 (Target / Upcoming)</option>
              <option value="2025-26">2025-26 (Active Period)</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Department</label>
            <select
              value={filters.departmentId}
              onChange={e => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
              className="input-field"
              style={{ width: '100%', height: '34px', fontSize: '0.8125rem', marginTop: '0.2rem' }}
            >
              <option value="ALL">All Academic Departments</option>
              <option value="dept-1">Computer Engineering</option>
              <option value="dept-2">Information Technology</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ height: '34px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. KPI CARDS (DRILLDOWN NAVIGABLE) ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
        {[
          { label: 'Total Innovations', value: metrics.totalInnovationProjects, tab: 'PROJECTS', color: '#1D4ED8' },
          { label: 'Active Projects', value: metrics.activeInnovationProjects, tab: 'PROJECTS', color: '#059669' },
          { label: 'Total Startups', value: metrics.totalStartups, tab: 'STARTUPS', color: '#7C3AED' },
          { label: 'Incubated Startups', value: metrics.incubatedStartups, tab: 'STARTUPS', color: '#D97706' },
          { label: 'Student Startups', value: metrics.studentStartups, tab: 'STARTUPS', color: '#059669' },
          { label: 'Faculty Startups', value: metrics.facultyStartups, tab: 'STARTUPS', color: '#1D4ED8' },
          { label: 'Total Mentors', value: metrics.totalMentors, tab: 'MENTORS', color: '#7C3AED' },
          { label: 'Funding Mobilized', value: `₹${(metrics.totalFundingReceived / 100000).toFixed(1)}L`, tab: 'FUNDING', color: '#059669' },
          { label: 'Industry MoUs', value: metrics.totalIndustryCollaborations, tab: 'COLLABORATIONS', color: '#1D4ED8' },
          { label: 'Hackathons', value: metrics.totalHackathons, tab: 'HACKATHONS', color: '#D97706' },
          { label: 'Innovation Awards', value: metrics.totalInnovationAwards, tab: 'AWARDS', color: '#059669' },
          { label: 'Patents Linked', value: metrics.patentsLinkedToInnovation, tab: 'PROJECTS', color: '#DC2626' },
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => setActiveTab(card.tab as InnovationTabType)}
            className="card"
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              borderLeft: `3px solid ${card.color}`,
              transition: 'transform 0.15s ease-in-out',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: card.color, marginTop: '0.15rem', fontFamily: 'monospace' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── TAB 1: EXECUTIVE OVERVIEW ────────────────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Comparative Academic Year Trajectory */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  3-Year Institutional Innovation &amp; Incubation Growth
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Audited growth comparison across student innovations, incubated ventures, SSIP grants, and industry MoUs.
                </p>
              </div>
            </div>

            <ExcelTableContainer>
              <ExcelTable>
                <thead>
                  <tr>
                    <ExcelTh align="left">Academic Year</ExcelTh>
                    <ExcelTh align="center">Innovations</ExcelTh>
                    <ExcelTh align="center">Startups</ExcelTh>
                    <ExcelTh align="center">Grant Funding Mobilized</ExcelTh>
                    <ExcelTh align="center">Industry MoUs</ExcelTh>
                    <ExcelTh align="center">Growth Status</ExcelTh>
                  </tr>
                </thead>
                <tbody>
                  {metrics.yearWiseComparison.map((row, i) => (
                    <tr key={i}>
                      <ExcelTd align="left">
                        <strong>{row.academicYear}</strong>
                      </ExcelTd>
                      <ExcelTd align="center">{row.innovations} Projects</ExcelTd>
                      <ExcelTd align="center">{row.startups} Startups</ExcelTd>
                      <ExcelTd align="center">₹{(row.fundingAmount / 100000).toFixed(2)} Lakhs</ExcelTd>
                      <ExcelTd align="center">{row.collaborations || (i === 0 ? 4 : i === 1 ? 8 : 12)} MoUs</ExcelTd>
                      <ExcelTd align="center">
                        <Badge variant={i === 2 ? 'navy' : i === 1 ? 'active' : 'inactive'}>
                          {i === 2 ? 'Target' : i === 1 ? '+100% Growth' : 'Baseline'}
                        </Badge>
                      </ExcelTd>
                    </tr>
                  ))}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>
          </div>
        </div>
      )}

      {/* ─── TAB 2: INNOVATION PROJECTS ──────────────────────────────────────── */}
      {activeTab === 'PROJECTS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Innovation Projects ({innovationData.projects.length} Records)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Student &amp; faculty innovation ledger with SDG alignment and Stage 10.1 Patent linkage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddProjectModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Innovation Project
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="center">Code</ExcelTh>
                  <ExcelTh align="left">Title &amp; Category</ExcelTh>
                  <ExcelTh align="left">Lead &amp; Faculty Mentor</ExcelTh>
                  <ExcelTh align="center">Stage</ExcelTh>
                  <ExcelTh align="left">Linked Patent / IPR</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.projects.map(p => (
                  <tr key={p.id}>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--brand-navy)' }}>{p.innovationCode}</span>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category} • {p.technologyArea}</div>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 600 }}>{p.leadName} ({p.leadType})</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mentor: {p.facultyMentorName}</div>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant="navy">{p.stage}</Badge>
                    </ExcelTd>
                    <ExcelTd align="left">
                      {p.linkedPatentAppNo ? (
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#1D4ED8', fontWeight: 700 }}>
                          {p.linkedPatentAppNo} ({p.iprStatus})
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>None</span>
                      )}
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant={p.status === 'ACTIVE' ? 'active' : p.status === 'COMPLETED' ? 'navy' : 'inactive'}>
                        {p.status}
                      </Badge>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 3: INCUBATION CENTRE & COHORTS ───────────────────────────────── */}
      {activeTab === 'INCUBATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Incubation Centre Profile */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
              Swarrnim Incubation Centre Profile &amp; Infrastructure
            </h3>
            {innovationData.incubationCentres.map(c => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Centre Name &amp; Code</div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{c.centreName} ({c.centreCode})</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Director: {c.directorName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Capacity &amp; Occupancy</div>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>{c.occupiedSeats} / {c.totalSeats} Seats ({Math.round((c.occupiedSeats / c.totalSeats) * 100)}% Full)</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Active Cohorts: {c.activeCohortsCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Facilities Available</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--brand-navy)', marginTop: '0.25rem' }}>
                    {c.facilities.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Incubation Applications */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
              Incubation Applications &amp; Selection Pipeline
            </h3>
            <ExcelTableContainer>
              <ExcelTable>
                <thead>
                  <tr>
                    <ExcelTh align="center">Application No</ExcelTh>
                    <ExcelTh align="left">Startup / Idea</ExcelTh>
                    <ExcelTh align="left">Applicant &amp; Role</ExcelTh>
                    <ExcelTh align="center">Funding Needed</ExcelTh>
                    <ExcelTh align="center">Review Status</ExcelTh>
                  </tr>
                </thead>
                <tbody>
                  {innovationData.incubationApplications.map(a => (
                    <tr key={a.id}>
                      <ExcelTd align="center"><span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{a.applicationNumber}</span></ExcelTd>
                      <ExcelTd align="left">
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{a.startupOrIdeaName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.category} • {a.technologyReadinessLevel}</div>
                      </ExcelTd>
                      <ExcelTd align="left">{a.applicantName} ({a.applicantRole})</ExcelTd>
                      <ExcelTd align="center">₹{(a.fundingRequirement / 100000).toFixed(2)}L</ExcelTd>
                      <ExcelTd align="center"><Badge variant={a.reviewStatus === 'APPROVED' ? 'active' : 'navy'}>{a.reviewStatus}</Badge></ExcelTd>
                    </tr>
                  ))}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>
          </div>
        </div>
      )}

      {/* ─── TAB 4: STARTUPS DIRECTORY ──────────────────────────────────────── */}
      {activeTab === 'STARTUPS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Incubated &amp; Student/Faculty Startups ({innovationData.startups.length} Ventures)
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Registered legal entities, DPIIT recognition, founder equity and revenue tracking.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                >
                  <Plus size={15} /> Add Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStartupModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                >
                  <Plus size={15} /> Register Startup
                </button>
              </div>
            </div>

            <ExcelTableContainer>
              <ExcelTable>
                <thead>
                  <tr>
                    <ExcelTh align="center">Code</ExcelTh>
                    <ExcelTh align="left">Startup Name &amp; Sector</ExcelTh>
                    <ExcelTh align="left">Founders</ExcelTh>
                    <ExcelTh align="center">Stage</ExcelTh>
                    <ExcelTh align="center">DPIIT Status</ExcelTh>
                    <ExcelTh align="center">Funding Raised</ExcelTh>
                    <ExcelTh align="center">Status</ExcelTh>
                  </tr>
                </thead>
                <tbody>
                  {innovationData.startups.map(s => (
                    <tr key={s.id}>
                      <ExcelTd align="center"><span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{s.startupCode}</span></ExcelTd>
                      <ExcelTd align="left">
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>{s.startupName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.sector} • Reg: {s.registrationNumber || 'Pending'}</div>
                      </ExcelTd>
                      <ExcelTd align="left">
                        {s.founders.map((f, i) => (
                          <div key={i} style={{ fontSize: '0.75rem' }}>
                            <strong>{f.name}</strong> ({f.founderType} - {f.ownershipPercentage}%)
                          </div>
                        ))}
                      </ExcelTd>
                      <ExcelTd align="center"><Badge variant="navy">{s.stage}</Badge></ExcelTd>
                      <ExcelTd align="center">
                        {s.dpiitRecognized ? (
                          <Badge variant="active">{s.dpiitNumber || 'DPIIT Verified'}</Badge>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not Recognized</span>
                        )}
                      </ExcelTd>
                      <ExcelTd align="center">
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>₹{(s.fundingRaised / 100000).toFixed(2)}L</span>
                      </ExcelTd>
                      <ExcelTd align="center"><Badge variant="active">{s.status}</Badge></ExcelTd>
                    </tr>
                  ))}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>
          </div>

          {/* Startup Milestone Visual Tracker */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
              Startup Milestone &amp; Growth Timelines
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {innovationData.milestones.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #059669' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>{m.milestoneTitle}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.startupName} • Target: {m.targetDate} {m.completionDate ? `(Completed: ${m.completionDate})` : ''}</div>
                  </div>
                  <Badge variant={m.status === 'COMPLETED' ? 'active' : 'navy'}>{m.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: MENTORS ─────────────────────────────────────────────────── */}
      {activeTab === 'MENTORS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Innovation &amp; Startup Mentor Pool ({innovationData.mentors.length} Mentors)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMentorModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Mentor
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Mentor Name &amp; Org</ExcelTh>
                  <ExcelTh align="center">Type</ExcelTh>
                  <ExcelTh align="left">Expertise</ExcelTh>
                  <ExcelTh align="center">Experience</ExcelTh>
                  <ExcelTh align="center">Assigned Ventures</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.mentors.map(m => (
                  <tr key={m.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{m.mentorName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.organization} • {m.email}</div>
                    </ExcelTd>
                    <ExcelTd align="center"><Badge variant="navy">{m.mentorType}</Badge></ExcelTd>
                    <ExcelTd align="left"><div style={{ fontSize: '0.78rem' }}>{m.expertise}</div></ExcelTd>
                    <ExcelTd align="center">{m.experienceYears} Years</ExcelTd>
                    <ExcelTd align="center">{m.assignedStartupsCount} Startups / {m.assignedProjectsCount} Projects</ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{m.status}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 6: FUNDING & GRANTS ────────────────────────────────────────── */}
      {activeTab === 'FUNDING' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Innovation Grants &amp; Seed Funding ({innovationData.fundings.length} Grants)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFundingModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Grant / Funding
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Code &amp; Recipient</ExcelTh>
                  <ExcelTh align="left">Funding Source &amp; Type</ExcelTh>
                  <ExcelTh align="center">Sanctioned</ExcelTh>
                  <ExcelTh align="center">Released</ExcelTh>
                  <ExcelTh align="center">Balance</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.fundings.map(f => (
                  <tr key={f.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{f.recipientName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.fundingCode} • {f.recipientType}</div>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 600 }}>{f.fundingSource}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.fundingType}</div>
                    </ExcelTd>
                    <ExcelTd align="center">₹{(f.sanctionedAmount / 100000).toFixed(2)}L</ExcelTd>
                    <ExcelTd align="center">₹{(f.releasedAmount / 100000).toFixed(2)}L</ExcelTd>
                    <ExcelTd align="center">₹{(f.balanceAmount / 100000).toFixed(2)}L</ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{f.status}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 7: COLLABORATIONS ─────────────────────────────────────────── */}
      {activeTab === 'COLLABORATIONS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Industry Collaborations &amp; MoUs ({innovationData.collaborations.length} MoUs)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCollabModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add MoU / Collaboration
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Industry Partner</ExcelTh>
                  <ExcelTh align="center">Type</ExcelTh>
                  <ExcelTh align="left">Faculty Coordinator</ExcelTh>
                  <ExcelTh align="left">Scope &amp; Deliverables</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.collaborations.map(c => (
                  <tr key={c.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{c.industryName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.collaborationCode} • {c.startDate}</div>
                    </ExcelTd>
                    <ExcelTd align="center"><Badge variant="navy">{c.collaborationType}</Badge></ExcelTd>
                    <ExcelTd align="left">{c.facultyCoordinatorName}</ExcelTd>
                    <ExcelTd align="left"><div style={{ fontSize: '0.75rem' }}>{c.scope}</div></ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{c.status}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 8: EVENTS ─────────────────────────────────────────────────── */}
      {activeTab === 'EVENTS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
            Innovation Events &amp; Expos ({innovationData.events.length} Events)
          </h3>
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Event Name</ExcelTh>
                  <ExcelTh align="center">Type</ExcelTh>
                  <ExcelTh align="left">Date &amp; Venue</ExcelTh>
                  <ExcelTh align="center">Participants</ExcelTh>
                  <ExcelTh align="left">Outcomes</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.events.map(e => (
                  <tr key={e.id}>
                    <ExcelTd align="left"><div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{e.eventName}</div></ExcelTd>
                    <ExcelTd align="center"><Badge variant="navy">{e.eventType}</Badge></ExcelTd>
                    <ExcelTd align="left">{e.eventDate} ({e.venue})</ExcelTd>
                    <ExcelTd align="center">{e.participantCount} Attendees</ExcelTd>
                    <ExcelTd align="left"><div style={{ fontSize: '0.75rem' }}>{e.outcomes}</div></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 9: HACKATHONS ──────────────────────────────────────────────── */}
      {activeTab === 'HACKATHONS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
            Hackathons &amp; Design Challenges ({innovationData.hackathons.length} Records)
          </h3>
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Hackathon Name</ExcelTh>
                  <ExcelTh align="left">Theme &amp; Organizer</ExcelTh>
                  <ExcelTh align="center">Teams &amp; Participants</ExcelTh>
                  <ExcelTh align="left">Winning Teams</ExcelTh>
                  <ExcelTh align="center">Prize Pool</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.hackathons.map(h => (
                  <tr key={h.id}>
                    <ExcelTd align="left"><div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{h.hackathonName}</div></ExcelTd>
                    <ExcelTd align="left">
                      <div>{h.theme}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.organizer}</div>
                    </ExcelTd>
                    <ExcelTd align="center">{h.teamsCount} Teams ({h.participantsCount} Students)</ExcelTd>
                    <ExcelTd align="left"><div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{h.winners}</div></ExcelTd>
                    <ExcelTd align="center"><span style={{ fontWeight: 800 }}>₹{(h.awardsPrizePool / 1000).toFixed(0)}K</span></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 10: AWARDS ─────────────────────────────────────────────────── */}
      {activeTab === 'AWARDS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
            Innovation &amp; Startup Awards ({innovationData.awards.length} Records)
          </h3>
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Award Title</ExcelTh>
                  <ExcelTh align="left">Recipient</ExcelTh>
                  <ExcelTh align="left">Awarding Body</ExcelTh>
                  <ExcelTh align="center">Level</ExcelTh>
                  <ExcelTh align="center">Prize</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {innovationData.awards.map(a => (
                  <tr key={a.id}>
                    <ExcelTd align="left"><div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{a.awardTitle}</div></ExcelTd>
                    <ExcelTd align="left">{a.recipientName} ({a.recipientType})</ExcelTd>
                    <ExcelTd align="left">{a.awardingOrganization}</ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{a.level}</Badge></ExcelTd>
                    <ExcelTd align="center">₹{( (a.prizeMoney || 0) / 1000).toFixed(0)}K</ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 11: NAAC CRITERION 3 SUMMARY ────────────────────────────────── */}
      {activeTab === 'NAAC_SUMMARY' && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-navy)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
              <Shield size={15} /> NAAC Criterion 3 • Innovation Ecosystem &amp; Incubation Dossier
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.25rem 0' }}>
              Institutional Innovation Quality Assurance Evidence
            </h2>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">NAAC Metric Description</ExcelTh>
                  <ExcelTh align="center">Current (2025-26)</ExcelTh>
                  <ExcelTh align="center">Previous (2024-25)</ExcelTh>
                  <ExcelTh align="center">Growth</ExcelTh>
                  <ExcelTh align="left">Interpretation</ExcelTh>
                  <ExcelTh align="center">Evidence Dossiers</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {naacSummary.map((n, i) => (
                  <tr key={i}>
                    <ExcelTd align="left"><div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{n.metric}</div></ExcelTd>
                    <ExcelTd align="center"><span style={{ fontWeight: 800, color: '#1D4ED8' }}>{n.currentValue}</span></ExcelTd>
                    <ExcelTd align="center">{n.previousPeriodValue}</ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{n.change}</Badge></ExcelTd>
                    <ExcelTd align="left"><div style={{ fontSize: '0.78rem' }}>{n.interpretation}</div></ExcelTd>
                    <ExcelTd align="center"><span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{n.evidenceCount} Files</span></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── ADD PROJECT MODAL ─────────────────────────────────────────────── */}
      {showAddProjectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Add Innovation Project</h3>
              <button type="button" onClick={() => setShowAddProjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Project Title</label>
                <input type="text" required value={newPrjTitle} onChange={e => setNewPrjTitle(e.target.value)} placeholder="e.g. AI Crop Health Monitoring" className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Category</label>
                  <select value={newPrjCategory} onChange={e => setNewPrjCategory(e.target.value as InnovationCategory)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="Technology">Technology</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Renewable Energy">Renewable Energy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Innovation Stage</label>
                  <select value={newPrjStage} onChange={e => setNewPrjStage(e.target.value as InnovationStage)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="IDEA">IDEA</option>
                    <option value="PROTOTYPE">PROTOTYPE</option>
                    <option value="PILOT">PILOT</option>
                    <option value="COMMERCIALIZATION">COMMERCIALIZATION</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddProjectModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Innovation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD STARTUP MODAL ─────────────────────────────────────────────── */}
      {showAddStartupModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Register Startup Venture</h3>
              <button type="button" onClick={() => setShowAddStartupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStartup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Startup Name</label>
                <input type="text" required value={newStpName} onChange={e => setNewStpName(e.target.value)} placeholder="e.g. AeroTech Solutions Pvt Ltd" className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Primary Founder</label>
                  <input type="text" required value={newStpFounder} onChange={e => setNewStpFounder(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Sector</label>
                  <input type="text" value={newStpSector} onChange={e => setNewStpSector(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddStartupModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Startup</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD MENTOR MODAL ──────────────────────────────────────────────── */}
      {showAddMentorModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Enroll Mentor</h3>
              <button type="button" onClick={() => setShowAddMentorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateMentor} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Mentor Name</label>
                <input type="text" required value={newMntName} onChange={e => setNewMntName(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Mentor Type</label>
                  <select value={newMntType} onChange={e => setNewMntType(e.target.value as MentorType)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="Entrepreneur">Entrepreneur</option>
                    <option value="Industry">Industry</option>
                    <option value="Investor">Investor</option>
                    <option value="Legal">Legal</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Organization</label>
                  <input type="text" value={newMntOrg} onChange={e => setNewMntOrg(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddMentorModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Enroll Mentor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD FUNDING MODAL ─────────────────────────────────────────────── */}
      {showAddFundingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Register Grant / Funding</h3>
              <button type="button" onClick={() => setShowAddFundingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateFunding} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Recipient Venture / Project</label>
                <input type="text" required value={newFndRecipient} onChange={e => setNewFndRecipient(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Funding Source</label>
                  <input type="text" required value={newFndSource} onChange={e => setNewFndSource(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Sanctioned Amount (INR)</label>
                  <input type="number" required value={newFndAmount} onChange={e => setNewFndAmount(Number(e.target.value))} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddFundingModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Funding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD COLLABORATION MODAL ───────────────────────────────────────── */}
      {showAddCollabModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Register Industry Collaboration (MoU)</h3>
              <button type="button" onClick={() => setShowAddCollabModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCollaboration} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Industry / Partner Name</label>
                <input type="text" required value={newColIndustry} onChange={e => setNewColIndustry(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Collaboration Scope</label>
                <input type="text" value={newColScope} onChange={e => setNewColScope(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddCollabModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save MoU</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD MILESTONE MODAL ───────────────────────────────────────────── */}
      {showAddMilestoneModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Add Startup Milestone</h3>
              <button type="button" onClick={() => setShowAddMilestoneModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Startup Name</label>
                <input type="text" required value={newMstStartup} onChange={e => setNewMstStartup(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Milestone Title</label>
                <input type="text" required value={newMstTitle} onChange={e => setNewMstTitle(e.target.value)} placeholder="e.g. Field Alpha Prototype Test" className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddMilestoneModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
