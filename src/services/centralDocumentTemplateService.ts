import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentAccessControlService } from './centralDocumentAccessControlService';

export type TemplateStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'RETIRED'
  | 'ARCHIVED';

export interface DocumentTemplateRecord {
  id: string;
  template_code: string;
  template_name: string;
  description: string;
  document_type_id: string;
  category_id: string;
  organization_id: string;
  department_id?: string;
  status: TemplateStatus;
  owner_id: string;
  current_version_id?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
}

export interface DocumentTemplateVersionRecord {
  id: string;
  template_id: string;
  major: number;
  minor: number;
  version_label: string; // e.g. "v1.0", "v2.0"
  content_template: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'RETIRED';
  change_summary: string;
  required_variables: string[];
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  published_by?: string;
  published_at?: string;
  retired_at?: string;
}

export interface GeneratedDocumentTraceabilityRecord {
  id: string;
  document_id: string;
  template_id: string;
  template_version_id: string;
  source_entity_type: string;
  source_entity_id: string;
  generation_number: string;
  generated_by: string;
  generated_at: string;
  status: 'GENERATED' | 'FAILED';
  data_snapshot: Record<string, any>;
}

export interface DocumentTemplateDashboardMetrics {
  totalTemplatesCount: number;
  publishedTemplatesCount: number;
  draftTemplatesCount: number;
  retiredTemplatesCount: number;
  totalGeneratedDocumentsCount: number;
  generationFailuresCount: number;
}

class CentralDocumentTemplateService {
  private static instance: CentralDocumentTemplateService;

  private templates: DocumentTemplateRecord[] = [];
  private versions: DocumentTemplateVersionRecord[] = [];
  private generatedDocs: GeneratedDocumentTraceabilityRecord[] = [];
  private sequenceCounter = 100;

  private constructor() {
    this.seedDemoTemplates();
  }

  public static getInstance(): CentralDocumentTemplateService {
    if (!CentralDocumentTemplateService.instance) {
      CentralDocumentTemplateService.instance = new CentralDocumentTemplateService();
    }
    return CentralDocumentTemplateService.instance;
  }

  private seedDemoTemplates(): void {
    const templateId = 'tmpl-bonafide-001';
    const versionId = 'tmpl-ver-001';

    this.templates.push({
      id: templateId,
      template_code: 'BONAFIDE_CERTIFICATE',
      template_name: 'Standard Student Bonafide Certificate',
      description: 'Official university bonafide study certificate for active students',
      document_type_id: 'DOC_BONAFIDE_CERT',
      category_id: 'ACADEMIC',
      organization_id: 'inst-sit',
      department_id: 'dept-cse',
      status: 'PUBLISHED',
      owner_id: 'emp-reg-001',
      current_version_id: versionId,
      created_by: 'emp-reg-001',
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-10T10:00:00Z'
    });

    this.versions.push({
      id: versionId,
      template_id: templateId,
      major: 1,
      minor: 0,
      version_label: 'v1.0',
      content_template: `<h1>SWARRNIM STARTUP & INNOVATION UNIVERSITY</h1>
<p>This is to certify that <strong>{{student.name}}</strong>, Enrollment No: <strong>{{student.enrollment_no}}</strong>, is a bonafide student of <strong>{{program.name}}</strong>.</p>
{{#if student.is_scholarship_holder}}
<p>The student is a recipient of Swarrnim Merit Scholarship.</p>
{{/if}}
<p>Issued on: {{issue_date}}</p>`,
      status: 'PUBLISHED',
      change_summary: 'Initial baseline bonafide certificate template',
      required_variables: ['student.name', 'student.enrollment_no', 'program.name', 'issue_date'],
      created_by: 'emp-reg-001',
      created_at: '2026-04-10T10:00:00Z',
      approved_by: 'emp-reg-001',
      approved_at: '2026-04-10T10:00:00Z',
      published_by: 'emp-reg-001',
      published_at: '2026-04-10T10:00:00Z'
    });
  }

  // ─── CREATE & EDIT TEMPLATE ──────────────────────────────────────────

