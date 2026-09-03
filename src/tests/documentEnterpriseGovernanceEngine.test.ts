import { describe, it, expect } from 'vitest';
import { centralEnterpriseDocumentGovernanceService } from '../services/centralEnterpriseDocumentGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.36: Enterprise Document Governance & Lifecycle Engine', () => {

  const documentOfficer: UserAuthorizationContext = {
    userId: 'emp-doc-001',
    userName: 'Director of Institutional Documentation & Records',
    email: 'docgov@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'DOCUMENT_GOVERNANCE_VIEW',
      'DOCUMENT_CREATE',
      'DOCUMENT_EDIT',
      'DOCUMENT_APPROVE',
      'DOCUMENT_SIGN',
      'DOCUMENT_VERSION_CREATE',
      'DOCUMENT_ACCESS_MANAGE',
      'DOCUMENT_REPORT'
    ]
  };

  it('TEST 1: Document Master & Publication: Creates document and publishes to EFFECTIVE state', () => {
    const { document, version } = centralEnterpriseDocumentGovernanceService.createDocument({
      title: 'University Academic Curriculum & Credit Framework 2026',
      description: 'Institutional academic policy defining course credit requirements, NEP 2020 alignment, and evaluation criteria',
      documentType: 'POLICY',
      category: 'Academic/Curriculum',
      ownerId: 'emp-dean-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-academic',
      classification: 'INTERNAL',
      privacyTag: 'NO_PERSONAL_DATA',
      criticality: 'HIGH',
      initialFileReference: 'dms://vault/policies/curriculum_framework_2026_v1.pdf',
      initialChecksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      context: documentOfficer
    });

    expect(document.id).toBeDefined();
    expect(document.document_number).toMatch(/^DOC-2026-\d{6}$/);
    expect(document.status).toBe('DRAFT');
    expect(version.version_number).toBe('1.0');

    // Approve and publish
    const published = centralEnterpriseDocumentGovernanceService.approveAndPublishDocument(document.id, 'emp-doc-001');
    expect(published.status).toBe('EFFECTIVE');
  });

  it('TEST 2: Version Control & Supersession: Creates new version and marks prior version superseded', () => {
    const { document } = centralEnterpriseDocumentGovernanceService.createDocument({
      title: 'Hostel Code of Conduct & Safety Guidelines',
      description: 'Hostel residency terms and security protocols',
      documentType: 'PROCEDURE',
      category: 'Student Affairs/Hostel',
      ownerId: 'emp-warden-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-hostel',
      classification: 'PUBLIC',
      initialFileReference: 'dms://vault/hostel/hostel_rules_v1.pdf',
      initialChecksum: 'a1b2c3d4e5f60000000000000000000000000000000000000000000000000001'
    });

    // Create Version 1.1
    const newVer = centralEnterpriseDocumentGovernanceService.createNewVersion({
      documentId: document.id,
      versionNumber: '1.1',
      fileReference: 'dms://vault/hostel/hostel_rules_v1_1.pdf',
      checksum: 'a1b2c3d4e5f60000000000000000000000000000000000000000000000000002',
      createdBy: 'emp-warden-001',
      changeSummary: 'Updated visitor curfews and digital attendance scanning procedures'
    });

    expect(newVer.id).toBeDefined();
    expect(newVer.version_number).toBe('1.1');
    expect(newVer.status).toBe('DRAFT');
    expect(newVer.is_signed_and_locked).toBe(false);
  });

  it('TEST 3: E-Signature Integration & Immutability Lock: Signs version and enforces immutability gate', () => {
    const { version } = centralEnterpriseDocumentGovernanceService.createDocument({
      title: 'Industry MOU & Research Collaboration Contract',
      description: 'Formal tripartite agreement between University and Tech Industry Partner',
      documentType: 'CONTRACT',
      category: 'Research/MOU',
      ownerId: 'emp-dean-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-research',
      classification: 'CONFIDENTIAL',
      initialFileReference: 'dms://vault/contracts/industry_mou_v1.pdf',
      initialChecksum: 'c1d2e3f4a5b60000000000000000000000000000000000000000000000000003'
    });

    // Request Signature
    const sigReq = centralEnterpriseDocumentGovernanceService.requestSignature({
      documentVersionId: version.id,
      signerId: 'emp-vc-001',
      signatureType: 'DIGITAL'
    });

    expect(sigReq.status).toBe('REQUESTED');

    // Complete Signature
    const completed = centralEnterpriseDocumentGovernanceService.completeSignature(sigReq.id);
    expect(completed.status).toBe('SIGNED');
    expect(completed.signed_at).toBeDefined();

    // Block subsequent signature requests on locked signed version
    expect(() => {
      centralEnterpriseDocumentGovernanceService.requestSignature({
        documentVersionId: version.id,
        signerId: 'emp-vc-001',
        signatureType: 'DIGITAL'
      });
    }).toThrow(/Signature Request Blocked: Document Version .* is already signed and locked/);
  });

  it('TEST 4: Access Governance & Time-Bound Watermarked Shares: Generates secure time-bound shares', () => {
    const { document } = centralEnterpriseDocumentGovernanceService.createDocument({
      title: 'Confidential University Financial Audit Report 2025-26',
      description: 'Statutory external financial auditor findings',
      documentType: 'REPORT',
      category: 'Finance/Audit',
      ownerId: 'emp-cfo-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-finance',
      classification: 'CONFIDENTIAL',
      initialFileReference: 'dms://vault/audit/audit_report_2026.pdf',
      initialChecksum: 'e1f2a3b4c5d60000000000000000000000000000000000000000000000000004'
    });

    const share = centralEnterpriseDocumentGovernanceService.createSecureShare({
      documentId: document.id,
      recipientEmail: 'auditor@externalfirm.com',
      purpose: 'Statutory NAAC & External Audit Verification',
      durationHours: 48
    });

    expect(share.id).toBeDefined();
    expect(share.status).toBe('ACTIVE');
    expect(share.watermark_text).toContain('CONFIDENTIAL');
    expect(share.watermark_text).toContain('auditor@externalfirm.com');
  });

  it('TEST 5: Retention, Legal Hold & Governance Metrics: Validates disposition guard and posture metrics', () => {
    const { document } = centralEnterpriseDocumentGovernanceService.createDocument({
      title: 'Disciplinary Committee Inquiry Dossier',
      description: 'Formal student disciplinary proceeding record',
      documentType: 'LEGAL_DOCUMENT',
      category: 'Administration/Legal',
      ownerId: 'emp-reg-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-legal',
      classification: 'RESTRICTED',
      initialFileReference: 'dms://vault/legal/inquiry_001.pdf',
      initialChecksum: 'f1a2b3c4d5e60000000000000000000000000000000000000000000000000005'
    });

    // Mark under Legal Hold
    document.has_legal_hold = true;

    expect(() => {
      centralEnterpriseDocumentGovernanceService.requestDisposition(document.id);
    }).toThrow(/Disposition Blocked: Document .* is under active Legal Hold/);

    const metrics = centralEnterpriseDocumentGovernanceService.getDocumentGovernanceDashboardMetrics(documentOfficer);
    expect(metrics.totalDocumentsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.governanceScorePercent).toBeGreaterThanOrEqual(90);
    expect(metrics.posture).toBe('HEALTHY');
  });
});
