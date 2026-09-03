/**
 * SSIU ERP — Department Cost Center Ledger & Variance Component
 * File: src/modules/finance/components/CostCenterLedgerViewer.tsx
 */

import React, { useState } from 'react';
import { Layers, Search, CheckCircle2, Clock } from 'lucide-react';
import { DepartmentCostCenterDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface CostCenterLedgerViewerProps {
  costCenters: DepartmentCostCenterDTO[];
}

export const CostCenterLedgerViewer: React.FC<CostCenterLedgerViewerProps> = ({ costCenters }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = costCenters.filter(cc => {
    const matchesSearch = cc.departmentName.toLowerCase().includes(search.toLowerCase()) ||
      cc.costCenterCode.toLowerCase().includes(search.toLowerCase()) ||
      cc.headOfDepartment.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cc.costCenterStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--brand-orange)" /> Department-Level Cost Center &amp; Committed PO Ledger
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Tracks allocated departmental expenditure caps against actual incurred bills and committed purchase orders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search cost center, department..."
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
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy (0-75%)</option>
            <option value="ALERT_75">Warning (75-95%)</option>
            <option value="EXHAUSTED">Budget Exhausted</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)' }}>
              <th>Cost Center</th>
              <th>Department</th>
              <th>Responsible Authority</th>
              <th>Budget Cap</th>
              <th>Incurred Expenses</th>
              <th>Committed POs</th>
              <th>Uncommitted Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cc => (
              <tr key={cc.costCenterCode}>
                <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{cc.costCenterCode}</td>
                <td style={{ fontWeight: 700 }}>{cc.departmentName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{cc.headOfDepartment}</td>
                <td style={{ fontWeight: 600 }}>₹{cc.budgetCapLakhs} L</td>
                <td>₹{cc.expensesIncurredLakhs} L</td>
                <td>₹{cc.committedPurchaseOrdersLakhs} L</td>
                <td style={{ color: '#10B981', fontWeight: 700 }}>₹{cc.uncommittedBalanceLakhs} L</td>
                <td>
                  <Badge variant={cc.costCenterStatus === 'HEALTHY' ? 'success' : cc.costCenterStatus === 'ALERT_75' ? 'warning' : 'danger'}>
                    {cc.costCenterStatus}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
