import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './src/reports/reports.service';
import { PrismaService } from './src/prisma/prisma.service';
import {
  ReportModuleEnum,
  ReportTypeEnum,
  ReportExportFormatEnum,
} from './src/reports/dto/central-report.dto';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

async function runCentralReportsTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE CENTRALIZED REPORT MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    students: new Map<string, any>(),
    faculty: new Map<string, any>(),
    departments: new Map<string, any>(),
    workDiaries: new Map<string, any>(),
    examResults: new Map<string, any>(),
    admissions: new Map<string, any>(),
    inwards: new Map<string, any>(),
    outwards: new Map<string, any>(),
    hostelVisitors: new Map<string, any>(),
    vehicles: new Map<string, any>(),
    campusServices: new Map<string, any>(),
    edpDuties: new Map<string, any>(),
    feeAccounts: new Map<string, any>(),
    auditLogs: new Map<string, any>(),
  };

  // Seed sample data
  store.departments.set('dept-cse', { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' });
  store.students.set('stu-1', { id: 'stu-1', enrollmentNo: 'SSIU2026CSE001', firstName: 'Aarav', lastName: 'Patel', email: 'aarav@ssiu.edu.in', status: 'ACTIVE', departmentId: 'dept-cse' });
  store.students.set('stu-2', { id: 'stu-2', enrollmentNo: 'SSIU2026ECE002', firstName: 'Dev', lastName: 'Mehta', email: 'dev@ssiu.edu.in', status: 'ACTIVE', departmentId: 'dept-ece' });

  store.faculty.set('fac-1', { id: 'fac-1', employeeCode: 'EMP-001', firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh@ssiu.edu.in', designation: 'Professor', departmentId: 'dept-cse', status: 'ACTIVE' });

  store.workDiaries.set('wd-1', {
    id: 'wd-1',
    userId: 'usr-fac-1',
    workTitle: 'Conducted Lecture on DBMS Indexing',
    workDate: new Date('2026-08-15'),
    category: 'ACADEMIC',
    description: 'B.Tech CSE 4th Semester',
    priority: 'HIGH',
    status: 'APPROVED',
  });

  store.examResults.set('res-1', {
    id: 'res-1',
    examForm: { studentId: 'stu-1', student: store.students.get('stu-1'), exam: { name: 'Summer 2026 End-Term' } },
    subject: { code: 'CS401', name: 'DBMS' },
    marksObtained: 88,
    maxMarks: 100,
    grade: 'AA',
    gradePoints: 10,
    resultStatus: 'PUBLISHED',
  });

  store.admissions.set('inq-1', {
    id: 'inq-1',
    inquiryNo: 'INQ-2026-0001',
    applicantName: 'Rohan Shah',
    mobile: '9876543210',
    email: 'rohan@example.com',
    city: 'Ahmedabad',
    source: 'WEBSITE',
    counsellorUserId: 'usr-counselor-1',
    status: 'ADMITTED',
    createdAt: new Date('2026-08-10'),
  });

  store.inwards.set('inw-1', {
    id: 'inw-1',
    registerNo: 'INW-2026-000001',
    receivedDate: new Date('2026-08-12'),
    senderName: 'UGC Examination Directorate',
    senderOrganization: 'University Grants Commission',
    subject: 'Circular on Academic Bank of Credits',
    departmentId: 'dept-cse',
    priority: 'HIGH',
    status: 'RECEIVED',
  });

  store.outwards.set('out-1', {
    id: 'out-1',
    dispatchNo: 'OUT-2026-000001',
    dispatchDate: new Date('2026-08-14'),
    receiverName: 'Gujarat State Pharmacy Council',
    receiverOrganization: 'GSPC',
    subject: 'Student Verification Transcript',
    departmentId: 'dept-cse',
    mode: 'SPEED_POST',
    trackingNo: 'EM123456789IN',
    status: 'DELIVERED',
  });

  store.hostelVisitors.set('vis-1', {
    id: 'vis-1',
    passNumber: 'VIS-2026-000001',
    visitorName: 'Mahesh Patel',
    relation: 'Father',
    studentId: 'stu-1',
    student: store.students.get('stu-1'),
    hostel: { name: 'Boys Hostel A' },
    room: { roomNumber: '204' },
    checkInTime: new Date('2026-08-15T10:00:00Z'),
    checkOutTime: new Date('2026-08-15T12:00:00Z'),
    status: 'CHECKED_OUT',
    createdAt: new Date('2026-08-15'),
  });

  store.vehicles.set('veh-1', {
    id: 'veh-1',
    registrationNumber: 'GJ-01-AB-1234',
    vehicleType: 'BUS',
    makeModel: 'Tata Starbus 45-Seater',
    capacity: 45,
    fitnessExpiry: new Date('2027-01-01'),
    insuranceExpiry: new Date('2027-01-01'),
    status: 'ACTIVE',
    driverMappings: [{ status: 'ACTIVE', driver: { driverName: 'Ramesh Patel' } }],
    routeMappings: [{ status: 'ACTIVE', route: { routeName: 'Route 101: Gandhinagar Campus' } }],
  });

  store.campusServices.set('req-1', {
    id: 'req-1',
    requestNo: 'REQ-2026-000001',
    studentId: 'stu-1',
    student: store.students.get('stu-1'),
    service: { name: 'Bonafide Certificate' },
    subject: 'Need Bonafide for Passport Application',
    priority: 'URGENT',
    dueDate: new Date('2026-08-18'),
    status: 'RESOLVED',
    createdAt: new Date('2026-08-14'),
  });

  store.edpDuties.set('edp-1', {
    id: 'edp-1',
    dutyNo: 'EDP-2026-000001',
    dutyDate: new Date('2026-08-15'),
    classRoom: 'Room 302, Block B',
    subjectName: 'DBMS (CS401)',
    teachingFacultyId: 'fac-1',
    teachingFaculty: store.faculty.get('fac-1'),
    assignedOfficer: { username: 'edp_officer_1' },
    totalRegisteredStudents: 60,
    presentStudentCount: 54,
    studentAttendancePercentage: 90,
    teachingMethodology: 'PROJECTOR',
    status: 'VERIFIED',
  });

  store.feeAccounts.set('fee-1', {
    id: 'fee-1',
    studentId: 'stu-1',
    student: store.students.get('stu-1'),
    totalDue: 75000,
    totalPaid: 75000,
    balanceDue: 0,
    status: 'CLEARED',
  });

  const mockPrismaService = {
    student: {
      findFirst: async ({ where }: any) => {
        for (const s of store.students.values()) {
          if (where.OR?.some((cond: any) => cond.id === s.id || cond.email === s.email)) return s;
        }
        return null;
      },
      findMany: async () => Array.from(store.students.values()),
    },
    faculty: {
      findMany: async () => Array.from(store.faculty.values()),
    },
    department: {
      findMany: async () => Array.from(store.departments.values()),
    },
    workDiary: {
      findMany: async () => Array.from(store.workDiaries.values()),
    },
    examResult: {
      findMany: async ({ where }: any) => {
        let list = Array.from(store.examResults.values());
        if (where?.examForm?.studentId) {
          list = list.filter((r) => r.examForm?.studentId === where.examForm.studentId);
        }
        return list;
      },
    },
    admissionInquiry: {
      findMany: async () => Array.from(store.admissions.values()),
    },
    inwardRegister: {
      findMany: async () => Array.from(store.inwards.values()),
    },
    outwardRegister: {
      findMany: async () => Array.from(store.outwards.values()),
    },
    hostelVisitor: {
      findMany: async ({ where }: any) => {
        let list = Array.from(store.hostelVisitors.values());
        if (where?.studentId) list = list.filter((v) => v.studentId === where.studentId);
        return list;
      },
    },
    vehicle: {
      findMany: async () => Array.from(store.vehicles.values()),
    },
    studentServiceRequest: {
      findMany: async ({ where }: any) => {
        let list = Array.from(store.campusServices.values());
        if (where?.studentId) list = list.filter((s) => s.studentId === where.studentId);
        return list;
      },
    },
    edpDuty: {
      findMany: async () => Array.from(store.edpDuties.values()),
    },
    studentFeeAccount: {
      findMany: async ({ where }: any) => {
        let list = Array.from(store.feeAccounts.values());
        if (where?.studentId) list = list.filter((a) => a.studentId === where.studentId);
        return list;
      },
    },
    centralReportAuditLog: {
      create: async ({ data }: any) => {
        const id = 'audit-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, generatedAt: new Date() };
        store.auditLogs.set(id, record);
        return record;
      },
    },
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ReportsService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<ReportsService>(ReportsService);

  const userAdmin = { id: 'usr-admin', username: 'admin', role: 'SUPER_ADMIN', authorityLevel: 1 };
  const userStudent1 = { id: 'usr-stu-1', studentId: 'stu-1', email: 'aarav@ssiu.edu.in', role: 'STUDENT', authorityLevel: 10 };
  const userFaculty = { id: 'usr-fac-1', facultyId: 'fac-1', departmentId: 'dept-cse', role: 'FACULTY', authorityLevel: 5 };

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // ── 1. Module Reports Verification ────────────────────────────────────────
  console.log('--- 1. Verification of 10 ERP Domain Modules ---');

  // 1. Work Diary
  const wdReport: any = await service.generateReport(userFaculty, {
    module: ReportModuleEnum.WORK_DIARY,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('Work Diary report generated with columns and records', wdReport.records?.length >= 1 && wdReport.module === 'WORK_DIARY');

  // 2. Examination / Results
  const resReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.RESULTS,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('Examination & Results report generated with grades and marks', resReport.records?.length >= 1 && resReport.records[0].grade === 'AA');

  // 3. Admission
  const admReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.ADMISSION,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('Admission report generated with applicant lead pipeline', admReport.records?.length >= 1 && admReport.records[0].inquiryNo === 'INQ-2026-0001');

  // 4. Inward Register
  const inwReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.INWARD,
    reportType: ReportTypeEnum.DATE_WISE,
    format: 'JSON',
  });
  assert('Inward register report generated with sender and register numbers', inwReport.records?.length >= 1 && inwReport.records[0].registerNo === 'INW-2026-000001');

  // 5. Outward Register
  const outReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.OUTWARD,
    reportType: ReportTypeEnum.STATUS_WISE,
    format: 'JSON',
  });
  assert('Outward register report generated with dispatch and tracking numbers', outReport.records?.length >= 1 && outReport.records[0].trackingNo === 'EM123456789IN');

  // 6. Hostel Visitor
  const visReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.HOSTEL_VISITOR,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('Hostel visitor report generated with visitor pass numbers', visReport.records?.length >= 1 && visReport.records[0].passNumber === 'VIS-2026-000001');

  // 7. Transport
  const trnReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.TRANSPORT,
    reportType: ReportTypeEnum.DEPARTMENT_WISE,
    format: 'JSON',
  });
  assert('Transport fleet report generated with routes and drivers', trnReport.records?.length >= 1 && trnReport.records[0].registrationNumber === 'GJ-01-AB-1234');

  // 8. Campus Services
  const srvReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.CAMPUS_SERVICES,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('Campus services report generated with request numbers', srvReport.records?.length >= 1 && srvReport.records[0].requestNo === 'REQ-2026-000001');

  // 9. EDP Duty
  const edpReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.EDP_DUTY,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('EDP duty report generated with observed attendance', edpReport.records?.length >= 1 && edpReport.records[0].dutyNo === 'EDP-2026-000001');

  // 10. Master Directory & Fee Ledger
  const feeReport: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.FEES,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: 'JSON',
  });
  assert('Fee ledger report generated with balances', feeReport.records?.length >= 1 && feeReport.records[0].enrollmentNo === 'SSIU2026CSE001');

  // ── 2. Multi-Format Exporters ─────────────────────────────────────────────
  console.log('\n--- 2. Multi-Format Exporter Verification ---');

  // CSV Export
  const csvOut: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.EDP_DUTY,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: ReportExportFormatEnum.CSV,
  });
  assert('CSV export produced RFC 4180 format with headers and rows', csvOut.format === 'CSV' && csvOut.content.includes('"Duty No"') && csvOut.content.includes('EDP-2026-000001'));

  // EXCEL Export
  const xlsOut: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.TRANSPORT,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: ReportExportFormatEnum.EXCEL,
  });
  assert('Excel export produced tab-delimited spreadsheet table', xlsOut.format === 'EXCEL' && xlsOut.content.includes('Registration No\t') && xlsOut.filename.endsWith('.xls'));

  // HTML_PRINT Export
  const htmlOut: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.RESULTS,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: ReportExportFormatEnum.HTML_PRINT,
  });
  assert('Print-ready HTML output includes University letterhead and styles', htmlOut.format === 'HTML_PRINT' && htmlOut.content.includes('SWARRNIM STARTUP & INNOVATION UNIVERSITY') && htmlOut.content.includes('<table'));

  // PDF Export
  const pdfOut: any = await service.generateReport(userAdmin, {
    module: ReportModuleEnum.WORK_DIARY,
    reportType: ReportTypeEnum.FILTER_WISE,
    format: ReportExportFormatEnum.PDF,
  });
  assert('PDF export produced document payload with base64 binary encoding', pdfOut.format === 'PDF' && !!pdfOut.base64 && pdfOut.mimeType === 'application/pdf');

  // ── 3. Strict Permission & Data Privacy Scoping ───────────────────────────
  console.log('\n--- 3. Permission & Privacy Isolation Enforcement ---');

  let studentBlockedFromWorkDiary = false;
  try {
    await service.generateReport(userStudent1, {
      module: ReportModuleEnum.WORK_DIARY,
      reportType: ReportTypeEnum.FILTER_WISE,
    });
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403) studentBlockedFromWorkDiary = true;
  }
  assert('Student strictly blocked from accessing Work Diary reports with 403 Forbidden', studentBlockedFromWorkDiary);

  let studentBlockedFromEDP = false;
  try {
    await service.generateReport(userStudent1, {
      module: ReportModuleEnum.EDP_DUTY,
      reportType: ReportTypeEnum.FILTER_WISE,
    });
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403) studentBlockedFromEDP = true;
  }
  assert('Student strictly blocked from accessing EDP inspection reports with 403 Forbidden', studentBlockedFromEDP);

  let studentBlockedFromAdmission = false;
  try {
    await service.generateReport(userStudent1, {
      module: ReportModuleEnum.ADMISSION,
      reportType: ReportTypeEnum.FILTER_WISE,
    });
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403) studentBlockedFromAdmission = true;
  }
  assert('Student strictly blocked from accessing Admission pipeline reports with 403 Forbidden', studentBlockedFromAdmission);

  // Student results privacy
  const studentResults: any = await service.generateReport(userStudent1, {
    module: ReportModuleEnum.RESULTS,
    reportType: ReportTypeEnum.FILTER_WISE,
  });
  assert('Student only receives own authorized results in exam report', studentResults.records?.every((r: any) => r.enrollmentNo === 'SSIU2026CSE001'));

  // ── 4. Central Report Audit Trail Logging ──────────────────────────────────
  console.log('\n--- 4. Central Report Audit Trail Logging ---');
  assert('All report generations logged in CentralReportAuditLog table', store.auditLogs.size >= 14);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runCentralReportsTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
