/**
 * SSIU ERP — Staff & Faculty Governance Plugin Definition
 * File: src/modules/staff/index.ts
 */

import { Briefcase } from 'lucide-react';
import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { StaffGovernanceHubPage } from './pages/StaffGovernanceHubPage';

export const staffModuleManifest: ERPPluginManifest = {
  id: 'staff-hub',
  name: 'Staff & Faculty Hub',
  description: 'Workforce Allocation, Student-Faculty Ratios (SFR), Supervisory Trees & Research Portfolios',
  icon: Briefcase,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD'],
  category: 'Administration & Masters',
  component: StaffGovernanceHubPage,
};

// Self-register with central plugin registry
registerPlugin(staffModuleManifest);

export * from './types';
export * from './services/staffGovernanceService';
export * from './pages/StaffGovernanceHubPage';
