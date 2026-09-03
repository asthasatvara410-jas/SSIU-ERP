import { Injectable, Logger } from '@nestjs/common';
import {
  DigiLockerProviderAdapter,
  DigiLockerAuthUrlResult,
  DigiLockerTokenExchangeResult,
  DigiLockerDocumentIssuePayload,
  DigiLockerDocumentIssueResult,
} from './digilocker-provider.adapter.interface';

@Injectable()
export class DemoDigiLockerProvider implements DigiLockerProviderAdapter {
  private readonly logger = new Logger(DemoDigiLockerProvider.name);

  async createAuthorizationRequest(studentId: string, tenantId: string, state: string): Promise<DigiLockerAuthUrlResult> {
    this.logger.log(`[Demo Sandbox] Initiating simulated DigiLocker authorization for student ${studentId}`);
    return {
      authorizationUrl: `/digilocker-auth-sim?state=${state}&mode=demo_sandbox`,
      state,
      expiresInSeconds: 300,
    };
  }

  async exchangeAuthorizationCode(code: string, state: string, tenantId: string): Promise<DigiLockerTokenExchangeResult> {
    this.logger.log(`[Demo Sandbox] Exchanging authorization code in isolated sandbox mode`);
    return {
      success: true,
      status: 'CONNECTED',
      provider: 'DEMO_SANDBOX_SIMULATOR',
      externalUserReference: `demo-dl-usr-${Date.now()}`,
      message: 'Demo Sandbox DigiLocker link established successfully (Isolated Test Mode).',
    };
  }

  async issueDocument(payload: DigiLockerDocumentIssuePayload, tenantId: string): Promise<DigiLockerDocumentIssueResult> {
    this.logger.log(`[Demo Sandbox] Issuing academic document ${payload.documentNumber} to sandbox depository`);
    return {
      success: true,
      status: 'ISSUED',
      externalDocumentReference: `sandbox-doc-${Date.now()}-${payload.documentNumber}`,
      message: 'Document published to Demo Sandbox DigiLocker depository.',
      retryEligible: false,
    };
  }

  async getDocumentStatus(externalDocRef: string, tenantId: string): Promise<{ status: string; message: string }> {
    return {
      status: 'ISSUED',
      message: 'Demo Sandbox document verified.',
    };
  }

  async revokeConnection(externalUserRef: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Demo Sandbox DigiLocker connection revoked.',
    };
  }
}
