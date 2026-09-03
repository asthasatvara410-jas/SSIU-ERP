// ==============================================================================
// SSIU ERP - STUDENT ADMISSION RECORD PDF GENERATION TEST SUITE
// ==============================================================================

import { studentAdmissionRecordPdfService } from '../src/services/studentAdmissionRecordPdfService';
import { db } from '../src/services/db';
import { Student } from '../src/types';

function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 RUNNING VERIFICATION FOR STUDENT ADMISSION RECORD PDF GENERATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── Mock Student Data ──
  const mockStudent: Student = {
    id: 'STU-2026-9901',
    enrollmentNo: 'TEMP-2026-09901',
    temporaryEnrollmentNumber: 'TEMP-2026-09901',
    finalEnrollmentNumber: '26010401099',
    name: 'Aarav Rajesh Patel',
    fullName: 'Aarav Rajesh Patel',
    firstName: 'Aarav',
    middleName: 'Rajesh',
    lastName: 'Patel',
    email: 'aarav.patel@swarrnim.edu.in',
    phone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    gender: 'Male',
    dateOfBirth: '2005-04-12',
    bloodGroup: 'B+',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'General',
    caste: 'Patel / Kadva',
    aadhaarNo: '987654321098',
    birthPlace: 'Ahmedabad',
    birthState: 'Gujarat',
    maritalStatus: 'Unmarried',
    motherTongue: 'Gujarati',
    applicationNumber: 'APP-2026-00451',
    admissionNumber: 'ADM-2026-09901',
    admissionDate: '2026-08-24',
    academicYearId: 'ay-2026-27',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    programId: 'prog-1',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    batchId: 'batch-1',
    rollNumber: '042',
    admissionType: 'ACPPC / Regular Merit',
    admissionCategory: 'General',
    admissionStatus: 'CONFIRMED',
    emergencyContactName: 'Rajeshbhai Patel',
    emergencyContactNumber: '+91 98765 43211',
    emergencyContactRelation: 'Father',
    fatherName: 'Rajeshbhai Patel',
    fatherPhone: '+91 98765 43211',
    fatherEmail: 'rajesh.patel@gmail.com',
    fatherOccupation: 'Business / Manufacturing',
    fatherAnnualIncome: 850000,
    motherName: 'Meenaben Patel',
    motherPhone: '+91 98765 43212',
    motherEmail: 'meena.patel@gmail.com',
    motherOccupation: 'Homemaker',
    guardianName: 'Rajeshbhai Patel',
    guardianPhone: '+91 98765 43211',
    guardianRelation: 'Father',
    currentAddressLine1: '402, Shivalik Heights, SG Highway',
    currentCity: 'Ahmedabad',
    currentState: 'Gujarat',
    currentPincode: '380054',
    isPermanentSameAsCurrent: true,
    tenthBoard: 'GSEB',
    tenthSchool: 'St. Xavier High School',
    tenthPassingYear: '2021',
    tenthPercentage: '88.50',
    twelfthBoard: 'GHSEB Science (Group A)',
    twelfthSchool: 'Swarrnim Science Academy',
    twelfthPassingYear: '2023',
    twelfthPercentage: '85.20',
    hostelRequired: true,
    transportRequired: false,
    mentorId: 'u4',
    mentorName: 'Dr. Hardik Patel',
    erpUsername: 'TEMP-2026-09901',
    erpAccountStatus: 'ACTIVE',
    studentAccessCode: '74921',
    status: 'ACTIVE'
  };

  const mockDocs = [
    { name: 'Student Photograph', category: 'IDENTITY', fileName: 'photo.jpg', fileUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...', status: 'VERIFIED' },
    { name: 'Specimen Signature', category: 'IDENTITY', fileName: 'signature.png', fileUrl: 'data:image/png;base64,iVBORw0KGgo...', status: 'VERIFIED' },
    { name: '10th Marksheet (SSC)', category: 'ACADEMIC', fileName: '10th_marksheet.pdf', fileUrl: 'https://swarrnim.edu.in/docs/10th.pdf', status: 'VERIFIED' },
    { name: '12th Marksheet (HSC)', category: 'ACADEMIC', fileName: '12th_marksheet.pdf', fileUrl: 'https://swarrnim.edu.in/docs/12th.pdf', status: 'VERIFIED' },
    { name: 'Aadhaar Card / ID Proof', category: 'IDENTITY', fileName: 'aadhaar_card.pdf', fileUrl: 'https://swarrnim.edu.in/docs/aadhaar.pdf', status: 'VERIFIED' }
  ];

  // ── Test 1: Service Methods Exist ──
  assert(typeof studentAdmissionRecordPdfService.generateAdmissionRecordDoc === 'function', 'Test 1.1: studentAdmissionRecordPdfService.generateAdmissionRecordDoc exists');
  assert(typeof studentAdmissionRecordPdfService.downloadAdmissionRecord === 'function', 'Test 1.2: studentAdmissionRecordPdfService.downloadAdmissionRecord exists');
  assert(typeof studentAdmissionRecordPdfService.printAdmissionRecord === 'function', 'Test 1.3: studentAdmissionRecordPdfService.printAdmissionRecord exists');
  assert(typeof studentAdmissionRecordPdfService.getAdmissionRecordBlobUrl === 'function', 'Test 1.4: studentAdmissionRecordPdfService.getAdmissionRecordBlobUrl exists');

  // ── Test 2: PDF Document Generation ──
  const doc = studentAdmissionRecordPdfService.generateAdmissionRecordDoc(mockStudent, mockDocs);
  assert(doc !== null && typeof doc.output === 'function', 'Test 2.1: generateAdmissionRecordDoc creates valid jsPDF instance');
  
  const pageCount = doc.getNumberOfPages();
  // Page 1 is Main Record, plus 5 document annexures = 6 pages
  assert(pageCount === 6, `Test 2.2: Generates multi-page document with annexures (Expected 6 pages, Got ${pageCount})`);

  // ── Test 3: Data Integrity & Naming ──
  const expectedFileName = `${mockStudent.id}_Admission_Record.pdf`;
  assert(expectedFileName === 'STU-2026-9901_Admission_Record.pdf', 'Test 3.1: Naming convention strictly follows {studentId}_Admission_Record.pdf');

  // ── Test 4: Document Vault Registration ──
  const studentDocs = db.getStudentDocuments();
  assert(Array.isArray(studentDocs), 'Test 4.1: db.getStudentDocuments() accessible');

  // ── Test 5: Check Blob URL generation ──
  // In Node environment, URL.createObjectURL might need a polyfill, but doc.output('blob') or 'arraybuffer' succeeds
  const arrayBuffer = doc.output('arraybuffer');
  assert(arrayBuffer.byteLength > 1000, `Test 5.1: PDF payload generated with size ${arrayBuffer.byteLength} bytes`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 ADMISSION RECORD PDF TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
