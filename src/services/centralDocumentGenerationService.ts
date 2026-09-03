import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';
import { centralDocumentSearchService } from './centralDocumentSearchService';

export type TemplateFormat = 'HTML' | 'DOCX' | 'PDF_TEMPLATE';
export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED' | 'ARCHIVED';
export type GenerationStatus = 'QUEUED' | 'PROCESSING' | 'GENERATED' | 'FAILED' | 'CANCELLED';
export type DocumentIssueStatus = 'DRAFT' | 'GENERATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'REVOKED';

export interface DocumentTemplateRecord {
  id: string;
  code: string; // e.g. BONAFIDE_CERTIFICATE, NOC_LETTER, APPOINTMENT_LETTER
  name: string;
  description: string;
  document_type_code: string;
  template_format: TemplateFormat;
  template_body: string;
  required_merge_fields: string[];
  version: number;
  status: TemplateStatus;
  organization_id?: string;
  effective_from: string;
  effective_until?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentGenerationRecord {
  id: string;
  document_id: string;
  document_number: string;
  template_id: string;
  template_code: string;
  template_version: number;
  source_module: string;
  source_entity_type: string;
  source_entity_id: string;
  generated_by: string;
  generated_at: string;
  generation_status: GenerationStatus;
  issue_status: DocumentIssueStatus;
  verification_token: string;
  qr_verification_url: string;
  is_revoked: boolean;
  revocation_reason?: string;
  revoked_by?: string;
  revoked_at?: string;
  rendered_content: string;
}

export interface PublicDocumentVerificationResponse {
  isValid: boolean;
  documentNumber: string;
  documentTitle: string;
  issuingOrganization: string;
  issueDate: string;
  status: DocumentIssueStatus;
  disclaimer: string;
}

export interface DocumentGenerationDashboardMetrics {
  totalGeneratedCount: number;
  issuedCount: number;
  pendingApprovalCount: number;
  revokedCount: number;
  activeTemplatesCount: number;
}

class CentralDocumentGenerationService {
  private static instance: CentralDocumentGenerationService;

  private templates: DocumentTemplateRecord[] = [
    {
      id: 'tmpl-bonafide-001',
      code: 'BONAFIDE_CERTIFICATE',
      name: 'Official Student Bonafide Certificate',
      description: 'University standard bonafide certificate for passport, visa, and scholarship applications',
      document_type_code: 'DOC_BONAFIDE_CERT',
      template_format: 'HTML',
      template_body: `
        <div class="certificate">
          <h2>SWARRNIM STARTUP & INNOVATION UNIVERSITY</h2>
          <h3>BONAFIDE CERTIFICATE</h3>
          <p>This is to certify that <strong>{{student.name}}</strong> (Enrollment No: <strong>{{student.enrollment_no}}</strong>) is a bonafide student of <strong>{{program.name}}</strong> during Academic Year <strong>{{academic_year}}</strong>.</p>
          <p>Document Number: {{document.number}} | Issue Date: {{issue_date}}</p>
        </div>
      `,
      required_merge_fields: ['student.name', 'student.enrollment_no', 'program.name', 'academic_year'],
      version: 1,
      status: 'ACTIVE',
      organization_id: 'inst-sit',
      effective_from: '2026-01-01',
      created_by: 'emp-reg-001',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'tmpl-appointment-001',
      code: 'FACULTY_APPOINTMENT_LETTER',
      name: 'Faculty Appointment & Offer Letter',
      description: 'Human Resources faculty appointment letter template',
      document_type_code: 'DOC_HR_OFFER_LETTER',
      template_format: 'HTML',
      template_body: `
        <div class="appointment-letter">
          <h2>SWARRNIM STARTUP & INNOVATION UNIVERSITY</h2>
          <h3>APPOINTMENT LETTER</h3>
          <p>Dear <strong>{{employee.name}}</strong>,</p>
          <p>We are pleased to appoint you as <strong>{{employee.designation}}</strong> in the Department of <strong>{{department.name}}</strong> with effective date <strong>{{joining_date}}</strong>.</p>
          <p>Document Number: {{document.number}} | Issue Date: {{issue_date}}</p>
        </div>
      `,
      required_merge_fields: ['employee.name', 'employee.designation', 'department.name', 'joining_date'],
      version: 1,
      status: 'ACTIVE',
      organization_id: 'inst-sit',
      effective_from: '2026-01-01',
      created_by: 'emp-reg-001',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }
  ];

