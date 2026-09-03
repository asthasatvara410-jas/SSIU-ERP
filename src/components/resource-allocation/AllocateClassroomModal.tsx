import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Building2, Calendar, Clock, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { resourceAllocationService } from '../../services/resourceAllocationService';

interface AllocateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AllocateClassroomModal: React.FC<AllocateClassroomModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const academicYears = db.getAcademicYears();
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();
  const resources = db.getInstitutionalResources().filter(r => r.type === 'CLASSROOM' || r.type === 'SMART_CLASSROOM');

  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || 'ay-2026');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-cse');
  const [programId, setProgramId] = useState(programs[0]?.id || 'prog-1');
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || 'sem-1');
  const [divisionId, setDivisionId] = useState(divisions[0]?.id || 'div-1');
  const [resourceId, setResourceId] = useState(resources[0]?.id || '');
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
  const selectedResource = resources.find(r => r.id === resourceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resourceId) {
      setError('Please select an institutional classroom resource.');
      return;
    }

    const res = resourceAllocationService.allocateClassroom({
      academicYearId,
      instituteId: instId,
      departmentId,
      programId,
      semesterId,
      divisionId,
      resourceId,
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
              Allocate Institutional Classroom
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
              Centralized Academic Schedule & Real-Time Conflict Detection
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

          {/* Academic Placement */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Program *</label>
              <select
                value={programId}
                onChange={e => setProgramId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Classroom Resource *</label>
              <select
                required
                value={resourceId}
                onChange={e => setResourceId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.name}) • {r.building} • Cap: {r.capacity} seats {r.projectorAvailable ? '• Projector' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Schedule Type / Slot</label>
              <select
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="FULL_SEMESTER">Full Semester Exclusive Allocation</option>
                <option value="09:00 AM - 10:00 AM">Slot 1: 09:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 11:00 AM">Slot 2: 10:00 AM - 11:00 AM</option>
                <option value="11:15 AM - 12:15 PM">Slot 3: 11:15 AM - 12:15 PM</option>
                <option value="01:00 PM - 02:00 PM">Slot 4: 01:00 PM - 02:00 PM</option>
                <option value="02:00 PM - 03:00 PM">Slot 5: 02:00 PM - 03:00 PM</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Effective Period</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={e => setEffectiveTo(e.target.value)}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Allocation Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Primary theory lecture hall for 1st Year B.Tech Division A..."
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
              <span>Confirm Classroom Allocation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