  public createTemplate(params: {
    templateCode: string;
    templateName: string;
    description: string;
    documentTypeId: string;
    categoryId: string;
    organizationId: string;
    departmentId?: string;
    initialContent: string;
    requiredVariables?: string[];
    createdBy: string;
    context?: UserAuthorizationContext;
  }): DocumentTemplateRecord {
    if (this.templates.some(t => t.template_code === params.templateCode)) {
      throw new Error(`Template with code ${params.templateCode} already exists`);
    }

    const templateId = `tmpl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const versionId = `tmpl-ver-${Date.now()}`;

    const template: DocumentTemplateRecord = {
      id: templateId,
      template_code: params.templateCode,
      template_name: params.templateName,
      description: params.description,
      document_type_id: params.documentTypeId,
      category_id: params.categoryId,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      status: 'DRAFT',
      owner_id: params.createdBy,
      current_version_id: versionId,
      created_by: params.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const version: DocumentTemplateVersionRecord = {
      id: versionId,
      template_id: templateId,
      major: 1,
      minor: 0,
      version_label: 'v1.0',
      content_template: params.initialContent,
      status: 'DRAFT',
      change_summary: 'Initial draft version',
      required_variables: params.requiredVariables || [],
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    this.templates.push(template);
    this.versions.push(version);
    return template;
  }

  // ─── CREATE NEW TEMPLATE VERSION ─────────────────────────────────────

  public createTemplateVersion(params: {
    templateId: string;
    versionType: 'MAJOR' | 'MINOR';
    contentTemplate: string;
    changeSummary: string;
    requiredVariables?: string[];
    createdBy: string;
  }): DocumentTemplateVersionRecord {
    const template = this.templates.find(t => t.id === params.templateId);
    if (!template) throw new Error(`Template ${params.templateId} not found`);

    const tmplVersions = this.versions.filter(v => v.template_id === params.templateId);
    const lastVersion = tmplVersions[tmplVersions.length - 1];

    let nextMajor = lastVersion.major;
    let nextMinor = lastVersion.minor;

    if (params.versionType === 'MAJOR') {
      nextMajor += 1;
      nextMinor = 0;
    } else {
      nextMinor += 1;
    }

    const versionId = `tmpl-ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const versionLabel = `v${nextMajor}.${nextMinor}`;

    const newVersion: DocumentTemplateVersionRecord = {
      id: versionId,
      template_id: params.templateId,
      major: nextMajor,
      minor: nextMinor,
      version_label: versionLabel,
      content_template: params.contentTemplate,
      status: 'DRAFT',
      change_summary: params.changeSummary,
      required_variables: params.requiredVariables || lastVersion.required_variables,
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    this.versions.push(newVersion);
    template.current_version_id = versionId;
    template.updated_at = new Date().toISOString();

    return newVersion;
  }

  // ─── PUBLISH TEMPLATE VERSION ────────────────────────────────────────

  public publishTemplateVersion(params: {
    templateId: string;
    versionId: string;
    publishedBy: string;
    approvedBy?: string;
  }): DocumentTemplateRecord {
    const template = this.templates.find(t => t.id === params.templateId);
    if (!template) throw new Error(`Template ${params.templateId} not found`);

    const version = this.versions.find(v => v.id === params.versionId && v.template_id === params.templateId);
    if (!version) throw new Error(`Template version ${params.versionId} not found`);

    version.status = 'PUBLISHED';
    version.published_by = params.publishedBy;
    version.published_at = new Date().toISOString();
    version.approved_by = params.approvedBy || params.publishedBy;
    version.approved_at = new Date().toISOString();

    template.status = 'PUBLISHED';
    template.current_version_id = version.id;
    template.updated_at = new Date().toISOString();

    return template;
  }

  // ─── RETIRE TEMPLATE ─────────────────────────────────────────────────

  public retireTemplate(templateId: string, retiredBy: string): DocumentTemplateRecord {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    template.status = 'RETIRED';
    template.updated_at = new Date().toISOString();

    this.versions
      .filter(v => v.template_id === templateId && v.status === 'PUBLISHED')
      .forEach(v => {
        v.status = 'RETIRED';
        v.retired_at = new Date().toISOString();
      });

    return template;
  }

  // ─── TEMPLATE PREVIEW WITH WATERMARK ─────────────────────────────────

  public previewTemplate(params: {
    templateId: string;
    versionId?: string;
    sampleData: Record<string, any>;
  }): string {
    const template = this.templates.find(t => t.id === params.templateId);
    if (!template) throw new Error(`Template ${params.templateId} not found`);

    const verId = params.versionId || template.current_version_id;
    const version = this.versions.find(v => v.id === verId);
    if (!version) throw new Error(`Version ${verId} not found`);

    let rendered = this.renderContent(version.content_template, params.sampleData);
    rendered = `<div class="template-preview-watermark" style="border: 2px dashed #999; padding: 20px; position: relative;">
      <div style="color: red; font-weight: bold; text-align: center; margin-bottom: 10px;">[PREVIEW / NOT OFFICIAL]</div>
      ${rendered}
    </div>`;

    return rendered;
  }

  // ─── OFFICIAL DOCUMENT GENERATION ENGINE ─────────────────────────────

  public generateOfficialDocument(params: {
    templateCode: string;
    entityType: string;
    entityId: string;
    data: Record<string, any>;
    generatedBy: string;
    context?: UserAuthorizationContext;
  }): GeneratedDocumentTraceabilityRecord {
    const template = this.templates.find(t => t.template_code === params.templateCode);
    if (!template) throw new Error(`Template code ${params.templateCode} not found`);

    if (template.status !== 'PUBLISHED') {
      throw new Error(`Cannot generate document: Template ${template.template_code} is ${template.status}`);
    }

    const version = this.versions.find(v => v.id === template.current_version_id);
    if (!version || version.status !== 'PUBLISHED') {
      throw new Error(`Active published version not found for template ${template.template_code}`);
    }

    // Validate Required Variables
    for (const reqVar of version.required_variables) {
      const val = this.resolveVariablePath(params.data, reqVar);
      if (val === undefined || val === null || val === '') {
        throw new Error(`Generation Blocked: Required template variable '${reqVar}' is missing from source data`);
      }
    }

    // Render Content
    const renderedHtml = this.renderContent(version.content_template, params.data);

    this.sequenceCounter += 1;
    const generationNumber = `SSIU/DOC/2026/${String(this.sequenceCounter).padStart(6, '0')}`;
    const docId = `dms-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const genRecordId = `gen-rec-${Date.now()}`;

    // Register Document in Central DMS
    centralDocumentManagementService.createDocumentWithVersion({
      documentTypeCode: template.document_type_id,
      ownerType: params.entityType as any,
      ownerId: params.entityId,
      organizationId: template.organization_id,
      fileName: `${template.template_code}_${generationNumber.replace(/\//g, '_')}.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 145000,
      checksum: `sha256_gen_${Date.now()}`,
      title: `${template.template_name} - ${params.data.student?.name || params.entityId}`,
      description: `Auto-generated official document from template ${template.template_code} (${version.version_label})`,
      sourceModule: 'DOCUMENT_GENERATION',
      sourceEntityType: params.entityType,
      sourceEntityId: params.entityId,
      uploadedBy: params.generatedBy,
      customMetadata: {
        template_id: template.id,
        template_version_id: version.id,
        generation_number: generationNumber,
        rendered_content: renderedHtml
      }
    });

    const genRecord: GeneratedDocumentTraceabilityRecord = {
      id: genRecordId,
      document_id: docId,
      template_id: template.id,
      template_version_id: version.id,
      source_entity_type: params.entityType,
      source_entity_id: params.entityId,
      generation_number: generationNumber,
      generated_by: params.generatedBy,
      generated_at: new Date().toISOString(),
      status: 'GENERATED',
      data_snapshot: JSON.parse(JSON.stringify(params.data))
    };

    this.generatedDocs.push(genRecord);
    return genRecord;
  }

  // ─── SAFE DECLARATIVE MERGE & CONDITION ENGINE ────────────────────────

  private renderContent(templateStr: string, data: Record<string, any>): string {
    let result = templateStr;

    // 1. Process Safe Conditionals: {{#if condition}} content {{/if}}
    const ifRegex = /\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(ifRegex, (_, conditionVar, innerContent) => {
      const val = this.resolveVariablePath(data, conditionVar);
      return val ? innerContent : '';
    });

    // 2. Process Variables: {{variable.path}}
    const varRegex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
    result = result.replace(varRegex, (_, varPath) => {
      const val = this.resolveVariablePath(data, varPath);
      return val !== undefined && val !== null ? String(val) : '';
    });

    return result;
  }

  private resolveVariablePath(data: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  // ─── CLONE TEMPLATE ──────────────────────────────────────────────────

  public cloneTemplate(params: {
    sourceTemplateId: string;
    newTemplateCode: string;
    newTemplateName: string;
    clonedBy: string;
  }): DocumentTemplateRecord {
    const source = this.templates.find(t => t.id === params.sourceTemplateId);
    if (!source) throw new Error(`Source template ${params.sourceTemplateId} not found`);

    const sourceVersion = this.versions.find(v => v.id === source.current_version_id);
    const content = sourceVersion ? sourceVersion.content_template : '<h1>New Template</h1>';

    return this.createTemplate({
      templateCode: params.newTemplateCode,
      templateName: params.newTemplateName,
      description: `Cloned from ${source.template_code}`,
      documentTypeId: source.document_type_id,
      categoryId: source.category_id,
      organizationId: source.organization_id,
      departmentId: source.department_id,
      initialContent: content,
      requiredVariables: sourceVersion?.required_variables,
      createdBy: params.clonedBy
    });
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getTemplateDashboardMetrics(): DocumentTemplateDashboardMetrics {
    const totalTemplatesCount = this.templates.length;
    const publishedTemplatesCount = this.templates.filter(t => t.status === 'PUBLISHED').length;
    const draftTemplatesCount = this.templates.filter(t => t.status === 'DRAFT').length;
    const retiredTemplatesCount = this.templates.filter(t => t.status === 'RETIRED').length;
    const totalGeneratedDocumentsCount = this.generatedDocs.length;
    const generationFailuresCount = this.generatedDocs.filter(g => g.status === 'FAILED').length;

    return {
      totalTemplatesCount,
      publishedTemplatesCount,
      draftTemplatesCount,
      retiredTemplatesCount,
      totalGeneratedDocumentsCount,
      generationFailuresCount
    };
  }
}

export const centralDocumentTemplateService = CentralDocumentTemplateService.getInstance();
