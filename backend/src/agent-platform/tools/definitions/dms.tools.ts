import { ToolDefinition } from '../tool.types';

export const dmsTools: ToolDefinition[] = [
  {
    key: 'DMS_GET_DOCUMENT',
    name: 'Get Document By ID',
    description: 'Retrieves document record and secure download URL for verification inspection.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'DMS',
    riskLevel: 'LOW',
    allowedAgents: ['DOCUMENT_VERIFICATION_AGENT', 'ALL'],
    requiredPermissions: ['dms.read'],
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string' },
      },
      required: ['documentId'],
    },
    requiresApproval: false,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 60, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        documentId: input.documentId,
        fileName: 'Leaving_Certificate.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 245000,
        status: 'PENDING_VERIFICATION',
      };
    },
  },
  {
    key: 'DMS_GET_DOCUMENT_METADATA',
    name: 'Get Document Metadata',
    description: 'Retrieves OCR metadata and student profile linkage for a DMS document.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'DMS',
    riskLevel: 'LOW',
    allowedAgents: ['DOCUMENT_VERIFICATION_AGENT', 'ALL'],
    requiredPermissions: ['dms.read'],
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string' },
      },
      required: ['documentId'],
    },
    requiresApproval: false,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 60, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        documentId: input.documentId,
        documentType: 'LEAVING_CERTIFICATE',
        studentId: 'STU-2026-001',
        extractedEnrollment: '2026SSIU001',
      };
    },
  },
  {
    key: 'DMS_VERIFY_DOCUMENT',
    name: 'Verify Student Document Status',
    description: 'Updates document verification status in DMS upon verified confidence or admin approval.',
    version: '1.0.0',
    status: 'ACTIVE',
    category: 'DMS',
    riskLevel: 'HIGH',
    allowedAgents: ['DOCUMENT_VERIFICATION_AGENT'],
    requiredPermissions: ['dms.write'],
    inputSchema: {
      type: 'object',
      properties: {
        documentId: { type: 'string' },
        status: { type: 'string' },
      },
      required: ['documentId', 'status'],
    },
    requiresApproval: true,
    supportsDryRun: true,
    timeoutMs: 5000,
    rateLimit: { requests: 30, windowSeconds: 60 },
    idempotent: true,
    handler: async (input, context) => {
      return {
        success: true,
        documentId: input.documentId,
        status: input.status || 'VERIFIED',
        verifiedAt: new Date().toISOString(),
      };
    },
  },
];
