import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { SessionPlanTopic, Subject, TimetableEntry } from '../../types';
import { 
  Plus, Eye, Download, Upload, CheckCircle2, 
  Clock, BookOpen, AlertCircle, FileSpreadsheet,
  Search, RefreshCw, Edit3
} from 'lucide-react';
import { sessionPlanService, SyllabusImportRow } from '../../services/sessionPlanService';
import { can } from '../../services/userAccountManagementService';

export interface SessionPlanPageProps {
  initialSubjectId?: string;
  setActiveTab?: (tab: string, params?: any) => void;
}

export const SessionPlanPage: React.FC<SessionPlanPageProps> = ({ initialSubjectId, setActiveTab }) => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const isMentor = role === 'MENTOR';
  const canCreate = can(user, 'SESSION_PLAN', 'CREATE') && !isStudent && !isMentor;
  const canEdit = can(user, 'SESSION_PLAN', 'EDIT') && !isStudent && !isMentor;
  const isReadOnly = isStudent || isMentor || (!canCreate && !canEdit);

  // Master Data & Faculty Subject Assignment
  const assignedSubjects = useMemo(() => {
    return sessionPlanService.getFacultySubjects(user, role || undefined);
  }, [user, role]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || assignedSubjects[0]?.id || 'sub-dsa'
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Selected Subject Details
  const currentSubject = useMemo(() => {
    void refreshKey;
    return assignedSubjects.find(s => s.id === selectedSubjectId) || db.getSubjectById(selectedSubjectId) || assignedSubjects[0];
  }, [assignedSubjects, selectedSubjectId, refreshKey]);

  // Session plan topics for selected subject
  const sessionTopics = useMemo(() => {
    void refreshKey;
    if (!currentSubject) return [];
    return sessionPlanService.getSessionPlanTopics(currentSubject.id);
  }, [currentSubject, refreshKey]);

  // Statistics calculation
  const stats = useMemo(() => {
    return sessionPlanService.getSyllabusStats(sessionTopics);
  }, [sessionTopics]);

  // Today's classes from timetable
  const todayClasses = useMemo(() => {
    void refreshKey;
    if (isStudent) return [];
    return sessionPlanService.getTodayClassesForFaculty(user);
  }, [user, isStudent, refreshKey]);

  // ─── Filtered Topics for Display ───
  const filteredTopics = useMemo(() => {
    return sessionTopics.filter(t => {
      if (selectedUnitFilter !== 'ALL' && t.unitNo !== parseInt(selectedUnitFilter, 10)) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && t.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (t.topicTitle || '').toLowerCase();
        const sub = (t.subTopic || '').toLowerCase();
        const method = (t.teachingMethod || '').toLowerCase();
        const ref = (t.referenceMaterial || '').toLowerCase();
        if (!title.includes(q) && !sub.includes(q) && !method.includes(q) && !ref.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sessionTopics, selectedUnitFilter, selectedStatusFilter, searchQuery]);

  // ─── Modals State ───
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingTopic, setViewingTopic] = useState<SessionPlanTopic | null>(null);
  const [editingTopic, setEditingTopic] = useState<SessionPlanTopic | null>(null);

  // Add / Edit Topic Form State
  const [formUnitNo, setFormUnitNo] = useState(1);
  const [formUnitTitle, setFormUnitTitle] = useState('');
  const [formLectureNo, setFormLectureNo] = useState(1);
  const [formTopicTitle, setFormTopicTitle] = useState('');
  const [formSubTopic, setFormSubTopic] = useState('');
  const [formTeachingMethod, setFormTeachingMethod] = useState('PPT Presentation');
  const [formPlannedDate, setFormPlannedDate] = useState('2026-08-26');
  const [formDurationHours, setFormDurationHours] = useState(1);
  const [formReferenceMaterial, setFormReferenceMaterial] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // ─── Upload Syllabus Wizard State ───
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    validRows: SyllabusImportRow[];
    invalidRows: SyllabusImportRow[];
    duplicateRows: SyllabusImportRow[];
  } | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Handlers ───
  const handleDownloadTemplate = () => {
    const buffer = sessionPlanService.generateSyllabusTemplateWorkbook(currentSubject);
    const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Syllabus_Template_${currentSubject?.code || 'CSE-401'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Standard Syllabus Excel Template (.xlsx) downloaded successfully!');
  };

  const handleToggleStatus = (topicId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const completedDate = nextStatus === 'COMPLETED' ? '2026-08-26' : undefined;

    db.updateEntity<SessionPlanTopic>('sessionPlanTopics', topicId, {
      status: nextStatus as any,
      completedDate
    }, `Updated topic status to ${nextStatus}`);

    setRefreshKey(prev => prev + 1);
    showToast('success', `Topic status updated to ${nextStatus}`);
  };

  const handleMarkInProgress = (topicId: string) => {
    db.updateEntity<SessionPlanTopic>('sessionPlanTopics', topicId, {
      status: 'IN_PROGRESS'
    }, 'Marked session plan topic In-Progress');
    setRefreshKey(prev => prev + 1);
    showToast('info', 'Topic marked as In-Progress.');
  };

  // Open Edit Modal
  const handleOpenEditTopic = (topic: SessionPlanTopic) => {
    setEditingTopic(topic);
    setFormUnitNo(topic.unitNo);
    setFormUnitTitle(topic.unitTitle || `Unit ${topic.unitNo}`);
    setFormLectureNo(topic.lectureNo);
    setFormTopicTitle(topic.topicTitle);
    setFormSubTopic(topic.subTopic || '');
    setFormTeachingMethod(topic.teachingMethod || 'PPT Presentation');
    setFormPlannedDate(topic.plannedDate || '2026-08-26');
    setFormDurationHours(topic.durationHours || 1);
    setFormReferenceMaterial(topic.referenceMaterial || '');
    setFormRemarks(topic.remarks || '');
    setIsEditTopicModalOpen(true);
  };

  // Save Topic Edit
  const handleSaveEditTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;

    db.updateEntity<SessionPlanTopic>('sessionPlanTopics', editingTopic.id, {
      unitNo: Number(formUnitNo),
      unitTitle: formUnitTitle.trim() || `Unit ${formUnitNo}`,
      lectureNo: Number(formLectureNo),
      topicTitle: formTopicTitle.trim(),
      subTopic: formSubTopic.trim() || undefined,
      teachingMethod: formTeachingMethod as any,
      plannedDate: formPlannedDate,
      durationHours: Number(formDurationHours) || 1,
      referenceMaterial: formReferenceMaterial.trim() || undefined,
      remarks: formRemarks.trim() || undefined
    }, `Updated session plan topic #${formLectureNo}`);

    setIsEditTopicModalOpen(false);
    setEditingTopic(null);
    setRefreshKey(prev => prev + 1);
    showToast('success', 'Session plan topic updated successfully!');
  };

  // Create Single Topic
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject) return;

    const newTopic: Omit<SessionPlanTopic, 'id'> = {
      subjectId: currentSubject.id,
      unitNo: Number(formUnitNo),
      unitTitle: formUnitTitle.trim() || `Unit ${formUnitNo}`,
      lectureNo: Number(formLectureNo),
      topicTitle: formTopicTitle.trim(),
      subTopic: formSubTopic.trim() || undefined,
      teachingMethod: formTeachingMethod as any,
      plannedDate: formPlannedDate,
      durationHours: Number(formDurationHours) || 1,
      referenceMaterial: formReferenceMaterial.trim() || undefined,
      remarks: formRemarks.trim() || undefined,
      status: 'PENDING',
      facultyId: user?.id || 'fac-1'
    };

    db.addEntity<SessionPlanTopic>('sessionPlanTopics', newTopic, `Added session plan topic: ${formTopicTitle}`);
    setIsAddTopicModalOpen(false);
    setFormTopicTitle('');
    setFormSubTopic('');
    setFormReferenceMaterial('');
    setRefreshKey(prev => prev + 1);
    showToast('success', 'New session topic added successfully!');
  };

  // File selection and validation in Upload Wizard
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSubject) return;

    setUploadFile(file);
    setIsValidating(true);

    try {
      const result = await sessionPlanService.parseAndValidateSyllabusFile(file, currentSubject);
      setImportResult(result);
      setUploadStep(3);
    } catch {
      showToast('error', 'Failed to parse syllabus file. Please ensure it is a valid .xlsx or .csv template.');
    } finally {
      setIsValidating(false);
    }
  };

  // Commit Import
  const handleConfirmImport = () => {
    if (!importResult || !currentSubject) return;

    const committedCount = sessionPlanService.commitSyllabusImport(
      importResult.validRows,
      currentSubject.id,
      user?.id || 'fac-1',
      overwriteExisting
    );

    setRefreshKey(prev => prev + 1);
    setImportSuccessMsg(`Successfully imported ${committedCount} syllabus topics for ${currentSubject.name} (${currentSubject.code})!`);
    setUploadStep(4);
    showToast('success', `Imported ${committedCount} topics into session plan.`);
  };

  // Navigate to Attendance module with pre-filled context
  const handleTakeAttendance = (cls?: { entry: TimetableEntry; subject: Subject; topic?: SessionPlanTopic } | SessionPlanTopic) => {
    if (!setActiveTab) return;

    if (cls && 'entry' in cls) {
      setActiveTab('attendance', {
        subjectId: cls.subject.id,
        divisionId: cls.entry.divisionId,
        date: '2026-08-26',
        lectureNo: cls.topic?.lectureNo || 1,
        topicTaught: cls.topic?.topicTitle || 'Curriculum Delivery Session'
      });
    } else if (cls && 'topicTitle' in cls) {
      setActiveTab('attendance', {
        subjectId: cls.subjectId,
        divisionId: 'div-cse-4a',
        date: cls.plannedDate || '2026-08-26',
        lectureNo: cls.lectureNo,
        topicTaught: cls.topicTitle
      });
    } else {
      setActiveTab('attendance', {
        subjectId: selectedSubjectId,
        divisionId: 'div-cse-4a',
        date: '2026-08-26'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 700,
            fontSize: '0.875rem'
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* ─── 1. Page Header & Actions ────────────────────────────────────── */}
      <div className="card" style={{ 
        padding: '1.35rem 1.75rem', 
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', 
        color: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(11,25,44,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <BookOpen size={24} color="#F37023" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Course Session Plan &amp; Syllabus Coverage
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94A3B8' }}>
              {isStudent ? 'Track course syllabus delivery, lecture progress & completed units' : 'Automated syllabus-to-session planning, lecture execution & attendance synchronization'}
            </p>
          </div>

          {!isStudent && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn btn-outline"
                style={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)'
                }}
              >
                <Download size={14} /> Download Syllabus Template
              </button>

              {canCreate && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadStep(1);
                      setImportResult(null);
                      setImportSuccessMsg(null);
                      setIsUploadModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 1rem',
                      fontWeight: 800,
                      background: 'var(--brand-orange, #F37023)',
                      borderColor: 'var(--brand-orange, #F37023)'
                    }}
                  >
                    <Upload size={14} /> + Upload Syllabus
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormUnitNo(1);
                      setFormLectureNo(sessionTopics.length + 1);
                      setFormTopicTitle('');
                      setFormSubTopic('');
                      setIsAddTopicModalOpen(true);
                    }}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.95rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      color: 'var(--brand-navy, #0B192C)'
                    }}
                  >
                    <Plus size={14} /> Add Topic
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 5-Column Summary Strip */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
          gap: '1rem', 
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.18)',
          fontSize: '0.8125rem'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Academic Year</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>2026–27</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Faculty Lead</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{user?.name || 'Prof. Demo Faculty'}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
            <strong style={{ color: '#38BDF8', fontSize: '0.95rem' }}>Computer Science &amp; Engg.</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Subject</span>
            <strong style={{ color: '#F37023', fontSize: '0.95rem' }}>{currentSubject?.code || 'CSE-401'} • Sem 4 (Div A)</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Syllabus Status</span>
            <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>{stats.completionPercentage}% ({stats.completedTopics}/{stats.totalTopics} Done)</strong>
          </div>
        </div>
      </div>

      {/* ─── 2. Today's Classes from Timetable (Linked with Attendance) ──── */}
      {todayClasses.length > 0 && !isStudent && (
        <div className="card" style={{ padding: '1.15rem 1.5rem', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#10B981" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                TODAY'S CLASSES — Wednesday, 26 August 2026
              </h4>
            </div>
            <Badge variant="active">{todayClasses.length} Scheduled Today</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0.75rem' }}>
            {todayClasses.map(cls => (
              <div 
                key={cls.entry.id}
                style={{
                  background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px',
                  border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', fontSize: '0.8rem' }}>
                      {cls.entry.timeSlot}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                      📍 {cls.entry.roomNo}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.875rem', marginTop: '0.15rem' }}>
                    {cls.subject.name} ({cls.subject.code})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                    Topic: <strong style={{ color: '#0F172A' }}>{cls.topic?.topicTitle || 'Curriculum Delivery'}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTakeAttendance(cls)}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.4rem 0.85rem',
                    background: 'var(--brand-orange, #F37023)',
                    borderColor: 'var(--brand-orange, #F37023)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Take Attendance
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. Subject Selector & Syllabus Progress KPI Card ────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          
          {/* Subject Dropdown & Info */}
          <div style={{ minWidth: '280px', flex: 1 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              Select Assigned Subject
            </label>
            <select
              className="form-control"
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              style={{ fontWeight: 700, fontSize: '0.9rem', height: '38px', borderRadius: '6px' }}
            >
              {assignedSubjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.type})
                </option>
              ))}
            </select>

            {currentSubject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Program: <strong style={{ color: 'var(--brand-navy)' }}>B.Tech CSE</strong></span>
                <span>•</span>
                <span>Semester: <strong style={{ color: 'var(--brand-navy)' }}>Semester 4</strong></span>
                <span>•</span>
                <span>Division: <strong style={{ color: 'var(--brand-navy)' }}>Division A</strong></span>
                <span>•</span>
                <span>Credits: <strong style={{ color: '#1E40AF' }}>{currentSubject.credits || 4} Cr</strong></span>
              </div>
            )}
          </div>

          {/* Syllabus Progress Bar */}
          <div style={{ minWidth: '280px', flex: 1, maxWidth: '480px', background: '#F8FAFC', padding: '0.85rem 1.15rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Syllabus Completion</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 900, color: stats.completionPercentage >= 75 ? '#059669' : '#D97706' }}>
                {stats.completionPercentage}% ({stats.completedTopics} / {stats.totalTopics} Topics)
              </span>
            </div>

            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${stats.completionPercentage}%`, 
                  height: '100%', 
                  backgroundColor: stats.completionPercentage >= 75 ? '#10B981' : 'var(--brand-orange, #F37023)', 
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#64748B', marginTop: '0.35rem' }}>
              <span>Total Units: <strong>{stats.totalUnits} Units</strong></span>
              <span>In Progress: <strong style={{ color: '#1E40AF' }}>{stats.inProgressTopics}</strong></span>
              <span>Pending: <strong style={{ color: '#DC2626' }}>{stats.pendingTopics}</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* ─── 4. Curriculum Lecture Plan & Execution Grid (Excel Table) ───── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: '8px' }}>
        
        {/* Table Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          
          {/* Left: Filters */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search topic or method..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '28px', fontSize: '0.8rem', height: '34px', borderRadius: '5px' }}
              />
            </div>

            {/* Unit Filter */}
            <select
              className="form-control"
              value={selectedUnitFilter}
              onChange={e => setSelectedUnitFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px', fontWeight: 700 }}
            >
              <option value="ALL">All Units (1–{stats.totalUnits})</option>
              {Array.from({ length: stats.totalUnits || 5 }, (_, i) => i + 1).map(u => (
                <option key={u} value={String(u)}>Unit {u}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-control"
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: '34px', borderRadius: '5px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Right: Topic Count Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="navy">{filteredTopics.length} Topics Shown</Badge>
          </div>
        </div>

        {/* Excel-Style Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
          <table style={{ width: '100%', minWidth: '1050px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
                <th style={{ width: '60px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  SR.
                </th>
                <th style={{ width: '85px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  UNIT
                </th>
                <th style={{ width: '90px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  LEC NO.
                </th>
                <th style={{ minWidth: '260px', padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  TOPIC &amp; SUB-TOPICS
                </th>
                <th style={{ width: '160px', padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  TEACHING METHOD
                </th>
                <th style={{ width: '110px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  PLANNED
                </th>
                <th style={{ width: '110px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  DELIVERED
                </th>
                <th style={{ width: '115px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  STATUS
                </th>
                <th style={{ width: '180px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    No session plan topics found. Click <strong>"+ Upload Syllabus"</strong> or <strong>"Add Topic"</strong> to populate.
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic, idx) => {
                  const isDone = topic.status === 'COMPLETED';
                  const isInProg = topic.status === 'IN_PROGRESS';

                  return (
                    <tr 
                      key={topic.id}
                      style={{ 
                        background: isDone ? '#F0FDF4' : isInProg ? '#EFF6FF' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                      className="table-row-hover"
                    >
                      {/* Sr */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 700, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {idx + 1}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        Unit {topic.unitNo}
                      </td>

                      {/* Lec No */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        Lec #{topic.lectureNo}
                      </td>

                      {/* Topic Title & Sub topic */}
                      <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                          {topic.topicTitle}
                        </div>
                        {topic.subTopic && (
                          <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '0.15rem' }}>
                            {topic.subTopic}
                          </div>
                        )}
                        {topic.referenceMaterial && (
                          <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.1rem' }}>
                            📖 {topic.referenceMaterial}
                          </div>
                        )}
                      </td>

                      {/* Teaching Method */}
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          padding: '2px 7px', 
                          borderRadius: '4px',
                          background: topic.teachingMethod?.includes('Lab') || topic.teachingMethod?.includes('Practical') ? '#DBEAFE' : '#F1F5F9',
                          color: topic.teachingMethod?.includes('Lab') || topic.teachingMethod?.includes('Practical') ? '#1D4ED8' : '#334155'
                        }}>
                          {topic.teachingMethod || 'PPT Presentation'}
                        </span>
                      </td>

                      {/* Planned Date */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        {topic.plannedDate || '2026-08-26'}
                      </td>

                      {/* Completed Date */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: isDone ? '#059669' : '#94A3B8', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        {topic.completedDate || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {isDone ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                            COMPLETED
                          </span>
                        ) : isInProg ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                            IN PROGRESS
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          
                          {/* Toggle Completion / In-Progress */}
                          {!isReadOnly && canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(topic.id, topic.status)}
                                className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '0.25rem 0.55rem',
                                  background: isDone ? '#F1F5F9' : '#10B981',
                                  borderColor: isDone ? '#CBD5E1' : '#10B981',
                                  color: isDone ? '#475569' : '#FFFFFF'
                                }}
                                title={isDone ? 'Reset to Pending' : 'Mark Completed'}
                              >
                                {isDone ? 'Undo' : 'Mark Done'}
                              </button>

                              {!isDone && !isInProg && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkInProgress(topic.id)}
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.45rem', color: '#1D4ED8', borderColor: '#BFDBFE' }}
                                  title="Mark In-Progress"
                                >
                                  In-Prog
                                </button>
                              )}
                            </>
                          )}

                          {/* Quick Take Attendance */}
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleTakeAttendance(topic)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', color: 'var(--brand-orange)' }}
                              title="Take attendance for this lecture"
                            >
                              Attendance
                            </button>
                          )}

                          {/* Edit / View */}
                          {!isReadOnly && canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditTopic(topic)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem' }}
                              title="Edit Topic"
                            >
                              <Edit3 size={12} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setViewingTopic(topic)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem', color: 'var(--brand-navy, #0B192C)' }}
                              title="View Topic Details"
                            >
                              <Eye size={12} style={{ marginRight: '3px' }} /> View
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. Upload Syllabus 4-Step Wizard Modal ───────────────────────── */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '820px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                  Upload &amp; Generate Course Syllabus Plan
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                  Target Subject: <strong style={{ color: '#1E40AF' }}>{currentSubject?.name} ({currentSubject?.code})</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {/* Step Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative' }}>
              {[
                { step: 1, label: '1. Select & Template' },
                { step: 2, label: '2. Upload File' },
                { step: 3, label: '3. Validate & Preview' },
                { step: 4, label: '4. Done' }
              ].map(s => (
                <div 
                  key={s.step}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    color: uploadStep >= s.step ? 'var(--brand-navy)' : '#94A3B8'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: uploadStep === s.step ? 'var(--brand-orange, #F37023)' : uploadStep > s.step ? '#10B981' : '#E2E8F0',
                    color: uploadStep >= s.step ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem'
                  }}>
                    {uploadStep > s.step ? '✓' : s.step}
                  </div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: Select Subject & Download Template */}
            {uploadStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.4rem' }}>
                    Confirm Subject for Syllabus Import
                  </label>
                  <select
                    className="form-control"
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    style={{ fontWeight: 700 }}
                  >
                    {assignedSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: '#FFF8F5', padding: '1.25rem', borderRadius: '8px', border: '1px solid #FFEDD5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.95rem' }}>
                      Download Standard Syllabus Template (.xlsx)
                    </h5>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                      Pre-configured with columns: Unit No, Unit Title, Lecture No, Topic Title, Sub Topic, Method, Date, Hours, and References.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', fontWeight: 700, borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)' }}
                  >
                    <Download size={14} /> Download (.xlsx)
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadStep(2)}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                  >
                    Next: Upload File →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: File Upload */}
            {uploadStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div 
                  style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('syllabus-file-input')?.click()}
                >
                  <FileSpreadsheet size={40} color="#F37023" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {uploadFile ? uploadFile.name : 'Choose Syllabus Excel/CSV File'}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Supported formats: <strong>.xlsx, .xls, .csv</strong> (Max 10MB)
                  </p>
                  <input
                    id="syllabus-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.85rem', fontWeight: 700, background: 'var(--brand-navy)' }}
                  >
                    Browse Local File
                  </button>
                </div>

                {isValidating && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--brand-navy)', fontWeight: 700, fontSize: '0.875rem' }}>
                    <RefreshCw className="animate-spin" size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Validating syllabus rows against subject master...
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadStep(1)}
                    className="btn btn-secondary"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Validate & Preview Grid */}
            {uploadStep === 3 && importResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Validation Summary Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: '6px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Valid Topics</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803D' }}>{importResult.validRows.length}</div>
                  </div>
                  <div style={{ background: importResult.invalidRows.length > 0 ? '#FEF2F2' : '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: importResult.invalidRows.length > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: importResult.invalidRows.length > 0 ? '#991B1B' : '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Errors / Invalid</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: importResult.invalidRows.length > 0 ? '#DC2626' : '#64748B' }}>{importResult.invalidRows.length}</div>
                  </div>
                  <div style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FDE68A', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 800, textTransform: 'uppercase' }}>Duplicate / Existing</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706' }}>{importResult.duplicateRows.length}</div>
                  </div>
                </div>

                {/* Row-wise Error Messages if any */}
                {importResult.invalidRows.length > 0 && (
                  <div style={{ background: '#FEF2F2', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #FECACA', maxHeight: '120px', overflowY: 'auto' }}>
                    <strong style={{ color: '#991B1B', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
                      Row-wise Validation Errors:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#B91C1C' }}>
                      {importResult.invalidRows.map((inv, i) => (
                        <li key={i}>
                          <strong>Row {inv.rowNumber}:</strong> {inv.errors.join('; ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overwrite Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <input
                    type="checkbox"
                    id="overwrite-check"
                    checked={overwriteExisting}
                    onChange={e => setOverwriteExisting(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="overwrite-check" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-navy)', cursor: 'pointer', margin: 0 }}>
                    Overwrite / Update existing lectures if lecture number matches
                  </label>
                </div>

                {/* Preview Table */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                        <th style={{ padding: '0.4rem', textAlign: 'center' }}>Sr</th>
                        <th style={{ padding: '0.4rem', textAlign: 'center' }}>Unit</th>
                        <th style={{ padding: '0.4rem', textAlign: 'center' }}>Lec #</th>
                        <th style={{ padding: '0.4rem', textAlign: 'left' }}>Topic Title</th>
                        <th style={{ padding: '0.4rem', textAlign: 'center' }}>Method</th>
                        <th style={{ padding: '0.4rem', textAlign: 'center' }}>Planned Date</th>
                        <th style={{ padding: '0.4rem', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.validRows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.4rem', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 700 }}>Unit {r.unitNo}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF' }}>#{r.lectureNo}</td>
                          <td style={{ padding: '0.4rem', fontWeight: 700 }}>{r.topicTitle}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center' }}>{r.teachingMethod}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center', fontFamily: 'monospace' }}>{r.plannedDate}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#15803D' }}>VALID</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadStep(2)}
                    className="btn btn-secondary"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={importResult.validRows.length === 0}
                    onClick={handleConfirmImport}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, background: '#10B981', borderColor: '#10B981' }}
                  >
                    Confirm &amp; Import ({importResult.validRows.length} Topics)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success Message */}
            {uploadStep === 4 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ margin: 0, fontWeight: 900, color: 'var(--brand-navy)' }}>
                  Syllabus Import Successful!
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 1.5rem auto' }}>
                  {importSuccessMsg}
                </p>

                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="btn btn-primary"
                  style={{ fontWeight: 800, background: 'var(--brand-navy)' }}
                >
                  View Updated Session Plan
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── 6. Add Single Topic Modal ────────────────────────────────────── */}
      {isAddTopicModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Add New Session Topic
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTopicModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Unit No.</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    className="form-control"
                    value={formUnitNo}
                    onChange={e => setFormUnitNo(parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <label className="form-label">Lecture No.</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-control"
                    value={formLectureNo}
                    onChange={e => setFormLectureNo(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Relational Algebra Operations"
                  className="form-control"
                  value={formTopicTitle}
                  onChange={e => setFormTopicTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Sub-topics / Key Concepts</label>
                <input
                  type="text"
                  placeholder="e.g. Selection, Projection, Joins"
                  className="form-control"
                  value={formSubTopic}
                  onChange={e => setFormSubTopic(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Teaching Method</label>
                  <select
                    className="form-control"
                    value={formTeachingMethod}
                    onChange={e => setFormTeachingMethod(e.target.value)}
                  >
                    <option value="PPT Presentation">PPT Presentation</option>
                    <option value="Chalk & Board">Chalk &amp; Board</option>
                    <option value="Lab Demonstration">Lab Demonstration</option>
                    <option value="Interactive Case Study">Interactive Case Study</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Planned Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={formPlannedDate}
                    onChange={e => setFormPlannedDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Reference Material</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Textbook Ch. 3"
                  className="form-control"
                  value={formReferenceMaterial}
                  onChange={e => setFormReferenceMaterial(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddTopicModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 7. Edit Topic Modal ──────────────────────────────────────────── */}
      {isEditTopicModalOpen && editingTopic && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Edit Session Topic #{editingTopic.lectureNo}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditTopicModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTopic} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Unit No.</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    className="form-control"
                    value={formUnitNo}
                    onChange={e => setFormUnitNo(parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <label className="form-label">Lecture No.</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-control"
                    value={formLectureNo}
                    onChange={e => setFormLectureNo(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Topic Title *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formTopicTitle}
                  onChange={e => setFormTopicTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Sub-topics / Key Concepts</label>
                <input
                  type="text"
                  className="form-control"
                  value={formSubTopic}
                  onChange={e => setFormSubTopic(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Teaching Method</label>
                  <select
                    className="form-control"
                    value={formTeachingMethod}
                    onChange={e => setFormTeachingMethod(e.target.value)}
                  >
                    <option value="PPT Presentation">PPT Presentation</option>
                    <option value="Chalk & Board">Chalk &amp; Board</option>
                    <option value="Lab Demonstration">Lab Demonstration</option>
                    <option value="Interactive Case Study">Interactive Case Study</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Planned Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={formPlannedDate}
                    onChange={e => setFormPlannedDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Reference Material</label>
                <input
                  type="text"
                  className="form-control"
                  value={formReferenceMaterial}
                  onChange={e => setFormReferenceMaterial(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditTopicModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                >
                  Update Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 8. View Topic Details Modal ──────────────────────────────────── */}
      {viewingTopic && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <Badge variant="navy">Unit {viewingTopic.unitNo}</Badge>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', fontSize: '0.8rem' }}>
                    Lecture #{viewingTopic.lectureNo}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                  {viewingTopic.topicTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTopic(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
              {viewingTopic.subTopic && (
                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '5px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Sub-Topics Covered:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '0.15rem' }}>{viewingTopic.subTopic}</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '5px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Teaching Method:</span>
                  <div style={{ fontWeight: 800, color: '#1E40AF' }}>{viewingTopic.teachingMethod}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '5px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Planned Date:</span>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{viewingTopic.plannedDate}</div>
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Reference Material:</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>{viewingTopic.referenceMaterial || 'Standard Textbook & Lecture Notes'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setViewingTopic(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
              {!isStudent && (
                <button
                  type="button"
                  onClick={() => {
                    handleTakeAttendance(viewingTopic);
                    setViewingTopic(null);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                >
                  Take Attendance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionPlanPage;
