import React, { useState } from 'react';
import { db } from '../../services/db';
import { workTransferService } from '../../services/workTransferService';
import { WorkItemType, WorkPriority } from '../../types/workTransfer';
import { X, PlusCircle, CheckCircle2, Briefcase } from 'lucide-react';

interface AssignWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
  currentUser: any;
  defaultFacultyId?: string;
}

export const AssignWorkloadModal: React.FC<AssignWorkloadModalProps> = ({
  isOpen,
  onClose,
  onAssigned,
  currentUser,
  defaultFacultyId
}) => {
  const allFaculty = db.getFaculty();
  const allDepartments = db.getDepartments ? db.getDepartments() : [];
  const allPrograms = db.getPrograms ? db.getPrograms() : [];
  const allSemesters = db.getSemesters ? db.getSemesters() : [];
  const allDivisions = db.getDivisions ? db.getDivisions() : [];

  const [facultyId, setFacultyId] = useState(defaultFacultyId || allFaculty[0]?.id || 'fac-1');
  const [workType, setWorkType] = useState<WorkItemType>('LECTURE');
  const [workTitle, setWorkTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [programName, setProgramName] = useState('B.Tech Computer Science & Engineering');
  const [semesterNumber, setSemesterNumber] = useState<number>(4);
  const [divisionName, setDivisionName] = useState('Division A');
  const [weeklyHours, setWeeklyHours] = useState<number>(4);
  const [responsibility, setResponsibility] = useState('Course Instructor');
  const [priority, setPriority] = useState<WorkPriority>('HIGH');
  const [dueDate, setDueDate] = useState('2026-12-15');
  const [studentReference, setStudentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle.trim()) {
      setErrorMsg('Work Title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      workTransferService.assignWorkloadItem({
        facultyId,
        workType,
        workTitle,
        description,
        subjectName,
        courseCode,
        programName,
        semesterNumber,
        divisionName,
        weeklyHours: ['LECTURE', 'PRACTICAL', 'TUTORIAL', 'PROJECT_SUPERVISION'].includes(workType) ? weeklyHours : 0,
        responsibility,
        priority,
        dueDate,
        studentReference
      }, currentUser);

      setIsSubmitting(false);
      onAssigned();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to assign workload.');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #CBD5E1'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #001F3F 0%, #0F2C59 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Briefcase size={22} color="#F37023" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                Assign Faculty Workload & Responsibility
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Central Faculty Master & Academic Structure Allocation
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {errorMsg && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', borderRadius: '6px', fontSize: '0.8125rem' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Faculty */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Assigned Faculty *
              </label>
              <select 
                className="form-control"
                value={facultyId}
                onChange={e => setFacultyId(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
                required
              >
                {allFaculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.employeeId} - {f.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Work / Responsibility Type *
              </label>
              <select 
                className="form-control"
                value={workType}
                onChange={e => setWorkType(e.target.value as WorkItemType)}
                style={{ fontSize: '0.8125rem' }}
                required
              >
                <option value="LECTURE">Lecture (Theory)</option>
                <option value="PRACTICAL">Practical / Lab</option>
                <option value="TUTORIAL">Tutorial</option>
                <option value="PROJECT_SUPERVISION">Project Supervision</option>
                <option value="MENTORING">Student Mentoring</option>
                <option value="EXAMINATION_DUTY">Examination Duty</option>
                <option value="EVALUATION">Evaluation / Paper Checking</option>
                <option value="ACADEMIC_COORDINATION">Academic Coordination</option>
                <option value="DEPARTMENT_COORDINATION">Department Coordination</option>
                <option value="EDP_DUTY">EDP Duty</option>
                <option value="COMMITTEE">Committee Responsibility</option>
                <option value="ADMINISTRATIVE">Administrative Work</option>
                <option value="EVENT_ACTIVITY">Event / Activity Responsibility</option>
                <option value="OTHER">Other Assigned Responsibility</option>
              </select>
            </div>
          </div>

          {/* Work Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Work Title / Course Name *
            </label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g. Database Management Systems Theory / Lab / NBA Incharge"
              value={workTitle}
              onChange={e => setWorkTitle(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Detailed Description & Scope
            </label>
            <textarea 
              className="form-control"
              rows={3}
              placeholder="Specify syllabus units, laboratory objectives, or committee charter..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            />
          </div>

          {/* Academic fields (if lecture/lab) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Course Code
              </label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. CSE-402"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Semester
              </label>
              <select 
                className="form-control"
                value={semesterNumber}
                onChange={e => setSemesterNumber(Number(e.target.value))}
                style={{ fontSize: '0.8125rem' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Division
              </label>
              <select 
                className="form-control"
                value={divisionName}
                onChange={e => setDivisionName(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="Division A">Division A</option>
                <option value="Division B">Division B</option>
                <option value="Division C">Division C</option>
                <option value="All Divisions">All Divisions</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Weekly Academic Hours
              </label>
              <input 
                type="number" 
                min={0}
                max={40}
                className="form-control"
                value={weeklyHours}
                onChange={e => setWeeklyHours(Number(e.target.value))}
                style={{ fontSize: '0.8125rem' }}
              />
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Hours per week (0 for non-teaching)</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Responsibility Role
              </label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Course Instructor / Mentor"
                value={responsibility}
                onChange={e => setResponsibility(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Priority
              </label>
              <select 
                className="form-control"
                value={priority}
                onChange={e => setPriority(e.target.value as WorkPriority)}
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem', background: '#001F3F', borderColor: '#001F3F' }}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Workload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
