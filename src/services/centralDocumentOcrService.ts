import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentSearchService } from './centralDocumentSearchService';
import { centralDocumentAccessControlService } from './centralDocumentAccessControlService';

export type OcrJobStatus = 
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'REVIEW_REQUIRED'
  | 'FAILED'
  | 'CANCELLED';

export type OcrPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface DocumentOcrJobRecord {
  id: string;
  document_id: string;
  version_id: string;
  status: OcrJobStatus;
  priority: OcrPriority;
  requested_by: string;
  started_at?: string;
  completed_at?: string;
  failure_reason?: string;
  engine_reference: string;
  engine_version: string;
  average_confidence: number;
  total_pages: number;
  created_at: string;
}

export interface DocumentOcrPageRecord {
  id: string;
  ocr_job_id: string;
  page_number: number;
  text: string;
  confidence: number; // 0 - 100
  status: 'COMPLETED' | 'FAILED';
  language: string; // 'en' | 'gu' | 'hi'
  processing_time_ms: number;
}

export interface OcrExtractedFieldRecord {
  id: string;
  document_id: string;
  version_id: string;
  ocr_job_id: string;
  field_name: string;
  raw_value: string;
  normalized_value: string;
  confidence: number;
  source_page: number;
  status: 'VALID' | 'INVALID' | 'REVIEW_REQUIRED' | 'CORRECTED';
  corrected_by?: string;
  corrected_at?: string;
  correction_reason?: string;
}

export interface OcrReviewTaskRecord {
  id: string;
  document_id: string;
  version_id: string;
  ocr_job_id: string;
  assigned_to?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'CORRECTED' | 'ACCEPTED' | 'REJECTED';
  reason: string;
  created_at: string;
  completed_at?: string;
}

export interface DocumentOcrDashboardMetrics {
  totalJobsCount: number;
  completedJobsCount: number;
  reviewRequiredCount: number;
  failedJobsCount: number;
  averageConfidence: number;
  correctedFieldsCount: number;
}

class CentralDocumentOcrService {
  private static instance: CentralDocumentOcrService;

  private jobs: DocumentOcrJobRecord[] = [];
  private pages: DocumentOcrPageRecord[] = [];
  private fields: OcrExtractedFieldRecord[] = [];
  private reviewTasks: OcrReviewTaskRecord[] = [];

  private constructor() {
    this.seedDemoOcrData();
  }

  public static getInstance(): CentralDocumentOcrService {
    if (!CentralDocumentOcrService.instance) {
      CentralDocumentOcrService.instance = new CentralDocumentOcrService();
    }
    return CentralDocumentOcrService.instance;
  }

  private seedDemoOcrData(): void {
    const jobId = 'ocr-job-001';
    this.jobs.push({
      id: jobId,
      document_id: 'dms-doc-001',
      version_id: 'ver-001',
      status: 'COMPLETED',
      priority: 'NORMAL',
      requested_by: 'SYSTEM',
      started_at: '2026-04-10T10:01:00Z',
      completed_at: '2026-04-10T10:01:15Z',
      engine_reference: 'SSIU-Tesseract-OCR-v4',
      engine_version: '4.2.0',
      average_confidence: 96.5,
      total_pages: 1,
      created_at: '2026-04-10T10:01:00Z'
    });

    this.pages.push({
      id: 'ocr-pg-001',
      ocr_job_id: jobId,
      page_number: 1,
      text: 'GOVERNMENT OF INDIA - UNIQUE IDENTIFICATION AUTHORITY OF INDIA\nName: Aarav Patel\nDOB: 15/08/2004\nGender: Male\nAadhaar No: 9988 7766 5544\nAddress: Gandhinagar, Gujarat - 382010',
      confidence: 96.5,
      status: 'COMPLETED',
      language: 'en',
      processing_time_ms: 1250
    });

    this.fields.push(
      {
        id: 'fld-001',
        document_id: 'dms-doc-001',
        version_id: 'ver-001',
        ocr_job_id: jobId,
        field_name: 'student_name',
        raw_value: 'Aarav Patel',
        normalized_value: 'AARAV PATEL',
        confidence: 98.0,
        source_page: 1,
        status: 'VALID'
      },
      {
        id: 'fld-002',
        document_id: 'dms-doc-001',
        version_id: 'ver-001',
        ocr_job_id: jobId,
        field_name: 'dob',
        raw_value: '15/08/2004',
        normalized_value: '2004-08-15',
        confidence: 95.0,
        source_page: 1,
        status: 'VALID'
      }
    );
  }

  // ─── EXECUTE OCR PROCESSING PIPELINE ─────────────────────────────────

