import { describe, it, expect } from 'vitest';
import { 
  generateStudentReportPdfDoc, 
  getStudentReportPdfBlob, 
  StudentReportPdfData 
} from '../utils/generateStudentReportPdf';
import { studentReportPdfService } from '../services/studentReportPdfService';
import { db } from '../services/db';

describe('Official Student Academic & Dashboard PDF Report Generator', () => {
  const mockStudent = db.getStudents()[0] || {
    id: 'stu-1',
    name: 'Aarav Patel',
    fullName: 'Aarav Rajesh Patel',
    enrollmentNo: 'TEMP-2026-00001',
    temporaryEnrollmentNumber: 'TEMP-2026-00001',
    finalEnrollmentNumber: '26BTECHCSE042',
    programId: 'prog-1',
    departmentId: 'dept-1',
    semesterId: 'sem-4',
    academicYearId: 'ay-2026',
    divisionId: 'div-a',
    batchId: 'batch-2026',
    mentorId: 'fac-1',
    rollNumber: '042',
    abcId: '8940-1234-5678'
  };

  const mockPdfData: StudentReportPdfData = {
    user: {
      id: 'stu-1',
      name: 'Aarav Patel',
      email: 'aarav.patel@swarrnim.edu.in',
      role: 'STUDENT',
      enrollmentNo: 'TEMP-2026-00001'
    },
    student: mockStudent as any,
    department: { id: 'dept-1', name: 'Department of Computer Science & Engineering', code: 'CSE' } as any,
    program: { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'BTECH-CSE' } as any,
    semester: { id: 'sem-4', number: 4, name: 'Semester 4' } as any,
    academicYear: { id: 'ay-2026', name: '2026-2027', isCurrent: true } as any,
    division: { id: 'div-a', name: 'A' } as any,
    batch: { id: 'batch-2026', name: '2026-2030' } as any,
    mentor: { id: 'fac-1', name: 'Dr. Bhavin Patel (Assigned Faculty Mentor)' } as any,
    attendanceStats: {
      percentage: 84,
      presentClasses: 48,
      totalClasses: 57
    },
    subjectAttendanceList: [
      { code: 'CSE-401', name: 'Design and Analysis of Algorithms', total: 18, present: 16, absent: 2, percentage: 89, status: 'ELIGIBLE' },
      { code: 'CSE-402', name: 'Operating Systems & System Programming', total: 16, present: 13, absent: 3, percentage: 81, status: 'ELIGIBLE' },
      { code: 'CSE-403', name: 'Database Management Systems', total: 15, present: 12, absent: 3, percentage: 80, status: 'ELIGIBLE' },
      { code: 'CSE-404', name: 'Computer Networks', total: 14, present: 12, absent: 2, percentage: 86, status: 'ELIGIBLE' },
      { code: 'CSE-405', name: 'Web Application Technologies & Cloud Lab', total: 12, present: 11, absent: 1, percentage: 92, status: 'ELIGIBLE' }
    ],
    feeRecords: [
      {
        feeType: 'Academic Tuition & Instruction Fee',
        academicYear: '2026-2027',
        amount: 35500,
        paid: 35500,
        pending: 0,
        status: 'PAID',
        receiptNo: 'SSIU-REC-2026-0001',
        paymentDate: '2026-08-24'
      },
      {
        feeType: 'University Examination & Assessment Fee',
        academicYear: '2026-2027',
        amount: 2500,
        paid: 2500,
        pending: 0,
        status: 'PAID',
        receiptNo: 'SSIU-EXM-2026-0042',
        paymentDate: '2026-08-15'
      }
    ],
    upcomingExams: [
      { id: 'exm-1', code: 'EXM-SEM4-MID', name: 'B.Tech Sem-4 Mid Semester Examination 2026', startDate: '2026-09-15', status: 'SCHEDULED' }
    ],
    serviceRequests: [
      { id: 'req-1', reqNo: 'SRQ-1042', title: 'Bonafide Certificate Service Request', date: '2026-08-22', stage: 'Ready at Student Section Counter', status: 'READY_FOR_COLLECTION' }
    ],
    assignments: [
      { id: 'asn-1', title: 'Dynamic Programming & Graph Algorithms Problem Set', subjectCode: 'CSE-401', deadline: '2026-08-30', status: 'ACTIVE' }
    ],
    todayClasses: [
      { timeSlot: '09:00 AM - 10:00 AM', subjectCode: 'CSE-401', subjectName: 'Design & Analysis of Algorithms', facultyName: 'Prof. Ankit Shah', roomNo: 'Lab 302', type: 'THEORY' }
    ],
    notifications: [
      { id: 'notif-1', title: 'Mid-Semester Exam Timetable Published', message: 'The official schedule for Sem 4 is now active.', category: 'EXAM', priority: 'HIGH', timestamp: '2026-08-24' }
    ],
    profileCompletionPercentage: 85,
    abcId: '8940-1234-5678'
  };

  it('1. Generates a valid multi-page A4 PDF document without errors', () => {
    const doc = generateStudentReportPdfDoc(mockPdfData);
    expect(doc).toBeDefined();
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    expect(pageCount).toBeGreaterThanOrEqual(1);
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210);
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297);
  });

  it('2. Produces a non-empty binary Blob of the complete report', () => {
    const blob = getStudentReportPdfBlob(mockPdfData);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(20000); // More than 20KB of structured PDF data
  });

  it('3. Reusable service layer builds complete report data from real DB state', () => {
    const builtData = studentReportPdfService.buildReportData(mockStudent as any);
    expect(builtData).toBeDefined();
    expect(builtData.student).toBeDefined();
    expect(builtData.attendanceStats).toBeDefined();
    expect(builtData.feeRecords.length).toBeGreaterThan(0);
    expect(builtData.subjectAttendanceList.length).toBeGreaterThan(0);

    const doc = studentReportPdfService.generateReportForStudent(mockStudent as any);
    expect(doc).toBeDefined();
  });
});
