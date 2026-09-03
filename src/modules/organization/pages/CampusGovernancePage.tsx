/**
 * SSIU ERP — Campus Governance Main Page
 * File: src/modules/organization/pages/CampusGovernancePage.tsx
 */

import React, { useState, useMemo } from 'react';
import { Landmark, Building2, Network, ShieldCheck } from 'lucide-react';
import { organizationGovernanceService } from '../services/organizationGovernanceService';
import { CampusGovernanceCards } from '../components/CampusGovernanceCards';

export const CampusGovernancePage: React.FC = () => {
  const [selectedInstituteId, setSelectedInstituteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HIERARCHY' | 'INFRASTRUCTURE'>('OVERVIEW');

  const metrics = useMemo(() => organizationGovernanceService.getCampusMetrics(), []);
  const institutes = useMemo(() => organizationGovernanceService.getInstituteSummaries(), []);
  const departmentInfrastructures = useMemo(
    () => organizationGovernanceService.getDepartmentInfrastructures(selectedInstituteId || undefined),
    [selectedInstituteId]
  );
  const hierarchyTree = useMemo(() => organizationGovernanceService.getOrganizationHierarchyTree(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ─── HEADER ─── */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Landmark size={24} color="var(--brand-orange)" /> University Multi-Campus Governance Center
          </h2>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
            Constituent Institutes, Academic Infrastructure, Capacity Mapping &amp; Accreditation Lifecycle
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('OVERVIEW')}
          >
            <Building2 size={16} /> Campus Overview
          </button>
          <button 
            className={`btn ${activeTab === 'HIERARCHY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('HIERARCHY')}
          >
            <Network size={16} /> Organizational Tree
          </button>
          <button 
            className={`btn ${activeTab === 'INFRASTRUCTURE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('INFRASTRUCTURE')}
          >
            <ShieldCheck size={16} /> Department Infrastructure
          </button>
        </div>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'OVERVIEW' && (
        <CampusGovernanceCards 
          metrics={metrics}
          institutes={institutes}
          selectedInstituteId={selectedInstituteId}
          onSelectInstitute={setSelectedInstituteId}
        />
      )}

      {/* ─── TAB 2: HIERARCHY TREE ─── */}
      {activeTab === 'HIERARCHY' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
            Interactive University Governance &amp; Academic Hierarchy Tree
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hierarchyTree.map(u => (
              <div key={u.id} style={{ border: '2px solid var(--brand-navy)', borderRadius: '12px', padding: '1rem', background: 'rgba(30, 62, 98, 0.02)' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--brand-navy)' }}>
                  🏛️ {u.name} ({u.code}) — <span style={{ color: 'var(--brand-orange)', fontSize: '0.9rem' }}>{u.headPerson}</span>
                </div>
                <div style={{ marginTop: '0.75rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {u.children?.map(inst => (
                    <div key={inst.id} style={{ borderLeft: '3px solid var(--brand-orange)', paddingLeft: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                        🏢 {inst.name} ({inst.code}) — <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Students: {inst.studentCount} | Faculty: {inst.facultyCount}</span>
                      </div>
                      <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {inst.children?.map(dept => (
                          <div key={dept.id} style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                            📁 <strong>{dept.name}</strong> ({dept.code}) — {dept.headPerson} ({dept.children?.length} Programs)
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: INFRASTRUCTURE ─── */}
      {activeTab === 'INFRASTRUCTURE' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Department Capacity &amp; Room Infrastructure Allocation
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)' }}>
                  <th>Department</th>
                  <th>Institute</th>
                  <th>HOD In-Charge</th>
                  <th>Classrooms</th>
                  <th>Laboratories</th>
                  <th>Seating Capacity</th>
                  <th>Active Programs</th>
                </tr>
              </thead>
              <tbody>
                {departmentInfrastructures.map(dept => (
                  <tr key={dept.departmentId}>
                    <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{dept.departmentName} ({dept.departmentCode})</td>
                    <td>{dept.instituteName}</td>
                    <td>{dept.headOfDepartment}</td>
                    <td>{dept.allocatedClassrooms}</td>
                    <td>{dept.allocatedLabs}</td>
                    <td style={{ fontWeight: 600 }}>{dept.seatingCapacity} seats</td>
                    <td>{dept.activeProgramsCount} Programs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
