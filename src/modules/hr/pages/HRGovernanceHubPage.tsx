/**
 * SSIU ERP — HR Management Hub Page
 * File: src/modules/hr/pages/HRGovernanceHubPage.tsx
 */

import React, { useState } from 'react';
import { Briefcase, Calendar, CheckSquare, BarChart3, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { hrGovernanceService } from '../services/hrGovernanceService';
import { EmployeeLifecycleCards } from '../components/EmployeeLifecycleCards';
import { LeaveWorkforceDesk } from '../components/LeaveWorkforceDesk';
import { Badge } from '../../../components/common/Badge';

export const HRGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WORKFORCE' | 'LEAVE' | 'PAYROLL_READINESS'>('WORKFORCE');

  const metrics = hrGovernanceService.getHRWorkforceMetrics();
  const leaveBalances = hrGovernanceService.getEmployeeLeaveBalances();
  const payrollChecklist = hrGovernanceService.getPayrollReadinessChecklist();

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Human Capital &amp; Staff Operations
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={28} color="var(--brand-orange)" /> HR Management Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Workforce Allocation, Leave Utilization Heatmaps &amp; Institutional Payroll-Readiness Audits.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-light)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('WORKFORCE')}
            className={`btn ${activeTab === 'WORKFORCE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={14} /> Workforce Overview
          </button>

          <button
            onClick={() => setActiveTab('LEAVE')}
            className={`btn ${activeTab === 'LEAVE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calendar size={14} /> Leave Analytics
          </button>

          <button
            onClick={() => setActiveTab('PAYROLL_READINESS')}
            className={`btn ${activeTab === 'PAYROLL_READINESS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckSquare size={14} /> Payroll Readiness
          </button>
        </div>
      </div>

      {/* Tab 1: Workforce Overview */}
      {activeTab === 'WORKFORCE' && (
        <EmployeeLifecycleCards metrics={metrics} />
      )}

      {/* Tab 2: Leave Analytics */}
      {activeTab === 'LEAVE' && (
        <LeaveWorkforceDesk leaveBalances={leaveBalances} />
      )}

      {/* Tab 3: Payroll Readiness */}
      {activeTab === 'PAYROLL_READINESS' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={18} color="var(--brand-orange)" /> Monthly Payroll-Readiness Pre-Flight Audit
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Validates attendance normalization, bank disbursement details, and statutory PF/ESIC configurations.
              </p>
            </div>
            <Badge variant="navy">Read-Only Audit Mode</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)' }}>
                  <th>Department</th>
                  <th>Eligible Staff</th>
                  <th>Attendance Verified</th>
                  <th>Bank Details Verified</th>
                  <th>Statutory Deductions</th>
                  <th>Readiness Score</th>
                  <th>Disbursement Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollChecklist.map(pc => (
                  <tr key={pc.departmentId}>
                    <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{pc.departmentName}</td>
                    <td style={{ fontWeight: 600 }}>{pc.totalEligibleStaff} Staff</td>
                    <td>{pc.attendanceVerifiedCount} / {pc.totalEligibleStaff}</td>
                    <td>{pc.bankDetailsVerifiedCount} / {pc.totalEligibleStaff}</td>
                    <td>
                      <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Configured
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: `${pc.payrollReadinessScore}%`, height: '100%', background: pc.payrollReadinessScore >= 95 ? '#10B981' : '#F59E0B' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{pc.payrollReadinessScore}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={pc.readinessStatus === 'READY' ? 'success' : pc.readinessStatus === 'ACTION_REQUIRED' ? 'warning' : 'danger'}>
                        {pc.readinessStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
