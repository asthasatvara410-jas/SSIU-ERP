import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEdpDutyDto,
  UpdateEdpDutyDto,
  SubmitEdpObservationDto,
  VerifyEdpDutyDto,
  UploadDutyPhotoDto,
  EdpDutyQueryDto,
  EdpDutyStatusEnum,
} from './dto/edp.dto';

@Injectable()
export class EdpService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  private async resolveUserContext(user: any) {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';
    const isPrincipal = roles.includes('PRINCIPAL') || user?.role === 'PRINCIPAL';
    const isDean = roles.includes('DEAN') || user?.role === 'DEAN';
    const isHOD = roles.includes('HOD') || user?.role === 'HOD';
    const isFaculty = roles.includes('FACULTY') || user?.role === 'FACULTY';
    const isEdpOfficer = roles.includes('EDP_OFFICER') || roles.includes('EXAM_CELL') || isFaculty;

    return {
      userId: user.id,
      userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || 'User',
      roles,
      isSuperAdmin,
      isPrincipal,
      isDean,
      isHOD,
      isFaculty,
      isEdpOfficer,
      departmentId: user.departmentId,
      authorityLevel: user.authorityLevel ?? (isSuperAdmin ? 1 : isPrincipal ? 2 : isHOD ? 3 : 5),
    };
  }

  // ── 1. Create Duty ────────────────────────────────────────────────────────

  async createDuty(user: any, dto: CreateEdpDutyDto) {
    const ctx = await this.resolveUserContext(user);
    const dutyNo = this.generateNumber('EDP');

    return this.prisma.$transaction(async (tx) => {
      const duty = await tx.edpDuty.create({
        data: {
          dutyNo,
          departmentId: dto.departmentId,
          subjectId: dto.subjectId,
          subjectName: dto.subjectName,
          classRoom: dto.classRoom,
          batchOrDivision: dto.batchOrDivision,
          teachingFacultyId: dto.teachingFacultyId,
          teachingFacultyName: dto.teachingFacultyName,
          assignedOfficerId: dto.assignedOfficerId,
          dutyDate: new Date(dto.dutyDate),
          startTime: dto.startTime,
          endTime: dto.endTime,
          totalRegisteredStudents: dto.totalRegisteredStudents || 0,
          status: EdpDutyStatusEnum.ASSIGNED,
          remarks: dto.remarks,
        },
        include: {
          department: true,
          assignedOfficer: { select: { id: true, username: true, erpId: true, faculty: { select: { firstName: true, lastName: true, email: true } } } },
          teachingFaculty: true,
        },
      });

      await tx.edpDutyHistory.create({
        data: {
          dutyId: duty.id,
          action: 'CREATED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          toStatus: EdpDutyStatusEnum.ASSIGNED,
          remarks: `EDP Duty ${dutyNo} assigned for classroom inspection`,
        },
      });

      return duty;
    });
  }

  // ── 2. Query Duties with Department & Officer Scope ───────────────────────

  async getDuties(user: any, query?: EdpDutyQueryDto) {
    const ctx = await this.resolveUserContext(user);

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Scoping
    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isDean) {
      if (ctx.departmentId) {
        where.OR = [
          { departmentId: ctx.departmentId },
          { assignedOfficerId: ctx.userId },
          { teachingFacultyId: user.facultyId || user.id },
        ];
      } else {
        where.assignedOfficerId = ctx.userId;
      }
    }

    if (query?.departmentId) where.departmentId = query.departmentId;
    if (query?.assignedOfficerId) where.assignedOfficerId = query.assignedOfficerId;
    if (query?.teachingFacultyId) where.teachingFacultyId = query.teachingFacultyId;
    if (query?.status) where.status = query.status.toUpperCase();
    if (query?.classRoom) where.classRoom = { contains: query.classRoom, mode: 'insensitive' };

    if (query?.startDate || query?.endDate) {
      where.dutyDate = {};
      if (query.startDate) where.dutyDate.gte = new Date(query.startDate);
      if (query.endDate) where.dutyDate.lte = new Date(query.endDate);
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      const searchOR = [
        { dutyNo: { contains: q, mode: 'insensitive' } },
        { subjectName: { contains: q, mode: 'insensitive' } },
        { classRoom: { contains: q, mode: 'insensitive' } },
        { batchOrDivision: { contains: q, mode: 'insensitive' } },
        { teachingFacultyName: { contains: q, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.edpDuty.count({ where }),
      this.prisma.edpDuty.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, code: true } },
          assignedOfficer: { select: { id: true, username: true, erpId: true, faculty: { select: { firstName: true, lastName: true } } } },
          teachingFaculty: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          photos: { select: { id: true, photoUrl: true, caption: true, capturedAt: true } },
          _count: { select: { studentObservations: true, photos: true, history: true } },
        },
        orderBy: [{ dutyDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getDutyById(id: string, user: any) {
    const ctx = await this.resolveUserContext(user);

    const duty = await this.prisma.edpDuty.findUnique({
      where: { id },
      include: {
        department: true,
        assignedOfficer: { select: { id: true, username: true, erpId: true, faculty: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
        teachingFaculty: true,
        photos: { orderBy: { capturedAt: 'asc' } },
        studentObservations: { orderBy: { enrollmentNo: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!duty) throw new NotFoundException('EDP Duty record not found.');

    // Authorization check
    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isDean) {
      const isAssigned = duty.assignedOfficerId === ctx.userId;
      const isDept = ctx.departmentId && duty.departmentId === ctx.departmentId;
      const isFaculty = duty.teachingFacultyId === (user.facultyId || user.id);
      if (!isAssigned && !isDept && !isFaculty) {
        throw new ForbiddenException('Access denied: You are not authorized to inspect this EDP duty record.');
      }
    }

    return duty;
  }

  async updateDuty(id: string, user: any, dto: UpdateEdpDutyDto) {
    const existing = await this.getDutyById(id, user);
    const ctx = await this.resolveUserContext(user);

    const updateData: any = {};
    if (dto.classRoom !== undefined) updateData.classRoom = dto.classRoom;
    if (dto.batchOrDivision !== undefined) updateData.batchOrDivision = dto.batchOrDivision;
    if (dto.assignedOfficerId !== undefined) updateData.assignedOfficerId = dto.assignedOfficerId;
    if (dto.dutyDate) updateData.dutyDate = new Date(dto.dutyDate);
    if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
    if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.edpDuty.update({
        where: { id },
        data: updateData,
        include: { department: true, assignedOfficer: true, teachingFaculty: true },
      });

      await tx.edpDutyHistory.create({
        data: {
          dutyId: id,
          action: 'UPDATED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: updated.status,
          remarks: dto.remarks || 'Duty parameters updated',
        },
      });

      return updated;
    });
  }

  async deleteDuty(id: string, user: any) {
    await this.getDutyById(id, user);
    return this.prisma.edpDuty.delete({ where: { id } });
  }

  // ── 3. Duty Execution, Observation & Photo Logging ────────────────────────

  async startDuty(id: string, user: any) {
    const existing = await this.getDutyById(id, user);
    const ctx = await this.resolveUserContext(user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.edpDuty.update({
        where: { id },
        data: { status: EdpDutyStatusEnum.IN_PROGRESS },
      });

      await tx.edpDutyHistory.create({
        data: {
          dutyId: id,
          action: 'STARTED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: EdpDutyStatusEnum.IN_PROGRESS,
          remarks: 'EDP officer commenced classroom inspection',
        },
      });

      return updated;
    });
  }

  async submitObservation(id: string, user: any, dto: SubmitEdpObservationDto) {
    const existing = await this.getDutyById(id, user);
    const ctx = await this.resolveUserContext(user);

    const totalStudents = existing.totalRegisteredStudents || (dto.presentStudentCount + (dto.absentStudentCount || 0));
    const absentCount = dto.absentStudentCount ?? Math.max(0, totalStudents - dto.presentStudentCount);
    const attendancePct = totalStudents > 0 ? Number(((dto.presentStudentCount / totalStudents) * 100).toFixed(2)) : 0;

    return this.prisma.$transaction(async (tx) => {
      // 1. Bulk insert student observations if provided
      if (dto.studentObservations && dto.studentObservations.length > 0) {
        // Delete previous student observations if resubmitting
        await tx.edpDutyStudentObservation.deleteMany({ where: { dutyId: id } });

        await tx.edpDutyStudentObservation.createMany({
          data: dto.studentObservations.map((obs) => ({
            dutyId: id,
            studentId: obs.studentId,
            enrollmentNo: obs.enrollmentNo,
            studentName: obs.studentName,
            attendanceStatus: obs.attendanceStatus || 'PRESENT',
            observationRemarks: obs.observationRemarks,
          })),
        });
      }

      // 2. Insert photos if provided
      if (dto.photos && dto.photos.length > 0) {
        await tx.edpDutyPhoto.createMany({
          data: dto.photos.map((p) => ({
            dutyId: id,
            photoUrl: p.photoUrl,
            caption: p.caption,
            uploadedByUserId: ctx.userId,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
        });
      }

      // 3. Update Duty Record
      const updated = await tx.edpDuty.update({
        where: { id },
        data: {
          presentStudentCount: dto.presentStudentCount,
          absentStudentCount: absentCount,
          totalRegisteredStudents: totalStudents,
          studentAttendancePercentage: attendancePct,
          lectureTopic: dto.lectureTopic,
          teachingMethodology: dto.teachingMethodology,
          classroomEnvironment: dto.classroomEnvironment,
          observations: dto.observations,
          remarks: dto.remarks || existing.remarks,
          status: EdpDutyStatusEnum.SUBMITTED,
        },
        include: {
          department: true,
          assignedOfficer: true,
          teachingFaculty: true,
          photos: true,
          studentObservations: true,
        },
      });

      // 4. Record Audit History
      await tx.edpDutyHistory.create({
        data: {
          dutyId: id,
          action: 'INSPECTION_SUBMITTED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: EdpDutyStatusEnum.SUBMITTED,
          remarks: `Inspection report submitted with ${dto.presentStudentCount}/${totalStudents} students present (${attendancePct}%)`,
        },
      });

      return updated;
    });
  }

  async verifyDuty(id: string, user: any, dto?: VerifyEdpDutyDto) {
    const existing = await this.getDutyById(id, user);
    const ctx = await this.resolveUserContext(user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.edpDuty.update({
        where: { id },
        data: {
          status: EdpDutyStatusEnum.VERIFIED,
          verifiedByUserId: ctx.userId,
          verifiedAt: new Date(),
          remarks: dto?.comments || existing.remarks,
        },
        include: { department: true, assignedOfficer: true, teachingFaculty: true, photos: true, studentObservations: true },
      });

      await tx.edpDutyHistory.create({
        data: {
          dutyId: id,
          action: 'VERIFIED',
          performedByUserId: ctx.userId,
          performedByName: ctx.userName,
          fromStatus: existing.status,
          toStatus: EdpDutyStatusEnum.VERIFIED,
          remarks: dto?.comments || 'EDP duty inspection verified by supervisor',
        },
      });

      return updated;
    });
  }

  // ── 4. Photo Management ───────────────────────────────────────────────────

  async uploadDutyPhoto(dutyId: string, user: any, dto: UploadDutyPhotoDto) {
    await this.getDutyById(dutyId, user);
    const ctx = await this.resolveUserContext(user);

    return this.prisma.edpDutyPhoto.create({
      data: {
        dutyId,
        photoUrl: dto.photoUrl,
        caption: dto.caption,
        uploadedByUserId: ctx.userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        capturedAt: new Date(),
      },
    });
  }

  async deleteDutyPhoto(photoId: string, user: any) {
    const photo = await this.prisma.edpDutyPhoto.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('EDP duty photo not found.');
    await this.getDutyById(photo.dutyId, user);

    return this.prisma.edpDutyPhoto.delete({ where: { id: photoId } });
  }

  // ── 5. Reports & Analytics ────────────────────────────────────────────────

  async getEdpDashboardMetrics(user: any) {
    const ctx = await this.resolveUserContext(user);
    const where: any = {};

    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isDean) {
      if (ctx.departmentId) {
        where.OR = [
          { departmentId: ctx.departmentId },
          { assignedOfficerId: ctx.userId },
        ];
      } else {
        where.assignedOfficerId = ctx.userId;
      }
    }

    const [totalDuties, assigned, inProgress, submitted, verified] = await Promise.all([
      this.prisma.edpDuty.count({ where }),
      this.prisma.edpDuty.count({ where: { ...where, status: EdpDutyStatusEnum.ASSIGNED } }),
      this.prisma.edpDuty.count({ where: { ...where, status: EdpDutyStatusEnum.IN_PROGRESS } }),
      this.prisma.edpDuty.count({ where: { ...where, status: EdpDutyStatusEnum.SUBMITTED } }),
      this.prisma.edpDuty.count({ where: { ...where, status: EdpDutyStatusEnum.VERIFIED } }),
    ]);

    const dutiesWithAttendance = await this.prisma.edpDuty.findMany({
      where: { ...where, status: { in: ['SUBMITTED', 'VERIFIED', 'COMPLETED'] } },
      select: { studentAttendancePercentage: true },
    });

    const avgAttendance = dutiesWithAttendance.length > 0
      ? Number(
          (
            dutiesWithAttendance.reduce((acc, d) => acc + Number(d.studentAttendancePercentage || 0), 0) /
            dutiesWithAttendance.length
          ).toFixed(2)
        )
      : 0;

    return {
      totalDuties,
      assigned,
      inProgress,
      submitted,
      verified,
      completedOrVerified: submitted + verified,
      averageAttendancePercentage: avgAttendance,
    };
  }

  async getDateWiseReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.dutyDate = {};
      if (startDate) where.dutyDate.gte = new Date(startDate);
      if (endDate) where.dutyDate.lte = new Date(endDate);
    }

    const duties = await this.prisma.edpDuty.findMany({
      where,
      include: { department: true, assignedOfficer: true, teachingFaculty: true },
      orderBy: { dutyDate: 'asc' },
    });

    const dateMap = new Map<string, any>();
    for (const d of duties) {
      const dateKey = d.dutyDate.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          totalDuties: 0,
          verifiedDuties: 0,
          totalPresent: 0,
          totalRegistered: 0,
        });
      }
      const item = dateMap.get(dateKey);
      item.totalDuties++;
      if (d.status === 'VERIFIED' || d.status === 'SUBMITTED') item.verifiedDuties++;
      item.totalPresent += d.presentStudentCount;
      item.totalRegistered += d.totalRegisteredStudents;
    }

    return Array.from(dateMap.values()).map((item) => ({
      ...item,
      attendancePercentage: item.totalRegistered > 0 ? Number(((item.totalPresent / item.totalRegistered) * 100).toFixed(2)) : 0,
    }));
  }

  async getDepartmentWiseReport() {
    const departments = await this.prisma.department.findMany({
      include: {
        edpDuties: {
          select: {
            status: true,
            presentStudentCount: true,
            totalRegisteredStudents: true,
            studentAttendancePercentage: true,
          },
        },
      },
    });

    return departments.map((dept) => {
      const duties = dept.edpDuties;
      const totalDuties = duties.length;
      const verified = duties.filter((d) => d.status === 'VERIFIED' || d.status === 'SUBMITTED').length;
      const totalPresent = duties.reduce((acc, d) => acc + d.presentStudentCount, 0);
      const totalRegistered = duties.reduce((acc, d) => acc + d.totalRegisteredStudents, 0);

      return {
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
        totalDuties,
        verifiedDuties: verified,
        pendingDuties: totalDuties - verified,
        averageAttendance: totalRegistered > 0 ? Number(((totalPresent / totalRegistered) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getFacultyWiseReport() {
    const faculties = await this.prisma.faculty.findMany({
      include: {
        department: true,
        edpDutiesObserved: {
          select: {
            dutyDate: true,
            status: true,
            presentStudentCount: true,
            totalRegisteredStudents: true,
            studentAttendancePercentage: true,
            classroomEnvironment: true,
          },
        },
      },
    });

    return faculties.map((fac) => {
      const duties = fac.edpDutiesObserved;
      const totalInspections = duties.length;
      const totalPresent = duties.reduce((acc, d) => acc + d.presentStudentCount, 0);
      const totalRegistered = duties.reduce((acc, d) => acc + d.totalRegisteredStudents, 0);

      return {
        facultyId: fac.id,
        facultyName: `${fac.firstName} ${fac.lastName}`.trim(),
        employeeCode: fac.employeeCode,
        departmentName: fac.department?.name,
        totalInspections,
        averageAttendancePercentage: totalRegistered > 0 ? Number(((totalPresent / totalRegistered) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getClassWiseReport() {
    const duties = await this.prisma.edpDuty.findMany({
      select: {
        classRoom: true,
        batchOrDivision: true,
        presentStudentCount: true,
        totalRegisteredStudents: true,
      },
    });

    const classMap = new Map<string, any>();
    for (const d of duties) {
      const key = d.classRoom || 'Unknown';
      if (!classMap.has(key)) {
        classMap.set(key, {
          classRoom: key,
          inspectionsCount: 0,
          totalPresent: 0,
          totalRegistered: 0,
        });
      }
      const item = classMap.get(key);
      item.inspectionsCount++;
      item.totalPresent += d.presentStudentCount;
      item.totalRegistered += d.totalRegisteredStudents;
    }

    return Array.from(classMap.values()).map((item) => ({
      ...item,
      avgAttendance: item.totalRegistered > 0 ? Number(((item.totalPresent / item.totalRegistered) * 100).toFixed(2)) : 0,
    }));
  }

  async getStudentWiseReport(enrollmentNo?: string) {
    return this.prisma.edpDutyStudentObservation.findMany({
      where: {
        ...(enrollmentNo ? { enrollmentNo: { contains: enrollmentNo, mode: 'insensitive' } } : {}),
      },
      include: {
        duty: {
          select: {
            dutyNo: true,
            dutyDate: true,
            subjectName: true,
            classRoom: true,
            teachingFacultyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
