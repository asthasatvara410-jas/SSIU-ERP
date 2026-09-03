import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Division } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';

export const DivisionsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>(() => db.getDivisions());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Division | null>(null);
  const [deletingItem, setDeletingItem] = useState<Division | null>(null);

  // Form state
  const [name, setName] = useState('Div A');
  const [programId, setProgramId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [capacity, setCapacity] = useState(60);
  const [roomNo, setRoomNo] = useState('A-201');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const programs = db.getPrograms();
  const batches = db.getBatches();
  const semesters = db.getSemesters();

  const refreshData = () => {
    setDivisions([...db.getDivisions()]);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('Div A');
    setProgramId(programs[0]?.id || '');
    setBatchId(batches[0]?.id || '');
    setSemesterId(semesters[0]?.id || '');
    setCapacity(60);
    setRoomNo('A-201');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Division) => {
    setEditingItem(item);
    setName(item.name);
    setProgramId(item.programId);
    setBatchId(item.batchId);
    setSemesterId(item.semesterId);
    setCapacity(item.capacity);
    setRoomNo(item.roomNo);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Division>('divisions', editingItem.id, {
        name, programId, batchId, semesterId, capacity, roomNo, status
      }, `Updated Division ${name}`);
    } else {
      db.addEntity<Division>('divisions', {
        name, programId, batchId, semesterId, capacity, roomNo, status
      }, `Created Division ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('divisions', deletingItem.id, `Deleted Division ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Division>[] = [
    { key: 'name', header: 'Division', sortable: true, accessor: d => <strong>{d.name}</strong> },
    {
      key: 'programId',
      header: 'Program',
      sortable: true,
      accessor: d => {
        const prog = db.getProgramById(d.programId);
        return <Badge variant="navy">{prog?.code || '-'}</Badge>;
      }
    },
    {
      key: 'semesterId',
      header: 'Semester',
      sortable: true,
      accessor: d => {
        const sem = db.getSemesters().find(s => s.id === d.semesterId);
        return sem?.code || '-';
      }
    },
    { key: 'roomNo', header: 'Classroom', sortable: true, accessor: d => `Room ${d.roomNo}` },
    { key: 'capacity', header: 'Student Capacity', sortable: true, accessor: d => `${d.capacity} Students` },
    { key: 'status', header: 'Status', sortable: true }
  ];

  return (
    <div>
      <DataTable
        title="Divisions Master Data"
        subtitle="Manage class divisions, room numbers, and student capacity limits"
        data={divisions}
        columns={columns}
        searchPlaceholder="Search division, room..."
        onAddClick={handleOpenAddModal}
        addLabel="Add Division"
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-divisions"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Division' : 'Add Division'}
        subtitle="Configure division classroom & capacity"
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
              <label className="form-label">Batch *</label>
              <select className="form-select" value={batchId} onChange={e => setBatchId(e.target.value)} required>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select className="form-select" value={semesterId} onChange={e => setSemesterId(e.target.value)} required>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.code} (Sem {s.number})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Division Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Div A" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Classroom No *</label>
              <input type="text" className="form-input" placeholder="e.g. A-201" value={roomNo} onChange={e => setRoomNo(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input type="number" className="form-input" value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
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
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Division' : 'Save Division'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Division"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
