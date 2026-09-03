import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Building2, UserCheck, Monitor, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { resourceAllocationService } from '../../services/resourceAllocationService';

interface AllocateLaboratoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AllocateLaboratoryModal: React.FC<AllocateLaboratoryModalProps> = ({
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
  const facultyList = db.getUsers().filter(u => u.role === 'FACULTY' || (u as any).isFaculty);
  const labResources = db.getInstitutionalResources().filter(r => r.type === 'LABORATORY' || r.type === 'COMPUTER_LAB' || r.type === 'WORKSHOP');

  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || 'ay-2026');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-cse');
  const [programId, setProgramId] = useState(programs[0]?.id || 'prog-1');
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || 'sem-1');
  const [divisionId, setDivisionId] = useState(divisions[0]?.id || 'div-1');
  const [resourceId, setResourceId] = useState(labResources[0]?.id || '');
  const [assignedFacultyId, setAssignedFacultyId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<'ALL' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('ALL');
  const [timeSlot, setTimeSlot] = useState('FULL_SEMESTER');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-07-01');
  const [effectiveTo, setEffectiveTo] = useState('2026-12-31');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetDept = departments.find(d => d.id === departmentId);
  const instId = targetDept?.instituteId || 'inst-1';
  const selectedLab = labResources.find(r => r.id === resourceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resourceId) {
      setError('Please select a laboratory resource.');
      return;
    }

    const res = resourceAllocationService.allocateLaboratory({
      academicYearId,
      instituteId: instId,
      departmentId,
      programId,
      semesterId,
      divisionId,
      resourceId,
      assignedFacultyId: assignedFacultyId || undefined,
      dayOfWeek: dayOfWeek === 'ALL' ? undefined : dayOfWeek,
      timeSlot,
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
        maxWidth: '680px',
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
              Allocate Institutional Laboratory
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
              PC Workstations • Specialized Instruments • Faculty In-Charge
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Academic Year *</label>
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

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Laboratory Resource *</label>
              <select
                required
                value={resourceId}
                onChange={e => setResourceId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {labResources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.roomNumber}) • {r.building} • {r.computerCount || 0} PCs • Cap: {r.capacity}
                  </option>
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Assigned Faculty In-Charge</label>
              <select
                value={assignedFacultyId}
                onChange={e => setAssignedFacultyId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="">-- No Specific Faculty Assigned --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Lab Specs Preview */}
          {selectedLab && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>
                Lab Equipment & Specifications:
              </div>
              <div style={{ color: '#475569' }}>
                PCs: <strong>{selectedLab.computerCount || 0}</strong> • Air Conditioned: <strong>{selectedLab.airConditioned ? 'Yes' : 'No'}</strong> • Projector: <strong>{selectedLab.projectorAvailable ? 'Yes' : 'No'}</strong>
              </div>
              {selectedLab.softwareInstalled && selectedLab.softwareInstalled.length > 0 && (
                <div style={{ marginTop: '0.25rem', color: '#0284C7' }}>
                  Installed Software: {selectedLab.softwareInstalled.join(', ')}
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Practical lab sessions for Data Structures and Algorithms..."
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
                background: 'var(--brand-orange, #F37023)',
                borderColor: 'var(--brand-orange, #F37023)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Confirm Laboratory Allocation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
