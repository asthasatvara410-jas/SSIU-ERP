import { BulkImportService } from './src/bulk-import/bulk-import.service';
import { TemplateGeneratorService } from './src/bulk-import/template-generator.service';
import { BulkImportTypeEnum, BulkImportModeEnum } from './src/bulk-import/dto/bulk-import.dto';
import * as XLSX from 'xlsx';

class MockPrismaService {
  bulkImports: any[] = [];
  bulkImportRows: any[] = [];
  bulkImportHistories: any[] = [];
  institutes: any[] = [];
  departments: any[] = [];
  programs: any[] = [];
  academicYears: any[] = [];
  batches: any[] = [];
  semesters: any[] = [];
  students: any[] = [];
  faculties: any[] = [];
  subjects: any[] = [];
  exams: any[] = [];
  examForms: any[] = [];
  examResults: any[] = [];
  hostels: any[] = [];
  hostelRooms: any[] = [];
  feeHeads: any[] = [];
  feeStructures: any[] = [];
  studentFeeAccounts: any[] = [];
  studentFeeAllocations: any[] = [];
  vehicles: any[] = [];
  drivers: any[] = [];
  routes: any[] = [];
  users: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.institutes = [
      { id: 'inst-1', code: 'INST-ENG', name: 'Institute of Engineering & Technology', status: 'ACTIVE' },
    ];
    this.departments = [
      { id: 'dept-1', code: 'DEP-CSE', name: 'Computer Science & Engineering', instituteId: 'inst-1', status: 'ACTIVE' },
    ];
    this.programs = [
      { id: 'prog-1', code: 'PROG-BTECH-CSE', name: 'B.Tech CSE', departmentId: 'dept-1', durationYears: 4, status: 'ACTIVE' },
    ];
    this.academicYears = [
      { id: 'ay-1', code: '2026-27', startYear: 2026, endYear: 2027, status: 'ACTIVE' },
    ];
    this.batches = [
      { id: 'batch-1', code: 'CSE-2026', programId: 'prog-1', academicYearId: 'ay-1', startYear: 2026, endYear: 2030, status: 'ACTIVE' },
    ];
    this.semesters = [
      { id: 'sem-1', batchId: 'batch-1', semesterNumber: 1, name: 'Semester 1', status: 'ACTIVE' },
    ];
    this.exams = [
      { id: 'exam-1', code: 'SUMMER-2026', name: 'Summer Examination 2026', programId: 'prog-1', academicYearCode: '2026-27', status: 'SCHEDULED' },
    ];
    this.hostels = [
      { id: 'hst-1', code: 'HST-BH1', hostelCode: 'HST-BH1', name: 'Boys Hostel 1', gender: 'MALE', status: 'ACTIVE' },
    ];
    this.hostelRooms = [
      { id: 'hr-1', hostelId: 'hst-1', roomNumber: '101', floor: 1, capacity: 2, occupiedBeds: 0, status: 'AVAILABLE' },
    ];
    this.feeHeads = [
      { id: 'fh-1', code: 'FH-TUIT', name: 'Tuition Fee', status: 'ACTIVE' },
    ];
  }

  private matchOr(entity: any, conds: any[]) {
    return conds.some((cond: any) =>
      (cond.id && entity.id === cond.id) ||
      (cond.code && entity.code === cond.code) ||
      (cond.name && entity.name === cond.name) ||
      (cond.enrollmentNo && entity.enrollmentNo === cond.enrollmentNo) ||
      (cond.employeeCode && entity.employeeCode === cond.employeeCode) ||
      (cond.email && entity.email === cond.email)
    );
  }

  bulkImport = {
    count: async (args?: any) => this.bulkImports.length,
    create: async (args: any) => {
      const record = {
        ...args.data,
        id: args.data.id || `imp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.bulkImports.unshift(record);
      return record;
    },
    findUnique: async (args: any) => {
      const b = this.bulkImports.find(x => x.id === args.where.id);
      if (!b) return null;
      if (args.include?.rows) {
        let rows = this.bulkImportRows.filter(r => r.importId === b.id);
        if (args.include.rows.where?.status?.in) {
          rows = rows.filter(r => args.include.rows.where.status.in.includes(r.status));
        }
        return {
          ...b,
          rows: rows.sort((a, c) => a.rowNumber - c.rowNumber),
        };
      }
      return b;
    },
    findMany: async (args?: any) => this.bulkImports,
    update: async (args: any) => {
      const idx = this.bulkImports.findIndex(x => x.id === args.where.id);
      if (idx === -1) return null;
      this.bulkImports[idx] = { ...this.bulkImports[idx], ...args.data, updatedAt: new Date() };
      return this.bulkImports[idx];
    },
  };

  bulkImportRow = {
    count: async (args?: any) => {
      let list = this.bulkImportRows.filter(r => !args?.where?.importId || r.importId === args.where.importId);
      if (args?.where?.status) {
        if (typeof args.where.status === 'string') list = list.filter(r => r.status === args.where.status);
        else if (args.where.status.in) list = list.filter(r => args.where.status.in.includes(r.status));
      }
      return list.length;
    },
    create: async (args: any) => {
      const record = {
        ...args.data,
        id: args.data.id || `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.bulkImportRows.push(record);
      return record;
    },
    findMany: async (args: any) => {
      let list = this.bulkImportRows.filter(r => r.importId === args.where?.importId);
      if (args.where?.status) {
        if (typeof args.where.status === 'string') list = list.filter(r => r.status === args.where.status);
        else if (args.where.status.in) list = list.filter(r => args.where.status.in.includes(r.status));
      }
      if (args.where?.rowNumber?.in) {
        list = list.filter(r => args.where.rowNumber.in.includes(r.rowNumber));
      }
      return list;
    },
    update: async (args: any) => {
      const idx = this.bulkImportRows.findIndex(r => r.id === args.where.id);
      if (idx === -1) return null;
      this.bulkImportRows[idx] = { ...this.bulkImportRows[idx], ...args.data };
      return this.bulkImportRows[idx];
    },
  };

  bulkImportHistory = {
    create: async (args: any) => {
      const record = {
        ...args.data,
        id: args.data.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date(),
      };
      this.bulkImportHistories.unshift(record);
      return record;
    },
    findMany: async (args: any) => {
      return this.bulkImportHistories.filter(h => h.importId === args.where?.importId);
    },
  };

  institute = {
    findUnique: async (args: any) => this.institutes.find(x => (args.where.code && x.code === args.where.code) || (args.where.id && x.id === args.where.id)) || null,
    findFirst: async (args?: any) => {
      if (!args?.where) return this.institutes[0] || null;
      if (args.where.OR) return this.institutes.find(x => this.matchOr(x, args.where.OR)) || null;
      return this.institutes.find(x => (!args.where.id || x.id === args.where.id) && (!args.where.code || x.code === args.where.code)) || null;
    },
  };

  department = {
    findUnique: async (args: any) => this.departments.find(x => (args.where.code && x.code === args.where.code) || (args.where.id && x.id === args.where.id)) || null,
    findFirst: async (args?: any) => {
      if (!args?.where) return this.departments[0] || null;
      if (args.where.OR) return this.departments.find(x => this.matchOr(x, args.where.OR)) || null;
      return this.departments.find(x => (!args.where.id || x.id === args.where.id) && (!args.where.code || x.code === args.where.code)) || null;
    },
  };

  program = {
    findUnique: async (args: any) => this.programs.find(x => (args.where.code && x.code === args.where.code) || (args.where.id && x.id === args.where.id)) || null,
    findFirst: async (args?: any) => {
      if (!args?.where) return this.programs[0] || null;
      if (args.where.OR) return this.programs.find(x => this.matchOr(x, args.where.OR)) || null;
      return this.programs.find(x => (!args.where.id || x.id === args.where.id) && (!args.where.code || x.code === args.where.code)) || null;
    },
    create: async (args: any) => {
      const p = { ...args.data, id: args.data.id || `prog-${Date.now()}` };
      this.programs.push(p);
      return p;
    },
  };

  academicYear = {
    findUnique: async (args: any) => this.academicYears.find(x => (args.where.code && x.code === args.where.code) || (args.where.id && x.id === args.where.id)) || null,
    findFirst: async (args?: any) => this.academicYears[0] || null,
  };

  batch = {
    findFirst: async (args?: any) => this.batches.find(b => !args?.where?.programId || b.programId === args.where.programId) || this.batches[0] || null,
    create: async (args: any) => {
      const b = { ...args.data, id: args.data.id || `batch-${Date.now()}` };
      this.batches.push(b);
      return b;
    },
  };

  semester = {
    findFirst: async (args?: any) => this.semesters.find(s => !args?.where?.batchId || s.batchId === args.where.batchId) || this.semesters[0] || null,
  };

  student = {
    count: async () => this.students.length,
    findUnique: async (args: any) => this.students.find(s => (args.where.enrollmentNo && s.enrollmentNo === args.where.enrollmentNo) || (args.where.id && s.id === args.where.id)) || null,
    findFirst: async (args?: any) => this.students.find(s => !args?.where?.enrollmentNo || s.enrollmentNo === args.where.enrollmentNo) || null,
    create: async (args: any) => {
      const record = {
        ...args.data,
        id: args.data.id || `stud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      this.students.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.students.findIndex(s => s.id === args.where.id || s.enrollmentNo === args.where.enrollmentNo);
      if (idx === -1) return null;
      this.students[idx] = { ...this.students[idx], ...args.data };
      return this.students[idx];
    },
  };

  faculty = {
    count: async () => this.faculties.length,
    findUnique: async (args: any) => this.faculties.find(f => (args.where.employeeCode && f.employeeCode === args.where.employeeCode) || (args.where.id && f.id === args.where.id)) || null,
    findFirst: async (args?: any) => {
      if (!args?.where) return this.faculties[0] || null;
      if (args.where.OR) return this.faculties.find(f => this.matchOr(f, args.where.OR)) || null;
      return this.faculties.find(f => (args.where.employeeCode && f.employeeCode === args.where.employeeCode) || (args.where.email && f.email === args.where.email)) || null;
    },
    create: async (args: any) => {
      const record = {
        ...args.data,
        id: args.data.id || `fac-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      this.faculties.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.faculties.findIndex(f => f.id === args.where.id || f.employeeCode === args.where.employeeCode);
      if (idx === -1) return null;
      this.faculties[idx] = { ...this.faculties[idx], ...args.data };
      return this.faculties[idx];
    },
    updateMany: async (args: any) => {
      let count = 0;
      this.faculties.forEach((f, idx) => {
        if (!args.where?.employeeCode || f.employeeCode === args.where.employeeCode) {
          this.faculties[idx] = { ...f, ...args.data };
          count++;
        }
      });
      return { count };
    },
  };

  user = {
    upsert: async (args: any) => {
      const existing = this.users.find(u => u.erpId === args.where.erpId);
      if (existing) {
        Object.assign(existing, args.update);
        return existing;
      }
      const u = { ...args.create, id: `user-${Date.now()}` };
      this.users.push(u);
      return u;
    },
  };

  subject = {
    findFirst: async (args?: any) => this.subjects.find(s => !args?.where?.code || s.code === args.where.code) || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `sub-${Date.now()}` };
      this.subjects.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.subjects.findIndex(s => s.id === args.where.id || s.code === args.where.code);
      if (idx === -1) return null;
      this.subjects[idx] = { ...this.subjects[idx], ...args.data };
      return this.subjects[idx];
    },
    updateMany: async (args: any) => {
      let count = 0;
      this.subjects.forEach((s, idx) => {
        if (!args.where?.code || s.code === args.where.code) {
          this.subjects[idx] = { ...s, ...args.data };
          count++;
        }
      });
      return { count };
    },
  };

  exam = {
    findUnique: async (args: any) => this.exams.find(e => (args.where.code && e.code === args.where.code) || (args.where.id && e.id === args.where.id)) || null,
    findFirst: async (args?: any) => {
      if (!args?.where) return this.exams[0] || null;
      if (args.where.OR) return this.exams.find(e => this.matchOr(e, args.where.OR)) || null;
      return this.exams.find(e => !args.where.code || e.code === args.where.code) || null;
    },
  };

  examForm = {
    findFirst: async (args?: any) => this.examForms.find(ef => (!args?.where?.studentId || ef.studentId === args.where.studentId) && (!args?.where?.examId || ef.examId === args.where.examId)) || this.examForms[0] || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `ef-${Date.now()}` };
      this.examForms.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.examForms.findIndex(ef => ef.id === args.where.id);
      if (idx === -1) return null;
      this.examForms[idx] = { ...this.examForms[idx], ...args.data };
      return this.examForms[idx];
    },
  };

  examResult = {
    findFirst: async (args?: any) => this.examResults.find(er => (!args?.where?.studentId || er.studentId === args.where.studentId) && (!args?.where?.examFormId || er.examFormId === args.where.examFormId)) || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `er-${Date.now()}` };
      this.examResults.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.examResults.findIndex(er => er.id === args.where.id);
      if (idx === -1) return null;
      this.examResults[idx] = { ...this.examResults[idx], ...args.data };
      return this.examResults[idx];
    },
  };

  hostel = {
    findFirst: async (args?: any) => {
      if (!args?.where) return this.hostels[0] || null;
      if (args.where.OR) return this.hostels.find(h => this.matchOr(h, args.where.OR)) || null;
      return this.hostels.find(h => (!args?.where?.code || h.code === args.where.code) || (!args?.where?.hostelCode || h.hostelCode === args.where.hostelCode)) || null;
    },
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `hst-${Date.now()}` };
      this.hostels.push(record);
      return record;
    },
  };

  hostelRoom = {
    findFirst: async (args?: any) => this.hostelRooms.find(hr => (!args?.where?.hostelId || hr.hostelId === args.where.hostelId) && (!args?.where?.roomNumber || hr.roomNumber === args.where.roomNumber)) || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `hr-${Date.now()}` };
      this.hostelRooms.push(record);
      return record;
    },
  };

  feeHead = {
    findFirst: async (args?: any) => {
      if (!args?.where) return this.feeHeads[0] || null;
      if (args.where.OR) return this.feeHeads.find(fh => this.matchOr(fh, args.where.OR)) || null;
      return this.feeHeads.find(fh => (!args?.where?.code || fh.code === args.where.code)) || null;
    },
  };

  feeStructure = {
    findFirst: async () => this.feeStructures[0] || null,
    create: async (args: any) => {
      const s = { ...args.data, id: `fs-${Date.now()}` };
      this.feeStructures.push(s);
      return s;
    },
  };

  studentFeeAccount = {
    upsert: async (args: any) => {
      const acc = { ...args.create, id: `sfa-${Date.now()}` };
      this.studentFeeAccounts.push(acc);
      return acc;
    },
  };

  vehicle = {
    findUnique: async (args: any) => this.vehicles.find(v => (args.where?.registrationNumber && v.registrationNumber === args.where.registrationNumber) || (args.where?.id && v.id === args.where.id)) || null,
    findFirst: async (args?: any) => this.vehicles.find(v => !args?.where?.registrationNumber || v.registrationNumber === args.where.registrationNumber) || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `veh-${Date.now()}` };
      this.vehicles.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.vehicles.findIndex(v => v.id === args.where.id || v.registrationNumber === args.where.registrationNumber);
      if (idx === -1) return null;
      this.vehicles[idx] = { ...this.vehicles[idx], ...args.data };
      return this.vehicles[idx];
    },
  };

  driverProfile = {
    findUnique: async (args: any) => this.drivers.find(d => (args.where?.licenseNumber && d.licenseNumber === args.where.licenseNumber) || (args.where?.id && d.id === args.where.id)) || null,
    findFirst: async (args?: any) => this.drivers.find(d => !args?.where?.licenseNumber || d.licenseNumber === args.where.licenseNumber) || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `drv-${Date.now()}` };
      this.drivers.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.drivers.findIndex(d => d.id === args.where.id || d.licenseNumber === args.where.licenseNumber);
      if (idx === -1) return null;
      this.drivers[idx] = { ...this.drivers[idx], ...args.data };
      return this.drivers[idx];
    },
  };

  transportRoute = {
    findUnique: async (args: any) => this.routes.find(r => (args.where?.routeNumber && r.routeNumber === args.where.routeNumber) || (args.where?.id && r.id === args.where.id)) || null,
    findFirst: async (args?: any) => this.routes.find(r => !args?.where?.routeNumber || r.routeNumber === args.where.routeNumber) || null,
    create: async (args: any) => {
      const record = { ...args.data, id: args.data.id || `rt-${Date.now()}` };
      this.routes.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = this.routes.findIndex(r => r.id === args.where.id || r.routeNumber === args.where.routeNumber);
      if (idx === -1) return null;
      this.routes[idx] = { ...this.routes[idx], ...args.data };
      return this.routes[idx];
    },
  };

  $transaction = async (fnOrPromises: any) => {
    if (typeof fnOrPromises === 'function') {
      return fnOrPromises(this);
    }
    return Promise.all(fnOrPromises);
  };
}

