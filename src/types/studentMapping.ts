// ==============================================================================
// SWARRNIM UNIVERSITY ERP — CENTRALIZED STUDENT MAPPING TYPES
// ==============================================================================

export type StudentMappingStatus = 'ACTIVE' | 'INACTIVE' | 'HISTORICAL' | 'PROVISIONAL' | 'TRANSFERRED' | 'COMPLETED';

export interface StudentEnrollmentMapping {
  id: string;
  studentId: string;
  enrollmentNo: string;
  studentName?: string;
  studentEmail?: string;
  academicYear: string; // e.g. "2024-25", "2025-26", "2026-27"
  academicYearId?: string;
  instituteId: string;
  instituteCode?: string;
  instituteName?: string;
  departmentId: string;
  departmentCode?: string;
  departmentName?: string;
  programId: string;
  programCode?: string;
  programName?: string;
  semester: number; // e.g. 1, 2, 3, 4, 5, 6, 7, 8
  semesterId: string;
  divisionId: string;
  division: string; // e.g. "A", "B", "C"
  classBatchId?: string;
  batchName?: string; // e.g. "2024-2028", "Batch A1"
  mentorFacultyId?: string;
  mentorName?: string;
  mentorEmail?: string;
  status: StudentMappingStatus;
  isCurrent: boolean; // True for the active current semester mapping
  mappedBy: string;
  mappedByName?: string;
  mappedByRole?: string;
  mappedAt: string; // ISO String
  updatedAt?: string;
  batchImportSessionId?: string;
  remarks?: string;
}

export type MappingHistoryStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED';

export interface StudentMappingHistoryRowDetail {
  rowNo: number;
  enrollmentNo: string;
  studentName: string;
  studentEmail?: string;
  institute: string;
  department: string;
  program: string;
  academicYear: string;
  semester: string;
  division: string;
  batch?: string;
  mentor?: string;
  studentStatus?: string;
  actionTaken: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  error?: string;
}

export interface StudentMappingHistoryRecord {
  id: string;
  batchId: string;
  timestamp: string; // ISO date string
  importedBy: string;
  importedByName: string;
  importedByRole: string;
  academicYear: string;
  institute: string;
  department: string;
  program: string;
  semester: string;
  division: string;
  totalRecords: number;
  successful: number;
  updatedExisting: number;
  newStudents: number;
  failed: number;
  skipped: number;
  status: MappingHistoryStatus;
  fileName?: string;
  fileSize?: string;
  rowDetails: StudentMappingHistoryRowDetail[];
  notes?: string;
}

export interface RawStudentMappingExcelRow {
  'Enrollment No'?: string | number;
  'Enrollment Number'?: string | number;
  'Student Name'?: string;
  'Student Email'?: string;
  'Email'?: string;
  'Institute'?: string;
  'Institute Code'?: string;
  'Department'?: string;
  'Department Code'?: string;
  'Program Code'?: string;
  'Program Name'?: string;
  'Program'?: string;
  'Academic Year'?: string;
  'Semester'?: string | number;
  'Division'?: string;
  'Class / Batch'?: string;
  'Batch'?: string;
  'Mentor Faculty'?: string;
  'Mentor'?: string;
  'Student Status'?: string;
  'Status'?: string;
  [key: string]: any;
}

export interface ParsedMappingRow {
  rowNo: number;
  enrollmentNo: string;
  studentName: string;
  studentEmail?: string;
  instituteCode: string;
  departmentCode: string;
  programCode: string;
  academicYear: string;
  semesterNumber: number;
  division: string;
  batchName?: string;
  mentorFaculty?: string;
  studentStatus: string;
  
  // Resolved Master IDs
  resolvedInstituteId?: string;
  resolvedDepartmentId?: string;
  resolvedProgramId?: string;
  resolvedSemesterId?: string;
  resolvedDivisionId?: string;
  resolvedBatchId?: string;
  resolvedMentorId?: string;
  
  // Resolved Master Display Names
  resolvedInstituteName?: string;
  resolvedDepartmentName?: string;
  resolvedProgramName?: string;
  resolvedMentorName?: string;
  
  // Validation flags
  isValid: boolean;
  isExistingStudent: boolean;
  existingStudentId?: string;
  isAlreadyMappedCurrentSemester: boolean;
  errors: string[];
  warnings: string[];
}

export interface BulkMappingValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newStudentsCount: number;
  existingStudentsCount: number;
  alreadyMappedCount: number;
  duplicateRowsCount: number;
  errorRowsCount: number;
  rows: ParsedMappingRow[];
  errorRows: ParsedMappingRow[];
  canImport: boolean;
  globalErrors?: string[];
}

export interface BulkMappingExecutionResult {
  success: boolean;
  historyId: string;
  totalRecords: number;
  successfullyMapped: number;
  updatedExisting: number;
  newCreated: number;
  skipped: number;
  failed: number;
  message: string;
  errors?: string[];
  historyRecord: StudentMappingHistoryRecord;
}
