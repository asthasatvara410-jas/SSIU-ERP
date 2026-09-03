import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralBusinessContinuityService } from './centralBusinessContinuityService';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';
import { centralDocumentRiskManagementService } from './centralDocumentRiskManagementService';

export type DRExerciseType = 
  | 'TABLETOP'
  | 'WALKTHROUGH'
  | 'RESTORE'
  | 'FAILOVER'
  | 'TECHNICAL'
  | 'FULL_SIMULATION'
  | 'COMMUNICATION'
  | 'BUSINESS_RECOVERY';

export type DRExerciseStatus = 
  | 'DRAFT'
  | 'PLANNED'
  | 'APPROVED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type DRExerciseResult = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_EVALUATED';
export type ExerciseEnvironmentType = 'PRODUCTION' | 'STAGING_DR' | 'TEST' | 'SANDBOX';

export interface DRExerciseRecord {
  id: string;
  exercise_number: string;
  name: string;
  description: string;
  organization_id: string;
  plan_id: string;
  scenario: string;
  exercise_type: DRExerciseType;
  environment: ExerciseEnvironmentType;
  planned_date: string;
  actual_date?: string;
  director_id: string;
  status: DRExerciseStatus;
  result: DRExerciseResult;
  overall_score_percent?: number;
  pause_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseInjectRecord {
  id: string;
  exercise_id: string;
  inject_number: number;
  simulated_time: string;
  message: string;
  expected_response: string;
  actual_response?: string;
  status: 'PENDING' | 'RELEASED' | 'ACKNOWLEDGED' | 'RESPONDED' | 'MISSED';
}

export interface ExerciseObservationRecord {
  id: string;
  exercise_id: string;
  observer_id: string;
  area: string;
  observation_type: 'POSITIVE' | 'ISSUE' | 'DELAY' | 'PROCESS_GAP' | 'TECHNICAL_GAP' | 'COMMUNICATION_GAP';
  notes: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ExerciseFindingRecord {
  id: string;
  finding_number: string;
  exercise_id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'OBSERVATION' | 'FAILED_STEP' | 'RTO_BREACH' | 'RPO_BREACH' | 'CONTROL_FAILURE';
  owner_id: string;
  due_date: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATION' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CLOSED';
  is_recurring: boolean;
  remediation_action?: string;
  re_test_exercise_id?: string;
}

export interface ExerciseScorecardRecord {
  id: string;
  exercise_id: string;
  objective_achievement_score: number; // Max 30
  rto_performance_score: number;        // Max 25
  data_integrity_score: number;         // Max 20
  team_coordination_score: number;      // Max 15
  documentation_accuracy_score: number; // Max 10
  total_score_percent: number;          // 0-100
  configuration_version: number;
}

export interface ImprovementActionRecord {
  id: string;
  action_number: string;
  exercise_id: string;
  finding_id?: string;
  recommendation: string;
  owner_id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  due_date: string;
  status: 'IDENTIFIED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CLOSED';
}

export interface DRExerciseDashboardMetrics {
  totalExercisesCount: number;
  passedExercisesCount: number;
  inProgressExercisesCount: number;
  openFindingsCount: number;
  recurringFindingsCount: number;
  openImprovementActionsCount: number;
  averageScorecardPercent: number;
}

class CentralDRExerciseService {
  private static instance: CentralDRExerciseService;

  private exercises: DRExerciseRecord[] = [];
  private injects: ExerciseInjectRecord[] = [];
  private observations: ExerciseObservationRecord[] = [];
  private findings: ExerciseFindingRecord[] = [];
  private scorecards: ExerciseScorecardRecord[] = [];
  private improvementActions: ImprovementActionRecord[] = [];

  private exCounter = 100;
  private fndCounter = 100;
  private actCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDRExerciseService {
    if (!CentralDRExerciseService.instance) {
      CentralDRExerciseService.instance = new CentralDRExerciseService();
    }
    return CentralDRExerciseService.instance;
  }

