import React from 'react';
import { db } from '../../services/db';
import { Building2, GitFork, GraduationCap, BookOpen, Layers } from 'lucide-react';

export interface AcademicHierarchyFilterState {
  instituteId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  divisionId: string;
}

interface AcademicHierarchyFilterBarProps {
  filters: AcademicHierarchyFilterState;
  onFilterChange: (newFilters: AcademicHierarchyFilterState) => void;
  showSemester?: boolean;
  showDivision?: boolean;
  compact?: boolean;
}

export const AcademicHierarchyFilterBar: React.FC<AcademicHierarchyFilterBarProps> = ({
  filters,
  onFilterChange,
  showSemester = true,
  showDivision = true,
  compact = false
}) => {
  const institutes = db.getInstitutes();
  const allDepartments = db.getDepartments();
  const allPrograms = db.getPrograms();
  const allSemesters = db.getSemesters();
  const allDivisions = db.getDivisions();

  // Filter child options dynamically based on parent selections
  const filteredDepartments = filters.instituteId && filters.instituteId !== 'ALL'
    ? allDepartments.filter(d => d.instituteId === filters.instituteId)
    : allDepartments;

  const filteredPrograms = filters.departmentId && filters.departmentId !== 'ALL'
    ? allPrograms.filter(p => p.departmentId === filters.departmentId)
    : (filters.instituteId && filters.instituteId !== 'ALL'
        ? allPrograms.filter(p => p.instituteId === filters.instituteId)
        : allPrograms);

  const filteredSemesters = filters.programId && filters.programId !== 'ALL'
    ? allSemesters.filter(s => s.programId === filters.programId)
    : allSemesters;

  const filteredDivisions = filters.semesterId && filters.semesterId !== 'ALL'
    ? allDivisions.filter(d => d.semesterId === filters.semesterId)
    : allDivisions;

  const handleChange = (key: keyof AcademicHierarchyFilterState, value: string) => {
    const nextState = { ...filters, [key]: value };
    // Cascade reset dependent filters if parent changes
    if (key === 'instituteId') {
      nextState.departmentId = 'ALL';
      nextState.programId = 'ALL';
      nextState.semesterId = 'ALL';
      nextState.divisionId = 'ALL';
    } else if (key === 'departmentId') {
      nextState.programId = 'ALL';
      nextState.semesterId = 'ALL';
      nextState.divisionId = 'ALL';
    } else if (key === 'programId') {
      nextState.semesterId = 'ALL';
      nextState.divisionId = 'ALL';
    } else if (key === 'semesterId') {
      nextState.divisionId = 'ALL';
    }
    onFilterChange(nextState);
  };

  // Check if selected institute has departments
  const hasDepartments = filters.instituteId === 'ALL' || filteredDepartments.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: compact ? '0.5rem' : '0.75rem',
        background: compact ? 'transparent' : 'var(--bg-surface)',
        padding: compact ? 0 : '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: compact ? 'none' : '1px solid var(--border-color)'
      }}
    >
      {/* Institute Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Building2 size={15} color="var(--brand-orange)" />
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
          value={filters.instituteId}
          onChange={e => handleChange('instituteId', e.target.value)}
        >
          <option value="ALL">All Institutes / Schools</option>
          {institutes.map(inst => (
            <option key={inst.id} value={inst.id}>
              {inst.name} ({inst.code})
            </option>
          ))}
        </select>
      </div>

      {/* Department Filter (Only shown if applicable) */}
      {hasDepartments && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <GitFork size={15} color="var(--brand-navy)" />
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
            value={filters.departmentId}
            onChange={e => handleChange('departmentId', e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {filteredDepartments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Program Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <GraduationCap size={15} color="var(--brand-gold)" />
        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
          value={filters.programId}
          onChange={e => handleChange('programId', e.target.value)}
        >
          <option value="ALL">All Programs / Courses</option>
          {filteredPrograms.map(prog => (
            <option key={prog.id} value={prog.id}>
              {prog.name} ({prog.code})
            </option>
          ))}
        </select>
      </div>

      {/* Semester Filter */}
      {showSemester && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <BookOpen size={15} color="var(--brand-navy-medium)" />
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
            value={filters.semesterId}
            onChange={e => handleChange('semesterId', e.target.value)}
          >
            <option value="ALL">All Semesters</option>
            {filteredSemesters.map(sem => (
              <option key={sem.id} value={sem.id}>
                Sem {sem.number} ({sem.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Division Filter */}
      {showDivision && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Layers size={15} color="var(--brand-orange)" />
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}
            value={filters.divisionId}
            onChange={e => handleChange('divisionId', e.target.value)}
          >
            <option value="ALL">All Divisions</option>
            {filteredDivisions.map(div => (
              <option key={div.id} value={div.id}>
                {div.name} ({div.roomNo || 'Gen'})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
