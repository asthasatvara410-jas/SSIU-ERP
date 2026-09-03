/**
 * SSIU ERP — Leave Workforce Desk & Balance Audit Component
 * File: src/modules/hr/components/LeaveWorkforceDesk.tsx
 */

import React, { useState } from 'react';
import { Calendar, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { EmployeeLeaveBalanceDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface LeaveWorkforceDeskProps {
  leaveBalances: EmployeeLeaveBalanceDTO[];
}

export const LeaveWorkforceDesk: React.FC<LeaveWorkforceDeskProps> = ({ leaveBalances }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = leaveBalances.filter(item => {
    const matchesSearch = item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      item.departmentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.leaveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--brand-orange)" /> Employee Leave Balances &amp; Utilization Audit Desk
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Casual Leave (CL), Earned Leave (EL), and Medical Leave (ML) quotas across active institutional staff.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search staff, department..."
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
            <option value="NORMAL">Normal Balance</option>
            <option value="EXHAUSTED">Quota Exhausted</option>
            <option value="ON_EXTENDED_LEAVE">On Extended Leave</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)' }}>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Casual Leave (CL)</th>
              <th>Earned Leave (EL)</th>
              <th>Medical Leave (ML)</th>
              <th>Applied This Month</th>
              <th>Pending Approvals</th>
              <th>Quota Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.employeeId}>
                <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{emp.employeeName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{emp.designation}</td>
                <td>{emp.departmentName}</td>
                <td style={{ fontWeight: 600 }}>{emp.casualLeaveBalance} Days</td>
                <td style={{ fontWeight: 600 }}>{emp.earnedLeaveBalance} Days</td>
                <td style={{ fontWeight: 600 }}>{emp.medicalLeaveBalance} Days</td>
                <td>{emp.leavesAppliedThisMonth} Days</td>
                <td>
                  {emp.pendingApprovals > 0 ? (
                    <Badge variant="warning">{emp.pendingApprovals} Pending</Badge>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0</span>
                  )}
                </td>
                <td>
                  <Badge variant={emp.leaveStatus === 'NORMAL' ? 'success' : emp.leaveStatus === 'EXHAUSTED' ? 'danger' : 'purple'}>
                    {emp.leaveStatus}
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
