/**
 * SSIU ERP — STAGE 10.3A: FACULTY QUESTION CREATE & UPLOAD BACKEND TEST SUITE
 *
 * Verifies all 11 security, RBAC, DTO validation, and data integrity tests:
 * TEST 1: Faculty + valid subject -> question created, status DRAFT
 * TEST 2: Student calls create API -> 403 Forbidden
 * TEST 3: HOD calls question create API -> allowed per institutional policy
 * TEST 4: Unauthenticated / empty role request -> 403 Forbidden
 * TEST 5: Faculty tries unauthorized subject -> 403 Forbidden
 * TEST 6: Missing / invalid subjectId -> 400 Bad Request
 * TEST 7: Missing / short questionText (< 5 chars) -> 400 Bad Request
 * TEST 8: Invalid marks (0 or negative) -> 400 Bad Request
 * TEST 9: Invalid MCQ structure (options missing or < 2 choices) -> 400 Bad Request
 * TEST 10: Client attempts to send status=PUBLISHED -> Server forces DRAFT status
 * TEST 11: Duplicate question detection -> 409 ConflictException
 * TEST 12: Audit log verification (QUESTION_CREATED event logged)
 */

import { QuestionBankService } from './src/exam/question-bank.service';
import { ExamAuditService } from './src/exam/exam-audit.service';

