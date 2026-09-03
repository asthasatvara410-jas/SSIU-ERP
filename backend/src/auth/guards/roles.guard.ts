import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUserSession, ERPRoleCode } from '../supabase-session.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ERPRoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserSession;

    if (!user) {
      throw new ForbiddenException('Access denied: Unauthenticated user.');
    }

    // Super Admin has universal authorization bypass
    if (user.isSuperAdmin || user.roles.includes('SUPER_ADMIN') || user.roles.includes('UNIVERSITY_ADMIN')) {
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied: Required role(s) [${requiredRoles.join(', ')}]. Current roles: [${user.roles.join(', ')}].`
      );
    }

    return true;
  }
}
