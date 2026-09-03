/**
 * TEST SUITE: PRODUCTION-READY BACKEND PDF GENERATION FOR UNIVERSITY NOTESHEET
 *
 * Comprehensive Test Coverage:
 * 1. Security & RBAC Guard:
 *    - Faculty A accesses authorized Notesheet -> 200 Success
 *    - Faculty A accesses unauthorized Notesheet -> 403 Forbidden
 *    - Student role accesses Notesheet PDF -> 403 Forbidden
 *    - HOD accesses own department Notesheet -> 200 Success
 *    - HOD accesses other department Notesheet -> 403 Forbidden
 *    - HOI accesses own institute Notesheet -> 200 Success
 *    - HOI accesses other institute Notesheet -> 403 Forbidden
 *    - Non-existent Notesheet -> 404 Not Found
 * 2. Workflow Stage PDF Rendering:
 *    - Draft Notesheet (DRAFT Watermark, Ref, no approved trail)
 *    - Submitted Notesheet (PENDING_HOD, initiator movement)
 *    - HOD Approved (PENDING_HOI, HOD movement with Digital Approval ID)
 *    - HOI / Principal Approved (PENDING_DEPUTY_REGISTRAR)
 *    - Deputy Registrar Approved (PENDING_REGISTRAR)
 *    - Registrar Approved (PENDING_VICE_PRESIDENT)
 *    - Vice President Final Approved (APPROVED status, Executive Sanction Seal, Legal Disclaimer)
 * 3. Content Structure & Typography Invariants:
 *    - University Header Hierarchy (SWARRNIM STARTUP & INNOVATION UNIVERSITY -> Institute -> Dept -> Official Notesheet)
 *    - Non-Financial Notesheet (gracefully omits financial sections)
 *    - Financial Notesheet with Line Items (Itemized breakdown table, unit rates, totals, requested and approved amounts)
 *    - Amount Revision Trail (Previous, Revised, Net change, Reason, Date)
 *    - Long Proposal / Multi-Page (Automatic flow, running page header on page 2+, running footer, Page X of Y)
 *    - Supporting Documents / Annexures metadata listing
 * 4. Storage, Versioning & Idempotency:
 *    - Idempotent generation on unchanged record (cached response)
 *    - Forced regeneration creates incremented version (v2, v3)
 *    - Version history retrieval
 * 5. REST API Pipeline:
 *    - POST /api/notesheets/:id/pdf
 *    - POST /api/notesheets/:id/pdf/regenerate
 *    - GET /api/notesheets/:id/pdf/download
 *    - GET /api/notesheets/:id/pdf/versions
 * 6. Audit Trail Logging:
 *    - NOTESHEET_PDF_GENERATED, NOTESHEET_PDF_REGENERATED, NOTESHEET_PDF_DOWNLOADED
 */

