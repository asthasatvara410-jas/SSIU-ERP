import { SetMetadata } from '@nestjs/common';
import { ERPRoleCode } from '../supabase-session.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ERPRoleCode[]) => SetMetadata(ROLES_KEY, roles);
