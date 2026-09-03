import { SetMetadata } from '@nestjs/common';

export const SCOPE_KEY = 'rbac_scope';

export type RequiredScopeType = 'OWN' | 'DEPARTMENT' | 'INSTITUTE' | 'UNIVERSITY';

export interface RequiredScopeConfig {
  scope: RequiredScopeType;
  ownerField?: string;
  departmentField?: string;
  instituteField?: string;
}

/**
 * Decorator to enforce boundary scope on routes and controllers.
 * Example: @RequireScope('DEPARTMENT') or @RequireScope({ scope: 'OWN', ownerField: 'studentId' })
 */
export const RequireScope = (config: RequiredScopeType | RequiredScopeConfig) => {
  const scopeConfig: RequiredScopeConfig = typeof config === 'string' ? { scope: config } : config;
  return SetMetadata(SCOPE_KEY, scopeConfig);
};
