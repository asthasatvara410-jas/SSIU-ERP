/**
 * Examination Hall Ticket Types and Interfaces
 */

export interface HallTicketSubject {
  sr: number;
  subjectCode: string;
  subjectName: string;
  examDate: string; // YYYY-MM-DD
  examDay: string; // Monday, Tuesday, etc.
  examTime: string; // 10:30 AM - 01:30 PM
  roomNo: string;
  seatNo: string;
  subjectType?: 'THEORY' | 'PRACTICAL' | 'VIVA' | string;
  credits?: number;
}

export interface HallTicketData {
  // University & Header Information
  universityName: string;
  universitySubtitle: string;
  campusAddress: string;
  documentTitle: string;
  academicYear: string;
  examSession: string;
  examName: string;
  examCode: string;
  examType: string;
  hallTicketNo: string;
  examSeatNo: string;
  generatedDate: string;
  barcodeValue?: string;

  // Student Master Details
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  admissionNo: string;
  grNo?: string;
  instituteName: string;
  programName: string;
  departmentName: string;
  semesterName: string;
  division: string;
  batch: string;
  gender: string;
  photoUrl?: string;

  // Examination Centre Details
  centreName: string;
  centreCode: string;
  centreBuilding?: string;
  centreAddress?: string;
  reportingTime: string;
  examStartTime: string;
  examEndTime: string;

  // Schedule Table
  subjects: HallTicketSubject[];

  // Candidate Instructions
  instructions?: string[];

  // Signatory & Authorizations
  studentSignLabel?: string;
  superintendentLabel?: string;
  coeLabel?: string;
  officialDisclaimer?: string;
}
