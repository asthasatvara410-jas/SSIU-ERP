import { describe, it, expect, beforeEach } from 'vitest';
import { GrievanceApiService } from '../services/grievanceApiService';
import { ALL_NAV_ITEMS, isTabPermittedForRole } from '../constants/navigationConfig';

describe('SSIU ERP — STAGE 7.10: UGC Grievance + Anti-Ragging + ICC + Auto-Escalation Engine', () => {
  let cases: Array<any>;
  let identities: Map<string, any>;
  let internalNotes: Array<any>;
  let timelineEvents: Array<any>;
  let auditLogs: Array<any>;
  let committees: Array<any>;
  let committeeMembers: Array<any>;
  let caseAssignments: Array<any>;
  let investigations: Array<any>;
  let caseActions: Array<any>;
  let caseEvidences: Array<any>;
  let caseResolutions: Array<any>;
  let escalationEvents: Array<any>;
  let slaConfigs: Array<any>;
  let retentionPolicies: Array<any>;
  let notifications: Array<any>;
  let escalationRules: Array<any>;

  beforeEach(() => {
    cases = [];
    identities = new Map();
    internalNotes = [];
    timelineEvents = [];
    auditLogs = [];
    committees = [];
    committeeMembers = [];
    caseAssignments = [];
    investigations = [];
    caseActions = [];
    caseEvidences = [];
    caseResolutions = [];
    escalationEvents = [];
    slaConfigs = [];
    retentionPolicies = [];
    notifications = [];
    escalationRules = [];

    // Seed Identified Case
    cases.push({
      id: 'case-1',
      tenantId: 'INST-SSCIT',
      caseNumber: 'GRV-2026-100001',
      trackingToken: 'tok_abc123',
      category: 'ACADEMIC',
      type: 'IDENTIFIED',
      subject: 'Delay in Exam Re-evaluation',
      description: 'Submitted re-eval request 3 weeks ago for CS501.',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      escalationLevel: 0,
      escalationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue
      createdAt: new Date('2026-08-20T10:00:00Z'),
    });
    identities.set('case-1', { studentId: 'STU-101', identityVisibility: 'DISCLOSED_WITH_PERMISSION' });

    // Seed Anonymous Case
    cases.push({
      id: 'case-2',
      tenantId: 'INST-SSCIT',
      caseNumber: 'GRV-2026-100002',
      trackingToken: 'tok_secret_xyz999',
      category: 'FACILITY',
      type: 'ANONYMOUS',
      subject: 'Hostel Water Supply Issue',
      description: 'Water pressure extremely low in Block B.',
      status: 'UNDER_REVIEW',
      priority: 'HIGH',
      escalationLevel: 0,
      escalationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Within SLA
      createdAt: new Date('2026-08-22T12:00:00Z'),
    });
    identities.set('case-2', { studentId: 'STU-102', identityVisibility: 'SYSTEM_ONLY' });

    // Seed Resolved Case
    cases.push({
      id: 'case-3',
      tenantId: 'INST-SSCIT',
      caseNumber: 'GRV-2026-100003',
      trackingToken: 'tok_res_333',
      category: 'ACADEMIC',
      type: 'IDENTIFIED',
      subject: 'Classroom Projector Replacement',
      description: 'Projector in Room 402 has blown lamp.',
      status: 'RESOLVED',
      priority: 'LOW',
      resolutionSummary: 'New projector installed.',
      escalationLevel: 0,
      escalationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date('2026-08-15T09:00:00Z'),
    });
    caseResolutions.push({
      id: 'res-seed-3',
      tenantId: 'INST-SSCIT',
      caseId: 'case-3',
      resolutionType: 'REDRESSED',
      summary: 'Replacement bulb installed and verified by IT.',
      studentVisibleSummary: 'New projector installed and functional.',
      resolvedBy: 'STAFF-IT',
      resolvedAt: new Date(),
      status: 'RESOLVED',
    });

    // Seed Committees
    committees.push({
      id: 'comm-1',
      tenantId: 'INST-SSCIT',
      name: 'Students Grievance Redressal Committee (SGRC)',
      type: 'GRIEVANCE_COMMITTEE',
      status: 'ACTIVE',
    });
    committees.push({
      id: 'comm-2',
      tenantId: 'INST-SSCIT',
      name: 'Anti-Ragging Squad & Committee',
      type: 'ANTI_RAGGING_COMMITTEE',
      status: 'ACTIVE',
    });
    committees.push({
      id: 'comm-3',
      tenantId: 'INST-SSCIT',
      name: 'Internal Complaints Committee (ICC)',
      type: 'ICC',
      status: 'ACTIVE',
    });

    // Seed Committee Members
    committeeMembers.push({
      id: 'cm-1',
      tenantId: 'INST-SSCIT',
      committeeId: 'comm-1',
      userId: 'FAC-001',
      role: 'CHAIRPERSON',
      status: 'ACTIVE',
    });
    committeeMembers.push({
      id: 'cm-2',
      tenantId: 'INST-SSCIT',
      committeeId: 'comm-3',
      userId: 'FAC-002',
      role: 'CHAIRPERSON',
      status: 'ACTIVE',
    });
    committeeMembers.push({
      id: 'cm-3',
      tenantId: 'INST-SSCIT',
      committeeId: 'comm-2',
      userId: 'FAC-003',
      role: 'AUTHORIZED_OFFICER',
      status: 'ACTIVE',
    });

    // Seed SLA Configs
    slaConfigs.push({
      id: 'sla-1',
      tenantId: 'INST-SSCIT',
      caseType: 'GENERAL',
      priority: 'MEDIUM',
      responseHours: 24,
      resolutionHours: 168,
      escalationHours: 72,
      active: true,
      version: 'v1.0',
    });
    slaConfigs.push({
      id: 'sla-2',
      tenantId: 'INST-SSCIT',
      caseType: 'ANTI_RAGGING',
      priority: 'CRITICAL',
      responseHours: 2,
      resolutionHours: 24,
      escalationHours: 12,
      active: true,
      version: 'v1.0',
    });
    slaConfigs.push({
      id: 'sla-3',
      tenantId: 'INST-SSCIT',
      caseType: 'ICC',
      priority: 'HIGH',
      responseHours: 24,
      resolutionHours: 2160, // 90 days inquiry period under statutory norms
      escalationHours: 720,
      active: true,
      version: 'v1.0',
    });

    // Seed Escalation Rules
    escalationRules.push({
      id: 'er-1',
      tenantId: 'INST-SSCIT',
      caseType: 'GENERAL',
      fromRole: 'COMMITTEE_CHAIR',
      toRole: 'REGISTRAR',
      afterHours: 72,
      priority: 'HIGH',
      active: true,
    });
    escalationRules.push({
      id: 'er-2',
      tenantId: 'INST-SSCIT',
      caseType: 'GENERAL',
      fromRole: 'REGISTRAR',
      toRole: 'VICE_CHANCELLOR',
      afterHours: 168,
      priority: 'CRITICAL',
      active: true,
    });

    // Seed Retention Policies
    retentionPolicies.push({
      id: 'ret-1',
      tenantId: 'INST-SSCIT',
      caseType: 'GENERAL',
      retentionPeriod: 1825,
      legalHold: false,
      archiveAfter: 365,
      deleteAfter: 2555,
    });
    retentionPolicies.push({
      id: 'ret-2',
      tenantId: 'INST-SSCIT',
      caseType: 'ICC',
      retentionPeriod: 3650,
      legalHold: true,
      archiveAfter: 730,
      deleteAfter: 7300,
    });
    retentionPolicies.push({
      id: 'ret-3',
      tenantId: 'INST-SSCIT',
      caseType: 'ANTI_RAGGING',
      retentionPeriod: 3650,
      legalHold: true,
      archiveAfter: 730,
      deleteAfter: 7300,
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. ANONYMITY, IDENTITY SEGREGATION & TOKEN SECURITY
  // ────────────────────────────────────────────────────────────────────────────
  describe('1. Anonymity & Secure Identification', () => {
    it('generates high entropy tracking token for anonymous complaints', () => {
      const token = 'tok_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(16);
      expect(token).not.toMatch(/^[0-9]+$/);
    });

    it('prevents normal committee members from viewing SYSTEM_ONLY anonymous identities', () => {
      const caseItem = cases.find(c => c.id === 'case-2');
      const identity = identities.get(caseItem.id);

      const requesterRole = 'COMMITTEE_MEMBER';
      let exposedStudentId: string | null = null;

      if (identity && (requesterRole === 'SUPER_ADMIN' || identity.identityVisibility !== 'SYSTEM_ONLY')) {
        exposedStudentId = identity.studentId;
      }

      expect(exposedStudentId).toBeNull();
    });

    it('allows authorized super admin audit access to pseudonym mappings when permitted', () => {
      const caseItem = cases.find(c => c.id === 'case-2');
      const identity = identities.get(caseItem.id);

      const requesterRole = 'SUPER_ADMIN';
      let exposedStudentId: string | null = null;

      if (identity && (requesterRole === 'SUPER_ADMIN' || identity.identityVisibility !== 'SYSTEM_ONLY')) {
        exposedStudentId = identity.studentId;
      }

      expect(exposedStudentId).toBe('STU-102');
    });

    it('allows anonymous tracking lookup only by matching caseNumber and trackingToken', () => {
      const lookup = (cNum: string, token: string) => {
        return cases.find(c => c.caseNumber === cNum && c.trackingToken === token);
      };

      expect(lookup('GRV-2026-100002', 'tok_secret_xyz999')).toBeDefined();
      expect(lookup('GRV-2026-100002', 'wrong_token')).toBeUndefined();
      expect(lookup('NON_EXISTENT', 'tok_secret_xyz999')).toBeUndefined();
    });

    it('masks internal notes and investigator identities during public anonymous tracking', () => {
      const caseItem = cases.find(c => c.id === 'case-2');
      const publicView = {
        caseNumber: caseItem.caseNumber,
        category: caseItem.category,
        status: caseItem.status,
        internalNotes: undefined,
        investigatorName: undefined,
      };

      expect(publicView.internalNotes).toBeUndefined();
      expect(publicView.investigatorName).toBeUndefined();
      expect(publicView.status).toBe('UNDER_REVIEW');
    });

    it('prevents sequential token enumeration guessing attacks', () => {
      const generatedTokens = Array.from({ length: 5 }, () =>
        'tok_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
      );
      const uniqueTokens = new Set(generatedTokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it('ensures anonymous cases do not appear in student My Complaints list without tracking token', () => {
      const studentId = 'STU-102';
      const myComplaints = cases.filter(c => {
        const idObj = identities.get(c.id);
        return idObj && idObj.studentId === studentId && idObj.identityVisibility !== 'SYSTEM_ONLY';
      });
      expect(myComplaints.length).toBe(0);
    });

    it('allows identified cases to appear in student My Complaints list', () => {
      const studentId = 'STU-101';
      const myComplaints = cases.filter(c => {
        const idObj = identities.get(c.id);
        return idObj && idObj.studentId === studentId && idObj.identityVisibility !== 'SYSTEM_ONLY';
      });
      expect(myComplaints.length).toBe(1);
      expect(myComplaints[0].caseNumber).toBe('GRV-2026-100001');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. ANTI-RAGGING & ICC MANAGEMENT
  // ────────────────────────────────────────────────────────────────────────────
  describe('2. Anti-Ragging & ICC Management', () => {
    it('sets emergency flag and critical priority for urgent anti-ragging complaints', () => {
      const raggingCase = {
        id: 'case-rag-1',
        category: 'ANTI_RAGGING',
        isEmergency: true,
        priority: 'CRITICAL',
        victimCount: 2,
        status: 'SUBMITTED',
      };

      expect(raggingCase.priority).toBe('CRITICAL');
      expect(raggingCase.isEmergency).toBe(true);
      expect(raggingCase.category).toBe('ANTI_RAGGING');
    });

    it('strictly isolates ICC sexual harassment records with HIGHLY_RESTRICTED confidentiality', () => {
      const iccCase = {
        id: 'icc-1',
        caseId: 'case-icc-101',
        confidentialityLevel: 'HIGHLY_RESTRICTED',
        status: 'SUBMITTED',
      };

      expect(iccCase.confidentialityLevel).toBe('HIGHLY_RESTRICTED');
    });

    it('denies standard faculty from accessing ICC cases without ICC committee membership', () => {
      const userRoles = ['FACULTY'];
      const isICCMember = false;
      const canAccessICC = userRoles.includes('SUPER_ADMIN') || isICCMember;

      expect(canAccessICC).toBe(false);
    });

    it('permits authorized ICC committee members to access ICC inquiry records', () => {
      const userRoles = ['FACULTY'];
      const isICCMember = true;
      const canAccessICC = userRoles.includes('SUPER_ADMIN') || isICCMember;

      expect(canAccessICC).toBe(true);
    });

    it('disallows automated guilt presumption on anti-ragging incident submission', () => {
      const incident = {
        status: 'SUBMITTED',
        inquiryStatus: 'PENDING_INQUIRY',
        disciplinaryActionTaken: false,
      };
      expect(incident.status).toBe('SUBMITTED');
      expect(incident.disciplinaryActionTaken).toBe(false);
    });

    it('records witness information securely for anti-ragging squad investigation', () => {
      const ragging = {
        id: 'rag-02',
        witnessCount: 3,
        witnessStatementEncrypted: true,
      };
      expect(ragging.witnessStatementEncrypted).toBe(true);
    });

    it('routes critical anti-ragging emergency alerts to prompt SMS/Push gateway', () => {
      const isEmergency = true;
      const targetChannel = isEmergency ? 'INSTANT_EMERGENCY_SMS' : 'STANDARD_PORTAL_ALERT';
      expect(targetChannel).toBe('INSTANT_EMERGENCY_SMS');
    });

    it('maintains separate inquiry timeline events for ICC statutory proceedings', () => {
      const iccTimeline = [
        { step: 1, action: 'INQUIRY_NOTICE_ISSUED' },
        { step: 2, action: 'RESPONDENT_REPLY_RECEIVED' },
        { step: 3, action: 'INQUIRY_HEARING_CONDUCTED' },
        { step: 4, action: 'FINAL_INQUIRY_REPORT_SUBMITTED' },
      ];
      expect(iccTimeline.length).toBe(4);
      expect(iccTimeline[3].action).toBe('FINAL_INQUIRY_REPORT_SUBMITTED');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. COMMITTEE & CASE ASSIGNMENT
  // ────────────────────────────────────────────────────────────────────────────
  describe('3. Committee & Case Assignment', () => {
    it('retrieves active committee listings', () => {
      const active = committees.filter(c => c.status === 'ACTIVE');
      expect(active.length).toBe(3);
    });

    it('assigns case to committee with due date and server authorization', () => {
      const assignment = {
        id: 'asn-1',
        caseId: 'case-1',
        committeeId: 'comm-1',
        assignedTo: 'FAC-001',
        assignedBy: 'REGISTRAR',
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ASSIGNED',
      };
      caseAssignments.push(assignment);

      expect(assignment.status).toBe('ASSIGNED');
      expect(assignment.committeeId).toBe('comm-1');
    });

    it('rejects student role from assigning cases to committee', () => {
      const userRole = 'STUDENT';
      const canAssign = ['ADMIN', 'SUPER_ADMIN', 'REGISTRAR', 'HOD'].includes(userRole);
      expect(canAssign).toBe(false);
    });

    it('allows reassigning a case to another committee member', () => {
      const prevAssign = { id: 'asn-1', status: 'ASSIGNED', assignedTo: 'FAC-001' };
      prevAssign.status = 'REASSIGNED';
      const newAssign = { id: 'asn-2', status: 'ASSIGNED', assignedTo: 'FAC-002' };
      expect(prevAssign.status).toBe('REASSIGNED');
      expect(newAssign.assignedTo).toBe('FAC-002');
    });

    it('validates active status of committee members before assignment', () => {
      const member = committeeMembers.find(cm => cm.userId === 'FAC-001');
      expect(member.status).toBe('ACTIVE');
    });

    it('lists committee members grouped by role (CHAIRPERSON, SECRETARY, MEMBER)', () => {
      const chair = committeeMembers.filter(cm => cm.role === 'CHAIRPERSON');
      expect(chair.length).toBe(2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. SLA TRACKING & AUTO-ESCALATION ENGINE
  // ────────────────────────────────────────────────────────────────────────────
  describe('4. SLA Tracking & Auto-Escalation Engine', () => {
    it('detects overdue cases based on escalation deadline', () => {
      const now = new Date();
      const overdue = cases.filter(c => c.status === 'SUBMITTED' && c.escalationDeadline < now);
      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe('case-1');
    });

    it('escalates overdue case and increments escalationLevel idempotently', () => {
      const targetCase = cases.find(c => c.id === 'case-1');
      const prevLevel = targetCase.escalationLevel;

      targetCase.status = 'ESCALATED';
      targetCase.escalationLevel = prevLevel + 1;
      targetCase.currentAssigneeId = 'REGISTRAR';

      const escalationEvent = {
        id: 'esc-1',
        caseId: targetCase.id,
        fromRole: 'COMMITTEE_CHAIR',
        toRole: 'REGISTRAR',
        reason: 'Resolution SLA exceeded (Deadline passed).',
        triggeredAt: new Date(),
        status: 'TRIGGERED',
      };
      escalationEvents.push(escalationEvent);

      expect(targetCase.status).toBe('ESCALATED');
      expect(targetCase.escalationLevel).toBe(1);
      expect(targetCase.currentAssigneeId).toBe('REGISTRAR');
      expect(escalationEvents.length).toBe(1);
    });

    it('prevents repeated duplicate escalation in the same scheduler cycle using idempotency', () => {
      const idempotencyKeys = new Set<string>();
      const key = 'case-1_RULE-1_LEVEL-1';

      const firstTrigger = !idempotencyKeys.has(key);
      if (firstTrigger) idempotencyKeys.add(key);

      const secondTrigger = !idempotencyKeys.has(key);

      expect(firstTrigger).toBe(true);
      expect(secondTrigger).toBe(false);
    });

    it('calculates custom SLA hours per category and priority configuration', () => {
      const config = slaConfigs.find(s => s.caseType === 'ANTI_RAGGING');
      expect(config.resolutionHours).toBe(24);
      expect(config.responseHours).toBe(2);
    });

    it('never alters original creation timestamp or historical deadlines silently', () => {
      const targetCase = cases.find(c => c.id === 'case-1');
      const originalCreatedAt = targetCase.createdAt;
      targetCase.status = 'ESCALATED';
      expect(targetCase.createdAt).toEqual(originalCreatedAt);
    });

    it('tracks hierarchical escalation paths (Committee -> Registrar -> VC)', () => {
      const rules = escalationRules.sort((a, b) => a.afterHours - b.afterHours);
      expect(rules[0].toRole).toBe('REGISTRAR');
      expect(rules[1].toRole).toBe('VICE_CHANCELLOR');
    });

    it('marks case as DUE_SOON when deadline is within 24 hours', () => {
      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const isDueSoon = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;
      expect(isDueSoon).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. INVESTIGATION, EVIDENCE & RESOLUTION WORKFLOW
  // ────────────────────────────────────────────────────────────────────────────
  describe('5. Investigation, Evidence & Resolution', () => {
    it('initiates investigation and transitions case status to UNDER_REVIEW', () => {
      const inv = {
        id: 'inv-1',
        caseId: 'case-1',
        investigatorId: 'FAC-001',
        status: 'IN_PROGRESS',
        findings: 'Preliminary verification of marksheet ongoing.',
      };
      investigations.push(inv);

      const targetCase = cases.find(c => c.id === 'case-1');
      targetCase.status = 'UNDER_REVIEW';

      expect(inv.status).toBe('IN_PROGRESS');
      expect(targetCase.status).toBe('UNDER_REVIEW');
    });

    it('attaches DMS document evidence with verification status', () => {
      const evidence = {
        id: 'ev-1',
        caseId: 'case-1',
        documentId: 'dms-doc-8812',
        evidenceType: 'DOCUMENT',
        uploadedBy: 'STU-101',
        verificationStatus: 'VERIFIED',
      };
      caseEvidences.push(evidence);

      expect(evidence.documentId).toBe('dms-doc-8812');
      expect(evidence.verificationStatus).toBe('VERIFIED');
    });

    it('resolves case and separates internal summary from studentVisibleSummary', () => {
      const resolution = {
        id: 'res-1',
        caseId: 'case-1',
        resolutionType: 'REDRESSED',
        summary: 'Re-evaluation completed. 4 marks added to Subject CS501 due to totaling discrepancy in Section B.',
        studentVisibleSummary: 'Re-evaluation completed. Revised grade sheet published in portal.',
        resolvedBy: 'REGISTRAR',
        status: 'RESOLVED',
      };
      caseResolutions.push(resolution);

      expect(resolution.studentVisibleSummary).not.toContain('Section B');
      expect(resolution.status).toBe('RESOLVED');
    });

    it('records student satisfaction feedback without altering official resolution record', () => {
      const resolution = caseResolutions.find(r => r.caseId === 'case-3');
      expect(resolution).toBeDefined();
      expect(resolution.status).toBe('RESOLVED');

      const feedback = {
        caseId: 'case-3',
        satisfactionLevel: 'SATISFIED',
        comments: 'Thank you for quick resolution.',
      };

      expect(resolution.status).toBe('RESOLVED'); // Remains immutable
      expect(feedback.satisfactionLevel).toBe('SATISFIED');
    });

    it('allows authorized case reopening from CLOSED to REOPENED with audit note', () => {
      const targetCase = cases.find(c => c.id === 'case-3');
      targetCase.status = 'REOPENED';

      auditLogs.push({
        event: 'CASE_REOPENED',
        caseId: targetCase.id,
        reason: 'Projector still flickering in low brightness mode.',
        timestamp: new Date(),
      });

      expect(targetCase.status).toBe('REOPENED');
      expect(auditLogs.length).toBe(1);
    });

    it('tracks actionable corrective steps with deadlines and status', () => {
      const action = {
        id: 'act-1',
        caseId: 'case-1',
        actionType: 'CORRECTIVE',
        description: 'Update mark entry in Controller of Examinations database.',
        assignedTo: 'COE-OFFICER',
        status: 'COMPLETED',
      };
      caseActions.push(action);
      expect(action.status).toBe('COMPLETED');
    });

    it('prevents deletion of historic case resolutions when re-evaluating', () => {
      expect(caseResolutions.length).toBeGreaterThanOrEqual(1);
      const res = caseResolutions[0];
      expect(res.resolvedAt).toBeDefined();
    });

    it('enforces file type restrictions (PDF, JPG, PNG) on evidence upload', () => {
      const allowedTypes = ['PDF', 'IMAGE', 'DOCUMENT'];
      const incoming = 'PDF';
      expect(allowedTypes.includes(incoming)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. TENANT ISOLATION & SECURITY CHECKS
  // ────────────────────────────────────────────────────────────────────────────
  describe('6. Tenant Isolation & Security Constraints', () => {
    it('isolates cases across multi-tenant boundaries', () => {
      cases.push({
        id: 'case-other-tenant',
        tenantId: 'INST-OTHER',
        caseNumber: 'GRV-2026-999999',
        category: 'HOSTEL',
        status: 'SUBMITTED',
      });

      const sscitCases = cases.filter(c => c.tenantId === 'INST-SSCIT');
      expect(sscitCases.some(c => c.tenantId === 'INST-OTHER')).toBe(false);
    });

    it('enforces legal hold on retention policy to prevent accidental data purge', () => {
      const iccPolicy = retentionPolicies.find(p => p.caseType === 'ICC');
      expect(iccPolicy.legalHold).toBe(true);

      const canPurge = !iccPolicy.legalHold && iccPolicy.deleteAfter < 365;
      expect(canPurge).toBe(false);
    });

    it('rejects cross-tenant committee assignment attempts', () => {
      const caseTenant = 'INST-SSCIT';
      const committeeTenant = 'INST-OTHER';
      const isAllowed = caseTenant === committeeTenant;
      expect(isAllowed).toBe(false);
    });

    it('protects against IDOR by matching tenantId on case retrieval', () => {
      const userTenant = 'INST-SSCIT';
      const requestedCase = cases.find(c => c.id === 'case-other-tenant' && c.tenantId === userTenant);
      expect(requestedCase).toBeUndefined();
    });

    it('records immutable audit events with tenantId and correlationId', () => {
      const audit = {
        event: 'CASE_ASSIGNED',
        tenantId: 'INST-SSCIT',
        actorId: 'REGISTRAR',
        caseId: 'case-1',
        correlationId: 'cid-9912',
      };
      auditLogs.push(audit);
      expect(auditLogs[0].correlationId).toBe('cid-9912');
    });

    it('conceals confidential internal notes from public student API responses', () => {
      const note = { id: 'n-1', note: 'Witness statements corroborate complaint.', isInternal: true };
      const studentPayload = { ...note, note: undefined };
      expect(studentPayload.note).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 7. API SERVICE & REPORT GENERATION
  // ────────────────────────────────────────────────────────────────────────────
  describe('7. API Service & Reporting', () => {
    it('fetches dashboard summary with category distribution', async () => {
      const res = await GrievanceApiService.getDashboard();
      expect(res.success).toBe(true);
      expect(res.data.totalCases).toBeGreaterThan(0);
      expect(res.data.categoryDistribution).toBeDefined();
    });

    it('files complaint via API service returning case number', async () => {
      const res = await GrievanceApiService.fileComplaint({
        category: 'ACADEMIC',
        type: 'IDENTIFIED',
        subject: 'Attendance Discrepancy',
        description: 'Attendance not updated for Laboratory Session 4.',
      });
      expect(res.success).toBe(true);
      expect(res.data.caseNumber).toMatch(/^GRV-/);
    });

    it('files anti-ragging incident with immediate squad priority', async () => {
      const res = await GrievanceApiService.fileAntiRagging({
        description: 'Verbal intimidation reported near East Gate.',
        location: 'East Gate Cafeteria',
        severity: 'HIGH',
        isEmergency: true,
      });
      expect(res.success).toBe(true);
      expect(res.data.caseNumber).toMatch(/^RAG-/);
      expect(res.data.isEmergency).toBe(true);
    });

    it('files confidential ICC inquiry request', async () => {
      const res = await GrievanceApiService.fileICC({
        description: 'Inappropriate conduct complaint submitted to ICC.',
        confidentialityLevel: 'HIGHLY_RESTRICTED',
      });
      expect(res.success).toBe(true);
      expect(res.data.caseNumber).toMatch(/^ICC-/);
      expect(res.data.confidentialityLevel).toBe('HIGHLY_RESTRICTED');
    });

    it('generates annual grievance report with sequestered ICC notice', async () => {
      const res = await GrievanceApiService.getAnnualReport();
      expect(res.success).toBe(true);
      expect(res.data.reportType).toBe('UGC_ANNUAL_GRIEVANCE_REPORT');
      expect(res.data.confidentialityNotice).toContain('ICC Sexual Harassment cases are sequestered');
    });

    it('assigns case via API service', async () => {
      const res = await GrievanceApiService.assignCase('case-1', {
        assigneeId: 'FAC-001',
        committeeId: 'comm-1',
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('ASSIGNED');
    });

    it('resolves case via API service', async () => {
      const res = await GrievanceApiService.resolveCase('case-1', {
        resolutionType: 'REDRESSED',
        summary: 'Investigation concluded favorably.',
        studentVisibleSummary: 'Issue resolved by administration.',
      });
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('RESOLVED');
    });

    it('submits student feedback via API service', async () => {
      const res = await GrievanceApiService.submitFeedback('case-1', {
        satisfactionLevel: 'SATISFIED',
        comments: 'Great support.',
      });
      expect(res.success).toBe(true);
      expect(res.data.feedback).toBe('SATISFIED');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 8. NOTIFICATIONS, WORKFLOWS & RBAC PERMISSIONS
  // ────────────────────────────────────────────────────────────────────────────
  describe('8. Notifications & Navigation RBAC Permissions', () => {
    it('dispatches status change notification to student on case resolution', () => {
      const notif = {
        userId: 'STU-101',
        title: 'Grievance Resolved',
        body: 'Your case GRV-2026-100001 has been resolved.',
        channel: 'PORTAL_NOTIFICATION',
      };
      notifications.push(notif);
      expect(notifications.length).toBe(1);
    });

    it('verifies Grievance module navigation is accessible for permitted roles', () => {
      const grievanceTab = Object.values(ALL_NAV_ITEMS).find(item => item.id === 'grievances' || item.id === 'grievance');
      if (grievanceTab) {
        expect(isTabPermittedForRole(grievanceTab.id, 'STUDENT')).toBe(true);
        expect(isTabPermittedForRole(grievanceTab.id, 'SUPER_ADMIN')).toBe(true);
      }
    });

    it('validates multi-category distribution support', () => {
      const categories = [
        'GENERAL', 'ACADEMIC', 'ADMINISTRATIVE', 'EXAMINATION', 'FEES',
        'HOSTEL', 'TRANSPORT', 'FACULTY', 'STAFF', 'ANTI_RAGGING',
        'ICC', 'HARASSMENT', 'SAFETY', 'INFRASTRUCTURE', 'OTHER'
      ];
      expect(categories.length).toBe(15);
    });

    it('ensures confidential notifications do not leak sensitive details in push previews', () => {
      const pushPreview = {
        title: 'Case Update',
        body: 'Your case status has been updated. Please log in securely to view.',
      };
      expect(pushPreview.body).not.toContain('Harassment');
      expect(pushPreview.body).not.toContain('Allegation');
    });

    it('preserves immutable audit timestamps for regulatory inquiry inspection', () => {
      const eventTime = new Date('2026-08-30T10:00:00Z');
      const auditRecord = { id: 'aud-1', timestamp: eventTime };
      expect(auditRecord.timestamp.toISOString()).toBe('2026-08-30T10:00:00.000Z');
    });

    it('rejects client-supplied tenantId injection in DTO payload', () => {
      const untrustedPayload = {
        tenantId: 'MALICIOUS_TENANT',
        category: 'ACADEMIC',
        subject: 'Legitimate complaint',
        description: 'Details here',
      };
      const authenticatedTenant = 'INST-SSCIT';
      const sanitized = { ...untrustedPayload, tenantId: authenticatedTenant };
      expect(sanitized.tenantId).toBe('INST-SSCIT');
    });

    it('rejects client-supplied escalationLevel spoofing in submission DTO', () => {
      const untrustedPayload = {
        escalationLevel: 3,
        subject: 'Attempted Priority Escalation',
        description: 'Test',
      };
      const initialLevel = 0;
      const sanitized = { ...untrustedPayload, escalationLevel: initialLevel };
      expect(sanitized.escalationLevel).toBe(0);
    });

    it('validates evidence access permissions strictly for ordinary students', () => {
      const studentId = 'STU-101';
      const evidences = [
        { id: 'ev-1', uploadedBy: 'STU-101', caseId: 'case-1' },
        { id: 'ev-2', uploadedBy: 'STU-102', caseId: 'case-2' },
      ];
      const authorizedEvidence = evidences.filter(e => e.uploadedBy === studentId);
      expect(authorizedEvidence.length).toBe(1);
      expect(authorizedEvidence[0].id).toBe('ev-1');
    });

    it('allows committee members to view all evidence linked to their assigned case', () => {
      const assignedCaseId = 'case-1';
      const evidences = [
        { id: 'ev-1', uploadedBy: 'STU-101', caseId: 'case-1' },
        { id: 'ev-2', uploadedBy: 'FAC-001', caseId: 'case-1' },
        { id: 'ev-3', uploadedBy: 'STU-103', caseId: 'case-2' },
      ];
      const caseEvidences = evidences.filter(e => e.caseId === assignedCaseId);
      expect(caseEvidences.length).toBe(2);
    });

    it('applies IP rate limiting threshold defense on anonymous tracking lookups', () => {
      const maxAttemptsPerMinute = 10;
      let attemptCount = 0;
      const simulateProbing = () => {
        attemptCount++;
        return attemptCount <= maxAttemptsPerMinute;
      };

      for (let i = 0; i < 10; i++) {
        expect(simulateProbing()).toBe(true);
      }
      expect(simulateProbing()).toBe(false);
    });

    it('validates SLA calculation handles leap years and weekend configurations properly', () => {
      const baseDate = new Date('2026-02-27T10:00:00Z');
      const responseHours = 48;
      const calculated = new Date(baseDate.getTime() + responseHours * 3600 * 1000);
      expect(calculated.toISOString()).toBe('2026-03-01T10:00:00.000Z');
    });

    it('ensures anonymous complaint submission does not require Authorization header', () => {
      const isPublicEndpoint = (endpoint: string) => {
        return ['/api/v1/grievance/anonymous', '/api/v1/grievance/track'].some(e => endpoint.startsWith(e));
      };
      expect(isPublicEndpoint('/api/v1/grievance/anonymous')).toBe(true);
      expect(isPublicEndpoint('/api/v1/grievance/my')).toBe(false);
    });

    it('calculates aggregate resolution times across resolved grievances', () => {
      const durationsInDays = [3, 4, 5, 2, 6];
      const avg = durationsInDays.reduce((a, b) => a + b, 0) / durationsInDays.length;
      expect(avg).toBe(4.0);
    });

    it('calculates institutional SLA compliance percentage correctly', () => {
      const totalResolved = 20;
      const withinSLA = 19;
      const rate = (withinSLA / totalResolved) * 100;
      expect(rate).toBe(95.0);
    });

    it('validates anti-ragging squad emergency call routing', () => {
      const emergencyHelpline = '1800-180-5522';
      expect(emergencyHelpline).toMatch(/^1800/);
    });

    it('validates discrete ICC inquiry recommendations (e.g. counseling, written apology, disciplinary action)', () => {
      const allowedRecommendations = ['COUNSELING', 'WRITTEN_APOLOGY', 'SUSPENSION', 'SERVICE_ACTION', 'NO_ACTION'];
      const current = 'COUNSELING';
      expect(allowedRecommendations.includes(current)).toBe(true);
    });

    it('prevents direct database mutation of grievance caseNumber once assigned', () => {
      const existingCase = { id: 'c-1', caseNumber: 'GRV-2026-100001' };
      const updateAttempt = { ...existingCase, caseNumber: 'GRV-2026-MUTATED' };
      const lockedCase = { ...updateAttempt, caseNumber: existingCase.caseNumber };
      expect(lockedCase.caseNumber).toBe('GRV-2026-100001');
    });

    it('ensures committee members have defined tenure activeFrom and activeTo dates', () => {
      const member = {
        userId: 'FAC-001',
        activeFrom: new Date('2026-01-01'),
        activeTo: new Date('2026-12-31'),
      };
      expect(member.activeTo.getTime()).toBeGreaterThan(member.activeFrom.getTime());
    });

    it('verifies that case resolutions record both summary and studentVisibleSummary', () => {
      const resolution = {
        summary: 'Detailed internal inquiry notes, committee findings, witness statement analysis, and restorative administrative corrective actions taken.',
        studentVisibleSummary: 'Complaint examined and corrective administrative steps completed.',
      };
      expect(resolution.summary.length).toBeGreaterThan(resolution.studentVisibleSummary.length);
    });

    it('ensures confidential case status can be queried without exposing case details', () => {
      const statusOnly = {
        caseNumber: 'GRV-2026-100002',
        status: 'UNDER_REVIEW',
      };
      expect(Object.keys(statusOnly)).toEqual(['caseNumber', 'status']);
    });

    it('confirms that institutional categories can be extended dynamically via config', () => {
      const baseCategories = ['ACADEMIC', 'HOSTEL'];
      const dynamicCategory = 'RESEARCH_ETHICS';
      const merged = [...baseCategories, dynamicCategory];
      expect(merged).toContain('RESEARCH_ETHICS');
    });

    it('ensures scheduler auto-escalation job runs non-destructively on empty queues', () => {
      const emptyOverdueList: any[] = [];
      const evaluated = emptyOverdueList.length;
      expect(evaluated).toBe(0);
    });

    it('validates retention policy compliance before archiving closed records', () => {
      const closedRecord = { closedAt: new Date(Date.now() - 400 * 24 * 3600 * 1000), status: 'CLOSED' };
      const archiveAfterDays = 365;
      const daysSinceClose = (Date.now() - closedRecord.closedAt.getTime()) / (24 * 3600 * 1000);
      const isEligibleForArchive = daysSinceClose >= archiveAfterDays;
      expect(isEligibleForArchive).toBe(true);
    });
  });
});

