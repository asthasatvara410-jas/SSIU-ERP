import { db } from './db';
import { Assignment, AssignmentSubmission, Subject, Student, User } from '../types';
import * as XLSX from 'xlsx';

export interface EnrichedStudentSubmissionRow {
  srNo: number;
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  programCode: string;
  semesterNumber: number | string;
  divisionName: string;
  submissionStatus: 'SUBMITTED' | 'PENDING' | 'LATE' | 'GRADED';
  submittedDate?: string;
  submittedTime?: string;
  isLate: boolean;
  lateStatusDisplay: 'YES' | 'NO' | '—';
  obtainedMarks?: number;
  totalMarks: number;
  marksDisplay: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  feedback?: string;
  submissionId?: string;
}

export interface AssignmentDetailStats {
  totalEnrolled: number;
  submittedCount: number;
  pendingCount: number;
  lateCount: number;
  gradedCount: number;
  submissionRate: string;
}

export interface SubjectWiseAssignmentSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalAssignments: number;
  totalEnrolledStudents: number;
  totalSubmitted: number;
  totalPending: number;
  submissionRate: string;
}

class AssignmentService {
  /**
   * Get subjects assigned to faculty or all for admin/HOD
   */
  public getFacultySubjects(user?: User | null, role?: string): Subject[] {
    const allSubjects = db.getSubjects();
    if (!role || role === 'SUPER_ADMIN' || role === 'STUDENT_ADMIN' || role === 'HOD' || role === 'HOI') {
      return allSubjects;
    }
    const facultyId = user?.id || 'fac-1';
    const assigned = db.getFacultySubjects(facultyId);
    if (assigned && assigned.length > 0) {
      return assigned;
    }
    return allSubjects.filter(s => ['sub-dsa', 'sub-dbms', 'sub-webtech', 'sub-ai'].includes(s.id));
  }

  /**
   * Get enrolled students for a specific assignment based on division / semester / program
   */
  public getEnrolledStudentsForAssignment(assignment: Assignment): Student[] {
    const allStudents = db.getStudents();
    const subject = db.getSubjectById(assignment.subjectId);

    const enrolled = allStudents.filter(stu => {
      // If division is specified on the assignment
      if (assignment.divisionId && stu.divisionId) {
        if (stu.divisionId !== assignment.divisionId) return false;
      }

      // If semester is specified on the assignment or subject
      const targetSem = assignment.semesterId || subject?.semesterId;
      if (targetSem && stu.semesterId) {
        if (stu.semesterId !== targetSem) return false;
      }

      // If program is specified on the subject
      if (subject?.programId && stu.programId) {
        if (stu.programId !== subject.programId) return false;
      }

      return true;
    });

    if (enrolled.length > 0) {
      return enrolled;
    }

    // Fallback: If division filter returned 0, try matching just semester/division or return active students
    const fallbackDivision = allStudents.filter(stu => stu.divisionId === 'div-cse-4a' || stu.semesterId === 'sem-cse-4');
    if (fallbackDivision.length > 0) {
      return fallbackDivision;
    }

    return allStudents.slice(0, 64);
  }

  /**
   * Check if a submission was made after the assignment deadline
   */
  public isSubmissionLate(submittedDateStr?: string, deadlineStr?: string): boolean {
    if (!submittedDateStr || !deadlineStr) return false;
    try {
      const submDate = new Date(submittedDateStr);
      const deadDate = new Date(deadlineStr);
      deadDate.setHours(23, 59, 59, 999);
      return submDate.getTime() > deadDate.getTime();
    } catch {
      return false;
    }
  }

  /**
   * Get dynamic stats for an assignment
   */
  public getAssignmentStats(assignment: Assignment): AssignmentDetailStats {
    const enrolledStudents = this.getEnrolledStudentsForAssignment(assignment);
    const submissions = db.getAssignmentSubmissions().filter(s => s.assignmentId === assignment.id);

    const totalEnrolled = enrolledStudents.length;
    const submittedCount = submissions.length;
    const pendingCount = Math.max(0, totalEnrolled - submittedCount);

    const lateCount = submissions.filter(s => {
      if (s.status === 'LATE' || s.lateStatus === 'LATE') return true;
      return this.isSubmissionLate(s.submittedDate, assignment.deadline);
    }).length;

    const gradedCount = submissions.filter(s => s.status === 'GRADED' || (s.obtainedMarks !== undefined && s.obtainedMarks !== null)).length;
    const rateNumber = totalEnrolled > 0 ? (submittedCount / totalEnrolled) * 100 : 0;
    const submissionRate = `${rateNumber.toFixed(1)}%`;

    return {
      totalEnrolled,
      submittedCount,
      pendingCount,
      lateCount,
      gradedCount,
      submissionRate
    };
  }

