/**
 * SSIU ERP — Roles & Permissions / RBAC Module Plugin
 * File: src/modules/permissions/index.ts
 */

import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { RoleMatrixConfigPage } from './pages/RoleMatrixConfigPage';

export * from './types';
export * from './services/rbacMatrixGovernanceService';
export * from './pages/RoleMatrixConfigPage';

export const PermissionsModuleManifest: ERPPluginManifest = {
  id: 'rbac-matrix',
  name: 'Roles & Permissions / RBAC',
  category: 'Administration & Masters',
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'],
  component: RoleMatrixConfigPage,
  version: '1.0.0',
  description: 'Role Matrix Configuration, Granular Module Actions & Custom Scopes',
};

// Self-register plugin into runtime registry
registerPlugin(PermissionsModuleManifest);
