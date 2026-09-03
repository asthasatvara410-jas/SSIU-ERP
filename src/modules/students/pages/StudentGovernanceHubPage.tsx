/**
 * SSIU ERP — Student Management Hub Page
 * File: src/modules/students/pages/StudentGovernanceHubPage.tsx
 */

import React, { useState } from 'react';
import { Users, GraduationCap, FileCheck2, ArrowUpRight, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { studentGovernanceService } from '../services/studentGovernanceService';
import { StudentCohortMetricsCard } from '../components/StudentCohortMetricsCard';
import { AbcIdVerificationDesk } from '../components/AbcIdVerificationDesk';
import { Badge } from '../../../components/common/Badge';

export const StudentGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROMOTION_DESK' | 'ABC_VERIFICATION'>('OVERVIEW');

  const metrics = studentGovernanceService.getStudentGovernanceMetrics();
  const promotionPreviews = studentGovernanceService.getBatchPromotionPreviews();
  const abcComplianceList = studentGovernanceService.getStudentAbcComplianceList();

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Operations &amp; Student Lifecycle
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="var(--brand-orange)" /> Student Management Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Multi-Campus Student Demographics, Progression Eligibility &amp; National Academic Depository (ABC ID) Verification.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-light)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={14} /> Cohort Overview
          </button>

          <button
            onClick={() => setActiveTab('PROMOTION_DESK')}
            className={`btn ${activeTab === 'PROMOTION_DESK' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <GraduationCap size={14} /> Promotion Desk (Preview)
          </button>

          <button
            onClick={() => setActiveTab('ABC_VERIFICATION')}
            className={`btn ${activeTab === 'ABC_VERIFICATION' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileCheck2 size={14} /> ABC ID Verification
          </button>
        </div>
      </div>

      {/* Tab 1: Cohort Overview */}
      {activeTab === 'OVERVIEW' && (
        <StudentCohortMetricsCard metrics={metrics} />
      )}

      {/* Tab 2: Batch & Semester Promotion Desk */}
      {activeTab === 'PROMOTION_DESK' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={18} color="var(--brand-orange)" /> Batch &amp; Semester Progression Readiness Desk
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Automated eligibility evaluation based on attendance criteria, fee dues clearance, and examination results.
              </p>
            </div>
            <Badge variant="navy">Preparation / Preview Mode Only</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)' }}>
                  <th>Batch / Cohort</th>
                  <th>Department</th>
                  <th>Current &rarr; Next Semester</th>
                  <th>Total Students</th>
                  <th>Eligible Count</th>
                  <th>Avg Attendance</th>
                  <th>Pending Fees / Backlogs</th>
                  <th>Readiness State</th>
                </tr>
              </thead>
              <tbody>
                {promotionPreviews.map(b => (
                  <tr key={b.batchId}>
                    <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{b.batchName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.departmentName}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>Sem {b.currentSemester}</span>
                      <span style={{ margin: '0 6px', color: 'var(--brand-orange)' }}>&rarr;</span>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>Sem {b.nextSemester}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.totalStudents}</td>
                    <td style={{ fontWeight: 700, color: '#10B981' }}>{b.eligibleCount} Students</td>
                    <td>
                      <Badge variant={b.attendanceReadinessPercentage >= 75 ? 'success' : 'warning'}>
                        {b.attendanceReadinessPercentage}% Avg
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: b.feePendingCount > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                        {b.feePendingCount} Fee Due / {b.backlogCount} Backlog
                      </span>
                    </td>
                    <td>
                      <Badge variant={b.readinessStatus === 'READY' ? 'success' : b.readinessStatus === 'ATTENTION_REQUIRED' ? 'warning' : 'danger'}>
                        {b.readinessStatus.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: ABC ID Verification */}
      {activeTab === 'ABC_VERIFICATION' && (
        <AbcIdVerificationDesk complianceList={abcComplianceList} />
      )}
    </div>
  );
};
