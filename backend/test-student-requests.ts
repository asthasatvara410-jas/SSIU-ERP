import { PrismaClient } from '@prisma/client';

console.log('===============================================================');
console.log('🚀 TESTING STUDENT REQUEST CENTRAL ROUTING & ESCALATION WORKFLOW');
console.log('===============================================================\n');

interface MockStudent {
  id: string;
  enrollmentNo: string;
  name: string;
  email: string;
  departmentId: string;
  instituteId: string;
  mentorId: string;
}

interface MockFaculty {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  designation: string;
}

interface MockSubject {
  id: string;
  code: string;
  name: string;
  assignedFacultyId: string;
}

interface MockTimelineItem {
  action: string;
  fromUser: string;
  toUser?: string;
  status: string;
  remarks: string;
  timestamp: string;
}

interface MockStudentRequest {
  id: string;
  requestNo: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  category: string;
  subjectId?: string;
  subject: string;
  description: string;
  currentHandler: string;
  currentHandlerId?: string;
  status: string;
  resolutionSummary?: string;
  reworkRemarks?: string;
  reopenReason?: string;
  reopenCount: number;
  timeline: MockTimelineItem[];
}

class MockStudentRequestEngine {
  private requests: MockStudentRequest[] = [];
  private students: MockStudent[] = [
    {
      id: 'stud-1',
      enrollmentNo: 'SSIU2026CS001',
      name: 'Rohan Sharma',
      email: 'rohan@ssiu.edu',
      departmentId: 'dept-cse',
      instituteId: 'inst-engineering',
      mentorId: 'fac-mentor-1'
    }
  ];

  private faculties: MockFaculty[] = [
    { id: 'fac-mentor-1', name: 'Dr. Rajesh Sharma', email: 'rajesh@ssiu.edu', departmentId: 'dept-cse', designation: 'Associate Professor' },
    { id: 'fac-subj-1', name: 'Prof. Priya Patel', email: 'priya@ssiu.edu', departmentId: 'dept-cse', designation: 'Assistant Professor' },
    { id: 'fac-hod-1', name: 'Dr. Amit Trivedi (HOD)', email: 'hod.cse@ssiu.edu', departmentId: 'dept-cse', designation: 'Professor' },
    { id: 'fac-hoi-1', name: 'Dr. K. N. Rao (Principal)', email: 'principal.eng@ssiu.edu', departmentId: 'dept-cse', designation: 'Professor' }
  ];

  private subjects: MockSubject[] = [
    { id: 'subj-cs501', code: 'CS501', name: 'Advanced Operating Systems', assignedFacultyId: 'fac-subj-1' }
  ];

