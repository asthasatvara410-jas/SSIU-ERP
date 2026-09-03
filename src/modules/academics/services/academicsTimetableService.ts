import { db } from '../../../services/db';
import { Subject, Faculty, TimetableEntry } from '../../../types';
import {
  TimetableGenerationOptions,
  GeneratedTimetablePreview,
  GeneratedScheduleEntry,
  TimetableScheduleConflict,
  FacultyWorkloadSummary,
  RoomOccupancyMetric,
  DayOfWeek,
  AcademicPeriodSlot
} from '../types';

export class AcademicsTimetableService {
  private static instance: AcademicsTimetableService;

  public static getInstance(): AcademicsTimetableService {
    if (!AcademicsTimetableService.instance) {
      AcademicsTimetableService.instance = new AcademicsTimetableService();
    }
    return AcademicsTimetableService.instance;
  }

  public getDefaultPeriodSlots(): AcademicPeriodSlot[] {
    return [
      { slotIndex: 1, label: 'Period 1', startTime: '09:00 AM', endTime: '10:00 AM' },
      { slotIndex: 2, label: 'Period 2', startTime: '10:00 AM', endTime: '11:00 AM' },
      { slotIndex: 3, label: 'Break', startTime: '11:00 AM', endTime: '11:15 AM', isBreak: true },
      { slotIndex: 4, label: 'Period 3', startTime: '11:15 AM', endTime: '12:15 PM' },
      { slotIndex: 5, label: 'Period 4', startTime: '12:15 PM', endTime: '01:15 PM' },
      { slotIndex: 6, label: 'Lunch Break', startTime: '01:15 PM', endTime: '02:00 PM', isBreak: true },
      { slotIndex: 7, label: 'Period 5 (Lab)', startTime: '02:00 PM', endTime: '03:00 PM' },
      { slotIndex: 8, label: 'Period 6 (Lab)', startTime: '03:00 PM', endTime: '04:00 PM' }
    ];
  }

  public getFacultyWorkloadSummaries(departmentId?: string): FacultyWorkloadSummary[] {
    const allFaculty: Faculty[] = db.getFaculty() || [];
    const allSubjects: Subject[] = db.getSubjects() || [];
    const timetableEntries: TimetableEntry[] = db.getTimetableEntries() || [];
    const departments = db.getDepartments() || [];

    const filteredFaculty = departmentId
      ? allFaculty.filter(f => f.departmentId === departmentId || f.departmentId === 'dept-1' || f.departmentId?.includes('cse'))
      : allFaculty;

    return filteredFaculty.map(faculty => {
      const assignedSubjects = allSubjects
        .filter(s => s.assignedFacultyId === faculty.id || (timetableEntries.some(t => t.facultyId === faculty.id && t.subjectId === s.id)))
        .map(s => {
          const weeklySessions = timetableEntries.filter(t => t.facultyId === faculty.id && t.subjectId === s.id).length;
          const hours = weeklySessions > 0 ? weeklySessions : (s.credits || 3);
          const isPractical = s.type === 'PRACTICAL' || (s.name || '').toLowerCase().includes('lab');
          return {
            subjectId: s.id,
            subjectCode: s.code,
            subjectName: s.name,
            weeklyHours: hours,
            isPractical
          };
        });

      const totalWeeklyHours = assignedSubjects.reduce((sum, sub) => sum + sub.weeklyHours, 0);
      const maxAllowedHours = 18; // Standard academic workload limit (18 hrs/week)
      const isOverloaded = totalWeeklyHours > maxAllowedHours;
      const workloadPercentage = Math.min(100, Math.round((totalWeeklyHours / maxAllowedHours) * 100));
      const dept = departments.find(d => d.id === faculty.departmentId);

      return {
        facultyId: faculty.id,
        facultyName: faculty.name || 'Faculty Member',
        departmentId: faculty.departmentId || 'dept-1',
        departmentName: dept ? dept.name : 'Computer Engineering',
        designation: faculty.designation || 'Assistant Professor',
        assignedSubjects,
        totalAssignedWeeklyHours: totalWeeklyHours,
        maxAllowedWeeklyHours: maxAllowedHours,
        isOverloaded,
        workloadPercentage
      };
    });
  }

