import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/grievance.dto';

@Injectable()
export class AnonymousComplaintService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a case number and cryptographically random tracking token.
   */
  generateCaseIdentifiers(): { caseNumber: string; trackingToken: string } {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const caseNumber = `GRV-${year}-${randomHex}`;
    const trackingToken = crypto.randomBytes(16).toString('hex');
    return { caseNumber, trackingToken };
  }

  /**
   * Strips HTML and dangerous tags to prevent XSS / malicious input payloads.
   */
  private sanitize(input?: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Validates attachments for safe formats, file sizes, and path traversal protection.
   */
  private validateAttachment(name?: string, size?: number, type?: string) {
    if (!name) return;
    const lower = name.toLowerCase();
    const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.php', '.phtml', '.bin', '.dll', '.msi'];
    if (dangerousExts.some(ext => lower.endsWith(ext))) {
      throw new BadRequestException('Executable or script files are strictly prohibited.');
    }
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new BadRequestException('Invalid attachment filename (path traversal detected).');
    }
    if (size && size > 10 * 1024 * 1024) {
      throw new BadRequestException('Attachment file size exceeds 10MB maximum limit.');
    }
  }

  /**
   * Creates a complaint while preserving strict anonymity if requested.
   */
  async createComplaint(dto: CreateComplaintDto, tenantId: string, studentId?: string) {
    const { caseNumber, trackingToken } = this.generateCaseIdentifiers();
    const isAnonymous = dto.type === 'ANONYMOUS';

    // Validate attachment if provided
    if (dto.attachmentName || dto.attachmentSize) {
      this.validateAttachment(dto.attachmentName, dto.attachmentSize, dto.attachmentType);
    }

    // Sanitize input text
    const sanitizedSubject = this.sanitize(dto.subject);
    let sanitizedDescription = this.sanitize(dto.description);
    const sanitizedLocation = this.sanitize(dto.incidentLocation);

    if (!sanitizedSubject || !sanitizedDescription) {
      throw new BadRequestException('Subject and description must contain valid non-empty content.');
    }

    // If anonymous submitter explicitly opted to provide contact information for follow-up
    if (isAnonymous && (dto.optionalContactEmail || dto.optionalContactPhone)) {
      const contactInfo = [];
      if (dto.optionalContactEmail) contactInfo.push(`Email: ${this.sanitize(dto.optionalContactEmail)}`);
      if (dto.optionalContactPhone) contactInfo.push(`Phone: ${this.sanitize(dto.optionalContactPhone)}`);
      sanitizedDescription += `\n\n[Submitter Provided Contact for Follow-Up: ${contactInfo.join(', ')}]`;
    }

    if (dto.department) {
      sanitizedDescription += `\n[Department/Unit Context: ${this.sanitize(dto.department)}]`;
    }
    if (dto.instituteContext) {
      sanitizedDescription += `\n[Institute Context: ${this.sanitize(dto.instituteContext)}]`;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7); // Default 7 working days SLA

    const grievanceCase = await this.prisma.grievanceCase.create({
      data: {
        tenantId,
        caseNumber,
        trackingToken,
        category: dto.category,
        type: dto.type,
        subject: sanitizedSubject,
        description: sanitizedDescription,
        status: 'SUBMITTED',
        priority: dto.priority || 'MEDIUM',
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : null,
        incidentLocation: sanitizedLocation || null,
        escalationDeadline: deadline,
      },
    });

    // Record separate secure identity ONLY if NOT anonymous and student was authenticated
    if (!isAnonymous && studentId) {
      await this.prisma.grievanceComplainantIdentity.create({
        data: {
          tenantId,
          caseId: grievanceCase.id,
          studentId,
          identityVisibility: 'DISCLOSED_WITH_PERMISSION',
        },
      });
    }

    // Record evidence if document or attachment provided
    if (dto.documentId || dto.attachmentName || dto.attachmentUrl) {
      await this.prisma.grievanceEvidence.create({
        data: {
          tenantId,
          caseId: grievanceCase.id,
          documentId: dto.documentId || null,
          fileUrl: dto.attachmentUrl || null,
          uploadedBy: isAnonymous ? 'ANONYMOUS_SUBMITTER' : (studentId || 'STUDENT'),
          description: dto.attachmentName || 'Supporting Evidence Document',
          fileType: dto.attachmentType || 'PDF',
        },
      });
    }

    // Attach initial timeline event
    await this.prisma.grievanceCaseEvent.create({
      data: {
        tenantId,
        caseId: grievanceCase.id,
        eventType: 'SUBMITTED',
        title: 'Complaint Registered',
        details: isAnonymous ? 'Complaint submitted anonymously.' : 'Complaint registered with student identity.',
      },
    });

    return {
      id: grievanceCase.id,
      caseNumber: grievanceCase.caseNumber,
      trackingToken: isAnonymous ? trackingToken : undefined,
      status: grievanceCase.status,
      category: grievanceCase.category,
      createdAt: grievanceCase.createdAt,
      message: isAnonymous
        ? 'Anonymous complaint successfully registered. Please save your Tracking Token to track progress.'
        : 'Complaint successfully registered. You can track this under My Grievances.',
    };
  }

  /**
   * Anonymous status tracking via Case Number and Tracking Token (zero auth required).
   */
  async trackAnonymous(caseNumber: string, trackingToken: string, tenantId?: string) {
    if (!caseNumber || !trackingToken) {
      throw new BadRequestException('Case Number and Tracking Token are required.');
    }

    const grievanceCase = await this.prisma.grievanceCase.findFirst({
      where: {
        caseNumber: caseNumber.trim(),
        trackingToken: trackingToken.trim(),
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        timelineEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!grievanceCase) {
      throw new BadRequestException('Invalid Case Number or Tracking Token.');
    }

    // Return sanitized public status
    return {
      caseNumber: grievanceCase.caseNumber,
      category: grievanceCase.category,
      type: grievanceCase.type,
      subject: grievanceCase.subject,
      status: grievanceCase.status,
      priority: grievanceCase.priority,
      resolutionSummary: grievanceCase.resolutionSummary,
      createdAt: grievanceCase.createdAt,
      timeline: grievanceCase.timelineEvents.map(e => ({
        eventType: e.eventType,
        title: e.title,
        details: e.details,
        createdAt: e.createdAt,
      })),
    };
  }
}
