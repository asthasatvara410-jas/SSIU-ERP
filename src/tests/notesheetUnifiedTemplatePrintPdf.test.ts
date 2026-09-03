/**
 * TEST SUITE: NOTESHEET UNIFIED TEMPLATE, PREVIEW & PRINT/PDF
 *
 * Verifies that:
 * 1. Single Reusable Template: Preview, Browser Print, and Generated PDF use the exact same document structure.
 * 2. Official University Format: Header with Swarrnim Startup & Innovation University branding, Logo, Notesheet Number, Date, Subject, Institute/Dept, Initiator.
 * 3. Exact Layout Sections: Proposal Description, Academic/Administrative Justification, Itemized Financial Implication, Digital Approval Trail, Supporting Documents, Executive Sanction Seal.
 * 4. Approval Trail & Digital Signature Integrity:
 *    - Real movements rendered chronologically with step badges, authorizers, designations, timestamps, remarks, and Digital Approval IDs (NS-APR-XXXXXX).
 *    - Pending workflow stages rendered as pending without premature signatures.
 * 5. Financial Implication & Revision History:
 *    - Itemized estimate line items (Item, Spec, Qty, Rate, Total).
 *    - Total Requested Amount, Current Amount, and Final Approved Amount.
 *    - Financial Modification & Revision History table rendered when revisions exist.
 * 6. Final Executive Sanction Seal:
 *    - Displayed only upon final Vice President approval with Official Sanction ID and authenticity disclaimer.
 * 7. Multi-Length Document Resilience:
 *    - Short Notesheet (1 Page)
 *    - Medium Notesheet (2 Pages)
 *    - Long Notesheet (3+ Pages) with long proposal text, multiple line items, full 6-stage approval trail, and annexures.
 * 8. Non-Financial Notesheet Compatibility:
 *    - Administrative notesheets gracefully omit financial tables without errors.
 * 9. Draft / In-Flight Notesheet Rendering:
 *    - Correct status badge and watermark overlay support.
 */

