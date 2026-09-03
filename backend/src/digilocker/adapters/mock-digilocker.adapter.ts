import { Injectable } from '@nestjs/common';
import {
  DigiLockerProviderAdapter,
  DigiLockerAuthUrlResult,
  DigiLockerTokenExchangeResult,
  DigiLockerDocumentIssuePayload,
  DigiLockerDocumentIssueResult,
} from './digilocker-provider.adapter.interface';

@Injectable()
export class MockDigiLockerAdapter implements DigiLockerProviderAdapter {
  async createAuthorizationRequest(studentId: string, tenantId: string, state: string): Promise<DigiLockerAuthUrlResult> {
    return {
      authorizationUrl: `https://sandbox.digitallocker.gov.in/oauth/authorize?client_id=SSIU_MOCK_CLIENT&state=${state}`,
      state,
      expiresInSeconds: 300,
    };
  }

  async exchangeAuthorizationCode(code: string, state: string, tenantId: string): Promise<DigiLockerTokenExchangeResult> {
    return {
      success: true,
      status: 'CONNECTED',
      provider: 'DIGILOCKER_SANDBOX_MOCK',
      externalUserReference: `mock-dl-usr-${Date.now()}`,
      message: 'DigiLocker sandbox account linked successfully.',
    };
  }

  async issueDocument(payload: DigiLockerDocumentIssuePayload, tenantId: string): Promise<DigiLockerDocumentIssueResult> {
    return {
      success: true,
      status: 'ISSUED',
      externalDocumentReference: `mock-doc-${payload.documentNumber}`,
      message: `Document ${payload.documentNumber} (${payload.documentType}) successfully issued to DigiLocker mock repository.`,
      retryEligible: false,
    };
  }

  async getDocumentStatus(externalDocRef: string, tenantId: string): Promise<{ status: string; message: string }> {
    return {
      status: 'ISSUED',
      message: 'Document verified in DigiLocker repository.',
    };
  }

  async revokeConnection(externalUserRef: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'DigiLocker connection disconnected successfully.',
    };
  }
}
