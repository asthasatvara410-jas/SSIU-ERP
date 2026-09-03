/**
 * SSIU ERP — Fee Operations Hub Plugin Entry Point
 * File: src/modules/fees/index.ts
 */

import { IndianRupee } from 'lucide-react';
import { ERPPluginManifest, registerPlugin } from '../moduleRegistry';
import { FeeGovernanceHubPage } from './pages/FeeGovernanceHubPage';

export const feesModuleManifest: ERPPluginManifest = {
  id: 'fees-hub',
  name: 'Fee Operations Hub',
  description: 'Demand vs. Realization Velocity, Overdue Aging Brackets & Scholarship Aid',
  icon: IndianRupee,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'ACCOUNTS_ADMIN', 'PRINCIPAL', 'HOD'],
  category: 'Administration & Masters',
  component: FeeGovernanceHubPage,
};

// Auto-register plugin into central registry
registerPlugin(feesModuleManifest);

export * from './types';
export * from './services/feeGovernanceService';
export { FeeGovernanceHubPage };
