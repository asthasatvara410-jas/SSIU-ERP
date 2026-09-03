import { describe, it, expect } from 'vitest';
import { centralDocumentTemplateService } from '../services/centralDocumentTemplateService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.17: Central Document Template Management, Merge Engine & Traceability Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['TEMPLATE_ADMIN', 'TEMPLATE_CREATE', 'TEMPLATE_PUBLISH', 'TEMPLATE_RETIRE', 'TEMPLATE_GENERATE']
  };

  it('TEST 1: Template Creation & Versioning: Creates new template and creates Version 2.0', () => {
    // 1. Create Course Completion Certificate Template (v1.0)
    const tmpl = centralDocumentTemplateService.createTemplate({
      templateCode: 'COURSE_COMPLETION_CERT',
      templateName: 'Course Completion Certificate',
      description: 'Official university course completion certificate',
      documentTypeId: 'DOC_NOC_CERT',
      categoryId: 'ACADEMIC',
      organizationId: 'inst-sit',
      departmentId: 'dept-cse',
      initialContent: '<h1>Course Completion</h1><p>Student: {{student.name}}</p><p>Course: {{course.name}}</p>',
      requiredVariables: ['student.name', 'course.name'],
      createdBy: 'emp-reg-001'
    });

    expect(tmpl.id).toBeDefined();
    expect(tmpl.template_code).toBe('COURSE_COMPLETION_CERT');
    expect(tmpl.status).toBe('DRAFT');

    // 2. Create Major Version v2.0
    const v2 = centralDocumentTemplateService.createTemplateVersion({
      templateId: tmpl.id,
      versionType: 'MAJOR',
      contentTemplate: '<h1>SWARRNIM UNIVERSITY</h1><h2>Course Completion Certificate</h2><p>Student: <strong>{{student.name}}</strong></p><p>Enrollment: {{student.enrollment_no}}</p><p>Course: {{course.name}}</p>',
      changeSummary: 'Added University Header and Enrollment Number field',
      requiredVariables: ['student.name', 'student.enrollment_no', 'course.name'],
      createdBy: 'emp-reg-001'
    });

    expect(v2.version_label).toBe('v2.0');
    expect(v2.major).toBe(2);
    expect(v2.minor).toBe(0);

    // 3. Publish Version 2.0
    const published = centralDocumentTemplateService.publishTemplateVersion({
      templateId: tmpl.id,
      versionId: v2.id,
      publishedBy: 'emp-reg-001'
    });

    expect(published.status).toBe('PUBLISHED');
    expect(published.current_version_id).toBe(v2.id);
  });

  it('TEST 2: Required Variable Validation: Blocks official generation when required field is missing', () => {
    // Missing 'course.name' variable
    expect(() => {
      centralDocumentTemplateService.generateOfficialDocument({
        templateCode: 'COURSE_COMPLETION_CERT',
        entityType: 'STUDENT',
        entityId: 'STU-2026-000001',
        data: {
          student: {
            name: 'Aarav Patel',
            enrollment_no: 'SSIU-2026-001'
          }
          // course.name is deliberately missing
        },
        generatedBy: 'emp-reg-001',
        context: registrarContext
      });
    }).toThrow(/Generation Blocked: Required template variable 'course.name' is missing/);
  });

  it('TEST 3: Safe Declarative Conditionals & Template Preview: Renders conditionals and watermark', () => {
    // 1. Preview with sample data
    const previewHtml = centralDocumentTemplateService.previewTemplate({
      templateId: 'tmpl-bonafide-001',
      sampleData: {
        student: {
          name: 'Sample Student',
          enrollment_no: 'SSIU-SAMPLE-001',
          is_scholarship_holder: true
        },
        program: {
          name: 'B.Tech Computer Engineering'
        },
        issue_date: '2026-08-29'
      }
    });

    expect(previewHtml).toContain('[PREVIEW / NOT OFFICIAL]');
    expect(previewHtml).toContain('recipient of Swarrnim Merit Scholarship');
    expect(previewHtml).toContain('Sample Student');
  });

  it('TEST 4: Official Document Generation & Traceability: Captures historical data snapshot and central numbering', () => {
    const generated = centralDocumentTemplateService.generateOfficialDocument({
      templateCode: 'BONAFIDE_CERTIFICATE',
      entityType: 'STUDENT',
      entityId: 'STU-2026-000001',
      data: {
        student: {
          name: 'Aarav Patel',
          enrollment_no: 'SSIU-2026-001',
          is_scholarship_holder: false
        },
        program: {
          name: 'B.Tech Computer Engineering'
        },
        issue_date: '2026-08-29'
      },
      generatedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(generated.id).toBeDefined();
    expect(generated.generation_number).toMatch(/^SSIU\/DOC\/2026\/\d{6}$/);
    expect(generated.status).toBe('GENERATED');
    expect(generated.template_version_id).toBe('tmpl-ver-001');
    expect(generated.data_snapshot.student.name).toBe('Aarav Patel');
  });

  it('TEST 5: Template Retirement & Dashboard Telemetry: Blocks new generation while preserving history', () => {
    // 1. Retire Course Completion Template
    const retiredTmpl = centralDocumentTemplateService.retireTemplate('tmpl-bonafide-001', 'emp-reg-001');
    expect(retiredTmpl.status).toBe('RETIRED');

    // 2. Generating with retired template is blocked
    expect(() => {
      centralDocumentTemplateService.generateOfficialDocument({
        templateCode: 'BONAFIDE_CERTIFICATE',
        entityType: 'STUDENT',
        entityId: 'STU-2026-000001',
        data: {
          student: { name: 'Aarav Patel', enrollment_no: 'SSIU-2026-001' },
          program: { name: 'B.Tech' },
          issue_date: '2026-08-29'
        },
        generatedBy: 'emp-reg-001'
      });
    }).toThrow(/Cannot generate document: Template BONAFIDE_CERTIFICATE is RETIRED/);

    // 3. Dashboard Metrics
    const metrics = centralDocumentTemplateService.getTemplateDashboardMetrics();
    expect(metrics.totalTemplatesCount).toBeGreaterThanOrEqual(2);
    expect(metrics.retiredTemplatesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalGeneratedDocumentsCount).toBeGreaterThanOrEqual(1);
  });
});
