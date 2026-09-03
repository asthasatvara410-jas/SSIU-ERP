import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  erpId: string;
  username: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'ssiu_erp_jwt_super_secret_key_2026',
    });
  }

  async validate(payload: JwtPayload) {
    let user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: { role: true },
        },
        student: {
          select: {
            id: true,
            enrollmentNo: true,
            firstName: true,
            lastName: true,
            email: true,
            instituteId: true,
            departmentId: true,
          },
        },
        faculty: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            instituteId: true,
            departmentId: true,
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: payload.sub },
            { erpId: payload.erpId || payload.sub },
            { username: payload.username || payload.sub },
          ],
        },
        include: {
          userRoles: {
            include: { role: true },
          },
          student: {
            select: {
              id: true,
              enrollmentNo: true,
              firstName: true,
              lastName: true,
              email: true,
              instituteId: true,
              departmentId: true,
            },
          },
          faculty: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              designation: true,
              instituteId: true,
              departmentId: true,
            },
          },
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User account no longer exists or credentials invalid.');
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is currently ${user.accountStatus}. Login denied.`);
    }

    const primaryRole = user.userRoles[0]?.role;
    const roleCodes = user.userRoles.map((ur) => ur.role?.code).filter(Boolean);
    if (primaryRole?.code && !roleCodes.includes(primaryRole.code)) {
      roleCodes.push(primaryRole.code);
    }

    const firstName = user.faculty?.firstName || user.student?.firstName;
    const lastName = user.faculty?.lastName || user.student?.lastName;
    const email = user.faculty?.email || user.student?.email;
    const departmentId = user.faculty?.departmentId || user.student?.departmentId;
    const instituteId = user.faculty?.instituteId || user.student?.instituteId;

    return {
      id: user.id,
      erpId: user.erpId,
      username: user.username,
      email,
      firstName,
      lastName,
      accountStatus: user.accountStatus,
      role: primaryRole?.code || 'USER',
      roles: roleCodes.length > 0 ? roleCodes : ['USER'],
      authorityLevel: primaryRole?.authorityLevel || 10,
      departmentId,
      instituteId,
      studentId: user.student?.id,
      facultyId: user.faculty?.id,
      userRoles: user.userRoles,
      student: user.student,
      faculty: user.faculty,
    };
  }
}
