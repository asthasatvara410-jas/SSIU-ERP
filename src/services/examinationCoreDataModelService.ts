import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type ExamTypeCode = 'REGULAR' | 'BACKLOG' | 'REMEDIAL' | 'SUPPLEMENTARY' | 'SPECIAL' | 'REPEAT' | 'REVALUATION';

export type ExamStatus = 
  | 'DRAFT' 
  | 'SCHEDULED' 
  | 'REGISTRATION_OPEN' 
  | 'REGISTRATION_CLOSED' 
  | 'ONGOING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'POSTPONED';

export type ExamSession = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface ExamTypeRecord {
  id: string;
  code: ExamTypeCode;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ExaminationMasterRecord {
  id: string;
  exam_code: string;
  exam_name: string;
  exam_type_id: string;
  academic_year_id: string;
  semester_id: string;
  institute_id: string;
  department_id?: string;
  program_id?: string;
  status: ExamStatus;
  start_date: string;
  end_date: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
}

export interface ExaminationSubjectRecord {
  id: string;
  examination_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  exam_date: string;
  start_time: string; // e.g. "10:00"
  end_time: string;   // e.g. "13:00"
  session: ExamSession;
  duration_minutes: number;
  maximum_marks: number;
  passing_marks: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'POSTPONED';
}

export interface ExamCenterRecord {
  id: string;
  center_code: string;
  center_name: string;
  institute_id: string;
  campus_id: string;
  address: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ExamHallRecord {
  id: string;
  center_id: string;
  hall_code: string;
  hall_name: string;
  floor: number;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ExamScheduleEntryRecord {
  id: string;
  examination_id: string;
  examination_subject_id: string;
  hall_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  allocated_students_count: number;
  invigilator_staff_id?: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'POSTPONED';
}

export interface ExamDashboardMetrics {
  totalExaminations: number;
  activeExaminations: number;
  upcomingExaminations: number;
  ongoingExaminations: number;
  completedExaminations: number;
  cancelledExaminations: number;
  totalSubjects: number;
  totalRegisteredStudents: number;
  totalExamForms: number;
  examFeeDemand: number;
  examFeeCollected: number;
  outstandingFee: number;
}

class ExaminationCoreDataModelService {
  private static instance: ExaminationCoreDataModelService;

  private examTypes: ExamTypeRecord[] = [
    { id: 'et-01', code: 'REGULAR', name: 'Regular Semester Examination', description: 'End-of-semester examination', status: 'ACTIVE' },
    { id: 'et-02', code: 'BACKLOG', name: 'Backlog / ATKT Examination', description: 'Remedial examination for uncleared subjects', status: 'ACTIVE' },
    { id: 'et-03', code: 'REMEDIAL', name: 'Remedial Examination', description: 'Mid-term remedial examination', status: 'ACTIVE' },
    { id: 'et-04', code: 'SUPPLEMENTARY', name: 'Supplementary Examination', description: 'Supplementary summer/winter exam', status: 'ACTIVE' },
    { id: 'et-05', code: 'SPECIAL', name: 'Special Examination', description: 'Special institutional exam', status: 'ACTIVE' },
    { id: 'et-06', code: 'REPEAT', name: 'Repeat Examination', description: 'Repeat attempt exam', status: 'ACTIVE' },
    { id: 'et-07', code: 'REVALUATION', name: 'Revaluation Review Examination', description: 'Script review and revaluation', status: 'ACTIVE' }
  ];

  private examinations: ExaminationMasterRecord[] = [
    {
      id: 'exam-2026-w-001',
      exam_code: 'EXAM-W26-SIT-BCA1',
      exam_name: 'Winter 2026 BCA Semester 1 Regular Examination',
      exam_type_id: 'et-01',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      program_id: 'prog-bca',
      status: 'SCHEDULED',
      start_date: '2026-11-15',
      end_date: '2026-11-30',
      description: 'Main university end-semester examination for BCA Semester 1',
      created_by: 'emp-reg-001',
      created_at: '2026-08-25T10:00:00Z'
    }
  ];

  private examSubjects: ExaminationSubjectRecord[] = [
    {
      id: 'exsub-001',
      examination_id: 'exam-2026-w-001',
      subject_id: 'subj-cs101',
      subject_code: 'CS101',
      subject_name: 'Problem Solving & Programming in C',
      exam_date: '2026-11-16',
      start_time: '10:00',
      end_time: '13:00',
      session: 'MORNING',
      duration_minutes: 180,
      maximum_marks: 100,
      passing_marks: 40,
      status: 'SCHEDULED'
    },
    {
      id: 'exsub-002',
      examination_id: 'exam-2026-w-001',
      subject_id: 'subj-cs102',
      subject_code: 'CS102',
      subject_name: 'Digital Logic & Computer Organization',
      exam_date: '2026-11-18',
      start_time: '10:00',
      end_time: '13:00',
      session: 'MORNING',
      duration_minutes: 180,
      maximum_marks: 100,
      passing_marks: 40,
      status: 'SCHEDULED'
    }
  ];

  private centers: ExamCenterRecord[] = [
    {
      id: 'ctr-001',
      center_code: 'CTR-SIT-01',
      center_name: 'Swarrnim Institute of Technology Main Center',
      institute_id: 'inst-sit',
      campus_id: 'campus-main',
      address: 'Swarrnim Startup & Innovation University Campus, Gandhinagar',
      capacity: 500,
      status: 'ACTIVE'
    }
  ];

  private halls: ExamHallRecord[] = [
    {
      id: 'hall-101',
      center_id: 'ctr-001',
      hall_code: 'HALL-SIT-101',
      hall_name: 'Main Exam Hall 101',
      floor: 1,
      capacity: 60,
      status: 'ACTIVE'
    },
    {
      id: 'hall-102',
      center_id: 'ctr-001',
      hall_code: 'HALL-SIT-102',
      hall_name: 'Main Exam Hall 102',
      floor: 1,
      capacity: 40,
      status: 'ACTIVE'
    }
  ];

  private schedules: ExamScheduleEntryRecord[] = [
    {
      id: 'sch-001',
      examination_id: 'exam-2026-w-001',
      examination_subject_id: 'exsub-001',
      hall_id: 'hall-101',
      exam_date: '2026-11-16',
      start_time: '10:00',
      end_time: '13:00',
      allocated_students_count: 50,
      invigilator_staff_id: 'emp-fac-001',
      status: 'SCHEDULED'
    }
  ];

  private constructor() {}

  public static getInstance(): ExaminationCoreDataModelService {
    if (!ExaminationCoreDataModelService.instance) {
      ExaminationCoreDataModelService.instance = new ExaminationCoreDataModelService();
    }
    return ExaminationCoreDataModelService.instance;
  }

  // ─── EXAMINATION MASTER MANAGEMENT ────────────────────────────────────

  public createExamination(params: Omit<ExaminationMasterRecord, 'id' | 'created_at'>): ExaminationMasterRecord {
    const existing = this.examinations.find(e => e.exam_code.trim().toUpperCase() === params.exam_code.trim().toUpperCase());
    if (existing) {
      throw new Error(`Exam code already exists: ${params.exam_code}`);
    }

    if (new Date(params.end_date) < new Date(params.start_date)) {
      throw new Error(`Invalid exam date range: End date (${params.end_date}) cannot be before start date (${params.start_date})`);
    }

    const exam: ExaminationMasterRecord = {
      ...params,
      id: `exam-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    this.examinations.push(exam);
    return exam;
  }

  public getExaminations(context?: UserAuthorizationContext): ExaminationMasterRecord[] {
    let list = [...this.examinations];
    if (context && context.activeRole !== 'REGISTRAR' && context.instituteId) {
      list = list.filter(e => e.institute_id === context.instituteId);
    }
    if (context && context.activeRole === 'HOD' && context.departmentId) {
      list = list.filter(e => !e.department_id || e.department_id === context.departmentId);
    }
    return list;
  }

  // ─── EXAMINATION SUBJECT MAPPING & VALIDATION ─────────────────────────

  public mapSubjectToExamination(params: Omit<ExaminationSubjectRecord, 'id'>): ExaminationSubjectRecord {
    const exam = this.examinations.find(e => e.id === params.examination_id);
    if (!exam) {
      throw new Error(`Examination not found: ${params.examination_id}`);
    }

    const duplicate = this.examSubjects.find(s => 
      s.examination_id === params.examination_id && 
      (s.subject_id === params.subject_id || s.subject_code.toUpperCase() === params.subject_code.toUpperCase()) &&
      s.status !== 'CANCELLED'
    );
    if (duplicate) {
      throw new Error(`Selected subject is already added to this examination: ${params.subject_code}`);
    }

    const subject: ExaminationSubjectRecord = {
      ...params,
      id: `exsub-${Date.now()}`
    };

    this.examSubjects.push(subject);
    return subject;
  }

  public getExaminationSubjects(examinationId: string): ExaminationSubjectRecord[] {
    return this.examSubjects.filter(s => s.examination_id === examinationId && s.status !== 'CANCELLED');
  }

  // ─── EXAM CAPACITY & SCHEDULE CONFLICT VALIDATION ENGINE ──────────────

  public validateHallCapacity(hallId: string, studentCount: number): { isValid: boolean; hallCapacity: number; message?: string } {
    const hall = this.halls.find(h => h.id === hallId);
    if (!hall) throw new Error(`Exam hall ${hallId} not found`);

    if (studentCount > hall.capacity) {
      return {
        isValid: false,
        hallCapacity: hall.capacity,
        message: `Hall capacity is insufficient: Requested ${studentCount} seats exceeds capacity of ${hall.capacity}`
      };
    }

    return { isValid: true, hallCapacity: hall.capacity };
  }

  public scheduleExamHall(params: Omit<ExamScheduleEntryRecord, 'id'>): ExamScheduleEntryRecord {
    // 1. Capacity check
    const capacityCheck = this.validateHallCapacity(params.hall_id, params.allocated_students_count);
    if (!capacityCheck.isValid) {
      throw new Error(capacityCheck.message);
    }

    // 2. Hall conflict check
    const hallConflict = this.schedules.find(s =>
      s.hall_id === params.hall_id &&
      s.exam_date === params.exam_date &&
      s.status === 'SCHEDULED' &&
      ((params.start_time >= s.start_time && params.start_time < s.end_time) ||
       (params.end_time > s.start_time && params.end_time <= s.end_time))
    );
    if (hallConflict) {
      throw new Error(`Exam schedule conflicts with another examination in the same hall on ${params.exam_date}`);
    }

    // 3. Invigilator conflict check
    if (params.invigilator_staff_id) {
      const invigilatorConflict = this.schedules.find(s =>
        s.invigilator_staff_id === params.invigilator_staff_id &&
        s.exam_date === params.exam_date &&
        s.status === 'SCHEDULED' &&
        ((params.start_time >= s.start_time && params.start_time < s.end_time) ||
         (params.end_time > s.start_time && params.end_time <= s.end_time))
      );
      if (invigilatorConflict) {
        throw new Error(`Invigilator clash: Staff member ${params.invigilator_staff_id} is already assigned on ${params.exam_date}`);
      }
    }

    const schedule: ExamScheduleEntryRecord = {
      ...params,
      id: `sch-${Date.now()}`
    };

    this.schedules.push(schedule);
    return schedule;
  }

  // ─── DASHBOARD & KPI DERIVATION SERVICE ───────────────────────────────

  public getDashboardMetrics(context?: UserAuthorizationContext): ExamDashboardMetrics {
    const exams = this.getExaminations(context);
    const totalExaminations = exams.length;
    const activeExaminations = exams.filter(e => e.status === 'SCHEDULED' || e.status === 'REGISTRATION_OPEN' || e.status === 'ONGOING').length;
    const upcomingExaminations = exams.filter(e => e.status === 'SCHEDULED' || e.status === 'REGISTRATION_OPEN').length;
    const ongoingExaminations = exams.filter(e => e.status === 'ONGOING').length;
    const completedExaminations = exams.filter(e => e.status === 'COMPLETED').length;
    const cancelledExaminations = exams.filter(e => e.status === 'CANCELLED').length;

    const totalSubjects = this.examSubjects.filter(s => exams.some(e => e.id === s.examination_id)).length;
    const totalRegisteredStudents = 120;
    const totalExamForms = 120;
    const examFeeDemand = 120 * 1500; // ₹1,80,000
    const examFeeCollected = 100 * 1500; // ₹1,50,000
    const outstandingFee = examFeeDemand - examFeeCollected; // ₹30,000

    return {
      totalExaminations,
      activeExaminations,
      upcomingExaminations,
      ongoingExaminations,
      completedExaminations,
      cancelledExaminations,
      totalSubjects,
      totalRegisteredStudents,
      totalExamForms,
      examFeeDemand,
      examFeeCollected,
      outstandingFee
    };
  }
}

export const examinationCoreDataModelService = ExaminationCoreDataModelService.getInstance();
