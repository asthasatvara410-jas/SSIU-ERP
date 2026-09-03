import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface CurriculumVersionRecord {
  id: string;
  programId: string;
  versionNumber: number;
  effectiveAcademicYear: string;
  totalCredits: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface AcademicCourseRecord {
  id: string;
  code: string;
  name: string;
  credits: number;
  lectureHours: number;
  practicalHours: number;
  courseType: 'CORE' | 'ELECTIVE' | 'LAB';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TimetableSlotItem {
  id: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  courseCode: string;
  sectionName: string;
  facultyId: string;
  roomId: string;
  status: 'SCHEDULED' | 'CANCELLED';
}

export interface FacultySubstitutionRecord {
  id: string;
  originalFacultyId: string;
  substituteFacultyId: string;
  slotId: string;
  sessionDate: string;
  reason: string;
  approvedByUserId: string;
  status: 'APPROVED' | 'REJECTED';
}

class CurriculumTimetableGovernanceService {
  private static instance: CurriculumTimetableGovernanceService;

  private curriculums: CurriculumVersionRecord[] = [
    {
      id: 'cur-btech-cse-v2026',
      programId: 'prog-1',
      versionNumber: 2026,
      effectiveAcademicYear: 'ay-2026-27',
      totalCredits: 160,
      status: 'ACTIVE'
    }
  ];

  private courses: AcademicCourseRecord[] = [
    { id: 'crs-cs301', code: 'CS301', name: 'Database Management Systems', credits: 4, lectureHours: 3, practicalHours: 2, courseType: 'CORE', status: 'ACTIVE' },
    { id: 'crs-cs302', code: 'CS302', name: 'Operating Systems', credits: 4, lectureHours: 3, practicalHours: 2, courseType: 'CORE', status: 'ACTIVE' }
  ];

  private timetableSlots: TimetableSlotItem[] = [
    {
      id: 'slot-01',
      dayOfWeek: 'MONDAY',
      startTime: '10:00',
      endTime: '11:00',
      courseCode: 'CS301',
      sectionName: 'CSE-A',
      facultyId: 'emp-fac-101',
      roomId: 'room-301',
      status: 'SCHEDULED'
    }
  ];

  private substitutions: FacultySubstitutionRecord[] = [];

  private constructor() {}

  public static getInstance(): CurriculumTimetableGovernanceService {
    if (!CurriculumTimetableGovernanceService.instance) {
      CurriculumTimetableGovernanceService.instance = new CurriculumTimetableGovernanceService();
    }
    return CurriculumTimetableGovernanceService.instance;
  }

  // ─── CONFLICT DETECTION ENGINE ─────────────────────────────────────────

  public detectTimetableConflicts(proposedSlot: Omit<TimetableSlotItem, 'id' | 'status'>): {
    hasConflict: boolean;
    reason?: string;
  } {
    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
      return start1 < end2 && start2 < end1;
    };

    for (const existing of this.timetableSlots.filter(s => s.status === 'SCHEDULED' && s.dayOfWeek === proposedSlot.dayOfWeek)) {
      if (isOverlapping(proposedSlot.startTime, proposedSlot.endTime, existing.startTime, existing.endTime)) {
        if (existing.roomId === proposedSlot.roomId) {
          return { hasConflict: true, reason: `Room conflict: Room ${proposedSlot.roomId} is already occupied by ${existing.courseCode} (${existing.sectionName})` };
        }
        if (existing.facultyId === proposedSlot.facultyId) {
          return { hasConflict: true, reason: `Faculty conflict: Faculty ${proposedSlot.facultyId} is already scheduled for ${existing.courseCode}` };
        }
        if (existing.sectionName === proposedSlot.sectionName) {
          return { hasConflict: true, reason: `Section conflict: Section ${proposedSlot.sectionName} already has class ${existing.courseCode}` };
        }
      }
    }

    return { hasConflict: false };
  }

  public addTimetableSlot(slot: Omit<TimetableSlotItem, 'id' | 'status'>): TimetableSlotItem {
    const conflictCheck = this.detectTimetableConflicts(slot);
    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.reason);
    }

    const newSlot: TimetableSlotItem = {
      id: `slot-${Date.now()}`,
      ...slot,
      status: 'SCHEDULED'
    };

    this.timetableSlots.push(newSlot);
    return newSlot;
  }

  // ─── SUBSTITUTION WORKFLOW ─────────────────────────────────────────────

  public recordFacultySubstitution(params: Omit<FacultySubstitutionRecord, 'id'>): FacultySubstitutionRecord {
    const record: FacultySubstitutionRecord = {
      id: `sub-${Date.now()}`,
      ...params
    };
    this.substitutions.push(record);
    return record;
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getFacultySchedule(facultyId: string, context?: UserAuthorizationContext): TimetableSlotItem[] | undefined {
    // RBAC: If regular faculty, restrict to own schedule
    if (context && String(context.activeRole) === 'FACULTY' && context.userId !== facultyId) {
      return undefined;
    }

    return this.timetableSlots.filter(s => s.facultyId === facultyId && s.status === 'SCHEDULED');
  }
}

export const curriculumTimetableGovernanceService = CurriculumTimetableGovernanceService.getInstance();