  /**
   * Get subject-wise assignment submission overview cards
   */
  public getSubjectWiseSummaries(user?: User | null, role?: string): SubjectWiseAssignmentSummary[] {
    const subjects = this.getFacultySubjects(user, role);
    const assignments = db.getAssignments();
    const allSubmissions = db.getAssignmentSubmissions();

    return subjects.map(subject => {
      const subjAssignments = assignments.filter(a => a.subjectId === subject.id);
      let totalEnrolled = 0;
      let totalSubmitted = 0;

      subjAssignments.forEach(asg => {
        const enrolled = this.getEnrolledStudentsForAssignment(asg);
        totalEnrolled += enrolled.length;
        const subms = allSubmissions.filter(s => s.assignmentId === asg.id);
        totalSubmitted += subms.length;
      });

      if (subjAssignments.length === 0) {
        const enrolled = db.getSubjectStudents(subject.id);
        totalEnrolled = enrolled.length || 24;
        totalSubmitted = 0;
      }

      const totalPending = Math.max(0, totalEnrolled - totalSubmitted);
      const rateNumber = totalEnrolled > 0 ? (totalSubmitted / totalEnrolled) * 100 : 0;

      return {
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        totalAssignments: Math.max(1, subjAssignments.length),
        totalEnrolledStudents: totalEnrolled,
        totalSubmitted,
        totalPending,
        submissionRate: `${rateNumber.toFixed(1)}%`
      };
    });
  }

  /**
   * Build complete student-wise roster for an assignment
   */
  public getStudentSubmissionRoster(
    assignment: Assignment,
    statusFilter: 'ALL' | 'SUBMITTED' | 'PENDING' | 'LATE' | 'GRADED' = 'ALL',
    searchQuery: string = ''
  ): EnrichedStudentSubmissionRow[] {
    const enrolledStudents = this.getEnrolledStudentsForAssignment(assignment);
    const submissions = db.getAssignmentSubmissions().filter(s => s.assignmentId === assignment.id);
    const programs = db.getPrograms();
    const semesters = db.getSemesters();
    const divisions = db.getDivisions();

    const rows: EnrichedStudentSubmissionRow[] = enrolledStudents.map((student, idx) => {
      const subm = submissions.find(
        s => s.studentId === student.id || (student.enrollmentNo && s.enrollmentNo === student.enrollmentNo)
      );
      const prog = programs.find(p => p.id === student.programId);
      const sem = semesters.find(s => s.id === student.semesterId);
      const div = divisions.find(d => d.id === student.divisionId);

      let submissionStatus: 'SUBMITTED' | 'PENDING' | 'LATE' | 'GRADED' = 'PENDING';
      let submittedDate: string | undefined = undefined;
      let submittedTime: string | undefined = undefined;
      let isLate = false;
      let lateStatusDisplay: 'YES' | 'NO' | '—' = '—';
      let obtainedMarks: number | undefined = undefined;
      let marksDisplay = '—';
      let fileUrl: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let notes: string | undefined = undefined;
      let feedback: string | undefined = undefined;
      let submissionId: string | undefined = undefined;

      if (subm) {
        submissionId = subm.id;
        submittedDate = subm.submittedDate;
        submittedTime = subm.submittedTime || '10:35 AM';
        fileUrl = subm.fileUrl;
        fileName = subm.fileName || `${student.enrollmentNo || student.name}_${assignment.title.slice(0, 15).replace(/\s+/g, '_')}.pdf`;
        notes = subm.notes;
        feedback = subm.feedback;
        obtainedMarks = subm.obtainedMarks;

        isLate = subm.status === 'LATE' || subm.lateStatus === 'LATE' || this.isSubmissionLate(subm.submittedDate, assignment.deadline);
        lateStatusDisplay = isLate ? 'YES' : 'NO';

        if (subm.status === 'GRADED' || (subm.obtainedMarks !== undefined && subm.obtainedMarks !== null)) {
          submissionStatus = 'GRADED';
          marksDisplay = `${subm.obtainedMarks} / ${assignment.totalMarks}`;
        } else if (isLate) {
          submissionStatus = 'LATE';
          marksDisplay = subm.obtainedMarks !== undefined ? `${subm.obtainedMarks} / ${assignment.totalMarks}` : '—';
        } else {
          submissionStatus = 'SUBMITTED';
          marksDisplay = subm.obtainedMarks !== undefined ? `${subm.obtainedMarks} / ${assignment.totalMarks}` : '—';
        }
      }

      // Division display name: extract clean short name (e.g. 'A' or 'Division A')
      let cleanDivisionName = div?.name || 'A';
      if (cleanDivisionName.startsWith('Division ')) {
        cleanDivisionName = cleanDivisionName.replace('Division ', '');
      }

      return {
        srNo: idx + 1,
        studentId: student.id,
        enrollmentNo: student.enrollmentNo || `23010100${idx + 1}`,
        studentName: student.name,
        programCode: prog?.code || 'B.Tech CSE',
        semesterNumber: sem?.number || 4,
        divisionName: cleanDivisionName,
        submissionStatus,
        submittedDate,
        submittedTime,
        isLate,
        lateStatusDisplay,
        obtainedMarks,
        totalMarks: assignment.totalMarks,
        marksDisplay,
        fileUrl,
        fileName,
        notes,
        feedback,
        submissionId
      };
    });

    // Apply Filter & Search
    return rows.filter(row => {
      if (statusFilter === 'SUBMITTED') {
        if (row.submissionStatus === 'PENDING') return false;
      } else if (statusFilter === 'PENDING') {
        if (row.submissionStatus !== 'PENDING') return false;
      } else if (statusFilter === 'LATE') {
        if (!row.isLate && row.submissionStatus !== 'LATE') return false;
      } else if (statusFilter === 'GRADED') {
        if (row.submissionStatus !== 'GRADED') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = row.studentName.toLowerCase().includes(q);
        const matchEnroll = row.enrollmentNo.toLowerCase().includes(q);
        if (!matchName && !matchEnroll) return false;
      }

      return true;
    });
  }

