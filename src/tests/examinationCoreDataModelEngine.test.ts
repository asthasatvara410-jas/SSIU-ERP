import { describe, it, expect } from 'vitest';
import { examinationCoreDataModelService } from '../services/examinationCoreDataModelService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10.1: Examination Management Core Data Model Engine', () => {

  it('TEST 1: Examination Master Creation & Constraints: Enforces unique exam codes and valid date ranges', () => {
    // Valid exam creation
    const exam = examinationCoreDataModelService.createExamination({
      exam_code: 'EXAM-S27-SIT-BCA2',
      exam_name: 'Summer 2027 BCA Semester 2 Regular Examination',
      exam_type_id: 'et-01',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-02',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      program_id: 'prog-bca',
      status: 'DRAFT',
      start_date: '2027-05-10',
      end_date: '2027-05-25',
      created_by: 'emp-reg-001'
    });

    expect(exam.id).toBeDefined();
    expect(exam.exam_code).toBe('EXAM-S27-SIT-BCA2');
    expect(exam.status).toBe('DRAFT');

    // Duplicate exam code rejection
    expect(() => {
      examinationCoreDataModelService.createExamination({
        exam_code: 'EXAM-S27-SIT-BCA2', // Duplicate
        exam_name: 'Duplicate Exam',
        exam_type_id: 'et-01',
        academic_year_id: 'ay-2026-27',
        semester_id: 'sem-02',
        institute_id: 'inst-sit',
        status: 'DRAFT',
        start_date: '2027-05-10',
        end_date: '2027-05-25',
        created_by: 'emp-reg-001'
      });
    }).toThrow(/Exam code already exists/);

    // Invalid date range rejection
    expect(() => {
      examinationCoreDataModelService.createExamination({
        exam_code: 'EXAM-INVALID-DATES',
        exam_name: 'Invalid Date Exam',
        exam_type_id: 'et-01',
        academic_year_id: 'ay-2026-27',
        semester_id: 'sem-02',
        institute_id: 'inst-sit',
        status: 'DRAFT',
        start_date: '2027-05-25',
        end_date: '2027-05-10', // End before start
        created_by: 'emp-reg-001'
      });
    }).toThrow(/Invalid exam date range/);
  });

  it('TEST 2: Subject Mapping & Duplicate Prevention: Maps subjects to examination and blocks duplicate mapping', () => {
    // Valid subject mapping
    const subject = examinationCoreDataModelService.mapSubjectToExamination({
      examination_id: 'exam-2026-w-001',
      subject_id: 'subj-cs103',
      subject_code: 'CS103',
      subject_name: 'Database Management Systems',
      exam_date: '2026-11-20',
      start_time: '10:00',
      end_time: '13:00',
      session: 'MORNING',
      duration_minutes: 180,
      maximum_marks: 100,
      passing_marks: 40,
      status: 'SCHEDULED'
    });

    expect(subject.id).toBeDefined();
    expect(subject.subject_code).toBe('CS103');

    // Duplicate subject mapping rejection
    expect(() => {
      examinationCoreDataModelService.mapSubjectToExamination({
        examination_id: 'exam-2026-w-001',
        subject_id: 'subj-cs103', // Duplicate
        subject_code: 'CS103',
        subject_name: 'Database Management Systems',
        exam_date: '2026-11-22',
        start_time: '10:00',
        end_time: '13:00',
        session: 'MORNING',
        duration_minutes: 180,
        maximum_marks: 100,
        passing_marks: 40,
        status: 'SCHEDULED'
      });
    }).toThrow(/Selected subject is already added to this examination/);
  });

  it('TEST 3: Capacity & Schedule Conflict Detection: Validates hall capacity and detects schedule and invigilator clashes', () => {
    // Capacity check failure (Hall 101 capacity is 60)
    expect(() => {
      examinationCoreDataModelService.scheduleExamHall({
        examination_id: 'exam-2026-w-001',
        examination_subject_id: 'exsub-002',
        hall_id: 'hall-101',
        exam_date: '2026-11-18',
        start_time: '10:00',
        end_time: '13:00',
        allocated_students_count: 75 // Exceeds 60
      });
    }).toThrow(/Hall capacity is insufficient/);

    // Schedule hall collision check on 2026-11-16 in hall-101 (already occupied 10:00 to 13:00)
    expect(() => {
      examinationCoreDataModelService.scheduleExamHall({
        examination_id: 'exam-2026-w-001',
        examination_subject_id: 'exsub-002',
        hall_id: 'hall-101', // Collides with existing schedule in hall-101
        exam_date: '2026-11-16',
        start_time: '11:00',
        end_time: '14:00',
        allocated_students_count: 40
      });
    }).toThrow(/Exam schedule conflicts with another examination in the same hall/);

    // Invigilator collision check on 2026-11-16 for emp-fac-001
    expect(() => {
      examinationCoreDataModelService.scheduleExamHall({
        examination_id: 'exam-2026-w-001',
        examination_subject_id: 'exsub-002',
        hall_id: 'hall-102', // Different hall
        exam_date: '2026-11-16',
        start_time: '10:00',
        end_time: '13:00',
        allocated_students_count: 30,
        invigilator_staff_id: 'emp-fac-001' // Same invigilator at same time
      });
    }).toThrow(/Invigilator clash/);
  });

  it('TEST 4: Dashboard Metrics & Organizational Scope: Computes authoritative exam counts, fees, and respects role scope', () => {
    // University / Registrar Scope
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['EXAM_VIEW', 'EXAM_APPROVE']
    };

    const metrics = examinationCoreDataModelService.getDashboardMetrics(registrarContext);
    expect(metrics.totalExaminations).toBeGreaterThanOrEqual(2);
    expect(metrics.totalSubjects).toBeGreaterThanOrEqual(2);
    expect(metrics.examFeeDemand).toBe(180000);
    expect(metrics.examFeeCollected).toBe(150000);
    expect(metrics.outstandingFee).toBe(30000);

    // Department Scope
    const hodContext: UserAuthorizationContext = {
      userId: 'emp-hod-cse',
      userName: 'Prof. HOD CSE',
      email: 'hod.cse@swarrnim.edu.in',
      activeRole: 'HOD',
      assignedRoles: ['HOD'],
      permissions: ['EXAM_VIEW'],
      instituteId: 'inst-sit',
      departmentId: 'dept-cse'
    };

    const deptExams = examinationCoreDataModelService.getExaminations(hodContext);
    expect(deptExams.every(e => e.institute_id === 'inst-sit' && (!e.department_id || e.department_id === 'dept-cse'))).toBe(true);
  });
});
