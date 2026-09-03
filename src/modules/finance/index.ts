/**
 * SSIU ERP — Institutional Finance Hub Plugin Entry Point
 * File: src/modules/finance/index.ts
 */

import { Landmark } from 'lucide-react';
import { ERPPluginManifest, registerPlugin } from '../moduleRegistry';
import { FinanceGovernanceHubPage } from './pages/FinanceGovernanceHubPage';

export const financeModuleManifest: ERPPluginManifest = {
  id: 'finance-hub',
  name: 'Institutional Finance Hub',
  description: 'Annual Budget vs. Actual Variance, Department Cost Centers & Fee Revenue Reconciliation',
  icon: Landmark,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'ACCOUNTS_ADMIN', 'PRINCIPAL', 'HOD'],
  category: 'Administration & Masters',
  component: FinanceGovernanceHubPage,
};

// Auto-register plugin into central registry
registerPlugin(financeModuleManifest);

export * from './types';
export * from './services/financeGovernanceService';
export { FinanceGovernanceHubPage };
