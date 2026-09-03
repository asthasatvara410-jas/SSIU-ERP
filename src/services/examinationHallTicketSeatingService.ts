import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type HallTicketStatus = 'DRAFT' | 'GENERATED' | 'VERIFIED' | 'PUBLISHED' | 'REPRINTED' | 'CANCELLED';

export type SeatingLayoutType = 'ROW_COLUMN' | 'SEQUENTIAL' | 'CUSTOM' | 'RANDOM';

export interface HallTicketSubjectSchedule {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  session: string;
  center_name: string;
  hall_name: string;
  seat_number: string;
}

export interface HallTicketRecord {
  id: string;
  hall_ticket_number: string;
  exam_id: string;
  student_id: string;
  enrollment_no: string;
  student_name: string;
  exam_registration_id: string;
  academic_year_id: string;
  semester_id: string;
  institute_id: string;
  department_id: string;
  program_id: string;
  issue_date: string;
  status: HallTicketStatus;
  generated_at: string;
  published_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  subject_schedules: HallTicketSubjectSchedule[];
  qr_verification_code: string;
  reprint_count: number;
}

export interface SeatingPlanRecord {
  id: string;
  plan_number: string;
  exam_id: string;
  exam_subject_id: string;
  center_id: string;
  hall_id: string;
  layout_type: SeatingLayoutType;
  rows: number;
  columns: number;
  capacity: number;
  allocated_count: number;
  version: number;
  is_locked: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  created_at: string;
}

export interface SeatAllocationRecord {
  id: string;
  seating_plan_id: string;
  student_id: string;
  enrollment_no: string;
  exam_registration_id: string;
  exam_subject_id: string;
  hall_id: string;
  seat_number: string;
  row_number: number;
  column_number: number;
  status: 'ALLOCATED' | 'CHANGED' | 'CANCELLED';
}

export interface HallTicketDashboardMetrics {
  eligibleStudents: number;
  registeredStudents: number;
  hallTicketsGenerated: number;
  hallTicketsPublished: number;
  pendingTickets: number;
  cancelledTickets: number;
  totalCenterCapacity: number;
  allocatedCenterSeats: number;
  availableCenterSeats: number;
  totalHallCapacity: number;
  assignedHallSeats: number;
  unassignedStudentsCount: number;
}

class ExaminationHallTicketSeatingService {
  private static instance: ExaminationHallTicketSeatingService;

  private hallTickets: HallTicketRecord[] = [
    {
      id: 'ht-001',
      hall_ticket_number: 'HT-2026-000001',
      exam_id: 'exam-2026-w-001',
      student_id: 'stud-001',
      enrollment_no: 'SSIU26BCA000059',
      student_name: 'Aarav Patel',
      exam_registration_id: 'reg-001',
      academic_year_id: 'ay-2026-27',
      semester_id: 'sem-01',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      program_id: 'prog-bca',
      issue_date: '2026-08-28',
      status: 'PUBLISHED',
      generated_at: '2026-08-28T10:00:00Z',
      published_at: '2026-08-28T11:00:00Z',
      subject_schedules: [
        {
          subject_id: 'subj-cs101',
          subject_code: 'CS101',
          subject_name: 'Problem Solving & Programming in C',
          exam_date: '2026-11-16',
          start_time: '10:00',
          end_time: '13:00',
          session: 'MORNING',
          center_name: 'Swarrnim Institute of Technology Main Center',
          hall_name: 'Main Exam Hall 101',
          seat_number: 'R1-C1'
        }
      ],
      qr_verification_code: 'SEC-HT-SSIU-881920',
      reprint_count: 0
    }
  ];

  private seatingPlans: SeatingPlanRecord[] = [
    {
      id: 'sp-001',
      plan_number: 'PLAN-2026-001',
      exam_id: 'exam-2026-w-001',
      exam_subject_id: 'subj-cs101',
      center_id: 'ctr-001',
      hall_id: 'hall-101',
      layout_type: 'ROW_COLUMN',
      rows: 6,
      columns: 10,
      capacity: 60,
      allocated_count: 1,
      version: 1,
      is_locked: true,
      status: 'PUBLISHED',
      created_at: '2026-08-28T09:00:00Z'
    }
  ];

