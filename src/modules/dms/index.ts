import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { DMSGovernanceHubPage } from './pages/DMSGovernanceHubPage';

export const dmsPluginManifest: ERPPluginManifest = {
  id: 'dms-hub',
  name: 'Document Management (DMS & OCR)',
  description: 'Student document compliance repository, automated OCR field extraction, and master database cross-validation.',
  version: '1.0.0',
  category: 'Academic & LMS',
  component: DMSGovernanceHubPage,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD', 'FACULTY']
};

registerPlugin(dmsPluginManifest);

export * from './types';
export * from './services/dmsOcrVerificationService';
export * from './pages/DMSGovernanceHubPage';
