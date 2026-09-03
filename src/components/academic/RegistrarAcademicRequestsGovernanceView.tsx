import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  registrarAcademicRequestsService, 
  AcademicRequestItemView, 
  AcademicRequestsSummaryKPIs,
  InstituteRequestSummary,
  AcademicRequestFilterParams
} from '../../services/registrarAcademicRequestsService';
import { 
  Send, Building2, Layers, Search, Filter, RefreshCw, 
  Download, Printer, CheckCircle2, XCircle, AlertTriangle, 
  Clock, Eye, FileText, CheckSquare, History, User as UserIcon, 
  Calendar, ShieldAlert, ArrowRight, CornerDownLeft, AlertCircle,
  Sparkles, ExternalLink, HelpCircle
} from 'lucide-react';
import { Institute, Department, Program, User } from '../../types';

export const RegistrarAcademicRequestsGovernanceView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [selectedInstId, setSelectedInstId] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedProgId, setSelectedProgId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [activePeriodTab, setActivePeriodTab] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'ESCALATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<AcademicRequestItemView | null>(null);
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<AcademicRequestItemView | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [actionRemarks, setActionRemarks] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState<boolean>(false);

  // Master lists
  const institutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const departments = useMemo(() => {
    const all = db.getDepartments();
    if (selectedInstId && selectedInstId !== 'ALL') {
      return all.filter(d => d.instituteId === selectedInstId);
    }
    return all;
  }, [selectedInstId, refreshKey]);

  const programs = useMemo(() => {
    const all = db.getPrograms();
    if (selectedDeptId && selectedDeptId !== 'ALL') {
      return all.filter(p => p.departmentId === selectedDeptId);
    }
    return all;
  }, [selectedDeptId, refreshKey]);

  // Active filter params
  const filterParams: AcademicRequestFilterParams = useMemo(() => ({
    instituteId: selectedInstId,
    departmentId: selectedDeptId,
    programId: selectedProgId,
    category: selectedCategory,
    status: selectedStatus,
    priority: selectedPriority,
    period: activePeriodTab,
    searchQuery
  }), [selectedInstId, selectedDeptId, selectedProgId, selectedCategory, selectedStatus, selectedPriority, activePeriodTab, searchQuery]);

  // Real-time Queries (Single Source of Truth)
  const requests = useMemo(() => {
    return registrarAcademicRequestsService.getRequests(filterParams);
  }, [filterParams, refreshKey]);

  const summaryKPIs = useMemo(() => {
    return registrarAcademicRequestsService.getSummaryKPIs(filterParams);
  }, [filterParams, refreshKey]);

  const instituteSummaries = useMemo(() => {
    return registrarAcademicRequestsService.getInstituteSummaries();
  }, [refreshKey]);

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForAction || !currentUser) return;

    try {
      setIsSubmittingAction(true);
      if (actionType === 'APPROVE') {
        registrarAcademicRequestsService.approveRequest(selectedRequestForAction.id, actionRemarks, currentUser);
      } else if (actionType === 'REJECT') {
        registrarAcademicRequestsService.rejectRequest(selectedRequestForAction.id, actionRemarks, currentUser);
      } else {
        registrarAcademicRequestsService.returnForCorrection(selectedRequestForAction.id, actionRemarks, currentUser);
      }
      setSelectedRequestForAction(null);
      setActionRemarks('');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to process action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleExport = (format: 'XLSX' | 'CSV') => {
    registrarAcademicRequestsService.exportRequests(filterParams, format);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & TOP ACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(11,25,44,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.4rem', background: 'rgba(243,112,35,0.2)', borderRadius: '8px', border: '1px solid #F37023' }}>
                <Send size={22} color="#F37023" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.4px', color: '#FFFFFF' }}>
                Academic Requests
              </h1>
              <Badge variant="active">University-Wide Governance</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: '0.35rem 0 0 0', maxWidth: '750px' }}>
              University-wide academic request monitoring, verification and governance across all 12 institutes, departments, students, and faculty.
            </p>
          </div>

          {/* Top-Right Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('XLSX')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} color="#10B981" /> Export Requests (XLSX)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('CSV')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} color="#38BDF8" /> Export CSV
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPrintReportModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print Report
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Refresh ERP Data
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. TOP SUMMARY CARDS (QUERY-DRIVEN & SINGLE SOURCE OF TRUTH)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.65rem'
      }}>
        {/* 1. TOTAL REQUESTS */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0B192C' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Requests</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{summaryKPIs.totalRequests}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Active Filter Scope</div>
        </div>

        {/* 2. PENDING */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>{summaryKPIs.pending}</div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700 }}>Awaiting Action</div>
        </div>

        {/* 3. UNDER REVIEW */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #38BDF8' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Under Review</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{summaryKPIs.underReview}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>In Workflow</div>
        </div>

        {/* 4. APPROVED */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Approved</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{summaryKPIs.approved}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Statutory Clearances</div>
        </div>

        {/* 5. REJECTED */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Rejected</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>{summaryKPIs.rejected}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Closed / Ineligible</div>
        </div>

        {/* 6. ESCALATED */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #A855F7' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Escalated</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>{summaryKPIs.escalated}</div>
          <div style={{ fontSize: '0.7rem', color: '#A855F7', fontWeight: 700 }}>Priority Escalation</div>
        </div>

        {/* 7. OVERDUE */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #DC2626' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Overdue</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{summaryKPIs.overdue}</div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>SLA Breached</div>
        </div>

        {/* 8. TODAY'S REQUESTS */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #F37023' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Today's Requests</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F37023', marginTop: '2px' }}>{summaryKPIs.todayRequests}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Fresh Inward</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. INSTITUTE-WISE OVERVIEW MATRIX
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Building2 size={16} color="#F37023" /> Institute-Wise Request Volume & Compliance
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Click an institute to filter the request roster below</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {instituteSummaries.slice(0, 6).map(inst => {
            const isSelected = selectedInstId === inst.instituteId;
            return (
              <div 
                key={inst.instituteId}
                onClick={() => {
                  if (isSelected) {
                    setSelectedInstId('ALL');
                  } else {
                    setSelectedInstId(inst.instituteId);
                    setSelectedDeptId('ALL');
                  }
                }}
                style={{
                  padding: '0.85rem 1rem',
                  background: isSelected ? 'rgba(243,112,35,0.06)' : '#F8FAFC',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #F37023' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#0B192C' }}>{inst.instituteName}</strong>
                  <Badge variant={isSelected ? 'orange' : 'navy'}>{inst.instituteCode}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', padding: '0.3rem', borderRadius: '4px' }}>
                    <div style={{ color: '#64748B', fontSize: '0.65rem' }}>Total</div>
                    <strong style={{ color: '#0B192C' }}>{inst.totalRequests}</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.3rem', borderRadius: '4px' }}>
                    <div style={{ color: '#F59E0B', fontSize: '0.65rem' }}>Pending</div>
                    <strong style={{ color: '#F59E0B' }}>{inst.pending}</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.3rem', borderRadius: '4px' }}>
                    <div style={{ color: '#10B981', fontSize: '0.65rem' }}>Approved</div>
                    <strong style={{ color: '#10B981' }}>{inst.approved}</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '0.3rem', borderRadius: '4px' }}>
                    <div style={{ color: '#DC2626', fontSize: '0.65rem' }}>Overdue</div>
                    <strong style={{ color: '#DC2626' }}>{inst.overdue}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. FILTER BAR & SEARCH (UNIFIED FILTER CRITERIA)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        
        {/* Quick Period Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {(['ALL', 'TODAY', 'OVERDUE', 'ESCALATED'] as const).map(p => (
            <button
              key={p}
              className={`btn btn-xs ${activePeriodTab === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActivePeriodTab(p)}
            >
              {p === 'ALL' ? 'All Academic Requests' : (p === 'TODAY' ? "Today's Inward" : (p === 'OVERDUE' ? 'Overdue / SLA Breached' : 'Escalated Priority'))}
            </button>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.65rem'
        }}>
          {/* Institute Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Institute</label>
            <select
              value={selectedInstId}
              onChange={(e) => {
                setSelectedInstId(e.target.value);
                setSelectedDeptId('ALL');
                setSelectedProgId('ALL');
              }}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All 12 Institutes</option>
              {institutes.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedProgId('ALL');
              }}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Program</label>
            <select
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Request Type</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Request Types</option>
              <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate</option>
              <option value="TRANSCRIPT_DEGREE">Transcript & Degree</option>
              <option value="MIGRATION_CERTIFICATE">Migration Certificate</option>
              <option value="PROGRAM_CHANGE">Program Change</option>
              <option value="FEE_CONCESSION">Fee Concession / Scholarship</option>
              <option value="RESEARCH_GRANT">Faculty Research Grant</option>
              <option value="RE_EVALUATION">Re-evaluation Request</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="RETURNED_FOR_CORRECTION">RETURNED_FOR_CORRECTION</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Search</label>
            <div style={{ position: 'relative', marginTop: '2px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="ID, Student, Emp ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.6rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. MAIN REQUEST DATA TABLE
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Academic Request Ledger ({requests.length} Records)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Detailed petition pipeline with full approval stage indicators and audit actions.
            </p>
          </div>
          <Badge variant="navy">{requests.length} Filtered Results</Badge>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px' }}>
            <AlertCircle size={40} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>No Academic Requests Found</h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '400px', margin: '0.35rem auto 0 auto' }}>
              No requests matched the selected filters. Try clearing your search or switching the institute/department selector.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Request ID</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Date</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Applicant</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute & Dept</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Category</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Subject / Title</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Priority</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Current Stage</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>SLA</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    
                    {/* Request ID */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <code style={{ color: '#F37023', fontWeight: 700 }}>{req.requestNo}</code>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap' }}>
                      {req.submittedDate}
                    </td>

                    {/* Applicant */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ fontWeight: 800, color: '#0B192C' }}>{req.applicantName}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B', fontFamily: 'monospace' }}>
                        {req.applicantEnrollmentOrEmpId} • {req.applicantRole}
                      </div>
                    </td>

                    {/* Institute & Dept */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#0B192C' }}>{req.departmentName}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{req.instituteName}</div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="navy">{req.categoryDisplayName}</Badge>
                    </td>

                    {/* Subject */}
                    <td style={{ padding: '0.65rem 0.8rem', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 600, color: '#0B192C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.subject}>
                        {req.subject}
                      </div>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={req.priority === 'CRITICAL' || req.priority === 'HIGH' ? 'danger' : (req.priority === 'MEDIUM' ? 'warning' : 'active')}>
                        {req.priority}
                      </Badge>
                    </td>

                    {/* Current Stage */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>
                        {req.currentApprovalStage}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={req.status === 'APPROVED' ? 'active' : (req.status === 'PENDING' ? 'warning' : (req.status === 'REJECTED' ? 'danger' : 'purple'))}>
                        {req.status}
                      </Badge>
                    </td>

                    {/* SLA / Overdue */}
                    <td style={{ padding: '0.65rem 0.8rem', whiteSpace: 'nowrap' }}>
                      {req.isOverdue ? (
                        <Badge variant="danger">{req.overdueDays}d Overdue</Badge>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>Within SLA</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => setSelectedRequestForDetail(req)}
                          title="View Full Request Dossier"
                        >
                          View
                        </button>
                        {req.status === 'PENDING' && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => {
                              setSelectedRequestForAction(req);
                              setActionType('APPROVE');
                            }}
                          >
                            Action
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          6. REQUEST DETAIL MODAL / DRAWER (SECTIONS A - F)
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedRequestForDetail && (
        <Modal
          isOpen={Boolean(selectedRequestForDetail)}
          onClose={() => setSelectedRequestForDetail(null)}
          title={`Academic Request Dossier: ${selectedRequestForDetail.requestNo}`}
          maxWidth="1000px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
            
            {/* Header Identity */}
            <div style={{ background: '#0B192C', color: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedRequestForDetail.subject}</div>
                <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                  Category: <strong>{selectedRequestForDetail.categoryDisplayName}</strong> | Submitted: <strong>{selectedRequestForDetail.submittedDate}</strong>
                </div>
              </div>
              <Badge variant={selectedRequestForDetail.status === 'APPROVED' ? 'active' : 'warning'}>
                {selectedRequestForDetail.status}
              </Badge>
            </div>

            {/* Section A & B: Request Information & Applicant Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              
              {/* Applicant Card */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
                  Applicant Profile
                </h4>
                <div style={{ fontSize: '0.8125rem', lineHeight: '1.6' }}>
                  <div>Name: <strong>{selectedRequestForDetail.applicantName}</strong></div>
                  <div>Enrollment / Emp ID: <strong style={{ fontFamily: 'monospace' }}>{selectedRequestForDetail.applicantEnrollmentOrEmpId}</strong></div>
                  <div>Role: <Badge variant="navy">{selectedRequestForDetail.applicantRole}</Badge></div>
                  <div>Institute: <strong>{selectedRequestForDetail.instituteName}</strong></div>
                  <div>Department: <strong>{selectedRequestForDetail.departmentName}</strong></div>
                  <div>Email: <strong>{selectedRequestForDetail.applicantEmail}</strong></div>
                  <div>Phone: <strong>{selectedRequestForDetail.applicantPhone}</strong></div>
                </div>
              </div>

              {/* Request Metadata */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
                  Request Parameters & SLA
                </h4>
                <div style={{ fontSize: '0.8125rem', lineHeight: '1.6' }}>
                  <div>Request ID: <strong style={{ color: '#F37023', fontFamily: 'monospace' }}>{selectedRequestForDetail.requestNo}</strong></div>
                  <div>Priority: <Badge variant={selectedRequestForDetail.priority === 'CRITICAL' ? 'danger' : 'warning'}>{selectedRequestForDetail.priority}</Badge></div>
                  <div>Current Stage: <strong>{selectedRequestForDetail.currentApprovalStage}</strong></div>
                  <div>Assigned Office: <strong>{selectedRequestForDetail.assignedTo}</strong></div>
                  <div>SLA Deadline: <strong>{selectedRequestForDetail.deadlineDate}</strong></div>
                  <div>Overdue Status: {selectedRequestForDetail.isOverdue ? <strong style={{ color: '#EF4444' }}>Yes ({selectedRequestForDetail.overdueDays} Days Overdue)</strong> : <strong style={{ color: '#10B981' }}>Within Target SLA</strong>}</div>
                </div>
              </div>
            </div>

            {/* Section C: Description & Justification */}
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
                Petition Statement & Reason
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: '1.5', background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {selectedRequestForDetail.description}
              </p>
            </div>

            {/* Section D: Step-by-Step Approval Workflow Chain */}
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
                Approval Workflow & Institutional Authorization Chain
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedRequestForDetail.stages.map((st, idx) => {
                  const isDone = st.status === 'APPROVED';
                  const isPending = st.status === 'PENDING';
                  return (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.8rem',
                        background: isDone ? 'rgba(16,185,129,0.06)' : (isPending ? 'rgba(245,158,11,0.06)' : '#F8FAFC'),
                        borderRadius: '6px',
                        borderLeft: `4px solid ${isDone ? '#10B981' : (isPending ? '#F59E0B' : '#CBD5E1')}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: isDone ? '#10B981' : (isPending ? '#F59E0B' : '#94A3B8') }}>
                          {isDone ? '✓' : (isPending ? '●' : '○')}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0B192C', fontSize: '0.8125rem' }}>Stage {idx + 1}: {st.stageName}</div>
                          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Role: {st.requiredRole} • Office: {st.requiredOffice}</div>
                        </div>
                      </div>
                      <Badge variant={isDone ? 'active' : (isPending ? 'warning' : 'navy')}>
                        {st.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section E: Attached Documents */}
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
                Attached Supporting Documents ({selectedRequestForDetail.attachments.length})
              </h4>
              {selectedRequestForDetail.attachments.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>No digital files attached to this petition.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedRequestForDetail.attachments.map(att => (
                    <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#F8FAFC', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={15} color="#F37023" />
                        <strong>{att.fileName}</strong> <span style={{ color: '#64748B' }}>({att.fileSize})</span>
                      </div>
                      <button className="btn btn-secondary btn-xs" onClick={() => alert(`Downloading verified document: ${att.fileName}`)}>
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section F: Audit Trail */}
            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
                Immutable Audit History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {selectedRequestForDetail.remarksHistory.map(rem => (
                  <div key={rem.id} style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', background: '#F8FAFC', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span><strong>{rem.actionByUserName}</strong> ({rem.actionByUserRole})</span>
                      <span>{rem.timestamp}</span>
                    </div>
                    <div style={{ color: '#0B192C', marginTop: '2px', fontWeight: 600 }}>{rem.remarks}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRequestForDetail(null)}>
                Close
              </button>
              {selectedRequestForDetail.status === 'PENDING' && (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => {
                    setSelectedRequestForAction(selectedRequestForDetail);
                    setSelectedRequestForDetail(null);
                  }}
                >
                  Action Petition →
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. REGISTRAR ACTION MODAL (APPROVE / REJECT / RETURN FOR CORRECTION)
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedRequestForAction && (
        <Modal
          isOpen={Boolean(selectedRequestForAction)}
          onClose={() => setSelectedRequestForAction(null)}
          title={`Review & Action Petition: ${selectedRequestForAction.requestNo}`}
          maxWidth="640px"
        >
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
              <div>Applicant: <strong>{selectedRequestForAction.applicantName}</strong> ({selectedRequestForAction.applicantEnrollmentOrEmpId})</div>
              <div>Subject: <strong>{selectedRequestForAction.subject}</strong></div>
              <div>Institute: <strong>{selectedRequestForAction.instituteName}</strong> • Department: <strong>{selectedRequestForAction.departmentName}</strong></div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Select Administrative Action</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setActionType('APPROVE')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: actionType === 'APPROVE' ? '#10B981' : '#FFFFFF',
                    color: actionType === 'APPROVE' ? '#FFFFFF' : '#0B192C',
                    border: '1px solid #10B981'
                  }}
                >
                  ✓ Approve Request
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('RETURN')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: actionType === 'RETURN' ? '#F59E0B' : '#FFFFFF',
                    color: actionType === 'RETURN' ? '#FFFFFF' : '#0B192C',
                    border: '1px solid #F59E0B'
                  }}
                >
                  ↩ Return for Info
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('REJECT')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: actionType === 'REJECT' ? '#EF4444' : '#FFFFFF',
                    color: actionType === 'REJECT' ? '#FFFFFF' : '#0B192C',
                    border: '1px solid #EF4444'
                  }}
                >
                  ✕ Reject Request
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>
                {actionType === 'APPROVE' ? 'Official Approval Remarks (Optional)' : (actionType === 'REJECT' ? 'Mandatory Reason for Rejection *' : 'Mandatory Clarification Remarks *')}
              </label>
              <textarea
                required={actionType !== 'APPROVE'}
                placeholder={actionType === 'APPROVE' ? 'e.g. Verified eligibility and authorized under statutory powers.' : 'Enter detailed justification for this action...'}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedRequestForAction(null)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSubmittingAction}
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          8. PRINTABLE OFFICIAL REPORT MODAL (SSIU ERP LETTERHEAD)
      ══════════════════════════════════════════════════════════════════════ */}
      {showPrintReportModal && (
        <Modal
          isOpen={showPrintReportModal}
          onClose={() => setShowPrintReportModal(false)}
          title="Official Academic Requests Governance Report"
          maxWidth="900px"
        >
          <div style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Print or save as official PDF</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Now
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintReportModal(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ border: '2px solid #0B192C', padding: '1.5rem', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #F37023', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0B192C', textTransform: 'uppercase' }}>SWARRNIM STARTUP & INNOVATION UNIVERSITY</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>OFFICE OF THE REGISTRAR • ACADEMIC GOVERNANCE DIVISION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F37023', marginTop: '0.35rem' }}>ACADEMIC REQUESTS AUDIT & STATUS REPORT</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', background: '#F8FAFC', padding: '0.6rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                <div>Total: <strong>{summaryKPIs.totalRequests}</strong></div>
                <div>Pending: <strong style={{ color: '#F59E0B' }}>{summaryKPIs.pending}</strong></div>
                <div>Approved: <strong style={{ color: '#10B981' }}>{summaryKPIs.approved}</strong></div>
                <div>Overdue: <strong style={{ color: '#DC2626' }}>{summaryKPIs.overdue}</strong></div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', textAlign: 'left', background: '#F1F5F9' }}>
                    <th style={{ padding: '4px 6px' }}>Request ID</th>
                    <th style={{ padding: '4px 6px' }}>Applicant</th>
                    <th style={{ padding: '4px 6px' }}>Institute & Dept</th>
                    <th style={{ padding: '4px 6px' }}>Category</th>
                    <th style={{ padding: '4px 6px' }}>Status</th>
                    <th style={{ padding: '4px 6px' }}>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{r.requestNo}</td>
                      <td style={{ padding: '4px 6px' }}>{r.applicantName}</td>
                      <td style={{ padding: '4px 6px' }}>{r.departmentName}</td>
                      <td style={{ padding: '4px 6px' }}>{r.categoryDisplayName}</td>
                      <td style={{ padding: '4px 6px' }}>{r.status}</td>
                      <td style={{ padding: '4px 6px' }}>{r.currentApprovalStage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#0B192C' }}>
                <div>Generated By: <strong>Office of the Registrar</strong></div>
                <div>Official Seal: <strong>Registrar & Custodian of Records</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
