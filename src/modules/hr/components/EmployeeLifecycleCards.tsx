/**
 * SSIU ERP — HR Workforce & Employee Lifecycle Cards Component
 * File: src/modules/hr/components/EmployeeLifecycleCards.tsx
 */

import React from 'react';
import { Users, UserCheck, Clock, Building2, UserPlus, LogOut, Briefcase } from 'lucide-react';
import { HRWorkforceMetricsDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface EmployeeLifecycleCardsProps {
  metrics: HRWorkforceMetricsDTO;
}

export const EmployeeLifecycleCards: React.FC<EmployeeLifecycleCardsProps> = ({ metrics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(30, 62, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Institutional Staff</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalEmployees}</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{metrics.activeEmployees} Active on Duty</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(235, 94, 40, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Teaching vs Non-Teaching</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.facultyCount} : {metrics.nonTeachingCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balanced Workforce</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>New Joiners This Month</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>+{metrics.monthlyNewJoiners}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Onboarding Complete</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leave Utilization Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.leaveUtilizationPercentage}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Within Campus Threshold</div>
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={18} color="var(--brand-orange)" /> Department-Wise Workforce &amp; Staff Headcount
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Department</th>
                <th>Institute</th>
                <th>Academic Faculty</th>
                <th>Support Staff</th>
                <th>Total Strength</th>
                <th>Currently on Leave</th>
                <th>Operations Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.departmentWorkforce.map(dw => (
                <tr key={dw.departmentId}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{dw.departmentName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{dw.instituteName}</td>
                  <td style={{ fontWeight: 600 }}>{dw.facultyCount} Faculty</td>
                  <td>{dw.staffCount} Staff</td>
                  <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{dw.totalHeadcount} Members</td>
                  <td>
                    {dw.activeOnLeave > 0 ? (
                      <Badge variant="warning">{dw.activeOnLeave} on Leave</Badge>
                    ) : (
                      <Badge variant="success">All Present</Badge>
                    )}
                  </td>
                  <td>
                    <Badge variant={dw.facultyCount > 0 ? 'success' : 'navy'}>Operational</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
