import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type EntranceExamStatus = 'DRAFT' | 'SCHEDULED' | 'CONDUCTED' | 'RESULT_PUBLISHED' | 'CANCELLED';

export type EntranceCandidateStatus = 'PENDING' | 'PRESENT' | 'ABSENT' | 'VALID' | 'INVALID';

export type CounsellingMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export type CounsellingAttendanceStatus = 'ASSIGNED' | 'CONFIRMED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED';

export type SeatAllocationStatus = 'ALLOCATED' | 'WAITLISTED' | 'CONFIRMED' | 'RELEASED' | 'CANCELLED';

export type WaitlistStatus = 'ACTIVE' | 'PROMOTED' | 'EXPIRED' | 'CANCELLED';

export interface AdmissionEntranceExamRecord {
  id: string;
  admission_session_id: string;
  name: string;
  code: string;
  exam_date: string;
  maximum_marks: number;
  status: EntranceExamStatus;
  created_at: string;
  updated_at: string;
}

export interface EntranceResultRecord {
  id: string;
  entrance_exam_id: string;
  application_id: string;
  candidate_number: string;
  marks: number;
  maximum_marks: number;
  percentage: number;
  status: EntranceCandidateStatus;
  created_at: string;
  updated_at: string;
}

export interface AdmissionMeritScoreRecord {
  id: string;
  application_id: string;
  applicant_name: string;
  academic_score: number;
  entrance_score: number;
  other_score: number;
  final_merit_score: number;
  merit_rank: number;
  category: string;
  category_rank?: number;
  status: 'CALCULATED' | 'PUBLISHED' | 'SUPERSEDED';
  calculated_at: string;
}

export interface CounsellingSessionRecord {
  id: string;
  admission_session_id: string;
  name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  mode: CounsellingMode;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface CounsellingSlotRecord {
  id: string;
  counselling_session_id: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: 'AVAILABLE' | 'FULL' | 'COMPLETED';
}

export interface CounsellingAllocationRecord {
  id: string;
  counselling_session_id: string;
  slot_id: string;
  application_id: string;
  applicant_name: string;
  merit_rank: number;
  attendance_status: CounsellingAttendanceStatus;
  assigned_at: string;
  attended_at?: string;
}

export interface ProgramPreferenceRecord {
  id: string;
  application_id: string;
  preference_order: number;
  program_intake_id: string;
  program_name: string;
}

export interface AdmissionSeatCategoryRecord {
  id: string;
  program_intake_id: string;
  category_code: 'OPEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'MANAGEMENT' | 'NRI';
  total_seats: number;
  reserved_seats: number;
  filled_seats: number;
}

export interface SeatAllocationRecord {
  id: string;
  allocation_number: string;
  application_id: string;
  applicant_name: string;
  program_intake_id: string;
  program_name: string;
  seat_category: string;
  selection_round: string;
  merit_rank: number;
  preference_order: number;
  status: SeatAllocationStatus;
  allocated_at: string;
  confirmed_at?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistRecord {
  id: string;
  application_id: string;
  applicant_name: string;
  program_intake_id: string;
  program_name: string;
  merit_rank: number;
  waitlist_position: number;
  status: WaitlistStatus;
  created_at: string;
  updated_at: string;
}

export interface AdmissionCounsellingDashboardMetrics {
  totalEntranceCandidates: number;
  entranceAppeared: number;
  meritScoresGenerated: number;
  counsellingScheduled: number;
  counsellingAttended: number;
  seatsAllocated: number;
  totalWaitlisted: number;
  offersGenerated: number;
  admissionsConfirmed: number;
  totalAvailableSeats: number;
}

class AdmissionMeritCounsellingAllotmentService {
  private static instance: AdmissionMeritCounsellingAllotmentService;

