import React, { useState } from 'react';
import { Briefcase, BookOpen, Award, BarChart3, Building2, CheckCircle2, ChevronRight, Users, Plus, ShieldCheck, X } from 'lucide-react';
import { StaffGovernanceMetricsDTO } from '../types';
import { Badge } from '../../../components/common/Badge';
import { db } from '../../../services/db';
import { TargetFacultyAccountInfo } from './StaffFacultyAccountModal';

interface FacultyWorkloadAllocationCardProps {
  metrics: StaffGovernanceMetricsDTO;
  onManageAccount?: (target: TargetFacultyAccountInfo) => void;
}

export const FacultyWorkloadAllocationCard: React.FC<FacultyWorkloadAllocationCardProps> = ({
  metrics,
  onManageAccount,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const allFaculty = db.getFaculty();
  const allUsers = db.getUsers();
  const departments = db.getDepartments();

  const selectedDepartment = departments.find(d => d.id === selectedDeptId);
  const deptFacultyList = selectedDeptId ? allFaculty.filter(f => f.departmentId === selectedDeptId) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(30, 62, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Academic Faculty</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalFaculty}</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{metrics.activeFaculty} Active on Campus</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Student-Faculty Ratio (SFR)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>1 : {metrics.studentFacultyRatio}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AICTE / UGC Benchmark (1:20)</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(235, 94, 40, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ph.D &amp; Doctorate Faculty</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.phdHolderCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Research Faculty Ratio: {Math.round((metrics.phdHolderCount / Math.max(1, metrics.totalFaculty)) * 100)}%</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Teaching Workload</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.avgTeachingHoursPerWeek} hrs/wk</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balanced Distribution</div>
          </div>
        </div>
      </div>

      {/* Department Workload Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Building2 size={18} color="var(--brand-orange)" /> Department-Wise SFR &amp; Teaching Load Distribution
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Click any department row to view individual faculty roster and ERP account credentials status.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Department</th>
                <th>Institute</th>
                <th>Faculty Strength</th>
                <th>Student Count</th>
                <th>SFR</th>
                <th>Avg Teaching Load</th>
                <th>Workload Status</th>
                <th style={{ textAlign: 'right' }}>Faculty Roster</th>
              </tr>
            </thead>
            <tbody>
              {metrics.departmentWorkloadStats.map(stat => (
                <tr
                  key={stat.departmentId}
                  onClick={() => setSelectedDeptId(selectedDeptId === stat.departmentId ? null : stat.departmentId)}
                  style={{
                    cursor: 'pointer',
                    background: selectedDeptId === stat.departmentId ? '#F1F5F9' : undefined,
                  }}
                >
                  <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{stat.departmentName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{stat.instituteName}</td>
                  <td style={{ fontWeight: 600 }}>{stat.totalFaculty} Faculty</td>
                  <td>{stat.studentCount} Students</td>
                  <td style={{ fontWeight: 600, color: stat.studentFacultyRatio > 25 ? '#EF4444' : 'var(--brand-navy)' }}>
                    1 : {stat.studentFacultyRatio}
                  </td>
                  <td>{stat.averageWorkloadHours} Hours / Week</td>
                  <td>
                    <Badge variant={stat.workloadStatus === 'OPTIMAL' ? 'success' : stat.workloadStatus === 'UNDERLOADED' ? 'navy' : 'danger'}>
                      {stat.workloadStatus}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Users size={12} /> View Faculty <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Department Faculty Roster Drawer / Modal */}
      {selectedDeptId && selectedDepartment && (
        <div className="card" style={{ padding: '1.5rem', border: '2px solid var(--brand-navy)', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--brand-orange)" />
                {selectedDepartment.name} — Individual Faculty &amp; Staff Login Credentials
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Manage login accounts, status, and reset temporary passwords directly for members of this department.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDeptId(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th>Faculty Name</th>
                  <th>Employee Code</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Login Account Action</th>
                </tr>
              </thead>
              <tbody>
                {deptFacultyList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
                      No faculty records mapped to this department yet.
                    </td>
                  </tr>
                ) : (
                  deptFacultyList.map(f => {
                    const empCode = f.employeeId || `EMP-${f.id.slice(-4)}`;
                    const userAccount = allUsers.find(
                      u => (f.employeeId && (u.employeeId === f.employeeId || u.username === f.employeeId)) ||
                           (f.email && u.email?.toLowerCase() === f.email.toLowerCase()) ||
                           u.id === f.id
                    );

                    return (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{f.name}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>{empCode}</td>
                        <td style={{ color: '#64748B' }}>{f.designation || 'Faculty'}</td>
                        <td style={{ fontFamily: 'monospace', color: '#64748B' }}>{f.email || '—'}</td>
                        <td>
                          {userAccount ? (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                background:
                                  userAccount.accountStatus === 'ACTIVE' || (userAccount.status === 'ACTIVE' && !userAccount.accountStatus)
                                    ? '#D1FAE5'
                                    : userAccount.accountStatus === 'LOCKED'
                                    ? '#FEE2E2'
                                    : '#F3F4F6',
                                color:
                                  userAccount.accountStatus === 'ACTIVE' || (userAccount.status === 'ACTIVE' && !userAccount.accountStatus)
                                    ? '#065F46'
                                    : userAccount.accountStatus === 'LOCKED'
                                    ? '#991B1B'
                                    : '#374151',
                              }}
                            >
                              {userAccount.accountStatus || userAccount.status || 'ACTIVE'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600 }}>No Login</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {userAccount ? (
                            <button
                              type="button"
                              onClick={() => onManageAccount?.({
                                facultyId: f.id,
                                name: f.name,
                                employeeId: empCode,
                                email: f.email,
                                designation: f.designation,
                                departmentName: selectedDepartment.name,
                                departmentId: selectedDepartment.id,
                                instituteId: selectedDepartment.instituteId,
                                role: f.designation?.toUpperCase().includes('HOD') ? 'HOD' : 'FACULTY',
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #A7F3D0',
                                cursor: 'pointer',
                              }}
                            >
                              <ShieldCheck size={12} color="#059669" />
                              <span>Manage Account</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onManageAccount?.({
                                facultyId: f.id,
                                name: f.name,
                                employeeId: empCode,
                                email: f.email,
                                designation: f.designation,
                                departmentName: selectedDepartment.name,
                                departmentId: selectedDepartment.id,
                                instituteId: selectedDepartment.instituteId,
                                role: f.designation?.toUpperCase().includes('HOD') ? 'HOD' : 'FACULTY',
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: '#FFF7ED',
                                color: '#C2410C',
                                border: '1px solid #FDBA74',
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={12} />
                              <span>+ Create Login Account</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
