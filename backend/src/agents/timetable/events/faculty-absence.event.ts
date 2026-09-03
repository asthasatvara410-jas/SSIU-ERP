export interface FacultyAbsenceReportedEvent {
  eventId: string;
  eventType: 'FACULTY_ABSENCE_REPORTED';
  institutionId: string;
  departmentId?: string;
  facultyId: string;
  absenceDate: string; // YYYY-MM-DD
  reason: string;
  reportedAt: Date;
  correlationId: string;
}

export class FacultyAbsenceEventDto {
  absenceDate: string; // YYYY-MM-DD
  reason: string;
}