  private entranceExams: AdmissionEntranceExamRecord[] = [
    {
      id: 'ent-001',
      admission_session_id: 'adm-sess-001',
      name: 'Swarrnim Central Admission Test (SCAT 2026)',
      code: 'SCAT-2026',
      exam_date: '2026-04-01',
      maximum_marks: 100,
      status: 'RESULT_PUBLISHED',
      created_at: '2026-03-05T10:00:00Z',
      updated_at: '2026-04-05T10:00:00Z'
    }
  ];

  private entranceResults: EntranceResultRecord[] = [
    {
      id: 'ent-res-001',
      entrance_exam_id: 'ent-001',
      application_id: 'app-001',
      candidate_number: 'SCAT26-0001',
      marks: 88,
      maximum_marks: 100,
      percentage: 88,
      status: 'VALID',
      created_at: '2026-04-05T10:00:00Z',
      updated_at: '2026-04-05T10:00:00Z'
    }
  ];

  private meritScores: AdmissionMeritScoreRecord[] = [
    {
      id: 'merit-001',
      application_id: 'app-001',
      applicant_name: 'Aarav Patel',
      academic_score: 84.5,
      entrance_score: 88.0,
      other_score: 0,
      final_merit_score: 86.6, // 40% Academic (33.8) + 60% Entrance (52.8) = 86.6
      merit_rank: 1,
      category: 'OPEN',
      category_rank: 1,
      status: 'PUBLISHED',
      calculated_at: '2026-04-06T10:00:00Z'
    }
  ];

  private counsellingSessions: CounsellingSessionRecord[] = [
    {
      id: 'couns-001',
      admission_session_id: 'adm-sess-001',
      name: 'Round 1 Central Offline Counselling Session',
      session_date: '2026-04-08',
      start_time: '09:00',
      end_time: '17:00',
      venue: 'SIT Auditorium & Admission Cell',
      mode: 'OFFLINE',
      status: 'COMPLETED',
      created_at: '2026-04-06T12:00:00Z'
    }
  ];

  private counsellingSlots: CounsellingSlotRecord[] = [
    {
      id: 'slot-001',
      counselling_session_id: 'couns-001',
      slot_number: 1,
      start_time: '09:00',
      end_time: '11:00',
      capacity: 50,
      booked_count: 1,
      status: 'AVAILABLE'
    }
  ];

  private counsellingAllocations: CounsellingAllocationRecord[] = [
    {
      id: 'couns-alloc-001',
      counselling_session_id: 'couns-001',
      slot_id: 'slot-001',
      application_id: 'app-001',
      applicant_name: 'Aarav Patel',
      merit_rank: 1,
      attendance_status: 'ATTENDED',
      assigned_at: '2026-04-06T14:00:00Z',
      attended_at: '2026-04-08T09:30:00Z'
    }
  ];

  private seatCategories: AdmissionSeatCategoryRecord[] = [
    {
      id: 'seat-cat-bca-open',
      program_intake_id: 'intake-bca-001',
      category_code: 'OPEN',
      total_seats: 84,
      reserved_seats: 0,
      filled_seats: 1
    },
    {
      id: 'seat-cat-bca-obc',
      program_intake_id: 'intake-bca-001',
      category_code: 'OBC',
      total_seats: 24,
      reserved_seats: 24,
      filled_seats: 0
    },
    {
      id: 'seat-cat-bca-sc',
      program_intake_id: 'intake-bca-001',
      category_code: 'SC',
      total_seats: 12,
      reserved_seats: 12,
      filled_seats: 0
    }
  ];

  private seatAllocations: SeatAllocationRecord[] = [
    {
      id: 'sea-001',
      allocation_number: 'SEA-2026-000001',
      application_id: 'app-001',
      applicant_name: 'Aarav Patel',
      program_intake_id: 'intake-bca-001',
      program_name: 'Bachelor of Computer Applications (BCA)',
      seat_category: 'OPEN',
      selection_round: 'ROUND_1',
      merit_rank: 1,
      preference_order: 1,
      status: 'CONFIRMED',
      allocated_at: '2026-04-08T11:00:00Z',
      confirmed_at: '2026-04-10T10:00:00Z',
      created_at: '2026-04-08T11:00:00Z',
      updated_at: '2026-04-10T10:00:00Z'
    }
  ];

