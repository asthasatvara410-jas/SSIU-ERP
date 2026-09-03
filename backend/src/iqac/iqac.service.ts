import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IqacService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  // ── IQAC Activities ────────────────────────────────────────────────────────

  async createActivity(data: { title: string; category: string; academicYear: string; description?: string; targetDate: string }) {
    return this.prisma.iQACActivity.create({
      data: {
        title: data.title,
        category: data.category.toUpperCase(),
        academicYear: data.academicYear,
        description: data.description,
        targetDate: new Date(data.targetDate),
        status: 'PLANNED',
      },
    });
  }

  async getActivities(academicYear?: string, category?: string) {
    return this.prisma.iQACActivity.findMany({
      where: {
        ...(academicYear ? { academicYear } : {}),
        ...(category ? { category: category.toUpperCase() } : {}),
      },
      include: { meetings: true },
      orderBy: { targetDate: 'asc' },
    });
  }

  // ── IQAC Meetings ──────────────────────────────────────────────────────────

  async createMeeting(data: { activityId?: string; meetingDate: string; venue?: string; agenda: string; minutes?: string }) {
    const meetingNo = await this.nextSeq('IQAC-M', () => this.prisma.iQACMeeting.count());

    return this.prisma.iQACMeeting.create({
      data: {
        meetingNo,
        activityId: data.activityId,
        meetingDate: new Date(data.meetingDate),
        venue: data.venue,
        agenda: data.agenda,
        minutes: data.minutes,
        status: 'SCHEDULED',
      },
      include: { activity: true, actionItems: true },
    });
  }

  async getMeetings(activityId?: string) {
    return this.prisma.iQACMeeting.findMany({
      where: { ...(activityId ? { activityId } : {}) },
      include: { activity: true, actionItems: true },
      orderBy: { meetingDate: 'desc' },
    });
  }

  // ── Action Items ────────────────────────────────────────────────────────────

  async addActionItem(meetingId: string, title: string, assignedTo: string, dueDate: string) {
    const meeting = await this.prisma.iQACMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('IQAC Meeting not found.');

    return this.prisma.iQACActionItem.create({
      data: {
        meetingId,
        title,
        assignedTo,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
    });
  }

  async getActionItems(meetingId?: string) {
    return this.prisma.iQACActionItem.findMany({
      where: { ...(meetingId ? { meetingId } : {}) },
      include: { meeting: true },
      orderBy: { dueDate: 'asc' },
    });
  }
}
