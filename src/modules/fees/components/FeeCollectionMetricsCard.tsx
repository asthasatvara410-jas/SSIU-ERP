/**
 * SSIU ERP — Fee Collection Metrics & Outstanding Dues Component
 * File: src/modules/fees/components/FeeCollectionMetricsCard.tsx
 */

import React, { useState } from 'react';
import { IndianRupee, PieChart, TrendingUp, AlertCircle, Search, Filter } from 'lucide-react';
import { FeeCollectionMetricsDTO, StudentFeeDuesSummaryDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface FeeCollectionMetricsCardProps {
  metrics: FeeCollectionMetricsDTO;
  dues: StudentFeeDuesSummaryDTO[];
}

export const FeeCollectionMetricsCard: React.FC<FeeCollectionMetricsCardProps> = ({ metrics, dues }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDues = dues.filter(d => {
    const matchesSearch = d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.enrollmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.programName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(30, 62, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Fee Demand</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>₹{metrics.totalDemandAmountLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.totalInvoicesIssued} Total Invoices</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Realized Collection</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>₹{metrics.totalCollectedAmountLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{metrics.collectionPercentage}% Realization Rate</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Outstanding Fee Dues</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>₹{metrics.totalPendingDuesAmountLakhs} L</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.overdueInvoicesCount} Overdue Accounts</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <PieChart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Paid Invoices Ratio</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.paidInvoicesCount} / {metrics.totalInvoicesIssued}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.partialInvoicesCount} Partial Payments</div>
          </div>
        </div>
      </div>

      {/* Student Ledger Dues Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IndianRupee size={18} color="var(--brand-orange)" /> Student Fee Ledger &amp; Aging Analysis
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Read-only aggregate of active student demand, payments received, and overdue aging brackets.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search student, program..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', minWidth: '220px' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Fully Paid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="UNPAID">Unpaid / Dues</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Enrollment No</th>
                <th>Student Name</th>
                <th>Academic Program</th>
                <th>Sem</th>
                <th>Demand</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Aging Bracket</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDues.slice(0, 20).map(d => (
                <tr key={d.studentId}>
                  <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{d.enrollmentNumber}</td>
                  <td style={{ fontWeight: 700 }}>{d.studentName}</td>
                  <td>{d.programName}</td>
                  <td>Sem {d.semester}</td>
                  <td style={{ fontWeight: 600 }}>₹{d.totalDemand.toLocaleString()}</td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>₹{d.totalPaid.toLocaleString()}</td>
                  <td style={{ color: d.pendingDue > 0 ? '#EF4444' : 'var(--text-muted)', fontWeight: 700 }}>
                    ₹{d.pendingDue.toLocaleString()}
                  </td>
                  <td>
                    <Badge variant={d.agingBracket === 'CURRENT' ? 'navy' : d.agingBracket === '1_30_DAYS' ? 'warning' : 'danger'}>
                      {d.agingBracket.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={d.paymentStatus === 'PAID' ? 'success' : d.paymentStatus === 'PARTIAL' ? 'warning' : 'danger'}>
                      {d.paymentStatus}
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