  public processDocumentOcr(params: {
    documentId: string;
    versionId: string;
    rawText: string;
    totalPages?: number;
    language?: string;
    confidenceScore?: number;
    simulatedFields?: Array<{ name: string; rawValue: string; confidence: number }>;
    requestedBy: string;
    priority?: OcrPriority;
    context?: UserAuthorizationContext;
  }): DocumentOcrJobRecord {
    const doc = centralDocumentManagementService.getDocumentById(params.documentId, params.context);
    if (!doc) {
      throw new Error(`Document ${params.documentId} not found or inaccessible`);
    }

    const jobId = `ocr-job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalPages = params.totalPages || 1;
    const confidence = params.confidenceScore !== undefined ? params.confidenceScore : 94.0;
    const isLowConfidence = confidence < 75.0;
    const status: OcrJobStatus = isLowConfidence ? 'REVIEW_REQUIRED' : 'COMPLETED';

    const job: DocumentOcrJobRecord = {
      id: jobId,
      document_id: params.documentId,
      version_id: params.versionId,
      status,
      priority: params.priority || 'NORMAL',
      requested_by: params.requestedBy,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      engine_reference: 'SSIU-Neural-OCR-Pipeline',
      engine_version: '2.5.0',
      average_confidence: confidence,
      total_pages: totalPages,
      created_at: new Date().toISOString()
    };
    this.jobs.push(job);

    // Record Extracted Page
    const pageId = `ocr-pg-${Date.now()}`;
    this.pages.push({
      id: pageId,
      ocr_job_id: jobId,
      page_number: 1,
      text: params.rawText,
      confidence,
      status: 'COMPLETED',
      language: params.language || 'en',
      processing_time_ms: 840
    });

    // Record Extracted Fields
    if (params.simulatedFields && params.simulatedFields.length > 0) {
      params.simulatedFields.forEach(f => {
        let normalized = f.rawValue.trim().toUpperCase();
        // Date normalization DD/MM/YYYY -> YYYY-MM-DD
        if (f.name.toLowerCase().includes('date') || f.name.toLowerCase() === 'dob') {
          const parts = f.rawValue.split(/[/.-]/);
          if (parts.length === 3 && parts[2].length === 4) {
            normalized = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        const fieldStatus = f.confidence < 75.0 ? 'REVIEW_REQUIRED' : 'VALID';

        this.fields.push({
          id: `fld-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          document_id: params.documentId,
          version_id: params.versionId,
          ocr_job_id: jobId,
          field_name: f.name,
          raw_value: f.rawValue,
          normalized_value: normalized,
          confidence: f.confidence,
          source_page: 1,
          status: fieldStatus
        });
      });
    }

    // If low confidence, queue for human review
    if (isLowConfidence) {
      const taskId = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.reviewTasks.push({
        id: taskId,
        document_id: params.documentId,
        version_id: params.versionId,
        ocr_job_id: jobId,
        status: 'PENDING',
        reason: `Low OCR Confidence (${confidence.toFixed(1)}% < 75% threshold)`,
        created_at: new Date().toISOString()
      });
    }

    // Update Central Search Index with extracted text
    centralDocumentSearchService.updateDocumentOcrText(params.documentId, params.rawText);

    return job;
  }

  // ─── HUMAN REVIEW & FIELD CORRECTION ENGINE ───────────────────────────

  public correctExtractedField(params: {
    fieldId: string;
    correctedValue: string;
    correctedBy: string;
    reason: string;
  }): OcrExtractedFieldRecord {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Mandatory audit reason required to correct an OCR extracted field');
    }

    const field = this.fields.find(f => f.id === params.fieldId);
    if (!field) throw new Error(`Extracted field ${params.fieldId} not found`);

    field.normalized_value = params.correctedValue.trim().toUpperCase();
    field.status = 'CORRECTED';
    field.corrected_by = params.correctedBy;
    field.corrected_at = new Date().toISOString();
    field.correction_reason = params.reason;

    return field;
  }

  public completeOcrReview(params: {
    taskId: string;
    reviewedBy: string;
    decision: 'ACCEPTED' | 'REJECTED';
    remarks?: string;
  }): OcrReviewTaskRecord {
    const task = this.reviewTasks.find(t => t.id === params.taskId);
    if (!task) throw new Error(`OCR review task ${params.taskId} not found`);

    task.status = params.decision;
    task.assigned_to = params.reviewedBy;
    task.completed_at = new Date().toISOString();

    // Update parent OCR job status
    const job = this.jobs.find(j => j.id === task.ocr_job_id);
    if (job && params.decision === 'ACCEPTED') {
      job.status = 'COMPLETED';
    }

    return task;
  }

  // ─── QUERY OCR RESULTS WITH PERMISSION ENFORCEMENT ────────────────────

  public getOcrResultForDocument(params: {
    documentId: string;
    versionId?: string;
    user: UserAuthorizationContext;
  }): { job: DocumentOcrJobRecord | undefined; pages: DocumentOcrPageRecord[]; fields: OcrExtractedFieldRecord[] } {
    // Enforce Document Access Control
    const access = centralDocumentAccessControlService.canAccessDocument({
      user: params.user,
      documentId: params.documentId,
      action: 'VIEW'
    });

    if (!access.allowed) {
      throw new Error(`Unauthorized OCR Access: ${access.reason}`);
    }

    const matchingJobs = this.jobs.filter(j => 
      j.document_id === params.documentId && 
      (!params.versionId || j.version_id === params.versionId)
    );
    const job = matchingJobs.length > 0 ? matchingJobs[matchingJobs.length - 1] : undefined;

    if (!job) {
      return { job: undefined, pages: [], fields: [] };
    }

    const pages = this.pages.filter(p => p.ocr_job_id === job.id);
    const fields = this.fields.filter(f => f.ocr_job_id === job.id);

    return { job, pages, fields };
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getOcrDashboardMetrics(context?: UserAuthorizationContext): DocumentOcrDashboardMetrics {
    const totalJobsCount = this.jobs.length;
    const completedJobsCount = this.jobs.filter(j => j.status === 'COMPLETED').length;
    const reviewRequiredCount = this.jobs.filter(j => j.status === 'REVIEW_REQUIRED').length;
    const failedJobsCount = this.jobs.filter(j => j.status === 'FAILED').length;
    const totalConf = this.jobs.reduce((acc, curr) => acc + curr.average_confidence, 0);
    const averageConfidence = totalJobsCount > 0 ? parseFloat((totalConf / totalJobsCount).toFixed(1)) : 0;
    const correctedFieldsCount = this.fields.filter(f => f.status === 'CORRECTED').length;

    return {
      totalJobsCount,
      completedJobsCount,
      reviewRequiredCount,
      failedJobsCount,
      averageConfidence,
      correctedFieldsCount
    };
  }
}

export const centralDocumentOcrService = CentralDocumentOcrService.getInstance();
