import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncubationService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ── Incubation Centers & Startups ──────────────────────────────────────────

  async createCenter(code: string, name: string, location?: string, capacity: number = 20) {
    const existing = await this.prisma.incubationCenter.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) throw new ConflictException(`Center '${code}' already exists.`);

    return this.prisma.incubationCenter.create({
      data: { code: code.toUpperCase(), name, location, capacity },
    });
  }

  async getCenters() {
    return this.prisma.incubationCenter.findMany({
      include: { startups: true, _count: { select: { startups: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async registerStartup(data: {
    name: string;
    category: string;
    stage?: string;
    incubationCenterId: string;
    studentUserId?: string;
    workspaceNo?: string;
  }) {
    const startupCode = await this.nextSeq('STR', () => this.prisma.startup.count());

    let studentId: string | undefined = undefined;
    if (data.studentUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.studentUserId }, include: { student: true } });
      if (user?.student) studentId = user.student.id;
    }

    return this.prisma.startup.create({
      data: {
        startupCode,
        name: data.name,
        category: data.category,
        stage: data.stage || 'IDEATION',
        incubationCenterId: data.incubationCenterId,
        workspaceNo: data.workspaceNo,
        ...(studentId
          ? {
              members: {
                create: { studentId, role: 'FOUNDER' },
              },
            }
          : {}),
      },
      include: { incubationCenter: true, members: { include: { student: true } }, mentors: { include: { faculty: true } } },
    });
  }

  async getStartups(stage?: string, studentUserId?: string) {
    let studentId: string | undefined = undefined;
    if (studentUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: studentUserId }, include: { student: true } });
      if (user?.student) studentId = user.student.id;
    }

    return this.prisma.startup.findMany({
      where: {
        ...(stage ? { stage: stage.toUpperCase() } : {}),
        ...(studentId ? { members: { some: { studentId } } } : {}),
      },
      include: {
        incubationCenter: true,
        members: { include: { student: true } },
        mentors: { include: { faculty: true } },
        milestones: true,
      },
      orderBy: { registrationDate: 'desc' },
    });
  }

  async addMilestone(startupId: string, title: string, dueDate: string) {
    const startup = await this.prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) throw new NotFoundException('Startup not found.');

    return this.prisma.startupMilestone.create({
      data: {
        startupId,
        title,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
    });
  }

  async assignMentor(startupId: string, facultyId: string) {
    const [startup, faculty] = await Promise.all([
      this.prisma.startup.findUnique({ where: { id: startupId } }),
      this.prisma.faculty.findUnique({ where: { id: facultyId } }),
    ]);
    if (!startup) throw new NotFoundException('Startup not found.');
    if (!faculty) throw new NotFoundException('Faculty mentor not found.');

    return this.prisma.startupMentor.create({
      data: { startupId, facultyId },
      include: { faculty: true },
    });
  }
}
