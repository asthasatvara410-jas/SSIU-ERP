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

export interface CandidateFacultyScore {
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName?: string;
  isAvailable: boolean;
  hasScheduleConflict: boolean;
  currentWorkloadMin: number;
  maxWorkloadMin: number;
  subjectExpertiseScore: number; // 0-100
  departmentMatchBonus: number; // e.g. +20
  workloadCapacityScore: number; // higher for lower workload
  totalScore: number; // 0-100
  recommendationReason: string;
}

export interface SubstitutionProposal {
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
  assignedRole: string; // 'HOD' | 'PRINCIPAL' | 'ADMIN'
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  executedAt?: Date;
  correlationId: string;
  tenantId: string;
  createdAt: Date;
}