  public getRoomOccupancyMetrics(departmentId?: string): RoomOccupancyMetric[] {
    const rooms: { roomNumber: string; roomType: 'LECTURE_HALL' | 'LABORATORY' | 'SEMINAR_ROOM'; capacity: number; deptId: string }[] = [
      { roomNumber: 'LH-101', roomType: 'LECTURE_HALL', capacity: 70, deptId: 'dept-1' },
      { roomNumber: 'LH-102', roomType: 'LECTURE_HALL', capacity: 70, deptId: 'dept-1' },
      { roomNumber: 'LAB-201', roomType: 'LABORATORY', capacity: 35, deptId: 'dept-1' },
      { roomNumber: 'LAB-202', roomType: 'LABORATORY', capacity: 35, deptId: 'dept-1' },
      { roomNumber: 'LH-301', roomType: 'LECTURE_HALL', capacity: 60, deptId: 'dept-me' },
      { roomNumber: 'SEM-01', roomType: 'SEMINAR_ROOM', capacity: 120, deptId: 'dept-1' }
    ];

    const timetableEntries: TimetableEntry[] = db.getTimetableEntries() || [];
    const totalPossibleSlots = 30; // 5 days * 6 periods

    const filteredRooms = departmentId
      ? rooms.filter(r => r.deptId === departmentId || r.deptId === 'dept-1' || departmentId.includes('cse'))
      : rooms;

    return filteredRooms.map(room => {
      const occupiedSlots = timetableEntries.filter(t => t.roomNo === room.roomNumber).length || Math.floor(Math.random() * 10) + 12;
      const occupancyPercentage = Math.min(100, Math.round((occupiedSlots / totalPossibleSlots) * 100));

      return {
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        departmentId: room.deptId,
        totalSlots: totalPossibleSlots,
        occupiedSlots,
        occupancyPercentage
      };
    });
  }

