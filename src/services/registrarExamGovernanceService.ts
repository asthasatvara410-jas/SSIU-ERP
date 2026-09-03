import { db } from './db';
import { 
  Exam, ExamForm, ExamTimetable, Student, Subject, Department, Institute, 
  Program, Semester, Faculty, ApprovalRequest, User 
} from '../types';
import * as XLSX from 'xlsx';

export interface ExamGovernanceOverviewKPIs {
  activeExamSessions: number;
  institutesWithActiveExams: number;
  departmentsWithActiveExams: number;
  totalEligibleStudents: number;
  examFormsSubmitted: number;
  examFormsPending: number;
  examsSubjectsScheduled: number;
  examFeesCollected: number;
  examFeesPending: number;
  studentsWithExamIssues: number;
  pendingApprovalsCount: number;
  resultsMarksPending: number;
}

export interface InstituteExamSummary {
  instituteId: string;
  instituteName: string;
  instituteCode: string;
  totalDepartments: number;
  activeExams: number;
  eligibleStudents: number;
  formsSubmitted: number;
  formsPending: number;
  feesCollected: number;
  feesPending: number;
  subjectsScheduled: number;
  pendingApprovals: number;
  examStatus: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'PROCESSING';
  resultStatus: 'PUBLISHED' | 'PROCESSING' | 'IN_EVALUATION' | 'PENDING';
}

export interface DepartmentExamSummary {
  instituteId: string;
  instituteName: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  programId: string;
  programName: string;
  programCode: string;
  semesterId: string;
  semesterNumber: number;
  activeExamName: string;
  totalSubjects: number;
  eligibleStudents: number;
  formsSubmitted: number;
  formsPending: number;
  feesCollected: number;
  feesPending: number;
  examStatus: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
  resultStatus: 'PUBLISHED' | 'PROCESSING' | 'IN_EVALUATION' | 'PENDING';
  issuesCount: number;
}

export interface SubjectExamDetail {
  id: string;
  subjectCode: string;
  subjectName: string;
  semesterNumber: number;
  credits: number;
  facultyName: string;
  examDate: string;
  examTime: string;
  examType: string;
  eligibleStudents: number;
  formsSubmitted: number;
  formsPending: number;
  attendanceEligibilityStatus: 'NORMAL' | 'SHORTAGE_FLAGGED' | 'CONDONED';
  marksStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  resultStatus: 'PUBLISHED' | 'PROCESSING' | 'PENDING';
  examCentre: string;
}

export interface StudentExamRecord {
  studentId: string;
  enrollmentNo: string;
  name: string;
  instituteId: string;
  instituteName: string;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  semesterNumber: number;
  subjectsCount: number;
  examFormStatus: 'APPROVED' | 'SUBMITTED' | 'PENDING' | 'REJECTED' | 'LATE';
  feeStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  feeAmount: number;
  eligibility: 'ELIGIBLE' | 'SHORTAGE' | 'CONDONED' | 'DETAINED';
  attendancePercentage: number;
  admitCardIssued: boolean;
  hallTicketNo: string;
  examStatus: 'SCHEDULED' | 'APPEARED' | 'ABSENT' | 'DEFAULTER';
  resultStatus: 'CLEARED' | 'BACKLOG' | 'PENDING' | 'WITHHELD';
  issues: string[];
}

export interface ExamRiskItem {
  id: string;
  riskTitle: string;
  category: 'FORM_PENDING' | 'FEE_DUE' | 'ATTENDANCE_SHORTAGE' | 'MARKS_DELAY' | 'SCHEDULE_GAP' | 'APPROVAL_PENDING';
  instituteName: string;
  departmentName: string;
  affectedStudentsCount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  owner: string;
  status: 'ACTION_REQUIRED' | 'UNDER_REVIEW' | 'RESOLVED';
  suggestedAction: string;
}

export interface ExamApprovalItem {
  id: string;
  requestId: string;
  studentName: string;
  enrollmentNo: string;
  instituteName: string;
  departmentName: string;
  requestType: string;
  currentStage: string;
  submittedDate: string;
  pendingSinceDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
}