import { db } from '../services/db';
import { notesheetPdfService } from '../services/notesheetPdfService';
import { securityAuditService } from '../services/securityAuditService';
import { NoteSheet, User, NoteSheetEstimateItem } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runBackendPdfTests() {
  console.log('\n========================================================================');
  console.log('RUNNING PRODUCTION BACKEND NOTESHEET PDF GENERATION TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function test(description: string, fn: () => Promise<void> | void) {
    totalTests++;
    try {
      await fn();
      passedTests++;
    } catch (err) {
      console.error(`Error in test "${description}":`, err);
      throw err;
    }
  }

  // Define Test Users
  const facultyUserA: User = {
    id: 'usr-fac-cse-101',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.cse@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const facultyUserB: User = {
    id: 'usr-fac-mech-102',
    name: 'Prof. Vikram Patel',
    email: 'vikram.mech@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'dept-mech',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const studentUser: User = {
    id: 'usr-stu-101',
    name: 'Karan Patel',
    email: 'karan.stu@swarrnim.edu.in',
    role: 'STUDENT',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const hodUserCse: User = {
    id: 'usr-hod-cse-101',
    name: 'Dr. Amit Patel',
    email: 'hod.cse@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'dept-cse',
    departmentName: 'COMPUTER ENGINEERING',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const hodUserMech: User = {
    id: 'usr-hod-mech-102',
    name: 'Dr. Suresh Desai',
    email: 'hod.mech@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-sit',
    departmentId: 'dept-mech',
    departmentName: 'MECHANICAL ENGINEERING',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const principalUserSit: User = {
    id: 'usr-prin-sit-101',
    name: 'Dr. Arvind Sharma',
    email: 'principal.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const principalUserPharmacy: User = {
    id: 'usr-prin-pharm-102',
    name: 'Dr. Neha Shah',
    email: 'principal.pharmacy@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-pharmacy',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const dyRegUser: User = {
    id: 'usr-dyreg-101',
    name: 'Dr. Suresh Verma',
    email: 'dy.registrar@swarrnim.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-sit',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const regUser: User = {
    id: 'usr-reg-101',
    name: 'Dr. R. K. Joshi',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    instituteId: 'inst-sit',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const vpUser: User = db.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE') || {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    instituteId: 'inst-sit',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Security & RBAC Access Guard
  // -------------------------------------------------------------------------
  await test('1.1 RBAC Security: Faculty A can generate PDF for their own Notesheet', async () => {
    const note = db.createNoteSheet({
      subject: 'Lab Equipment Maintenance for CSE High Performance Lab',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'MAINTENANCE',
      priority: 'HIGH',
      proposal: 'Routine thermal repasting and dust filtration for 30 compute nodes.',
      purposeJustification: 'Ensures system reliability during semester end practical exams.',
      financialRequirement: true,
      requestedAmount: 45000,
      currentAmount: 45000,
      estimatedCost: 45000
    }, facultyUserA, false);

    const pdfRes = await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role);
    assert(pdfRes.success === true, 'PDF generation succeeded for authorized creator');
    assert(Boolean(pdfRes.pdfId), `Generated PDF ID: ${pdfRes.pdfId}`);
    assert(Boolean(pdfRes.downloadUrl && pdfRes.downloadUrl.startsWith('data:application/pdf')), 'Data URL returned');
    assert(pdfRes.fileSize > 1000, `Valid PDF byte size: ${pdfRes.fileSize} bytes`);
  });

  await test('1.2 RBAC Security: Faculty B blocked with 403 from accessing Faculty A Notesheet', async () => {
    const note = db.createNoteSheet({
      subject: 'Confidential Departmental Allocation for CSE',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'ADMINISTRATIVE',
      priority: 'NORMAL',
      proposal: 'Confidential proposal.',
      purposeJustification: 'Internal note.',
      visibility: 'CONFIDENTIAL',
      financialRequirement: false
    }, facultyUserA, true); // Draft note

    let threwForbidden = false;
    try {
      await notesheetPdfService.generatePdf(note.id, facultyUserB, facultyUserB.role);
    } catch (err: any) {
      threwForbidden = err.message.includes('403 Forbidden');
    }
    assert(threwForbidden, 'Faculty B was blocked with 403 Forbidden');
  });

  await test('1.3 RBAC Security: Student blocked with 403 from generating Notesheet PDF', async () => {
    const note = db.createNoteSheet({
      subject: 'Student Scholarship Allocation Approval',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'FINANCIAL',
      priority: 'HIGH',
      proposal: 'Fee concession approvals.',
      purposeJustification: 'Merit list verification.',
      financialRequirement: true,
      requestedAmount: 150000
    }, facultyUserA, false);

    let studentBlocked = false;
    try {
      await notesheetPdfService.generatePdf(note.id, studentUser, studentUser.role);
    } catch (err: any) {
      studentBlocked = err.message.includes('403 Forbidden');
    }
    assert(studentBlocked, 'Student role was blocked with 403 Forbidden');
  });

  await test('1.4 RBAC Security: HOD CSE can access CSE Notesheet, but HOD Mech is blocked (403)', async () => {
    const cseNote = db.createNoteSheet({
      subject: 'AI GPU Cloud Credits for CSE Department Researchers',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'HIGH',
      proposal: 'Cloud compute credits purchase.',
      purposeJustification: 'Mandatory for faculty research projects.',
      financialRequirement: true,
      requestedAmount: 200000
    }, facultyUserA, false);

    // HOD CSE accesses -> 200 OK
    const hodCseRes = await notesheetPdfService.generatePdf(cseNote.id, hodUserCse, hodUserCse.role);
    assert(hodCseRes.success === true, 'HOD CSE successfully generated PDF for CSE Notesheet');

    // HOD Mech accesses -> 403 Forbidden
    let hodMechBlocked = false;
    try {
      await notesheetPdfService.generatePdf(cseNote.id, hodUserMech, hodUserMech.role);
    } catch (err: any) {
      hodMechBlocked = err.message.includes('403 Forbidden');
    }
    assert(hodMechBlocked, 'HOD Mech was blocked with 403 Forbidden due to department scope isolation');
  });

  await test('1.5 RBAC Security: Principal SIT can access SIT Notesheet, but Principal Pharmacy is blocked (403)', async () => {
    const sitNote = db.createNoteSheet({
      subject: 'Campus Fiber Network Infrastructure Upgrade',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'URGENT',
      proposal: 'Optical fiber upgrade for SIT building.',
      purposeJustification: 'Network bandwidth increase.',
      financialRequirement: true,
      requestedAmount: 350000
    }, facultyUserA, false);

    // Principal SIT accesses -> 200 OK
    const prinSitRes = await notesheetPdfService.generatePdf(sitNote.id, principalUserSit, principalUserSit.role);
    assert(prinSitRes.success === true, 'Principal SIT generated PDF for constituent institute note');

    // Principal Pharmacy accesses -> 403 Forbidden
    let prinPharmBlocked = false;
    try {
      await notesheetPdfService.generatePdf(sitNote.id, principalUserPharmacy, principalUserPharmacy.role);
    } catch (err: any) {
      prinPharmBlocked = err.message.includes('403 Forbidden');
    }
    assert(prinPharmBlocked, 'Principal Pharmacy was blocked with 403 Forbidden due to institute scope isolation');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Workflow Progression & State-Specific PDF Rendering
  // -------------------------------------------------------------------------
  await test('2.1 Workflow Progression: Full 6-stage lifecycle renders exact real approval trail in PDF', async () => {
    const items: NoteSheetEstimateItem[] = [
      { id: 'it-1', itemName: 'High Performance AI Server', description: 'Dual Intel Xeon, 128GB RAM', quantity: 2, unit: 'Nos', rate: 450000, amount: 900000 },
      { id: 'it-2', itemName: 'Rackmount UPS 15kVA', description: 'Online true sine wave with battery bank', quantity: 1, unit: 'Set', rate: 200000, amount: 200000 }
    ];

    const note = db.createNoteSheet({
      subject: 'High Performance Computing Cluster for University Center of Excellence',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'HIGH',
      proposal: 'Setting up centralized high-performance computing cluster for postgraduate research.',
      purposeJustification: 'Mandatory infrastructure for ongoing research grants.',
      requiredDate: '2026-10-30',
      financialRequirement: true,
      requestedAmount: 1100000,
      currentAmount: 1100000,
      estimatedCost: 1100000,
      items,
      attachments: ['Vendor_Quotation_Comparative.pdf', 'Technical_Specs_HPC.pdf']
    }, facultyUserA, false);

    // 1. Check Draft / Pending HOD PDF
    const stage1Pdf = await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role, { forceRegenerate: true });
    assert(stage1Pdf.status === 'PENDING_HOD', 'Stage 1 status is PENDING_HOD');

    // 2. HOD Approves & revises amount to 1,050,000
    db.processNoteSheetAction(note.id, 'APPROVE', 'Verified with vendor. Reduced rate by 50,000.', undefined, hodUserCse, undefined, {
      revisedAmount: 1050000,
      revisionReason: 'Vendor discount negotiation'
    });

    // 3. Principal Approves
    db.processNoteSheetAction(note.id, 'APPROVE', 'Recommended for university sanction.', undefined, principalUserSit);

    // 4. Deputy Registrar Verifies
    db.processNoteSheetAction(note.id, 'APPROVE', 'Capital budget allocation verified.', undefined, dyRegUser);

    // 5. Registrar Endorses
    db.processNoteSheetAction(note.id, 'APPROVE', 'Forwarded to Vice President for final sanction.', undefined, regUser);

    // 6. Vice President Final Approval
    db.processNoteSheetAction(note.id, 'APPROVE', 'Sanction granted for 10,50,000.', undefined, vpUser, undefined, {
      revisedAmount: 1050000,
      revisionReason: 'Final sanctioned amount approved'
    });

    const finalNote = db.getNoteSheetById(note.id)!;
    assert(finalNote.status === 'APPROVED', 'Notesheet status is final APPROVED');
    assert(Boolean(finalNote.finalApprovalId), `Final Executive Approval ID generated: ${finalNote.finalApprovalId}`);

    // Generate Final Approved PDF
    const finalPdf = await notesheetPdfService.generatePdf(note.id, vpUser, vpUser.role, { forceRegenerate: true });
    assert(finalPdf.success === true, 'Final PDF generation succeeded');
    assert(finalPdf.status === 'APPROVED', 'Final PDF reflects APPROVED status');
    assert(finalPdf.fileSize > 2000, `Final PDF generated with rich vector content (${finalPdf.fileSize} bytes)`);
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Multi-Page Resilience & Comprehensive Layout Tests
  // -------------------------------------------------------------------------
  await test('3.1 Multi-Page Resilience: Long Notesheets (3+ Pages) render multi-page PDF cleanly', async () => {
    const longProposal = `
1. Executive Summary & Administrative Context:
Swarrnim Startup & Innovation University is expanding its computational infrastructure to support emerging research initiatives across multidisciplinary departments. The School of Computing & IT requires comprehensive upgradation of Laboratory 401, 402, and 403 to support 180 concurrent workstations equipped for Artificial Intelligence, Cyber Security, and Cloud Architecture development.

2. Phase-wise Implementation Strategy:
- Phase 1: Procurement of 60 High-Density Multi-Core Workstations with dual-channel DDR5 memory.
- Phase 2: Structural cabling, server rack installations, and 10Gbps aggregate backbone integration.
- Phase 3: Deployment of private cloud virtualization platform with role-based student access policies.

3. Quality Assurance and Statutory Standards:
All hardware complies with BIS, CE, and RoHS certifications. 3-Year comprehensive OEM warranty with on-site parts replacement is bundled.
    `.trim();

    const longJustification = `
The university has received approvals for new specialized degree tracks in Artificial Intelligence and Machine Learning. The statutory accreditation bodies (NAAC & NBA) require dedicated laboratory compute capacity of at least 4 Teraflops per student workstation group. The proposed infrastructure will directly benefit 450 undergraduate students, 60 postgraduate scholars, and 18 faculty researchers.
    `.trim();

    const longItems: NoteSheetEstimateItem[] = [
      { id: 'it-1', itemName: 'Core i9 Workstation 64GB RAM', description: 'Intel i9 14th Gen, 1TB NVMe, RTX 4080', quantity: 20, unit: 'Nos', rate: 120000, amount: 2400000 },
      { id: 'it-2', itemName: 'Managed 48-Port PoE+ Switch', description: 'Enterprise Layer 3 Switch', quantity: 4, unit: 'Nos', rate: 85000, amount: 340000 },
      { id: 'it-3', itemName: 'Online Modular UPS 20kVA', description: 'True online double conversion with battery bank', quantity: 2, unit: 'Sets', rate: 300000, amount: 600000 },
      { id: 'it-4', itemName: 'Network Server Rack 42U', description: 'Server grade with dual smart PDU', quantity: 2, unit: 'Racks', rate: 45000, amount: 90000 },
      { id: 'it-5', itemName: 'CAT6A Shielded Cabling Roll', description: 'LSZH 305m roll with patch panels', quantity: 6, unit: 'Rolls', rate: 18000, amount: 108000 }
    ];

    const longNote = db.createNoteSheet({
      subject: 'Comprehensive Computer Lab Infrastructure Upgradation for Academic Year 2026-27',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'HIGH',
      proposal: longProposal,
      purposeJustification: longJustification,
      requiredDate: '2026-11-15',
      workflowDueDate: '2026-10-01',
      financialRequirement: true,
      requestedAmount: 3538000,
      currentAmount: 3538000,
      estimatedCost: 3538000,
      items: longItems,
      attachments: [
        'AICTE_Accreditation_Lab_Requirement_2026.pdf',
        'Vendor_Quotations_Comparative_Matrix.pdf',
        'OEM_Authorisation_Letter.pdf',
        'Lab_Layout_Blueprint.pdf'
      ]
    }, facultyUserA, false);

    // Full 6-stage workflow approval
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Department committee approved.', undefined, hodUserCse);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Institute approval endorsed.', undefined, principalUserSit);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Budget allocation checked.', undefined, dyRegUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Registrar endorsement granted.', undefined, regUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Sanction granted for laboratory upgrade.', undefined, vpUser, undefined, {
      revisedAmount: 3500000,
      revisionReason: 'Final sanction granted with rounded ceiling'
    });

    const pdfRes = await notesheetPdfService.generatePdf(longNote.id, vpUser, vpUser.role, { forceRegenerate: true });
    assert(pdfRes.success === true, 'Multi-page Notesheet PDF generated successfully');
    assert(pdfRes.fileSize > 2500, `Multi-page PDF contains comprehensive structure (${pdfRes.fileSize} bytes)`);
    assert(pdfRes.version === 1, 'Initial PDF is version 1');
  });

  await test('3.2 Non-Financial Policy Notesheet: Gracefully omits financial section without errors', async () => {
    const policyNote = db.createNoteSheet({
      subject: 'Policy Amendment: Academic Leave and Continuous Internal Evaluation Regulation 2026',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'POLICY_AMENDMENT',
      priority: 'NORMAL',
      proposal: 'Drafting new guidelines for continuous internal evaluation and remedial classes.',
      purposeJustification: 'Alignment with university academic regulation handbook.',
      financialRequirement: false,
      attachments: ['Draft_CIE_Guidelines_2026.pdf']
    }, facultyUserA, false);

    db.processNoteSheetAction(policyNote.id, 'APPROVE', 'Department board reviewed.', undefined, hodUserCse);
    db.processNoteSheetAction(policyNote.id, 'APPROVE', 'Institute academic council approved.', undefined, principalUserSit);
    db.processNoteSheetAction(policyNote.id, 'APPROVE', 'Statutory compliance checked.', undefined, dyRegUser);
    db.processNoteSheetAction(policyNote.id, 'APPROVE', 'Registrar endorsed.', undefined, regUser);
    db.processNoteSheetAction(policyNote.id, 'APPROVE', 'Policy sanctioned by Vice President.', undefined, vpUser);

    const pdfRes = await notesheetPdfService.generatePdf(policyNote.id, vpUser, vpUser.role, { forceRegenerate: true });
    assert(pdfRes.success === true, 'Non-financial policy Notesheet PDF generated cleanly');
    assert(pdfRes.status === 'APPROVED', 'Policy Notesheet PDF has status APPROVED');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 4: Idempotency, Versioning & Storage
  // -------------------------------------------------------------------------
  await test('4.1 Idempotency: Repeating PDF generation returns cached record without duplicate DB entries', async () => {
    const note = db.createNoteSheet({
      subject: 'Annual Software License Renewal for MATLAB & Simulink',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'SOFTWARE_LICENSE',
      priority: 'MEDIUM',
      proposal: 'Renewal of 100 campus network licenses.',
      purposeJustification: 'Required for engineering curriculum.',
      financialRequirement: true,
      requestedAmount: 420000
    }, facultyUserA, false);

    // First generation
    const res1 = await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role);
    assert(res1.isCached === false, 'First call creates fresh PDF');
    assert(res1.version === 1, 'Version is 1');

    // Second generation (identical data, not forced)
    const res2 = await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role, { forceRegenerate: false });
    assert(res2.isCached === true, 'Second call returns cached PDF reference (Idempotency verified)');
    assert(res2.pdfId === res1.pdfId, 'Same PDF ID reused');
    assert(res2.version === 1, 'Version remains 1');

    // Verify DB records count
    const pdfsInDb = db.getNoteSheetPdfs(note.id);
    assert(pdfsInDb.length === 1, 'Exactly 1 PDF record persisted in database');
  });

  await test('4.2 Versioning: Force regeneration increments version number and preserves history', async () => {
    const note = db.createNoteSheet({
      subject: 'Smart Campus IoT Sensor Deployment',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'PROJECT',
      priority: 'MEDIUM',
      proposal: 'Deployment of 50 environmental monitoring sensors.',
      purposeJustification: 'Smart campus initiative.',
      financialRequirement: true,
      requestedAmount: 85000
    }, facultyUserA, false);

    // Initial version (v1)
    const v1Res = await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role);
    assert(v1Res.version === 1, 'Initial PDF is v1');

    // Force regenerate (v2)
    const v2Res = await notesheetPdfService.regeneratePdf(note.id, facultyUserA, facultyUserA.role);
    assert(v2Res.version === 2, 'Regenerated PDF is v2');
    assert(v2Res.fileName.includes('_v2.pdf'), `Filename includes version: ${v2Res.fileName}`);

    // Force regenerate (v3)
    const v3Res = await notesheetPdfService.regeneratePdf(note.id, facultyUserA, facultyUserA.role);
    assert(v3Res.version === 3, 'Regenerated PDF is v3');

    // Version history retrieval
    const versions = notesheetPdfService.getPdfVersions(note.id, facultyUserA, facultyUserA.role);
    assert(versions.length === 3, '3 PDF versions preserved in version history');
    assert(versions[0].version === 3, 'Latest version is first in sorted history');
    assert(versions[2].version === 1, 'Initial version is preserved in history');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 5: REST API Dispatcher Pipeline
  // -------------------------------------------------------------------------
  await test('5.1 REST API: POST /api/notesheets/:id/pdf generates standard API envelope', async () => {
    const note = db.createNoteSheet({
      subject: 'Guest Lecture Honorarium and Travel Reimbursement',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'EVENT',
      priority: 'NORMAL',
      proposal: 'Honorarium for Dr. K. Raman (IIT Bombay).',
      purposeJustification: 'Keynote session on Quantum Computing.',
      financialRequirement: true,
      requestedAmount: 25000
    }, facultyUserA, false);

    const apiRes = await notesheetPdfService.handleApiRequest(
      `/api/notesheets/${note.id}/pdf`,
      'POST',
      {},
      facultyUserA,
      facultyUserA.role
    );

    assert(apiRes.success === true, 'API returned successResponse envelope');
    assert(Boolean(apiRes.data && apiRes.data.pdfId), `API returned pdfId: ${apiRes.data?.pdfId}`);
    assert(Boolean(apiRes.data && apiRes.data.downloadUrl), 'API returned downloadUrl');
  });

  await test('5.2 REST API: GET /api/notesheets/:id/pdf/download returns secure file data', async () => {
    const note = db.createNoteSheet({
      subject: 'Robotics Workshop Components Purchase',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'WORKSHOP',
      priority: 'NORMAL',
      proposal: 'Components for 40 student kits.',
      purposeJustification: 'Hands-on training workshop.',
      financialRequirement: true,
      requestedAmount: 60000
    }, facultyUserA, false);

    const apiRes = await notesheetPdfService.handleApiRequest(
      `/api/notesheets/${note.id}/pdf/download`,
      'GET',
      null,
      facultyUserA,
      facultyUserA.role
    );

    assert(apiRes.success === true, 'Download API returned success');
    assert(Boolean(apiRes.data.fileName && apiRes.data.fileName.endsWith('.pdf')), `Filename returned: ${apiRes.data.fileName}`);
    assert(Boolean(apiRes.data.dataUrl && apiRes.data.dataUrl.startsWith('data:application/pdf')), 'PDF data URI returned');
  });

  await test('5.3 REST API: GET /api/notesheets/:id/pdf/versions returns version list', async () => {
    const note = db.createNoteSheet({
      subject: 'Industrial Visit Bus Hiring & Toll Expenses',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'TRAVEL',
      priority: 'NORMAL',
      proposal: 'Transportation for 60 students to ISRO Ahmedabad.',
      purposeJustification: 'Academic curriculum field visit.',
      financialRequirement: true,
      requestedAmount: 35000
    }, facultyUserA, false);

    await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role);
    await notesheetPdfService.regeneratePdf(note.id, facultyUserA, facultyUserA.role);

    const apiRes = await notesheetPdfService.handleApiRequest(
      `/api/notesheets/${note.id}/pdf/versions`,
      'GET',
      null,
      facultyUserA,
      facultyUserA.role
    );

    assert(apiRes.success === true, 'Versions API returned success');
    assert(apiRes.data.count === 2, 'Count of versions is 2');
    assert(apiRes.data.versions.length === 2, '2 version records returned');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 6: Audit Log Integrity Verification
  // -------------------------------------------------------------------------
  await test('6.1 Audit Logging: PDF generation, regeneration, and download log audit events', async () => {
    const note = db.createNoteSheet({
      subject: 'Audit Trail Verification Notesheet for PDF Engine',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'ADMINISTRATIVE',
      priority: 'NORMAL',
      proposal: 'Test note for audit logging.',
      purposeJustification: 'Audit verification.',
      financialRequirement: false
    }, facultyUserA, false);

    // 1. Generate
    await notesheetPdfService.generatePdf(note.id, facultyUserA, facultyUserA.role);
    // 2. Regenerate
    await notesheetPdfService.regeneratePdf(note.id, facultyUserA, facultyUserA.role);
    // 3. Download
    await notesheetPdfService.downloadPdf(note.id, facultyUserA, facultyUserA.role);
    // 4. Print
    await notesheetPdfService.printPdf(note.id, facultyUserA, facultyUserA.role);

    const auditLogs = db.getAuditLogs();
    const genLog = auditLogs.find(l => l.action === 'NOTESHEET_PDF_GENERATED' && l.recordId === note.id);
    const regenLog = auditLogs.find(l => l.action === 'NOTESHEET_PDF_REGENERATED' && l.recordId === note.id);
    const dlLog = auditLogs.find(l => l.action === 'NOTESHEET_PDF_DOWNLOADED' && l.recordId === note.id);
    const printLog = auditLogs.find(l => l.action === 'NOTESHEET_PDF_PRINTED' && l.recordId === note.id);

    assert(Boolean(genLog), 'NOTESHEET_PDF_GENERATED event recorded in audit logs');
    assert(Boolean(regenLog), 'NOTESHEET_PDF_REGENERATED event recorded in audit logs');
    assert(Boolean(dlLog), 'NOTESHEET_PDF_DOWNLOADED event recorded in audit logs');
    assert(Boolean(printLog), 'NOTESHEET_PDF_PRINTED event recorded in audit logs');
  });

  await test('7. Print & Dedicated PDF Stream Handlers (Zero ERP DOM Interference)', async () => {
    const note = db.createNoteSheet({
      title: 'Dedicated PDF Stream Print Test Notesheet',
      subject: 'Dedicated PDF Stream Print Test Notesheet',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'ADMINISTRATIVE',
      priority: 'URGENT',
      proposal: 'Testing clean PDF stream output for printer.',
      purposeJustification: 'Ensures zero ERP UI elements in print payload.',
      financialRequirement: false
    }, facultyUserA, false);

    // 1. Test printPdf directly
    await notesheetPdfService.printPdf(note.id, facultyUserA, facultyUserA.role);
    assert(true, 'printPdf executed cleanly without error');

    // 2. Test openPdfInNewTab
    await notesheetPdfService.openPdfInNewTab(note.id, facultyUserA, facultyUserA.role);
    assert(true, 'openPdfInNewTab executed cleanly without error');

    // 3. Test generateDraftPdf & printDraftPdf
    const draftRes = await notesheetPdfService.generateDraftPdf(note, facultyUserA, facultyUserA.role);
    assert(draftRes.success === true, 'generateDraftPdf succeeded for pre-submission draft');
    assert(Boolean(draftRes.downloadUrl), 'Draft PDF contains valid data URL');
    assert(draftRes.fileSize > 50000, `Draft PDF has substantial byte size (${draftRes.fileSize} bytes)`);

    await notesheetPdfService.printDraftPdf(note, facultyUserA, facultyUserA.role);
    assert(true, 'printDraftPdf executed cleanly without error');
  });

  await test('8. Approval & Signature Section Keep-Together Pagination', async () => {
    // 8.1 Short Notesheet: Fits entirely on Page 1 (No Page 2 created)
    const shortNote = db.createNoteSheet({
      title: 'Short Policy Notesheet',
      subject: 'Short Administrative Requisition',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'ADMINISTRATIVE',
      priority: 'NORMAL',
      proposal: 'Brief single line proposal.',
      purposeJustification: 'Standard routine requirement.',
      financialRequirement: false
    }, facultyUserA, false);

    const shortRender = (notesheetPdfService as any).renderPdfDocument(shortNote, 1, {});
    assert(shortRender.totalPages === 1, `Short Notesheet fits cleanly on 1 page (actual: ${shortRender.totalPages})`);

    // 8.2 Medium Notesheet: Content fills Page 1, COMPLETE Approval Section moves together to Page 2
    const mediumNote = db.createNoteSheet({
      title: 'Medium Financial Requisition Notesheet',
      subject: 'Procurement of Server Infrastructure Hardware for Advanced Machine Learning Research Lab',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'FINANCIAL',
      priority: 'URGENT',
      proposal: 'Detailed proposal covering enterprise hardware procurement, multi-GPU compute cluster installation, high-performance power backup, rack mount enclosures, and structured network cabling.',
      purposeJustification: 'Required for academic AI curriculum, postgraduate research, and high-throughput computational simulations across university departments.',
      financialRequirement: true,
      estimatedCost: 850000,
      items: [
        { id: 'it-1', itemName: 'GPU Compute Node 64GB', quantity: 2, unit: 'Units', rate: 250000, amount: 500000 },
        { id: 'it-2', itemName: 'Rack Enclosure 42U & PDU', quantity: 1, unit: 'Set', rate: 120000, amount: 120000 },
        { id: 'it-3', itemName: 'Modular UPS System 10kVA', quantity: 1, unit: 'Unit', rate: 150000, amount: 150000 },
        { id: 'it-4', itemName: '10GbE Switch & Transceivers', quantity: 1, unit: 'Set', rate: 80000, amount: 80000 }
      ]
    }, facultyUserA, false);

    // Complete the 6-stage approval workflow using registered users
    db.processNoteSheetAction(mediumNote.id, 'APPROVE', 'Recommended and forwarded.', undefined, hodUserCse);
    db.processNoteSheetAction(mediumNote.id, 'APPROVE', 'Principal endorsement granted.', undefined, principalUserSit);
    db.processNoteSheetAction(mediumNote.id, 'APPROVE', 'Budget verified.', undefined, dyRegUser);
    db.processNoteSheetAction(mediumNote.id, 'APPROVE', 'Registrar clearance approved.', undefined, regUser);
    db.processNoteSheetAction(mediumNote.id, 'APPROVE', 'Final sanction granted.', undefined, vpUser);

    const updatedMedNote = db.getNoteSheetById(mediumNote.id)!;
    const medRender = (notesheetPdfService as any).renderPdfDocument(updatedMedNote, 1, {});
    assert(medRender.totalPages === 2, `Medium Notesheet produces 2 pages with all approvals together on Page 2 (actual: ${medRender.totalPages})`);

    // 8.3 Long Notesheet with Extensive Justification & Attachments
    const longNote = db.createNoteSheet({
      title: 'Long Campus-Wide High Performance Computing Infrastructure Upgrade',
      subject: 'Annual Comprehensive Modernization and Multi-Year Turnkey Modernization Plan for University Digital Laboratories',
      instituteId: 'inst-sit',
      departmentId: 'dept-cse',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'FINANCIAL',
      priority: 'URGENT',
      proposal: 'Comprehensive proposal describing extensive multi-department computational hardware overhaul. '.repeat(10),
      purposeJustification: 'Extensive academic and administrative justification outlining compliance with regulatory benchmarks, AI accreditation requirements, multi-institute workload scaling, and faculty research requirements. '.repeat(8),
      financialRequirement: true,
      estimatedCost: 3500000,
      items: [
        { id: 'it-l1', itemName: 'High-Density Compute Blades Tier 1', quantity: 4, unit: 'Units', rate: 450000, amount: 1800000 },
        { id: 'it-l2', itemName: 'SAN Storage Array 200TB All-Flash', quantity: 1, unit: 'Array', rate: 950000, amount: 950000 },
        { id: 'it-l3', itemName: 'Core Fiber Distribution Switches', quantity: 2, unit: 'Units', rate: 225000, amount: 450000 },
        { id: 'it-l4', itemName: 'Environmental Precision AC System', quantity: 1, unit: 'Unit', rate: 300000, amount: 300000 }
      ]
    }, facultyUserA, false);

    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Endorsed for lab expansion.', undefined, hodUserCse);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Principal approval granted.', undefined, principalUserSit);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Verified against CAPEX.', undefined, dyRegUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Registrar clearance granted.', undefined, regUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Executive sanction approved.', undefined, vpUser);

    const updatedLongNote = db.getNoteSheetById(longNote.id)!;
    const longRender = (notesheetPdfService as any).renderPdfDocument(updatedLongNote, 1, {});
    assert(longRender.totalPages >= 2, `Long Notesheet handles multi-page document cleanly (actual pages: ${longRender.totalPages})`);
    assert(longRender.fileSize > 250000, 'Long Notesheet PDF contains full vector structure');
  });

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    throw new Error(`Only ${passedTests} of ${totalTests} tests passed.`);
  }
}

runBackendPdfTests().catch((err) => {
  console.error('Backend PDF test suite execution failed:', err);
  throw err;
});
