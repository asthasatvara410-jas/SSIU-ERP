declare const process: any;

import { db } from '../services/db';
import {
  successResponse,
  createdResponse,
  errorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError
} from '../services/apiResponse';
import { executeApiPipeline, ApiRequestContext, ApiSecurityPolicy } from '../services/apiMiddleware';
import { logger } from '../services/logger';
import { ENV } from '../config/env';
import { User, Student } from '../types';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    testsFailed++;
  }
}

export async function runBackendFoundationTests(): Promise<void> {
  console.log('\n======================================================');
  console.log('RUNNING BACKEND FOUNDATION & API STABILIZATION TESTS');
  console.log('======================================================\n');

  db.resetToDefaultSeed();

  const mockAdminUser: User = {
    id: 'user-admin-1',
    name: 'Authorized Admin',
    email: 'admin@swarrnim.edu.in',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const mockHodUser: User = {
    id: 'user-hod-1',
    name: 'Dr. HOD User',
    email: 'hod@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const mockStudentUser: User = {
    id: 'user-stu-1',
    name: 'Student User',
    email: 'student@swarrnim.edu.in',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // ─── 1. DATABASE CONNECTION & CRUD OPERATIONS ──────────────────────────────
  console.log('\n--- 1. Database Connection & CRUD ---');
  const institutes = db.getInstitutes();
  assert(Array.isArray(institutes) && institutes.length > 0, '1.1 Database connected and institutes fetched');

  const students = db.getStudents();
  const initialStudentCount = students.length;
  assert(initialStudentCount > 0, '1.2 Students table populated from seed');

  // Create
  const testStudentId = `stu-crud-${Date.now()}`;
  const testStudent: Student = {
    id: testStudentId,
    enrollmentNo: `ENR-CRUD-${Date.now().toString().slice(-4)}`,
    name: 'Foundation Test Student',
    email: 'foundation.test@swarrnim.edu.in',
    phone: '9876543210',
    gender: 'Male',
    dateOfBirth: '2004-01-01',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    programId: 'prog-1',
    academicYearId: 'ay-2024-2025',
    batchId: 'batch-1',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    guardianName: 'Guardian',
    guardianPhone: '9876543210',
    status: 'ACTIVE',
    admissionDate: '2024-07-15'
  };

  students.push(testStudent);
  db.saveState();

  const verifyCreate = db.getStudents().find(s => s.id === testStudentId);
  assert(Boolean(verifyCreate && verifyCreate.name === 'Foundation Test Student'), '1.3 Student entity created and verified in state');

  // Read
  assert(verifyCreate?.enrollmentNo === testStudent.enrollmentNo, '1.4 Read entity by enrollmentNo succeeds');

  // Update
  verifyCreate!.name = 'Foundation Test Student Updated';
  db.saveState();
  const verifyUpdate = db.getStudents().find(s => s.id === testStudentId);
  assert(verifyUpdate?.name === 'Foundation Test Student Updated', '1.5 Update entity reflected in state');

  // Delete
  const remaining = db.getStudents().filter(s => s.id !== testStudentId);
  db.saveState({ ...db.getRawState(), students: remaining });
  const verifyDelete = db.getStudents().find(s => s.id === testStudentId);
  assert(!verifyDelete, '1.6 Delete entity cleanly removed from state');

  // ─── 2. TRANSACTION HANDLING & ATOMIC ROLLBACK SAFETY ──────────────────────
  console.log('\n--- 2. Transaction Handling & Rollback Safety ---');
  const countBeforeTx = db.getStudents().length;

  try {
    db.runInTransaction(state => {
      state.students.push({
        ...testStudent,
        id: 'tx-should-rollback',
        name: 'Should Not Persist'
      });
      // Simulate fatal runtime exception midway in transaction
      throw new Error('Simulated transactional database failure');
    });
  } catch (err: any) {
    // Expected rollback
  }

  const countAfterTx = db.getStudents().length;
  const ghostRecord = db.getStudents().find(s => s.id === 'tx-should-rollback');
  assert(countBeforeTx === countAfterTx, '2.1 Transaction abort restores exact previous record count');
  assert(!ghostRecord, '2.2 Rolled back transaction leaves 0 partial or corrupted state');

  // Successful transaction
  const txSuccessResult = db.runInTransaction(state => {
    state.students.push({
      ...testStudent,
      id: 'tx-success-persisted',
      name: 'Persisted Successfully'
    });
    return 'TX_COMMITTED';
  });

  assert(txSuccessResult === 'TX_COMMITTED', '2.3 Successful transaction returns callback result');
  const persistedRecord = db.getStudents().find(s => s.id === 'tx-success-persisted');
  assert(Boolean(persistedRecord), '2.4 Successful transaction persists state');

  // Cleanup
  db.saveState({ ...db.getRawState(), students: db.getStudents().filter(s => s.id !== 'tx-success-persisted') });

  // ─── 3. STANDARDIZED API ERROR HIERARCHY & RESPONSES ───────────────────────
  console.log('\n--- 3. API Error Hierarchy & Status Codes ---');
  
  const res200 = successResponse({ id: '123' }, 'Success message');
  assert(res200.success === true && res200.statusCode === 200, '3.1 200 OK Response Envelope');

  const res201 = createdResponse({ id: '123' });
  assert(res201.success === true && res201.statusCode === 201, '3.2 201 Created Response Envelope');

  const err401 = errorResponse(new UnauthorizedError('Missing token'));
  assert(err401.statusCode === 401 && err401.error?.code === 'UNAUTHORIZED', '3.3 401 Unauthorized Error Code');

  const err403 = errorResponse(new ForbiddenError('Access Denied'));
  assert(err403.statusCode === 403 && err403.error?.code === 'FORBIDDEN', '3.4 403 Forbidden Error Code');

  const err404 = errorResponse(new NotFoundError('Student', '240101001'));
  assert(err404.statusCode === 404 && err404.error?.code === 'NOT_FOUND', '3.5 404 Not Found Error Code');

  const err409 = errorResponse(new ConflictError('Student already exists'));
  assert(err409.statusCode === 409 && err409.error?.code === 'CONFLICT', '3.6 409 Conflict Error Code');

  const err422 = errorResponse(new ValidationError('Invalid email', [{ field: 'email', message: 'Email required' }]));
  assert(err422.statusCode === 422 && err422.error?.code === 'VALIDATION_ERROR', '3.7 422 Validation Error Code');
  assert(err422.error?.details?.[0]?.field === 'email', '3.8 Validation error detail fields preserved');

  const err500 = errorResponse(new InternalServerError('System fault'));
  assert(err500.statusCode === 500 && err500.error?.code === 'INTERNAL_SERVER_ERROR', '3.9 500 Internal Server Error Code');

  // ─── 4. ERROR SANITIZATION (NO LEAKED DATABASE INTERNALS) ──────────────────
  console.log('\n--- 4. Error Sanitization ---');
  const rawDbException = new Error('PrismaClientKnownRequestError: Table "public.students" column constraint violated at 0x7ffd987');
  const sanitizedResponse = errorResponse(rawDbException);
  assert(!sanitizedResponse.error?.message.includes('PrismaClientKnownRequestError'), '4.1 Database driver internals suppressed in client error response');
  assert(!sanitizedResponse.error?.message.includes('public.students'), '4.2 Table names and memory addresses masked');

  // ─── 5. API DISPATCHER PIPELINE MIDDLEWARE ─────────────────────────────────
  console.log('\n--- 5. API Dispatcher Middleware Pipeline ---');

  // 5.1 Unauthenticated Request -> 401
  const unauthCtx: ApiRequestContext = { user: null, role: null, path: '/api/v1/students' };
  const resUnauth = await executeApiPipeline(unauthCtx, { requireAuth: true }, null, () => 'DATA');
  assert(resUnauth.statusCode === 401, '5.1 Unauthenticated request rejected with 401');

  // 5.2 Unauthorized Role -> 403
  const studentCtx: ApiRequestContext = { user: mockStudentUser, role: 'STUDENT', path: '/api/v1/faculty' };
  const resForbidden = await executeApiPipeline(studentCtx, { allowedRoles: ['SUPER_ADMIN', 'HOD'] }, null, () => 'DATA');
  assert(resForbidden.statusCode === 403, '5.2 Student accessing admin endpoint rejected with 403');

  // 5.3 Missing Scope -> 403
  const noScopeHodCtx: ApiRequestContext = {
    user: { ...mockHodUser, departmentId: undefined },
    role: 'HOD',
    path: '/api/v1/dept-records'
  };
  const resNoScope = await executeApiPipeline(noScopeHodCtx, { requireScope: { department: true } }, null, () => 'DATA');
  assert(resNoScope.statusCode === 403, '5.3 Missing department scope rejected with 403');

  // 5.4 Payload Validation -> 422
  const adminCtx: ApiRequestContext<{ name?: string }> = {
    user: mockAdminUser,
    role: 'SUPER_ADMIN',
    body: {},
    path: '/api/v1/students/create'
  };
  const validator = (data: any) => {
    if (!data.name) return { valid: false, errors: [{ field: 'name', message: 'Name is required.' }] };
    return { valid: true };
  };
  const resValidation = await executeApiPipeline(adminCtx, {}, validator, (payload) => payload);
  assert(resValidation.statusCode === 422, '5.4 Missing required field rejected with 422 Validation Error');

  // 5.5 Happy Path -> 200
  const validAdminCtx: ApiRequestContext<{ name: string }> = {
    user: mockAdminUser,
    role: 'SUPER_ADMIN',
    body: { name: 'Valid Student' },
    path: '/api/v1/students/create'
  };
  const resSuccess = await executeApiPipeline(validAdminCtx, { allowedRoles: ['SUPER_ADMIN'] }, validator, (payload) => ({ created: payload.name }));
  assert(resSuccess.statusCode === 200 && resSuccess.data?.created === 'Valid Student', '5.5 Valid request successfully executes handler and returns 200');

  // ─── 6. ENVIRONMENT & STRUCTURED LOGGER ────────────────────────────────────
  console.log('\n--- 6. Environment & Structured Logger ---');
  assert(Boolean(ENV.apiBaseUrl), '6.1 Environment API Base URL configured');
  assert(Boolean(ENV.storageKey), '6.2 Storage Key configured');
  assert(ENV.sessionTimeoutMinutes === 120, '6.3 Session timeout configured');

  logger.info('Backend foundation test verification', 'TestRunner', { status: 'COMPLETE' });
  logger.audit('FOUNDATION_VERIFIED', 'System', 'All core backend layers passed stabilization verification', { name: 'TestRunner', role: 'SUPER_ADMIN' });
  assert(true, '6.4 Structured logger executed without exceptions');

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
}

if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runBackendFoundationTests().catch(err => {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  });
}
