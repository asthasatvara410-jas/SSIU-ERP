import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, ApplyLeaveDto, RecordAttendanceDto, CreateSalaryStructureDto } from './dto/hr.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── Employee Master ─────────────────────────────────────────────────────────

  async createEmployee(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({
      where: { OR: [{ employeeCode: dto.employeeCode.toUpperCase() }, { email: dto.email.toLowerCase() }] },
    });
    if (existing) throw new ConflictException('Employee with code or email already exists.');

    const count = await this.prisma.employee.count();
    const erpId = `EMP${String(count + 1).padStart(6, '0')}`;

    return this.prisma.employee.create({
      data: {
        employeeCode: dto.employeeCode.toUpperCase(),
        erpId,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        designation: dto.designation,
        employmentType: dto.employmentType || 'FULL_TIME',
        instituteId: dto.instituteId,
        departmentId: dto.departmentId,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        serviceHistories: {
          create: {
            changeType: 'JOINING',
            title: `Joined as ${dto.designation}`,
            effectiveDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
          },
        },
      },
      include: { institute: true, department: true, serviceHistories: true },
    });
  }

  async getEmployees(departmentId?: string, status?: string, search?: string) {
    return this.prisma.employee.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(status ? { employmentStatus: status } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { employeeCode: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { institute: true, department: true },
      orderBy: { employeeCode: 'asc' },
    });
  }

  async getEmployeeById(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        institute: true,
        department: true,
        serviceHistories: { orderBy: { effectiveDate: 'desc' } },
        leaveBalances: { include: { leaveType: true } },
        salaryStructures: { where: { status: 'ACTIVE' } },
        documents: true,
      },
    });
    if (!emp) throw new NotFoundException('Employee not found.');
    return emp;
  }

  async uploadEmployeeDocument(employeeId: string, data: { documentType: string; title: string; documentUrl: string }) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found.');

    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        documentType: data.documentType,
        title: data.title,
        documentUrl: data.documentUrl,
        status: 'VERIFIED',
      },
    });
  }

  // ── Attendance & Duty Requests ───────────────────────────────────────────────

  async recordAttendance(dto: RecordAttendanceDto) {
    const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!emp) throw new NotFoundException('Employee not found.');

    const attDate = new Date(dto.attendanceDate);

    return this.prisma.employeeAttendance.upsert({
      where: { employeeId_attendanceDate: { employeeId: dto.employeeId, attendanceDate: attDate } },
      create: {
        employeeId: dto.employeeId,
        attendanceDate: attDate,
        checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : new Date(),
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : undefined,
        status: dto.status || 'PRESENT',
        remarks: dto.remarks,
      },
      update: {
        checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : undefined,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : undefined,
        status: dto.status || 'PRESENT',
        remarks: dto.remarks,
      },
    });
  }

  async getAttendance(employeeId?: string, date?: string) {
    return this.prisma.employeeAttendance.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(date ? { attendanceDate: new Date(date) } : {}),
      },
      include: { employee: true },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async applyDutyRequest(data: { employeeId: string; dutyType: string; startDate: string; endDate: string; totalDays?: number; purpose: string }) {
    const requestNo = this.generateNumber('DTY');
    return this.prisma.dutyRequest.create({
      data: {
        requestNo,
        employeeId: data.employeeId,
        dutyType: data.dutyType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDays: data.totalDays ?? 1,
        purpose: data.purpose,
        status: 'SUBMITTED',
      },
      include: { employee: true },
    });
  }

  async getDutyRequests(employeeId?: string) {
    return this.prisma.dutyRequest.findMany({
      where: { ...(employeeId ? { employeeId } : {}) },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDutyRequest(id: string, approvedBy: string) {
    return this.prisma.dutyRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  // ── Leave Management & Holidays ─────────────────────────────────────────────

  async getLeaveTypes() {
    let types = await this.prisma.leaveType.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
    if (types.length === 0) {
      const defaults = [
        { code: 'CL', name: 'Casual Leave', maxDaysPerYear: 12, isCarryForward: false },
        { code: 'SL', name: 'Sick Leave', maxDaysPerYear: 10, isCarryForward: true },
        { code: 'EL', name: 'Earned / Privileged Leave', maxDaysPerYear: 15, isCarryForward: true },
        { code: 'ML', name: 'Maternity Leave', maxDaysPerYear: 180, isCarryForward: false },
        { code: 'PL', name: 'Paternity Leave', maxDaysPerYear: 15, isCarryForward: false },
      ];
      for (const t of defaults) {
        await this.prisma.leaveType.create({ data: t });
      }
      types = await this.prisma.leaveType.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
    }
    return types;
  }

  async applyLeave(dto: ApplyLeaveDto) {
    const emp = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!emp) throw new NotFoundException('Employee not found.');

    const appNo = this.generateNumber('LEV');

    return this.prisma.leaveApplication.create({
      data: {
        applicationNo: appNo,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalDays: dto.totalDays,
        reason: dto.reason,
        status: 'SUBMITTED',
      },
      include: { leaveType: true, employee: true },
    });
  }

  async getLeaveApplications(employeeId?: string, status?: string) {
    return this.prisma.leaveApplication.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status } : {}),
      },
      include: { employee: true, leaveType: true },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async approveLeave(id: string) {
    const leave = await this.prisma.leaveApplication.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave application not found.');

    return this.prisma.leaveApplication.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async getHolidays() {
    let holidays = await this.prisma.holiday.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { holidayDate: 'asc' },
    });
    if (holidays.length === 0) {
      const defaults = [
        { name: 'Independence Day', holidayDate: new Date('2026-08-15'), type: 'NATIONAL' },
        { name: 'Raksha Bandhan', holidayDate: new Date('2026-08-28'), type: 'FESTIVAL' },
        { name: 'Janmashtami', holidayDate: new Date('2026-09-04'), type: 'FESTIVAL' },
        { name: 'Gandhi Jayanti', holidayDate: new Date('2026-10-02'), type: 'NATIONAL' },
        { name: 'Diwali Break', holidayDate: new Date('2026-11-08'), type: 'FESTIVAL' },
      ];
      for (const h of defaults) {
        await this.prisma.holiday.create({ data: h });
      }
      holidays = await this.prisma.holiday.findMany({ where: { status: 'ACTIVE' }, orderBy: { holidayDate: 'asc' } });
    }
    return holidays;
  }

  // ── Performance Appraisal ───────────────────────────────────────────────────

  async getAppraisalCycles() {
    let cycles = await this.prisma.appraisalCycle.findMany({
      include: { reviews: { include: { employee: true } } },
      orderBy: { startDate: 'desc' },
    });
    if (cycles.length === 0) {
      const defaultCycle = await this.prisma.appraisalCycle.create({
        data: {
          name: 'Annual Performance Appraisal 2025-26',
          year: '2026-27',
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-06-30'),
          status: 'ACTIVE',
        },
      });
      cycles = [defaultCycle as any];
    }
    return cycles;
  }

  async submitAppraisalSelfReview(data: { appraisalCycleId: string; employeeId: string; selfAssessment: string; goalsAchieved: string; selfRating: number }) {
    return this.prisma.appraisalReview.upsert({
      where: { appraisalCycleId_employeeId: { appraisalCycleId: data.appraisalCycleId, employeeId: data.employeeId } },
      create: {
        appraisalCycleId: data.appraisalCycleId,
        employeeId: data.employeeId,
        selfAssessment: data.selfAssessment,
        goalsAchieved: data.goalsAchieved,
        selfRating: data.selfRating,
        status: 'REVIEW_PENDING',
      },
      update: {
        selfAssessment: data.selfAssessment,
        goalsAchieved: data.goalsAchieved,
        selfRating: data.selfRating,
        status: 'REVIEW_PENDING',
      },
    });
  }

  // ── Payroll & Payslips ──────────────────────────────────────────────────────

  async processPayroll(month: number, year: number) {
    const code = `PAY-${year}-${String(month).padStart(2, '0')}`;
    const employees = await this.prisma.employee.findMany({
      where: { employmentStatus: 'ACTIVE' },
      include: { salaryStructures: { where: { status: 'ACTIVE' } } },
    });

    return this.prisma.$transaction(async (tx) => {
      let period = await tx.payrollPeriod.findUnique({ where: { code } });
      if (!period) {
        period = await tx.payrollPeriod.create({
          data: {
            code,
            month,
            year,
            status: 'PROCESSED',
            processedAt: new Date(),
          },
        });
      }

      let totalGross = 0;
      let totalNet = 0;

      for (const emp of employees) {
        const sal = emp.salaryStructures[0];
        const basic = sal ? Number(sal.basicPay) : 45000;
        const hra = sal ? Number(sal.hra) : 15000;
        const allow = sal ? Number(sal.specialAllow) : 10000;
        const gross = basic + hra + allow;
        const pf = sal ? Number(sal.pfDeduction) : 3600;
        const tax = sal ? Number(sal.taxDeduction) : 2500;
        const deductions = pf + tax;
        const net = gross - deductions;

        totalGross += gross;
        totalNet += net;

        await tx.payrollRecord.upsert({
          where: { payrollPeriodId_employeeId: { payrollPeriodId: period.id, employeeId: emp.id } },
          create: {
            payrollPeriodId: period.id,
            employeeId: emp.id,
            basicPay: basic,
            allowances: hra + allow,
            deductions,
            grossSalary: gross,
            netSalary: net,
            paymentStatus: 'PAID',
            paidDate: new Date(),
          },
          update: {
            basicPay: basic,
            allowances: hra + allow,
            deductions,
            grossSalary: gross,
            netSalary: net,
            paymentStatus: 'PAID',
          },
        });

        const payslipNo = `PSL-${year}-${String(month).padStart(2, '0')}-${emp.employeeCode}`;
        await tx.payslip.upsert({
          where: { payslipNo },
          create: {
            payslipNo,
            payrollPeriodId: period.id,
            employeeId: emp.id,
            basic,
            hra,
            specialAllow: allow,
            pfDeduction: pf,
            taxDeduction: tax,
            grossAmount: gross,
            netAmount: net,
            paymentDate: new Date(),
            pdfUrl: `/payslips/${payslipNo}.pdf`,
          },
          update: {
            basic,
            hra,
            specialAllow: allow,
            pfDeduction: pf,
            taxDeduction: tax,
            grossAmount: gross,
            netAmount: net,
          },
        });
      }

      return tx.payrollPeriod.update({
        where: { id: period.id },
        data: { totalGross, totalNet, status: 'DISBURSED', disbursedAt: new Date() },
      });
    });
  }

  async getPayslips(employeeId?: string) {
    return this.prisma.payslip.findMany({
      where: { ...(employeeId ? { employeeId } : {}) },
      include: { employee: true, payrollPeriod: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  // ── Recruitment Pipeline ────────────────────────────────────────────────────

  async createJobRequisition(data: { departmentId: string; instituteId: string; positionTitle: string; vacanciesCount?: number; qualificationReq: string; minExperience?: number }) {
    const requisitionNo = this.generateNumber('REQ-HR');
    return this.prisma.jobRequisition.create({
      data: {
        requisitionNo,
        departmentId: data.departmentId,
        instituteId: data.instituteId,
        positionTitle: data.positionTitle,
        vacanciesCount: data.vacanciesCount ?? 1,
        qualificationReq: data.qualificationReq,
        minExperience: data.minExperience ?? 2,
        status: 'OPEN',
      },
    });
  }

  async getJobRequisitions() {
    return this.prisma.jobRequisition.findMany({
      include: { applications: { include: { interviews: true, offer: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyForJob(data: { jobRequisitionId: string; candidateName: string; email: string; phone: string; experienceYears: number; highestQual: string; resumeUrl?: string }) {
    return this.prisma.jobApplication.create({
      data: {
        jobRequisitionId: data.jobRequisitionId,
        candidateName: data.candidateName,
        email: data.email,
        phone: data.phone,
        experienceYears: data.experienceYears,
        highestQual: data.highestQual,
        resumeUrl: data.resumeUrl,
        status: 'APPLIED',
      },
    });
  }

  // ── Resignation & Exit ──────────────────────────────────────────────────────

  async submitResignation(data: { employeeId: string; requestedLWD: string; reason: string }) {
    const resignationNo = this.generateNumber('RES');
    return this.prisma.resignation.create({
      data: {
        resignationNo,
        employeeId: data.employeeId,
        requestedLWD: new Date(data.requestedLWD),
        reason: data.reason,
        status: 'SUBMITTED',
        clearance: {
          create: {},
        },
      },
      include: { employee: true, clearance: true },
    });
  }

  async getResignations() {
    return this.prisma.resignation.findMany({
      include: { employee: true, clearance: true },
      orderBy: { submissionDate: 'desc' },
    });
  }

  // ── Dashboard Metrics ───────────────────────────────────────────────────────

  async getHrDashboardMetrics() {
    const [
      totalEmployees,
      activeEmployees,
      onLeave,
      pendingLeaves,
      totalRequisitions,
      dutyRequestsCount,
      payslipsCount,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { employmentStatus: 'ACTIVE' } }),
      this.prisma.employeeAttendance.count({ where: { status: 'ON_LEAVE', attendanceDate: new Date() } }),
      this.prisma.leaveApplication.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.jobRequisition.count({ where: { status: 'OPEN' } }),
      this.prisma.dutyRequest.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.payslip.count(),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      onLeave,
      pendingLeaves,
      totalRequisitions,
      dutyRequestsCount,
      payslipsCount,
    };
  }
}
