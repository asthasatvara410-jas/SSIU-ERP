import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ABCIntegrationService } from './abc-integration.service';
import { DigiLockerIntegrationService } from './digilocker-integration.service';
import { CredentialIntegrationService } from './credential-integration.service';
import { AcademicRecordSyncService } from './academic-record-sync.service';
import { ABCProviderAdapter } from './adapters/abc-provider.adapter';
import { DigiLockerProviderAdapter } from './adapters/digilocker-provider.adapter';
import { IntegrationAuditService } from './integration-audit.service';
import { PublishCredentialDto } from './dto/government-integration.dto';

@Injectable()
export class GovernmentIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abcService: ABCIntegrationService,
    private readonly dlService: DigiLockerIntegrationService,
    private readonly credService: CredentialIntegrationService,
    private readonly syncService: AcademicRecordSyncService,
    private readonly abcAdapter: ABCProviderAdapter,
    private readonly dlAdapter: DigiLockerProviderAdapter,
    private readonly auditService: IntegrationAuditService,
  ) {}

  async getAdminDashboard(tenantId: string) {
    const [abcProfiles, dlProfiles, creds, syncLogs] = await Promise.all([
      this.prisma.studentABCProfile.findMany({ where: { tenantId } }),
      this.prisma.digiLockerProfile.findMany({ where: { tenantId } }),
      this.prisma.digitalCredential.findMany({ where: { tenantId } }),
      this.prisma.governmentSyncLog.findMany({ where: { tenantId } }),
    ]);

    const verifiedAbc = abcProfiles.filter(p => p.verificationStatus === 'VERIFIED').length;
    const connectedDl = dlProfiles.filter(p => p.connectionStatus === 'CONNECTED').length;
    const publishedCreds = creds.filter(c => c.status === 'PUBLISHED').length;

    const [abcHealth, dlHealth] = await Promise.all([
      this.abcAdapter.healthCheck(),
      this.dlAdapter.healthCheck(),
    ]);

    return {
      abcSummary: {
        totalLinked: abcProfiles.length,
        verified: verifiedAbc,
        pendingVerification: abcProfiles.filter(p => p.verificationStatus === 'PENDING').length,
        synced: abcProfiles.filter(p => p.syncStatus === 'SYNCED').length,
      },
      digiLockerSummary: {
        connectedStudents: connectedDl,
        publishedCredentials: publishedCreds,
        failedCredentials: creds.filter(c => c.status === 'FAILED').length,
      },
      providers: [
        {
          name: 'Academic Bank of Credits (ABC / APAAR)',
          status: abcHealth.status,
          latency: abcHealth.latency,
          mode: process.env.GOVERNMENT_INTEGRATION_MODE || 'MOCK',
        },
        {
          name: 'DigiLocker National Academic Depository (NAD)',
          status: dlHealth.status,
          latency: dlHealth.latency,
          mode: process.env.GOVERNMENT_INTEGRATION_MODE || 'MOCK',
        },
      ],
      recentSyncCount: syncLogs.length,
    };
  }

  // ABC
  async getABCProfile(studentId: string, tenantId: string) {
    return this.abcService.getStudentProfile(studentId, tenantId);
  }

  async linkABCId(studentId: string, abcId: string, tenantId: string) {
    const res = await this.abcService.linkABCId(studentId, abcId, tenantId);
    await this.auditService.logEvent({
      event: 'ABC_LINK_REQUESTED',
      tenantId,
      studentId,
      provider: 'ABC_PROVIDER',
      entityType: 'ABC_PROFILE',
      entityId: res.id,
      correlationId: `abc-link-${Date.now()}`,
    });
    return res;
  }

  async verifyABCId(studentId: string, tenantId: string) {
    const res = await this.abcService.verifyABCId(studentId, tenantId);
    await this.auditService.logEvent({
      event: 'ABC_VERIFIED',
      tenantId,
      studentId,
      provider: 'ABC_PROVIDER',
      entityType: 'ABC_PROFILE',
      entityId: res.id,
      correlationId: `abc-ver-${Date.now()}`,
      status: res.verificationStatus,
    });
    return res;
  }

  async syncCredits(studentId: string, tenantId: string) {
    return this.syncService.syncStudentCredits(studentId, tenantId);
  }

  async getSyncHistory(studentId: string, tenantId: string) {
    return this.syncService.getSyncHistory(studentId, tenantId);
  }

  // DigiLocker
  async getDigiLockerProfile(studentId: string, tenantId: string) {
    return this.dlService.getProfile(studentId, tenantId);
  }

  async connectDigiLocker(studentId: string, userRef: string, tenantId: string) {
    const res = await this.dlService.connect(studentId, userRef, tenantId);
    await this.auditService.logEvent({
      event: 'DIGILOCKER_CONNECTED',
      tenantId,
      studentId,
      provider: 'DIGILOCKER_PROVIDER',
      entityType: 'DIGILOCKER_PROFILE',
      entityId: res.id,
      correlationId: `dl-con-${Date.now()}`,
    });
    return res;
  }

  async revokeDigiLocker(studentId: string, tenantId: string) {
    const res = await this.dlService.revoke(studentId, tenantId);
    await this.auditService.logEvent({
      event: 'DIGILOCKER_REVOKED',
      tenantId,
      studentId,
      provider: 'DIGILOCKER_PROVIDER',
      entityType: 'DIGILOCKER_PROFILE',
      entityId: res.id,
      correlationId: `dl-rev-${Date.now()}`,
    });
    return res;
  }

  // Credentials
  async listCredentials(studentId: string, tenantId: string) {
    return this.credService.listCredentials(studentId, tenantId);
  }

  async publishCredential(studentId: string, dto: PublishCredentialDto, tenantId: string) {
    const res = await this.credService.publishCredential(studentId, dto, tenantId);
    await this.auditService.logEvent({
      event: res.status === 'PUBLISHED' ? 'CREDENTIAL_PUBLISHED' : 'CREDENTIAL_PUBLISH_FAILED',
      tenantId,
      studentId,
      provider: 'DIGILOCKER_PROVIDER',
      entityType: 'DIGITAL_CREDENTIAL',
      entityId: res.id,
      correlationId: `cred-pub-${Date.now()}`,
      status: res.status,
    });
    return res;
  }
}