  private numberSequenceCounter = 100;
  private generationRecords: DocumentGenerationRecord[] = [];

  private constructor() {}

  public static getInstance(): CentralDocumentGenerationService {
    if (!CentralDocumentGenerationService.instance) {
      CentralDocumentGenerationService.instance = new CentralDocumentGenerationService();
    }
    return CentralDocumentGenerationService.instance;
  }

  // ─── ATOMIC DOCUMENT NUMBER SEQUENCE GENERATOR ───────────────────────

  public generateAtomicDocumentNumber(prefix: string, year: number = 2026): string {
    this.numberSequenceCounter += 1;
    const seqStr = String(this.numberSequenceCounter).padStart(6, '0');
    return `SSIU/${prefix}/${year}/${seqStr}`;
  }

  // ─── TEMPLATE ENGINE & MERGE FIELD RESOLUTION ────────────────────────

  public renderTemplate(
    template: DocumentTemplateRecord,
    mergeData: Record<string, any>,
    documentNumber: string
  ): string {
    // 1. Validate All Mandatory Merge Fields
    const missingFields = template.required_merge_fields.filter(field => {
      const val = this.getNestedValue(mergeData, field);
      return val === undefined || val === null || String(val).trim().length === 0;
    });

    if (missingFields.length > 0) {
      throw new Error(`Generation Blocked: Missing required merge fields [${missingFields.join(', ')}]`);
    }

    // 2. Perform Safe Replacement
    let rendered = template.template_body;
    rendered = rendered.replace(/\{\{document\.number\}\}/g, documentNumber);
    rendered = rendered.replace(/\{\{issue_date\}\}/g, new Date().toISOString().split('T')[0]);

    // Replace all placeholders
    const matches = rendered.match(/\{\{([a-zA-Z0-9_.]+)\}\}/g) || [];
    matches.forEach(match => {
      const key = match.replace(/[{}]/g, '');
      const value = this.getNestedValue(mergeData, key) || '';
      rendered = rendered.replace(match, String(value));
    });

    return rendered;
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // ─── END-TO-END DOCUMENT GENERATION ENGINE ───────────────────────────

  public generateOfficialDocument(params: {
    templateCode: string;
    sourceModule: string;
    sourceEntityType: string;
    sourceEntityId: string;
    ownerType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ORGANIZATION';
    ownerId: string;
    mergeData: Record<string, any>;
    generatedBy: string;
    organizationId?: string;
  }): DocumentGenerationRecord {
    // 1. Resolve Active Template
    const template = this.templates.find(t => t.code === params.templateCode && t.status === 'ACTIVE');
    if (!template) {
      throw new Error(`Active document template with code '${params.templateCode}' not found`);
    }

    // 2. Assign Atomic Document Number
    const prefix = template.code.substring(0, 3).toUpperCase();
    const docNumber = this.generateAtomicDocumentNumber(prefix);

    // 3. Render Content
    const renderedContent = this.renderTemplate(template, params.mergeData, docNumber);

    // 4. Register Verification Token
    const verificationToken = `vtok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const qrUrl = `https://dms.swarrnim.edu.in/verify/doc?token=${verificationToken}`;

    const genRecordId = `gen-${Date.now()}`;
    const dmsDocId = `dms-gen-doc-${Date.now()}`;

    // 5. Persist to Central DMS
    const dmsResult = centralDocumentManagementService.createDocumentWithVersion({
      documentTypeCode: template.document_type_code,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      organizationId: params.organizationId || 'inst-sit',
      title: `${template.name} - ${docNumber}`,
      description: `Official generated document ${docNumber} via template ${template.code} v${template.version}`,
      fileName: `${docNumber.replace(/\//g, '_')}.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: renderedContent.length * 2,
      checksum: `sha256_gen_${Date.now()}`,
      uploadedBy: params.generatedBy,
      sourceModule: params.sourceModule,
      sourceEntityType: params.sourceEntityType,
      sourceEntityId: params.sourceEntityId,
      tags: ['OFFICIAL_GENERATED_DOCUMENT', template.code, docNumber]
    });

    const genRecord: DocumentGenerationRecord = {
      id: genRecordId,
      document_id: dmsResult.document.id,
      document_number: docNumber,
      template_id: template.id,
      template_code: template.code,
      template_version: template.version,
      source_module: params.sourceModule,
      source_entity_type: params.sourceEntityType,
      source_entity_id: params.sourceEntityId,
      generated_by: params.generatedBy,
      generated_at: new Date().toISOString(),
      generation_status: 'GENERATED',
      issue_status: 'ISSUED',
      verification_token: verificationToken,
      qr_verification_url: qrUrl,
      is_revoked: false,
      rendered_content: renderedContent
    };

    this.generationRecords.push(genRecord);

    // 6. Synchronize into Central Search Index
    centralDocumentSearchService.indexDocument({
      document_id: dmsResult.document.id,
      document_type_code: template.document_type_code,
      document_type_name: template.name,
      category_code: 'ACADEMIC',
      owner_type: params.ownerType,
      owner_id: params.ownerId,
      owner_name: params.mergeData.student?.name || params.mergeData.employee?.name || params.ownerId,
      organization_id: params.organizationId || 'inst-sit',
      source_module: params.sourceModule,
      source_entity_id: params.sourceEntityId,
      file_name: `${docNumber.replace(/\//g, '_')}.pdf`,
      title: `${template.name} - ${docNumber}`,
      description: `Official generated document ${docNumber}`,
      extracted_text: renderedContent.replace(/<[^>]*>?/gm, ' '),
      ocr_status: 'NOT_REQUIRED',
      status: 'ACTIVE',
      verification_status: 'VERIFIED',
      tags: ['OFFICIAL_GENERATED_DOCUMENT', template.code, docNumber],
      indexed_at: new Date().toISOString()
    });

    return genRecord;
  }

  // ─── PUBLIC QR VERIFICATION SERVICE ──────────────────────────────────

  public verifyPublicDocument(tokenOrDocNumber: string): PublicDocumentVerificationResponse {
    const record = this.generationRecords.find(
      r => r.verification_token === tokenOrDocNumber || r.document_number === tokenOrDocNumber
    );

    if (!record) {
      return {
        isValid: false,
        documentNumber: 'UNKNOWN',
        documentTitle: 'Unverified Document',
        issuingOrganization: 'Swarrnim Startup & Innovation University',
        issueDate: 'N/A',
        status: 'REVOKED',
        disclaimer: 'The requested document verification token does not match any officially issued university document.'
      };
    }

    return {
      isValid: !record.is_revoked,
      documentNumber: record.document_number,
      documentTitle: `Official Generated Document (${record.template_code})`,
      issuingOrganization: 'Swarrnim Startup & Innovation University',
      issueDate: record.generated_at.split('T')[0],
      status: record.issue_status,
      disclaimer: record.is_revoked
        ? `DOCUMENT REVOKED: This document was officially revoked on ${record.revoked_at}. Reason: ${record.revocation_reason}`
        : 'AUTHENTIC: This is an authentic document issued by the Registrar Office, Swarrnim Startup & Innovation University.'
    };
  }

  // ─── DOCUMENT REVOCATION GOVERNANCE ──────────────────────────────────

  public revokeOfficialDocument(params: {
    documentNumber: string;
    revokedBy: string;
    reason: string;
  }): DocumentGenerationRecord {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Mandatory justification reason required to revoke an official document');
    }

    const record = this.generationRecords.find(r => r.document_number === params.documentNumber);
    if (!record) throw new Error(`Official document with number ${params.documentNumber} not found`);

    record.is_revoked = true;
    record.issue_status = 'REVOKED';
    record.revocation_reason = params.reason;
    record.revoked_by = params.revokedBy;
    record.revoked_at = new Date().toISOString();

    return record;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getGenerationDashboardMetrics(context?: UserAuthorizationContext): DocumentGenerationDashboardMetrics {
    const totalGeneratedCount = this.generationRecords.length;
    const issuedCount = this.generationRecords.filter(r => r.issue_status === 'ISSUED').length;
    const pendingApprovalCount = this.generationRecords.filter(r => r.issue_status === 'PENDING_APPROVAL').length;
    const revokedCount = this.generationRecords.filter(r => r.is_revoked).length;
    const activeTemplatesCount = this.templates.filter(t => t.status === 'ACTIVE').length;

    return {
      totalGeneratedCount,
      issuedCount,
      pendingApprovalCount,
      revokedCount,
      activeTemplatesCount
    };
  }
}

export const centralDocumentGenerationService = CentralDocumentGenerationService.getInstance();
