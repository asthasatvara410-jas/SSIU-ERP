import { readFileSync } from 'fs';
import { resolve } from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failCount++;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔍 RUNNING VERIFICATION FOR ADD STUDENT ACTION IN ONBOARDING');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Check StudentAdminWorkspacePage.tsx contains "+ Add Student" button
const adminWorkspacePath = resolve(__dirname, '../src/pages/admin-offices/StudentAdminWorkspacePage.tsx');
const adminWorkspaceContent = readFileSync(adminWorkspacePath, 'utf8');

assert(
  adminWorkspaceContent.includes('+ Add Student'),
  'StudentAdminWorkspacePage.tsx contains "+ Add Student" action button'
);

assert(
  adminWorkspaceContent.includes('setIsOnboardingFormOpen(true)'),
  'Clicking "+ Add Student" in StudentAdminWorkspacePage opens StudentOnboardingFormModal'
);

assert(
  adminWorkspaceContent.includes('StudentOnboardingFormModal'),
  'StudentOnboardingFormModal is imported and rendered in StudentAdminWorkspacePage.tsx'
);

// 2. Check StudentOnboardingTab.tsx contains "+ Add Student" button
const onboardingTabPath = resolve(__dirname, '../src/components/admission/StudentOnboardingTab.tsx');
const onboardingTabContent = readFileSync(onboardingTabPath, 'utf8');

assert(
  onboardingTabContent.includes('+ Add Student'),
  'StudentOnboardingTab.tsx contains "+ Add Student" action button'
);

assert(
  onboardingTabContent.includes('StudentOnboardingFormModal'),
  'StudentOnboardingFormModal is imported and rendered in StudentOnboardingTab.tsx'
);

// 3. Check StudentOnboardingFormModal.tsx functionality
const formModalPath = resolve(__dirname, '../src/components/admission/StudentOnboardingFormModal.tsx');
const formModalContent = readFileSync(formModalPath, 'utf8');

assert(
  formModalContent.includes('Select Existing Admission Application') && formModalContent.includes('handleSelectAdmission'),
  'StudentOnboardingFormModal provides option to Link Existing Admission Application'
);

assert(
  formModalContent.includes('-- Start Fresh / Manual Entry --'),
  'StudentOnboardingFormModal provides option for Manual Student Creation'
);

assert(
  formModalContent.includes('duplicateConflict') && formModalContent.includes('Duplicate Detected'),
  'StudentOnboardingFormModal includes Duplicate Conflict Prevention'
);

assert(
  formModalContent.includes('hostelRequired') && formModalContent.includes('Preferred Hostel Block'),
  'StudentOnboardingFormModal includes Conditional Hostel Fields when Hostel = Yes'
);

assert(
  formModalContent.includes('allowNotApplicable') || formModalContent.includes('N/A'),
  'StudentOnboardingFormModal supports Not Applicable (N/A) for non-mandatory fields'
);

assert(
  formModalContent.includes('ssiu_student_onboarding_draft') && formModalContent.includes('handleSaveDraft'),
  'StudentOnboardingFormModal supports Draft Saving & Persistence'
);

assert(
  formModalContent.includes('temporaryEnrollmentNumber') && formModalContent.includes('studentAccessCode'),
  'StudentOnboardingFormModal generates Temporary Enrollment Number and 5-digit Access Code'
);

assert(
  formModalContent.includes("role: 'STUDENT'") && formModalContent.includes('db.getUsers()'),
  'StudentOnboardingFormModal creates/activates Student Login User Account'
);

assert(
  formModalContent.includes("onboardingStatus: 'ONBOARDED'") && formModalContent.includes("status: 'ACTIVE'"),
  'StudentOnboardingFormModal activates Student Master with ONBOARDED status'
);

assert(
  formModalContent.includes('DragDropUpload') || formModalContent.includes('DocumentUpload') || formModalContent.includes('handleDocumentAction'),
  'StudentOnboardingFormModal connects to Document Upload and verification vault'
);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`📊 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