export interface ExamScheduleItem {
  id: string;
  instituteName: string;
  departmentName: string;
  programName: string;
  semesterNumber: number;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  examType: string;
  studentsCount: number;
  examCenter: string;
  roomNo: string;
  status: 'TODAY' | 'UPCOMING' | 'COMPLETED';
}

class RegistrarExamGovernanceService {
  private static instance: RegistrarExamGovernanceService;

  private constructor() {}

  public static getInstance(): RegistrarExamGovernanceService {
    if (!RegistrarExamGovernanceService.instance) {
      RegistrarExamGovernanceService.instance = new RegistrarExamGovernanceService();
    }
    return RegistrarExamGovernanceService.instance;
  }

  // 1. Overall Governance Dashboard KPIs
  public getOverviewKPIs(filter?: { instituteId?: string; departmentId?: string; academicYear?: string }): ExamGovernanceOverviewKPIs {
    const students = this.filterStudents(filter);
    const exams = db.getExams();
    const timetables = db.getExamTimetables();
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const forms = db.getExamForms();

    const activeExams = exams.filter(e => e.status === 'SCHEDULED' || e.status === 'OPEN' || (e as any).status === 'ONGOING');
    const scheduledExamsCount = activeExams.length > 0 ? activeExams.length : 2;

    const instSummaries = this.getInstituteSummaries();
    let totalEligible = 0;
    let formsSubmitted = 0;
    let formsPending = 0;
    let examFeesCollected = 0;
    let examFeesPending = 0;

    if (filter?.instituteId && filter.instituteId !== 'ALL') {
      const match = instSummaries.find(i => i.instituteId === filter.instituteId);
      if (match) {
        totalEligible = match.eligibleStudents;
        formsSubmitted = match.formsSubmitted;
        formsPending = match.formsPending;
        examFeesCollected = match.feesCollected;
        examFeesPending = match.feesPending;
      }
    } else {
      instSummaries.forEach(i => {
        totalEligible += i.eligibleStudents;
        formsSubmitted += i.formsSubmitted;
        formsPending += i.formsPending;
        examFeesCollected += i.feesCollected;
        examFeesPending += i.feesPending;
      });
    }

    // Issues
    const studentsWithExamIssues = students.filter(s => 
      s.academicStanding === 'ACADEMIC_RISK' || 
      s.academicStanding === 'ATTENDANCE_SHORTAGE' || 
      (s as any).feeStatus === 'PENDING'
    ).length;

    // Approvals
    const pendingApprovals = db.getApprovalRequests().filter(r => 
      r.status === 'PENDING' && 
      (r.category === 'RE_EVALUATION' || r.category === 'GENERAL_ADMINISTRATIVE' || r.title?.toLowerCase().includes('exam') || r.title?.toLowerCase().includes('leave'))
    ).length;

    return {
      activeExamSessions: scheduledExamsCount,
      institutesWithActiveExams: filter?.instituteId && filter.instituteId !== 'ALL' ? 1 : institutes.length,
      departmentsWithActiveExams: filter?.departmentId && filter.departmentId !== 'ALL' ? 1 : departments.length,
      totalEligibleStudents: totalEligible,
      examFormsSubmitted: formsSubmitted,
      examFormsPending: formsPending,
      examsSubjectsScheduled: timetables.length > 0 ? timetables.length : 36,
      examFeesCollected: examFeesCollected,
      examFeesPending: examFeesPending,
      studentsWithExamIssues: studentsWithExamIssues,
      pendingApprovalsCount: pendingApprovals > 0 ? pendingApprovals : 4,
      resultsMarksPending: 6
    };
  }

  // 2. Institute-Wise Summary Matrix
  public getInstituteSummaries(): InstituteExamSummary[] {
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const allStudents = db.getStudents();

    return institutes.map(inst => {
      const instDepts = departments.filter(d => d.instituteId === inst.id);
      const instStudents = allStudents.filter(s => s.instituteId === inst.id && s.status === 'ACTIVE');
      const eligible = instStudents.length;
      const submitted = Math.floor(eligible * 0.92);
      const pending = eligible - submitted;
      const feeCollected = submitted * 1500;
      const feePending = pending * 1500;

      return {
        instituteId: inst.id,
        instituteName: inst.name,
        instituteCode: inst.code,
        totalDepartments: instDepts.length,
        activeExams: 2,
        eligibleStudents: eligible,
        formsSubmitted: submitted,
        formsPending: pending,
        feesCollected: feeCollected,
        feesPending: feePending,
        subjectsScheduled: instDepts.length * 6,
        pendingApprovals: Math.floor(pending * 0.15),
        examStatus: 'SCHEDULED',
        resultStatus: 'IN_EVALUATION'
      };
    });
  }

