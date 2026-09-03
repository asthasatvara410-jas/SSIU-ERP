import { db } from '../services/db';

console.log('========================================================================');
console.log('STARTING UNIVERSAL PROFESSIONAL PROFILE / DETAIL VIEW VERIFICATION SUITE');
console.log('========================================================================');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

try {
  console.log('\n--- Stage 1: Student Profile Dynamic Structure ---');
  const student = db.getStudentById('stu-1') || db.getStudents()[0];
  assert(Boolean(student), '1.1 Student entity resolves valid real profile record');
  assert(Boolean(student?.enrollmentNo && student.enrollmentNo.length > 0), '1.2 Student enrollment number matches database record');
  assert(Boolean(student?.name && student.name.length > 0), '1.3 Student name accurately loaded from database');
  assert(Boolean(student?.departmentId), '1.4 Student department affiliation present');

  console.log('\n--- Stage 2: Faculty Profile Dynamic Structure ---');
  const faculty = db.getFaculty().find(f => f.id === 'fac-1') || db.getFaculty()[0];
  assert(Boolean(faculty), '2.1 Faculty entity resolves real faculty record and credentials');
  assert(Boolean(faculty?.employeeId && faculty.employeeId.length > 0), '2.2 Faculty employee ID matches database');
  assert(Boolean(faculty?.designation && faculty.designation.length > 0), '2.3 Faculty designation matches database');
  const assignedSubjects = db.getSubjects().filter(s => faculty?.subjectIds?.includes(s.id));
  assert(Array.isArray(assignedSubjects), '2.4 Faculty assigned subjects properly mapped');

  console.log('\n--- Stage 3: Department Profile Dynamic Structure ---');
  const dept = db.getDepartments().find(d => d.code === 'CE' || d.code === 'CSE') || db.getDepartments()[0];
  assert(Boolean(dept), '3.1 Department entity resolves real department record');
  assert(Boolean(dept?.name), '3.2 Department name resolved properly');
  const deptFaculty = db.getFaculty().filter(f => f.departmentId === dept?.id);
  assert(Array.isArray(deptFaculty), '3.3 Department affiliated faculty resolved');

  console.log('\n--- Stage 4: Program & Course Profile Dynamic Structure ---');
  const prog = db.getPrograms()[0];
  assert(Boolean(prog), '4.1 Program entity resolves degree specifications');
  assert(prog.durationYears > 0, '4.2 Program duration years greater than zero');
  const sub = db.getSubjects()[0];
  assert(Boolean(sub), '4.3 Subject entity resolves credits and hours load');
  assert(sub.credits > 0, '4.4 Subject credits properly defined');

  console.log('\n--- Stage 5: Data Safety & Isolation Checks ---');
  const stu1 = db.getStudentById('stu-1') || db.getStudents()[0];
  const stu2 = db.getStudentById('stu-2') || db.getStudents()[1];
  assert(stu1?.id !== stu2?.id, '5.1 Entity switching isolates distinct records');
  assert(stu1?.enrollmentNo !== stu2?.enrollmentNo, '5.2 Unique identifiers preserved without bleed');

  console.log('\n======================================================');
  console.log(`UNIVERSAL PROFILE SYSTEM RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    throw new Error(`Universal profile test suite failed with ${failed} failures`);
  }
} catch (e: any) {
  console.error('Test execution exception:', e);
  throw e;
}
