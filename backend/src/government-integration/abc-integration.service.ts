import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ABCProviderAdapter } from './adapters/abc-provider.adapter';

@Injectable()
export class ABCIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abcAdapter: ABCProviderAdapter,
  ) {}

  async getStudentProfile(studentId: string, tenantId: string) {
    let profile = await this.prisma.studentABCProfile.findFirst({
      where: { studentId, tenantId },
    });

    if (!profile) {
      return {
        studentId,
        abcId: null,
        verificationStatus: 'UNVERIFIED',
        syncStatus: 'NOT_SYNCED',
        lastSyncedAt: null,
      };
    }

    return profile;
  }

  async linkABCId(studentId: string, abcId: string, tenantId: string) {
    const cleaned = abcId.replace(/\s+/g, '').trim();
    if (!/^\d{12}$/.test(cleaned)) {
      throw new BadRequestException('Invalid ABC ID. Official APAAR / ABC ID must be a 12-digit numeric identifier.');
    }

    // Record explicit consent
    await this.prisma.aBCConsent.create({
      data: {
        tenantId,
        studentId,
        consentType: 'ACADEMIC_CREDIT_SYNC',
        status: 'GRANTED',
        consentVersion: 'v2.0',
        source: 'STUDENT_PORTAL',
      },
    });

    const existing = await this.prisma.studentABCProfile.findFirst({
      where: { studentId, tenantId },
    });

    if (existing) {
      return this.prisma.studentABCProfile.update({
        where: { id: existing.id },
        data: {
          abcId: cleaned,
          verificationStatus: 'PENDING',
          syncStatus: 'PENDING',
          provider: this.abcAdapter.getProviderName(),
        },
      });
    }

    return this.prisma.studentABCProfile.create({
      data: {
        tenantId,
        studentId,
        abcId: cleaned,
        verificationStatus: 'PENDING',
        syncStatus: 'PENDING',
        provider: this.abcAdapter.getProviderName(),
      },
    });
  }

  async verifyABCId(studentId: string, tenantId: string) {
    const profile = await this.prisma.studentABCProfile.findFirst({
      where: { studentId, tenantId },
    });
    if (!profile || !profile.abcId) {
      throw new BadRequestException('No linked ABC ID found for verification.');
    }

    const res = await this.abcAdapter.getStudentProfile(profile.abcId);
    const verificationStatus = res.success ? 'VERIFIED' : 'REJECTED';

    return this.prisma.studentABCProfile.update({
      where: { id: profile.id },
      data: { verificationStatus },
    });
  }
}
