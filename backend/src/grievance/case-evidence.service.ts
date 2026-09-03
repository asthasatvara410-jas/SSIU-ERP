import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CaseEvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async attachEvidence(
    caseId: string,
    payload: { documentId?: string; evidenceType?: string; description?: string; uploadedBy: string },
    tenantId: string
  ) {
    const grievanceCase = await this.prisma.grievanceCase.findFirst({
      where: { id: caseId, tenantId },
    });
    if (!grievanceCase) throw new BadRequestException('Grievance case not found.');

    return this.prisma.caseEvidence.create({
      data: {
        tenantId,
        caseId,
        documentId: payload.documentId || null,
        evidenceType: payload.evidenceType || 'DOCUMENT',
        description: payload.description || null,
        uploadedBy: payload.uploadedBy,
        verificationStatus: 'VERIFIED',
      },
    });
  }

  async listEvidence(caseId: string, tenantId: string) {
    return this.prisma.caseEvidence.findMany({
      where: { caseId, tenantId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
