import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Institute } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';

export const InstitutesPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [institutes, setInstitutes] = useState<Institute[]>(() => db.getInstitutes());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Institute | null>(null);
  const [deletingItem, setDeletingItem] = useState<Institute | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Institute['type']>('Engineering');
  const [principalName, setPrincipalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [establishedYear, setEstablishedYear] = useState(2020);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const refreshData = () => {
    setInstitutes([...db.getInstitutes()]);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setType('Engineering');
    setPrincipalName('');
    setEmail('');
    setPhone('');
    setLocation('Swarrnim Campus, Gandhinagar');
    setEstablishedYear(2020);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Institute) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setType(item.type);
    setPrincipalName(item.principalName || '');
    setEmail(item.email);
    setPhone(item.phone);
    setLocation(item.location);
    setEstablishedYear(item.establishedYear);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Institute>('institutes', editingItem.id, {
        code, name, type, principalName, email, phone, location, establishedYear, status
      }, `Updated Institute ${name}`);
    } else {
      db.addEntity<Institute>('institutes', {
        code, name, type, principalName, email, phone, location, establishedYear, status
      }, `Created new Institute ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('institutes', deletingItem.id, `Deleted Institute ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Institute>[] = [
    { key: 'code', header: 'Code', sortable: true, width: '100px', accessor: i => <strong>{i.code}</strong> },
    { key: 'name', header: 'Institute Name', sortable: true },
    { key: 'type', header: 'Type', sortable: true, accessor: i => <Badge variant="navy">{i.type}</Badge> },
    { key: 'principalName', header: 'Principal', sortable: true, accessor: i => i.principalName || '-' },
    { key: 'email', header: 'Contact Email', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status', sortable: true }
  ];

  return (
    <div>
      <DataTable
        title="Institutes Master Data"
        subtitle="Manage constituent colleges and institutes under Swarrnim University"
        data={institutes}
        columns={columns}
        searchPlaceholder="Search institute by code, name, principal..."
        searchFields={['code', 'name', 'principalName', 'type']}
        onAddClick={handleOpenAddModal}
        addLabel="Add Institute"
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-institutes"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Institute' : 'Add New Institute'}
        subtitle="Enter constituent institute details below"
      >
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Institute Code *</label>
              <input type="text" className="form-input" placeholder="e.g. SSCIT" value={code} onChange={e => setCode(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Institute Type *</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as any)}>
                <option value="Engineering">Engineering</option>
                <option value="Management">Management</option>
                <option value="Design">Design</option>
                <option value="Architecture">Architecture</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Science">Science</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Institute Name *</label>
            <input type="text" className="form-input" placeholder="Swarrnim School of Computer IT" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Principal Name</label>
              <input type="text" className="form-input" placeholder="e.g. Demo Principal 1" value={principalName} onChange={e => setPrincipalName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Established Year</label>
              <input type="number" className="form-input" value={establishedYear} onChange={e => setEstablishedYear(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" placeholder="principal.sscit@swarrnim.edu.in" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input type="text" className="form-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Campus Location</label>
              <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Institute' : 'Save Institute'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Institute"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