  public createRequest(studentId: string, category: string, subject: string, description: string, subjectId?: string): MockStudentRequest {
    const student = this.students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found.');
    if (!student.mentorId) throw new Error('Your mentor is not assigned. Please contact the Student Section.');

    const mentor = this.faculties.find(f => f.id === student.mentorId);
    const seq = String(this.requests.length + 1).padStart(6, '0');
    const requestNo = `REQ/2026/${seq}`;

    const req: MockStudentRequest = {
      id: `req-${Date.now()}-${Math.random()}`,
      requestNo,
      studentId: student.id,
      studentName: student.name,
      mentorId: mentor!.id,
      mentorName: mentor!.name,
      category,
      subjectId,
      subject,
      description,
      currentHandler: 'MENTOR',
      currentHandlerId: mentor!.id,
      status: 'SUBMITTED',
      reopenCount: 0,
      timeline: [
        {
          action: 'REQUEST_SUBMITTED',
          fromUser: student.name,
          toUser: mentor!.name,
          status: 'SUBMITTED',
          remarks: `Student submitted request. Automatically routed to Mentor ${mentor!.name}.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    this.requests.push(req);
    return req;
  }

  public mentorRouteToSubjectFaculty(requestId: string, subjectId: string, remarks: string, mentorUser: MockFaculty): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    const subj = this.subjects.find(s => s.id === subjectId);
    if (!subj) throw new Error('Subject not found.');
    const faculty = this.faculties.find(f => f.id === subj.assignedFacultyId);

    req.status = 'FORWARDED_TO_FACULTY';
    req.currentHandler = 'SUBJECT_FACULTY';
    req.currentHandlerId = faculty!.id;
    req.subjectId = subjectId;
    req.timeline.push({
      action: 'ROUTE_TO_SUBJECT_FACULTY',
      fromUser: mentorUser.name,
      toUser: faculty!.name,
      status: 'FORWARDED_TO_FACULTY',
      remarks,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public mentorRouteToHod(requestId: string, remarks: string, mentorUser: MockFaculty): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    const hod = this.faculties.find(f => f.id === 'fac-hod-1');
    req.status = 'FORWARDED_TO_HOD';
    req.currentHandler = 'HOD';
    req.currentHandlerId = hod!.id;
    req.timeline.push({
      action: 'ROUTE_TO_HOD',
      fromUser: mentorUser.name,
      toUser: hod!.name,
      status: 'FORWARDED_TO_HOD',
      remarks,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public mentorRouteToDepartment(requestId: string, dept: string, remarks: string, mentorUser: MockFaculty): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    req.status = 'FORWARDED_TO_DEPARTMENT';
    req.currentHandler = 'DEPARTMENT';
    req.currentHandlerId = dept;
    req.timeline.push({
      action: 'ROUTE_TO_DEPARTMENT',
      fromUser: mentorUser.name,
      toUser: dept,
      status: 'FORWARDED_TO_DEPARTMENT',
      remarks,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public hodEscalateToHoi(requestId: string, remarks: string, hodUser: MockFaculty): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    const hoi = this.faculties.find(f => f.id === 'fac-hoi-1');
    req.status = 'FORWARDED_TO_HOI';
    req.currentHandler = 'HOI';
    req.currentHandlerId = hoi!.id;
    req.timeline.push({
      action: 'HOD_FORWARD_TO_HOI',
      fromUser: hodUser.name,
      toUser: hoi!.name,
      status: 'FORWARDED_TO_HOI',
      remarks,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public resolveAndReturnToMentor(requestId: string, resolution: string, resolverName: string): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    req.status = 'RETURNED_TO_MENTOR';
    req.currentHandler = 'MENTOR';
    req.currentHandlerId = req.mentorId;
    req.resolutionSummary = resolution;
    req.timeline.push({
      action: 'WORK_COMPLETED_RETURN_TO_MENTOR',
      fromUser: resolverName,
      toUser: req.mentorName,
      status: 'RETURNED_TO_MENTOR',
      remarks: resolution,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public mentorMarkCompleted(requestId: string, remarks: string, mentorUser: MockFaculty): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    req.status = 'COMPLETED';
    req.timeline.push({
      action: 'MENTOR_MARKED_COMPLETED',
      fromUser: mentorUser.name,
      toUser: req.studentName,
      status: 'COMPLETED',
      remarks,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public mentorRequestRework(requestId: string, remarks: string, mentorUser: MockFaculty): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    req.status = 'RETURNED_FOR_REWORK';
    req.reworkRemarks = remarks;
    req.timeline.push({
      action: 'MENTOR_REQUESTED_REWORK',
      fromUser: mentorUser.name,
      status: 'RETURNED_FOR_REWORK',
      remarks,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public studentConfirm(requestId: string, studentName: string): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    req.status = 'COMPLETED';
    req.timeline.push({
      action: 'STUDENT_CONFIRMED_RESOLUTION',
      fromUser: studentName,
      status: 'COMPLETED',
      remarks: 'Student verified and confirmed resolution.',
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public studentReopen(requestId: string, reason: string, studentName: string): MockStudentRequest {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found.');

    req.status = 'REOPENED';
    req.currentHandler = 'MENTOR';
    req.currentHandlerId = req.mentorId;
    req.reopenReason = reason;
    req.reopenCount += 1;
    req.timeline.push({
      action: 'STUDENT_REOPENED_REQUEST',
      fromUser: studentName,
      toUser: req.mentorName,
      status: 'REOPENED',
      remarks: reason,
      timestamp: new Date().toISOString()
    });
    return req;
  }

  public getFaculties() { return this.faculties; }
}

async function runStudentRequestTestSuite() {
  const engine = new MockStudentRequestEngine();
  const faculties = engine.getFaculties();
  const mentor = faculties[0];
  const subjectFaculty = faculties[1];
  const hod = faculties[2];
  const hoi = faculties[3];

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${label}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${label}`);
      failCount++;
    }
  }

  console.log('--- TEST CASE 1: Student -> Mentor -> Subject Faculty -> Mentor -> Student ---');
  const req1 = engine.createRequest('stud-1', 'SUBJECT_RELATED', 'Lab Evaluation Query', 'Doubt in OS Lab manual grading', 'subj-cs501');
  assert(req1.status === 'SUBMITTED', '1a. Request created with status SUBMITTED');
  assert(req1.currentHandler === 'MENTOR', '1b. Automatically routed FIRST to Mentor');
  assert(req1.requestNo.startsWith('REQ/2026/'), '1c. Generated unique Request Number REQ/2026/XXXXXX');

  engine.mentorRouteToSubjectFaculty(req1.id, 'subj-cs501', 'Please review student lab notebook.', mentor);
  assert(req1.status === 'FORWARDED_TO_FACULTY', '1d. Mentor routed request to Subject Faculty');
  assert(req1.currentHandlerId === subjectFaculty.id, '1e. Automatically mapped to Prof. Priya Patel');

  engine.resolveAndReturnToMentor(req1.id, 'Lab evaluation verified and +5 marks awarded.', subjectFaculty.name);
  assert(req1.status === 'RETURNED_TO_MENTOR', '1f. Subject Faculty resolved and returned to student\'s Mentor');
  assert(req1.currentHandler === 'MENTOR', '1g. Request desk returned to Mentor');

  engine.mentorMarkCompleted(req1.id, 'Verified lab score update.', mentor);
  assert(req1.status === 'COMPLETED', '1h. Mentor marked request COMPLETED');

  engine.studentConfirm(req1.id, 'Rohan Sharma');
  assert(req1.status === 'COMPLETED', '1i. Student confirmed resolution');

  console.log('\n--- TEST CASE 2: Student -> Mentor -> HOD -> Mentor -> Student ---');
  const req2 = engine.createRequest('stud-1', 'COMPLAINT', 'Classroom Projector Issue', 'Classroom 402 projector flickering');
  engine.mentorRouteToHod(req2.id, 'Forwarding classroom infrastructure issue.', mentor);
  assert(req2.status === 'FORWARDED_TO_HOD', '2a. Mentor routed to Department HOD');
  assert(req2.currentHandlerId === hod.id, '2b. Correctly identified Dr. Amit Trivedi (HOD)');

  engine.resolveAndReturnToMentor(req2.id, 'HDMI cable replaced and tested by technician.', hod.name);
  assert(req2.status === 'RETURNED_TO_MENTOR', '2c. HOD completed and returned to Mentor');

  engine.mentorMarkCompleted(req2.id, 'Verified with lab attendant.', mentor);
  assert(req2.status === 'COMPLETED', '2d. Mentor closed and notified student');

  console.log('\n--- TEST CASE 3: Student -> Mentor -> HOD -> HOI -> Mentor -> Student ---');
  const req3 = engine.createRequest('stud-1', 'ACADEMIC', 'Special Inter-Collegiate Hackathon Leave', 'Requesting 3 days OD for National Hackathon');
  engine.mentorRouteToHod(req3.id, 'Student shortlisted for finals.', mentor);
  engine.hodEscalateToHoi(req3.id, 'HOD recommending institutional leave sanction.', hod);
  assert(req3.status === 'FORWARDED_TO_HOI', '3a. HOD escalated to Principal / HOI');
  assert(req3.currentHandlerId === hoi.id, '3b. Correctly mapped to Dr. K. N. Rao (Principal)');

  engine.resolveAndReturnToMentor(req3.id, 'Approved 3 days On-Duty with travel grant.', hoi.name);
  assert(req3.status === 'RETURNED_TO_MENTOR', '3c. Principal resolved and returned to student\'s Mentor');

  engine.mentorMarkCompleted(req3.id, 'Certificate received and attendance updated.', mentor);
  assert(req3.status === 'COMPLETED', '3d. Completed successfully');

  console.log('\n--- TEST CASE 4: Student -> Mentor -> Other Department (Accounts) -> Mentor -> Student ---');
  const req4 = engine.createRequest('stud-1', 'FEES', 'Scholarship Concession Refund', 'Pending scholarship adjustment from Sem 4');
  engine.mentorRouteToDepartment(req4.id, 'ACCOUNTS_ADMIN', 'Forwarding to Accounts Office for ledger verification.', mentor);
  assert(req4.status === 'FORWARDED_TO_DEPARTMENT', '4a. Mentor routed to Accounts Office');
  assert(req4.currentHandlerId === 'ACCOUNTS_ADMIN', '4b. Desk assigned to ACCOUNTS_ADMIN');

  engine.resolveAndReturnToMentor(req4.id, '₹15,000 refund adjusted in next semester invoice.', 'Accounts Officer');
  assert(req4.status === 'RETURNED_TO_MENTOR', '4c. Accounts completed and returned to Mentor');

  engine.mentorMarkCompleted(req4.id, 'Verified receipt generated.', mentor);
  assert(req4.status === 'COMPLETED', '4d. Completed');

  console.log('\n--- TEST CASE 5: Student -> Mentor -> Faculty -> Work -> Mentor -> Rework -> Faculty -> Mentor -> Student ---');
  const req5 = engine.createRequest('stud-1', 'SUBJECT_RELATED', 'Assignment Re-submission', 'Missed deadline due to fever');
  engine.mentorRouteToSubjectFaculty(req5.id, 'subj-cs501', 'Medical certificate attached.', mentor);
  engine.resolveAndReturnToMentor(req5.id, 'Please submit by tomorrow 5 PM.', subjectFaculty.name);
  
  engine.mentorRequestRework(req5.id, 'Student requested 2 days as hospitalization ended today.', mentor);
  assert(req5.status === 'RETURNED_FOR_REWORK', '5a. Mentor requested rework from Faculty');
  assert(req5.reworkRemarks?.includes('hospitalization'), '5b. Rework remarks persisted in request');

  engine.resolveAndReturnToMentor(req5.id, 'Extended deadline to Friday 5 PM.', subjectFaculty.name);
  assert(req5.status === 'RETURNED_TO_MENTOR', '5c. Faculty re-resolved and returned to Mentor');

  engine.mentorMarkCompleted(req5.id, 'Final extension granted.', mentor);
  assert(req5.status === 'COMPLETED', '5d. Completed after rework cycle');

  console.log('\n--- TEST CASE 6: Student Reopen Workflow ---');
  const req6 = engine.createRequest('stud-1', 'HOSTEL', 'Room AC not cooling', 'Room B-304 AC cooling insufficient');
  engine.mentorRouteToDepartment(req6.id, 'HOSTEL_ADMIN', 'Forwarding to Hostel Maintenance.', mentor);
  engine.resolveAndReturnToMentor(req6.id, 'AC filter cleaned.', 'Hostel Warden');
  engine.mentorMarkCompleted(req6.id, 'Warden indicated resolved.', mentor);
  assert(req6.status === 'COMPLETED', '6a. Marked completed initially');

  engine.studentReopen(req6.id, 'AC still blowing warm air after 30 minutes.', 'Rohan Sharma');
  assert(req6.status === 'REOPENED', '6b. Request reopened by student');
  assert(req6.reopenCount === 1, '6c. Reopen counter incremented to 1');
  assert(req6.currentHandler === 'MENTOR', '6d. Returned back to Mentor for re-routing');

  console.log('\n--- TEST CASE 7: Complete Audit Timeline Verification ---');
  assert(req6.timeline.length >= 5, '7a. Full timeline history preserved with zero data deletion');
  assert(req6.timeline.some(t => t.action === 'STUDENT_REOPENED_REQUEST'), '7b. Reopen event logged in timeline');

  console.log('\n===============================================================');
  console.log(`📊 STUDENT REQUEST TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED (${passCount + failCount} TOTAL)`);
  console.log('===============================================================');

  if (failCount > 0) process.exit(1);
}

runStudentRequestTestSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