function createMockPrismaService(): any {
  const questions: any[] = [];
  const questionReviews: any[] = [];
  const auditLogs: any[] = [];

  return {
    questionBank: {
      create: async ({ data }: any) => {
        const item = {
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          options: null,
          correctAnswer: null,
          explanation: null,
          topic: null,
          unit: null,
          attachmentUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        questions.push(item);
        return item;
      },
      findMany: async ({ where }: any = {}) => {
        return questions.filter(q => {
          if (where?.tenantId && q.tenantId !== where.tenantId) return false;
          if (where?.subjectId && q.subjectId !== where.subjectId) return false;
          if (where?.status?.in && !where.status.in.includes(q.status)) return false;
          return true;
        });
      },
      findFirst: async ({ where }: any) => {
        return questions.find(q => {
          if (where?.tenantId && q.tenantId !== where.tenantId) return false;
          if (where?.id && q.id !== where.id) return false;
          return true;
        }) || null;
      },
      count: async ({ where }: any = {}) => {
        return questions.filter(q => !where?.tenantId || q.tenantId === where.tenantId).length;
      },
    },

    questionReview: {
      create: async ({ data }: any) => {
        const item = { id: `rev-${Date.now()}`, createdAt: new Date(), ...data };
        questionReviews.push(item);
        return item;
      },
    },

    examAuditLog: {
      create: async ({ data }: any) => {
        const item = { id: `log-${Date.now()}`, createdAt: new Date(), ...data };
        auditLogs.push(item);
        return item;
      },
      findMany: async ({ where }: any = {}) => {
        return auditLogs.filter(l => !where?.tenantId || l.tenantId === where.tenantId);
      },
    },

    questions,
    auditLogs,
  };
}

async function runStage103aFacultyQuestionCreateTests() {
  console.log('================================================================');
  console.log('🚀 STAGE 10.3A — FACULTY QUESTION ADD & UPLOAD BACKEND TEST SUITE');
  console.log('================================================================\n');

  const prisma = createMockPrismaService();
  const auditService = new ExamAuditService(prisma);
  const qBankService = new QuestionBankService(prisma, auditService);

  const TENANT_A = 'TENANT-SSIU-EXAM-A';
  const FACULTY_ID = 'FACULTY-001';
  const HOD_ID = 'HOD-001';
  const STUDENT_ID = 'STUDENT-001';
  const AUTHORIZED_SUBJECT = 'CS701';
  const UNAUTHORIZED_SUBJECT = 'ME801';

  // --- TEST 1: Faculty + Valid Subject -> Status DRAFT ---
  console.log('--- TEST 1: Faculty Creates Question for Authorized Subject ---');
  const res1 = await qBankService.createQuestion(
    {
      questionText: 'Explain the working principle of RSA Asymmetric Key Encryption.',
      questionType: 'DESCRIPTIVE',
      correctAnswer: 'RSA relies on prime factorization hardness.',
      explanation: 'Bloom: Analyze. Rubric: 2 marks prime selection, 3 marks key generation, 2 marks encryption math.',
      marks: 7,
      difficultyLevel: 'MEDIUM',
      bloomLevel: 'ANALYZE',
      subjectId: AUTHORIZED_SUBJECT,
      departmentId: 'dept-cse',
      academicYearId: '2025-26',
      semester: 7,
      topic: 'Public Key Infrastructure',
      unit: 'Unit 3',
    },
    TENANT_A,
    FACULTY_ID,
    'FACULTY',
    [AUTHORIZED_SUBJECT]
  );

  if (res1.statusCode !== 201 || !res1.success) throw new Error('Test 1 failed: Expected status 201');
  if (res1.data.status !== 'DRAFT') throw new Error('Test 1 failed: Expected DRAFT status');
  if (!res1.data.questionCode.startsWith('QBK-')) throw new Error('Test 1 failed: Invalid questionCode');
  if (res1.data.createdBy !== FACULTY_ID) throw new Error('Test 1 failed: createdBy mismatch');
  console.log('✅ [PASS] Test 1: Question created successfully in DRAFT status with code:', res1.data.questionCode);

  // --- TEST 2: Student Calls Create API -> 403 Forbidden ---
  console.log('\n--- TEST 2: Student Role Calls Question Create API ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Student unauthorized injected question text.',
        questionType: 'SHORT_ANSWER',
        marks: 3,
        subjectId: AUTHORIZED_SUBJECT,
      },
      TENANT_A,
      STUDENT_ID,
      'STUDENT'
    );
    throw new Error('Test 2 failed: Student should be blocked');
  } catch (err: any) {
    if (err.status === 403 || err.message.includes('not permitted')) {
      console.log('✅ [PASS] Test 2: Student blocked with 403 Forbidden');
    } else {
      throw err;
    }
  }

  // --- TEST 3: HOD Calls Question Create API -> Allowed ---
  console.log('\n--- TEST 3: HOD Calls Question Create API ---');
  const res3 = await qBankService.createQuestion(
    {
      questionText: 'What is the function of the Transport Layer in OSI reference model?',
      questionType: 'SHORT_ANSWER',
      marks: 3,
      difficultyLevel: 'EASY',
      bloomLevel: 'UNDERSTAND',
      subjectId: AUTHORIZED_SUBJECT,
      departmentId: 'dept-cse',
      academicYearId: '2025-26',
      semester: 7,
    },
    TENANT_A,
    HOD_ID,
    'HOD'
  );
  if (res3.statusCode !== 201 || res3.data.status !== 'DRAFT') throw new Error('Test 3 failed: HOD creation failed');
  console.log('✅ [PASS] Test 3: HOD question creation allowed in DRAFT status');

  // --- TEST 4: Unauthenticated / Invalid Role -> 403 Forbidden ---
  console.log('\n--- TEST 4: Unauthenticated / Invalid Role Request ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Question without valid role credentials.',
        questionType: 'SHORT_ANSWER',
        marks: 2,
        subjectId: AUTHORIZED_SUBJECT,
      },
      TENANT_A,
      'ANON-USER',
      ''
    );
    throw new Error('Test 4 failed: Empty role should be rejected');
  } catch (err: any) {
    if (err.status === 403 || err.message.includes('not permitted')) {
      console.log('✅ [PASS] Test 4: Unauthenticated/invalid role rejected with 403 Forbidden');
    } else {
      throw err;
    }
  }

  // --- TEST 5: Faculty Tries Unauthorized Subject -> 403 Forbidden ---
  console.log('\n--- TEST 5: Faculty Attempts Unauthorized Subject Creation ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Explain internal combustion engine thermal efficiency.',
        questionType: 'DESCRIPTIVE',
        marks: 7,
        subjectId: UNAUTHORIZED_SUBJECT, // Mechanical Engineering subject unauthorized for CSE Faculty
      },
      TENANT_A,
      FACULTY_ID,
      'FACULTY',
      [AUTHORIZED_SUBJECT] // Only CS701 allowed
    );
    throw new Error('Test 5 failed: Faculty subject scope breach should be rejected');
  } catch (err: any) {
    if (err.status === 403 || err.message.includes('not authorized to create questions for subject')) {
      console.log('✅ [PASS] Test 5: Unauthorized subject rejected with 403 Forbidden');
    } else {
      throw err;
    }
  }

  // --- TEST 6: Missing Subject ID -> 400 Bad Request ---
  console.log('\n--- TEST 6: Missing Subject ID Validation ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Valid question text with missing subjectId.',
        questionType: 'SHORT_ANSWER',
        marks: 2,
        subjectId: '',
      },
      TENANT_A,
      FACULTY_ID,
      'FACULTY'
    );
    throw new Error('Test 6 failed: Empty subject ID should be rejected');
  } catch (err: any) {
    if (err.status === 400 || err.message.includes('Subject ID is required')) {
      console.log('✅ [PASS] Test 6: Missing subject ID rejected with 400 Bad Request');
    } else {
      throw err;
    }
  }

  // --- TEST 7: Missing / Short Question Text -> 400 Bad Request ---
  console.log('\n--- TEST 7: Short Question Text (< 5 chars) Validation ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Hi',
        questionType: 'SHORT_ANSWER',
        marks: 2,
        subjectId: AUTHORIZED_SUBJECT,
      },
      TENANT_A,
      FACULTY_ID,
      'FACULTY'
    );
    throw new Error('Test 7 failed: Short question text should be rejected');
  } catch (err: any) {
    if (err.status === 400 || err.message.includes('at least 5 characters')) {
      console.log('✅ [PASS] Test 7: Short question text rejected with 400 Bad Request');
    } else {
      throw err;
    }
  }

  // --- TEST 8: Invalid Marks (0 or negative) -> 400 Bad Request ---
  console.log('\n--- TEST 8: Invalid Marks Allocation Validation ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Valid question text with zero marks.',
        questionType: 'SHORT_ANSWER',
        marks: 0,
        subjectId: AUTHORIZED_SUBJECT,
      },
      TENANT_A,
      FACULTY_ID,
      'FACULTY'
    );
    throw new Error('Test 8 failed: Zero marks should be rejected');
  } catch (err: any) {
    if (err.status === 400 || err.message.includes('positive numeric')) {
      console.log('✅ [PASS] Test 8: Zero marks rejected with 400 Bad Request');
    } else {
      throw err;
    }
  }

  // --- TEST 9: Invalid MCQ Structure -> 400 Bad Request ---
  console.log('\n--- TEST 9: MCQ Missing Options Validation ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'Which protocol operates on port 80?',
        questionType: 'MCQ',
        options: ['Only One Option'], // Invalid: MCQ needs at least 2 options
        marks: 2,
        subjectId: AUTHORIZED_SUBJECT,
      },
      TENANT_A,
      FACULTY_ID,
      'FACULTY'
    );
    throw new Error('Test 9 failed: MCQ with < 2 options should be rejected');
  } catch (err: any) {
    if (err.status === 400 || err.message.includes('at least 2')) {
      console.log('✅ [PASS] Test 9: MCQ with < 2 options rejected with 400 Bad Request');
    } else {
      throw err;
    }
  }

  // --- TEST 10: Client Submits status=PUBLISHED -> Server Forces DRAFT ---
  console.log('\n--- TEST 10: Client Submits status=PUBLISHED (Server-Controlled DRAFT) ---');
  const res10 = await qBankService.createQuestion(
    {
      questionText: 'Calculate the Hamming distance between bit strings 10101 and 11100.',
      questionType: 'NUMERICAL',
      marks: 3,
      difficultyLevel: 'MEDIUM',
      bloomLevel: 'APPLY',
      subjectId: AUTHORIZED_SUBJECT,
      departmentId: 'dept-cse',
      status: 'PUBLISHED' as any, // Client attempts to force PUBLISHED
    },
    TENANT_A,
    FACULTY_ID,
    'FACULTY'
  );
  if (res10.data.status !== 'DRAFT') {
    throw new Error('Test 10 failed: Server should force DRAFT status');
  }
  console.log('✅ [PASS] Test 10: Server overrode client status and forced initial status to DRAFT');

  // --- TEST 11: Duplicate Question Check -> 409 ConflictException ---
  console.log('\n--- TEST 11: Duplicate Question Protection ---');
  try {
    await qBankService.createQuestion(
      {
        questionText: 'explain the working principle of rsa asymmetric key encryption.', // Duplicate of Test 1 with lowercase
        questionType: 'DESCRIPTIVE',
        marks: 7,
        subjectId: AUTHORIZED_SUBJECT,
      },
      TENANT_A,
      FACULTY_ID,
      'FACULTY'
    );
    throw new Error('Test 11 failed: Duplicate question should be rejected');
  } catch (err: any) {
    if (err.status === 409 || err.message.includes('duplicate question')) {
      console.log('✅ [PASS] Test 11: Duplicate question rejected with 409 ConflictException');
    } else {
      throw err;
    }
  }

  // --- TEST 12: Audit Trail Event Verification ---
  console.log('\n--- TEST 12: Audit Trail Logging Verification ---');
  const logs = await auditService.getAuditLogs(undefined, undefined, TENANT_A);
  const createdLogs = logs.filter(l => l.action === 'QUESTION_CREATED');
  if (createdLogs.length === 0) throw new Error('Test 12 failed: No QUESTION_CREATED audit logs found');
  console.log(`✅ [PASS] Test 12: Audit log captured ${createdLogs.length} QUESTION_CREATED immutable events`);

  console.log('\n================================================================');
  console.log('🎉 ALL 12/12 STAGE 10.3A BACKEND TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runStage103aFacultyQuestionCreateTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
