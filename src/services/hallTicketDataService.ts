/**
 * Hall Ticket Data Service
 * Resolves student master data, exam records, form approvals, timetables, and seat allocations
 * into a strongly-typed HallTicketData structure.
 */

import { db } from './db';
import { HallTicketData, HallTicketSubject } from '../types/hallTicket';

export class HallTicketDataService {
  /**
   * Helper to format day name from YYYY-MM-DD
   */
  private getDayName(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return '-';
    }
  }

  /**
   * Build HallTicketData for a specific student and exam
   */
  public getHallTicketForStudent(examId: string, studentId: string): HallTicketData | null {
    const exams = db.getExams();
    const exam = exams.find(e => e.id === examId) || exams[0];
    if (!exam) return null;

    const students = db.getStudents();
    const student = students.find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) return null;

    const forms = db.getExamForms();
    const form = forms.find(f => (f.examId === exam.id || f.examId === examId) && (f.studentId === student.id || f.enrollmentNo === student.enrollmentNo));

    const programs = db.getPrograms();
    const program = programs.find(p => p.id === (form?.programId || student.programId));

    const departments = db.getDepartments();
    const department = departments.find(d => d.id === (student.departmentId || program?.departmentId));

    const semesters = db.getSemesters();
    const semester = semesters.find(s => s.id === (form?.semesterId || (student as any).semesterId || (student as any).currentSemesterId));

    const centres = db.getExamCentres();
    const centre = centres.find(c => c.status === 'ACTIVE') || centres[0];

    // Seating Allocations
    let seatNo = form?.examSeatNo || '';
    let roomNo = form?.examRoomNo || '';
    try {
      const seatingData = db.getExamSeating(exam.id);
      const studentAlloc = seatingData.allocations?.find((a: any) => a.studentId === student.id || a.student?.enrollmentNo === student.enrollmentNo);
      if (studentAlloc) {
        seatNo = studentAlloc.seatNumber || seatNo;
        roomNo = studentAlloc.room?.roomNumber || studentAlloc.roomId || roomNo;
      }
    } catch {
      // Fallback
    }

    if (!seatNo) {
      // Deterministic seat number based on enrollment number
      const lastDigits = student.enrollmentNo.replace(/\D/g, '').slice(-3) || '001';
      seatNo = `SEAT-${lastDigits.padStart(3, '0')}`;
    }

    if (!roomNo) {
      roomNo = 'Hall-101 (Main Block)';
    }

    // Hall Ticket Number
    const hallTicketNo = form?.hallTicketNo || `HT-${exam.code || 'EXAM'}-${student.enrollmentNo}`;

    // Subject Schedules
    const timetables = db.getExamTimetables().filter(t => t.examId === exam.id);
    const subjects = db.getSubjects();

    // Determine eligible subjects:
    // If form has formSubjects or regularSubjects, use them. Otherwise, use exam timetable for this program/semester.
    let eligibleSubjectIds: string[] = [];
    if (form?.formSubjects && form.formSubjects.length > 0) {
      eligibleSubjectIds = form.formSubjects.map(fs => fs.subjectId);
    } else if (form?.regularSubjects && form.regularSubjects.length > 0) {
      eligibleSubjectIds = form.regularSubjects;
    } else if (timetables.length > 0) {
      // All subjects in the exam timetable matching student's program/semester or all in timetable
      eligibleSubjectIds = timetables.map(t => t.subjectId);
    }

    // Filter unique subject IDs
    const uniqueSubjectIds = Array.from(new Set(eligibleSubjectIds));

    const scheduleList: HallTicketSubject[] = [];
    let sr = 1;

    uniqueSubjectIds.forEach(subId => {
      const subj = subjects.find(s => s.id === subId || s.code === subId);
      const tt = timetables.find(t => t.subjectId === subId || (subj && t.subjectId === subj.id));

      if (subj || tt) {
        const dateStr = tt?.date || exam.startDate || '2026-05-18';
        const startTime = tt?.startTime || '10:30 AM';
        const endTime = tt?.endTime || '01:30 PM';

        scheduleList.push({
          sr: sr++,
          subjectCode: subj?.code || subId,
          subjectName: subj?.name || 'Academic Subject',
          examDate: dateStr,
          examDay: this.getDayName(dateStr),
          examTime: `${startTime} - ${endTime}`,
          roomNo: tt?.roomNo ? `Room ${tt.roomNo}` : roomNo,
          seatNo: seatNo,
          subjectType: (subj as any)?.type || 'THEORY',
          credits: subj?.credits || 4
        });
      }
    });

    // If scheduleList is still empty, populate from default exam timetable
    if (scheduleList.length === 0 && timetables.length > 0) {
      timetables.forEach((tt, idx) => {
        const subj = subjects.find(s => s.id === tt.subjectId);
        scheduleList.push({
          sr: idx + 1,
          subjectCode: subj?.code || `SUB-${idx + 1}`,
          subjectName: subj?.name || 'Theory Subject Examination',
          examDate: tt.date || exam.startDate || '2026-05-18',
          examDay: this.getDayName(tt.date || exam.startDate || '2026-05-18'),
          examTime: `${tt.startTime || '10:30 AM'} - ${tt.endTime || '01:30 PM'}`,
          roomNo: tt.roomNo ? `Room ${tt.roomNo}` : roomNo,
          seatNo: seatNo,
          subjectType: 'THEORY',
          credits: 4
        });
      });
    }

    const defaultInstructions = [
      '1. Candidates must carry this printed Hall Ticket along with their Valid University Student Identity Card to the Examination Hall.',
      '2. Report to the allocated examination centre at least 30 minutes before the scheduled commencement of the examination.',
      '3. Mobile phones, smart watches, digital diaries, programmable calculators, and any unauthorized paper/materials are strictly prohibited.',
      '4. Candidates will not be permitted to enter the examination hall after 30 minutes from the commencement of the exam.',
      '5. Verify that the correct question paper and answer book have been received. Fill all required details on the OMR/cover page accurately.',
      '6. Maintain strict silence and decorum. Any malpractice or unfair means will lead to immediate cancellation of examination and disciplinary action.',
      '7. Do not leave the examination hall before the expiry of half the total time duration. Hand over the answer book before leaving.'
    ];

    return {
      universityName: 'SWARRNIM STARTUP & INNOVATION UNIVERSITY',
      universitySubtitle: 'EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS',
      campusAddress: 'Bhoyan Rathod, Opp. IFFCO, Gandhinagar–382420, Gujarat, India • www.swarrnim.edu.in',
      documentTitle: 'EXAMINATION HALL TICKET / ADMIT CARD',
      academicYear: exam.academicYear || student.academicYear || '2025-2026',
      examSession: exam.session || 'Summer 2026',
      examName: exam.name || 'Regular End Semester Examination',
      examCode: exam.code || 'EXAM-SUMMER-2026',
      examType: exam.type || 'Regular End Semester Examination',
      hallTicketNo: hallTicketNo,
      examSeatNo: seatNo,
      generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      barcodeValue: hallTicketNo,

      studentId: student.id,
      studentName: student.name || (student as any).fullName || 'Student Name',
      enrollmentNo: student.enrollmentNo,
      admissionNo: student.admissionNumber || student.grNo || (student as any).admissionId || 'ADM-2024',
      grNo: student.grNo,
      instituteName: student.instituteName || (student as any).institute || 'Swarrnim Institute of Technology',
      programName: program?.name || student.programName || (student as any).program || 'B.Tech Computer Engineering',
      departmentName: department?.name || student.departmentId || 'Department of Computer Engineering',
      semesterName: semester?.name || semester?.code || (student as any).semester || 'Semester 4',
      division: (student as any).division || 'Div-A',
      batch: (student as any).batch || 'Batch 2024-28',
      gender: student.gender || 'Male',
      photoUrl: student.photo || '',

      centreName: centre ? `${centre.name} (${centre.building || 'Main Campus'})` : 'Swarrnim Central Examination Centre, Block-A',
      centreCode: centre?.code || 'SSIU-EX-01',
      centreBuilding: centre?.building || 'Main Campus Building',
      centreAddress: centre?.address || 'Swarrnim Campus, Gandhinagar–382420',
      reportingTime: '09:45 AM (Morning Session) / 01:45 PM (Afternoon Session)',
      examStartTime: '10:30 AM',
      examEndTime: '01:30 PM',

      subjects: scheduleList,
      instructions: defaultInstructions,
      studentSignLabel: "Candidate's Signature (In Presence of Invigilator)",
      superintendentLabel: 'Centre Superintendent Signature & Stamp',
      coeLabel: 'Controller of Examinations • SSIU',
      officialDisclaimer: 'This Hall Ticket is computer-generated and officially authenticated by the Controller of Examinations, SSIU.'
    };
  }

  /**
   * Build HallTicketData from an ExamForm ID
   */
  public getHallTicketByFormId(formId: string): HallTicketData | null {
    const forms = db.getExamForms();
    const form = forms.find(f => f.id === formId);
    if (!form) return null;
    return this.getHallTicketForStudent(form.examId, form.studentId);
  }

  /**
   * Get all HallTickets for a selected Exam with optional search/filters
   */
  public getAllHallTicketsForExam(
    examId: string,
    filter?: {
      programId?: string;
      semesterId?: string;
      departmentId?: string;
      status?: string;
      search?: string;
    }
  ): HallTicketData[] {
    const forms = db.getExamForms().filter(f => f.examId === examId);
    const students = db.getStudents();
    const results: HallTicketData[] = [];

    // Process all students who have submitted/approved exam forms, or all students registered for this exam
    forms.forEach(form => {
      const student = students.find(s => s.id === form.studentId || s.enrollmentNo === form.enrollmentNo);
      if (!student) return;

      if (filter?.status && filter.status !== 'ALL') {
        if (form.status !== filter.status && !(filter.status === 'APPROVED_OR_ISSUED' && (form.status === 'APPROVED' || form.status === 'HALL_TICKET_ISSUED'))) {
          return;
        }
      }

      if (filter?.programId && filter.programId !== 'ALL' && form.programId !== filter.programId && student.programId !== filter.programId) {
        return;
      }

      if (filter?.semesterId && filter.semesterId !== 'ALL' && form.semesterId !== filter.semesterId) {
        return;
      }

      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesEnroll = student.enrollmentNo.toLowerCase().includes(q);
        const matchesHT = (form.hallTicketNo || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEnroll && !matchesHT) return;
      }

      const ticket = this.getHallTicketForStudent(examId, student.id);
      if (ticket) {
        results.push(ticket);
      }
    });

    return results;
  }
}

export const hallTicketDataService = new HallTicketDataService();
