export type SubstitutionStatus = 
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED';

export interface AffectedLectureSlot {
  timetableEntryId: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  divisionId: string;
  subjectId: string;
  subjectName?: string;
  originalFacultyId: string;
  roomNumber: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotType: string;
}

export interface SubstitutionProposalItem {
  id: string;
  timetableEntryId: string;
  originalFacultyId: string;
  originalFacultyName?: string;
  substituteFacultyId: string;
  substituteFacultyName?: string;
  absenceDate: string;
  slotTime: string;
  roomNumber: string;
  subjectName: string;
  division: string;
  status: SubstitutionStatus;
  matchingScore: number;
  reason: string;
  assignedRole: string;
  workloadImpact?: string;
  conflictStatus?: string;
  createdAt: string;
}
