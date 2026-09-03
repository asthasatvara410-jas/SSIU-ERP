import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, BookOpen, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { resourceAllocationService } from '../../services/resourceAllocationService';

interface AllocateFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AllocateFacultyModal: React.FC<AllocateFacultyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const academicYears = db.getAcademicYears();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();
  const subjects = db.getSubjects();
  const facultyList = db.getUsers().filter(u => u.role === 'FACULTY' || (u as any).isFaculty);

  const [facultyId, setFacultyId] = useState(facultyList[0]?.id || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-cse');
  const [programId, setProgramId] = useState(programs[0]?.id || 'prog-1');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || 'sub-1');
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || 'sem-1');
  const [divisionId, setDivisionId] = useState(divisions[0]?.id || 'div-1');
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || 'ay-2026');
  const [theoryHours, setTheoryHours] = useState(3);
  const [practicalHours, setPracticalHours] = useState(2);
  const [effectiveFrom, setEffectiveFrom] = useState('2026-07-01');
  const [effectiveTo, setEffectiveTo] = useState('2026-12-31');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetDept = departments.find(d => d.id === departmentId);
  const instId = targetDept?.instituteId || 'inst-1';
  const totalLoad = Number(theoryHours) + Number(practicalHours);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!facultyId) {
      setError('Please select a faculty member.');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject.');
      return;
    }

    const res = resourceAllocationService.allocateFaculty({
      facultyId,
      instituteId: instId,
      departmentId,
      programId,
      subjectId,
      semesterId,
      divisionId,
      academicYearId,
      teachingLoad: totalLoad,
      theoryHours: Number(theoryHours),
      practicalHours: Number(practicalHours),
      effectiveFrom,
      effectiveTo,
      remarks: remarks.trim() || undefined
    }, user || { id: 'admin', name: 'Central Admin', role: 'STUDENT_ADMIN' } as any);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Allocate Faculty Teaching Assignment
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
              Subject Allocation • Weekly Workload Hours • Faculty Auto-Mapping
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.35rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#991B1B', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '6px', color: '#065F46', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Select Faculty Member *</label>
            <select
              required
              value={facultyId}
              onChange={e => setFacultyId(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
            >
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Department *</label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Subject / Course *</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Semester & Division *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={semesterId}
                  onChange={e => setSemesterId(e.target.value)}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>Sem {s.number}</option>
                  ))}
                </select>
                <select
                  value={divisionId}
                  onChange={e => setDivisionId(e.target.value)}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Academic Year</label>
              <select
                value={academicYearId}
                onChange={e => setAcademicYearId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {academicYears.map(a => (
                  <option key={a.id} value={a.id}>{a.year}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Weekly Theory Hours</label>
              <input
                type="number"
                min="0"
                value={theoryHours}
                onChange={e => setTheoryHours(parseInt(e.target.value, 10) || 0)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Weekly Practical Hours</label>
              <input
                type="number"
                min="0"
                value={practicalHours}
                onChange={e => setPracticalHours(parseInt(e.target.value, 10) || 0)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: '#475569' }}>Total Weekly Teaching Load:</span>
            <strong style={{ fontSize: '1rem', color: totalLoad > 18 ? '#DC2626' : '#059669' }}>
              {totalLoad} Hours / Week {totalLoad > 18 ? '(Heavy Workload Warning)' : '(Standard UGC Load)'}
            </strong>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Lead course coordinator for Semester 1 Programming..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Footer */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                background: 'var(--brand-navy, #0B1B3D)',
                borderColor: 'var(--brand-navy, #0B1B3D)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Assign Faculty Teaching Load</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
