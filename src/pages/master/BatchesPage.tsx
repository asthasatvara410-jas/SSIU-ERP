import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Batch } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';

export const BatchesPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [batches, setBatches] = useState<Batch[]>(() => db.getBatches());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Batch | null>(null);
  const [deletingItem, setDeletingItem] = useState<Batch | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [programId, setProgramId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [startYear, setStartYear] = useState(2024);
  const [endYear, setEndYear] = useState(2028);
  const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();

  const refreshData = () => {
    setBatches([...db.getBatches()]);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('Batch 2024-2028');
    setProgramId(programs[0]?.id || '');
    setAcademicYearId(academicYears[0]?.id || '');
    setStartYear(2024);
    setEndYear(2028);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Batch) => {
    setEditingItem(item);
    setName(item.name);
    setProgramId(item.programId);
    setAcademicYearId(item.academicYearId);
    setStartYear(item.startYear);
    setEndYear(item.endYear);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Batch>('batches', editingItem.id, {
        name, programId, academicYearId, startYear, endYear, status
      }, `Updated Batch ${name}`);
    } else {
      db.addEntity<Batch>('batches', {
        name, programId, academicYearId, startYear, endYear, status
      }, `Created Batch ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('batches', deletingItem.id, `Deleted Batch ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Batch>[] = [
    { key: 'name', header: 'Batch Name', sortable: true, accessor: b => <strong>{b.name}</strong> },
    {
      key: 'programId',
      header: 'Program',
      sortable: true,
      accessor: b => {
        const prog = db.getProgramById(b.programId);
        return <Badge variant="navy">{prog?.code || '-'}</Badge>;
      }
    },
    {
      key: 'startYear',
      header: 'Span',
      sortable: true,
      accessor: b => `${b.startYear} - ${b.endYear}`
    },
    { key: 'status', header: 'Status', sortable: true }
  ];

  return (
    <div>
      <DataTable
        title="Student Batches Master Data"
        subtitle="Manage student cohort batches per degree program"
        data={batches}
        columns={columns}
        searchPlaceholder="Search batch..."
        onAddClick={handleOpenAddModal}
        addLabel="Add Batch"
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-batches"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Batch' : 'Add New Batch'}
        subtitle="Specify program cohort details"
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

          <div className="form-group">
            <label className="form-label">Batch Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Batch 2024-2028" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Year</label>
              <input type="number" className="form-input" value={startYear} onChange={e => setStartYear(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Year</label>
              <input type="number" className="form-input" value={endYear} onChange={e => setEndYear(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Batch' : 'Save Batch'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Batch"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
