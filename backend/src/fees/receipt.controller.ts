import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReceiptService } from './receipt.service';
import { PaymentReceiptQueryDto } from './dto/receipts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { RequireScope } from '../rbac/require-scope.decorator';

@ApiTags('Payment Receipts & History')
@Controller('api/v1')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  /**
   * List and search payment receipts
   * GET /api/v1/payment-receipts
   */
  @Get('payment-receipts')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'List and filter payment receipts' })
  async getPaymentReceipts(@Query() query: PaymentReceiptQueryDto, @Req() req: any) {
    return this.receiptService.getPaymentReceipts(query, req.user);
  }

  /**
   * Get single payment receipt by ID
   * GET /api/v1/payment-receipts/:id
   */
  @Get('payment-receipts/:id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get payment receipt detail by ID' })
  async getPaymentReceiptById(@Param('id') id: string, @Req() req: any) {
    return this.receiptService.getPaymentReceiptById(id, req.user);
  }

  /**
   * Get receipt PDF payload
   * GET /api/v1/payment-receipts/:id/pdf
   */
  @Get('payment-receipts/:id/pdf')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Generate printable PDF HTML & base64 encoding for payment receipt' })
  async getPaymentReceiptPdf(@Param('id') id: string, @Req() req: any) {
    return this.receiptService.getPaymentReceiptPdf(id, req.user);
  }

  /**
   * Get or generate receipt by Transaction ID
   * GET /api/v1/payments/:id/receipt
   */
  @Get('payments/:id/receipt')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @ApiOperation({ summary: 'Get or generate official receipt for a successful payment transaction' })
  async getPaymentReceiptByTransactionId(@Param('id') transactionId: string, @Req() req: any) {
    return this.receiptService.getPaymentReceiptByTransactionId(transactionId, req.user);
  }

  /**
   * Logged-in Student Payment & Receipt History
   * GET /api/v1/students/me/payment-history
   */
  @Get('students/me/payment-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated student payment and receipt history' })
  async getMyPaymentHistory(@Req() req: any) {
    const studentId = req.user?.student?.id || req.user?.id;
    return this.receiptService.getStudentPaymentHistory(studentId, req.user);
  }

  /**
   * Get specific student payment history (with RBAC ownership guard)
   * GET /api/v1/students/:studentId/payment-history
   */
  @Get('students/:studentId/payment-history')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermission('FEES', 'VIEW')
  @RequireScope('OWN')
  @ApiOperation({ summary: 'Get payment history and receipts for a specific student' })
  async getStudentPaymentHistory(@Param('studentId') studentId: string, @Req() req: any) {
    return this.receiptService.getStudentPaymentHistory(studentId, req.user);
  }
}
