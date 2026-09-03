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
import { ItHelpdeskService } from './it-helpdesk.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@ApiTags('Unified Helpdesk & Support Tickets')
@ApiBearerAuth()
@Controller('api/v1/it/tickets')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ItHelpdeskController {
  constructor(private readonly itService: ItHelpdeskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Unified Multi-Category Ticket' })
  createTicket(@Req() req: any, @Body() dto: CreateTicketDto) {
    return this.itService.createTicket(
      req.user.id,
      dto.category,
      dto.title,
      dto.description,
      dto.priority,
      dto.attachmentUrl,
      dto.departmentId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List Helpdesk Tickets with pagination, search and category filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTickets(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('my') my?: string,
    @Query() query?: any,
  ) {
    return this.itService.getTickets(req.user, category, status, my, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Ticket details with conversation thread & internal notes' })
  getTicketById(@Param('id') id: string, @Req() req: any) {
    return this.itService.getTicketById(id, req.user);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add message or internal note to ticket thread' })
  addComment(@Param('id') id: string, @Req() req: any, @Body() dto: CreateCommentDto) {
    return this.itService.addComment(id, req.user, dto.message, dto.messageType, dto.attachmentUrl);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get ticket message thread' })
  getComments(@Param('id') id: string, @Req() req: any) {
    return this.itService.getComments(id, req.user);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to staff member or technician' })
  assignTicket(@Param('id') id: string, @Req() req: any, @Body() dto: AssignTicketDto) {
    return this.itService.assignTechnician(id, req.user, dto.assignedToUserId, dto.remarks);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status across lifecycle' })
  updateStatus(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateTicketStatusDto) {
    return this.itService.updateTicketStatus(id, req.user, dto.status, dto.remarks, dto.resolution);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve ticket with resolution notes' })
  resolveTicket(@Param('id') id: string, @Req() req: any, @Body('resolution') resolution: string) {
    return this.itService.resolveTicket(id, req.user, resolution);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close ticket' })
  closeTicket(@Param('id') id: string, @Req() req: any, @Body('remarks') remarks?: string) {
    return this.itService.closeTicket(id, req.user, remarks);
  }

  @Patch(':id/reopen')
  @ApiOperation({ summary: 'Reopen resolved or closed ticket' })
  reopenTicket(@Param('id') id: string, @Req() req: any, @Body('remarks') remarks?: string) {
    return this.itService.reopenTicket(id, req.user, remarks);
  }
}
