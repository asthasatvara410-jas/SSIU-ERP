import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyEvaluationResult } from '../types/agent.types';

@Injectable()
export class AgentPolicyEngineService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Document Verification Policy
  async evaluateDocumentVerificationPolicy(
    overallConfidence: number,
    fieldMatches: { nameMatch: boolean; enrollmentMatch: boolean; dobMatch: boolean },
    tenantId: string = 'DEFAULT',
  ): Promise<PolicyEvaluationResult> {
    const minAutoConfidence = 95.0;
    const minReviewConfidence = 80.0;

    const criticalFieldsPassed = fieldMatches.nameMatch && fieldMatches.enrollmentMatch;

    if (overallConfidence >= minAutoConfidence && criticalFieldsPassed && fieldMatches.dobMatch) {
      return {
        passed: true,
        policyCode: 'DOC_AUTO_VERIFY_CONFIDENCE',
        autoApprovalAllowed: true,
        score: overallConfidence,
        reason: `Confidence ${overallConfidence.toFixed(1)}% satisfies automatic verification threshold (>= ${minAutoConfidence}%) with all critical entity checks matching.`,
      };
    }

    if (overallConfidence >= minReviewConfidence && criticalFieldsPassed) {
      return {
        passed: true,
        policyCode: 'DOC_ADMIN_REVIEW_REQUIRED',
        autoApprovalAllowed: false,
        score: overallConfidence,
        reason: `Confidence ${overallConfidence.toFixed(1)}% meets review threshold (>= ${minReviewConfidence}%), but requires Human Admin verification.`,
      };
    }

    return {
      passed: false,
      policyCode: 'DOC_REJECT_OR_MANUAL_REVIEW',
      autoApprovalAllowed: false,
      score: overallConfidence,
      reason: `Confidence ${overallConfidence.toFixed(1)}% is below standard threshold or critical entity mismatch detected.`,
      violations: [
        !fieldMatches.nameMatch ? 'Student Name mismatch' : '',
        !fieldMatches.enrollmentMatch ? 'Enrollment Number mismatch' : '',
        overallConfidence < minReviewConfidence ? `Low OCR Confidence (${overallConfidence.toFixed(1)}% < ${minReviewConfidence}%)` : '',
      ].filter(Boolean),
    };
  }

  // 2. Timetable Substitution Policy
  async evaluateSubstitutionPolicy(
    matchingScore: number,
    candidateWorkloadMin: number,
    maxDailyWorkloadMin: number = 360,
    hasScheduleConflict: boolean = false,
  ): Promise<PolicyEvaluationResult> {
    const minAutoScore = 85.0;
    const violations: string[] = [];

    if (hasScheduleConflict) {
      violations.push('Substitute faculty has an existing lecture schedule conflict at this time slot.');
    }

    if (candidateWorkloadMin >= maxDailyWorkloadMin) {
      violations.push(`Substitute faculty daily workload limit reached (${candidateWorkloadMin}m / ${maxDailyWorkloadMin}m max).`);
    }

    if (matchingScore < 60.0) {
      violations.push(`Domain expertise matching score too low (${matchingScore.toFixed(1)}% < 60.0%).`);
    }

    if (violations.length > 0) {
      return {
        passed: false,
        policyCode: 'TIMETABLE_SUBSTITUTION_REJECTED',
        autoApprovalAllowed: false,
        score: matchingScore,
        reason: 'Substitution candidate violated core academic scheduling constraints.',
        violations,
      };
    }

    const autoApprove = matchingScore >= minAutoScore && candidateWorkloadMin + 60 <= maxDailyWorkloadMin;

    return {
      passed: true,
      policyCode: autoApprove ? 'TIMETABLE_AUTO_SUBSTITUTE_APPROVED' : 'TIMETABLE_HOD_APPROVAL_REQUIRED',
      autoApprovalAllowed: autoApprove,
      score: matchingScore,
      reason: autoApprove
        ? `High matching score (${matchingScore.toFixed(1)}%) with acceptable workload permits automated timetable substitution.`
        : `Matching score (${matchingScore.toFixed(1)}%) requires HOD authorization before schedule update.`,
    };
  }

  // 3. Fee EMI & Recovery Policy
  async evaluateFeeRecoveryPolicy(
    totalOutstanding: number,
    proposedDownPayment: number,
    installmentsCount: number,
    discountRequested: number = 0,
  ): Promise<PolicyEvaluationResult> {
    const violations: string[] = [];
    const maxAllowedInstallments = 3;
    const minDownPaymentPct = 30.0;

    // Strict Prohibition: AI cannot invent fee discounts or balance waivers
    if (discountRequested > 0) {
      violations.push('Institutional financial policy strictly forbids fee waivers or discounts via AI Agent.');
    }

    if (installmentsCount > maxAllowedInstallments) {
      violations.push(`Maximum allowed installment count is ${maxAllowedInstallments} (requested: ${installmentsCount}).`);
    }

    const minRequiredDownPayment = totalOutstanding * (minDownPaymentPct / 100);
    if (proposedDownPayment < minRequiredDownPayment) {
      violations.push(
        `Minimum down payment is ${minDownPaymentPct}% (₹${minRequiredDownPayment.toLocaleString('en-IN')}). Proposed: ₹${proposedDownPayment.toLocaleString('en-IN')}.`,
      );
    }

    if (violations.length > 0) {
      return {
        passed: false,
        policyCode: 'FEE_EMI_POLICY_VIOLATION',
        autoApprovalAllowed: false,
        reason: 'Proposed fee recovery terms violate university financial guidelines.',
        violations,
      };
    }

    return {
      passed: true,
      policyCode: 'FEE_EMI_PROPOSAL_VALIDATED',
      autoApprovalAllowed: true,
      reason: `Proposed EMI plan meets institutional compliance (${installmentsCount} installments, down payment >= 30%, 0 discounts).`,
    };
  }
}