  private waitlist: WaitlistRecord[] = [];

  private constructor() {}

  public static getInstance(): AdmissionMeritCounsellingAllotmentService {
    if (!AdmissionMeritCounsellingAllotmentService.instance) {
      AdmissionMeritCounsellingAllotmentService.instance = new AdmissionMeritCounsellingAllotmentService();
    }
    return AdmissionMeritCounsellingAllotmentService.instance;
  }

  // ─── ENTRANCE EXAM & RESULT ENGINE ────────────────────────────────────

  public recordEntranceResult(params: {
    entranceExamId: string;
    applicationId: string;
    candidateNumber: string;
    marks: number;
    maximumMarks: number;
    isAbsent?: boolean;
  }): EntranceResultRecord {
    if (params.isAbsent) {
      const absRecord: EntranceResultRecord = {
        id: `ent-res-${Date.now()}`,
        entrance_exam_id: params.entranceExamId,
        application_id: params.applicationId,
        candidate_number: params.candidateNumber,
        marks: 0,
        maximum_marks: params.maximumMarks,
        percentage: 0,
        status: 'ABSENT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.entranceResults.push(absRecord);
      return absRecord;
    }

    if (params.marks < 0) throw new Error('Entrance marks cannot be negative');
    if (params.marks > params.maximumMarks) throw new Error(`Entrance marks (${params.marks}) cannot exceed maximum marks (${params.maximumMarks})`);

    const percentage = Number(((params.marks / params.maximumMarks) * 100).toFixed(2));
    const resultRecord: EntranceResultRecord = {
      id: `ent-res-${Date.now()}`,
      entrance_exam_id: params.entranceExamId,
      application_id: params.applicationId,
      candidate_number: params.candidateNumber,
      marks: params.marks,
      maximum_marks: params.maximumMarks,
      percentage,
      status: 'VALID',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.entranceResults.push(resultRecord);
    return resultRecord;
  }

  // ─── WEIGHTED MERIT CALCULATION & TIE-BREAK RANKING ───────────────────

  public calculateMeritScores(params: {
    academicWeightage: number; // e.g. 0.40
    entranceWeightage: number; // e.g. 0.60
    candidates: {
      applicationId: string;
      applicantName: string;
      academicPercentage: number;
      entrancePercentage: number;
      category: string;
      dateOfBirth: string;
    }[];
  }): AdmissionMeritScoreRecord[] {
    const scoredList = params.candidates.map(c => {
      const finalScore = Number(
        (c.academicPercentage * params.academicWeightage + c.entrancePercentage * params.entranceWeightage).toFixed(2)
      );

      return {
        applicationId: c.applicationId,
        applicantName: c.applicantName,
        academicScore: c.academicPercentage,
        entranceScore: c.entrancePercentage,
        finalScore,
        category: c.category,
        dob: c.dateOfBirth
      };
    });

    // Sort with Tie-Breaking: 1. Higher final score, 2. Higher entrance score, 3. Higher academic score, 4. Older DOB
    scoredList.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.entranceScore !== a.entranceScore) return b.entranceScore - a.entranceScore;
      if (b.academicScore !== a.academicScore) return b.academicScore - a.academicScore;
      return new Date(a.dob).getTime() - new Date(b.dob).getTime();
    });

    const results: AdmissionMeritScoreRecord[] = [];
    let rank = 1;

    for (const item of scoredList) {
      const meritRecord: AdmissionMeritScoreRecord = {
        id: `merit-${Date.now()}-${item.applicationId}`,
        application_id: item.applicationId,
        applicant_name: item.applicantName,
        academic_score: item.academicScore,
        entrance_score: item.entranceScore,
        other_score: 0,
        final_merit_score: item.finalScore,
        merit_rank: rank,
        category: item.category,
        status: 'PUBLISHED',
        calculated_at: new Date().toISOString()
      };

      results.push(meritRecord);
      this.meritScores.push(meritRecord);
      rank++;
    }

