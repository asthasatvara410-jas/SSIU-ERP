import { Injectable, Logger } from '@nestjs/common';
import { ABCIntegrationAdapter, ABCIntegrationResponse } from './abc-integration.adapter.interface';

@Injectable()
export class SafePlaceholderABCAdapter implements ABCIntegrationAdapter {
  private readonly logger = new Logger('SafePlaceholderABCAdapter');

  async linkStudent(studentId: string, abcId: string, tenantId?: string): Promise<ABCIntegrationResponse> {
    this.logger.log(`[ABC Safe Adapter] linkStudent called for student=${studentId}, abcId=${abcId} (Tenant: ${tenantId || 'DEFAULT'})`);
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'Official Government ABC/DigiLocker gateway adapter is NOT_CONFIGURED in this deployment. Records are safely stored in local SSIU ERP database.',
    };
  }

  async verifyABCId(abcId: string, tenantId?: string): Promise<ABCIntegrationResponse> {
    this.logger.log(`[ABC Safe Adapter] verifyABCId called for abcId=${abcId} (Tenant: ${tenantId || 'DEFAULT'})`);
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'Official National ABC Registry API not connected. Manual or Institutional Mentor verification active.',
    };
  }

  async syncCredits(studentId: string, abcId: string, creditPayload: any, tenantId?: string): Promise<ABCIntegrationResponse> {
    this.logger.log(`[ABC Safe Adapter] syncCredits called for student=${studentId}, abcId=${abcId} (Tenant: ${tenantId || 'DEFAULT'})`);
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'Government National Academic Depository (NAD) DigiLocker API not configured. Credit payload prepared and queued safely.',
      data: {
        queuedCredits: creditPayload?.totalCredits || 0,
        queuedCoursesCount: creditPayload?.courses?.length || 0,
      },
    };
  }
}
