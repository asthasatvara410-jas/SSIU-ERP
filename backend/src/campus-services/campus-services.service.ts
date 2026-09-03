import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampusServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string, countFn: () => Promise<number>): Promise<string> {
    const count = await countFn();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${seq}`;
  }

  async createRequest(userId: string, serviceType: string, location: string, description: string, priority: string = 'NORMAL') {
    const requestNo = await this.nextSeq('CSR', () => this.prisma.campusServiceRequest.count());

    return this.prisma.campusServiceRequest.create({
      data: {
        requestNo,
        userId,
        serviceType: serviceType.toUpperCase(),
        location,
        description,
        priority: priority.toUpperCase(),
        status: 'PENDING',
      },
      include: { user: true },
    });
  }

  async getRequests(serviceType?: string, status?: string, userId?: string) {
    return this.prisma.campusServiceRequest.findMany({
      where: {
        ...(serviceType ? { serviceType: serviceType.toUpperCase() } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(userId ? { userId } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, assignedTo?: string) {
    const req = await this.prisma.campusServiceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Campus service request not found.');

    return this.prisma.campusServiceRequest.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        ...(assignedTo ? { assignedTo } : {}),
        ...(status.toUpperCase() === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
  }
}
