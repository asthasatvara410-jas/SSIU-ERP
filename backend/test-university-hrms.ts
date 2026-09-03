import { db } from '../src/services/db';
import { hrmsService } from '../src/services/hrmsService';
import { assetManagementService } from '../src/services/assetManagementService';
import { User, Employee, EmployeeType, EmploymentType } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`❌ FAIL: ${testName}`);
    if (failureDetails) {
      console.error('   Details:', failureDetails);
    }
  }
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🏢 SSIU UNIVERSITY HRMS COMPREHENSIVE 34-LIFECYCLE TEST SUITE');
  console.log('======================================================================\n');

  const adminActor: User = {
    id: 'user-superadmin',
    name: 'University HR Director',
    email: 'hr.director@ssiu.edu.in',
    role: 'SUPER_ADMIN'
  };

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: UNIQUE ID GENERATION & CODE FORMAT
  // ──────────────────────────────────────────────────────────────────────────
  const empId1 = hrmsService.generateEmployeeId();
  assert(empId1.startsWith('EMP-2026-'), 'Test 1.1: Employee ID follows standard sequential convention (EMP-2026-XXXXX)');

  const payNum1 = hrmsService.generatePayrollNumber('August', 2026);
  assert(payNum1.startsWith('PAY-2026-AUG-'), 'Test 1.2: Payroll Number follows convention (PAY-2026-AUG-XXXX)');

  const reqNum1 = hrmsService.generateRequestNumber('ATT-CORR');
  assert(reqNum1.startsWith('ATT-CORR-2026-'), 'Test 1.3: Request Number follows convention');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: ONBOARDING FACULTY EMPLOYEE WITH AUTO-LOGIN
  // ──────────────────────────────────────────────────────────────────────────
  const facultyOnboardRes = hrmsService.onboardEmployee({
    name: 'Dr. Anandvardhan Sharma',
    email: 'anand.sharma@ssiu.edu.in',
    phone: '9876510001',
    dob: '1982-04-12',
    gender: 'Male',
    bloodGroup: 'O+',
    address: 'Faculty Enclave, Sector 22, Gandhinagar',
    employeeType: 'FACULTY',
    employmentType: 'PERMANENT',
    designation: 'Professor & Head',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    joiningDate: '2026-08-01',
    salary: 125000,
    panNo: 'ABCDE5432F',
    aadhaarNo: '2345-6789-0123',
    bankName: 'State Bank of India',
    bankAccountNo: '309100123456',
    qualification: 'Ph.D in Artificial Intelligence & Robotics',
    experienceYears: 15,
    activateLogin: true
  }, adminActor);

  assert(facultyOnboardRes.success === true, 'Test 2.1: Onboard faculty member succeeds');
  assert(!!facultyOnboardRes.employee, 'Test 2.2: Employee master record created');
  assert(facultyOnboardRes.employee?.employeeId.startsWith('EMP-2026-'), 'Test 2.3: Employee ID assigned correctly');
  assert(facultyOnboardRes.employee?.status === 'ACTIVE', 'Test 2.4: Initial employee status is ACTIVE');
  assert(facultyOnboardRes.employee?.loginActivated === true, 'Test 2.5: Login activation flag set to true');

  const facultyUser = db.getUsers().find(u => u.email === 'anand.sharma@ssiu.edu.in');
  assert(!!facultyUser, 'Test 2.6: Employee user login account auto-created in system');
  assert(facultyUser?.role === 'FACULTY', 'Test 2.7: Employee assigned FACULTY role');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: DUPLICATE DETECTION ENFORCEMENT
  // ──────────────────────────────────────────────────────────────────────────
  const dupEmailRes = hrmsService.onboardEmployee({
    name: 'Duplicate Candidate',
    email: 'anand.sharma@ssiu.edu.in', // duplicate email
    phone: '9876599999',
    employeeType: 'FACULTY',
    designation: 'Lecturer',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    joiningDate: '2026-08-01',
    salary: 50000,
    panNo: 'XYZWQ9999P',
    aadhaarNo: '9999-8888-7777',
    bankAccountNo: '111122223333',
    qualification: 'M.Tech',
    experienceYears: 2
  }, adminActor);

  assert(dupEmailRes.success === false, 'Test 3.1: Duplicate email onboarding strictly blocked');
  assert(dupEmailRes.message.includes('already registered'), 'Test 3.2: Informative duplicate email error message returned');

  const dupPanRes = hrmsService.onboardEmployee({
    name: 'Duplicate PAN Candidate',
    email: 'unique.candidate@ssiu.edu.in',
    phone: '9876588888',
    employeeType: 'ADMINISTRATIVE',
    designation: 'Clerk',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    joiningDate: '2026-08-01',
    salary: 35000,
    panNo: 'ABCDE5432F', // duplicate PAN from Dr. Anand
    aadhaarNo: '8888-7777-6666',
    bankAccountNo: '222233334444',
    qualification: 'B.Com',
    experienceYears: 1
  }, adminActor);

  assert(dupPanRes.success === false, 'Test 3.3: Duplicate PAN number onboarding strictly blocked');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: ONBOARD NON-TEACHING, TECHNICAL & SUPPORT STAFF
  // ──────────────────────────────────────────────────────────────────────────
  const staffOnboardRes = hrmsService.onboardEmployee({
    name: 'Suresh Chandra Yadav',
    email: 'suresh.yadav@ssiu.edu.in',
    phone: '9876520002',
    employeeType: 'TECHNICAL',
    employmentType: 'PERMANENT',
    designation: 'Senior Lab Technician',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    joiningDate: '2026-08-01',
    salary: 45000,
    panNo: 'BCDEF6543G',
    aadhaarNo: '3456-7890-1234',
    bankName: 'State Bank of India',
    bankAccountNo: '309100234567',
    qualification: 'Diploma in Computer Hardware & Networking',
    experienceYears: 8,
    activateLogin: true
  }, adminActor);

  assert(staffOnboardRes.success === true, 'Test 4.1: Onboard technical staff member succeeds');
  assert(staffOnboardRes.employee?.employeeType === 'TECHNICAL', 'Test 4.2: Technical staff category assigned');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 5: ATTENDANCE RECORDING & LATE DETECTION
  // ──────────────────────────────────────────────────────────────────────────
  const emp1 = facultyOnboardRes.employee!;
  const attRes1 = hrmsService.recordDailyAttendance({
    employeeId: emp1.id,
    date: '2026-08-24',
    status: 'PRESENT',
    inTime: '08:55',
    outTime: '17:05',
    source: 'BIOMETRIC'
  }, adminActor);

  assert(attRes1.success === true, 'Test 5.1: Record on-time attendance succeeds');
  assert(attRes1.record?.status === 'PRESENT', 'Test 5.2: Status recorded as PRESENT');
  assert(attRes1.record?.isLate === false, 'Test 5.3: On-time check-in not marked late');

  // Late check-in test (09:45 AM)
  const attResLate = hrmsService.recordDailyAttendance({
    employeeId: emp1.id,
    date: '2026-08-23',
    status: 'PRESENT',
    inTime: '09:45',
    outTime: '17:00',
    source: 'BIOMETRIC'
  }, adminActor);

  assert(attResLate.record?.status === 'LATE', 'Test 5.4: Late check-in automatically classified as LATE');
  assert(attResLate.record?.lateMinutes === 30, 'Test 5.5: Late minutes accurately calculated (30 mins past 09:15 buffer)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 6: ATTENDANCE CORRECTION REQUEST WORKFLOW
  // ──────────────────────────────────────────────────────────────────────────
  const corrReqRes = hrmsService.submitAttendanceCorrection({
    employeeId: emp1.id,
    date: '2026-08-23',
    currentStatus: 'LATE',
    requestedStatus: 'PRESENT',
    requestedInTime: '09:00',
    requestedOutTime: '17:00',
    reason: 'Biometric fingerprint scanner reader glitch; reported to security gate.'
  }, adminActor);

  assert(corrReqRes.success === true, 'Test 6.1: Submit attendance correction request succeeds');
  assert(corrReqRes.request?.status === 'SUBMITTED', 'Test 6.2: Correction status starts as SUBMITTED');

  const reviewCorrRes = hrmsService.reviewAttendanceCorrection(
    corrReqRes.request!.id,
    'APPROVED',
    'Approved after verifying security CCTV gate log.',
    adminActor
  );

  assert(reviewCorrRes.success === true, 'Test 6.3: Attendance correction approved by HR');
  
  const updatedAtt = hrmsService.getAttendanceRecords({ employeeId: emp1.id, date: '2026-08-23' })[0];
  assert(updatedAtt?.status === 'PRESENT', 'Test 6.4: Attendance status auto-synchronized to PRESENT in roster');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 7: LEAVE BALANCES & MULTI-TIER APPROVAL
  // ──────────────────────────────────────────────────────────────────────────
  const leaveBals = hrmsService.getLeaveBalances(emp1.id);
  assert(leaveBals.length > 0, 'Test 7.1: Leave balances auto-initialized on onboarding');
  
  const casualBal = leaveBals.find(b => b.leaveType === 'CASUAL');
  assert(casualBal?.openingBalance === 12, 'Test 7.2: Casual Leave opening quota is 12 days');
  assert(casualBal?.remaining === 12, 'Test 7.3: Remaining Casual Leave is 12 days');

  // Apply 3 days Casual Leave
  const applyLeaveRes = hrmsService.applyLeave({
    employeeId: emp1.id,
    leaveType: 'CASUAL',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    totalDays: 3,
    reason: 'Attending National AI Conference at IIT Delhi'
  }, adminActor);

  assert(applyLeaveRes.success === true, 'Test 7.4: Submit leave application succeeds');
  
  const balAfterApply = hrmsService.getLeaveBalances(emp1.id).find(b => b.leaveType === 'CASUAL');
  assert(balAfterApply?.pending === 3, 'Test 7.5: Pending leave days updated to 3');
  assert(balAfterApply?.remaining === 9, 'Test 7.6: Remaining balance updated to 9 during pending state');

  // Multi-tier review: Manager Approval -> HR Final Approval
  hrmsService.reviewLeaveApplication(applyLeaveRes.application!.id, 'MANAGER', 'APPROVED', 'Recommended by Dean', adminActor);
  hrmsService.reviewLeaveApplication(applyLeaveRes.application!.id, 'HR', 'APPROVED', 'Final Sanction by HR Directorate', adminActor);

  const balAfterApprove = hrmsService.getLeaveBalances(emp1.id).find(b => b.leaveType === 'CASUAL');
  assert(balAfterApprove?.used === 3, 'Test 7.7: Used leave days deducted to 3');
  assert(balAfterApprove?.pending === 0, 'Test 7.8: Pending leave days cleared to 0');
  assert(balAfterApprove?.remaining === 9, 'Test 7.9: Final remaining balance confirmed as 9');

  // Over-quota leave rejection test (Requesting 15 when 9 remaining)
  const overLeaveRes = hrmsService.applyLeave({
    employeeId: emp1.id,
    leaveType: 'CASUAL',
    startDate: '2026-09-10',
    endDate: '2026-09-25',
    totalDays: 15,
    reason: 'Extended personal leave'
  }, adminActor);

  assert(overLeaveRes.success === false, 'Test 7.10: Leave application exceeding balance strictly blocked');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 8: MONTHLY PAYROLL CALCULATION & PAYSLIP ITEMIZATION
  // ──────────────────────────────────────────────────────────────────────────
  const payrollRes = hrmsService.calculateMonthlyPayroll('August', 2026, 26, adminActor);
  assert(payrollRes.success === true, 'Test 8.1: Monthly payroll calculation runs successfully');
  assert(payrollRes.payrolls.length >= 2, 'Test 8.2: Payroll records generated for all active employees');

  const emp1Payroll = payrollRes.payrolls.find(p => p.employeeId === emp1.id);
  assert(!!emp1Payroll, 'Test 8.3: Dr. Anand payroll itemized record found');
  assert(emp1Payroll?.grossSalary === 125000, 'Test 8.4: Gross Salary matches employee master ₹125,000');
  assert(emp1Payroll?.basicPay === 62500, 'Test 8.5: Basic Pay equals 50% (₹62,500)');
  assert(emp1Payroll?.pfDeduction === 7500, 'Test 8.6: PF Deduction equals 12% of Basic (₹7,500)');
  assert(emp1Payroll?.professionalTax === 200, 'Test 8.7: Professional Tax equals ₹200');
  assert(emp1Payroll?.netSalary === 125000 - 7500 - 200 - (emp1Payroll?.taxDeduction || 0), 'Test 8.8: Net Salary accurately computed (Gross - Deductions)');

  // Batch Approval
  const approvePayRes = hrmsService.approveMonthlyPayroll('August', 2026, adminActor);
  assert(approvePayRes.success === true, 'Test 8.9: Batch payroll approval succeeds');

  const approvedPayRecord = hrmsService.getEmployeePayslips(emp1.id).find(p => p.month === 'August' && p.year === 2026);
  assert(approvedPayRecord?.status === 'APPROVED', 'Test 8.10: Payslip status transitioned to APPROVED');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 9: PROMOTIONS & SALARY INCREMENTS
  // ──────────────────────────────────────────────────────────────────────────
  const promoRes = hrmsService.proposePromotion({
    employeeId: emp1.id,
    proposedDesignation: 'Senior Professor & Dean of AI',
    proposedSalary: 150000,
    effectiveDate: '2026-09-01',
    reason: 'Exemplary leadership in establishing the AI Centre of Excellence.'
  }, adminActor);

  assert(promoRes.success === true, 'Test 9.1: Propose employee promotion succeeds');
  assert(promoRes.promotion?.status === 'PROPOSED', 'Test 9.2: Promotion status starts as PROPOSED');

  const execPromoRes = hrmsService.executePromotion(
    promoRes.promotion!.id,
    'APPROVED',
    'Sanctioned by Provost & Board of Governors',
    adminActor
  );

  assert(execPromoRes.success === true, 'Test 9.3: Promotion execution succeeds');
  
  const updatedEmp1 = hrmsService.getEmployeeById(emp1.id);
  assert(updatedEmp1?.designation === 'Senior Professor & Dean of AI', 'Test 9.4: Employee Master designation updated');
  assert(updatedEmp1?.salary === 150000, 'Test 9.5: Employee Master salary updated to ₹150,000');

  // Salary Increment Test (10% flat increment)
  const incrRes = hrmsService.processSalaryIncrement({
    employeeId: emp1.id,
    incrementType: 'PERCENTAGE',
    incrementValue: 10,
    effectiveDate: '2026-10-01',
    reason: 'Annual performance increment'
  }, adminActor);

  assert(incrRes.success === true, 'Test 9.6: Process salary increment succeeds');
  assert(incrRes.increment?.newSalary === 165000, 'Test 9.7: New salary calculated accurately (₹150,000 + 10% = ₹165,000)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 10: EMPLOYEE TRANSFER & WORKLOAD DELEGATION
  // ──────────────────────────────────────────────────────────────────────────
  const transRes = hrmsService.transferEmployee({
    employeeId: emp1.id,
    toInstituteId: 'inst-1',
    toDepartmentId: 'dept-2',
    toDesignation: 'Dean of Research & Innovation',
    transferType: 'ROLE',
    effectiveDate: '2026-11-01',
    reason: 'Appointment to Central University Research Directorate.'
  }, adminActor);

  assert(transRes.success === true, 'Test 10.1: Transfer employee to new department succeeds');
  assert(transRes.transfer?.fromDepartmentId === 'dept-1', 'Test 10.2: Transfer record captures previous department');
  assert(transRes.transfer?.toDepartmentId === 'dept-2', 'Test 10.3: Transfer record captures target department');

  // Workload Delegation during Leave
  const staff2 = staffOnboardRes.employee!;
  const wldRes = hrmsService.transferWorkload({
    fromEmployeeId: emp1.id,
    toEmployeeId: staff2.id,
    workloadType: 'ADMIN_RESPONSIBILITY',
    subjectOrDutyName: 'AI Laboratory Equipment Maintenance In-Charge',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    reason: 'ON_LEAVE'
  }, adminActor);

  assert(wldRes.success === true, 'Test 10.4: Temporary workload transfer succeeds');
  assert(wldRes.record?.status === 'ACTIVE', 'Test 10.5: Transferred duty is ACTIVE for recipient');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 11: ASSET MANAGEMENT LINKAGE
  // ──────────────────────────────────────────────────────────────────────────
  const assets = db.getUniversityAssets();
  const availableAsset = assets[0];
  if (availableAsset) {
    const assetAssignRes = hrmsService.assignAssetToEmployee({
      employeeId: emp1.id,
      assetMasterId: availableAsset.id,
      remarks: 'High-performance workstation laptop for AI research'
    }, adminActor);

    assert(assetAssignRes.success === true, 'Test 11.1: Assign University Asset Master item to employee succeeds');
    
    const empAssets = hrmsService.getEmployeeAssets(emp1.id);
    assert(empAssets.some(a => a.id === availableAsset.id || a.assetId === availableAsset.assetId), 'Test 11.2: Employee asset ledger reflects assigned hardware');
  } else {
    console.log('⚠️ Skipping Test 11: No assets in store');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 12: DOCUMENTS, PERFORMANCE & TRAINING
  // ──────────────────────────────────────────────────────────────────────────
  const docRes = hrmsService.uploadDocument({
    employeeId: emp1.id,
    documentType: 'DEGREE_CERTIFICATE',
    documentTitle: 'Doctor of Philosophy (Ph.D) Degree Certificate',
    fileName: 'phd_degree_anand_sharma.pdf',
    fileUrl: '/documents/phd_degree_anand_sharma.pdf',
    uploadedBy: 'Dr. Anand Sharma'
  }, adminActor);

  assert(docRes.verificationStatus === 'PENDING', 'Test 12.1: Document starts with PENDING verification status');

  const verifyDocRes = hrmsService.verifyDocument(docRes.id, 'VERIFIED', 'Verified against original university transcript.', adminActor);
  assert(verifyDocRes.success === true, 'Test 12.2: Document verified by HR');

  const fdpRes = hrmsService.addTrainingRecord({
    employeeId: emp1.id,
    employeeName: emp1.name,
    trainingType: 'FDP',
    title: 'Advanced AI & Quantum Computing Leadership Workshop',
    organizer: 'IIT Delhi & AICTE',
    startDate: '2026-07-10',
    endDate: '2026-07-15',
    durationDays: 5,
    costSponsoredByUniversity: 25000
  }, adminActor);

  assert(fdpRes.status === 'COMPLETED', 'Test 12.3: Training / FDP record registered successfully');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 13: RECRUITMENT & APPLICANT TRACKING
  // ──────────────────────────────────────────────────────────────────────────
  const vacancy = hrmsService.createVacancy({
    positionTitle: 'Assistant Professor - Cybersecurity',
    instituteId: 'inst-1',
    instituteName: 'SSIT',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    designation: 'Assistant Professor',
    employeeType: 'FACULTY',
    employmentType: 'PERMANENT',
    vacanciesCount: 3,
    requiredQualification: 'M.Tech / Ph.D in Cybersecurity',
    minExperienceYears: 3,
    jobDescription: 'Teach undergraduate cybersecurity and ethical hacking courses.',
    postingDate: '2026-08-01',
    closingDate: '2026-10-30',
    status: 'PUBLISHED'
  }, adminActor);

  assert(vacancy.vacancyCode.startsWith('VAC-2026-'), 'Test 13.1: Vacancy created with sequential code');

  const appRes = hrmsService.submitJobApplication({
    vacancyId: vacancy.id,
    vacancyTitle: vacancy.positionTitle,
    candidateName: 'Dr. Neha Kapoor',
    email: 'neha.kapoor.candidate@gmail.com',
    phone: '9876540001',
    highestQualification: 'Ph.D Cybersecurity',
    totalExperienceYears: 6
  });

  assert(appRes.screeningStatus === 'APPLIED', 'Test 13.2: Job application registered in screening funnel');
  
  const updatedVac = hrmsService.getVacancies().find(v => v.id === vacancy.id);
  assert(updatedVac?.applicantCount === 1, 'Test 13.3: Vacancy applicant count incremented to 1');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 14: SEPARATION & MULTI-DEPT CLEARANCE LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────
  const sepRes = hrmsService.initiateSeparation({
    employeeId: staff2.id,
    separationType: 'RESIGNATION',
    resignationDate: '2026-08-24',
    noticePeriodDays: 30,
    lastWorkingDay: '2026-09-24',
    reason: 'Relocating to hometown for family personal reasons.'
  }, adminActor);

  assert(sepRes.success === true, 'Test 14.1: Initiate employee separation succeeds');
  assert(sepRes.separation?.status === 'SUBMITTED', 'Test 14.2: Separation status starts as SUBMITTED');

  // Complete all clearance checkpoints
  const sepId = sepRes.separation!.id;
  hrmsService.updateSeparationClearance(sepId, 'DEPARTMENT', true, 'Handover complete', adminActor);
  hrmsService.updateSeparationClearance(sepId, 'LIBRARY', true, 'All books returned', adminActor);
  hrmsService.updateSeparationClearance(sepId, 'ASSET', true, 'All lab keys & tools returned', adminActor);
  hrmsService.updateSeparationClearance(sepId, 'IT', true, 'Email archive created', adminActor);
  hrmsService.updateSeparationClearance(sepId, 'FINANCE', true, 'No pending dues', adminActor);
  hrmsService.updateSeparationClearance(sepId, 'HR', true, 'Exit interview completed', adminActor);

  const updatedSep = hrmsService.getSeparations().find(s => s.id === sepId);
  assert(updatedSep?.status === 'RELIEVED', 'Test 14.3: Final separation status transitioned to RELIEVED');
  
  const relievedStaff = hrmsService.getEmployeeById(staff2.id);
  assert(relievedStaff?.status === 'RELIEVED', 'Test 14.4: Employee status updated to RELIEVED in master record');
  assert(relievedStaff?.loginActivated === false, 'Test 14.5: Employee login deactivated after full clearance');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 15: TRANSACTION-SAFE BULK EXCEL INGESTION
  // ──────────────────────────────────────────────────────────────────────────
  const validBulkRows = [
    {
      name: 'Dr. Alok Verma Bulk',
      email: `alok.verma.bulk.${Date.now()}@ssiu.edu.in`,
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      designation: 'Assistant Professor',
      employeeType: 'FACULTY',
      employmentType: 'PERMANENT',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      joiningDate: '2026-08-01',
      salary: 80000,
      panNo: `ALOKV${Math.floor(1000 + Math.random() * 9000)}F`,
      aadhaarNo: `4567-8901-${Math.floor(1000 + Math.random() * 9000)}`,
      qualification: 'Ph.D Physics',
      experienceYears: 4
    },
    {
      name: 'Sunita Mehra Bulk',
      email: `sunita.mehra.bulk.${Date.now()}@ssiu.edu.in`,
      phone: `98766${Math.floor(10000 + Math.random() * 90000)}`,
      designation: 'Executive Assistant',
      employeeType: 'ADMINISTRATIVE',
      employmentType: 'PERMANENT',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      joiningDate: '2026-08-01',
      salary: 40000,
      panNo: `SUNIT${Math.floor(1000 + Math.random() * 9000)}G`,
      aadhaarNo: `5678-9012-${Math.floor(1000 + Math.random() * 9000)}`,
      qualification: 'MBA Human Resources',
      experienceYears: 5
    }
  ];

  const bulkRes = hrmsService.processBulkEmployeeImport(validBulkRows, adminActor);
  assert(bulkRes.success === true, 'Test 15.1: Bulk Excel import of valid employee batch succeeds');
  assert(bulkRes.successCount === 2, 'Test 15.2: Exact success count (2) matches batch size');

  // Ingestion with duplicate email (Row-level error isolation)
  const invalidBulkRows = [
    {
      name: 'Invalid Row Employee',
      email: validBulkRows[0].email, // Duplicate email from batch
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      designation: 'Lecturer',
      employeeType: 'FACULTY',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      joiningDate: '2026-08-01',
      salary: 50000,
      panNo: `INVAL${Math.floor(1000 + Math.random() * 9000)}F`,
      aadhaarNo: `9999-0000-${Math.floor(1000 + Math.random() * 9000)}`,
      qualification: 'M.Sc'
    }
  ];

  const bulkFailRes = hrmsService.processBulkEmployeeImport(invalidBulkRows, adminActor);
  if (bulkFailRes.success) {
    console.error('DEBUG bulkFailRes unexpected success:', JSON.stringify(bulkFailRes, null, 2));
  }
  assert(bulkFailRes.success === false, 'Test 15.3: Bulk import with invalid row safely rejected');
  assert(bulkFailRes.errors[0]?.row === 2, 'Test 15.4: Error points to exact Excel row number (Row 2)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 16: IMMUTABLE AUDIT LOGGING & EXECUTIVE KPIS
  // ──────────────────────────────────────────────────────────────────────────
  const auditLogs = hrmsService.getHRAuditLogs();
  assert(auditLogs.length > 5, 'Test 16.1: Immutable HR Audit entries logged for all sensitive operations');
  assert(auditLogs.some(a => a.actionType === 'ONBOARD_EMPLOYEE'), 'Test 16.2: Onboarding audit log present');
  assert(auditLogs.some(a => a.actionType === 'PROCESS_PAYROLL'), 'Test 16.3: Payroll calculation audit log present');
  assert(auditLogs.some(a => a.actionType === 'PROCESS_PROMOTION'), 'Test 16.4: Promotion audit log present');

  const kpis = hrmsService.getDashboardKPIs();
  assert(kpis.totalEmployees >= 4, 'Test 16.5: Executive Dashboard total employees is accurate');
  assert(kpis.totalMonthlySalary > 0, 'Test 16.6: Executive Dashboard monthly salary is positive');
  assert(kpis.openVacancies >= 1, 'Test 16.7: Executive Dashboard open vacancies tracked accurately');

  console.log('\n======================================================================');
  console.log(`🏁 HRMS TEST SUITE RESULTS: ${passedTests} PASSED | ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
