import { db } from '../../../services/db';
import { Student } from '../../../types';
import {
  AcademicDocumentCategory,
  VerificationState,
  ExtractedFieldMatch,
  OcrExtractionResult,
  DMSDocumentAuditRecord,
  DMSArchiveOverviewMetrics
} from '../types';

export class DMSOcrVerificationService {
  private static instance: DMSOcrVerificationService;

  private static mockDocuments: DMSDocumentAuditRecord[] = [];

  public static getInstance(): DMSOcrVerificationService {
    if (!DMSOcrVerificationService.instance) {
      DMSOcrVerificationService.instance = new DMSOcrVerificationService();
      DMSOcrVerificationService.instance.initializeSampleRecords();
    }
    return DMSOcrVerificationService.instance;
  }

  private initializeSampleRecords(): void {
    const students = db.getStudents() || [];
    const s1 = students[0] || { id: 'stud-001', enrollmentNo: 'SSIU26BCA000001', firstName: 'Aarav', lastName: 'Patel', dob: '2004-05-14' };
    const s2 = students[1] || { id: 'stud-002', enrollmentNo: 'SSIU26BCA000002', firstName: 'Diya', lastName: 'Shah', dob: '2004-09-22' };

    DMSOcrVerificationService.mockDocuments = [
      {
        documentId: 'doc-lc-001',
        studentId: s1.id,
        enrollmentNo: s1.enrollmentNo,
        studentName: `${s1.firstName} ${s1.lastName}`,
        documentCategory: 'LEAVING_CERTIFICATE',
        fileName: 'school_leaving_certificate_aarav.pdf',
        fileSizeBytes: 1420000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-01-10T10:30:00Z',
        verificationStatus: 'VERIFIED',
        verifiedBy: 'Admissions Officer (K. Joshi)',
        verifiedAt: '2026-01-12T14:20:00Z',
        ocrExtraction: {
          extractionId: 'ocr-ext-001',
          documentId: 'doc-lc-001',
          documentCategory: 'LEAVING_CERTIFICATE',
          rawText: 'GUJARAT SECONDARY EDUCATION BOARD\nSCHOOL LEAVING CERTIFICATE\nName: AARAV PATEL\nFather: SURESH PATEL\nDOB: 14/05/2004\nSchool: Sharda Mandir High School\nConduct: Good',
          extractedFields: {
            candidateName: 'Aarav Patel',
            fatherName: 'Suresh Patel',
            dob: '2004-05-14',
            board: 'GSEB'
          },
          confidence: {
            overallConfidence: 96,
            fieldScores: { candidateName: 98, dob: 95, board: 95 }
          },
          crossValidationMatches: [
            {
              fieldKey: 'candidateName',
              fieldLabel: 'Candidate Name',
              extractedValue: 'Aarav Patel',
              masterValue: `${s1.firstName} ${s1.lastName}`,
              confidenceScore: 98,
              isMatch: true,
              mismatchSeverity: 'NONE'
            },
            {
              fieldKey: 'dob',
              fieldLabel: 'Date of Birth',
              extractedValue: '2004-05-14',
              masterValue: s1.dob || '2004-05-14',
              confidenceScore: 95,
              isMatch: true,
              mismatchSeverity: 'NONE'
            }
          ],
          anomalyDetected: false,
          processedAt: '2026-01-10T10:31:00Z'
        }
      },
      {
        documentId: 'doc-12th-002',
        studentId: s2.id,
        enrollmentNo: s2.enrollmentNo,
        studentName: `${s2.firstName} ${s2.lastName}`,
        documentCategory: 'MARKSHEET_12TH',
        fileName: 'hsc_marksheet_diya_shah.pdf',
        fileSizeBytes: 1850000,
        mimeType: 'application/pdf',
        uploadedAt: '2026-02-05T09:15:00Z',
        verificationStatus: 'SUSPICIOUS_ANOMALY',
        ocrExtraction: {
          extractionId: 'ocr-ext-002',
          documentId: 'doc-12th-002',
          documentCategory: 'MARKSHEET_12TH',
          rawText: 'CENTRAL BOARD OF SECONDARY EDUCATION\nHIGHER SECONDARY CERTIFICATE\nName: DIYA R SHAH\nDOB: 22/09/2003\nAggregate: 88.4%',
          extractedFields: {
            candidateName: 'Diya R Shah',
            dob: '2003-09-22',
            aggregate: '88.4%'
          },
          confidence: {
            overallConfidence: 91,
            fieldScores: { candidateName: 92, dob: 90 }
          },
          crossValidationMatches: [
            {
              fieldKey: 'candidateName',
              fieldLabel: 'Candidate Name',
              extractedValue: 'Diya R Shah',
              masterValue: `${s2.firstName} ${s2.lastName}`,
              confidenceScore: 92,
              isMatch: true,
              mismatchSeverity: 'NONE'
            },
            {
              fieldKey: 'dob',
              fieldLabel: 'Date of Birth',
              extractedValue: '2003-09-22',
              masterValue: s2.dob || '2004-09-22',
              confidenceScore: 90,
              isMatch: false,
              mismatchSeverity: 'CRITICAL'
            }
          ],
          anomalyDetected: true,
          anomalySummary: 'Date of Birth mismatch detected (Extracted: 2003-09-22 vs Master: 2004-09-22).',
          processedAt: '2026-02-05T09:16:00Z'
        }
      }
    ];
  }

