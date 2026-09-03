import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DigiLockerProviderAdapter } from './adapters/digilocker-provider.adapter';
import { PublishCredentialDto } from './dto/government-integration.dto';

@Injectable()
export class CredentialIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dlAdapter: DigiLockerProviderAdapter,
  ) {}

  async listCredentials(studentId: string, tenantId: string) {
    return this.prisma.digitalCredential.findMany({
      where: { studentId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async publishCredential(studentId: string, dto: PublishCredentialDto, tenantId: string) {
    const res = await this.dlAdapter.publishCredential({
      studentId,
      credentialType: dto.credentialType,
      credentialNumber: dto.credentialNumber,
      documentId: dto.documentId,
    });

    const status = res.success ? 'PUBLISHED' : 'FAILED';
    const providerReference = res.providerReference || null;

    return this.prisma.digitalCredential.create({
      data: {
        tenantId,
        studentId,
        credentialType: dto.credentialType,
        credentialNumber: dto.credentialNumber,
        documentId: dto.documentId,
        provider: this.dlAdapter.getProviderName(),
        providerReference,
        status,
        publishedAt: res.success ? new Date() : null,
      },
    });
  }

  async revokeCredential(id: string, tenantId: string) {
    const cred = await this.prisma.digitalCredential.findFirst({
      where: { id, tenantId },
    });
    if (!cred) throw new BadRequestException('Credential not found.');

    await this.dlAdapter.revokeCredential(cred.credentialNumber);

    return this.prisma.digitalCredential.update({
      where: { id: cred.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }
}
