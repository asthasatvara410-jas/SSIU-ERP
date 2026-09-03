/**
 * SSIU ERP — Student Cohort & Governance Metrics Card Component
 * File: src/modules/students/components/StudentCohortMetricsCard.tsx
 */

import React from 'react';
import { Users, UserCheck, ShieldCheck, PieChart, GraduationCap, Building2 } from 'lucide-react';
import { StudentGovernanceMetricsDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface StudentCohortMetricsCardProps {
  metrics: StudentGovernanceMetricsDTO;
}

export const StudentCohortMetricsCard: React.FC<StudentCohortMetricsCardProps> = ({ metrics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Row */}
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Enrolled Students</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalStudents.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{metrics.activeStudents} Active in Cohorts</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ABC ID Compliance Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.abcIdCompliancePercentage}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.abcIdVerifiedCount} DigiLocker Seeded</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(235, 94, 40, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Admissions Pipeline</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.onboardingPipelineCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Under Verification</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <PieChart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gender Ratio (M / F)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.genderRatio.male} : {metrics.genderRatio.female}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inclusive Campus</div>
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={18} color="var(--brand-orange)" /> Department-Wise Student Enrollment &amp; ABC Seeding Breakdown
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Department</th>
                <th>Constituent Institute</th>
                <th>Total Enrolled</th>
                <th>Active</th>
                <th>ABC ID Compliance</th>
                <th>Promotion Ready</th>
              </tr>
            </thead>
            <tbody>
              {metrics.departmentBreakdown.map(dept => (
                <tr key={dept.departmentId}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{dept.departmentName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{dept.instituteName}</td>
                  <td style={{ fontWeight: 600 }}>{dept.totalStudents}</td>
                  <td><Badge variant="success">{dept.activeStudents} Active</Badge></td>
                  <td>
                    <Badge variant={dept.abcCompliancePercentage >= 80 ? 'success' : 'warning'}>
                      {dept.abcCompliancePercentage}% Seeded
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 600, color: '#10B981' }}>{dept.eligibleForPromotionCount} Students</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
