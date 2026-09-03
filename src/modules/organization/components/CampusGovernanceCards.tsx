/**
 * SSIU ERP — Campus Governance Cards Component
 * File: src/modules/organization/components/CampusGovernanceCards.tsx
 */

import React from 'react';
import { Building2, Landmark, GraduationCap, Users, Layers, Award } from 'lucide-react';
import { CampusGovernanceMetrics, InstituteSummaryDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface CampusGovernanceCardsProps {
  metrics: CampusGovernanceMetrics;
  institutes: InstituteSummaryDTO[];
  selectedInstituteId: string | null;
  onSelectInstitute: (id: string | null) => void;
}

export const CampusGovernanceCards: React.FC<CampusGovernanceCardsProps> = ({
  metrics,
  institutes,
  selectedInstituteId,
  onSelectInstitute,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ─── METRICS GRID ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(30, 62, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)' }}>
            <Landmark size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Constituent Institutes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalInstitutes}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(235, 94, 40, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Academic Departments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalDepartments}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Enrolled Students</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalEnrolledStudents}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Faculty Workforce</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{metrics.totalActiveFaculty}</div>
          </div>
        </div>
      </div>

      {/* ─── INSTITUTES BREAKDOWN TABLE ─── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--brand-orange)" /> Institute Infrastructure & Accreditation Status
          </h3>
          {selectedInstituteId && (
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              onClick={() => onSelectInstitute(null)}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Institute Code</th>
                <th>Institute Name</th>
                <th>Departments</th>
                <th>Programs</th>
                <th>Students</th>
                <th>Faculty</th>
                <th>Accreditation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {institutes.map(inst => {
                const isSelected = selectedInstituteId === inst.id;
                return (
                  <tr 
                    key={inst.id} 
                    style={{ 
                      background: isSelected ? 'rgba(30, 62, 98, 0.05)' : 'transparent',
                      cursor: 'pointer' 
                    }}
                    onClick={() => onSelectInstitute(isSelected ? null : inst.id)}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{inst.code}</td>
                    <td>{inst.name}</td>
                    <td>{inst.totalDepartments}</td>
                    <td>{inst.totalPrograms}</td>
                    <td style={{ fontWeight: 600 }}>{inst.totalStudents}</td>
                    <td>{inst.totalFaculty}</td>
                    <td>
                      <Badge variant={inst.accreditationStatus === 'NAAC_A_PLUS' ? 'success' : 'navy'}>
                        <Award size={12} style={{ marginRight: '4px' }} />
                        {inst.accreditationStatus.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td>
                      <button 
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInstitute(isSelected ? null : inst.id);
                        }}
                      >
                        {isSelected ? 'Selected' : 'Filter Depts'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