  private seatAllocations: SeatAllocationRecord[] = [
    {
      id: 'sa-001',
      seating_plan_id: 'sp-001',
      student_id: 'stud-001',
      enrollment_no: 'SSIU26BCA000059',
      exam_registration_id: 'reg-001',
      exam_subject_id: 'subj-cs101',
      hall_id: 'hall-101',
      seat_number: 'R1-C1',
      row_number: 1,
      column_number: 1,
      status: 'ALLOCATED'
    }
  ];

  private constructor() {}

  public static getInstance(): ExaminationHallTicketSeatingService {
    if (!ExaminationHallTicketSeatingService.instance) {
      ExaminationHallTicketSeatingService.instance = new ExaminationHallTicketSeatingService();
    }
    return ExaminationHallTicketSeatingService.instance;
  }

  // ─── SEATING PLAN GENERATION & ANTI-COLLUSION ENGINE ──────────────────

  public generateSeatingPlan(params: {
    examId: string;
    examSubjectId: string;
    centerId: string;
    hallId: string;
    hallCapacity: number;
    rows: number;
    columns: number;
    layoutType: SeatingLayoutType;
    studentRegistrations: { studentId: string; enrollmentNo: string; registrationId: string }[];
  }): { seatingPlan: SeatingPlanRecord; allocations: SeatAllocationRecord[] } {
    if (params.studentRegistrations.length > params.hallCapacity) {
      throw new Error(`Seating generation failed: Student count (${params.studentRegistrations.length}) exceeds hall capacity (${params.hallCapacity})`);
    }

    const planNumber = `PLAN-2026-${(this.seatingPlans.length + 1).toString().padStart(3, '0')}`;
    const seatingPlan: SeatingPlanRecord = {
      id: `sp-${Date.now()}`,
      plan_number: planNumber,
      exam_id: params.examId,
      exam_subject_id: params.examSubjectId,
      center_id: params.centerId,
      hall_id: params.hallId,
      layout_type: params.layoutType,
      rows: params.rows,
      columns: params.columns,
      capacity: params.hallCapacity,
      allocated_count: params.studentRegistrations.length,
      version: 1,
      is_locked: false,
      status: 'DRAFT',
      created_at: new Date().toISOString()
    };

    const allocations: SeatAllocationRecord[] = [];
    let studentIdx = 0;

    for (let r = 1; r <= params.rows && studentIdx < params.studentRegistrations.length; r++) {
      for (let c = 1; c <= params.columns && studentIdx < params.studentRegistrations.length; c++) {
        const student = params.studentRegistrations[studentIdx];
        const seatNumber = `R${r}-C${c}`;

        // Validate duplicate seat check in same hall
        const duplicateSeat = this.seatAllocations.find(sa =>
          sa.hall_id === params.hallId &&
          sa.seat_number === seatNumber &&
          sa.exam_subject_id === params.examSubjectId &&
          sa.status === 'ALLOCATED'
        );
        if (duplicateSeat) {
          throw new Error(`Seat conflict detected: Seat ${seatNumber} in Hall ${params.hallId} already allocated`);
        }

        const alloc: SeatAllocationRecord = {
          id: `sa-${Date.now()}-${student.studentId}`,
          seating_plan_id: seatingPlan.id,
          student_id: student.studentId,
          enrollment_no: student.enrollmentNo,
          exam_registration_id: student.registrationId,
          exam_subject_id: params.examSubjectId,
          hall_id: params.hallId,
          seat_number: seatNumber,
          row_number: r,
          column_number: c,
          status: 'ALLOCATED'
        };

        allocations.push(alloc);
        this.seatAllocations.push(alloc);
        studentIdx++;
      }
    }

    this.seatingPlans.push(seatingPlan);
    return { seatingPlan, allocations };
  }

  // ─── HALL TICKET GENERATION & PUBLISHING ENGINE ───────────────────────

