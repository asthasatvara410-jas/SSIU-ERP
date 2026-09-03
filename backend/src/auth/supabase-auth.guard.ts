import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthService } from './supabase-auth.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => (target: any, key?: string, descriptor?: any) => {
  Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor ? descriptor.value : target);
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    const parsed = this.supabaseAuthService.parseBearerToken(authHeader);
    if (!parsed) {
      throw new UnauthorizedException('Invalid or malformed Bearer token.');
    }

    const { token, payload } = parsed;
    const authUserId = payload.sub || payload.id || payload.user_id;
    const email = payload.email || payload.user_metadata?.email || payload.preferred_username;

    if (!authUserId && !email) {
      throw new UnauthorizedException('Invalid token payload: missing user identifier.');
    }

    // Check expiration if exp field is present
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new UnauthorizedException('Token has expired. Please sign in again.');
    }

    const userSession = await this.supabaseAuthService.resolveSession({
      authUserId,
      email,
      jwtPayload: payload,
      token,
    });

    request.user = userSession;
    return true;
  }
}
