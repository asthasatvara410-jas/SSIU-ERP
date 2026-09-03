import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserSession } from '../supabase-session.types';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUserSession | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserSession;
    return data ? user?.[data] : user;
  },
);
