import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GovernmentIntegrationService } from './government-integration.service';
import {
  LinkABCDto,
  ConnectDigiLockerDto,
  PublishCredentialDto,
} from './dto/government-integration.dto';

@Controller('api/v1/government')
export class GovernmentIntegrationController {
  constructor(private readonly govService: GovernmentIntegrationService) {}

  // Admin Diagnostics
  @Get('integrations/dashboard')
  @UseGuards(JwtAuthGuard)
  async getAdminDashboard(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const data = await this.govService.getAdminDashboard(tenantId);
    return {
      success: true,
      data,
      correlationId: `gov-dash-${Date.now()}`,
    };
  }

  // Student ABC Endpoints
  @Get('abc')
  @UseGuards(JwtAuthGuard)
  async getABCProfile(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.getABCProfile(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `abc-prof-${Date.now()}`,
    };
  }

  @Post('abc/link')
  @UseGuards(JwtAuthGuard)
  async linkABCId(@Req() req: any, @Body() dto: LinkABCDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.linkABCId(studentId, dto.abcId, tenantId);
    return {
      success: true,
      data,
      correlationId: `abc-lnk-${Date.now()}`,
    };
  }

  @Post('abc/verify')
  @UseGuards(JwtAuthGuard)
  async verifyABCId(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.verifyABCId(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `abc-vrf-${Date.now()}`,
    };
  }

  @Post('abc/sync')
  @UseGuards(JwtAuthGuard)
  async syncCredits(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.syncCredits(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `abc-syn-${Date.now()}`,
    };
  }

  @Get('abc/sync-history')
  @UseGuards(JwtAuthGuard)
  async getSyncHistory(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.getSyncHistory(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `abc-hst-${Date.now()}`,
    };
  }

  // Student DigiLocker Endpoints
  @Get('digilocker')
  @UseGuards(JwtAuthGuard)
  async getDigiLockerProfile(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.getDigiLockerProfile(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `dl-prof-${Date.now()}`,
    };
  }

  @Post('digilocker/connect')
  @UseGuards(JwtAuthGuard)
  async connectDigiLocker(@Req() req: any, @Body() dto: ConnectDigiLockerDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.connectDigiLocker(studentId, dto.providerUserReference, tenantId);
    return {
      success: true,
      data,
      correlationId: `dl-con-${Date.now()}`,
    };
  }

  @Post('digilocker/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeDigiLocker(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.revokeDigiLocker(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `dl-rev-${Date.now()}`,
    };
  }

  // Credentials
  @Get('credentials')
  @UseGuards(JwtAuthGuard)
  async listCredentials(@Req() req: any) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.listCredentials(studentId, tenantId);
    return {
      success: true,
      data,
      correlationId: `crd-lst-${Date.now()}`,
    };
  }

  @Post('credentials/publish')
  @UseGuards(JwtAuthGuard)
  async publishCredential(@Req() req: any, @Body() dto: PublishCredentialDto) {
    const tenantId = req.user?.instituteId || req.user?.tenantId || 'DEFAULT';
    const studentId = req.user?.studentId || req.user?.id || 'stu-self';
    const data = await this.govService.publishCredential(studentId, dto, tenantId);
    return {
      success: true,
      data,
      correlationId: `crd-pub-${Date.now()}`,
    };
  }
}