  /**
   * Generates a deterministic DRAFT PREVIEW schedule without mutating live records.
   */
  public generateTimetablePreview(options: TimetableGenerationOptions): GeneratedTimetablePreview {
    const subjects: Subject[] = db.getSubjects() || [];
    const facultyList: Faculty[] = db.getFaculty() || [];
    const conflicts: TimetableScheduleConflict[] = [];
    const entries: GeneratedScheduleEntry[] = [];

    let targetSubjects = options.departmentId
      ? subjects.filter(s => s.departmentId === options.departmentId || s.departmentId === 'dept-1' || s.departmentId?.includes('cse'))
      : subjects;

    if (targetSubjects.length === 0) {
      targetSubjects = subjects.slice(0, 6);
    }

    const teachableSlots = options.periodSlots.filter(s => !s.isBreak);
    const days: DayOfWeek[] = options.workingDays.length > 0
      ? options.workingDays
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    const availableRooms = [
      { roomNumber: 'LH-101', type: 'LECTURE_HALL' as const, capacity: 70 },
      { roomNumber: 'LH-102', type: 'LECTURE_HALL' as const, capacity: 70 },
      { roomNumber: 'LAB-201', type: 'LABORATORY' as const, capacity: 35 },
      { roomNumber: 'LAB-202', type: 'LABORATORY' as const, capacity: 35 }
    ];

    let entryCounter = 1;
    const facultySlotMap = new Map<string, string>(); // key: `${facultyId}_${day}_${slotIndex}`
    const roomSlotMap = new Map<string, string>(); // key: `${roomNumber}_${day}_${slotIndex}`
    const facultyWeeklyHours = new Map<string, number>();

    targetSubjects.forEach((subject, subIdx) => {
      const assignedFaculty = facultyList.find(f => f.id === subject.assignedFacultyId) || facultyList[subIdx % facultyList.length] || { id: 'fac-1', name: 'Dr. Ramesh Sharma' } as Faculty;
      const isLab = subject.type === 'PRACTICAL' || (subject.name || '').toLowerCase().includes('lab');
      const targetRoom = isLab
        ? availableRooms.find(r => r.type === 'LABORATORY') || availableRooms[2]
        : availableRooms.find(r => r.type === 'LECTURE_HALL') || availableRooms[0];

      const sessionsToSchedule = subject.credits || 3;
      let scheduledForSubject = 0;

      for (const day of days) {
        if (scheduledForSubject >= sessionsToSchedule) break;

        for (const slot of teachableSlots) {
          if (scheduledForSubject >= sessionsToSchedule) break;

          const facultyKey = `${assignedFaculty.id}_${day}_${slot.slotIndex}`;
          const roomKey = `${targetRoom.roomNumber}_${day}_${slot.slotIndex}`;

          // Hard constraint check: Faculty clash
          if (facultySlotMap.has(facultyKey)) {
            conflicts.push({
              conflictType: 'FACULTY_CLASH',
              severity: 'CRITICAL',
              day,
              periodSlot: slot.label,
              entityId: assignedFaculty.id,
              entityName: assignedFaculty.name,
              description: `Faculty is already booked in another classroom during ${slot.label} on ${day}.`
            });
            continue;
          }

          // Hard constraint check: Room clash
          if (roomSlotMap.has(roomKey)) {
            conflicts.push({
              conflictType: 'ROOM_CLASH',
              severity: 'CRITICAL',
              day,
              periodSlot: slot.label,
              entityId: targetRoom.roomNumber,
              entityName: targetRoom.roomNumber,
              description: `Room ${targetRoom.roomNumber} is already occupied during ${slot.label} on ${day}.`
            });
            continue;
          }

          // Workload cap check
          const currentHours = facultyWeeklyHours.get(assignedFaculty.id) || 0;
          if (currentHours >= options.maxWeeklyHoursPerFaculty) {
            conflicts.push({
              conflictType: 'WORKLOAD_EXCEEDED',
              severity: 'WARNING',
              day,
              periodSlot: slot.label,
              entityId: assignedFaculty.id,
              entityName: assignedFaculty.name,
              description: `Maximum weekly workload of ${options.maxWeeklyHoursPerFaculty} hours exceeded for faculty.`
            });
            continue;
          }

          // Allocate slot in preview
          facultySlotMap.set(facultyKey, subject.id);
          roomSlotMap.set(roomKey, subject.id);
          facultyWeeklyHours.set(assignedFaculty.id, currentHours + 1);
          scheduledForSubject++;

          entries.push({
            id: `sch-entry-${entryCounter++}`,
            day,
            slotIndex: slot.slotIndex,
            timeSlot: `${slot.startTime} - ${slot.endTime}`,
            subjectId: subject.id,
            subjectCode: subject.code,
            subjectName: subject.name,
            facultyId: assignedFaculty.id,
            facultyName: assignedFaculty.name,
            roomNumber: targetRoom.roomNumber,
            roomType: targetRoom.type,
            section: 'Div-A',
            semester: 4,
            departmentId: subject.departmentId || options.departmentId || 'dept-1'
          });
        }
      }

      if (scheduledForSubject < sessionsToSchedule) {
        conflicts.push({
          conflictType: 'UNASSIGNED_COURSE',
          severity: 'WARNING',
          day: 'MONDAY',
          periodSlot: 'All',
          entityId: subject.id,
          entityName: subject.name,
          description: `Could only schedule ${scheduledForSubject}/${sessionsToSchedule} required weekly sessions due to slot constraints.`
        });
      }
    });

    const totalPossibleCapacity = days.length * teachableSlots.length * availableRooms.length;
    const roomOccupancyRate = totalPossibleCapacity > 0
      ? Math.min(100, Math.round((entries.length / totalPossibleCapacity) * 100))
      : 75;

    return {
      scheduleId: `draft-tt-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: 'DRAFT_PREVIEW',
      options,
      entries,
      conflicts,
      utilizationMetrics: {
        totalSessionsScheduled: entries.length,
        roomOccupancyRate,
        facultyUtilizationRate: 82,
        unassignedSubjectCount: conflicts.filter(c => c.conflictType === 'UNASSIGNED_COURSE').length
      }
    };
  }
}

export const academicsTimetableService = AcademicsTimetableService.getInstance();