    return results;
  }

  // ─── COUNSELLING SESSION & SLOT BOOKING ────────────────────────────────

  public bookCounsellingSlot(params: {
    sessionId: string;
    slotId: string;
    applicationId: string;
    applicantName: string;
    meritRank: number;
  }): CounsellingAllocationRecord {
    const slot = this.counsellingSlots.find(s => s.id === params.slotId);
    if (!slot) throw new Error(`Counselling slot ${params.slotId} not found`);

    if (slot.booked_count >= slot.capacity) {
      throw new Error(`Counselling slot ${slot.slot_number} is already full`);
    }

    slot.booked_count += 1;
    if (slot.booked_count >= slot.capacity) slot.status = 'FULL';

    const allocation: CounsellingAllocationRecord = {
      id: `couns-alloc-${Date.now()}`,
      counselling_session_id: params.sessionId,
      slot_id: params.slotId,
      application_id: params.applicationId,
      applicant_name: params.applicantName,
      merit_rank: params.meritRank,
      attendance_status: 'CONFIRMED',
      assigned_at: new Date().toISOString()
    };

    this.counsellingAllocations.push(allocation);
    return allocation;
  }

  public recordCounsellingAttendance(params: {
    allocationId: string;
    status: CounsellingAttendanceStatus;
  }): CounsellingAllocationRecord {
    const alloc = this.counsellingAllocations.find(a => a.id === params.allocationId);
    if (!alloc) throw new Error(`Counselling allocation ${params.allocationId} not found`);

    alloc.attendance_status = params.status;
    if (params.status === 'ATTENDED') alloc.attended_at = new Date().toISOString();

    return alloc;
  }

  // ─── ATOMIC SEAT ALLOCATION & DYNAMIC WAITLIST PROMOTION ──────────────

