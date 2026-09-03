/**
 * SSIU ERP — Budget vs. Actual Variance & Institute Financials Component
 * File: src/modules/finance/components/BudgetVsActualCard.tsx
 */

import React from 'react';
import { Landmark, TrendingUp, DollarSign, PieChart, Building2 } from 'lucide-react';
import { InstitutionalFinanceSummaryDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface BudgetVsActualCardProps {
  summary: InstitutionalFinanceSummaryDTO;
}

export const BudgetVsActualCard: React.FC<BudgetVsActualCardProps> = ({ summary }) => {
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
            <Landmark size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Budget Cap</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>₹{summary.totalBudgetAllocatedLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Fiscal Allocation</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(235, 94, 40, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actual Expenditure Incurred</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>₹{summary.totalActualExpenditureLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)', fontWeight: 600 }}>{summary.budgetUtilizationPercentage}% Utilized</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fee Revenue Realized</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>₹{summary.totalFeeRevenueRealizedLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Operating Surplus</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <PieChart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fiscal Operating Variance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>+₹{summary.operationalVarianceLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Favorable Variance</div>
          </div>
        </div>
      </div>

      {/* Institute Financial Breakdown Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={18} color="var(--brand-orange)" /> Constituent Institute Budget vs. Expenditure Breakdown
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Constituent Institute</th>
                <th>Allocated Budget</th>
                <th>Incurred Expenses</th>
                <th>Fee Revenue Generated</th>
                <th>Budget Utilization</th>
                <th>Fiscal Health</th>
              </tr>
            </thead>
            <tbody>
              {summary.instituteFinancials.map(inst => (
                <tr key={inst.instituteId}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{inst.instituteName}</td>
                  <td style={{ fontWeight: 600 }}>₹{inst.allocatedBudgetLakhs} L</td>
                  <td style={{ fontWeight: 600 }}>₹{inst.expenditureLakhs} L</td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>₹{inst.feeRevenueLakhs} L</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                        <div style={{ width: `${Math.min(100, inst.utilizationRate)}%`, height: '100%', background: inst.utilizationRate <= 85 ? '#10B981' : '#F59E0B' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{inst.utilizationRate}%</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={inst.utilizationRate <= 85 ? 'success' : 'warning'}>
                      {inst.utilizationRate <= 85 ? 'HEALTHY' : 'NEARING CAP'}
                    </Badge>
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
