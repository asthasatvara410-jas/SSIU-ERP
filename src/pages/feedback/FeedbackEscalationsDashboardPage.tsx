import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { feedbackService } from '../../services/feedbackService';
import { 
  GrievanceEscalationItem, EscalationAnalyticsData, 
  EscalationLevel, SlaStatus, EscalationReason, DetailedStudentFeedback 
} from '../../types/feedback';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import { 
  Shield, AlertTriangle, Clock, ArrowUpRight, CheckCircle2, 
  AlertCircle, Search, Filter, RotateCcw, Eye, UserX, 
  ChevronRight, RefreshCw, Layers, Award, FileText, Send, X, Plus
} from 'lucide-react';

export const FeedbackEscalationsDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'HOI', 'HOD', 'PRINCIPAL', 'REGISTRAR', 'IQAC_ADMIN', 'IQAC'].includes(role || '');

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEscalationLevel, setSelectedEscalationLevel] = useState<string>('ALL');
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>('ALL');

  // Modals & Action States
  const [selectedCaseForView, setSelectedCaseForView] = useState<GrievanceEscalationItem | null>(null);
  const [escalatingCase, setEscalatingCase] = useState<GrievanceEscalationItem | null>(null);
  const [resolvingCase, setResolvingCase] = useState<GrievanceEscalationItem | null>(null);
  const [reopeningCase, setReopeningCase] = useState<GrievanceEscalationItem | null>(null);

  // Form inputs for modals
  const [escalateToLevel, setEscalateToLevel] = useState<number>(1);
  const [escalateReason, setEscalateReason] = useState<EscalationReason>('MANUAL_ESCALATION');
  const [escalateNote, setEscalateNote] = useState<string>('');

  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');
  const [internalRemarks, setInternalRemarks] = useState<string>('');

  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenDetails, setReopenDetails] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Queue & Analytics from Service
  const queue = useMemo(() => {
    return feedbackService.getEscalationQueue({
      status: selectedStatus,
      priority: selectedPriority,
      category: selectedCategory,
      escalationLevel: selectedEscalationLevel,
      slaStatus: selectedSlaStatus,
      search: searchQuery
    });
  }, [selectedStatus, selectedPriority, selectedCategory, selectedEscalationLevel, selectedSlaStatus, searchQuery, refreshKey]);

  const analytics = useMemo(() => {
    return feedbackService.getEscalationAnalytics();
  }, [refreshKey]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedCategory('ALL');
    setSelectedEscalationLevel('ALL');
    setSelectedSlaStatus('ALL');
  };

  // Background SLA Process Trigger
  const handleTriggerSlaProcessing = () => {
    // Process live SLA checks on all active cases
    const all = feedbackService.getAllFeedbacks();
    let escalatedCount = 0;
    const now = new Date();

    all.forEach(f => {
      if (f.itemType === 'GRIEVANCE' && f.status !== 'RESOLVED' && f.status !== 'CLOSED') {
        const sla = feedbackService.computeSlaInfo(f);
        if (sla.isBreached) {
          const curLvl = ((f as any).escalationLevel || 0) as EscalationLevel;
          if (curLvl < 4) {
            const nextLvl = (curLvl + 1) as EscalationLevel;
            const authority = feedbackService.getHierarchyAuthority(nextLvl);
            const alreadyDone = f.timelineEvents?.some(e => e.eventType === 'ESCALATED' && e.details?.includes(`Level ${nextLvl}`));

            if (!alreadyDone) {
              (f as any).escalationLevel = nextLvl;
              f.status = 'ESCALATED';
              f.updatedAt = now.toISOString();
              if (!f.timelineEvents) f.timelineEvents = [];
              f.timelineEvents.push({
                eventType: 'ESCALATED',
                title: `Auto-Escalated: SLA Deadline Breached (Level ${nextLvl})`,
                details: `Case exceeded resolution SLA without closure. Automatically escalated from Level ${curLvl} to Level ${nextLvl} (${authority.label}).`,
                createdAt: now.toISOString(),
              });
              feedbackService.saveFeedback(f);
              escalatedCount++;
            }
          }
        }
      }
    });

    setRefreshKey(k => k + 1);
    showToast('success', `SLA Processing complete. ${escalatedCount} breached cases auto-escalated.`);
  };

  // Execute Manual Escalation
  const handleConfirmEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalatingCase) return;

    try {
      feedbackService.escalateGrievanceFrontend(
        escalatingCase.id, 
        { toLevel: escalateToLevel as EscalationLevel, reason: escalateReason, note: escalateNote },
        user || undefined
      );
      setEscalatingCase(null);
      setEscalateNote('');
      setRefreshKey(k => k + 1);
      showToast('success', `Case ${escalatingCase.caseNumber} escalated to Level ${escalateToLevel}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to escalate case.');
    }
  };

  // Execute Resolution
  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingCase) return;
    if (!resolutionSummary.trim()) {
      showToast('error', 'Resolution summary is required.');
      return;
    }

    try {
      feedbackService.resolveGrievanceFrontend(
        resolvingCase.id,
        { resolutionSummary: resolutionSummary.trim(), correctiveAction: correctiveAction.trim(), internalRemarks: internalRemarks.trim() },
        user || undefined
      );
      setResolvingCase(null);
      setResolutionSummary('');
      setCorrectiveAction('');
      setInternalRemarks('');
      setRefreshKey(k => k + 1);
      showToast('success', `Case ${resolvingCase.caseNumber} marked as RESOLVED.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to resolve case.');
    }
  };

  // Execute Reopen
  const handleConfirmReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopeningCase) return;
    if (!reopenReason.trim()) {
      showToast('error', 'Reopen justification is required.');
      return;
    }

    try {
      feedbackService.reopenGrievanceFrontend(
        reopeningCase.id,
        { reason: reopenReason.trim(), additionalDetails: reopenDetails.trim() },
        user || undefined
      );
      setReopeningCase(null);
      setReopenReason('');
      setReopenDetails('');
      setRefreshKey(k => k + 1);
      showToast('success', `Case ${reopeningCase.caseNumber} reopened for investigation.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reopen case.');
    }
  };

  const getSlaBadge = (status: SlaStatus, remainingHours: number) => {
    switch (status) {
      case 'ON_TRACK':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #10B981' }}>
            <Clock size={12} /> ON TRACK ({remainingHours}h)
          </span>
        );
      case 'DUE_SOON':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' }}>
            <AlertTriangle size={12} /> DUE SOON ({remainingHours}h)
          </span>
        );
      case 'SLA_BREACHED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #EF4444' }}>
            <AlertCircle size={12} /> SLA BREACHED
          </span>
        );
      case 'RESOLVED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#E0E7FF', color: '#3730A3', border: '1px solid #6366F1' }}>
            <CheckCircle2 size={12} /> RESOLVED
          </span>
        );
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL': return <Badge variant="active">CRITICAL (24h)</Badge>;
      case 'HIGH': return <Badge variant="orange">HIGH (48h)</Badge>;
      case 'MEDIUM': return <Badge variant="gold">MEDIUM (72h)</Badge>;
      default: return <Badge variant="navy">LOW (120h)</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#059669' : '#DC2626',
          color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)', fontWeight: 600, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toastMessage.text}
        </div>
      )}

      {/* ─── 1. HEADER WITH ACTIONS ────────────────────────────────────────── */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a8a 100%)',
        color: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px rgba(26, 54, 93, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93C5FD', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Shield size={15} /> Institutional Governance &amp; Redressal Escalation Engine
            </div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: '0.2rem 0 0.25rem 0', letterSpacing: '-0.01em' }}>
              Feedback &amp; Grievance Escalation Management
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', maxWidth: '800px', margin: 0, lineHeight: 1.4 }}>
              Automated SLA monitoring, hierarchy-based escalation triggers (Level 0 to 4), and resolution tracking under UGC regulations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTriggerSlaProcessing}
              className="btn"
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                border: 'none',
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
              <RefreshCw size={15} /> Run SLA Escalation Processor
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. TOP KPI CARDS ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Active Cases
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            {analytics.activeCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Pending Resolution
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            SLA On Track
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            {analytics.onTrackCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Within Time Limits
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Due Soon (&lt; 8h)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D97706', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            {analytics.dueSoonCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Approaching Deadline
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            SLA Breached
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#DC2626', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            {analytics.breachedCount}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Escalation Eligible
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Escalated (L1+)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7C3AED', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            {analytics.totalEscalated}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Elevated to HOD/Dean/VC
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--brand-navy)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            SLA Compliance
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            {analytics.slaComplianceRate}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Institutional Quality Index
          </div>
        </div>
      </div>

      {/* ─── 3. MULTI-PARAMETER FILTER SYSTEM ──────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} /> Escalation Queue Filters
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Search Cases
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reference, subject..."
                className="form-control"
                style={{ height: '36px', fontSize: '0.8125rem', borderRadius: '6px', paddingLeft: '1.75rem' }}
              />
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '0.7rem', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Priority Level
            </label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="form-control"
              style={{ height: '36px', fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (24h SLA)</option>
              <option value="HIGH">High (48h SLA)</option>
              <option value="MEDIUM">Medium (72h SLA)</option>
              <option value="LOW">Low (120h SLA)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              SLA Status
            </label>
            <select
              value={selectedSlaStatus}
              onChange={e => setSelectedSlaStatus(e.target.value)}
              className="form-control"
              style={{ height: '36px', fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              <option value="ALL">All SLA Statuses</option>
              <option value="ON_TRACK">On Track</option>
              <option value="DUE_SOON">Due Soon (&lt; 8h)</option>
              <option value="SLA_BREACHED">SLA Breached</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Escalation Tier
            </label>
            <select
              value={selectedEscalationLevel}
              onChange={e => setSelectedEscalationLevel(e.target.value)}
              className="form-control"
              style={{ height: '36px', fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              <option value="ALL">All Levels</option>
              <option value="0">Level 0 (Department Officer)</option>
              <option value="1">Level 1 (HOD Level)</option>
              <option value="2">Level 2 (Dean / Principal Level)</option>
              <option value="3">Level 3 (Registrar / IQAC)</option>
              <option value="4">Level 4 (Vice Chancellor)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Workflow Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="form-control"
              style={{ height: '36px', fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REOPENED">REOPENED</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 4. ESCALATION QUEUE TABLE ─────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Active Escalation &amp; Grievance Queue ({queue.length} Cases)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Prioritized by urgency, SLA remaining time, and institutional routing level.
            </p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Shield size={36} color="var(--text-muted)" style={{ opacity: 0.5, margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              No escalation records matching current filters
            </div>
            <div style={{ fontSize: '0.8125rem' }}>Try clearing your active filters to inspect all records.</div>
          </div>
        ) : (
          <ExcelTableContainer>
            <ExcelTable>
              <thead>
                <tr>
                  <ExcelTh align="center">Ref No</ExcelTh>
                  <ExcelTh align="center">Priority</ExcelTh>
                  <ExcelTh align="left">Category &amp; Subject</ExcelTh>
                  <ExcelTh align="center">SLA Status</ExcelTh>
                  <ExcelTh align="left">Current Authority (Tier)</ExcelTh>
                  <ExcelTh align="center">Status</ExcelTh>
                  <ExcelTh align="center">Actions</ExcelTh>
                </tr>
              </thead>
              <tbody>
                {queue.map((c) => (
                  <tr key={c.id}>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--brand-navy)' }}>
                        {c.caseNumber}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </ExcelTd>

                    <ExcelTd align="center">
                      {getPriorityBadge(c.priority)}
                    </ExcelTd>

                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>
                        {c.subject}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Category: {c.category.replace(/_/g, ' ')} • {c.submitterType}
                      </div>
                    </ExcelTd>

                    <ExcelTd align="center">
                      {getSlaBadge(c.slaStatus, c.remainingHours)}
                    </ExcelTd>

                    <ExcelTd align="left">
                      <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-navy)' }}>
                        {c.currentAuthority}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Level {c.escalationLevel} of 4 Tier Hierarchy
                      </div>
                    </ExcelTd>

                    <ExcelTd align="center">
                      <Badge variant={c.status === 'RESOLVED' ? 'active' : c.status === 'ESCALATED' ? 'orange' : 'navy'}>
                        {c.status}
                      </Badge>
                    </ExcelTd>

                    <ExcelTd align="center">
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCaseForView(c)}
                          className="btn btn-secondary btn-sm"
                          title="View Case Details"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <Eye size={13} /> View
                        </button>

                        {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEscalatingCase(c);
                                setEscalateToLevel(Math.min(4, c.escalationLevel + 1));
                              }}
                              className="btn btn-sm"
                              title="Escalate Case"
                              style={{ backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              <ArrowUpRight size={13} /> Escalate
                            </button>

                            <button
                              type="button"
                              onClick={() => setResolvingCase(c)}
                              className="btn btn-sm"
                              title="Resolve Case"
                              style={{ backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              <CheckCircle2 size={13} /> Resolve
                            </button>
                          </>
                        )}

                        {(c.status === 'RESOLVED' || c.status === 'CLOSED') && (
                          <button
                            type="button"
                            onClick={() => setReopeningCase(c)}
                            className="btn btn-secondary btn-sm"
                            title="Reopen Case"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <RotateCcw size={13} /> Reopen
                          </button>
                        )}
                      </div>
                    </ExcelTd>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        )}
      </div>

      {/* ─── 5. INSTITUTIONAL QUALITY & NAAC SUMMARY CARD ─────────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-navy)', fontWeight: 800, fontSize: '0.875rem' }}>
          <Award size={16} /> {analytics.institutionalQualitySummary.title}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Regulatory Framework</div>
            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{analytics.institutionalQualitySummary.framework}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Institutional SLA Compliance</div>
            <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.125rem' }}>{analytics.institutionalQualitySummary.complianceRate}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Average Resolution Turnaround</div>
            <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.125rem' }}>{analytics.institutionalQualitySummary.avgTurnaround}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Active Escalation Status</div>
            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{analytics.institutionalQualitySummary.activeEscalationTier}</div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: VIEW CASE DETAILS & IMMUTABLE TIMELINE ───────────────── */}
      {selectedCaseForView && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Case Dossier: {selectedCaseForView.caseNumber}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedCaseForView.category.replace(/_/g, ' ')} • {selectedCaseForView.submitterType}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setSelectedCaseForView(null)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              {/* Status & SLA Badge Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Assigned Authority</div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{selectedCaseForView.currentAuthority}</div>
                </div>
                <div>
                  {getSlaBadge(selectedCaseForView.slaStatus, selectedCaseForView.remainingHours)}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Subject:</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCaseForView.subject}</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Description / Facts:</div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px', marginTop: '0.25rem', border: '1px solid var(--border-color)', lineHeight: 1.5 }}>
                  {selectedCaseForView.description}
                </div>
              </div>

              {selectedCaseForView.resolutionSummary && (
                <div style={{ padding: '0.75rem 0.85rem', backgroundColor: '#D1FAE5', borderRadius: '6px', color: '#065F46', border: '1px solid #10B981' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>Formal Resolution:</div>
                  <p style={{ margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>{selectedCaseForView.resolutionSummary}</p>
                </div>
              )}

              {/* Immutable Escalation Timeline */}
              <div>
                <div style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Immutable Escalation &amp; Lifecycle Timeline:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderLeft: '2px solid var(--brand-navy)', paddingLeft: '1rem', marginLeft: '0.35rem' }}>
                  {(selectedCaseForView.timelineEvents || [
                    { eventType: 'SUBMITTED', title: 'Case Registered', details: 'Confidential submission received.', createdAt: selectedCaseForView.createdAt }
                  ]).map((evt, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.35rem', top: '0.25rem', width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--brand-navy)' }} />
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{evt.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.details}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(evt.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCaseForView(null)} style={{ fontSize: '0.8125rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: MANUAL ESCALATION ACTION ─────────────────────────────── */}
      {escalatingCase && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Escalate Case {escalatingCase.caseNumber}
              </h3>
              <button className="btn-icon" onClick={() => setEscalatingCase(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleConfirmEscalation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Target Escalation Level *</label>
                <select
                  value={escalateToLevel}
                  onChange={e => setEscalateToLevel(parseInt(e.target.value, 10))}
                  className="form-control"
                  style={{ height: '38px', borderRadius: '6px' }}
                >
                  <option value={1}>Level 1: Head of Department (HOD)</option>
                  <option value={2}>Level 2: Dean / Institute Principal</option>
                  <option value={3}>Level 3: University Grievance Cell / Registrar</option>
                  <option value={4}>Level 4: Vice Chancellor (Final Tier)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Escalation Reason *</label>
                <select
                  value={escalateReason}
                  onChange={e => setEscalateReason(e.target.value as any)}
                  className="form-control"
                  style={{ height: '38px', borderRadius: '6px' }}
                >
                  <option value="MANUAL_ESCALATION">Manual Authority Escalation</option>
                  <option value="SLA_BREACH">SLA Deadline Exceeded</option>
                  <option value="CRITICAL_PRIORITY">Critical Severity / Urgent Attention</option>
                  <option value="REPEATED_UNRESOLVED">Repeated Unresolved Pattern</option>
                  <option value="AUTHORITY_UNAVAILABLE">Primary Authority Unavailable</option>
                  <option value="OTHER">Other Institutional Ground</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Explanatory Directives / Notes</label>
                <textarea
                  rows={3}
                  value={escalateNote}
                  onChange={e => setEscalateNote(e.target.value)}
                  placeholder="Provide specific directions or justification..."
                  className="form-control"
                  style={{ borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEscalatingCase(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#F59E0B', color: '#0F172A', fontWeight: 800 }}>
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: RESOLUTION & CORRECTIVE ACTION ────────────────────────── */}
      {resolvingCase && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Formal Resolution: {resolvingCase.caseNumber}
              </h3>
              <button className="btn-icon" onClick={() => setResolvingCase(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleConfirmResolution} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Resolution Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionSummary}
                  onChange={e => setResolutionSummary(e.target.value)}
                  placeholder="Summarize the action and final resolution decision..."
                  className="form-control"
                  style={{ borderRadius: '6px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Corrective Action Taken (Optional)</label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={e => setCorrectiveAction(e.target.value)}
                  placeholder="Infrastructure replacement, teacher counseling, curriculum revision..."
                  className="form-control"
                  style={{ borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResolvingCase(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10B981', fontWeight: 800 }}>
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: REOPEN CASE ─────────────────────────────────────────── */}
      {reopeningCase && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.5rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Reopen Case: {reopeningCase.caseNumber}
              </h3>
              <button className="btn-icon" onClick={() => setReopeningCase(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleConfirmReopen} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Justification for Reopening *</label>
                <input
                  type="text"
                  required
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  placeholder="e.g. Submitter provided new evidence or issue recurred"
                  className="form-control"
                  style={{ height: '38px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Additional Notes</label>
                <textarea
                  rows={3}
                  value={reopenDetails}
                  onChange={e => setReopenDetails(e.target.value)}
                  placeholder="Details for committee re-investigation..."
                  className="form-control"
                  style={{ borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReopeningCase(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--brand-navy)', fontWeight: 800 }}>
                  Reopen Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackEscalationsDashboardPage;
