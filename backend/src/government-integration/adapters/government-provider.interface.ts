export interface GovernmentProvider {
  getProviderName(): string;
  healthCheck(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED'; latency: number }>;
  authenticate(): Promise<{ authenticated: boolean; tokenRef?: string }>;
  getStudentProfile(identifier: string): Promise<{ success: boolean; data?: any; error?: string }>;
  syncAcademicCredits(payload: { studentId: string; abcId: string; credits: any[] }): Promise<{ success: boolean; providerReference?: string; error?: string }>;
  publishCredential(payload: { studentId: string; credentialType: string; credentialNumber: string; documentId: string }): Promise<{ success: boolean; providerReference?: string; error?: string }>;
  revokeCredential(credentialNumber: string): Promise<{ success: boolean; error?: string }>;
}
