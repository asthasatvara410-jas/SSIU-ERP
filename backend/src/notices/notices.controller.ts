import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@ApiTags('Notice Board & Targeted Announcements')
@ApiBearerAuth()
@Controller('api/v1/notices')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publish or Schedule Official Notice' })
  createNotice(@Req() req: any, @Body() dto: CreateNoticeDto) {
    return this.noticesService.createNotice(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get Notices filtered by targeted audience, category and status' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getNotices(@Req() req: any, @Query() query: any) {
    return this.noticesService.getNotices(req.user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Notice details by ID with audience authorization' })
  getNoticeById(@Param('id') id: string, @Req() req: any) {
    return this.noticesService.getNoticeById(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Notice' })
  updateNotice(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateNoticeDto) {
    return this.noticesService.updateNotice(id, req.user, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish Draft Notice' })
  publishNotice(@Param('id') id: string, @Req() req: any) {
    return this.noticesService.publishNotice(id, req.user);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive Notice' })
  archiveNotice(@Param('id') id: string, @Req() req: any) {
    return this.noticesService.archiveNotice(id, req.user);
  }
}