  public allocateSeat(params: {
    applicationId: string;
    applicantName: string;
    programIntakeId: string;
    programName: string;
    seatCategory: 'OPEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'MANAGEMENT' | 'NRI';
    selectionRound: string;
    meritRank: number;
    preferenceOrder: number;
  }): { status: 'ALLOCATED' | 'WAITLISTED'; allocation?: SeatAllocationRecord; waitlist?: WaitlistRecord } {
    const category = this.seatCategories.find(c =>
      c.program_intake_id === params.programIntakeId &&
      c.category_code === params.seatCategory
    );

    if (!category) throw new Error(`Seat category ${params.seatCategory} for program ${params.programName} not found`);

    // If seats available in category, allocate atomically
    if (category.filled_seats < category.total_seats) {
      category.filled_seats += 1;

      const allocNumber = `SEA-2026-${(this.seatAllocations.length + 1).toString().padStart(6, '0')}`;
      const allocation: SeatAllocationRecord = {
        id: `sea-${Date.now()}`,
        allocation_number: allocNumber,
        application_id: params.applicationId,
        applicant_name: params.applicantName,
        program_intake_id: params.programIntakeId,
        program_name: params.programName,
        seat_category: params.seatCategory,
        selection_round: params.selectionRound,
        merit_rank: params.meritRank,
        preference_order: params.preferenceOrder,
        status: 'ALLOCATED',
        allocated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.seatAllocations.push(allocation);
      return { status: 'ALLOCATED', allocation };
    }

    // No seats available -> Place on waitlist
    const activeWaitlistCount = this.waitlist.filter(w => w.program_intake_id === params.programIntakeId && w.status === 'ACTIVE').length;
    const waitlistRecord: WaitlistRecord = {
      id: `wl-${Date.now()}`,
      application_id: params.applicationId,
      applicant_name: params.applicantName,
      program_intake_id: params.programIntakeId,
      program_name: params.programName,
      merit_rank: params.meritRank,
      waitlist_position: activeWaitlistCount + 1,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.waitlist.push(waitlistRecord);
    return { status: 'WAITLISTED', waitlist: waitlistRecord };
  }

  public releaseSeatAndPromoteWaitlist(params: {
    allocationId: string;
    programIntakeId: string;
    seatCategory: 'OPEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'MANAGEMENT' | 'NRI';
  }): { releasedAllocation: SeatAllocationRecord; promotedWaitlist?: WaitlistRecord; newAllocation?: SeatAllocationRecord } {
    const alloc = this.seatAllocations.find(a => a.id === params.allocationId);
    if (!alloc) throw new Error(`Seat allocation ${params.allocationId} not found`);

    alloc.status = 'RELEASED';
    alloc.released_at = new Date().toISOString();
    alloc.updated_at = new Date().toISOString();

    const category = this.seatCategories.find(c =>
      c.program_intake_id === params.programIntakeId &&
      c.category_code === params.seatCategory
    );
    if (category) category.filled_seats = Math.max(0, category.filled_seats - 1);

    // Promote top candidate from active waitlist
    const nextInWaitlist = this.waitlist
      .filter(w => w.program_intake_id === params.programIntakeId && w.status === 'ACTIVE')
      .sort((a, b) => a.waitlist_position - b.waitlist_position)[0];

    if (nextInWaitlist && category) {
      nextInWaitlist.status = 'PROMOTED';
      nextInWaitlist.updated_at = new Date().toISOString();
      category.filled_seats += 1;

      const allocNumber = `SEA-2026-${(this.seatAllocations.length + 1).toString().padStart(6, '0')}`;
      const newAlloc: SeatAllocationRecord = {
        id: `sea-${Date.now()}`,
        allocation_number: allocNumber,
        application_id: nextInWaitlist.application_id,
        applicant_name: nextInWaitlist.applicant_name,
        program_intake_id: params.programIntakeId,
        program_name: nextInWaitlist.program_name,
        seat_category: params.seatCategory,
        selection_round: 'ROUND_1_PROMOTED',
        merit_rank: nextInWaitlist.merit_rank,
        preference_order: 1,
        status: 'ALLOCATED',
        allocated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.seatAllocations.push(newAlloc);
      return { releasedAllocation: alloc, promotedWaitlist: nextInWaitlist, newAllocation: newAlloc };
    }

    return { releasedAllocation: alloc };
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getCounsellingDashboardMetrics(context?: UserAuthorizationContext): AdmissionCounsellingDashboardMetrics {
    const totalEntranceCandidates = this.entranceResults.length;
    const entranceAppeared = this.entranceResults.filter(r => r.status === 'VALID').length;
    const meritScoresGenerated = this.meritScores.length;
    const counsellingScheduled = this.counsellingAllocations.length;
    const counsellingAttended = this.counsellingAllocations.filter(c => c.attendance_status === 'ATTENDED').length;
    const seatsAllocated = this.seatAllocations.filter(s => s.status === 'ALLOCATED' || s.status === 'CONFIRMED').length;
    const totalWaitlisted = this.waitlist.filter(w => w.status === 'ACTIVE').length;
    const offersGenerated = seatsAllocated;
    const admissionsConfirmed = this.seatAllocations.filter(s => s.status === 'CONFIRMED').length;

    const totalSeats = this.seatCategories.reduce((sum, c) => sum + c.total_seats, 0);
    const filledSeats = this.seatCategories.reduce((sum, c) => sum + c.filled_seats, 0);
    const totalAvailableSeats = Math.max(0, totalSeats - filledSeats);

    return {
      totalEntranceCandidates,
      entranceAppeared,
      meritScoresGenerated,
      counsellingScheduled,
      counsellingAttended,
      seatsAllocated,
      totalWaitlisted,
      offersGenerated,
      admissionsConfirmed,
      totalAvailableSeats
    };
  }
}

export const admissionMeritCounsellingAllotmentService = AdmissionMeritCounsellingAllotmentService.getInstance();
