/**
 * SSIU ERP — ABC ID & Academic Identity Verification Desk Component
 * File: src/modules/students/components/AbcIdVerificationDesk.tsx
 */

import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, FileCheck2 } from 'lucide-react';
import { StudentAbcComplianceItemDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface AbcIdVerificationDeskProps {
  complianceList: StudentAbcComplianceItemDTO[];
}

export const AbcIdVerificationDesk: React.FC<AbcIdVerificationDeskProps> = ({ complianceList }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING_UPLOAD' | 'REJECTED'>('ALL');

  const filtered = complianceList.filter(item => {
    const matchesSearch = item.studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.enrollmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (item.abcId && item.abcId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || item.complianceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FileCheck2 size={18} color="var(--brand-orange)" /> Academic Bank of Credits (ABC ID) &amp; APAAR Verification Desk
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            National Academic Depository (NAD) DigiLocker integration and ABC ID verification status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search student, enrollment, ABC ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2rem', minWidth: '260px' }}
            />
          </div>

          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{ minWidth: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified (DigiLocker)</option>
            <option value="PENDING_UPLOAD">Pending Upload</option>
            <option value="REJECTED">Flagged / Rejected</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)' }}>
              <th>Enrollment No.</th>
              <th>Student Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>ABC ID / APAAR</th>
              <th>DigiLocker Status</th>
              <th>Compliance State</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(item => (
              <tr key={item.studentId}>
                <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}><code>{item.enrollmentNumber}</code></td>
                <td style={{ fontWeight: 600 }}>{item.studentName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{item.departmentName}</td>
                <td>Sem {item.semester}</td>
                <td>
                  {item.abcId ? (
                    <div>
                      <div style={{ fontWeight: 600 }}><code>{item.abcId}</code></div>
                      {item.apaarId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.apaarId}</div>}
                    </div>
                  ) : (
                    <span style={{ color: '#EF4444', fontSize: '0.8125rem' }}>Not Provided</span>
                  )}
                </td>
                <td>
                  {item.digiLockerLinked ? (
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Linked
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                      <AlertCircle size={14} /> Unlinked
                    </span>
                  )}
                </td>
                <td>
                  <Badge variant={item.complianceStatus === 'VERIFIED' ? 'success' : item.complianceStatus === 'PENDING_UPLOAD' ? 'warning' : 'danger'}>
                    {item.complianceStatus.replace(/_/g, ' ')}
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