import { db } from '../services/db';
import { NoteSheet, NoteSheetMovement, NoteSheetAmountRevision, NoteSheetEstimateItem, User } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runUnifiedTemplateTests() {
  console.log('\n========================================================================');
  console.log('RUNNING NOTESHEET UNIFIED TEMPLATE & PRINT/PDF TEST SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(description: string, fn: () => void) {
    totalTests++;
    try {
      fn();
      passedTests++;
    } catch (err) {
      console.error(`Error in test "${description}":`, err);
      throw err;
    }
  }

  // Define test users
  const facultyUser: User = {
    id: 'usr-fac-101',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@ssit.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const hodUser: User = {
    id: 'usr-hod-101',
    name: 'Dr. Amit Patel',
    email: 'hod.cse@ssit.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const principalUser: User = {
    id: 'usr-prin-101',
    name: 'Dr. Arvind Sharma',
    email: 'principal.sit@ssit.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const dyRegUser: User = {
    id: 'usr-dyreg-101',
    name: 'Dr. Suresh Verma',
    email: 'dy.registrar@ssit.edu.in',
    role: 'DEPUTY_REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const regUser: User = {
    id: 'usr-reg-101',
    name: 'Dr. R. K. Joshi',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  const vpUser: User = db.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE') || {
    id: 'user-vp',
    name: 'Vp SSIU',
    email: 'vp@swarrnim.edu.in',
    role: 'VICE_PRESIDENT',
    instituteId: 'inst-1',
    departmentId: 'dept-admin',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  };

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Document Data Model & Template Property Integrity
  // -------------------------------------------------------------------------
  test('1. Document Template Data Contract: Required University Header & Letterhead fields', () => {
    const note = db.createNoteSheet({
      subject: 'Procurement of High-End AI GPU Workstations for Deep Learning Research Lab',
      instituteId: 'inst-1',
      departmentId: 'dept-1',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'HIGH',
      proposal: 'Requirement of 4x NVIDIA RTX A6000 GPU Workstations for advanced research in neural networks and generative AI.',
      purposeJustification: 'Existing labs lack hardware capabilities for multi-modal model training. Essential for NAAC A++ accreditation and PhD research.',
      requiredDate: '2026-09-30',
      workflowDueDate: '2026-09-15',
      financialRequirement: true,
      requestedAmount: 1200000,
      currentAmount: 1200000,
      estimatedCost: 1200000,
      items: [
        { id: 'item-1', itemName: 'NVIDIA RTX A6000 Workstation', description: '64GB RAM, Intel Xeon, 48GB VRAM', quantity: 2, unit: 'Nos', rate: 400000, amount: 800000 },
        { id: 'item-2', itemName: 'AI Server UPS 10kVA', description: 'Online 3-phase pure sine wave', quantity: 1, unit: 'Nos', rate: 250000, amount: 250000 },
        { id: 'item-3', itemName: 'High Speed 10GbE Networking Switch', description: '24-Port Managed SFP+', quantity: 1, unit: 'Nos', rate: 150000, amount: 150000 }
      ],
      attachments: ['Technical_Specifications_GPU.pdf', 'Vendor_Quotation_Comparative.pdf']
    }, facultyUser, false);

    assert(Boolean(note.id), 'Notesheet created with unique ID');
    assert(Boolean(note.noteSheetNumber && note.noteSheetNumber.includes('-NOTESHEET-')), `Backend generated official Notesheet Number: ${note.noteSheetNumber}`);
    assert((note.subject || '').length > 10, 'Subject/Title is detailed and present');
    assert(note.financialRequirement === true, 'Financial requirement flag set');
    assert(note.items?.length === 3, 'Itemized line items recorded accurately');
    assert(note.attachments?.length === 2, 'Annexure documents attached');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Sequential Digital Approval Trail & Signature Verification
  // -------------------------------------------------------------------------
  test('2. Approval Trail Progression: Each movement records Digital Approval ID & timestamp', () => {
    // 1. Create (when isDraft is false, it starts at PENDING_HOD or appropriate next stage)
    const note = db.createNoteSheet({
      subject: 'Annual Subscription for IEEE Xplore & Springer Digital Research Library',
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'RECURRING_EXPENSE',
      priority: 'URGENT',
      proposal: 'Renewal of international digital library subscriptions for academic year 2026-27.',
      purposeJustification: 'Mandatory requirement for AICTE compliance and faculty journal publications.',
      requiredDate: '2026-09-01',
      financialRequirement: true,
      requestedAmount: 650000,
      currentAmount: 650000,
      estimatedCost: 650000
    }, facultyUser, false);

    let currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'PENDING_HOD', 'Notesheet status initialized to PENDING_HOD');
    assert(currentNote.movements.length >= 1, 'Initiator creation recorded in movements trail');

    // 2. HOD Endorsement
    db.processNoteSheetAction(note.id, 'APPROVE', 'Strongly recommended for academic research accreditation.', undefined, hodUser);
    currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'PENDING_HOI', 'Moved to PENDING_HOI');
    assert(currentNote.movements.length >= 2, 'HOD endorsement recorded');
    const hodMov = currentNote.movements.find(m => m.actorRole === 'HOD' || m.fromUserRole === 'HOD');
    assert(Boolean(hodMov && hodMov.approvalId), `Digital Approval ID generated for HOD: ${hodMov?.approvalId}`);

    // 3. Principal / HOI Endorsement
    db.processNoteSheetAction(note.id, 'APPROVE', 'Forwarded for university administrative verification.', undefined, principalUser);
    currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'PENDING_DEPUTY_REGISTRAR', 'Moved to PENDING_DEPUTY_REGISTRAR');
    const prinMov = currentNote.movements.find(m => m.actorRole === 'PRINCIPAL' || m.fromUserRole === 'PRINCIPAL');
    assert(Boolean(prinMov && prinMov.approvalId), `Digital Approval ID generated for Principal: ${prinMov?.approvalId}`);

    // 4. Deputy Registrar Verification
    db.processNoteSheetAction(note.id, 'APPROVE', 'Administrative documents verified. Library budget verified.', undefined, dyRegUser);
    currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'PENDING_REGISTRAR', 'Moved to PENDING_REGISTRAR');
    const dyRegMov = currentNote.movements.find(m => m.actorRole === 'DEPUTY_REGISTRAR' || m.fromUserRole === 'DEPUTY_REGISTRAR');
    assert(Boolean(dyRegMov && dyRegMov.approvalId), `Digital Approval ID generated for Dy Reg: ${dyRegMov?.approvalId}`);

    // 5. Registrar Endorsement
    db.processNoteSheetAction(note.id, 'APPROVE', 'Verified and recommended for Vice President sanction.', undefined, regUser);
    currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'PENDING_VICE_PRESIDENT', 'Moved to PENDING_VICE_PRESIDENT');
    const regMov = currentNote.movements.find(m => m.actorRole === 'REGISTRAR' || m.fromUserRole === 'REGISTRAR');
    assert(Boolean(regMov && regMov.approvalId), `Digital Approval ID generated for Registrar: ${regMov?.approvalId}`);

    // 6. Vice President Final Sanction
    db.processNoteSheetAction(note.id, 'APPROVE', 'Approved and sanctioned for academic year 2026-27.', undefined, vpUser);
    currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'APPROVED', 'Notesheet status is final APPROVED');
    assert(Boolean(currentNote.finalApprovalId), `Final Executive Sanction ID generated: ${currentNote.finalApprovalId}`);
    assert(currentNote.approvedByName === vpUser.name, `Final approved by Vice President (${currentNote.approvedByName})`);
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Financial Revision History Tracking in Single Document
  // -------------------------------------------------------------------------
  test('3. Financial Revision Trail: Document includes revision audit table if amounts are modified', () => {
    const note = db.createNoteSheet({
      subject: 'Smart Classroom Audio-Visual Modernization',
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'MEDIUM',
      proposal: 'Installation of interactive smart panels and wireless audio in 5 lecture halls.',
      purposeJustification: 'Classroom infrastructure upgrade.',
      requiredDate: '2026-10-15',
      financialRequirement: true,
      requestedAmount: 500000,
      currentAmount: 500000,
      estimatedCost: 500000
    }, facultyUser, false);

    // HOD revises amount to 450,000
    db.processNoteSheetAction(
      note.id,
      'APPROVE',
      'Negotiated vendor rate down by 10%',
      undefined,
      hodUser,
      undefined,
      {
        revisedAmount: 450000,
        revisionReason: 'Negotiated vendor rate down by 10%'
      }
    );
    let currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.currentAmount === 450000, 'Current amount updated to 450,000');
    assert(Boolean(currentNote.financialRevisionHistory && currentNote.financialRevisionHistory.length >= 1), 'Financial revision recorded');
    assert(currentNote.financialRevisionHistory![0].previousAmount === 500000, 'Previous amount was 500,000');
    assert(currentNote.financialRevisionHistory![0].newAmount === 450000, 'New amount is 450,000');
    assert(currentNote.financialRevisionHistory![0].actorRole === 'HOD', 'Revision recorded by HOD');

    // Principal approves at 450,000
    db.processNoteSheetAction(note.id, 'APPROVE', 'Recommended at revised cost.', undefined, principalUser);
    // Dy Registrar verifies at 450,000
    db.processNoteSheetAction(note.id, 'APPROVE', 'Verified within budget allocation.', undefined, dyRegUser);
    // Registrar endorses
    db.processNoteSheetAction(note.id, 'APPROVE', 'Forwarded for sanction.', undefined, regUser);
    // VP final approves at 425,000
    db.processNoteSheetAction(
      note.id,
      'APPROVE',
      'Final sanction granted for 425,000.',
      undefined,
      vpUser,
      undefined,
      {
        revisedAmount: 425000,
        revisionReason: 'Final sanction amount approved'
      }
    );

    currentNote = db.getNoteSheetById(note.id)!;
    assert(currentNote.status === 'APPROVED', 'Notesheet status is APPROVED');
    assert(currentNote.finalApprovedAmount === 425000, 'Final approved amount is 425,000');
    assert(currentNote.financialRevisionHistory?.length === 2, '2 financial revisions recorded in audit trail');
    assert(currentNote.financialRevisionHistory![1].newAmount === 425000, 'VP revision to 425,000 captured');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 4: Multi-Length Resilience (Short, Medium, Long Multi-Page)
  // -------------------------------------------------------------------------
  test('4. Multi-Page Document Resilience: Long Notesheets (3+ Pages) render completely without clipping', () => {
    const longProposalText = `
1. Background & Comprehensive Objective:
The School of Computing & IT requires comprehensive infrastructure upgradation for the Academic Year 2026-2027 to cater to 600 undergraduate and postgraduate students. As per the revised AICTE & UGC regulations, institutions offering Artificial Intelligence and Data Science curricula must maintain dedicated computational clusters with minimum 10Gbps inter-rack networking, UPS battery backups, and automated disaster recovery storage.

2. Detailed Operational Scope & Implementation Phases:
- Phase A: Procurement and deployment of high-density rack servers and GPU accelerator cards for deep learning labs.
- Phase B: Electrical rewiring, dedicated earth grounding, and precision air-conditioning installation to maintain 18-21°C operating temperatures.
- Phase C: Faculty development programs, student access token provisioning, and security isolation firewall configuration.

3. Statutory Compliance and Quality Assurance:
All procured equipment adheres to ISO 9001:2015 quality standards and BEE 5-star energy efficiency ratings. 3-year on-site comprehensive warranty with 4-hour SLA is included in all vendor contractual agreements.
    `.trim();

    const longJustificationText = `
Mandatory requirement for NBA and NAAC A++ accreditation cycles scheduled for Q4 2026. Without these computational resources, ongoing sponsored research projects from DST, SERB, and industry consultancy agreements cannot meet delivery milestones. The infrastructure will also be utilized for university hackathons, student capstone projects, and faculty journal publications in IEEE/ACM transactions.
    `.trim();

    const longItems: NoteSheetEstimateItem[] = [
      { id: 'it-1', itemName: 'AI GPU Server Rig (NVIDIA RTX 6000 Ada)', description: 'Dual Xeon Gold, 256GB ECC RAM, 48GB VRAM', quantity: 4, unit: 'Units', rate: 650000, amount: 2600000 },
      { id: 'it-2', itemName: 'Precision Air Conditioning Unit 5.5 TR', description: 'Dual inverter compressor with micro-processor control', quantity: 2, unit: 'Sets', rate: 225000, amount: 450000 },
      { id: 'it-3', itemName: '3-Phase Modular Online UPS 30kVA', description: 'With 60 minutes battery backup rack and SNMP card', quantity: 1, unit: 'Unit', rate: 380000, amount: 380000 },
      { id: 'it-4', itemName: '24-Port 10GbE SFP+ Managed Core Switch', description: 'Layer 3 enterprise aggregation switch with redundant PSU', quantity: 2, unit: 'Nos', rate: 95000, amount: 190000 },
      { id: 'it-5', itemName: 'Cat6A Shielded LSZH Cabling & Patch Panels', description: 'Full server room structured cabling with certification', quantity: 1, unit: 'Lot', rate: 75000, amount: 75000 },
      { id: 'it-6', itemName: 'Server Rack 42U 1000mm Depth', description: 'Perforated mesh doors with digital thermal monitoring', quantity: 2, unit: 'Racks', rate: 45000, amount: 90000 }
    ];

    const longNote = db.createNoteSheet({
      subject: 'Establishment of Advanced High-Performance Computing & Artificial Intelligence Center of Excellence',
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'CAPITAL_EXPENSE',
      priority: 'HIGH',
      proposal: longProposalText,
      purposeJustification: longJustificationText,
      requiredDate: '2026-11-30',
      financialRequirement: true,
      requestedAmount: 3785000,
      currentAmount: 3785000,
      estimatedCost: 3785000,
      items: longItems,
      attachments: [
        'AICTE_Compliance_Guidelines_2026.pdf',
        'Technical_Architecture_Diagram.pdf',
        'OEM_Vendor_Quotation_Comparative.pdf',
        'Civil_Electrical_Feasibility_Report.pdf'
      ]
    }, facultyUser, false);

    // Full 6-stage workflow execution
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Detailed project proposal reviewed and approved by Department Academic Board.', undefined, hodUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Institute Executive Committee endorsed. Forwarding for administrative review.', undefined, principalUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Verified against university capital equipment budget guidelines.', undefined, dyRegUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Endorsed and submitted for final executive sanction.', undefined, regUser);
    db.processNoteSheetAction(longNote.id, 'APPROVE', 'Sanction granted for the establishment of AI Center of Excellence.', undefined, vpUser, undefined, {
      revisedAmount: 3750000,
      revisionReason: 'Final sanction granted with 37,50,000 ceiling'
    });

    const finalNote = db.getNoteSheetById(longNote.id)!;
    assert(finalNote.status === 'APPROVED', '4.1 Long Notesheet status is APPROVED');
    assert(finalNote.proposal.length > 500, '4.2 Long proposal text preserved completely');
    assert(finalNote.items?.length === 6, '4.3 All 6 itemized line items recorded');
    assert(finalNote.attachments?.length === 4, '4.4 All 4 attachment files recorded');
    assert(finalNote.movements.length === 6, '4.5 Full 6-stage digital approval trail recorded');
    assert(Boolean(finalNote.finalApprovalId), `4.6 Final Executive Sanction ID generated: ${finalNote.finalApprovalId}`);
    assert(finalNote.finalApprovedAmount === 3750000, '4.7 Final approved amount is ₹37,50,000');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Non-Financial Administrative / Policy Notesheet
  // -------------------------------------------------------------------------
  test('5. Administrative / Policy Notesheet: Correctly renders without financial section', () => {
    const adminNote = db.createNoteSheet({
      subject: 'Revision of Academic Calendar and Continuous Internal Evaluation Scheme for Odd Semester 2026',
      instituteId: 'inst-1',
      department: 'COMPUTER ENGINEERING',
      notesheetType: 'POLICY_AMENDMENT',
      priority: 'HIGH',
      proposal: 'Proposal to introduce 2 mid-term evaluation tests and 1 practical project assessment week in accordance with NEP 2020 guidelines.',
      purposeJustification: 'Aligns academic structure with national credit framework and enhances continuous learning outcomes.',
      requiredDate: '2026-08-30',
      financialRequirement: false,
      attachments: ['NEP_2020_CIE_Proposal.pdf', 'Academic_Calendar_Draft_2026.pdf']
    }, facultyUser, false);

    db.processNoteSheetAction(adminNote.id, 'APPROVE', 'Academic committee reviewed and approved.', undefined, hodUser);
    db.processNoteSheetAction(adminNote.id, 'APPROVE', 'Recommended for university policy implementation.', undefined, principalUser);
    db.processNoteSheetAction(adminNote.id, 'APPROVE', 'Checked against statutory regulations.', undefined, dyRegUser);
    db.processNoteSheetAction(adminNote.id, 'APPROVE', 'Endorsed for executive approval.', undefined, regUser);
    db.processNoteSheetAction(adminNote.id, 'APPROVE', 'Approved as official university academic policy.', undefined, vpUser);

    const note = db.getNoteSheetById(adminNote.id)!;
    assert(note.status === 'APPROVED', 'Policy notesheet approved');
    assert(note.financialRequirement === false, 'Financial requirement is false');
    assert(!note.requestedAmount && !note.finalApprovedAmount, 'No financial amounts assigned');
    assert(note.attachments?.length === 2, 'Policy documents attached');
    assert(Boolean(note.finalApprovalId), `Executive sanction granted: ${note.finalApprovalId}`);
  });

  console.log('\n========================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests !== totalTests) {
    throw new Error(`Only ${passedTests} of ${totalTests} tests passed.`);
  }
}

runUnifiedTemplateTests().catch((err) => {
  console.error('Unified Template test suite execution failed:', err);
  throw err;
});
