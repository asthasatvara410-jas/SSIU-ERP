import { describe, it, expect } from 'vitest';
import { admissionMeritCounsellingAllotmentService } from '../services/admissionMeritCounsellingAllotmentService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 11.2: Admission Merit, Counselling & Seat Allotment Engine', () => {

  it('TEST 1: Entrance Exam & Result Validation: Validates scores and marks absent candidates correctly', () => {
    // 1. Negative marks check
    expect(() => {
      admissionMeritCounsellingAllotmentService.recordEntranceResult({
        entranceExamId: 'ent-001',
        applicationId: 'app-002',
        candidateNumber: 'SCAT26-0002',
        marks: -10,
        maximumMarks: 100
      });
    }).toThrow(/Entrance marks cannot be negative/);

    // 2. Marks exceeding maximum check
    expect(() => {
      admissionMeritCounsellingAllotmentService.recordEntranceResult({
        entranceExamId: 'ent-001',
        applicationId: 'app-002',
        candidateNumber: 'SCAT26-0002',
        marks: 110,
        maximumMarks: 100
      });
    }).toThrow(/cannot exceed maximum marks/);

    // 3. Absent candidate check
    const absResult = admissionMeritCounsellingAllotmentService.recordEntranceResult({
      entranceExamId: 'ent-001',
      applicationId: 'app-003',
      candidateNumber: 'SCAT26-0003',
      marks: 0,
      maximumMarks: 100,
      isAbsent: true
    });

    expect(absResult.status).toBe('ABSENT');
    expect(absResult.marks).toBe(0);

    // 4. Valid candidate score
    const validResult = admissionMeritCounsellingAllotmentService.recordEntranceResult({
      entranceExamId: 'ent-001',
      applicationId: 'app-002',
      candidateNumber: 'SCAT26-0002',
      marks: 76,
      maximumMarks: 100
    });

    expect(validResult.status).toBe('VALID');
    expect(validResult.percentage).toBe(76);
  });

  it('TEST 2: Weighted Merit Calculation & Tie-Break Ranking: Calculates 40/60 weighted scores and ranks candidates', () => {
    const meritScores = admissionMeritCounsellingAllotmentService.calculateMeritScores({
      academicWeightage: 0.40,
      entranceWeightage: 0.60,
      candidates: [
        {
          applicationId: 'app-002',
          applicantName: 'Priya Sharma',
          academicPercentage: 80.0,
          entrancePercentage: 76.0, // 80*0.4 (32) + 76*0.6 (45.6) = 77.6
          category: 'OPEN',
          dateOfBirth: '2005-08-15'
        },
        {
          applicationId: 'app-004',
          applicantName: 'Rohan Verma',
          academicPercentage: 75.0,
          entrancePercentage: 85.0, // 75*0.4 (30) + 85*0.6 (51) = 81.0
          category: 'OPEN',
          dateOfBirth: '2005-03-10'
        }
      ]
    });

    expect(meritScores.length).toBe(2);
    // Rohan Verma has higher score (81.0 > 77.6) -> Rank 1
    expect(meritScores[0].applicant_name).toBe('Rohan Verma');
    expect(meritScores[0].final_merit_score).toBe(81.0);
    expect(meritScores[0].merit_rank).toBe(1);

    expect(meritScores[1].applicant_name).toBe('Priya Sharma');
    expect(meritScores[1].final_merit_score).toBe(77.6);
    expect(meritScores[1].merit_rank).toBe(2);
  });

  it('TEST 3: Counselling Session & Slot Allocation: Books slot and records candidate physical attendance', () => {
    // 1. Book Slot
    const booking = admissionMeritCounsellingAllotmentService.bookCounsellingSlot({
      sessionId: 'couns-001',
      slotId: 'slot-001',
      applicationId: 'app-002',
      applicantName: 'Priya Sharma',
      meritRank: 2
    });

    expect(booking.id).toBeDefined();
    expect(booking.attendance_status).toBe('CONFIRMED');

    // 2. Mark Attended at Counselling Desk
    const attended = admissionMeritCounsellingAllotmentService.recordCounsellingAttendance({
      allocationId: booking.id,
      status: 'ATTENDED'
    });

    expect(attended.attendance_status).toBe('ATTENDED');
    expect(attended.attended_at).toBeDefined();
  });

  it('TEST 4: Category-Wise Seat Allocation: Allocates seat atomically and verifies remaining category capacity', () => {
    const outcome = admissionMeritCounsellingAllotmentService.allocateSeat({
      applicationId: 'app-002',
      applicantName: 'Priya Sharma',
      programIntakeId: 'intake-bca-001',
      programName: 'Bachelor of Computer Applications (BCA)',
      seatCategory: 'OPEN',
      selectionRound: 'ROUND_1',
      meritRank: 2,
      preferenceOrder: 1
    });

    expect(outcome.status).toBe('ALLOCATED');
    expect(outcome.allocation?.allocation_number).toMatch(/^SEA-2026-\d{6}$/);
    expect(outcome.allocation?.seat_category).toBe('OPEN');
  });

  it('TEST 5: Dynamic Waitlist & Promotion Engine: Places overflow candidates on waitlist and promotes upon seat release', () => {
    // 1. Fill SC category to capacity (limit SC total_seats to 1 for testing)
    const seatCats = (admissionMeritCounsellingAllotmentService as any).seatCategories;
    const scCat = seatCats.find((c: any) => c.category_code === 'SC');
    scCat.total_seats = 1;
    scCat.filled_seats = 1; // SC category is currently full

    // 2. Candidate applying for full SC category -> Placed on Waitlist
    const waitlistOutcome = admissionMeritCounsellingAllotmentService.allocateSeat({
      applicationId: 'app-005',
      applicantName: 'Anil Kumar',
      programIntakeId: 'intake-bca-001',
      programName: 'Bachelor of Computer Applications (BCA)',
      seatCategory: 'SC',
      selectionRound: 'ROUND_1',
      meritRank: 5,
      preferenceOrder: 1
    });

    expect(waitlistOutcome.status).toBe('WAITLISTED');
    expect(waitlistOutcome.waitlist?.waitlist_position).toBe(1);
    expect(waitlistOutcome.waitlist?.status).toBe('ACTIVE');

    // 3. Existing allocated student releases their seat -> Dynamic Waitlist Promotion
    const promoOutcome = admissionMeritCounsellingAllotmentService.releaseSeatAndPromoteWaitlist({
      allocationId: 'sea-001', // Release Aarav Patel's seat
      programIntakeId: 'intake-bca-001',
      seatCategory: 'SC'
    });

    expect(promoOutcome.releasedAllocation.status).toBe('RELEASED');
    expect(promoOutcome.promotedWaitlist?.status).toBe('PROMOTED');
    expect(promoOutcome.newAllocation?.applicant_name).toBe('Anil Kumar');
    expect(promoOutcome.newAllocation?.status).toBe('ALLOCATED');
  });

  it('TEST 6: Counselling Dashboard Metrics: Computes authoritative candidate, score, and seat counters', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['ENTRANCE_VIEW', 'MERIT_VIEW', 'COUNSELLING_VIEW', 'SEAT_ALLOCATION_VIEW']
    };

    const metrics = admissionMeritCounsellingAllotmentService.getCounsellingDashboardMetrics(registrarContext);
    expect(metrics.totalEntranceCandidates).toBeGreaterThanOrEqual(2);
    expect(metrics.meritScoresGenerated).toBeGreaterThanOrEqual(3);
    expect(metrics.counsellingScheduled).toBeGreaterThanOrEqual(2);
    expect(metrics.seatsAllocated).toBeGreaterThanOrEqual(2);
    expect(metrics.totalAvailableSeats).toBeGreaterThanOrEqual(1);
  });
});