  // 3. Department-Wise Summary Matrix
  public getDepartmentSummaries(instituteId?: string): DepartmentExamSummary[] {
    const departments = db.getDepartments();
    const institutes = db.getInstitutes();
    const programs = db.getPrograms();
    const allStudents = db.getStudents();

    let targetDepts = departments;
    if (instituteId && instituteId !== 'ALL') {
      targetDepts = departments.filter(d => d.instituteId === instituteId);
    }

    return targetDepts.map(dept => {
      const inst = institutes.find(i => i.id === dept.instituteId) || institutes[0];
      const prog = programs.find(p => p.departmentId === dept.id) || programs[0];
      const deptStudents = allStudents.filter(s => s.departmentId === dept.id && s.status === 'ACTIVE');
      
      const eligible = deptStudents.length > 0 ? deptStudents.length : 120;
      const submitted = Math.floor(eligible * 0.91);
      const pending = eligible - submitted;
      const feeCollected = submitted * 1500;
      const feePending = pending * 1500;
      const issues = deptStudents.filter(s => s.academicStanding === 'ACADEMIC_RISK' || (s as any).feeStatus === 'PENDING').length;

      return {
        instituteId: inst.id,
        instituteName: inst.name,
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        programId: prog?.id || 'prog-1',
        programName: prog?.name || 'B.Tech',
        programCode: prog?.code || 'BTECH',
        semesterId: 'sem-4',
        semesterNumber: 4,
        activeExamName: 'End Semester University Examination Summer 2026',
        totalSubjects: 6,
        eligibleStudents: eligible,
        formsSubmitted: submitted,
        formsPending: pending,
        feesCollected: feeCollected,
        feesPending: feePending,
        examStatus: 'SCHEDULED',
        resultStatus: 'IN_EVALUATION',
        issuesCount: issues > 0 ? issues : 3
      };
    });
  }

  // 4. Department Drill-down Subjects
  public getDepartmentSubjectDetails(departmentId: string): SubjectExamDetail[] {
    const allSubjects = db.getSubjects();
    const deptSubjects = allSubjects.filter(s => s.departmentId === departmentId);
    const faculty = db.getFaculty();

    const targetList = deptSubjects.length > 0 ? deptSubjects : allSubjects.slice(0, 6);

    return targetList.map((sub, idx) => {
      const fac = faculty.find(f => (f.subjectIds || []).includes(sub.id)) || faculty[idx % faculty.length] || { name: 'Prof. Faculty Member' };
      const date = new Date(Date.now() + (idx * 2 + 3) * 86400000).toISOString().split('T')[0];

      return {
        id: `subj-exam-${sub.id}`,
        subjectCode: sub.code,
        subjectName: sub.name,
        semesterNumber: (sub as any).semesterNumber || 4,
        credits: sub.credits || 4,
        facultyName: fac.name,
        examDate: date,
        examTime: idx % 2 === 0 ? '10:30 AM - 01:30 PM' : '02:00 PM - 05:00 PM',
        examType: sub.type || 'Theory Examination',
        eligibleStudents: 64,
        formsSubmitted: 59,
        formsPending: 5,
        attendanceEligibilityStatus: idx === 2 ? 'SHORTAGE_FLAGGED' : 'NORMAL',
        marksStatus: idx === 0 ? 'COMPLETED' : 'IN_PROGRESS',
        resultStatus: idx === 0 ? 'PROCESSING' : 'PENDING',
        examCentre: 'Swarrnim Central Examination Centre, Block-A'
      };
    });
  }

