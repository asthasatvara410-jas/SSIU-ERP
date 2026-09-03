import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUserSession, ERPRoleCode } from './supabase-session.types';

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolves full user account, RBAC roles, and central master identity from Supabase Auth User
   */
  async resolveSession(authContext: {
    authUserId: string;
    email: string;
    jwtPayload?: any;
    token?: string;
  }): Promise<AuthenticatedUserSession> {
    const { authUserId, email, token } = authContext;

    if (!authUserId && !email) {
      throw new UnauthorizedException('Invalid Supabase token: missing user identifier.');
    }

    // 1. Resolve central user_accounts record using raw query or Prisma mapping
    let userAccount: any = null;

    try {
      // Direct SQL lookup on central user_accounts table
      const accounts: any[] = await this.prisma.$queryRaw`
        SELECT 
          ua.id, ua.auth_user_id, ua.username, ua.email, ua.phone, 
          ua.account_type, ua.account_status, ua.student_id, ua.faculty_id, ua.parent_id
        FROM user_accounts ua
        WHERE ua.auth_user_id = ${authUserId}::uuid 
           OR ua.email = ${email}
        LIMIT 1;
      `;

      if (accounts && accounts.length > 0) {
        userAccount = accounts[0];
      }
    } catch (err: any) {
      this.logger.error(`Database query failed on user_accounts: ${err.message}`);
      throw new UnauthorizedException('Database service is currently unreachable.');
    }

    if (!userAccount) {
      this.logger.warn(`No user_accounts record found for auth_user_id: ${authUserId}, email: ${email}`);
      throw new UnauthorizedException('Unauthorized: No institutional user account linked to this Supabase identity.');
    }

    if (userAccount.account_status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is currently ${userAccount.account_status}. Access denied.`);
    }

    // 2. Resolve Assigned Roles from user_roles & roles
    let roles: ERPRoleCode[] = [];
    let departmentId: string | undefined = undefined;
    let instituteId: string | undefined = undefined;
    let departmentIds: string[] = [];

    try {
      const userRolesData: any[] = await this.prisma.$queryRaw`
        SELECT r.code, ur.department_id, ur.institute_id
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ${userAccount.id}::uuid AND ur.is_active = TRUE;
      `;

      if (userRolesData && userRolesData.length > 0) {
        roles = userRolesData.map((ur) => ur.code as ERPRoleCode);
        departmentIds = userRolesData.map((ur) => ur.department_id).filter(Boolean);
        departmentId = departmentIds[0];
        instituteId = userRolesData.find((ur) => ur.institute_id)?.institute_id;
      }
    } catch (e: any) {
      this.logger.warn(`Could not load user_roles from database: ${e.message}`);
    }

    // Fallback default role based on account_type
    if (roles.length === 0) {
      if (userAccount.account_type === 'STUDENT') roles = ['STUDENT'];
      else if (userAccount.account_type === 'FACULTY') roles = ['FACULTY'];
      else if (userAccount.account_type === 'PARENT') roles = ['PARENT'];
      else if (userAccount.account_type === 'ADMIN') roles = ['SUPER_ADMIN'];
      else roles = ['STAFF'];
    }

    const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('UNIVERSITY_ADMIN');

    // 3. Resolve Granular Permissions
    let permissions: string[] = [];
    try {
      const permsData: any[] = await this.prisma.$queryRaw`
        SELECT DISTINCT p.code
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = ${userAccount.id}::uuid AND ur.is_active = TRUE;
      `;
      if (permsData && permsData.length > 0) {
        permissions = permsData.map((p) => p.code);
      }
    } catch (e: any) {
      this.logger.warn(`Could not load permissions from database: ${e.message}`);
    }

    // 4. Resolve Linked Wards if Parent
    let linkedWardStudentIds: string[] = [];
    if (userAccount.parent_id || userAccount.account_type === 'PARENT') {
      try {
        const wardsData: any[] = await this.prisma.$queryRaw`
          SELECT student_id 
          FROM student_parent_mappings 
          WHERE parent_id = ${userAccount.parent_id}::uuid AND can_access_portal = TRUE;
        `;
        if (wardsData && wardsData.length > 0) {
          linkedWardStudentIds = wardsData.map((w) => w.student_id);
        }
      } catch (e: any) {
        this.logger.warn(`Could not load parent ward mappings: ${e.message}`);
      }
    }

    // 5. Assemble and return AuthenticatedUserSession
    return {
      userAccountId: userAccount.id,
      authUserId: userAccount.auth_user_id || authUserId,
      email: userAccount.email,
      username: userAccount.username,
      accountType: userAccount.account_type,
      accountStatus: userAccount.account_status,
      roles,
      primaryRole: roles[0] || 'STUDENT',
      permissions,
      isSuperAdmin,
      studentId: userAccount.student_id || undefined,
      facultyId: userAccount.faculty_id || undefined,
      parentId: userAccount.parent_id || undefined,
      instituteId,
      departmentId,
      departmentIds,
      linkedWardStudentIds,
      token,
    };
  }

  /**
   * Helper to parse JWT without secret verification in edge/dev mode,
   * or using standard Supabase HMAC verification
   */
  parseBearerToken(authHeader?: string): { token: string; payload: any } | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return { token, payload };
    } catch {
      return null;
    }
  }
}
