import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Exam, ExamTimetable, Subject, Faculty } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExamSchedulePage: React.FC = () => {
  const { user, role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [timetables, setTimetables] = useState<ExamTimetable[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [formData, setFormData] = useState<Partial<ExamTimetable>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allExams = db.getExams();
    const allTT = db.getExamTimetables();
    setSubjects(db.getSubjects());
    setFaculty(db.getFaculty());
    
    if (role === 'STUDENT') {
      const student = db.getStudents().find(s => s.id === user?.id || s.email === user?.email);
      if (student) {
        const studentExams = allExams.filter(e => e.semesterId === student.semesterId && e.programId === student.programId);
        setExams(studentExams);
        setTimetables(allTT.filter(tt => studentExams.some(e => e.id === tt.examId)));
        if (studentExams.length > 0) setSelectedExamId(studentExams[0].id);
      }
    } else {
      setExams(allExams);
      setTimetables(allTT);
      if (allExams.length > 0) setSelectedExamId(allExams[0].id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    
    db.addEntity('examTimetables', {
      ...formData,
      examId: selectedExamId
    } as any, 'Added Exam Timetable Entry');
    
    setFormData({});
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this timetable entry?')) {
      db.deleteEntity('examTimetables', id, 'Deleted Exam Timetable Entry');
      loadData();
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
  const getSubjectCode = (id: string) => subjects.find(s => s.id === id)?.code || id;
  const getFacultyName = (id?: string) => {
    if (!id) return 'Unassigned';
    return faculty.find(f => f.id === id)?.name || id;
  };

  const currentExam = exams.find(e => e.id === selectedExamId);
  const currentTT = timetables.filter(t => t.examId === selectedExamId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const examSubjects = subjects.filter(s => s.semesterId === currentExam?.semesterId && s.programId === currentExam?.programId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Official Examination Timetable &amp; Schedule
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {role === 'STUDENT' ? 'View your upcoming examination dates, session timings, and hall room numbers' : 'Configure exam session dates, timeslots, room numbers, and faculty invigilators'}
        </p>
      </div>

      {/* Exam Selector */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Exam Event:</label>
          <select className="form-select" style={{ maxWidth: '380px' }} value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            {exams.length === 0 ? <option value="">No exams available</option> : null}
            {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
          </select>
        </div>
      </div>

      {currentExam && (
        <div className="grid-3">
          <div style={{ gridColumn: (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') ? 'span 2' : 'span 3', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentTT.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No session schedule created for this exam event yet.
              </div>
            ) : (
              currentTT.map(tt => (
                <div key={tt.id} className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-orange)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--brand-navy)' }}>{getSubjectCode(tt.subjectId)}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>- {getSubjectName(tt.subjectId)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span><CalendarIcon size={14} style={{ display: 'inline', marginRight: '4px' }} /> {tt.date}</span>
                      <span><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> {tt.startTime} to {tt.endTime}</span>
                      <span><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> Room: <strong>{tt.roomNo}</strong></span>
                    </div>
                    {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Supervisor: <strong>{getFacultyName(tt.supervisorId)}</strong>
                      </div>
                    )}
                  </div>
                  
                  {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') && (
                    <button onClick={() => handleDelete(tt.id)} className="btn btn-danger btn-sm" title="Delete Timetable Entry">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') && (
            <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
                Add Schedule Entry
              </h3>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select required className="form-select" value={formData.subjectId || ''} onChange={e => setFormData({...formData, subjectId: e.target.value})}>
                    <option value="">Select Subject</option>
                    {examSubjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Date *</label>
                  <input type="date" required className="form-input" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input type="time" required className="form-input" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input type="time" required className="form-input" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Hall / Room No *</label>
                  <input type="text" required className="form-input" value={formData.roomNo || ''} onChange={e => setFormData({...formData, roomNo: e.target.value})} placeholder="e.g. A-101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Supervisor (Optional)</label>
                  <select className="form-select" value={formData.supervisorId || ''} onChange={e => setFormData({...formData, supervisorId: e.target.value})}>
                    <option value="">Select Invigilator</option>
                    {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Plus size={16} /> Add to Timetable
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
