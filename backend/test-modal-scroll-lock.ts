import fs from 'fs';
import path from 'path';

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

async function runModalScrollLockTestSuite() {
  console.log('======================================================================');
  console.log('🪟 SSIU ERP GLOBAL MODAL & VIEWPORT SCROLL LOCK TEST SUITE');
  console.log('======================================================================\n');

  // 1. Verify CSS rules in src/styles/index.css
  const cssPath = path.resolve(__dirname, '../src/styles/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert(cssContent.includes('html.modal-open') && cssContent.includes('body.modal-open'), 'Test 1.1: html.modal-open and body.modal-open styles defined in index.css');
  assert(cssContent.includes('overflow: hidden !important'), 'Test 1.2: Modal body lock sets overflow: hidden !important');
  assert(cssContent.includes('overscroll-behavior: none !important'), 'Test 1.3: Overscroll behavior disabled on body when modal is open');
  assert(cssContent.includes('max-height: calc(100dvh - 2rem) !important') || cssContent.includes('max-height: calc(100vh - 2rem) !important'), 'Test 1.4: Responsive viewport max-height defined for modal containers');
  assert(cssContent.includes('overscroll-behavior: contain !important'), 'Test 1.5: overscroll-behavior: contain enforced on modal overlay & body');
  assert(cssContent.includes('.modal-header') && cssContent.includes('flex-shrink: 0 !important'), 'Test 1.6: Modal header has flex-shrink: 0 !important');
  assert(cssContent.includes('.modal-footer') && cssContent.includes('flex-shrink: 0 !important'), 'Test 1.7: Modal footer has flex-shrink: 0 !important');
  assert(cssContent.includes('.modal-body') && cssContent.includes('overflow-y: auto !important'), 'Test 1.8: Modal body has overflow-y: auto !important');

  // 2. Verify modalScrollLock.ts utility
  const utilsPath = path.resolve(__dirname, '../src/utils/modalScrollLock.ts');
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');

  assert(utilsContent.includes('export function lockBodyScroll()'), 'Test 2.1: lockBodyScroll() function exported');
  assert(utilsContent.includes('export function unlockBodyScroll()'), 'Test 2.2: unlockBodyScroll() function exported');
  assert(utilsContent.includes('export function useModalScrollLock('), 'Test 2.3: useModalScrollLock() hook exported');
  assert(utilsContent.includes('export function initGlobalModalObserver()'), 'Test 2.4: initGlobalModalObserver() MutationObserver exported');
  assert(utilsContent.includes('window.addEventListener(\'wheel\''), 'Test 2.5: Wheel event scroll barrier registered to prevent background scrolling');
  assert(utilsContent.includes('window.addEventListener(\'keydown\''), 'Test 2.6: Global Escape key listener handles modal dismissal');

  // 3. Verify Modal.tsx root component
  const modalComponentPath = path.resolve(__dirname, '../src/components/common/Modal.tsx');
  const modalComponentContent = fs.readFileSync(modalComponentPath, 'utf8');

  assert(modalComponentContent.includes('useModalScrollLock(isOpen, onClose);'), 'Test 3.1: Modal.tsx consumes useModalScrollLock');
  assert(modalComponentContent.includes('role="dialog"') && modalComponentContent.includes('aria-modal="true"'), 'Test 3.2: Modal.tsx defines dialog role and aria-modal attributes');

  // 4. Verify main.tsx entry point
  const mainPath = path.resolve(__dirname, '../src/main.tsx');
  const mainContent = fs.readFileSync(mainPath, 'utf8');

  assert(mainContent.includes('./utils/modalScrollLock'), 'Test 4.1: modalScrollLock imported at application entry point (main.tsx)');

  console.log('\n======================================================================');
  console.log(`🏁 MODAL SCROLL LOCK TEST SUITE RESULTS: ${passedTests} PASSED | ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runModalScrollLockTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
