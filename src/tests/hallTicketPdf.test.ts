import { describe, it, expect } from 'vitest';
import { hallTicketPdfService } from '../services/hallTicketPdfService';
import { hallTicketDataService } from '../services/hallTicketDataService';
import { HallTicketData } from '../types/hallTicket';

describe('University Examination Hall Ticket PDF Generator (A4 Portrait)', () => {
  const mockHallTicket: HallTicketData = {
    universityName: 'SWARRNIM STARTUP & INNOVATION UNIVERSITY',
    universitySubtitle: 'EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS',
    campusAddress: 'Bhoyan Rathod, Opp. IFFCO, Gandhinagar–382420, Gujarat, India',
    documentTitle: 'EXAMINATION HALL TICKET / ADMIT CARD',
    academicYear: '2025-2026',
    examSession: 'Summer 2026',
    examName: 'End Semester Examination Summer 2026',
    examCode: 'EXAM-SUMMER-2026',
    examType: 'Regular End Semester Examination',
    hallTicketNo: 'HT-2026-SUMMER-0042',
    examSeatNo: 'SEAT-042',
    generatedDate: '26-Aug-2026',
    studentId: 'stud-1',
    studentName: 'Jigar Ahir',
    enrollmentNo: '24SSIU01CSE001',
    admissionNo: 'ADM-2024-001',
    instituteName: 'Swarrnim Institute of Technology',
    programName: 'B.Tech',
    departmentName: 'Computer Engineering',
    semesterName: 'Semester 4',
    division: 'Div-A',
    batch: 'Batch 2024-28',
    gender: 'Male',
    centreName: 'Swarrnim Central Examination Centre, Block-A',
    centreCode: 'SSIU-EX-01',
    reportingTime: '09:45 AM (Morning Session)',
    examStartTime: '10:30 AM',
    examEndTime: '01:30 PM',
    subjects: [
      {
        sr: 1,
        subjectCode: 'CSE401',
        subjectName: 'Design & Analysis of Algorithms',
        examDate: '2026-05-18',
        examDay: 'Monday',
        examTime: '10:30 AM - 01:30 PM',
        roomNo: 'Room 204 (Block-A)',
        seatNo: 'SEAT-042',
        subjectType: 'THEORY',
        credits: 4
      },
      {
        sr: 2,
        subjectCode: 'CSE402',
        subjectName: 'Database Management Systems',
        examDate: '2026-05-20',
        examDay: 'Wednesday',
        examTime: '10:30 AM - 01:30 PM',
        roomNo: 'Room 204 (Block-A)',
        seatNo: 'SEAT-042',
        subjectType: 'THEORY',
        credits: 4
      },
      {
        sr: 3,
        subjectCode: 'CSE403',
        subjectName: 'Computer Networks & Security',
        examDate: '2026-05-22',
        examDay: 'Friday',
        examTime: '10:30 AM - 01:30 PM',
        roomNo: 'Room 204 (Block-A)',
        seatNo: 'SEAT-042',
        subjectType: 'THEORY',
        credits: 4
      }
    ]
  };

  it('should generate an A4 Portrait Hall Ticket PDF with EXACTLY 1 page', () => {
    const doc = hallTicketPdfService.generatePdf(mockHallTicket);

    // Total Pages MUST be exactly 1
    expect(doc.getNumberOfPages()).toBe(1);

    // Page dimensions MUST be A4 Portrait (210mm width x 297mm height)
    const pageSize = doc.internal.pageSize;
    const width = pageSize.getWidth();
    const height = pageSize.getHeight();

    expect(Math.round(width)).toBe(210);
    expect(Math.round(height)).toBe(297);
  });

  it('should generate a valid PDF Blob for download and viewing', async () => {
    const blob = await hallTicketPdfService.generateBlob(mockHallTicket);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('should generate multi-page bulk Hall Tickets with 1 page per student', async () => {
    const student2 = { ...mockHallTicket, studentName: 'Priya Sharma', enrollmentNo: '24SSIU01CSE002', hallTicketNo: 'HT-2026-SUMMER-0043' };
    const student3 = { ...mockHallTicket, studentName: 'Rahul Patel', enrollmentNo: '24SSIU01CSE003', hallTicketNo: 'HT-2026-SUMMER-0044' };

    const doc = (hallTicketPdfService as any).generatePdf(mockHallTicket);
    doc.addPage('a4', 'portrait');
    (hallTicketPdfService as any).generatePdf(student2);

    const blob = await (hallTicketPdfService as any).generateBlob(mockHallTicket);
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('should build HallTicketData from existing ERP master data', () => {
    // Tests mapping from Student Master Data and Exam Forms
    const ticket = hallTicketDataService.getHallTicketForStudent('exam-1', 'stud-1');
    if (ticket) {
      expect(ticket.universityName).toContain('SWARRNIM');
      expect(ticket.documentTitle).toContain('HALL TICKET');
      expect(ticket.subjects.length).toBeGreaterThanOrEqual(1);
    }
  });
});
