import { describe, it, expect } from 'vitest';
import { centralEnterpriseKnowledgeManagementService } from '../services/centralEnterpriseKnowledgeManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.62: Enterprise Content & Knowledge Management Platform Engine', () => {

  const knowledgeAdmin: UserAuthorizationContext = {
    userId: 'emp-km-admin-001',
    userName: 'Enterprise Knowledge Platform Administrator',
    email: 'km.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['KNOWLEDGE_ADMIN', 'SYSTEM_ADMIN']
  };

  const studentUser: UserAuthorizationContext = {
    userId: 'stu-2026-001',
    userName: 'Jigar Parmar',
    email: 'jigar.student@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['KNOWLEDGE_VIEW']
  };

  it('TEST 1: Permission-Aware Knowledge Search: Trims restricted knowledge from unauthorized student search results', () => {
    // 1. Student searches for attendance policy -> Allowed
    const resPublic = centralEnterpriseKnowledgeManagementService.searchKnowledge({
      query: 'attendance',
      tenantId: 'ssiu-main-campus',
      context: studentUser
    });
    expect(resPublic.results.length).toBeGreaterThan(0);
    expect(resPublic.results[0].knowledge_id).toBe('KB-POL-2026-001');

    // 2. Student searches for restricted IT vault guide -> Trimmed / 0 results
    const resRestricted = centralEnterpriseKnowledgeManagementService.searchKnowledge({
      query: 'vault',
      tenantId: 'ssiu-main-campus',
      context: studentUser
    });
    expect(resRestricted.results.length).toBe(0);

    // 3. Admin searches for restricted IT vault guide -> Returns KB-INT-2026-001
    const resAdmin = centralEnterpriseKnowledgeManagementService.searchKnowledge({
      query: 'vault',
      tenantId: 'ssiu-main-campus',
      context: knowledgeAdmin
    });
    expect(resAdmin.results.length).toBe(1);
    expect(resAdmin.results[0].knowledge_id).toBe('KB-INT-2026-001');
  });

  it('TEST 2: AI Knowledge Assistant RAG & Citations: Generates traceable citations and protects against hallucinations', () => {
    // 1. Question with authoritative knowledge
    const response = centralEnterpriseKnowledgeManagementService.askKnowledgeAssistant({
      question: 'minimum 75% attendance requirement',
      tenantId: 'ssiu-main-campus',
      context: studentUser
    });

    expect(response.confidence).toBeGreaterThan(0.9);
    expect(response.citations.length).toBe(1);
    expect(response.citations[0].knowledge_id).toBe('KB-POL-2026-001');
    expect(response.answer).toContain('According to University Minimum 75% Attendance');

    // 2. Question with no authoritative knowledge -> Hallucination safeguard
    const noAnswerResponse = centralEnterpriseKnowledgeManagementService.askKnowledgeAssistant({
      question: 'quantum physics teleportation device manual',
      tenantId: 'ssiu-main-campus',
      context: studentUser
    });

    expect(noAnswerResponse.citations.length).toBe(0);
    expect(noAnswerResponse.answer).toContain('Insufficient authoritative knowledge found');
  });

  it('TEST 3: Duplicate Knowledge Detection: Flags similar candidate articles without destructive deletion', () => {
    const candidateTitle = 'Minimum Attendance Requirement for Students';
    const candidateContent = 'All undergraduate students must maintain at least 75 aggregate attendance in each registered subject. Condonation up to 10 may be granted by Dean.';

    const dupCheck = centralEnterpriseKnowledgeManagementService.detectDuplicateKnowledge(candidateTitle, candidateContent);

    expect(dupCheck.isDuplicate).toBe(true);
    expect(dupCheck.similarKnowledgeId).toBe('KB-POL-2026-001');
  });

  it('TEST 4: Policy Acknowledgement Tracking: Records version-bound compliance acknowledgement records', () => {
    const ack = centralEnterpriseKnowledgeManagementService.acknowledgePolicy(
      'stu-2026-001',
      'KB-POL-2026-001',
      'kb-ver-001-v1'
    );

    expect(ack.user_id).toBe('stu-2026-001');
    expect(ack.knowledge_id).toBe('KB-POL-2026-001');
    expect(ack.version_id).toBe('kb-ver-001-v1');
    expect(ack.acknowledged_at).toBeDefined();
  });

  it('TEST 5: Knowledge Dashboard Telemetry: Validates total knowledge (4.8k+), graph nodes (18.4k+), and platform posture', () => {
    const metrics = centralEnterpriseKnowledgeManagementService.getKnowledgeDashboardMetrics(knowledgeAdmin);

    expect(metrics.totalKnowledgeItemsCount).toBeGreaterThan(4000);
    expect(metrics.knowledgeGraphNodesCount).toBeGreaterThan(15000);
    expect(metrics.aiRetrievalSatisfactionPercent).toBeGreaterThan(95);
    expect(metrics.knowledgePlatformPosture).toBe('HEALTHY');
  });
});
