import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { researchService } from '../../services/researchService';
import {
  ResearchProjectItem,
  PublicationItem,
  PatentIprItem,
  ResearchGrantItem,
  ResearchScholarItem,
  ConsultancyProjectItem,
  ConferenceRecordItem,
  BookChapterItem,
  ResearchAwardItem,
  ResearchFilterState,
  PublicationType,
  PublicationIndexing,
  IprCategory,
  PatentStatus,
} from '../../types/research';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import {
  BookOpen, Lightbulb, FileText, Award, Download, Printer,
  Filter, RotateCcw, Search, Plus, CheckCircle2, TrendingUp,
  Building, Users, GraduationCap, Briefcase, Globe, Bookmark,
  Layers, Shield, Calendar, ArrowUpRight, X, Sparkles
} from 'lucide-react';

export type ResearchTabType =
  | 'OVERVIEW'
  | 'PROJECTS'
  | 'PUBLICATIONS'
  | 'PATENTS'
  | 'GRANTS'
  | 'SCHOLARS'
  | 'CONSULTANCY'
  | 'CONFERENCES'
  | 'BOOKS'
  | 'AWARDS'
  | 'NAAC_SUMMARY';

interface ResearchDashboardProps {
  initialTab?: ResearchTabType;
  activeRouteTab?: string;
}