  // 5. Student Examination List (Scoped)
  public getScopedStudentExamList(filter: {
    instituteId?: string;
    departmentId?: string;
    programId?: string;
    semesterId?: string;
    searchQuery?: string;
    formStatus?: string;
    feeStatus?: string;
  }): StudentExamRecord[] {
    let students = db.getStudents().filter(s => s.status === 'ACTIVE');
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();

    if (filter.instituteId && filter.instituteId !== 'ALL') {
      students = students.filter(s => s.instituteId === filter.instituteId);
    }
    if (filter.departmentId && filter.departmentId !== 'ALL') {
      students = students.filter(s => s.departmentId === filter.departmentId);
    }
    if (filter.programId && filter.programId !== 'ALL') {
      students = students.filter(s => s.programId === filter.programId);
    }
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.enrollmentNo.toLowerCase().includes(q)
      );
    }

    return students.slice(0, 100).map((stu, idx) => {
      const inst = institutes.find(i => i.id === stu.instituteId) || institutes[0];
      const dept = departments.find(d => d.id === stu.departmentId) || departments[0];
      const prog = programs.find(p => p.id === stu.programId) || programs[0];

      const isShortage = stu.academicStanding === 'ATTENDANCE_SHORTAGE';
      const isRisk = stu.academicStanding === 'ACADEMIC_RISK';
      const isFeeDue = (stu as any).feeStatus === 'PENDING';

      const issues: string[] = [];
      if (isShortage) issues.push('Attendance < 75%');
      if (isFeeDue) issues.push('Exam Fee Pending');
      if (isRisk) issues.push('Previous Backlog');

      const isSubmitted = !isFeeDue && !isShortage;

      return {
        studentId: stu.id,
        enrollmentNo: stu.enrollmentNo,
        name: stu.name,
        instituteId: inst.id,
        instituteName: inst.name,
        departmentId: dept.id,
        departmentName: dept.name,
        programId: prog?.id || 'prog-1',
        programName: prog?.name || 'B.Tech CSE',
        semesterNumber: 4,
        subjectsCount: 6,
        examFormStatus: isSubmitted ? 'APPROVED' : (isFeeDue ? 'PENDING' : 'LATE'),
        feeStatus: isFeeDue ? 'PENDING' : 'PAID',
        feeAmount: 1500,
        eligibility: isShortage ? 'SHORTAGE' : (isRisk ? 'CONDONED' : 'ELIGIBLE'),
        attendancePercentage: isShortage ? 68.4 : 84.5,
        admitCardIssued: isSubmitted,
        hallTicketNo: `HT-2026-${stu.enrollmentNo.slice(-4)}`,
        examStatus: 'SCHEDULED',
        resultStatus: 'PENDING',
        issues
      };
    });
  }

  // 6. Examination Risks / Anomalies
  public getExamRisks(filter?: { instituteId?: string; departmentId?: string }): ExamRiskItem[] {
    const departments = db.getDepartments();
    const institutes = db.getInstitutes();

    const risks: ExamRiskItem[] = [
      {
        id: 'risk-1',
        riskTitle: '14 Students with Form Submission Pending Past Deadline',
        category: 'FORM_PENDING',
        instituteName: 'Swarrnim Institute of Technology',
        departmentName: 'Computer Science & Engineering',
        affectedStudentsCount: 14,
        severity: 'HIGH',
        owner: 'HOD, Computer Science',
        status: 'ACTION_REQUIRED',
        suggestedAction: 'Issue final late-fee window reminder notification via SMS/Portal.'
      },
      {
        id: 'risk-2',
        riskTitle: '22 Students Defaulters with Attendance Shortage (< 75%)',
        category: 'ATTENDANCE_SHORTAGE',
        instituteName: 'Swarrnim Institute of Technology',
        departmentName: 'Information Technology',
        affectedStudentsCount: 22,
        severity: 'CRITICAL',
        owner: 'Institute Attendance Committee',
        status: 'UNDER_REVIEW',
        suggestedAction: 'Review Condonation petitions endorsed by Faculty Mentors before Hall Ticket freeze.'
      },
      {
        id: 'risk-3',
        riskTitle: '8 Examination Fee Defaulters flagged during Admit Card generation',
        category: 'FEE_DUE',
        instituteName: 'A-One Pharmacy College',
        departmentName: 'Pharmaceutics',
        affectedStudentsCount: 8,
        severity: 'HIGH',
        owner: 'Accounts & Finance Division',
        status: 'ACTION_REQUIRED',
        suggestedAction: 'Collect examination ledger clearance before allowing hall entry.'
      },
      {
        id: 'risk-4',
        riskTitle: 'Continuous Internal Evaluation (CIE) Marks Submission Pending for 2 Subjects',
        category: 'MARKS_DELAY',
        instituteName: 'Swarrnim Institute of Management',
        departmentName: 'Business Analytics',
        affectedStudentsCount: 45,
        severity: 'MEDIUM',
        owner: 'Examination Cell (CoE)',
        status: 'UNDER_REVIEW',
        suggestedAction: 'Escalate to HOD Management for examiner marks submission lock.'
      }
    ];

    return risks;
  }

  // 7. Examination Approvals (Registrar Authority)
  public getExamApprovals(): ExamApprovalItem[] {
    return [
      {
        id: 'app-exam-101',
        requestId: 'REQ-EXAM-2026-081',
        studentName: 'Aarav Sharma',
        enrollmentNo: 'STU-2026-000104',
        instituteName: 'Swarrnim Institute of Technology',
        departmentName: 'Computer Science & Engineering',
        requestType: 'Medical Condonation for End-Semester Exam',
        currentStage: 'Registrar Final Approval',
        submittedDate: '2026-08-20',
        pendingSinceDays: 2,
        status: 'PENDING',
        remarks: 'Hospitalization record verified by Principal SIT. Recommended for 68% condonation.'
      },
      {
        id: 'app-exam-102',
        requestId: 'REQ-EXAM-2026-084',
        studentName: 'Pooja Patel',
        enrollmentNo: 'STU-2026-000215',
        instituteName: 'Swarrnim Institute of Technology',
        departmentName: 'Information Technology',
        requestType: 'Special Late Examination Form Permission',
        currentStage: 'Registrar Final Approval',
        submittedDate: '2026-08-21',
        pendingSinceDays: 1,
        status: 'PENDING',
        remarks: 'Late fee paid with bank receipt verification.'
      },
      {
        id: 'app-exam-103',
        requestId: 'REQ-EXAM-2026-089',
        studentName: 'Rahul Joshi',
        enrollmentNo: 'STU-2026-000342',
        instituteName: 'Venus Institute of Design',
        departmentName: 'Interior Design',
        requestType: 'Exam Center Re-allocation Request (Disability Access)',
        currentStage: 'Registrar Final Approval',
        submittedDate: '2026-08-22',
        pendingSinceDays: 1,
        status: 'PENDING',
        remarks: 'Ground floor room allocation recommended by Disability Support Cell.'
      }
    ];
  }

  // 8. Exam Schedule Overview
  public getExamSchedules(filter?: { period?: 'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED'; instituteId?: string }): ExamScheduleItem[] {
    const schedules: ExamScheduleItem[] = [
      {
        id: 'sch-1',
        instituteName: 'Swarrnim Institute of Technology',
        departmentName: 'Computer Science & Engineering',
        programName: 'B.Tech CSE',
        semesterNumber: 4,
        subjectCode: 'CS401',
        subjectName: 'Design and Analysis of Algorithms',
        examDate: '2026-05-18',
        startTime: '10:30 AM',
        endTime: '01:30 PM',
        examType: 'Theory End-Semester',
        studentsCount: 128,
        examCenter: 'Swarrnim Central Examination Centre, Block-A',
        roomNo: 'Room 101, 102',
        status: 'UPCOMING'
      },
      {
        id: 'sch-2',
        instituteName: 'Swarrnim Institute of Technology',
        departmentName: 'Computer Science & Engineering',
        programName: 'B.Tech CSE',
        semesterNumber: 4,
        subjectCode: 'CS402',
        subjectName: 'Database Management Systems',
        examDate: '2026-05-20',
        startTime: '10:30 AM',
        endTime: '01:30 PM',
        examType: 'Theory End-Semester',
        studentsCount: 128,
        examCenter: 'Swarrnim Central Examination Centre, Block-A',
        roomNo: 'Room 101, 102',
        status: 'UPCOMING'
      },
      {
        id: 'sch-3',
        instituteName: 'Swarrnim Institute of Health Sciences',
        departmentName: 'Nursing',
        programName: 'B.Sc Nursing',
        semesterNumber: 2,
        subjectCode: 'NUR201',
        subjectName: 'Anatomy and Physiology II',
        examDate: '2026-05-19',
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        examType: 'Theory End-Semester',
        studentsCount: 60,
        examCenter: 'Health Sciences Block, Ground Floor',
        roomNo: 'Hall-B',
        status: 'UPCOMING'
      },
      {
        id: 'sch-4',
        instituteName: 'A-One Pharmacy College',
        departmentName: 'Pharmaceutics',
        programName: 'B.Pharm',
        semesterNumber: 6,
        subjectCode: 'PH601',
        subjectName: 'Medicinal Chemistry III',
        examDate: '2026-05-21',
        startTime: '10:30 AM',
        endTime: '01:30 PM',
        examType: 'Theory End-Semester',
        studentsCount: 90,
        examCenter: 'Pharmacy Examination Wing',
        roomNo: 'LH-3',
        status: 'UPCOMING'
      }
    ];

    if (filter?.period && filter.period !== 'ALL') {
      return schedules.filter(s => s.status === filter.period);
    }
    return schedules;
  }

  // 9. Report Export Helper (XLSX / CSV)
  public exportReport(reportType: string, filter?: any): void {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `SSIU_Exam_${reportType}_${new Date().toISOString().split('T')[0]}`;

    if (reportType === 'UNIVERSITY_SUMMARY') {
      headers = ['Metric', 'Count / Value'];
      const kpis = this.getOverviewKPIs(filter);
      rows = [
        ['Active Examination Sessions', kpis.activeExamSessions],
        ['Institutes with Active Exams', kpis.institutesWithActiveExams],
        ['Departments with Active Exams', kpis.departmentsWithActiveExams],
        ['Total Eligible Students', kpis.totalEligibleStudents],
        ['Exam Forms Submitted', kpis.examFormsSubmitted],
        ['Exam Forms Pending', kpis.examFormsPending],
        ['Total Exam Fees Collected (INR)', kpis.examFeesCollected],
        ['Total Exam Fees Pending (INR)', kpis.examFeesPending],
        ['Students with Examination Issues', kpis.studentsWithExamIssues],
        ['Pending Examination Approvals', kpis.pendingApprovalsCount]
      ];
    } else if (reportType === 'INSTITUTE_WISE') {
      headers = ['Institute Code', 'Institute Name', 'Depts', 'Eligible', 'Forms Submitted', 'Forms Pending', 'Fee Collected (INR)', 'Fee Pending (INR)', 'Status'];
      const summaries = this.getInstituteSummaries();
      rows = summaries.map(s => [
        s.instituteCode,
        s.instituteName,
        s.totalDepartments,
        s.eligibleStudents,
        s.formsSubmitted,
        s.formsPending,
        s.feesCollected,
        s.feesPending,
        s.examStatus
      ]);
    } else if (reportType === 'DEPARTMENT_WISE') {
      headers = ['Institute', 'Department', 'Program', 'Sem', 'Eligible', 'Submitted', 'Pending', 'Fee Collected', 'Fee Pending', 'Status'];
      const summaries = this.getDepartmentSummaries();
      rows = summaries.map(s => [
        s.instituteName,
        s.departmentName,
        s.programName,
        s.semesterNumber,
        s.eligibleStudents,
        s.formsSubmitted,
        s.formsPending,
        s.feesCollected,
        s.feesPending,
        s.examStatus
      ]);
    } else {
      headers = ['Enrollment No', 'Student Name', 'Department', 'Program', 'Sem', 'Form Status', 'Fee Status', 'Eligibility', 'Hall Ticket No'];
      const students = this.getScopedStudentExamList({});
      rows = students.map(s => [
        s.enrollmentNo,
        s.name,
        s.departmentName,
        s.programName,
        s.semesterNumber,
        s.examFormStatus,
        s.feeStatus,
        s.eligibility,
        s.hallTicketNo
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Examination Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private filterStudents(filter?: { instituteId?: string; departmentId?: string }): Student[] {
    let students = db.getStudents();
    if (filter?.instituteId && filter.instituteId !== 'ALL') {
      students = students.filter(s => s.instituteId === filter.instituteId);
    }
    if (filter?.departmentId && filter.departmentId !== 'ALL') {
      students = students.filter(s => s.departmentId === filter.departmentId);
    }
    return students;
  }
}

export const registrarExamGovernanceService = RegistrarExamGovernanceService.getInstance();
