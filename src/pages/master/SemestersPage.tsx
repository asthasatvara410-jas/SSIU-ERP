import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Semester } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';

export const SemestersPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>(() => db.getSemesters());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Semester | null>(null);
  const [deletingItem, setDeletingItem] = useState<Semester | null>(null);

  // Form state
  const [number, setNumber] = useState(1);
  const [code, setCode] = useState('SEM-1');
  const [programId, setProgramId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED' | 'UPCOMING'>('ACTIVE');

  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();

  const refreshData = () => {
    setSemesters([...db.getSemesters()]);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNumber(1);
    setCode('SEM-1');
    setProgramId(programs[0]?.id || '');
    setAcademicYearId(academicYears[0]?.id || '');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Semester) => {
    setEditingItem(item);
    setNumber(item.number);
    setCode(item.code);
    setProgramId(item.programId);
    setAcademicYearId(item.academicYearId);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Semester>('semesters', editingItem.id, {
        number, code, programId, academicYearId, status
      }, `Updated Semester ${code}`);
    } else {
      db.addEntity<Semester>('semesters', {
        number, code, programId, academicYearId, status
      }, `Created Semester ${code}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('semesters', deletingItem.id, `Deleted Semester ${deletingItem.code}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Semester>[] = [
    { key: 'code', header: 'Sem Code', sortable: true, accessor: s => <strong>{s.code}</strong> },
    { key: 'number', header: 'Semester Number', sortable: true, accessor: s => `Semester ${s.number}` },
    {
      key: 'programId',
      header: 'Program',
      sortable: true,
      accessor: s => {
        const prog = db.getProgramById(s.programId);
        return <Badge variant="navy">{prog?.code || '-'}</Badge>;
      }
    },
    {
      key: 'academicYearId',
      header: 'Academic Year',
      sortable: true,
      accessor: s => {
        const ay = db.getAcademicYears().find(a => a.id === s.academicYearId);
        return ay?.name || '-';
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: s => (
        <Badge variant={s.status === 'ACTIVE' ? 'active' : (s.status === 'COMPLETED' ? 'navy' : 'warning')}>
          {s.status}
        </Badge>
      )
    }
  ];

  return (
    <div>
      <DataTable
        title="Semesters Master Data"
        subtitle="Configure semester terms for academic degree programs"
        data={semesters}
        columns={columns}
        searchPlaceholder="Search semester..."
        onAddClick={handleOpenAddModal}
        addLabel="Add Semester"
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-semesters"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Semester' : 'Add Semester'}
        subtitle="Configure semester term details"
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Program *</label>
            <select className="form-select" value={programId} onChange={e => setProgramId(e.target.value)} required>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Semester Number *</label>
              <input type="number" className="form-input" min={1} max={12} value={number} onChange={e => {
                const n = Number(e.target.value);
                setNumber(n);
                setCode(`SEM-${n}`);
              }} required />
            </div>
            <div className="form-group">
              <label className="form-label">Semester Code *</label>
              <input type="text" className="form-input" value={code} onChange={e => setCode(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year *</label>
            <select className="form-select" value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} required>
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>{ay.name} {ay.isCurrent ? '(Active Session)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Semester' : 'Save Semester'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Semester"
        message={`Are you sure you want to delete "${deletingItem?.code}"?`}
      />
    </div>
  );
};