export const ResearchDashboard: React.FC<ResearchDashboardProps> = ({ initialTab, activeRouteTab }) => {
  const { user, role } = useAuth();

  const resolveTabFromRoute = (route?: string): ResearchTabType => {
    if (!route) return initialTab || 'OVERVIEW';
    if (route === 'research-projects') return 'PROJECTS';
    if (route === 'publications' || route === 'research-publications') return 'PUBLICATIONS';
    if (route === 'patents' || route === 'research-patents') return 'PATENTS';
    if (route === 'research-grants' || route === 'grants') return 'GRANTS';
    if (route === 'research-scholars') return 'SCHOLARS';
    if (route === 'research-consultancy') return 'CONSULTANCY';
    if (route === 'research-conferences') return 'CONFERENCES';
    if (route === 'research-books') return 'BOOKS';
    if (route === 'research-awards') return 'AWARDS';
    if (route === 'research-reports' || route === 'research-naac') return 'NAAC_SUMMARY';
    return initialTab || 'OVERVIEW';
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<ResearchTabType>(() => resolveTabFromRoute(activeRouteTab));

  useEffect(() => {
    if (activeRouteTab) {
      setActiveTab(resolveTabFromRoute(activeRouteTab));
    }
  }, [activeRouteTab]);

  // Filters
  const [filters, setFilters] = useState<ResearchFilterState>({
    academicYear: '2025-26',
    instituteId: 'ALL',
    departmentId: 'ALL',
    facultyId: 'ALL',
    status: 'ALL',
    researchArea: 'ALL',
    searchQuery: '',
  });

  // Modal Dialog States
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddPubModal, setShowAddPubModal] = useState(false);
  const [showAddPatentModal, setShowAddPatentModal] = useState(false);
  const [showAddGrantModal, setShowAddGrantModal] = useState(false);
  const [showAddScholarModal, setShowAddScholarModal] = useState(false);
  const [showAddConsultancyModal, setShowAddConsultancyModal] = useState(false);

  // Form States
  const [newPrjTitle, setNewPrjTitle] = useState('');
  const [newPrjPi, setNewPrjPi] = useState(user?.name || 'Dr. Rajesh Sharma');
  const [newPrjDept, setNewPrjDept] = useState('Computer Engineering');
  const [newPrjAgency, setNewPrjAgency] = useState('DST');
  const [newPrjAmount, setNewPrjAmount] = useState(1500000);

  const [newPubTitle, setNewPubTitle] = useState('');
  const [newPubAuthors, setNewPubAuthors] = useState(user?.name || 'Dr. Rajesh Sharma');
  const [newPubJournal, setNewPubJournal] = useState('');
  const [newPubType, setNewPubType] = useState<PublicationType>('JOURNAL_ARTICLE');
  const [newPubIndexing, setNewPubIndexing] = useState<PublicationIndexing>('Scopus');
  const [newPubDoi, setNewPubDoi] = useState('');
  const [newPubYear, setNewPubYear] = useState(2026);

  const [newPatTitle, setNewPatTitle] = useState('');
  const [newPatCategory, setNewPatCategory] = useState<IprCategory>('PATENT');
  const [newPatInventors, setNewPatInventors] = useState(user?.name || 'Dr. Rajesh Sharma');
  const [newPatAppNo, setNewPatAppNo] = useState(`2026210${Math.floor(10000 + Math.random() * 90000)} A`);
  const [newPatTech, setNewPatTech] = useState('Artificial Intelligence & Computing');

  const [newGrtNo, setNewGrtNo] = useState(`DST/RPS/2026/${Math.floor(100 + Math.random() * 900)}`);
  const [newGrtTitle, setNewGrtTitle] = useState('');
  const [newGrtAgency, setNewGrtAgency] = useState('DST (Department of Science & Technology)');
  const [newGrtAmount, setNewGrtAmount] = useState(2000000);

  const [newSchName, setNewSchName] = useState('');
  const [newSchRegNo, setNewSchRegNo] = useState(`SSIU/PHD/2026/0${Math.floor(50 + Math.random() * 50)}`);
  const [newSchTopic, setNewSchTopic] = useState('');

  const [newConTitle, setNewConTitle] = useState('');
  const [newConClient, setNewConClient] = useState('');
  const [newConAmount, setNewConAmount] = useState(500000);

  // Derived filtered data & metrics
  const researchData = useMemo(() => {
    return researchService.getFilteredData(filters, role || undefined, user);
  }, [filters, role, user]);

  const metrics = useMemo(() => {
    return researchService.getMetrics(filters, role || undefined, user);
  }, [filters, role, user]);

  const naacSummary = useMemo(() => {
    return researchService.getNaacSummary(filters, role || undefined, user);
  }, [filters, role, user]);

  const handleResetFilters = () => {
    setFilters({
      academicYear: 'ALL',
      instituteId: 'ALL',
      departmentId: 'ALL',
      facultyId: 'ALL',
      status: 'ALL',
      researchArea: 'ALL',
      searchQuery: '',
    });
  };

  const handleExportExcel = () => {
    researchService.exportMultiSheetExcel(filters, role || undefined, user);
  };

  const handlePrint = () => {
    window.print();
  };

  // Submit Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrjTitle.trim()) return;
    researchService.createProject({
      projectCode: `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newPrjTitle,
      principalInvestigatorId: user?.id || 'fac-1',
      principalInvestigatorName: newPrjPi,
      departmentId: 'dept-1',
      departmentName: newPrjDept,
      instituteId: 'inst-1',
      instituteName: 'Swarrnim Institute of Technology',
      researchArea: 'Advanced Computing',
      fundingAgency: newPrjAgency,
      projectType: 'SPONSORED',
      startDate: new Date().toISOString().split('T')[0],
      sanctionedAmount: Number(newPrjAmount),
      utilizedAmount: 0,
      remainingAmount: Number(newPrjAmount),
      status: 'ACTIVE',
    });
    setNewPrjTitle('');
    setShowAddProjectModal(false);
    setActiveTab('PROJECTS');
  };

  const handleCreatePublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPubTitle.trim()) return;
    researchService.createPublication({
      publicationCode: `PUB-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newPubTitle,
      authors: newPubAuthors,
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      publicationType: newPubType,
      journalOrConferenceName: newPubJournal || 'International Journal of Advanced Computing',
      publicationDate: `${newPubYear}-01-15`,
      year: Number(newPubYear),
      doi: newPubDoi || undefined,
      indexing: newPubIndexing,
      citationCount: 0,
      validationStatus: 'VERIFIED',
      approvalStatus: 'APPROVED',
    });
    setNewPubTitle('');
    setShowAddPubModal(false);
    setActiveTab('PUBLICATIONS');
  };

  const handleCreatePatent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatTitle.trim()) return;
    researchService.createPatent({
      iprCode: `PAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: newPatCategory,
      title: newPatTitle,
      inventors: newPatInventors,
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      applicationNumber: newPatAppNo,
      filingDate: new Date().toISOString().split('T')[0],
      country: 'India (IPO)',
      technologyArea: newPatTech,
      status: 'FILED',
    });
    setNewPatTitle('');
    setShowAddPatentModal(false);
    setActiveTab('PATENTS');
  };

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrtTitle.trim()) return;
    researchService.createGrant({
      grantNo: newGrtNo,
      projectTitle: newGrtTitle,
      principalInvestigatorId: user?.id || 'fac-1',
      principalInvestigatorName: user?.name || 'Dr. Rajesh Sharma',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      fundingAgency: newGrtAgency,
      grantType: 'GOVERNMENT',
      sanctionDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2028-03-31',
      sanctionedAmount: Number(newGrtAmount),
      releasedAmount: Number(newGrtAmount) * 0.6,
      utilizedAmount: 0,
      balanceAmount: Number(newGrtAmount) * 0.6,
      status: 'RELEASED',
    });
    setNewGrtTitle('');
    setShowAddGrantModal(false);
    setActiveTab('GRANTS');
  };

  const handleCreateScholar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchName.trim()) return;
    researchService.createScholar({
      scholarId: `PHD-2026-CSE-${Math.floor(10 + Math.random() * 90)}`,
      scholarName: newSchName,
      program: 'Ph.D.',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      supervisorId: user?.id || 'fac-1',
      supervisorName: user?.name || 'Dr. Rajesh Sharma',
      admissionDate: new Date().toISOString().split('T')[0],
      registrationNumber: newSchRegNo,
      researchArea: 'Artificial Intelligence',
      thesisTitle: newSchTopic || 'Novel Deep Learning Architectures',
      status: 'ACTIVE',
    });
    setNewSchName('');
    setShowAddScholarModal(false);
    setActiveTab('SCHOLARS');
  };

  const handleCreateConsultancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConTitle.trim()) return;
    researchService.createConsultancy({
      consultancyId: `CNS-2026-${Math.floor(10 + Math.random() * 90)}`,
      projectTitle: newConTitle,
      clientName: newConClient || 'Enterprise Client',
      facultyConsultantId: user?.id || 'fac-1',
      facultyConsultantName: user?.name || 'Dr. Rajesh Sharma',
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      contractAmount: Number(newConAmount),
      receivedAmount: Number(newConAmount) * 0.5,
      status: 'ACTIVE',
    });
    setNewConTitle('');
    setShowAddConsultancyModal(false);
    setActiveTab('CONSULTANCY');
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
              <BookOpen size={16} /> Research, Patents &amp; Publications Management Cell
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0.25rem 0 0.15rem 0' }}>
              Directorate of Research &amp; Innovation (IPR Portal)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              Centrally managed Scopus/WoS publications, Indian &amp; PCT patents, sponsored research grants, and NAAC Criterion 3 evidence.
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
            { id: 'PROJECTS', label: `Projects (${researchData.projects.length})`, icon: Briefcase },
            { id: 'PUBLICATIONS', label: `Publications (${researchData.publications.length})`, icon: FileText },
            { id: 'PATENTS', label: `Patents & IPR (${researchData.patents.length})`, icon: Lightbulb },
            { id: 'GRANTS', label: `Grants (${researchData.grants.length})`, icon: Building },
            { id: 'SCHOLARS', label: `Scholars (${researchData.scholars.length})`, icon: GraduationCap },
            { id: 'CONSULTANCY', label: `Consultancy (${researchData.consultancies.length})`, icon: Users },
            { id: 'CONFERENCES', label: `Conferences (${researchData.conferences.length})`, icon: Globe },
            { id: 'BOOKS', label: `Books (${researchData.books.length})`, icon: Bookmark },
            { id: 'AWARDS', label: `Awards (${researchData.awards.length})`, icon: Award },
            { id: 'NAAC_SUMMARY', label: 'NAAC Criterion 3 Evidence', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ResearchTabType)}
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
          <Filter size={15} /> Multi-Parameter Institutional Research Filters
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Search Keywords / Title / PI</label>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search research records..."
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
              <option value="2026-27">2026-27 (Current / Upcoming)</option>
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
              <option value="dept-3">Mechanical Engineering</option>
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
          { label: 'Active Projects', value: metrics.activeProjects, tab: 'PROJECTS', color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Total Publications', value: metrics.totalPublications, tab: 'PUBLICATIONS', color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Scopus Indexed', value: metrics.scopusPublications, tab: 'PUBLICATIONS', color: '#D97706', bg: '#FFFBEB' },
          { label: 'Web of Science', value: metrics.wosPublications, tab: 'PUBLICATIONS', color: '#059669', bg: '#ECFDF5' },
          { label: 'Patents Filed', value: metrics.patentsFiled, tab: 'PATENTS', color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Patents Granted', value: metrics.patentsGranted, tab: 'PATENTS', color: '#059669', bg: '#ECFDF5' },
          { label: 'Research Grants', value: `₹${(metrics.totalGrantAmount / 100000).toFixed(1)}L`, tab: 'GRANTS', color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Ph.D. Scholars', value: metrics.totalScholars, tab: 'SCHOLARS', color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Consultancy', value: `₹${(metrics.totalConsultancyAmount / 100000).toFixed(1)}L`, tab: 'CONSULTANCY', color: '#D97706', bg: '#FFFBEB' },
          { label: 'Research Awards', value: metrics.totalAwards, tab: 'AWARDS', color: '#059669', bg: '#ECFDF5' },
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => setActiveTab(card.tab as ResearchTabType)}
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
          {/* Comparative Academic Year Trends */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  3-Year Institutional Research Growth &amp; Trajectory
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Audited comparison across publications, granted IPR, sponsored project funding and industrial consultancy.
                </p>
              </div>
            </div>

            <ExcelTableContainer>
              <ExcelTable>
                <thead>
                  <tr>
                    <ExcelTh align="left">Academic Year</ExcelTh>
                    <ExcelTh align="center">Publications</ExcelTh>
                    <ExcelTh align="center">Patents / IPR</ExcelTh>
                    <ExcelTh align="center">Grants Sanctioned</ExcelTh>
                    <ExcelTh align="center">Consultancy Revenue</ExcelTh>
                    <ExcelTh align="center">Growth Status</ExcelTh>
                  </tr>
                </thead>
                <tbody>
                  {metrics.yearWiseComparison.map((row, i) => (
                    <tr key={i}>
                      <ExcelTd align="left">
                        <strong>{row.academicYear}</strong>
                      </ExcelTd>
                      <ExcelTd align="center">{row.publications} Papers</ExcelTd>
                      <ExcelTd align="center">{row.patents} IPR Records</ExcelTd>
                      <ExcelTd align="center">₹{(row.grantsAmount / 100000).toFixed(2)} Lakhs</ExcelTd>
                      <ExcelTd align="center">₹{(row.consultancyAmount / 100000).toFixed(2)} Lakhs</ExcelTd>
                      <ExcelTd align="center">
                        <Badge variant={i === 2 ? 'navy' : i === 1 ? 'active' : 'inactive'}>
                          {i === 2 ? 'Target' : i === 1 ? '+42% Growth' : 'Baseline'}
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

      {/* ─── TAB 2: RESEARCH PROJECTS ────────────────────────────────────────── */}
      {activeTab === 'PROJECTS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Research Projects ({researchData.projects.length} Records)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Sponsored and internally funded academic research projects.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddProjectModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Project
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="center">Code</ExcelTh>
                  <ExcelTh align="left">Title &amp; Research Area</ExcelTh>
                  <ExcelTh align="left">Principal Investigator</ExcelTh>
                  <ExcelTh align="left">Funding Agency</ExcelTh>
                  <ExcelTh align="center">Sanctioned</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.projects.map(p => (
                  <tr key={p.id}>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--brand-navy)' }}>{p.projectCode}</span>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.researchArea} • {p.departmentName}</div>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 600 }}>{p.principalInvestigatorName}</div>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontSize: '0.8125rem' }}>{p.fundingAgency}</div>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>₹{(p.sanctionedAmount / 100000).toFixed(2)}L</span>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant={p.status === 'COMPLETED' ? 'active' : p.status === 'ACTIVE' ? 'navy' : 'orange'}>
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

      {/* ─── TAB 3: PUBLICATIONS ────────────────────────────────────────────── */}
      {activeTab === 'PUBLICATIONS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Peer-Reviewed Publications ({researchData.publications.length} Records)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Indexed articles, conference papers, and book chapters with verified DOIs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPubModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Publication
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Paper Title &amp; Authors</ExcelTh>
                  <ExcelTh align="left">Journal / Conference</ExcelTh>
                  <ExcelTh align="center">Year</ExcelTh>
                  <ExcelTh align="center">Indexing</ExcelTh>
                  <ExcelTh align="center">Impact / Quartile</ExcelTh>
                  <ExcelTh align="center">DOI &amp; Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.publications.map(p => (
                  <tr key={p.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.authors}</div>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{p.journalOrConferenceName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.publisher}</div>
                    </ExcelTd>
                    <ExcelTd align="center">{p.year}</ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant={p.indexing === 'Scopus' ? 'orange' : p.indexing === 'Web of Science' ? 'active' : 'navy'}>
                        {p.indexing}
                      </Badge>
                    </ExcelTd>
                    <ExcelTd align="center">
                      {p.quartile ? <span style={{ fontWeight: 800, color: '#059669' }}>{p.quartile} (IF {p.impactFactor})</span> : 'N/A'}
                    </ExcelTd>
                    <ExcelTd align="center">
                      <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#1D4ED8' }}>{p.doi || 'Verified'}</span>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 4: PATENTS & IPR ────────────────────────────────────────────── */}
      {activeTab === 'PATENTS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Patents &amp; Intellectual Property Rights ({researchData.patents.length} Records)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Indian Patent Office (IPO) &amp; PCT international patent filing lifecycle.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPatentModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Patent / IPR
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="center">Application No</ExcelTh>
                  <ExcelTh align="left">IPR Title &amp; Inventors</ExcelTh>
                  <ExcelTh align="center">Type</ExcelTh>
                  <ExcelTh align="center">Filing Date</ExcelTh>
                  <ExcelTh align="center">Grant / Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.patents.map(p => (
                  <tr key={p.id}>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--brand-navy)' }}>{p.applicationNumber}</span>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.inventors}</div>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant="navy">{p.category}</Badge>
                    </ExcelTd>
                    <ExcelTd align="center">{p.filingDate}</ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant={p.status === 'GRANTED' ? 'active' : p.status === 'PUBLISHED' ? 'orange' : 'inactive'}>
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

      {/* ─── TAB 5: GRANTS ─────────────────────────────────────────────────── */}
      {activeTab === 'GRANTS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Sponsored Research Grants ({researchData.grants.length} Records)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddGrantModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Grant
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Grant No &amp; Project</ExcelTh>
                  <ExcelTh align="left">Principal Investigator</ExcelTh>
                  <ExcelTh align="left">Funding Agency</ExcelTh>
                  <ExcelTh align="center">Sanctioned</ExcelTh>
                  <ExcelTh align="center">Released</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.grants.map(g => (
                  <tr key={g.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{g.grantNo}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g.projectTitle}</div>
                    </ExcelTd>
                    <ExcelTd align="left">{g.principalInvestigatorName}</ExcelTd>
                    <ExcelTd align="left">{g.fundingAgency}</ExcelTd>
                    <ExcelTd align="center">₹{(g.sanctionedAmount / 100000).toFixed(2)}L</ExcelTd>
                    <ExcelTd align="center">₹{(g.releasedAmount / 100000).toFixed(2)}L</ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{g.status}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 6: SCHOLARS ───────────────────────────────────────────────── */}
      {activeTab === 'SCHOLARS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Research Scholars &amp; Ph.D. Candidates ({researchData.scholars.length} Scholars)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddScholarModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Scholar
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Scholar Name &amp; Reg No</ExcelTh>
                  <ExcelTh align="left">Research Area &amp; Thesis Title</ExcelTh>
                  <ExcelTh align="left">Supervisor</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.scholars.map(s => (
                  <tr key={s.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{s.scholarName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.registrationNumber} • {s.program}</div>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{s.thesisTitle}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.researchArea}</div>
                    </ExcelTd>
                    <ExcelTd align="left">{s.supervisorName}</ExcelTd>
                    <ExcelTd align="center"><Badge variant="navy">{s.status}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 7: CONSULTANCY ────────────────────────────────────────────── */}
      {activeTab === 'CONSULTANCY' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Corporate Consultancy Projects ({researchData.consultancies.length} Records)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddConsultancyModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Add Consultancy
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Project Title &amp; Client</ExcelTh>
                  <ExcelTh align="left">Faculty Consultant</ExcelTh>
                  <ExcelTh align="center">Contract Value</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.consultancies.map(c => (
                  <tr key={c.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{c.projectTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.clientName}</div>
                    </ExcelTd>
                    <ExcelTd align="left">{c.facultyConsultantName}</ExcelTd>
                    <ExcelTd align="center">₹{(c.contractAmount / 100000).toFixed(2)}L</ExcelTd>
                    <ExcelTd align="center"><Badge variant={c.status === 'COMPLETED' ? 'active' : 'navy'}>{c.status}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 8: CONFERENCES ────────────────────────────────────────────── */}
      {activeTab === 'CONFERENCES' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
            Conference Participations ({researchData.conferences.length} Records)
          </h3>
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Conference Name</ExcelTh>
                  <ExcelTh align="left">Faculty</ExcelTh>
                  <ExcelTh align="left">Location &amp; Dates</ExcelTh>
                  <ExcelTh align="left">Paper Presented</ExcelTh>
                  <ExcelTh align="center">Role</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.conferences.map(c => (
                  <tr key={c.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{c.conferenceName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.organizer}</div>
                    </ExcelTd>
                    <ExcelTd align="left">{c.facultyName}</ExcelTd>
                    <ExcelTd align="left">{c.location} ({c.startDate})</ExcelTd>
                    <ExcelTd align="left">{c.paperPresented || 'Attendee'}</ExcelTd>
                    <ExcelTd align="center"><Badge variant="navy">{c.participationType}</Badge></ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── TAB 9: BOOKS & CHAPTERS ────────────────────────────────────────── */}
      {activeTab === 'BOOKS' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
            Books &amp; Edited Chapters ({researchData.books.length} Records)
          </h3>
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Title &amp; Authors</ExcelTh>
                  <ExcelTh align="left">Publisher</ExcelTh>
                  <ExcelTh align="center">ISBN</ExcelTh>
                  <ExcelTh align="center">Type</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.books.map(b => (
                  <tr key={b.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{b.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.authors}</div>
                    </ExcelTd>
                    <ExcelTd align="left">{b.publisher}</ExcelTd>
                    <ExcelTd align="center"><span style={{ fontFamily: 'monospace' }}>{b.isbn || 'N/A'}</span></ExcelTd>
                    <ExcelTd align="center"><Badge variant="navy">{b.itemType}</Badge></ExcelTd>
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
            Faculty Research Awards &amp; Honors ({researchData.awards.length} Records)
          </h3>
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="left">Award Title</ExcelTh>
                  <ExcelTh align="left">Recipient</ExcelTh>
                  <ExcelTh align="left">Awarding Body</ExcelTh>
                  <ExcelTh align="center">Level</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {researchData.awards.map(a => (
                  <tr key={a.id}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{a.awardTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.description}</div>
                    </ExcelTd>
                    <ExcelTd align="left">{a.recipientName}</ExcelTd>
                    <ExcelTd align="left">{a.awardingOrganization}</ExcelTd>
                    <ExcelTd align="center"><Badge variant="active">{a.level}</Badge></ExcelTd>
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
              <Shield size={15} /> NAAC Criterion 3 • Research, Innovations and Extension Dossier
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.25rem 0' }}>
              Institutional Quality Assurance Evidence Summary
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Audited quantitative metrics mapped to the NAAC Revised Accreditation Framework (RAF) Criterion 3.
            </p>
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
                  <ExcelTh align="center">Evidence Files</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {naacSummary.map((n, i) => (
                  <tr key={i}>
                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{n.metric}</div>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 800, color: '#1D4ED8' }}>{n.currentValue}</span>
                    </ExcelTd>
                    <ExcelTd align="center">{n.previousPeriodValue}</ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant="active">{n.change}</Badge>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <div style={{ fontSize: '0.78rem' }}>{n.interpretation}</div>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{n.evidenceCount} Dossiers</span>
                    </ExcelTd>
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Create Research Project</h3>
              <button type="button" onClick={() => setShowAddProjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Project Title</label>
                <input type="text" required value={newPrjTitle} onChange={e => setNewPrjTitle(e.target.value)} placeholder="e.g. Distributed IoT Mesh for Campus Automation" className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Principal Investigator</label>
                  <input type="text" required value={newPrjPi} onChange={e => setNewPrjPi(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Funding Agency</label>
                  <input type="text" required value={newPrjAgency} onChange={e => setNewPrjAgency(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Sanctioned Budget (INR)</label>
                <input type="number" required value={newPrjAmount} onChange={e => setNewPrjAmount(Number(e.target.value))} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddProjectModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD PUBLICATION MODAL ─────────────────────────────────────────── */}
      {showAddPubModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Add Publication Record</h3>
              <button type="button" onClick={() => setShowAddPubModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePublication} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Paper Title</label>
                <input type="text" required value={newPubTitle} onChange={e => setNewPubTitle(e.target.value)} placeholder="Title of the research paper" className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Authors</label>
                  <input type="text" required value={newPubAuthors} onChange={e => setNewPubAuthors(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Journal / Conference</label>
                  <input type="text" value={newPubJournal} onChange={e => setNewPubJournal(e.target.value)} placeholder="Journal Name" className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Indexing</label>
                  <select value={newPubIndexing} onChange={e => setNewPubIndexing(e.target.value as PublicationIndexing)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="Scopus">Scopus</option>
                    <option value="Web of Science">Web of Science</option>
                    <option value="UGC CARE">UGC CARE</option>
                    <option value="Google Scholar">Google Scholar</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>DOI Number</label>
                  <input type="text" value={newPubDoi} onChange={e => setNewPubDoi(e.target.value)} placeholder="10.1109/..." className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddPubModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Publication</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD PATENT MODAL ──────────────────────────────────────────────── */}
      {showAddPatentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>File Patent / IPR Record</h3>
              <button type="button" onClick={() => setShowAddPatentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePatent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>IPR / Patent Title</label>
                <input type="text" required value={newPatTitle} onChange={e => setNewPatTitle(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Category</label>
                  <select value={newPatCategory} onChange={e => setNewPatCategory(e.target.value as IprCategory)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }}>
                    <option value="PATENT">Patent</option>
                    <option value="COPYRIGHT">Copyright</option>
                    <option value="DESIGN">Industrial Design</option>
                    <option value="TRADEMARK">Trademark</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Application Number</label>
                  <input type="text" required value={newPatAppNo} onChange={e => setNewPatAppNo(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Inventors</label>
                <input type="text" required value={newPatInventors} onChange={e => setNewPatInventors(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddPatentModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">File Patent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD GRANT MODAL ───────────────────────────────────────────────── */}
      {showAddGrantModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Register Research Grant</h3>
              <button type="button" onClick={() => setShowAddGrantModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateGrant} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Project Title</label>
                <input type="text" required value={newGrtTitle} onChange={e => setNewGrtTitle(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Grant Sanction No</label>
                  <input type="text" required value={newGrtNo} onChange={e => setNewGrtNo(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Funding Agency</label>
                  <input type="text" required value={newGrtAgency} onChange={e => setNewGrtAgency(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Sanctioned Amount (INR)</label>
                <input type="number" required value={newGrtAmount} onChange={e => setNewGrtAmount(Number(e.target.value))} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddGrantModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Grant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SCHOLAR MODAL ─────────────────────────────────────────────── */}
      {showAddScholarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Enroll Research Scholar</h3>
              <button type="button" onClick={() => setShowAddScholarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateScholar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Scholar Full Name</label>
                  <input type="text" required value={newSchName} onChange={e => setNewSchName(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Registration Number</label>
                  <input type="text" required value={newSchRegNo} onChange={e => setNewSchRegNo(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Thesis Topic / Research Area</label>
                <input type="text" required value={newSchTopic} onChange={e => setNewSchTopic(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddScholarModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Enroll Scholar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD CONSULTANCY MODAL ─────────────────────────────────────────── */}
      {showAddConsultancyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Register Consultancy Contract</h3>
              <button type="button" onClick={() => setShowAddConsultancyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateConsultancy} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Consultancy Project Title</label>
                <input type="text" required value={newConTitle} onChange={e => setNewConTitle(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Client / Corporate Name</label>
                  <input type="text" required value={newConClient} onChange={e => setNewConClient(e.target.value)} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Contract Value (INR)</label>
                  <input type="number" required value={newConAmount} onChange={e => setNewConAmount(Number(e.target.value))} className="input-field" style={{ width: '100%', marginTop: '0.2rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddConsultancyModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