  private seedDemoData(): void {
    const exId = 'drex-seed-001';
    this.exercises.push({
      id: exId,
      exercise_number: 'DR-EX-2026-000001',
      name: 'Q1 Tabletop Simulation: Campus Database Outage & Ransomware Containment',
      description: 'Role-playing tabletop exercise evaluating incident commander response, communication channels, and runbook step execution',
      organization_id: 'inst-sit',
      plan_id: 'bcp-seed-001',
      scenario: 'CYBER_INCIDENT',
      exercise_type: 'TABLETOP',
      environment: 'SANDBOX',
      planned_date: '2026-02-15T00:00:00Z',
      actual_date: '2026-02-15T00:00:00Z',
      director_id: 'emp-bcp-001',
      status: 'COMPLETED',
      result: 'PASS',
      overall_score_percent: 92,
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-02-15T12:00:00Z'
    });

    this.scorecards.push({
      id: 'sc-seed-001',
      exercise_id: exId,
      objective_achievement_score: 28,
      rto_performance_score: 23,
      data_integrity_score: 19,
      team_coordination_score: 14,
      documentation_accuracy_score: 8,
      total_score_percent: 92,
      configuration_version: 1
    });
  }

  // ─── EXERCISE CREATION & PRODUCTION SAFETY ────────────────────────────

  public createExercise(params: {
    name: string;
    description: string;
    organizationId: string;
    planId: string;
    scenario: string;
    exerciseType: DRExerciseType;
    environment: ExerciseEnvironmentType;
    plannedDate: string;
    directorId: string;
    isDestructiveActionPlanned?: boolean;
    context?: UserAuthorizationContext;
  }): DRExerciseRecord {
    // Production Protection Rule: Block destructive operations against PRODUCTION
    if (params.environment === 'PRODUCTION' && params.isDestructiveActionPlanned) {
      throw new Error(`Production Safety Blocked: Destructive disaster recovery exercise operations are prohibited against PRODUCTION environment`);
    }

    this.exCounter += 1;
    const exNumber = `DR-EX-2026-${String(this.exCounter).padStart(6, '0')}`;

    const exercise: DRExerciseRecord = {
      id: `drex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exercise_number: exNumber,
      name: params.name,
      description: params.description,
      organization_id: params.organizationId,
      plan_id: params.planId,
      scenario: params.scenario,
      exercise_type: params.exerciseType,
      environment: params.environment,
      planned_date: params.plannedDate,
      director_id: params.directorId,
      status: 'APPROVED',
      result: 'NOT_EVALUATED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.exercises.push(exercise);
    return exercise;
  }

  // ─── EXECUTION & INJECT MANAGEMENT ───────────────────────────────────

  public startExercise(exerciseId: string): DRExerciseRecord {
    const ex = this.exercises.find(e => e.id === exerciseId || e.exercise_number === exerciseId);
    if (!ex) throw new Error(`Exercise ${exerciseId} not found`);

    ex.status = 'IN_PROGRESS';
    ex.actual_date = new Date().toISOString();
    ex.updated_at = new Date().toISOString();

    return ex;
  }

  public recordInject(params: {
    exerciseId: string;
    injectNumber: number;
    simulatedTime: string;
    message: string;
    expectedResponse: string;
  }): ExerciseInjectRecord {
    const inject: ExerciseInjectRecord = {
      id: `inj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exercise_id: params.exerciseId,
      inject_number: params.injectNumber,
      simulated_time: params.simulatedTime,
      message: params.message,
      expected_response: params.expectedResponse,
      status: 'RELEASED'
    };

    this.injects.push(inject);
    return inject;
  }

  public pauseExercise(exerciseId: string, reason: string): DRExerciseRecord {
    const ex = this.exercises.find(e => e.id === exerciseId || e.exercise_number === exerciseId);
    if (!ex) throw new Error(`Exercise ${exerciseId} not found`);

    ex.status = 'PAUSED';
    ex.pause_reason = reason;
    ex.updated_at = new Date().toISOString();

    return ex;
  }

  // ─── OBSERVATIONS, FINDINGS & REMEDIATION ─────────────────────────────

