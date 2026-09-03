/**
 * SSIU ERP — Institutional Finance Hub Page
 * File: src/modules/finance/pages/FinanceGovernanceHubPage.tsx
 */

import React, { useState } from 'react';
import { Landmark, Layers, TrendingUp, BarChart3, ShieldCheck } from 'lucide-react';
import { financeGovernanceService } from '../services/financeGovernanceService';
import { BudgetVsActualCard } from '../components/BudgetVsActualCard';
import { CostCenterLedgerViewer } from '../components/CostCenterLedgerViewer';
import { Badge } from '../../../components/common/Badge';

export const FinanceGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUDGET' | 'COST_CENTERS' | 'REVENUE'>('BUDGET');

  const summary = financeGovernanceService.getInstitutionalFinanceSummary();
  const costCenters = financeGovernanceService.getDepartmentCostCenters();
  const revenueStreams = financeGovernanceService.getRevenueStreams();

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Institutional Financial Control
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Landmark size={28} color="var(--brand-orange)" /> Institutional Finance Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Annual Budget vs. Actual Variance, Department Cost Centers &amp; Fee Revenue Reconciliation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-light)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('BUDGET')}
            className={`btn ${activeTab === 'BUDGET' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={14} /> Budget vs. Actual
          </button>

          <button
            onClick={() => setActiveTab('COST_CENTERS')}
            className={`btn ${activeTab === 'COST_CENTERS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={14} /> Cost Centers
          </button>

          <button
            onClick={() => setActiveTab('REVENUE')}
            className={`btn ${activeTab === 'REVENUE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TrendingUp size={14} /> Revenue Streams
          </button>
        </div>
      </div>

      {/* Tab 1: Budget vs. Actual */}
      {activeTab === 'BUDGET' && (
        <BudgetVsActualCard summary={summary} />
      )}

      {/* Tab 2: Cost Centers */}
      {activeTab === 'COST_CENTERS' && (
        <CostCenterLedgerViewer costCenters={costCenters} />
      )}

      {/* Tab 3: Revenue Streams */}
      {activeTab === 'REVENUE' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--brand-orange)" /> University Revenue Stream Projections &amp; Realization
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Quarterly tracking across academic tuition fees, examination collections, research grants, and consultancy.
              </p>
            </div>
            <Badge variant="navy">Fiscal Year 2025-2026</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)' }}>
                  <th>Stream Ref</th>
                  <th>Revenue Category</th>
                  <th>Fiscal Quarter</th>
                  <th>Projected Target</th>
                  <th>Realized Revenue</th>
                  <th>Realization Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueStreams.map(rev => (
                  <tr key={rev.streamId}>
                    <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{rev.streamId}</td>
                    <td style={{ fontWeight: 700 }}>{rev.streamName}</td>
                    <td><Badge variant="navy">{rev.fiscalQuarter}</Badge></td>
                    <td style={{ fontWeight: 600 }}>₹{rev.projectedRevenueLakhs} L</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>₹{rev.realizedRevenueLakhs} L</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: `${rev.collectionProgress}%`, height: '100%', background: rev.collectionProgress >= 80 ? '#10B981' : '#F59E0B' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{rev.collectionProgress}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={rev.collectionProgress >= 80 ? 'success' : 'warning'}>
                        {rev.collectionProgress >= 80 ? 'TARGET MET' : 'IN PROGRESS'}
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
