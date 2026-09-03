import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import { Modal } from '../../components/common/Modal';
import { StatCard } from '../../components/common/StatCard';
import {
  Users, Award, Calendar, FileText, CheckCircle2, Clock,
  Plus, Search, Filter, Shield, Sparkles, AlertTriangle,
  Building, ChevronRight, Eye, Check, X, RefreshCw
} from 'lucide-react';
import {
  studentCouncilService,
  CouncilOrganization,
  CouncilMember,
  CouncilMeeting,
  EventProposal,
  CouncilDashboardMetrics,
} from '../../services/studentCouncilService';

type DeskTab = 'DASHBOARD' | 'COUNCILS' | 'CLUBS' | 'OFFICE_BEARERS' | 'MEETINGS' | 'EVENT_PROPOSALS';

export const StudentCouncilDeskPage: React.FC = () => {
  const { role, user } = useAuth();
  const isStudent = (role || '').toUpperCase() === 'STUDENT';
  const isAdminOrFaculty = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'REGISTRAR', 'PRINCIPAL', 'HOI', 'HOD', 'FACULTY', 'FACULTY_COORDINATOR'].includes((role || '').toUpperCase());

  const [activeTab, setActiveTab] = useState<DeskTab>('DASHBOARD');
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<CouncilDashboardMetrics | null>(null);

  // Data lists
  const [councils, setCouncils] = useState<CouncilOrganization[]>([]);
  const [clubs, setClubs] = useState<CouncilOrganization[]>([]);
  const [officeBearers, setOfficeBearers] = useState<CouncilMember[]>([]);
  const [meetings, setMeetings] = useState<CouncilMeeting[]>([]);
  const [proposals, setProposals] = useState<EventProposal[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modals
  const [showCouncilModal, setShowCouncilModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showBearerModal, setShowBearerModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [reviewProposalTarget, setReviewProposalTarget] = useState<EventProposal | null>(null);

  // Form States
  const [councilName, setCouncilName] = useState('');
  const [councilCode, setCouncilCode] = useState('');
  const [councilChairperson, setCouncilChairperson] = useState('');
  const [councilSecretary, setCouncilSecretary] = useState('');

  const [clubName, setClubName] = useState('');
  const [clubCode, setClubCode] = useState('');
  const [clubType, setClubType] = useState('STUDENT_CLUB');
  const [clubChairperson, setClubChairperson] = useState('');
  const [clubSecretary, setClubSecretary] = useState('');

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [bearerName, setBearerName] = useState('');
  const [bearerRole, setBearerRole] = useState('PRESIDENT');

  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingVenue, setMeetingVenue] = useState('Council Room A-201');
  const [meetingMinutes, setMeetingMinutes] = useState('');

  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalClub, setProposalClub] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalVenue, setProposalVenue] = useState('');
  const [proposalBudget, setProposalBudget] = useState(25000);
  const [proposalParticipants, setProposalParticipants] = useState(100);
  const [proposalFaculty, setProposalFaculty] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');

  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricData, councilRes, clubRes, bearerData, meetingData, proposalData] = await Promise.all([
        studentCouncilService.getDashboardMetrics().catch(() => null),
        studentCouncilService.getCouncils({ limit: 50 }).catch(() => ({ data: [] })),
        studentCouncilService.getClubs({ limit: 50 }).catch(() => ({ data: [] })),
        studentCouncilService.getOfficeBearers().catch(() => []),
        studentCouncilService.getMeetings().catch(() => []),
        studentCouncilService.getEventProposals().catch(() => []),
      ]);

      setMetrics(metricData);
      setCouncils(councilRes?.data || []);
      setClubs(clubRes?.data || []);
      setOfficeBearers(bearerData || []);
      setMeetings(meetingData || []);
      setProposals(proposalData || []);
    } catch (err) {
      console.error('Failed to fetch council desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreateCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!councilName || !councilCode) return;
    try {
      await studentCouncilService.createCouncil({
        name: councilName,
        code: councilCode,
        chairperson: councilChairperson,
        secretary: councilSecretary,
      });
      setShowCouncilModal(false);
      setCouncilName('');
      setCouncilCode('');
      setCouncilChairperson('');
      setCouncilSecretary('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create council');
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName || !clubCode) return;
    try {
      await studentCouncilService.createClub({
        name: clubName,
        code: clubCode,
        committeeType: clubType,
        chairperson: clubChairperson,
        secretary: clubSecretary,
      });
      setShowClubModal(false);
      setClubName('');
      setClubCode('');
      setClubChairperson('');
      setClubSecretary('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to register club');
    }
  };

  const handleAssignBearer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !bearerName) return;
    try {
      await studentCouncilService.assignMember({
        committeeId: selectedOrgId,
        memberName: bearerName,
        role: bearerRole,
      });
      setShowBearerModal(false);
      setBearerName('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to assign office bearer');
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !meetingAgenda || !meetingDate) return;
    try {
      await studentCouncilService.createMeeting({
        committeeId: selectedOrgId,
        agenda: meetingAgenda,
        meetingDate,
        venue: meetingVenue,
        minutes: meetingMinutes || undefined,
      });
      setShowMeetingModal(false);
      setMeetingAgenda('');
      setMeetingMinutes('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create meeting');
    }
  };

  const handlePublishMeeting = async (meetingId: string) => {
    try {
      await studentCouncilService.updateMeetingStatus(meetingId, { status: 'PUBLISHED' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to publish meeting');
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle || !proposalClub || !proposalDate) return;
    try {
      await studentCouncilService.createEventProposal({
        title: proposalTitle,
        organizingClub: proposalClub,
        eventDate: proposalDate,
        venue: proposalVenue,
        estimatedBudget: Number(proposalBudget),
        expectedParticipants: Number(proposalParticipants),
        facultyCoordinator: proposalFaculty,
        description: proposalDesc,
      });
      setShowProposalModal(false);
      setProposalTitle('');
      setProposalDesc('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit proposal');
    }
  };

  const handleReviewProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProposalTarget) return;
    try {
      await studentCouncilService.reviewEventProposal(reviewProposalTarget.id, {
        status: reviewStatus,
        remarks: reviewRemarks,
      });
      setReviewProposalTarget(null);
      setReviewRemarks('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to review proposal');
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        borderRadius: '12px',
        padding: '1.75rem',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={28} color="#60a5fa" />
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Student Council Desk
            </h1>
            <Badge variant="navy">Official Governance Portal</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', maxWidth: '650px' }}>
            Centralized platform for Student Councils, Clubs, Office Bearers, Meeting Minutes (MoM), and Event Proposals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
              color: '#ffffff', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {/* Proposal Action for All, Council/Club creation for Admin/Faculty */}
          <button
            onClick={() => setShowProposalModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.1rem', background: '#3b82f6',
              border: 'none', borderRadius: '6px',
              color: '#ffffff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}
          >
            <Sparkles size={16} />
            Propose Event
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.25rem' }}>
        {[
          { id: 'DASHBOARD', label: 'Executive Overview', icon: Building },
          { id: 'COUNCILS', label: 'Student Councils', icon: Shield },
          { id: 'CLUBS', label: 'Clubs & Cells', icon: Users },
          { id: 'OFFICE_BEARERS', label: 'Office Bearers', icon: Award },
          { id: 'MEETINGS', label: 'Meetings & MoM', icon: FileText },
          { id: 'EVENT_PROPOSALS', label: 'Event Proposals', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DeskTab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.25rem', border: 'none',
                background: 'none', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1e40af' : '#64748b',
                borderBottom: isActive ? '3px solid #1e40af' : '3px solid transparent',
                marginBottom: '-0.35rem', transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            <StatCard
              title="Active Councils"
              value={metrics?.activeCouncilsCount ?? councils.length}
              subtitle="University & Institute Councils"
              trend="Formal Governance"
              icon={Shield}
              colorScheme="navy"
            />
            <StatCard
              title="Clubs & Cells"
              value={metrics?.activeClubsCount ?? clubs.length}
              subtitle="Technical, Cultural & Sports"
              trend="Student Organizations"
              icon={Users}
              colorScheme="blue"
            />
            <StatCard
              title="Office Bearers"
              value={metrics?.totalOfficeBearersCount ?? officeBearers.length}
              subtitle="Elected & Nominated Officers"
              trend="Council Leadership"
              icon={Award}
              colorScheme="gold"
            />
            <StatCard
              title="Upcoming Events"
              value={metrics?.upcomingEventsCount ?? 0}
              subtitle="Sanctioned Council Events"
              trend="Official Calendar"
              icon={Calendar}
              colorScheme="green"
            />
            <StatCard
              title="Pending Proposals"
              value={metrics?.pendingProposalsCount ?? proposals.filter(p => p.status === 'SUBMITTED').length}
              subtitle="Awaiting Faculty Review"
              trend="Approval Pipeline"
              icon={Clock}
              colorScheme="orange"
            />
            <StatCard
              title="Action Items Due"
              value={metrics?.actionItemsDueSoonCount ?? 0}
              subtitle="From Official MoM"
              trend="Follow-up Tracking"
              icon={AlertTriangle}
              colorScheme="gold"
            />
          </div>

          {/* Recent Approved Proposals */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
              Recently Approved Council Events
            </h3>
            {metrics?.recentApprovedProposals && metrics.recentApprovedProposals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {metrics.recentApprovedProposals.map((evt) => (
                  <div key={evt.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{evt.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Organized by: <span style={{ fontWeight: 500, color: '#334155' }}>{evt.applicantEntity}</span> • Approved by: {evt.actionedByName}
                      </div>
                    </div>
                    <Badge variant="success">APPROVED FOR CAMPUS</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>No approved proposals to display yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT COUNCILS */}
      {activeTab === 'COUNCILS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search councils..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                    border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '0.85rem', width: '240px'
                  }}
                />
              </div>
            </div>

            {isAdminOrFaculty && (
              <button
                onClick={() => setShowCouncilModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem', background: '#1e40af', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                }}
              >
                <Plus size={16} /> Establish Council
              </button>
            )}
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh>Code</ExcelTh>
                  <ExcelTh>Council Name</ExcelTh>
                  <ExcelTh>Faculty Coordinator</ExcelTh>
                  <ExcelTh>General Secretary</ExcelTh>
                  <ExcelTh>Members</ExcelTh>
                  <ExcelTh>Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {councils.length === 0 ? (
                  <tr>
                    <ExcelTd colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No student councils registered yet.
                    </ExcelTd>
                  </tr>
                ) : (
                  councils.map((c) => (
                    <tr key={c.id}>
                      <ExcelTd style={{ fontWeight: 600, color: '#1e40af' }}>{c.code}</ExcelTd>
                      <ExcelTd style={{ fontWeight: 500 }}>{c.name}</ExcelTd>
                      <ExcelTd>{c.chairperson || '—'}</ExcelTd>
                      <ExcelTd>{c.secretary || '—'}</ExcelTd>
                      <ExcelTd>{c._count?.members ?? 0} members</ExcelTd>
                      <ExcelTd>
                        <Badge variant={c.status === 'ACTIVE' ? 'success' : 'inactive'}>{c.status}</Badge>
                      </ExcelTd>
                    </tr>
                  ))
                )}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* TAB 3: CLUBS & CELLS */}
      {activeTab === 'CLUBS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search clubs or cells..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                    border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '0.85rem', width: '240px'
                  }}
                />
              </div>
            </div>

            {isAdminOrFaculty && (
              <button
                onClick={() => setShowClubModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem', background: '#1e40af', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                }}
              >
                <Plus size={16} /> Register Club / Cell
              </button>
            )}
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh>Code</ExcelTh>
                  <ExcelTh>Club / Cell Name</ExcelTh>
                  <ExcelTh>Category</ExcelTh>
                  <ExcelTh>Faculty Mentor</ExcelTh>
                  <ExcelTh>Student Lead</ExcelTh>
                  <ExcelTh>Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {clubs.length === 0 ? (
                  <tr>
                    <ExcelTd colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No student clubs or cells registered yet.
                    </ExcelTd>
                  </tr>
                ) : (
                  clubs.map((cl) => (
                    <tr key={cl.id}>
                      <ExcelTd style={{ fontWeight: 600, color: '#0284c7' }}>{cl.code}</ExcelTd>
                      <ExcelTd style={{ fontWeight: 500 }}>{cl.name}</ExcelTd>
                      <ExcelTd>
                        <Badge variant="navy">{cl.committeeType.replace('_', ' ')}</Badge>
                      </ExcelTd>
                      <ExcelTd>{cl.chairperson || '—'}</ExcelTd>
                      <ExcelTd>{cl.secretary || '—'}</ExcelTd>
                      <ExcelTd>
                        <Badge variant={cl.status === 'ACTIVE' ? 'success' : 'inactive'}>{cl.status}</Badge>
                      </ExcelTd>
                    </tr>
                  ))
                )}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* TAB 4: OFFICE BEARERS */}
      {activeTab === 'OFFICE_BEARERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Directory of elected and appointed student council officers and executive committee leads.
            </p>

            {isAdminOrFaculty && (
              <button
                onClick={() => {
                  if (councils.length > 0) setSelectedOrgId(councils[0].id);
                  setShowBearerModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem', background: '#1e40af', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                }}
              >
                <Plus size={16} /> Assign Office Bearer
              </button>
            )}
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh>Office Bearer Name</ExcelTh>
                  <ExcelTh>Designation / Role</ExcelTh>
                  <ExcelTh>Organization</ExcelTh>
                  <ExcelTh>Appointment Date</ExcelTh>
                  <ExcelTh>Status</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {officeBearers.length === 0 ? (
                  <tr>
                    <ExcelTd colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No executive office bearers assigned yet.
                    </ExcelTd>
                  </tr>
                ) : (
                  officeBearers.map((ob) => (
                    <tr key={ob.id}>
                      <ExcelTd style={{ fontWeight: 600, color: '#0f172a' }}>{ob.memberName}</ExcelTd>
                      <ExcelTd>
                        <Badge variant={ob.role === 'PRESIDENT' ? 'gold' : ob.role === 'GENERAL_SECRETARY' ? 'navy' : 'inactive'}>
                          {ob.role.replace('_', ' ')}
                        </Badge>
                      </ExcelTd>
                      <ExcelTd>{ob.committee?.name || 'Student Council'}</ExcelTd>
                      <ExcelTd>{new Date(ob.joinedAt).toLocaleDateString()}</ExcelTd>
                      <ExcelTd><Badge variant="success">ACTIVE</Badge></ExcelTd>
                    </tr>
                  ))
                )}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* TAB 5: MEETINGS & MINUTES OF MEETING (MoM) */}
      {activeTab === 'MEETINGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Official minutes, resolutions, and action items from student council and committee proceedings.
            </p>

            {isAdminOrFaculty && (
              <button
                onClick={() => {
                  if (councils.length > 0) setSelectedOrgId(councils[0].id);
                  setShowMeetingModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem', background: '#1e40af', color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                }}
              >
                <Plus size={16} /> Record Meeting / MoM
              </button>
            )}
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh>Meeting No</ExcelTh>
                  <ExcelTh>Organization</ExcelTh>
                  <ExcelTh>Date</ExcelTh>
                  <ExcelTh>Venue</ExcelTh>
                  <ExcelTh>Agenda Summary</ExcelTh>
                  <ExcelTh>Action Items</ExcelTh>
                  <ExcelTh>Status</ExcelTh>
                  {isAdminOrFaculty && <ExcelTh>Actions</ExcelTh>}
                </tr>
              </thead>
              <tbody>
                {meetings.length === 0 ? (
                  <tr>
                    <ExcelTd colSpan={isAdminOrFaculty ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No meeting minutes recorded yet.
                    </ExcelTd>
                  </tr>
                ) : (
                  meetings.map((m) => (
                    <tr key={m.id}>
                      <ExcelTd style={{ fontWeight: 600, color: '#1e40af' }}>{m.meetingNo}</ExcelTd>
                      <ExcelTd>{m.committee?.name || 'Council'}</ExcelTd>
                      <ExcelTd>{new Date(m.meetingDate).toLocaleDateString()}</ExcelTd>
                      <ExcelTd>{m.venue || 'Council Chamber'}</ExcelTd>
                      <ExcelTd style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.agenda}
                      </ExcelTd>
                      <ExcelTd>{m.actionItems?.length ?? 0} items</ExcelTd>
                      <ExcelTd>
                        <Badge variant={m.status === 'PUBLISHED' ? 'success' : m.status === 'APPROVED' ? 'navy' : 'gold'}>
                          {m.status}
                        </Badge>
                      </ExcelTd>
                      {isAdminOrFaculty && (
                        <ExcelTd>
                          {m.status !== 'PUBLISHED' && (
                            <button
                              onClick={() => handlePublishMeeting(m.id)}
                              style={{
                                padding: '0.3rem 0.6rem', background: '#10b981', color: '#fff',
                                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                              }}
                            >
                              Publish MoM
                            </button>
                          )}
                        </ExcelTd>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* TAB 6: EVENT PROPOSALS */}
      {activeTab === 'EVENT_PROPOSALS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Formal student council event proposal pipeline. Approved events synchronize with the university events calendar.
            </p>

            <button
              onClick={() => setShowProposalModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
              }}
            >
              <Plus size={16} /> Submit Event Proposal
            </button>
          </div>

          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh>Proposal No</ExcelTh>
                  <ExcelTh>Event Title</ExcelTh>
                  <ExcelTh>Organizing Club</ExcelTh>
                  <ExcelTh>Proposed Date</ExcelTh>
                  <ExcelTh>Budget</ExcelTh>
                  <ExcelTh>Status</ExcelTh>
                  {isAdminOrFaculty && <ExcelTh>Review Action</ExcelTh>}
                </tr>
              </thead>
              <tbody>
                {proposals.length === 0 ? (
                  <tr>
                    <ExcelTd colSpan={isAdminOrFaculty ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No event proposals submitted yet.
                    </ExcelTd>
                  </tr>
                ) : (
                  proposals.map((p) => (
                    <tr key={p.id}>
                      <ExcelTd style={{ fontWeight: 600, color: '#1e40af' }}>{p.requestNo}</ExcelTd>
                      <ExcelTd style={{ fontWeight: 500 }}>{p.title}</ExcelTd>
                      <ExcelTd>{p.applicantEntity}</ExcelTd>
                      <ExcelTd>{p.metadata?.eventDate ? new Date(p.metadata.eventDate).toLocaleDateString() : '—'}</ExcelTd>
                      <ExcelTd>₹{(p.metadata?.estimatedBudget || 0).toLocaleString()}</ExcelTd>
                      <ExcelTd>
                        <Badge variant={
                          p.status === 'APPROVED' ? 'success' :
                          p.status === 'REJECTED' ? 'danger' :
                          p.status === 'SUBMITTED' ? 'gold' : 'navy'
                        }>
                          {p.status}
                        </Badge>
                      </ExcelTd>
                      {isAdminOrFaculty && (
                        <ExcelTd>
                          {p.status === 'SUBMITTED' || p.status === 'FACULTY_REVIEW' || p.status === 'COUNCIL_REVIEW' ? (
                            <button
                              onClick={() => {
                                setReviewProposalTarget(p);
                                setReviewStatus('APPROVED');
                              }}
                              style={{
                                padding: '0.3rem 0.6rem', background: '#1e40af', color: '#fff',
                                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                              }}
                            >
                              Review & Sanction
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Decision finalized</span>
                          )}
                        </ExcelTd>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* MODAL 1: CREATE COUNCIL */}
      {showCouncilModal && (
        <Modal isOpen={true} title="Establish New Student Council" onClose={() => setShowCouncilModal(false)}>
          <form onSubmit={handleCreateCouncil} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Council Name *</label>
              <input
                type="text" required placeholder="e.g., SSCIT Central Student Council"
                value={councilName} onChange={(e) => setCouncilName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Council Code *</label>
              <input
                type="text" required placeholder="e.g., COUNCIL-SSCIT-2026"
                value={councilCode} onChange={(e) => setCouncilCode(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Faculty Coordinator</label>
                <input
                  type="text" placeholder="Prof. Name"
                  value={councilChairperson} onChange={(e) => setCouncilChairperson(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>General Secretary</label>
                <input
                  type="text" placeholder="Student Name"
                  value={councilSecretary} onChange={(e) => setCouncilSecretary(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                marginTop: '0.5rem', padding: '0.65rem', background: '#1e40af',
                color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Establish Council
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 2: CREATE CLUB */}
      {showClubModal && (
        <Modal isOpen={true} title="Register Student Club or Cell" onClose={() => setShowClubModal(false)}>
          <form onSubmit={handleCreateClub} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Club Name *</label>
              <input
                type="text" required placeholder="e.g., Robotics & AI Society"
                value={clubName} onChange={(e) => setClubName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Club Code *</label>
                <input
                  type="text" required placeholder="e.g., CLUB-ROBO-2026"
                  value={clubCode} onChange={(e) => setClubCode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category *</label>
                <select
                  value={clubType} onChange={(e) => setClubType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="TECHNICAL_CLUB">Technical Club</option>
                  <option value="CULTURAL_CLUB">Cultural Club</option>
                  <option value="SPORTS_CLUB">Sports Club</option>
                  <option value="INNOVATION_CLUB">Innovation & SSIP Club</option>
                  <option value="STUDENT_CELL">Student Welfare Cell</option>
                  <option value="STUDENT_CLUB">General Student Club</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={{
                marginTop: '0.5rem', padding: '0.65rem', background: '#1e40af',
                color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Register Organization
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 3: ASSIGN OFFICE BEARER */}
      {showBearerModal && (
        <Modal isOpen={true} title="Assign Office Bearer" onClose={() => setShowBearerModal(false)}>
          <form onSubmit={handleAssignBearer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Organization *</label>
              <select
                value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                {councils.map(c => <option key={c.id} value={c.id}>{c.name} (Council)</option>)}
                {clubs.map(cl => <option key={cl.id} value={cl.id}>{cl.name} (Club)</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Student / Staff Name *</label>
              <input
                type="text" required placeholder="Full Name"
                value={bearerName} onChange={(e) => setBearerName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Designation / Role *</label>
              <select
                value={bearerRole} onChange={(e) => setBearerRole(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="PRESIDENT">President</option>
                <option value="VICE_PRESIDENT">Vice President</option>
                <option value="GENERAL_SECRETARY">General Secretary</option>
                <option value="JOINT_SECRETARY">Joint Secretary</option>
                <option value="TREASURER">Treasurer</option>
                <option value="FACULTY_COORDINATOR">Faculty Coordinator</option>
                <option value="STUDENT_COORDINATOR">Student Coordinator</option>
                <option value="MEMBER">Active Member</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                marginTop: '0.5rem', padding: '0.65rem', background: '#1e40af',
                color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Appoint Officer
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 4: RECORD MEETING */}
      {showMeetingModal && (
        <Modal isOpen={true} title="Record Meeting / MoM" onClose={() => setShowMeetingModal(false)}>
          <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Organization *</label>
              <select
                value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                {councils.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {clubs.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Meeting Date *</label>
                <input
                  type="date" required
                  value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Venue</label>
                <input
                  type="text" placeholder="Council Hall"
                  value={meetingVenue} onChange={(e) => setMeetingVenue(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Agenda *</label>
              <input
                type="text" required placeholder="Key discussion points"
                value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Discussion Minutes</label>
              <textarea
                rows={4} placeholder="Summary of decisions, resolutions, and council notes..."
                value={meetingMinutes} onChange={(e) => setMeetingMinutes(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>
            <button
              type="submit"
              style={{
                marginTop: '0.5rem', padding: '0.65rem', background: '#1e40af',
                color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Record Meeting Draft
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 5: SUBMIT PROPOSAL */}
      {showProposalModal && (
        <Modal isOpen={true} title="Submit Event Proposal" onClose={() => setShowProposalModal(false)}>
          <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Event Title *</label>
              <input
                type="text" required placeholder="e.g., Annual Tech Innovators Summit 2026"
                value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Organizing Club / Entity *</label>
                <input
                  type="text" required placeholder="e.g., Robotics & AI Society"
                  value={proposalClub} onChange={(e) => setProposalClub(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Proposed Date *</label>
                <input
                  type="date" required
                  value={proposalDate} onChange={(e) => setProposalDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Estimated Budget (₹)</label>
                <input
                  type="number"
                  value={proposalBudget} onChange={(e) => setProposalBudget(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Expected Footfall</label>
                <input
                  type="number"
                  value={proposalParticipants} onChange={(e) => setProposalParticipants(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description & Scope</label>
              <textarea
                rows={3} placeholder="Brief summary of event objectives, target audience, and expected outcomes..."
                value={proposalDesc} onChange={(e) => setProposalDesc(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>
            <button
              type="submit"
              style={{
                marginTop: '0.5rem', padding: '0.65rem', background: '#3b82f6',
                color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Submit Proposal for Review
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 6: REVIEW PROPOSAL (ADMIN / FACULTY ONLY) */}
      {reviewProposalTarget && (
        <Modal isOpen={true} title={`Review Event: ${reviewProposalTarget.title}`} onClose={() => setReviewProposalTarget(null)}>
          <form onSubmit={handleReviewProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div><strong>Organizer:</strong> {reviewProposalTarget.applicantEntity}</div>
              <div><strong>Budget Requested:</strong> ₹{(reviewProposalTarget.metadata?.estimatedBudget || 0).toLocaleString()}</div>
              <div><strong>Event Date:</strong> {reviewProposalTarget.metadata?.eventDate}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Review Decision *</label>
              <select
                value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as any)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="APPROVED">Sanction / Approve Proposal</option>
                <option value="REJECTED">Reject Proposal</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Administrative Remarks</label>
              <textarea
                rows={3} placeholder="Add feedback, budget stipulations, or approval notes..."
                value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <button
              type="submit"
              style={{
                marginTop: '0.5rem', padding: '0.65rem',
                background: reviewStatus === 'APPROVED' ? '#10b981' : '#ef4444',
                color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Confirm Decision
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentCouncilDeskPage;