  public recordObservation(params: {
    exerciseId: string;
    observerId: string;
    area: string;
    observationType: 'POSITIVE' | 'ISSUE' | 'DELAY' | 'PROCESS_GAP' | 'TECHNICAL_GAP' | 'COMMUNICATION_GAP';
    notes: string;
    severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }): ExerciseObservationRecord {
    const obs: ExerciseObservationRecord = {
      id: `obs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exercise_id: params.exerciseId,
      observer_id: params.observerId,
      area: params.area,
      observation_type: params.observationType,
      notes: params.notes,
      severity: params.severity || 'INFO'
    };

    this.observations.push(obs);
    return obs;
  }

  public createExerciseFinding(params: {
    exerciseId: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: 'OBSERVATION' | 'FAILED_STEP' | 'RTO_BREACH' | 'RPO_BREACH' | 'CONTROL_FAILURE';
    ownerId: string;
    dueDate: string;
    isRecurring?: boolean;
  }): ExerciseFindingRecord {
    this.fndCounter += 1;
    const fndNumber = `EFN/2026/${String(this.fndCounter).padStart(6, '0')}`;

    const finding: ExerciseFindingRecord = {
      id: `efn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      finding_number: fndNumber,
      exercise_id: params.exerciseId,
      description: params.description,
      severity: params.severity,
      source: params.source,
      owner_id: params.ownerId,
      due_date: params.dueDate,
      status: 'OPEN',
      is_recurring: params.isRecurring || false
    };

    this.findings.push(finding);
    return finding;
  }

  // ─── SCORECARD CALCULATION & COMPLETION ───────────────────────────────

  public calculateScorecard(params: {
    exerciseId: string;
    objectiveScore: number;
    rtoScore: number;
    dataIntegrityScore: number;
    teamScore: number;
    docScore: number;
  }): ExerciseScorecardRecord {
    const total = params.objectiveScore + params.rtoScore + params.dataIntegrityScore + params.teamScore + params.docScore;

    const scorecard: ExerciseScorecardRecord = {
      id: `sc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exercise_id: params.exerciseId,
      objective_achievement_score: params.objectiveScore,
      rto_performance_score: params.rtoScore,
      data_integrity_score: params.dataIntegrityScore,
      team_coordination_score: params.teamScore,
      documentation_accuracy_score: params.docScore,
      total_score_percent: total,
      configuration_version: 1
    };

    this.scorecards.push(scorecard);

    const ex = this.exercises.find(e => e.id === params.exerciseId);
    if (ex) {
      ex.overall_score_percent = total;
      ex.result = total >= 80 ? 'PASS' : total >= 60 ? 'PARTIAL' : 'FAIL';
      ex.status = 'COMPLETED';
      ex.updated_at = new Date().toISOString();
    }

    return scorecard;
  }

  // ─── CONTINUOUS IMPROVEMENT ──────────────────────────────────────────

  public createImprovementAction(params: {
    exerciseId: string;
    findingId?: string;
    recommendation: string;
    ownerId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueDate: string;
  }): ImprovementActionRecord {
    this.actCounter += 1;
    const actNumber = `ACT/2026/${String(this.actCounter).padStart(6, '0')}`;

    const action: ImprovementActionRecord = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action_number: actNumber,
      exercise_id: params.exerciseId,
      finding_id: params.findingId,
      recommendation: params.recommendation,
      owner_id: params.ownerId,
      priority: params.priority,
      due_date: params.dueDate,
      status: 'PLANNED'
    };

    this.improvementActions.push(action);
    return action;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getDRExerciseDashboardMetrics(context?: UserAuthorizationContext): DRExerciseDashboardMetrics {
    const totalExercisesCount = this.exercises.length;
    const passedExercisesCount = this.exercises.filter(e => e.result === 'PASS').length;
    const inProgressExercisesCount = this.exercises.filter(e => e.status === 'IN_PROGRESS').length;
    const openFindingsCount = this.findings.filter(f => f.status === 'OPEN' || f.status === 'REMEDIATION').length;
    const recurringFindingsCount = this.findings.filter(f => f.is_recurring).length;
    const openImprovementActionsCount = this.improvementActions.filter(a => a.status !== 'CLOSED').length;

    const scores = this.scorecards.map(s => s.total_score_percent);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      totalExercisesCount,
      passedExercisesCount,
      inProgressExercisesCount,
      openFindingsCount,
      recurringFindingsCount,
      openImprovementActionsCount,
      averageScorecardPercent: avgScore
    };
  }
}

export const centralDRExerciseService = CentralDRExerciseService.getInstance();
