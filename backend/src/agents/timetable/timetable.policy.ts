import { Injectable, Logger } from '@nestjs/common';
import { AffectedLectureSlot, CandidateFacultyScore } from './timetable.types';

@Injectable()
export class TimetableAgentPolicyEngine {
  private readonly logger = new Logger('TimetableAgentPolicyEngine');

  /**
   * Deterministically scores candidate faculty based on objective parameters.
   */
  evaluateCandidateScore(
    candidate: {
      facultyId: string;
      facultyName: string;
      departmentId: string;
      isAvailable: boolean;
      hasConflict: boolean;
      currentWorkloadMin: number;
      maxWorkloadMin: number;
      teachesSubject: boolean;
      taughtBefore: boolean;
    },
    slot: AffectedLectureSlot,
  ): CandidateFacultyScore {
    // Immediate disqualifications
    if (!candidate.isAvailable || candidate.hasConflict) {
      return {
        facultyId: candidate.facultyId,
        facultyName: candidate.facultyName,
        departmentId: candidate.departmentId,
        isAvailable: candidate.isAvailable,
        hasScheduleConflict: candidate.hasConflict,
        currentWorkloadMin: candidate.currentWorkloadMin,
        maxWorkloadMin: candidate.maxWorkloadMin,
        subjectExpertiseScore: 0,
        departmentMatchBonus: 0,
        workloadCapacityScore: 0,
        totalScore: 0,
        recommendationReason: candidate.hasConflict 
          ? 'Disqualified: Faculty has existing lecture conflict in this time slot.'
          : 'Disqualified: Faculty marked unavailable or on leave.',
      };
    }

    // Workload check
    const projectedWorkload = candidate.currentWorkloadMin + 60;
    if (projectedWorkload > candidate.maxWorkloadMin) {
      return {
        facultyId: candidate.facultyId,
        facultyName: candidate.facultyName,
        departmentId: candidate.departmentId,
        isAvailable: candidate.isAvailable,
        hasScheduleConflict: false,
        currentWorkloadMin: candidate.currentWorkloadMin,
        maxWorkloadMin: candidate.maxWorkloadMin,
        subjectExpertiseScore: 0,
        departmentMatchBonus: 0,
        workloadCapacityScore: 0,
        totalScore: 0,
        recommendationReason: `Disqualified: Exceeds daily workload threshold (${projectedWorkload}m > ${candidate.maxWorkloadMin}m).`,
      };
    }

    // 1. Subject Expertise (0 - 40 pts)
    let subjectExpertiseScore = 20; // baseline for department peers
    if (candidate.teachesSubject) subjectExpertiseScore = 40;
    else if (candidate.taughtBefore) subjectExpertiseScore = 32;

    // 2. Department Match (0 - 25 pts)
    const isSameDept = candidate.departmentId === slot.departmentId;
    const departmentMatchBonus = isSameDept ? 25 : 5;

    // 3. Workload Capacity (0 - 25 pts)
    // Less current workload yields higher score
    const capacityRatio = Math.max(0, (candidate.maxWorkloadMin - candidate.currentWorkloadMin) / candidate.maxWorkloadMin);
    const workloadCapacityScore = Math.round(capacityRatio * 25);

    // 4. Availability Bonus (10 pts)
    const availabilityBonus = 10;

    const totalScore = Math.min(100, Math.round(
      subjectExpertiseScore + departmentMatchBonus + workloadCapacityScore + availabilityBonus
    ));

    const recommendationReason = `Qualified candidate (Score: ${totalScore}%). ` +
      `${isSameDept ? 'Same department' : 'Cross-department'} with ${candidate.currentWorkloadMin}m current daily workload. ` +
      `${candidate.teachesSubject ? 'Direct subject expert.' : 'Qualified peer educator.'}`;

    return {
      facultyId: candidate.facultyId,
      facultyName: candidate.facultyName,
      departmentId: candidate.departmentId,
      isAvailable: true,
      hasScheduleConflict: false,
      currentWorkloadMin: candidate.currentWorkloadMin,
      maxWorkloadMin: candidate.maxWorkloadMin,
      subjectExpertiseScore,
      departmentMatchBonus,
      workloadCapacityScore,
      totalScore,
      recommendationReason,
    };
  }
}