  /**
   * Export student submissions for an assignment to Excel (.xlsx)
   */
  public exportSubmissionsToExcel(
    assignment: Assignment,
    subject: Subject | undefined,
    rows: EnrichedStudentSubmissionRow[]
  ): { filename: string } {
    const wb = XLSX.utils.book_new();
    const currentDateStr = new Date().toISOString().split('T')[0];

    const stats = this.getAssignmentStats(assignment);

    const sheetRows: any[][] = [
      ['SWARRNIM STARTUP & INNOVATION UNIVERSITY'],
      ['University Management System • SSIU ERP'],
      ['ASSIGNMENT SUBMISSION & EVALUATION ROSTER'],
      ['Academic Year: 2026-27'],
      [],
      ['ASSIGNMENT INFORMATION', '', '', 'SUBMISSION SUMMARY METRICS'],
      ['Assignment Title:', assignment.title, '', 'Total Students Enrolled:', stats.totalEnrolled],
      ['Subject:', `${subject?.name || 'Database Management Systems'} (${subject?.code || 'CSE-402'})`, '', 'Total Submitted:', stats.submittedCount],
      ['Faculty:', assignment.createdByFacultyName || 'Prof. Demo Faculty', '', 'Total Pending:', stats.pendingCount],
      ['Division:', 'Division A', '', 'Late Submissions:', stats.lateCount],
      ['Semester:', 'Semester 4', '', 'Graded Submissions:', `${stats.gradedCount} / ${stats.submittedCount}`],
      ['Deadline:', assignment.deadline, '', 'Submission Rate:', stats.submissionRate],
      ['Max Marks:', assignment.totalMarks, '', 'Report Generated:', currentDateStr],
      [],
      [
        'Sr. No.', 'Enrollment No.', 'Student Name', 'Division', 
        'Submission Status', 'Submitted Date', 'Submitted Time', 'Late', 
        'Marks Obtained', 'Max Marks', 'Faculty Remarks / Evaluation Notes'
      ]
    ];

    rows.forEach((r, idx) => {
      sheetRows.push([
        idx + 1,
        r.enrollmentNo,
        r.studentName,
        r.divisionName,
        r.submissionStatus,
        r.submittedDate || '—',
        r.submittedTime || '—',
        r.lateStatusDisplay,
        r.obtainedMarks !== undefined ? r.obtainedMarks : '—',
        r.totalMarks,
        r.feedback || (r.submissionStatus === 'PENDING' ? 'Pending submission' : 'Submitted solution')
      ]);
    });

    sheetRows.push([]);
    sheetRows.push(['Swarrnim Startup & Innovation University • SSIU ERP Academic Affairs']);

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!cols'] = [
      { wch: 8 },  // Sr No
      { wch: 16 }, // Enrollment No
      { wch: 28 }, // Student Name
      { wch: 12 }, // Division
      { wch: 18 }, // Submission Status
      { wch: 16 }, // Submitted Date
      { wch: 16 }, // Submitted Time
      { wch: 10 }, // Late
      { wch: 16 }, // Marks
      { wch: 12 }, // Max Marks
      { wch: 40 }  // Remarks
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
      { s: { r: 5, c: 3 }, e: { r: 5, c: 5 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Submissions_Roster');

    const cleanTitle = assignment.title.slice(0, 25).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `SSIU_Assignment_Submissions_${subject?.code || 'CSE-402'}_${cleanTitle}_${currentDateStr}.xlsx`;
    XLSX.writeFile(wb, filename);

    return { filename };
  }
}

export const assignmentService = new AssignmentService();
