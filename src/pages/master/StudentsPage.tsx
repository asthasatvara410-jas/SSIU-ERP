import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Student } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { StudentProfileModal } from '../../components/profile/StudentProfileModal';
import { MentorAssignmentTab } from '../../components/mentor/MentorAssignmentTab';
import { BulkDataManagerModal } from '../../components/bulk-import/BulkDataManagerModal';
import { StudentOnboardingTab } from '../../components/admission/StudentOnboardingTab';
import { Eye, Users, UserCheck, UserPlus } from 'lucide-react';

interface StudentsPageProps {
  initialTab?: 'DIRECTORY' | 'ONBOARDING' | 'MENTOR_ASSIGNMENT';
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ initialTab = 'DIRECTORY' }) => {
  const { user, role, canMutate } = useAuth();
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ONBOARDING' | 'MENTOR_ASSIGNMENT'>(initialTab);
  const [students, setStudents] = useState<Student[]>(() => db.getStudents());

  // Filter Dropdowns State
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedProgFilter, setSelectedProgFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals State
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [deletingItem, setDeletingItem] = useState<Student | null>(null);

  // Form State
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('2004-05-15');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [admissionDate, setAdmissionDate] = useState('2024-07-15');
  
  const [instituteId, setInstituteId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [status, setStatus] = useState<Student['status']>('ACTIVE');

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const batches = db.getBatches();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();

  const refreshData = () => {
    setStudents([...db.getStudents()]);
  };

  // Role Scoped & Filtered Students
  const scopedStudents = useMemo(() => {
    let list = students;

    // Apply Role Boundaries
    if (role === 'PRINCIPAL' && user?.instituteId) {
      list = list.filter(s => s.instituteId === user.instituteId);
    } else if ((role === 'HOD' || role === 'FACULTY') && user?.departmentId) {
      list = list.filter(s => s.departmentId === user.departmentId);
    } else if (role === 'STUDENT' && user?.enrollmentNo) {
      list = list.filter(s => s.enrollmentNo === user.enrollmentNo);
    }

    // Apply Filter Dropdowns
    if (selectedInstFilter !== 'ALL') {
      list = list.filter(s => s.instituteId === selectedInstFilter);
    }
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter(s => s.departmentId === selectedDeptFilter);
    }
    if (selectedProgFilter !== 'ALL') {
      list = list.filter(s => s.programId === selectedProgFilter);
    }
    if (selectedStatusFilter !== 'ALL') {
      list = list.filter(s => s.status === selectedStatusFilter);
    }

    return list;
  }, [students, role, user, selectedInstFilter, selectedDeptFilter, selectedProgFilter, selectedStatusFilter]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setEnrollmentNo(`24010100${students.length + 1}`);
    setName('');
    setEmail('');
    setPhone('');
    setPhoto('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80');
    setGender('Male');
    setDateOfBirth('2004-05-15');
    setBloodGroup('O+');
    setAddress('Gandhinagar, Gujarat');
    setAdmissionDate('2024-07-15');
    setInstituteId(user?.instituteId || institutes[0]?.id || '');
    setDepartmentId(user?.departmentId || departments[0]?.id || '');
    setProgramId(programs[0]?.id || '');
    setBatchId(batches[0]?.id || '');
    setSemesterId(semesters[0]?.id || '');
    setDivisionId(divisions[0]?.id || '');
    setGuardianName('');
    setGuardianPhone('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Student) => {
    setEditingItem(item);
    setEnrollmentNo(item.enrollmentNo);
    setName(item.name);
    setEmail(item.email);
    setPhone(item.phone);
    setPhoto(item.photo || '');
    setGender((item.gender as 'Male' | 'Female' | 'Other') || 'Male');
    setDateOfBirth(item.dateOfBirth || '');
    setBloodGroup(item.bloodGroup || 'O+');
    setAddress(item.address || '');
    setAdmissionDate(item.admissionDate || '');
    setInstituteId(item.instituteId);
    setDepartmentId(item.departmentId || '');
    setProgramId(item.programId);
    setBatchId(item.batchId);
    setSemesterId(item.semesterId);
    setDivisionId(item.divisionId);
    setGuardianName(item.guardianName || '');
    setGuardianPhone(item.guardianPhone || '');
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      db.updateEntity<Student>('students', editingItem.id, {
        enrollmentNo, name, email, phone, photo, gender, dateOfBirth, bloodGroup, address, admissionDate,
        instituteId, departmentId, programId, batchId, semesterId, divisionId, guardianName, guardianPhone, status
      }, `Updated Student record for ${name}`);
    } else {
      db.addEntity<Student>('students', {
        enrollmentNo, name, email, phone, photo, gender, dateOfBirth, bloodGroup, address, admissionDate,
        instituteId, departmentId, programId, batchId, semesterId, divisionId, guardianName, guardianPhone, status
      }, `Registered new Student ${name}`);
    }
    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      db.deleteEntity('students', deletingItem.id, `Deleted Student record for ${deletingItem.name}`);
      refreshData();
      setDeletingItem(null);
    }
  };

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="active">ACTIVE</Badge>;
      case 'GRADUATED': return <Badge variant="navy">GRADUATED</Badge>;
      case 'SUSPENDED': return <Badge variant="danger">SUSPENDED</Badge>;
      default: return <Badge variant="inactive">INACTIVE</Badge>;
    }
  };

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student Name & ID',
      sortable: true,
      accessor: s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80'}
            alt={s.name}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--brand-orange)' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{s.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.enrollmentNo}</div>
          </div>
        </div>
      )
    },
    {
      key: 'programId',
      header: 'Program',
      sortable: true,
      accessor: s => {
        const prog = db.getProgramById(s.programId);
        return <Badge variant="orange">{prog?.code || '-'}</Badge>;
      }
    },
    {
      key: 'departmentId',
      header: 'Institute / Dept',
      accessor: s => {
        const inst = db.getInstituteById(s.instituteId);
        const dept = db.getDepartmentById(s.departmentId);
        return `${inst?.code || ''} • ${dept?.code || ''}`;
      }
    },
    {
      key: 'divisionId',
      header: 'Division & Sem',
      accessor: s => {
        const sem = db.getSemesterById(s.semesterId);
        const div = db.getDivisionById(s.divisionId);
        return `${sem?.code || ''} (${div?.name || '-'})`;
      }
    },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status', sortable: true, accessor: s => getStatusBadge(s.status) },
    {
      key: 'id',
      header: 'Documents Vault',
      accessor: s => {
        const docs = db.getStudentDocumentsByStudentId(s.id);
        const verified = docs.filter(d => d.status === 'VERIFIED').length;
        const pending = docs.filter(d => d.status === 'PENDING_VERIFICATION').length;
        const rejected = docs.filter(d => d.status === 'REJECTED').length;

        return (
          <button
            className={`btn btn-sm ${rejected > 0 ? 'btn-danger' : pending > 0 ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            onClick={(e) => {
              e.stopPropagation();
              setViewingStudent(s);
            }}
            title="Inspect student documents vault"
          >
            📁 {verified}/13 Verified {rejected > 0 ? `(${rejected} Rejected)` : pending > 0 ? `(${pending} Pending)` : ''}
          </button>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Level Student Navigation Tabs */}
      {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL' || role === 'HOD') && (
        <div style={{
          display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)',
          paddingBottom: '0.5rem', alignItems: 'center'
        }}>
          <button
            className={`btn ${activeTab === 'DIRECTORY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('DIRECTORY')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Users size={16} /> Student Directory
          </button>
          <button
            className={`btn ${activeTab === 'ONBOARDING' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ONBOARDING')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
          >
            <UserPlus size={16} /> Student Onboarding Desk
          </button>
          <button
            className={`btn ${activeTab === 'MENTOR_ASSIGNMENT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('MENTOR_ASSIGNMENT')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserCheck size={16} /> Mentor Assignment
          </button>
        </div>
      )}

      {activeTab === 'ONBOARDING' ? (
        <StudentOnboardingTab />
      ) : activeTab === 'MENTOR_ASSIGNMENT' ? (
        <MentorAssignmentTab />
      ) : (
        <>
          <DataTable
            title="Student Management Directory"
            subtitle={`Manage student profiles, academic placements, and enrollments`}
            data={scopedStudents}
            columns={columns}
            searchPlaceholder="Search student by name, enrollment no, email..."
            searchFields={['name', 'enrollmentNo', 'email', 'phone']}
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

            {/* Program Filter */}
            <select className="form-select" style={{ width: '160px', height: '38px', fontSize: '0.8125rem' }} value={selectedProgFilter} onChange={e => setSelectedProgFilter(e.target.value)}>
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select className="form-select" style={{ width: '140px', height: '38px', fontSize: '0.8125rem' }} value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="GRADUATED">GRADUATED</option>
            </select>
          </div>
        }
        onAddClick={handleOpenAddModal}
        addLabel="Register Student"
        onBulkImportClick={() => setIsBulkModalOpen(true)}
        bulkImportLabel="Bulk Import"
        onViewClick={item => setViewingStudent(item)}
        onEditClick={handleOpenEditModal}
        onDeleteClick={item => setDeletingItem(item)}
        canMutate={canMutate()}
        exportFilename="swarrnim-students"
      />

      {/* Universal Bulk Data Management Modal */}
      <BulkDataManagerModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialType="STUDENT"
        onSuccess={() => setStudents(db.getStudents())}
      />

      {/* Student Profile Detail Modal */}
      <StudentProfileModal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        student={viewingStudent}
        onEditClick={handleOpenEditModal}
        canMutate={canMutate()}
      />

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Student Record' : 'Register New Student'}
        subtitle="Configure academic links, personal information, and contact details"
        maxWidth="740px"
      >
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Enrollment Number *</label>
              <input type="text" className="form-input" placeholder="e.g. STUDENT-001" value={enrollmentNo} onChange={e => setEnrollmentNo(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Full Student Name *</label>
              <input type="text" className="form-input" placeholder="e.g. ABC Student 1" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Student Photo URL</label>
              <input type="text" className="form-input" placeholder="https://images.unsplash.com/..." value={photo} onChange={e => setPhoto(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value as any)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
              <label className="form-label">Admission Date</label>
              <input type="date" className="form-input" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Institutional Email *</label>
              <input type="email" className="form-input" placeholder="student1@ssiu-demo.ac.in" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Student Phone *</label>
              <input type="text" className="form-input" placeholder="+91 00000 20001" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <input type="text" className="form-input" placeholder="Flat 302, Shivalik Residency, Gandhinagar" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          {/* Academic Hierarchy Cascading Selects */}
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
              <label className="form-label">Program *</label>
              <select className="form-select" value={programId} onChange={e => setProgramId(e.target.value)} required>
                {programs.map(prog => (
                  <option key={prog.id} value={prog.id}>{prog.name} ({prog.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Batch *</label>
              <select className="form-select" value={batchId} onChange={e => setBatchId(e.target.value)} required>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select className="form-select" value={semesterId} onChange={e => setSemesterId(e.target.value)} required>
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.code} (Sem {sem.number})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Division *</label>
              <select className="form-select" value={divisionId} onChange={e => setDivisionId(e.target.value)} required>
                {divisions.map(div => (
                  <option key={div.id} value={div.id}>{div.name} (Room {div.roomNo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Guardian Name</label>
              <input type="text" className="form-input" placeholder="Parent / Guardian Name" value={guardianName} onChange={e => setGuardianName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Phone</label>
              <input type="text" className="form-input" placeholder="+91 98250 11223" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Enrollment Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="GRADUATED">GRADUATED</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Update Student Record' : 'Save Student'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Record"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
      />
        </>
      )}
    </div>
  );
};