  public getDocuments(filterCategory?: AcademicDocumentCategory): DMSDocumentAuditRecord[] {
    if (filterCategory) {
      return DMSOcrVerificationService.mockDocuments.filter(d => d.documentCategory === filterCategory);
    }
    return [...DMSOcrVerificationService.mockDocuments];
  }

  public getOverviewMetrics(): DMSArchiveOverviewMetrics {
    const docs = DMSOcrVerificationService.mockDocuments;
    const verified = docs.filter(d => d.verificationStatus === 'VERIFIED').length;
    const pending = docs.filter(d => d.verificationStatus === 'PENDING_REVIEW').length;
    const anomaly = docs.filter(d => d.verificationStatus === 'SUSPICIOUS_ANOMALY').length;
    const total = docs.length;

    const totalConf = docs.reduce((sum, d) => sum + (d.ocrExtraction?.confidence.overallConfidence || 0), 0);
    const avgConf = total > 0 ? Math.round(totalConf / total) : 0;

    return {
      totalArchivedDocuments: total,
      verifiedCount: verified,
      pendingReviewCount: pending,
      suspiciousAnomalyCount: anomaly,
      averageOcrConfidence: avgConf
    };
  }

  /**
   * Safe OCR simulation and Master Database cross-validator.
   */
  public extractAndValidateDocument(
    documentCategory: AcademicDocumentCategory,
    simulatedText: string,
    studentId: string
  ): OcrExtractionResult {
    const students = db.getStudents() || [];
    const student = students.find(s => s.id === studentId || s.enrollmentNo === studentId) || students[0];

    const extractedFields: Record<string, string> = {};
    const lines = simulatedText.split('\n');

    lines.forEach(line => {
      if (line.toLowerCase().includes('name:')) {
        extractedFields['candidateName'] = line.split(':')[1]?.trim() || '';
      } else if (line.toLowerCase().includes('dob:')) {
        extractedFields['dob'] = line.split(':')[1]?.trim() || '';
      } else if (line.toLowerCase().includes('board:')) {
        extractedFields['board'] = line.split(':')[1]?.trim() || '';
      } else if (line.toLowerCase().includes('aggregate:')) {
        extractedFields['aggregate'] = line.split(':')[1]?.trim() || '';
      }
    });

    const crossValidationMatches: ExtractedFieldMatch[] = [];
    let anomalyDetected = false;
    let anomalySummary = '';

    if (extractedFields['candidateName']) {
      const masterName = student ? `${student.firstName} ${student.lastName}` : 'Candidate';
      const isNameMatch = extractedFields['candidateName'].toLowerCase().includes(student?.firstName?.toLowerCase() || '');
      crossValidationMatches.push({
        fieldKey: 'candidateName',
        fieldLabel: 'Candidate Name',
        extractedValue: extractedFields['candidateName'],
        masterValue: masterName,
        confidenceScore: 94,
        isMatch: isNameMatch,
        mismatchSeverity: isNameMatch ? 'NONE' : 'LOW'
      });
      if (!isNameMatch) {
        anomalyDetected = true;
        anomalySummary = 'Name spelling divergence detected.';
      }
    }

    if (extractedFields['dob']) {
      const masterDob = student?.dob || '2004-05-14';
      const isDobMatch = extractedFields['dob'].replace(/[\/-]/g, '') === masterDob.replace(/[\/-]/g, '');
      crossValidationMatches.push({
        fieldKey: 'dob',
        fieldLabel: 'Date of Birth',
        extractedValue: extractedFields['dob'],
        masterValue: masterDob,
        confidenceScore: 92,
        isMatch: isDobMatch,
        mismatchSeverity: isDobMatch ? 'NONE' : 'CRITICAL'
      });
      if (!isDobMatch) {
        anomalyDetected = true;
        anomalySummary = (anomalySummary ? `${anomalySummary} ` : '') + 'Critical Date of Birth discrepancy.';
      }
    }

    return {
      extractionId: `ocr-sim-${Date.now()}`,
      documentId: `doc-sim-${Date.now()}`,
      documentCategory,
      rawText: simulatedText,
      extractedFields,
      confidence: {
        overallConfidence: anomalyDetected ? 78 : 95,
        fieldScores: { candidateName: 94, dob: 92 }
      },
      crossValidationMatches,
      anomalyDetected,
      anomalySummary: anomalyDetected ? anomalySummary : undefined,
      processedAt: new Date().toISOString()
    };
  }

  public updateVerificationStatus(
    documentId: string,
    status: VerificationState,
    verifierName: string = 'Current Admin User',
    reason?: string
  ): DMSDocumentAuditRecord | null {
    const doc = DMSOcrVerificationService.mockDocuments.find(d => d.documentId === documentId);
    if (!doc) return null;

    doc.verificationStatus = status;
    doc.verifiedBy = verifierName;
    doc.verifiedAt = new Date().toISOString();
    if (reason) doc.rejectionReason = reason;

    return { ...doc };
  }
}

export const dmsOcrVerificationService = DMSOcrVerificationService.getInstance();