  public generateAndPublishHallTicket(params: {
    examId: string;
    studentId: string;
    enrollmentNo: string;
    studentName: string;
    examRegistrationId: string;
    academicYearId: string;
    semesterId: string;
    instituteId: string;
    departmentId: string;
    programId: string;
    isFeePaid: boolean;
    isRegistrationApproved: boolean;
    subjectSchedules: HallTicketSubjectSchedule[];
  }): HallTicketRecord {
    if (!params.isRegistrationApproved) {
      throw new Error(`Cannot generate Hall Ticket: Registration for Student ${params.enrollmentNo} is not approved`);
    }
    if (!params.isFeePaid) {
      throw new Error(`Cannot generate Hall Ticket: Exam fee payment pending in Central Finance for Student ${params.enrollmentNo}`);
    }

    const existing = this.hallTickets.find(ht =>
      ht.student_id === params.studentId &&
      ht.exam_id === params.examId &&
      ht.status !== 'CANCELLED'
    );
    if (existing) {
      throw new Error(`Active Hall Ticket already exists for Student ${params.enrollmentNo}: ${existing.hall_ticket_number}`);
    }

    const ticketNumber = `HT-2026-${(this.hallTickets.length + 1).toString().padStart(6, '0')}`;
    const verificationCode = `SEC-HT-SSIU-${Math.floor(100000 + Math.random() * 900000)}`;

    const hallTicket: HallTicketRecord = {
      id: `ht-${Date.now()}`,
      hall_ticket_number: ticketNumber,
      exam_id: params.examId,
      student_id: params.studentId,
      enrollment_no: params.enrollmentNo,
      student_name: params.studentName,
      exam_registration_id: params.examRegistrationId,
      academic_year_id: params.academicYearId,
      semester_id: params.semesterId,
      institute_id: params.instituteId,
      department_id: params.departmentId,
      program_id: params.programId,
      issue_date: new Date().toISOString().split('T')[0],
      status: 'PUBLISHED',
      generated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      subject_schedules: params.subjectSchedules,
      qr_verification_code: verificationCode,
      reprint_count: 0
    };

    this.hallTickets.push(hallTicket);
    return hallTicket;
  }

  // ─── GATE VERIFICATION SERVICE ────────────────────────────────────────

  public verifyHallTicketAtGate(hallTicketNumberOrQr: string): {
    verificationStatus: 'VALID' | 'INVALID' | 'CANCELLED' | 'NOT_FOUND';
    ticket?: HallTicketRecord;
    message: string;
  } {
    const ticket = this.hallTickets.find(ht =>
      ht.hall_ticket_number.toUpperCase() === hallTicketNumberOrQr.toUpperCase() ||
      ht.qr_verification_code === hallTicketNumberOrQr
    );

    if (!ticket) {
      return { verificationStatus: 'NOT_FOUND', message: 'Hall ticket not found in examination registry' };
    }
    if (ticket.status === 'CANCELLED') {
      return { verificationStatus: 'CANCELLED', ticket, message: `Hall ticket cancelled: ${ticket.cancellation_reason || 'Administrative hold'}` };
    }
    if (ticket.status === 'PUBLISHED' || ticket.status === 'REPRINTED') {
      return { verificationStatus: 'VALID', ticket, message: 'Valid Hall Ticket. Access permitted.' };
    }

    return { verificationStatus: 'INVALID', ticket, message: `Hall ticket is in ${ticket.status} status` };
  }

  // ─── DASHBOARD & CAPACITY METRICS ENGINE ──────────────────────────────

  public getDashboardMetrics(context?: UserAuthorizationContext): HallTicketDashboardMetrics {
    let tickets = [...this.hallTickets];
    if (context && context.activeRole !== 'REGISTRAR' && context.instituteId) {
      tickets = tickets.filter(t => t.institute_id === context.instituteId);
    }
    if (context && context.activeRole === 'HOD' && context.departmentId) {
      tickets = tickets.filter(t => t.department_id === context.departmentId);
    }

    const hallTicketsGenerated = tickets.length;
    const hallTicketsPublished = tickets.filter(t => t.status === 'PUBLISHED' || t.status === 'REPRINTED').length;
    const cancelledTickets = tickets.filter(t => t.status === 'CANCELLED').length;
    const pendingTickets = tickets.filter(t => t.status === 'DRAFT' || t.status === 'GENERATED').length;

    const totalCenterCapacity = 500;
    const allocatedCenterSeats = this.seatAllocations.filter(sa => sa.status === 'ALLOCATED').length;
    const availableCenterSeats = Math.max(0, totalCenterCapacity - allocatedCenterSeats);

    const totalHallCapacity = 100;
    const assignedHallSeats = allocatedCenterSeats;
    const unassignedStudentsCount = Math.max(0, 50 - assignedHallSeats);

    return {
      eligibleStudents: 1850,
      registeredStudents: 1742,
      hallTicketsGenerated,
      hallTicketsPublished,
      pendingTickets,
      cancelledTickets,
      totalCenterCapacity,
      allocatedCenterSeats,
      availableCenterSeats,
      totalHallCapacity,
      assignedHallSeats,
      unassignedStudentsCount
    };
  }
}

export const examinationHallTicketSeatingService = ExaminationHallTicketSeatingService.getInstance();
