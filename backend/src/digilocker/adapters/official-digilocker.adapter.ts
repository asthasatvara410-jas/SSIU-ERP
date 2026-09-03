import { Injectable, Logger } from '@nestjs/common';
import {
  DigiLockerProviderAdapter,
  DigiLockerAuthUrlResult,
  DigiLockerTokenExchangeResult,
  DigiLockerDocumentIssuePayload,
  DigiLockerDocumentIssueResult,
} from './digilocker-provider.adapter.interface';
import { ProductionDigiLockerProvider } from './production-digilocker.provider';
import { DemoDigiLockerProvider } from './demo-digilocker.provider';

@Injectable()
export class OfficialDigiLockerAdapter implements DigiLockerProviderAdapter {
  private readonly logger = new Logger(OfficialDigiLockerAdapter.name);

  constructor(
    private readonly productionProvider: ProductionDigiLockerProvider,
    private readonly demoProvider: DemoDigiLockerProvider,
  ) {}

  private isProductionConfigured(): boolean {
    return Boolean(
      process.env.DIGILOCKER_CLIENT_ID &&
      process.env.DIGILOCKER_CLIENT_SECRET &&
      process.env.DIGILOCKER_ENABLED === 'true'
    );
  }

  async createAuthorizationRequest(studentId: string, tenantId: string, state: string): Promise<DigiLockerAuthUrlResult> {
    if (this.isProductionConfigured()) {
      return this.productionProvider.createAuthorizationRequest(studentId, tenantId, state);
    }
    this.logger.warn(`Production DigiLocker credentials not configured. Delegating to Demo Sandbox Provider.`);
    return this.demoProvider.createAuthorizationRequest(studentId, tenantId, state);
  }

  async exchangeAuthorizationCode(code: string, state: string, tenantId: string): Promise<DigiLockerTokenExchangeResult> {
    if (this.isProductionConfigured()) {
      return this.productionProvider.exchangeAuthorizationCode(code, state, tenantId);
    }
    return this.demoProvider.exchangeAuthorizationCode(code, state, tenantId);
  }

  async issueDocument(payload: DigiLockerDocumentIssuePayload, tenantId: string): Promise<DigiLockerDocumentIssueResult> {
    if (this.isProductionConfigured()) {
      return this.productionProvider.issueDocument(payload, tenantId);
    }
    return this.demoProvider.issueDocument(payload, tenantId);
  }

  async getDocumentStatus(externalDocRef: string, tenantId: string): Promise<{ status: string; message: string }> {
    if (this.isProductionConfigured()) {
      return this.productionProvider.getDocumentStatus(externalDocRef, tenantId);
    }
    return this.demoProvider.getDocumentStatus(externalDocRef, tenantId);
  }

  async revokeConnection(externalUserRef: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    if (this.isProductionConfigured()) {
      return this.productionProvider.revokeConnection(externalUserRef, tenantId);
    }
    return this.demoProvider.revokeConnection(externalUserRef, tenantId);
  }
}
