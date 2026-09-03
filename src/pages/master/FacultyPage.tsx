import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Faculty } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { FacultyProfileModal } from '../../components/profile/FacultyProfileModal';
import { BulkDataManagerModal } from '../../components/bulk-import/BulkDataManagerModal';
import { Eye } from 'lucide-react';

export const FacultyPage: React.FC = () => {
  const { user, role, canMutate } = useAuth();
  const [facultyList, setFacultyList] = useState<Faculty[]>(() => db.getFaculty());

  // Filter State
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedDesigFilter, setSelectedDesigFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modal State
  const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Faculty | null>(null);
  const [deletingItem, setDeletingItem] = useState<Faculty | null>(null);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [designation, setDesignation] = useState<Faculty['designation']>('Assistant Professor');
  const [instituteId, setInstituteId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [joiningDate, setJoiningDate] = useState('2021-08-01');
  const [dateOfBirth, setDateOfBirth] = useState('1988-04-12');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [status, setStatus] = useState<Faculty['status']>('ACTIVE');

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();

  const refreshData = () => {
    setFacultyList([...db.getFaculty()]);
  };

  // Role Scoped & Filtered Faculty List
  const scopedFaculty = useMemo(() => {
    let list = facultyList;

    // Apply Role Boundaries
    if (role === 'PRINCIPAL' && user?.instituteId) {
      list = list.filter(f => f.instituteId === user.instituteId);
    } else if ((role === 'HOD' || role === 'FACULTY') && user?.departmentId) {
      list = list.filter(f => f.departmentId === user.departmentId);
    }

    // Apply Filter Dropdowns
    if (selectedInstFilter !== 'ALL') {
      list = list.filter(f => f.instituteId === selectedInstFilter);
    }
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter(f => f.departmentId === selectedDeptFilter);
    }
    if (selectedDesigFilter !== 'ALL') {
      list = list.filter(f => f.designation === selectedDesigFilter);
    }
    if (selectedStatusFilter !== 'ALL') {
      list = list.filter(f => f.status === selectedStatusFilter);
    }

    return list;
  }, [facultyList, role, user, selectedInstFilter, selectedDeptFilter, selectedDesigFilter, selectedStatusFilter]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setEmployeeId(`EMP-CSE-00${facultyList.length + 1}`);
    setName('');
    setEmail('');
    setPhone('');
    setPhoto('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80');
    setDesignation('Assistant Professor');
    setInstituteId(user?.instituteId || institutes[0]?.id || '');
    setDepartmentId(user?.departmentId || departments[0]?.id || '');
    setQualification('M.Tech in Computer Engineering');
    setSpecialization('Software Engineering & AI');
    setJoiningDate('2022-08-01');
    setDateOfBirth('1989-03-25');
    setBloodGroup('B+');
    setAddress('Gandhinagar, Gujarat');
    setExperienceYears(4);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Faculty) => {
    setEditingItem(item);
    setEmployeeId(item.employeeId);
    setName(item.name);
    setEmail(item.email);
    setPhone(item.phone);
    setPhoto(item.photo || '');
    setDesignation(item.designation);
    setInstituteId(item.instituteId);
    setDepartmentId(item.departmentId || '');
    setQualification(item.qualification);
    setSpecialization(item.specialization || '');
    setJoiningDate(item.joiningDate || '');
    setDateOfBirth(item.dateOfBirth || '');
    setBloodGroup(item.bloodGroup || 'O+');
    setAddress(item.address || '');
    setExperienceYears(item.experienceYears);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Faculty>('faculty', editingItem.id, {
        employeeId, name, email, phone, photo, designation, instituteId, departmentId,
        qualification, specialization, joiningDate, dateOfBirth, bloodGroup, address, experienceYears, status
      }, `Updated Faculty record for ${name}`);
    } else {
      db.addEntity<Faculty>('faculty', {
        employeeId, name, email, phone, photo, designation, instituteId, departmentId,
        qualification, specialization, joiningDate, dateOfBirth, bloodGroup, address, experienceYears, subjectIds: [], status
      }, `Added new Faculty ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('faculty', deletingItem.id, `Deleted Faculty record for ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const getStatusBadge = (status: Faculty['status']) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="active">ACTIVE</Badge>;
      case 'ON_LEAVE': return <Badge variant="warning">ON LEAVE</Badge>;
      default: return <Badge variant="inactive">INACTIVE</Badge>;
    }
  };

  const columns: Column<Faculty>[] = [
    {
      key: 'name',
      header: 'Faculty Name & ID',
      sortable: true,
      accessor: f => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={f.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80'}
            alt={f.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--brand-orange)' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{f.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.employeeId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true,
      accessor: f => <Badge variant="orange">{f.designation}</Badge>
    },
    {
      key: 'departmentId',
      header: 'Institute / Dept',
      accessor: f => {
        const inst = db.getInstituteById(f.instituteId);
        const dept = db.getDepartmentById(f.departmentId);
        return `${inst?.code || ''} • ${dept?.code || ''}`;
      }
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status', sortable: true, accessor: f => getStatusBadge(f.status) }
  ];

  return (
    <div>
      <DataTable
        title="Faculty Management Directory"
        subtitle="Manage faculty profiles, academic designations, and department affiliations"
        data={scopedFaculty}
        columns={columns}
        searchPlaceholder="Search faculty by name, ID, designation..."
        searchFields={['name', 'employeeId', 'designation', 'email']}
        filterSlot={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Institute Filter */}
            {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') && (
              <select className="form-select" style={{ width: '160px', height: '38px', fontSize: '0.8125rem' }} value={selectedInstFilter} onChange={e => setSelectedInstFilter(e.target.value)}>
                <option value="ALL">All Institutes</option>
                {institutes.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.code}</option>
                ))}
              </select>
            )}

            {/* Dept Filter */}
            {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL') && (
              <select className="form-select" style={{ width: '160px', height: '38px', fontSize: '0.8125rem' }} value={selectedDeptFilter} onChange={e => setSelectedDeptFilter(e.target.value)}>
                <option value="ALL">All Depts</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
            )}

            {/* Designation Filter */}
            <select className="form-select" style={{ width: '170px', height: '38px', fontSize: '0.8125rem' }} value={selectedDesigFilter} onChange={e => setSelectedDesigFilter(e.target.value)}>
              <option value="ALL">All Designations</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Adjunct">Adjunct</option>
            </select>

            {/* Status Filter */}
            <select className="form-select" style={{ width: '140px', height: '38px', fontSize: '0.8125rem' }} value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        }
        onAddClick={handleOpenAddModal}
        addLabel="Add Faculty"
        onBulkImportClick={() => setIsBulkModalOpen(true)}
        bulkImportLabel="Bulk Import"
        onViewClick={item => setViewingFaculty(item)}
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-faculty"
      />

      {/* Universal Bulk Data Management Modal */}
      <BulkDataManagerModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialType="FACULTY"
        onSuccess={refreshData}
      />

      {/* Faculty Profile Detail Modal */}
      <FacultyProfileModal
        isOpen={!!viewingFaculty}
        onClose={() => setViewingFaculty(null)}
        faculty={viewingFaculty}
        onEditClick={handleOpenEditModal}
        canMutate={canMutate()}
      />

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Faculty Record' : 'Add New Faculty Member'}
        subtitle="Configure faculty credentials, qualifications, and joining date"
        maxWidth="740px"
      >
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input type="text" className="form-input" placeholder="e.g. EMP-CSE-001" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Designation *</label>
              <select className="form-select" value={designation} onChange={e => setDesignation(e.target.value as any)}>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Adjunct">Adjunct</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Demo Faculty 1" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Designation *</label>
            <select className="form-select" value={designation} onChange={e => setDesignation(e.target.value as any)}>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Professor">Professor</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Adjunct">Adjunct</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Institutional Email *</label>
              <input type="email" className="form-input" placeholder="demo.faculty1@ssiu-demo.ac.in" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input type="text" className="form-input" placeholder="+91 98765 22002" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Institute *</label>
              <select className="form-select" value={instituteId} onChange={e => setInstituteId(e.target.value)} required>
                {institutes.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Highest Qualification</label>
              <input type="text" className="form-input" placeholder="Ph.D. in Computer Science" value={qualification} onChange={e => setQualification(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Research Specialization</label>
              <input type="text" className="form-input" placeholder="Artificial Intelligence & Algorithms" value={specialization} onChange={e => setSpecialization(e.target.value)} />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input type="number" className="form-input" value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <input type="text" className="form-input" placeholder="Swarrnim Staff Quarters, Gandhinagar" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Faculty Record' : 'Save Faculty'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Faculty Record"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
    </div>
  );
};
