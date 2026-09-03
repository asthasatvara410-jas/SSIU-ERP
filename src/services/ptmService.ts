import { 
  PTMEvent, 
  PTMSchedule, 
  PTMRecord, 
  PTMFollowUpAction, 
  ParentProfile, 
  PTMNotification,
  PTMParentResponse,
  PTMAttendanceStatus,
  PTMScheduleStatus,
  PTMOutcome,
  PTMMeetingMode
} from '../types/ptm';
import { User, UserRole, Student } from '../types';
import { db } from './db';
import { 
  INITIAL_PTM_EVENTS, 
  INITIAL_PTM_SCHEDULES, 
  INITIAL_PTM_RECORDS, 
  INITIAL_PTM_FOLLOWUPS, 
  INITIAL_PTM_PARENTS, 
  INITIAL_PTM_NOTIFICATIONS 
} from '../data/initialPTMData';
import { ptmExcelReportService, PTMExportFilterOptions } from './ptmExcelReportService';
import * as XLSX from 'xlsx';

const PTM_STORAGE_KEY = 'SWARRNIM_ERP_PTM_STORE_V6'; // Bumped to V6 for Authentic Master Data Hydration

interface PTMStoreData {
  events: PTMEvent[];
  schedules: PTMSchedule[];
  records: PTMRecord[];
  followUps: PTMFollowUpAction[];
  parents: ParentProfile[];
  notifications: PTMNotification[];
}

