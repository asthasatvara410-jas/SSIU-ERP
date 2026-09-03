/**
 * SSIU ERP — Fee Operations Hub Page
 * File: src/modules/fees/pages/FeeGovernanceHubPage.tsx
 */

import React, { useState } from 'react';
import { IndianRupee, PieChart, Award, BarChart3 } from 'lucide-react';
import { feeGovernanceService } from '../services/feeGovernanceService';
import { FeeCollectionMetricsCard } from '../components/FeeCollectionMetricsCard';
import { ScholarshipConcessionDesk } from '../components/ScholarshipConcessionDesk';
import { Badge } from '../../../components/common/Badge';

export const FeeGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'COLLECTION' | 'SCHOLARSHIPS'>('COLLECTION');

  const metrics = feeGovernanceService.getFeeCollectionMetrics();
  const dues = feeGovernanceService.getStudentFeeDuesList();
  const scholarships = feeGovernanceService.getScholarshipAllocations();

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Student Financial Services
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <IndianRupee size={28} color="var(--brand-orange)" /> Fee Operations Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Demand vs. Realization Velocity, Overdue Aging Brackets &amp; Scholarship Scheme Disbursals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-light)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('COLLECTION')}
            className={`btn ${activeTab === 'COLLECTION' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={14} /> Collection &amp; Aging Dues
          </button>

          <button
            onClick={() => setActiveTab('SCHOLARSHIPS')}
            className={`btn ${activeTab === 'SCHOLARSHIPS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Award size={14} /> Scholarship Schemes
          </button>
        </div>
      </div>

      {/* Tab 1: Collection & Aging Dues */}
      {activeTab === 'COLLECTION' && (
        <FeeCollectionMetricsCard metrics={metrics} dues={dues} />
      )}

      {/* Tab 2: Scholarship Schemes */}
      {activeTab === 'SCHOLARSHIPS' && (
        <ScholarshipConcessionDesk scholarships={scholarships} />
      )}
    </div>
  );
};
