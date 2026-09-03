import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Program } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { EntityProfileModal } from '../../components/profile/EntityProfileModal';

export const ProgramsPage: React.FC = () => {
  const { canMutate } = useAuth();
  const [programs, setPrograms] = useState<Program[]>(() => db.getPrograms());
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Program | null>(null);
  const [deletingItem, setDeletingItem] = useState<Program | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [degreeType, setDegreeType] = useState<Program['degreeType']>('B.Tech');
  const [durationYears, setDurationYears] = useState(4);
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [intakeCapacity, setIntakeCapacity] = useState(60);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const departments = db.getDepartments();

  const refreshData = () => {
    setPrograms([...db.getPrograms()]);
  };

  const filteredPrograms = useMemo(() => {
    if (selectedDeptId === 'ALL') return programs;
    return programs.filter(p => p.departmentId === selectedDeptId);
  }, [programs, selectedDeptId]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setDepartmentId(departments[0]?.id || '');
    setDegreeType('B.Tech');
    setDurationYears(4);
    setTotalSemesters(8);
    setIntakeCapacity(60);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Program) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setDepartmentId(item.departmentId || '');
    setDegreeType(item.degreeType);
    setDurationYears(item.durationYears);
    setTotalSemesters(item.totalSemesters);
    setIntakeCapacity(item.intakeCapacity);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = db.getDepartmentById(departmentId);
    const instituteId = dept ? dept.instituteId : '';

    if (editingItem) {
      db.updateEntity<Program>('programs', editingItem.id, {
        code, name, departmentId, instituteId, degreeType, durationYears, totalSemesters, intakeCapacity, status
      }, `Updated Program ${name}`);
    } else {
      db.addEntity<Program>('programs', {
        code, name, departmentId, instituteId, degreeType, durationYears, totalSemesters, intakeCapacity, status
      }, `Created new Program ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('programs', deletingItem.id, `Deleted Program ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const columns: Column<Program>[] = [
    { key: 'code', header: 'Prog Code', sortable: true, width: '120px', accessor: p => <strong>{p.code}</strong> },
    { key: 'name', header: 'Program Name', sortable: true },
    {
      key: 'departmentId',
      header: 'Department',
      sortable: true,
      accessor: p => {
        const dept = db.getDepartmentById(p.departmentId);
        return <Badge variant="navy">{dept?.code || '-'}</Badge>;
      }
    },
    { key: 'degreeType', header: 'Degree', sortable: true, accessor: p => <Badge variant="orange">{p.degreeType}</Badge> },
    { key: 'durationYears', header: 'Duration', sortable: true, accessor: p => `${p.durationYears} Yrs (${p.totalSemesters} Sem)` },
    { key: 'intakeCapacity', header: 'Intake Capacity', sortable: true, accessor: p => <strong>{p.intakeCapacity} Seats</strong> },
    { key: 'status', header: 'Status', sortable: true }
  ];

  return (
    <div>
      <DataTable
        title="Academic Programs Master Data"
        subtitle="Manage degree programs, durations, and intake seats"
        data={filteredPrograms}
        columns={columns}
        searchPlaceholder="Search program by code, degree, name..."
        searchFields={['code', 'name', 'degreeType']}
        filterSlot={
          <select
            className="form-select"
            style={{ width: '240px', height: '38px', fontSize: '0.8125rem' }}
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        }
        onAddClick={handleOpenAddModal}
        addLabel="Add Program"
        onViewClick={item => setViewingProgram(item)}
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-programs"
      />

      <EntityProfileModal
        isOpen={Boolean(viewingProgram)}
        onClose={() => setViewingProgram(null)}
        entityType="program"
        entityId={viewingProgram?.id || null}
        onEditClick={item => {
          setViewingProgram(null);
          handleOpenEditModal(item);
        }}
        canMutate={canMutate()}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Academic Program' : 'Add New Program'}
        subtitle="Enter program specifications and intake capacity"
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Parent Department *</label>
            <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Program Code *</label>
              <input type="text" className="form-input" placeholder="e.g. BTECH-CSE" value={code} onChange={e => setCode(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Degree Type *</label>
              <select className="form-select" value={degreeType} onChange={e => setDegreeType(e.target.value as any)}>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
                <option value="B.Des">B.Des</option>
                <option value="M.Des">M.Des</option>
                <option value="B.Pharm">B.Pharm</option>
                <option value="B.Arch">B.Arch</option>
                <option value="Diploma">Diploma</option>
                <option value="Ph.D">Ph.D</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Program Name *</label>
            <input type="text" className="form-input" placeholder="B.Tech in Computer Engineering" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Duration (Years)</label>
              <input type="number" className="form-input" min={1} max={6} value={durationYears} onChange={e => {
                const yrs = Number(e.target.value);
                setDurationYears(yrs);
                setTotalSemesters(yrs * 2);
              }} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Semesters</label>
              <input type="number" className="form-input" min={1} max={12} value={totalSemesters} onChange={e => setTotalSemesters(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Intake Capacity</label>
              <input type="number" className="form-input" min={10} max={500} value={intakeCapacity} onChange={e => setIntakeCapacity(Number(e.target.value))} />
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
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Program' : 'Save Program'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Program"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
