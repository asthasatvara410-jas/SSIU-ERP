import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';
import { centralEnterpriseContentManagementService } from './centralEnterpriseContentManagementService';
import { centralPortalPlatformService } from './centralPortalPlatformService';
import { centralServiceOperationsService } from './centralServiceOperationsService';
import { centralAdvancedCaseIncidentManagementService } from './centralAdvancedCaseIncidentManagementService';
import { centralEnterpriseNotificationService } from './centralEnterpriseNotificationService';
import { centralEnterpriseCalendarService } from './centralEnterpriseCalendarService';
import { centralEnterpriseSearchService } from './centralEnterpriseSearchService';
import { centralEnterpriseReportingBIService } from './centralEnterpriseReportingBIService';
import { centralEnterpriseIntegrationService } from './centralEnterpriseIntegrationService';
import { centralEnterpriseWorkflowBPMService } from './centralEnterpriseWorkflowBPMService';
import { centralMasterDataGovernanceService } from './centralMasterDataGovernanceService';
import { centralEnterpriseZeroTrustSecurityService } from './centralEnterpriseZeroTrustSecurityService';
import { centralEnterpriseObservabilitySREService } from './centralEnterpriseObservabilitySREService';

export type WarehouseLayer = 'RAW' | 'STAGING' | 'CURATED' | 'DATA_MART';
export type PipelineStatus = 'ACTIVE' | 'PAUSED' | 'RUNNING' | 'FAILED' | 'RETIRED';

export interface DataPipelineRecord {
  pipeline_id: string;
  name: string;
  source_layer: WarehouseLayer;
  target_layer: WarehouseLayer;
  target_mart: string;
  refresh_schedule: string;
  status: PipelineStatus;
  last_run_status: 'SUCCESS' | 'FAILED' | 'NEVER_RUN';
  last_run_at?: string;
  records_processed: number;
}

export interface CuratedDatasetRecord {
  dataset_id: string;
  name: string;
  domain: string;
  mart: string;
  is_certified: boolean;
  quality_score: number;
  row_count: number;
  last_refreshed_at: string;
  classification: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}

export interface MLDatasetRecord {
  ml_dataset_id: string;
  name: string;
  target_feature: string;
  features_list: string[];
  version: string;
  is_training_ready: boolean;
  leakage_check_passed: boolean;
}

export interface DataPlatformDashboardMetrics {
  curatedDatasetsCount: number;
  activePipelinesCount: number;
  dataFreshnessPercent: number;
  averageQueryLatencyMs: number;
  qualityPassRatePercent: number;
  platformPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseDataPlatformService {
  private static instance: CentralEnterpriseDataPlatformService;

  private pipelines: DataPipelineRecord[] = [];
  private datasets: CuratedDatasetRecord[] = [];
  private mlDatasets: MLDatasetRecord[] = [];

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseDataPlatformService {
    if (!CentralEnterpriseDataPlatformService.instance) {
      CentralEnterpriseDataPlatformService.instance = new CentralEnterpriseDataPlatformService();
    }
    return CentralEnterpriseDataPlatformService.instance;
  }

  private seedDemoData(): void {
    // 1. Data Pipelines
    this.pipelines.push({
      pipeline_id: 'pipe-stu-mart-001',
      name: 'Student 360 & Enrollment Curated Mart Pipeline',
      source_layer: 'RAW',
      target_layer: 'DATA_MART',
      target_mart: 'STUDENT_MART',
      refresh_schedule: '0 2 * * *', // Daily 2:00 AM
      status: 'ACTIVE',
      last_run_status: 'SUCCESS',
      last_run_at: '2026-01-01T02:00:00Z',
      records_processed: 12450
    });

    // 2. Curated Datasets
    this.datasets.push({
      dataset_id: 'ds-curated-student-360',
      name: 'Curated Student Academic & Financial 360 Dimension',
      domain: 'ACADEMIC',
      mart: 'STUDENT_MART',
      is_certified: true,
      quality_score: 99.4,
      row_count: 12450,
      last_refreshed_at: '2026-01-01T02:00:00Z',
      classification: 'INTERNAL'
    });

    // 3. ML Feature Ready Dataset
    this.mlDatasets.push({
      ml_dataset_id: 'mlds-dropout-prediction-v1',
      name: 'Student Academic Attrition & Early Warning Dataset',
      target_feature: 'is_attrition_risk',
      features_list: ['semester_attendance_pct', 'sgpa_trend', 'fee_payment_lag_days', 'lms_login_frequency'],
      version: '1.0',
      is_training_ready: true,
      leakage_check_passed: true
    });
  }

  // ─── PIPELINE EXECUTION & DATA REFRESH ────────────────────────────────

  public executePipeline(pipelineId: string): { status: string; records_processed: number; quality_score: number } {
    const pipeline = this.pipelines.find(p => p.pipeline_id === pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    if (pipeline.status === 'PAUSED' || pipeline.status === 'RETIRED') {
      throw new Error(`Pipeline ${pipelineId} is not in ACTIVE state`);
    }

    pipeline.last_run_status = 'SUCCESS';
    pipeline.last_run_at = new Date().toISOString();
    pipeline.records_processed = 12450;

    return {
      status: 'SUCCESS',
      records_processed: pipeline.records_processed,
      quality_score: 99.4
    };
  }

  // ─── DATA QUALITY GATES & RECONCILIATION ──────────────────────────────

  public validateDataQuality(datasetId: string): { passed: boolean; score: number; rules_evaluated: number } {
    const dataset = this.datasets.find(d => d.dataset_id === datasetId);
    if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

    return {
      passed: dataset.quality_score >= 95.0,
      score: dataset.quality_score,
      rules_evaluated: 18
    };
  }

  // ─── ANALYTICS ROW-LEVEL SECURITY ────────────────────────────────────

  public queryDataset(params: {
    datasetId: string;
    context: UserAuthorizationContext;
  }): { dataset_id: string; row_count: number; is_trimmed: boolean } {
    const dataset = this.datasets.find(d => d.dataset_id === params.datasetId);
    if (!dataset) throw new Error(`Dataset ${params.datasetId} not found`);

    // Authorization Gate
    if (params.context.activeRole === 'STUDENT') {
      throw new Error('Analytics Access Denied: Students are not authorized to query analytical data marts');
    }

    const isHod = params.context.activeRole === 'HOD';
    return {
      dataset_id: dataset.dataset_id,
      row_count: isHod ? 840 : dataset.row_count, // Department trimmed vs University-wide
      is_trimmed: isHod
    };
  }

  // ─── AI/ML DATA READINESS & FEATURE STORE ────────────────────────────

  public getMLTrainingDataset(mlDatasetId: string): MLDatasetRecord {
    const mlds = this.mlDatasets.find(m => m.ml_dataset_id === mlDatasetId);
    if (!mlds) throw new Error(`ML Dataset ${mlDatasetId} not found`);

    if (!mlds.is_training_ready || !mlds.leakage_check_passed) {
      throw new Error(`ML Dataset ${mlDatasetId} is not certified for AI/ML model training`);
    }

    return mlds;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getDataPlatformMetrics(context?: UserAuthorizationContext): DataPlatformDashboardMetrics {
    return {
      curatedDatasetsCount: this.datasets.length,
      activePipelinesCount: this.pipelines.filter(p => p.status === 'ACTIVE').length,
      dataFreshnessPercent: 99.8,
      averageQueryLatencyMs: 12.6,
      qualityPassRatePercent: 99.4,
      platformPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseDataPlatformService = CentralEnterpriseDataPlatformService.getInstance();
