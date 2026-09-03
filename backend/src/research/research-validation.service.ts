import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DOIValidationService } from './adapters/doi-validation.service';
import { CrossrefValidationService } from './adapters/crossref-validation.service';
import { OpenAlexValidationService } from './adapters/openalex-validation.service';
import { ORCIDValidationService } from './adapters/orcid-validation.service';

@Injectable()
export class ResearchValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doiService: DOIValidationService,
    private readonly crossrefService: CrossrefValidationService,
    private readonly openAlexService: OpenAlexValidationService,
    private readonly orcidService: ORCIDValidationService,
  ) {}

  async validatePublication(publicationId: string, tenantId: string) {
    const pub = await this.prisma.publication.findFirst({
      where: { id: publicationId, tenantId },
    });

    if (!pub) throw new Error('Publication not found.');

    let validationStatus = 'NOT_VERIFIED';
    let matchedFields: string[] = [];
    let mismatchedFields: string[] = [];

    if (pub.doi) {
      const doiRes = await this.doiService.resolveDOI(pub.doi);
      if (doiRes.status === 'VERIFIED') {
        const crRes = await this.crossrefService.validatePublication(pub.doi, pub.title);
        validationStatus = crRes.status === 'MATCH' ? 'VERIFIED' : crRes.status;
        matchedFields = crRes.matchedFields;
        mismatchedFields = crRes.mismatchedFields;
      } else {
        validationStatus = doiRes.status;
      }
    }

    // Update publication
    await this.prisma.publication.update({
      where: { id: publicationId },
      data: { validationStatus },
    });

    // Record validation result
    const result = await this.prisma.researchValidationResult.create({
      data: {
        tenantId,
        entityType: 'PUBLICATION',
        entityId: publicationId,
        provider: 'CROSSREF',
        status: validationStatus,
        matchedFields,
        mismatchedFields,
        publicationId,
      },
    });

    return {
      publicationId,
      validationStatus,
      result,
    };
  }

  async validatePatent(patentId: string, tenantId: string) {
    const pat = await this.prisma.patent.findFirst({
      where: { id: patentId, tenantId },
    });

    if (!pat) throw new Error('Patent not found.');

    const validationStatus = pat.applicationNumber ? 'VERIFIED' : 'NOT_FOUND';

    await this.prisma.patent.update({
      where: { id: patentId },
      data: { validationStatus },
    });

    return { patentId, validationStatus };
  }
}
