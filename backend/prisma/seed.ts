/**
 * SSIU ERP — Database Demo Seed Script (Backend Phase 6 Academic & Mappings Enabled)
 * Populates core masters, 21 roles, RBAC permissions, demo accounts, workflows, subjects, and student-faculty mappings.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SSIU ERP Database, Workflow & Academic Mapping Seeding...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', saltRounds);
  const regPasswordHash = await bcrypt.hash('Registrar@123', saltRounds);
  const hoiPasswordHash = await bcrypt.hash('Hoi@123', saltRounds);
  const hodPasswordHash = await bcrypt.hash('Hod@123', saltRounds);
  const facPasswordHash = await bcrypt.hash('Faculty@123', saltRounds);
  const stuPasswordHash = await bcrypt.hash('Student@123', saltRounds);

  // 1. University
  const university = await prisma.university.upsert({
    where: { code: 'SSIU' },
    update: {},
    create: {
      code: 'SSIU',
      name: 'Swarrnim Startup & Innovation University',
      tagline: "India's First Startup University",
      address: 'Bhayan, Gandhinagar - Ahmedabad Highway, Gujarat 382421',
      website: 'https://swarrnim.edu.in',
      email: 'info@swarrnim.edu.in',
      phone: '+91 70690 03001',
      status: 'ACTIVE',
    },
  });

  // 2. Institute
  const institute = await prisma.institute.upsert({
    where: { code: 'SSCIT' },
    update: {},
    create: {
      code: 'SSCIT',
      name: 'Swarrnim Institute of Technology',
      shortName: 'SSCIT',
      universityId: university.id,
      status: 'ACTIVE',
    },
  });

  // 3. Department
  const department = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      code: 'CSE',
      name: 'Computer Engineering Department',
      instituteId: institute.id,
      status: 'ACTIVE',
    },
  });

  // 4. Program
  const program = await prisma.program.upsert({
    where: { code: 'BTECH-CSE' },
    update: {},
    create: {
      code: 'BTECH-CSE',
      name: 'B.Tech in Computer Engineering',
      degreeType: 'UG',
      durationYears: 4,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });

  // 5. Academic Year & Batch
  const academicYear = await prisma.academicYear.upsert({
    where: { code: 'AY-2026-27' },
    update: {},
    create: {
      code: 'AY-2026-27',
      startYear: 2026,
      endYear: 2027,
      isCurrent: true,
      status: 'ACTIVE',
    },
  });

  const batch = await prisma.batch.upsert({
    where: { code: 'BATCH-2026-30' },
    update: {},
    create: {
      code: 'BATCH-2026-30',
      programId: program.id,
      academicYearId: academicYear.id,
      startYear: 2026,
      endYear: 2030,
      status: 'ACTIVE',
    },
  });

  // 6. Semester & Division
  const semester = await prisma.semester.upsert({
    where: {
      batchId_semesterNumber: {
        batchId: batch.id,
        semesterNumber: 1,
      },
    },
    update: {},
    create: { semesterNumber: 1, name: 'Semester 1', batchId: batch.id, status: 'ACTIVE' },
  });

  const division = await prisma.division.upsert({
    where: {
      semesterId_name: {
        semesterId: semester.id,
        name: 'A',
      },
    },
    update: {},
    create: { name: 'A', semesterId: semester.id, status: 'ACTIVE' },
  });

  // 7. Seed Subject / Course Master
  const subject01 = await prisma.subject.upsert({
    where: { code: 'CSE101' },
    update: {},
    create: {
      code: 'CSE101',
      name: 'Data Structures & Algorithms',
      credits: 4,
      subjectType: 'THEORY',
      programId: program.id,
      semesterId: semester.id,
      status: 'ACTIVE',
    },
  });

  // 8. Seed All 21 Roles
  const rolesData = [
    { code: 'STUDENT', name: 'Student', authorityLevel: 10 },
    { code: 'MENTOR', name: 'Faculty Mentor', authorityLevel: 20 },
    { code: 'FACULTY', name: 'Faculty Member', authorityLevel: 30 },
    { code: 'HOD', name: 'Head of Department', authorityLevel: 40 },
    { code: 'HOI', name: 'Head of Institute / Principal', authorityLevel: 50 },
    { code: 'DEPUTY_REGISTRAR', name: 'Deputy Registrar', authorityLevel: 60 },
    { code: 'REGISTRAR', name: 'University Registrar', authorityLevel: 70 },
    { code: 'PROVOST', name: 'University Provost', authorityLevel: 80 },
    { code: 'VICE_PRESIDENT', name: 'Vice President', authorityLevel: 90 },
    { code: 'PRESIDENT', name: 'University President', authorityLevel: 100 },
    { code: 'FINANCE_OFFICER', name: 'Chief Finance Officer', authorityLevel: 65 },
    { code: 'EXAM_SECTION', name: 'Exam Controller / Section', authorityLevel: 55 },
    { code: 'HR', name: 'Human Resources Officer', authorityLevel: 55 },
    { code: 'STORE_MANAGER', name: 'Central Store Manager', authorityLevel: 45 },
    { code: 'IT_ADMIN', name: 'IT Infrastructure Administrator', authorityLevel: 85 },
    { code: 'LIBRARIAN', name: 'Chief Librarian', authorityLevel: 35 },
    { code: 'PLACEMENT_OFFICER', name: 'Training & Placement Officer', authorityLevel: 45 },
    { code: 'IQAC_COORDINATOR', name: 'IQAC / NAAC Coordinator', authorityLevel: 65 },
    { code: 'HOSTEL_WARDEN', name: 'Chief Hostel Warden', authorityLevel: 35 },
    { code: 'TRANSPORT_OFFICER', name: 'Transport Supervisor', authorityLevel: 35 },
    { code: 'SYSTEM_ADMIN', name: 'System Technical Administrator', authorityLevel: 95 },
  ];

  const roleMap = new Map<string, any>();
  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: { authorityLevel: r.authorityLevel },
      create: {
        code: r.code,
        name: r.name,
        authorityLevel: r.authorityLevel,
        status: 'ACTIVE',
      },
    });
    roleMap.set(r.code, roleRecord);
  }

  // 8b. Seed Standard RBAC Permissions
  const modulesList = [
    'STUDENT', 'FACULTY', 'DEPARTMENT', 'INSTITUTE', 'PROGRAM', 'SUBJECT',
    'ATTENDANCE', 'TIMETABLE', 'EXAM', 'FEES', 'HOSTEL', 'TRANSPORT',
    'INCUBATION', 'STORE', 'ASSET', 'PURCHASE', 'IT', 'GOVERNANCE',
    'PLACEMENT', 'ALUMNI', 'COMMUNICATION', 'LIBRARY', 'REPORTS',
    'BULK_IMPORT', 'NOTESHEET', 'APPROVAL', 'AUDIT', 'SETTINGS', 'MEMBER',
    'ACADEMIC_YEAR', 'SEMESTER', 'BATCH', 'DIVISION'
  ];
  const actionsList = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'ASSIGN', 'PUBLISH', 'CONFIGURE'];

  const permissionMap = new Map<string, any>();
  for (const mod of modulesList) {
    for (const act of actionsList) {
      const pCode = `${mod}_${act}`;
      const permRecord = await prisma.permission.upsert({
        where: { code: pCode },
        update: {},
        create: {
          code: pCode,
          module: mod,
          action: act,
          description: `Permission to ${act} ${mod} entities.`,
        },
      });
      permissionMap.set(pCode, permRecord);
    }
  }

  // 8c. Seed Role-Permission Mappings
  const assignRolePerms = async (roleCode: string, pCodes: string[]) => {
    const role = roleMap.get(roleCode);
    if (!role) return;
    for (const pCode of pCodes) {
      const perm = permissionMap.get(pCode);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  };

  // Seed all permissions for admin & executive leadership
  const allPermissionCodes = Array.from(permissionMap.keys());
  await assignRolePerms('SYSTEM_ADMIN', allPermissionCodes);
  await assignRolePerms('PRESIDENT', allPermissionCodes);
  await assignRolePerms('VICE_PRESIDENT', allPermissionCodes);
  await assignRolePerms('PROVOST', allPermissionCodes);

  // Registrar
  const registrarPerms = allPermissionCodes.filter(c => !c.includes('DELETE') || c.startsWith('STUDENT') || c.startsWith('FACULTY') || c.startsWith('NOTESHEET'));
  await assignRolePerms('REGISTRAR', registrarPerms);
  await assignRolePerms('DEPUTY_REGISTRAR', registrarPerms.filter(c => !c.includes('CONFIGURE')));

  // HOI / Principals & HODs
  const academicPerms = allPermissionCodes.filter(c => 
    c.startsWith('STUDENT') || c.startsWith('FACULTY') || c.startsWith('DEPARTMENT') ||
    c.startsWith('PROGRAM') || c.startsWith('SUBJECT') || c.startsWith('ATTENDANCE') ||
    c.startsWith('TIMETABLE') || c.startsWith('EXAM') || c.startsWith('NOTESHEET') ||
    c.startsWith('APPROVAL') || c.startsWith('REPORTS') || c.startsWith('MEMBER')
  );
  await assignRolePerms('HOI', academicPerms);
  await assignRolePerms('HOD', academicPerms.filter(c => !c.includes('APPROVE_NOTESHEET')));

  // Faculty & Mentor
  const facultyPerms = allPermissionCodes.filter(c => 
    c === 'STUDENT_VIEW' || c === 'FACULTY_VIEW' || c === 'SUBJECT_VIEW' ||
    c.startsWith('ATTENDANCE') || c.startsWith('TIMETABLE_VIEW') || c.startsWith('EXAM_VIEW') ||
    c === 'EXAM_EDIT' || c === 'NOTESHEET_VIEW' || c === 'NOTESHEET_CREATE' ||
    c.startsWith('APPROVAL_SUBMIT') || c.startsWith('APPROVAL_VIEW') || c === 'MEMBER_VIEW'
  );
  await assignRolePerms('FACULTY', facultyPerms);
  await assignRolePerms('MENTOR', facultyPerms);

  // Student
  const studentPerms = [
    'STUDENT_VIEW', 'SUBJECT_VIEW', 'ATTENDANCE_VIEW', 'TIMETABLE_VIEW',
    'EXAM_VIEW', 'FEES_VIEW', 'APPROVAL_VIEW', 'APPROVAL_SUBMIT', 'COMMUNICATION_VIEW'
  ];
  await assignRolePerms('STUDENT', studentPerms);

  // 9. Seed Demo People
  const faculty01 = await prisma.faculty.upsert({
    where: { employeeCode: 'FAC-CSE-001' },
    update: {},
    create: {
      erpId: 'FAC000001',
      employeeCode: 'FAC-CSE-001',
      firstName: 'ABC',
      lastName: 'XYZ',
      email: 'abc.ce@swarrnim.edu.in',
      phone: '+91 0123456789',
      designation: 'HOD Computer Engineering',
      instituteId: institute.id,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });

  const faculty02 = await prisma.faculty.upsert({
    where: { employeeCode: 'FAC-CSE-002' },
    update: {},
    create: {
      erpId: 'FAC000002',
      employeeCode: 'FAC-CSE-002',
      firstName: 'Neha',
      lastName: 'Patel',
      email: 'neha.patel@swarrnim.edu.in',
      phone: '+91 98250 11223',
      designation: 'Assistant Professor',
      instituteId: institute.id,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });

  const student01 = await prisma.student.upsert({
    where: { enrollmentNo: '2026SSIUCE0101' },
    update: {
      abcId: 'ABC-8940-12345',
      abcIdStatus: 'VERIFIED',
      abcIdVerifiedByName: 'Prof. ABC (HOD)',
      abcIdVerifiedAt: new Date(),
    },
    create: {
      erpId: 'STU000001',
      enrollmentNo: '2026SSIUCE0101',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'student01@swarrnim.edu.in',
      instituteId: institute.id,
      departmentId: department.id,
      batchId: batch.id,
      currentDivisionId: division.id,
      abcId: 'ABC-8940-12345',
      abcIdStatus: 'VERIFIED',
      abcIdVerifiedByName: 'Prof. ABC (HOD)',
      abcIdVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const student02 = await prisma.student.upsert({
    where: { enrollmentNo: '2026SSIUCE0102' },
    update: {
      abcId: 'ABC-8940-67890',
      abcIdStatus: 'VERIFIED',
      abcIdVerifiedByName: 'Prof. ABC (HOD)',
      abcIdVerifiedAt: new Date(),
    },
    create: {
      erpId: 'STU000002',
      enrollmentNo: '2026SSIUCE0102',
      firstName: 'Diya',
      lastName: 'Patel',
      email: 'student02@swarrnim.edu.in',
      instituteId: institute.id,
      departmentId: department.id,
      batchId: batch.id,
      currentDivisionId: division.id,
      abcId: 'ABC-8940-67890',
      abcIdStatus: 'VERIFIED',
      abcIdVerifiedByName: 'Prof. ABC (HOD)',
      abcIdVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const student03 = await prisma.student.upsert({
    where: { enrollmentNo: '2026SSIUCE0103' },
    update: {},
    create: {
      erpId: 'STU000003',
      enrollmentNo: '2026SSIUCE0103',
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'student03@swarrnim.edu.in',
      instituteId: institute.id,
      departmentId: department.id,
      batchId: batch.id,
      currentDivisionId: division.id,
      abcId: 'ABC-8940-11223',
      abcIdStatus: 'PENDING_VERIFICATION',
      status: 'ACTIVE',
    },
  });

  const student04 = await prisma.student.upsert({
    where: { enrollmentNo: '2026SSIUCE0104' },
    update: {},
    create: {
      erpId: 'STU000004',
      enrollmentNo: '2026SSIUCE0104',
      firstName: 'Pooja',
      lastName: 'Mehta',
      email: 'student04@swarrnim.edu.in',
      instituteId: institute.id,
      departmentId: department.id,
      batchId: batch.id,
      currentDivisionId: division.id,
      abcId: 'ABC-8940-99887',
      abcIdStatus: 'REJECTED',
      abcIdRejectionReason: 'Name on APAAR/Aadhaar card does not match student records',
      status: 'ACTIVE',
    },
  });

  const student05 = await prisma.student.upsert({
    where: { enrollmentNo: '2026SSIUCE0105' },
    update: {},
    create: {
      erpId: 'STU000005',
      enrollmentNo: '2026SSIUCE0105',
      firstName: 'Ananya',
      lastName: 'Desai',
      email: 'student05@swarrnim.edu.in',
      instituteId: institute.id,
      departmentId: department.id,
      batchId: batch.id,
      currentDivisionId: division.id,
      abcId: null,
      abcIdStatus: 'NOT_SUBMITTED',
      status: 'ACTIVE',
    },
  });

  // Seed ABC Profiles & Credit Ledgers
  const profile01 = await prisma.academicBankOfCredit.upsert({
    where: { studentId: student01.id },
    update: {},
    create: {
      studentId: student01.id,
      abcId: 'ABC-8940-12345',
      totalCredits: 22,
      verificationStatus: 'VERIFIED',
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      tenantId: institute.id,
    },
  });

  await prisma.academicCreditLedger.upsert({
    where: {
      studentId_courseCode_academicYear: {
        studentId: student01.id,
        courseCode: 'CSE101',
        academicYear: '2026-27',
      },
    },
    update: {},
    create: {
      abcProfileId: profile01.id,
      studentId: student01.id,
      courseCode: 'CSE101',
      courseName: 'Data Structures & Algorithms',
      creditValue: 4.0,
      creditType: 'CORE',
      academicYear: '2026-27',
      status: 'EARNED',
      sourceReference: 'SSIU End Semester Exam 2026',
      tenantId: institute.id,
    },
  });

  await prisma.abcSyncRecord.create({
    data: {
      abcProfileId: profile01.id,
      studentId: student01.id,
      abcId: 'ABC-8940-12345',
      operation: 'SYNC_CREDITS',
      status: 'SUCCESS',
      correlationId: `sync-${Date.now()}`,
      tenantId: institute.id,
    },
  });

  // Seed DigiLocker Data
  const consent01 = await prisma.digiLockerConsent.upsert({
    where: { studentId: student01.id },
    update: {},
    create: {
      tenantId: institute.id,
      studentId: student01.id,
      consentGiven: true,
      consentVersion: 'v1.0',
      consentAt: new Date(),
    },
  });

  const dlConnection01 = await prisma.digiLockerConnection.upsert({
    where: { studentId: student01.id },
    update: {},
    create: {
      tenantId: institute.id,
      studentId: student01.id,
      status: 'CONNECTED',
      provider: 'DIGILOCKER_NAD',
      externalUserReference: 'DL-AARAV-2026',
      connectedAt: new Date(),
      lastSyncAt: new Date(),
    },
  });

  await prisma.digiLockerDocument.upsert({
    where: {
      studentId_documentType_documentNumber: {
        studentId: student01.id,
        documentType: 'DEGREE',
        documentNumber: 'SSIU-DEG-2026-0101',
      },
    },
    update: {},
    create: {
      tenantId: institute.id,
      studentId: student01.id,
      documentType: 'DEGREE',
      documentNumber: 'SSIU-DEG-2026-0101',
      issuer: 'Swarrnim University',
      status: 'ISSUED',
      issuedAt: new Date(),
      publishedAt: new Date(),
      lastSyncedAt: new Date(),
      connectionId: dlConnection01.id,
    },
  });

  await prisma.digiLockerDocument.upsert({
    where: {
      studentId_documentType_documentNumber: {
        studentId: student01.id,
        documentType: 'MARKSHEET',
        documentNumber: 'SSIU-MS-2026-S1-0101',
      },
    },
    update: {},
    create: {
      tenantId: institute.id,
      studentId: student01.id,
      documentType: 'MARKSHEET',
      documentNumber: 'SSIU-MS-2026-S1-0101',
      issuer: 'Swarrnim University',
      status: 'ISSUED',
      issuedAt: new Date(),
      publishedAt: new Date(),
      lastSyncedAt: new Date(),
      connectionId: dlConnection01.id,
    },
  });

  await prisma.digiLockerSyncLog.create({
    data: {
      tenantId: institute.id,
      studentId: student01.id,
      connectionId: dlConnection01.id,
      operation: 'ISSUE_DOCUMENT',
      status: 'SUCCESS',
      correlationId: `dl-init-${Date.now()}`,
      errorMessage: 'Official degree certificate issued and stored in national depository.',
    },
  });

  // Seed NAAC Framework
  const naacFramework = await prisma.accreditationFramework.upsert({
    where: { id: 'naac-framework-2026' },
    update: {},
    create: {
      id: 'naac-framework-2026',
      name: 'NAAC',
      version: 'v2026.1',
      status: 'ACTIVE',
      academicYearRange: '2021-22 to 2025-26',
      tenantId: institute.id,
    },
  });

  await prisma.accreditationCriterion.upsert({
    where: { id: 'naac-cr1-2026' },
    update: {},
    create: {
      id: 'naac-cr1-2026',
      frameworkId: naacFramework.id,
      criterionNumber: 1,
      code: 'CR1',
      title: 'Curricular Aspects',
      weightage: 100.0,
      tenantId: institute.id,
    },
  });

  // 10. Seed Academic Mappings
  await prisma.studentFacultyMapping.upsert({
    where: {
      studentId_subjectId_mappingType: {
        studentId: student01.id,
        subjectId: subject01.id,
        mappingType: 'COURSE_TEACHER',
      },
    },
    update: {},
    create: {
      studentId: student01.id,
      facultyId: faculty01.id,
      subjectId: subject01.id,
      semesterId: semester.id,
      divisionId: division.id,
      mappingType: 'COURSE_TEACHER',
      status: 'ACTIVE',
    },
  });

  await prisma.studentMentorMapping.upsert({
    where: {
      studentId_academicYearId: {
        studentId: student01.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      studentId: student01.id,
      mentorFacultyId: faculty01.id,
      academicYearId: academicYear.id,
      status: 'ACTIVE',
    },
  });

  // 11. Seed Users
  const createDemoUser = async (erpId: string, username: string, passHash: string, roleCode: string, extra?: any) => {
    const role = roleMap.get(roleCode);
    const user = await prisma.user.upsert({
      where: { erpId },
      update: { passwordHash: passHash, accountStatus: 'ACTIVE' },
      create: {
        erpId,
        username,
        passwordHash: passHash,
        accountStatus: 'ACTIVE',
        ...extra,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
    return user;
  };

  await createDemoUser('ADM000001', 'superadmin', adminPasswordHash, 'SYSTEM_ADMIN');
  await createDemoUser('VP000001', 'vp_demo01', adminPasswordHash, 'VICE_PRESIDENT');
  await createDemoUser('PRES000001', 'pres_demo01', adminPasswordHash, 'PRESIDENT');
  await createDemoUser('PROV000001', 'prov_demo01', adminPasswordHash, 'PROVOST');
  await createDemoUser('REG000001', 'reg_demo01', regPasswordHash, 'REGISTRAR');
  await createDemoUser('HOI000001', 'hoi_demo01', hoiPasswordHash, 'HOI');
  await createDemoUser('HOD000001', 'hod_demo01', hodPasswordHash, 'HOD', { facultyId: faculty01.id });
  await createDemoUser('FAC000001', 'fac_amitshah', facPasswordHash, 'FACULTY', { facultyId: faculty02.id });
  await createDemoUser('STU000001', 'stu_demo01', stuPasswordHash, 'STUDENT', { studentId: student01.id });
  await createDemoUser('STU000002', 'stu_demo02', stuPasswordHash, 'STUDENT', { studentId: student02.id });

  console.log('✅ Seeded Demo Students, Faculty, Subjects, and Academic Mappings');
  console.log('🎉 SSIU ERP Backend Phase 6 Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
