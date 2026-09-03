import { describe, it, expect } from 'vitest';
import { centralDRExerciseService } from '../services/centralDRExerciseService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.30: Business Continuity & DR Exercise Management Engine', () => {

  const bcpDirector: UserAuthorizationContext = {
    userId: 'emp-bcp-001',
    userName: 'Director of BCP & DR Exercises',
    email: 'dr-director@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['EXERCISE_VIEW', 'EXERCISE_CREATE', 'EXERCISE_UPDATE', 'EXERCISE_APPROVE', 'EXERCISE_EXECUTE', 'EXERCISE_SCORE', 'EXERCISE_REPORT']
  };

  it('TEST 1: Exercise Master & Production Safety: Creates DR exercise and blocks destructive action on PRODUCTION', () => {
    const exercise = centralDRExerciseService.createExercise({
      name: 'Annual Primary Database Failover Exercise 2026',
      description: 'Simulation of cold storage node failover and application session re-establishment',
      organizationId: 'inst-sit',
      planId: 'bcp-seed-001',
      scenario: 'DATABASE_FAILURE',
      exerciseType: 'FAILOVER',
      environment: 'STAGING_DR',
      plannedDate: '2026-05-10T00:00:00Z',
      directorId: 'emp-bcp-001',
      context: bcpDirector
    });

    expect(exercise.id).toBeDefined();
    expect(exercise.exercise_number).toMatch(/^DR-EX-2026-\d{6}$/);
    expect(exercise.status).toBe('APPROVED');

    // Production safety rule: Destructive operations against PRODUCTION must throw
    expect(() => {
      centralDRExerciseService.createExercise({
        name: 'Dangerous Destructive Action on Live DB',
        description: 'Test destructive failover on prod',
        organizationId: 'inst-sit',
        planId: 'bcp-seed-001',
        scenario: 'DATABASE_FAILURE',
        exerciseType: 'FAILOVER',
        environment: 'PRODUCTION',
        plannedDate: '2026-05-10T00:00:00Z',
        directorId: 'emp-bcp-001',
        isDestructiveActionPlanned: true
      });
    }).toThrow(/Production Safety Blocked: Destructive disaster recovery exercise operations are prohibited against PRODUCTION environment/);
  });

  it('TEST 2: Tabletop Simulation & Inject Workflow: Starts exercise and processes inject lifecycle', () => {
    const exercise = centralDRExerciseService.createExercise({
      name: 'Cyber Ransomware Containment Tabletop Exercise',
      description: 'Tabletop drill testing incident response team decisions and communication channels',
      organizationId: 'inst-sit',
      planId: 'bcp-seed-001',
      scenario: 'CYBER_INCIDENT',
      exerciseType: 'TABLETOP',
      environment: 'SANDBOX',
      plannedDate: '2026-06-01T00:00:00Z',
      directorId: 'emp-bcp-001'
    });

    // 1. Start Exercise
    const started = centralDRExerciseService.startExercise(exercise.id);
    expect(started.status).toBe('IN_PROGRESS');

    // 2. Release Inject
    const inject = centralDRExerciseService.recordInject({
      exerciseId: exercise.id,
      injectNumber: 1,
      simulatedTime: 'T+00:15',
      message: 'Monitoring alerts indicate anomalous encryption spikes on secondary storage volume',
      expectedResponse: 'Incident commander orders storage volume isolation and network port disconnection'
    });

    expect(inject.id).toBeDefined();
    expect(inject.status).toBe('RELEASED');
  });

  it('TEST 3: Observations & Findings Logging: Captures observer notes and logs high-severity finding', () => {
    const exerciseId = 'drex-seed-001';

    // 1. Record Observation
    const obs = centralDRExerciseService.recordObservation({
      exerciseId,
      observerId: 'emp-aud-001',
      area: 'COMMUNICATION',
      observationType: 'DELAY',
      notes: 'Emergency SMS broadcast experienced a 12-minute delay due to gateway timeout',
      severity: 'HIGH'
    });
    expect(obs.id).toBeDefined();

    // 2. Create Exercise Finding
    const finding = centralDRExerciseService.createExerciseFinding({
      exerciseId,
      description: 'Emergency notification fallback gateway failed to trigger automatically',
      severity: 'HIGH',
      source: 'OBSERVATION',
      ownerId: 'emp-sys-001',
      dueDate: '2026-03-31T00:00:00Z'
    });

    expect(finding.id).toBeDefined();
    expect(finding.finding_number).toMatch(/^EFN\/2026\/\d{6}$/);
    expect(finding.status).toBe('OPEN');
  });

  it('TEST 4: Exercise Scorecard & Explainable Scoring: Calculates multi-dimensional performance scorecard', () => {
    const exercise = centralDRExerciseService.createExercise({
      name: 'Full Simulation Campus DR Drill',
      description: 'Comprehensive technical and operational recovery validation drill',
      organizationId: 'inst-sit',
      planId: 'bcp-seed-001',
      scenario: 'CLOUD_OUTAGE',
      exerciseType: 'FULL_SIMULATION',
      environment: 'STAGING_DR',
      plannedDate: '2026-07-01T00:00:00Z',
      directorId: 'emp-bcp-001'
    });

    const scorecard = centralDRExerciseService.calculateScorecard({
      exerciseId: exercise.id,
      objectiveScore: 28,     // Max 30
      rtoScore: 24,           // Max 25
      dataIntegrityScore: 19, // Max 20
      teamScore: 13,          // Max 15
      docScore: 9             // Max 10
    });

    expect(scorecard.id).toBeDefined();
    expect(scorecard.total_score_percent).toBe(93); // 28+24+19+13+9 = 93
    expect(exercise.result).toBe('PASS');
    expect(exercise.status).toBe('COMPLETED');
  });

  it('TEST 5: Continuous Improvement & Executive Dashboard: Records improvement action and validates KPIs', () => {
    const action = centralDRExerciseService.createImprovementAction({
      exerciseId: 'drex-seed-001',
      recommendation: 'Configure automated secondary SMS API failover gateway with redundant carrier routes',
      ownerId: 'emp-sys-001',
      priority: 'HIGH',
      dueDate: '2026-04-15T00:00:00Z'
    });

    expect(action.id).toBeDefined();
    expect(action.action_number).toMatch(/^ACT\/2026\/\d{6}$/);
    expect(action.status).toBe('PLANNED');

    const metrics = centralDRExerciseService.getDRExerciseDashboardMetrics(bcpDirector);
    expect(metrics.totalExercisesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.passedExercisesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageScorecardPercent).toBeGreaterThan(0);
    expect(metrics.openImprovementActionsCount).toBeGreaterThanOrEqual(1);
  });
});
