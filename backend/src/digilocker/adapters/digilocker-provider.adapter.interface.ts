/**
 * SSIU ERP — DigiLocker Provider Adapter Interface
 * Defines standard contract for citizen document issuance & repository sync.
 */

export interface DigiLockerAuthUrlResult {
  authorizationUrl: string;
  state: string;
  expiresInSeconds: number;
}

export interface DigiLockerTokenExchangeResult {
  success: boolean;
  externalUserReference?: string;
  provider: string;
  message?: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'FAILED';
}

export interface DigiLockerDocumentIssuePayload {
  studentId: string;
  documentType: string;
  documentNumber: string;
  docDataPdfBase64?: string;
  docDataXml?: string;
  metadata: {
    studentName: string;
    enrollmentNo: string;
    academicYear: string;
    programName: string;
    issuedDate: string;
  };
}

export interface DigiLockerDocumentIssueResult {
  success: boolean;
  status: 'PENDING' | 'SUBMITTED' | 'PROCESSING' | 'ISSUED' | 'FAILED' | 'NOT_CONFIGURED';
  externalDocumentReference?: string;
  message: string;
  retryEligible: boolean;
}

export interface DigiLockerProviderAdapter {
  createAuthorizationRequest(studentId: string, tenantId: string, state: string): Promise<DigiLockerAuthUrlResult>;
  exchangeAuthorizationCode(code: string, state: string, tenantId: string): Promise<DigiLockerTokenExchangeResult>;
  issueDocument(payload: DigiLockerDocumentIssuePayload, tenantId: string): Promise<DigiLockerDocumentIssueResult>;
  getDocumentStatus(externalDocRef: string, tenantId: string): Promise<{ status: string; message: string }>;
  revokeConnection(externalUserRef: string, tenantId: string): Promise<{ success: boolean; message: string }>;
}
