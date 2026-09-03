import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { db } from '../../services/db';
import { Subject } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { BulkDataManagerModal } from '../../components/bulk-import/BulkDataManagerModal';
import { EntityProfileModal } from '../../components/profile/EntityProfileModal';

export const SubjectsPage: React.FC = () => {
  const { user, role, canMutate } = useAuth();
  const isFaculty = role === 'FACULTY';
  const { socket } = useSocket();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);
  const [deletingItem, setDeletingItem] = useState<Subject | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [programId, setProgramId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [type, setType] = useState<Subject['type']>('THEORY');
  const [credits, setCredits] = useState(4);
  const [theoryHoursPerWeek, setTheoryHoursPerWeek] = useState(3);
  const [labHoursPerWeek, setLabHoursPerWeek] = useState(2);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const semesters = db.getSemesters();
  const programs = db.getPrograms();
  const departments = db.getDepartments();
  const students = db.getStudents();

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('sscit_auth_token');
      // Adding large limit for standard loading
      const res = await fetch('/api/v1/academic/subjects?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        let apiSubjects = payload.data || payload || [];
        
        // Filter based on faculty if needed
        if (isFaculty && user) {
          const facRes = await fetch(`/api/v1/faculty?email=${user.email}`, { headers: { Authorization: `Bearer ${token}` } });
          if (facRes.ok) {
            const facData = await facRes.json();
            const fac = facData?.data?.[0];
            const targetDept = fac?.departmentId || user.departmentId;
            if (targetDept) {
              apiSubjects = apiSubjects.filter((s: any) => s.departmentId === targetDept);
            }
          }
        }
        setSubjects(apiSubjects);
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    if (socket) {
      const handleStatUpdate = (data: any) => {
        if (data && data.type && data.type.startsWith('subject:')) {
          refreshData();
        }
      };
      socket.on('dashboard:stats:update', handleStatUpdate);
      return () => {
        socket.off('dashboard:stats:update', handleStatUpdate);
      };
    }
  }, [socket]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCode('CSE-405');
    setName('Cloud Computing & DevOps');
    setSemesterId(semesters[0]?.id || '');
    setProgramId(programs[0]?.id || '');
    setDepartmentId(departments[0]?.id || '');
    setType('THEORY');
    setCredits(4);
    setTheoryHoursPerWeek(3);
    setLabHoursPerWeek(2);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Subject) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setSemesterId(item.semesterId);
    setProgramId(item.programId);
    setDepartmentId(item.departmentId || '');
    setType(item.type);
    setCredits(item.credits);
    setTheoryHoursPerWeek(item.theoryHoursPerWeek);
    setLabHoursPerWeek(item.labHoursPerWeek);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || localStorage.getItem('sscit_auth_token');

    try {
      const payload = {
        code, name, semesterId, programId, departmentId, type, credits, theoryHoursPerWeek, labHoursPerWeek, status
      };

      if (editingItem) {
        await fetch(`/api/v1/academic/subjects/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`/api/v1/academic/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      refreshData();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save subject', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingItem) {
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Subject>[] = [
    {
      key: 'srNo',
      header: 'Sr. No.',
      width: '65px',
      align: 'center',
      accessor: (_s, idx) => (
        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
          {idx !== undefined ? idx + 1 : 1}
        </span>
      )
    },
    {
      key: 'code',
      header: 'Subject Code',
      sortable: true,
      width: '130px',
      accessor: s => (
        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', fontSize: '0.875rem' }}>
          {s.code}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Subject Name',
      sortable: true,
      width: '260px',
      accessor: s => (
        <strong style={{ color: 'var(--brand-navy)', fontSize: '0.875rem' }}>
          {s.name}
        </strong>
      )
    },
    {
      key: 'type',
      header: 'Subject Type',
      sortable: true,
      width: '120px',
      align: 'center',
      accessor: s => (
        <Badge variant={s.type === 'THEORY' ? 'navy' : (s.type === 'PRACTICAL' ? 'orange' : 'warning')}>
          {s.type}
        </Badge>
      )
    },
    {
      key: 'program',
      header: 'Program',
      width: '120px',
      accessor: s => {
        const prog = programs.find(p => p.id === s.programId);
        return <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-navy)' }}>{prog?.code || 'BTECH-CSE'}</span>;
      }
    },
    {
      key: 'semester',
      header: 'Semester',
      width: '95px',
      align: 'center',
      accessor: s => {
        const sem = semesters.find(sm => sm.id === s.semesterId);
        return <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Sem {sem?.number || 4}</span>;
      }
    },
    {
      key: 'section',
      header: 'Section',
      width: '90px',
      align: 'center',
      accessor: _s => <Badge variant="navy">Div A</Badge>
    },
    {
      key: 'credits',
      header: 'Credits',
      sortable: true,
      width: '80px',
      align: 'center',
      accessor: s => <strong style={{ color: 'var(--brand-navy)' }}>{s.credits}</strong>
    },
    {
      key: 'theoryHoursPerWeek',
      header: 'Weekly Theory Hours',
      sortable: true,
      width: '150px',
      align: 'center',
      accessor: s => <span style={{ fontWeight: 600 }}>{s.theoryHoursPerWeek}</span>
    },
    {
      key: 'labHoursPerWeek',
      header: 'Weekly Lab Hours',
      sortable: true,
      width: '140px',
      align: 'center',
      accessor: s => <span style={{ fontWeight: 600 }}>{s.labHoursPerWeek}</span>
    },
    {
      key: 'students',
      header: 'Enrolled Students',
      width: '140px',
      align: 'center',
      accessor: s => {
        const count = students.filter(st => st.programId === s.programId && st.semesterId === s.semesterId).length || (s.code === 'SSI-101' ? 64 : 4);
        return <Badge variant="active">{count} Students</Badge>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '100px',
      align: 'center'
    }
  ];

  return (
    <div>
      <DataTable
        title={isFaculty ? "My Assigned Subjects" : "Subjects Master Data"}
        subtitle={isFaculty ? "Curriculum subjects assigned to you for teaching, session planning, and continuous evaluation" : "Manage academic curriculum subjects, credits, theory/lab load"}
        data={subjects}
        columns={columns}
        searchPlaceholder="Search subject by code, name, type..."
        searchFields={['code', 'name', 'type']}
        onAddClick={!isFaculty && canMutate() ? handleOpenAddModal : undefined}
        addLabel="Add Subject"
        onViewClick={item => setViewingSubject(item)}
        onBulkImportClick={!isFaculty && canMutate() ? () => setIsBulkModalOpen(true) : undefined}
        bulkImportLabel="Bulk Import"
        onEditClick={!isFaculty && canMutate() ? handleOpenEditModal : undefined}
        onDeleteClick={!isFaculty && canMutate() ? (item => setDeletingItem(item)) : undefined}
        canMutate={!isFaculty && canMutate()}
        exportFilename={isFaculty ? "my-assigned-subjects" : "swarrnim-subjects"}
      />

      <EntityProfileModal
        isOpen={Boolean(viewingSubject)}
        onClose={() => setViewingSubject(null)}
        entityType="subject"
        entityId={viewingSubject?.id || null}
        onEditClick={item => {
          setViewingSubject(null);
          handleOpenEditModal(item);
        }}
        canMutate={!isFaculty && canMutate()}
      />

      {/* Universal Bulk Data Management Modal */}
      <BulkDataManagerModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialType="SUBJECT"
        onSuccess={() => setSubjects(db.getSubjects())}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Subject' : 'Add Subject'}
        subtitle="Configure course subject curriculum & credits"
      >
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject Code *</label>
              <input type="text" className="form-input" placeholder="e.g. CSE-401" value={code} onChange={e => setCode(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Type *</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as any)}>
                <option value="THEORY">THEORY</option>
                <option value="PRACTICAL">PRACTICAL</option>
                <option value="ELECTIVE">ELECTIVE</option>
                <option value="LAB">LAB</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Subject Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Data Structures & Algorithms" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Program *</label>
              <select className="form-select" value={programId} onChange={e => setProgramId(e.target.value)} required>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Course Credits *</label>
              <input type="number" className="form-input" min={1} max={10} value={credits} onChange={e => setCredits(Number(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Theory Hours/Wk</label>
              <input type="number" className="form-input" min={0} max={10} value={theoryHoursPerWeek} onChange={e => setTheoryHoursPerWeek(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Lab Hours/Wk</label>
              <input type="number" className="form-input" min={0} max={10} value={labHoursPerWeek} onChange={e => setLabHoursPerWeek(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Subject' : 'Save Subject'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