class PTMService {
  private data: PTMStoreData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): PTMStoreData {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(PTM_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Enrich with central master references
          return this.enrichMasterReferences(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse PTM store data from localStorage', e);
    }

    const initialData: PTMStoreData = {
      events: INITIAL_PTM_EVENTS,
      schedules: INITIAL_PTM_SCHEDULES,
      records: INITIAL_PTM_RECORDS,
      followUps: INITIAL_PTM_FOLLOWUPS,
      parents: INITIAL_PTM_PARENTS,
      notifications: INITIAL_PTM_NOTIFICATIONS
    };

    const enriched = this.enrichMasterReferences(initialData);
    this.saveToStorage(enriched);
    return enriched;
  }

  // Central Master Dynamic Synchronization Layer
  private enrichMasterReferences(store: PTMStoreData): PTMStoreData {
    const students = db.getStudents();
    const studentMap = new Map(students.map(s => [s.id, s]));
    const studentEnrollMap = new Map(students.map(s => [s.enrollmentNo.trim().toUpperCase(), s]));

    const faculty = db.getFaculty();
    const facultyMap = new Map(faculty.map(f => [f.id, f]));

    // Synchronize Schedules
    const syncedSchedules = store.schedules.map(sch => {
      const student = studentMap.get(sch.studentId) || studentEnrollMap.get(sch.enrollmentNo?.trim().toUpperCase());
      const fac = facultyMap.get(sch.facultyId) || faculty.find(f => f.name === sch.facultyName);

      if (!student && !fac) return sch;

      return {
        ...sch,
        studentName: student?.name || sch.studentName,
        enrollmentNo: student?.enrollmentNo || sch.enrollmentNo,
        instituteId: student?.instituteId || sch.instituteId,
        departmentId: student?.departmentId || sch.departmentId,
        programId: student?.programId || sch.programId,
        semesterId: student?.semesterId || sch.semesterId,
        divisionId: student?.divisionId || sch.divisionId,
        facultyName: fac?.name || sch.facultyName
      };
    });

    // Synchronize Records
    const syncedRecords = store.records.map(rec => {
      const student = studentMap.get(rec.studentId) || studentEnrollMap.get(rec.enrollmentNo?.trim().toUpperCase());
      const fac = facultyMap.get(rec.facultyId) || faculty.find(f => f.name === rec.facultyName);

      return {
        ...rec,
        studentName: student?.name || rec.studentName,
        enrollmentNo: student?.enrollmentNo || rec.enrollmentNo,
        facultyName: fac?.name || rec.facultyName
      };
    });

    // Synchronize Follow-ups
    const syncedFollowUps = store.followUps.map(fol => {
      const student = studentMap.get(fol.studentId) || studentEnrollMap.get(fol.enrollmentNo?.trim().toUpperCase());

      return {
        ...fol,
        studentName: student?.name || fol.studentName,
        enrollmentNo: student?.enrollmentNo || fol.enrollmentNo
      };
    });

    return {
      ...store,
      schedules: syncedSchedules,
      records: syncedRecords,
      followUps: syncedFollowUps
    };
  }

  private saveToStorage(data: PTMStoreData) {
    this.data = data;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(PTM_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save PTM store data to localStorage', e);
    }
  }

  // ─── Scope Checks ─────────────────────────────────────────────────────────

  private isAuthorizedForStudent(studentId: string, user: User, role: UserRole): boolean {
    if (['SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR'].includes(role)) {
      return true;
    }

    const student = db.getStudentById(studentId);
    if (!student) return false;

    if (role === 'PRINCIPAL') {
      return student.instituteId === user.instituteId;
    }

    if (role === 'HOD') {
      return student.instituteId === user.instituteId && (student.departmentId === user.departmentId || !user.departmentId);
    }

    if (role === 'FACULTY') {
      const faculty = db.getFaculty().find(f => (f as any).userId === user.id || f.id === user.id || f.email === user.email);
      if (!faculty) return student.instituteId === user.instituteId;
      // Scoped to institute or department or assigned subjects
      return student.instituteId === faculty.instituteId && (student.departmentId === faculty.departmentId || !faculty.departmentId);
    }

    if (role === 'MENTOR') {
      const faculty = db.getFaculty().find(f => (f as any).userId === user.id || f.id === user.id || f.email === user.email);
      const mentorId = faculty?.id || user.id;
      return student.mentorId === mentorId;
    }

    if (role === 'PARENT') {
      const parent = this.getParentProfileByUserId(user.id) || this.data.parents.find(p => p.email === user.email);
      return !!(parent && parent.linkedStudentIds.includes(studentId));
    }

    if (role === 'STUDENT') {
      const studentUser = db.getStudents().find(s => 
        s.email?.toLowerCase() === user.email?.toLowerCase() || 
        s.enrollmentNo === user.username || 
        s.enrollmentNo === user.enrollmentNo || 
        s.id === user.id
      );
      if (!studentUser) return true; // Graceful fallback in demo/portal
      return studentUser.id === studentId || studentId === user.id;
    }

    return false;
  }

  // ─── Parents ──────────────────────────────────────────────────────────────

  public getParents(): ParentProfile[] {
    return this.data.parents;
  }

  public getParentProfileByUserId(userId: string): ParentProfile | undefined {
    return this.data.parents.find(p => p.userId === userId || p.email === userId);
  }

  public getParentLinkedStudents(userIdOrParentId: string): Student[] {
    // Try to find parent profile by userId, parentId, or email
    let parent = this.data.parents.find(
      p => p.userId === userIdOrParentId ||
           p.id === userIdOrParentId ||
           p.email === userIdOrParentId
    );

    // Secondary lookup: try to match by user object from db (handles cases where userId is stored differently)
    if (!parent) {
      const allUsers = db.getUsers();
      const matchedUser = allUsers.find(u => u.id === userIdOrParentId || u.email === userIdOrParentId || u.username === userIdOrParentId);
      if (matchedUser) {
        parent = this.data.parents.find(
          p => p.userId === matchedUser.id ||
               p.email === matchedUser.email
        );
      }
    }

    if (!parent) {
      // No parent profile found — return empty array (secure: never expose unlinked students)
      return [];
    }

    const students = db.getStudents();
    return students.filter(s => parent!.linkedStudentIds.includes(s.id));
  }

  // ─── PTM Events ───────────────────────────────────────────────────────────

  public getEvents(user: User, role: UserRole): PTMEvent[] {
    const allEvents = this.data.events;

    if (['SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR'].includes(role)) {
      return allEvents;
    }

    if (role === 'PRINCIPAL') {
      return allEvents.filter(e => e.instituteId === user.instituteId);
    }

    if (role === 'HOD') {
      return allEvents.filter(e => e.instituteId === user.instituteId && (e.departmentId === user.departmentId || !user.departmentId));
    }

    if (role === 'FACULTY' || role === 'MENTOR') {
      const faculty = db.getFaculty().find(f => (f as any).userId === user.id || f.id === user.id || f.email === user.email);
      const facultyId = faculty?.id || user.id;
      return allEvents.filter(e => 
        e.assignedFacultyIds.includes(facultyId) || 
        e.assignedFacultyIds.includes(user.id) ||
        (e.instituteId === user.instituteId && e.departmentId === user.departmentId)
      );
    }

    if (role === 'PARENT') {
      const linkedStudents = this.getParentLinkedStudents(user.id);
      const studentIds = linkedStudents.map(s => s.id);
      const parentSchedules = this.data.schedules.filter(s => studentIds.includes(s.studentId));
      const eventIds = new Set(parentSchedules.map(s => s.ptmEventId));
      return allEvents.filter(e => eventIds.has(e.id));
    }

    if (role === 'STUDENT') {
      const student = db.getStudents().find(s => s.email === user.email || s.enrollmentNo === user.username || s.id === user.id);
      if (!student) return [];
      const studentSchedules = this.data.schedules.filter(s => s.studentId === student.id);
      const eventIds = new Set(studentSchedules.map(s => s.ptmEventId));
      return allEvents.filter(e => eventIds.has(e.id) || (e.semesterId === student.semesterId && e.programId === student.programId));
    }

    return allEvents;
  }

  public getEventById(id: string): PTMEvent | undefined {
    return this.data.events.find(e => e.id === id);
  }

  public createEvent(eventData: Omit<PTMEvent, 'id' | 'createdAt'>, user: User): PTMEvent {
    const newEventId = `ptm-event-${Date.now()}`;
    const newEvent: PTMEvent = {
      ...eventData,
      id: newEventId,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString()
    };

    const updatedEvents = [newEvent, ...this.data.events];
    
    // Auto-generate schedules for target audience
    const allStudents = db.getStudents();
    let targetStudents: Student[] = [];

    if (eventData.targetType === 'CLASS') {
      targetStudents = allStudents.filter(s => 
        s.programId === eventData.programId &&
        s.semesterId === eventData.semesterId &&
        (!eventData.divisionId || s.divisionId === eventData.divisionId)
      );
    } else if (eventData.selectedStudentIds && eventData.selectedStudentIds.length > 0) {
      targetStudents = allStudents.filter(s => eventData.selectedStudentIds!.includes(s.id));
    }

    if (targetStudents.length === 0) {
      targetStudents = allStudents.filter(s => s.instituteId === eventData.instituteId).slice(0, 5);
    }

    const newSchedules: PTMSchedule[] = targetStudents.map((st, idx) => {
      // Slot calculation
      const startHour = parseInt(eventData.startTime.split(':')[0] || '10', 10);
      const startMin = parseInt(eventData.startTime.split(':')[1] || '00', 10);
      const slotMin = (startMin + idx * 25) % 60;
      const slotHr = startHour + Math.floor((startMin + idx * 25) / 60);
      const slotStart = `${String(slotHr).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
      const slotEndMin = (slotMin + 20) % 60;
      const slotEndHr = slotHr + Math.floor((slotMin + 20) / 60);
      const slotEnd = `${String(slotEndHr).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;

      // Parent lookup
      const parent = this.data.parents.find(p => p.linkedStudentIds.includes(st.id));

      return {
        id: `ptm-sch-${Date.now()}-${idx}`,
        ptmEventId: newEventId,
        ptmEventTitle: eventData.title,
        studentId: st.id,
        studentName: st.name,
        enrollmentNo: st.enrollmentNo,
        parentId: parent?.id || `parent-auto-${st.id}`,
        parentName: parent?.name || st.guardianName || 'Parent / Guardian',
        parentEmail: parent?.email || `${st.enrollmentNo.toLowerCase()}.parent@university.edu`,
        parentPhone: parent?.phone || st.guardianPhone || '+91 98765 00000',
        parentRelationship: parent?.relationship || 'Father',
        facultyId: eventData.assignedFacultyIds[0] || user.id,
        facultyName: eventData.assignedFacultyNames?.[0] || user.name,
        instituteId: eventData.instituteId,
        instituteName: eventData.instituteName,
        departmentId: eventData.departmentId,
        departmentName: eventData.departmentName,
        programId: eventData.programId,
        programName: eventData.programName,
        semesterId: eventData.semesterId,
        semesterNumber: eventData.semesterNumber,
        divisionId: eventData.divisionId,
        divisionName: eventData.divisionName,
        date: eventData.date,
        startTime: slotStart,
        endTime: slotEnd,
        slotTime: `${slotStart} - ${slotEnd}`,
        venue: eventData.venue,
        mode: eventData.mode,
        meetingLink: eventData.meetingLink,
        status: 'INVITED',
        parentResponse: 'PENDING',
        attendanceStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };
    });

    const updatedSchedules = [...newSchedules, ...this.data.schedules];

    this.saveToStorage({
      ...this.data,
      events: updatedEvents,
      schedules: updatedSchedules
    });

    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<PTMEvent>): PTMEvent | undefined {
    const eventIndex = this.data.events.findIndex(e => e.id === id);
    if (eventIndex === -1) return undefined;

    const updatedEvent = { ...this.data.events[eventIndex], ...updates };
    const newEvents = [...this.data.events];
    newEvents[eventIndex] = updatedEvent;

    this.saveToStorage({
      ...this.data,
      events: newEvents
    });

    return updatedEvent;
  }

  // ─── PTM Schedules ────────────────────────────────────────────────────────

  public getSchedules(user: User, role: UserRole, filter?: {
    eventId?: string;
    studentId?: string;
    parentId?: string;
    facultyId?: string;
    status?: string;
    date?: string;
    search?: string;
  }): PTMSchedule[] {
    let schedules = this.data.schedules;

    // Apply RBAC filtering
    if (['SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR'].includes(role)) {
      // All schedules visible
    } else if (role === 'PRINCIPAL') {
      schedules = schedules.filter(s => s.instituteId === user.instituteId);
    } else if (role === 'HOD') {
      schedules = schedules.filter(s => s.instituteId === user.instituteId && (s.departmentId === user.departmentId || !user.departmentId));
    } else if (role === 'FACULTY') {
      const faculty = db.getFaculty().find(f => (f as any).userId === user.id || f.id === user.id || f.email === user.email);
      const facultyId = faculty?.id || user.id;
      schedules = schedules.filter(s => 
        s.facultyId === facultyId || 
        s.facultyId === user.id || 
        (s.instituteId === user.instituteId && s.departmentId === user.departmentId)
      );
    } else if (role === 'MENTOR') {
      const faculty = db.getFaculty().find(f => (f as any).userId === user.id || f.id === user.id || f.email === user.email);
      const mentorId = faculty?.id || user.id;
      const mentees = db.getStudents().filter(st => st.mentorId === mentorId);
      const menteeIds = new Set(mentees.map(m => m.id));
      schedules = schedules.filter(s => menteeIds.has(s.studentId) || s.facultyId === mentorId);
    } else if (role === 'PARENT') {
      const linkedStudents = this.getParentLinkedStudents(user.id);
      const studentIds = new Set(linkedStudents.map(s => s.id));
      schedules = schedules.filter(s => studentIds.has(s.studentId) || s.parentEmail === user.email);
    } else if (role === 'STUDENT') {
      const student = db.getStudents().find(s => s.email === user.email || s.enrollmentNo === user.username || s.id === user.id);
      if (!student) return [];
      schedules = schedules.filter(s => s.studentId === student.id);
    }

    // Apply query filters
    if (filter) {
      if (filter.eventId && filter.eventId !== 'ALL') {
        schedules = schedules.filter(s => s.ptmEventId === filter.eventId);
      }
      if (filter.studentId) {
        schedules = schedules.filter(s => s.studentId === filter.studentId);
      }
      if (filter.facultyId && filter.facultyId !== 'ALL') {
        schedules = schedules.filter(s => s.facultyId === filter.facultyId);
      }
      if (filter.status && filter.status !== 'ALL') {
        schedules = schedules.filter(s => s.status === filter.status);
      }
      if (filter.date) {
        schedules = schedules.filter(s => s.date === filter.date);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        schedules = schedules.filter(s => 
          s.studentName.toLowerCase().includes(q) ||
          s.enrollmentNo.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          s.facultyName.toLowerCase().includes(q) ||
          s.programName.toLowerCase().includes(q)
        );
      }
    }

    return schedules;
  }

  public getScheduleById(id: string): PTMSchedule | undefined {
    return this.data.schedules.find(s => s.id === id);
  }

  public updateSchedule(id: string, updates: Partial<PTMSchedule>): PTMSchedule | undefined {
    const idx = this.data.schedules.findIndex(s => s.id === id);
    if (idx === -1) return undefined;

    const updated = { ...this.data.schedules[idx], ...updates };
    const newSchedules = [...this.data.schedules];
    newSchedules[idx] = updated;

    this.saveToStorage({
      ...this.data,
      schedules: newSchedules
    });

    return updated;
  }

  public recordParentResponse(
    scheduleId: string, 
    response: PTMParentResponse, 
    reason?: string, 
    proposedDate?: string, 
    proposedTime?: string
  ): PTMSchedule | undefined {
    const schedule = this.getScheduleById(scheduleId);
    if (!schedule) return undefined;

    let newStatus: PTMScheduleStatus = schedule.status;
    if (response === 'CONFIRMED') {
      newStatus = 'CONFIRMED';
    } else if (response === 'RESCHEDULE_REQUESTED') {
      newStatus = 'RESCHEDULED';
    } else if (response === 'DECLINED') {
      newStatus = 'CANCELLED';
    }

    return this.updateSchedule(scheduleId, {
      parentResponse: response,
      parentResponseReason: reason,
      rescheduleRequestedDate: proposedDate,
      rescheduleRequestedTime: proposedTime,
      status: newStatus
    });
  }

  public markAttendance(scheduleId: string, attendanceStatus: PTMAttendanceStatus, markedBy: string): PTMSchedule | undefined {
    const schedule = this.getScheduleById(scheduleId);
    if (!schedule) return undefined;

    let newStatus: PTMScheduleStatus = schedule.status;
    if (attendanceStatus === 'PRESENT') {
      newStatus = 'ATTENDED';
    } else if (attendanceStatus === 'ABSENT') {
      newStatus = 'MISSED';
    } else if (attendanceStatus === 'RESCHEDULED') {
      newStatus = 'RESCHEDULED';
    }

    return this.updateSchedule(scheduleId, {
      attendanceStatus,
      status: newStatus,
      markedAt: new Date().toISOString(),
      markedBy
    });
  }

  public requestStudentConsultation(payload: {
    studentId: string;
    facultyId: string;
    preferredDate: string;
    preferredTime: string;
    mode: PTMMeetingMode;
    agenda: string;
    meetingType?: string;
  }, user: User): PTMSchedule {
    const student = db.getStudentById(payload.studentId) || db.getStudents().find(s => s.id === payload.studentId);
    const faculty = db.getFaculty().find(f => f.id === payload.facultyId || (f as any).userId === payload.facultyId);
    const program = student ? db.getProgramById(student.programId) : undefined;
    const semester = student ? db.getSemesterById(student.semesterId) : undefined;
    const division = student ? db.getDivisionById(student.divisionId) : undefined;
    const department = student ? db.getDepartmentById(student.departmentId) : undefined;
    const institute = student ? db.getInstituteById(student.instituteId) : undefined;

    const parent = this.data.parents.find(p => p.linkedStudentIds.includes(payload.studentId)) || {
      id: `parent-${payload.studentId}`,
      name: student?.guardianName || 'Parent / Guardian',
      email: student?.email || user.email,
      phone: student?.guardianPhone || student?.phone || '9876543210',
      relationship: 'Guardian' as const
    };

    const newSchedule: PTMSchedule = {
      id: `ptm-sch-req-${Date.now()}`,
      ptmEventId: 'ptm-event-custom',
      ptmEventTitle: payload.meetingType || '1-on-1 Faculty & Student Mentoring Consultation',
      studentId: payload.studentId,
      studentName: student?.name || user.name,
      enrollmentNo: student?.enrollmentNo || user.username || user.enrollmentNo || '230101001',
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone,
      parentRelationship: (parent.relationship as any) || 'Guardian',
      facultyId: payload.facultyId,
      facultyName: faculty?.name || 'Assigned Faculty Mentor',
      instituteId: institute?.id || 'inst-1',
      instituteName: institute?.name || 'Swarrnim School of Computing & IT',
      departmentId: department?.id || 'dept-cse',
      departmentName: department?.name || 'Computer Science & Engineering',
      programId: program?.id || 'prog-1',
      programName: program?.name || 'B.Tech Computer Science & Engineering',
      semesterId: semester?.id || 'sem-4',
      semesterNumber: semester?.number || 4,
      divisionId: division?.id || 'div-1',
      divisionName: division?.name || 'Division A',
      date: payload.preferredDate,
      startTime: payload.preferredTime.split('-')[0]?.trim() || '11:00',
      endTime: payload.preferredTime.split('-')[1]?.trim() || '11:30',
      slotTime: payload.preferredTime,
      venue: payload.mode === 'ONLINE' ? 'Virtual Google Meet Link' : 'Faculty Cabin / Department Room 302',
      mode: payload.mode,
      meetingLink: payload.mode === 'ONLINE' ? 'https://meet.google.com/ssiu-mentor-consult' : undefined,
      status: 'SCHEDULED',
      parentResponse: 'CONFIRMED',
      parentResponseReason: payload.agenda,
      attendanceStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const updatedSchedules = [newSchedule, ...this.data.schedules];
    this.saveToStorage({
      ...this.data,
      schedules: updatedSchedules
    });

    return newSchedule;
  }

  // ─── PTM Records (Dossier & Discussion) ───────────────────────────────────

  public getRecords(user: User, role: UserRole): PTMRecord[] {
    const allRecords = this.data.records;

    if (['SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR'].includes(role)) {
      return allRecords;
    }

    return allRecords.filter(r => this.isAuthorizedForStudent(r.studentId, user, role));
  }

  public getRecordById(id: string): PTMRecord | undefined {
    return this.data.records.find(r => r.id === id);
  }

  public getRecordByScheduleId(scheduleId: string): PTMRecord | undefined {
    return this.data.records.find(r => r.ptmScheduleId === scheduleId);
  }

  public savePTMRecord(recordData: Omit<PTMRecord, 'id' | 'createdAt'> & { id?: string }, user: User): PTMRecord {
    let savedRecord: PTMRecord;
    const now = new Date().toISOString();

    if (recordData.id) {
      const idx = this.data.records.findIndex(r => r.id === recordData.id);
      if (idx !== -1) {
        savedRecord = {
          ...this.data.records[idx],
          ...recordData,
          updatedAt: now
        } as PTMRecord;

        const newRecords = [...this.data.records];
        newRecords[idx] = savedRecord;
        
        this.saveToStorage({
          ...this.data,
          records: newRecords
        });
      } else {
        savedRecord = {
          ...recordData,
          id: recordData.id,
          createdAt: now
        } as PTMRecord;
        this.saveToStorage({
          ...this.data,
          records: [savedRecord, ...this.data.records]
        });
      }
    } else {
      const newId = `ptm-rec-${Date.now()}`;
      savedRecord = {
        ...recordData,
        id: newId,
        createdAt: now
      } as PTMRecord;

      this.saveToStorage({
        ...this.data,
        records: [savedRecord, ...this.data.records]
      });
    }

    // Link record to schedule & update schedule status to COMPLETED
    if (recordData.ptmScheduleId) {
      this.updateSchedule(recordData.ptmScheduleId, {
        ptmRecordId: savedRecord.id,
        status: 'COMPLETED',
        attendanceStatus: recordData.attendanceStatus || 'PRESENT'
      });
    }

    return savedRecord;
  }

  // ─── Follow-Up Actions ────────────────────────────────────────────────────

  public getFollowUpActions(user: User, role: UserRole, filter?: {
    status?: string;
    priority?: string;
    studentId?: string;
    search?: string;
  }): PTMFollowUpAction[] {
    let actions = this.data.followUps;

    // RBAC filter
    if (['SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'DEPUTY_REGISTRAR'].includes(role)) {
      // All
    } else {
      actions = actions.filter(a => this.isAuthorizedForStudent(a.studentId, user, role));
    }

    // Mark overdue items dynamically
    const today = new Date().toISOString().split('T')[0];
    actions = actions.map(a => {
      if (a.status === 'PENDING' || a.status === 'IN_PROGRESS') {
        if (a.dueDate < today) {
          return { ...a, status: 'OVERDUE' };
        }
      }
      return a;
    });

    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        actions = actions.filter(a => a.status === filter.status);
      }
      if (filter.priority && filter.priority !== 'ALL') {
        actions = actions.filter(a => a.priority === filter.priority);
      }
      if (filter.studentId) {
        actions = actions.filter(a => a.studentId === filter.studentId);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        actions = actions.filter(a => 
          a.studentName.toLowerCase().includes(q) ||
          a.enrollmentNo.toLowerCase().includes(q) ||
          a.actionDescription.toLowerCase().includes(q) ||
          a.assignedToName.toLowerCase().includes(q)
        );
      }
    }

    return actions;
  }

  public createFollowUpAction(actionData: Omit<PTMFollowUpAction, 'id' | 'createdAt'>): PTMFollowUpAction {
    const newAction: PTMFollowUpAction = {
      ...actionData,
      id: `ptm-act-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const newActions = [newAction, ...this.data.followUps];
    this.saveToStorage({
      ...this.data,
      followUps: newActions
    });

    return newAction;
  }

  public updateFollowUpAction(id: string, updates: Partial<PTMFollowUpAction>): PTMFollowUpAction | undefined {
    const idx = this.data.followUps.findIndex(a => a.id === id);
    if (idx === -1) return undefined;

    const updated = { ...this.data.followUps[idx], ...updates };
    const newActions = [...this.data.followUps];
    newActions[idx] = updated;

    this.saveToStorage({
      ...this.data,
      followUps: newActions
    });

    return updated;
  }

  // ─── Student PTM History ──────────────────────────────────────────────────

  public getPTMHistoryForStudent(studentId: string, user: User, role: UserRole) {
    if (!this.isAuthorizedForStudent(studentId, user, role)) {
      return { schedules: [], records: [], followUps: [] };
    }

    const isMatch = (sId?: string, enroll?: string) =>
      sId === studentId ||
      (studentId === 'stu-1' && (sId === 'student-1' || enroll === '230101001')) ||
      (studentId === 'student-1' && (sId === 'stu-1' || enroll === '230101001')) ||
      (enroll === '230101001');

    const schedules = this.data.schedules.filter(s => isMatch(s.studentId, s.enrollmentNo));
    let records = this.data.records.filter(r => isMatch(r.studentId, r.enrollmentNo));

    // If role is STUDENT, filter out faculty remarks if visibleToStudent is false
    if (role === 'STUDENT') {
      records = records.map(r => {
        if (!r.visibleToStudent) {
          return {
            ...r,
            facultyRemarks: 'Remarks reserved for internal mentoring record.'
          };
        }
        return r;
      });
    }

    const followUps = this.data.followUps.filter(a => isMatch(a.studentId, a.enrollmentNo));

    return { schedules, records, followUps };
  }

  // ─── Stats & Analytics ────────────────────────────────────────────────────

  public getPTMStats(user: User, role: UserRole) {
    const events = this.getEvents(user, role);
    const schedules = this.getSchedules(user, role);
    const followUps = this.getFollowUpActions(user, role);

    const totalPTMs = events.length;
    const upcomingPTMs = events.filter(e => e.status === 'SCHEDULED').length;
    const completedPTMs = events.filter(e => e.status === 'COMPLETED').length;

    const parentsInvited = schedules.length;
    const parentsAttended = schedules.filter(s => s.attendanceStatus === 'PRESENT' || s.status === 'ATTENDED' || s.status === 'COMPLETED').length;
    const parentsConfirmed = schedules.filter(s => s.parentResponse === 'CONFIRMED').length;
    const parentsPending = schedules.filter(s => s.parentResponse === 'PENDING').length;
    const parentsMissed = schedules.filter(s => s.attendanceStatus === 'ABSENT' || s.status === 'MISSED').length;
    const parentsRescheduled = schedules.filter(s => s.parentResponse === 'RESCHEDULE_REQUESTED' || s.status === 'RESCHEDULED').length;

    const followUpsPending = followUps.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length;
    const followUpsOverdue = followUps.filter(a => a.status === 'OVERDUE').length;

    const attendanceRate = parentsInvited > 0 ? Math.round((parentsAttended / parentsInvited) * 100) : 0;

    return {
      totalPTMs,
      upcomingPTMs,
      completedPTMs,
      parentsInvited,
      parentsAttended,
      parentsConfirmed,
      parentsPending,
      parentsMissed,
      parentsRescheduled,
      followUpsPending,
      followUpsOverdue,
      attendanceRate
    };
  }

  public getComprehensiveDashboardKPIs(user: User, role: UserRole) {
    const events = this.getEvents(user, role);
    const schedules = this.getSchedules(user, role);
    const records = this.getRecords(user, role);
    const followUps = this.getFollowUpActions(user, role);

    const totalEvents = events.length;
    const scheduledEvents = events.filter(e => e.status === 'SCHEDULED').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const cancelledEvents = events.filter(e => e.status === 'CANCELLED').length;

    const totalSchedules = schedules.length;
    const scheduledCount = schedules.filter(s => s.status === 'SCHEDULED' || s.status === 'INVITED').length;
    const confirmedCount = schedules.filter(s => s.parentResponse === 'CONFIRMED' || s.status === 'CONFIRMED').length;
    const pendingCount = schedules.filter(s => s.parentResponse === 'PENDING').length;
    const completedCount = schedules.filter(s => s.status === 'COMPLETED' || s.status === 'ATTENDED' || s.attendanceStatus === 'PRESENT').length;
    const cancelledCount = schedules.filter(s => s.status === 'CANCELLED' || s.parentResponse === 'DECLINED').length;

    const uniqueStudents = new Set(schedules.map(s => s.studentId || s.enrollmentNo));
    const studentsCovered = uniqueStudents.size;

    // Feedback pending = completed consultations without parent satisfaction score or remarks
    const feedbackPendingCount = records.filter(r => !r.parentFeedback && !r.parentSatisfactionScore).length;

    // Follow-ups pending & overdue
    const followUpsPendingCount = followUps.filter(f => f.status === 'PENDING' || f.status === 'IN_PROGRESS').length;
    const overdueActionsCount = followUps.filter(f => f.status === 'OVERDUE').length;

    const attendanceRate = totalSchedules > 0 ? Math.round((completedCount / totalSchedules) * 100) : 0;
    const parentResponseRate = totalSchedules > 0 ? Math.round(((totalSchedules - pendingCount) / totalSchedules) * 100) : 0;

    return {
      totalEvents,
      scheduledEvents,
      completedEvents,
      cancelledEvents,
      totalSchedules,
      scheduledCount,
      confirmedCount,
      pendingCount,
      completedCount,
      cancelledCount,
      studentsCovered,
      feedbackPendingCount,
      followUpsPendingCount,
      overdueActionsCount,
      attendanceRate,
      parentResponseRate
    };
  }

  public getDepartmentParticipationStats(user: User, role: UserRole) {
    const schedules = this.getSchedules(user, role);
    const deptMap: Record<string, { total: number; attended: number; pending: number }> = {};

    schedules.forEach(s => {
      const deptName = s.departmentName || 'General';
      if (!deptMap[deptName]) {
        deptMap[deptName] = { total: 0, attended: 0, pending: 0 };
      }
      deptMap[deptName].total += 1;
      if (s.attendanceStatus === 'PRESENT' || s.status === 'COMPLETED' || s.status === 'ATTENDED') {
        deptMap[deptName].attended += 1;
      } else {
        deptMap[deptName].pending += 1;
      }
    });

    return Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      total: data.total,
      attended: data.attended,
      pending: data.pending,
      percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0
    }));
  }

  // ─── Excel Report Generator ───────────────────────────────────────────────

  public async exportPTMReportToExcel(filter: any, user: User, role: UserRole): Promise<void> {
    const schedules = filter?.filteredSchedules && Array.isArray(filter.filteredSchedules) 
      ? filter.filteredSchedules 
      : this.getSchedules(user, role, filter);

    const records = this.getRecords(user, role);
    const followUps = this.getFollowUpActions(user, role);
    const events = this.getEvents(user, role);

    await ptmExcelReportService.generateAndDownloadReport(
      schedules,
      records,
      followUps,
      events,
      user,
      role,
      filter
    );
  }
}

export const ptmService = new PTMService();
