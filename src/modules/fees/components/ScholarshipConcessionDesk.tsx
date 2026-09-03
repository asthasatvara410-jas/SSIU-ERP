/**
 * SSIU ERP — Scholarship Allocations & Fee Concession Audit Desk Component
 * File: src/modules/fees/components/ScholarshipConcessionDesk.tsx
 */

import React, { useState } from 'react';
import { Award, Search, CheckCircle2, Clock } from 'lucide-react';
import { ScholarshipAllocationRecordDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface ScholarshipConcessionDeskProps {
  scholarships: ScholarshipAllocationRecordDTO[];
}

export const ScholarshipConcessionDesk: React.FC<ScholarshipConcessionDeskProps> = ({ scholarships }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = scholarships.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.schemeName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--brand-orange)" /> Scholarship Schemes &amp; Concession Allocations
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Sanctioned financial aid, merit concessions, and government post-matric scholarship disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search scholarship..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2rem', minWidth: '220px' }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
          >
            <option value="ALL">All Categories</option>
            <option value="MERIT">Merit Scholarship</option>
            <option value="OBC">OBC Welfare</option>
            <option value="SC_ST">SC / ST Financial Aid</option>
            <option value="EWS">EWS Scheme</option>
            <option value="SPORTS_QUOTA">Sports Quota</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)' }}>
              <th>Scholarship ID</th>
              <th>Beneficiary Student</th>
              <th>Scheme Title</th>
              <th>Category</th>
              <th>Sanctioned Amount</th>
              <th>Disbursed Amount</th>
              <th>Academic Year</th>
              <th>Disbursement Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.scholarshipId}>
                <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{s.scholarshipId}</td>
                <td style={{ fontWeight: 700 }}>{s.studentName}</td>
                <td>{s.schemeName}</td>
                <td>
                  <Badge variant="navy">{s.category.replace('_', ' ')}</Badge>
                </td>
                <td style={{ fontWeight: 600 }}>₹{s.sanctionedAmount.toLocaleString()}</td>
                <td style={{ color: '#10B981', fontWeight: 600 }}>₹{s.disbursedAmount.toLocaleString()}</td>
                <td>{s.financialYear}</td>
                <td>
                  <Badge variant={s.verificationStatus === 'DISBURSED' ? 'success' : s.verificationStatus === 'SANCTIONED' ? 'warning' : 'purple'}>
                    {s.verificationStatus.replace(/_/g, ' ')}
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
