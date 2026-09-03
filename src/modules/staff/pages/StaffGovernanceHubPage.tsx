import React, { useState } from 'react';
import { Briefcase, Network, Award, BookOpen, BarChart3, Search, Sparkles, Plus, ShieldCheck } from 'lucide-react';
import { staffGovernanceService } from '../services/staffGovernanceService';
import { FacultyWorkloadAllocationCard } from '../components/FacultyWorkloadAllocationCard';
import { StaffReportingTreeViewer } from '../components/StaffReportingTreeViewer';
import { StaffFacultyAccountModal, TargetFacultyAccountInfo } from '../components/StaffFacultyAccountModal';
import { Badge } from '../../../components/common/Badge';
import { db } from '../../../services/db';

export const StaffGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WORKLOAD' | 'REPORTING_TREE' | 'RESEARCH_PORTFOLIO'>('WORKLOAD');
  const [search, setSearch] = useState('');
  const [selectedTargetForAccount, setSelectedTargetForAccount] = useState<TargetFacultyAccountInfo | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const metrics = staffGovernanceService.getStaffGovernanceMetrics();
  const hierarchy = staffGovernanceService.getSupervisorReportingHierarchy();
  const researchPortfolios = staffGovernanceService.getFacultyResearchPortfolios();
  const allUsers = db.getUsers();

  const filteredResearch = researchPortfolios.filter(r =>
    r.facultyName.toLowerCase().includes(search.toLowerCase()) ||
    r.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Human Capital &amp; Faculty Governance
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={28} color="var(--brand-orange)" /> Staff &amp; Faculty Management Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Workforce Allocation, Student-Faculty Ratios (SFR), Supervisory Trees &amp; Research Portfolios.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-light)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('WORKLOAD')}
            className={`btn ${activeTab === 'WORKLOAD' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={14} /> Workload &amp; SFR
          </button>

          <button
            onClick={() => setActiveTab('REPORTING_TREE')}
            className={`btn ${activeTab === 'REPORTING_TREE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Network size={14} /> Reporting Hierarchy
          </button>

          <button
            onClick={() => setActiveTab('RESEARCH_PORTFOLIO')}
            className={`btn ${activeTab === 'RESEARCH_PORTFOLIO' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Award size={14} /> Research Portfolio
          </button>
        </div>
      </div>

      {/* Tab 1: Workload & SFR */}
      {activeTab === 'WORKLOAD' && (
        <FacultyWorkloadAllocationCard
          metrics={metrics}
          onManageAccount={target => setSelectedTargetForAccount(target)}
        />
      )}

      {/* Tab 2: Reporting Tree */}
      {activeTab === 'REPORTING_TREE' && (
        <StaffReportingTreeViewer
          hierarchy={hierarchy}
          onManageAccount={target => setSelectedTargetForAccount(target)}
        />
      )}

      {/* Tab 3: Research Portfolio */}
      {activeTab === 'RESEARCH_PORTFOLIO' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--brand-orange)" /> Faculty Research, Patents &amp; Funded Grants Output
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Scopus / WoS indexed journal publications, patents filed, and external research grants.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search faculty name, department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', minWidth: '260px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)' }}>
                  <th>Faculty Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Journal Papers</th>
                  <th>Conference Papers</th>
                  <th>Patents</th>
                  <th>Funded Grants</th>
                  <th>h-Index</th>
                  <th style={{ textAlign: 'right' }}>ERP Login</th>
                </tr>
              </thead>
              <tbody>
                {filteredResearch.map(item => {
                  const empCode = item.employeeId || `EMP-${item.facultyId.slice(-4)}`;
                  const userAccount = allUsers.find(
                    u => (item.employeeId && (u.employeeId === item.employeeId || u.username === item.employeeId)) ||
                         (item.email && u.email?.toLowerCase() === item.email.toLowerCase()) ||
                         u.id === item.facultyId
                  );

                  return (
                    <tr key={item.facultyId}>
                      <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{item.facultyName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.designation}</td>
                      <td>{item.departmentName}</td>
                      <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{item.journalPapersCount} Papers</td>
                      <td>{item.conferencePapersCount} Conf.</td>
                      <td>
                        {item.patentsCount > 0 ? (
                          <Badge variant="gold">{item.patentsCount} Patent</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                      <td>
                        {item.fundedGrantsAmountLakhs > 0 ? (
                          <span style={{ color: '#10B981', fontWeight: 600 }}>&#8377; {item.fundedGrantsAmountLakhs} L</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <Badge variant="navy">h-{item.hIndex}</Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {userAccount ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTargetForAccount({
                              facultyId: item.facultyId,
                              name: item.facultyName,
                              employeeId: empCode,
                              email: item.email,
                              designation: item.designation,
                              departmentName: item.departmentName,
                              departmentId: item.departmentId,
                              instituteId: item.instituteId,
                              role: item.designation?.toUpperCase().includes('HOD') ? 'HOD' : 'FACULTY',
                            })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              background: '#ECFDF5',
                              color: '#065F46',
                              border: '1px solid #A7F3D0',
                              cursor: 'pointer',
                            }}
                          >
                            <ShieldCheck size={12} color="#059669" />
                            <span>{userAccount.accountStatus || 'ACTIVE'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedTargetForAccount({
                              facultyId: item.facultyId,
                              name: item.facultyName,
                              employeeId: empCode,
                              email: item.email,
                              designation: item.designation,
                              departmentName: item.departmentName,
                              departmentId: item.departmentId,
                              instituteId: item.instituteId,
                              role: item.designation?.toUpperCase().includes('HOD') ? 'HOD' : 'FACULTY',
                            })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              background: '#FFF7ED',
                              color: '#C2410C',
                              border: '1px solid #FDBA74',
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={12} />
                            <span>Login</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Provisioning & Status Modal */}
      {selectedTargetForAccount && (
        <StaffFacultyAccountModal
          target={selectedTargetForAccount}
          onClose={() => setSelectedTargetForAccount(null)}
          onAccountUpdated={() => {
            setRefreshCount(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
};
