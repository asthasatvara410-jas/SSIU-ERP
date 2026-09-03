import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Department } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { EntityProfileModal } from '../../components/profile/EntityProfileModal';

export const DepartmentsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [departments, setDepartments] = useState<Department[]>(() => db.getDepartments());
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('ALL');

  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);
  const [deletingItem, setDeletingItem] = useState<Department | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instituteId, setInstituteId] = useState('');
  const [hodName, setHodName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const institutes = db.getInstitutes();

  const refreshData = () => {
    setDepartments([...db.getDepartments()]);
  };

  const filteredDepartments = useMemo(() => {
    if (selectedInstituteId === 'ALL') return departments;
    return departments.filter(d => d.instituteId === selectedInstituteId);
  }, [departments, selectedInstituteId]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setInstituteId(institutes[0]?.id || '');
    setHodName('');
    setEmail('');
    setPhone('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Department) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setInstituteId(item.instituteId);
    setHodName(item.hodName || '');
    setEmail(item.email);
    setPhone(item.phone);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Department>('departments', editingItem.id, {
        code, name, instituteId, hodName, email, phone, status
      }, `Updated Department ${name}`);
    } else {
      db.addEntity<Department>('departments', {
        code, name, instituteId, hodName, email, phone, status
      }, `Created new Department ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('departments', deletingItem.id, `Deleted Department ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Department>[] = [
    { key: 'code', header: 'Dept Code', sortable: true, width: '110px', accessor: d => <strong>{d.code}</strong> },
    { key: 'name', header: 'Department Name', sortable: true },
    {
      key: 'instituteId',
      header: 'Parent Institute',
      sortable: true,
      accessor: d => {
        const inst = db.getInstituteById(d.instituteId);
        return <Badge variant="navy">{inst?.code || 'SSCIT'}</Badge>;
      }
    },
    { key: 'hodName', header: 'HOD', sortable: true, accessor: d => d.hodName || '-' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status', sortable: true }
  ];

  return (
    <div>
      <DataTable
        title="Departments Master Data"
        subtitle="Manage academic departments under constituent institutes"
        data={filteredDepartments}
        columns={columns}
        searchPlaceholder="Search department by code, name, HOD..."
        searchFields={['code', 'name', 'hodName']}
        filterSlot={
          <select
            className="form-select"
            style={{ width: '220px', height: '38px', fontSize: '0.8125rem' }}
            value={selectedInstituteId}
            onChange={e => setSelectedInstituteId(e.target.value)}
          >
            <option value="ALL">All Institutes</option>
            {institutes.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
            ))}
          </select>
        }
        onAddClick={handleOpenAddModal}
        addLabel="Add Department"
        onViewClick={item => setViewingDepartment(item)}
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-departments"
      />

      <EntityProfileModal
        isOpen={Boolean(viewingDepartment)}
        onClose={() => setViewingDepartment(null)}
        entityType="department"
        entityId={viewingDepartment?.id || null}
        onEditClick={item => {
          setViewingDepartment(null);
          handleOpenEditModal(item);
        }}
        canMutate={canMutate()}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Department' : 'Add New Department'}
        subtitle="Enter department details and parent institute"
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Parent Institute *</label>
            <select className="form-select" value={instituteId} onChange={e => setInstituteId(e.target.value)} required>
              {institutes.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department Code *</label>
              <input type="text" className="form-input" placeholder="e.g. CSE" value={code} onChange={e => setCode(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Head of Department (HOD)</label>
              <input type="text" className="form-input" placeholder="e.g. Demo HOD 1" value={hodName} onChange={e => setHodName(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Department Name *</label>
            <input type="text" className="form-input" placeholder="Computer Science & Engineering" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact Email *</label>
              <input type="email" className="form-input" placeholder="hod.cse@swarrnim.edu.in" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="+91 98765 11101" value={phone} onChange={e => setPhone(e.target.value)} />
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
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Department' : 'Save Department'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
