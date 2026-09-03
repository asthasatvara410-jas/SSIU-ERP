/**
 * SSIU ERP — Database Architecture & Health Monitor Module Plugin
 * File: src/modules/database/index.ts
 */

import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { DatabaseHealthMonitorPage } from './pages/DatabaseHealthMonitorPage';

export * from './types';
export * from './services/databaseHealthMonitorService';
export * from './pages/DatabaseHealthMonitorPage';

export const DatabaseHealthModuleManifest: ERPPluginManifest = {
  id: 'db-health',
  name: 'Database Architecture & Health',
  category: 'Administration & Masters',
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN'],
  component: DatabaseHealthMonitorPage,
  version: '1.0.0',
  description: 'Database Engine Health, Connection Pool Monitoring & Prisma Schema Inspector',
};

// Self-register plugin into runtime registry
registerPlugin(DatabaseHealthModuleManifest);
