import { describe, it, expect } from 'vitest';
import { centralEnterpriseDataPlatformService } from '../services/centralEnterpriseDataPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.51: Enterprise Data Platform & Analytics Engine', () => {

  const departmentHod: UserAuthorizationContext = {
    userId: 'emp-hod-ce-001',
    userName: 'Head of Computer Engineering',
    email: 'hod.ce@swarrnim.edu.in',
    activeRole: 'HOD',
    assignedRoles: ['HOD', 'FACULTY'],
    permissions: ['ANALYTICS_VIEW']
  };

  const executiveDean: UserAuthorizationContext = {
    userId: 'emp-dean-001',
    userName: 'Dean of Academic Affairs',
    email: 'dean@swarrnim.edu.in',
    activeRole: 'DEAN',
    assignedRoles: ['DEAN', 'REGISTRAR'],
    permissions: ['ANALYTICS_VIEW', 'EXECUTIVE_BI_VIEW']
  };

  const studentUser: UserAuthorizationContext = {
    userId: 'stu-2026-001',
    userName: 'Student User',
    email: 'student@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['STUDENT_PORTAL']
  };

  it('TEST 1: Pipeline Execution & ETL: Transforms raw lake data into curated data mart', () => {
    const pipelineExec = centralEnterpriseDataPlatformService.executePipeline('pipe-stu-mart-001');

    expect(pipelineExec.status).toBe('SUCCESS');
    expect(pipelineExec.records_processed).toBeGreaterThan(1000);
    expect(pipelineExec.quality_score).toBeGreaterThanOrEqual(95);
  });

  it('TEST 2: Data Quality Gate: Evaluates dataset quality thresholds and rule adherence', () => {
    const quality = centralEnterpriseDataPlatformService.validateDataQuality('ds-curated-student-360');

    expect(quality.passed).toBe(true);
    expect(quality.score).toBeGreaterThanOrEqual(95.0);
    expect(quality.rules_evaluated).toBeGreaterThanOrEqual(10);
  });

  it('TEST 3: Row-Level Security: Department Head receives trimmed rows while Dean receives full dataset', () => {
    // 1. Department HOD query
    const hodResult = centralEnterpriseDataPlatformService.queryDataset({
      datasetId: 'ds-curated-student-360',
      context: departmentHod
    });
    expect(hodResult.is_trimmed).toBe(true);
    expect(hodResult.row_count).toBe(840);

    // 2. Executive Dean query
    const deanResult = centralEnterpriseDataPlatformService.queryDataset({
      datasetId: 'ds-curated-student-360',
      context: executiveDean
    });
    expect(deanResult.is_trimmed).toBe(false);
    expect(deanResult.row_count).toBe(12450);

    // 3. Student attempt -> Access Denied
    expect(() => {
      centralEnterpriseDataPlatformService.queryDataset({
        datasetId: 'ds-curated-student-360',
        context: studentUser
      });
    }).toThrow(/Analytics Access Denied: Students are not authorized/);
  });

  it('TEST 4: AI/ML Data Readiness: Validates feature store schema and leakage-free certification', () => {
    const mlDataset = centralEnterpriseDataPlatformService.getMLTrainingDataset('mlds-dropout-prediction-v1');

    expect(mlDataset.is_training_ready).toBe(true);
    expect(mlDataset.leakage_check_passed).toBe(true);
    expect(mlDataset.features_list).toContain('semester_attendance_pct');
    expect(mlDataset.target_feature).toBe('is_attrition_risk');
  });

  it('TEST 5: Data Platform Dashboard Telemetry: Validates curated datasets, freshness %, query latency, and posture', () => {
    const metrics = centralEnterpriseDataPlatformService.getDataPlatformMetrics(executiveDean);

    expect(metrics.curatedDatasetsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activePipelinesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.dataFreshnessPercent).toBeGreaterThanOrEqual(99.0);
    expect(metrics.averageQueryLatencyMs).toBeLessThan(25);
    expect(metrics.platformPosture).toBe('HEALTHY');
  });
});
