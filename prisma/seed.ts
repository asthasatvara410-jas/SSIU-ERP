/**
 * SSIU ERP — Master Database Seed Script
 * File: prisma/seed.ts
 *
 * Populates:
 * 1. Base Academic Structure (University, Institute, Department, Program, Academic Year, Batch, Semester, Division)
 * 2. 3 Dummy Courses (CS-301, CS-302, CS-303)
 * 3. 5 Dummy Students linked to those courses
 * 4. Sample Attendance & Fee records
 */

import { prisma } from '../src/services/databaseService';

async function main() {
  console.log('🌱 Starting SSIU ERP Database Seeding...');

  // ─── 1. CORE ACADEMIC HIERARCHY ────────────────────────────────────────────
  console.log('1️⃣ Seeding Core Academic Structure...');

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

  const semester = await prisma.semester.upsert({
    where: { id: 'sem-5-btech-cse' },
    update: {},
    create: {
      id: 'sem-5-btech-cse',
      batchId: batch.id,
      semesterNumber: 5,
      name: 'Semester 5',
      status: 'ACTIVE',
    },
  });

  const division = await prisma.division.upsert({
    where: { semesterId_name: { semesterId: semester.id, name: 'Div-A' } },
    update: {},
    create: {
      semesterId: semester.id,
      name: 'Div-A',
      capacity: 60,
      status: 'ACTIVE',
    },
  });

  // ─── 2. SEED 3 DUMMY COURSES / SUBJECTS ────────────────────────────────────
  console.log('2️⃣ Seeding 3 Dummy Courses (CS-301, CS-302, CS-303)...');

  const courseData = [
    {
      code: 'CS-301',
      name: 'Advanced Database Management Systems',
      credits: 4,
      subjectType: 'THEORY',
    },
    {
      code: 'CS-302',
      name: 'Cloud Computing & Distributed Systems',
      credits: 4,
      subjectType: 'THEORY',
    },
    {
      code: 'CS-303',
      name: 'Full-Stack Enterprise Development Lab',
      credits: 2,
      subjectType: 'PRACTICAL',
    },
  ];

  const seededCourses: any[] = [];
  for (const c of courseData) {
    const course = await prisma.subject.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        credits: c.credits,
        subjectType: c.subjectType,
      },
      create: {
        code: c.code,
        name: c.name,
        credits: c.credits,
        subjectType: c.subjectType,
        programId: program.id,
        semesterId: semester.id,
        status: 'ACTIVE',
      },
    });
    seededCourses.push(course);
  }

  // ─── 3. SEED FACULTY (FOR SUBJECT ALLOCATION) ──────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where: { employeeCode: 'FAC-CSE-001' },
    update: {},
    create: {
      employeeCode: 'FAC-CSE-001',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'dr.sharma@swarrnim.edu.in',
      phone: '+91 98765 43210',
      designation: 'PROFESSOR',
      qualification: 'Ph.D. in Computer Science',
      specialization: 'Database Systems & Cloud Computing',
      instituteId: institute.id,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });

  // ─── 4. SEED 5 DUMMY STUDENTS & LINK TO COURSES ────────────────────────────
  console.log('3️⃣ Seeding 5 Dummy Students & Course Enrollments...');

  const studentData = [
    {
      erpId: 'STU2026001',
      enrollmentNo: '260101001',
      firstName: 'Aarav',
      lastName: 'Patel',
      email: 'aarav.patel@swarrnim.edu.in',
      phone: '+91 91234 56781',
      gender: 'MALE',
    },
    {
      erpId: 'STU2026002',
      enrollmentNo: '260101002',
      firstName: 'Diya',
      lastName: 'Shah',
      email: 'diya.shah@swarrnim.edu.in',
      phone: '+91 91234 56782',
      gender: 'FEMALE',
    },
    {
      erpId: 'STU2026003',
      enrollmentNo: '260101003',
      firstName: 'Rohan',
      lastName: 'Mehta',
      email: 'rohan.mehta@swarrnim.edu.in',
      phone: '+91 91234 56783',
      gender: 'MALE',
    },
    {
      erpId: 'STU2026004',
      enrollmentNo: '260101004',
      firstName: 'Ananya',
      lastName: 'Iyer',
      email: 'ananya.iyer@swarrnim.edu.in',
      phone: '+91 91234 56784',
      gender: 'FEMALE',
    },
    {
      erpId: 'STU2026005',
      enrollmentNo: '260101005',
      firstName: 'Kabir',
      lastName: 'Verma',
      email: 'kabir.verma@swarrnim.edu.in',
      phone: '+91 91234 56785',
      gender: 'MALE',
    },
  ];

  const seededStudents: any[] = [];
  for (const s of studentData) {
    const student = await prisma.student.upsert({
      where: { erpId: s.erpId },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
      },
      create: {
        erpId: s.erpId,
        enrollmentNo: s.enrollmentNo,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        instituteId: institute.id,
        departmentId: department.id,
        batchId: batch.id,
        currentDivisionId: division.id,
        enrollmentStatus: 'FINAL',
        status: 'ACTIVE',
      },
    });
    seededStudents.push(student);

    // Link each student to all 3 seeded courses
    for (const course of seededCourses) {
      await prisma.studentFacultyMapping.upsert({
        where: {
          studentId_subjectId_mappingType: {
            studentId: student.id,
            subjectId: course.id,
            mappingType: 'COURSE_TEACHER',
          },
        },
        update: {},
        create: {
          studentId: student.id,
          facultyId: faculty.id,
          subjectId: course.id,
          semesterId: semester.id,
          divisionId: division.id,
          mappingType: 'COURSE_TEACHER',
          status: 'ACTIVE',
        },
      });
    }
  }

  // ─── 5. SEED ATTENDANCE APPLICATIONS & ELIGIBILITY CONFIG ─────────────────
  console.log('4️⃣ Seeding Sample Attendance Records...');

  await prisma.attendanceEligibilityConfig.upsert({
    where: { id: 'cfg-btech-cse-attendance' },
    update: {},
    create: {
      id: 'cfg-btech-cse-attendance',
      minAttendancePercent: 75.0,
      medicalCondonationMaxPercent: 10.0,
      sportsCondonationMaxPercent: 5.0,
      status: 'ACTIVE',
    },
  });

  for (let i = 0; i < seededStudents.length; i++) {
    const student = seededStudents[i];
    await prisma.attendanceApplication.upsert({
      where: { applicationNo: `APP-ATT-2026-${student.erpId}` },
      update: {},
      create: {
        applicationNo: `APP-ATT-2026-${student.erpId}`,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        enrollmentNo: student.enrollmentNo,
        studentEmail: student.email,
        instituteId: institute.id,
        departmentId: department.id,
        programId: program.id,
        semesterId: semester.id,
        subjectId: seededCourses[0].id,
        subjectCode: seededCourses[0].code,
        subjectName: seededCourses[0].name,
        subjectFacultyId: faculty.id,
        subjectFacultyName: `${faculty.firstName} ${faculty.lastName}`,
        mentorFacultyId: faculty.id,
        mentorFacultyName: `${faculty.firstName} ${faculty.lastName}`,
        hodUserId: 'hod-cse-001',
        hodUserName: 'Dr. HOD Computer Science',
        hoiUserId: 'hoi-sscit-001',
        hoiUserName: 'Principal SSCIT',
        totalClasses: 40,
        presentClasses: 28,
        absentClasses: 12,
        currentAttendancePct: 70.0,
        requiredAttendancePct: 75.0,
        shortagePct: 5.0,
        reason: 'OFFICIAL_DUTY',
        description: 'Authorized University Technical Symposium & Hackathon participation',
        currentHandlerRole: 'COMPLETED',
        currentHandlerId: faculty.id,
        currentHandlerName: `${faculty.firstName} ${faculty.lastName}`,
        status: 'FINAL_APPROVED',
        finalEligibilityGranted: true,
      },
    });
  }

  // ─── 6. SEED FEE STRUCTURE & STUDENT FEE INVOICES ───────────────────────────
  console.log('5️⃣ Seeding Sample Fee Heads, Structures & Invoices...');

  await prisma.feeHead.upsert({
    where: { code: 'FH-TUITION-01' },
    update: {},
    create: {
      code: 'FH-TUITION-01',
      name: 'Tuition Fee - Semester 5',
      category: 'ACADEMIC',
      status: 'ACTIVE',
    },
  });

  await prisma.feeHead.upsert({
    where: { code: 'FH-LAB-01' },
    update: {},
    create: {
      code: 'FH-LAB-01',
      name: 'Computer Lab & Development Fee',
      category: 'LABORATORY',
      status: 'ACTIVE',
    },
  });

  const feeStructure = await prisma.feeStructure.upsert({
    where: { code: 'FS-BTECH-CSE-SEM5' },
    update: {},
    create: {
      code: 'FS-BTECH-CSE-SEM5',
      name: 'B.Tech CSE Semester 5 Standard Fee Structure',
      instituteId: institute.id,
      departmentId: department.id,
      programId: program.id,
      academicYearId: academicYear.id,
      totalAmount: 45000.0,
      currency: 'INR',
      status: 'ACTIVE',
    },
  });

  for (const student of seededStudents) {
    const studentFeeAccount = await prisma.studentFeeAccount.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        totalBilled: 45000.0,
        totalPaid: 45000.0,
        totalOutstanding: 0.0,
        currency: 'INR',
        status: 'CURRENT',
      },
    });

    await prisma.feeInvoice.upsert({
      where: { invoiceNumber: `SSIU-FEE-2026-${student.erpId}` },
      update: {},
      create: {
        invoiceNumber: `SSIU-FEE-2026-${student.erpId}`,
        studentId: student.id,
        studentFeeAccountId: studentFeeAccount.id,
        feeStructureId: feeStructure.id,
        academicYearId: academicYear.id,
        academicYearCode: 'AY-2026-27',
        semesterId: semester.id,
        invoiceDate: new Date('2026-07-15'),
        dueDate: new Date('2026-08-31'),
        subtotal: 45000.0,
        discountAmount: 0.0,
        waiverAmount: 0.0,
        lateFeeAmount: 0.0,
        totalAmount: 45000.0,
        status: 'PAID',
        createdBy: 'finance-admin-001',
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log(`📊 Summary: 3 Courses, 5 Students, ${seededStudents.length} Attendance Records, ${seededStudents.length} Fee Invoices created.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