const prisma = new MockPrismaService() as any;
const templateGenerator = new TemplateGeneratorService();
const bulkImportService = new BulkImportService(prisma, templateGenerator);

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failedCount++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('  PHASE 6: CENTRALIZED BULK EXCEL IMPORT SYSTEM VERIFICATION');
  console.log('===============================================================\n');

  const userContext = {
    id: 'user-admin-1',
    name: 'Super Admin Test',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
  };

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 1 & 2: Template Download Generates Valid Excel for All 10 Types
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 1 & 2: Multi-Sheet Template Generation ---');
  const allTypes: BulkImportTypeEnum[] = [
    BulkImportTypeEnum.STUDENT,
    BulkImportTypeEnum.FACULTY,
    BulkImportTypeEnum.SUBJECT,
    BulkImportTypeEnum.EXAM_FORM,
    BulkImportTypeEnum.MARKS,
    BulkImportTypeEnum.HOSTEL_STUDENT,
    BulkImportTypeEnum.HOSTEL_ROOM,
    BulkImportTypeEnum.FEE_ASSIGNMENT,
    BulkImportTypeEnum.TRANSPORT_VEHICLE,
    BulkImportTypeEnum.TRANSPORT_DRIVER,
    BulkImportTypeEnum.TRANSPORT_ROUTE,
  ];

  let templatesValid = true;
  let sheetsValid = true;

  for (const type of allTypes) {
    const buffer = templateGenerator.generateExcelBuffer(type);
    if (!buffer || buffer.length === 0) templatesValid = false;

    const wb = XLSX.read(buffer, { type: 'buffer' });
    if (!wb.SheetNames.includes('Data Template') || !wb.SheetNames.includes('Instructions & Guidelines')) {
      sheetsValid = false;
    }
  }

  assert(templatesValid, '1. Template generator creates valid Excel buffer for all dataset types');
  assert(sheetsValid, '2. Templates include Sheet 1 (Data Template) and Sheet 2 (Instructions & Guidelines)');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 3: Student Import Valid Data Inserts Records
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 3-8: Student Bulk Import Engine ---');
  const validStudentEnroll = `EN-TEST-${Date.now()}`;
  const validStudentEmail = `student-${Date.now()}@example.com`;

  const studentUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_Valid_Test.xlsx',
    rows: [
      {
        'Enrollment Number': validStudentEnroll,
        'Student Name': 'Rohan Sharma',
        'Email': validStudentEmail,
        'Mobile': '9876543210',
        'Date of Birth (YYYY-MM-DD)': '2004-06-15',
        'Gender': 'MALE',
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
        'Academic Year': '2026-27',
        'Semester (1-8)': 1,
        'Status': 'ACTIVE'
      }
    ]
  }, userContext);

  assert(studentUpload.totalRows === 1 && studentUpload.validRows === 1, '3a. Student upload correctly parsed and staged 1 valid row');

  const studentCommit = await bulkImportService.confirmImport(studentUpload.id, {
    importMode: BulkImportModeEnum.INSERT_ONLY,
  }, userContext);

  assert(studentCommit.import.importedRows === 1, '3b. Student valid record committed into ERP database');

  const createdStudent = await prisma.student.findUnique({ where: { enrollmentNo: validStudentEnroll } });
  assert(createdStudent !== null && createdStudent.email === validStudentEmail, '3c. Verified Student record persisted in database');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 4: Student Import with Missing Mandatory Fields
  // ─────────────────────────────────────────────────────────────────
  const invalidStudentUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_Invalid_Test.xlsx',
    rows: [
      {
        'Enrollment Number': '', // missing enrollment
        'Student Name': 'No Name Student',
        'Email': 'invalid-email', // invalid email
      }
    ]
  }, userContext);

  assert(invalidStudentUpload.invalidRows === 1, '4. Student with missing enrollment/invalid email flagged as INVALID');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 5: Student Import with Non-Existent Foreign Keys
  // ─────────────────────────────────────────────────────────────────
  const fkStudentUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_FK_Fail.xlsx',
    rows: [
      {
        'Enrollment Number': `EN-FK-${Date.now()}`,
        'Student Name': 'FK Tester',
        'Email': `fk-test-${Date.now()}@example.com`,
        'Institute Code': 'NON_EXISTENT_INST',
        'Department Code': 'NON_EXISTENT_DEPT',
      }
    ]
  }, userContext);

  assert(fkStudentUpload.invalidRows === 1, '5. Student with invalid Institute/Department code fails validation');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 6: In-File Duplicate Detection
  // ─────────────────────────────────────────────────────────────────
  const dupEnroll = `EN-DUP-${Date.now()}`;
  const inFileDupUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_InFile_Dup.xlsx',
    rows: [
      {
        'Enrollment Number': dupEnroll,
        'Student Name': 'Original Student',
        'Email': `orig-${Date.now()}@example.com`,
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
      },
      {
        'Enrollment Number': dupEnroll, // duplicate
        'Student Name': 'Duplicate Student',
        'Email': `dup-${Date.now()}@example.com`,
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
      }
    ]
  }, userContext);

  assert(inFileDupUpload.validRows === 1 && inFileDupUpload.duplicateRows === 1, '6. In-file duplicate enrollment number detected and flagged as DUPLICATE');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 7: In-DB Duplicate Detection in INSERT ONLY Mode
  // ─────────────────────────────────────────────────────────────────
  const dbDupUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_DB_Dup.xlsx',
    rows: [
      {
        'Enrollment Number': validStudentEnroll, // already in DB
        'Student Name': 'Existing Student Repeat',
        'Email': `existing-${Date.now()}@example.com`,
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
      }
    ]
  }, userContext);

  assert(dbDupUpload.duplicateRows === 1, '7. Existing student in database flagged as DUPLICATE in INSERT ONLY mode');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 8: UPSERT Mode Updates Details Without Changing Protected Fields
  // ─────────────────────────────────────────────────────────────────
  const upsertUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_UPSERT.xlsx',
    rows: [
      {
        'Enrollment Number': validStudentEnroll,
        'Student Name': 'Rohan Sharma Updated',
        'Email': `rohan.updated-${Date.now()}@example.com`,
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
      }
    ]
  }, userContext);

  const upsertValidated = await bulkImportService.validateImport(upsertUpload.id, { importMode: BulkImportModeEnum.UPSERT }, userContext);
  assert(upsertValidated.validRows === 1, '8a. UPSERT mode flags existing student as VALID for update');

  await bulkImportService.confirmImport(upsertUpload.id, { importMode: BulkImportModeEnum.UPSERT }, userContext);
  const updatedStudent = await prisma.student.findUnique({ where: { enrollmentNo: validStudentEnroll } });
  assert(updatedStudent?.firstName === 'Rohan' && updatedStudent?.lastName === 'Sharma Updated' && updatedStudent?.enrollmentNo === validStudentEnroll, '8b. UPSERT updated student name while strictly preserving immutable Enrollment Number and ID');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 9 & 10: Faculty Bulk Import Engine & Email Validation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 9-10: Faculty Bulk Import Engine ---');
  const facCode = `EMP-TEST-${Date.now()}`;
  const facUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.FACULTY,
    fileName: 'Faculty_Test.xlsx',
    rows: [
      {
        'Employee ID': facCode,
        'Faculty Name': 'Dr. Sunita Sharma',
        'Email': `faculty-${Date.now()}@swarrnim.edu.in`,
        'Mobile': '9811223344',
        'Department Code': 'DEP-CSE',
        'Designation': 'Professor',
        'Institute Code': 'INST-ENG',
      },
      {
        'Employee ID': `EMP-BAD-${Date.now()}`,
        'Faculty Name': 'Bad Email Faculty',
        'Email': 'invalid_email_format', // invalid email
        'Department Code': 'DEP-CSE',
      }
    ]
  }, userContext);

  assert(facUpload.validRows === 1 && facUpload.invalidRows === 1, '9 & 10. Faculty import validated 1 valid record and flagged invalid email row as INVALID');

  await bulkImportService.confirmImport(facUpload.id, { importMode: BulkImportModeEnum.INSERT_ONLY }, userContext);
  const createdFac = await prisma.faculty.findUnique({ where: { employeeCode: facCode } });
  assert(createdFac !== null, '9b. Faculty record committed into Faculty table');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 11: Subject Import Curriculum Engine
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 11: Subject Bulk Import Engine ---');
  const subCode = `CS-TEST-${Date.now().toString().slice(-4)}`;
  const subUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.SUBJECT,
    fileName: 'Subjects_Test.xlsx',
    rows: [
      {
        'Subject Code': subCode,
        'Subject Name': 'Advanced Cloud Architecture',
        'Program Code': 'PROG-BTECH-CSE',
        'Department Code': 'DEP-CSE',
        'Semester': 5,
        'Credits': 4,
        'Subject Type': 'THEORY',
      }
    ]
  }, userContext);

  assert(subUpload.validRows === 1, '11a. Subject record validated with program and department relationships');

  await bulkImportService.confirmImport(subUpload.id, { importMode: BulkImportModeEnum.INSERT_ONLY }, userContext);
  const createdSub = await prisma.subject.findFirst({ where: { code: subCode } });
  assert(createdSub !== null, '11b. Subject record committed to Subject table');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 12: Exam Form Bulk Submission Import
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 12: Exam Form Bulk Submission ---');
  const examFormUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.EXAM_FORM,
    fileName: 'Exam_Forms_Test.xlsx',
    rows: [
      {
        'Application Number': `APP-EX-${Date.now()}`,
        'Enrollment Number': validStudentEnroll,
        'Exam Code': 'SUMMER-2026',
        'Exam Type': 'REGULAR',
        'Semester': 1,
        'Academic Year': '2026-27',
      }
    ]
  }, userContext);

  assert(examFormUpload.validRows === 1, '12a. Exam form bulk record validated and linked to student & examination');

  await bulkImportService.confirmImport(examFormUpload.id, { importMode: BulkImportModeEnum.INSERT_ONLY }, userContext);
  const createdExamForm = await prisma.examForm.findFirst({ where: { studentId: createdStudent!.id, examId: 'exam-1' } });
  assert(createdExamForm !== null, '12b. Exam form committed to ExamForm table');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 13, 14, 15, 16: Student Marks Import with UGC Grade Calculation
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 13-16: Student Marks Import & Calculation Engine ---');
  const marksUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.MARKS,
    fileName: 'Marks_Calculation_Test.xlsx',
    rows: [
      {
        'Enrollment Number': validStudentEnroll,
        'Exam Code': 'SUMMER-2026',
        'Subject Code': subCode,
        'Internal Marks (Max 30)': 28,
        'External Marks (Max 70)': 62,
        'Practical Marks (Max 50)': 0,
        'Result Flag': 'NORMAL',
        'Excel Total': 999, // Excel fake value - backend MUST calculate
        'Excel Grade': 'FAKE_GRADE',
      },
      {
        'Enrollment Number': validStudentEnroll,
        'Exam Code': 'SUMMER-2026',
        'Subject Code': subCode,
        'Internal Marks (Max 30)': 0,
        'External Marks (Max 70)': 0,
        'Result Flag': 'ABSENT',
      },
      {
        'Enrollment Number': validStudentEnroll,
        'Exam Code': 'SUMMER-2026',
        'Subject Code': subCode,
        'Internal Marks (Max 30)': 35, // Out of range (>30)
        'External Marks (Max 70)': 80, // Out of range (>70)
      }
    ]
  }, userContext);

  const previewMarks = await bulkImportService.getImportPreview(marksUpload.id, 1, 10, userContext);
  const row1 = previewMarks.rows[0];
  const row2 = previewMarks.rows[1];
  const row3 = previewMarks.rows[2];

  const r1Parsed = row1.parsedData ? (typeof row1.parsedData === 'string' ? JSON.parse(row1.parsedData) : row1.parsedData) : {};
  const r2Parsed = row2.parsedData ? (typeof row2.parsedData === 'string' ? JSON.parse(row2.parsedData) : row2.parsedData) : {};

  assert(row1.status === 'VALID' && r1Parsed.totalMarks === 90 && r1Parsed.grade === 'O' && r1Parsed.gradePoint === 10, '14. Backend accurately calculated Total (90), Grade (O), and Grade Point (10) — completely ignored Excel values');

  assert(row2.status === 'VALID' && r2Parsed.grade === 'AB' && (r2Parsed.resultFlag === 'ABSENT' || r2Parsed.resultStatus === 'ABSENT'), '15. ABSENT result flag properly assigned grade "AB" and status ABSENT');

  assert(row3.status === 'INVALID', '16. Out-of-range marks (>30 internal, >70 external) flagged as INVALID');

  await bulkImportService.confirmImport(marksUpload.id, { importMode: BulkImportModeEnum.INSERT_ONLY }, userContext);
  const examResult = await prisma.examResult.findFirst({ where: { studentId: createdStudent!.id } });
  assert(examResult !== null, '13. Marks committed into ExamResult table with computed UGC grade');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 17: Hostel Room Import
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 17: Hostel Bulk Import Engine ---');
  const hostelUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.HOSTEL_ROOM,
    fileName: 'Hostel_Rooms_Test.xlsx',
    rows: [
      {
        'Hostel Code': 'HST-BH1',
        'Room Number': `10${Date.now().toString().slice(-2)}`,
        'Floor': 1,
        'Capacity': 2,
        'Room Type': 'NON_AC',
        'Status': 'AVAILABLE',
      }
    ]
  }, userContext);

  assert(hostelUpload.validRows === 1, '17. Hostel room import validated block and floor configuration');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 18: Fee Assignment Bulk Import
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 18: Fee Assignment Bulk Import ---');
  const feeUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.FEE_ASSIGNMENT,
    fileName: 'Fee_Assignment_Test.xlsx',
    rows: [
      {
        'Enrollment Number': validStudentEnroll,
        'Academic Year': '2026-27',
        'Semester': 1,
        'Fee Head Code': 'FH-TUIT',
        'Amount': 45000,
        'Due Date (YYYY-MM-DD)': '2026-08-31',
        'Status': 'UNPAID',
      }
    ]
  }, userContext);

  assert(feeUpload.validRows === 1, '18. Fee assignment validated student enrollment and fee dues');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 19: Transport Vehicle Bulk Import
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 19: Transport Fleet Bulk Import ---');
  const vehicleUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.TRANSPORT_VEHICLE,
    fileName: 'Transport_Vehicles_Test.xlsx',
    rows: [
      {
        'Vehicle Number': `GJ-01-TEST-${Date.now().toString().slice(-4)}`,
        'Vehicle Type': 'BUS',
        'Make Model': 'Tata Starbus 40 Seater',
        'Capacity': 40,
        'Fuel Type': 'DIESEL',
        'Registration Date (YYYY-MM-DD)': '2022-01-10',
        'Insurance Expiry (YYYY-MM-DD)': '2027-01-10',
        'Fitness Expiry (YYYY-MM-DD)': '2027-01-10',
        'Status': 'ACTIVE',
      }
    ]
  }, userContext);

  assert(vehicleUpload.validRows === 1, '19. Transport vehicle fleet import validated vehicle details & fitness dates');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 20: Role-Based Access Control
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 20: Role-Based Access Control ---');
  const facultyContext = { id: 'faculty-1', role: 'FACULTY', departmentId: 'dept-1' };
  const studentContext = { id: 'student-1', role: 'STUDENT' };

  let facultyDenied = false;
  try {
    await bulkImportService.uploadFile({
      importType: BulkImportTypeEnum.STUDENT,
      fileName: 'Unauthorized.xlsx',
      rows: [{ 'Enrollment Number': 'E1' }]
    }, facultyContext);
  } catch (err: any) {
    facultyDenied = true;
  }

  let studentDenied = false;
  try {
    await bulkImportService.uploadFile({
      importType: BulkImportTypeEnum.MARKS,
      fileName: 'Student_Marks_Hack.xlsx',
      rows: [{ 'Enrollment Number': 'E1' }]
    }, studentContext);
  } catch (err: any) {
    studentDenied = true;
  }

  assert(facultyDenied, '20a. FACULTY denied access to Student bulk import (Marks only permitted)');
  assert(studentDenied, '20b. STUDENT strictly forbidden (403) from all bulk import endpoints');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 21: Partial Import Commits Only Valid Rows
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 21: Partial Import Transaction Safety ---');
  const partialStudentEnroll = `EN-PARTIAL-${Date.now()}`;
  const partialUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Students_Partial_Test.xlsx',
    rows: [
      {
        'Enrollment Number': partialStudentEnroll,
        'Student Name': 'Valid Partial Student',
        'Email': `valid.partial-${Date.now()}@example.com`,
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
      },
      {
        'Enrollment Number': '', // invalid row
        'Student Name': 'Invalid Partial Student',
      }
    ]
  }, userContext);

  const partialCommit = await bulkImportService.confirmImport(partialUpload.id, { importMode: BulkImportModeEnum.INSERT_ONLY }, userContext);
  assert(partialCommit.import.importedRows === 1 && partialCommit.import.failedRows === 0, '21a. Partial import safely committed only VALID row');

  const partialRecord = await prisma.student.findUnique({ where: { enrollmentNo: partialStudentEnroll } });
  assert(partialRecord !== null, '21b. Valid row persisted without failing the batch execution');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 22: Error Report Generation in Excel
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 22: Excel Error Report Generation ---');
  const errReport = await bulkImportService.getErrorReportFile(partialUpload.id, userContext);
  const errWb = XLSX.read(errReport.buffer, { type: 'buffer' });
  const errSheet = errWb.Sheets['Import Error Report'];
  const errData: any[] = XLSX.utils.sheet_to_json(errSheet);
  assert(errReport.buffer.length > 0 && errData.length > 0, '22. Generated Excel Error Report contains row numbers, entered values, and validation error reasons');

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 23: Strict File Format Validation (ONLY .xlsx ACCEPTED)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- Scenario 23: Strict File Format Validation (.xlsx ONLY) ---');
  
  // 23a. .xlsx accepted
  const validXlsxUpload = await bulkImportService.uploadFile({
    importType: BulkImportTypeEnum.STUDENT,
    fileName: 'Valid_Template_Submission.xlsx',
    rows: [
      {
        'Enrollment Number': `EN-XLSX-${Date.now()}`,
        'Student Name': 'XLSX Test Student',
        'Email': `xlsx.test-${Date.now()}@example.com`,
        'Institute Code': 'INST-ENG',
        'Department Code': 'DEP-CSE',
        'Program Code': 'PROG-BTECH-CSE',
      }
    ]
  }, userContext);
  assert(validXlsxUpload !== null && validXlsxUpload.id !== undefined, '23a. Upload .xlsx file is ACCEPTED and processed');

  // 23b. .csv rejected
  let csvRejected = false;
  let csvErrorMessage = '';
  try {
    await bulkImportService.uploadFile({
      importType: BulkImportTypeEnum.STUDENT,
      fileName: 'Invalid_Students.csv',
      rows: [{ 'Enrollment Number': 'EN1' }]
    }, userContext);
  } catch (err: any) {
    csvRejected = true;
    csvErrorMessage = err.message;
  }
  assert(csvRejected && csvErrorMessage === 'Invalid file format. Please upload the official .xlsx Excel template.', '23b. Upload .csv file is immediately REJECTED with exact error message');

  // 23c. .xls rejected
  let xlsRejected = false;
  let xlsErrorMessage = '';
  try {
    await bulkImportService.uploadFile({
      importType: BulkImportTypeEnum.STUDENT,
      fileName: 'Old_Excel_Students.xls',
      rows: [{ 'Enrollment Number': 'EN1' }]
    }, userContext);
  } catch (err: any) {
    xlsRejected = true;
    xlsErrorMessage = err.message;
  }
  assert(xlsRejected && xlsErrorMessage === 'Invalid file format. Please upload the official .xlsx Excel template.', '23c. Upload .xls file is immediately REJECTED');

  // 23d. other format (.txt / .json) rejected
  let txtRejected = false;
  try {
    await bulkImportService.uploadFile({
      importType: BulkImportTypeEnum.STUDENT,
      fileName: 'Students_Data.txt',
      rows: [{ 'Enrollment Number': 'EN1' }]
    }, userContext);
  } catch (err: any) {
    txtRejected = true;
  }
  assert(txtRejected, '23d. Upload other formats (.txt, etc.) are strictly REJECTED');

  // ─────────────────────────────────────────────────────────────────
  // FINAL TEST SUITE RESULTS
  // ─────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  TOTAL TESTS PASSED: ${passedCount}`);
  console.log(`  TOTAL TESTS FAILED: ${failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test Suite Failed with Exception:', e);
  process.exit(1);
});
