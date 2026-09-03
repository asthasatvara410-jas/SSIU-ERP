import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { AcademicYear } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';

export const AcademicYearsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => db.getAcademicYears());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [deletingItem, setDeletingItem] = useState<AcademicYear | null>(null);

  // Form state
  const [name, setName] = useState('2025-2026');
  const [startDate, setStartDate] = useState('2025-07-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [isCurrent, setIsCurrent] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const refreshData = () => {
    setAcademicYears([...db.getAcademicYears()]);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('2025-2026');
    setStartDate('2025-07-01');
    setEndDate('2026-06-30');
    setIsCurrent(false);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AcademicYear) => {
    setEditingItem(item);
    setName(item.name);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setIsCurrent(item.isCurrent);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrent) {
      // Unset current flag on other years
      academicYears.forEach(ay => {
        if (ay.id !== editingItem?.id) db.updateEntity<AcademicYear>('academicYears', ay.id, { isCurrent: false });
      });
    }

    if (editingItem) {
      db.updateEntity<AcademicYear>('academicYears', editingItem.id, {
        name, startDate, endDate, isCurrent, status
      }, `Updated Academic Year ${name}`);
    } else {
      db.addEntity<AcademicYear>('academicYears', {
        name, startDate, endDate, isCurrent, status
      }, `Created Academic Year ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('academicYears', deletingItem.id, `Deleted Academic Year ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<AcademicYear>[] = [
    { key: 'name', header: 'Academic Year', sortable: true, accessor: ay => <strong>{ay.name}</strong> },
    { key: 'startDate', header: 'Start Date', sortable: true },
    { key: 'endDate', header: 'End Date', sortable: true },
    {
      key: 'isCurrent',
      header: 'Session Status',
      sortable: true,
      accessor: ay => ay.isCurrent ? <Badge variant="orange">CURRENT SESSION</Badge> : <Badge variant="navy">Standard</Badge>
    },
    { key: 'status', header: 'Status', sortable: true }
  ];

  return (
    <div>
      <DataTable
        title="Academic Years Master Data"
        subtitle="Configure active university academic calendars and terms"
        data={academicYears}
        columns={columns}
        searchPlaceholder="Search academic year..."
        onAddClick={handleOpenAddModal}
        addLabel="Add Academic Year"
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-academic-years"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Academic Year' : 'Add Academic Year'}
        subtitle="Set start & end dates for university academic year"
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Academic Year Name *</label>
            <input type="text" className="form-input" placeholder="e.g. 2025-2026" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input type="checkbox" id="isCurrent" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} />
            <label htmlFor="isCurrent" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Set as Current Active Session</label>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Year' : 'Save Year'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Academic Year"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
