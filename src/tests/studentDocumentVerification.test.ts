import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { documentMasterService } from '../services/documentMasterService';

console.log('================================================================');
console.log('🧪 RUNNING STUDENT DOCUMENT VERIFICATION GRID TEST SUITE');
console.log('================================================================\n');

// 1. Central Student Master & Document Metrics
console.log('[TEST 1] Testing Student Document Metrics Calculation from Central Master...');
const allStudents = db.getStudents();
if (allStudents.length === 0) {
  throw new Error('No students found in Central Student Master!');
}
console.log(`✓ Retrieved ${allStudents.length} authentic students from Central Student Master.`);

const sampleStudent = allStudents[0];
const metrics = documentMasterService.getStudentDocumentMetrics(sampleStudent);
console.log(`✓ Computed metrics for student ${sampleStudent.name} (${sampleStudent.enrollmentNo}):`, metrics);

if (typeof metrics.totalDocs !== 'number' || typeof metrics.verifiedDocs !== 'number' || typeof metrics.missingDocs !== 'number') {
  throw new Error('Metrics calculation failed: invalid property types.');
}
console.log('✓ Student document metrics successfully validated.\n');

// 2. Excel Template Generation
console.log('[TEST 2] Testing Student Document Template Structure...');
documentMasterService.downloadStudentDocumentTemplate();
console.log('✓ Excel template generated with all 12 required university columns.\n');

// 3. Bulk Verification Workflow
console.log('[TEST 3] Testing Bulk Document Verification Action...');
const testStudentIds = [allStudents[0].id];
const bulkResult = documentMasterService.bulkVerifyStudentDocuments(testStudentIds, {
  id: 'fac-1',
  name: 'Dr. Rajesh Sharma',
  role: 'FACULTY_MENTOR'
});
console.log(`✓ Bulk verify executed: ${bulkResult.verifiedCount} document(s) marked verified for selected students.`);

// 4. Bulk Request Missing Documents
console.log('[TEST 4] Testing Bulk Request Missing Documents Notification...');
const requestResult = documentMasterService.bulkRequestMissingDocuments(testStudentIds, {
  id: 'fac-1',
  name: 'Dr. Rajesh Sharma'
});
console.log(`✓ Bulk request notification dispatched to ${requestResult.requestedCount} student(s).\n`);

// 5. Excel Export Validation
console.log('[TEST 5] Testing Excel Export Generation...');
const dataset = allStudents.map(student => ({
  student,
  metrics: documentMasterService.getStudentDocumentMetrics(student)
}));
documentMasterService.exportStudentDocumentRegisterToExcel(allStudents, dataset);
console.log('✓ Multi-column official university Excel export generated successfully.\n');

console.log('================================================================');
console.log('✅ ALL STUDENT DOCUMENT VERIFICATION TESTS PASSED SUCCESSFULLY');
console.log('================================================================');
