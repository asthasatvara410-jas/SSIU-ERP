import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFeeHeadDto,
  UpdateFeeHeadDto,
  UpdateFeeHeadStatusDto,
  FeeHeadQueryDto,
  FeeCategoryEnum,
  FeeFrequencyEnum,
  FeeStructureStatusEnum,
  FeeAccountStatusEnum,
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  DuplicateFeeStructureDto,
  FeeStructureQueryDto,
  AddFeeStructureItemDto,
  UpdateFeeStructureItemDto,
  AssignFeeStructureDto,
  EligibleStudentsQueryDto,
  StudentFeeAccountQueryDto,
  CreateStudentFeeAccountDto,
  RecordPaymentDto,
  ApplyDiscountDto,
  CreateRefundDto,
  FeeInvoiceStatusEnum,
  GenerateFeeInvoiceDto,
  UpdateFeeInvoiceDto,
  CancelFeeInvoiceDto,
  FeeInvoiceQueryDto,
} from './dto/fees.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Fee Heads (Phase 1 — University Fee Head Master) ───────────────────────────

  async createFeeHead(dto: CreateFeeHeadDto, user?: any) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.feeHead.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Fee head code '${code}' already exists.`);

    const isMandatory = dto.isMandatory !== undefined ? dto.isMandatory : !dto.isOptional;
    const isOptional = dto.isOptional !== undefined ? dto.isOptional : !isMandatory;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.status !== 'INACTIVE';
    const status = dto.status || (isActive ? 'ACTIVE' : 'INACTIVE');
    const defaultAmount = dto.defaultAmount !== undefined && dto.defaultAmount !== null ? new Prisma.Decimal(dto.defaultAmount) : new Prisma.Decimal(0);

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const feeHead = await tx.feeHead.create({
        data: {
          code,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          category: dto.category || FeeCategoryEnum.ACADEMIC,
          defaultAmount,
          isMandatory,
          isOptional,
          isActive,
          status,
          createdBy: user?.id,
        },
      });

      await tx.feeHeadAuditLog.create({
        data: {
          feeHeadId: feeHead.id,
          action: 'CREATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Created Fee Head ${feeHead.code} - ${feeHead.name} (${feeHead.category}, ₹${defaultAmount})`,
        },
      });

      return feeHead;
    });
  }

  async getFeeHeads(query?: FeeHeadQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query?.category) {
      where.category = query.category.toUpperCase();
    }

    if (query?.status) {
      where.status = query.status.toUpperCase();
    }

    if (query?.isActive !== undefined) {
      where.isActive = String(query.isActive) === 'true';
    }

    if (query?.isMandatory !== undefined) {
      where.isMandatory = String(query.isMandatory) === 'true';
    }

    const sortBy = query?.sortBy || 'name';
    const sortOrder = query?.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    const orderBy: any = {};
    if (['code', 'name', 'category', 'defaultAmount', 'status', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    const [total, data] = await Promise.all([
      this.prisma.feeHead.count({ where }),
      this.prisma.feeHead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { feeStructureItems: true, feePaymentItems: true },
          },
        },
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

  async getFeeHeadById(id: string) {
    const feeHead = await this.prisma.feeHead.findUnique({
      where: { id },
      include: {
        auditLogs: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: { feeStructureItems: true, feePaymentItems: true },
        },
      },
    });

    if (!feeHead) throw new NotFoundException('Fee Head not found.');
    return feeHead;
  }

  async updateFeeHead(id: string, dto: UpdateFeeHeadDto, user?: any) {
    const existing = await this.getFeeHeadById(id);
    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim();
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.defaultAmount !== undefined && dto.defaultAmount !== null) {
      updateData.defaultAmount = new Prisma.Decimal(dto.defaultAmount);
    }
    if (dto.isMandatory !== undefined) {
      updateData.isMandatory = dto.isMandatory;
      updateData.isOptional = !dto.isMandatory;
    }
    if (dto.isOptional !== undefined) {
      updateData.isOptional = dto.isOptional;
      updateData.isMandatory = !dto.isOptional;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
      updateData.status = dto.isActive ? 'ACTIVE' : 'INACTIVE';
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status.toUpperCase();
      updateData.isActive = updateData.status === 'ACTIVE';
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.feeHead.update({
        where: { id },
        data: updateData,
      });

      await tx.feeHeadAuditLog.create({
        data: {
          feeHeadId: id,
          action: 'UPDATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Updated Fee Head ${updated.code}: ${JSON.stringify(dto)}`,
        },
      });

      return updated;
    });
  }

  async updateFeeHeadStatus(id: string, dto: UpdateFeeHeadStatusDto, user?: any) {
    const existing = await this.getFeeHeadById(id);
    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    let isActive = existing.isActive;
    let status = existing.status;

    if (dto.isActive !== undefined) {
      isActive = dto.isActive;
      status = isActive ? 'ACTIVE' : 'INACTIVE';
    } else if (dto.status !== undefined) {
      status = dto.status.toUpperCase();
      isActive = status === 'ACTIVE';
    }

    const action = isActive ? 'ACTIVATED' : 'DEACTIVATED';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.feeHead.update({
        where: { id },
        data: { isActive, status },
      });

      await tx.feeHeadAuditLog.create({
        data: {
          feeHeadId: id,
          action,
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `${action} Fee Head ${updated.code} - ${updated.name}`,
        },
      });

      return updated;
    });
  }

  getFeeCategories() {
    return Object.values(FeeCategoryEnum).map((category) => ({
      code: category,
      label: category.replace(/_/g, ' '),
    }));
  }

  async getFeeHeadAuditLogs(feeHeadId: string) {
    await this.getFeeHeadById(feeHeadId);
    return this.prisma.feeHeadAuditLog.findMany({
      where: { feeHeadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Fee Structure Management (Phase 2 — University Fee Structure Master) ──────

  async createFeeStructure(dto: CreateFeeStructureDto, user?: any) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one Fee Head item is required in the Fee Structure.');
    }

    // Validate unique Fee Heads within the structure
    const feeHeadIds = dto.items.map((i) => i.feeHeadId);
    const uniqueFeeHeadIds = new Set(feeHeadIds);
    if (uniqueFeeHeadIds.size !== feeHeadIds.length) {
      throw new BadRequestException('Duplicate Fee Heads are not allowed within the same Fee Structure.');
    }

    // Validate item amounts
    for (const item of dto.items) {
      if (item.amount < 0 || isNaN(item.amount)) {
        throw new BadRequestException('Fee amount cannot be negative or invalid.');
      }
    }

    // Validate effective dates
    if (dto.effectiveFrom && dto.effectiveTo) {
      const from = new Date(dto.effectiveFrom);
      const to = new Date(dto.effectiveTo);
      if (to < from) {
        throw new BadRequestException('Effective To date cannot be earlier than Effective From date.');
      }
    }

    // Validate Program and Semester exist
    const [program, semester] = await Promise.all([
      this.prisma.program.findUnique({ where: { id: dto.programId }, include: { department: true } }),
      this.prisma.semester.findUnique({ where: { id: dto.semesterId } }),
    ]);
    if (!program) throw new NotFoundException('Selected Academic Program was not found.');
    if (!semester) throw new NotFoundException('Selected Semester was not found.');

    // Auto-derive department/institute if not provided
    const departmentId = dto.departmentId || program.departmentId;
    const instituteId = dto.instituteId || program.department?.instituteId;

    // Check for existing active structure for program/semester/year/category
    const existing = await this.prisma.feeStructure.findFirst({
      where: {
        programId: dto.programId,
        semesterId: dto.semesterId,
        academicYearCode: dto.academicYearCode,
        ...(dto.studentCategoryId ? { studentCategoryId: dto.studentCategoryId } : {}),
        status: { in: ['ACTIVE', 'DRAFT'] },
      },
    });
    if (existing && dto.status === 'ACTIVE') {
      throw new ConflictException(
        `An active fee structure '${existing.name}' already exists for ${program.code} - Semester ${semester.semesterNumber} (${dto.academicYearCode}).`,
      );
    }

    // Calculate total amount via Decimal precision
    const totalAmount = dto.items.reduce(
      (sum, i) => sum.add(new Prisma.Decimal(i.amount)),
      new Prisma.Decimal(0),
    );

    // Auto-generate structure code if not provided
    const structureCode =
      dto.structureCode?.trim().toUpperCase() ||
      `FS-${program.code}-SEM${semester.semesterNumber}-${dto.academicYearCode.replace(/\s+/g, '')}-V1`.toUpperCase();

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const feeStructure = await tx.feeStructure.create({
        data: {
          structureCode,
          instituteId,
          departmentId,
          programId: dto.programId,
          semesterId: dto.semesterId,
          academicYearCode: dto.academicYearCode,
          academicYearId: dto.academicYearId,
          studentCategoryId: dto.studentCategoryId,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          totalAmount,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
          effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
          status: dto.status || 'DRAFT',
          version: 1,
          createdBy: user?.id,
          items: {
            create: dto.items.map((item, idx) => ({
              feeHeadId: item.feeHeadId,
              amount: new Prisma.Decimal(item.amount),
              isMandatory: item.isMandatory !== undefined ? item.isMandatory : !item.isOptional,
              isOptional: item.isOptional !== undefined ? item.isOptional : !item.isMandatory,
              frequency: item.frequency || FeeFrequencyEnum.PER_SEMESTER,
              sequence: item.sequence || idx + 1,
              description: item.description?.trim(),
            })),
          },
        },
        include: {
          items: { include: { feeHead: true } },
          program: true,
          semester: true,
          institute: true,
          department: true,
          academicYear: true,
        },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: feeStructure.id,
          action: 'CREATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Created Fee Structure '${feeStructure.name}' (${feeStructure.structureCode}) with ${dto.items.length} items. Total: ₹${totalAmount}`,
        },
      });

      return feeStructure;
    });
  }

  async getFeeStructures(query?: FeeStructureQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { structureCode: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { academicYearCode: { contains: s, mode: 'insensitive' } },
        { program: { code: { contains: s, mode: 'insensitive' } } },
        { program: { name: { contains: s, mode: 'insensitive' } } },
      ];
    }

    if (query?.instituteId) where.instituteId = query.instituteId;
    if (query?.departmentId) where.departmentId = query.departmentId;
    if (query?.programId) where.programId = query.programId;
    if (query?.semesterId) where.semesterId = query.semesterId;
    if (query?.academicYearCode) where.academicYearCode = query.academicYearCode;
    if (query?.studentCategoryId) where.studentCategoryId = query.studentCategoryId;
    if (query?.status) where.status = query.status.toUpperCase();

    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder = query?.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};
    if (['name', 'totalAmount', 'status', 'createdAt', 'structureCode', 'academicYearCode'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, data] = await Promise.all([
      this.prisma.feeStructure.count({ where }),
      this.prisma.feeStructure.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: {
            include: { feeHead: true },
            orderBy: { sequence: 'asc' },
          },
          program: true,
          semester: true,
          institute: true,
          department: true,
          academicYear: true,
          _count: {
            select: { accounts: true, items: true },
          },
        },
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

  async getFeeStructureById(id: string) {
    const fs = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: {
        items: {
          include: { feeHead: true },
          orderBy: { sequence: 'asc' },
        },
        program: { include: { department: { include: { institute: true } } } },
        semester: true,
        institute: true,
        department: true,
        academicYear: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
        _count: {
          select: { accounts: true },
        },
      },
    });
    if (!fs) throw new NotFoundException('Fee structure not found.');

    // Calculate subtotal breakdowns
    let mandatoryTotal = new Prisma.Decimal(0);
    let optionalTotal = new Prisma.Decimal(0);
    for (const item of fs.items) {
      if (item.isMandatory) {
        mandatoryTotal = mandatoryTotal.add(item.amount);
      } else {
        optionalTotal = optionalTotal.add(item.amount);
      }
    }

    return {
      ...fs,
      breakdown: {
        mandatoryTotal: Number(mandatoryTotal),
        optionalTotal: Number(optionalTotal),
        totalAmount: Number(fs.totalAmount),
        itemCount: fs.items.length,
      },
    };
  }

  async updateFeeStructure(id: string, dto: UpdateFeeStructureDto, user?: any) {
    const existing = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: { items: true, _count: { select: { accounts: true } } },
    });
    if (!existing) throw new NotFoundException('Fee structure not found.');

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = existing.totalAmount;

      // If items are being updated, validate & recalculate
      if (dto.items && dto.items.length > 0) {
        const feeHeadIds = dto.items.map((i) => i.feeHeadId);
        const uniqueFeeHeadIds = new Set(feeHeadIds);
        if (uniqueFeeHeadIds.size !== feeHeadIds.length) {
          throw new BadRequestException('Duplicate Fee Heads are not allowed within the same Fee Structure.');
        }

        totalAmount = dto.items.reduce(
          (sum, i) => sum.add(new Prisma.Decimal(i.amount)),
          new Prisma.Decimal(0),
        );

        // Delete old items and insert updated items
        await tx.feeStructureItem.deleteMany({ where: { feeStructureId: id } });
        await tx.feeStructureItem.createMany({
          data: dto.items.map((item, idx) => ({
            feeStructureId: id,
            feeHeadId: item.feeHeadId,
            amount: new Prisma.Decimal(item.amount),
            isMandatory: item.isMandatory !== undefined ? item.isMandatory : !item.isOptional,
            isOptional: item.isOptional !== undefined ? item.isOptional : !item.isMandatory,
            frequency: item.frequency || FeeFrequencyEnum.PER_SEMESTER,
            sequence: item.sequence || idx + 1,
            description: item.description?.trim(),
          })),
        });
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description?.trim();
      if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      if (dto.effectiveFrom !== undefined) updateData.effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : null;
      if (dto.effectiveTo !== undefined) updateData.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
      if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();
      if (dto.items && dto.items.length > 0) updateData.totalAmount = totalAmount;

      const updated = await tx.feeStructure.update({
        where: { id },
        data: updateData,
        include: {
          items: { include: { feeHead: true } },
          program: true,
          semester: true,
        },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: id,
          action: 'UPDATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Updated Fee Structure '${updated.name}'. Total: ₹${updated.totalAmount}, Status: ${updated.status}`,
        },
      });

      return updated;
    });
  }

  async duplicateFeeStructure(id: string, dto: DuplicateFeeStructureDto, user?: any) {
    const source = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: {
        items: true,
        program: true,
        semester: true,
      },
    });
    if (!source) throw new NotFoundException('Source Fee Structure not found.');

    const targetYearCode = dto.targetAcademicYearCode.trim();
    const newName = dto.name?.trim() || `${source.name} (${targetYearCode})`;
    const semNum = source.semester.semesterNumber || 1;
    const newStructureCode = `FS-${source.program.code}-SEM${semNum}-${targetYearCode.replace(/\s+/g, '')}-V1`.toUpperCase();

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const duplicated = await tx.feeStructure.create({
        data: {
          structureCode: newStructureCode,
          instituteId: source.instituteId,
          departmentId: source.departmentId,
          programId: source.programId,
          semesterId: source.semesterId,
          academicYearCode: targetYearCode,
          academicYearId: dto.targetAcademicYearId || source.academicYearId,
          studentCategoryId: source.studentCategoryId,
          name: newName,
          description: `Duplicated from ${source.structureCode || source.name} (${source.academicYearCode})`,
          totalAmount: source.totalAmount,
          dueDate: source.dueDate,
          effectiveFrom: source.effectiveFrom,
          effectiveTo: source.effectiveTo,
          status: 'DRAFT',
          version: 1,
          createdBy: user?.id,
          items: dto.copyItems !== false
            ? {
                create: source.items.map((item, idx) => ({
                  feeHeadId: item.feeHeadId,
                  amount: item.amount,
                  isMandatory: item.isMandatory,
                  isOptional: item.isOptional,
                  frequency: item.frequency,
                  sequence: item.sequence || idx + 1,
                  description: item.description,
                })),
              }
            : undefined,
        },
        include: {
          items: { include: { feeHead: true } },
          program: true,
          semester: true,
          institute: true,
          department: true,
        },
      });

      // Audit log on source
      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: source.id,
          action: 'DUPLICATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Duplicated structure to AY ${targetYearCode} (New ID: ${duplicated.id}, Code: ${duplicated.structureCode})`,
        },
      });

      // Audit log on new copy
      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: duplicated.id,
          action: 'CREATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Created as DRAFT copy of ${source.structureCode || source.name}`,
        },
      });

      return duplicated;
    });
  }

  async activateFeeStructure(id: string, user?: any) {
    const existing = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Fee structure not found.');
    if (existing.items.length === 0) {
      throw new BadRequestException('Cannot activate a Fee Structure with 0 items.');
    }

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.feeStructure.update({
        where: { id },
        data: { status: 'ACTIVE' },
        include: { items: { include: { feeHead: true } }, program: true, semester: true },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: id,
          action: 'ACTIVATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Activated Fee Structure '${updated.name}' (${updated.structureCode})`,
        },
      });

      return updated;
    });
  }

  async deactivateFeeStructure(id: string, user?: any) {
    const existing = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fee structure not found.');

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.feeStructure.update({
        where: { id },
        data: { status: 'INACTIVE' },
        include: { items: { include: { feeHead: true } }, program: true, semester: true },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: id,
          action: 'DEACTIVATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Deactivated Fee Structure '${updated.name}' (${updated.structureCode})`,
        },
      });

      return updated;
    });
  }

  async addFeeStructureItem(structureId: string, dto: AddFeeStructureItemDto, user?: any) {
    const structure = await this.prisma.feeStructure.findUnique({
      where: { id: structureId },
      include: { items: true },
    });
    if (!structure) throw new NotFoundException('Fee Structure not found.');

    const feeHead = await this.prisma.feeHead.findUnique({ where: { id: dto.feeHeadId } });
    if (!feeHead) throw new NotFoundException('Fee Head not found.');

    const existingItem = structure.items.find((i) => i.feeHeadId === dto.feeHeadId);
    if (existingItem) {
      throw new ConflictException(`Fee Head '${feeHead.name}' is already present in this structure.`);
    }

    const itemAmount = new Prisma.Decimal(dto.amount);
    const newTotal = structure.totalAmount.add(itemAmount);
    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const newItem = await tx.feeStructureItem.create({
        data: {
          feeStructureId: structureId,
          feeHeadId: dto.feeHeadId,
          amount: itemAmount,
          isMandatory: dto.isMandatory !== undefined ? dto.isMandatory : true,
          isOptional: dto.isMandatory !== undefined ? !dto.isMandatory : false,
          frequency: dto.frequency || FeeFrequencyEnum.PER_SEMESTER,
          sequence: dto.sequence || structure.items.length + 1,
          description: dto.description?.trim(),
        },
        include: { feeHead: true },
      });

      await tx.feeStructure.update({
        where: { id: structureId },
        data: { totalAmount: newTotal },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: structureId,
          action: 'ITEM_ADDED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Added Fee Item ${feeHead.code} (₹${itemAmount})`,
        },
      });

      return newItem;
    });
  }

  async updateFeeStructureItem(structureId: string, itemId: string, dto: UpdateFeeStructureItemDto, user?: any) {
    const item = await this.prisma.feeStructureItem.findUnique({
      where: { id: itemId },
      include: { feeHead: true },
    });
    if (!item || item.feeStructureId !== structureId) {
      throw new NotFoundException('Fee Structure Item not found in this structure.');
    }

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.amount !== undefined) updateData.amount = new Prisma.Decimal(dto.amount);
      if (dto.isMandatory !== undefined) {
        updateData.isMandatory = dto.isMandatory;
        updateData.isOptional = !dto.isMandatory;
      }
      if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
      if (dto.sequence !== undefined) updateData.sequence = dto.sequence;
      if (dto.description !== undefined) updateData.description = dto.description?.trim();

      const updatedItem = await tx.feeStructureItem.update({
        where: { id: itemId },
        data: updateData,
        include: { feeHead: true },
      });

      // Recalculate total amount
      const allItems = await tx.feeStructureItem.findMany({ where: { feeStructureId: structureId } });
      const newTotal = allItems.reduce((sum, i) => sum.add(i.amount), new Prisma.Decimal(0));

      await tx.feeStructure.update({
        where: { id: structureId },
        data: { totalAmount: newTotal },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: structureId,
          action: 'ITEM_UPDATED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Updated Fee Item ${item.feeHead.code}: Amount ₹${updatedItem.amount}`,
        },
      });

      return updatedItem;
    });
  }

  async deleteFeeStructureItem(structureId: string, itemId: string, user?: any) {
    const item = await this.prisma.feeStructureItem.findUnique({
      where: { id: itemId },
      include: { feeHead: true },
    });
    if (!item || item.feeStructureId !== structureId) {
      throw new NotFoundException('Fee Structure Item not found.');
    }

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Admin';

    return this.prisma.$transaction(async (tx) => {
      await tx.feeStructureItem.delete({ where: { id: itemId } });

      const allItems = await tx.feeStructureItem.findMany({ where: { feeStructureId: structureId } });
      const newTotal = allItems.reduce((sum, i) => sum.add(i.amount), new Prisma.Decimal(0));

      await tx.feeStructure.update({
        where: { id: structureId },
        data: { totalAmount: newTotal },
      });

      await tx.feeStructureAuditLog.create({
        data: {
          feeStructureId: structureId,
          action: 'ITEM_REMOVED',
          performedByUserId: user?.id || 'sys-admin',
          performedByName: userName,
          details: `Removed Fee Item ${item.feeHead.code} (was ₹${item.amount})`,
        },
      });

      return { success: true, removedItemId: itemId, newTotalAmount: Number(newTotal) };
    });
  }

  async getFeeStructureAuditLogs(structureId: string) {
    await this.getFeeStructureById(structureId);
    return this.prisma.feeStructureAuditLog.findMany({
      where: { feeStructureId: structureId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Phase 3 — Student Fee Assignment & Student Fee Account Master ─────────────

  /**
   * Find eligible students for an active fee structure matching Academic Context
   */
  async getEligibleStudents(query: EligibleStudentsQueryDto) {
    const structure = await this.prisma.feeStructure.findUnique({
      where: { id: query.feeStructureId },
      include: {
        program: { include: { department: { include: { institute: true } } } },
        semester: true,
      },
    });

    if (!structure) {
      throw new NotFoundException('Fee Structure not found.');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    // Student filter criteria matching structure's program / department / institute
    const studentWhere: any = {
      status: 'ACTIVE',
    };

    if (structure.instituteId) {
      studentWhere.instituteId = structure.instituteId;
    }
    if (structure.departmentId) {
      studentWhere.departmentId = structure.departmentId;
    }
    if (structure.programId) {
      studentWhere.batch = {
        programId: structure.programId,
      };
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      studentWhere.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { enrollmentNo: { contains: s, mode: 'insensitive' } },
        { erpId: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [totalEligible, students] = await Promise.all([
      this.prisma.student.count({ where: studentWhere }),
      this.prisma.student.findMany({
        where: studentWhere,
        skip,
        take: limit,
        orderBy: { enrollmentNo: 'asc' },
        include: {
          institute: true,
          department: true,
          batch: { include: { program: true } },
          feeAccounts: {
            where: { feeStructureId: structure.id },
            select: { id: true, status: true, totalDue: true, balanceDue: true },
          },
        },
      }),
    ]);

    // Map students and flag if already assigned
    const mappedStudents = students.map((stu) => {
      const existingAccount = stu.feeAccounts && stu.feeAccounts.length > 0 ? stu.feeAccounts[0] : null;
      return {
        id: stu.id,
        enrollmentNo: stu.enrollmentNo,
        erpId: stu.erpId,
        studentName: `${stu.firstName} ${stu.lastName || ''}`.trim(),
        instituteName: stu.institute?.name || structure.program?.department?.institute?.name || 'SSIU',
        departmentName: stu.department?.name || structure.program?.department?.name,
        programName: stu.batch?.program?.name || structure.program?.name,
        programCode: stu.batch?.program?.code || structure.program?.code,
        semesterName: structure.semester?.name || `Semester ${structure.semester?.semesterNumber || 1}`,
        academicYearCode: structure.academicYearCode,
        isAlreadyAssigned: !!existingAccount,
        feeAccountId: existingAccount?.id || null,
        feeAccountStatus: existingAccount?.status || null,
      };
    });

    const totalPages = Math.ceil(totalEligible / limit);

    return {
      data: mappedStudents,
      feeStructureSummary: {
        id: structure.id,
        structureCode: structure.structureCode,
        name: structure.name,
        academicYearCode: structure.academicYearCode,
        programName: structure.program?.name,
        programCode: structure.program?.code,
        semesterName: structure.semester?.name || `Semester ${structure.semester?.semesterNumber || 1}`,
        totalAmount: Number(structure.totalAmount),
        status: structure.status,
      },
      meta: {
        total: totalEligible,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Assign an ACTIVE Fee Structure to multiple eligible students in a database transaction
   */
  async assignFeeStructure(dto: AssignFeeStructureDto, user?: any) {
    if (!dto.studentIds || dto.studentIds.length === 0) {
      throw new BadRequestException('At least one student must be selected for fee assignment.');
    }

    const structure = await this.prisma.feeStructure.findUnique({
      where: { id: dto.feeStructureId },
      include: {
        items: { include: { feeHead: true } },
        program: true,
        semester: true,
      },
    });

    if (!structure) {
      throw new NotFoundException('Fee Structure not found.');
    }

    if (structure.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot assign fee structure with status '${structure.status}'. Only ACTIVE fee structures can be assigned.`,
      );
    }

    if (!structure.items || structure.items.length === 0) {
      throw new BadRequestException('Cannot assign a fee structure that has 0 fee items.');
    }

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Finance Admin';

    return this.prisma.$transaction(async (tx) => {
      // Fetch students
      const students = await tx.student.findMany({
        where: { id: { in: dto.studentIds } },
        include: {
          feeAccounts: {
            where: { feeStructureId: structure.id },
          },
        },
      });

      let assignedCount = 0;
      let alreadyAssignedCount = 0;
      let skippedCount = 0;
      const assignedAccountIds: string[] = [];
      const duplicateStudents: string[] = [];

      for (const student of students) {
        // Duplicate check
        if (student.feeAccounts && student.feeAccounts.length > 0) {
          alreadyAssignedCount++;
          skippedCount++;
          duplicateStudents.push(`${student.enrollmentNo} (${student.firstName} ${student.lastName})`);
          continue;
        }

        const totalDue = structure.totalAmount;
        const totalPaid = new Prisma.Decimal(0);
        const totalDiscount = new Prisma.Decimal(0);
        const totalWaived = new Prisma.Decimal(0);
        const balanceDue = structure.totalAmount;

        // 1. Create StudentFeeAccount
        const feeAccount = await tx.studentFeeAccount.create({
          data: {
            studentId: student.id,
            feeStructureId: structure.id,
            academicYearCode: structure.academicYearCode,
            totalDue,
            totalPaid,
            totalDiscount,
            totalWaived,
            balanceDue,
            status: FeeAccountStatusEnum.PENDING,
          },
        });

        // 2. Create individual StudentFeeItems
        for (const item of structure.items) {
          await tx.studentFeeItem.create({
            data: {
              studentFeeAccountId: feeAccount.id,
              feeHeadId: item.feeHeadId,
              feeStructureItemId: item.id,
              amount: item.amount,
              paidAmount: new Prisma.Decimal(0),
              discountAmount: new Prisma.Decimal(0),
              waivedAmount: new Prisma.Decimal(0),
              outstandingAmount: item.amount,
              status: FeeAccountStatusEnum.PENDING,
            },
          });
        }

        // 3. Create Audit Log for Fee Account
        await tx.studentFeeAccountAuditLog.create({
          data: {
            studentFeeAccountId: feeAccount.id,
            action: 'FEE_ASSIGNED',
            performedByUserId: user?.id || 'sys-admin',
            performedByName: userName,
            details: `Assigned Fee Structure '${structure.name}' (Total: ₹${totalDue}) to student ${student.enrollmentNo}`,
          },
        });

        assignedCount++;
        assignedAccountIds.push(feeAccount.id);
      }

      return {
        success: true,
        assignedCount,
        alreadyAssignedCount,
        skippedCount,
        assignedAccountIds,
        duplicateStudents: duplicateStudents.length > 0 ? duplicateStudents : undefined,
        message: `Successfully assigned fee structure to ${assignedCount} student(s). ${
          alreadyAssignedCount > 0 ? `${alreadyAssignedCount} student(s) were skipped because they already had this fee assigned.` : ''
        }`.trim(),
      };
    });
  }

  /**
   * List all Student Fee Accounts with search, filters, pagination, and RBAC security
   */
  async getStudentFeeAccounts(query: StudentFeeAccountQueryDto, user?: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Security: Student role can only see their own fee accounts
    const isStudent = user?.roles?.includes('STUDENT') || user?.role === 'STUDENT';
    if (isStudent) {
      if (!user?.student?.id && !user?.id) {
        throw new ForbiddenException('You are not authorized to view fee accounts.');
      }
      where.studentId = user?.student?.id || user.id;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.feeStructureId) {
      where.feeStructureId = query.feeStructureId;
    }

    if (query.academicYearCode) {
      where.academicYearCode = query.academicYearCode;
    }

    if (query.status) {
      where.status = query.status.toUpperCase();
    }

    if (query.programId || query.instituteId || query.departmentId) {
      where.feeStructure = {
        ...(query.programId ? { programId: query.programId } : {}),
        ...(query.instituteId ? { instituteId: query.instituteId } : {}),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      };
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.student = {
        OR: [
          { firstName: { contains: s, mode: 'insensitive' } },
          { lastName: { contains: s, mode: 'insensitive' } },
          { enrollmentNo: { contains: s, mode: 'insensitive' } },
        ],
      };
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};
    if (['totalDue', 'balanceDue', 'totalPaid', 'status', 'createdAt', 'updatedAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, data] = await Promise.all([
      this.prisma.studentFeeAccount.count({ where }),
      this.prisma.studentFeeAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          student: {
            include: {
              institute: true,
              department: true,
              batch: { include: { program: true } },
            },
          },
          feeStructure: {
            include: {
              program: true,
              semester: true,
              institute: true,
              department: true,
            },
          },
          items: {
            include: { feeHead: true },
          },
          _count: {
            select: { items: true, payments: true },
          },
        },
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

  /**
   * Get single Student Fee Account details with items breakdown & RBAC security check
   */
  async getStudentFeeAccountById(id: string, user?: any) {
    const account = await this.prisma.studentFeeAccount.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            institute: true,
            department: true,
            batch: { include: { program: true } },
          },
        },
        feeStructure: {
          include: {
            program: true,
            semester: true,
            institute: true,
            department: true,
          },
        },
        items: {
          include: { feeHead: true },
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Student Fee Account not found.');
    }

    // Security Check: If user is student, they must own this account
    const isStudent = user?.roles?.includes('STUDENT') || user?.role === 'STUDENT';
    if (isStudent) {
      const studentId = user?.student?.id || user?.id;
      if (account.studentId !== studentId) {
        throw new ForbiddenException('You are not authorized to view another student\'s fee account.');
      }
    }

    return account;
  }

  /**
   * Get all Fee Accounts for a specific Student with RBAC security check
   */
  async getStudentFeesByStudentId(studentId: string, user?: any) {
    // Security Check: If user is student, they cannot view other students' fees
    const isStudent = user?.roles?.includes('STUDENT') || user?.role === 'STUDENT';
    if (isStudent) {
      const myStudentId = user?.student?.id || user?.id;
      if (studentId !== myStudentId) {
        throw new ForbiddenException('You are not authorized to view another student\'s fee account.');
      }
    }

    return this.prisma.studentFeeAccount.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            program: true,
            semester: true,
          },
        },
        items: {
          include: { feeHead: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get Audit Logs for a specific Student Fee Account
   */
  async getStudentFeeAccountAuditLogs(studentFeeAccountId: string, user?: any) {
    await this.getStudentFeeAccountById(studentFeeAccountId, user);
    return this.prisma.studentFeeAccountAuditLog.findMany({
      where: { studentFeeAccountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyFeeAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
    if (!user?.student) throw new BadRequestException('Only students can view their fee accounts.');
    return this.getStudentFeesByStudentId(user.student.id, { roles: ['STUDENT'], student: user.student });
  }

  // ── Phase 4 — Fee Invoice / Demand Management ────────────────────────────────

  /**
   * Safe unique invoice number generator: SSIU/FEE/{AY}/{000001}
   */
  async generateInvoiceNumber(academicYearCode?: string): Promise<string> {
    const ay = academicYearCode || '2026-27';
    const count = await this.prisma.feeInvoice.count({
      where: { academicYearCode: ay },
    });
    let seq = count + 1;
    let invoiceNumber = `SSIU/FEE/${ay}/${String(seq).padStart(6, '0')}`;

    // Protect against race conditions or collisions
    while (await this.prisma.feeInvoice.findUnique({ where: { invoiceNumber } })) {
      seq++;
      invoiceNumber = `SSIU/FEE/${ay}/${String(seq).padStart(6, '0')}`;
    }

    return invoiceNumber;
  }

  /**
   * Generate an official Fee Invoice / Demand for a student fee account
   */
  async generateFeeInvoice(dto: GenerateFeeInvoiceDto, user?: any) {
    // 1. Fetch Student Fee Account
    const account = await this.prisma.studentFeeAccount.findUnique({
      where: { id: dto.studentFeeAccountId },
      include: {
        student: true,
        feeStructure: {
          include: {
            program: true,
            semester: true,
          },
        },
        items: {
          include: {
            feeHead: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Student Fee Account '${dto.studentFeeAccountId}' not found.`);
    }

    // 2. Validate Due Date vs Invoice Date
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const dueDate = new Date(dto.dueDate);

    if (isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date provided.');
    }
    if (dueDate < invoiceDate) {
      throw new BadRequestException('Due Date cannot be earlier than Invoice Date.');
    }

    // 3. Filter and Validate Outstanding Items
    let targetItems = account.items.filter(item => Number(item.outstandingAmount) > 0);

    if (dto.feeItemIds && dto.feeItemIds.length > 0) {
      targetItems = targetItems.filter(item => dto.feeItemIds!.includes(item.id));
      if (targetItems.length !== dto.feeItemIds.length) {
        throw new BadRequestException('One or more selected fee item IDs are invalid or have already been settled.');
      }
    }

    if (targetItems.length === 0) {
      throw new BadRequestException('No outstanding fee items available to generate invoice.');
    }

    // 4. Calculate Subtotal, Discount, Waiver, Late Fee, Total
    let subtotal = new Prisma.Decimal(0);
    for (const item of targetItems) {
      subtotal = subtotal.add(new Prisma.Decimal(item.outstandingAmount));
    }

    const discountAmount = new Prisma.Decimal(0);
    const waiverAmount = new Prisma.Decimal(0);
    const lateFeeAmount = new Prisma.Decimal(0);
    const totalAmount = subtotal.sub(discountAmount).sub(waiverAmount).add(lateFeeAmount);

    const initialStatus = dto.status || FeeInvoiceStatusEnum.ISSUED;

    // 5. Generate Invoice in DB Transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(account.academicYearCode);

      const createdInvoice = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: account.studentId,
          studentFeeAccountId: account.id,
          feeStructureId: account.feeStructureId,
          academicYearCode: account.academicYearCode,
          semesterId: account.feeStructure.semesterId,
          invoiceDate,
          dueDate,
          subtotal,
          discountAmount,
          waiverAmount,
          lateFeeAmount,
          totalAmount,
          status: initialStatus,
          remarks: dto.remarks,
          issuedAt: initialStatus === FeeInvoiceStatusEnum.ISSUED ? new Date() : null,
          createdBy: user?.id || 'admin',
        },
      });

      // Create Invoice Items
      for (const item of targetItems) {
        await tx.feeInvoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            feeHeadId: item.feeHeadId,
            studentFeeItemId: item.id,
            description: `${item.feeHead.name} (${item.feeHead.code})`,
            amount: new Prisma.Decimal(item.outstandingAmount),
          },
        });
      }

      // Audit Log
      await tx.feeInvoiceAuditLog.create({
        data: {
          invoiceId: createdInvoice.id,
          action: initialStatus === FeeInvoiceStatusEnum.DRAFT ? 'CREATED' : 'ISSUED',
          performedByUserId: user?.id || 'admin',
          performedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System Admin',
          details: `Generated ${initialStatus} Fee Invoice ${invoiceNumber} for total ₹${totalAmount.toString()} (${targetItems.length} items)`,
        },
      });

      return createdInvoice;
    });

    return this.getFeeInvoiceById(invoice.id, user);
  }

  /**
   * Search, Filter, and Paginate Fee Invoices
   */
  async getFeeInvoices(query: FeeInvoiceQueryDto, user?: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FeeInvoiceWhereInput = {};

    // RBAC & Student Privacy Isolation
    const isStudent = user?.roles?.includes('STUDENT') || user?.role === 'STUDENT';
    if (isStudent) {
      const myStudentId = user?.student?.id || user?.id;
      where.studentId = myStudentId;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.invoiceNumber) {
      where.invoiceNumber = { contains: query.invoiceNumber, mode: 'insensitive' };
    }
    if (query.studentFeeAccountId) {
      where.studentFeeAccountId = query.studentFeeAccountId;
    }
    if (query.academicYearCode) {
      where.academicYearCode = query.academicYearCode;
    }
    if (query.semesterId) {
      where.semesterId = query.semesterId;
    }
    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.invoiceDate = {};
      if (query.fromDate) where.invoiceDate.gte = new Date(query.fromDate);
      if (query.toDate) where.invoiceDate.lte = new Date(query.toDate);
    }

    // Keyword Search (Student Name, Enrollment No, Invoice Number)
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: query.search, mode: 'insensitive' } } },
        { student: { erpId: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Program, Department, Institute Filtering
    if (query.programId || query.departmentId || query.instituteId) {
      where.student = {
        ...(where.student as any),
        ...(query.programId ? { batch: { programId: query.programId } } : {}),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        ...(query.instituteId ? { instituteId: query.instituteId } : {}),
      };
    }

    const [total, invoices] = await Promise.all([
      this.prisma.feeInvoice.count({ where }),
      this.prisma.feeInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              institute: true,
              department: true,
              batch: {
                include: { program: true },
              },
            },
          },
          feeStructure: {
            include: {
              program: true,
              semester: true,
            },
          },
          items: {
            include: {
              feeHead: true,
            },
          },
        },
      }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single Fee Invoice details with full line items and security check
   */
  async getFeeInvoiceById(id: string, user?: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            institute: true,
            department: true,
            batch: {
              include: { program: true },
            },
          },
        },
        studentFeeAccount: true,
        feeStructure: {
          include: {
            program: true,
            semester: true,
          },
        },
        items: {
          include: {
            feeHead: true,
            studentFeeItem: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fee Invoice '${id}' not found.`);
    }

    // Security Check: If user is student, they cannot view other students' invoices
    const isStudent = user?.roles?.includes('STUDENT') || user?.role === 'STUDENT';
    if (isStudent) {
      const myStudentId = user?.student?.id || user?.id;
      if (invoice.studentId !== myStudentId) {
        throw new ForbiddenException('You are not authorized to view another student\'s fee invoice.');
      }
    }

    return invoice;
  }

  /**
   * Get all invoices for the authenticated student
   */
  async getMyFeeInvoices(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
    if (!user?.student) throw new BadRequestException('Only students can view their fee invoices.');
    return this.getStudentFeeInvoicesByStudentId(user.student.id, { roles: ['STUDENT'], student: user.student });
  }

  /**
   * Get all Fee Invoices for a specific student with RBAC check
   */
  async getStudentFeeInvoicesByStudentId(studentId: string, user?: any) {
    const isStudent = user?.roles?.includes('STUDENT') || user?.role === 'STUDENT';
    if (isStudent) {
      const myStudentId = user?.student?.id || user?.id;
      if (studentId !== myStudentId) {
        throw new ForbiddenException('You are not authorized to view another student\'s fee invoices.');
      }
    }

    return this.prisma.feeInvoice.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            program: true,
            semester: true,
          },
        },
        items: {
          include: { feeHead: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a DRAFT Fee Invoice (e.g. Due date, Remarks)
   */
  async updateFeeInvoice(id: string, dto: UpdateFeeInvoiceDto, user?: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Fee Invoice '${id}' not found.`);

    if (invoice.status !== FeeInvoiceStatusEnum.DRAFT) {
      throw new BadRequestException(`Cannot edit invoice in '${invoice.status}' status. Only DRAFT invoices can be updated.`);
    }

    let dueDate = invoice.dueDate;
    if (dto.dueDate) {
      dueDate = new Date(dto.dueDate);
      if (isNaN(dueDate.getTime()) || dueDate < invoice.invoiceDate) {
        throw new BadRequestException('Due Date cannot be earlier than Invoice Date.');
      }
    }

    const updated = await this.prisma.feeInvoice.update({
      where: { id },
      data: {
        dueDate,
        remarks: dto.remarks !== undefined ? dto.remarks : invoice.remarks,
      },
    });

    await this.prisma.feeInvoiceAuditLog.create({
      data: {
        invoiceId: id,
        action: 'UPDATED',
        performedByUserId: user?.id || 'admin',
        performedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System Admin',
        details: `Updated invoice due date to ${dueDate.toISOString().split('T')[0]}`,
      },
    });

    return this.getFeeInvoiceById(id, user);
  }

  /**
   * Issue a DRAFT Fee Invoice
   */
  async issueFeeInvoice(id: string, user?: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Fee Invoice '${id}' not found.`);

    if (invoice.status !== FeeInvoiceStatusEnum.DRAFT) {
      throw new BadRequestException(`Invoice is already in '${invoice.status}' status.`);
    }

    const issued = await this.prisma.feeInvoice.update({
      where: { id },
      data: {
        status: FeeInvoiceStatusEnum.ISSUED,
        issuedAt: new Date(),
      },
    });

    await this.prisma.feeInvoiceAuditLog.create({
      data: {
        invoiceId: id,
        action: 'ISSUED',
        performedByUserId: user?.id || 'admin',
        performedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System Admin',
        details: `Issued Fee Invoice ${invoice.invoiceNumber}`,
      },
    });

    return this.getFeeInvoiceById(id, user);
  }

  /**
   * Cancel a Fee Invoice (Never hard delete, preserve financial trail)
   */
  async cancelFeeInvoice(id: string, dto: CancelFeeInvoiceDto, user?: any) {
    const invoice = await this.prisma.feeInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Fee Invoice '${id}' not found.`);

    if (invoice.status === FeeInvoiceStatusEnum.CANCELLED) {
      throw new BadRequestException('Fee Invoice is already cancelled.');
    }
    if (invoice.status === FeeInvoiceStatusEnum.PAID) {
      throw new BadRequestException('Cannot cancel a PAID invoice.');
    }

    const cancelled = await this.prisma.feeInvoice.update({
      where: { id },
      data: {
        status: FeeInvoiceStatusEnum.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: user?.id || 'admin',
        cancellationReason: dto.cancellationReason,
      },
    });

    await this.prisma.feeInvoiceAuditLog.create({
      data: {
        invoiceId: id,
        action: 'CANCELLED',
        performedByUserId: user?.id || 'admin',
        performedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System Admin',
        details: `Cancelled Invoice ${invoice.invoiceNumber}. Reason: ${dto.cancellationReason}`,
      },
    });

    return this.getFeeInvoiceById(id, user);
  }

  /**
   * Generate Print/PDF payload for Fee Demand / Invoice
   */
  async getFeeInvoicePdf(id: string, user?: any) {
    const invoice = await this.getFeeInvoiceById(id, user);

    // Audit log for download/print
    await this.prisma.feeInvoiceAuditLog.create({
      data: {
        invoiceId: id,
        action: 'DOWNLOADED',
        performedByUserId: user?.id || 'admin',
        performedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
        details: `Downloaded/Printed Fee Invoice PDF ${invoice.invoiceNumber}`,
      },
    });

    const stu = invoice.student;
    const items = invoice.items;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fee Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .header p { margin: 2px 0 0 0; font-size: 11px; color: #475569; }
    .title-banner { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; font-size: 14px; text-align: center; text-transform: uppercase; margin-bottom: 16px; border-radius: 4px; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; }
    .meta-col { width: 48%; }
    .meta-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e2e8f0; }
    .meta-label { color: #64748b; font-weight: 600; }
    .meta-value { font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #0f172a; color: #ffffff; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .summary-box { width: 50%; margin-left: auto; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    .summary-total { background: #0f172a; color: #ffffff; font-weight: bold; font-size: 14px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; text-transform: uppercase; background: #e2e8f0; color: #334155; }
    .badge-issued { background: #dcfce7; color: #166534; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Swarrnim Startup & Innovation University</h1>
    <p>Bhoyan Rathod, Opp. IFFCO, Near Gandhinagar, Gujarat 382420</p>
    <p>Official Fee Demand & Invoice Ledger Notice</p>
  </div>

  <div class="title-banner">
    Official Fee Demand / Invoice
  </div>

  <div class="meta-grid">
    <div class="meta-col">
      <div class="meta-row"><span class="meta-label">Invoice Number:</span><span class="meta-value">${invoice.invoiceNumber}</span></div>
      <div class="meta-row"><span class="meta-label">Student Name:</span><span class="meta-value">${stu.firstName} ${stu.lastName}</span></div>
      <div class="meta-row"><span class="meta-label">Enrollment No:</span><span class="meta-value">${stu.enrollmentNo}</span></div>
      <div class="meta-row"><span class="meta-label">Program:</span><span class="meta-value">${invoice.feeStructure?.program?.name || '-'}</span></div>
      <div class="meta-row"><span class="meta-label">Institute / Dept:</span><span class="meta-value">${stu.institute?.name || '-'}</span></div>
    </div>
    <div class="meta-col">
      <div class="meta-row"><span class="meta-label">Invoice Date:</span><span class="meta-value">${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span></div>
      <div class="meta-row"><span class="meta-label">Due Date:</span><span class="meta-value" style="color: #b91c1c;">${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span></div>
      <div class="meta-row"><span class="meta-label">Academic Term:</span><span class="meta-value">${invoice.academicYearCode} • ${invoice.feeStructure?.semester?.name || `Sem ${invoice.semesterId}`}</span></div>
      <div class="meta-row"><span class="meta-label">Status:</span><span class="meta-value"><span class="badge ${invoice.status === 'ISSUED' ? 'badge-issued' : invoice.status === 'CANCELLED' ? 'badge-cancelled' : ''}">${invoice.status}</span></span></div>
      <div class="meta-row"><span class="meta-label">Fee Structure:</span><span class="meta-value">${invoice.feeStructure?.name || '-'}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">Sr.</th>
        <th>Fee Head & Description</th>
        <th style="width: 120px;">Category</th>
        <th class="text-right" style="width: 140px;">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <strong>${item.feeHead?.name || item.description}</strong>
            <div style="font-size: 10px; color: #64748b;">Code: ${item.feeHead?.code || 'FEES'}</div>
          </td>
          <td><span class="badge">${item.feeHead?.category || 'ACADEMIC'}</span></td>
          <td class="text-right" style="font-family: monospace; font-weight: bold;">₹${Number(item.amount).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-row">
      <span>Subtotal</span>
      <span style="font-family: monospace; font-weight: bold;">₹${Number(invoice.subtotal).toLocaleString('en-IN')}</span>
    </div>
    <div class="summary-row">
      <span>Discount</span>
      <span style="font-family: monospace; color: #059669;">- ₹${Number(invoice.discountAmount).toLocaleString('en-IN')}</span>
    </div>
    <div class="summary-row">
      <span>Waiver</span>
      <span style="font-family: monospace; color: #059669;">- ₹${Number(invoice.waiverAmount).toLocaleString('en-IN')}</span>
    </div>
    <div class="summary-row">
      <span>Late Fee</span>
      <span style="font-family: monospace; color: #dc2626;">+ ₹${Number(invoice.lateFeeAmount).toLocaleString('en-IN')}</span>
    </div>
    <div class="summary-row summary-total">
      <span>TOTAL PAYABLE</span>
      <span style="font-family: monospace;">₹${Number(invoice.totalAmount).toLocaleString('en-IN')}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated official Fee Demand Notice issued by Swarrnim Startup & Innovation University.</p>
    <p>Please pay before the due date (${new Date(invoice.dueDate).toLocaleDateString('en-IN')}) to avoid late payment penalties.</p>
  </div>
</body>
</html>
    `.trim();

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentName: `${stu.firstName} ${stu.lastName}`,
      totalPayable: Number(invoice.totalAmount),
      html: htmlContent,
      base64Pdf: Buffer.from(htmlContent).toString('base64'),
    };
  }

  /**
   * Get Audit Logs for a specific Fee Invoice
   */
  async getFeeInvoiceAuditLogs(invoiceId: string, user?: any) {
    await this.getFeeInvoiceById(invoiceId, user);
    return this.prisma.feeInvoiceAuditLog.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Payment Recording ─────────────────────────────────────────────────────────

  private async generateReceiptNo(): Promise<string> {
    const count = await this.prisma.feePayment.count();
    const seq = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `FEE-${year}-${seq}`;
  }

  async recordPayment(dto: RecordPaymentDto, collectedByUserId: string) {
    const account = await this.prisma.studentFeeAccount.findUnique({ where: { id: dto.feeAccountId } });
    if (!account) throw new NotFoundException('Student fee account not found.');
    if (Number(account.balanceDue) <= 0) throw new BadRequestException('No outstanding balance for this account.');
    if (dto.amount > Number(account.balanceDue)) {
      throw new BadRequestException(`Payment amount exceeds balance due (${account.balanceDue}).`);
    }

    const receiptNo = await this.generateReceiptNo();
    const newTotalPaid = Number(account.totalPaid) + dto.amount;
    const newBalance = Number(account.balanceDue) - dto.amount;
    const newStatus = newBalance <= 0 ? 'PAID' : newBalance < Number(account.totalDue) ? 'PARTIAL' : 'UNPAID';

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          receiptNo,
          feeAccountId: dto.feeAccountId,
          amount: dto.amount,
          paymentMode: dto.paymentMode,
          transactionRef: dto.transactionRef,
          collectedByUserId,
          remarks: dto.remarks,
          status: 'CONFIRMED',
          items: dto.items?.length
            ? { create: dto.items.map((i) => ({ feeHeadId: i.feeHeadId, amount: i.amount })) }
            : undefined,
        },
        include: { items: true },
      });

      await tx.studentFeeAccount.update({
        where: { id: dto.feeAccountId },
        data: { totalPaid: newTotalPaid, balanceDue: newBalance, status: newStatus },
      });

      return payment;
    });
  }

  async getPaymentHistory(feeAccountId: string) {
    return this.prisma.feePayment.findMany({
      where: { feeAccountId },
      include: { items: { include: { feeHead: true } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  // ── Discounts ─────────────────────────────────────────────────────────────────

  async applyDiscount(dto: ApplyDiscountDto, approvedByUserId: string) {
    const account = await this.prisma.studentFeeAccount.findUnique({ where: { id: dto.feeAccountId } });
    if (!account) throw new NotFoundException('Student fee account not found.');
    if (dto.amount > Number(account.balanceDue)) {
      throw new BadRequestException('Discount amount exceeds balance due.');
    }

    return this.prisma.$transaction(async (tx) => {
      const discount = await tx.feeDiscount.create({
        data: {
          feeAccountId: dto.feeAccountId,
          discountType: dto.discountType,
          description: dto.description,
          amount: dto.amount,
          approvedByUserId,
        },
      });

      const newDiscount = Number(account.totalDiscount) + dto.amount;
      const newBalance = Number(account.balanceDue) - dto.amount;
      const newStatus = newBalance <= 0 ? 'WAIVED' : 'PARTIAL';

      await tx.studentFeeAccount.update({
        where: { id: dto.feeAccountId },
        data: { totalDiscount: newDiscount, balanceDue: newBalance, status: newStatus },
      });

      return discount;
    });
  }

  // ── Refunds ───────────────────────────────────────────────────────────────────

  async createRefund(dto: CreateRefundDto) {
    const account = await this.prisma.studentFeeAccount.findUnique({ where: { id: dto.feeAccountId } });
    if (!account) throw new NotFoundException('Student fee account not found.');
    const payment = await this.prisma.feePayment.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException('Payment record not found.');
    if (dto.refundAmount > Number(payment.amount)) throw new BadRequestException('Refund exceeds payment amount.');

    return this.prisma.feeRefund.create({
      data: {
        feeAccountId: dto.feeAccountId,
        paymentId: dto.paymentId,
        refundAmount: dto.refundAmount,
        reason: dto.reason,
        refundMode: dto.refundMode ?? 'ONLINE',
      },
    });
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  async getDuesReport() {
    const overdueAccounts = await this.prisma.studentFeeAccount.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
      include: { student: true, feeStructure: { include: { program: true } } },
      orderBy: { balanceDue: 'desc' },
    });
    const totalDue = overdueAccounts.reduce((sum, a) => sum + Number(a.balanceDue), 0);
    return { totalAccountsWithDues: overdueAccounts.length, totalDueAmount: totalDue, accounts: overdueAccounts };
  }

  // ── 9. Bulk Fee Assignment Engine (Phase 9) ───────────────────────────────────

  async previewBulkAssignFeeStructure(dto: any) {
    const structure = await this.prisma.feeStructure.findUnique({
      where: { id: dto.feeStructureId },
      include: { items: { include: { feeHead: true } } },
    });
    if (!structure) throw new NotFoundException('Fee structure not found.');

    let eligibleStudents: any[] = [];
    if (dto.studentIds && dto.studentIds.length > 0) {
      eligibleStudents = await this.prisma.student.findMany({
        where: { id: { in: dto.studentIds } },
        include: { department: true },
      });
    } else {
      const where: any = {};
      if (dto.instituteId) where.instituteId = dto.instituteId;
      if (dto.departmentId) where.departmentId = dto.departmentId;
      eligibleStudents = await this.prisma.student.findMany({
        where,
        include: { department: true },
      });
    }

    // Check already assigned
    const existingAccounts = await this.prisma.studentFeeAccount.findMany({
      where: {
        feeStructureId: structure.id,
        studentId: { in: eligibleStudents.map((s) => s.id) },
      },
    });
    const assignedMap = new Set(existingAccounts.map((a) => a.studentId));

    const previewList = eligibleStudents.map((s) => ({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      enrollmentNo: s.enrollmentNo,
      departmentName: s.department?.name,
      alreadyAssigned: assignedMap.has(s.id),
      totalFee: Number(structure.totalAmount),
    }));

    const totalStudents = eligibleStudents.length;
    const alreadyAssignedCount = existingAccounts.length;
    const newAssignmentsCount = totalStudents - alreadyAssignedCount;
    const totalFeeAmount = newAssignmentsCount * Number(structure.totalAmount);

    return {
      feeStructure: {
        id: structure.id,
        name: structure.name,
        structureCode: structure.structureCode,
        totalAmount: Number(structure.totalAmount),
        academicYearCode: structure.academicYearCode,
        itemsCount: structure.items.length,
      },
      studentsSelected: totalStudents,
      alreadyAssigned: alreadyAssignedCount,
      skipped: alreadyAssignedCount,
      newAssignments: newAssignmentsCount,
      totalFeeAmount,
      preview: previewList,
    };
  }

  async executeBulkAssignFeeStructure(dto: any, user?: any) {
    const preview = await this.previewBulkAssignFeeStructure(dto);
    const structure = await this.prisma.feeStructure.findUnique({
      where: { id: dto.feeStructureId },
      include: { items: { include: { feeHead: true } } },
    });
    if (!structure) throw new NotFoundException('Fee structure not found.');

    const studentsToAssign = preview.preview.filter((p: any) => !p.alreadyAssigned);
    if (studentsToAssign.length === 0) {
      return {
        message: 'No new students to assign fees to. All selected students already have this fee structure.',
        assignedCount: 0,
        skippedCount: preview.alreadyAssigned,
      };
    }

    const createdAccounts = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const s of studentsToAssign) {
        const account = await tx.studentFeeAccount.create({
          data: {
            studentId: s.studentId,
            feeStructureId: structure.id,
            academicYearCode: structure.academicYearCode,
            totalDue: structure.totalAmount,
            balanceDue: structure.totalAmount,
            status: 'PENDING',
            items: {
              create: structure.items.map((item) => ({
                feeHeadId: item.feeHeadId,
                feeStructureItemId: item.id,
                amount: item.amount,
                outstandingAmount: item.amount,
                status: 'PENDING',
              })),
            },
          },
        });
        results.push(account);
      }
      return results;
    });

    return {
      message: `Successfully assigned fees to ${createdAccounts.length} students.`,
      assignedCount: createdAccounts.length,
      skippedCount: preview.alreadyAssigned,
      totalFeeAssigned: createdAccounts.length * Number(structure.totalAmount),
    };
  }

  // ── 10. Student Financial Ledger (Phase 9) ────────────────────────────────────

  async getStudentLedger(studentId: string, user?: any) {
    if (user?.role === 'STUDENT' && user.studentId && user.studentId !== studentId) {
      throw new ForbiddenException('You are only authorized to view your own financial ledger.');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true },
    });
    if (!student) throw new NotFoundException('Student record not found.');

    const [accounts, payments, invoices, discounts, refunds] = await Promise.all([
      this.prisma.studentFeeAccount.findMany({
        where: { studentId },
        include: { feeStructure: true, items: { include: { feeHead: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.feePayment.findMany({
        where: { feeAccount: { studentId } },
        include: { items: { include: { feeHead: true } } },
        orderBy: { paymentDate: 'asc' },
      }),
      this.prisma.feeInvoice.findMany({
        where: { studentId },
        orderBy: { invoiceDate: 'asc' },
      }),
      this.prisma.feeDiscount.findMany({
        where: { feeAccount: { studentId } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.feeRefund.findMany({
        where: { feeAccount: { studentId } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    let runningBalance = 0;
    const entries: any[] = [];

    // Combine timeline events
    accounts.forEach((acc) => {
      const amt = Number(acc.totalDue);
      runningBalance += amt;
      entries.push({
        id: `acc-${acc.id}`,
        date: acc.createdAt.toISOString().slice(0, 10),
        type: 'FEE_ASSIGNED',
        referenceNo: acc.feeStructure?.structureCode || `FEE-ACC-${acc.id.slice(0, 8)}`,
        description: `Fee Assigned: ${acc.feeStructure?.name || 'Semester Fees'}`,
        debit: amt,
        credit: 0,
        balance: runningBalance,
      });
    });

    discounts.forEach((disc) => {
      const amt = Number(disc.amount);
      runningBalance -= amt;
      entries.push({
        id: `disc-${disc.id}`,
        date: disc.createdAt.toISOString().slice(0, 10),
        type: 'CONCESSION_APPLIED',
        referenceNo: `CONC-${disc.id.slice(0, 8)}`,
        description: `Scholarship/Concession: ${disc.discountType} (${disc.description || 'Waiver'})`,
        debit: 0,
        credit: amt,
        balance: runningBalance,
      });
    });

    payments.forEach((pay) => {
      const amt = Number(pay.amount);
      runningBalance -= amt;
      entries.push({
        id: `pay-${pay.id}`,
        date: pay.paymentDate.toISOString().slice(0, 10),
        type: 'PAYMENT_RECEIVED',
        referenceNo: pay.receiptNo || pay.transactionRef || `TXN-${pay.id.slice(0, 8)}`,
        description: `Payment Received via ${pay.paymentMode}`,
        debit: 0,
        credit: amt,
        balance: runningBalance,
      });
    });

    refunds.forEach((ref) => {
      const amt = Number(ref.refundAmount);
      runningBalance += amt;
      entries.push({
        id: `ref-${ref.id}`,
        date: ref.createdAt.toISOString().slice(0, 10),
        type: 'REFUND_PROCESSED',
        referenceNo: `REF-${ref.id.slice(0, 8)}`,
        description: `Refund Processed: ${ref.reason}`,
        debit: amt,
        credit: 0,
        balance: runningBalance,
      });
    });

    // Sort entries chronologically
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalAssigned = accounts.reduce((acc, a) => acc + Number(a.totalDue), 0);
    const totalPayments = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalConcessions = discounts.reduce((acc, d) => acc + Number(d.amount), 0);
    const totalRefunds = refunds.reduce((acc, r) => acc + Number(r.refundAmount), 0);

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      enrollmentNo: student.enrollmentNo,
      departmentName: student.department?.name || 'N/A',
      academicYear: '2026-27',
      openingBalance: 0,
      totalFeesAssigned: totalAssigned,
      totalConcessions,
      totalLateFees: 0,
      totalPayments,
      totalRefunds,
      closingBalance: runningBalance,
      entries,
    };
  }

  // ── 11. Concessions & Scholarships Engine (Phase 9) ───────────────────────────

  async createConcession(dto: any, user?: any) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found.');

    let account = null;
    if (dto.feeAccountId) {
      account = await this.prisma.studentFeeAccount.findUnique({ where: { id: dto.feeAccountId } });
    } else {
      account = await this.prisma.studentFeeAccount.findFirst({
        where: { studentId: dto.studentId, status: { in: ['PENDING', 'PARTIAL', 'PARTIALLY_PAID', 'OVERDUE'] } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!account) {
      throw new BadRequestException('No active fee account found for this student to apply concession.');
    }

    const amount = Number(dto.amount);
    if (amount > Number(account.balanceDue)) {
      throw new BadRequestException(`Concession amount (${amount}) exceeds student balance due (${account.balanceDue}).`);
    }

    const discount = await this.prisma.$transaction(async (tx) => {
      const disc = await tx.feeDiscount.create({
        data: {
          feeAccountId: account.id,
          discountType: dto.concessionType,
          description: dto.reason,
          amount: new Prisma.Decimal(amount),
          approvedByUserId: user?.id || 'ACCOUNTS_OFFICER',
          status: 'ACTIVE',
        },
      });

      const newTotalDiscount = Number(account.totalDiscount) + amount;
      const newBalance = Number(account.balanceDue) - amount;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

      await tx.studentFeeAccount.update({
        where: { id: account.id },
        data: {
          totalDiscount: newTotalDiscount,
          balanceDue: newBalance,
          status: newStatus,
        },
      });

      return disc;
    });

    return discount;
  }

  async getConcessions(query?: any) {
    return this.prisma.feeDiscount.findMany({
      include: {
        feeAccount: {
          include: { student: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 12. Refunds Management (Phase 9) ──────────────────────────────────────────

  async getRefunds(query?: any) {
    return this.prisma.feeRefund.findMany({
      include: {
        feeAccount: {
          include: { student: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRefund(id: string, dto: any, user?: any) {
    const refund = await this.prisma.feeRefund.findUnique({ where: { id } });
    if (!refund) throw new NotFoundException('Refund record not found.');

    const updated = await this.prisma.feeRefund.update({
      where: { id },
      data: {
        status: dto.status || 'COMPLETED',
        processedAt: new Date(),
        processedByUserId: user?.id || 'ACCOUNTS_OFFICER',
      },
      include: { feeAccount: { include: { student: true } }, payment: true },
    });

    return updated;
  }

  // ── 13. Payment Reconciliation Engine (Phase 9) ───────────────────────────────

  async getPaymentReconciliations(query?: any) {
    return this.prisma.paymentReconciliation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async reconcilePayment(id: string, dto: any, user?: any) {
    const rec = await this.prisma.paymentReconciliation.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Reconciliation record not found.');

    const updated = await this.prisma.paymentReconciliation.update({
      where: { id },
      data: {
        reconciliationStatus: dto.status || 'RECONCILED',
        remarks: dto.remarks || rec.remarks,
        reconciledByUserId: user?.id || 'ACCOUNTS_OFFICER',
        reconciledAt: new Date(),
      },
    });

    return updated;
  }

  // ── 14. Accounts Executive Dashboard Metrics (Phase 9) ────────────────────────

  async getAccountsExecutiveDashboard() {
    const [
      totalStudents,
      feeAccounts,
      payments,
      refunds,
      failedTransactions,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.studentFeeAccount.findMany({
        include: { student: { include: { department: true } } },
      }),
      this.prisma.feePayment.findMany(),
      this.prisma.feeRefund.findMany(),
      this.prisma.paymentTransaction.findMany({ where: { status: 'FAILED' } }),
    ]);

    const totalFeesAssigned = feeAccounts.reduce((sum: number, a: any) => sum + Number(a.totalDue), 0);
    const totalCollected = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalPending = feeAccounts.reduce((sum: number, a: any) => sum + Number(a.balanceDue), 0);
    const totalRefunds = refunds.reduce((sum: number, r: any) => sum + Number(r.refundAmount), 0);

    // Today & This Month
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    const todayCollection = payments
      .filter((p: any) => p.paymentDate.toISOString().slice(0, 10) === todayStr)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const thisMonthCollection = payments
      .filter((p: any) => p.paymentDate.toISOString().slice(0, 7) === monthStr)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return {
      totalStudents,
      totalFeesAssigned,
      totalCollected,
      totalPending,
      todayCollection,
      thisMonthCollection,
      lateFeeCollected: 0,
      totalRefunds,
      failedPaymentsCount: failedTransactions.length,
    };
  }

  // ── 15. Standard 14 Accounts Reports (Phase 9) ────────────────────────────────

  async getAccountsReports(reportType: string, filters?: any) {
    switch (reportType) {
      case 'DAILY_COLLECTION': {
        const payments = await this.prisma.feePayment.findMany({
          include: { feeAccount: { include: { student: true } } },
          orderBy: { paymentDate: 'desc' },
        });
        return payments.map((p: any) => ({
          receiptNo: p.receiptNo,
          studentName: `${p.feeAccount?.student?.firstName} ${p.feeAccount?.student?.lastName}`,
          enrollmentNo: p.feeAccount?.student?.enrollmentNo,
          paymentDate: p.paymentDate.toISOString().slice(0, 10),
          paymentMode: p.paymentMode,
          amount: Number(p.amount),
          status: p.status,
        }));
      }

      case 'MONTHLY_COLLECTION': {
        const payments = await this.prisma.feePayment.findMany({
          orderBy: { paymentDate: 'desc' },
        });
        const byMonth: Record<string, number> = {};
        payments.forEach((p: any) => {
          const m = p.paymentDate.toISOString().slice(0, 7);
          byMonth[m] = (byMonth[m] || 0) + Number(p.amount);
        });
        return Object.entries(byMonth).map(([month, total]) => ({ month, totalCollected: total }));
      }

      case 'FEE_HEAD_COLLECTION': {
        const feeHeads = await this.prisma.feeHead.findMany({
          include: { feePaymentItems: true },
        });
        return feeHeads.map((h: any) => ({
          code: h.code,
          name: h.name,
          category: h.category,
          totalCollected: h.feePaymentItems?.reduce((acc: number, item: any) => acc + Number(item.amount), 0) || 0,
        }));
      }

      case 'PENDING_FEES':
      case 'OVERDUE_FEES': {
        const accounts = await this.prisma.studentFeeAccount.findMany({
          where: { balanceDue: { gt: 0 } },
          include: { student: true, feeStructure: true },
          orderBy: { balanceDue: 'desc' },
        });
        return accounts.map((a: any) => ({
          studentName: `${a.student?.firstName} ${a.student?.lastName}`,
          enrollmentNo: a.student?.enrollmentNo,
          structure: a.feeStructure?.name,
          totalDue: Number(a.totalDue),
          paid: Number(a.totalPaid),
          pending: Number(a.balanceDue),
          status: a.status,
        }));
      }

      case 'PAYMENT_TRANSACTIONS': {
        const txs = await this.prisma.paymentTransaction.findMany({
          include: { student: true },
          orderBy: { createdAt: 'desc' },
        });
        return txs.map((t: any) => ({
          transactionNumber: t.transactionNumber,
          studentName: `${t.student?.firstName} ${t.student?.lastName}`,
          enrollmentNo: t.student?.enrollmentNo,
          gateway: t.gateway,
          amount: Number(t.amount),
          paymentMethod: t.paymentMethod,
          status: t.status,
          paidAt: t.paidAt ? t.paidAt.toISOString() : 'N/A',
        }));
      }

      case 'FAILED_PAYMENTS': {
        const failed = await this.prisma.paymentTransaction.findMany({
          where: { status: 'FAILED' },
          include: { student: true },
          orderBy: { createdAt: 'desc' },
        });
        return failed.map((t: any) => ({
          transactionNumber: t.transactionNumber,
          studentName: `${t.student?.firstName} ${t.student?.lastName}`,
          enrollmentNo: t.student?.enrollmentNo,
          gateway: t.gateway,
          amount: Number(t.amount),
          failureReason: t.failureReason || 'Declined by bank/gateway',
          date: t.createdAt.toISOString().slice(0, 10),
        }));
      }

      case 'REFUND_REPORT': {
        const refunds = await this.prisma.feeRefund.findMany({
          include: { feeAccount: { include: { student: true } }, payment: true },
          orderBy: { createdAt: 'desc' },
        });
        return refunds.map((r: any) => ({
          refundId: r.id,
          studentName: `${r.feeAccount?.student?.firstName} ${r.feeAccount?.student?.lastName}`,
          enrollmentNo: r.feeAccount?.student?.enrollmentNo,
          originalAmount: Number(r.payment?.amount || 0),
          refundAmount: Number(r.refundAmount),
          reason: r.reason,
          refundMode: r.refundMode,
          status: r.status,
        }));
      }

      case 'CONCESSION_REPORT': {
        const concessions = await this.prisma.feeDiscount.findMany({
          include: { feeAccount: { include: { student: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return concessions.map((c: any) => ({
          studentName: `${c.feeAccount?.student?.firstName} ${c.feeAccount?.student?.lastName}`,
          enrollmentNo: c.feeAccount?.student?.enrollmentNo,
          discountType: c.discountType,
          amount: Number(c.amount),
          description: c.description,
          status: c.status,
        }));
      }

      default: {
        const accounts = await this.prisma.studentFeeAccount.findMany({
          include: { student: { include: { department: true } } },
        });
        return accounts.map((a: any) => ({
          studentName: `${a.student?.firstName} ${a.student?.lastName}`,
          enrollmentNo: a.student?.enrollmentNo,
          totalDue: Number(a.totalDue),
          paid: Number(a.totalPaid),
          pending: Number(a.balanceDue),
          status: a.status,
        }));
      }
    }
  }
}


