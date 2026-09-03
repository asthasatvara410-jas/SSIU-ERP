export interface ABCIntegrationResponse {
  success: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'FAILED';
  message: string;
  externalTransactionId?: string;
  data?: any;
}

export interface ABCIntegrationAdapter {
  linkStudent(studentId: string, abcId: string, tenantId?: string): Promise<ABCIntegrationResponse>;
  verifyABCId(abcId: string, tenantId?: string): Promise<ABCIntegrationResponse>;
  syncCredits(studentId: string, abcId: string, creditPayload: any, tenantId?: string): Promise<ABCIntegrationResponse>;
}
