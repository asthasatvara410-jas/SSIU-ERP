import { db } from '../src/services/db';
import { assetManagementService, RegisterAssetPayload, AllocateAssetPayload, TransferAssetPayload, ReturnAssetPayload, MaintenancePayload } from '../src/services/assetManagementService';
import { resourceAllocationService } from '../src/services/resourceAllocationService';
import { UniversityAsset, InstitutionalResource } from '../src/types';

function runTestSuite() {
  console.log('======================================================================');
  console.log('🏛️ SSIU UNIVERSITY RESOURCE & ASSET MANAGEMENT COMPREHENSIVE TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  const mockAdmin = { id: 'admin-01', name: 'Central Admin Officer', role: 'STUDENT_ADMIN' } as any;
  const mockHOD = { id: 'hod-cse', name: 'Dr. Ramesh Sharma', role: 'HOD', departmentId: 'dept-cse' } as any;

  // ---------------------------------------------------------
  // TEST 1: Unique Asset ID Generation
  // ---------------------------------------------------------
  const pcAssetId = assetManagementService.generateAssetId('IT_ELECTRONICS', 'Desktop PC');
  const chairAssetId = assetManagementService.generateAssetId('FURNITURE', 'Office Chair');
  const projAssetId = assetManagementService.generateAssetId('CLASSROOM', 'Projector');

  assert(pcAssetId.startsWith('SSIU-PC-') || pcAssetId.startsWith('SSIU-IT-'), 'Test 1.1: PC Asset ID follows standard convention', `Got ${pcAssetId}`);
  assert(chairAssetId.startsWith('SSIU-CHAIR-') || chairAssetId.startsWith('SSIU-FUR-'), 'Test 1.2: Chair Asset ID follows standard convention', `Got ${chairAssetId}`);
  assert(projAssetId.startsWith('SSIU-PROJ-') || projAssetId.startsWith('SSIU-CLASS-'), 'Test 1.3: Projector Asset ID follows standard convention', `Got ${projAssetId}`);

  // ---------------------------------------------------------
  // TEST 2: Serialized Asset Registration
  // ---------------------------------------------------------
  const regLaptopRes = assetManagementService.registerAsset({
    name: 'Apple MacBook Pro M3 16-inch',
    category: 'IT_ELECTRONICS',
    subCategory: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro M3 Max',
    serialNumber: 'APPL-SN-TEST-8899',
    purchaseDate: '2026-02-01',
    purchaseCost: 249000,
    vendor: 'Apple Authorized Education Store',
    invoiceNumber: 'INV-APPL-2026-01',
    fundingSource: 'AI & Research Grant',
    isSerialized: true,
    totalQuantity: 1,
    warrantyStart: '2026-02-01',
    warrantyEnd: '2029-01-31',
    warrantyProvider: 'AppleCare+ for Higher Education'
  }, mockAdmin);

  assert(regLaptopRes.success && regLaptopRes.asset !== undefined, 'Test 2.1: Register serialized MacBook Pro succeeds');
  const macbook = regLaptopRes.asset!;
  assert(macbook.isSerialized === true, 'Test 2.2: Asset correctly flagged as serialized');
  assert(macbook.totalQuantity === 1 && macbook.availableQuantity === 1, 'Test 2.3: Initial stock is 1 total and 1 available');

  // ---------------------------------------------------------
  // TEST 3: Serialized Duplicate Serial Number Prevention
  // ---------------------------------------------------------
  const dupLaptopRes = assetManagementService.registerAsset({
    name: 'Duplicate Apple MacBook Pro',
    category: 'IT_ELECTRONICS',
    subCategory: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro M3 Max',
    serialNumber: 'APPL-SN-TEST-8899', // Duplicate!
    purchaseDate: '2026-02-01',
    purchaseCost: 249000,
    vendor: 'Apple Authorized Education Store',
    isSerialized: true,
    totalQuantity: 1
  }, mockAdmin);

  assert(!dupLaptopRes.success, 'Test 3.1: Duplicate serial number registration strictly blocked');
  assert(dupLaptopRes.message.includes('already registered') || dupLaptopRes.message.includes('already exists'), 'Test 3.2: Informative duplicate error message returned');

  // ---------------------------------------------------------
  // TEST 4: Bulk Non-Serialized Asset Registration
  // ---------------------------------------------------------
  const regChairsRes = assetManagementService.registerAsset({
    name: 'Godrej Ergonomic Seminar Chairs',
    category: 'FURNITURE',
    subCategory: 'Office Chair',
    brand: 'Godrej',
    model: 'Aero Executive',
    purchaseDate: '2026-01-10',
    purchaseCost: 6500,
    vendor: 'Godrej Interio',
    isSerialized: false,
    quantity: 100
  }, mockAdmin);

  assert(regChairsRes.success && regChairsRes.asset !== undefined, 'Test 4.1: Register bulk 100 chairs succeeds');
  const bulkChairs = regChairsRes.asset!;
  assert(bulkChairs.isSerialized === false, 'Test 4.2: Bulk asset isSerialized is false');
  assert(bulkChairs.totalQuantity === 100 && bulkChairs.availableQuantity === 100, 'Test 4.3: Stock starts with 100 available');

  // ---------------------------------------------------------
  // TEST 5: Department Stock Allocation & Deductions
  // ---------------------------------------------------------
  const allocChairsRes = assetManagementService.allocateAssetToDepartment({
    assetMasterId: bulkChairs.id,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    allocatedQuantity: 30,
    building: 'Block A',
    floor: '2nd Floor',
    room: 'Seminar Hall A-201',
    remarks: 'Allocated for CSE department seminar hall'
  }, mockAdmin);

  assert(allocChairsRes.success, 'Test 5.1: Allocate 30 chairs to CSE Department succeeds');
  const updatedChairsAfterAlloc = db.getUniversityAssets().find(a => a.id === bulkChairs.id)!;
  assert(updatedChairsAfterAlloc.availableQuantity === 70, 'Test 5.2: Available quantity correctly deducted to 70', `Got ${updatedChairsAfterAlloc.availableQuantity}`);
  assert(updatedChairsAfterAlloc.allocatedQuantity === 30, 'Test 5.3: Allocated quantity correctly updated to 30');

  // ---------------------------------------------------------
  // TEST 6: Over-Allocation Block
  // ---------------------------------------------------------
  const overAllocRes = assetManagementService.allocateAssetToDepartment({
    assetMasterId: bulkChairs.id,
    instituteId: 'inst-1',
    departmentId: 'dept-me',
    allocatedQuantity: 75, // Only 70 left!
    building: 'Block B'
  }, mockAdmin);

  assert(!overAllocRes.success, 'Test 6.1: Over-allocation (requesting 75 when 70 available) blocked');
  assert(overAllocRes.message.includes('Insufficient available stock') || overAllocRes.message.includes('Cannot allocate'), 'Test 6.2: Over-allocation returns stock limitation notice');

  // ---------------------------------------------------------
  // TEST 7: Department Auto-Sync (Instant Reflection in Dept Dashboard)
  // ---------------------------------------------------------
  const cseAssets = assetManagementService.getDepartmentAssets('dept-cse').assets;
  const cseChairAllocation = cseAssets.find(a => a.name.includes('Godrej Ergonomic Seminar Chairs'));
  assert(cseChairAllocation !== undefined, 'Test 7.1: CSE Department instantly queries allocated chairs without second entry');
  assert(cseChairAllocation?.allocatedQuantity === 30, 'Test 7.2: Allocated quantity matches 30 units');

  // ---------------------------------------------------------
  // TEST 8: Serialized Asset Person Assignment
  // ---------------------------------------------------------
  const allocMacbookRes = assetManagementService.allocateAssetToDepartment({
    assetMasterId: macbook.id,
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    allocatedQuantity: 1,
    building: 'Block A',
    room: 'HOD Office',
    assignedPersonId: 'fac-1',
    remarks: 'Assigned to Dr. Ramesh Sharma for Department Research'
  }, mockAdmin);

  assert(allocMacbookRes.success, 'Test 8.1: Allocate MacBook Pro to Faculty succeeds');
  const facultyAssets = assetManagementService.getFacultyAssignedAssets('fac-1');
  assert(facultyAssets.length > 0, 'Test 8.2: Faculty login automatically retrieves assigned MacBook Pro');
  assert(facultyAssets[0].id === macbook.id, 'Test 8.3: Assigned asset ID matches master record');

  // ---------------------------------------------------------
  // TEST 9: Inter-Department Asset Transfer with Audit Event
  // ---------------------------------------------------------
  const transferRes = assetManagementService.transferAsset({
    assetMasterId: macbook.id,
    quantity: 1,
    toInstituteId: 'inst-1',
    toDepartmentId: 'dept-me',
    toLocation: 'Mechanical Design Lab Room 104',
    reason: 'Transferred for 3D CAD & Robotics Project'
  }, mockAdmin);

  assert(transferRes.success, 'Test 9.1: Transfer MacBook Pro from CSE to ME succeeds');
  const updatedMacbookAfterTransfer = db.getUniversityAssets().find(a => a.id === macbook.id)!;
  assert(updatedMacbookAfterTransfer.currentDepartmentId === 'dept-me', 'Test 9.2: Current department updated to ME');

  const transferLogs = db.getAssetTransferRecords().filter(t => t.assetMasterId === macbook.id);
  assert(transferLogs.length > 0, 'Test 9.3: Transfer record logged in audit ledger');
  assert(transferLogs[0].fromDepartmentId === 'dept-cse' && transferLogs[0].toDepartmentId === 'dept-me', 'Test 9.4: Transfer record captured exact from/to departments');

  // ---------------------------------------------------------
  // TEST 10: Return to Central University Store
  // ---------------------------------------------------------
  const returnRes = assetManagementService.returnAssetToStore({
    assetMasterId: macbook.id,
    fromDepartmentId: 'dept-me',
    quantity: 1,
    condition: 'GOOD',
    remarks: 'Project completed, returned in perfect operating condition'
  }, mockAdmin);

  assert(returnRes.success, 'Test 10.1: Return MacBook Pro to Store succeeds');
  const macbookInStore = db.getUniversityAssets().find(a => a.id === macbook.id)!;
  assert(macbookInStore.status === 'IN_STOCK' && macbookInStore.availableQuantity === 1, 'Test 10.2: Asset status restored to IN_STOCK with 1 available');
  assert(macbookInStore.currentDepartmentId === undefined, 'Test 10.3: Current department unassigned');

  // ---------------------------------------------------------
  // TEST 11: Maintenance Ticket Logging
  // ---------------------------------------------------------
  const maintRes = assetManagementService.logMaintenance({
    assetMasterId: macbook.id,
    issueDescription: 'Battery thermal calibration and diagnostic scan',
    serviceType: 'PREVENTIVE',
    vendor: 'Apple Authorized Service Center',
    cost: 4500,
    maintenanceDate: '2026-02-24',
    isUnderWarranty: true,
    remarks: 'Covered under AppleCare+ Zero Cost'
  }, mockAdmin);

  assert(maintRes.success, 'Test 11.1: Maintenance ticket logged successfully');
  const macbookMaintLogs = db.getAssetMaintenanceRecords().filter(m => m.assetMasterId === macbook.id);
  assert(macbookMaintLogs.length > 0, 'Test 11.2: Maintenance record persisted in db state');
  assert(macbookMaintLogs[0].cost === 4500, 'Test 11.3: Maintenance cost recorded accurately');

  // ---------------------------------------------------------
  // TEST 12: Warranty Expiration Center
  // ---------------------------------------------------------
  const expiring = assetManagementService.getExpiringWarranties(1200); // 1200 days will catch 2029 AppleCare
  assert(expiring.some(a => a.id === macbook.id), 'Test 12.1: Warranty expiration tracker accurately evaluates validity window');

  // ---------------------------------------------------------
  // TEST 13: Bulk Excel Ingestion with Error Isolation
  // ---------------------------------------------------------
  const mockValidExcelRows = [
    {
      'Asset Name': 'HP LaserJet Pro M404dn Printer',
      'Category': 'IT_ELECTRONICS',
      'Sub Category': 'Printer',
      'Brand': 'HP',
      'Model': 'M404dn',
      'Serial Number': 'HP-SN-BATCH-001',
      'Quantity': 1,
      'Purchase Date': '2026-02-15',
      'Purchase Cost': 28500,
      'Is Serialized': 'true'
    },
    {
      'Asset Name': 'Executive Conference Table 12-Seater',
      'Category': 'FURNITURE',
      'Sub Category': 'Table',
      'Brand': 'Godrej',
      'Model': 'Convene 12',
      'Quantity': 2,
      'Purchase Date': '2026-02-15',
      'Purchase Cost': 65000,
      'Is Serialized': 'false'
    }
  ];

  const bulkImportSuccessRes = assetManagementService.processBulkAssetImport(mockValidExcelRows, mockAdmin);
  assert(bulkImportSuccessRes.successCount === 2 && bulkImportSuccessRes.failureCount === 0, 'Test 13.1: Bulk Excel import of 2 valid items succeeds without errors');

  // Invalid Excel with duplicate serial to test transaction safety & error isolation
  const mockInvalidExcelRows = [
    {
      'Asset Name': 'Valid Item 1',
      'Category': 'IT_ELECTRONICS',
      'Sub Category': 'Scanner',
      'Serial Number': 'HP-SN-BATCH-001', // Already ingested above! Duplicate!
      'Quantity': 1,
      'Is Serialized': 'true'
    }
  ];

  const bulkImportFailRes = assetManagementService.processBulkAssetImport(mockInvalidExcelRows, mockAdmin);
  assert(bulkImportFailRes.failureCount === 1, 'Test 13.2: Bulk import with duplicate serial isolated error correctly');
  assert(bulkImportFailRes.errors[0].row === 2, 'Test 13.3: Error references correct row number');

  // ---------------------------------------------------------
  // TEST 14: Master Institutional Resource CRUD & Classroom Allocation
  // ---------------------------------------------------------
  const crRes = resourceAllocationService.allocateClassroom({
    academicYearId: 'ay-2026',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    resourceId: 'res-cr-2',
    dayOfWeek: undefined,
    timeSlot: 'FULL_SEMESTER',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31',
    remarks: 'B.Tech CSE Division A Primary Lecture Room'
  }, mockAdmin);

  assert(crRes.success, 'Test 14.1: Classroom allocation to CSE Sem 1 Div A succeeds');

  // ---------------------------------------------------------
  // TEST 15: Classroom Double-Booking Collision Prevention
  // ---------------------------------------------------------
  const clashCrRes = resourceAllocationService.allocateClassroom({
    academicYearId: 'ay-2026',
    instituteId: 'inst-1',
    departmentId: 'dept-me',
    programId: 'prog-2',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    resourceId: 'res-cr-2', // Double booking same room!
    timeSlot: 'FULL_SEMESTER',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31'
  }, mockAdmin);

  assert(!clashCrRes.success, 'Test 15.1: Double booking same classroom in same slot strictly blocked');
  assert(clashCrRes.message.includes('Conflict') || clashCrRes.message.includes('already allocated'), 'Test 15.2: Collision detection returns explicit conflict alert');

  // ---------------------------------------------------------
  // TEST 16: Laboratory Allocation with Equipment & Faculty
  // ---------------------------------------------------------
  const labRes = resourceAllocationService.allocateLaboratory({
    academicYearId: 'ay-2026',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    resourceId: 'res-lab-1',
    assignedFacultyId: 'fac-1',
    timeSlot: 'FULL_SEMESTER',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31',
    remarks: 'Advanced AI & Programming Lab'
  }, mockAdmin);

  assert(labRes.success, 'Test 16.1: Laboratory allocation succeeds');
  const labSummary = resourceAllocationService.getDepartmentResourceSummary('dept-cse');
  assert(labSummary.labs.length > 0, 'Test 16.2: CSE Department resource summary returns allocated lab');

  // ---------------------------------------------------------
  // TEST 17: Faculty Workload Allocation & Auto-Sync
  // ---------------------------------------------------------
  const facAllocRes = resourceAllocationService.allocateFaculty({
    facultyId: 'fac-1',
    instituteId: 'inst-1',
    departmentId: 'dept-cse',
    programId: 'prog-1',
    subjectId: 'sub-1',
    semesterId: 'sem-1',
    divisionId: 'div-1',
    academicYearId: 'ay-2026',
    teachingLoad: 5,
    theoryHours: 3,
    practicalHours: 2,
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31'
  }, mockAdmin);

  assert(facAllocRes.success, 'Test 17.1: Faculty workload allocation succeeds');
  const facultyLoad = resourceAllocationService.getFacultyAllocations('fac-1');
  assert(facultyLoad.length > 0, 'Test 17.2: Faculty load ledger auto-reflects teaching assignment');
  assert(facultyLoad[0].teachingLoad === 5, 'Test 17.3: Total load equals 5 hours/week');

  // ---------------------------------------------------------
  // TEST 18: Department Asset Requisition Lifecycle
  // ---------------------------------------------------------
  const reqRes = assetManagementService.createAllocationRequest({
    departmentId: 'dept-cse',
    instituteId: 'inst-1',
    category: 'IT_ELECTRONICS',
    subCategory: 'High Performance GPU Workstations',
    requestedQuantity: 10,
    specifications: 'NVIDIA RTX 4090, 64GB DDR5 RAM',
    justification: 'For Deep Learning & Generative AI Lab setup',
    priority: 'HIGH',
    targetLocation: 'Block A AI Lab'
  }, mockHOD);

  assert(reqRes.success && reqRes.request !== undefined, 'Test 18.1: Department HOD submits asset requisition succeeds');
  const req = reqRes.request!;
  assert(req.requestNo.startsWith('REQ-'), 'Test 18.2: Request assigned unique Requisition Number');

  // Approve Requisition
  const approveReqRes = assetManagementService.updateAllocationRequestStatus(
    req.id,
    'APPROVED',
    'Sanctioned under FY 2026-27 Research Infrastructure Budget',
    mockAdmin
  );
  assert(approveReqRes.success, 'Test 18.3: Central admin approval of requisition succeeds');

  // ---------------------------------------------------------
  // TEST 19: Conflict Engine Integrity
  // ---------------------------------------------------------
  const conflictReport = resourceAllocationService.detectAllConflicts();
  assert(Array.isArray(conflictReport), 'Test 19.1: Conflict engine executes and returns valid array');

  // ---------------------------------------------------------
  // TEST 20: Dashboard Metrics Integrity
  // ---------------------------------------------------------
  const dashMetrics = assetManagementService.getAssetDashboardMetrics();
  assert(dashMetrics.totalAssets > 0, 'Test 20.1: Dashboard total assets is positive');
  assert(dashMetrics.totalValue > 0, 'Test 20.2: Dashboard total valuation is calculated accurately');
  assert(dashMetrics.inStock >= 0 && dashMetrics.allocated >= 0, 'Test 20.3: Stock counts are valid non-negative numbers');

  console.log('\n======================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
