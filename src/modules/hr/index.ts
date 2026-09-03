/**
 * SSIU ERP — HR Management Hub Plugin Entry Point
 * File: src/modules/hr/index.ts
 */

import { Briefcase } from 'lucide-react';
import { ERPPluginManifest, registerPlugin } from '../moduleRegistry';
import { HRGovernanceHubPage } from './pages/HRGovernanceHubPage';

export const hrModuleManifest: ERPPluginManifest = {
  id: 'hr-hub',
  name: 'HR Management Hub',
  description: 'Workforce Allocation, Leave Utilization Heatmaps & Payroll-Readiness Audits',
  icon: Briefcase,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD'],
  category: 'Administration & Masters',
  component: HRGovernanceHubPage,
};

// Auto-register plugin into central registry
registerPlugin(hrModuleManifest);

export * from './types';
export * from './services/hrGovernanceService';
export { HRGovernanceHubPage };
