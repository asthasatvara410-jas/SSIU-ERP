import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlumniService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(data: {
    studentId: string;
    graduationYear: number;
    currentCompany?: string;
    designation?: string;
    industry?: string;
    city?: string;
    linkedinUrl?: string;
    isMentor?: boolean;
  }) {
    const existing = await this.prisma.alumniProfile.findUnique({ where: { studentId: data.studentId } });
    if (existing) throw new ConflictException('Alumni profile already exists for this student.');

    return this.prisma.alumniProfile.create({
      data: {
        studentId: data.studentId,
        graduationYear: data.graduationYear,
        currentCompany: data.currentCompany,
        designation: data.designation,
        industry: data.industry,
        city: data.city,
        linkedinUrl: data.linkedinUrl,
        isMentor: data.isMentor || false,
        status: 'ACTIVE',
      },
      include: { student: true },
    });
  }

  async getProfiles(graduationYear?: number, industry?: string, search?: string) {
    return this.prisma.alumniProfile.findMany({
      where: {
        ...(graduationYear ? { graduationYear } : {}),
        ...(industry ? { industry } : {}),
        ...(search
          ? {
              OR: [
                { currentCompany: { contains: search, mode: 'insensitive' } },
                { designation: { contains: search, mode: 'insensitive' } },
                { student: { firstName: { contains: search, mode: 'insensitive' } } },
                { student: { lastName: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { student: { include: { institute: true, department: true } } },
      orderBy: { graduationYear: 'desc' },
    });
  }
}
