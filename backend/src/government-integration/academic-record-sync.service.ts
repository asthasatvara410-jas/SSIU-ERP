import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ABCProviderAdapter } from './adapters/abc-provider.adapter';

@Injectable()
export class AcademicRecordSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abcAdapter: ABCProviderAdapter,
  ) {}

  async syncStudentCredits(studentId: string, tenantId: string) {
    const profile = await this.prisma.studentABCProfile.findFirst({
      where: { studentId, tenantId },
    });

    if (!profile || !profile.abcId) {
      throw new BadRequestException('Student must link a valid ABC ID before syncing academic credits.');
    }

    // Retrieve verified academic credit records
    const credits = await this.prisma.academicCreditRecord.findMany({
      where: { studentId, tenantId },
    });

    const res = await this.abcAdapter.syncAcademicCredits({
      studentId,
      abcId: profile.abcId,
      credits,
    });

    const syncStatus = res.success ? 'SYNCED' : 'FAILED';
    const correlationId = `gov-sync-${Date.now()}`;

    // Record sync log
    await this.prisma.governmentSyncLog.create({
      data: {
        tenantId,
        studentId,
        provider: this.abcAdapter.getProviderName(),
        operation: 'CREDIT_SYNC',
        status: res.success ? 'SUCCESS' : 'FAILED',
        providerReference: res.providerReference || null,
        correlationId,
        completedAt: new Date(),
        errorMessage: res.error || null,
      },
    });

    // Update profile
    await this.prisma.studentABCProfile.update({
      where: { id: profile.id },
      data: {
        syncStatus,
        lastSyncedAt: new Date(),
      },
    });

    return {
      success: res.success,
      syncStatus,
      providerReference: res.providerReference,
      correlationId,
      syncedCreditsCount: credits.length,
    };
  }

  async getSyncHistory(studentId: string, tenantId: string) {
    return this.prisma.governmentSyncLog.findMany({
      where: { studentId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
