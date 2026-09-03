import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'rbac_roles';

/**
 * Decorator to enforce required roles on routes and controllers.
 * Example: @RequireRole('FACULTY', 'HOD', 'PRINCIPAL')
 */
export const RequireRole = (...roles: string[]) => SetMetadata(ROLE_KEY, roles);
