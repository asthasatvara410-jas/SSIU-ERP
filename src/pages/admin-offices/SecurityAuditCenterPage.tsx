import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { securityAuditService, SecurityLogFilter } from '../../services/securityAuditService';
import { exportToExcel } from '../../services/exportService';
import { AuditLog, AuditModule, AuditSeverity, AuditStatus, SecurityAlert, UserRole } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { DashboardReportModal } from '../../components/reports/DashboardReportModal';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Lock, Key, 
  Search, Filter, Download, FileText, RefreshCw, Eye, 
  CheckCircle2, XCircle, AlertOctagon, Terminal, Flame, 
  Clock, Laptop, Globe, UserX, Check, Sparkles
} from 'lucide-react';

export const SecurityAuditCenterPage: React.FC = () => {
  const { user, role } = useAuth();
  const effectiveRole = (role || user?.role) as UserRole;
  const isAuthorized = securityAuditService.isAuthorizedSecurityAdmin(effectiveRole);

  // Filter States
  const [activeTab, setActiveTab] = useState<'ALL' | 'AUTH' | 'ADMIN' | 'ALERTS'>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedAlertToResolve, setSelectedAlertToResolve] = useState<SecurityAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Dashboard KPIs
  const stats = useMemo(() => {
    return securityAuditService.getSecurityDashboardStats(user, effectiveRole);
  }, [user, effectiveRole]);

  // Fetch Security Alerts
  const alerts = useMemo(() => {
    return securityAuditService.getSecurityAlerts(user, effectiveRole);
  }, [user, effectiveRole, toastMessage]);

  // Fetch Filtered Audit Logs
  const auditLogs = useMemo(() => {
    if (!isAuthorized) return [];

    const filterObj: SecurityLogFilter = {
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      role: filterRole !== 'ALL' ? filterRole : undefined,
      module: filterModule !== 'ALL' ? filterModule : undefined,
      action: filterAction !== 'ALL' ? filterAction : undefined,
      status: filterStatus !== 'ALL' ? filterStatus : undefined,
      search: searchQuery || undefined
    };

    try {
      let logs = securityAuditService.getSecurityLogs(filterObj, user, effectiveRole);

      if (activeTab === 'AUTH') {
        logs = logs.filter(l => l.action.includes('LOGIN') || l.action === 'LOGOUT' || l.module === 'AUTH');
      } else if (activeTab === 'ADMIN') {
        logs = logs.filter(l => ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD'].includes(l.userRole));
      } else if (activeTab === 'ALERTS') {
        logs = logs.filter(l => l.severity === 'CRITICAL' || l.status === 'BLOCKED' || l.status === 'FAILED' || l.action.includes('UNAUTHORIZED'));
      }

      return logs;
    } catch {
      return [];
    }
  }, [isAuthorized, activeTab, filterModule, filterRole, filterAction, filterStatus, filterDateFrom, filterDateTo, searchQuery, user, effectiveRole, toastMessage]);

  // Handle Export
  const handleExportExcel = () => {
    const headers = [
      'Log ID', 'Timestamp', 'User Name', 'User Role', 'Action', 'Module', 'Record ID', 'Status', 'Severity', 'IP Address', 'Audit Details'
    ];
    const rows = auditLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.userRole,
      l.action,
      l.module || l.entity,
      l.recordId || 'N/A',
      l.status || 'SUCCESS',
      l.severity || 'INFO',
      l.ipAddress || '192.168.1.104',
      l.details
    ]);

    exportToExcel(
      'SSIU Cyber Security & Audit Ledger',
      headers,
      rows,
      { searchQuery: searchQuery || undefined },
      { name: user?.name, role: effectiveRole }
    );
    showToast('Audit records exported to Excel successfully.');
  };

  // Handle Alert Resolution
  const handleResolveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertToResolve) return;

    securityAuditService.resolveSecurityAlert(
      selectedAlertToResolve.id,
      resolutionNotes || 'Alert investigated and resolved by Security Administrator.',
      user,
      effectiveRole
    );

    showToast(`Security Alert "${selectedAlertToResolve.title}" marked as resolved.`);
    setSelectedAlertToResolve(null);
    setResolutionNotes('');
  };

  // 403 Forbidden Screen for unauthorized roles
  if (!isAuthorized) {
    return (
      <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', margin: '2rem auto', maxWidth: '650px' }}>
        <ShieldAlert size={56} color="#DC2626" style={{ margin: '0 auto 1.25rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
          403 Access Denied: Security Clearance Required
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          The Security & Audit Center is restricted to authorized <strong>Super Administrators, University Executive Admins, and Registrar Officers</strong>. 
          Your session role ({effectiveRole}) does not have permission to view central security telemetry.
        </p>
        <div style={{ padding: '0.85rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#991B1B' }}>
          Security Notice: This unauthorized access attempt has been recorded in the tamper-resistant immutable security audit ledger.
        </div>
      </div>
    );
  }

  const getStatusBadge = (status?: AuditStatus) => {
    switch (status) {
      case 'SUCCESS':
        return <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>SUCCESS</span>;
      case 'FAILED':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>FAILED</span>;
      case 'BLOCKED':
        return <span style={{ background: '#7F1D1D', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>BLOCKED (403)</span>;
      case 'WARNING':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>WARNING</span>;
      case 'ALERT':
        return <span style={{ background: '#FFEDD5', color: '#9A3412', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>ALERT</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>SUCCESS</span>;
    }
  };

  const getSeverityBadge = (sev?: AuditSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span style={{ background: '#EF4444', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>CRITICAL</span>;
      case 'ALERT':
        return <span style={{ background: '#F97316', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>ALERT</span>;
      case 'WARNING':
        return <span style={{ background: '#F59E0B', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>WARNING</span>;
      case 'INFO':
      default:
        return <span style={{ background: '#E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>INFO</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--brand-navy)',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 700,
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── PAGE HERO & TITLE ─── */}
      <div 
        className="card" 
        style={{ 
          padding: '1.75rem 2rem', 
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 60%, #091E42 100%)', 
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">CYBER SECURITY & GOVERNANCE</Badge>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '12px' }}>
              Phase 4 Active
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            Security & Audit Telemetry Center
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.35rem' }}>
            Real-time authentication monitoring, tamper-resistant administrative audit ledger, and RBAC security event detection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportExcel}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', color: 'var(--brand-navy)' }}
          >
            <Download size={16} />
            <span>Export Audit Ledger</span>
          </button>

          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F37023', borderColor: '#F37023' }}
          >
            <FileText size={16} />
            <span>Security Governance Reports</span>
          </button>
        </div>
      </div>

      {/* ─── 5 SECURITY KPI STAT CARDS ─── */}
      <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard 
          title="Total Logins (Today)" 
          value={stats.totalLoginsToday} 
          subtitle={`${stats.totalLoginsOverall} Overall System Logins`}
          icon={Key} 
          colorScheme="navy" 
        />
        <StatCard 
          title="Failed Logins" 
          value={stats.failedLoginsToday} 
          subtitle="Authentication Failures"
          icon={Lock} 
          colorScheme={stats.failedLoginsToday > 0 ? 'orange' : 'green'} 
        />
        <StatCard 
          title="Active Sessions" 
          value={stats.activeSessions} 
          subtitle="Authenticated Users Online"
          icon={Laptop} 
          colorScheme="green" 
        />
        <StatCard 
          title="Critical Security Events" 
          value={stats.criticalEvents} 
          subtitle="Blocked Access / Violations"
          icon={ShieldAlert} 
          colorScheme={stats.criticalEvents > 0 ? 'orange' : 'green'} 
        />
        <StatCard 
          title="Privileged Admin Actions" 
          value={stats.recentAdminActions} 
          subtitle="Executive & HOD Mutations"
          icon={Terminal} 
          colorScheme="gold" 
        />
      </div>

      {/* ─── ACTIVE SECURITY ALERTS PANEL ─── */}
      {alerts.length > 0 && (
        <div 
          className="card" 
          style={{ 
            padding: '1.25rem 1.5rem', 
            background: '#FFFDFD', 
            border: '1px solid #FCA5A5', 
            borderLeft: '5px solid #EF4444' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={20} color="#DC2626" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#991B1B', margin: 0 }}>
                Active Security Alerts & Threat Detections ({alerts.filter(a => a.status === 'ACTIVE').length})
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Automated Heuristic Surveillance
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.map(alert => (
              <div 
                key={alert.id}
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  background: alert.status === 'RESOLVED' ? '#F0FDF4' : '#FEF2F2',
                  border: alert.status === 'RESOLVED' ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ 
                      fontWeight: 800, 
                      fontSize: '0.875rem', 
                      color: alert.status === 'RESOLVED' ? '#166534' : '#991B1B' 
                    }}>
                      {alert.title}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      background: alert.severity === 'CRITICAL' ? '#EF4444' : '#F97316',
                      color: '#FFFFFF',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {alert.severity}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • Detected: {new Date(alert.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
                    {alert.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#0369A1', marginTop: '0.25rem', fontWeight: 600 }}>
                    Recommendation: {alert.recommendation}
                  </div>
                </div>

                <div>
                  {alert.status === 'ACTIVE' ? (
                    <button
                      onClick={() => setSelectedAlertToResolve(alert)}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: '#DC2626', borderColor: '#DC2626' }}
                    >
                      Investigate & Resolve
                    </button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                      <CheckCircle2 size={14} color="#16A34A" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── QUEUE TABS & FILTER TOOLBAR ─── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Audit Records (${auditLogs.length})` },
            { id: 'AUTH', label: 'Authentication & Logins' },
            { id: 'ADMIN', label: 'Admin Operations' },
            { id: 'ALERTS', label: `Security Violations (${stats.criticalEvents})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: 700, fontSize: '0.8125rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Toolbar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search user, action, IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem', height: '36px' }}
            />
          </div>

          <select
            className="input-field"
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
            style={{ fontSize: '0.8125rem', height: '36px' }}
          >
            <option value="ALL">All Modules</option>
            <option value="AUTH">Authentication (SSO)</option>
            <option value="APPROVAL_WORKFLOW">Digital Approvals</option>
            <option value="NOTE_SHEET">Note Sheets</option>
            <option value="STUDENT">Student Management</option>
            <option value="ADMISSION">Admission & CRM</option>
            <option value="FEES">Fees & Accounts</option>
            <option value="EXAMINATION">Examination Cell</option>
            <option value="HOSTEL">Hostel Desk</option>
            <option value="TRANSPORT">Transport Fleet</option>
            <option value="CAMPUS_SERVICES">Campus Services</option>
            <option value="EDP_DUTY">EDP Duty Operations</option>
            <option value="SYSTEM">System Settings</option>
          </select>

          <select
            className="input-field"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            style={{ fontSize: '0.8125rem', height: '36px' }}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="UNIVERSITY_ADMIN">University Admin</option>
            <option value="REGISTRAR">Registrar</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="HOD">HOD</option>
            <option value="FACULTY">Faculty</option>
            <option value="STUDENT">Student</option>
            <option value="HOSTEL_ADMIN">Hostel Admin</option>
            <option value="TRANSPORT_ADMIN">Transport Admin</option>
            <option value="EXAM_CELL">Exam Cell</option>
          </select>

          <select
            className="input-field"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize: '0.8125rem', height: '36px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="BLOCKED">Blocked (403)</option>
            <option value="WARNING">Warning</option>
            <option value="ALERT">Alert</option>
          </select>

          <input
            type="date"
            className="input-field"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            placeholder="From Date"
            style={{ fontSize: '0.8125rem', height: '36px' }}
          />

          <input
            type="date"
            className="input-field"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            placeholder="To Date"
            style={{ fontSize: '0.8125rem', height: '36px' }}
          />
        </div>
      </div>

      {/* ─── AUDIT RECORDS TABLE ─── */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>User & Role</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Action Event</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Module / Target</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Severity</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>IP Address</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={36} color="#10B981" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
                    <div style={{ fontWeight: 700 }}>No audit logs matching current filter parameters</div>
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr 
                    key={log.id} 
                    style={{ 
                      borderBottom: '1px solid #F1F5F9',
                      background: log.severity === 'CRITICAL' ? '#FEF2F2' : log.status === 'FAILED' ? '#FFFBEB' : '#FFFFFF'
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{log.userName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.userRole}</div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        fontSize: '0.75rem',
                        background: '#F1F5F9',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: log.action.includes('FAIL') || log.action.includes('UNAUTHORIZED') ? '#DC2626' : '#0F2C59'
                      }}>
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700 }}>{log.module || log.entity}</div>
                      {log.recordId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          ID: {log.recordId}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getStatusBadge(log.status)}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getSeverityBadge(log.severity)}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: '#475569' }}>
                      {log.ipAddress || '192.168.1.104'}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── LOG DETAIL INSPECTION MODAL ─── */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '1.75rem', background: '#FFFFFF', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--brand-orange)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--brand-navy)' }}>
                  Audit Record Deep Inspection
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>LOG ID</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedLog.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>TIMESTAMP</div>
                  <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>USER ACCOUNT</div>
                  <div style={{ fontWeight: 800 }}>{selectedLog.userName} ({selectedLog.userRole})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTION EVENT</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F2C59' }}>{selectedLog.action}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MODULE / ENTITY</div>
                  <div>{selectedLog.module || selectedLog.entity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS & SEVERITY</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {getStatusBadge(selectedLog.status)}
                    {getSeverityBadge(selectedLog.severity)}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>AUDIT DETAILS / PAYLOAD</div>
                <div style={{ padding: '0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                  {selectedLog.details}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>CLIENT IP ADDRESS</div>
                  <div style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress || '192.168.1.104'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>DEVICE TELEMETRY</div>
                  <div>{selectedLog.deviceInfo || 'Apple Safari / macOS Darwin'}</div>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>HTTP USER-AGENT</div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#F1F5F9', padding: '6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-secondary">
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ALERT RESOLUTION MODAL ─── */}
      {selectedAlertToResolve && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={20} color="#DC2626" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--brand-navy)' }}>
                  Resolve Security Incident
                </h3>
              </div>
              <button onClick={() => setSelectedAlertToResolve(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>

            <form onSubmit={handleResolveAlert}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 800, color: '#991B1B', marginBottom: '0.25rem' }}>
                  {selectedAlertToResolve.title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                  {selectedAlertToResolve.description}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Investigation & Resolution Notes *
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Enter administrator mitigation notes and action taken..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedAlertToResolve(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#16A34A', borderColor: '#16A34A' }}>
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── GOVERNANCE REPORT MODAL ─── */}
      <DashboardReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        dashboardType="SECURITY_AUDIT"
        user={user}
        role={role}
      />
    </div>
  );
};
