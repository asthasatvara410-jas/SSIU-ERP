import { Test, TestingModule } from '@nestjs/testing';
import { EdpService } from './src/edp/edp.service';
import { PrismaService } from './src/prisma/prisma.service';
import { EdpController } from './src/edp/edp.controller';
import {
  EdpDutyStatusEnum,
  TeachingMethodologyEnum,
  ClassroomEnvironmentEnum,
} from './src/edp/dto/edp.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

async function runEdpTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE EDP DUTY MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    departments: new Map<string, any>(),
    faculties: new Map<string, any>(),
    users: new Map<string, any>(),
    duties: new Map<string, any>(),
    photos: new Map<string, any>(),
    studentObservations: new Map<string, any>(),
    history: new Map<string, any>(),
  };

  // Seed departments
  store.departments.set('dept-cse', { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' });
  store.departments.set('dept-ece', { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' });

  // Seed faculties
  store.faculties.set('fac-prof-sharma', {
    id: 'fac-prof-sharma',
    employeeCode: 'EMP-CSE-001',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    departmentId: 'dept-cse',
    department: store.departments.get('dept-cse'),
  });

  store.faculties.set('fac-prof-verma', {
    id: 'fac-prof-verma',
    employeeCode: 'EMP-ECE-002',
    firstName: 'Sanjay',
    lastName: 'Verma',
    departmentId: 'dept-ece',
    department: store.departments.get('dept-ece'),
  });

  // Seed users
  store.users.set('usr-officer-1', {
    id: 'usr-officer-1',
    username: 'edp_officer_1',
    role: 'FACULTY',
    authorityLevel: 5,
    departmentId: 'dept-cse',
    facultyId: 'fac-prof-sharma',
  });

  store.users.set('usr-officer-2', {
    id: 'usr-officer-2',
    username: 'edp_officer_2',
    role: 'FACULTY',
    authorityLevel: 5,
    departmentId: 'dept-ece',
    facultyId: 'fac-prof-verma',
  });

  store.users.set('usr-super-admin', {
    id: 'usr-super-admin',
    username: 'super_admin',
    role: 'SUPER_ADMIN',
    authorityLevel: 1,
  });

  const mockPrismaService = {
    department: {
      findUnique: async ({ where }: any) => store.departments.get(where.id),
      findMany: async () => {
        return Array.from(store.departments.values()).map((d) => ({
          ...d,
          edpDuties: Array.from(store.duties.values()).filter((duty) => duty.departmentId === d.id),
        }));
      },
    },

    faculty: {
      findUnique: async ({ where }: any) => store.faculties.get(where.id),
      findMany: async () => {
        return Array.from(store.faculties.values()).map((f) => ({
          ...f,
          department: store.departments.get(f.departmentId),
          edpDutiesObserved: Array.from(store.duties.values()).filter((d) => d.teachingFacultyId === f.id),
        }));
      },
    },

    user: {
      findUnique: async ({ where }: any) => store.users.get(where.id),
    },

    edpDuty: {
      create: async ({ data }: any) => {
        const id = 'edp-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.duties.set(id, record);
        return {
          ...record,
          department: store.departments.get(record.departmentId),
          assignedOfficer: store.users.get(record.assignedOfficerId),
          teachingFaculty: store.faculties.get(record.teachingFacultyId),
        };
      },

      findUnique: async ({ where }: any) => {
        const found = store.duties.get(where.id || where.dutyNo);
        if (!found) return null;
        const photos = Array.from(store.photos.values()).filter((p) => p.dutyId === found.id);
        const obs = Array.from(store.studentObservations.values()).filter((o) => o.dutyId === found.id);
        const hist = Array.from(store.history.values()).filter((h) => h.dutyId === found.id);
        return {
          ...found,
          department: store.departments.get(found.departmentId),
          assignedOfficer: store.users.get(found.assignedOfficerId),
          teachingFaculty: store.faculties.get(found.teachingFacultyId),
          photos,
          studentObservations: obs,
          history: hist,
        };
      },

      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.duties.values());
        if (where?.departmentId) list = list.filter((d) => d.departmentId === where.departmentId);
        if (where?.assignedOfficerId) list = list.filter((d) => d.assignedOfficerId === where.assignedOfficerId);
        if (where?.status) {
          if (Array.isArray(where.status.in)) {
            list = list.filter((d) => where.status.in.includes(d.status));
          } else {
            list = list.filter((d) => d.status === where.status);
          }
        }
        if (where?.OR) {
          const search = (where.OR[0]?.dutyNo?.contains || where.OR[0]?.subjectName?.contains || '').toLowerCase();
          list = list.filter(
            (d) =>
              d.dutyNo.toLowerCase().includes(search) ||
              (d.subjectName && d.subjectName.toLowerCase().includes(search)) ||
              d.classRoom.toLowerCase().includes(search)
          );
        }

        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((d) => ({
          ...d,
          department: store.departments.get(d.departmentId),
          assignedOfficer: store.users.get(d.assignedOfficerId),
          teachingFaculty: store.faculties.get(d.teachingFacultyId),
          photos: Array.from(store.photos.values()).filter((p) => p.dutyId === d.id),
          _count: {
            studentObservations: Array.from(store.studentObservations.values()).filter((o) => o.dutyId === d.id).length,
            photos: Array.from(store.photos.values()).filter((p) => p.dutyId === d.id).length,
            history: Array.from(store.history.values()).filter((h) => h.dutyId === d.id).length,
          },
        }));
      },

      count: async ({ where }: any = {}) => {
        let list = Array.from(store.duties.values());
        if (where?.departmentId) list = list.filter((d) => d.departmentId === where.departmentId);
        if (where?.status) list = list.filter((d) => d.status === where.status);
        return list.length;
      },

      update: async ({ where, data }: any) => {
        const existing = store.duties.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.duties.set(where.id, updated);
        const photos = Array.from(store.photos.values()).filter((p) => p.dutyId === where.id);
        const obs = Array.from(store.studentObservations.values()).filter((o) => o.dutyId === where.id);
        return {
          ...updated,
          department: store.departments.get(updated.departmentId),
          assignedOfficer: store.users.get(updated.assignedOfficerId),
          teachingFaculty: store.faculties.get(updated.teachingFacultyId),
          photos,
          studentObservations: obs,
        };
      },

      delete: async ({ where }: any) => {
        const existing = store.duties.get(where.id);
        store.duties.delete(where.id);
        return existing;
      },
    },

    edpDutyPhoto: {
      create: async ({ data }: any) => {
        const id = 'pht-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.photos.set(id, record);
        return record;
      },
      createMany: async ({ data }: any) => {
        for (const item of data) {
          const id = 'pht-' + Math.random().toString(36).substr(2, 6);
          store.photos.set(id, { id, ...item, createdAt: new Date() });
        }
        return { count: data.length };
      },
      findUnique: async ({ where }: any) => store.photos.get(where.id),
      delete: async ({ where }: any) => {
        const existing = store.photos.get(where.id);
        store.photos.delete(where.id);
        return existing;
      },
    },

    edpDutyStudentObservation: {
      createMany: async ({ data }: any) => {
        for (const item of data) {
          const id = 'obs-' + Math.random().toString(36).substr(2, 6);
          store.studentObservations.set(id, { id, ...item, createdAt: new Date() });
        }
        return { count: data.length };
      },
      deleteMany: async ({ where }: any) => {
        let count = 0;
        for (const [id, obs] of store.studentObservations.entries()) {
          if (obs.dutyId === where.dutyId) {
            store.studentObservations.delete(id);
            count++;
          }
        }
        return { count };
      },
      findMany: async ({ where }: any = {}) => {
        return Array.from(store.studentObservations.values())
          .filter((o) => !where?.enrollmentNo?.contains || o.enrollmentNo.includes(where.enrollmentNo.contains))
          .map((o) => ({
            ...o,
            duty: store.duties.get(o.dutyId),
          }));
      },
    },

    edpDutyHistory: {
      create: async ({ data }: any) => {
        const id = 'hist-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.history.set(id, record);
        return record;
      },
      findMany: async ({ where }: any = {}) => {
        return Array.from(store.history.values()).filter((h) => h.dutyId === where.dutyId);
      },
    },

    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EdpService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<EdpService>(EdpService);

  // Users
  const userOfficer1 = store.users.get('usr-officer-1');
  const userOfficer2 = store.users.get('usr-officer-2');
  const userSuperAdmin = store.users.get('usr-super-admin');

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

  // ── TEST 1: Create EDP Duty ───────────────────────────────────────────────
  console.log('--- 1. Create & Assign EDP Inspection Duty ---');
  const duty1 = await service.createDuty(userSuperAdmin, {
    departmentId: 'dept-cse',
    subjectId: 'sub-dbms-101',
    subjectName: 'Database Management Systems (CS401)',
    classRoom: 'Room 302, Block B',
    batchOrDivision: 'B.Tech CSE - 4th Sem (Div A)',
    teachingFacultyId: 'fac-prof-sharma',
    teachingFacultyName: 'Prof. Rajesh Sharma',
    assignedOfficerId: userOfficer1.id,
    dutyDate: '2026-08-20',
    startTime: '10:30 AM',
    endTime: '11:30 AM',
    totalRegisteredStudents: 60,
    remarks: 'Inspect adherence to syllabus timeline and digital projector usage.',
  });

  assert('EDP Duty created with unique EDP duty number', duty1.dutyNo?.startsWith('EDP-') || false);
  assert('Duty status is initial ASSIGNED', duty1.status === EdpDutyStatusEnum.ASSIGNED);
  assert('Duty records department, classroom, teaching faculty, and assigned officer', duty1.departmentId === 'dept-cse' && duty1.classRoom === 'Room 302, Block B' && duty1.assignedOfficerId === userOfficer1.id);

  // ── TEST 2: Start Inspection (ASSIGNED -> IN_PROGRESS) ───────────────────
  console.log('\n--- 2. EDP Officer Starts Inspection ---');
  const inProgressDuty = await service.startDuty(duty1.id, userOfficer1);
  assert('Duty status transitioned to IN_PROGRESS', inProgressDuty.status === EdpDutyStatusEnum.IN_PROGRESS);

  // ── TEST 3: Submit Classroom Observation & Photos (IN_PROGRESS -> SUBMITTED)
  console.log('\n--- 3. Submit Observation Report & Photos ---');
  const submittedDuty = await service.submitObservation(duty1.id, userOfficer1, {
    presentStudentCount: 54,
    absentStudentCount: 6,
    lectureTopic: 'Relational Algebra & 3NF Normalization',
    teachingMethodology: TeachingMethodologyEnum.PROJECTOR,
    classroomEnvironment: ClassroomEnvironmentEnum.DISCIPLINED,
    observations: 'Faculty covered scheduled syllabus units with interactive SQL queries on projector.',
    remarks: 'Air conditioning working fine, classroom clean.',
    studentObservations: [
      { enrollmentNo: 'SSIU2026CSE001', studentName: 'Aarav Patel', attendanceStatus: 'PRESENT', observationRemarks: 'Attentive and active' },
      { enrollmentNo: 'SSIU2026CSE002', studentName: 'Dev Mehta', attendanceStatus: 'PRESENT', observationRemarks: 'Participating in live query solving' },
      { enrollmentNo: 'SSIU2026CSE003', studentName: 'Chetan Shah', attendanceStatus: 'ABSENT', observationRemarks: 'Uninformed absence' },
    ],
    photos: [
      { photoUrl: 'https://cdn.ssiu.edu.in/edp/room302_front.jpg', caption: 'Classroom front view', latitude: 23.0225, longitude: 72.5714 },
      { photoUrl: 'https://cdn.ssiu.edu.in/edp/room302_board.jpg', caption: 'Blackboard topic summary', latitude: 23.0226, longitude: 72.5715 },
    ],
  });

  assert('Duty status transitioned to SUBMITTED', submittedDuty.status === EdpDutyStatusEnum.SUBMITTED);
  assert('Auto-calculated attendance percentage (54/60 = 90%)', Number(submittedDuty.studentAttendancePercentage) === 90);
  assert('Classroom photos uploaded with geo-coordinates and timestamps', submittedDuty.photos?.length === 2);
  assert('Individual student observations recorded', submittedDuty.studentObservations?.length === 3);

  // ── TEST 4: Supervisor Verification (SUBMITTED -> VERIFIED) ───────────────
  console.log('\n--- 4. Academic Dean / Supervisor Verification ---');
  const verifiedDuty = await service.verifyDuty(duty1.id, userSuperAdmin, {
    comments: 'Inspection report verified and approved for academic audit score.',
  });
  assert('Duty status transitioned to VERIFIED', verifiedDuty.status === EdpDutyStatusEnum.VERIFIED);
  assert('Verifier user ID recorded', verifiedDuty.verifiedByUserId === userSuperAdmin.id);

  // ── TEST 5: Standalone Photo Upload & Management ─────────────────────────
  console.log('\n--- 5. Geo-tagged Photo Upload & Management ---');
  const extraPhoto = await service.uploadDutyPhoto(duty1.id, userOfficer1, {
    photoUrl: 'https://cdn.ssiu.edu.in/edp/room302_side.jpg',
    caption: 'Classroom side perspective',
    latitude: 23.0227,
    longitude: 72.5716,
  });
  assert('Uploaded standalone inspection photo', extraPhoto.photoUrl.includes('side.jpg') && !!extraPhoto.capturedAt);

  // ── TEST 6: Audit Trail History ──────────────────────────────────────────
  console.log('\n--- 6. EDP Chronological Audit Trail History ---');
  const fullDutyDetails = await service.getDutyById(duty1.id, userSuperAdmin);
  assert('History records all lifecycle events (CREATED, STARTED, INSPECTION_SUBMITTED, VERIFIED)', fullDutyDetails.history.length >= 4);

  // ── TEST 7: Authorization & Scope Protection ─────────────────────────────
  console.log('\n--- 7. Authorization & Scoping Enforcement ---');
  let eceOfficerBlockedFromCSE = false;
  try {
    // ECE Officer attempting to inspect CSE duty
    await service.getDutyById(duty1.id, userOfficer2);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err.status === 403 || err.message?.includes('Access denied')) {
      eceOfficerBlockedFromCSE = true;
    }
  }
  assert('ECE Officer blocked from inspecting unassigned CSE duty with 403 Forbidden', eceOfficerBlockedFromCSE);

  const adminView = await service.getDutyById(duty1.id, userSuperAdmin);
  assert('Super Admin has full authorized access to inspection record', adminView.id === duty1.id);

  // ── TEST 8: EDP Reports & Analytics ──────────────────────────────────────
  console.log('\n--- 8. EDP Reports & Analytics ---');

  // Date-wise report
  const dateReport = await service.getDateWiseReport('2026-08-01', '2026-08-31');
  assert('Date-wise report returns aggregated attendance and duty counts', dateReport.length >= 1 && dateReport[0].totalPresent === 54);

  // Department-wise report
  const deptReport = await service.getDepartmentWiseReport();
  assert('Department-wise report calculates average attendance and duty summary', deptReport.some((d) => d.departmentCode === 'CSE' && d.averageAttendance === 90));

  // Faculty-wise report
  const facultyReport = await service.getFacultyWiseReport();
  assert('Faculty-wise report returns observed lecture inspection stats', facultyReport.some((f) => f.facultyName.includes('Rajesh') && f.totalInspections >= 1));

  // Class-wise report
  const classReport = await service.getClassWiseReport();
  assert('Class-wise report returns inspection count for Room 302', classReport.some((c) => c.classRoom === 'Room 302, Block B'));

  // Student-wise report
  const studentReport = await service.getStudentWiseReport('SSIU2026CSE001');
  assert('Student-wise report returns observed conduct & attendance', studentReport.length >= 1 && studentReport[0].attendanceStatus === 'PRESENT');

  // Dashboard Metrics
  const dashboard = await service.getEdpDashboardMetrics(userSuperAdmin);
  assert('Dashboard metrics returns total duties, verified count, and observed average attendance', dashboard.totalDuties >= 1 && dashboard.verified >= 1 && dashboard.averageAttendancePercentage === 90);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runEdpTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
