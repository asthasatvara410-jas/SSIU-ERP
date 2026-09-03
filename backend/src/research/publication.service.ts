import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicationDto } from './dto/research.dto';

@Injectable()
export class PublicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createPublication(dto: CreatePublicationDto, tenantId: string, createdBy: string) {
    // Check duplicate DOI
    let duplicateStatus = 'UNIQUE';
    if (dto.doi) {
      const existing = await this.prisma.publication.findFirst({
        where: { doi: dto.doi, tenantId },
      });
      if (existing) {
        duplicateStatus = 'DUPLICATE_CONFIRMED';
      }
    }

    const publication = await this.prisma.publication.create({
      data: {
        tenantId,
        title: dto.title,
        abstract: dto.abstract || null,
        authors: dto.authors,
        journalName: dto.journalName || null,
        publicationType: dto.publicationType || 'JOURNAL_ARTICLE',
        year: dto.year || new Date().getFullYear(),
        doi: dto.doi || null,
        issn: dto.issn || null,
        isbn: dto.isbn || null,
        url: dto.url || null,
        indexing: dto.indexing || 'SCOPUS',
        validationStatus: 'NOT_VERIFIED',
        approvalStatus: 'SUBMITTED',
        duplicateStatus,
        createdBy,
      },
    });

    // Create author records
    if (dto.authorList && dto.authorList.length > 0) {
      for (let i = 0; i < dto.authorList.length; i++) {
        const a = dto.authorList[i];
        await this.prisma.researchAuthor.create({
          data: {
            tenantId,
            publicationId: publication.id,
            userId: a.userId || null,
            studentId: a.studentId || null,
            authorNameSnapshot: a.name,
            authorOrder: a.order || (i + 1),
            correspondingAuthor: Boolean(a.correspondingAuthor),
            affiliation: a.affiliation || 'Swarrnim Startup & Innovation University',
            orcidId: a.orcidId || null,
          },
        });
      }
    }

    return publication;
  }

  async listPublications(tenantId: string, type?: string, approvalStatus?: string) {
    return this.prisma.publication.findMany({
      where: {
        tenantId,
        ...(type ? { publicationType: type } : {}),
        ...(approvalStatus ? { approvalStatus } : {}),
      },
      include: {
        authorRecords: { orderBy: { authorOrder: 'asc' } },
        evidences: true,
        validationResults: { orderBy: { checkedAt: 'desc' } },
        approvalActions: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicationDetails(id: string, tenantId: string) {
    const pub = await this.prisma.publication.findFirst({
      where: { id, tenantId },
      include: {
        authorRecords: { orderBy: { authorOrder: 'asc' } },
        evidences: true,
        validationResults: { orderBy: { checkedAt: 'desc' } },
        approvalActions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!pub) throw new BadRequestException(`Publication ${id} not found.`);
    return pub;
  }
}
