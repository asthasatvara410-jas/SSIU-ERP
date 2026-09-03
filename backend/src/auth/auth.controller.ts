import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'auth:login', compositeWithBodyField: 'loginId' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.login(loginDto, meta);
  }

  @Post('admin-login')
  @RateLimit({ limit: 10, ttlSeconds: 60, keyPrefix: 'auth:admin-login', compositeWithBodyField: 'loginId' })
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: LoginDto, @Req() req: Request) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.adminLogin(loginDto, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Body() body: RefreshTokenDto) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.logout(req.user.id, body?.refreshToken, meta);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.changePassword(req.user.id, changePasswordDto, meta);
  }

  @Post('forgot-password')
  @RateLimit({ limit: 5, ttlSeconds: 60, keyPrefix: 'auth:forgot-password' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Req() req: Request) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.forgotPassword(forgotPasswordDto, meta);
  }

  @Post('reset-password')
  @RateLimit({ limit: 5, ttlSeconds: 60, keyPrefix: 'auth:reset-password' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req: Request) {
    const meta = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.resetPassword(resetPasswordDto, meta);
  }
}
