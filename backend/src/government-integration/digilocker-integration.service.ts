import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DigiLockerProviderAdapter } from './adapters/digilocker-provider.adapter';

@Injectable()
export class DigiLockerIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dlAdapter: DigiLockerProviderAdapter,
  ) {}

  async getProfile(studentId: string, tenantId: string) {
    const profile = await this.prisma.digiLockerProfile.findFirst({
      where: { studentId, tenantId },
    });

    if (!profile) {
      return {
        studentId,
        connectionStatus: 'NOT_CONNECTED',
        linkedAt: null,
        lastSyncedAt: null,
      };
    }

    return profile;
  }

  async connect(studentId: string, providerUserReference: string, tenantId: string) {
    if (!providerUserReference) {
      throw new BadRequestException('DigiLocker user reference is required.');
    }

    const existing = await this.prisma.digiLockerProfile.findFirst({
      where: { studentId, tenantId },
    });

    if (existing) {
      return this.prisma.digiLockerProfile.update({
        where: { id: existing.id },
        data: {
          providerUserReference,
          connectionStatus: 'CONNECTED',
          linkedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });
    }

    return this.prisma.digiLockerProfile.create({
      data: {
        tenantId,
        studentId,
        providerUserReference,
        connectionStatus: 'CONNECTED',
        linkedAt: new Date(),
        lastSyncedAt: new Date(),
      },
    });
  }

  async revoke(studentId: string, tenantId: string) {
    const profile = await this.prisma.digiLockerProfile.findFirst({
      where: { studentId, tenantId },
    });

    if (!profile) {
      throw new BadRequestException('DigiLocker account is not connected.');
    }

    return this.prisma.digiLockerProfile.update({
      where: { id: profile.id },
      data: {
        connectionStatus: 'REVOKED',
        providerUserReference: null,
      },
    });
  }
}
