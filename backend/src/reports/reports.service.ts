import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerateReportDto,
  ReportModuleEnum,
  ReportTypeEnum,
  ReportExportFormatEnum,
} from './dto/central-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helper: Resolve User Context & Module Authorization ───────────────────

  private async resolveUserContext(user: any) {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';
    const isPrincipal = roles.includes('PRINCIPAL') || user?.role === 'PRINCIPAL';
    const isRegistrar = roles.includes('REGISTRAR') || user?.role === 'REGISTRAR';
    const isDean = roles.includes('DEAN') || user?.role === 'DEAN';
    const isHOD = roles.includes('HOD') || user?.role === 'HOD';
    const isFaculty = roles.includes('FACULTY') || user?.role === 'FACULTY';
    const isStudent = roles.includes('STUDENT') || user?.role === 'STUDENT';
    const isExamCell = roles.includes('EXAM_CELL') || roles.includes('EXAM_CONTROLLER');

    let studentProfile: any = null;
    if (isStudent) {
      studentProfile = await this.prisma.student.findFirst({
        where: {
          OR: [
            { id: user.studentId || user.id },
            { erpId: user.erpId || user.id },
            { email: user.email || user.username },
          ],
        },
      });
    }

    return {
      userId: user.id,
      userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || 'User',
      roles,
      isSuperAdmin,
      isPrincipal,
      isRegistrar,
      isDean,
      isHOD,
      isFaculty,
      isStudent,
      isExamCell,
      studentId: studentProfile?.id,
      departmentId: user.departmentId || studentProfile?.departmentId,
      authorityLevel: user.authorityLevel ?? (isSuperAdmin ? 1 : isPrincipal ? 2 : isHOD ? 3 : isFaculty ? 5 : 10),
    };
  }

  // ── Central Report Generation Entrypoint ───────────────────────────────────

  async generateReport(user: any, dto: GenerateReportDto) {
    const ctx = await this.resolveUserContext(user);
    const module = dto.module.toUpperCase();
    const reportType = dto.reportType.toUpperCase();
    const format = (dto.format || 'JSON').toUpperCase();

    // 1. Fetch data based on module with strict authorization
    const reportResult = await this.fetchModuleData(ctx, dto);

    // 2. Format output
    const formattedOutput = this.formatReportOutput(reportResult, format, dto);

    // 3. Log to Central Report Audit Trail
    await this.prisma.centralReportAuditLog.create({
      data: {
        module,
        reportType,
        format,
        generatedByUserId: ctx.userId,
        filterParams: JSON.stringify({
          recordId: dto.recordId,
          departmentId: dto.departmentId,
          instituteId: dto.instituteId,
          userId: dto.userId,
          status: dto.status,
          startDate: dto.startDate,
          endDate: dto.endDate,
          search: dto.search,
        }),
        rowCount: reportResult.records.length,
      },
    });

    return formattedOutput;
  }

  // ── Core Module-Specific Data Fetchers with Scoping ────────────────────────

  private async fetchModuleData(ctx: any, dto: GenerateReportDto) {
    switch (dto.module.toUpperCase()) {
      case ReportModuleEnum.WORK_DIARY:
        return this.fetchWorkDiaryReport(ctx, dto);
      case ReportModuleEnum.EXAMINATION:
      case ReportModuleEnum.RESULTS:
        return this.fetchExamResultsReport(ctx, dto);
      case ReportModuleEnum.ADMISSION:
        return this.fetchAdmissionReport(ctx, dto);
      case ReportModuleEnum.INWARD:
        return this.fetchInwardReport(ctx, dto);
      case ReportModuleEnum.OUTWARD:
        return this.fetchOutwardReport(ctx, dto);
      case ReportModuleEnum.HOSTEL_VISITOR:
        return this.fetchHostelVisitorReport(ctx, dto);
      case ReportModuleEnum.TRANSPORT:
        return this.fetchTransportReport(ctx, dto);
      case ReportModuleEnum.CAMPUS_SERVICES:
        return this.fetchCampusServicesReport(ctx, dto);
      case ReportModuleEnum.EDP_DUTY:
        return this.fetchEdpDutyReport(ctx, dto);
      case ReportModuleEnum.STUDENTS:
        return this.fetchStudentsReport(ctx, dto);
      case ReportModuleEnum.FACULTY:
        return this.fetchFacultyReport(ctx, dto);
      case ReportModuleEnum.FEES:
        return this.fetchFeesReport(ctx, dto);
      default:
        throw new BadRequestException(`Unsupported report module: '${dto.module}'`);
    }
  }

  // ── 1. Work Diary Report ──────────────────────────────────────────────────

  private async fetchWorkDiaryReport(ctx: any, dto: GenerateReportDto) {
    const where: any = {};
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access Work Diary reports.');

    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal) {
      if (ctx.isHOD && ctx.departmentId) {
        where.departmentId = ctx.departmentId;
      } else {
        where.userId = ctx.userId;
      }
    } else if (dto.departmentId) {
      where.departmentId = dto.departmentId;
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.userId) where.userId = dto.userId;
    if (dto.status) where.status = dto.status.toUpperCase();
    if (dto.startDate || dto.endDate) {
      where.workDate = {};
      if (dto.startDate) where.workDate.gte = new Date(dto.startDate);
      if (dto.endDate) where.workDate.lte = new Date(dto.endDate);
    }

    const items = await this.prisma.workDiary.findMany({
      where,
      include: {
        user: { select: { username: true, faculty: { select: { firstName: true, lastName: true, department: true } } } },
      },
      orderBy: { workDate: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'workTitle', label: 'Work Title' },
      { key: 'workDate', label: 'Date' },
      { key: 'facultyName', label: 'Faculty / Staff' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((i: any) => ({
      workTitle: i.workTitle,
      workDate: i.workDate?.toISOString().split('T')[0],
      facultyName: i.user?.faculty ? `${i.user.faculty.firstName} ${i.user.faculty.lastName}` : i.user?.username || 'N/A',
      category: i.category,
      description: i.description || 'N/A',
      priority: i.priority,
      status: i.status,
    }));

    return {
      title: 'Work Diary Execution & Compliance Report',
      module: 'WORK_DIARY',
      columns,
      records,
      summary: {
        totalRecords: records.length,
      },
    };
  }

  // ── 2. Examination & Results Report ───────────────────────────────────────

  private async fetchExamResultsReport(ctx: any, dto: GenerateReportDto) {
    const where: any = {};

    // Strict student privacy: Student can ONLY see own published results
    if (ctx.isStudent) {
      if (!ctx.studentId) return { title: 'Exam Results Report', module: 'RESULTS', columns: [], records: [] };
      where.examForm = { studentId: ctx.studentId };
      where.resultStatus = 'PUBLISHED';
    } else if (dto.studentId) {
      where.examForm = { studentId: dto.studentId };
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.status && !ctx.isStudent) where.resultStatus = dto.status.toUpperCase();

    const items = await this.prisma.examResult.findMany({
      where,
      include: {
        examForm: { include: { student: { include: { department: true } }, exam: true } },
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'enrollmentNo', label: 'Enrollment No' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'examName', label: 'Examination' },
      { key: 'subjectCode', label: 'Subject Code' },
      { key: 'subjectName', label: 'Subject Name' },
      { key: 'marksObtained', label: 'Marks' },
      { key: 'maxMarks', label: 'Max Marks' },
      { key: 'grade', label: 'Grade' },
      { key: 'gradePoints', label: 'Grade Points' },
      { key: 'resultStatus', label: 'Status' },
    ];

    const records = items.map((r: any) => ({
      enrollmentNo: r.examForm?.student?.enrollmentNo || 'N/A',
      studentName: r.examForm?.student ? `${r.examForm.student.firstName} ${r.examForm.student.lastName}` : 'N/A',
      examName: r.examForm?.exam?.name || 'N/A',
      subjectCode: r.subject?.code || 'N/A',
      subjectName: r.subject?.name || 'N/A',
      marksObtained: Number(r.marksObtained || 0),
      maxMarks: Number(r.maxMarks || 100),
      grade: r.grade || 'N/A',
      gradePoints: Number(r.gradePoints || 0),
      resultStatus: r.resultStatus,
    }));

    return {
      title: 'University Examination & Results Report',
      module: 'RESULTS',
      columns,
      records,
      summary: {
        totalRecords: records.length,
        averageMarks: records.length > 0 ? Number((records.reduce((acc, r) => acc + r.marksObtained, 0) / records.length).toFixed(2)) : 0,
      },
    };
  }

  // ── 3. Admission Report ───────────────────────────────────────────────────

  private async fetchAdmissionReport(ctx: any, dto: GenerateReportDto) {
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access Admission reports.');

    const where: any = {};
    if (dto.recordId) where.id = dto.recordId;
    if (dto.status) where.status = dto.status.toUpperCase();
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const items = await this.prisma.admissionInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'inquiryNo', label: 'Inquiry No' },
      { key: 'applicantName', label: 'Applicant Name' },
      { key: 'email', label: 'Email' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'city', label: 'City' },
      { key: 'source', label: 'Lead Source' },
      { key: 'counsellorUserId', label: 'Counselor ID' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((i: any) => ({
      inquiryNo: i.inquiryNo,
      applicantName: i.applicantName,
      email: i.email || 'N/A',
      mobile: i.mobile,
      city: i.city || 'N/A',
      source: i.source,
      counsellorUserId: i.counsellorUserId || 'Unassigned',
      status: i.status,
    }));

    return {
      title: 'Admission Lead Conversion & Enrollment Report',
      module: 'ADMISSION',
      columns,
      records,
      summary: {
        totalLeads: records.length,
      },
    };
  }

  // ── 4. Inward Register Report ─────────────────────────────────────────────

  private async fetchInwardReport(ctx: any, dto: GenerateReportDto) {
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access Inward Register reports.');

    const where: any = {};
    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isRegistrar) {
      if (ctx.departmentId) where.departmentId = ctx.departmentId;
    } else if (dto.departmentId) {
      where.departmentId = dto.departmentId;
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.status) where.status = dto.status.toUpperCase();
    if (dto.startDate || dto.endDate) {
      where.receivedDate = {};
      if (dto.startDate) where.receivedDate.gte = new Date(dto.startDate);
      if (dto.endDate) where.receivedDate.lte = new Date(dto.endDate);
    }

    const items = await this.prisma.inwardRegister.findMany({
      where,
      include: { department: true, receivedBy: true },
      orderBy: { receivedDate: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'registerNo', label: 'Register No' },
      { key: 'receivedDate', label: 'Date' },
      { key: 'senderName', label: 'Sender' },
      { key: 'senderOrganization', label: 'Organization' },
      { key: 'subject', label: 'Subject' },
      { key: 'department', label: 'Department' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((i: any) => ({
      registerNo: i.registerNo,
      receivedDate: i.receivedDate?.toISOString().split('T')[0],
      senderName: i.senderName,
      senderOrganization: i.senderOrganization || 'N/A',
      subject: i.subject,
      department: i.department?.name || 'N/A',
      priority: i.priority,
      status: i.status,
    }));

    return {
      title: 'Inward Correspondence Register Report',
      module: 'INWARD',
      columns,
      records,
      summary: { totalRecords: records.length },
    };
  }

  // ── 5. Outward Register Report ────────────────────────────────────────────

  private async fetchOutwardReport(ctx: any, dto: GenerateReportDto) {
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access Outward Register reports.');

    const where: any = {};
    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isRegistrar) {
      if (ctx.departmentId) where.departmentId = ctx.departmentId;
    } else if (dto.departmentId) {
      where.departmentId = dto.departmentId;
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.status) where.status = dto.status.toUpperCase();
    if (dto.startDate || dto.endDate) {
      where.dispatchDate = {};
      if (dto.startDate) where.dispatchDate.gte = new Date(dto.startDate);
      if (dto.endDate) where.dispatchDate.lte = new Date(dto.endDate);
    }

    const items = await this.prisma.outwardRegister.findMany({
      where,
      include: { department: true, sentBy: true },
      orderBy: { dispatchDate: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'dispatchNo', label: 'Dispatch No' },
      { key: 'dispatchDate', label: 'Date' },
      { key: 'receiverName', label: 'Receiver' },
      { key: 'receiverOrganization', label: 'Organization' },
      { key: 'subject', label: 'Subject' },
      { key: 'department', label: 'Department' },
      { key: 'mode', label: 'Mode' },
      { key: 'trackingNo', label: 'Tracking No' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((o: any) => ({
      dispatchNo: o.dispatchNo,
      dispatchDate: o.dispatchDate?.toISOString().split('T')[0],
      receiverName: o.receiverName,
      receiverOrganization: o.receiverOrganization || 'N/A',
      subject: o.subject,
      department: o.department?.name || 'N/A',
      mode: o.mode,
      trackingNo: o.trackingNo || 'N/A',
      status: o.status,
    }));

    return {
      title: 'Outward Dispatch Register Report',
      module: 'OUTWARD',
      columns,
      records,
      summary: { totalDispatched: records.length },
    };
  }

  // ── 6. Hostel Visitor Report ──────────────────────────────────────────────

  private async fetchHostelVisitorReport(ctx: any, dto: GenerateReportDto) {
    const where: any = {};

    // Privacy rule
    if (ctx.isStudent) {
      if (!ctx.studentId) return { title: 'Hostel Visitor Report', module: 'HOSTEL_VISITOR', columns: [], records: [] };
      where.studentId = ctx.studentId;
    } else if (dto.studentId) {
      where.studentId = dto.studentId;
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.status) where.status = dto.status.toUpperCase();

    const items = await this.prisma.hostelVisitor.findMany({
      where,
      include: { student: true, hostel: true, room: true },
      orderBy: { createdAt: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'passNumber', label: 'Pass No' },
      { key: 'visitorName', label: 'Visitor Name' },
      { key: 'relation', label: 'Relation' },
      { key: 'studentName', label: 'Student' },
      { key: 'hostel', label: 'Hostel' },
      { key: 'room', label: 'Room' },
      { key: 'checkInTime', label: 'Check-In' },
      { key: 'checkOutTime', label: 'Check-Out' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((v: any) => ({
      passNumber: v.passNumber || 'N/A',
      visitorName: v.visitorName,
      relation: v.relation,
      studentName: v.student ? `${v.student.firstName} ${v.student.lastName}` : 'N/A',
      hostel: v.hostel?.name || 'N/A',
      room: v.room?.roomNumber || 'N/A',
      checkInTime: v.checkInTime ? v.checkInTime.toISOString() : 'Pending',
      checkOutTime: v.checkOutTime ? v.checkOutTime.toISOString() : 'Inside',
      status: v.status,
    }));

    return {
      title: 'Hostel Visitor Surveillance & Gate Pass Report',
      module: 'HOSTEL_VISITOR',
      columns,
      records,
      summary: { totalVisitors: records.length },
    };
  }

  // ── 7. Transport Report ───────────────────────────────────────────────────

  private async fetchTransportReport(ctx: any, dto: GenerateReportDto) {
    const where: any = {};
    if (dto.status) where.status = dto.status.toUpperCase();

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
        routeMappings: { where: { status: 'ACTIVE' }, include: { route: true } },
      },
      orderBy: { registrationNumber: 'asc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'registrationNumber', label: 'Registration No' },
      { key: 'vehicleType', label: 'Vehicle Type' },
      { key: 'makeModel', label: 'Make / Model' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'driver', label: 'Primary Driver' },
      { key: 'route', label: 'Assigned Route' },
      { key: 'fitnessExpiry', label: 'Fitness Expiry' },
      { key: 'insuranceExpiry', label: 'Insurance Expiry' },
      { key: 'status', label: 'Status' },
    ];

    const records = vehicles.map((v: any) => ({
      registrationNumber: v.registrationNumber,
      vehicleType: v.vehicleType,
      makeModel: v.makeModel,
      capacity: v.capacity,
      driver: v.driverMappings[0]?.driver?.driverName || 'Unassigned',
      route: v.routeMappings[0]?.route?.routeName || 'Unassigned',
      fitnessExpiry: v.fitnessExpiry ? v.fitnessExpiry.toISOString().split('T')[0] : 'N/A',
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.toISOString().split('T')[0] : 'N/A',
      status: v.status,
    }));

    return {
      title: 'University Fleet & Transit Operations Report',
      module: 'TRANSPORT',
      columns,
      records,
      summary: {
        totalVehicles: records.length,
        totalFleetCapacity: records.reduce((acc, r) => acc + r.capacity, 0),
      },
    };
  }

  // ── 8. Campus Services Report ─────────────────────────────────────────────

  private async fetchCampusServicesReport(ctx: any, dto: GenerateReportDto) {
    const where: any = {};

    // Privacy rule
    if (ctx.isStudent) {
      if (!ctx.studentId) return { title: 'Campus Services Report', module: 'CAMPUS_SERVICES', columns: [], records: [] };
      where.studentId = ctx.studentId;
    } else if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal) {
      if (ctx.departmentId) where.departmentId = ctx.departmentId;
    } else if (dto.departmentId) {
      where.departmentId = dto.departmentId;
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.status) where.status = dto.status.toUpperCase();

    const items = await this.prisma.studentServiceRequest.findMany({
      where,
      include: { student: true, service: true, department: true },
      orderBy: { createdAt: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'requestNo', label: 'Request No' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'service', label: 'Service' },
      { key: 'subject', label: 'Subject' },
      { key: 'department', label: 'Department' },
      { key: 'priority', label: 'Priority' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((r: any) => ({
      requestNo: r.requestNo,
      studentName: r.student ? `${r.student.firstName} ${r.student.lastName}` : 'N/A',
      service: r.service?.name || 'N/A',
      subject: r.subject || r.purpose || 'N/A',
      department: r.department?.name || 'N/A',
      priority: r.priority,
      dueDate: r.dueDate ? r.dueDate.toISOString().split('T')[0] : 'N/A',
      status: r.status,
    }));

    return {
      title: 'Digital Campus Service Desk Request Report',
      module: 'CAMPUS_SERVICES',
      columns,
      records,
      summary: { totalRequests: records.length },
    };
  }

  // ── 9. EDP Duty Report ────────────────────────────────────────────────────

  private async fetchEdpDutyReport(ctx: any, dto: GenerateReportDto) {
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access EDP Duty reports.');

    const where: any = {};
    if (ctx.authorityLevel > 3 && !ctx.isSuperAdmin && !ctx.isPrincipal && !ctx.isDean) {
      if (ctx.departmentId) where.departmentId = ctx.departmentId;
    } else if (dto.departmentId) {
      where.departmentId = dto.departmentId;
    }

    if (dto.recordId) where.id = dto.recordId;
    if (dto.status) where.status = dto.status.toUpperCase();
    if (dto.startDate || dto.endDate) {
      where.dutyDate = {};
      if (dto.startDate) where.dutyDate.gte = new Date(dto.startDate);
      if (dto.endDate) where.dutyDate.lte = new Date(dto.endDate);
    }

    const items = await this.prisma.edpDuty.findMany({
      where,
      include: { department: true, assignedOfficer: true, teachingFaculty: true },
      orderBy: { dutyDate: 'desc' },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'dutyNo', label: 'Duty No' },
      { key: 'dutyDate', label: 'Date' },
      { key: 'classRoom', label: 'Class Room' },
      { key: 'subjectName', label: 'Subject' },
      { key: 'teachingFaculty', label: 'Teaching Faculty' },
      { key: 'assignedOfficer', label: 'EDP Officer' },
      { key: 'attendance', label: 'Observed Attendance' },
      { key: 'methodology', label: 'Methodology' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((d: any) => ({
      dutyNo: d.dutyNo,
      dutyDate: d.dutyDate?.toISOString().split('T')[0],
      classRoom: d.classRoom,
      subjectName: d.subjectName || 'N/A',
      teachingFaculty: d.teachingFaculty ? `${d.teachingFaculty.firstName} ${d.teachingFaculty.lastName}` : d.teachingFacultyName || 'N/A',
      assignedOfficer: d.assignedOfficer?.username || 'N/A',
      attendance: `${d.presentStudentCount}/${d.totalRegisteredStudents} (${d.studentAttendancePercentage || 0}%)`,
      methodology: d.teachingMethodology || 'N/A',
      status: d.status,
    }));

    return {
      title: 'EDP Academic Surveillance & Lecture Inspection Report',
      module: 'EDP_DUTY',
      columns,
      records,
      summary: { totalInspections: records.length },
    };
  }

  // ── 10. Master Directory Reports (Students, Faculty, Fees) ────────────────

  private async fetchStudentsReport(ctx: any, dto: GenerateReportDto) {
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access Student Directory reports.');

    const where: any = {};
    if (dto.departmentId) where.departmentId = dto.departmentId;
    if (dto.instituteId) where.instituteId = dto.instituteId;

    const items = await this.prisma.student.findMany({
      where,
      include: { institute: true, department: true, batch: true },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'enrollmentNo', label: 'Enrollment No' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'institute', label: 'Institute' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((s: any) => ({
      enrollmentNo: s.enrollmentNo,
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      department: s.department?.name || 'N/A',
      institute: s.institute?.name || 'N/A',
      status: s.status,
    }));

    return {
      title: 'University Student Master Directory Report',
      module: 'STUDENTS',
      columns,
      records,
      summary: { totalStudents: records.length },
    };
  }

  private async fetchFacultyReport(ctx: any, dto: GenerateReportDto) {
    if (ctx.isStudent) throw new ForbiddenException('Students cannot access Faculty Directory reports.');

    const where: any = {};
    if (dto.departmentId) where.departmentId = dto.departmentId;

    const items = await this.prisma.faculty.findMany({
      where,
      include: { institute: true, department: true },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'employeeCode', label: 'Employee Code' },
      { key: 'name', label: 'Faculty Name' },
      { key: 'email', label: 'Email' },
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((f: any) => ({
      employeeCode: f.employeeCode,
      name: `${f.firstName} ${f.lastName}`,
      email: f.email,
      designation: f.designation || 'Faculty',
      department: f.department?.name || 'N/A',
      status: f.status,
    }));

    return {
      title: 'Faculty Master Directory Report',
      module: 'FACULTY',
      columns,
      records,
      summary: { totalFaculty: records.length },
    };
  }

  private async fetchFeesReport(ctx: any, dto: GenerateReportDto) {
    const where: any = {};
    if (ctx.isStudent) {
      if (!ctx.studentId) return { title: 'Fee Account Report', module: 'FEES', columns: [], records: [] };
      where.studentId = ctx.studentId;
    }

    const items = await this.prisma.studentFeeAccount.findMany({
      where,
      include: { student: true },
      take: dto.limit || 100,
    });

    const columns = [
      { key: 'enrollmentNo', label: 'Enrollment No' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'totalDue', label: 'Total Due' },
      { key: 'totalPaid', label: 'Total Paid' },
      { key: 'balanceDue', label: 'Balance Due' },
      { key: 'status', label: 'Status' },
    ];

    const records = items.map((a: any) => ({
      enrollmentNo: a.student?.enrollmentNo || 'N/A',
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'N/A',
      totalDue: Number(a.totalDue || 0),
      totalPaid: Number(a.totalPaid || 0),
      balanceDue: Number(a.balanceDue || 0),
      status: a.status,
    }));

    return {
      title: 'Student Fee Dues & Ledger Account Report',
      module: 'FEES',
      columns,
      records,
      summary: {
        totalAccounts: records.length,
        totalDueSum: records.reduce((acc, r) => acc + r.totalDue, 0),
        totalBalanceSum: records.reduce((acc, r) => acc + r.balanceDue, 0),
      },
    };
  }

  // ── Output Formatters: JSON, CSV, Excel, PDF, HTML_PRINT ──────────────────

  private formatReportOutput(report: any, format: string, dto: GenerateReportDto) {
    const timestamp = new Date().toISOString();
    const columns = report.columns || [];
    const records = report.records || [];

    switch (format) {
      case ReportExportFormatEnum.CSV: {
        const headerRow = columns.map((c: any) => `"${c.label}"`).join(',');
        const dataRows = records.map((r: any) =>
          columns
            .map((c: any) => {
              const val = r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '';
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        );
        const csvContent = [headerRow, ...dataRows].join('\n');
        return {
          reportTitle: report.title,
          module: report.module,
          format: 'CSV',
          mimeType: 'text/csv',
          filename: `${report.module.toLowerCase()}_report_${Date.now()}.csv`,
          content: csvContent,
          totalRows: records.length,
          generatedAt: timestamp,
        };
      }

      case ReportExportFormatEnum.EXCEL: {
        // Tab-separated or structured TSV for Excel compatibility
        const headerRow = columns.map((c: any) => c.label).join('\t');
        const dataRows = records.map((r: any) =>
          columns.map((c: any) => (r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '')).join('\t')
        );
        const tsvContent = [headerRow, ...dataRows].join('\n');
        return {
          reportTitle: report.title,
          module: report.module,
          format: 'EXCEL',
          mimeType: 'application/vnd.ms-excel',
          filename: `${report.module.toLowerCase()}_report_${Date.now()}.xls`,
          content: tsvContent,
          totalRows: records.length,
          generatedAt: timestamp,
        };
      }

      case ReportExportFormatEnum.HTML_PRINT:
      case ReportExportFormatEnum.PDF: {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${report.title}</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #1e293b; }
    .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
    .university-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
    .university-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
    .report-title { font-size: 16px; font-weight: 600; color: #0369a1; margin-top: 10px; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background: #f1f5f9; color: #334155; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="university-title">SWARRNIM STARTUP & INNOVATION UNIVERSITY</div>
    <div class="university-subtitle">University Digital ERP System — Centralized Reporting Gateway</div>
    <div class="report-title">${report.title}</div>
  </div>
  <div class="meta-bar">
    <span><strong>Module:</strong> ${report.module}</span>
    <span><strong>Generated At:</strong> ${timestamp}</span>
    <span><strong>Total Records:</strong> ${records.length}</span>
  </div>
  <table>
    <thead>
      <tr>${columns.map((c: any) => `<th>${c.label}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${records
        .map(
          (r: any) => `<tr>${columns.map((c: any) => `<td>${r[c.key] !== undefined && r[c.key] !== null ? r[c.key] : ''}</td>`).join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
  <div class="footer">
    This is an authorized system-generated report from SSIU ERP. Verification Hash: SSIU-REP-${Date.now().toString(36).toUpperCase()}
  </div>
</body>
</html>`;

        return {
          reportTitle: report.title,
          module: report.module,
          format,
          mimeType: format === 'PDF' ? 'application/pdf' : 'text/html',
          filename: `${report.module.toLowerCase()}_report_${Date.now()}.${format === 'PDF' ? 'pdf' : 'html'}`,
          content: html,
          base64: Buffer.from(html).toString('base64'),
          totalRows: records.length,
          generatedAt: timestamp,
        };
      }

      case ReportExportFormatEnum.JSON:
      default:
        return {
          reportTitle: report.title,
          module: report.module,
          format: 'JSON',
          columns,
          records,
          summary: report.summary || { totalRecords: records.length },
          totalRows: records.length,
          generatedAt: timestamp,
        };
    }
  }

  // ── Existing Helper Methods (for backwards compatibility) ──────────────────

  async getStudentReport(instituteId?: string, departmentId?: string) {
    return this.generateReport({ id: 'sys-admin', role: 'SUPER_ADMIN' }, {
      module: ReportModuleEnum.STUDENTS,
      reportType: ReportTypeEnum.FILTER_WISE,
      format: 'JSON',
      instituteId,
      departmentId,
    });
  }

  async getFacultyReport(instituteId?: string, departmentId?: string) {
    return this.generateReport({ id: 'sys-admin', role: 'SUPER_ADMIN' }, {
      module: ReportModuleEnum.FACULTY,
      reportType: ReportTypeEnum.FILTER_WISE,
      format: 'JSON',
      instituteId,
      departmentId,
    });
  }

  async getFeeDuesReport() {
    return this.generateReport({ id: 'sys-admin', role: 'SUPER_ADMIN' }, {
      module: ReportModuleEnum.FEES,
      reportType: ReportTypeEnum.FILTER_WISE,
      format: 'JSON',
    });
  }

  async getExamResultsReport(examId?: string) {
    return this.generateReport({ id: 'sys-admin', role: 'SUPER_ADMIN' }, {
      module: ReportModuleEnum.RESULTS,
      reportType: ReportTypeEnum.FILTER_WISE,
      format: 'JSON',
    });
  }

  async exportReport(reportType: string, format: string = 'JSON') {
    return this.generateReport({ id: 'sys-admin', role: 'SUPER_ADMIN' }, {
      module: reportType.toUpperCase(),
      reportType: ReportTypeEnum.FILTER_WISE,
      format: format.toUpperCase(),
    });
  }
}
