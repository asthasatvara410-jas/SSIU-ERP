import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, RequiredPermission } from './require-permission.decorator';
import { ROLE_KEY } from './require-role.decorator';
import { SCOPE_KEY, RequiredScopeConfig } from './require-scope.decorator';
import { RbacService } from './rbac.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredScope = this.reflector.getAllAndOverride<RequiredScopeConfig>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no security decorators are present, allow execution
    if (!requiredPermission && !requiredRoles && !requiredScope) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User context missing or unauthenticated. Access denied.');
    }

    // 1. Account Status Enforcement
    if (user.accountStatus && user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenException(`Access Denied: User account is currently ${user.accountStatus}.`);
    }

    const userRoles: string[] = user.roles || (user.role ? [user.role] : []);
    const isGlobalSuperAdmin = userRoles.some(r =>
      ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN'].includes(r.toUpperCase())
    );

    // 2. Role-Based Check (@RequireRole)
    if (requiredRoles && requiredRoles.length > 0 && !isGlobalSuperAdmin) {
      const hasMatchingRole = requiredRoles.some(reqRole =>
        userRoles.map(r => r.toUpperCase()).includes(reqRole.toUpperCase())
      );
      if (!hasMatchingRole) {
        throw new ForbiddenException(
          `Forbidden: Role requirement not met. Allowed roles: [${requiredRoles.join(', ')}], Current roles: [${userRoles.join(', ')}]`
        );
      }
    }

    // Extract potential resource metadata for permission and scope validation
    const resourceMeta = {
      instituteId: request.params?.instituteId || request.query?.instituteId || request.body?.instituteId,
      departmentId: request.params?.departmentId || request.query?.departmentId || request.body?.departmentId,
      studentId: request.params?.studentId || request.query?.studentId || request.body?.studentId || request.params?.id,
      facultyId: request.params?.facultyId || request.query?.facultyId || request.body?.facultyId,
      userId: request.params?.userId || request.query?.userId || request.body?.userId,
    };

    // 3. Permission Check (@RequirePermission)
    if (requiredPermission) {
      const authCheck = await this.rbacService.checkPermission(
        user.id,
        requiredPermission.module,
        requiredPermission.action,
        resourceMeta,
      );

      if (!authCheck.granted) {
        throw new ForbiddenException(`Forbidden: ${authCheck.reason || 'Access denied by RBAC Engine.'}`);
      }
    }

    // 4. Scope & Ownership Enforcement (@RequireScope)
    if (requiredScope && !isGlobalSuperAdmin) {
      const scopeType = requiredScope.scope;

      if (scopeType === 'OWN') {
        const ownerId = resourceMeta.studentId || resourceMeta.userId || resourceMeta.facultyId;
        const isSelfStudent = user.studentId && ownerId && (user.studentId === ownerId || user.id === ownerId || user.student?.enrollmentNo === ownerId);
        const isSelfFaculty = user.facultyId && ownerId && (user.facultyId === ownerId || user.id === ownerId || user.faculty?.employeeCode === ownerId);
        const isSelfUser = user.id === ownerId;

        if (!isSelfStudent && !isSelfFaculty && !isSelfUser) {
          throw new ForbiddenException('Access Denied: You are only authorized to access your OWN records.');
        }
      } else if (scopeType === 'DEPARTMENT') {
        const deptId = resourceMeta.departmentId;
        if (deptId && user.departmentId && deptId !== user.departmentId) {
          throw new ForbiddenException('Access Denied: You can only access records within your assigned department.');
        }
      } else if (scopeType === 'INSTITUTE') {
        const instId = resourceMeta.instituteId;
        if (instId && user.instituteId && instId !== user.instituteId) {
          throw new ForbiddenException('Access Denied: You can only access records within your assigned institute.');
        }
      }
    }

    return true;
  }
}
