export type AcademicDocumentCategory =
  | 'LEAVING_CERTIFICATE'
  | 'MARKSHEET_10TH'
  | 'MARKSHEET_12TH'
  | 'DIPLOMA_CERTIFICATE'
  | 'DEGREE_CERTIFICATE'
  | 'AADHAAR_CARD'
  | 'CASTE_CERTIFICATE'
  | 'MIGRATION_CERTIFICATE'
  | 'INCOME_CERTIFICATE';

export type VerificationState = 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'SUSPICIOUS_ANOMALY';

export interface DocumentOcrConfidenceScore {
  overallConfidence: number; // 0 - 100
  fieldScores: Record<string, number>;
}

export interface ExtractedFieldMatch {
  fieldKey: string;
  fieldLabel: string;
  extractedValue: string;
  masterValue: string;
  confidenceScore: number;
  isMatch: boolean;
  mismatchSeverity?: 'NONE' | 'LOW' | 'CRITICAL';
}

export interface OcrExtractionResult {
  extractionId: string;
  documentId: string;
  documentCategory: AcademicDocumentCategory;
  rawText: string;
  extractedFields: Record<string, string>;
  confidence: DocumentOcrConfidenceScore;
  crossValidationMatches: ExtractedFieldMatch[];
  anomalyDetected: boolean;
  anomalySummary?: string;
  processedAt: string;
}

export interface DMSDocumentAuditRecord {
  documentId: string;
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  documentCategory: AcademicDocumentCategory;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  verificationStatus: VerificationState;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  ocrExtraction?: OcrExtractionResult;
}

export interface DMSArchiveOverviewMetrics {
  totalArchivedDocuments: number;
  verifiedCount: number;
  pendingReviewCount: number;
  suspiciousAnomalyCount: number;
  averageOcrConfidence: number;
}
