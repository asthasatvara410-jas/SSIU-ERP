import React, { useState } from 'react';
import { 
  Building2, ArrowRight, CheckCircle2, AlertTriangle, 
  Layers, Users, Sparkles, RefreshCw, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { resourceAllocationService } from '../../services/resourceAllocationService';
import { InstitutionalResource } from '../../types';

export const ClassroomAllocationBoard: React.FC = () => {
  const { user } = useAuth();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();
  const allResources = db.getInstitutionalResources();
  const allocations = db.getClassroomAllocations().filter(a => a.status === 'ALLOCATED');

  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || 'dept-cse');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const availableClassrooms = allResources.filter(
    r => (r.type === 'CLASSROOM' || r.type === 'SMART_CLASSROOM') &&
         !allocations.some(a => a.resourceId === r.id)
  );

  const targetDept = departments.find(d => d.id === selectedDeptId);
  const deptPrograms = programs.filter(p => p.departmentId === selectedDeptId);

  const handleDragStart = (e: React.DragEvent, resId: string) => {
    e.dataTransfer.setData('text/plain', resId);
    setDraggedResourceId(resId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDivision = (programId: string, semesterId: string, divisionId: string) => {
    if (!draggedResourceId) return;

    const res = allResources.find(r => r.id === draggedResourceId);
    if (!res) return;

    const prog = programs.find(p => p.id === programId);
    const div = divisions.find(d => d.id === divisionId);

    const allocResult = resourceAllocationService.allocateClassroom({
      academicYearId: 'ay-2026',
      instituteId: targetDept?.instituteId || 'inst-1',
      departmentId: selectedDeptId,
      programId,
      semesterId,
      divisionId,
      resourceId: res.id,
      dayOfWeek: undefined,
      timeSlot: 'FULL_SEMESTER',
      effectiveFrom: '2026-07-01',
      effectiveTo: '2026-12-31',
      remarks: `Drag & Drop quick assignment to ${prog?.name} ${div?.name}`
    }, user || { id: 'admin', name: 'Central Admin', role: 'STUDENT_ADMIN' } as any);

    if (allocResult.success) {
      setToastMessage(`✅ ${res.roomNumber} allocated to ${div?.name} (${prog?.name})`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage(`❌ ${allocResult.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
    setDraggedResourceId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          padding: '0.75rem 1.25rem',
          background: toastMessage.startsWith('✅') ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${toastMessage.startsWith('✅') ? '#6EE7B7' : '#FCA5A5'}`,
          borderRadius: '8px',
          color: toastMessage.startsWith('✅') ? '#065F46' : '#991B1B',
          fontSize: '0.8125rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        padding: '1rem',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={18} style={{ color: 'var(--brand-orange, #F37023)' }} />
          <div>
            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>Visual Drag & Drop Classroom Allocation Board</strong>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0 0' }}>
              Drag unallocated classrooms from the store and drop them onto department academic divisions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Select Department:</span>
          <select
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Board Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem' }}>
        {/* Left Column: Available Classrooms */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: '650px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.8125rem', color: '#1E293B', textTransform: 'uppercase' }}>
              Available Classrooms ({availableClassrooms.length})
            </strong>
          </div>

          {availableClassrooms.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem' }}>
              All classrooms are currently allocated.
            </div>
          ) : (
            availableClassrooms.map(cr => (
              <div
                key={cr.id}
                draggable
                onDragStart={e => handleDragStart(e, cr.id)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: 'grab',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>{cr.roomNumber}</strong>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', background: 'rgba(243, 112, 35, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    {cr.capacity} seats
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                  {cr.building} • {cr.floor}
                </div>
                {cr.projectorAvailable && (
                  <div style={{ fontSize: '0.68rem', color: '#10B981', marginTop: '0.25rem', fontWeight: 700 }}>
                    ✓ Projector Available
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Department Academic Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deptPrograms.map(prog => (
            <div key={prog.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
                {prog.name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {semesters.slice(0, 4).map(sem => {
                  const div = divisions[0];
                  const existingAlloc = allocations.find(
                    a => a.programId === prog.id && a.semesterId === sem.id && a.divisionId === div?.id
                  );

                  return (
                    <div
                      key={sem.id}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnDivision(prog.id, sem.id, div?.id || 'div-1')}
                      style={{
                        background: existingAlloc ? '#F0FDF4' : '#F8FAFC',
                        border: `2px dashed ${existingAlloc ? '#86EFAC' : '#CBD5E1'}`,
                        borderRadius: '8px',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '110px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: '#1E293B' }}>
                          Sem {sem.number} • {div?.name || 'Div A'}
                        </span>
                        {existingAlloc && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16A34A' }}>Allocated</span>
                        )}
                      </div>

                      {existingAlloc ? (
                        <div style={{ marginTop: '0.5rem', background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: '6px', padding: '0.5rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: '#065F46' }}>
                            Room {existingAlloc.roomNumber}
                          </strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {existingAlloc.building} (Cap: {existingAlloc.capacity})
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '0.5rem 0', color: '#94A3B8', fontSize: '0.72rem' }}>
                          Drop Available Classroom Here
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
