import React, { useState } from 'react';
import { X, Calendar, Plus, Users, Video, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/db';
import { ptmService } from '../../services/ptmService';
import { useAuth } from '../../context/AuthContext';
import { PTMMeetingMode, PTMTargetType } from '../../types/ptm';

interface CreatePTMEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const CreatePTMEventModal: React.FC<CreatePTMEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const { user } = useAuth();

  const institutes = db.getInstitutes();
  const academicYears = db.getAcademicYears();

  const [title, setTitle] = useState('');
  const [academicYearId, setAcademicYearId] = useState(academicYears[0]?.id || 'ay-2024');
  const [instituteId, setInstituteId] = useState(user?.instituteId || institutes[0]?.id || 'inst-1');
  
  const departments = db.getDepartments().filter(d => d.instituteId === instituteId);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-1');

  const programs = db.getPrograms().filter(p => p.instituteId === instituteId || p.departmentId === departmentId);
  const [programId, setProgramId] = useState(programs[0]?.id || 'prog-btech-cse');

  const semesters = db.getSemesters().filter(s => s.programId === programId);
  const [semesterId, setSemesterId] = useState(semesters[0]?.id || 'sem-4');

  const divisions = db.getDivisions().filter(d => d.semesterId === semesterId || d.programId === programId);
  const [divisionId, setDivisionId] = useState(divisions[0]?.id || 'div-a');

  const [date, setDate] = useState('2025-03-25');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('16:00');
  const [venue, setVenue] = useState('Room 402, Block B & Virtual Meeting Room');
  const [mode, setMode] = useState<PTMMeetingMode>('HYBRID');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/ssiu-ptm-session');
  
  const allFaculty = db.getFaculty().filter(f => f.instituteId === instituteId || f.departmentId === departmentId);
  const [assignedFacultyIds, setAssignedFacultyIds] = useState<string[]>([allFaculty[0]?.id || 'faculty-1']);

  const [targetType, setTargetType] = useState<PTMTargetType>('CLASS');
  const [description, setDescription] = useState('Comprehensive parent-teacher consultation to review semester academic progress, lab participation and attendance standings.');
  const [instructions, setInstructions] = useState('Parents are requested to bring their ID proof. Online attendees must join using their registered email.');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const selectedAY = academicYears.find(ay => ay.id === academicYearId);
    const selectedInst = institutes.find(i => i.id === instituteId);
    const selectedDept = departments.find(d => d.id === departmentId);
    const selectedProg = programs.find(p => p.id === programId);
    const selectedSem = semesters.find(s => s.id === semesterId);
    const selectedDiv = divisions.find(d => d.id === divisionId);

    const assignedNames = allFaculty
      .filter(f => assignedFacultyIds.includes(f.id))
      .map(f => f.name);

    try {
      ptmService.createEvent({
        title: title || `${selectedProg?.name || 'Class'} Parent–Teacher Meeting`,
        academicYearId,
        academicYearName: selectedAY?.name || '2024-25',
        instituteId,
        instituteName: selectedInst?.name || 'Swarrnim School of Computing & IT',
        departmentId,
        departmentName: selectedDept?.name || 'Computer Engineering',
        programId,
        programName: selectedProg?.name || 'B.Tech CSE',
        semesterId,
        semesterNumber: selectedSem?.number || 4,
        divisionId,
        divisionName: selectedDiv?.name || 'Division A',
        date,
        startTime,
        endTime,
        venue,
        mode,
        meetingLink: mode !== 'PHYSICAL' ? meetingLink : undefined,
        assignedFacultyIds: assignedFacultyIds.length > 0 ? assignedFacultyIds : [user.id],
        assignedFacultyNames: assignedNames.length > 0 ? assignedNames : [user.name],
        description,
        instructions,
        targetType,
        status: 'SCHEDULED',
        createdBy: user.id,
        createdByName: user.name
      }, user);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onEventCreated();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error creating PTM event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="swarrnim-modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div 
        className="swarrnim-modal-dialog" 
        style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="swarrnim-modal-header" style={{ background: '#0F2C59', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={20} color="#F58220" />
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#fff' }}>
              Schedule New Parent–Teacher Meeting (PTM)
            </h3>
          </div>
          <button 
            type="button" 
            className="swarrnim-modal-close-btn" 
            style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }} 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            
            {/* Title & AY */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>PTM Event Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Semester Progress Review PTM"
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Academic Year</label>
                <select
                  className="form-input"
                  value={academicYearId}
                  onChange={e => setAcademicYearId(e.target.value)}
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Institute, Dept, Program */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Institute *</label>
                <select
                  className="form-input"
                  value={instituteId}
                  onChange={e => setInstituteId(e.target.value)}
                >
                  {institutes.map(i => (
                    <option key={i.id} value={i.id}>{i.code} — {i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Department *</label>
                <select
                  className="form-input"
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Program *</label>
                <select
                  className="form-input"
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Semester & Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Semester *</label>
                <select
                  className="form-input"
                  value={semesterId}
                  onChange={e => setSemesterId(e.target.value)}
                >
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>Semester {s.number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Section / Division</label>
                <select
                  className="form-input"
                  value={divisionId}
                  onChange={e => setDivisionId(e.target.value)}
                >
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Target Audience</label>
                <select
                  className="form-input"
                  value={targetType}
                  onChange={e => setTargetType(e.target.value as PTMTargetType)}
                >
                  <option value="CLASS">Entire Class Batch</option>
                  <option value="SELECTED_STUDENTS">Selected Students</option>
                </select>
              </div>
            </div>

            {/* Date & Timings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>PTM Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Start Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>End Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Meeting Mode, Venue & Link */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Meeting Mode *</label>
                <select
                  className="form-input"
                  value={mode}
                  onChange={e => setMode(e.target.value as PTMMeetingMode)}
                >
                  <option value="PHYSICAL">🏢 Physical (In-Person)</option>
                  <option value="ONLINE">💻 Online (Virtual)</option>
                  <option value="HYBRID">🌐 Hybrid (Physical + Online)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Campus Venue *</label>
                <input
                  type="text"
                  className="form-input"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  placeholder="e.g. Block B Room 402, SSCIT"
                  required
                />
              </div>
            </div>

            {mode !== 'PHYSICAL' && (
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Virtual Meeting Link (Google Meet / Teams)</label>
                <input
                  type="url"
                  className="form-input"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}

            {/* Faculty Mentors */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Assigned Faculty / Mentor(s)</label>
              <select
                className="form-input"
                multiple
                value={assignedFacultyIds}
                onChange={e => {
                  const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                  setAssignedFacultyIds(opts);
                }}
                style={{ height: '70px' }}
              >
                {allFaculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation || 'Faculty'})</option>
                ))}
              </select>
              <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Hold Ctrl (or Cmd on Mac) to select multiple faculty members.</span>
            </div>

            {/* Description & Instructions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>PTM Agenda / Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Instructions for Parents</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {success && (
                <span style={{ color: '#15803D', fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={16} /> PTM Event Scheduled &amp; Slots Created!
                </span>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0F2C59' }}
              >
                <Plus size={16} />
                {isSubmitting ? 'Creating...' : 'Create PTM Event & Dispatch Invites'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
