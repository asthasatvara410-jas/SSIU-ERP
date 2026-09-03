import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ── Companies ───────────────────────────────────────────────────────────────

  async createCompany(code: string, name: string, industry: string, contactPerson?: string, email?: string, phone?: string, website?: string) {
    const existing = await this.prisma.placementCompany.findUnique({ where: { companyCode: code.toUpperCase() } });
    if (existing) throw new ConflictException(`Company code '${code}' already exists.`);

    return this.prisma.placementCompany.create({
      data: { companyCode: code.toUpperCase(), name, industry, contactPerson, email, phone, website },
    });
  }

  async getCompanies() {
    return this.prisma.placementCompany.findMany({ orderBy: { name: 'asc' } });
  }

  // ── Placement Drives ─────────────────────────────────────────────────────────

  async createDrive(data: {
    companyId: string;
    jobRole: string;
    packageLpa: number;
    driveDate: string;
    location: string;
    jobDescription: string;
    applicationDeadline: string;
    eligibleMinCgpa?: number;
  }) {
    const driveCode = await this.nextSeq('DRV', () => this.prisma.placementDrive.count());

    return this.prisma.placementDrive.create({
      data: {
        driveCode,
        companyId: data.companyId,
        jobRole: data.jobRole,
        packageLpa: Number(data.packageLpa),
        driveDate: new Date(data.driveDate),
        location: data.location,
        jobDescription: data.jobDescription,
        applicationDeadline: new Date(data.applicationDeadline),
        eligibleMinCgpa: data.eligibleMinCgpa ? Number(data.eligibleMinCgpa) : undefined,
        status: 'SCHEDULED',
      },
      include: { company: true },
    });
  }

  async getDrives(status?: string) {
    return this.prisma.placementDrive.findMany({
      where: { ...(status ? { status: status.toUpperCase() } : {}) },
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: { driveDate: 'asc' },
    });
  }

  async applyToDrive(driveId: string, studentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: studentUserId }, include: { student: true } });
    if (!user?.student) throw new BadRequestException('Only students can apply for placement drives.');

    const drive = await this.prisma.placementDrive.findUnique({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Placement drive not found.');

    if (new Date() > drive.applicationDeadline) {
      throw new BadRequestException('Application deadline has passed.');
    }

    const existing = await this.prisma.placementApplication.findUnique({
      where: { driveId_studentId: { driveId, studentId: user.student.id } },
    });
    if (existing) throw new ConflictException('You have already applied to this drive.');

    return this.prisma.placementApplication.create({
      data: {
        driveId,
        studentId: user.student.id,
        userId: studentUserId,
        status: 'APPLIED',
      },
      include: { drive: { include: { company: true } } },
    });
  }

  async getMyApplications(studentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: studentUserId }, include: { student: true } });
    if (!user?.student) return [];

    return this.prisma.placementApplication.findMany({
      where: { studentId: user.student.id },
      include: { drive: { include: { company: true } } },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async createOffer(driveId: string, studentId: string, packageLpa: number, joiningDate?: string) {
    const offerNo = await this.nextSeq('OFR', () => this.prisma.placementOffer.count());

    return this.prisma.placementOffer.create({
      data: {
        offerNo,
        driveId,
        studentId,
        packageLpa: Number(packageLpa),
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        status: 'OFFERED',
      },
      include: { drive: { include: { company: true } } },
    });
  }

  // ── Training Programs ──────────────────────────────────────────────────────

  async createTraining(code: string, title: string, trainer: string, startDate: string, endDate: string, description?: string) {
    const existing = await this.prisma.trainingProgram.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) throw new ConflictException(`Training program code '${code}' already exists.`);

    return this.prisma.trainingProgram.create({
      data: {
        code: code.toUpperCase(),
        title,
        trainer,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        status: 'SCHEDULED',
      },
    });
  }

  async getTrainings() {
    return this.prisma.trainingProgram.findMany({
      include: { enrollments: { include: { student: true } } },
      orderBy: { startDate: 'asc' },
    });
  }
}
