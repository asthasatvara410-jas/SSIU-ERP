import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUserSession } from '../supabase-session.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserSession;

    if (!user) {
      throw new ForbiddenException('Access denied: Unauthenticated user.');
    }

    // Super Admin has universal permission bypass
    if (user.isSuperAdmin || user.roles.includes('SUPER_ADMIN') || user.roles.includes('UNIVERSITY_ADMIN')) {
      return true;
    }

    const userPermissions = new Set(user.permissions || []);
    const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.has(perm));

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied: Missing required permission(s) [${requiredPermissions.join(', ')}].`
      );
    }

    return true;
  }
}
