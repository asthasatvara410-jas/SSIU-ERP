/**
 * SSIU ERP — Attendance Correction & Medical On-Duty Audit Component
 * File: src/modules/attendance/components/AttendanceCorrectionDesk.tsx
 */

import React, { useState } from 'react';
import { ClipboardList, Search, CheckCircle2, Clock } from 'lucide-react';
import { AttendanceCorrectionRecordDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface AttendanceCorrectionDeskProps {
  corrections: AttendanceCorrectionRecordDTO[];
}

export const AttendanceCorrectionDesk: React.FC<AttendanceCorrectionDeskProps> = ({ corrections }) => {
  const [search, setSearch] = useState('');

  const filtered = corrections.filter(c =>
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    c.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={18} color="var(--brand-orange)" /> Attendance Correction &amp; On-Duty Approval Audit
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Historical audit log of approved medical exemptions, sports on-duty claims, and session attendance adjustments.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search correction logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '2rem', minWidth: '220px' }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)' }}>
              <th>Log Ref</th>
              <th>Student Name</th>
              <th>Course / Subject</th>
              <th>Date</th>
              <th>Adjustment</th>
              <th>Exemption Justification</th>
              <th>Approving Authority</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.correctionId}>
                <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{c.correctionId}</td>
                <td style={{ fontWeight: 700 }}>{c.studentName}</td>
                <td>{c.subjectName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{c.sessionDate}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Badge variant="inactive">{c.originalStatus}</Badge>
                    &rarr;
                    <Badge variant={c.correctedStatus === 'ON_DUTY' ? 'purple' : 'success'}>{c.correctedStatus}</Badge>
                  </span>
                </td>
                <td style={{ maxWidth: '240px', fontSize: '0.8125rem' }}>{c.reason}</td>
                <td style={{ fontWeight: 600 }}>{c.approvedBy}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
