/**
 * SSIU ERP — Role Matrix Grid Component
 * File: src/modules/permissions/components/RoleMatrixGrid.tsx
 */

import React, { useState } from 'react';
import { ShieldCheck, Check, X, Lock } from 'lucide-react';
import { RolePermissionConfigDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface RoleMatrixGridProps {
  matrix: RolePermissionConfigDTO[];
}

export const RoleMatrixGrid: React.FC<RoleMatrixGridProps> = ({ matrix }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRoles = matrix.filter(r => {
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesSearch = r.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) || r.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filters Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'LEADERSHIP', 'ACADEMIC', 'ADMINISTRATION', 'OPERATIONS', 'STUDENT_SERVICES'].map(cat => (
            <button
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <input 
          type="text" 
          placeholder="Search role title or code..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '280px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
        />
      </div>

      {/* Permission Matrix Grid */}
      <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.84375rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)' }}>
              <th>Role &amp; Category</th>
              <th>Assigned Users</th>
              <th>Org Master</th>
              <th>Student Mgmt</th>
              <th>Academics LMS</th>
              <th>Fees &amp; Finance</th>
              <th>Security Policy</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map(r => (
              <tr key={r.role}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{r.roleTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><code>{r.role}</code></div>
                </td>
                <td>
                  <Badge variant="navy">{r.totalAssignedUsers} Users</Badge>
                </td>
                <td>
                  {r.permissions.ORGANIZATION?.canEdit ? (
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Check size={16} /> Edit / Manage
                    </span>
                  ) : r.permissions.ORGANIZATION?.canView ? (
                    <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Read Only
                    </span>
                  ) : (
                    <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={14} /> Denied
                    </span>
                  )}
                </td>
                <td>
                  {r.permissions.STUDENT_MGMT?.canEdit ? (
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Check size={16} /> Full Access
                    </span>
                  ) : (
                    <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Read Only
                    </span>
                  )}
                </td>
                <td>
                  {r.permissions.ACADEMICS_LMS?.canEdit ? (
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Check size={16} /> Full Access
                    </span>
                  ) : (
                    <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Student View
                    </span>
                  )}
                </td>
                <td>
                  {r.permissions.FEES_FINANCE?.canEdit ? (
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Check size={16} /> Financial Admin
                    </span>
                  ) : r.permissions.FEES_FINANCE?.canView ? (
                    <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Ledger View
                    </span>
                  ) : (
                    <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={14} /> Denied
                    </span>
                  )}
                </td>
                <td>
                  {r.isSystemProtected ? (
                    <Badge variant="warning"><Lock size={12} style={{ marginRight: '4px' }} /> System Root</Badge>
                  ) : (
                    <Badge variant="success"><ShieldCheck size={12} style={{ marginRight: '4px' }} /> Active Policy</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
