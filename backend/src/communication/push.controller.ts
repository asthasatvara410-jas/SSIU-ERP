import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PushService, RegisterPushTokenDto } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Mobile Push Notifications')
@Controller('api/v1/push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get mobile app configuration & capabilities' })
  getAppConfig() {
    return this.pushService.getAppConfig();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register mobile Expo/FCM device push token' })
  registerToken(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
    const userId = req.user?.id || 'anonymous';
    return this.pushService.registerToken(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch test push notification to current user' })
  sendTest(@Req() req: any, @Body() body: { title: string; body: string; data?: any }) {
    const userId = req.user?.id || 'anonymous';
    return this.pushService.sendTestPushNotification(userId, body.title, body.body, body.data);
  }
}
