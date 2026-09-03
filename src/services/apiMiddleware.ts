import { ApiResponse, successResponse, errorResponse, UnauthorizedError, ForbiddenError, ValidationError } from './apiResponse';
import { logger } from './logger';
import { User, UserRole } from '../types';
import { inputSanitizer } from './inputSanitizer';

export interface ApiRequestContext<TBody = any, TQuery = any> {
  user: User | null;
  role: UserRole | null;
  body?: TBody;
  query?: TQuery;
  params?: Record<string, string>;
  path?: string;
}

export interface ApiSecurityPolicy {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  requirePermission?: {
    module: string;
    action: string;
  };
  requireScope?: {
    own?: boolean;
    institute?: boolean;
    department?: boolean;
    resourceOwnerId?: string;
  };
}

export type PayloadValidator<T> = (data: any) => { valid: boolean; errors?: { field: string; message: string }[]; value?: T };

/**
 * Standard API Dispatcher Pipeline executing:
 * Request -> Auth (401) -> Status (403) -> Role & Scope (403) -> Permission Overrides (403) -> Validation (422) -> Service -> Response
 */
export async function executeApiPipeline<TReq = any, TRes = any>(
  context: ApiRequestContext<TReq>,
  policy: ApiSecurityPolicy,
  validator: PayloadValidator<TReq> | null,
  handler: (validatedPayload: TReq, ctx: ApiRequestContext<TReq>) => Promise<TRes> | TRes
): Promise<ApiResponse<TRes>> {
  const { user, role, body, path } = context;

  try {
    // 1. Authentication Check (401)
    if (policy.requireAuth !== false && !user) {
      throw new UnauthorizedError('Authentication required to access this endpoint.');
    }

    // 2. Account Status Check (403)
    if (user && user.accountStatus && user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenError(`Access Denied: Account is currently ${user.accountStatus}.`);
    }

    const isGlobalSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'UNIVERSITY_ADMIN' || user?.role === 'VICE_PRESIDENT' || user?.role === 'REGISTRAR';

    // 3. Role-Based Check (403)
    if (policy.allowedRoles && policy.allowedRoles.length > 0 && !isGlobalSuperAdmin) {
      if (!role || !policy.allowedRoles.includes(role)) {
        throw new ForbiddenError(`Access Denied: Role "${role || 'ANONYMOUS'}" is not authorized for this operation.`);
      }
    }

    // 4. Custom Permission & Overrides Check (403)
    if (policy.requirePermission && user && !isGlobalSuperAdmin) {
      const { module, action } = policy.requirePermission;
      const userCustomPerms = user.customPermissions || {};
      const override = userCustomPerms[module]?.[action];

      if (override === false) {
        throw new ForbiddenError(`Access Denied: Explicit DENY override on permission ${module}.${action}.`);
      }
    }

    // 5. Scope & Resource Ownership Isolation Check (403)
    if (policy.requireScope && !isGlobalSuperAdmin) {
      if (policy.requireScope.own) {
        const targetOwnerId = policy.requireScope.resourceOwnerId || context.params?.studentId || context.params?.id || context.query?.studentId;
        if (targetOwnerId && user) {
          const isOwnStudent = user.studentId === targetOwnerId || user.id === targetOwnerId || user.username === targetOwnerId;
          const isOwnEmployee = user.employeeId === targetOwnerId || user.id === targetOwnerId;
          if (!isOwnStudent && !isOwnEmployee && user.id !== targetOwnerId) {
            throw new ForbiddenError('Access Denied: You are only authorized to access your OWN data records.');
          }
        }
      }

      if (policy.requireScope.institute && (role === 'PRINCIPAL' || (role as string) === 'HOI') && !user?.instituteId) {
        throw new ForbiddenError('Access Denied: Missing authorized institute scope on session.');
      }

      if (policy.requireScope.department && role === 'HOD' && !user?.departmentId) {
        throw new ForbiddenError('Access Denied: Missing authorized department scope on session.');
      }
    }

    // 6. Request Payload Validation & Mass Assignment Guard (422)
    let validatedData = body as TReq;
    if (validator && body !== undefined) {
      const validation = validator(body);
      if (!validation.valid) {
        throw new ValidationError(
          'Request payload validation failed.',
          validation.errors?.map(e => ({ field: e.field, message: e.message }))
        );
      }
      if (validation.value !== undefined) {
        validatedData = validation.value;
      }
    }

    // 7. Execute Service / Handler
    const result = await handler(validatedData, context);

    // 8. Return Standard Envelope (200)
    return successResponse(result);
  } catch (err: unknown) {
    logger.error(`API Pipeline Error [${path || 'Endpoint'}]`, 'ApiMiddleware', err instanceof Error ? err : undefined, { user: user?.name, role });
    return errorResponse(err, path);
  }
}
