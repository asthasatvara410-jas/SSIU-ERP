export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface AcademicPeriodSlot {
  slotIndex: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface TimetableGenerationOptions {
  departmentId?: string;
  semesterId?: string;
  academicYearId?: string;
  workingDays: DayOfWeek[];
  periodSlots: AcademicPeriodSlot[];
  maxDailyHoursPerFaculty: number;
  maxWeeklyHoursPerFaculty: number;
  allowConsecutiveLabs: boolean;
}

export interface TimetableScheduleConflict {
  conflictType: 'FACULTY_CLASH' | 'ROOM_CLASH' | 'SECTION_CLASH' | 'WORKLOAD_EXCEEDED' | 'UNASSIGNED_COURSE';
  severity: 'CRITICAL' | 'WARNING';
  day: DayOfWeek;
  periodSlot: string;
  entityId: string;
  entityName: string;
  description: string;
}

export interface GeneratedScheduleEntry {
  id: string;
  day: DayOfWeek;
  slotIndex: number;
  timeSlot: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  roomNumber: string;
  roomType: 'LECTURE_HALL' | 'LABORATORY' | 'SEMINAR_ROOM';
  section: string;
  semester: number;
  departmentId: string;
}

export interface GeneratedTimetablePreview {
  scheduleId: string;
  generatedAt: string;
  status: 'DRAFT_PREVIEW';
  options: TimetableGenerationOptions;
  entries: GeneratedScheduleEntry[];
  conflicts: TimetableScheduleConflict[];
  utilizationMetrics: {
    totalSessionsScheduled: number;
    roomOccupancyRate: number;
    facultyUtilizationRate: number;
    unassignedSubjectCount: number;
  };
}

export interface FacultyWorkloadSummary {
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  assignedSubjects: {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    weeklyHours: number;
    isPractical: boolean;
  }[];
  totalAssignedWeeklyHours: number;
  maxAllowedWeeklyHours: number;
  isOverloaded: boolean;
  workloadPercentage: number;
}

export interface RoomOccupancyMetric {
  roomNumber: string;
  roomType: 'LECTURE_HALL' | 'LABORATORY' | 'SEMINAR_ROOM';
  capacity: number;
  departmentId: string;
  totalSlots: number;
  occupiedSlots: number;
  occupancyPercentage: number;
}
