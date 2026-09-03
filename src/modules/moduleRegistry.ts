/**
 * SSIU ERP — Central Modular Plugin Registry
 * File: src/modules/moduleRegistry.ts
 *
 * Provides a thin, decoupled integration contract for mounting new ERP plugins
 * into the main application shell without modifying existing business modules.
 */

import React from 'react';
import { UserRole } from '../types';

export interface ERPPluginManifest {
  id: string;
  name: string;
  category: 'Administration & Masters' | 'Academic & LMS' | 'Campus Logistics' | 'Support & Helpdesk';
  allowedRoles: UserRole[];
  component: React.ComponentType;
  icon?: any;
  badge?: string;
  version?: string;
  description?: string;
}

export const REGISTERED_PLUGINS: Record<string, ERPPluginManifest> = {};

/**
 * Register a self-contained module into the ERP application runtime
 */
export function registerPlugin(plugin: ERPPluginManifest): void {
  REGISTERED_PLUGINS[plugin.id] = plugin;
}

/**
 * Retrieve a registered plugin by route/tab identifier
 */
export function getPlugin(pluginId: string): ERPPluginManifest | undefined {
  return REGISTERED_PLUGINS[pluginId];
}

/**
 * List all registered plugins accessible by a specific user role
 */
export function getPluginsForRole(role?: UserRole | null): ERPPluginManifest[] {
  if (!role) return [];
  return Object.values(REGISTERED_PLUGINS).filter(p => 
    p.allowedRoles.includes(role) || p.allowedRoles.includes('SUPER_ADMIN' as UserRole)
  );
}
