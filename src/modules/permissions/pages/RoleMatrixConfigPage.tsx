/**
 * SSIU ERP — Role & Permission Matrix Configuration Main Page
 * File: src/modules/permissions/pages/RoleMatrixConfigPage.tsx
 */

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Lock, History, UserCheck, AlertCircle } from 'lucide-react';
import { rbacMatrixGovernanceService } from '../services/rbacMatrixGovernanceService';
import { RoleMatrixGrid } from '../components/RoleMatrixGrid';
import { Badge } from '../../../components/common/Badge';

export const RoleMatrixConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'SCOPES' | 'AUDIT'>('MATRIX');

  const matrix = useMemo(() => rbacMatrixGovernanceService.getRoleMatrixConfigurations(), []);
  const customScopes = useMemo(() => rbacMatrixGovernanceService.getUserCustomScopes(), []);
  const auditLogs = useMemo(() => rbacMatrixGovernanceService.getPermissionAuditLogs(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <ShieldCheck size={24} color="var(--brand-orange)" /> Roles &amp; Permission (RBAC) Governance Center
          </h2>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
            Granular Module Action Matrix, Dynamic Custom Scope Allocation &amp; Security Audit Trail
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'MATRIX' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('MATRIX')}
          >
            <Lock size={16} /> Role Matrix
          </button>
          <button 
            className={`btn ${activeTab === 'SCOPES' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('SCOPES')}
          >
            <UserCheck size={16} /> Custom User Scopes
          </button>
          <button 
            className={`btn ${activeTab === 'AUDIT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('AUDIT')}
          >
            <History size={16} /> Permission Audit Logs
          </button>
        </div>
      </div>

      {/* TAB 1: ROLE MATRIX */}
      {activeTab === 'MATRIX' && <RoleMatrixGrid matrix={matrix} />}

      {/* TAB 2: CUSTOM SCOPES */}
      {activeTab === 'SCOPES' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Active Cross-Campus &amp; Custom Department User Scopes
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)' }}>
                  <th>User / Name</th>
                  <th>Primary Role</th>
                  <th>Allowed Institutes</th>
                  <th>Allowed Departments</th>
                  <th>Cross-Campus Access</th>
                  <th>Granted By</th>
                </tr>
              </thead>
              <tbody>
                {customScopes.map(scope => (
                  <tr key={scope.userId}>
                    <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{scope.userName}</td>
                    <td><Badge variant="navy">{scope.role}</Badge></td>
                    <td>{scope.allowedInstitutes.join(', ')}</td>
                    <td>{scope.allowedDepartments.join(', ')}</td>
                    <td>
                      <Badge variant={scope.isCrossCampusAuthorized ? 'success' : 'inactive'}>
                        {scope.isCrossCampusAuthorized ? 'Authorized Multi-Campus' : 'Restricted Single Institute'}
                      </Badge>
                    </td>
                    <td>{scope.grantedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Permission &amp; Scope Modification Audit Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.map(log => (
              <div key={log.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'var(--bg-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{log.actorName} ({log.actorUserId})</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                  <strong>Action:</strong> <Badge variant="warning">{log.actionType}</Badge> on target <code>{log.targetRoleOrUser}</code>: {log.details}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#FFFFFF', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  Diff: <span style={{ color: '#EF4444' }}>Before: {log.beforeState}</span> ➔ <span style={{ color: '#10B981' }}>After: {log.afterState}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
