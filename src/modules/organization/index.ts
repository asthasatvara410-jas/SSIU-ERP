/**
 * SSIU ERP — Organization Management Module Plugin
 * File: src/modules/organization/index.ts
 */

import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { CampusGovernancePage } from './pages/CampusGovernancePage';

export * from './types';
export * from './services/organizationGovernanceService';
export * from './pages/CampusGovernancePage';

export const OrganizationModuleManifest: ERPPluginManifest = {
  id: 'org-governance',
  name: 'Organization Governance',
  category: 'Administration & Masters',
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD'],
  component: CampusGovernancePage,
  version: '1.0.0',
  description: 'Multi-Campus Governance, Department Capacity & Accreditation Lifecycle',
};

// Self-register plugin into runtime registry
registerPlugin(OrganizationModuleManifest);
