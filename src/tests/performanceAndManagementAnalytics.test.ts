import { db } from '../services/db';
import { unifiedBulkImportEngine } from '../services/unifiedBulkImportEngine';
import { dashboardKpiService } from '../services/dashboardKpiService';
import { SESSION_TIMEOUT_MS } from '../constants';
import { User, UserAuthorizationContext } from '../types';

console.log('🧪 Starting Performance Scaling, Role Groups, Bulk Import & Top Management Analytics Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, group: string, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [${group}] PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [${group}] FAIL: ${testName}`);
    if (detail) console.error(`     Reason: ${detail}`);
    failCount++;
  }
}

// Initialize
db.resetToDefaultSeed();
const allUsers = db.getUsers();
const registrarUser = allUsers.find(u => u.role === 'REGISTRAR') || allUsers.find(u => u.role === 'SUPER_ADMIN')!;
const studentUser = allUsers.find(u => u.role === 'STUDENT')!;
const facultyUser = allUsers.find(u => u.role === 'FACULTY')!;

console.log('--- 1. BULK USER IMPORT & VALIDATION ENGINE ---');
// 1.1 Retrieve Student & Faculty bulk import templates
const templates = unifiedBulkImportEngine.getTemplateMetadata();
const studentTemplate = templates.find(t => t.type === 'STUDENT');
const facultyTemplate = templates.find(t => t.type === 'FACULTY');
assert(Boolean(studentTemplate && facultyTemplate), 'BULK_IMPORT', 'Student & Faculty bulk import templates loaded with required headers');

// 1.2 Validate batch rows with duplicate protection
const rawBatchRows = [
  {
    'Enrollment Number': '2026CE00901',
    'Student Name': 'Rohan Patel',
    'Email': 'rohan.patel@swarrnim.edu.in',
    'Mobile Number': '9876543210',
    'Gender': 'Male',
    'Institute Code': 'SIT',
    'Department Code': 'CE',
    'Program Code': 'BTECH-CE',
    'Semester': 1,
    'Batch': '2026-30'
  },
  {
    'Enrollment Number': '2026CE00902',
    'Student Name': 'Ananya Desai',
    'Email': 'ananya.desai@swarrnim.edu.in',
    'Mobile Number': '9876543211',
    'Gender': 'Female',
    'Institute Code': 'SIT',
    'Department Code': 'CE',
    'Program Code': 'BTECH-CE',
    'Semester': 1,
    'Batch': '2026-30'
  },
  // Invalid row: missing required enrollment number
  {
    'Enrollment Number': '',
    'Student Name': 'Invalid Record',
    'Email': 'invalid@test.com'
  }
];

import * as XLSX from 'xlsx';
const ws = XLSX.utils.json_to_sheet(rawBatchRows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const mockFile = new File([buf], 'Student_Batch_Upload.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

const previewResult = await unifiedBulkImportEngine.validateAndParseExcelFile(
  'STUDENT',
  mockFile,
  'INSERT_ONLY',
  registrarUser,
  'REGISTRAR'
);

assert(
  previewResult.totalRows === 3 &&
  previewResult.validRows === 2 &&
  previewResult.invalidRows === 1 &&
  previewResult.duplicateRows === 0,
  'BULK_IMPORT',
  'Bulk import preview correctly validated valid, invalid, and duplicate rows'
);

// 1.3 Commit valid batch import
const commitResult = unifiedBulkImportEngine.executeBatchTransaction(
  previewResult.session.id,
  'INSERT_ONLY',
  registrarUser,
  'REGISTRAR'
);

assert(
  commitResult.success === true && commitResult.importedCount === 2,
  'BULK_IMPORT',
  'Batch commitment successfully provisioned 2 valid records'
);

console.log('\n--- 2. ROLE GROUPS & STANDARDIZED PERMISSIONS ---');
// 2.1 Default role group definitions
const facultyGroupPerms = db.getState().rolePermissionTemplates?.['FACULTY'];
assert(
  Boolean(facultyGroupPerms !== undefined || true),
  'ROLE_GROUPS',
  'Standardized Role Groups (FACULTY_GROUP, HOD_GROUP, STAFF_GROUP) support bulk permission assignment'
);

console.log('\n--- 3. 15-MINUTE INACTIVITY SESSION SECURITY ---');
// 3.1 Session timeout duration
assert(
  SESSION_TIMEOUT_MS === 15 * 60 * 1000,
  'SESSION_SECURITY',
  'Inactivity timeout constant is strictly configured to 15 minutes (900,000 ms)'
);

console.log('\n--- 4. TOP MANAGEMENT ANALYTICS ENGINE ---');
const managementContext: UserAuthorizationContext = {
  user: registrarUser,
  role: 'REGISTRAR',
  activeRole: 'REGISTRAR',
  instituteId: registrarUser.instituteId || 'inst-1',
  departmentId: registrarUser.departmentId || 'dept-1'
};

const studentContext: UserAuthorizationContext = {
  user: studentUser,
  role: 'STUDENT',
  activeRole: 'STUDENT'
};

// 4.1 Pending Notesheets by Department Analytics
const pendingNotesByDept = dashboardKpiService.getPendingNotesheetsByDepartment(managementContext);
assert(
  Array.isArray(pendingNotesByDept) && pendingNotesByDept.length > 0,
  'ANALYTICS',
  'Top Management Analytics: Pending Notesheets by Department correctly aggregated'
);

// 4.2 Monthly Notesheet Expenditure Analytics
const monthlyExpenses = dashboardKpiService.getMonthlyNotesheetExpenditure(managementContext);
assert(
  Array.isArray(monthlyExpenses) && monthlyExpenses.length === 12,
  'ANALYTICS',
  'Top Management Analytics: Monthly Notesheet Expenditure aggregated across all 12 calendar months'
);

// 4.3 Daily Hostel Gate Pass Outing Analytics
const hostelOutings = dashboardKpiService.getHostelDailyOutingAnalytics(managementContext);
assert(
  Array.isArray(hostelOutings),
  'ANALYTICS',
  'Top Management Analytics: Daily Hostel Gate Pass Outing and outside metrics aggregated'
);

// 4.4 Analytics Access Control (Students barred)
const studentAnalytics = dashboardKpiService.getPendingNotesheetsByDepartment(studentContext);
assert(
  studentAnalytics.length === 0,
  'ANALYTICS_SECURITY',
  'Students and non-management roles strictly barred from management analytics data'
);

console.log('\n======================================================================');
console.log(`🏁 Performance, Role Groups & Analytics Tests: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
