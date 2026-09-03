import { describe, it, expect } from 'vitest';
import { examinationHallTicketSeatingService } from '../services/examinationHallTicketSeatingService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 10.3: Examination Hall Ticket, Center Allocation & Seating Engine', () => {

  it('TEST 1: Seating Plan Generation & Layout: Generates row-column seats and detects capacity overflows', () => {
    // 1. Valid seating generation for 2 students in a 60-capacity hall
    const { seatingPlan, allocations } = examinationHallTicketSeatingService.generateSeatingPlan({
      examId: 'exam-2026-w-001',
      examSubjectId: 'subj-cs102',
      centerId: 'ctr-001',
      hallId: 'hall-102',
      hallCapacity: 40,
      rows: 4,
      columns: 10,
      layoutType: 'ROW_COLUMN',
      studentRegistrations: [
        { studentId: 'stud-002', enrollmentNo: 'SSIU26BCA000060', registrationId: 'reg-002' },
        { studentId: 'stud-003', enrollmentNo: 'SSIU26BCA000061', registrationId: 'reg-003' }
      ]
    });

    expect(seatingPlan.id).toBeDefined();
    expect(seatingPlan.plan_number).toMatch(/^PLAN-2026-\d{3}$/);
    expect(allocations.length).toBe(2);
    expect(allocations[0].seat_number).toBe('R1-C1');
    expect(allocations[1].seat_number).toBe('R1-C2');

    // 2. Capacity overflow check
    expect(() => {
      examinationHallTicketSeatingService.generateSeatingPlan({
        examId: 'exam-2026-w-001',
        examSubjectId: 'subj-cs102',
        centerId: 'ctr-001',
        hallId: 'hall-102',
        hallCapacity: 2,
        rows: 1,
        columns: 2,
        layoutType: 'ROW_COLUMN',
        studentRegistrations: [
          { studentId: 'stud-004', enrollmentNo: 'SSIU26BCA000062', registrationId: 'reg-004' },
          { studentId: 'stud-005', enrollmentNo: 'SSIU26BCA000063', registrationId: 'reg-005' },
          { studentId: 'stud-006', enrollmentNo: 'SSIU26BCA000064', registrationId: 'reg-006' }
        ]
      });
    }).toThrow(/Student count \(3\) exceeds hall capacity \(2\)/);
  });

  it('TEST 2: Hall Ticket Generation & Publishing: Validates approval and fee payment before issuing ticket', () => {
    // 1. Ineligible due to fee pending
    expect(() => {
      examinationHallTicketSeatingService.generateAndPublishHallTicket({
        examId: 'exam-2026-w-001',
        studentId: 'stud-004',
        enrollmentNo: 'SSIU26BCA000062',
        studentName: 'Rohan Sharma',
        examRegistrationId: 'reg-004',
        academicYearId: 'ay-2026-27',
        semesterId: 'sem-01',
        instituteId: 'inst-sit',
        departmentId: 'dept-cse',
        programId: 'prog-bca',
        isRegistrationApproved: true,
        isFeePaid: false, // Fee pending
        subjectSchedules: []
      });
    }).toThrow(/Exam fee payment pending in Central Finance/);

    // 2. Valid generation & publishing
    const ticket = examinationHallTicketSeatingService.generateAndPublishHallTicket({
      examId: 'exam-2026-w-001',
      studentId: 'stud-002',
      enrollmentNo: 'SSIU26BCA000060',
      studentName: 'Priya Sharma',
      examRegistrationId: 'reg-002',
      academicYearId: 'ay-2026-27',
      semesterId: 'sem-01',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      programId: 'prog-bca',
      isRegistrationApproved: true,
      isFeePaid: true,
      subjectSchedules: [
        {
          subject_id: 'subj-cs101',
          subject_code: 'CS101',
          subject_name: 'Programming in C',
          exam_date: '2026-11-16',
          start_time: '10:00',
          end_time: '13:00',
          session: 'MORNING',
          center_name: 'SIT Center',
          hall_name: 'Hall 101',
          seat_number: 'R1-C2'
        }
      ]
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.hall_ticket_number).toMatch(/^HT-2026-\d{6}$/);
    expect(ticket.status).toBe('PUBLISHED');
    expect(ticket.qr_verification_code).toMatch(/^SEC-HT-SSIU-\d{6}$/);
  });

  it('TEST 3: Duplicate Hall Ticket Protection: Blocks multiple active hall tickets for same student & exam', () => {
    expect(() => {
      examinationHallTicketSeatingService.generateAndPublishHallTicket({
        examId: 'exam-2026-w-001',
        studentId: 'stud-002', // Already has published ticket
        enrollmentNo: 'SSIU26BCA000060',
        studentName: 'Priya Sharma',
        examRegistrationId: 'reg-002',
        academicYearId: 'ay-2026-27',
        semesterId: 'sem-01',
        instituteId: 'inst-sit',
        departmentId: 'dept-cse',
        programId: 'prog-bca',
        isRegistrationApproved: true,
        isFeePaid: true,
        subjectSchedules: []
      });
    }).toThrow(/Active Hall Ticket already exists/);
  });

  it('TEST 4: Gate Verification Service: Verifies hall tickets and QR codes securely', () => {
    // 1. Valid ticket check by number
    const res1 = examinationHallTicketSeatingService.verifyHallTicketAtGate('HT-2026-000001');
    expect(res1.verificationStatus).toBe('VALID');
    expect(res1.ticket?.enrollment_no).toBe('SSIU26BCA000059');

    // 2. Valid ticket check by QR code
    const res2 = examinationHallTicketSeatingService.verifyHallTicketAtGate('SEC-HT-SSIU-881920');
    expect(res2.verificationStatus).toBe('VALID');

    // 3. Not found ticket check
    const res3 = examinationHallTicketSeatingService.verifyHallTicketAtGate('HT-INVALID-999999');
    expect(res3.verificationStatus).toBe('NOT_FOUND');
  });

  it('TEST 5: Hall Ticket Dashboard Metrics: Computes authoritative capacity and unassigned metrics', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['HALL_TICKET_VIEW', 'HALL_TICKET_GENERATE', 'HALL_TICKET_PUBLISH']
    };

    const metrics = examinationHallTicketSeatingService.getDashboardMetrics(registrarContext);
    expect(metrics.hallTicketsGenerated).toBeGreaterThanOrEqual(2);
    expect(metrics.hallTicketsPublished).toBeGreaterThanOrEqual(2);
    expect(metrics.totalCenterCapacity).toBe(500);
    expect(metrics.allocatedCenterSeats).toBeGreaterThanOrEqual(3);
    expect(metrics.availableCenterSeats).toBeLessThanOrEqual(497);
  });
});
